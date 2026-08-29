import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

/**
 * Mock Pilgrim Profile data
 * // TODO: replace with real profile lookup via Supabase using the verified mobile number
 */
const MOCK_PROFILE = {
  name: 'Ramesh Kulkarni',
  gender: 'male',
  age: 68,
  dindiNumber: '12',
  dindiName: 'Dindi #12',
  bloodGroup: 'B+',
  allergies: ['Penicillin'],
  conditions: ['Hypertension'],
};

export const ProfileConfirmScreen: React.FC<OnboardingScreenProps<'ProfileConfirm'>> = ({
  navigation,
}) => {
  const { t } = useTranslation();

  // In real flow, fetch profile using mobile number passed from route/state
  const profile = MOCK_PROFILE;
  const genderText = profile.gender === 'male' ? t('male', 'Male') : t('female', 'Female');
  const dindiTagText = t('dindiNumberTag', 'Dindi #{{number}}', { number: profile.dindiNumber });

  const handleConfirmCorrect = () => {
    // Redirect directly to tutorial page (HowItWorks)
    navigation.navigate('HowItWorks');
  };

  const handleNotMe = () => {
    // Fallback path when records don't match the current user
    navigation.navigate('ProfileNotFound');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.maroon} />
          </TouchableOpacity>
          <View style={styles.brandBadge}>
            <Text style={styles.brandTitle}>Vari Raksha • वारी रक्षा</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              {t('isThisYouTitle', 'Is this you?')}
            </Text>
            <Text style={styles.subtext}>
              {t(
                'confirmDetailsSubtext',
                'Please confirm your registration record to continue',
              )}
            </Text>
          </View>

          {/* Centered Confirmation Profile Card */}
          <View style={styles.profileCard}>
            {/* Circular Avatar Placeholder */}
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../../assets/images/varkari.png')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            {/* Name */}
            <Text style={styles.profileName}>{profile.name}</Text>

            {/* Gender, Age & Dindi Number Subtext */}
            <Text style={styles.profileSubtext}>
              {t('genderAgeDindi', '{{gender}} · Age {{age}} · Dindi #{{dindiNumber}}', {
                gender: genderText,
                age: profile.age,
                dindiNumber: profile.dindiNumber,
              })}
            </Text>

            <View style={styles.divider} />

            {/* Profile & Medical Summary Section */}
            <Text style={styles.sectionHeader}>Profile Summary</Text>

            {/* Key Info & Medical Chips Row */}
            <View style={styles.chipsRow}>
              {/* Gender Tag */}
              <View style={[styles.chip, styles.infoChip]}>
                <Text style={styles.chipText}>👤 {genderText}</Text>
              </View>

              {/* Dindi Number Tag */}
              <View style={[styles.chip, styles.dindiChip]}>
                <Text style={styles.chipText}>🚩 {dindiTagText}</Text>
              </View>

              {/* Blood Group Tag */}
              <View style={[styles.chip, styles.bloodChip]}>
                <Text style={styles.chipText}>🩸 {profile.bloodGroup}</Text>
              </View>

              {/* Allergies Tags */}
              {profile.allergies.map((allergy, index) => (
                <View key={`allergy-${index}`} style={[styles.chip, styles.allergyChip]}>
                  <Text style={styles.chipText}>⚠️ {allergy}</Text>
                </View>
              ))}

              {/* Conditions Tags */}
              {profile.conditions.map((condition, index) => (
                <View key={`condition-${index}`} style={[styles.chip, styles.conditionChip]}>
                  <Text style={styles.chipText}>💊 {condition}</Text>
                </View>
              ))}
            </View>

            {/* Reassuring Framing Caption */}
            <View style={styles.captionRow}>
              <Text style={styles.captionIcon}>🛡️</Text>
              <Text style={styles.captionText}>
                {t(
                  'respondersViewCaption',
                  'This is what responders will see if you need help',
                )}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Area */}
        <View style={styles.bottomArea}>
          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConfirmCorrect}
            style={styles.confirmButton}
            accessibilityRole="button"
          >
            <Text style={styles.confirmButtonText}>
              {t('confirmCorrectButton', 'Yes, this is correct')}
            </Text>
          </TouchableOpacity>

          {/* Secondary Action Link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNotMe}
            style={styles.notMeContainer}
            accessibilityRole="button"
          >
            <Text style={styles.notMeText}>
              {t('notMeLink', "This isn't me")}
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    backgroundColor: 'rgba(93, 0, 30, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 14,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    letterSpacing: 0.8,
  },
  topBarSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.cream,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.saffron,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 15,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginRight: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
  },
  infoChip: {
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
    borderColor: 'rgba(93, 0, 30, 0.2)',
  },
  dindiChip: {
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderColor: 'rgba(230, 81, 0, 0.25)',
  },
  bloodChip: {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderColor: 'rgba(211, 47, 47, 0.25)',
  },
  allergyChip: {
    backgroundColor: 'rgba(245, 124, 0, 0.08)',
    borderColor: 'rgba(245, 124, 0, 0.25)',
  },
  conditionChip: {
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    borderColor: 'rgba(93, 0, 30, 0.25)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    width: '100%',
  },
  captionIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  captionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
    lineHeight: 16,
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  confirmButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: colors.saffronDark,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: spacing.md,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  notMeContainer: {
    paddingVertical: spacing.xs,
  },
  notMeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.maroon,
    textDecorationLine: 'underline',
  },
});

export default ProfileConfirmScreen;
