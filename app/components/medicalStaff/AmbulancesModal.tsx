import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AmbulanceItem {
  id: string;
  vehicleNumber: string;
  type: string;
  driverName: string;
  phone: string;
  distance: string;
  eta: string;
  status: 'available' | 'en_route' | 'busy';
  equipment: string[];
}

interface AmbulancesModalProps {
  visible: boolean;
  onClose: () => void;
}

const AMBULANCES: AmbulanceItem[] = [
  {
    id: 'amb-1',
    vehicleNumber: 'MH-12-AB-4021',
    type: '108 Advanced Life Support (ALS)',
    driverName: 'Santosh Kale (EMT: Dr. Joshi)',
    phone: '+91 98231 44550',
    distance: '1.2 km',
    eta: '4 mins away',
    status: 'available',
    equipment: ['Oxygen Cylinders', 'Defibrillator (AED)', 'IV Fluids', 'Stretcher'],
  },
  {
    id: 'amb-2',
    vehicleNumber: 'MH-14-CD-8910',
    type: 'Mobile Cardiac & Trauma Unit',
    driverName: 'Anil Shinde (EMT: N. Patil)',
    phone: '+91 94220 88712',
    distance: '2.8 km',
    eta: '9 mins away',
    status: 'available',
    equipment: ['Portable Ventilator', 'ECG Monitor', 'Emergency Drugs', 'Suction Machine'],
  },
];

export const AmbulancesModal: React.FC<AmbulancesModalProps> = ({
  visible,
  onClose,
}) => {
  const handleCall = (amb: AmbulanceItem) => {
    Alert.alert(
      'Calling Ambulance Dispatch',
      `Connecting to ${amb.driverName} on ${amb.phone}...`,
      [{ text: 'OK' }]
    );
  };

  const handleRequestTransfer = (amb: AmbulanceItem) => {
    Alert.alert(
      'Request Patient Pickup',
      `Dispatch request sent to ${amb.vehicleNumber} for Medical Camp - Wakhari (KM 142).`,
      [{ text: 'Acknowledged' }]
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
              <Text style={styles.modalTitle}>Ambulances Nearby</Text>
              <Text style={styles.modalSubtitle}>
                2 Active Units Stationed along Wakhari Sector
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
            {AMBULANCES.map((amb) => (
              <View key={amb.id} style={styles.ambulanceCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="car-sport" size={22} color="#8B1E1E" />
                  </View>
                  <View style={styles.titleInfo}>
                    <Text style={styles.vehicleNum}>{amb.vehicleNumber}</Text>
                    <Text style={styles.vehicleType}>{amb.type}</Text>
                  </View>
                  <View style={styles.etaBadge}>
                    <Ionicons name="flash" size={12} color="#DC2626" />
                    <Text style={styles.etaText}>{amb.eta}</Text>
                  </View>
                </View>

                {/* Driver & Distance details */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color="#6B5E52" />
                    <Text style={styles.detailLabel}>Driver & EMT:</Text>
                    <Text style={styles.detailValue}>{amb.driverName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="navigate-outline" size={14} color="#6B5E52" />
                    <Text style={styles.detailLabel}>Distance:</Text>
                    <Text style={styles.detailValue}>{amb.distance} from Camp</Text>
                  </View>
                </View>

                {/* Equipment Tags */}
                <View style={styles.equipmentTagsRow}>
                  {amb.equipment.map((eq, i) => (
                    <View key={i} style={styles.eqTag}>
                      <Text style={styles.eqTagText}>✓ {eq}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCall(amb)}
                    style={styles.callBtn}
                  >
                    <Ionicons name="call" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.callBtnText}>Call Driver</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleRequestTransfer(amb)}
                    style={styles.dispatchBtn}
                  >
                    <Ionicons name="paper-plane" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.dispatchBtnText}>Dispatch to Camp</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  ambulanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8DFD3',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  vehicleNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  vehicleType: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 4,
  },
  detailsBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#78716C',
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#1C1917',
    fontWeight: '600',
    flex: 1,
  },
  equipmentTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  eqTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eqTagText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  dispatchBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B1E1E',
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#8B1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  dispatchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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

export default AmbulancesModal;
