import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

export const MobileNumberScreen: React.FC<OnboardingScreenProps<'MobileNumber'>> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sanitize input to allow strictly 10 numeric digits
  const handleTextChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    if (numericOnly.length <= 10) {
      setMobileNumber(numericOnly);
      if (errorMessage && numericOnly.length === 10) {
        setErrorMessage('');
      }
    }
  };

  const isValid = mobileNumber.length === 10;

  const handleContinue = () => {
    // Validate client-side before submission
    if (!isValid) {
      setErrorMessage(t('mobileInputError', 'Please enter a valid 10-digit mobile number'));
      return;
    }

    setErrorMessage('');

    // TODO: Replace with real Supabase Auth SMS OTP trigger endpoint
    // e.g. await supabase.auth.signInWithOtp({ phone: `+91${mobileNumber}` })

    navigation.navigate('OTPVerification', { mobileNumber });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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

          {/* Main Content */}
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>
                {t('enterMobileTitle', 'Enter your mobile number')}
              </Text>
              <Text style={styles.subtext}>
                {t('enterMobileSubtext', "We'll find your registration details")}
              </Text>
            </View>

            {/* Input Row Container */}
            <View style={styles.inputContainer}>
              {/* Fixed Country Code Badge (+91) */}
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              {/* Large Touch Target Phone Number Input */}
              <TextInput
                style={styles.textInput}
                value={mobileNumber}
                onChangeText={handleTextChange}
                placeholder="00000 00000"
                placeholderTextColor="#A0A0A0"
                keyboardType="number-pad"
                maxLength={10}
                autoFocus={true}
                accessibilityLabel="Mobile Number Input"
              />
            </View>

            {/* Inline Validation Error Message */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Reassurance Badge */}
            <View style={styles.reassuranceContainer}>
              <Text style={styles.reassuranceIcon}>🛡️</Text>
              <Text style={styles.reassuranceText}>
                {t('safeInfoReassurance', 'Your information is safe')}
              </Text>
            </View>
          </View>

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={!isValid}
              style={[
                styles.continueButton,
                !isValid && styles.disabledButton,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isValid }}
            >
              <Text style={styles.continueButtonText}>
                {t('continueButton', 'Continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  backArrow: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.xl,
  },
  subtext: {
    fontSize: 15,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    height: 64,
    paddingHorizontal: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  countryCodeBadge: {
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  countryCodeText: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  textInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: 1.5,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  reassuranceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  reassuranceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  reassuranceText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  bottomArea: {
    width: '100%',
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
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});

export default MobileNumberScreen;
