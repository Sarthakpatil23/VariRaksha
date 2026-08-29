import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';

export const VolunteerDashboardScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>VOLUNTEER DASHBOARD</Text>
            <Text style={styles.headerTitle}>Route Sector 4</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>On Duty</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-outline" size={24} color={colors.maroon} />
              <Text style={styles.cardTitle}>Assistance Overview</Text>
            </View>
            <Text style={styles.cardText}>12 Pilgrims assisted today</Text>
            <Text style={styles.cardSubtext}>Active Sector: Wakhari Rest Camp</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={24} color={colors.saffronDark} />
              <Text style={styles.cardTitle}>Nearby Help Calls</Text>
            </View>
            <Text style={styles.cardText}>No active SOS requests in your 500m radius.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xs },
  headerSubtitle: { fontSize: 11, fontWeight: typography.fontWeight.bold, color: colors.textSecondary, letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: typography.fontWeight.bold, color: colors.maroon },
  badge: { backgroundColor: 'rgba(46, 125, 50, 0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: typography.fontWeight.bold, color: colors.success },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontSize: 16, fontWeight: typography.fontWeight.bold, color: colors.maroon, marginLeft: 8 },
  cardText: { fontSize: 14, fontWeight: typography.fontWeight.bold, color: colors.text },
  cardSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default VolunteerDashboardScreen;
