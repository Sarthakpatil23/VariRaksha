import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  Vibration,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { VariRakshaChatbot } from '../../components/chat/VariRakshaChatbot';
import { VoiceBlobModal } from '../../components/blob/VoiceBlobModal';
import { VarkariInteractiveMap } from '../../components/map/VarkariInteractiveMap';
import { VarkariMapModal } from '../../components/map/VarkariMapModal';

// Mock Temperature Data & Threshold
const MOCK_TEMPERATURE_NUMERIC = 34; // 34°C
const HEAT_RISK_THRESHOLD = 30; // Temperature threshold in °C to trigger heat risk border tint

export const HomeSOSScreen: React.FC<MainTabScreenProps<'Home'>> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdPercent, setHoldPercent] = useState<number>(0);
  const [chatModalVisible, setChatModalVisible] = useState<boolean>(false);
  const [voiceBlobVisible, setVoiceBlobVisible] = useState<boolean>(false);
  const [medicalModalVisible, setMedicalModalVisible] = useState<boolean>(false);
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [selectedMapPointId, setSelectedMapPointId] = useState<string | null>(null);

  // Animated progress for 2-second hold interaction
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Temperature threshold check for heat risk border tint
  const isHeatRisk = MOCK_TEMPERATURE_NUMERIC > HEAT_RISK_THRESHOLD;

  // SOS Press & Hold Handler (Requires 2000ms hold before triggering)
  const handlePressIn = () => {
    setIsHolding(true);
    progressAnim.setValue(0);

    const listenerId = progressAnim.addListener(({ value }) => {
      setHoldPercent(Math.round(value * 100));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000, // 2 seconds hold
      useNativeDriver: false,
    }).start(({ finished }) => {
      progressAnim.removeListener(listenerId);
      if (finished) {
        triggerSOS();
      }
    });
  };

  const handlePressOut = () => {
    setIsHolding(false);
    setHoldPercent(0);
    progressAnim.stopAnimation();
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const triggerSOS = () => {
    setIsHolding(false);
    setHoldPercent(0);

    // Haptic feedback alert
    Vibration.vibrate([0, 200, 100, 200]);

    // Emergency alert
    console.log('SOS Triggered successfully!');
    Alert.alert(
      t('sosAlertTitle', 'Emergency SOS Triggered'),
      t(
        'sosAlertMessage',
        'Emergency responders and your Dindi Leader have been notified.',
      ),
      [{ text: 'OK' }],
    );
  };

  const handleOpenVoiceBlob = () => {
    navigation.navigate('Chat');
  };

  const handleVoiceTranscriptComplete = (transcript: string) => {
    navigation.navigate('Chat');
  };

  const handleCallLeader = () => {
    Vibration.vibrate(40);
    Alert.alert(
      'Call Dindi Leader',
      'Dialing Sopanrao Maharaj (+91 98765 43210)...',
    );
  };

  const handleViewMedicalID = () => {
    setMedicalModalVisible(true);
  };

  const handleChatAction = (actionType: string) => {
    if (actionType === 'call_leader') {
      handleCallLeader();
    } else if (actionType === 'medical_sos') {
      setChatModalVisible(false);
      setMedicalModalVisible(true);
    }
  };

  // SOS Outer Ring Animations
  const outerRingScale = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const outerRingBorderWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 8],
  });

  const outerRingColor = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(211, 47, 47, 0.25)', 'rgba(211, 47, 47, 0.95)'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar: Location Pill on left, Weather Chip on right */}
        <View style={styles.topBar}>
          {/* Location Pill */}
          <View style={styles.locationPill}>
            <Ionicons
              name="location-sharp"
              size={15}
              color={colors.maroon}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {t('nearWakhari', 'Near Wakhari · Dindi 12')}
            </Text>
          </View>

          {/* Weather Chip with heat risk tint */}
          <View
            style={[
              styles.weatherChip,
              isHeatRisk && styles.weatherChipHeatRisk,
            ]}
          >
            <Ionicons
              name="sunny"
              size={15}
              color="#F57C00"
              style={styles.weatherIcon}
            />
            <Text style={styles.weatherText}>
              {t('weatherTemp', '34°C')}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* "Today's Journey" Card */}
          <View style={styles.journeyCard}>
            <View style={styles.journeyHeaderRow}>
              <Ionicons
                name="compass-outline"
                size={16}
                color={colors.maroon}
                style={styles.journeyHeaderIcon}
              />
              <Text style={styles.journeyHeaderTitle}>
                {t('todaysJourney', "TODAY'S JOURNEY")}
              </Text>
            </View>

            {/* Current & Next Stop Route */}
            <Text style={styles.journeyRouteText}>
              {t('journeyRoute', 'Wakhari → Phaltan · 12 km left')}
            </Text>

            {/* Advisory Line */}
            <View style={styles.advisoryRow}>
              <Ionicons
                name="warning-outline"
                size={14}
                color={colors.saffronDark}
                style={styles.advisoryIcon}
              />
              <Text style={styles.advisoryText}>
                {t(
                  'heatAdvisory',
                  'High heat expected midday, rest before 1 PM',
                )}
              </Text>
            </View>
          </View>

          {/* Dominant SOS Button Area */}
          <View style={styles.sosContainer}>
            <Animated.View
              style={[
                styles.sosOuterRing,
                {
                  transform: [{ scale: outerRingScale }],
                  borderColor: outerRingColor,
                  borderWidth: outerRingBorderWidth,
                },
              ]}
            />

            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              accessibilityRole="button"
              accessibilityLabel="Emergency SOS Button"
              accessibilityHint="Tap and hold for 2 seconds to trigger emergency SOS"
            >
              <View
                style={[
                  styles.sosButton,
                  isHolding && styles.sosButtonHolding,
                ]}
              >
                <Text style={styles.sosText}>{t('sosText', 'SOS')}</Text>
                <Text style={styles.sosSubtext}>
                  {isHolding
                    ? `${t('holding', 'Keep holding...')} ${holdPercent}%`
                    : t('tapAndHold', 'Tap and hold')}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* AI PILGRIM ASSISTANT / VOICE HELPER CARD WITH 3D AI BLOB TRIGGER */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenVoiceBlob}
            style={styles.aiAssistantCard}
          >
            <View style={styles.aiCardLeft}>
              <View style={styles.aiIconBadge}>
                <Ionicons name="sparkles" size={18} color="#FFD700" />
              </View>
              <View style={styles.aiTextGroup}>
                <Text style={styles.aiTitle}>वारीरक्षक व्हॉईस AI (Voice Assistant)</Text>
                <Text style={styles.aiSubtitle}>
                  Tap to speak: Ask water stops, route guidance, or call leader
                </Text>
              </View>
            </View>
            <View style={styles.aiMicAction}>
              <Ionicons name="mic-circle" size={36} color={colors.saffronDark} />
            </View>
          </TouchableOpacity>

          {/* Open Chatbot Text Assistant Link */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setChatModalVisible(true)}
            style={styles.openChatLink}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={colors.maroon} />
            <Text style={styles.openChatLinkText}>
              Open Text Chatbot Assistant (मेसेजद्वारे बोला)
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.maroon} />
          </TouchableOpacity>

          {/* INTERACTIVE VARKARI ROUTE & SUPPORT MAP PREVIEW */}
          <View style={styles.mapSectionCard}>
            <View style={styles.mapSectionHeader}>
              <View style={styles.mapTitleRow}>
                <Ionicons name="map-sharp" size={18} color={colors.maroon} />
                <Text style={styles.mapSectionTitle}>
                  {t('liveWariMap', 'लाईव्ह वारी नकाशा (Live Route Map)')}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMapModalVisible(true)}
                style={styles.expandHeaderLink}
              >
                <Text style={styles.expandHeaderLinkText}>
                  {t('exploreMap', 'पूर्ण नकाशा')}
                </Text>
                <Ionicons name="expand-outline" size={14} color={colors.saffronDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.mapSubtitleText}>
              {t(
                'mapLocationSub',
                '📍 वाखरी प्रवेशद्वाराजवळ · १२.५ कि.मी. पंढरपूर मंदिर बाकी',
              )}
            </Text>

            {/* Embedded OpenStreetMap Preview */}
            <View style={styles.mapEmbedWrapper}>
              <VarkariInteractiveMap
                isFullScreen={false}
                onExpand={() => setMapModalVisible(true)}
              />
            </View>

            {/* Nearby Quick Service Badges */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyServicesStrip}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMapPointId('med-1');
                  setMapModalVisible(true);
                }}
                style={styles.nearbyPill}
              >
                <Text style={styles.nearbyPillIcon}>🏥</Text>
                <Text style={styles.nearbyPillText}>
                  {t('nearbyMedical', 'फिरते रुग्णालय · ३५० मी.')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMapPointId('wat-1');
                  setMapModalVisible(true);
                }}
                style={styles.nearbyPill}
              >
                <Text style={styles.nearbyPillIcon}>🚰</Text>
                <Text style={styles.nearbyPillText}>
                  {t('nearbyWater', 'पाणी टँकर · १५० मी.')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMapPointId('food-1');
                  setMapModalVisible(true);
                }}
                style={styles.nearbyPill}
              >
                <Text style={styles.nearbyPillIcon}>🍛</Text>
                <Text style={styles.nearbyPillText}>
                  {t('nearbyFood', 'महाप्रसाद · ४०० मी.')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMapPointId('vol-1');
                  setMapModalVisible(true);
                }}
                style={styles.nearbyPill}
              >
                <Text style={styles.nearbyPillIcon}>🧑‍🤝‍🧑</Text>
                <Text style={styles.nearbyPillText}>
                  {t('nearbyVolunteer', 'स्वयंसेवक · २२० मी.')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Compact Cards Row: My Dindi Leader & My Medical ID */}
          <View style={styles.compactCardsRow}>
            {/* Left Card: My Dindi Leader */}
            <View style={styles.compactCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons
                  name="person-circle-sharp"
                  size={32}
                  color={colors.maroon}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCallLeader}
                  style={styles.callButton}
                  accessibilityLabel="Call Dindi Leader"
                >
                  <Ionicons name="call" size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardLabel}>
                {t('myDindiLeader', 'My Dindi Leader')}
              </Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {t('mockLeaderName', 'Sopanrao Maharaj')}
              </Text>
            </View>

            {/* Right Card: My Medical ID */}
            <View style={styles.compactCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.qrBadge}>
                  <Ionicons
                    name="qr-code-sharp"
                    size={20}
                    color={colors.saffronDark}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleViewMedicalID}
                  style={styles.viewButton}
                  accessibilityLabel="View Medical ID"
                >
                  <Text style={styles.viewButtonText}>
                    {t('view', 'View')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardLabel}>
                {t('myMedicalId', 'My Medical ID')}
              </Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                Emergency Card
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* FULL 3D VOICE BLOB MODAL WINDOW */}
      <VoiceBlobModal
        visible={voiceBlobVisible}
        onClose={() => setVoiceBlobVisible(false)}
        onSwitchToChat={() => {
          setVoiceBlobVisible(false);
          setChatModalVisible(true);
        }}
        onTranscriptComplete={handleVoiceTranscriptComplete}
        mode="varkari"
      />

      {/* FULL CHATBOT MODAL WITH MESSAGE SCROLLER */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <VariRakshaChatbot
            mode="varkari"
            onClose={() => setChatModalVisible(false)}
            onActionPress={handleChatAction}
          />
        </SafeAreaView>
      </Modal>

      {/* EMERGENCY MEDICAL ID MODAL */}
      <Modal
        visible={medicalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMedicalModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.medicalModalContainer}>
            {/* Modal Header */}
            <View style={styles.medicalModalHeader}>
              <View>
                <Text style={styles.medicalModalSub}>OFFLINE EMERGENCY CARD</Text>
                <Text style={styles.medicalModalTitle}>My Medical ID</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMedicalModalVisible(false)}
                style={styles.medicalModalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.medicalModalScroll}>
              {/* QR Code & Identity Card */}
              <View style={styles.medicalCardHero}>
                <View style={styles.medicalQrContainer}>
                  <Ionicons name="qr-code" size={110} color={colors.maroon} />
                  <Text style={styles.medicalQrCaption}>Scan for Emergency Medical Mesh Data</Text>
                </View>

                <View style={styles.medicalPilgrimDetails}>
                  <Text style={styles.medicalPilgrimName}>Tukaram Patil</Text>
                  <Text style={styles.medicalPilgrimSub}>Age: 58 · Male · Dindi #12</Text>
                  <View style={styles.bloodBadge}>
                    <Ionicons name="water" size={16} color="#D32F2F" />
                    <Text style={styles.bloodBadgeText}>Blood Group: O+ (Positive)</Text>
                  </View>
                </View>
              </View>

              {/* Critical Health Parameters */}
              <View style={styles.medicalSectionCard}>
                <Text style={styles.medicalSectionTitle}>CRITICAL HEALTH DATA</Text>

                <View style={styles.medicalItemRow}>
                  <Ionicons name="alert-circle-outline" size={18} color="#D32F2F" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalItemLabel}>Allergies</Text>
                    <Text style={styles.medicalItemValue}>Penicillin, Dust</Text>
                  </View>
                </View>

                <View style={styles.medicalItemRow}>
                  <Ionicons name="heart-outline" size={18} color="#E65100" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalItemLabel}>Chronic Conditions</Text>
                    <Text style={styles.medicalItemValue}>Mild Hypertension (BP), Knee Arthritis</Text>
                  </View>
                </View>

                <View style={styles.medicalItemRow}>
                  <Ionicons name="fitness-outline" size={18} color="#2E7D32" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalItemLabel}>Daily Medications</Text>
                    <Text style={styles.medicalItemValue}>Amlodipine 5mg (Morning after breakfast)</Text>
                  </View>
                </View>
              </View>

              {/* Emergency Contacts */}
              <View style={styles.medicalSectionCard}>
                <Text style={styles.medicalSectionTitle}>EMERGENCY CONTACTS</Text>

                <View style={styles.medicalContactItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalContactName}>Ramesh Patil (Son)</Text>
                    <Text style={styles.medicalContactPhone}>+91 98220 12345</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Calling Ramesh Patil', 'Dialing +91 98220 12345...')}
                    style={styles.contactCallBtn}
                  >
                    <Ionicons name="call" size={16} color={colors.surface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.medicalContactItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalContactName}>Sopanrao Maharaj (Dindi Leader)</Text>
                    <Text style={styles.medicalContactPhone}>+91 98765 43210 · Dindi 12</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCallLeader}
                    style={styles.contactCallBtn}
                  >
                    <Ionicons name="call" size={16} color={colors.surface} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Offline Mesh Safety Note */}
              <View style={styles.meshSafetyNote}>
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                <Text style={styles.meshSafetyNoteText}>
                  This medical profile is stored encrypted offline on this device and broadcasts over BLE mesh in emergency SOS mode.
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* FULL INTERACTIVE OPENSTREETMAP MODAL */}
      <VarkariMapModal
        visible={mapModalVisible}
        onClose={() => {
          setMapModalVisible(false);
          setSelectedMapPointId(null);
        }}
        initialPointId={selectedMapPointId}
      />
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
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherChipHeatRisk: {
    borderColor: colors.warning,
    borderWidth: 1.5,
    backgroundColor: 'rgba(245, 124, 0, 0.08)',
  },
  weatherIcon: {
    marginRight: 4,
  },
  weatherText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  journeyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  journeyHeaderIcon: {
    marginRight: 6,
  },
  journeyHeaderTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  journeyRouteText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    marginBottom: spacing.xs + 2,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 10,
  },
  advisoryIcon: {
    marginRight: 6,
  },
  advisoryText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.saffronDark,
    flex: 1,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    height: 180,
  },
  sosOuterRing: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.sosRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  sosButtonHolding: {
    backgroundColor: '#B71C1C',
    transform: [{ scale: 0.96 }],
  },
  sosText: {
    fontSize: 34,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
    letterSpacing: 2,
  },
  sosSubtext: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  aiAssistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    marginBottom: spacing.xs + 2,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  aiIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiTextGroup: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  aiSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiMicAction: {
    marginLeft: 6,
  },
  openChatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  openChatLinkText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  compactCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  compactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  callButton: {
    backgroundColor: colors.saffronDark,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  qrBadge: {
    backgroundColor: 'rgba(230, 81, 0, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  medicalModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  medicalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  medicalModalSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 1,
  },
  medicalModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  medicalModalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  medicalModalScroll: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  medicalCardHero: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  medicalQrContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    marginBottom: 12,
  },
  medicalQrCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  medicalPilgrimDetails: {
    alignItems: 'center',
    width: '100%',
  },
  medicalPilgrimName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  medicalPilgrimSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  bloodBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D32F2F',
  },
  medicalSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  medicalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.5,
  },
  medicalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicalItemLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  medicalItemValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginTop: 1,
  },
  medicalContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  medicalContactName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  medicalContactPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.saffronDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meshSafetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  meshSafetyNoteText: {
    fontSize: 12,
    color: '#1B5E20',
    flex: 1,
    lineHeight: 16,
  },
  mapSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  mapSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.maroon,
  },
  expandHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expandHeaderLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
  },
  mapSubtitleText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  mapEmbedWrapper: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  nearbyServicesStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  nearbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  nearbyPillIcon: {
    fontSize: 13,
  },
  nearbyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
});

export default HomeSOSScreen;
