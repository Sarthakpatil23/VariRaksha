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
import {
  useDevicePermissions,
  requestLocationCapability,
  openDeviceAppSettings,
} from '../../services/permissionService';

export const PermissionsSetupScreen: React.FC<
  OnboardingScreenProps<'PermissionsSetup'>
> = ({ navigation }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'mr') as 'mr' | 'hi' | 'en';
  const isMarathi = lang === 'mr';
  const isHindi = lang === 'hi';

  const {
    status,
    isChecking,
    refreshPermissions,
  } = useDevicePermissions();

  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [denialMessage, setDenialMessage] = useState<string | null>(null);

  const isLocationReady = status.location.state === 'enabled';

  const handleRequestLocation = async () => {
    Vibration.vibrate(20);
    setIsRequesting(true);
    setDenialMessage(null);
    const res = await requestLocationCapability();
    const fresh = await refreshPermissions();
    setIsRequesting(false);

    if (res.state === 'permanently_denied') {
      setDenialMessage(
        isMarathi
          ? 'स्थान परवानगी सेटिंग्जमध्ये ब्लॉक केली आहे. कृपया ॲप सेटिंग्ज उघडा आणि लोकेशन परवानगी द्या.'
          : 'Location is blocked in settings. Please open App Settings and allow Location access.',
      );
    } else if (res.state === 'denied' || !fresh.location.permissionGranted) {
      setDenialMessage(
        isMarathi
          ? 'आपत्कालीन प्रसंगी लोकेशन शोधण्यासाठी कृपया स्थान परवानगी द्या.'
          : 'Location access was denied. Please grant location access for emergency SOS tracking.',
      );
    }
  };

  const handlePrimaryCTA = async () => {
    Vibration.vibrate(30);

    if (isLocationReady) {
      navigateToMainApp();
      return;
    }

    setIsRequesting(true);
    setDenialMessage(null);

    await requestLocationCapability();
    const fresh = await refreshPermissions();
    setIsRequesting(false);

    if (fresh.location.state === 'enabled' || fresh.location.permissionGranted) {
      Vibration.vibrate([0, 100, 50, 100]);
      navigateToMainApp();
      return;
    }

    if (fresh.location.state === 'permanently_denied') {
      setDenialMessage(
        isMarathi
          ? 'स्थान परवानगी सेटिंग्जमध्ये प्रतिबंधित आहे. कृपया सेटिंग्ज उघडून परवानगी द्या.'
          : isHindi
          ? 'स्थान अनुमति सेटिंग्स में अवरुद्ध है। कृपया सेटिंग्स खोलें और अनुमति दें।'
          : 'Location permission is restricted in device settings. Please tap "Open Settings" to enable it manually.',
      );
    } else {
      setDenialMessage(
        isMarathi
          ? 'वारी सुरक्षेसाठी स्थान (GPS) परवानगी अनिवार्य आहे.'
          : isHindi
          ? 'वारी सुरक्षा के लिए लोकेशन (GPS) अनुमति अनिवार्य है।'
          : 'Location (GPS) permission is mandatory for emergency SOS and volunteer tracking.',
      );
    }
  };

  const navigateToMainApp = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      (parentNav as any).navigate('MainApp');
    } else {
      (navigation as any).navigate('MainApp');
    }
  };

  const isBlocked = status.location.state === 'permanently_denied';

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
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.shieldIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#15803D" />
            </View>
            <Text style={styles.title}>
              {isMarathi
                ? 'स्थान (GPS) सेटअप'
                : isHindi
                ? 'लोकेशन (GPS) सेटअप'
                : 'Location (GPS) Setup'}
            </Text>
            <Text style={styles.subtitle}>
              {isMarathi
                ? 'आपत्कालीन SOS व मदतनीसांशी तात्काळ संपर्कासाठी अचूक स्थान सेवा चालू असणे आवश्यक आहे.'
                : isHindi
                ? 'आपातकालीन SOS और स्वयंसेवकों से त्वरित संपर्क के लिए लोकेशन सेवा अनिवार्य है।'
                : 'Mandatory location capability to ensure instant SOS response and nearby volunteer assistance along the Palkhi Marg.'}
            </Text>
          </View>

          {/* Denial / Blocked Warning Banner */}
          {denialMessage && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>
                  {isBlocked
                    ? isMarathi
                      ? 'परवानगी प्रतिबंधित आहे'
                      : 'Permission Restricted'
                    : isMarathi
                    ? 'परवानगी आवश्यक आहे'
                    : 'Permission Required'}
                </Text>
                <Text style={styles.warningDesc}>{denialMessage}</Text>
              </View>
            </View>
          )}

          {/* LOCATION (GPS) CAPABILITY CARD */}
          <View
            style={[
              styles.capabilityCard,
              isLocationReady ? styles.cardEnabled : styles.cardRequired,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: isLocationReady ? '#DCFCE7' : '#FEE2E2' },
                ]}
              >
                <Ionicons
                  name="location"
                  size={24}
                  color={isLocationReady ? '#15803D' : '#DC2626'}
                />
              </View>

              <View style={styles.cardTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {isMarathi ? 'स्थान / GPS (Location)' : 'GPS & Location'}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      isLocationReady ? styles.statusPillEnabled : styles.statusPillRequired,
                    ]}
                  >
                    {isLocationReady && (
                      <Ionicons name="checkmark" size={12} color="#15803D" style={{ marginRight: 2 }} />
                    )}
                    <Text
                      style={[
                        styles.statusPillText,
                        isLocationReady ? styles.statusTextEnabled : styles.statusTextRequired,
                      ]}
                    >
                      {isLocationReady
                        ? isMarathi
                          ? 'सक्रिय (Enabled)'
                          : 'Enabled'
                        : isMarathi
                        ? 'आवश्यक (Required)'
                        : 'Required'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>
                  {isMarathi
                    ? 'आपत्कालीन प्रसंगी अचूक पालखी मार्ग स्थान शेअर करण्यासाठी व मदत मिळवण्यासाठी'
                    : 'Required to share your exact location with nearby responders during emergencies'}
                </Text>

                {status.location.details && !isLocationReady && (
                  <Text style={styles.cardErrorDetail}>{status.location.details}</Text>
                )}
              </View>
            </View>

            {!isLocationReady ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRequestLocation}
                style={styles.enableInlineBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="navigate-outline" size={16} color="#0284C7" />
                  <Text style={styles.enableInlineBtnText}>
                    {isMarathi ? 'स्थान (GPS) चालू करा' : 'Turn On Location (GPS)'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#0284C7" />
              </TouchableOpacity>
            ) : (
              <View style={styles.readyIndicatorRow}>
                <Ionicons name="checkmark-circle" size={15} color="#15803D" />
                <Text style={styles.readyIndicatorText}>
                  {isMarathi ? 'स्थान (GPS) सक्रिय आहे' : 'GPS Location Active'}
                </Text>
              </View>
            )}
          </View>

          {/* Privacy Guarantee Note */}
          <View style={styles.privacyNoteBox}>
            <Ionicons name="lock-closed-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={styles.privacyNoteText}>
              {isMarathi
                ? 'गोपनीयता हमी: तुमचे स्थान केवळ पालखी मार्गावरील सुरक्षा व SOS मदतीसाठीच वापरले जाते.'
                : 'Privacy Guaranteed: Your location is strictly used for Wari safety and emergency SOS dispatch.'}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Primary Action Bar */}
        <View style={styles.bottomBar}>
          {isBlocked && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openDeviceAppSettings}
              style={styles.openSettingsButton}
            >
              <Ionicons name="settings-outline" size={18} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.openSettingsButtonText}>
                {isMarathi ? 'ॲप सेटिंग्ज उघडा (Open Settings)' : 'Open App Settings'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePrimaryCTA}
            disabled={isRequesting}
            style={[
              styles.primaryButton,
              isLocationReady ? styles.primaryButtonReady : styles.primaryButtonEnable,
            ]}
          >
            {isRequesting || isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {isLocationReady
                    ? isMarathi
                      ? 'पुढे सुरू ठेवा (Continue)'
                      : 'Continue to Application'
                    : isMarathi
                    ? 'स्थान परवानगी द्या आणि पुढे जा'
                    : 'Enable & Continue'}
                </Text>
                <Ionicons
                  name={isLocationReady ? 'arrow-forward' : 'shield-checkmark-outline'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  brandBadge: {
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DED2',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.maroon,
    letterSpacing: 0.3,
  },
  topBarSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  shieldIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
  },
  capabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    shadowColor: '#2B1A09',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardEnabled: {
    borderColor: '#86EFAC',
    backgroundColor: '#FAFCF8',
  },
  cardRequired: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillEnabled: {
    backgroundColor: '#DCFCE7',
  },
  statusPillRequired: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextEnabled: {
    color: '#15803D',
  },
  statusTextRequired: {
    color: '#DC2626',
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardErrorDetail: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 6,
  },
  enableInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  enableInlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  readyIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  readyIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: spacing.sm,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  openSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 12,
  },
  openSettingsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonReady: {
    backgroundColor: colors.maroon,
    shadowColor: colors.maroon,
  },
  primaryButtonEnable: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default PermissionsSetupScreen;
