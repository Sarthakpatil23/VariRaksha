import { supabase } from '../lib/supabaseClient';
import { UserProfile, getUserAIContext } from '../lib/userStore';

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

/**
 * Capture current location with graceful fallback to Wari coordinates
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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          enableHighAccuracy: true,
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationName: 'Wakhari Sector (Live GPS)',
        isFallback: false,
      };
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

    const insertData: Record<string, any> = {
      pilgrim_name: pilgrimName,
      pilgrim_phone: pilgrimPhone,
      pilgrim_age: pilgrimAge,
      pilgrim_gender: pilgrimGender,
      emergency_card_id: emergencyCardId,
      dindi_name: dindiName,
      problem_type: payload.problemType,
      notes: payload.description || '',
      medical_context: medicalContext,
      severity,
      status: 'nearby' as AlertStatus,
      distance_away: 'Live SOS',
      location_name: loc.locationName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[AlertService] Submitting SOS to Supabase:', insertData);

    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[AlertService] Supabase insert failed:', error.message);
      const offlineAlert: EmergencyAlert = {
        id: `offline-${Date.now()}`,
        pilgrim_name: pilgrimName,
        pilgrim_phone: pilgrimPhone,
        pilgrim_age: pilgrimAge,
        pilgrim_gender: pilgrimGender,
        emergency_card_id: emergencyCardId,
        dindi_name: dindiName,
        problem_type: payload.problemType,
        description: payload.description || '',
        notes: payload.description || '',
        medical_context: medicalContext,
        severity,
        status: 'nearby',
        distance_away: 'Live SOS',
        location_name: loc.locationName,
        latitude: loc.latitude,
        longitude: loc.longitude,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      pendingOfflineQueue.push(offlineAlert);
      return { alert: offlineAlert, isOfflineQueued: true, error: error.message };
    }

    console.log('[AlertService] SOS Created in Supabase successfully:', data.id);
    return { alert: data as EmergencyAlert, isOfflineQueued: false, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected error creating SOS:', err);
    return { alert: null, isOfflineQueued: false, error: err.message || 'Failed to trigger SOS' };
  }
}

/**
 * Fetch emergency alerts from Supabase
 */
export async function fetchEmergencyAlerts(): Promise<{
  alerts: EmergencyAlert[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[AlertService] Error fetching alerts:', error.message);
      return { alerts: [], error: error.message };
    }

    // Sort: Nearby / Open first (critical first), In Progress second, Resolved last
    const sorted = [...(data || [])].sort((a: EmergencyAlert, b: EmergencyAlert) => {
      const statusWeight = { nearby: 1, in_progress: 2, resolved: 3 };
      const severityWeight = { critical: 1, moderate: 2, normal: 3 };

      const swA = statusWeight[a.status] || 2;
      const swB = statusWeight[b.status] || 2;
      if (swA !== swB) return swA - swB;

      const sevA = severityWeight[a.severity] || 2;
      const sevB = severityWeight[b.severity] || 2;
      if (sevA !== sevB) return sevA - sevB;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { alerts: sorted, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected fetch error:', err);
    return { alerts: [], error: err.message || 'Unknown network error' };
  }
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
            onUpdate(payload.new as EmergencyAlert);
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
          onUpdate(payload);
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
