import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PatientTriageItem } from './TriagePatientCard';

interface ActiveCasesModalProps {
  visible: boolean;
  onClose: () => void;
  patients: PatientTriageItem[];
  onSelectPatient: (patient: PatientTriageItem) => void;
}

export const ActiveCasesModal: React.FC<ActiveCasesModalProps> = ({
  visible,
  onClose,
  patients,
  onSelectPatient,
}) => {
  const criticalCount = patients.filter((p) => p.severity === 'critical').length;
  const moderateCount = patients.filter((p) => p.severity === 'moderate' || p.severity === 'urgent').length;
  const stableCount = patients.filter((p) => p.severity === 'normal').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Active Medical Cases ({patients.length})</Text>
              <Text style={styles.modalSubtitle}>
                Medical Camp – Wakhari Triage Roster
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#57534E" />
            </TouchableOpacity>
          </View>

          {/* Severity Counters Bar */}
          <View style={styles.countersBar}>
            <View style={styles.counterItem}>
              <Text style={[styles.counterNumber, { color: '#9E1C1C' }]}>{criticalCount}</Text>
              <Text style={styles.counterLabel}>Critical</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterItem}>
              <Text style={[styles.counterNumber, { color: '#D97706' }]}>{moderateCount}</Text>
              <Text style={styles.counterLabel}>Moderate</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterItem}>
              <Text style={[styles.counterNumber, { color: '#16A34A' }]}>{stableCount}</Text>
              <Text style={styles.counterLabel}>Stable</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.8}
                onPress={() => {
                  onSelectPatient(p);
                  onClose();
                }}
                style={[
                  styles.patientItemCard,
                  {
                    borderLeftColor:
                      p.severity === 'critical'
                        ? '#9E1C1C'
                        : p.severity === 'moderate'
                        ? '#D97706'
                        : '#16A34A',
                  },
                ]}
              >
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarInitials}>{p.initials}</Text>
                </View>

                <View style={styles.patientMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.patientNameText}>
                      {p.name}, {p.age}
                    </Text>
                    <View
                      style={[
                        styles.milestoneTag,
                        {
                          backgroundColor:
                            p.milestone === 'admitted'
                              ? '#DCFCE7'
                              : p.milestone === 'reached'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.milestoneTagText,
                          {
                            color:
                              p.milestone === 'admitted'
                                ? '#15803D'
                                : p.milestone === 'reached'
                                ? '#B45309'
                                : '#B91C1C',
                          },
                        ]}
                      >
                        {p.milestone.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.conditionText} numberOfLines={1}>
                    {p.condition}
                  </Text>

                  <View style={styles.vitalsPreviewRow}>
                    <Text style={styles.vitalsText}>🩸 {p.bloodGroup}</Text>
                    <Text style={styles.vitalsText}>📊 {p.vitals}</Text>
                    {p.bedAssigned && (
                      <Text style={styles.bedAssignedText}>🛏️ {p.bedAssigned}</Text>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  countersBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DC',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  counterItem: {
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8DED2',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  patientItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7DEC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3E31',
  },
  patientMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  milestoneTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  milestoneTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  conditionText: {
    fontSize: 12,
    color: '#6B5E52',
    marginBottom: 4,
    fontWeight: '500',
  },
  vitalsPreviewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalsText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  bedAssignedText: {
    fontSize: 11,
    color: '#8B1E1E',
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8DED2',
    backgroundColor: '#FAF5EE',
  },
  doneBtn: {
    backgroundColor: '#8B1E1E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ActiveCasesModal;
