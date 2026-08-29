import React, { useState, useRef, useEffect } from 'react';
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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { createVideoPlayer } from 'expo-video';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { sendPhoneOTP, verifyPhoneOTP } from '../../services/authService';
import { getUserRole } from '../../lib/userStore';

const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;
const START_TIME_SECONDS = 1.0;
const VIDEO_SOURCE = require('../../../assets/videos/loading_video.webm');

/**
 * Mask mobile number (e.g. 9423010001 -> +91 94XXX XX001)
 */
const formatMaskedMobile = (mobile?: string): string => {
  if (!mobile || mobile.length < 10) {
    return '+91 98XXX XX000';
  }
  const clean = mobile.replace(/[^0-9]/g, '').slice(-10);
  return `+91 ${clean.slice(0, 2)}XXX XX${clean.slice(7)}`;
};

export const OTPVerificationScreen: React.FC<OnboardingScreenProps<'OTPVerification'>> = ({
  route,
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const rawMobileNumber = route.params?.mobileNumber || '9423010001';
  const role = route.params?.selectedRole || getUserRole();
  const maskedMobile = formatMaskedMobile(rawMobileNumber);

  // State for 6 OTP digit inputs
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  
  // Resend countdown timer state
  const [countdown, setCountdown] = useState<number>(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Array of refs for each of the 6 OTP input boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus the 1st OTP box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  // Format seconds into MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle single digit input and auto-advancing focus
  const handleChangeText = (text: string, index: number) => {
    const sanitizedText = text.replace(/[^0-9]/g, '');
    if (errorMessage) setErrorMessage('');

    // Support multi-character paste / SMS autofill
    if (sanitizedText.length > 1) {
      const pastedDigits = sanitizedText.slice(0, OTP_LENGTH).split('');
      const newValues = [...otpValues];
      pastedDigits.forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newValues[i] = digit;
        }
      });
      setOtpValues(newValues);
      
      const lastFilledIndex = Math.min(pastedDigits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();

      // If full 6 digits filled by SMS auto-fill, trigger auto verify
      if (pastedDigits.length >= OTP_LENGTH) {
        triggerVerification(pastedDigits.join(''));
      }
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = sanitizedText;
    setOtpValues(newValues);

    // Auto-advance focus to the next box
    if (sanitizedText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = '';
        setOtpValues(newValues);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const isComplete = otpValues.every((digit) => digit.length === 1);

  const triggerVerification = async (otpString: string) => {
    if (isVerifying) return;
    Keyboard.dismiss();
    setIsVerifying(true);
    setErrorMessage('');
    Vibration.vibrate(30);

    try {
      const res = await verifyPhoneOTP(rawMobileNumber, otpString);
      if (res.success) {
        // Preload video player while user is transitioning
        let player: any = null;
        try {
          player = createVideoPlayer(VIDEO_SOURCE);
          player.loop = true;
          player.muted = true;
          player.currentTime = START_TIME_SECONDS;
          player.play();
        } catch (e) {
          console.log('[OTPVerification] Video preload notice:', e);
        }

        navigation.replace('Loading', {
          mobileNumber: rawMobileNumber,
          selectedRole: role,
          preloadedPlayer: player,
        });
      } else {
        setErrorMessage(
          res.error ||
            (isMarathi ? 'अवैध ओटीपी. कृपया पुन्हा तपासा.' : 'Invalid OTP. Please check and try again.'),
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (!isComplete || isVerifying) return;
    triggerVerification(otpValues.join(''));
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    Vibration.vibrate(20);

    try {
      const res = await sendPhoneOTP(rawMobileNumber);
      if (res.success) {
        setCountdown(RESEND_TIMER_SECONDS);
        setCanResend(false);
        setOtpValues(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Resend error');
    } finally {
      setIsResending(false);
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
                {isMarathi ? 'ओटीपी प्रविष्ट करा' : 'Enter OTP Verification Code'}
              </Text>
              <Text style={styles.subtext}>
                {isMarathi
                  ? `${maskedMobile} वर पाठवलेला ६ अंकी कोड प्रविष्ट करा`
                  : `Enter the 6-digit code sent to ${maskedMobile}`}
              </Text>
            </View>

            {/* 6-Digit OTP Boxes Row with SMS AutoFill */}
            <View style={styles.otpRow}>
              {otpValues.map((value, index) => {
                const isFocused =
                  (!value && otpValues.slice(0, index).every((d) => d.length === 1)) ||
                  (index === 0 && !otpValues[0]);

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBoxWrapper,
                      isFocused && styles.otpBoxWrapperFocused,
                      value ? styles.otpBoxWrapperFilled : null,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      style={styles.otpInput}
                      value={value}
                      onChangeText={(text) => handleChangeText(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? OTP_LENGTH : 1}
                      selectTextOnFocus
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      importantForAutofill="yes"
                      accessibilityLabel={`OTP digit ${index + 1}`}
                    />
                  </View>
                );
              })}
            </View>

            {/* Error Feedback */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Resend OTP Section */}
            <View style={styles.resendSection}>
              {canResend ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleResend}
                  disabled={isResending}
                  style={styles.resendButton}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.saffronDark} />
                  ) : (
                    <Text style={styles.resendTextActive}>
                      {isMarathi ? 'ओटीपी पुन्हा पाठवा (Resend OTP)' : 'Resend OTP'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.timerRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.resendTextDisabled}>
                    {isMarathi
                      ? `पुन्हा पाठवण्यासाठी प्रतीक्षा करा: ${formatTimer(countdown)}`
                      : `Resend code in ${formatTimer(countdown)}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Action Area */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleVerify}
              disabled={!isComplete || isVerifying}
              style={[
                styles.verifyButton,
                (!isComplete || isVerifying) && styles.disabledButton,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isComplete || isVerifying }}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.verifyButtonText}>
                  {isMarathi ? 'पडताळणी करा (Verify & Continue)' : 'Verify & Continue'}
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
    fontSize: 24,
    fontWeight: '900',
    color: colors.maroon,
    marginBottom: spacing.xs,
    lineHeight: 30,
  },
  subtext: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  otpBoxWrapper: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxWrapperFocused: {
    borderColor: colors.saffronDark,
    borderWidth: 2,
  },
  otpBoxWrapperFilled: {
    borderColor: colors.maroon,
    backgroundColor: '#FFF8F0',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.maroon,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resendTextActive: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.saffronDark,
    textDecorationLine: 'underline',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resendTextDisabled: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  bottomArea: {
    width: '100%',
    paddingBottom: spacing.xs,
  },
  verifyButton: {
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
  verifyButtonText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    letterSpacing: 0.5,
  },
});

export default OTPVerificationScreen;
