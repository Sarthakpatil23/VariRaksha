import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { PilgrimTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

interface ScheduleItem {
  id: string;
  time: string;
  type: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'stop' | 'ritual';
  titleMr: string;
  titleEn: string;
  locationMr: string;
  locationEn: string;
  menuMr?: string;
  menuEn?: string;
  isNext?: boolean;
  isDone?: boolean;
}

interface DayData {
  dayNum: number;
  dateStr: string;
  dateFullMr: string;
  dateFullEn: string;
  labelMr: string;
  labelEn: string;
  routeMr: string;
  routeEn: string;
  isToday?: boolean;
  items: ScheduleItem[];
}

const SCHEDULE_DATA: DayData[] = [
  {
    dayNum: 14,
    dateStr: '29 Aug',
    dateFullMr: '२९ ऑगस्ट २०२६ (शुक्रवार)',
    dateFullEn: '29 Aug 2026 (Friday)',
    labelMr: 'आज',
    labelEn: 'Today',
    routeMr: 'फलटण → वाखरी',
    routeEn: 'Phaltan → Wakhari',
    isToday: true,
    items: [
      {
        id: '14-1',
        time: '05:00 AM',
        type: 'ritual',
        titleMr: 'काकड आरती व प्रस्थान',
        titleEn: 'Kakad Aarti & Departure',
        locationMr: 'फलटण पालखी तळ',
        locationEn: 'Phaltan Palkhi Ground',
        isDone: true,
      },
      {
        id: '14-2',
        time: '07:30 AM',
        type: 'breakfast',
        titleMr: 'सकाळचा नाश्ता',
        titleEn: 'Morning Breakfast',
        locationMr: 'बरड गाव विसावा',
        locationEn: 'Barad Village Rest Stop',
        menuMr: 'पोहे, गूळ-फुटाणे व चहा',
        menuEn: 'Poha, Jaggery-Chana & Tea',
        isDone: true,
      },
      {
        id: '14-3',
        time: '10:30 AM',
        type: 'stop',
        titleMr: 'पाणी व विश्रांती विसावा',
        titleEn: 'Water & Rest Halt',
        locationMr: 'नातेपुते फाटा',
        locationEn: 'Natepute Phata',
        menuMr: 'लिंबू सरबत व पाणी वाटप',
        menuEn: 'Lemon Juice & Water',
        isDone: true,
      },
      {
        id: '14-4',
        time: '12:30 PM',
        type: 'lunch',
        titleMr: 'दुपारचे जेवण (महाप्रसाद)',
        titleEn: 'Lunch (Mahaprasad)',
        locationMr: 'वाखरी प्रवेशद्वार',
        locationEn: 'Wakhari Entrance',
        menuMr: 'झुणका-भाकरी, वरण-भात व ताक',
        menuEn: 'Zunka Bhakri, Rice & Buttermilk',
        isNext: true,
      },
      {
        id: '14-5',
        time: '03:45 PM',
        type: 'ritual',
        titleMr: 'गोल रिंगण सोहळा',
        titleEn: 'Round Ringan Ceremony',
        locationMr: 'वाखरी रिंगण मैदान',
        locationEn: 'Wakhari Ringan Ground',
      },
      {
        id: '14-6',
        time: '05:30 PM',
        type: 'snacks',
        titleMr: 'संध्याकाळचा चहा-नाश्ता',
        titleEn: 'Evening Tea & Snacks',
        locationMr: 'वाखरी शाळा परिसर',
        locationEn: 'Wakhari School Campus',
        menuMr: 'रवा शिरा व कडक चहा',
        menuEn: 'Sheera & Kadak Chai',
      },
      {
        id: '14-7',
        time: '08:00 PM',
        type: 'dinner',
        titleMr: 'रात्रीचे जेवण',
        titleEn: 'Dinner',
        locationMr: 'वाखरी मुक्काम छावणी',
        locationEn: 'Wakhari Camp',
        menuMr: 'सात्विक खिचडी, कढी व गुळवणी',
        menuEn: 'Khichdi, Kadhi & Sweet',
      },
    ],
  },
  {
    dayNum: 15,
    dateStr: '30 Aug',
    dateFullMr: '३० ऑगस्ट २०२६ (शनिवार)',
    dateFullEn: '30 Aug 2026 (Saturday)',
    labelMr: 'उद्या',
    labelEn: 'Tomorrow',
    routeMr: 'वाखरी → भेंडशे',
    routeEn: 'Wakhari → Bhedshe',
    items: [
      {
        id: '15-1',
        time: '05:30 AM',
        type: 'ritual',
        titleMr: 'काकड आरती व प्रस्थान',
        titleEn: 'Kakad Aarti & Departure',
        locationMr: 'वाखरी मुख्य तळ',
        locationEn: 'Wakhari Main Ground',
      },
      {
        id: '15-2',
        time: '08:00 AM',
        type: 'breakfast',
        titleMr: 'सकाळचा नाश्ता',
        titleEn: 'Morning Breakfast',
        locationMr: 'पिराची कुरोली',
        locationEn: 'Pirachi Kuroli',
        menuMr: 'उपमा, केळी व चहा',
        menuEn: 'Upma, Bananas & Tea',
      },
      {
        id: '15-3',
        time: '01:00 PM',
        type: 'lunch',
        titleMr: 'दुपारचे जेवण व विसावा',
        titleEn: 'Lunch & Afternoon Rest',
        locationMr: 'भेंडशे फाटा',
        locationEn: 'Bhedshe Phata',
        menuMr: 'मसालेभात, आमटी व भाकरी',
        menuEn: 'Masale Bhat & Bhakri',
      },
      {
        id: '15-4',
        time: '08:00 PM',
        type: 'dinner',
        titleMr: 'रात्रीचे भोजन व मुक्काम',
        titleEn: 'Dinner & Night Halt',
        locationMr: 'भेंडशे मुक्काम तळ',
        locationEn: 'Bhedshe Camp Base',
        menuMr: 'मुगडाळ खिचडी व कढी',
        menuEn: 'Moong Dal Khichdi & Kadhi',
      },
    ],
  },
  {
    dayNum: 16,
    dateStr: '31 Aug',
    dateFullMr: '३१ ऑगस्ट २०२६ (रविवार)',
    dateFullEn: '31 Aug 2026 (Sunday)',
    labelMr: 'परवा',
    labelEn: 'Day After',
    routeMr: 'भेंडशे → पंढरपूर (दर्शन)',
    routeEn: 'Bhedshe → Pandharpur',
    items: [
      {
        id: '16-1',
        time: '04:30 AM',
        type: 'ritual',
        titleMr: 'पंढरीकडे अंतिम प्रस्थान',
        titleEn: 'Final March to Pandharpur',
        locationMr: 'भेंडशे तळ',
        locationEn: 'Bhedshe Ground',
      },
      {
        id: '16-2',
        time: '07:30 AM',
        type: 'breakfast',
        titleMr: 'उभे रिंगण व नाश्ता',
        titleEn: 'Standing Ringan & Breakfast',
        locationMr: 'इसबावी',
        locationEn: 'Isbavi Stop',
        menuMr: 'साधी खिचडी, शेंगदाणा लाडू व चहा',
        menuEn: 'Khichdi, Peanut Ladoo & Tea',
      },
      {
        id: '16-3',
        time: '11:00 AM',
        type: 'ritual',
        titleMr: 'चंद्रभागा स्नान व श्री विठ्ठल दर्शन',
        titleEn: 'Holy Bath & Vitthal Darshan',
        locationMr: 'चंद्रभागा घाट, पंढरपूर',
        locationEn: 'Chandrabhaga Ghat, Pandharpur',
      },
      {
        id: '16-4',
        time: '01:30 PM',
        type: 'lunch',
        titleMr: 'पंढरपूर महाप्रसाद',
        titleEn: 'Pandharpur Mahaprasad',
        locationMr: 'मंदिर अन्नछत्र',
        locationEn: 'Temple Annachhatra',
        menuMr: 'महाप्रसाद लाडू, भात व आमटी',
        menuEn: 'Mahaprasad Ladoo, Rice & Amti',
      },
    ],
  },
];

export const CalendarScheduleScreen: React.FC<
  PilgrimTabScreenProps<'Calendar'>
> = () => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0); // Default: Today (Day 14)
  const [expandedId, setExpandedId] = useState<string | null>('14-4');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const currentDay = SCHEDULE_DATA[selectedDayIdx] || SCHEDULE_DATA[0];
  const nextItem =
    currentDay.items.find((item) => item.isNext) ||
    currentDay.items.find((item) => !item.isDone) ||
    currentDay.items[0];

  // Calculate day walk progress
  const totalItems = currentDay.items.length;
  const doneItems = currentDay.items.filter((item) => item.isDone).length;
  const progressPercent = Math.round((doneItems / totalItems) * 100);

  useEffect(() => {
    return () => {
      // Stop speech on unmount
      Speech.stop();
    };
  }, []);

  // Voice Readout Handler
  const handleVoiceReadout = (item: ScheduleItem, targetId: string) => {
    Vibration.vibrate(25);

    if (speakingId === targetId) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }

    Speech.stop();
    setSpeakingId(targetId);

    const speechText = isMarathi
      ? `पुढील थांबा: ${item.time} वाजता ${item.locationMr}. ${item.titleMr}. ${
          item.menuMr ? `नाश्ता व जेवण मेनू: ${item.menuMr}.` : ''
        } जय हरी विठ्ठल.`
      : `Next stop at ${item.time}, ${item.locationEn}. ${item.titleEn}. ${
          item.menuEn ? `Menu: ${item.menuEn}.` : ''
        }`;

    try {
      Speech.speak(speechText, {
        language: isMarathi ? 'mr-IN' : 'en-IN',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    } catch {
      // Fallback
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = isMarathi ? 'mr-IN' : 'en-US';
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setSpeakingId(null);
      }
    }
  };

  const getTypeIcon = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'breakfast':
        return { name: 'cafe-outline' as const, color: colors.saffronDark };
      case 'lunch':
      case 'dinner':
        return { name: 'restaurant-outline' as const, color: colors.saffronDark };
      case 'snacks':
        return { name: 'nutrition-outline' as const, color: colors.saffronDark };
      case 'stop':
        return { name: 'water-outline' as const, color: '#0288D1' };
      case 'ritual':
        return { name: 'flame-outline' as const, color: colors.maroon };
      default:
        return { name: 'time-outline' as const, color: colors.textSecondary };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {isMarathi ? 'वारी वेळापत्रक' : 'Wari Schedule'}
            </Text>
            <Text style={styles.headerRoute}>
              {isMarathi ? currentDay.routeMr : currentDay.routeEn}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {isMarathi ? currentDay.dateFullMr : currentDay.dateFullEn}
            </Text>
          </View>
        </View>

        {/* Clean Day Switcher with Dates */}
        <View style={styles.dayRow}>
          {SCHEDULE_DATA.map((day, idx) => {
            const isSelected = idx === selectedDayIdx;
            return (
              <TouchableOpacity
                key={day.dayNum}
                activeOpacity={0.7}
                onPress={() => {
                  Vibration.vibrate(10);
                  Speech.stop();
                  setSpeakingId(null);
                  setSelectedDayIdx(idx);
                }}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
              >
                <Text
                  style={[
                    styles.dayDateText,
                    isSelected && styles.dayDateTextActive,
                  ]}
                >
                  {day.dateStr}
                </Text>
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextActive,
                  ]}
                >
                  {isMarathi ? day.labelMr : day.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Next Stop Minimal Banner with Audio Readout */}
          {nextItem && (
            <View style={styles.nextCard}>
              <View style={styles.nextHeader}>
                <View style={styles.nextTag}>
                  <View style={styles.nextDot} />
                  <Text style={styles.nextTagText}>
                    {isMarathi ? 'पुढील थांबा' : 'NEXT STOP'}
                  </Text>
                </View>

                {/* Audio Voice Readout Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleVoiceReadout(nextItem, 'next-hero')}
                  style={[
                    styles.audioButton,
                    speakingId === 'next-hero' && styles.audioButtonPlaying,
                  ]}
                >
                  <Ionicons
                    name={
                      speakingId === 'next-hero'
                        ? 'volume-high'
                        : 'volume-medium-outline'
                    }
                    size={16}
                    color={
                      speakingId === 'next-hero'
                        ? colors.surface
                        : colors.saffronDark
                    }
                  />
                  <Text
                    style={[
                      styles.audioButtonText,
                      speakingId === 'next-hero' && styles.audioButtonTextPlaying,
                    ]}
                  >
                    {speakingId === 'next-hero'
                      ? isMarathi
                        ? 'थांबवा'
                        : 'Stop'
                      : isMarathi
                      ? 'ऐका'
                      : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.nextTitleRow}>
                <Text style={styles.nextTitle}>
                  {isMarathi ? nextItem.titleMr : nextItem.titleEn}
                </Text>
                <Text style={styles.nextTime}>{nextItem.time}</Text>
              </View>

              <Text style={styles.nextLocation}>
                📍 {isMarathi ? nextItem.locationMr : nextItem.locationEn}
              </Text>

              {nextItem.menuMr && (
                <View style={styles.nextMenuBox}>
                  <Text style={styles.nextMenuLabel}>
                    {isMarathi ? 'मेनू / नाश्ता:' : 'Food / Menu:'}
                  </Text>
                  <Text style={styles.nextMenuVal}>
                    {isMarathi ? nextItem.menuMr : nextItem.menuEn}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Progress Tracker Strip */}
          <View style={styles.progressTrackerCard}>
            <View style={styles.progressHeaderRow}>
              <View style={styles.progressIconTitle}>
                <Ionicons name="walk" size={16} color={colors.maroon} />
                <Text style={styles.progressTitle}>
                  {isMarathi
                    ? `आजचा प्रवास: ${doneItems}/${totalItems} थांबे पूर्ण`
                    : `Walk Progress: ${doneItems}/${totalItems} Stops Done`}
                </Text>
              </View>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>

          {/* Timeline Section with Visual Vertical Stepper */}
          <Text style={styles.sectionHeading}>
            {isMarathi ? 'दिनक्रम व थांबे' : 'Daily Stops'}
          </Text>

          <View style={styles.stepperContainer}>
            {currentDay.items.map((item, index) => {
              const icon = getTypeIcon(item.type);
              const isExpanded = expandedId === item.id;
              const isLast = index === currentDay.items.length - 1;
              const isPlayingThis = speakingId === item.id;

              return (
                <View key={item.id} style={styles.stepperRow}>
                  {/* Left Column: Stepper Track & Nodes */}
                  <View style={styles.stepperTrackCol}>
                    {/* Stepper Node / Dot */}
                    <View
                      style={[
                        styles.stepperNode,
                        item.isDone && styles.stepperNodeDone,
                        item.isNext && styles.stepperNodeNext,
                      ]}
                    >
                      {item.isDone ? (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={colors.surface}
                        />
                      ) : item.isNext ? (
                        <View style={styles.nextPulseInner} />
                      ) : (
                        <View style={styles.futureNodeDot} />
                      )}
                    </View>

                    {/* Vertical Connecting Line */}
                    {!isLast && (
                      <View
                        style={[
                          styles.stepperLine,
                          item.isDone && styles.stepperLineDone,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Timeline Card */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      Vibration.vibrate(10);
                      setExpandedId(isExpanded ? null : item.id);
                    }}
                    style={[
                      styles.itemCard,
                      item.isNext && styles.itemCardNext,
                      item.isDone && styles.itemCardDone,
                    ]}
                  >
                    <View style={styles.itemMainRow}>
                      <View style={styles.itemIconBox}>
                        <Ionicons
                          name={icon.name}
                          size={16}
                          color={icon.color}
                        />
                      </View>

                      <View style={styles.itemInfo}>
                        <View style={styles.itemTitleRow}>
                          <Text
                            style={[
                              styles.itemTitle,
                              item.isDone && styles.itemTitleDone,
                            ]}
                          >
                            {isMarathi ? item.titleMr : item.titleEn}
                          </Text>
                          <Text style={styles.itemTime}>{item.time}</Text>
                        </View>

                        <Text style={styles.itemLocation}>
                          {isMarathi ? item.locationMr : item.locationEn}
                        </Text>

                        {/* Menu snippet */}
                        {(item.menuMr || item.menuEn) && (
                          <Text
                            style={styles.itemMenuSummary}
                            numberOfLines={isExpanded ? 0 : 1}
                          >
                            🍽️ {isMarathi ? item.menuMr : item.menuEn}
                          </Text>
                        )}
                      </View>

                      {/* Small Voice Speaker button on card */}
                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => handleVoiceReadout(item, item.id)}
                        style={[
                          styles.smallAudioBtn,
                          isPlayingThis && styles.smallAudioBtnPlaying,
                        ]}
                      >
                        <Ionicons
                          name={isPlayingThis ? 'volume-high' : 'volume-medium-outline'}
                          size={15}
                          color={isPlayingThis ? colors.surface : colors.maroon}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  headerRoute: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.maroon,
    marginTop: 1,
  },
  dateBadge: {
    marginTop: 3,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    gap: 8,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  dayDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.maroon,
  },
  dayDateTextActive: {
    color: colors.creamDark,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  dayChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nextTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nextDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.saffronDark,
  },
  nextTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
    letterSpacing: 0.5,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  audioButtonPlaying: {
    backgroundColor: colors.saffronDark,
    borderColor: colors.saffronDark,
  },
  audioButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.saffronDark,
  },
  audioButtonTextPlaying: {
    color: colors.surface,
  },
  nextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  nextTime: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.maroon,
    marginLeft: 8,
  },
  nextLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  nextMenuBox: {
    backgroundColor: '#FFF9ED',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  nextMenuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.maroon,
  },
  nextMenuVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  progressTrackerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  stepperContainer: {
    gap: 0,
  },
  stepperRow: {
    flexDirection: 'row',
  },
  stepperTrackCol: {
    width: 26,
    alignItems: 'center',
  },
  stepperNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: 12,
  },
  stepperNodeDone: {
    backgroundColor: colors.success,
  },
  stepperNodeNext: {
    backgroundColor: colors.saffronDark,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  nextPulseInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  futureNodeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#9E9E9E',
  },
  stepperLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  stepperLineDone: {
    backgroundColor: colors.success,
  },
  itemCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 6,
  },
  itemCardNext: {
    borderColor: colors.saffron,
    backgroundColor: '#FFFDF9',
  },
  itemCardDone: {
    opacity: 0.7,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  itemTitleDone: {
    color: colors.textSecondary,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.maroon,
    marginLeft: 6,
  },
  itemLocation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemMenuSummary: {
    fontSize: 11,
    color: '#8D4004',
    marginTop: 3,
    fontWeight: '600',
  },
  smallAudioBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallAudioBtnPlaying: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
});

export default CalendarScheduleScreen;
