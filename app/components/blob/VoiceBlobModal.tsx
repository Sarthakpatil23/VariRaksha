import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Vibration,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants';
import { ThinkingOrb } from './ThinkingOrb';
import { sendUserChatMessage, ChatPersona } from '../../lib/chatStore';
import {
  transcribeWithSarvam,
  askSarvamAI,
  convertTextToSpeech,
  playSarvamAudio,
  stopAudioPlayback,
} from '../../services/sarvamService';

interface VoiceBlobModalProps {
  visible: boolean;
  onClose: () => void;
  onTranscriptComplete?: (transcript: string) => void;
  onSwitchToChat?: () => void;
  mode?: ChatPersona;
}

/**
 * Sarvam AI Voice Assistant Modal
 * Features:
 * - Sarvam STT (saarika:v2) for accurate Marathi voice recognition
 * - Sarvam LLM (sarvam-2b) for contextual pilgrim safety guidance
 * - Sarvam TTS (bulbul:v2) for natural Marathi speech response
 * - Dynamic State-Reactive ThinkingOrb (Vitthal Blue -> Saffron Gold -> Tulsi Green)
 */
export const VoiceBlobModal: React.FC<VoiceBlobModalProps> = ({
  visible,
  onClose,
  onTranscriptComplete,
  onSwitchToChat,
  mode = 'varkari',
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<
    'idle' | 'listening' | 'processing' | 'speaking'
  >('listening');
  const [inputText, setInputText] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize and start voice listening when modal opens
  useEffect(() => {
    if (!visible) {
      stopCurrentSession();
      return;
    }

    setLiveTranscript('');
    setAiResponseText('राम कृष्ण हरी! बोलणे सुरू करा, मी ऐकत आहे...');
    startVoiceRecording();

    return () => {
      stopCurrentSession();
    };
  }, [visible]);

  const stopCurrentSession = async () => {
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

  // 1. Start Microphone Recording
  const startVoiceRecording = async () => {
    try {
      await stopAudioPlayback();

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setAiResponseText('मायक्रोफोन परवानगी आवश्यक आहे.');
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
      setVoiceState('listening');
      Vibration.vibrate(25);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setVoiceState('listening');
    }
  };

  // 2. Stop Recording & Trigger Sarvam STT -> LLM -> TTS
  const stopAndProcessVoice = async () => {
    if (!recordingRef.current) return;

    try {
      Vibration.vibrate(30);
      setVoiceState('processing');
      setAiResponseText('आपला आवाज ऐकला... विचार करत आहे...');

      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        setVoiceState('listening');
        return;
      }

      // Step A: Sarvam STT (saarika:v2)
      let transcript = '';
      try {
        transcript = await transcribeWithSarvam(uri, 'mr-IN');
      } catch (sttErr) {
        console.warn('STT API failed, checking manual input');
      }

      if (!transcript) {
        setAiResponseText('आवाज स्पष्ट आला नाही. कृपया पुन्हा बोला किंवा टाईप करा.');
        setVoiceState('idle');
        return;
      }

      setLiveTranscript(transcript);
      if (onTranscriptComplete) {
        onTranscriptComplete(transcript);
      }

      // Step B: Sarvam LLM (sarvam-2b)
      const aiReply = await askSarvamAI(transcript, mode);
      setAiResponseText(aiReply);

      // Save to global chatStore
      sendUserChatMessage(mode, transcript);

      // Step C: Sarvam TTS (bulbul:v2) & Audio Playback
      setVoiceState('speaking');
      try {
        const base64Audio = await convertTextToSpeech(aiReply, 'mr-IN', 'ananya');
        await playSarvamAudio(base64Audio, aiReply, () => {
          setVoiceState('idle');
        });
      } catch (ttsErr) {
        // Fallback to native speech
        await playSarvamAudio('', aiReply, () => {
          setVoiceState('idle');
        });
      }
    } catch (err) {
      console.error('Voice processing pipeline error:', err);
      setAiResponseText('माफ करा, संपर्क साधता आला नाही. कृपया पुन्हा प्रयत्न करा.');
      setVoiceState('idle');
    }
  };

  const handleToggleMute = async () => {
    Vibration.vibrate(30);
    if (isRecording) {
      setIsMuted(true);
      await stopAndProcessVoice();
    } else {
      setIsMuted(false);
      await startVoiceRecording();
    }
  };

  const handleCloseAndSwitchToChat = async () => {
    Vibration.vibrate(25);
    await stopCurrentSession();
    if (onSwitchToChat) {
      onSwitchToChat();
    } else {
      onClose();
    }
  };

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    setLiveTranscript(text);
    setVoiceState('processing');
    setAiResponseText('उत्तर तयार करत आहे...');

    try {
      const aiReply = await askSarvamAI(text, mode);
      setAiResponseText(aiReply);
      sendUserChatMessage(mode, text);

      setVoiceState('speaking');
      const base64Audio = await convertTextToSpeech(aiReply, 'mr-IN', 'ananya');
      await playSarvamAudio(base64Audio, aiReply, () => {
        setVoiceState('idle');
      });
    } catch (err) {
      sendUserChatMessage(mode, text);
      handleCloseAndSwitchToChat();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleCloseAndSwitchToChat}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.titleWrapper}>
              <Text style={styles.topTitle}>सर्वम AI व्हॉईस सहाय्यक (Sarvam AI)</Text>
              <Text style={styles.topSubtitle}>
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

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseAndSwitchToChat}
              style={styles.circleIconButton}
              accessibilityLabel="Switch to Chat"
            >
              <Ionicons name="chatbubbles-outline" size={20} color={colors.maroon} />
            </TouchableOpacity>
          </View>

          {/* Center Area with Dynamic State-Reactive Thinking Orb (240px) */}
          <View style={styles.centerOrbContainer}>
            <ThinkingOrb
              state={isMuted ? 'idle' : voiceState}
              size={240}
            />

            {/* Live Subtitle / Response Display */}
            <View style={styles.dialogCard}>
              {liveTranscript ? (
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>"{liveTranscript}"</Text>
                </View>
              ) : null}

              <Text style={styles.aiDialogText}>
                {voiceState === 'processing' ? (
                  <ActivityIndicator size="small" color={colors.saffronDark} />
                ) : null}{' '}
                {aiResponseText}
              </Text>
            </View>
          </View>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            {/* Input Pill Container */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.inputPill}
            >
              <Feather name="edit-3" size={16} color={colors.saffronDark} style={styles.plusIcon} />
              <TextInput
                style={styles.pillTextInput}
                placeholder="प्रश्न टाईप करा किंवा बोला..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
            </TouchableOpacity>

            {/* Mic Button: Tap to Toggle Record / Process */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleMute}
              style={[
                styles.circleButton,
                isRecording && styles.circleButtonRecording,
                isMuted && styles.circleButtonMuted,
              ]}
              accessibilityLabel="Toggle microphone"
            >
              <Ionicons
                name={isRecording ? 'stop' : isMuted ? 'mic-off' : 'mic'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Close / Switch to Chat Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCloseAndSwitchToChat}
              style={styles.closeButton}
              accessibilityLabel="Close voice mode"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  topSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(93, 0, 30, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerOrbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCard: {
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  inputPill: {
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
  plusIcon: {
    marginRight: 8,
  },
  pillTextInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  circleButton: {
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
  circleButtonRecording: {
    backgroundColor: '#DC2626',
  },
  circleButtonMuted: {
    backgroundColor: '#64748B',
  },
  closeButton: {
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

export default VoiceBlobModal;
