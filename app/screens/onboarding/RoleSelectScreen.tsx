import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../constants';
import { setUserRole } from '../../lib/userStore';

type RoleKey = 'varkari' | 'dindiLeader' | 'volunteer' | 'medicalStaff';

interface RoleOption {
  key: RoleKey;
  image: ReturnType<typeof require>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'varkari',
    image: require('../../../assets/images/varkari.png'),
  },
  {
    key: 'dindiLeader',
    image: require('../../../assets/images/dindi_leader.png'),
  },
  {
    key: 'volunteer',
    image: require('../../../assets/images/volunteer.png'),
  },
  {
    key: 'medicalStaff',
    image: require('../../../assets/images/medical_staff.png'),
  },
];

export const RoleSelectScreen: React.FC<OnboardingScreenProps<'RoleSelect'>> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  // Default selection to Varkari (Pilgrim)
  const [selectedRole, setSelectedRole] = useState<RoleKey>('varkari');

  const handleContinue = () => {
    // Persist selected role for post-onboarding dashboard routing
    setUserRole(selectedRole);
    navigation.navigate('MobileNumber', { selectedRole });
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/Select role.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark overlay tint for crisp readability over artwork */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Header Pill */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>Vari Raksha • वारी रक्षा</Text>
          </View>

          {/* Scrollable Transparent Options Container */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Title Section floating directly over background */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{t('selectRoleTitle')}</Text>
              <Text style={styles.subTitle}>{t('selectRoleSubtitle')}</Text>
            </View>

            {/* Transparent Glass Role Options List */}
            <View style={styles.optionsList}>
              {ROLE_OPTIONS.map((option) => {
                const isSelected = selectedRole === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.85}
                    onPress={() => setSelectedRole(option.key)}
                    style={[
                      styles.roleCard,
                      isSelected ? styles.selectedRoleCard : styles.unselectedRoleCard,
                    ]}
                  >
                    {/* Role Avatar */}
                    <View style={styles.avatarWrapper}>
                      <Image
                        source={option.image}
                        style={styles.avatarImage}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Title & Subtitle */}
                    <View style={styles.textWrapper}>
                      <Text
                        style={[
                          styles.roleTitle,
                          isSelected && styles.selectedRoleTitle,
                        ]}
                      >
                        {t(`roles.${option.key}.title`)}
                      </Text>
                      <Text
                        style={[
                          styles.roleDesc,
                          isSelected && styles.selectedRoleDesc,
                        ]}
                        numberOfLines={2}
                      >
                        {t(`roles.${option.key}.desc`)}
                      </Text>
                    </View>

                    {/* Check Circle Indicator */}
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInnerDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>{t('nextButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 4, 14, 0.42)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topHeader: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.cream,
    letterSpacing: 1.2,
    backgroundColor: 'rgba(93, 0, 30, 0.75)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF8E7',
    textAlign: 'center',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFE0B2',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  optionsList: {
    width: '100%',
  },
  roleCard: {
    minHeight: 74,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  unselectedRoleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  selectedRoleCard: {
    backgroundColor: 'rgba(106, 0, 31, 0.88)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 248, 231, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  selectedRoleTitle: {
    color: '#FFF8E7',
  },
  roleDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFE0B2',
    lineHeight: 16,
  },
  selectedRoleDesc: {
    color: '#FFD1A3',
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  radioCircleSelected: {
    borderColor: '#FFD700',
    backgroundColor: colors.saffronDark,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  bottomArea: {
    width: '100%',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  continueButton: {
    minHeight: 56,
    backgroundColor: colors.saffronDark,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default RoleSelectScreen;
