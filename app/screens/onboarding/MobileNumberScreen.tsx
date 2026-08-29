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
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { sendPhoneOTP } from '../../services/authService';
import { getUserRole } from '../../lib/userStore';

export const MobileNumberScreen: React.FC<OnboardingScreenProps<'MobileNumber'>> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';
  const role = route.params?.selectedRole || getUserRole();

  const [mobileNumber, setMobileNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-format phone input (allow only 10 numeric digits)
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

  const handleContinue = async () => {
    if (!isValid || isLoading) {
      setErrorMessage(
        isMarathi
          ? 'कृपया १० अंकी वैध मोबाईल नंबर प्रविष्ट करा'
          : 'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await sendPhoneOTP(mobileNumber);
      if (res.success) {
        Vibration.vibrate(25);
        navigation.navigate('OTPVerification', {
          mobileNumber,
          selectedRole: role,
        });
      } else {
        setErrorMessage(
          res.message ||
            (isMarathi ? 'ओटीपी पाठवता आला नाही' : 'Failed to send OTP'),
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error');
    } finally {
      setIsLoading(false);
    }
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
                {isMarathi ? 'मोबाईल नंबर प्रविष्ट करा' : 'Enter your mobile number'}
              </Text>
              <Text style={styles.subtext}>
                {isMarathi
                  ? 'आम्ही तुमची दिंडी व वारकरी नोंदणी माहिती शोधू'
                  : "We'll find your pilgrimage registration details"}
              </Text>
            </View>

            {/* Input Row Container with Native Autofill metadata */}
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
                autoComplete="tel"
                textContentType="telephoneNumber"
                importantForAutofill="yes"
                accessibilityLabel="Mobile Number Input"
              />

              {mobileNumber.length > 0 && (
                <TouchableOpacity
                  onPress={() => setMobileNumber('')}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Inline Validation Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Reassurance Badge */}
            <View style={styles.reassuranceContainer}>
              <Text style={styles.reassuranceIcon}>🛡️</Text>
              <Text style={styles.reassuranceText}>
                {isMarathi
                  ? 'तुमचा डेटा वारी सुरक्षा प्रणालीमध्ये सुरक्षित आहे'
                  : 'Your information is encrypted and safe with VariRaksha'}
              </Text>
            </View>
          </View>

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={!isValid || isLoading}
              style={[
                styles.continueButton,
                (!isValid || isLoading) && styles.disabledButton,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isValid || isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.continueButtonText}>
                  {isMarathi ? 'ओटीपी मिळवा (Get OTP)' : 'Send OTP'}
                </Text>
              )}
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
    fontWeight: '900',
    color: colors.maroon,
    marginBottom: spacing.xs,
    lineHeight: 32,
  },
  subtext: {
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  textInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: 1.5,
  },
  clearBtn: {
    padding: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
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
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
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
