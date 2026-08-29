import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { PilgrimTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

interface DindiPeer {
  id: string;
  nameMr: string;
  nameEn: string;
  roleMr: string;
  roleEn: string;
  status: 'safe' | 'medical' | 'resting';
  distance: string;
}

const DINDI_MEMBERS: DindiPeer[] = [
  {
    id: '1',
    nameMr: 'ज्ञानेश्वर कदम',
    nameEn: 'Dnyaneshwar Kadam',
    roleMr: 'ध्वजधारक (Flag Bearer)',
    roleEn: 'Flag Bearer',
    status: 'safe',
    distance: '२० मी.',
  },
  {
    id: '2',
    nameMr: 'आनंदराव शिंदे',
    nameEn: 'Anandrao Shinde',
    roleMr: 'मृदुंग वादक',
    roleEn: 'Mridang Player',
    status: 'safe',
    distance: '३५ मी.',
  },
  {
    id: '3',
    nameMr: 'कमलाबाई पाटील',
    nameEn: 'Kamlabai Patil',
    roleMr: 'वारकरी',
    roleEn: 'Pilgrim',
    status: 'resting',
    distance: 'विश्रांती मंडपात',
  },
  {
    id: '4',
    nameMr: 'बाळू कांबळे',
    nameEn: 'Balu Kamble',
    roleMr: 'वारकरी',
    roleEn: 'Pilgrim',
    status: 'safe',
    distance: '५० मी.',
  },
];

const HARIPATH_TEXT = `।। श्री ज्ञानदेव हरिपाठ ।।
देवाचिये द्वारीं उभा क्षणभरी ।
तेणें मुक्ति चारी साधियेल्या ॥१॥

हरि मुखें म्हणा हरि मुखें म्हणा ।
पुण्याची गणना कोण करी ॥२॥

असोनि संसारीं जिव्हे वेग करीं ।
काळ वेळ न साहे यासी ॥३॥

ज्ञानदेव म्हणे व्यासाचिये खुणे ।
द्वारकेचे पेणे पांडवां घरीं ॥४॥

।। जय जय राम कृष्ण हरी ।।`;

export const DindiGroupScreen: React.FC<PilgrimTabScreenProps<'Dindi'>> = () => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [isPlayingBroadcast, setIsPlayingBroadcast] = useState<boolean>(false);
  const [haripathModalVisible, setHaripathModalVisible] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleCallLeader = () => {
    Vibration.vibrate(30);
    Alert.alert(
      isMarathi ? 'दिंडी प्रमुखांना कॉल' : 'Call Dindi Leader',
      `${isMarathi ? 'डायल करत आहे:' : 'Dialing:'} ह.भ.प. सोपानराव महाराज (+91 98765 43210)`,
      [
        { text: isMarathi ? 'रद्द करा' : 'Cancel', style: 'cancel' },
        { text: isMarathi ? 'कॉल' : 'Call' },
      ],
    );
  };

  const handleLocateFlag = () => {
    Vibration.vibrate(30);
    Alert.alert(
      isMarathi ? 'दिंडी ध्वज दिशा (Radar)' : 'Dindi Flag Direction',
      isMarathi
        ? '🚩 दिंडी क्र. १२ चा मुख्य ध्वज तुमच्यापासून ३५ मीटर पुढे (चालण्याच्या दिशेने) आहे. सुरक्षित मेश कक्षेत आहात.'
        : '🚩 Dindi #12 Main Flag is 35 meters ahead in your walking direction. Within safe mesh bubble.',
    );
  };

  const handleCheckInToggle = () => {
    Vibration.vibrate(35);
    const nextState = !isCheckedIn;
    setIsCheckedIn(nextState);
    Alert.alert(
      nextState
        ? isMarathi
          ? 'हजेरी नोंदवली!'
          : 'Checked In!'
        : isMarathi
        ? 'हजेरी रद्द'
        : 'Check-in Cancelled',
      nextState
        ? isMarathi
          ? 'दिंडी प्रमुखांना तुमची सुरक्षित उपस्थिती कळवली आहे.'
          : 'Your safe attendance is confirmed with the Dindi Leader.'
        : isMarathi
        ? 'तुमची स्थिती अपडेट केली.'
        : 'Updated status.',
    );
  };

  const handlePlayLeaderBroadcast = () => {
    Vibration.vibrate(25);
    if (isPlayingBroadcast) {
      Speech.stop();
      setIsPlayingBroadcast(false);
      return;
    }

    setIsPlayingBroadcast(true);
    const speechText = isMarathi
      ? 'दिंडी प्रमुखांचा संदेश: सर्व वारकऱ्यांनी दुपारी १२:३० वाजता वाखरी अन्नछत्रात डाव्या बाजूला जमावे. उन्हापासून संरक्षणासाठी टोपी वापरा. जय हरी विठ्ठल.'
      : 'Leader Announcement: All Dindi members assemble at Wakhari Annachhatra on left side by 12:30 PM. Stay hydrated.';

    try {
      Speech.speak(speechText, {
        language: isMarathi ? 'mr-IN' : 'en-IN',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsPlayingBroadcast(false),
        onError: () => setIsPlayingBroadcast(false),
      });
    } catch {
      setIsPlayingBroadcast(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Minimal Clean Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>
              {isMarathi ? 'माझी दिंडी' : 'MY DINDI GROUP'}
            </Text>
            <Text style={styles.headerTitle}>
              {isMarathi ? 'दिंडी क्र. १२' : 'Dindi #12'}
            </Text>
          </View>
          <View style={styles.liveSafeBadge}>
            <View style={styles.liveSafeDot} />
            <Text style={styles.liveSafeText}>
              {isMarathi ? 'मेश सुरक्षित (३५ मी.)' : 'Safe Mesh (35m)'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dindi Leader & Flag Proximity Card */}
          <View style={styles.leaderCard}>
            <View style={styles.leaderHeaderRow}>
              <View style={styles.avatarBox}>
                <Ionicons name="person" size={24} color={colors.maroon} />
              </View>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderRoleLabel}>
                  {isMarathi ? 'दिंडी प्रमुख (Leader)' : 'Dindi Group Leader'}
                </Text>
                <Text style={styles.leaderName}>
                  {isMarathi ? 'ह.भ.प. सोपानराव महाराज' : 'Sopanrao Maharaj'}
                </Text>
                <Text style={styles.proximityText}>
                  📍 {isMarathi ? 'ध्वज ३५ मी. पुढे आहे' : 'Flag is 35m ahead'}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.leaderActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCallLeader}
                style={styles.actionBtnCall}
              >
                <Ionicons name="call" size={16} color={colors.surface} />
                <Text style={styles.actionBtnCallText}>
                  {isMarathi ? 'कॉल करा' : 'Call Leader'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLocateFlag}
                style={styles.actionBtnLocate}
              >
                <Ionicons name="compass" size={16} color={colors.maroon} />
                <Text style={styles.actionBtnLocateText}>
                  {isMarathi ? 'ध्वज शोधा' : 'Find Flag'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Leader's Latest Audio Broadcast Card */}
          <View style={styles.broadcastCard}>
            <View style={styles.broadcastHeaderRow}>
              <View style={styles.broadcastTag}>
                <Ionicons name="megaphone" size={14} color={colors.saffronDark} />
                <Text style={styles.broadcastTagText}>
                  {isMarathi ? 'महाराजांचा संदेश' : 'LEADER NOTICE'}
                </Text>
              </View>
              <Text style={styles.broadcastTimeText}>11:45 AM</Text>
            </View>

            <Text style={styles.broadcastBody}>
              {isMarathi
                ? '“दुपारी १२:३० वाजता सर्व दिंडी सदस्यांनी वाखरी अन्नछत्रात डाव्या बाजूला जमावे.”'
                : '"All Dindi members gather at Wakhari Annachhatra by 12:30 PM."'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePlayLeaderBroadcast}
              style={[
                styles.audioPlayBtn,
                isPlayingBroadcast && styles.audioPlayBtnActive,
              ]}
            >
              <Ionicons
                name={isPlayingBroadcast ? 'volume-high' : 'play-circle'}
                size={16}
                color={isPlayingBroadcast ? colors.surface : colors.saffronDark}
              />
              <Text
                style={[
                  styles.audioPlayBtnText,
                  isPlayingBroadcast && styles.audioPlayBtnTextActive,
                ]}
              >
                {isPlayingBroadcast
                  ? isMarathi
                    ? 'थांबवा (Stop)'
                    : 'Stop Audio'
                  : isMarathi
                  ? 'संदेश ऐका (Listen)'
                  : 'Listen Voice'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Group Roll-Call & My Safe Check-In */}
          <View style={styles.rollCallCard}>
            <View style={styles.rollCallHeader}>
              <View>
                <Text style={styles.rollCallTitle}>
                  {isMarathi ? 'दिंडी हजेरी व सुरक्षा' : 'Group Attendance'}
                </Text>
                <Text style={styles.rollCallSubtitle}>
                  {isMarathi ? '४२ / ४५ सदस्य सुरक्षित सोबत' : '42 of 45 Members Safe'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCheckInToggle}
                style={[
                  styles.checkInBtn,
                  isCheckedIn && styles.checkInBtnDone,
                ]}
              >
                <Ionicons
                  name={isCheckedIn ? 'checkmark-circle' : 'radio-button-on'}
                  size={16}
                  color={isCheckedIn ? colors.surface : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.checkInBtnText,
                    isCheckedIn && styles.checkInBtnTextDone,
                  ]}
                >
                  {isCheckedIn
                    ? isMarathi
                      ? 'मी हजर आहे'
                      : "I'm Safe"
                    : isMarathi
                    ? 'हजेरी नोंदवा'
                    : 'Check In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Members Quick List */}
            <View style={styles.membersList}>
              {DINDI_MEMBERS.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberLeft}>
                    <View
                      style={[
                        styles.statusDot,
                        m.status === 'safe'
                          ? styles.statusDotSafe
                          : styles.statusDotRest,
                      ]}
                    />
                    <Text style={styles.memberName}>
                      {isMarathi ? m.nameMr : m.nameEn}
                    </Text>
                  </View>
                  <Text style={styles.memberDistance}>
                    {m.distance}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Dindi Luggage Truck & Night Camp Spot */}
          <View style={styles.campCard}>
            <View style={styles.campItem}>
              <View style={styles.campIconBox}>
                <Ionicons name="bus" size={18} color={colors.maroon} />
              </View>
              <View style={styles.campInfo}>
                <Text style={styles.campLabel}>
                  {isMarathi ? 'सामान गाडी (Luggage Truck)' : 'Luggage Vehicle'}
                </Text>
                <Text style={styles.campValue}>MH-12-AB-1234 · पोहचली</Text>
              </View>
            </View>

            <View style={styles.campDivider} />

            <View style={styles.campItem}>
              <View style={styles.campIconBox}>
                <Ionicons name="bed" size={18} color={colors.success} />
              </View>
              <View style={styles.campInfo}>
                <Text style={styles.campLabel}>
                  {isMarathi ? 'रात्रीचा मुक्काम (Night Camp)' : 'Night Stay Tent'}
                </Text>
                <Text style={styles.campValue}>वाखरी तळ · तंबू क्र. १२</Text>
              </View>
            </View>
          </View>

          {/* Haripath & Nitya Niyam Launcher Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setHaripathModalVisible(true)}
            style={styles.haripathCard}
          >
            <View style={styles.haripathLeft}>
              <Ionicons name="book-sharp" size={20} color="#FFD700" />
              <View>
                <Text style={styles.haripathTitle}>
                  {isMarathi ? 'श्री हरिपाठ व काकड आरती' : 'Daily Haripath & Aarti'}
                </Text>
                <Text style={styles.haripathSub}>
                  {isMarathi ? 'नित्यनेम अभंग वाचन व स्मरण' : 'Daily Wari Prayers Reader'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.surface} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* HARIPATH READER MODAL */}
      <Modal
        visible={haripathModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHaripathModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>श्री हरिपाठ (Shree Haripath)</Text>
              <TouchableOpacity
                onPress={() => setHaripathModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.haripathScroll}>
              <View style={styles.haripathTextBox}>
                <Text style={styles.haripathContentText}>{HARIPATH_TEXT}</Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.maroon,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginTop: 1,
  },
  liveSafeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  liveSafeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  liveSafeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: 10,
  },
  leaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  leaderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderRoleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginTop: 1,
  },
  proximityText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.saffronDark,
    marginTop: 2,
  },
  leaderActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffronDark,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnCallText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.surface,
  },
  actionBtnLocate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F8BBD0',
    gap: 6,
  },
  actionBtnLocateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.maroon,
  },
  broadcastCard: {
    backgroundColor: '#FFF9ED',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  broadcastHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  broadcastTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  broadcastTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
    letterSpacing: 0.5,
  },
  broadcastTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  broadcastBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  audioPlayBtnActive: {
    backgroundColor: colors.saffronDark,
  },
  audioPlayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
  },
  audioPlayBtnTextActive: {
    color: colors.surface,
  },
  rollCallCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rollCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rollCallTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  rollCallSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    marginTop: 1,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkInBtnDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  checkInBtnTextDone: {
    color: colors.surface,
    fontWeight: '800',
  },
  membersList: {
    gap: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSafe: {
    backgroundColor: colors.success,
  },
  statusDotRest: {
    backgroundColor: '#F57C00',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  memberDistance: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  campCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  campItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  campIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campInfo: {
    flex: 1,
  },
  campLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  campValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  campDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  haripathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.maroon,
    borderRadius: 14,
    padding: 12,
    elevation: 2,
  },
  haripathLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  haripathTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
  haripathSub: {
    fontSize: 11,
    color: colors.creamDark,
    marginTop: 1,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.maroon,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  haripathScroll: {
    paddingVertical: spacing.md,
  },
  haripathTextBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  haripathContentText: {
    fontSize: 17,
    lineHeight: 30,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default DindiGroupScreen;
