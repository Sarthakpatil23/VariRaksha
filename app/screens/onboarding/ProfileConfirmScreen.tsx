import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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
import { useUserProfile, setUserProfile, UserProfile, getUserRole } from '../../lib/userStore';
import { fetchRegisteredActorByPhone } from '../../services/authService';
import { translateUserProfile } from '../../utils/translator';

export const ProfileConfirmScreen: React.FC<OnboardingScreenProps<'ProfileConfirm'>> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'mr') as 'mr' | 'hi' | 'en';
  const isMarathi = lang === 'mr';
  const isHindi = lang === 'hi';

  const storeProfile = useUserProfile();
  const initialProfile: UserProfile | null = route.params?.profile || storeProfile;
  const rawMobile = (route.params as any)?.mobileNumber || storeProfile?.mobileNumber || '9970832199';
  const role = getUserRole();

  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProfile);

  // Live database fetch from vari_varkaris on mount if profile not pre-provided
  useEffect(() => {
    if (!profile && rawMobile) {
      let isMounted = true;
      setIsLoading(true);

      fetchRegisteredActorByPhone(rawMobile, role)
        .then((dbProfile) => {
          if (!isMounted) return;
          if (dbProfile) {
            setProfile(dbProfile);
            setUserProfile(dbProfile);
          } else {
            navigation.replace('ProfileNotFound', {
              mobileNumber: rawMobile,
              selectedRole: role,
            });
          }
        })
        .catch((err) => {
          console.error('[ProfileConfirmScreen] DB fetch error:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [profile, rawMobile, role, navigation]);

  const handleConfirmCorrect = () => {
    Vibration.vibrate(30);
    if (profile) {
      setUserProfile(profile);
    }
    navigation.navigate('HowItWorks');
  };

  const handleNotMe = () => {
    Vibration.vibrate(20);
    navigation.navigate('ProfileNotFound', {
      mobileNumber: profile?.mobileNumber || rawMobile,
      selectedRole: profile?.role || role,
    });
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.saffronDark} />
          <Text style={styles.loadingText}>
            {isMarathi
              ? 'डेटाबेसमधून वारकरी माहिती लोड करत आहोत...'
              : 'Fetching your Varkari profile from database...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayProfile: UserProfile = translateUserProfile(profile, lang);

  const genderText =
    displayProfile.gender === 'Female'
      ? isMarathi
        ? 'स्त्री'
        : isHindi
        ? 'महिला'
        : 'Female'
      : isMarathi
      ? 'पुरुष'
      : isHindi
      ? 'पुरुष'
      : 'Male';

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
              {isMarathi
                ? 'ही तुमचीच माहिती आहे का?'
                : isHindi
                ? 'क्या यह आपकी ही जानकारी है?'
                : 'Is this your profile?'}
            </Text>
            <Text style={styles.subtext}>
              {isMarathi
                ? 'वारी डेटाबेसमधील अधिकृत माहिती तपासा व पुष्टी करा'
                : isHindi
                ? 'वारी डेटाबेस से प्राप्त विवरण की पुष्टि करें'
                : 'Please confirm your official registration record from database'}
            </Text>
          </View>

          {/* Database-Backed Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={
                  displayProfile.role === 'dindiLeader'
                    ? require('../../../assets/images/dindi_leader.png')
                    : displayProfile.role === 'volunteer'
                    ? require('../../../assets/images/volunteer.png')
                    : displayProfile.role === 'medicalStaff'
                    ? require('../../../assets/images/medical_staff.png')
                    : require('../../../assets/images/varkari.png')
                }
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            {/* Live Dynamically Translated Name from vari_varkaris */}
            <Text style={styles.profileName}>{displayProfile.fullName}</Text>

            {/* Live Dynamically Translated Village from vari_varkaris */}
            <Text style={styles.profileSubtext}>
              📍 {displayProfile.village || (isMarathi ? 'महाराष्ट्र' : 'Maharashtra')} · {genderText} · {isMarathi ? `वय ${displayProfile.age || 60}` : isHindi ? `उम्र ${displayProfile.age || 60}` : `Age ${displayProfile.age || 60}`}
            </Text>

            {/* Emergency Card Badge from vari_varkaris */}
            <View style={styles.cardIdBadge}>
              <Ionicons name="id-card" size={14} color={colors.saffronDark} />
              <Text style={styles.cardIdText}>
                {isMarathi ? 'कार्ड आयडी:' : isHindi ? 'कार्ड आईडी:' : 'Emergency ID:'} {displayProfile.emergencyCardId || 'VK-WARI01'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Dindi & Medical Summary Section */}
            <Text style={styles.sectionHeader}>
              {isMarathi
                ? 'दिंडी व वैद्यकीय माहिती'
                : isHindi
                ? 'दिंडी व चिकित्सा विवरण'
                : 'Dindi & Medical Summary'}
            </Text>

            {/* Chips Row */}
            <View style={styles.chipsRow}>
              {/* Dindi Tag */}
              <View style={[styles.chip, styles.dindiChip]}>
                <Text style={styles.chipText}>
                  🚩 {displayProfile.dindiName || (isMarathi ? `दिंडी क्र. ${displayProfile.dindiNumber || '१२'}` : `Dindi #${displayProfile.dindiNumber || '12'}`)}
                </Text>
              </View>

              {/* Blood Group */}
              <View style={[styles.chip, styles.bloodChip]}>
                <Text style={styles.chipText}>🩸 {displayProfile.bloodGroup || 'B+'}</Text>
              </View>

              {/* Phone Tag */}
              <View style={[styles.chip, styles.infoChip]}>
                <Text style={styles.chipText}>📱 {displayProfile.mobileNumber}</Text>
              </View>

              {/* Medical Conditions */}
              {displayProfile.medicalConditions && displayProfile.medicalConditions.length > 0
                ? displayProfile.medicalConditions.map((cond, index) => (
                    <View key={`cond-${index}`} style={[styles.chip, styles.conditionChip]}>
                      <Text style={styles.chipText}>💊 {cond}</Text>
                    </View>
                  ))
                : (
                  <View style={[styles.chip, styles.safeChip]}>
                    <Text style={styles.chipText}>
                      🟢 {isMarathi ? 'कोणतीही गंभीर व्याधी नाही' : isHindi ? 'कोई गंभीर बीमारी नहीं' : 'No Critical Conditions'}
                    </Text>
                  </View>
                )}

              {/* Allergies */}
              {displayProfile.allergies && displayProfile.allergies.length > 0 ? (
                displayProfile.allergies.map((allergy, index) => (
                  <View key={`all-${index}`} style={[styles.chip, styles.allergyChip]}>
                    <Text style={styles.chipText}>⚠️ {allergy}</Text>
                  </View>
                ))
              ) : null}
            </View>

            {/* Reassuring Framing Caption */}
            <View style={styles.captionRow}>
              <Text style={styles.captionIcon}>🛡️</Text>
              <Text style={styles.captionText}>
                {isMarathi
                  ? 'आपत्कालीन प्रसंगी मदतनीस व डॉक्टरांना हे कार्ड थेट दिसेल'
                  : isHindi
                  ? 'आपात स्थिति में डॉक्टरों व स्वयंसेवकों को यह कार्ड दिखाई देगा'
                  : 'This emergency profile will be visible to doctors & leaders during SOS'}
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
              {isMarathi ? 'होय, ही माझीच माहिती आहे' : 'Yes, this is correct'}
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
              {isMarathi ? 'ही माझी माहिती नाही / नंबर बदला' : "This isn't me / Change"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.maroon,
    textAlign: 'center',
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
    fontSize: 24,
    fontWeight: '900',
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cream,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.saffron,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: 2,
  },
  profileSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 5,
  },
  cardIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: spacing.sm,
    gap: 6,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  infoChip: {
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
    borderColor: 'rgba(93, 0, 30, 0.2)',
  },
  dindiChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  bloodChip: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  conditionChip: {
    backgroundColor: '#F3E5F5',
    borderColor: '#E1BEE7',
  },
  allergyChip: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFECB3',
  },
  safeChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
    gap: 6,
  },
  captionIcon: {
    fontSize: 14,
  },
  captionText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#1B5E20',
    lineHeight: 15,
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  confirmButton: {
    width: '100%',
    minHeight: 54,
    backgroundColor: colors.saffronDark,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: spacing.xs,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  notMeContainer: {
    paddingVertical: spacing.xs,
  },
  notMeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.maroon,
    textDecorationLine: 'underline',
  },
});

export default ProfileConfirmScreen;
