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
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { createVideoPlayer } from 'expo-video';
import { OnboardingScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;
const START_TIME_SECONDS = 1.0;
const VIDEO_SOURCE = require('../../../assets/videos/loading_video.webm');

/**
 * Utility to mask mobile number (e.g., 9876543210 -> +91 98XXX XX210)
 */
const formatMaskedMobile = (mobile?: string): string => {
  if (!mobile || mobile.length !== 10) {
    return '+91 98XXX XX000';
  }
  return `+91 ${mobile.slice(0, 2)}XXX XX${mobile.slice(7)}`;
};

export const OTPVerificationScreen: React.FC<OnboardingScreenProps<'OTPVerification'>> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const rawMobileNumber = route.params?.mobileNumber;
  const maskedMobile = formatMaskedMobile(rawMobileNumber);

  // State for 6 OTP digit inputs
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  
  // Resend countdown timer state
  const [countdown, setCountdown] = useState<number>(RESEND_TIMER_SECONDS);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Array of refs for each of the 6 OTP input boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus the 1st OTP box the moment the screen mounts to minimize friction
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
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

  // Format seconds into MM:SS format
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle single digit input and auto-advancing focus
  const handleChangeText = (text: string, index: number) => {
    const sanitizedText = text.replace(/[^0-9]/g, '');

    // Support multi-character paste (e.g. user pastes full 6-digit code)
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
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = sanitizedText;
    setOtpValues(newValues);

    // Auto-advance focus to the next box if a digit was entered
    if (sanitizedText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation back to previous input box
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
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = () => {
    if (!isComplete || isVerifying) return;
    setIsVerifying(true);

    const fullOtp = otpValues.join('');
    console.log('Verifying OTP:', fullOtp);

    // TODO: replace with real OTP verification via Supabase Auth:
    // const { session, error } = await supabase.auth.verifyOtp({
    //   phone: `+91${rawMobileNumber}`,
    //   token: fullOtp,
    //   type: 'sms',
    // });

    // Preload video player while user is still on the Verify screen
    try {
      const player = createVideoPlayer(VIDEO_SOURCE);
      player.loop = true;
      player.muted = true;
      player.currentTime = START_TIME_SECONDS;
      player.play();

      let navigated = false;
      const navigateToLoading = () => {
        if (navigated) return;
        navigated = true;
        setIsVerifying(false);
        navigation.navigate('Loading', { preloadedPlayer: player });
      };

      if (player.status === 'readyToPlay') {
        navigateToLoading();
      } else {
        const sub = player.addListener('statusChange', ({ status }) => {
          if (status === 'readyToPlay') {
            sub.remove();
            navigateToLoading();
          }
        });
        // Safety timeout so user is never stuck
        setTimeout(() => {
          navigateToLoading();
        }, 500);
      }
    } catch (err) {
      setIsVerifying(false);
      navigation.navigate('Loading');
    }
  };

  const handleResend = () => {
    if (!canResend) return;

    // Reset state & timer
    setCanResend(false);
    setCountdown(RESEND_TIMER_SECONDS);
    setOtpValues(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();

    // TODO: Replace with real Supabase resend OTP API call:
    // await supabase.auth.signInWithOtp({ phone: `+91${rawMobileNumber}` });

    Alert.alert(
      t('otpResentToastTitle', 'OTP Resent'),
      t(
        'otpResentToastMessage',
        'A new 6-digit OTP has been sent to your mobile number.',
      ),
    );
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
                {t('enterOtpTitle', 'Enter OTP')}
              </Text>
              <Text style={styles.subtext}>
                {t('otpSentTo', 'Sent to {{number}}', { number: maskedMobile })}
              </Text>
            </View>

            {/* 6-Digit OTP Boxes Row */}
            <View style={styles.otpRow}>
              {otpValues.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  style={[
                    styles.otpBox,
                    digit ? styles.filledOtpBox : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus={true}
                  accessibilityLabel={`OTP Digit ${index + 1}`}
                />
              ))}
            </View>

            {/* Resend Link & Countdown Section */}
            <View style={styles.resendSection}>
              {canResend ? (
                <TouchableOpacity activeOpacity={0.7} onPress={handleResend}>
                  <Text style={styles.resendActiveText}>
                    {t('resendOtp', 'Resend OTP')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendDisabledText}>
                  {t('resendIn', 'Resend in {{time}}', {
                    time: formatTimer(countdown),
                  })}
                </Text>
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
                  {t('verifyButton', 'Verify')}
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  otpBox: {
    width: 48,
    height: 58,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filledOtpBox: {
    borderColor: colors.saffronDark,
    backgroundColor: colors.surface,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendActiveText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.saffronDark,
    textDecorationLine: 'underline',
  },
  resendDisabledText: {
    fontSize: 14,
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
