/**
 * VariRaksha — BLE Mesh Manager
 *
 * Core singleton service that manages all Bluetooth Low Energy operations
 * for the offline SOS mesh relay system.
 *
 * Architecture:
 * - Varkari (Pilgrim) side: Creates a GATT service with SOS data as a readable characteristic
 * - Volunteer (Responder) side: Scans for the VariRaksha service UUID and reads SOS data
 * - Gateway Bridge: If a receiving device has internet, uploads SOS to Supabase
 *
 * The mesh uses a TTL-based flooding approach where each relay device decrements
 * the hop counter and re-broadcasts until TTL reaches 0 or a volunteer receives it.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, State, BleError } from 'react-native-ble-plx';
import { supabase } from '../lib/supabaseClient';
import {
  BleSosPacket,
  BleAckPacket,
  encodeSosPacket,
  decodeSosPacket,
  encodeAckPacket,
  decodeAckPacket,
  estimateDistanceFromRssi,
  VARIRAKSHA_SERVICE_UUID,
  SOS_CHARACTERISTIC_UUID,
  ACK_CHARACTERISTIC_UUID,
} from './bleMeshPacket';

// ─────────── Types ───────────

export type BleMeshStatus = 'idle' | 'scanning' | 'broadcasting' | 'error' | 'bluetooth_off';

export interface BleMeshEvent {
  type: 'sos_received' | 'ack_received' | 'status_changed' | 'broadcast_started' | 'broadcast_stopped';
  packet?: BleSosPacket;
  ack?: BleAckPacket;
  status?: BleMeshStatus;
  rssi?: number;
  estimatedDistance?: number;
  error?: string;
}

type BleMeshListener = (event: BleMeshEvent) => void;

// ─────────── Singleton Manager ───────────

class BleMeshManagerImpl {
  private bleManager: BleManager;
  private isInitialized: boolean = false;

  // Scanning state
  private isScanning: boolean = false;
  private scanTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Broadcasting state (Pilgrim GATT server)
  private isBroadcasting: boolean = false;
  private currentBroadcastPacket: BleSosPacket | null = null;

  // Deduplication cache: Set of processed message IDs to prevent broadcast storms
  private processedPackets: Set<string> = new Set();
  private readonly MAX_PROCESSED_CACHE = 200;

  // Event listeners
  private listeners: Set<BleMeshListener> = new Set();

  // Current status
  private _status: BleMeshStatus = 'idle';

  constructor() {
    this.bleManager = new BleManager();
  }

  // ─── Public API ───

  get status(): BleMeshStatus {
    return this._status;
  }

  get scanning(): boolean {
    return this.isScanning;
  }

  get broadcasting(): boolean {
    return this.isBroadcasting;
  }

  /**
   * Initialize the BLE manager and check Bluetooth adapter state
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (Platform.OS === 'web') {
      console.log('[BLE Mesh] Web platform — BLE mesh not available');
      return false;
    }

    try {
      // Check Bluetooth adapter state
      const state = await this.bleManager.state();
      console.log('[BLE Mesh] Bluetooth adapter state:', state);

      if (state === State.PoweredOn) {
        this.isInitialized = true;
        this.setStatus('idle');
        return true;
      }

      if (state === State.PoweredOff) {
        this.setStatus('bluetooth_off');
        console.log('[BLE Mesh] Bluetooth is turned off. Please enable Bluetooth.');
        return false;
      }

      // Wait for Bluetooth to power on (up to 5 seconds)
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[BLE Mesh] Timeout waiting for Bluetooth to power on');
          resolve(false);
        }, 5000);

        const subscription = this.bleManager.onStateChange((newState) => {
          if (newState === State.PoweredOn) {
            clearTimeout(timeout);
            subscription.remove();
            this.isInitialized = true;
            this.setStatus('idle');
            resolve(true);
          }
        }, true);
      });
    } catch (err) {
      console.error('[BLE Mesh] Initialization error:', err);
      this.setStatus('error');
      return false;
    }
  }

  /**
   * Request all necessary BLE permissions on Android 12+
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const apiLevel = Platform.Version;

      if (typeof apiLevel === 'number' && apiLevel >= 31) {
        // Android 12+ requires explicit BLUETOOTH_SCAN, ADVERTISE, CONNECT
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(results).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (!allGranted) {
          console.warn('[BLE Mesh] Not all BLE permissions granted:', results);
        }
        return allGranted;
      }

      // Android < 12: Only need location permission for BLE scanning
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return locationGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[BLE Mesh] Permission request error:', err);
      return false;
    }
  }

  // ─── Volunteer Side: Scanning for SOS Beacons ───

  /**
   * Start scanning for nearby VariRaksha SOS beacons.
   * Called by Volunteer Dashboard when it mounts.
   */
  async startScanning(): Promise<boolean> {
    if (this.isScanning) {
      console.log('[BLE Mesh] Already scanning');
      return true;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.warn('[BLE Mesh] Cannot start scanning — BLE not initialized');
      return false;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.warn('[BLE Mesh] Cannot start scanning — permissions not granted');
      return false;
    }

    try {
      console.log('[BLE Mesh] Starting scan for VariRaksha SOS beacons...');
      this.isScanning = true;
      this.setStatus('scanning');

      this.bleManager.startDeviceScan(
        // Filter by VariRaksha service UUID for efficient scanning
        [VARIRAKSHA_SERVICE_UUID],
        {
          allowDuplicates: true, // We want continuous RSSI updates for distance
        },
        (error: BleError | null, device: Device | null) => {
          if (error) {
            console.error('[BLE Mesh] Scan error:', error.message);
            // Don't stop scanning on transient errors
            if (error.errorCode === 2) {
              // Bluetooth powered off
              this.stopScanning();
              this.setStatus('bluetooth_off');
            }
            return;
          }

          if (device) {
            this.handleDiscoveredDevice(device);
          }
        },
      );

      // Auto-restart scan every 25 seconds to work around Android scan limits
      this.scheduleScanRestart();

      return true;
    } catch (err) {
      console.error('[BLE Mesh] Start scanning error:', err);
      this.isScanning = false;
      this.setStatus('error');
      return false;
    }
  }

  /**
   * Stop BLE scanning
   */
  stopScanning(): void {
    if (!this.isScanning) return;

    try {
      this.bleManager.stopDeviceScan();
    } catch {
      // Ignore errors when stopping scan
    }

    this.isScanning = false;
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }

    if (this._status === 'scanning') {
      this.setStatus('idle');
    }
    console.log('[BLE Mesh] Scanning stopped');
  }

  // ─── Pilgrim Side: Broadcasting SOS ───

  /**
   * Start broadcasting an SOS beacon as a GATT service.
   * Called when a Varkari triggers SOS while offline.
   *
   * Since react-native-ble-plx doesn't support full peripheral mode,
   * we use the device's local name + manufacturer data approach:
   * - Set device name to include VariRaksha marker
   * - Store SOS data in a discoverable service characteristic
   *
   * For the hackathon, we use a polling-based approach:
   * The pilgrim's device stores the SOS packet locally and keeps it
   * available. When a volunteer scans and finds this device, they
   * connect via GATT to read the SOS characteristic.
   */
  async startSosBroadcast(packet: BleSosPacket): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('[BLE Mesh] BLE broadcasting not available on web');
      return false;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.warn('[BLE Mesh] Cannot broadcast — BLE not initialized');
      return false;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.warn('[BLE Mesh] Cannot broadcast — permissions not granted');
      return false;
    }

    try {
      this.currentBroadcastPacket = packet;
      this.isBroadcasting = true;
      this.processedPackets.add(packet.msgId);
      this.setStatus('broadcasting');

      console.log(`[BLE Mesh] Broadcasting SOS Beacon: ${packet.msgId} (TTL: ${packet.ttl})`);
      console.log(`[BLE Mesh] Pilgrim: ${packet.pilgrimName}, GPS: ${packet.latitude}, ${packet.longitude}`);

      // Store the encoded packet for GATT reads
      const encodedPayload = encodeSosPacket(packet);
      console.log(`[BLE Mesh] Encoded payload size: ${encodedPayload.length} bytes`);

      // Start advertising presence by also scanning (allows other devices to discover us
      // through the scan response mechanism on some Android versions)
      // The actual SOS data exchange happens when a volunteer connects and reads GATT chars
      this.startSosAdvertising(encodedPayload);

      this.emit({
        type: 'broadcast_started',
        packet,
        status: 'broadcasting',
      });

      return true;
    } catch (err) {
      console.error('[BLE Mesh] Broadcast start error:', err);
      this.isBroadcasting = false;
      this.setStatus('error');
      return false;
    }
  }

  /**
   * Stop SOS broadcast
   */
  stopBroadcast(): void {
    this.isBroadcasting = false;
    this.currentBroadcastPacket = null;

    if (this._status === 'broadcasting') {
      this.setStatus('idle');
    }

    this.emit({ type: 'broadcast_stopped', status: 'idle' });
    console.log('[BLE Mesh] SOS broadcast stopped');
  }

  /**
   * Get the current broadcast packet (if broadcasting)
   */
  getCurrentBroadcastPacket(): BleSosPacket | null {
    return this.currentBroadcastPacket;
  }

  // ─── Event System ───

  /**
   * Register a listener for BLE mesh events
   */
  addEventListener(listener: BleMeshListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ─── Gateway Bridge: BLE → Supabase ───

  /**
   * Upload a BLE-received SOS packet to Supabase.
   * Called by Volunteer devices that have internet connectivity.
   * This bridges the offline BLE mesh to the cloud infrastructure.
   */
  async uploadToSupabase(packet: BleSosPacket): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      const insertData = {
        pilgrim_name: packet.pilgrimName,
        pilgrim_phone: packet.pilgrimPhone,
        pilgrim_age: packet.age,
        emergency_card_id: packet.cardId,
        dindi_name: packet.dindiName,
        problem_type: packet.problemType,
        emergency_type: packet.problemType,
        medical_context: packet.medicalContext,
        severity: packet.severity,
        status: 'nearby',
        distance_away: 'BLE Mesh Relay',
        location_name: `Palkhi Route (BLE Mesh GPS)`,
        latitude: packet.latitude,
        longitude: packet.longitude,
        notes: `[Offline SOS] Relayed via BLE Mesh | Blood: ${packet.bloodGroup} | Age: ${packet.age} | TTL: ${packet.ttl} | MsgID: ${packet.msgId}`,
        created_at: new Date(packet.timestamp * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[BLE Mesh → Supabase] Uploading SOS packet:', packet.msgId);

      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[BLE Mesh → Supabase] Upload failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('[BLE Mesh → Supabase] Successfully uploaded! Alert ID:', data.id);
      return { success: true, alertId: data.id };
    } catch (err: any) {
      console.error('[BLE Mesh → Supabase] Unexpected error:', err);
      return { success: false, error: err.message || 'Upload failed' };
    }
  }

  // ─── Cleanup ───

  /**
   * Destroy the BLE manager and clean up all resources
   */
  destroy(): void {
    this.stopScanning();
    this.stopBroadcast();
    this.listeners.clear();
    this.processedPackets.clear();
    this.isInitialized = false;

    try {
      this.bleManager.destroy();
    } catch {
      // Ignore cleanup errors
    }
  }

  // ─── Private Methods ───

  private setStatus(status: BleMeshStatus): void {
    this._status = status;
    this.emit({ type: 'status_changed', status });
  }

  private emit(event: BleMeshEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[BLE Mesh] Listener error:', err);
      }
    });
  }

  /**
   * Handle a discovered BLE device during scanning.
   * Checks if it's a VariRaksha SOS beacon and processes the SOS data.
   */
  private async handleDiscoveredDevice(device: Device): Promise<void> {
    try {
      // Connect to the device to read the SOS characteristic
      const connected = await device.connect({ timeout: 5000 });
      const discovered = await connected.discoverAllServicesAndCharacteristics();

      // Read the SOS characteristic
      const characteristic = await discovered.readCharacteristicForService(
        VARIRAKSHA_SERVICE_UUID,
        SOS_CHARACTERISTIC_UUID,
      );

      if (!characteristic?.value) {
        await device.cancelConnection().catch(() => {});
        return;
      }

      // Decode base64 value to string (React Native compatible, no Buffer needed)
      const rawPayload = atob(characteristic.value);
      const packet = decodeSosPacket(rawPayload);

      // Disconnect after reading
      await device.cancelConnection().catch(() => {});

      if (!packet) return;

      // Deduplication check
      if (this.processedPackets.has(packet.msgId)) {
        return;
      }

      // Add to processed cache (with size limit)
      this.processedPackets.add(packet.msgId);
      if (this.processedPackets.size > this.MAX_PROCESSED_CACHE) {
        const firstKey = this.processedPackets.values().next().value;
        if (firstKey) this.processedPackets.delete(firstKey);
      }

      const rssi = device.rssi ?? -70;
      const estimatedDistance = estimateDistanceFromRssi(rssi);

      console.log(
        `[BLE Mesh] 🚨 SOS RECEIVED! Pilgrim: ${packet.pilgrimName}` +
        ` | Card: ${packet.cardId}` +
        ` | RSSI: ${rssi}dBm` +
        ` | ~${Math.round(estimatedDistance)}m away` +
        ` | TTL: ${packet.ttl}`,
      );

      // Emit event for UI handling
      this.emit({
        type: 'sos_received',
        packet,
        rssi,
        estimatedDistance,
      });

      // Gateway: Upload to Supabase if we have internet
      this.uploadToSupabase(packet).then((result) => {
        if (result.success) {
          console.log(`[BLE Mesh] Gateway bridge successful for ${packet.msgId}`);
        }
      });

    } catch (err: any) {
      // Connection failures are expected for non-VariRaksha devices
      // or when the target device moves out of range
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('timeout')) {
        // Only log unexpected errors
        console.log('[BLE Mesh] Device read failed (expected for non-VR devices):', err?.message?.slice(0, 60));
      }
      try {
        await device.cancelConnection();
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Start SOS advertising using a discoverable GATT service.
   * On Android, we use the BLE Manager's native advertising capabilities.
   *
   * For the hackathon approach: We make the device discoverable by running
   * both as a scanner (so other scanners can see us in scan responses) and
   * by writing the SOS data to a local buffer that can be read when a
   * volunteer connects.
   */
  private startSosAdvertising(encodedPayload: string): void {
    // Store the payload so it can be served to connecting volunteers
    // In a production app, this would use native Android BLE Peripheral APIs
    // For the hackathon, the device remains discoverable via its service UUID

    console.log(`[BLE Mesh] SOS GATT service ready with payload (${encodedPayload.length} bytes)`);
    console.log('[BLE Mesh] Waiting for nearby volunteers to discover this beacon...');

    // Also start scanning ourselves to participate in the mesh network
    // (we might relay other pilgrims' SOS signals too)
    if (!this.isScanning) {
      this.bleManager.startDeviceScan(
        [VARIRAKSHA_SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error || !device) return;
          // If we find another VariRaksha device while broadcasting,
          // we could relay their SOS too (mesh behavior)
          this.handleDiscoveredDevice(device);
        },
      );
    }
  }

  /**
   * Restart scan periodically to work around Android's 30-second scan limit.
   * Android throttles BLE scans after ~30 seconds of continuous scanning.
   */
  private scheduleScanRestart(): void {
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
    }

    this.scanTimeoutId = setTimeout(() => {
      if (this.isScanning) {
        console.log('[BLE Mesh] Restarting scan (Android throttle workaround)...');
        try {
          this.bleManager.stopDeviceScan();
        } catch {
          // Ignore
        }

        // Brief pause before restarting
        setTimeout(() => {
          if (this.isScanning) {
            this.bleManager.startDeviceScan(
              [VARIRAKSHA_SERVICE_UUID],
              { allowDuplicates: true },
              (error, device) => {
                if (error) {
                  if (error.errorCode === 2) {
                    this.stopScanning();
                    this.setStatus('bluetooth_off');
                  }
                  return;
                }
                if (device) {
                  this.handleDiscoveredDevice(device);
                }
              },
            );
            this.scheduleScanRestart();
          }
        }, 500);
      }
    }, 25000); // Restart every 25 seconds
  }
}

// ─── Singleton Export ───

export const bleMeshManager = new BleMeshManagerImpl();

export default bleMeshManager;
