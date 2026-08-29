import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { DindiLeaderTabScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../constants';

const PRESET_ANNOUNCEMENTS = [
  '🍽️ Lunch Rest Stop in 500m (Phaltan Mandap)',
  '🛑 30-Minute Rest Break — All Dindi halt now',
  '🚩 Assemble near Main Dindi Flag & Pakhawaj',
  '💧 Water & Electrolyte distribution ahead',
  '⚠️ Heavy heat alert — Walk in shade & drink water',
];

export const BroadcastScreen: React.FC<
  DindiLeaderTabScreenProps<'Broadcast'>
> = ({ navigation }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');
  const [isUrgentPriority, setIsUrgentPriority] = useState<boolean>(false);
  const [soundChime, setSoundChime] = useState<boolean>(true);

  const handleSelectPreset = (preset: string) => {
    setMessage(preset);
  };

  const handleSendBroadcast = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter or select an announcement to broadcast.');
      return;
    }

    Vibration.vibrate(isUrgentPriority ? [0, 200, 100, 200] : 80);

    Alert.alert(
      isUrgentPriority ? '🚨 Urgent Broadcast Transmitted' : '📢 Broadcast Sent',
      `Transmitted via Offline BLE Mesh to all 45 pilgrims in Dindi 12.\n\n"${message}"`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.maroon} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>Dindi 12 Broadcast</Text>
            <Text style={styles.subtitle}>Offline Mesh Relay to 45 Pilgrims</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Priority Toggle Card */}
          <View style={styles.priorityCard}>
            <View style={styles.priorityInfo}>
              <Ionicons
                name={isUrgentPriority ? 'warning' : 'volume-medium'}
                size={22}
                color={isUrgentPriority ? '#D32F2F' : colors.maroon}
              />
              <View style={styles.priorityTextCol}>
                <Text style={styles.priorityTitle}>
                  {isUrgentPriority ? 'Urgent Emergency Alarm' : 'Normal Group Announcement'}
                </Text>
                <Text style={styles.prioritySub}>
                  {isUrgentPriority
                    ? 'Overrides silent mode with siren & vibration'
                    : 'Standard banner push notification'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsUrgentPriority(!isUrgentPriority)}
              style={[
                styles.togglePill,
                isUrgentPriority ? styles.togglePillUrgent : styles.togglePillNormal,
              ]}
            >
              <Text
                style={[
                  styles.togglePillText,
                  isUrgentPriority ? styles.toggleTextUrgent : styles.toggleTextNormal,
                ]}
              >
                {isUrgentPriority ? 'HIGH PRIORITY' : 'NORMAL'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <Text style={styles.sectionLabel}>QUICK PRESETS (ONE-TAP)</Text>
          <View style={styles.presetsContainer}>
            {PRESET_ANNOUNCEMENTS.map((preset) => {
              const isSelected = message === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPreset(preset)}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextSelected,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Message Input */}
          <View style={styles.inputHeaderRow}>
            <Text style={styles.sectionLabel}>ANNOUNCEMENT TEXT</Text>
            <Text style={styles.charCount}>{message.length}/180</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type custom message for Dindi members..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={180}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* Mesh Transmission Info Box */}
          <View style={styles.meshInfoBox}>
            <Ionicons name="git-network-outline" size={18} color="#2E7D32" />
            <Text style={styles.meshInfoText}>
              Broadcasts are relayed hop-by-hop across all active phones without needing active cell towers or internet.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action Area */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSendBroadcast}
            style={[
              styles.sendButton,
              isUrgentPriority ? styles.sendButtonUrgent : styles.sendButtonNormal,
            ]}
          >
            <Ionicons
              name="megaphone-sharp"
              size={20}
              color="#FFFFFF"
              style={styles.sendIcon}
            />
            <Text style={styles.sendButtonText}>
              {isUrgentPriority ? 'Broadcast Siren Alert' : 'Send to Dindi (45 Members)'}
            </Text>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  topBarSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  priorityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  priorityTextCol: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  prioritySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  togglePillNormal: {
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    borderColor: colors.maroon,
  },
  togglePillUrgent: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  togglePillText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  toggleTextNormal: {
    color: colors.maroon,
  },
  toggleTextUrgent: {
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  presetsContainer: {
    gap: 6,
    marginBottom: spacing.md,
  },
  presetChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: colors.saffronDark,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  presetChipTextSelected: {
    color: colors.saffronDark,
    fontWeight: typography.fontWeight.bold,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    height: 120,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  meshInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  meshInfoText: {
    fontSize: 11,
    color: '#2E7D32',
    flex: 1,
    lineHeight: 16,
    fontWeight: typography.fontWeight.medium,
  },
  bottomArea: {
    paddingVertical: spacing.sm,
  },
  sendButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonNormal: {
    backgroundColor: colors.saffronDark,
    shadowColor: colors.saffronDark,
  },
  sendButtonUrgent: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
  },
  sendIcon: {
    marginRight: spacing.xs,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default BroadcastScreen;
