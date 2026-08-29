import { supabase } from '../lib/supabaseClient';

export type AlertSeverity = 'critical' | 'moderate' | 'normal';
export type AlertStatus = 'nearby' | 'in_progress' | 'resolved';

export interface EmergencyAlert {
  id: string;
  pilgrim_name: string;
  pilgrim_phone?: string;
  pilgrim_age?: number;
  pilgrim_gender?: string;
  emergency_card_id?: string;
  dindi_name?: string;
  problem_type: string;
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
 * Claim an alert (Respond Now)
 */
export async function claimEmergencyAlert(
  alertId: string,
  volunteer: { id?: string; name: string; phone?: string },
): Promise<{ alert: EmergencyAlert | null; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('emergency_alerts')
      .update({
        status: 'in_progress',
        responder_id: volunteer.id || 'current-volunteer',
        responder_name: volunteer.name,
        responder_phone: volunteer.phone || '',
        claimed_at: now,
        updated_at: now,
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      console.error('[AlertService] Claim error:', error.message);
      return { alert: null, error: error.message };
    }

    return { alert: data as EmergencyAlert, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected claim error:', err);
    return { alert: null, error: err.message || 'Network error claiming alert' };
  }
}

/**
 * Mark an emergency alert as Resolved
 */
export async function resolveEmergencyAlert(
  alertId: string,
  volunteerId?: string,
  notes?: string,
): Promise<{ alert: EmergencyAlert | null; error: string | null }> {
  try {
    const now = new Date().toISOString();
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
      return { alert: null, error: error.message };
    }

    return { alert: data as EmergencyAlert, error: null };
  } catch (err: any) {
    console.error('[AlertService] Unexpected resolve error:', err);
    return { alert: null, error: err.message || 'Network error resolving alert' };
  }
}

/**
 * Realtime subscription on emergency_alerts table
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
