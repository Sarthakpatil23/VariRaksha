import React, { useState, useEffect } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PatientTriageItem, TriageMilestone, TriageSeverity } from './TriagePatientCard';

interface UpdateStatusModalProps {
  visible: boolean;
  patient: PatientTriageItem | null;
  onClose: () => void;
  onSave: (updatedPatient: PatientTriageItem) => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  visible,
  patient,
  onClose,
  onSave,
}) => {
  if (!patient) return null;

  const [milestone, setMilestone] = useState<TriageMilestone>(patient.milestone);
  const [severity, setSeverity] = useState<TriageSeverity>(patient.severity);
  const [vitals, setVitals] = useState<string>(patient.vitals);
  const [medications, setMedications] = useState<string>(patient.medications);
  const [allergies, setAllergies] = useState<string>(patient.allergies);
  const [bedAssigned, setBedAssigned] = useState<string>(patient.bedAssigned || 'None');
  const [treatmentNotes, setTreatmentNotes] = useState<string>(patient.notes || '');

  useEffect(() => {
    if (patient) {
      setMilestone(patient.milestone);
      setSeverity(patient.severity);
      setVitals(patient.vitals);
      setMedications(patient.medications);
      setAllergies(patient.allergies);
      setBedAssigned(patient.bedAssigned || 'None');
      setTreatmentNotes(patient.notes || '');
    }
  }, [patient]);

  const handleSave = () => {
    onSave({
      ...patient,
      milestone,
      severity,
      vitals,
      medications,
      allergies,
      bedAssigned: bedAssigned === 'None' ? undefined : bedAssigned,
      notes: treatmentNotes,
    });
    onClose();
  };

  const milestoneOptions: { key: TriageMilestone; label: string; icon: any }[] = [
    { key: 'received', label: 'Received', icon: 'checkbox-outline' },
    { key: 'dispatched', label: 'Dispatched', icon: 'paper-plane-outline' },
    { key: 'reached', label: 'Reached', icon: 'location-outline' },
    { key: 'admitted', label: 'Admitted', icon: 'bed-outline' },
  ];

  const severityOptions: { key: TriageSeverity; label: string; color: string }[] = [
    { key: 'critical', label: 'Critical', color: '#9E1C1C' },
    { key: 'moderate', label: 'Urgent/Moderate', color: '#D97706' },
    { key: 'normal', label: 'Stable', color: '#16A34A' },
  ];

  const bedOptions = ['None', 'Bed #1', 'Bed #3', 'Bed #5', 'Bed #7', 'Bed #8', 'Bed #11', 'Bed #12'];

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
              <Text style={styles.modalTitle}>Update Patient Status</Text>
              <Text style={styles.modalSubtitle}>
                {patient.name}, {patient.age} yrs · {patient.bloodGroup}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#57534E" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Stage / Milestone Selector */}
            <Text style={styles.sectionLabel}>STAGE / MILESTONE</Text>
            <View style={styles.chipsRow}>
              {milestoneOptions.map((opt) => {
                const isSelected = milestone === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    onPress={() => setMilestone(opt.key)}
                    style={[
                      styles.milestoneChip,
                      isSelected && styles.milestoneChipSelected,
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : '#6B5E52'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.milestoneChipText,
                        isSelected && styles.milestoneChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Triage Severity */}
            <Text style={styles.sectionLabel}>TRIAGE PRIORITY</Text>
            <View style={styles.chipsRow}>
              {severityOptions.map((opt) => {
                const isSelected = severity === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    onPress={() => setSeverity(opt.key)}
                    style={[
                      styles.severityChip,
                      isSelected && {
                        backgroundColor: opt.color,
                        borderColor: opt.color,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.severityDot,
                        {
                          backgroundColor: isSelected ? '#FFFFFF' : opt.color,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.severityChipText,
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Vitals & Clinical Readings */}
            <Text style={styles.sectionLabel}>LATEST VITALS</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Blood Pressure & Vitals</Text>
              <TextInput
                style={styles.textInput}
                value={vitals}
                onChangeText={setVitals}
                placeholder="e.g. BP 90/60, SpO2 96%, Pulse 84"
                placeholderTextColor="#A8A29E"
              />
            </View>

            {/* 4. Bed Allocation */}
            <Text style={styles.sectionLabel}>BED ALLOCATION (CAMP WAKHARI)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bedsScroll}>
              {bedOptions.map((b) => {
                const isSelected = bedAssigned === b;
                return (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setBedAssigned(b)}
                    style={[
                      styles.bedChip,
                      isSelected && styles.bedChipSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bed"
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#8B1E1E'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.bedChipText,
                        isSelected && styles.bedChipTextSelected,
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 5. Medications Administered */}
            <Text style={styles.sectionLabel}>MEDICATIONS & ALLERGIES</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Active Medications / IV fluids</Text>
              <TextInput
                style={styles.textInput}
                value={medications}
                onChangeText={setMedications}
                placeholder="e.g. IV Normal Saline 500ml, ORS"
                placeholderTextColor="#A8A29E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Known Allergies</Text>
              <TextInput
                style={styles.textInput}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. None Known, Sulfa drugs"
                placeholderTextColor="#A8A29E"
              />
            </View>

            {/* 6. Clinical Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doctor / Staff Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={treatmentNotes}
                onChangeText={setTreatmentNotes}
                placeholder="Enter clinical assessment, rehydration status, or transfer instructions..."
                placeholderTextColor="#A8A29E"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={styles.saveBtn}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Updates</Text>
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
    maxHeight: '90%',
    paddingBottom: 24,
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
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8C7E72',
    marginBottom: 8,
    marginTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  milestoneChipSelected: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
  },
  milestoneChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
  },
  milestoneChipTextSelected: {
    color: '#FFFFFF',
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  severityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
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
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  bedsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  bedChipSelected: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
  },
  bedChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
  },
  bedChipTextSelected: {
    color: '#FFFFFF',
  },
  footerRow: {
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
    fontSize: 15,
    fontWeight: '600',
    color: '#57534E',
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#8B1E1E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
    shadowColor: '#8B1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default UpdateStatusModal;
