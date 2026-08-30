import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';
import {
  TriagePatientCard,
  PatientTriageItem,
  UpdateStatusModal,
  BedManagementModal,
  AmbulancesModal,
  ActiveCasesModal,
  TriageFilterModal,
  NewPatientModal,
} from '../../components/medicalStaff';
import { EmergencyQRScannerModal } from '../../components/emergency/EmergencyQRScannerModal';

const INITIAL_PATIENTS: PatientTriageItem[] = [
  {
    id: 'pt-1',
    name: 'Ramesh Gaikwad',
    age: 68,
    gender: 'Male',
    initials: 'RG',
    condition: 'Severe Dehydration Suspected',
    severity: 'critical',
    iconType: 'warning',
    timestamp: 'Just now',
    milestone: 'reached',
    bloodGroup: 'O+ ve',
    vitals: 'BP 90/60',
    allergies: 'None Known',
    medications: 'Amlodipine 5mg',
    pulseRate: '104 bpm',
    spo2: '94%',
    bedAssigned: 'Bed #2',
    notes: 'Administered 500ml Normal Saline. Rehydrating.',
  },
  {
    id: 'pt-2',
    name: 'Sunita Kulkarni',
    age: 52,
    gender: 'Female',
    initials: 'SK',
    condition: 'Minor laceration (Foot)',
    severity: 'moderate',
    iconType: 'kit',
    timestamp: '15 mins ago',
    milestone: 'received',
    bloodGroup: 'B+ ve',
    vitals: 'BP 125/82',
    allergies: 'None Known',
    medications: 'Tetanus Toxoid 0.5ml',
    pulseRate: '78 bpm',
    spo2: '98%',
    bedAssigned: 'Bed #6',
    notes: 'Cleaned with Betadine, sterile dressing applied.',
  },
  {
    id: 'pt-3',
    name: 'Mohan Deshmukh',
    age: 45,
    gender: 'Male',
    initials: 'MD',
    condition: 'General Fatigue',
    severity: 'normal',
    iconType: 'pulse',
    timestamp: '45 mins ago',
    milestone: 'received',
    bloodGroup: 'A+ ve',
    vitals: 'BP 118/76',
    allergies: 'Penicillin',
    medications: 'Electral ORS 200ml',
    pulseRate: '72 bpm',
    spo2: '99%',
    notes: 'Resting with electrolytes, discharged shortly.',
  },
  {
    id: 'pt-4',
    name: 'Anandi Shinde',
    age: 62,
    gender: 'Female',
    initials: 'AS',
    condition: 'Diabetic Foot Blister & Dizziness',
    severity: 'moderate',
    iconType: 'kit',
    timestamp: '1 hr ago',
    milestone: 'admitted',
    bloodGroup: 'AB+ ve',
    vitals: 'BP 138/88 · BSL 190',
    allergies: 'Sulfa drugs',
    medications: 'Metformin 500mg',
    pulseRate: '82 bpm',
    spo2: '97%',
    bedAssigned: 'Bed #9',
    notes: 'BSL monitored, wound dressed, resting in Bed 9.',
  },
  {
    id: 'pt-5',
    name: 'Tukaram Borade',
    age: 71,
    gender: 'Male',
    initials: 'TB',
    condition: 'Acute Bronchospasm (Asthma Exacerbation)',
    severity: 'critical',
    iconType: 'warning',
    timestamp: '5 mins ago',
    milestone: 'admitted',
    bloodGroup: 'O+ ve',
    vitals: 'BP 145/95 · SpO2 89%',
    allergies: 'Aspirin',
    medications: 'Nebulized Salbutamol + Budecort',
    pulseRate: '112 bpm',
    spo2: '89%',
    bedAssigned: 'Bed #4 (O2)',
    notes: 'High flow oxygen mask 4L/min active.',
  },
];

export const MedicalStaffDashboardScreen: React.FC<
  MedicalStaffTabScreenProps<'MedicalStaffDashboard'>
