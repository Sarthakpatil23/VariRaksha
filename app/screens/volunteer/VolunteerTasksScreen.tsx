import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';

export const VolunteerTasksScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Assistance Tasks</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkbox-outline" size={20} color={colors.maroon} />
              <Text style={styles.cardTitle}>Water Distribution - Sector 4</Text>
            </View>
            <Text style={styles.cardSubtext}>Status: Active</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  headerRow: { marginVertical: spacing.xs },
  headerTitle: { fontSize: 24, fontWeight: typography.fontWeight.bold, color: colors.maroon },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: typography.fontWeight.bold, color: colors.text, marginLeft: 8 },
  cardSubtext: { fontSize: 12, color: colors.textSecondary, marginLeft: 28 },
});

export default VolunteerTasksScreen;
