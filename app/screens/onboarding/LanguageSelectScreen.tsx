import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../constants';

import { setUserLanguagePreference } from '../../lib/userStore';
import { clearChatMessages } from '../../lib/chatStore';

type LanguageCode = 'mr' | 'hi' | 'en';

interface LanguageOption {
  id: LanguageCode;
  nativeName: string;
  englishName: string;
  subtitle?: string;
  isPrimary?: boolean;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    subtitle: 'सर्वात लोकप्रिय / Default',
    isPrimary: true,
  },
  {
    id: 'hi',
    nativeName: 'हिंदी',
    englishName: 'Hindi',
    subtitle: 'हिंदी भाषी वारकरी',
  },
  {
    id: 'en',
    nativeName: 'English',
    englishName: 'English',
    subtitle: 'Standard English',
  },
];

const CONTINUE_BUTTON_TEXT: Record<LanguageCode, string> = {
  mr: 'पुढे जा',
  hi: 'आगे बढ़ें',
  en: 'Next',
};

export const LanguageSelectScreen: React.FC<OnboardingScreenProps<'LanguageSelect'>> = ({
  navigation,
}) => {
  const { i18n } = useTranslation();
  // Default to active i18n language or fallback to Marathi
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'mr',
  );

  const handleSelectLanguage = (code: LanguageCode) => {
    setSelectedLang(code);
    setUserLanguagePreference(code);
    clearChatMessages('varkari', code);
    clearChatMessages('dindiLeader', code);
    // Dynamically change global locale for all present and future pages
    i18n.changeLanguage(code);
  };

  const handleContinue = () => {
    setUserLanguagePreference(selectedLang);
    clearChatMessages('varkari', selectedLang);
    clearChatMessages('dindiLeader', selectedLang);
    i18n.changeLanguage(selectedLang);
    navigation.navigate('RoleSelect');
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/language.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark overlay tint for high contrast over artwork */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Header Pill */}
          <View style={styles.topHeader}>
            <Text style={styles.brandTitle}>Vari Raksha • वारी रक्षा</Text>
          </View>

          {/* Header Title Section floating over artwork */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>
              {selectedLang === 'en'
                ? 'Select Your Language'
                : selectedLang === 'hi'
                ? 'अपनी भाषा चुनें'
                : 'आपली भाषा निवडा'}
            </Text>
            <Text style={styles.subTitle}>
              {selectedLang === 'en'
                ? 'Choose language to continue'
                : selectedLang === 'hi'
                ? 'आगे बढ़ने के लिए भाषा चुनें'
                : 'आगे बढ़ने के लिए भाषा चुनें • Choose language'}
            </Text>
          </View>

          {/* Transparent Glass Language Option Cards */}
          <View style={styles.optionsList}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selectedLang === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectLanguage(option.id)}
                  style={[
                    styles.languageCard,
                    isSelected ? styles.selectedCard : styles.unselectedCard,
                  ]}
                >
                  {/* Native Script & Subtitle */}
                  <View style={styles.textWrapper}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.nativeNameText,
                          isSelected && styles.selectedNativeText,
                        ]}
                      >
                        {option.nativeName}
                      </Text>
                      <Text
                        style={[
                          styles.englishNameText,
                          isSelected && styles.selectedEnglishText,
                        ]}
                      >
                        ({option.englishName})
                      </Text>
                    </View>
                    {option.subtitle ? (
                      <Text
                        style={[
                          styles.subtitleText,
                          isSelected && styles.selectedSubtitleText,
                        ]}
                      >
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {/* Check Indicator */}
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

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>
                {CONTINUE_BUTTON_TEXT[selectedLang]}
              </Text>
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
  titleSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF8E7',
    textAlign: 'center',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subTitle: {
    fontSize: 14,
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
  languageCard: {
    minHeight: 68,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  unselectedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  selectedCard: {
    backgroundColor: 'rgba(106, 0, 31, 0.88)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  textWrapper: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nativeNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: spacing.xs,
  },
  selectedNativeText: {
    color: '#FFF8E7',
  },
  englishNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFE0B2',
  },
  selectedEnglishText: {
    color: '#FFE0B2',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFCC80',
    marginTop: 2,
  },
  selectedSubtitleText: {
    color: '#FFD1A3',
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  radioCircleSelected: {
    borderColor: '#FFD700',
    backgroundColor: colors.saffronDark,
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  bottomArea: {
    width: '100%',
    paddingBottom: spacing.sm,
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

export default LanguageSelectScreen;
