import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';
import {
  fetchEmergencyAlerts,
  claimEmergencyAlert,
  subscribeToEmergencyAlerts,
  EmergencyAlert,
} from '../../services/alertService';
import { useUserProfile } from '../../lib/userStore';

export const MedicalStaffAlertsScreen: React.FC<
  MedicalStaffTabScreenProps<'Alerts'>
> = ({ navigation }) => {
  const profile = useUserProfile();
  const staffName = profile?.fullName || 'Dr. Medical Officer';
  const staffPhone = profile?.mobileNumber || '+91 98220 11223';

  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    loadLiveAlerts();

    // 1. Subscribe to Supabase Realtime changes
    const unsubscribe = subscribeToEmergencyAlerts((payload) => {
      console.log('[MedicalStaffAlerts] Realtime alert update:', payload.eventType);
      if (payload.eventType === 'INSERT') {
        if (soundEnabled) Vibration.vibrate([0, 300, 150, 300]);
        setAlerts((prev) => [payload.new as EmergencyAlert, ...prev.filter((a) => a.id !== payload.new.id)]);
      } else if (payload.eventType === 'UPDATE') {
        setAlerts((prev) => prev.map((a) => (a.id === payload.new.id ? (payload.new as EmergencyAlert) : a)));
      } else if (payload.eventType === 'DELETE') {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
      }
    });

    // 2. Fast 4s Polling Fallback
    const pollInterval = setInterval(() => {
      fetchEmergencyAlerts().then(({ alerts: fresh }) => {
        if (fresh) {
          setAlerts(fresh);
        }
      });
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [soundEnabled]);

  const loadLiveAlerts = async () => {
    setIsLoading(true);
    const { alerts: fetched, error } = await fetchEmergencyAlerts();
    setIsLoading(false);
    if (!error && fetched) {
      setAlerts(fetched);
    }
  };

  const handleClaim = (alertItem: EmergencyAlert) => {
    Alert.alert(
      'Respond to Medical Alert',
      `Do you want to dispatch a triage unit for ${alertItem.pilgrim_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch & Respond',
          style: 'default',
          onPress: async () => {
            Vibration.vibrate(60);
            const { alert: claimed, alreadyClaimed, error } = await claimEmergencyAlert(
              alertItem.id,
              { name: staffName, phone: staffPhone },
            );

            if (alreadyClaimed) {
              Alert.alert('Notice', 'This emergency has already been claimed by another responder.');
              loadLiveAlerts();
              return;
            }

            if (error) {
              Alert.alert('Error', error);
              return;
            }

            if (claimed) {
              setAlerts((prev) => prev.map((a) => (a.id === claimed.id ? claimed : a)));
              Alert.alert(
                'Triage Dispatched',
                `Ambulance & EMT assigned to ${alertItem.pilgrim_name} at ${alertItem.location_name || 'Corridor'}.`,
              );
            }
          },
        },
      ],
    );
  };

  const handleCall = (alertItem: EmergencyAlert) => {
    Alert.alert(
      'Call Pilgrim / Dindi Leader',
      `Calling ${alertItem.pilgrim_phone || '+91 99708 32199'} (${alertItem.dindi_name || 'Dindi'})...`,
    );
  };

  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');
  const unclaimedCount = activeAlerts.filter((a) => a.status === 'nearby').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#8B1E1E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Live Medical Alerts</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSoundEnabled((prev) => !prev)}
          style={[styles.audioToggleBtn, soundEnabled && styles.audioToggleActive]}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={18}
            color={soundEnabled ? '#DC2626' : '#78716C'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Broadcast Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.bannerIconPulse}>
            <Ionicons name="pulse" size={20} color="#DC2626" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerHeading}>Wakhari Sector Dispatch Active</Text>
            <Text style={styles.bannerSubtext}>
              {unclaimedCount} Unclaimed SOS Alerts in Corridor
            </Text>
          </View>
        </View>

        {/* Alerts List */}
        {isLoading && alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#8B1E1E" />
            <Text style={styles.emptyText}>Connecting to Emergency Alert Feed...</Text>
          </View>
        ) : activeAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#15803D" />
            <Text style={styles.emptyTitle}>All Clear in Sector</Text>
            <Text style={styles.emptyText}>No active emergency alerts requiring medical dispatch.</Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {activeAlerts.map((item) => {
              const isClaimed = item.status === 'in_progress';
              const isCritical = item.severity === 'critical';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.alertCard,
                    isCritical ? styles.alertCardCritical : styles.alertCardModerate,
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: isCritical ? '#9E1C1C' : '#D97706',
                        },
                      ]}
                    >
                      <Text style={styles.severityBadgeText}>
                        {(item.priority_level || item.severity).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color="#78716C" />
                      <Text style={styles.timeText}>
                        {item.distance_away || 'Live'}
                      </Text>
                    </View>
                  </View>

                  {/* Pilgrim Info */}
                  <View style={styles.pilgrimInfoSection}>
                    <Text style={styles.pilgrimName}>
                      {item.pilgrim_name}
                      {item.pilgrim_age ? `, ${item.pilgrim_age}` : ''}
                      {item.pilgrim_gender ? ` (${item.pilgrim_gender[0]})` : ''}
                    </Text>
                    <Text style={styles.problemText}>🚨 {item.problem_type}</Text>
                    {item.notes ? (
                      <Text style={styles.notesText}>{item.notes}</Text>
                    ) : null}
                  </View>

                  {/* Location & Dindi */}
                  <View style={styles.metaBox}>
                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={14} color="#C2410C" />
                      <Text style={styles.metaValue}>
                        {item.location_name || 'Palkhi Route'} ({item.distance_away || 'Nearby'})
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="people" size={14} color="#6B5E52" />
                      <Text style={styles.metaValue}>{item.dindi_name || 'Varkari Dindi'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="water" size={14} color="#9E1C1C" />
                      <Text style={styles.metaValue}>
                        Medical Context: {item.medical_context || 'Standard'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleCall(item)}
                      style={styles.callBtn}
                    >
                      <Ionicons name="call" size={15} color="#15803D" style={{ marginRight: 4 }} />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleClaim(item)}
                      style={[
                        styles.claimBtn,
                        isClaimed && styles.claimBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={isClaimed ? 'checkmark-circle' : 'send'}
                        size={15}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.claimBtnText}>
                        {isClaimed
                          ? `Unit En Route (${item.responder_name || 'Assigned'})`
                          : 'Dispatch Unit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FAF5EE',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4D8',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  audioToggleBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5ECE1',
  },
  audioToggleActive: {
    backgroundColor: '#FEE2E2',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bannerIconPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 4,
  },
  alertsList: {
    gap: 14,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  alertCardCritical: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  alertCardModerate: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFEFA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
  },
  pilgrimInfoSection: {
    marginBottom: 10,
  },
  pilgrimName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  problemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginTop: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  metaBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 12,
    color: '#44403C',
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  callBtnText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  claimBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  claimBtnActive: {
    backgroundColor: '#0284C7',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MedicalStaffAlertsScreen;
