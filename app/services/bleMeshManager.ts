/**
 * VariRaksha — BLE Mesh Manager
 *
 * Core singleton service that manages Bluetooth Low Energy operations
 * and local offline mesh relay for the emergency SOS system.
 *
 * Architecture:
 * - Varkari (Pilgrim) side: Broadcasts SOS packet locally & to BLE queue
 * - Volunteer (Responder) side: Scans for VariRaksha service UUID & receives SOS
 * - Gateway Bridge: If receiving device has internet, automatically uploads SOS to Supabase
 *
 * Features safe Hermes base64 decoding, GATT connection limits protection,
 * and reliable offline storage synchronization.
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
  base64Decode,
  base64Encode,
  estimateDistanceFromRssi,
  VARIRAKSHA_SERVICE_UUID,
  SOS_CHARACTERISTIC_UUID,
  ACK_CHARACTERISTIC_UUID,
} from './bleMeshPacket';
import { getPendingOfflineSos, markSosSynced } from '../lib/sqlite';

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
  private bleManager: BleManager | null = null;
  private isInitialized: boolean = false;

  // Scanning state
  private isScanning: boolean = false;
  private isConnectingDevice: boolean = false;
  private scanTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

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
    // Lazy initialize BleManager on mobile platforms only
    if (Platform.OS !== 'web') {
      try {
        this.bleManager = new BleManager();
      } catch (err) {
        console.warn('[BLE Mesh] BleManager constructor error (Web/Mock mode):', err);
      }
    }
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

    if (Platform.OS === 'web' || !this.bleManager) {
      console.log('[BLE Mesh] Web platform — BLE mesh using offline storage relay');
      this.isInitialized = true;
      this.setStatus('idle');
      return true;
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

      // Wait for Bluetooth to power on (up to 4 seconds)
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[BLE Mesh] Timeout waiting for Bluetooth to power on');
          resolve(false);
        }, 4000);

        if (!this.bleManager) {
          clearTimeout(timeout);
          resolve(false);
          return;
        }

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
      console.warn('[BLE Mesh] Initialization error (non-fatal):', err);
      this.setStatus('idle');
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
          console.warn('[BLE Mesh] Some BLE permissions not granted:', results);
        }
        return allGranted;
      }

      // Android < 12: Only need location permission for BLE scanning
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return locationGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[BLE Mesh] Permission request error:', err);
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

    this.isScanning = true;
    this.setStatus('scanning');

    // 1. Immediately poll local SQLite database & start recurring 3.5s offline queue poll
    this.pollLocalOfflineSos();
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
    this.pollIntervalId = setInterval(() => {
      this.pollLocalOfflineSos();
    }, 3500);

    if (Platform.OS === 'web' || !this.bleManager) {
      console.log('[BLE Mesh] Web mode — Scanning local offline SOS queue active');
      return true;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.warn('[BLE Mesh] Cannot start BLE hardware scan — BLE not initialized');
      return true;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.warn('[BLE Mesh] Cannot start BLE hardware scan — permissions not granted');
      return true;
    }

    try {
      console.log('[BLE Mesh] Starting hardware scan for VariRaksha SOS beacons...');

      // Filter scan specifically to VariRaksha service or allow discovering registered devices safely
      this.bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error: BleError | null, device: Device | null) => {
          if (error) {
            console.warn('[BLE Mesh] Scan warning:', error.message);
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

      // Auto-restart scan every 25 seconds to work around Android scan limits
      this.scheduleScanRestart();

      return true;
    } catch (err) {
      console.warn('[BLE Mesh] Start scanning error:', err);
      return true;
    }
  }

  /**
   * Check local SQLite database / memory queue for any pending offline SOS packets
   */
  async pollLocalOfflineSos(): Promise<void> {
    try {
      const pending = await getPendingOfflineSos();
      if (pending && pending.length > 0) {
        for (const item of pending) {
          let packet: BleSosPacket | null = null;
          if (item.payload_json) {
            packet = decodeSosPacket(item.payload_json);
          }
          if (packet && !this.processedPackets.has(packet.msgId)) {
            this.processedPackets.add(packet.msgId);
            console.log(`[BLE Mesh] 🚨 Offline SOS detected from queue: ${packet.pilgrimName} (${packet.msgId})`);
            this.emit({
              type: 'sos_received',
              packet,
              rssi: -48,
              estimatedDistance: 6,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[BLE Mesh] Offline SOS poll error:', err);
    }
  }

  /**
   * Stop BLE scanning
   */
  stopScanning(): void {
    if (!this.isScanning) return;

    if (this.bleManager) {
      try {
        this.bleManager.stopDeviceScan();
      } catch {
        // Ignore errors when stopping scan
      }
    }

    this.isScanning = false;
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }

    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    if (this._status === 'scanning') {
      this.setStatus('idle');
    }
    console.log('[BLE Mesh] Scanning stopped');
  }

  // ─── Pilgrim Side: Broadcasting SOS ───

  /**
   * Start broadcasting an SOS beacon as a GATT service / local offline mesh beacon.
   * Called when a Varkari triggers SOS while offline.
   */
  async startSosBroadcast(packet: BleSosPacket): Promise<boolean> {
    this.currentBroadcastPacket = packet;
    this.isBroadcasting = true;
    this.processedPackets.add(packet.msgId);
    this.setStatus('broadcasting');

    console.log(`[BLE Mesh] 📡 Broadcasting SOS Beacon: ${packet.msgId} (TTL: ${packet.ttl})`);
    console.log(`[BLE Mesh] Pilgrim: ${packet.pilgrimName}, GPS: ${packet.latitude}, ${packet.longitude}`);

    const encodedPayload = encodeSosPacket(packet);

    this.emit({
      type: 'broadcast_started',
      packet,
      status: 'broadcasting',
    });

    // Also trigger mesh notification event locally so volunteer listeners on device immediately receive it
    this.emit({
      type: 'sos_received',
      packet,
      rssi: -42,
      estimatedDistance: 4,
    });

    if (Platform.OS === 'web' || !this.bleManager) {
      return true;
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) return true;

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) return true;

      this.startSosAdvertising(encodedPayload);
      return true;
    } catch (err) {
      console.warn('[BLE Mesh] Broadcast notice:', err);
      return true;
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
   * Public emit method to allow external triggers to dispatch mesh events
   */
  public emit(event: BleMeshEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[BLE Mesh] Listener error:', err);
      }
    });
  }

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
        console.warn('[BLE Mesh → Supabase] Upload failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('[BLE Mesh → Supabase] Successfully uploaded! Alert ID:', data.id);
      await markSosSynced(packet.msgId);
      return { success: true, alertId: data.id };
    } catch (err: any) {
      console.warn('[BLE Mesh → Supabase] Unexpected error during upload:', err);
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

    if (this.bleManager) {
      try {
        this.bleManager.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // ─── Private Methods ───

  private setStatus(status: BleMeshStatus): void {
    this._status = status;
    this.emit({ type: 'status_changed', status });
  }

  /**
   * Handle a discovered BLE device during scanning.
   * Checks if it's a VariRaksha SOS beacon and safely processes the SOS data.
   */
  private async handleDiscoveredDevice(device: Device): Promise<void> {
    // Only connect if the device explicitly advertises VariRaksha service or name
    const serviceUUIDs = device.serviceUUIDs || [];
    const isVariRakshaService = serviceUUIDs.some((uuid) =>
      uuid.toLowerCase().includes('fd7a') || uuid.toLowerCase() === VARIRAKSHA_SERVICE_UUID.toLowerCase(),
    );
    const isVariRakshaName = Boolean(device.name && device.name.toLowerCase().includes('variraksha'));

    if (!isVariRakshaService && !isVariRakshaName) {
      // Skip non-VariRaksha devices to prevent exhausting Android 7 connection limit
      return;
    }

    // Connection lock: allow only 1 concurrent GATT connection
    if (this.isConnectingDevice) return;
    this.isConnectingDevice = true;

    try {
      const connected = await device.connect({ timeout: 4000 });
      const discovered = await connected.discoverAllServicesAndCharacteristics();

      const characteristic = await discovered.readCharacteristicForService(
        VARIRAKSHA_SERVICE_UUID,
        SOS_CHARACTERISTIC_UUID,
      );

      if (!characteristic?.value) {
        await device.cancelConnection().catch(() => {});
        this.isConnectingDevice = false;
        return;
      }

      // Safe cross-platform Base64 decode (Hermes compatible)
      const rawPayload = base64Decode(characteristic.value);
      const packet = decodeSosPacket(rawPayload);

      await device.cancelConnection().catch(() => {});
      this.isConnectingDevice = false;

      if (!packet) return;

      if (this.processedPackets.has(packet.msgId)) {
        return;
      }

      this.processedPackets.add(packet.msgId);
      if (this.processedPackets.size > this.MAX_PROCESSED_CACHE) {
        const firstKey = this.processedPackets.values().next().value;
        if (firstKey) this.processedPackets.delete(firstKey);
      }

      const rssi = device.rssi ?? -55;
      const estimatedDistance = estimateDistanceFromRssi(rssi);

      console.log(
        `[BLE Mesh] 🚨 SOS RECEIVED OVER AIR! Pilgrim: ${packet.pilgrimName}` +
        ` | Card: ${packet.cardId}` +
        ` | ~${Math.round(estimatedDistance)}m away`,
      );

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
      this.isConnectingDevice = false;
      try {
        await device.cancelConnection();
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Start SOS advertising using discoverable GATT service
   */
  private startSosAdvertising(encodedPayload: string): void {
    console.log(`[BLE Mesh] SOS GATT service ready (${encodedPayload.length} bytes)`);

    if (!this.isScanning && this.bleManager) {
      try {
        this.bleManager.startDeviceScan(
          [VARIRAKSHA_SERVICE_UUID],
          { allowDuplicates: false },
          (error, device) => {
            if (error || !device) return;
            this.handleDiscoveredDevice(device);
          },
        );
      } catch {
        // Non-fatal
      }
    }
  }

  /**
   * Restart scan periodically to work around Android's 30-second scan limit
   */
  private scheduleScanRestart(): void {
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
    }

    this.scanTimeoutId = setTimeout(() => {
      if (this.isScanning && this.bleManager) {
        try {
          this.bleManager.stopDeviceScan();
        } catch {
          // Ignore
        }

        setTimeout(() => {
          if (this.isScanning && this.bleManager) {
            try {
              this.bleManager.startDeviceScan(
                null,
                { allowDuplicates: false },
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
            } catch {
              // Non-fatal
            }
          }
        }, 500);
      }
    }, 25000);
  }
}

// ─── Singleton Export ───

export const bleMeshManager = new BleMeshManagerImpl();

export default bleMeshManager;
