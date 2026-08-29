import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PatientTriageItem, TriageSeverity } from './TriagePatientCard';

interface NewPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPatient: (newPatient: PatientTriageItem) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  visible,
  onClose,
  onAddPatient,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender] = useState('Male');
  const [condition, setCondition] = useState('');
  const [severity, setSeverity] = useState<TriageSeverity>('moderate');
  const [bloodGroup, setBloodGroup] = useState('O+ ve');
  const [bpVitals, setBpVitals] = useState('');
  const [allergies, setAllergies] = useState('None Known');
  const [medications, setMedications] = useState('None');
  const [bedAssigned, setBedAssigned] = useState('None');

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (fullName.slice(0, 2) || 'PT').toUpperCase();
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newPatient: PatientTriageItem = {
      id: `pt-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age, 10) || 50,
      gender,
      initials: getInitials(name),
      condition: condition.trim() || 'General Medical Evaluation',
      severity,
      iconType: severity === 'critical' ? 'warning' : severity === 'moderate' ? 'kit' : 'heart',
      timestamp: 'Just now',
      milestone: 'received',
      bloodGroup: bloodGroup.trim() || 'Unknown',
      vitals: bpVitals.trim() || 'BP 120/80',
      allergies: allergies.trim() || 'None Known',
      medications: medications.trim() || 'None',
      bedAssigned: bedAssigned === 'None' ? undefined : bedAssigned,
    };

    onAddPatient(newPatient);
    // Reset form
    setName('');
    setAge('');
    setCondition('');
    setSeverity('moderate');
    setBpVitals('');
    setBedAssigned('None');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>New Patient Intake</Text>
              <Text style={styles.modalSubtitle}>Register incoming pilgrim to triage queue</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#57534E" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Name and Age */}
            <View style={styles.inputRow}>
              <View style={{ flex: 2, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Dnyaneshwar Shinde"
                  placeholderTextColor="#A8A29E"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Age *</Text>
                <TextInput
                  style={styles.textInput}
                  value={age}
                  onChangeText={setAge}
                  placeholder="55"
                  keyboardType="numeric"
                  placeholderTextColor="#A8A29E"
                />
              </View>
            </View>

            {/* Severity */}
            <Text style={styles.sectionLabel}>TRIAGE PRIORITY</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'critical', label: 'Critical', color: '#9E1C1C' },
                { key: 'moderate', label: 'Urgent/Moderate', color: '#D97706' },
                { key: 'normal', label: 'Stable', color: '#16A34A' },
              ].map((s) => {
                const isSelected = severity === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSeverity(s.key as TriageSeverity)}
                    style={[
                      styles.severityChip,
                      isSelected && { backgroundColor: s.color, borderColor: s.color },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityChipText,
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chief Complaint / Condition */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chief Complaint / Suspected Diagnosis *</Text>
              <TextInput
                style={styles.textInput}
                value={condition}
                onChangeText={setCondition}
                placeholder="e.g. Heat Exhaustion, Foot Blister, Hypoglycemia"
                placeholderTextColor="#A8A29E"
              />
            </View>

            {/* Blood Group & Vitals */}
            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Blood Group</Text>
                <TextInput
                  style={styles.textInput}
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  placeholder="O+ ve"
                  placeholderTextColor="#A8A29E"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>Initial Vitals</Text>
                <TextInput
                  style={styles.textInput}
                  value={bpVitals}
                  onChangeText={setBpVitals}
                  placeholder="BP 110/70"
                  placeholderTextColor="#A8A29E"
                />
              </View>
            </View>

            {/* Allergies & Current Meds */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Known Allergies</Text>
              <TextInput
                style={styles.textInput}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="None Known"
                placeholderTextColor="#A8A29E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Medications</Text>
              <TextInput
                style={styles.textInput}
                value={medications}
                onChangeText={setMedications}
                placeholder="e.g. Metformin 500mg, Telmisartan 40mg"
                placeholderTextColor="#A8A29E"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              style={[styles.addBtn, !name.trim() && { opacity: 0.5 }]}
              disabled={!name.trim()}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Add to Queue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF5EE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8C7E72',
    marginBottom: 8,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534E',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD5C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1C1917',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  severityChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    paddingVertical: 8,
    borderRadius: 18,
  },
  severityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403C',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DED2',
    backgroundColor: '#FAF5EE',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1C4B2',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534E',
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#8B1E1E',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default NewPatientModal;
