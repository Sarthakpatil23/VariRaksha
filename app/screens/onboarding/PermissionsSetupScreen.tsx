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
  requestBluetoothCapability,
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
  const isBluetoothReady = status.bluetooth.state === 'enabled';
  const isAllReady = isLocationReady && isBluetoothReady;

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

  const handleRequestBluetooth = async () => {
    Vibration.vibrate(20);
    setIsRequesting(true);
    setDenialMessage(null);
    await requestBluetoothCapability();
    await refreshPermissions();
    setIsRequesting(false);
  };

  const handlePrimaryCTA = async () => {
    Vibration.vibrate(30);

    // If both are ready, proceed to MainApp
    if (isAllReady) {
      navigateToMainApp();
      return;
    }

    setIsRequesting(true);
    setDenialMessage(null);

    // 1. Request Location if not ready
    if (!isLocationReady) {
      await requestLocationCapability();
    }
    // 2. Request Bluetooth if not ready
    if (!isBluetoothReady) {
      await requestBluetoothCapability();
    }

    const fresh = await refreshPermissions();
    setIsRequesting(false);

    if (fresh.allReady || (fresh.location.state === 'enabled' && isBluetoothReady)) {
      Vibration.vibrate([0, 100, 50, 100]);
      navigateToMainApp();
      return;
    }

    // Check if permanently denied
    const isPermanentlyBlocked =
      fresh.location.state === 'permanently_denied' ||
      fresh.bluetooth.state === 'permanently_denied';

    if (isPermanentlyBlocked) {
      setDenialMessage(
        isMarathi
          ? 'आवश्यक परवानग्या सेटिंग्जमध्ये प्रतिबंधित आहेत. कृपया सेटिंग्ज उघडून परवानगी द्या.'
          : isHindi
          ? 'आवश्यक अनुमतियां सेटिंग्स में अवरुद्ध हैं। कृपया सेटिंग्स खोलें और अनुमति दें।'
          : 'Required permissions are restricted in device settings. Please tap "Open Settings" to enable them manually.',
      );
    } else if (!fresh.location.permissionGranted) {
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

  const isBlocked =
    status.location.state === 'permanently_denied' ||
    status.bluetooth.state === 'permanently_denied';

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
                ? 'ब्लूटूथ व स्थान (GPS) सेटअप'
                : isHindi
                ? 'ब्लूटूथ और लोकेशन सेटअप'
                : 'Bluetooth + Location Setup'}
            </Text>
            <Text style={styles.subtitle}>
              {isMarathi
                ? 'आपत्कालीन SOS व मदतनीसांशी तात्काळ संपर्कासाठी दोन्ही सुविधा चालू असणे आवश्यक आहे.'
                : isHindi
                ? 'आपातकालीन SOS और स्वयंसेवकों से त्वरित संपर्क के लिए दोनों सुविधाएं अनिवार्य हैं।'
                : 'Mandatory device capabilities to ensure instant SOS response and nearby volunteer discovery along the Palkhi Marg.'}
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

          {/* 1. BLUETOOTH CAPABILITY CARD */}
          <View
            style={[
              styles.capabilityCard,
              isBluetoothReady ? styles.cardEnabled : styles.cardRequired,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: isBluetoothReady ? '#DCFCE7' : '#E0F2FE' },
                ]}
              >
                <Ionicons
                  name="bluetooth"
                  size={24}
                  color={isBluetoothReady ? '#15803D' : '#0284C7'}
                />
              </View>

              <View style={styles.cardTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {isMarathi ? 'ब्लूटूथ (Bluetooth)' : 'Bluetooth'}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      isBluetoothReady ? styles.statusPillEnabled : styles.statusPillRequired,
                    ]}
                  >
                    {isBluetoothReady && (
                      <Ionicons name="checkmark" size={12} color="#15803D" style={{ marginRight: 2 }} />
                    )}
                    <Text
                      style={[
                        styles.statusPillText,
                        isBluetoothReady ? styles.statusTextEnabled : styles.statusTextRequired,
                      ]}
                    >
                      {isBluetoothReady
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
                    ? 'इंटरनेट नसतानाही जवळच्या स्वयंसेवक व वारकऱ्यांशी इमर्जन्सी मेष रिले'
                    : 'Required for nearby emergency communication & offline volunteer relay'}
                </Text>
              </View>
            </View>

            {!isBluetoothReady ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRequestBluetooth}
                style={styles.enableInlineBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="bluetooth-outline" size={16} color="#0284C7" />
                  <Text style={styles.enableInlineBtnText}>
                    {isMarathi ? 'ब्लूटूथ चालू करा' : 'Turn On Bluetooth'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#0284C7" />
              </TouchableOpacity>
            ) : (
              <View style={styles.readyIndicatorRow}>
                <Ionicons name="checkmark-circle" size={15} color="#15803D" />
                <Text style={styles.readyIndicatorText}>
                  {isMarathi ? 'ब्लूटूथ सक्रिय आहे' : 'Bluetooth Active'}
                </Text>
              </View>
            )}
          </View>

          {/* 2. LOCATION (GPS) CAPABILITY CARD */}
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
                : 'Privacy Guaranteed: Your location and Bluetooth are strictly used for Wari safety and SOS dispatch.'}
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
              isAllReady ? styles.primaryButtonReady : styles.primaryButtonEnable,
            ]}
          >
            {isRequesting || isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {isAllReady
                    ? isMarathi
                      ? 'पुढे सुरू ठेवा (Continue)'
                      : 'Continue to Application'
                    : isMarathi
                    ? 'परवानग्या चालू करा आणि पुढे जा'
                    : 'Enable & Continue'}
                </Text>
                <Ionicons
                  name={isAllReady ? 'arrow-forward' : 'shield-checkmark-outline'}
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
    marginBottom: spacing.sm,
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  topBarSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  shieldIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  title: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  capabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEnabled: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardRequired: {
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#1E293B',
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
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextEnabled: {
    color: '#15803D',
  },
  statusTextRequired: {
    color: '#B45309',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  cardErrorDetail: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
  },
  enableInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  readyIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyNoteText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    flex: 1,
  },
  bottomBar: {
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    gap: 10,
  },
  openSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonReady: {
    backgroundColor: '#15803D',
  },
  primaryButtonEnable: {
    backgroundColor: colors.maroon,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default PermissionsSetupScreen;
