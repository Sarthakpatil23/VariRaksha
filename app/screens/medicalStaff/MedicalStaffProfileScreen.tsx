import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';
import { setUserRole } from '../../lib/userStore';

export const MedicalStaffProfileScreen: React.FC<
  MedicalStaffTabScreenProps<'Profile'>
> = ({ navigation }) => {
  const [isOnDuty, setIsOnDuty] = useState<boolean>(true);

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch App Mode',
      'Select a role to preview:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Volunteer', onPress: () => setUserRole('volunteer') },
        { text: 'Pilgrim', onPress: () => setUserRole('varkari') },
        { text: 'Dindi Leader', onPress: () => setUserRole('dindiLeader') },
      ]
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

        <Text style={styles.headerTitle}>Medical Staff Profile</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>AK</Text>
          </View>

          <Text style={styles.doctorName}>Dr. Ananya Kulkarni</Text>
          <Text style={styles.doctorSpecialty}>
            MBBS, DNB (Emergency Medicine) · CMO In-Charge
          </Text>

          <View style={styles.regBadge}>
            <Text style={styles.regBadgeText}>Reg: MMC-2018-09412</Text>
          </View>

          {/* Duty Status Switch */}
          <View style={styles.dutySwitchContainer}>
            <View style={styles.dutyTextCol}>
              <Text style={styles.dutyLabel}>Operational Status</Text>
              <Text style={[styles.dutyStatus, { color: isOnDuty ? '#15803D' : '#B91C1C' }]}>
                {isOnDuty ? '● Active On Duty (Camp Wakhari)' : '○ Off Duty / Resting'}
              </Text>
            </View>

            <Switch
              value={isOnDuty}
              onValueChange={setIsOnDuty}
              trackColor={{ false: '#E2D9CD', true: '#86EFAC' }}
              thumbColor={isOnDuty ? '#15803D' : '#78716C'}
            />
          </View>
        </View>

        {/* Camp & Station Assignment */}
        <Text style={styles.sectionHeading}>STATION & ASSIGNMENT</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={18} color="#8B1E1E" style={{ marginRight: 12 }} />
            <View style={styles.infoRowText}>
              <Text style={styles.infoLabel}>Assigned Medical Camp</Text>
              <Text style={styles.infoValue}>Medical Camp – Wakhari (KM 142)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color="#8B1E1E" style={{ marginRight: 12 }} />
            <View style={styles.infoRowText}>
              <Text style={styles.infoLabel}>Shift Schedule</Text>
              <Text style={styles.infoValue}>Day Shift (08:00 AM – 08:00 PM)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={18} color="#8B1E1E" style={{ marginRight: 12 }} />
            <View style={styles.infoRowText}>
              <Text style={styles.infoLabel}>Triage Authority</Text>
              <Text style={styles.infoValue}>Full Admission & 108 Dispatch Authority</Text>
            </View>
          </View>
        </View>

        {/* Quick Emergency Helplines */}
        <Text style={styles.sectionHeading}>EMERGENCY HELPLINES</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert('Calling 108', 'Connecting to 108 State Dispatch...')}
            style={styles.hotlineRow}
          >
            <View style={styles.hotlineIcon}>
              <MaterialCommunityIcons name="ambulance" size={20} color="#9E1C1C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotlineTitle}>108 Maharashtra Emergency Dispatch</Text>
              <Text style={styles.hotlineSubtitle}>Toll-Free 24x7 Ambulance Helpline</Text>
            </View>
            <Ionicons name="call" size={18} color="#15803D" />
          </TouchableOpacity>
        </View>

        {/* Role Switcher Option */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRoleSwitch}
          style={styles.switchRoleBtn}
        >
          <Ionicons name="swap-horizontal" size={18} color="#8B1E1E" style={{ marginRight: 8 }} />
          <Text style={styles.switchRoleBtnText}>Switch User Role / View</Text>
        </TouchableOpacity>
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
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1917',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DE',
    marginBottom: 20,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E7DEC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D4C5B0',
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4A3E31',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 3,
    textAlign: 'center',
  },
  regBadge: {
    backgroundColor: '#F5ECE1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  regBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B1E1E',
  },
  dutySwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#ECE1D3',
  },
  dutyTextCol: {
    flex: 1,
  },
  dutyLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#78716C',
  },
  dutyStatus: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8C7E72',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    marginBottom: 20,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoRowText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#78716C',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E7DB',
    marginVertical: 8,
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hotlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  hotlineSubtitle: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4C5B0',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  switchRoleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B1E1E',
  },
});

export default MedicalStaffProfileScreen;
