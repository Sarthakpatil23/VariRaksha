import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Animated,
  Vibration,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DindiLeaderTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';
import { DindiAlert } from '../../types';
import { VariRakshaChatbot } from '../../components/chat/VariRakshaChatbot';
import { VoiceBlobModal } from '../../components/blob/VoiceBlobModal';

// Extended Dindi Alert interface for richer radar details
interface RichDindiAlert extends DindiAlert {
  battery?: string;
  bearing?: string;
  avatarSeed?: string;
  age?: number;
  relayNode?: string;
}

const INITIAL_MOCK_ALERTS: RichDindiAlert[] = [
  {
    id: 'a1',
    memberId: 'm1',
    memberName: 'Pandurang Patil',
    type: 'urgent',
    statusLine: 'Drifted from group, 420m North-West · Off-Route',
    timestamp: '8 mins ago',
    distanceAway: '420m NW',
    phone: '+91 98765 43210',
    battery: '68%',
    bearing: 'NW',
    age: 64,
    relayNode: 'Relay #4 (Sant Tukaram Dindi)',
  },
  {
    id: 'a2',
    memberId: 'm2',
    memberName: 'Shantabai Shinde',
    type: 'urgent',
    statusLine: 'Fell behind dindi pace, 150m behind main flag',
    timestamp: '15 mins ago',
    distanceAway: '150m Behind',
    phone: '+91 98123 45678',
    battery: '42%',
    bearing: 'S',
    age: 70,
    relayNode: 'Relay #2 (Dindi 12 Tail)',
  },
  {
    id: 'a3',
    type: 'info',
    statusLine: 'Next Water & Rest Stop reached — Phaltan Ashram (2.4 km ahead)',
    timestamp: '25 mins ago',
  },
  {
    id: 'a4',
    type: 'info',
    statusLine: 'Heat Advisory: 34°C expected at 1:00 PM. Hydrate all elder pilgrims.',
    timestamp: '40 mins ago',
  },
];

type AlertFilter = 'all' | 'urgent' | 'info';

export const DindiLeaderDashboardScreen: React.FC<
  DindiLeaderTabScreenProps<'DindiLeaderDashboard'>
