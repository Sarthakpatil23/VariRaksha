import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import { useUserProfile } from '../../lib/userStore';
import {
  fetchVolunteerTasks,
  updateVolunteerTaskStatus,
  fetchEmergencyAlerts,
  VolunteerTask,
  EmergencyAlert,
} from '../../services/alertService';

type TaskFilter = 'all' | 'active' | 'completed';

export const VolunteerTasksScreen: React.FC = () => {
  const profile = useUserProfile();
  const volunteerId = profile?.id || 'vol-abhishek-chavan';
  const volunteerName = profile?.fullName || 'Abhishek Sanjay Chavan';
  const activeSector = profile?.assignedSector || 'Sector 4 (Wakhari Rest Camp)';

  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [claimedAlerts, setClaimedAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<TaskFilter>('all');

  const loadTasksData = useCallback(async () => {
    try {
      const [tasksRes, alertsRes] = await Promise.all([
        fetchVolunteerTasks(),
        fetchEmergencyAlerts(),
      ]);

      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      }

      if (alertsRes.alerts) {
        const myClaimed = alertsRes.alerts.filter(
          (a) =>
            a.status === 'in_progress' &&
            ((a.responder_id && a.responder_id === volunteerId) ||
              (a.responder_name &&
                a.responder_name.toLowerCase() === volunteerName.toLowerCase())),
        );
        setClaimedAlerts(myClaimed);
      }
    } catch (err) {
      console.warn('[VolunteerTasksScreen] Load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [volunteerId, volunteerName]);

  useEffect(() => {
    loadTasksData();
  }, [loadTasksData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTasksData();
  }, [loadTasksData]);

  const handleToggleTask = async (task: VolunteerTask) => {
    const nextStatus: 'active' | 'completed' =
      task.status === 'completed' ? 'active' : 'completed';
    const optimistic: VolunteerTask[] = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus } : t,
    );
    setTasks(optimistic);

    await updateVolunteerTaskStatus(task.id, nextStatus);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'active') return t.status !== 'completed';
      if (filter === 'completed') return t.status === 'completed';
      return true;
    });
  }, [tasks, filter]);

  const activeCount = useMemo(() => tasks.filter((t) => t.status !== 'completed').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>DUTY DISPATCH & CHECKLIST</Text>
            <Text style={styles.headerTitle}>Assistance Tasks</Text>
          </View>

          <View style={styles.sectorBadge}>
            <Ionicons name="location" size={12} color={colors.maroon} />
            <Text style={styles.sectorBadgeText}>{activeSector}</Text>
          </View>
        </View>

        {/* Filter Segment Tabs */}
        <View style={styles.filterSegmentContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('all')}
            style={[styles.filterSegmentBtn, filter === 'all' && styles.filterSegmentBtnActive]}
          >
            <Text
              style={[
                styles.filterSegmentText,
                filter === 'all' && styles.filterSegmentTextActive,
              ]}
            >
              All ({tasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('active')}
            style={[
              styles.filterSegmentBtn,
              filter === 'active' && styles.filterSegmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterSegmentText,
                filter === 'active' && styles.filterSegmentTextActive,
              ]}
            >
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('completed')}
            style={[
              styles.filterSegmentBtn,
              filter === 'completed' && styles.filterSegmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterSegmentText,
                filter === 'completed' && styles.filterSegmentTextActive,
              ]}
            >
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.saffronDark}
            />
          }
        >
          {/* Claimed Emergency Incidents in Response */}
          {claimedAlerts.length > 0 && filter !== 'completed' && (
            <View style={styles.emergencyTasksSection}>
              <View style={styles.emergencyTasksHeader}>
                <Ionicons name="flash" size={16} color={colors.sosRed} />
                <Text style={styles.emergencyTasksTitle}>Active Emergency Responses</Text>
              </View>

              {claimedAlerts.map((alert) => (
                <View key={alert.id} style={styles.emergencyAlertTaskCard}>
                  <View style={styles.emergencyCardTopRow}>
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyBadgeText}>EMERGENCY SOS</Text>
                    </View>
                    <Text style={styles.emergencyDistanceText}>{alert.distance_away}</Text>
                  </View>

                  <Text style={styles.emergencyPilgrimTitle}>
                    {alert.pilgrim_name} · {alert.problem_type}
                  </Text>
                  {alert.location_name && (
                    <Text style={styles.emergencyLocationText}>📍 {alert.location_name}</Text>
                  )}
                  <View style={styles.inResponseTag}>
                    <Text style={styles.inResponseTagText}>⚡ Assigned to you · In Response</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Routine Sector Duties */}
          <Text style={styles.sectionHeader}>Sector Duties & Checklist</Text>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.saffronDark} />
              <Text style={styles.loadingText}>Loading assigned tasks...</Text>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
              <Text style={styles.emptyText}>No tasks match the selected filter.</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isHigh = task.priority === 'high';

                return (
                  <TouchableOpacity
                    key={task.id}
                    activeOpacity={0.8}
                    onPress={() => handleToggleTask(task)}
                    style={[
                      styles.taskCard,
                      isCompleted && styles.taskCardCompleted,
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isCompleted ? colors.success : colors.textSecondary}
                      style={styles.taskIcon}
                    />
                    <View style={styles.taskDetails}>
                      <View style={styles.taskTitleRow}>
                        <Text
                          style={[
                            styles.taskTitle,
                            isCompleted && styles.taskTitleCompleted,
                          ]}
                        >
                          {task.title}
                        </Text>
                        {isHigh && !isCompleted && (
                          <View style={styles.highPriorityBadge}>
                            <Text style={styles.highPriorityText}>HIGH</Text>
                          </View>
                        )}
                      </View>

                      {task.description && (
                        <Text style={styles.taskDesc}>{task.description}</Text>
                      )}

                      <View style={styles.taskMetaRow}>
                        <Text style={styles.taskSector}>{task.sector}</Text>
                        <Text style={styles.taskStatusPill}>
                          {isCompleted ? '✓ Completed' : '● In Progress'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
    maxWidth: 160,
  },
  sectorBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  filterSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSegmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSegmentText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterSegmentTextActive: {
    color: colors.maroon,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  emergencyTasksSection: {
    marginBottom: spacing.md,
  },
  emergencyTasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  emergencyTasksTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.sosRed,
  },
  emergencyAlertTaskCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.sosRed,
    marginBottom: 8,
  },
  emergencyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emergencyBadge: {
    backgroundColor: colors.sosRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  emergencyDistanceText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  emergencyPilgrimTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },
  emergencyLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inResponseTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  inResponseTagText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.sosRed,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    marginBottom: spacing.xs,
    marginTop: 4,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  tasksList: {
    gap: spacing.xs,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  taskCardCompleted: {
    backgroundColor: '#F9FAFB',
    opacity: 0.75,
  },
  taskIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  highPriorityBadge: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  highPriorityText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.sosRed,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskSector: {
    fontSize: 11,
    color: colors.maroon,
    fontWeight: typography.fontWeight.medium,
  },
  taskStatusPill: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
});

export default VolunteerTasksScreen;
