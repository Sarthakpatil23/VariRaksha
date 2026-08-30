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
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';
import {
  fetchEmergencyAlerts,
  claimEmergencyAlert,
  subscribeToEmergencyAlerts,
  updateGoldenHourPrep,
  acceptPatientTransfer,
  dispatch108Ambulance,
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

  // Referral Modal State
  const [referralModalVisible, setReferralModalVisible] = useState<boolean>(false);
  const [selectedReferralAlert, setSelectedReferralAlert] = useState<EmergencyAlert | null>(null);

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
      'Dispatch Triage Unit',
      `Dispatch mobile medical responder / ambulance to ${alertItem.pilgrim_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Unit',
          style: 'default',
          onPress: async () => {
            Vibration.vibrate(60);
            const { alert: claimed, alreadyClaimed, error } = await claimEmergencyAlert(
              alertItem.id,
              { name: staffName, phone: staffPhone },
            );

            if (alreadyClaimed) {
              Alert.alert('Notice', 'This alert has already been claimed by another responder.');
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
                'Triage Unit Dispatched',
                `Mobile response team assigned to ${alertItem.pilgrim_name} at ${alertItem.location_name || 'Corridor'}.`,
              );
            }
          },
        },
      ],
    );
  };

  const handleCall = (alertItem: EmergencyAlert) => {
    const phone = alertItem.pilgrim_phone || alertItem.responder_phone || '+91 99708 32199';
    Vibration.vibrate(30);
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Call Contact', `Calling ${phone}...`);
    });
  };

  // 1. Toggle Golden Hour Pre-Arrival Checklist item
  const handleTogglePrep = async (
    alertItem: EmergencyAlert,
    key: 'oxygenBedReady' | 'ivLineReady' | 'doctorReady',
  ) => {
    Vibration.vibrate(30);
    const currentPrep = alertItem.golden_hour_prep || {};
    const updatedPrep = {
      ...currentPrep,
      [key]: !currentPrep[key],
    };

    // Update state immediately
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertItem.id ? { ...a, golden_hour_prep: updatedPrep } : a,
      ),
    );

    // Sync to database
    await updateGoldenHourPrep(alertItem.id, updatedPrep);
  };

  // 2. 1-Tap Transfer Acceptance (Frees volunteer & admits to camp)
  const handleAcceptTransfer = (alertItem: EmergencyAlert) => {
    Alert.alert(
      '🤝 Accept Patient & Transfer Care',
      `Confirm transfer of ${alertItem.pilgrim_name} into Wakhari Sector 1 Medical Camp?\n\nThis will release volunteer ${alertItem.responder_name || 'Responder'} back to corridor duty.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Admit',
          style: 'default',
          onPress: async () => {
            Vibration.vibrate(60);
            const { success, alert: admitted, error } = await acceptPatientTransfer(
              alertItem.id,
              { name: staffName, bedAssigned: 'Bed #2 (O2)' },
            );

            if (error || !success) {
              Alert.alert('Notice', error || 'Failed to accept transfer');
            }

            if (admitted) {
              setAlerts((prev) => prev.map((a) => (a.id === admitted.id ? admitted : a)));
            }

            Alert.alert(
              'Transfer Complete',
              `Patient ${alertItem.pilgrim_name} is now admitted under observation.\nVolunteer ${alertItem.responder_name || ''} has been freed.`,
            );
          },
        },
      ],
    );
  };

  // 3. 1-Tap 108 Ambulance Dispatch / Refer to Civil Hospital
  const handleReferralPress = (alertItem: EmergencyAlert) => {
    setSelectedReferralAlert(alertItem);
    setReferralModalVisible(true);
  };

  const handleConfirm108Dispatch = async () => {
    if (!selectedReferralAlert) return;
    const targetAlert = selectedReferralAlert;
    setReferralModalVisible(false);
    Vibration.vibrate(60);

    const { success, alert: referred, error } = await dispatch108Ambulance(
      targetAlert.id,
      'Pandharpur Sub-District / Civil Hospital',
    );

    if (referred) {
      setAlerts((prev) => prev.map((a) => (a.id === referred.id ? referred : a)));
    }

    // Trigger phone call to 108 Emergency
    Linking.openURL('tel:108').catch(() => {
      Alert.alert('108 Dispatch', 'Dialing 108 Emergency Ambulance...');
    });
  };

  // Categorize alerts
  const incomingTransfers = alerts.filter(
    (a) => a.status === 'transferring_to_medical',
  );
  const admittedPatients = alerts.filter(
    (a) => a.status === 'admitted_at_camp' || a.status === 'referred_hospital',
  );
  const corridorAlerts = alerts.filter(
    (a) => a.status === 'nearby' || a.status === 'in_progress',
  );

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

        <Text style={styles.headerTitle}>Live Medical Triage</Text>

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
            <Text style={styles.bannerHeading}>Wakhari Sector 1 Medical Post</Text>
            <Text style={styles.bannerSubtext}>
              {incomingTransfers.length} Incoming Transfers · {corridorAlerts.length} Active Corridor Alerts
            </Text>
          </View>
        </View>

        {/* 1. 🏥 PRE-ARRIVAL TRIAGE & "GOLDEN HOUR" PREPARATION */}
        {incomingTransfers.length > 0 && (
          <View style={styles.goldenHourSection}>
            <View style={styles.sectionHeaderBadge}>
              <Ionicons name="timer" size={18} color="#DC2626" />
              <Text style={styles.goldenHourHeading}>
                🚨 INCOMING PATIENT TRANSFERS ({incomingTransfers.length})
              </Text>
            </View>

            {incomingTransfers.map((item) => {
              const prep = item.golden_hour_prep || {};

              return (
                <View key={item.id} style={styles.incomingTransferCard}>
                  {/* Card Header & Live ETA */}
                  <View style={styles.transferHeaderRow}>
                    <View style={styles.incomingBadgePulse}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.incomingBadgeText}>TRANSFER EN ROUTE</Text>
                    </View>
                    <View style={styles.etaBox}>
                      <Ionicons name="walk" size={14} color="#C2410C" />
                      <Text style={styles.etaText}>~2 mins (400m)</Text>
                    </View>
                  </View>

                  {/* Pilgrim & Volunteer Transfer Details */}
                  <View style={styles.transferDetailBox}>
                    <Text style={styles.transferPilgrimName}>
                      {item.pilgrim_name} ({item.pilgrim_age || 62} yrs, {item.pilgrim_gender || 'Male'})
                    </Text>
                    <Text style={styles.transferReasonText}>
                      🚨 Reason: {item.escalation_reason || item.problem_type}
                    </Text>
                    <Text style={styles.transferVolunteerText}>
                      🧑‍🤝‍🧑 Bringing by Volunteer: {item.responder_name || 'Assigned Volunteer'} ({item.responder_phone || '+91 98221 55660'})
                    </Text>
                  </View>

                  {/* 🩸 CRITICAL MEDICAL ID FLASH */}
                  <View style={styles.medicalIdFlashBox}>
                    <Text style={styles.medicalIdFlashTitle}>🩸 CRITICAL MEDICAL ID FLASH</Text>
                    <View style={styles.medicalPillsRow}>
                      <View style={styles.bloodGroupPill}>
                        <Text style={styles.bloodGroupPillText}>
                          🩸 Blood: B+ ve
                        </Text>
                      </View>
                      <View style={styles.allergyPill}>
                        <Text style={styles.allergyPillText}>
                          ⚠️ Allergies: Peanut / Sulfa
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.chronicHistoryText}>
                      🏥 Known Conditions: Hypertension / BP (Amlodipine 5mg)
                    </Text>
                  </View>

                  {/* ⏱️ "GOLDEN HOUR" PREPAREDNESS CHECKLIST */}
                  <View style={styles.prepChecklistSection}>
                    <Text style={styles.prepChecklistTitle}>
                      ⚡ Pre-Arrival Preparedness Checklist:
                    </Text>
                    <View style={styles.prepTogglesRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleTogglePrep(item, 'oxygenBedReady')}
                        style={[
                          styles.prepToggleBtn,
                          prep.oxygenBedReady && styles.prepToggleBtnActive,
                        ]}
                      >
                        <Ionicons
                          name={prep.oxygenBedReady ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={prep.oxygenBedReady ? '#15803D' : '#78716C'}
                        />
                        <Text
                          style={[
                            styles.prepToggleBtnText,
                            prep.oxygenBedReady && styles.prepToggleBtnTextActive,
                          ]}
                        >
                          Oxygen Bed Ready
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleTogglePrep(item, 'ivLineReady')}
                        style={[
                          styles.prepToggleBtn,
                          prep.ivLineReady && styles.prepToggleBtnActive,
                        ]}
                      >
                        <Ionicons
                          name={prep.ivLineReady ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={prep.ivLineReady ? '#15803D' : '#78716C'}
                        />
                        <Text
                          style={[
                            styles.prepToggleBtnText,
                            prep.ivLineReady && styles.prepToggleBtnTextActive,
                          ]}
                        >
                          IV Saline Line
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleTogglePrep(item, 'doctorReady')}
                        style={[
                          styles.prepToggleBtn,
                          prep.doctorReady && styles.prepToggleBtnActive,
                        ]}
                      >
                        <Ionicons
                          name={prep.doctorReady ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={prep.doctorReady ? '#15803D' : '#78716C'}
                        />
                        <Text
                          style={[
                            styles.prepToggleBtnText,
                            prep.doctorReady && styles.prepToggleBtnTextActive,
                          ]}
                        >
                          Doctor Ready
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ACTION BUTTONS: ACCEPT TRANSFER & 1-TAP 108 REFERRAL */}
                  <View style={styles.incomingActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleAcceptTransfer(item)}
                      style={styles.acceptTransferBtn}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.acceptTransferBtnText}>
                        🤝 Accept Patient (Transfer Care)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleReferralPress(item)}
                      style={styles.referHospitalBtn}
                    >
                      <Ionicons name="medical" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.referHospitalBtnText}>
                        🚑 108 Referral
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 2. ADMITTED PATIENTS IN CAMP */}
        {admittedPatients.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.subSectionTitle}>
              🏥 ADMITTED IN CAMP ({admittedPatients.length})
            </Text>
            {admittedPatients.map((item) => (
              <View key={item.id} style={styles.admittedCard}>
                <View style={styles.admittedCardHeader}>
                  <Text style={styles.admittedName}>{item.pilgrim_name}</Text>
                  <View
                    style={[
                      styles.admittedStatusBadge,
                      item.status === 'referred_hospital' && { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.admittedStatusText,
                        item.status === 'referred_hospital' && { color: '#DC2626' },
                      ]}
                    >
                      {item.status === 'referred_hospital'
                        ? '108 AMBULANCE DISPATCHED'
                        : 'ADMITTED (BED #2)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.admittedNotes}>
                  Attending Doctor: {item.attending_doctor || staffName} · {item.notes || 'Under hydration observation'}
                </Text>
                {item.referral_hospital_name && (
                  <Text style={styles.referredHospitalText}>
                    🚑 Referred to: {item.referral_hospital_name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 3. ACTIVE SECTOR CORRIDOR ALERTS */}
        <Text style={styles.subSectionTitle}>
          🚨 ACTIVE CORRIDOR ALERTS ({corridorAlerts.length})
        </Text>

        {isLoading && alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#8B1E1E" />
            <Text style={styles.emptyText}>Connecting to Emergency Alert Feed...</Text>
          </View>
        ) : corridorAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#15803D" />
            <Text style={styles.emptyTitle}>All Clear in Sector</Text>
            <Text style={styles.emptyText}>No active alerts requiring mobile dispatch.</Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {corridorAlerts.map((item) => {
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

      {/* 🚑 108 AMBULANCE & HIGHER CENTER REFERRAL MODAL */}
      <Modal
        visible={referralModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReferralModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.referralModalCard}>
            <View style={styles.referralHeader}>
              <View style={styles.ambulanceIconBox}>
                <Ionicons name="medical" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralTitle}>108 Emergency Ambulance</Text>
                <Text style={styles.referralSubtitle}>
                  Higher Center Referral · Pandharpur Civil Hospital
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReferralModalVisible(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={20} color="#78716C" />
              </TouchableOpacity>
            </View>

            {selectedReferralAlert && (
              <View style={styles.referralSummaryBox}>
                <Text style={styles.summaryHeading}>Digital Transfer Summary:</Text>
                <Text style={styles.summaryRow}>👤 Patient: {selectedReferralAlert.pilgrim_name} ({selectedReferralAlert.pilgrim_age || 62} yrs, M)</Text>
                <Text style={styles.summaryRow}>🚨 Triage Reason: {selectedReferralAlert.escalation_reason || selectedReferralAlert.problem_type}</Text>
                <Text style={styles.summaryRow}>🩸 Blood: B+ ve · Allergies: Peanut, Sulfa</Text>
                <Text style={styles.summaryRow}>🏥 Transfer Center: Pandharpur Sub-District / Civil Hospital</Text>
                <Text style={styles.summaryRow}>📍 Current GPS: 17.7145° N, 75.2440° E (Wakhari Medical Post)</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm108Dispatch}
              style={styles.dispatch108Btn}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.dispatch108BtnText}>
                Confirm & Dial 108 Ambulance Dispatch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setReferralModalVisible(false)}
              style={styles.cancelReferralBtn}
            >
              <Text style={styles.cancelReferralText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Golden Hour Pre-Arrival Section
  goldenHourSection: {
    marginBottom: 20,
  },
  sectionHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  goldenHourHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  incomingTransferCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FDBA74',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  transferHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incomingBadgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  incomingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  transferDetailBox: {
    marginBottom: 12,
  },
  transferPilgrimName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  transferReasonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 3,
  },
  transferVolunteerText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 3,
    fontWeight: '600',
  },

  // Medical ID Flash Box
  medicalIdFlashBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12,
  },
  medicalIdFlashTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  medicalPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bloodGroupPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bloodGroupPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  allergyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  chronicHistoryText: {
    fontSize: 12,
    color: '#44403C',
    fontWeight: '600',
  },

  // Preparedness Checklist
  prepChecklistSection: {
    marginBottom: 14,
  },
  prepChecklistTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 8,
  },
  prepTogglesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  prepToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  prepToggleBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  prepToggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  prepToggleBtnTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },

  // Incoming Actions Row
  incomingActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptTransferBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  acceptTransferBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  referHospitalBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  referHospitalBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  // Admitted Section
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#57534E',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  admittedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 10,
  },
  admittedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  admittedName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  admittedStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  admittedStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  admittedNotes: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 2,
  },
  referredHospitalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 4,
  },

  // Standard Alerts
  emptyContainer: {
    paddingVertical: 30,
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

  // Referral Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  referralModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ambulanceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  referralSubtitle: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 2,
  },
  referralSummaryBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 16,
    gap: 6,
  },
  summaryHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  summaryRow: {
    fontSize: 12,
    color: '#44403C',
    lineHeight: 17,
  },
  dispatch108Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dispatch108BtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelReferralBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelReferralText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716C',
  },
});

export default MedicalStaffAlertsScreen;
