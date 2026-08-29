import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { colors, spacing, typography } from '../../constants';
import {
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerItem,
} from './MessageScroller';
import { ThinkingOrb } from '../blob/ThinkingOrb';
import {
  useChatMessages,
  sendUserChatMessage,
  clearChatMessages,
  ChatPersona,
} from '../../lib/chatStore';
import {
  transcribeWithSarvam,
  askSarvamAI,
  convertTextToSpeech,
  playSarvamAudio,
  stopAudioPlayback,
} from '../../services/sarvamService';

interface VariRakshaChatbotProps {
  mode: ChatPersona;
  onActionPress?: (actionType: string) => void;
  onClose?: () => void;
  initialMode?: 'chat' | 'voice';
}

/**
 * Unified Chat & Voice Experience with Sarvam AI Integration.
 * Features:
 * - Real-time Sarvam AI (sarvam-2b) Marathi Pilgrim Chatbot
 * - Speech-to-Text via Sarvam STT (saarika:v2)
 * - Text-to-Speech via Sarvam TTS (bulbul:v2)
 * - Dynamic State-Reactive ThinkingOrb (Vitthal Blue -> Saffron Gold -> Tulsi Green)
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
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceAiReply, setVoiceAiReply] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  const recordingRef = useRef<Audio.Recording | null>(null);

  // Manage voice mode recording session
  useEffect(() => {
    if (viewMode === 'voice') {
      setVoiceTranscript('');
      setVoiceAiReply('राम कृष्ण हरी! बोलणे सुरू करा, मी ऐकत आहे...');
      startVoiceRecording();
    } else {
      stopCurrentVoiceSession();
    }

    return () => {
      stopCurrentVoiceSession();
    };
  }, [viewMode]);

  const stopCurrentVoiceSession = async () => {
    try {
      await stopAudioPlayback();
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      setIsRecording(false);
    } catch (e) {
      // Ignore cleanup error
    }
  };

  const startVoiceRecording = async () => {
    try {
      await stopAudioPlayback();

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setVoiceAiReply('मायक्रोफोन परवानगी आवश्यक आहे.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setIsMuted(false);
      setVoiceState('listening');
      Vibration.vibrate(25);
    } catch (err) {
      console.error('Voice record start error:', err);
      setVoiceState('listening');
    }
  };

  const stopAndProcessVoice = async () => {
    if (!recordingRef.current) return;

    try {
      Vibration.vibrate(30);
      setVoiceState('processing');
      setVoiceAiReply('आपला आवाज ऐकला... विचार करत आहे...');

      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        setVoiceState('listening');
        return;
      }

      // Step 1: STT
      let transcript = '';
      try {
        transcript = await transcribeWithSarvam(uri, 'mr-IN');
      } catch (sttErr) {
        console.warn('STT failed:', sttErr);
      }

      if (!transcript) {
        setVoiceAiReply('आवाज स्पष्ट आला नाही. कृपया पुन्हा बोला किंवा टाईप करा.');
        setVoiceState('idle');
        return;
      }

      setVoiceTranscript(transcript);

      // Step 2: LLM
      const reply = await askSarvamAI(transcript, mode);
      setVoiceAiReply(reply);

      // Save to chat store
      sendUserChatMessage(mode, transcript);

      // Step 3: TTS
      setVoiceState('speaking');
      try {
        const base64Audio = await convertTextToSpeech(reply, 'mr-IN', 'pooja');
        await playSarvamAudio(base64Audio, reply, () => {
          setVoiceState('idle');
        });
      } catch (ttsErr) {
        await playSarvamAudio('', reply, () => {
          setVoiceState('idle');
        });
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setVoiceAiReply('माफ करा, संपर्क साधता आला नाही. कृपया पुन्हा प्रयत्न करा.');
      setVoiceState('idle');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSendingChat) return;

    setInputText('');
    setIsSendingChat(true);

    try {
      await sendUserChatMessage(mode, text);
    } finally {
      setIsSendingChat(false);
    }

    if (viewMode === 'voice') {
      setViewMode('chat');
    }
  };

  const handleNewChat = () => {
    Vibration.vibrate(30);
    clearChatMessages(mode);
    setInputText('');
  };

  const handleToggleMute = async () => {
    Vibration.vibrate(25);
    if (isRecording) {
      setIsMuted(true);
      await stopAndProcessVoice();
    } else {
      setIsMuted(false);
      await startVoiceRecording();
    }
  };

  const isVarkari = mode === 'varkari';
  const title = isVarkari
    ? 'वारीरक्षक AI सहाय्यक'
    : 'वारीरक्षक दिंडी कमांडर AI';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* ===================== VIEW MODE 1: TEXT CHAT ===================== */}
        {viewMode === 'chat' ? (
          <>
            {/* Top Bar with New Chat & Voice Mode Switch */}
            <View style={styles.topBar}>
              <View style={styles.topTitleGroup}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>
                  {isVarkari
                    ? 'मार्ग, पाणी, अन्नछत्र व वैद्यकीय मदत'
                    : 'दिंडी व्यवस्थापन व घोषणा'}
                </Text>
              </View>

              <View style={styles.topActions}>
                {/* Reset / New Chat */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleNewChat}
                  style={styles.circleIconButton}
                  accessibilityLabel="New Chat"
                >
                  <Ionicons name="refresh" size={18} color={colors.maroon} />
                </TouchableOpacity>

                {/* Switch to Voice Blob Mode */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Vibration.vibrate(30);
                    setViewMode('voice');
                  }}
                  style={styles.voiceModeTriggerButton}
                  accessibilityLabel="Switch to Voice Mode"
                >
                  <Ionicons name="mic" size={18} color="#FFFFFF" />
                  <Text style={styles.voiceModeTriggerText}>व्हॉईस</Text>
                </TouchableOpacity>

                {/* Close Button if provided */}
                {onClose && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    style={styles.circleIconButton}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={20} color={colors.maroon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Conversation Messages Viewport */}
            <MessageScrollerProvider>
              <MessageScrollerViewport>
                {messages.map((item) => (
                  <MessageScrollerItem
                    key={item.id}
                    message={item}
                    onActionPress={onActionPress}
                  />
                ))}
                {isSendingChat && (
                  <View style={styles.thinkingWrapper}>
                    <View style={styles.thinkingBubble}>
                      <ActivityIndicator size="small" color={colors.saffronDark} />
                      <Text style={styles.thinkingText}>विचार करत आहे (Thinking)...</Text>
                    </View>
                  </View>
                )}
              </MessageScrollerViewport>
            </MessageScrollerProvider>

            {/* Chat Input Bar */}
            <View style={styles.inputBar}>
              {/* Quick Preset Questions Pill */}
              <View style={styles.presetsRow}>
                {isVarkari ? (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage('पाण्याचे थांबे कुठे आहेत?')}
                      style={styles.presetChip}
                    >
                      <Text style={styles.presetChipText}>💧 पाणी कुठे आहे?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage('फलटण अंतर किती आहे?')}
                      style={styles.presetChip}
                    >
                      <Text style={styles.presetChipText}>📍 पुढील मुक्काम</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage('वैद्यकीय मदत हवी आहे')}
                      style={styles.presetChip}
                    >
                      <Text style={styles.presetChipText}>🚑 डॉक्टर / SOS</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage('अन्नछत्र जेवणाची घोषणा तयार करा')}
                      style={styles.presetChip}
                    >
                      <Text style={styles.presetChipText}>📢 जेवण घोषणा</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSendMessage('हरवलेल्या वारकऱ्यांचा शोध')}
                      style={styles.presetChip}
                    >
                      <Text style={styles.presetChipText}>📍 हरवलेले वारकरी</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Text Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    isVarkari
                      ? 'प्रश्न विचारा (Type your query)...'
                      : 'कमांड किंवा संदेश लिहा...'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSendMessage()}
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isSendingChat) && styles.sendButtonDisabled,
                  ]}
                  disabled={!inputText.trim() || isSendingChat}
                  accessibilityLabel="Send message"
                >
                  {isSendingChat ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="arrow-up" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* ===================== VIEW MODE 2: DYNAMIC VOICE MODE ===================== */
          <View style={styles.voiceContainer}>
            {/* Top Bar with Mode indicator and Close/Switch to Chat button */}
            <View style={styles.voiceTopBar}>
              <View style={styles.voiceTitleGroup}>
                <Text style={styles.voiceTitle}>वारीरक्षक व्हॉईस मोड</Text>
                <Text style={styles.voiceSubtitle}>
                  {isMuted
                    ? 'मायक्रोफोन बंद आहे'
                    : voiceState === 'listening'
                    ? '🎧 ऐकत आहे (Listening)...'
                    : voiceState === 'processing'
                    ? '⚡ विचार करत आहे (Thinking)...'
                    : voiceState === 'speaking'
                    ? '🗣️ बोलत आहे (Speaking)...'
                    : 'विश्रांती (Idle)'}
                </Text>
              </View>

              {/* Cross button: Exits voice mode and returns directly to the chat conversation */}
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

            {/* Center: Dynamic State-Reactive Thinking Orb (240px) */}
            <View style={styles.voiceCenter}>
              <ThinkingOrb
                state={isMuted ? 'idle' : voiceState}
                size={240}
              />

              {/* Live Subtitle Dialog Card */}
              <View style={styles.voiceDialogCard}>
                {voiceTranscript ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>"{voiceTranscript}"</Text>
                  </View>
                ) : null}

                <Text style={styles.aiDialogText}>
                  {voiceState === 'processing' ? (
                    <ActivityIndicator size="small" color={colors.saffronDark} />
                  ) : null}{' '}
                  {voiceAiReply}
                </Text>
              </View>
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
                  placeholder="किंवा प्रश्न टाईप करा..."
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSendMessage()}
                  returnKeyType="send"
                />
              </TouchableOpacity>

              {/* Mute / Record Toggle Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleMute}
                style={[
                  styles.voiceCircleButton,
                  isRecording && styles.voiceCircleButtonRecording,
                  isMuted && styles.voiceCircleButtonMuted,
                ]}
                accessibilityLabel="Toggle microphone"
              >
                <Ionicons
                  name={isRecording ? 'stop' : isMuted ? 'mic-off' : 'mic'}
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModeTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceModeTriggerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: '#EBD8B8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.maroon,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C5BAC0',
  },
  // Voice View Styles
  voiceContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  voiceTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    fontWeight: '600',
  },
  voiceCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceDialogCard: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxWidth: '92%',
    alignItems: 'center',
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  userBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubbleText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '600',
  },
  aiDialogText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  voiceBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  voiceInputPill: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#EBD8B8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  voicePillTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  voiceCircleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceCircleButtonRecording: {
    backgroundColor: '#DC2626',
  },
  voiceCircleButtonMuted: {
    backgroundColor: '#64748B',
  },
  voiceCloseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.saffronDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  thinkingWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 6,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#EBD8B8',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thinkingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default VariRakshaChatbot;
