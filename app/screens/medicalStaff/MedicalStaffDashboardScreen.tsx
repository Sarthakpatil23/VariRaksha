import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';

export const MedicalStaffDashboardScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>MEDICAL STAFF DASHBOARD</Text>
            <Text style={styles.headerTitle}>Mobile Clinic #2</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ready</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit-outline" size={24} color={colors.maroon} />
              <Text style={styles.cardTitle}>Triage Queue</Text>
            </View>
            <Text style={styles.cardText}>0 Urgent Medical Triage Requests</Text>
            <Text style={styles.cardSubtext}>Stationed at Phaltan Medical Camp</Text>
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

export default MedicalStaffDashboardScreen;