> = ({ navigation }) => {
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState<RichDindiAlert[]>(INITIAL_MOCK_ALERTS);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals state
  const [meetupModalVisible, setMeetupModalVisible] = useState<boolean>(false);
  const [chatModalVisible, setChatModalVisible] = useState<boolean>(false);
  const [voiceBlobVisible, setVoiceBlobVisible] = useState<boolean>(false);
  const [selectedMeetupPreset, setSelectedMeetupPreset] = useState<string>(
    '🍽️ Lunch Annachhatra',
  );
  const [customMeetupText, setCustomMeetupText] = useState<string>('');

  // Attendance stats
  const [checkedInCount, setCheckedInCount] = useState<number>(42);
  const totalMembers = 45;
  const missingCount = totalMembers - checkedInCount;
  const checkInRatio = checkedInCount / totalMembers;

  // Animation values
  const syncSpinAnim = useRef(new Animated.Value(0)).current;

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === 'urgent') return alert.type === 'urgent';
      if (filter === 'info') return alert.type === 'info';
      return true;
    });
  }, [alerts, filter]);

  const urgentCount = useMemo(() => {
    return alerts.filter((a) => a.type === 'urgent').length;
  }, [alerts]);

  // Handle Quick Mesh Sync / Roll Call
  const handleTriggerSync = () => {
    setIsSyncing(true);
    Vibration.vibrate(50);

    Animated.timing(syncSpinAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      syncSpinAnim.setValue(0);
      setIsSyncing(false);
      setSyncToast('43/45 Pilgrims synced via Offline BLE Mesh');
      setTimeout(() => setSyncToast(null), 3500);
    });
  };

  // Handle Call Member
  const handleCallMember = (alert: RichDindiAlert) => {
    Vibration.vibrate(40);
    Alert.alert(
      '📞 ' + (alert.memberName || 'Pilgrim'),
      `Calling ${alert.memberName} at ${alert.phone || '+91 98765 43210'}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', style: 'default' },
      ],
    );
  };

  // Handle Sound Alarm on Member Device
  const handlePingAlarm = (memberName?: string) => {
    Vibration.vibrate([0, 100, 80, 100]);
    Alert.alert(
      '🔔 Emergency Chime Sent',
      `A loud audio alert signal was sent to ${memberName || 'the pilgrim'}'s phone via the mesh network.`,
    );
  };

  // Handle Mark Member as Safe / Found
  const handleMarkFound = (alertId: string, memberName?: string) => {
    Vibration.vibrate(60);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setCheckedInCount((prev) => Math.min(totalMembers, prev + 1));
    Alert.alert(
      '✅ Member Checked In',
      `${memberName || 'Pilgrim'} has rejoined Dindi 12 and marked as safe.`,
    );
  };

  // Quick Action Handlers
  const handleBroadcast = () => {
    navigation.navigate('Broadcast');
  };

  const handleOpenMembers = () => {
    navigation.navigate('DindiMembers');
  };

  const handleOpenProfile = () => {
    navigation.navigate('Profile');
  };

  const handleMedicalCampSOS = () => {
    Vibration.vibrate([0, 150, 100, 150]);
    Alert.alert(
      '🚑 Contact Route Medical Camp',
      'Choose emergency response option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Ambulance to GPS',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Ambulance Dispatched',
              'Mobile Medical Unit #2 alerted to your Dindi GPS location.',
            ),
        },
        {
          text: 'Call Doctor On-Duty',
          onPress: () =>
            Alert.alert(
              'Connecting Call',
              'Dialing Dr. Deshmukh (Phaltan Seva Camp)...',
            ),
        },
      ],
    );
  };

  const handleConfirmMeetupPoint = () => {
    const point = customMeetupText.trim() || selectedMeetupPreset;
    setMeetupModalVisible(false);
    setCustomMeetupText('');
    Vibration.vibrate(80);
    Alert.alert(
      '📍 Meetup Point Broadcasted',
      `All Dindi members notified: Meet at "${point}"`,
    );
  };

  const handleChatAction = (actionType: string) => {
    if (actionType === 'broadcast') {
      setChatModalVisible(false);
      navigation.navigate('Broadcast');
    } else if (actionType === 'medical_sos') {
      setChatModalVisible(false);
      handleMedicalCampSOS();
    } else if (actionType === 'call_leader') {
      const urgentAlert = alerts.find((a) => a.type === 'urgent');
      if (urgentAlert) {
        handleCallMember(urgentAlert);
      }
    }
  };

  const handleVoiceTranscriptComplete = (transcript: string) => {
    setChatModalVisible(true);
  };

  const spin = syncSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.leaderAvatarRing}>
            <Image
              source={require('../../../assets/images/dindi_leader.png')}
              style={styles.leaderAvatar}
              resizeMode="cover"
            />
          </View>
          <View style={styles.leaderTextGroup}>
            <View style={styles.leaderBadgeRow}>
              <Text style={styles.leaderBadgeText}>DINDI 12 PRAMUKH</Text>
              <View style={styles.meshPill}>
                <View style={styles.meshDot} />
                <Text style={styles.meshPillText}>Mesh Active</Text>
              </View>
            </View>
            <Text style={styles.leaderName}>ह.भ.प. सोपानराव महाराज</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTriggerSync}
            style={styles.headerIconButton}
            accessibilityLabel="Sync Mesh"
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons
                name="sync-sharp"
                size={20}
                color={colors.maroon}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenProfile}
            style={styles.headerIconButton}
            accessibilityLabel="Profile"
          >
            <Ionicons
              name="person-circle-sharp"
              size={22}
              color={colors.maroon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Toast Feedback */}
      {syncToast && (
        <View style={styles.syncToastBanner}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color="#2E7D32"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.syncToastText}>{syncToast}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD: Attendance & Live Headcount Radar */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardHeader}>
            <View>
              <Text style={styles.heroPreTitle}>LIVE HEADCOUNT & ATTENDANCE</Text>
              <Text style={styles.heroMainTitle}>
                {checkedInCount}{' '}
                <Text style={styles.heroTotalText}>/ {totalMembers} Present</Text>
              </Text>
            </View>
            <View
              style={[
                styles.percentageBadge,
                missingCount > 0 ? styles.percentageWarning : styles.percentageSuccess,
              ]}
            >
              <Text
                style={[
                  styles.percentageText,
                  missingCount > 0 ? styles.percentageTextWarning : styles.percentageTextSuccess,
                ]}
              >
                {Math.round(checkInRatio * 100)}%
              </Text>
            </View>
          </View>

          {/* Segmented Visual Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarSegmentChecked,
                { flex: checkedInCount },
              ]}
            />
            {urgentCount > 0 && (
              <View
                style={[styles.progressBarSegmentUrgent, { flex: urgentCount }]}
              />
            )}
            {missingCount - urgentCount > 0 && (
              <View
                style={[
                  styles.progressBarSegmentPending,
                  { flex: Math.max(0, missingCount - urgentCount) },
                ]}
              />
            )}
          </View>

          {/* Metric Chips Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.metricLabel}>Checked In:</Text>
              <Text style={styles.metricVal}>{checkedInCount}</Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#D32F2F' }]} />
              <Text style={styles.metricLabel}>Drifted:</Text>
              <Text style={[styles.metricVal, { color: '#D32F2F' }]}>
                {urgentCount}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#F57C00' }]} />
              <Text style={styles.metricLabel}>Pending:</Text>
              <Text style={styles.metricVal}>{Math.max(0, missingCount - urgentCount)}</Text>
            </View>
          </View>

          {/* Hero Card Footer Action Bar */}
          <View style={styles.heroFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTriggerSync}
              style={styles.heroSyncButton}
            >
              <Ionicons
                name="radio-sharp"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.heroSyncButtonText}>Digital Roll-Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenMembers}
              style={styles.heroMembersLink}
            >
              <Text style={styles.heroMembersLinkText}>All Members</Text>
              <Ionicons
                name="chevron-forward-sharp"
                size={16}
                color={colors.maroon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI COMMANDER ASSISTANT BANNER */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Chat')}
          style={styles.aiCommanderCard}
        >
          <View style={styles.aiCardLeft}>
            <View style={styles.aiIconBadge}>
              <Ionicons name="sparkles" size={18} color="#FFD700" />
            </View>
            <View style={styles.aiTextGroup}>
              <Text style={styles.aiTitle}>दिंडी कमान व्हॉईस AI (Commander Voice)</Text>
              <Text style={styles.aiSubtitle}>
                Tap to speak: Draft broadcasts, missing member SOP, or medical advice
              </Text>
            </View>
          </View>
          <View style={styles.aiArrowBtn}>
            <Ionicons name="mic-circle" size={32} color={colors.saffronDark} />
          </View>
        </TouchableOpacity>

        {/* Open Leader Text Assistant Link */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Chat')}
          style={styles.openChatLink}
        >
          <Ionicons name="chatbubbles-outline" size={15} color={colors.maroon} />
          <Text style={styles.openChatLinkText}>
            Open Commander Text Chatbot (कमान चॅट उघडा)
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.maroon} />
        </TouchableOpacity>

        {/* COMMANDER QUICK ACTIONS (4 Grid Tiles) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>COMMAND & CONTROLS</Text>
          <Text style={styles.sectionSubtitle}>Quick Dindi Actions</Text>
        </View>

        <View style={styles.commandGrid}>
          {/* Action 1: Broadcast */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleBroadcast}
            style={[styles.commandTile, styles.tileBroadcast]}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: 'rgba(230, 81, 0, 0.15)' }]}>
              <Ionicons name="megaphone-sharp" size={24} color={colors.saffronDark} />
            </View>
            <Text style={styles.tileTitle}>Dindi Broadcast</Text>
            <Text style={styles.tileDesc}>Voice & Push Alert</Text>
          </TouchableOpacity>

          {/* Action 2: Drop Meetup Anchor */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMeetupModalVisible(true)}
            style={[styles.commandTile, styles.tileMeetup]}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: 'rgba(93, 0, 30, 0.12)' }]}>
              <Ionicons name="location-sharp" size={24} color={colors.maroon} />
            </View>
            <Text style={styles.tileTitle}>Set Meetup</Text>
            <Text style={styles.tileDesc}>Announce Stop</Text>
          </TouchableOpacity>

          {/* Action 3: Medical Emergency */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleMedicalCampSOS}
            style={[styles.commandTile, styles.tileMedical]}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: 'rgba(211, 47, 47, 0.12)' }]}>
              <Ionicons name="medkit-sharp" size={24} color="#D32F2F" />
            </View>
            <Text style={styles.tileTitle}>Medical SOS</Text>
            <Text style={styles.tileDesc}>Route Clinic #2</Text>
          </TouchableOpacity>

          {/* Action 4: Members Roster */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenMembers}
            style={[styles.commandTile, styles.tileRoster]}
          >
            <View style={[styles.tileIconWrapper, { backgroundColor: 'rgba(46, 125, 50, 0.12)' }]}>
              <Ionicons name="people-sharp" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.tileTitle}>Members (45)</Text>
            <Text style={styles.tileDesc}>Full Directory</Text>
          </TouchableOpacity>
        </View>

        {/* WARI WAYFINDER / ROUTE STATUS BANNER */}
        <View style={styles.routeBanner}>
          <View style={styles.routeBannerTop}>
            <View style={styles.routePathContainer}>
              <Ionicons
                name="navigate-circle-sharp"
                size={22}
                color={colors.saffronDark}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.routeTitle}>Wakhari ➔ Phaltan</Text>
            </View>
            <View style={styles.routeDistanceBadge}>
              <Text style={styles.routeDistanceText}>12 km left</Text>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeStatsRow}>
            <View style={styles.routeStatItem}>
              <Ionicons name="sunny-sharp" size={16} color="#E65100" />
              <Text style={styles.routeStatText}>34°C · High Heat Alert</Text>
            </View>

            <View style={styles.routeStatItem}>
              <MaterialCommunityIcons name="water-pump" size={16} color="#0288D1" />
              <Text style={styles.routeStatText}>Water: Phaltan (2.4 km)</Text>
            </View>
          </View>
        </View>

        {/* URGENT ALERTS & RADAR SECTION */}
        <View style={styles.alertsHeaderRow}>
          <View style={styles.alertsTitleContainer}>
            <Ionicons
              name="alert-circle-sharp"
              size={20}
              color={colors.error}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.alertsMainHeading}>GROUP RADAR & ALERTS</Text>
          </View>

          {urgentCount > 0 && (
            <View style={styles.urgentCountBadge}>
              <Text style={styles.urgentCountBadgeText}>{urgentCount} Urgent</Text>
            </View>
          )}
        </View>

        {/* Alert Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All ({alerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('urgent')}
            style={[
              styles.filterTab,
              filter === 'urgent' && styles.filterTabActiveUrgent,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'urgent' && styles.filterTabTextActiveUrgent,
              ]}
            >
              Separation ({urgentCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter('info')}
            style={[
              styles.filterTab,
              filter === 'info' && styles.filterTabActive,
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'info' && styles.filterTabTextActive,
              ]}
            >
              Notices ({alerts.length - urgentCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alerts List */}
        <View style={styles.alertsContainer}>
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyAlertsBox}>
              <Ionicons
                name="checkmark-done-circle"
                size={44}
                color="#2E7D32"
              />
              <Text style={styles.emptyAlertsTitle}>All Clear!</Text>
              <Text style={styles.emptyAlertsSub}>
                No unresolved separation alerts for Dindi 12.
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => {
              const isUrgent = alert.type === 'urgent';

              return (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    isUrgent ? styles.alertCardUrgent : styles.alertCardInfo,
                  ]}
                >
                  {/* Alert Card Header */}
                  <View style={styles.alertHeader}>
                    <View style={styles.alertMemberInfo}>
                      <View
                        style={[
                          styles.alertIconCircle,
                          isUrgent ? styles.iconCircleUrgent : styles.iconCircleInfo,
                        ]}
                      >
                        <Ionicons
                          name={isUrgent ? 'person-sharp' : 'information'}
                          size={18}
                          color={isUrgent ? '#D32F2F' : colors.maroon}
                        />
                      </View>
                      <View>
                        <Text style={styles.alertPersonName}>
                          {alert.memberName || 'Dindi Notice'}
                        </Text>
                        {alert.age && (
                          <Text style={styles.alertPersonSub}>
                            Age {alert.age} · {alert.timestamp}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isUrgent ? (
                      <View style={styles.driftBadge}>
                        <Ionicons
                          name="compass-sharp"
                          size={12}
                          color="#D32F2F"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={styles.driftBadgeText}>
                          {alert.distanceAway}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.infoTimeText}>{alert.timestamp}</Text>
                    )}
                  </View>

                  {/* Status description */}
                  <Text style={styles.alertStatusContent}>
                    {alert.statusLine}
                  </Text>

                  {/* Tech / Relay telemetry for urgent drift */}
                  {isUrgent && alert.relayNode && (
                    <View style={styles.telemetryBox}>
                      <View style={styles.telemetryItem}>
                        <Ionicons name="battery-charging-sharp" size={13} color="#625B71" />
                        <Text style={styles.telemetryText}>
                          Battery: {alert.battery}
                        </Text>
                      </View>
                      <View style={styles.telemetryItem}>
                        <Ionicons name="git-network-sharp" size={13} color="#625B71" />
                        <Text style={styles.telemetryText} numberOfLines={1}>
                          {alert.relayNode}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Tactical Action Buttons for Urgent Alerts */}
                  {isUrgent && (
                    <View style={styles.alertActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleCallMember(alert)}
                        style={styles.btnCall}
                      >
                        <Ionicons
                          name="call-sharp"
                          size={15}
                          color="#FFFFFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.btnCallText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handlePingAlarm(alert.memberName)}
                        style={styles.btnPing}
                      >
                        <Ionicons
                          name="volume-high-sharp"
                          size={15}
                          color={colors.maroon}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.btnPingText}>Sound Chime</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleMarkFound(alert.id, alert.memberName)}
                        style={styles.btnFound}
                      >
                        <Ionicons
                          name="checkmark-circle-sharp"
                          size={16}
                          color="#2E7D32"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.btnFoundText}>Mark Safe</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 3D VOICE BLOB MODAL WINDOW FOR LEADER */}
      <VoiceBlobModal
        visible={voiceBlobVisible}
        onClose={() => setVoiceBlobVisible(false)}
        onSwitchToChat={() => {
          setVoiceBlobVisible(false);
          setChatModalVisible(true);
        }}
        onTranscriptComplete={handleVoiceTranscriptComplete}
        mode="dindiLeader"
      />

      {/* CHATBOT ASSISTANT MODAL FOR LEADER */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <VariRakshaChatbot
            mode="dindiLeader"
            onClose={() => setChatModalVisible(false)}
            onActionPress={handleChatAction}
          />
        </SafeAreaView>
      </Modal>

      {/* MEETUP POINT MODAL */}
      <Modal
        visible={meetupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMeetupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="location-sharp" size={22} color={colors.maroon} />
                <Text style={styles.modalTitle}>Set Meetup & Rest Point</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMeetupModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Broadcast an immediate gathering point to all 45 pilgrims in Dindi 12:
            </Text>

            {/* Presets */}
            <View style={styles.presetsList}>
              {[
                '🍽️ Lunch Annachhatra Mandap',
                '⛺ Night Halt Ground (Phaltan)',
                '🛕 Vitthal Mandir Archway',
                '💧 Seva Camp Water Point',
              ].map((preset) => {
                const isSelected = selectedMeetupPreset === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedMeetupPreset(preset);
                      setCustomMeetupText('');
                    }}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetItemText,
                        isSelected && styles.presetItemTextSelected,
                      ]}
                    >
                      {preset}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.saffronDark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Location Input */}
            <TextInput
              style={styles.customInput}
              placeholder="Or enter custom landmark (e.g. Near Banyan Tree)"
              placeholderTextColor="#9E9E9E"
              value={customMeetupText}
              onChangeText={setCustomMeetupText}
            />

            {/* Confirm Broadcast Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirmMeetupPoint}
              style={styles.modalConfirmButton}
            >
              <Ionicons
                name="megaphone-sharp"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalConfirmButtonText}>
                Broadcast Meetup Point
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    backgroundColor: colors.cream,
    marginRight: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderAvatar: {
    width: '100%',
    height: '100%',
  },
  leaderTextGroup: {
    flex: 1,
  },
  leaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.saffronDark,
    letterSpacing: 0.8,
  },
  meshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  meshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 4,
  },
  meshPillText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
  },
  leaderName: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncToastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  syncToastText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 1.5,
  },

  // HERO CARD STYLES
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md + 2,
    borderWidth: 1.5,
    borderColor: '#EBD8B8',
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.md,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  heroMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.maroon,
  },
  heroTotalText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  percentageSuccess: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  percentageWarning: {
    backgroundColor: 'rgba(230, 81, 0, 0.12)',
    borderColor: 'rgba(230, 81, 0, 0.3)',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
  },
  percentageTextSuccess: {
    color: '#2E7D32',
  },
  percentageTextWarning: {
    color: colors.saffronDark,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#F0E6D2',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  progressBarSegmentChecked: {
    backgroundColor: '#2E7D32',
  },
  progressBarSegmentUrgent: {
    backgroundColor: '#D32F2F',
  },
  progressBarSegmentPending: {
    backgroundColor: '#F57C00',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginRight: 4,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  heroSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  heroSyncButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  heroMembersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  heroMembersLinkText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    marginRight: 2,
  },

  // AI COMMANDER CARD
  aiCommanderCard: {
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
  aiArrowBtn: {
    marginLeft: 6,
  },
  openChatLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  openChatLinkText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },

  // COMMAND TILES
  sectionHeader: {
    marginBottom: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  commandTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tileBroadcast: {
    borderLeftWidth: 4,
    borderLeftColor: colors.saffronDark,
  },
  tileMeetup: {
    borderLeftWidth: 4,
    borderLeftColor: colors.maroon,
  },
  tileMedical: {
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  tileRoster: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  tileIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  tileDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // WARI WAYFINDER BANNER
  routeBanner: {
    backgroundColor: '#FFF1E0',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    marginBottom: spacing.md,
  },
  routeBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routePathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.maroon,
  },
  routeDistanceBadge: {
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  routeDistanceText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  routeDivider: {
    height: 1,
    backgroundColor: 'rgba(93, 0, 30, 0.1)',
    marginVertical: spacing.xs + 2,
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeStatText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },

  // RADAR & ALERTS
  alertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  alertsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsMainHeading: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
    letterSpacing: 0.8,
  },
  urgentCountBadge: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  urgentCountBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  filterTabActiveUrgent: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextActiveUrgent: {
    color: '#FFFFFF',
  },
  alertsContainer: {
    gap: spacing.sm,
  },
  emptyAlertsBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyAlertsTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
    marginTop: 6,
  },
  emptyAlertsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  alertCard: {
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  alertCardUrgent: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFCDD2',
    borderLeftWidth: 5,
    borderLeftColor: '#D32F2F',
  },
  alertCardInfo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 5,
    borderLeftColor: colors.saffronDark,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconCircleUrgent: {
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
  },
  iconCircleInfo: {
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
  },
  alertPersonName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  alertPersonSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  driftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  driftBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D32F2F',
  },
  infoTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  alertStatusContent: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  telemetryBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 10,
    padding: spacing.xs + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  telemetryText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  alertActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  btnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  btnCallText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  btnPing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnPingText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  btnFound: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  btnFoundText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
  },

  // MEETUP MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 1.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  presetsList: {
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  presetItemSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: colors.saffronDark,
  },
  presetItemText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  presetItemTextSelected: {
    color: colors.saffronDark,
  },
  customInput: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffronDark,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default DindiLeaderDashboardScreen;
