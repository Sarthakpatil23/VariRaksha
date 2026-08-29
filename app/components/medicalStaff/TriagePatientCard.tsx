import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type TriageSeverity = 'critical' | 'moderate' | 'normal' | 'urgent';
export type TriageMilestone = 'received' | 'dispatched' | 'reached' | 'admitted';

export interface PatientTriageItem {
  id: string;
  name: string;
  age: number;
  gender?: string;
  initials: string;
  condition: string;
  severity: TriageSeverity;
  iconType: 'warning' | 'kit' | 'heart' | 'pulse';
  timestamp?: string;
  milestone: TriageMilestone;
  bloodGroup: string;
  vitals: string;
  allergies: string;
  medications: string;
  pulseRate?: string;
  spo2?: string;
  temperature?: string;
  bedAssigned?: string;
  notes?: string;
}

interface TriagePatientCardProps {
  patient: PatientTriageItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (patient: PatientTriageItem) => void;
}

export const TriagePatientCard: React.FC<TriagePatientCardProps> = ({
  patient,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
}) => {
  const getBorderColor = () => {
    switch (patient.severity) {
      case 'critical':
        return '#9E1C1C'; // Solid dark red
      case 'moderate':
      case 'urgent':
        return '#E68A00'; // Amber/Orange
      case 'normal':
      default:
        return '#1E7E34'; // Green
    }
  };

  const getConditionColor = () => {
    switch (patient.severity) {
      case 'critical':
        return '#8B1E1E';
      case 'moderate':
      case 'urgent':
        return '#995200';
      case 'normal':
      default:
        return '#166534';
    }
  };

  const renderConditionIcon = () => {
    const iconColor = getConditionColor();
    switch (patient.iconType) {
      case 'warning':
        return (
          <Ionicons
            name="warning-outline"
            size={16}
            color={iconColor}
            style={styles.conditionIcon}
          />
        );
      case 'kit':
        return (
          <MaterialCommunityIcons
            name="medical-bag"
            size={16}
            color={iconColor}
            style={styles.conditionIcon}
          />
        );
      case 'heart':
      case 'pulse':
        return (
          <Ionicons
            name="heart-half-outline"
            size={16}
            color={iconColor}
            style={styles.conditionIcon}
          />
        );
      default:
        return (
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={iconColor}
            style={styles.conditionIcon}
          />
        );
    }
  };

  const milestones: { key: TriageMilestone; label: string }[] = [
    { key: 'received', label: 'Received' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'reached', label: 'Reached' },
    { key: 'admitted', label: 'Admitted' },
  ];

  const getMilestoneIndex = (stage: TriageMilestone) => {
    switch (stage) {
      case 'received':
        return 0;
      case 'dispatched':
        return 1;
      case 'reached':
        return 2;
      case 'admitted':
        return 3;
      default:
        return 0;
    }
  };

  const currentMilestoneIndex = getMilestoneIndex(patient.milestone);

  return (
    <View style={[styles.cardContainer, { borderLeftColor: getBorderColor() }]}>
      {/* Top Right Critical Badge if Critical */}
      {patient.severity === 'critical' && (
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalBadgeText}>Critical</Text>
        </View>
      )}

      {/* Main Top Header: Avatar + Patient Info */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{patient.initials}</Text>
        </View>

        <View style={styles.patientInfoCol}>
          <Text style={styles.patientName}>
            {patient.name}, {patient.age}
          </Text>

          <View style={styles.conditionRow}>
            {renderConditionIcon()}
            <Text style={[styles.conditionText, { color: getConditionColor() }]}>
              {patient.condition}
            </Text>
          </View>

          {/* If there is a timestamp and not expanded, show timestamp row */}
          {patient.timestamp && !isExpanded && (
            <View style={styles.timestampRow}>
              <Ionicons name="time-outline" size={13} color="#78716C" />
              <Text style={styles.timestampText}>{patient.timestamp}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Expanded Content: Stepper + 2x2 Vitals Box */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          {/* 1. Milestone Stepper Box */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              {/* Background connecting line */}
              <View style={styles.stepperLineBackground} />
              {/* Active progress line */}
              <View
                style={[
                  styles.stepperLineActive,
                  {
                    width:
                      currentMilestoneIndex === 0
                        ? '0%'
                        : currentMilestoneIndex === 1
                        ? '33%'
                        : currentMilestoneIndex === 2
                        ? '66%'
                        : '100%',
                  },
                ]}
              />

              {/* Milestones Nodes */}
              <View style={styles.nodesRow}>
                {milestones.map((item, index) => {
                  const isCompleted = index < currentMilestoneIndex;
                  const isActive = index === currentMilestoneIndex;
                  const isFuture = index > currentMilestoneIndex;

                  return (
                    <View key={item.key} style={styles.nodeItemWrapper}>
                      <View
                        style={[
                          styles.nodeCircle,
                          isCompleted && styles.nodeCircleCompleted,
                          isActive && styles.nodeCircleActive,
                          isFuture && styles.nodeCircleFuture,
                        ]}
                      >
                        {isCompleted && (
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        )}
                        {isActive && (
                          <Ionicons name="location-sharp" size={13} color="#FFFFFF" />
                        )}
                        {isFuture && <View style={styles.nodeInnerEmpty} />}
                      </View>
                      <Text
                        style={[
                          styles.nodeLabel,
                          isActive && styles.nodeLabelActive,
                          isCompleted && styles.nodeLabelCompleted,
                          isFuture && styles.nodeLabelFuture,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 2. Clinical Info / Vitals 2x2 Grid */}
          <View style={styles.clinicalBox}>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>Blood Group</Text>
                <Text style={styles.gridValue}>{patient.bloodGroup}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>Vitals (Last 1hr)</Text>
                <Text style={styles.gridValue}>{patient.vitals}</Text>
              </View>
            </View>

            <View style={[styles.gridRow, { marginTop: 12 }]}>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>Allergies</Text>
                <Text style={styles.gridValue}>{patient.allergies}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>Medications</Text>
                <Text style={styles.gridValue}>{patient.medications}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Card Action Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleExpand}
          style={styles.toggleExpandBtn}
        >
          <Text style={styles.toggleExpandText}>
            {isExpanded ? 'Collapse Details' : 'View full profile'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#8B1E1E"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onUpdateStatus(patient)}
            style={styles.updateStatusBtn}
          >
            <Text style={styles.updateStatusBtnText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4.5,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  criticalBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#8B1E1E',
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 2,
  },
  criticalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7DEC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3E31',
  },
  patientInfoCol: {
    flex: 1,
    paddingRight: 60,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  conditionIcon: {
    marginRight: 6,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#F5ECE1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  timestampText: {
    fontSize: 12,
    color: '#57534E',
    marginLeft: 4,
    fontWeight: '500',
  },
  expandedSection: {
    marginTop: 14,
  },
  stepperContainer: {
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ECE0D0',
    marginBottom: 12,
  },
  stepperTrack: {
    position: 'relative',
    justifyContent: 'center',
  },
  stepperLineBackground: {
    position: 'absolute',
    top: 14,
    left: '12%',
    right: '12%',
    height: 2.5,
    backgroundColor: '#E2D5C3',
    zIndex: 1,
  },
  stepperLineActive: {
    position: 'absolute',
    top: 14,
    left: '12%',
    height: 2.5,
    backgroundColor: '#8B1E1E',
    zIndex: 2,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  nodeItemWrapper: {
    alignItems: 'center',
    width: 64,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeCircleCompleted: {
    backgroundColor: '#8B1E1E',
  },
  nodeCircleActive: {
    backgroundColor: '#8B1E1E',
    borderWidth: 3,
    borderColor: '#F3C5BA',
  },
  nodeCircleFuture: {
    backgroundColor: '#E4DACB',
    borderWidth: 1.5,
    borderColor: '#D4C6B3',
  },
  nodeInnerEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4C6B3',
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78716C',
    textAlign: 'center',
  },
  nodeLabelActive: {
    color: '#8B1E1E',
    fontWeight: '700',
  },
  nodeLabelCompleted: {
    color: '#44403C',
    fontWeight: '600',
  },
  nodeLabelFuture: {
    color: '#8C827A',
  },
  clinicalBox: {
    backgroundColor: '#FAF2E4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE0CA',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCell: {
    flex: 1,
    paddingRight: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#6B5E52',
    marginBottom: 2,
    fontWeight: '500',
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 4,
  },
  toggleExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleExpandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B1E1E',
  },
  updateStatusBtn: {
    backgroundColor: '#8B1E1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#8B1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  updateStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TriagePatientCard;
