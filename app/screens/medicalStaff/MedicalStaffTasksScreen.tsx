import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicalStaffTabScreenProps } from '../../navigation/types';

interface MedicalTask {
  id: string;
  title: string;
  category: string;
  dueTime: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

const INITIAL_TASKS: MedicalTask[] = [
  {
    id: 'tsk-1',
    title: 'Inspect Oxygen Regulators & Cylinders 1–12',
    category: 'Equipment & O2',
    dueTime: 'Every 4 Hours',
    isCompleted: true,
    priority: 'high',
  },
  {
    id: 'tsk-2',
    title: 'Replenish ORS Hydration Booths (150 sachets)',
    category: 'Hydration',
    dueTime: '12:00 PM',
    isCompleted: true,
    priority: 'high',
  },
  {
    id: 'tsk-3',
    title: 'Restock IV Normal Saline & Dextrose Infusion Bags',
    category: 'Pharmacy',
    dueTime: '02:00 PM',
    isCompleted: false,
    priority: 'high',
  },
  {
    id: 'tsk-4',
    title: 'Sterilize Minor Wound Suture & Dressing Trays',
    category: 'Sterilization',
    dueTime: '04:30 PM',
    isCompleted: false,
    priority: 'medium',
  },
  {
    id: 'tsk-5',
    title: 'Shift Handover & Patient Roster Sync with CMO',
    category: 'Handover',
    dueTime: '08:00 PM',
    isCompleted: false,
    priority: 'medium',
  },
];

interface SupplyItem {
  id: string;
  name: string;
  quantity: string;
  status: 'adequate' | 'low' | 'critical';
}

const SUPPLIES: SupplyItem[] = [
  { id: 'sup-1', name: 'IV Normal Saline 500ml', quantity: '42 Bottles', status: 'adequate' },
  { id: 'sup-2', name: 'ORS Electrolyte Packets', quantity: '180 Sachets', status: 'adequate' },
  { id: 'sup-3', name: 'Tetanus Toxoid (TT) Vials', quantity: '8 Vials (Low)', status: 'low' },
  { id: 'sup-4', name: 'Sterile Gauze & Bandages', quantity: '65 Rolls', status: 'adequate' },
  { id: 'sup-5', name: 'Salbutamol / Budecort Inhalers', quantity: '12 Units', status: 'adequate' },
];

export const MedicalStaffTasksScreen: React.FC<
  MedicalStaffTabScreenProps<'Tasks'>
> = ({ navigation }) => {
  const [tasks, setTasks] = useState<MedicalTask[]>(INITIAL_TASKS);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

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

        <Text style={styles.headerTitle}>Camp Tasks & Inventory</Text>

        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>
            {completedCount}/{tasks.length} Done
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Protocol Completion</Text>
            <Text style={styles.progressPercent}>
              {Math.round((completedCount / tasks.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedCount / tasks.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Tasks List */}
        <Text style={styles.sectionHeading}>OPERATIONAL CHECKLIST</Text>
        <View style={styles.tasksList}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.8}
              onPress={() => toggleTask(task.id)}
              style={[
                styles.taskItemCard,
                task.isCompleted && styles.taskCompletedCard,
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  task.isCompleted && styles.checkboxCompleted,
                ]}
              >
                {task.isCompleted && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>

              <View style={styles.taskInfoCol}>
                <Text
                  style={[
                    styles.taskTitleText,
                    task.isCompleted && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMetaRow}>
                  <Text style={styles.categoryTag}>{task.category}</Text>
                  <Text style={styles.dueTimeText}>⏰ {task.dueTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Medical Supplies & Pharmacy Inventory */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
          CAMP PHARMACY & INVENTORY
        </Text>
        <View style={styles.suppliesCard}>
          {SUPPLIES.map((sup, index) => (
            <View
              key={sup.id}
              style={[
                styles.supplyItemRow,
                index < SUPPLIES.length - 1 && styles.supplyItemDivider,
              ]}
            >
              <View style={styles.supplyNameCol}>
                <Text style={styles.supplyName}>{sup.name}</Text>
                <Text style={styles.supplyQty}>{sup.quantity}</Text>
              </View>

              <View
                style={[
                  styles.supplyStatusBadge,
                  sup.status === 'low' ? styles.badgeLow : styles.badgeAdequate,
                ]}
              >
                <Text
                  style={[
                    styles.supplyStatusText,
                    sup.status === 'low' ? styles.textLow : styles.textAdequate,
                  ]}
                >
                  {sup.status === 'low' ? 'Low Stock' : 'Adequate'}
                </Text>
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
  badgeCount: {
    backgroundColor: '#F5ECE1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B1E1E',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    marginBottom: 20,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B1E1E',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EAE1D3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B1E1E',
    borderRadius: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8C7E72',
    marginBottom: 10,
  },
  tasksList: {
    gap: 10,
  },
  taskItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 8,
  },
  taskCompletedCard: {
    backgroundColor: '#F8F6F2',
    borderColor: '#E2D9CD',
    opacity: 0.8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4B5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  taskInfoCol: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#78716C',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B1E1E',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueTimeText: {
    fontSize: 11,
    color: '#78716C',
  },
  suppliesCard: {
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
  },
  supplyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  supplyItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DE',
  },
  supplyNameCol: {
    flex: 1,
  },
  supplyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  supplyQty: {
    fontSize: 12,
    color: '#6B5E52',
    marginTop: 2,
  },
  supplyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeAdequate: {
    backgroundColor: '#DCFCE7',
  },
  badgeLow: {
    backgroundColor: '#FEF3C7',
  },
  supplyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textAdequate: {
    color: '#15803D',
  },
  textLow: {
    color: '#B45309',
  },
});

export default MedicalStaffTasksScreen;
