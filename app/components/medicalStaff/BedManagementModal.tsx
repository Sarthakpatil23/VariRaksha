import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface BedInfo {
  id: number;
  bedNumber: string;
  isOccupied: boolean;
  patientName?: string;
  condition?: string;
  hasOxygen: boolean;
  hasVentilator?: boolean;
}

interface BedManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBed?: (bedNumber: string) => void;
}

const INITIAL_BEDS: BedInfo[] = [
  { id: 1, bedNumber: 'Bed #1', isOccupied: false, hasOxygen: true },
  { id: 2, bedNumber: 'Bed #2', isOccupied: true, patientName: 'Ramesh Gaikwad', condition: 'Severe Dehydration', hasOxygen: true },
  { id: 3, bedNumber: 'Bed #3', isOccupied: false, hasOxygen: false },
  { id: 4, bedNumber: 'Bed #4', isOccupied: true, patientName: 'Tukaram Borade', condition: 'Acute Bronchospasm', hasOxygen: true, hasVentilator: true },
  { id: 5, bedNumber: 'Bed #5', isOccupied: false, hasOxygen: false },
  { id: 6, bedNumber: 'Bed #6', isOccupied: true, patientName: 'Sunita Kulkarni', condition: 'Minor Laceration', hasOxygen: false },
  { id: 7, bedNumber: 'Bed #7', isOccupied: false, hasOxygen: true },
  { id: 8, bedNumber: 'Bed #8', isOccupied: false, hasOxygen: false },
  { id: 9, bedNumber: 'Bed #9', isOccupied: true, patientName: 'Anandi Shinde', condition: 'Diabetic Foot Check', hasOxygen: false },
  { id: 10, bedNumber: 'Bed #10', isOccupied: false, hasOxygen: true },
  { id: 11, bedNumber: 'Bed #11', isOccupied: false, hasOxygen: false },
  { id: 12, bedNumber: 'Bed #12', isOccupied: false, hasOxygen: true },
];

export const BedManagementModal: React.FC<BedManagementModalProps> = ({
  visible,
  onClose,
  onSelectBed,
}) => {
  const [beds, setBeds] = useState<BedInfo[]>(INITIAL_BEDS);

  const availableCount = beds.filter((b) => !b.isOccupied).length;
  const occupiedCount = beds.filter((b) => b.isOccupied).length;
  const oxygenCount = beds.filter((b) => b.hasOxygen).length;

  const toggleBedStatus = (bedId: number) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id === bedId) {
          const nextOccupied = !b.isOccupied;
          return {
            ...b,
            isOccupied: nextOccupied,
            patientName: nextOccupied ? 'Walk-in Varkari' : undefined,
            condition: nextOccupied ? 'Observation' : undefined,
          };
        }
        return b;
      })
    );
  };

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
              <Text style={styles.modalTitle}>Camp Bed Management</Text>
              <Text style={styles.modalSubtitle}>
                Medical Camp – Wakhari (KM 142)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#57534E" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats Summary */}
          <View style={styles.statsSummaryRow}>
            <View style={styles.summaryBadgeGreen}>
              <View style={styles.dotGreen} />
              <Text style={styles.summaryBadgeTextGreen}>
                {availableCount}/{beds.length} Available
              </Text>
            </View>

            <View style={styles.summaryBadgeRed}>
              <View style={styles.dotRed} />
              <Text style={styles.summaryBadgeTextRed}>
                {occupiedCount} Occupied
              </Text>
            </View>

            <View style={styles.summaryBadgeBlue}>
              <Ionicons name="funnel-outline" size={12} color="#0369A1" />
              <Text style={styles.summaryBadgeTextBlue}>
                {oxygenCount} O₂ Equipped
              </Text>
            </View>
          </View>

          {/* Bed Grid */}
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.instructionText}>
              Tap any bed to allocate or release immediately.
            </Text>

            <View style={styles.bedGrid}>
              {beds.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    toggleBedStatus(b.id);
                    if (onSelectBed) onSelectBed(b.bedNumber);
                  }}
                  style={[
                    styles.bedCard,
                    b.isOccupied ? styles.bedCardOccupied : styles.bedCardAvailable,
                  ]}
                >
                  <View style={styles.bedTopRow}>
                    <Text
                      style={[
                        styles.bedNumberText,
                        b.isOccupied ? styles.textOccupied : styles.textAvailable,
                      ]}
                    >
                      {b.bedNumber}
                    </Text>

                    <View style={styles.bedIconsRow}>
                      {b.hasOxygen && (
                        <View style={styles.o2Badge}>
                          <Text style={styles.o2BadgeText}>O₂</Text>
                        </View>
                      )}
                      {b.hasVentilator && (
                        <View style={styles.ventBadge}>
                          <Text style={styles.ventBadgeText}>ICU</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name="bed"
                    size={32}
                    color={b.isOccupied ? '#9E1C1C' : '#16A34A'}
                    style={{ marginVertical: 6 }}
                  />

                  {b.isOccupied ? (
                    <View style={styles.patientInfoBox}>
                      <Text style={styles.bedPatientName} numberOfLines={1}>
                        {b.patientName}
                      </Text>
                      <Text style={styles.bedCondition} numberOfLines={1}>
                        {b.condition}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.availableInfoBox}>
                      <Text style={styles.bedAvailableText}>Available</Text>
                      <Text style={styles.bedActionSubtext}>Ready for intake</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Close Ward View</Text>
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
  statsSummaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DC',
    gap: 8,
  },
  summaryBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  dotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  summaryBadgeTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  summaryBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  dotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  summaryBadgeTextRed: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  summaryBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  summaryBadgeTextBlue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 12,
    textAlign: 'center',
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bedCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  bedCardAvailable: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  bedCardOccupied: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  bedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bedNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textAvailable: {
    color: '#15803D',
  },
  textOccupied: {
    color: '#991B1B',
  },
  bedIconsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  o2Badge: {
    backgroundColor: '#BAE6FD',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  o2BadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369A1',
  },
  ventBadge: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ventBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#854D0E',
  },
  patientInfoBox: {
    marginTop: 4,
  },
  bedPatientName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  bedCondition: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 1,
  },
  availableInfoBox: {
    marginTop: 4,
  },
  bedAvailableText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  bedActionSubtext: {
    fontSize: 10,
    color: '#6B7280',
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

export default BedManagementModal;
