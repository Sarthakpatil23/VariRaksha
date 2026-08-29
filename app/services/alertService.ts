import { supabase } from '../lib/supabaseClient';
import { UserProfile, getUserAIContext } from '../lib/userStore';
import * as Location from 'expo-location';
import {
  calculateDynamicPriority,
  prioritizeEmergencyAlerts,
  compareAlertPriority,
  PriorityLevel,
  PriorityFactorsBreakdown,
  PrioritizedAlertInput,
} from './priorityEngine';
import { bleMeshManager } from './bleMeshManager';
import {
  BleSosPacket,
  generateMessageId,
  problemTypeToCode,
  encodeSosPacket,
  decodeSosPacket,
} from './bleMeshPacket';
import { insertOfflineSos, getPendingOfflineSos, markSosSynced } from '../lib/sqlite';

export {
  calculateDynamicPriority,
  prioritizeEmergencyAlerts,
  compareAlertPriority,
  PriorityLevel,
  PriorityFactorsBreakdown,
};

export type AlertSeverity = 'critical' | 'moderate' | 'normal';
export type AlertStatus = 'nearby' | 'in_progress' | 'resolved';

export interface EmergencyAlert {
  id: string;
  varkari_id?: string;
  vari_id?: string;
  pilgrim_name: string;
  pilgrim_phone?: string;
  pilgrim_age?: number;
  pilgrim_gender?: string;
  emergency_card_id?: string;
  dindi_name?: string;
  problem_type: string;
  emergency_type?: string;
  description?: string;
  medical_context?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  distance_away?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  responder_id?: string;
  responder_name?: string;
  responder_phone?: string;
  claimed_at?: string;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  priority_level?: PriorityLevel;
  priority_score?: number;
  effective_priority_score?: number;
  priority_explanation?: string;
  priority_factors?: any;
  priorityData?: PriorityFactorsBreakdown;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description?: string;
  sector: string;
  status: 'active' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  assigned_to?: string;
  created_at: string;
  completed_at?: string;
}

export interface VolunteerDashboardStats {
  nearbyCount: number;
  criticalCount: number;
  inProgressCount: number;
  claimedByMeCount: number;
  resolvedCount: number;
  activeClaimedAlert: EmergencyAlert | null;
}

export interface SOSCreationPayload {
  problemType: string;
  description?: string;
  profile?: UserProfile | null;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  severity?: AlertSeverity;
}

// In-memory / Offline pending queue for resilient offline behavior
let pendingOfflineQueue: EmergencyAlert[] = [];

type OfflineSyncCallback = (offlineId: string, supabaseAlert: EmergencyAlert) => void;
const offlineSyncListeners: Set<OfflineSyncCallback> = new Set();

/**
 * Register a listener for when offline alerts are successfully synced to Supabase
 */
export function onOfflineAlertSynced(callback: OfflineSyncCallback): () => void {
  offlineSyncListeners.add(callback);
  return () => {
    offlineSyncListeners.delete(callback);
  };
}

/**
 * Capture current location with graceful fallback to Wari coordinates
 * Uses strict 3.5s timeout promise race to prevent hanging when GPS is slow
 */
export async function captureCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  locationName: string;
  isFallback: boolean;
}> {
  // Default Wari Route Coordinate: Sector 1 (Wakhari Gate, KM 142)
  const defaultLocation = {
    latitude: 17.7120,
    longitude: 75.2410,
    locationName: 'Wakhari Main Gate (Palkhi Route, KM 142)',
    isFallback: true,
  };

  try {
    // 1. Try native Expo Location API with strict 3.5s timeout promise race
    const perm = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false } as any));
    if (perm && perm.granted) {
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const position: any = await Promise.race([positionPromise, timeoutPromise]);

      if (position?.coords) {
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: 'Palkhi Route (Live GPS)',
          isFallback: false,
        };
      }
    }
  } catch (err) {
    console.log('[AlertService] Expo Location error, trying web geolocation:', err);
  }

  try {
    // 2. Web Geolocation API fallback with 2.5s timeout
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 2500,
          enableHighAccuracy: false,
        });
      });

      if (position?.coords) {
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationName: 'Wakhari Sector (Live GPS)',
          isFallback: false,
        };
      }
    }
  } catch (err) {
    console.log('[AlertService] Location unavailable, using Wari corridor coordinates:', err);
  }

  return defaultLocation;
}


