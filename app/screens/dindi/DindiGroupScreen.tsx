import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { PilgrimTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

export const DindiGroupScreen: React.FC<PilgrimTabScreenProps<'Dindi'>> = () => {
  const { t } = useTranslation();

  const handleCallLeader = () => {
    Alert.alert(
      'Call Dindi Leader',
      'Dialing Sopanrao Maharaj (+91 98765 43210)...',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>MY DINDI GROUP</Text>
            <Text style={styles.headerTitle}>Dindi #12</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Active Mesh</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Leader Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>DINDI LEADER</Text>
            <View style={styles.leaderRow}>
              <Ionicons
                name="person-circle-sharp"
                size={48}
                color={colors.maroon}
              />
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>Sopanrao Maharaj</Text>
                <Text style={styles.leaderRole}>Group Leader · Dindi #12</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCallLeader}
                style={styles.callButton}
              >
                <Ionicons name="call" size={18} color={colors.surface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Group Overview Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>GROUP OVERVIEW</Text>

            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={colors.maroon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Total Members</Text>
                <Text style={styles.infoDetail}>45 Pilgrims registered in Dindi #12</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color={colors.maroon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Current Location</Text>
                <Text style={styles.infoDetail}>Near Wakhari · Phaltan Route</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Safety Tracking</Text>
                <Text style={styles.infoDetail}>Bluetooth BLE mesh monitoring active</Text>
              </View>
            </View>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  statusBadge: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  leaderName: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  leaderRole: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.saffronDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  infoDetail: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
});

export default DindiGroupScreen;
