import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';

interface EmergencyAlertItem {
  id: string;
  pilgrimName: string;
  age: number;
  gender: string;
  problemType: string;
  severity: 'critical' | 'moderate' | 'normal';
  distance: string;
  location: string;
  dindiName: string;
  contactNumber: string;
  timestamp: string;
  bloodGroup: string;
  isClaimed: boolean;
}

const INITIAL_ALERTS: EmergencyAlertItem[] = [
  {
    id: 'alt-1',
    pilgrimName: 'Pandurang Bhosale',
    age: 64,
    gender: 'Male',
    problemType: 'Chest Discomfort & High BP',
    severity: 'critical',
    distance: '650m away',
    location: 'Near Wakhari Toll Plaza, KM 141.8',
    dindiName: 'Sant Tukaram Palkhi (Dindi #18)',
    contactNumber: '+91 98220 12345',
    timestamp: '2 mins ago',
    bloodGroup: 'B+ ve',
    isClaimed: false,
  },
  {
    id: 'alt-2',
    pilgrimName: 'Shobha Jadhav',
    age: 58,
    gender: 'Female',
    problemType: 'Severe Dizziness & Heat Stroke',
    severity: 'critical',
    distance: '1.1 km away',
    location: 'Bhandishegaon Palkhi Halt',
    dindiName: 'Sant Dnyaneshwar Palkhi (Dindi #4)',
    contactNumber: '+91 94231 67890',
    timestamp: '7 mins ago',
    bloodGroup: 'O+ ve',
    isClaimed: true,
  },
  {
    id: 'alt-3',
    pilgrimName: 'Kashinath Shinde',
    age: 72,
    gender: 'Male',
    problemType: 'Severe Foot Infection / Blister Rupture',
    severity: 'moderate',
    distance: '1.4 km away',
    location: 'Near Water Tanker #3',
    dindiName: 'Sant Eknath Dindi (#7)',
    contactNumber: '+91 98211 44556',
    timestamp: '18 mins ago',
    bloodGroup: 'A+ ve',
    isClaimed: false,
  },
];

export const MedicalStaffAlertsScreen: React.FC<
  MedicalStaffTabScreenProps<'Alerts'>
> = ({ navigation }) => {
  const [alerts, setAlerts] = useState<EmergencyAlertItem[]>(INITIAL_ALERTS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleClaim = (alertItem: EmergencyAlertItem) => {
    Alert.alert(
      'Respond to Medical Alert',
      `Do you want to dispatch a triage unit for ${alertItem.pilgrimName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch & Respond',
          style: 'default',
          onPress: () => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === alertItem.id ? { ...a, isClaimed: true } : a
              )
            );
            Alert.alert(
              'Triage Dispatched',
              `Ambulance & EMT assigned to ${alertItem.pilgrimName} at ${alertItem.location}.`
            );
          },
        },
      ]
    );
  };

  const handleCall = (alertItem: EmergencyAlertItem) => {
    Alert.alert(
      'Call Pilgrim / Dindi Leader',
      `Calling ${alertItem.contactNumber} (${alertItem.dindiName})...`
    );
  };

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
              {alerts.filter((a) => !a.isClaimed).length} Unclaimed SOS Alerts within 2km radius
            </Text>
          </View>
        </View>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {alerts.map((item) => (
            <View
              key={item.id}
              style={[
                styles.alertCard,
                item.severity === 'critical'
                  ? styles.alertCardCritical
                  : styles.alertCardModerate,
              ]}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        item.severity === 'critical' ? '#9E1C1C' : '#D97706',
                    },
                  ]}
                >
                  <Text style={styles.severityBadgeText}>
                    {item.severity.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={12} color="#78716C" />
                  <Text style={styles.timeText}>{item.timestamp}</Text>
                </View>
              </View>

              {/* Pilgrim Info */}
              <View style={styles.pilgrimInfoSection}>
                <Text style={styles.pilgrimName}>
                  {item.pilgrimName}, {item.age} ({item.gender[0]})
                </Text>
                <Text style={styles.problemText}>🚨 {item.problemType}</Text>
              </View>

              {/* Location & Dindi */}
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Ionicons name="location" size={14} color="#C2410C" />
                  <Text style={styles.metaValue}>{item.location} ({item.distance})</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="people" size={14} color="#6B5E52" />
                  <Text style={styles.metaValue}>{item.dindiName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="water" size={14} color="#9E1C1C" />
                  <Text style={styles.metaValue}>Blood: {item.bloodGroup}</Text>
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
                    item.isClaimed && styles.claimBtnActive,
                  ]}
                >
                  <Ionicons
                    name={item.isClaimed ? 'checkmark-circle' : 'send'}
                    size={15}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.claimBtnText}>
                    {item.isClaimed ? 'Unit En Route' : 'Dispatch Unit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
    fontWeight: '700',
    color: '#991B1B',
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  alertCardCritical: {
    borderLeftColor: '#9E1C1C',
  },
  alertCardModerate: {
    borderLeftColor: '#D97706',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#78716C',
  },
  pilgrimInfoSection: {
    marginBottom: 8,
  },
  pilgrimName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
  },
  problemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B1E1E',
    marginTop: 3,
  },
  metaBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaValue: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  claimBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B1E1E',
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimBtnActive: {
    backgroundColor: '#15803D',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MedicalStaffAlertsScreen;
