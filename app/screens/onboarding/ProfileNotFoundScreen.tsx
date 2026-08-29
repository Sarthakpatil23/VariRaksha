import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { registerNewVarkariProfile } from '../../services/authService';
import { setUserProfile, getUserRole } from '../../lib/userStore';

export const ProfileNotFoundScreen: React.FC<OnboardingScreenProps<'ProfileNotFound'>> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const mobileNumber = route.params?.mobileNumber || '+91 98765 43210';
  const role = (route.params?.selectedRole as any) || getUserRole();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleQuickRegister = async () => {
    Vibration.vibrate(30);
    setIsRegistering(true);
    try {
      const newProfile = await registerNewVarkariProfile(
        mobileNumber,
        isMarathi ? 'वारकरी भाविक' : 'Varkari Pilgrim',
        role,
      );
      setUserProfile(newProfile);
      navigation.navigate('HowItWorks');
    } catch (err) {
      console.error('Error during quick registration:', err);
      navigation.navigate('HowItWorks');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChangeRole = () => {
    Vibration.vibrate(20);
    navigation.navigate('RoleSelect');
  };

  const handleTryAgain = () => {
    Vibration.vibrate(20);
    navigation.navigate('MobileNumber', { selectedRole: role });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
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
          {/* Icon & Notice */}
          <View style={styles.iconCircle}>
            <Ionicons name="search-outline" size={40} color={colors.saffronDark} />
          </View>

          <Text style={styles.title}>
            {isMarathi ? 'माहिती सापडली नाही' : 'No Registration Found'}
          </Text>

          <Text style={styles.subtitle}>
            {isMarathi
              ? `मोबाईल नंबर (${mobileNumber}) वर कोणतीही पूर्व-नोंदणी आढळली नाही.`
              : `No existing record was found matching mobile number (${mobileNumber}).`}
          </Text>

          {/* Solution Cards Container */}
          <View style={styles.solutionsBox}>
            <Text style={styles.solutionHeader}>
              {isMarathi ? 'खालीलपैकी एक पर्याय निवडा:' : 'Choose how to proceed:'}
            </Text>

            {/* Option 1: Quick Register as New Varkari */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleQuickRegister}
              disabled={isRegistering}
              style={styles.solutionCardPrimary}
            >
              <View style={styles.solutionIconBox}>
                <Ionicons name="person-add" size={22} color={colors.surface} />
              </View>
              <View style={styles.solutionTextBox}>
                <Text style={styles.solutionTitlePrimary}>
                  {isMarathi ? 'नवीन वारकरी नोंदणी करा (1-Tap)' : 'Quick Register as New Varkari'}
                </Text>
                <Text style={styles.solutionSubPrimary}>
                  {isMarathi
                    ? 'या नंबरवर त्वरित नवीन डिजिटल पास व मेडिकल आयडी तयार करा'
                    : 'Create a new digital pass and medical profile instantly'}
                </Text>
              </View>
              {isRegistering ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.surface} />
              )}
            </TouchableOpacity>

            {/* Option 2: Change Role */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleChangeRole}
              style={styles.solutionCard}
            >
              <View style={[styles.solutionIconBox, styles.solutionIconBoxSecondary]}>
                <Ionicons name="people-outline" size={20} color={colors.maroon} />
              </View>
              <View style={styles.solutionTextBox}>
                <Text style={styles.solutionTitle}>
                  {isMarathi ? 'भूमिका बदला (दिंडी प्रमुख / स्वयंसेवक)' : 'Switch Role (Leader / Volunteer)'}
                </Text>
                <Text style={styles.solutionSub}>
                  {isMarathi
                    ? 'जर तुम्ही दिंडी मालक किंवा स्वयंसेवक असाल तर ती भूमिका निवडा'
                    : 'If you are registered as a Dindi Leader or Volunteer'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Option 3: Try Another Number */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTryAgain}
              style={styles.solutionCard}
            >
              <View style={[styles.solutionIconBox, styles.solutionIconBoxSecondary]}>
                <Ionicons name="keypad-outline" size={20} color={colors.maroon} />
              </View>
              <View style={styles.solutionTextBox}>
                <Text style={styles.solutionTitle}>
                  {isMarathi ? 'दुसरा मोबाईल नंबर तपासा' : 'Try a Different Number'}
                </Text>
                <Text style={styles.solutionSub}>
                  {isMarathi
                    ? 'नोंदणी करताना दिलेला दुसरा नंबर प्रविष्ट करा'
                    : 'Re-enter mobile number in case of typo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  solutionsBox: {
    width: '100%',
    gap: 10,
  },
  solutionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  solutionCardPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    padding: spacing.md,
    borderRadius: 16,
    gap: 12,
    shadowColor: colors.saffronDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  solutionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solutionIconBoxSecondary: {
    backgroundColor: '#FFE8EE',
  },
  solutionTextBox: {
    flex: 1,
  },
  solutionTitlePrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 2,
  },
  solutionSubPrimary: {
    fontSize: 12,
    color: colors.creamDark,
    lineHeight: 16,
  },
  solutionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  solutionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});

export default ProfileNotFoundScreen;