/**
 * Create a new Emergency SOS Incident in Supabase
 */
export async function createEmergencySOS(
  payload: SOSCreationPayload,
): Promise<{ alert: EmergencyAlert | null; isOfflineQueued: boolean; error: string | null }> {
  try {
    const loc =
      payload.latitude && payload.longitude
        ? {
            latitude: payload.latitude,
            longitude: payload.longitude,
            locationName: payload.locationName || 'Near Wakhari Gate',
          }
        : await captureCurrentLocation();

    const profile = payload.profile;
    const pilgrimName = profile?.fullName || 'Varkari Pilgrim';
    const pilgrimPhone = profile?.mobileNumber || '+91 99708 32199';
    const pilgrimAge = profile?.age || 62;
    const pilgrimGender = profile?.gender || 'Male';
    const emergencyCardId = profile?.emergencyCardId || 'VK-DEHU01';
    const dindiName = profile?.dindiName || 'Sant Tukaram Maharaj Dindi #01';

    // Compile medical context from user profile
    const medicalParts: string[] = [];
    if (profile?.bloodGroup) medicalParts.push(`Blood: ${profile.bloodGroup}`);
    if (profile?.medicalConditions && profile.medicalConditions.length > 0) {
      const conds = profile.medicalConditions.filter(Boolean).join(', ');
      if (conds && conds.toLowerCase() !== 'none') medicalParts.push(`Conditions: ${conds}`);
    }
    if (profile?.allergies && profile.allergies.length > 0) {
      const alls = profile.allergies.filter(Boolean).join(', ');
      if (alls && alls.toLowerCase() !== 'none') medicalParts.push(`Allergies: ${alls}`);
    }
    if (profile?.currentMedications && profile.currentMedications.length > 0) {
      const meds = profile.currentMedications.filter(Boolean).join(', ');
      if (meds && meds.toLowerCase() !== 'none') medicalParts.push(`Meds: ${meds}`);
    }
    const medicalContext = medicalParts.length > 0 ? medicalParts.join(' · ') : 'No critical conditions on record';

    // Determine severity
    const criticalProblems = ['Medical emergency', 'वैद्यकीय आणीबाणी', 'आपातकालीन चिकित्सा', 'Injury', 'दुखापत'];
    const isCritical =
      payload.severity === 'critical' ||
      criticalProblems.some((p) => payload.problemType.toLowerCase().includes(p.toLowerCase()));
    const severity: AlertSeverity = isCritical ? 'critical' : 'moderate';

    // Calculate baseline priority factors
    const priorityBreakdown = calculateDynamicPriority({
      severity,
      problem_type: payload.problemType,
      description: payload.description || '',
      notes: payload.description || '',
      pilgrim_age: pilgrimAge,
      medical_context: medicalContext,
      created_at: new Date().toISOString(),
      status: 'nearby',
    });

    const insertData: Record<string, any> = {
      pilgrim_name: pilgrimName,
      pilgrim_phone: pilgrimPhone,
      pilgrim_age: pilgrimAge,
      pilgrim_gender: pilgrimGender,
      emergency_card_id: emergencyCardId,
      dindi_name: dindiName,
      problem_type: payload.problemType,
      emergency_type: payload.problemType,
      notes: payload.description || '',
      medical_context: medicalContext,
      severity,
      status: 'nearby' as AlertStatus,
      distance_away: 'Live SOS',
      location_name: loc.locationName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      priority_level: priorityBreakdown.priorityLevel,
      priority_score: priorityBreakdown.rawScore,
      priority_factors: priorityBreakdown,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[AlertService] Submitting prioritized SOS to Supabase:', insertData);

    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[AlertService] Supabase insert failed:', error.message);
      const msgId = generateMessageId();
      const offlineAlert: EmergencyAlert = {
        id: `offline-${msgId}`,
        pilgrim_name: pilgrimName,
        pilgrim_phone: pilgrimPhone,
        pilgrim_age: pilgrimAge,
        pilgrim_gender: pilgrimGender,
        emergency_card_id: emergencyCardId,
        dindi_name: dindiName,
        problem_type: payload.problemType,
        emergency_type: payload.problemType,
        description: payload.description || '',
        notes: payload.description || '',
        medical_context: medicalContext,
        severity,
        status: 'nearby',
        distance_away: 'BLE Mesh SOS',
        location_name: loc.locationName,
        latitude: loc.latitude,
        longitude: loc.longitude,
        priority_level: priorityBreakdown.priorityLevel,
        priority_score: priorityBreakdown.rawScore,
        effective_priority_score: priorityBreakdown.effectiveScore,
        priority_explanation: priorityBreakdown.explanation,
        priority_factors: priorityBreakdown,
        priorityData: priorityBreakdown,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      pendingOfflineQueue.push(offlineAlert);

      // ── BLE Mesh Broadcast (Offline SOS) ──
      // When Supabase is unreachable, broadcast SOS via Bluetooth to nearby volunteers
      try {
        const blePacket: BleSosPacket = {
          msgId,
          cardId: emergencyCardId,
          pilgrimName,
          pilgrimPhone,
          emergencyType: problemTypeToCode(payload.problemType),
          problemType: payload.problemType,
          latitude: loc.latitude,
          longitude: loc.longitude,
          ttl: 5, // Max 5 hops through mesh
          bloodGroup: profile?.bloodGroup || 'Unknown',
          age: pilgrimAge,
          severity,
          medicalContext,
          dindiName,
          timestamp: Math.floor(Date.now() / 1000),
        };

        // Save to local SQLite for persistence
        const encodedPayload = encodeSosPacket(blePacket);
        insertOfflineSos(
          msgId,
          emergencyCardId,
          pilgrimName,
          pilgrimPhone,
          payload.problemType,
          loc.latitude,
          loc.longitude,
          severity,
          encodedPayload,
        ).catch((sqlErr) => console.warn('[AlertService] SQLite save error:', sqlErr));

        // Start BLE broadcast
        bleMeshManager.startSosBroadcast(blePacket).then((started) => {
          if (started) {
            console.log('[AlertService] 📡 BLE Mesh SOS broadcast started for:', msgId);
          } else {
            console.warn('[AlertService] BLE Mesh broadcast failed to start');
          }
        });
      } catch (bleErr) {
        console.warn('[AlertService] BLE Mesh broadcast error:', bleErr);
      }

      return { alert: offlineAlert, isOfflineQueued: true, error: error.message };
    }

    const created = data as EmergencyAlert;
    created.priorityData = calculateDynamicPriority(created);

    console.log('[AlertService] SOS Created in Supabase successfully:', data.id, 'Priority:', created.priority_level);
    return { alert: created, isOfflineQueued: false, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected error creating SOS:', err);
    return { alert: null, isOfflineQueued: false, error: err.message || 'Failed to trigger SOS' };
  }
}

/**
 * Helper: Convert a SQLite/offline SOS queue item to an EmergencyAlert
 */
export function convertOfflineItemToAlert(item: any): EmergencyAlert {
  let decoded: BleSosPacket | null = null;
  if (item.payload_json) {
    decoded = decodeSosPacket(item.payload_json);
  }

  const problemType = item.problem_type || decoded?.problemType || 'Medical emergency';
  const severity = (item.severity || decoded?.severity || 'critical') as AlertSeverity;
  const pilgrimAge = item.age || decoded?.age || 62;
  const medicalContext = item.medical_context || decoded?.medicalContext || 'Offline BLE SOS';
  const createdAt = item.created_at || (item.timestamp ? new Date(item.timestamp * 1000).toISOString() : new Date().toISOString());

  const priorityBreakdown = calculateDynamicPriority({
    severity,
    problem_type: problemType,
    description: `Offline BLE SOS | Blood: ${item.blood_group || decoded?.bloodGroup || 'Unknown'}`,
    notes: `Offline BLE SOS Relay`,
    pilgrim_age: pilgrimAge,
    medical_context: medicalContext,
    created_at: createdAt,
    status: 'nearby',
  });

  const rawMsgId = item.msg_id || decoded?.msgId || `off-${Date.now()}`;
  const alertId = rawMsgId.startsWith('offline-') ? rawMsgId : `offline-${rawMsgId}`;

  return {
    id: alertId,
    pilgrim_name: item.pilgrim_name || decoded?.pilgrimName || 'Varkari Pilgrim',
    pilgrim_phone: item.pilgrim_phone || decoded?.pilgrimPhone || '+91 99708 32199',
    pilgrim_age: pilgrimAge,
    pilgrim_gender: item.pilgrim_gender || 'Male',
    emergency_card_id: item.card_id || decoded?.cardId || 'VK-BLE01',
    dindi_name: item.dindi_name || decoded?.dindiName || 'Sant Dindi #01',
    problem_type: problemType,
    emergency_type: problemType,
    description: `[Offline SOS via BLE Mesh] Relay beacon active`,
    notes: `[Offline SOS via BLE Mesh] MsgID: ${rawMsgId}`,
    medical_context: medicalContext,
    severity,
    status: 'nearby' as AlertStatus,
    distance_away: '📡 Offline BLE Relay',
    location_name: 'Palkhi Route (Offline GPS)',
    latitude: item.latitude || decoded?.latitude || 17.7120,
    longitude: item.longitude || decoded?.longitude || 75.2410,
    priority_level: priorityBreakdown.priorityLevel,
    priority_score: priorityBreakdown.rawScore,
    effective_priority_score: priorityBreakdown.effectiveScore,
    priority_explanation: priorityBreakdown.explanation,
    priority_factors: priorityBreakdown,
    priorityData: priorityBreakdown,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch emergency alerts from Supabase, seamlessly merged with local offline SQLite queue
 */
export async function fetchEmergencyAlerts(): Promise<{
  alerts: EmergencyAlert[];
  error: string | null;
}> {
  let onlineAlerts: EmergencyAlert[] = [];
  let fetchError: string | null = null;

  try {
    // 1. Try PostgreSQL RPC with real-time response priority scoring
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_prioritized_emergency_alerts');

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      onlineAlerts = rpcData.map((item: any) => ({
        ...item,
        priorityData: calculateDynamicPriority(item),
      }));
    } else {
      if (rpcError) {
        console.warn('[AlertService] RPC error, falling back to direct table select:', rpcError.message);
      }

      // 2. Direct table select fallback
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        onlineAlerts = data as EmergencyAlert[];
      } else if (error) {
        fetchError = error.message;
      }
    }
  } catch (err: any) {
    console.warn('[AlertService] Online fetch error (Device may be offline):', err.message);
    fetchError = err.message;
  }

  // 3. Retrieve local offline SQLite alerts & memory queue
  const offlineAlerts: EmergencyAlert[] = [...pendingOfflineQueue];

  try {
    const sqlitePending = await getPendingOfflineSos();
    if (sqlitePending && sqlitePending.length > 0) {
      console.log(`[AlertService] Found ${sqlitePending.length} offline SOS alerts in SQLite`);

      for (const item of sqlitePending) {
        const alertObj = convertOfflineItemToAlert(item);
        const alreadyInOffline = offlineAlerts.some((a) => a.id === alertObj.id);
        if (!alreadyInOffline) {
          offlineAlerts.push(alertObj);
        }

        // Gateway Bridge: If we have online connectivity, attempt background sync to Supabase
        if (!fetchError && onlineAlerts.length >= 0) {
          try {
            const { data: syncedData, error: syncErr } = await supabase
              .from('emergency_alerts')
              .insert([{
                pilgrim_name: alertObj.pilgrim_name,
                pilgrim_phone: alertObj.pilgrim_phone,
                pilgrim_age: alertObj.pilgrim_age,
                emergency_card_id: alertObj.emergency_card_id,
                dindi_name: alertObj.dindi_name,
                problem_type: alertObj.problem_type,
                emergency_type: alertObj.emergency_type,
                notes: alertObj.notes,
                medical_context: alertObj.medical_context,
                severity: alertObj.severity,
                status: 'nearby',
                distance_away: 'BLE Mesh Relay',
                location_name: alertObj.location_name,
                latitude: alertObj.latitude,
                longitude: alertObj.longitude,
                created_at: alertObj.created_at,
                updated_at: new Date().toISOString(),
              }])
              .select()
              .single();

            if (!syncErr && syncedData) {
              console.log('[AlertService] ✅ Synced offline SQLite alert to Supabase:', syncedData.id);
              await markSosSynced(item.msg_id);
              
              // Enriched synced alert
              const enriched: EmergencyAlert = {
                ...(syncedData as EmergencyAlert),
                priorityData: calculateDynamicPriority(syncedData),
              };

              // Notify active listeners (e.g. Pilgrim Home Screen to switch to Supabase tracking)
              offlineSyncListeners.forEach((fn) => {
                try {
                  fn(alertObj.id, enriched);
                } catch {
                  // Ignore listener error
                }
              });

              // Remove from in-memory offline queue
              pendingOfflineQueue = pendingOfflineQueue.filter((a) => a.id !== alertObj.id);
            }
          } catch {
            // Ignore background sync errors
          }
        }
      }
    }
  } catch (sqlErr) {
    console.warn('[AlertService] SQLite read error:', sqlErr);
  }

  // 4. Merge online & offline alerts (deduplicating by ID or card_id + created_at)
  const mergedMap = new Map<string, EmergencyAlert>();

  for (const a of onlineAlerts) {
    mergedMap.set(a.id, a);
  }
  for (const off of offlineAlerts) {
    if (!mergedMap.has(off.id)) {
      mergedMap.set(off.id, off);
    }
  }

  const mergedList = Array.from(mergedMap.values());
  const sorted = prioritizeEmergencyAlerts(mergedList);

  return { alerts: sorted, error: fetchError && mergedList.length === 0 ? fetchError : null };
}

/**
 * Fetch single alert by ID
 */
export async function fetchAlertById(alertId: string): Promise<EmergencyAlert | null> {
  try {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (error || !data) return null;
    return data as EmergencyAlert;
  } catch {
    return null;
  }
}

/**
 * Claim an alert (Respond Now) - Atomic Race-Condition Safe Operation
 */
export async function claimEmergencyAlert(
  alertId: string,
  volunteer: { id?: string; name: string; phone?: string },
): Promise<{
  alert: EmergencyAlert | null;
  alreadyClaimed: boolean;
  claimedBy?: string;
  error: string | null;
}> {
  try {
    const now = new Date().toISOString();

    // Handle offline-first BLE alerts locally if not yet synced to Supabase
    if (alertId.startsWith('offline-')) {
      const offlineItem = pendingOfflineQueue.find((a) => a.id === alertId);
      const claimedAlert: EmergencyAlert = offlineItem
        ? {
            ...offlineItem,
            status: 'in_progress',
            responder_id: volunteer.id || 'vol-current',
            responder_name: volunteer.name,
            responder_phone: volunteer.phone || '+91 98221 55660',
            claimed_at: now,
            updated_at: now,
          }
        : {
            id: alertId,
            pilgrim_name: 'Varkari Pilgrim',
            problem_type: 'Offline Emergency',
            severity: 'critical',
            status: 'in_progress',
            responder_id: volunteer.id || 'vol-current',
            responder_name: volunteer.name,
            responder_phone: volunteer.phone || '+91 98221 55660',
            claimed_at: now,
            updated_at: now,
            created_at: now,
          };

      // Send BLE ACK packet back to the pilgrim via Bluetooth mesh
      const rawMsgId = alertId.replace('offline-', '');
      bleMeshManager.emit({
        type: 'ack_received',
        ack: {
          msgId: rawMsgId,
          volunteerName: volunteer.name,
          volunteerPhone: volunteer.phone || '+91 98221 55660',
          timestamp: Math.floor(Date.now() / 1000),
        },
      });

      return { alert: claimedAlert, alreadyClaimed: false, error: null };
    }

    // 1. Try atomic database RPC first if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'claim_emergency_alert',
        {
          p_alert_id: alertId,
          p_responder_id: volunteer.id || 'vol-current',
          p_responder_name: volunteer.name,
          p_responder_phone: volunteer.phone || '+91 98221 55660',
        },
      );

      if (!rpcError && rpcData) {
        if (rpcData.success) {
          return { alert: rpcData.alert as EmergencyAlert, alreadyClaimed: false, error: null };
        } else if (rpcData.already_claimed) {
          return {
            alert: rpcData.alert as EmergencyAlert,
            alreadyClaimed: true,
            claimedBy: rpcData.claimed_by || 'another volunteer',
            error: 'Already claimed by another responder',
          };
        }
      }
    } catch {
      // Fall through to atomic conditional update
    }

    // 2. Atomic conditional update fallback: only update if status is currently 'nearby'
    const { data, error } = await supabase
      .from('emergency_alerts')
      .update({
        status: 'in_progress',
        responder_id: volunteer.id || 'vol-current',
        responder_name: volunteer.name,
        responder_phone: volunteer.phone || '+91 98221 55660',
        claimed_at: now,
        updated_at: now,
      })
      .eq('id', alertId)
      .eq('status', 'nearby')
      .select()
      .maybeSingle();

    if (error) {
      console.error('[AlertService] Claim error:', error.message);
      return { alert: null, alreadyClaimed: false, error: error.message };
    }

    if (!data) {
      // No rows updated means another volunteer already claimed it or alert is resolved!
      const current = await fetchAlertById(alertId);
      return {
        alert: current,
        alreadyClaimed: true,
        claimedBy: current?.responder_name || 'another responder',
        error: 'Already being handled by another responder',
      };
    }

    return { alert: data as EmergencyAlert, alreadyClaimed: false, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected claim error:', err);
    return { alert: null, alreadyClaimed: false, error: err.message || 'Network error claiming alert' };
  }
}

/**
 * Mark an emergency alert as Resolved and remove it from database
 */
export async function resolveEmergencyAlert(
  alertId: string,
  notes?: string,
  removeFromDatabase: boolean = true,
): Promise<{ success: boolean; alert: EmergencyAlert | null; error: string | null }> {
  try {
    const now = new Date().toISOString();

    if (removeFromDatabase) {
      console.log('[AlertService] Removing resolved alert from database:', alertId);
      const { error } = await supabase
        .from('emergency_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error('[AlertService] Delete on resolve error:', error.message);
        return { success: false, alert: null, error: error.message };
      }

      return { success: true, alert: null, error: null };
    }

    // Direct update fallback if keeping archived record
    const updatePayload: Record<string, any> = {
      status: 'resolved',
      resolved_at: now,
      updated_at: now,
    };
    if (notes) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('emergency_alerts')
      .update(updatePayload)
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      console.error('[AlertService] Resolve error:', error.message);
      return { success: false, alert: null, error: error.message };
    }

    return { success: true, alert: data as EmergencyAlert, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected resolve error:', err);
    return { success: false, alert: null, error: err.message || 'Network error resolving alert' };
  }
}

/**
 * Directly delete an emergency alert from Supabase database
 */
export async function deleteEmergencyAlert(
  alertId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('emergency_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      console.error('[AlertService] Delete error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Realtime subscription for a single specific alert (used by Varkari pilgrim to track assignment)
 */
export function subscribeToSingleAlert(
  alertId: string,
  onUpdate: (alert: EmergencyAlert | null) => void,
): () => void {
  try {
    const channelName = `sos_single_${alertId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts',
          filter: `id=eq.${alertId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            console.log('[AlertService] Single alert deleted from DB');
            onUpdate(null);
          } else if (payload.new) {
            const enriched = {
              ...(payload.new as EmergencyAlert),
              priorityData: calculateDynamicPriority(payload.new as EmergencyAlert),
            };
            onUpdate(enriched);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[AlertService] Single alert subscription error:', err);
    return () => {};
  }
}

/**
 * Realtime subscription for all emergency alerts (used by Volunteer & Medical Staff)
 */
export function subscribeToEmergencyAlerts(
  onUpdate: (payload: any) => void,
): () => void {
  try {
    const channelName = `emergency_alerts_live_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_alerts' },
        (payload) => {
          if (payload.new) {
            const enriched = {
              ...payload.new,
              priorityData: calculateDynamicPriority(payload.new),
            };
            onUpdate({ ...payload, new: enriched });
          } else {
            onUpdate(payload);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[AlertService] Realtime subscription error:', err);
    return () => {};
  }
}

/**
 * Fetch routine volunteer duties / tasks
 */
export async function fetchVolunteerTasks(): Promise<{
  tasks: VolunteerTask[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('volunteer_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[AlertService] Error fetching tasks:', error.message);
      return { tasks: [], error: error.message };
    }

    return { tasks: data as VolunteerTask[], error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected tasks fetch error:', err);
    return { tasks: [], error: err.message || 'Network error' };
  }
}

/**
 * Update routine volunteer task status
 */
export async function updateVolunteerTaskStatus(
  taskId: string,
  status: 'active' | 'in_progress' | 'completed',
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = { status };
    if (status === 'completed') {
      updatePayload.completed_at = now;
    }

    const { error } = await supabase
      .from('volunteer_tasks')
      .update(updatePayload)
      .eq('id', taskId);

    if (error) {
      console.error('[AlertService] Task update error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Calculate volunteer dashboard stats
 */
export function calculateVolunteerStats(
  alerts: EmergencyAlert[],
  currentVolunteerId?: string,
  currentVolunteerName?: string,
): VolunteerDashboardStats {
  let nearbyCount = 0;
  let criticalCount = 0;
  let inProgressCount = 0;
  let claimedByMeCount = 0;
  let resolvedCount = 0;
  let activeClaimedAlert: EmergencyAlert | null = null;

  for (const a of alerts) {
    if (a.status === 'nearby') {
      nearbyCount++;
      if (a.severity === 'critical') criticalCount++;
    } else if (a.status === 'in_progress') {
      inProgressCount++;
      const isClaimedByMe =
        (currentVolunteerId && a.responder_id === currentVolunteerId) ||
        (currentVolunteerName &&
          a.responder_name?.toLowerCase() === currentVolunteerName.toLowerCase());

      if (isClaimedByMe) {
        claimedByMeCount++;
        if (!activeClaimedAlert) {
          activeClaimedAlert = a;
        }
      }
    } else if (a.status === 'resolved') {
      resolvedCount++;
    }
  }

  return {
    nearbyCount,
    criticalCount,
    inProgressCount,
    claimedByMeCount,
    resolvedCount,
    activeClaimedAlert,
  };
}

/**
 * Create an emergency alert from a BLE mesh packet received by a Volunteer.
 * This is the gateway bridge function: BLE Mesh → Supabase.
 * Called when a Volunteer's phone receives an offline SOS via Bluetooth.
 */
export async function createAlertFromBlePacket(
  packet: BleSosPacket,
): Promise<{ alert: EmergencyAlert | null; error: string | null }> {
  try {
    const priorityBreakdown = calculateDynamicPriority({
      severity: packet.severity,
      problem_type: packet.problemType,
      description: `BLE Mesh relay | Blood: ${packet.bloodGroup} | Age: ${packet.age}`,
      pilgrim_age: packet.age,
      medical_context: packet.medicalContext,
      created_at: new Date(packet.timestamp * 1000).toISOString(),
      status: 'nearby',
    });

    const insertData: Record<string, any> = {
      pilgrim_name: packet.pilgrimName,
      pilgrim_phone: packet.pilgrimPhone,
      pilgrim_age: packet.age,
      emergency_card_id: packet.cardId,
      dindi_name: packet.dindiName,
      problem_type: packet.problemType,
      emergency_type: packet.problemType,
      notes: `[Offline SOS via BLE Mesh] MsgID: ${packet.msgId} | Blood: ${packet.bloodGroup} | TTL: ${packet.ttl}`,
      medical_context: packet.medicalContext,
      severity: packet.severity,
      status: 'nearby' as AlertStatus,
      distance_away: 'BLE Mesh Relay',
      location_name: 'Palkhi Route (BLE Mesh GPS)',
      latitude: packet.latitude,
      longitude: packet.longitude,
      priority_level: priorityBreakdown.priorityLevel,
      priority_score: priorityBreakdown.rawScore,
      priority_factors: priorityBreakdown,
      created_at: new Date(packet.timestamp * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[AlertService] Uploading BLE Mesh SOS to Supabase:', packet.msgId);

    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[AlertService] BLE→Supabase upload failed:', error.message);
      return { alert: null, error: error.message };
    }

    const created = data as EmergencyAlert;
    created.priorityData = calculateDynamicPriority(created);

    console.log('[AlertService] ✅ BLE Mesh SOS uploaded to Supabase:', data.id);
    return { alert: created, error: null };
  } catch (err: any) {
    console.error('[AlertService] BLE→Supabase unexpected error:', err);
    return { alert: null, error: err.message || 'Failed to upload BLE SOS' };
  }
}
