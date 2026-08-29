import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import {
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerItem,
} from './MessageScroller';
import { AIBlob } from '../blob/AIBlob';
import {
  useChatMessages,
  sendUserChatMessage,
  clearChatMessages,
  ChatPersona,
} from '../../lib/chatStore';

interface VariRakshaChatbotProps {
  mode: ChatPersona;
  onActionPress?: (actionType: string) => void;
  onClose?: () => void;
  initialMode?: 'chat' | 'voice';
}

/**
 * Unified Chat & Voice Experience.
 * Provides seamless in-place switching between text chat and calm voice mode
 * while maintaining 100% conversation session and state continuity.
 */
export const VariRakshaChatbot: React.FC<VariRakshaChatbotProps> = ({
  mode,
  onActionPress,
  onClose,
  initialMode = 'chat',
}) => {
  const messages = useChatMessages(mode);
  const [viewMode, setViewMode] = useState<'chat' | 'voice'>(initialMode);
  const [inputText, setInputText] = useState<string>('');

  // Voice mode local states
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<
    'idle' | 'listening' | 'processing' | 'speaking'
  >('listening');

  useEffect(() => {
    if (viewMode === 'voice') {
      setVoiceState('listening');
      Vibration.vibrate(30);

      const timer1 = setTimeout(() => {
        setVoiceState('processing');
      }, 4000);

      const timer2 = setTimeout(() => {
        setVoiceState('speaking');
      }, 6000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [viewMode]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    sendUserChatMessage(mode, text);
    setInputText('');

    if (viewMode === 'voice') {
      // Return naturally to chat to see the conversation flow
      setViewMode('chat');
    }
  };

  const handleNewChat = () => {
    Vibration.vibrate(30);
    clearChatMessages(mode);
    setInputText('');
  };

  const handleToggleMute = () => {
    Vibration.vibrate(25);
    setIsMuted(!isMuted);
    setVoiceState(!isMuted ? 'idle' : 'listening');
  };

  const isVarkari = mode === 'varkari';
  const title = isVarkari ? 'वारीरक्षक सहाय्यक (AI Sahayak)' : 'दिंडी कमान सहाय्यक (Commander AI)';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* ===================== VIEW MODE 1: TEXT CHAT ===================== */}
        {viewMode === 'chat' ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {onClose && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    style={styles.backButton}
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.maroon} />
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Offline AI Active</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleNewChat}
                style={styles.circleIconButton}
                accessibilityLabel="New Chat"
              >
                <Ionicons name="refresh-sharp" size={18} color={colors.maroon} />
              </TouchableOpacity>
            </View>

            {/* Chat Body */}
            <View style={styles.chatBody}>
              <MessageScrollerProvider>
                <MessageScrollerViewport style={styles.scrollerViewport}>
                  {messages.map((msg) => (
                    <MessageScrollerItem
                      key={msg.id}
                      message={msg}
                      onActionPress={onActionPress}
                    />
                  ))}
                </MessageScrollerViewport>
              </MessageScrollerProvider>
            </View>

            {/* Composer Footer */}
            <View style={styles.composerWrapper}>
              <View style={styles.composerPill}>
                {/* Voice Mode Toggle (Mic) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Vibration.vibrate(30);
                    setViewMode('voice');
                  }}
                  style={styles.micButton}
                  accessibilityLabel="Switch to Voice Mode"
                >
                  <Ionicons name="mic-sharp" size={20} color={colors.saffronDark} />
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                  style={styles.pillInput}
                  placeholder={
                    isVarkari
                      ? 'Ask VariRaksha (विचारा)...'
                      : 'Ask Commander AI (आदेश द्या)...'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />

                {/* Send Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSendMessage()}
                  style={[
                    styles.sendCircle,
                    inputText.trim().length === 0 && styles.sendCircleDisabled,
                  ]}
                  disabled={inputText.trim().length === 0}
                  accessibilityLabel="Send message"
                >
                  <Feather name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* ===================== VIEW MODE 2: UNIFIED CALM VOICE MODE ===================== */
          <View style={styles.voiceContainer}>
            {/* Top Bar with Mode indicator and Close/Switch to Chat button */}
            <View style={styles.voiceTopBar}>
              <View style={styles.voiceTitleGroup}>
                <Text style={styles.voiceTitle}>व्हॉईस मोड (Voice Mode)</Text>
                <Text style={styles.voiceSubtitle}>
                  {isMuted
                    ? 'Microphone Muted'
                    : voiceState === 'processing'
                    ? 'Processing your request...'
                    : voiceState === 'speaking'
                    ? 'Responding...'
                    : 'Listening to your voice...'}
                </Text>
              </View>

              {/* Cross button: Exits voice mode and returns directly to the same chat conversation */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Vibration.vibrate(25);
                  setViewMode('chat');
                }}
                style={styles.circleIconButton}
                accessibilityLabel="Close Voice Mode"
              >
                <Ionicons name="close" size={22} color={colors.maroon} />
              </TouchableOpacity>
            </View>

            {/* Center: Simplified Calm Voice Orb */}
            <View style={styles.voiceCenter}>
              <AIBlob
                size={210}
                state={isMuted ? 'idle' : voiceState}
              />
            </View>

            {/* Bottom Bar: Quick input pill, Mute toggle, and Close to Chat */}
            <View style={styles.voiceBottomBar}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setViewMode('chat')}
                style={styles.voiceInputPill}
              >
                <Feather
                  name="edit-3"
                  size={16}
                  color={colors.saffronDark}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.voicePillTextInput}
                  placeholder="Or type your message..."
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />
              </TouchableOpacity>

              {/* Mute Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleMute}
                style={[
                  styles.voiceCircleButton,
                  isMuted && styles.voiceCircleButtonMuted,
                ]}
                accessibilityLabel="Toggle mute"
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Return to Chat Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setViewMode('chat')}
                style={styles.voiceCloseButton}
                accessibilityLabel="Switch to Chat"
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBody: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollerViewport: {
    flex: 1,
    backgroundColor: colors.background,
  },
  composerWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: colors.background,
  },
  composerPill: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#EBD8B8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(230, 81, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  pillInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  sendCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.saffronDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sendCircleDisabled: {
    backgroundColor: '#D1C4B2',
    opacity: 0.6,
  },

  // VOICE MODE SPECIFIC STYLES
  voiceContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  voiceTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  voiceTitleGroup: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  voiceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  voiceCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: spacing.xs,
  },
  voiceInputPill: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#EBD8B8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  voicePillTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  voiceCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceCircleButtonMuted: {
    backgroundColor: '#8E2800',
  },
  voiceCloseButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.saffronDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default VariRakshaChatbot;
