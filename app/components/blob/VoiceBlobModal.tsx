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
  useUserProfile,
  getUserLanguagePreference,
  setUserLanguagePreference,
} from '../../lib/userStore';
import {
  transcribeWithSarvam,
  convertTextToSpeech,
  playSarvamAudio,
  stopAudioPlayback,
} from '../../services/sarvamService';
import {
  askPersonalizedRAG,
  ChatLanguage,
  AIResponsePayload,
} from '../../services/ragChatService';

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
 * - Profile-aware Personalized RAG Guidance
 * - Sarvam STT (saaras:v3) with dynamic language code (mr-IN, hi-IN, en-IN)
 * - Sarvam TTS (bulbul:v3) & Expo Speech fallback
 * - Dynamic State-Reactive ThinkingOrb (Vitthal Blue -> Saffron Gold -> Tulsi Green)
 * - In-Modal Multi-Language Selector (मराठी | हिन्दी | English)
 */
export const VoiceBlobModal: React.FC<VoiceBlobModalProps> = ({
  visible,
  onClose,
  onTranscriptComplete,
  onSwitchToChat,
  mode = 'varkari',
}) => {
  const profile = useUserProfile();
  const [currentLang, setCurrentLang] = useState<ChatLanguage>(
    getUserLanguagePreference() || 'mr'
  );

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
    const initialGreeting =
      currentLang === 'en'
        ? 'Ram Krishna Hari! Speak now, I am listening...'
        : currentLang === 'hi'
        ? 'राम कृष्ण हरी! बोलिए, मैं सुन रहा हूँ...'
        : 'राम कृष्ण हरी! बोलणे सुरू करा, मी ऐकत आहे...';
    setAiResponseText(initialGreeting);
    startVoiceRecording();

    return () => {
      stopCurrentSession();
    };
  }, [visible, currentLang]);

  const handleSwitchLanguage = (langCode: ChatLanguage) => {
    Vibration.vibrate(25);
    setCurrentLang(langCode);
    setUserLanguagePreference(langCode);
  };

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
        setAiResponseText(
          currentLang === 'en'
            ? 'Microphone permission is required.'
            : currentLang === 'hi'
            ? 'माइक्रोफ़ोन अनुमति आवश्यक है।'
            : 'मायक्रोफोन परवानगी आवश्यक आहे.'
        );
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

  // 2. Stop Recording & Trigger Personalized RAG Pipeline
  const stopAndProcessVoice = async () => {
    if (!recordingRef.current) return;

    try {
      Vibration.vibrate(30);
      setVoiceState('processing');
      setAiResponseText(
        currentLang === 'en'
          ? 'Listening complete... Thinking...'
          : currentLang === 'hi'
          ? 'आवाज सुनी गई... विचार कर रहा हूँ...'
          : 'आपला आवाज ऐकला... विचार करत आहे...'
      );

      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        setVoiceState('listening');
        return;
      }

      // Step A: Sarvam STT (saaras:v3)
      const sttLangCode =
        currentLang === 'en' ? 'en-IN' : currentLang === 'hi' ? 'hi-IN' : 'mr-IN';
      let transcript = '';
      try {
        transcript = await transcribeWithSarvam(uri, sttLangCode);
      } catch (sttErr) {
        console.warn('STT API failed, checking manual input');
      }

      if (!transcript) {
        setAiResponseText(
          currentLang === 'en'
            ? 'Voice was not clear. Please speak again or type.'
            : currentLang === 'hi'
            ? 'आवाज स्पष्ट नहीं आई। कृपया पुनः बोलें या टाइप करें।'
            : 'आवाज स्पष्ट आला नाही. कृपया पुन्हा बोला किंवा टाईप करा.'
        );
        setVoiceState('idle');
        return;
      }

      setLiveTranscript(transcript);
      if (onTranscriptComplete) {
        onTranscriptComplete(transcript);
      }

      // Step B: Personalized RAG Generation
      const payload: AIResponsePayload = await askPersonalizedRAG(
        transcript,
        mode,
        [],
        currentLang
      );
      setAiResponseText(payload.message);

      // Save to global chatStore
      sendUserChatMessage(mode, transcript, currentLang);

      // Step C: Sarvam TTS (bulbul:v3) & Audio Playback
      setVoiceState('speaking');
      try {
        const base64Audio = await convertTextToSpeech(
          payload.message,
          sttLangCode,
          'pooja'
        );
        await playSarvamAudio(
          base64Audio,
          payload.message,
          () => {
            setVoiceState('idle');
          },
          currentLang
        );
      } catch (ttsErr) {
        // Fallback to native speech
        await playSarvamAudio(
          '',
          payload.message,
          () => {
            setVoiceState('idle');
          },
          currentLang
        );
      }
    } catch (err) {
      console.error('Voice processing pipeline error:', err);
      setAiResponseText(
        currentLang === 'en'
          ? 'Could not connect. Please try again.'
          : currentLang === 'hi'
          ? 'माफ़ करें, संपर्क नहीं हो सका। पुनः प्रयास करें।'
          : 'माफ करा, संपर्क साधता आला नाही. कृपया पुन्हा प्रयत्न करा.'
      );
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
    setAiResponseText(
      currentLang === 'en'
        ? 'Generating answer...'
        : currentLang === 'hi'
        ? 'उत्तर तैयार कर रहा हूँ...'
        : 'उत्तर तयार करत आहे...'
    );

    try {
      const payload: AIResponsePayload = await askPersonalizedRAG(
        text,
        mode,
        [],
        currentLang
      );
      setAiResponseText(payload.message);
      sendUserChatMessage(mode, text, currentLang);

      setVoiceState('speaking');
      const sttLangCode =
        currentLang === 'en' ? 'en-IN' : currentLang === 'hi' ? 'hi-IN' : 'mr-IN';
      const base64Audio = await convertTextToSpeech(
        payload.message,
        sttLangCode,
        'pooja'
      );
      await playSarvamAudio(
        base64Audio,
        payload.message,
        () => {
          setVoiceState('idle');
        },
        currentLang
      );
    } catch (err) {
      sendUserChatMessage(mode, text, currentLang);
      handleCloseAndSwitchToChat();
    }
  };

  if (!visible) return null;

  const isVarkari = mode === 'varkari';
  const userName = profile?.fullName || (isVarkari ? 'वारकरी भाविक' : 'दिंडी प्रमुख');

  const title =
    currentLang === 'en'
      ? isVarkari
        ? 'VariRaksha Voice AI'
        : 'Dindi Commander Voice AI'
      : currentLang === 'hi'
      ? isVarkari
        ? 'वारीरक्षक वॉइस AI'
        : 'वारीरक्षक दिंडी कमांडर वॉइस AI'
      : 'वारीरक्षक AI व्हॉईस सहाय्यक';

  const subtitle =
    currentLang === 'en'
      ? `👤 For ${userName}`
      : currentLang === 'hi'
      ? `👤 ${userName} के लिए`
      : `👤 ${userName} यांच्यासाठी`;

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
              <Text style={styles.topTitle}>{title}</Text>
              <Text style={styles.topSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>

            {/* Language Switcher in Voice Modal */}
            <View style={styles.langSelectorPill}>
              {(['mr', 'hi', 'en'] as ChatLanguage[]).map((code) => (
                <TouchableOpacity
                  key={`modal-lang-${code}`}
                  activeOpacity={0.8}
                  onPress={() => handleSwitchLanguage(code)}
                  style={[
                    styles.langOptionBtn,
                    currentLang === code && styles.langOptionBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      currentLang === code && styles.langOptionTextActive,
                    ]}
                  >
                    {code === 'mr' ? 'मराठी' : code === 'hi' ? 'हिन्दी' : 'EN'}
                  </Text>
                </TouchableOpacity>
              ))}
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
                placeholder={
                  currentLang === 'en'
                    ? 'Type or speak your question...'
                    : 'प्रश्न टाईप करा किंवा बोला...'
                }
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
    gap: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  topSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  langSelectorPill: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE9',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2D8CC',
  },
  langOptionBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langOptionBtnActive: {
    backgroundColor: colors.maroon,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  langOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  langOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 14,
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
