import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';


interface TriageFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSeverity: string;
  selectedMilestone: string;
  searchQuery: string;
  onApply: (filters: {
    severity: string;
    milestone: string;
    searchQuery: string;
  }) => void;
  onReset: () => void;
}

export const TriageFilterModal: React.FC<TriageFilterModalProps> = ({
  visible,
  onClose,
  selectedSeverity: initialSeverity,
  selectedMilestone: initialMilestone,
  searchQuery: initialSearch,
  onApply,
  onReset,
}) => {
  const [severity, setSeverity] = useState<string>(initialSeverity);
  const [milestone, setMilestone] = useState<string>(initialMilestone);
  const [search, setSearch] = useState<string>(initialSearch);

  const handleApply = () => {
    onApply({ severity, milestone, searchQuery: search });
    onClose();
  };

  const handleReset = () => {
    setSeverity('all');
    setMilestone('all');
    setSearch('');
    onReset();
    onClose();
  };

  const severities = [
    { key: 'all', label: 'All Severities' },
    { key: 'critical', label: 'Critical Only', color: '#9E1C1C' },
    { key: 'moderate', label: 'Urgent / Moderate', color: '#D97706' },
    { key: 'normal', label: 'Stable / Normal', color: '#16A34A' },
  ];

  const milestones = [
    { key: 'all', label: 'All Stages' },
    { key: 'received', label: 'Received' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'reached', label: 'Reached' },
    { key: 'admitted', label: 'Admitted' },
  ];

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
              <Text style={styles.modalTitle}>Filter Triage Queue</Text>
              <Text style={styles.modalSubtitle}>Refine patient list by priority</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#57534E" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Search Input */}
            <Text style={styles.sectionLabel}>SEARCH PATIENT</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#78716C" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, age, condition, blood..."
                placeholderTextColor="#A8A29E"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#78716C" />
                </TouchableOpacity>
              )}
            </View>

            {/* Severity Filter */}
            <Text style={styles.sectionLabel}>SEVERITY LEVEL</Text>
            <View style={styles.chipsRow}>
              {severities.map((s) => {
                const isSelected = severity === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    activeOpacity={0.8}
                    onPress={() => setSeverity(s.key)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Milestone Filter */}
            <Text style={styles.sectionLabel}>DISPATCH / ADMISSION STAGE</Text>
            <View style={styles.chipsRow}>
              {milestones.map((m) => {
                const isSelected = milestone === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    activeOpacity={0.8}
                    onPress={() => setMilestone(m.key)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
    maxHeight: '80%',
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
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCCEB9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipSelected: {
    backgroundColor: '#8B1E1E',
    borderColor: '#8B1E1E',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
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
  resetBtn: {
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
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534E',
  },
  applyBtn: {
    backgroundColor: '#8B1E1E',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TriageFilterModal;
