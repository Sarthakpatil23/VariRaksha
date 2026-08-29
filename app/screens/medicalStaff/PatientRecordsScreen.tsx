import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';

interface PatientRecordItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  date: string;
  diagnosis: string;
  treatment: string;
  bloodGroup: string;
  outcome: 'Discharged' | 'Transferred' | 'Under Observation';
  doctor: string;
}

const HISTORICAL_RECORDS: PatientRecordItem[] = [
  {
    id: 'rec-1',
    name: 'Vitthal Kadam',
    age: 60,
    gender: 'Male',
    date: 'Today, 09:30 AM',
    diagnosis: 'Heat Exhaustion & Mild Dehydration',
    treatment: '500ml IV Saline, Oral ORS, Rest 2 hrs',
    bloodGroup: 'O+ ve',
    outcome: 'Discharged',
    doctor: 'Dr. A. Kulkarni',
  },
  {
    id: 'rec-2',
    name: 'Radha Shinde',
    age: 55,
    gender: 'Female',
    date: 'Today, 08:15 AM',
    diagnosis: 'Second Degree Sole Blisters (Both Feet)',
    treatment: 'Aspiration, Betadine Dressing, Neosporin',
    bloodGroup: 'B+ ve',
    outcome: 'Discharged',
    doctor: 'Dr. A. Kulkarni',
  },
  {
    id: 'rec-3',
    name: 'Narayan Joshi',
    age: 69,
    gender: 'Male',
    date: 'Yesterday, 07:45 PM',
    diagnosis: 'Hypertensive Emergency (BP 190/110)',
    treatment: 'Sublingual Amlodipine 10mg, 108 Transfer to Civil Hospital',
    bloodGroup: 'AB+ ve',
    outcome: 'Transferred',
    doctor: 'Dr. S. Kadam',
  },
  {
    id: 'rec-4',
    name: 'Kamal Shelke',
    age: 48,
    gender: 'Female',
    date: 'Yesterday, 04:20 PM',
    diagnosis: 'Hypoglycemia (BSL 54 mg/dL)',
    treatment: '25% Dextrose IV Infusion, Oral Glucose',
    bloodGroup: 'A+ ve',
    outcome: 'Discharged',
    doctor: 'Dr. A. Kulkarni',
  },
];

export const PatientRecordsScreen: React.FC<
  MedicalStaffTabScreenProps<'PatientRecords'>
> = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filtered = HISTORICAL_RECORDS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      r.bloodGroup.toLowerCase().includes(search.toLowerCase())
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

        <Text style={styles.headerTitle}>Camp Patient Records</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#78716C" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search treated patients, diagnosis..."
            placeholderTextColor="#A8A29E"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#78716C" />
            </TouchableOpacity>
          )}
        </View>

        {/* Total Records Counter */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {filtered.length} Consultations (Camp Wakhari)
          </Text>
        </View>

        {/* Records List */}
        <View style={styles.recordsList}>
          {filtered.map((rec) => (
            <View key={rec.id} style={styles.recordCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarText}>
                    {rec.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={styles.patientName}>
                    {rec.name}, {rec.age} ({rec.gender[0]})
                  </Text>
                  <Text style={styles.recordDate}>{rec.date}</Text>
                </View>

                <View
                  style={[
                    styles.outcomeBadge,
                    rec.outcome === 'Discharged'
                      ? styles.outcomeDischarged
                      : styles.outcomeTransferred,
                  ]}
                >
                  <Text
                    style={[
                      styles.outcomeText,
                      rec.outcome === 'Discharged'
                        ? styles.textDischarged
                        : styles.textTransferred,
                    ]}
                  >
                    {rec.outcome}
                  </Text>
                </View>
              </View>

              {/* Diagnosis and Treatment */}
              <View style={styles.detailsBox}>
                <Text style={styles.diagnosisText}>
                  🩺 <Text style={styles.boldText}>Diagnosis:</Text> {rec.diagnosis}
                </Text>
                <Text style={styles.treatmentText}>
                  💊 <Text style={styles.boldText}>Rx:</Text> {rec.treatment}
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.recordFooter}>
                <Text style={styles.footerBlood}>Blood: {rec.bloodGroup}</Text>
                <Text style={styles.footerDoctor}>Treated by {rec.doctor}</Text>
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
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1917',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD5C7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7DEC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3E31',
  },
  nameCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  recordDate: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  outcomeDischarged: {
    backgroundColor: '#DCFCE7',
  },
  outcomeTransferred: {
    backgroundColor: '#FEE2E2',
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textDischarged: {
    color: '#15803D',
  },
  textTransferred: {
    color: '#B91C1C',
  },
  detailsBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  diagnosisText: {
    fontSize: 12,
    color: '#1C1917',
  },
  treatmentText: {
    fontSize: 12,
    color: '#44403C',
  },
  boldText: {
    fontWeight: '700',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBlood: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B1E1E',
  },
  footerDoctor: {
    fontSize: 11,
    color: '#78716C',
  },
});

export default PatientRecordsScreen;