> = ({ navigation }) => {
  const [patients, setPatients] = useState<PatientTriageItem[]>(INITIAL_PATIENTS);
  // Expand first patient by default to match reference images!
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>('pt-1');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [selectedPatientForUpdate, setSelectedPatientForUpdate] =
    useState<PatientTriageItem | null>(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState<boolean>(false);
  const [isBedModalVisible, setIsBedModalVisible] = useState<boolean>(false);
  const [isAmbulancesModalVisible, setIsAmbulancesModalVisible] = useState<boolean>(false);
  const [isActiveCasesModalVisible, setIsActiveCasesModalVisible] = useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [isNewPatientModalVisible, setIsNewPatientModalVisible] = useState<boolean>(false);
  const [scannerModalVisible, setScannerModalVisible] = useState<boolean>(false);

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterMilestone, setFilterMilestone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleToggleExpand = (patientId: string) => {
    setExpandedPatientId((prev) => (prev === patientId ? null : patientId));
  };

  const handleOpenUpdateStatus = (patient: PatientTriageItem) => {
    setSelectedPatientForUpdate(patient);
    setIsUpdateModalVisible(true);
  };

  const handleSavePatientStatus = (updated: PatientTriageItem) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    Alert.alert('Status Updated', `Patient record for ${updated.name} successfully updated.`);
  };

  const handleAddNewPatient = (newPatient: PatientTriageItem) => {
    setPatients((prev) => [newPatient, ...prev]);
    setExpandedPatientId(newPatient.id);
    Alert.alert('Patient Admitted', `${newPatient.name} added to Triage Queue.`);
  };

  const filteredPatients = patients.filter((p) => {
    if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
    if (filterMilestone !== 'all' && p.milestone !== filterMilestone) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCond = p.condition.toLowerCase().includes(q);
      const matchBlood = p.bloodGroup.toLowerCase().includes(q);
      return matchName || matchCond || matchBlood;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP HEADER / APP BAR */}
      <View style={styles.topNavbar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navIconBtn}
          onPress={() => {
            Alert.alert(
              'Camp Menu',
              'Medical Camp – Wakhari Quick Actions:\n• Emergency Hotline: 108\n• District CMO: Dr. S. Kadam\n• Oxygen Supply: Normal (12 Cylinders)',
            );
          }}
        >
          <Ionicons name="menu-outline" size={26} color="#8B1E1E" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>VariRaksha</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={32} color="#E85D38" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B1E1E"
            colors={['#8B1E1E']}
          />
        }
      >
        {/* 2. CAMP TITLE & LOCATION BANNER */}
        <View style={styles.campHeaderSection}>
          <Text style={styles.campTitle}>Medical Camp – Wakhari</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={15} color="#C2410C" />
            <Text style={styles.locationText}>
              Pune-Pandharpur Route, KM 142
            </Text>
          </View>

          {/* Beds Available Capsule Badge */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsBedModalVisible(true)}
            style={styles.bedsCapsule}
          >
            <View style={styles.greenDot} />
            <Text style={styles.bedsText}>Beds: 8/12 available</Text>
          </TouchableOpacity>

          {/* SCAN INCOMING PATIENT QR PASS BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setScannerModalVisible(true)}
            style={styles.scanPatientQRBtn}
          >
            <View style={styles.scanPatientIconBox}>
              <Ionicons name="qr-code" size={18} color="#8B1E1E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scanPatientTitle}>Scan Patient Emergency Pass (QR)</Text>
              <Text style={styles.scanPatientSubtitle}>
                Auto-load blood group, medical history, allergies, or trigger direct SOS
              </Text>
            </View>
            <Ionicons name="scan" size={20} color="#8B1E1E" />
          </TouchableOpacity>
        </View>

        {/* 3. METRIC SUMMARY CARDS */}
        <View style={styles.metricsContainer}>
          {/* Metric 1: Active Cases */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsActiveCasesModalVisible(true)}
            style={styles.metricCard}
          >
            <View style={styles.metricIconCircle}>
              <MaterialCommunityIcons name="bed-outline" size={24} color="#9E1C1C" />
            </View>

            <View style={styles.metricInfoCol}>
              <Text style={styles.metricLabel}>Active Cases</Text>
              <Text style={styles.metricCount}>{patients.length}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
          </TouchableOpacity>

          {/* Metric 2: Ambulances Nearby */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsAmbulancesModalVisible(true)}
            style={styles.metricCard}
          >
            <View style={styles.metricIconCircle}>
              <MaterialCommunityIcons name="ambulance" size={24} color="#9E1C1C" />
            </View>

            <View style={styles.metricInfoCol}>
              <Text style={styles.metricLabel}>Ambulances Nearby</Text>
              <Text style={styles.metricCount}>2</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
          </TouchableOpacity>
        </View>

        {/* 4. TRIAGE QUEUE SECTION HEADER */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Triage Queue</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsFilterModalVisible(true)}
            style={styles.filterBtn}
          >
            <Ionicons name="options-outline" size={16} color="#8B1E1E" style={{ marginRight: 4 }} />
            <Text style={styles.filterBtnText}>Filter</Text>
            {(filterSeverity !== 'all' || filterMilestone !== 'all' || searchQuery.length > 0) && (
              <View style={styles.filterActiveDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* 5. PATIENT CARDS LIST */}
        <View style={styles.cardsList}>
          {filteredPatients.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#C4B5A5" />
              <Text style={styles.emptyStateTitle}>No patients match filters</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Filter" to reset or search by another term.
              </Text>
            </View>
          ) : (
            filteredPatients.map((patient) => (
              <TriagePatientCard
                key={patient.id}
                patient={patient}
                isExpanded={expandedPatientId === patient.id}
                onToggleExpand={() => handleToggleExpand(patient.id)}
                onUpdateStatus={handleOpenUpdateStatus}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON: NEW PATIENT INTAKE */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsNewPatientModalVisible(true)}
        style={styles.fabBtn}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabBtnText}>New Intake</Text>
      </TouchableOpacity>

      {/* MODALS */}
      <UpdateStatusModal
        visible={isUpdateModalVisible}
        patient={selectedPatientForUpdate}
        onClose={() => setIsUpdateModalVisible(false)}
        onSave={handleSavePatientStatus}
      />

      <BedManagementModal
        visible={isBedModalVisible}
        onClose={() => setIsBedModalVisible(false)}
      />

      <AmbulancesModal
        visible={isAmbulancesModalVisible}
        onClose={() => setIsAmbulancesModalVisible(false)}
      />

      <ActiveCasesModal
        visible={isActiveCasesModalVisible}
        patients={patients}
        onClose={() => setIsActiveCasesModalVisible(false)}
        onSelectPatient={(p) => {
          setExpandedPatientId(p.id);
        }}
      />

      <TriageFilterModal
        visible={isFilterModalVisible}
        selectedSeverity={filterSeverity}
        selectedMilestone={filterMilestone}
        searchQuery={searchQuery}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(f) => {
          setFilterSeverity(f.severity);
          setFilterMilestone(f.milestone);
          setSearchQuery(f.searchQuery);
        }}
        onReset={() => {
          setFilterSeverity('all');
          setFilterMilestone('all');
          setSearchQuery('');
        }}
      />

      <NewPatientModal
        visible={isNewPatientModalVisible}
        onClose={() => setIsNewPatientModalVisible(false)}
        onAddPatient={handleAddNewPatient}
      />

      {/* UNIVERSAL EMERGENCY QR SCANNER MODAL */}
      <EmergencyQRScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        reporterRole="Medical Camp Doctor"
      />
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
    paddingVertical: 10,
    backgroundColor: '#FAF5EE',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4D8',
  },
  navIconBtn: {
    padding: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E85D38',
    letterSpacing: -0.5,
  },
  profileBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90,
  },
  campHeaderSection: {
    marginBottom: 16,
  },
  campTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#57534E',
    marginLeft: 6,
    fontWeight: '500',
  },
  bedsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D6C6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  bedsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  metricInfoCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  metricCount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#9E1C1C',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'relative',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B1E1E',
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginLeft: 4,
  },
  cardsList: {
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#44403C',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B1E1E',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 26,
    shadowColor: '#8B1E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Scan Patient Pass Button
  scanPatientQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F3E8DF',
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    gap: 10,
    shadowColor: '#8B1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scanPatientIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanPatientTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B1E1E',
  },
  scanPatientSubtitle: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default MedicalStaffDashboardScreen;
