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
import { useTranslation } from 'react-i18next';
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
  useUserProfile,
  getUserProfile,
  setUserProfile,
  getUserLanguagePreference,
  setUserLanguagePreference,
} from '../../lib/userStore';
import { fetchCurrentUserProfile } from '../../services/authService';
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

interface VariRakshaChatbotProps {
  mode: ChatPersona;
  onActionPress?: (actionType: string) => void;
  onClose?: () => void;
  initialMode?: 'chat' | 'voice';
}

const PRESET_QUESTIONS: Record<
  ChatPersona,
  Record<ChatLanguage, Array<{ text: string; label: string }>>
> = {
  varkari: {
    mr: [
      { label: '💧 पाणी कुठे आहे?', text: 'पाण्याचे थांबे आणि ओआरएस वाटप कुठे आहे?' },
      { label: '📍 पुढील मुक्काम', text: 'पुढील मुक्काम आणि विसावा किती अंतरावर आहे?' },
      { label: '🩹 पायाचे फोड व विश्रांती', text: 'चालल्यामुळे पाय दुखत आहेत आणि पायात फोड आले आहेत, काय करू?' },
      { label: '📞 दिंडी प्रमुख', text: 'दिंडी प्रमुखांशी संपर्क कसा साधायचा?' },
    ],
    hi: [
      { label: '💧 पानी कहाँ है?', text: 'पीने का पानी और ओआरएस वितरण केंद्र कहाँ है?' },
      { label: '📍 अगला पड़ाव', text: 'अगला पड़ाव और विश्राम स्थल कितनी दूरी पर है?' },
      { label: '🩹 पैरों के छाले', text: 'लगातार चलने से पैर दुख रहे हैं और छाले हो गए हैं, क्या उपाय है?' },
      { label: '📞 दिंडी प्रमुख', text: 'दिंडी प्रमुख से कैसे संपर्क करें?' },
    ],
    en: [
      { label: '💧 Water Points', text: 'Where are the nearest drinking water and ORS points?' },
      { label: '📍 Next Halt', text: 'What is the next resting camp and distance?' },
      { label: '🩹 Foot Blisters', text: 'My feet are hurting and have blisters from walking. What should I do?' },
      { label: '📞 Call Leader', text: 'How can I contact my Dindi Leader?' },
    ],
  },
  dindiLeader: {
    mr: [
      { label: '📢 जेवण घोषणा', text: 'अन्नछत्र दुपारच्या जेवणाची घोषणा तयार करा.' },
      { label: '📍 हरवलेले वारकरी', text: 'मागे पडलेल्या वारकऱ्यांना संपर्क कसा करायचा?' },
      { label: '🚑 फिरते क्लिनिक', text: 'दिंडीसाठी जवळच्या रुग्णवाहिका आणि क्लिनिकची स्थिती काय आहे?' },
    ],
    hi: [
      { label: '📢 भोजन घोषणा', text: 'अन्नछत्र भोजन समय की दिंडी घोषणा तैयार करें।' },
      { label: '📍 बिछड़े पदयात्री', text: 'पीछे छूटे वारकरियों से कैसे संपर्क करें?' },
      { label: '🚑 मोबाइल क्लिनिक', text: 'दिंडी के पास मोबाइल क्लिनिक व एम्बुलेंस की स्थिति क्या है?' },
    ],
    en: [
      { label: '📢 Meal Broadcast', text: 'Draft a lunch announcement broadcast for the Dindi members.' },
      { label: '📍 Missing Pilgrims', text: 'How do I locate and alert members who drifted behind?' },
      { label: '🚑 Mobile Clinic', text: 'What is the status of the nearest mobile medical unit?' },
    ],
  },
};

/**
 * Unified Personalized, Profile-Aware AI Chatbot for VariRaksha Pilgrims & Leaders.
 * Features:
 * - Strict User Context & Isolation (Personalized for logged-in user profile)
 * - RAG Knowledge Base Integration (Route, First Aid, Chronic Care, Emergency Protocols)
 * - 3-Tier Severity Triage (No SOS Spam; emergency alert styling only for Level 3)
 * - Dynamic In-Chat Language Selector (मराठी | हिन्दी | English) with Persistence
 * - Multi-turn Conversation Memory
 * - Dynamic State-Reactive ThinkingOrb (Vitthal Blue -> Saffron Gold -> Tulsi Green)
 */
export const VariRakshaChatbot: React.FC<VariRakshaChatbotProps> = ({
  mode,
  onActionPress,
  onClose,
  initialMode = 'chat',
}) => {
  const { i18n } = useTranslation();
  const profile = useUserProfile();
  const messages = useChatMessages(mode);

  // Active Language State (defaults to user store or i18n)
  const [currentLang, setCurrentLang] = useState<ChatLanguage>(
    (getUserLanguagePreference() || (i18n.language as ChatLanguage) || 'mr')
  );

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

  // Synchronize language if store changes
  useEffect(() => {
    const prefLang = getUserLanguagePreference();
    if (prefLang && prefLang !== currentLang) {
      setCurrentLang(prefLang);
    }
  }, []);

  // Fetch live Supabase profile on mount if not yet present in store
  useEffect(() => {
    if (!profile) {
      fetchCurrentUserProfile().then((dbProfile) => {
        if (dbProfile) {
          setUserProfile(dbProfile);
        }
      });
    }
  }, [profile]);

  // Manage voice mode recording session
  useEffect(() => {
    if (viewMode === 'voice') {
      setVoiceTranscript('');
      const initialGreeting =
        currentLang === 'en'
          ? 'Ram Krishna Hari! Speak now, I am listening...'
          : currentLang === 'hi'
          ? 'राम कृष्ण हरी! बोलिए, मैं सुन रहा हूँ...'
          : 'राम कृष्ण हरी! बोलणे सुरू करा, मी ऐकत आहे...';
      setVoiceAiReply(initialGreeting);
      startVoiceRecording();
    } else {
      stopCurrentVoiceSession();
    }

    return () => {
      stopCurrentVoiceSession();
    };
  }, [viewMode, currentLang]);

  const handleSwitchLanguage = (langCode: ChatLanguage) => {
    Vibration.vibrate(25);
    setCurrentLang(langCode);
    setUserLanguagePreference(langCode);
    i18n.changeLanguage(langCode);

    // If chat has only 1 initial message, update the starter message to the new language
    if (messages.length <= 1) {
      clearChatMessages(mode, langCode);
    }
  };

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
        setVoiceAiReply(
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
      setVoiceAiReply(
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

      // Step 1: STT
      const sttLangCode =
        currentLang === 'en' ? 'en-IN' : currentLang === 'hi' ? 'hi-IN' : 'mr-IN';
      let transcript = '';
      try {
        transcript = await transcribeWithSarvam(uri, sttLangCode);
      } catch (sttErr) {
        console.warn('STT failed:', sttErr);
      }

      if (!transcript) {
        setVoiceAiReply(
          currentLang === 'en'
            ? 'Voice was not clear. Please speak again or type.'
            : currentLang === 'hi'
            ? 'आवाज स्पष्ट नहीं आई। कृपया पुनः बोलें या टाइप करें।'
            : 'आवाज स्पष्ट आला नाही. कृपया पुन्हा बोला किंवा टाईप करा.'
        );
        setVoiceState('idle');
        return;
      }

      setVoiceTranscript(transcript);

      // Step 2: Personalized RAG Generation
      const payload: AIResponsePayload = await askPersonalizedRAG(
        transcript,
        mode,
        messages.map((m) => ({ role: m.role, content: m.content })),
        currentLang
      );

      setVoiceAiReply(payload.message);

      // Append to message history
      await sendUserChatMessage(mode, transcript, currentLang);

      // Step 3: TTS
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
      console.error('Voice processing error:', err);
      setVoiceAiReply(
        currentLang === 'en'
          ? 'Could not connect. Please try again.'
          : currentLang === 'hi'
          ? 'माफ़ करें, संपर्क नहीं हो सका। पुनः प्रयास करें।'
          : 'माफ करा, संपर्क साधता आला नाही. कृपया पुन्हा प्रयत्न करा.'
      );
      setVoiceState('idle');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSendingChat) return;

    setInputText('');
    setIsSendingChat(true);

    try {
      await sendUserChatMessage(mode, text, currentLang);
    } finally {
      setIsSendingChat(false);
    }

    if (viewMode === 'voice') {
      setViewMode('chat');
    }
  };

  const handleNewChat = () => {
    Vibration.vibrate(30);
    clearChatMessages(mode, currentLang);
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
  const userName = profile?.fullName || (isVarkari ? 'वारकरी भाविक' : 'दिंडी प्रमुख');

  const title =
    currentLang === 'en'
      ? isVarkari
        ? 'VariRaksha AI Companion'
        : 'Dindi Commander AI'
      : currentLang === 'hi'
      ? isVarkari
        ? 'वारीरक्षक AI साथी'
        : 'वारीरक्षक दिंडी कमांडर AI'
      : isVarkari
      ? 'वारीरक्षक AI सहाय्यक'
      : 'वारीरक्षक दिंडी कमांडर AI';

  const ageStr = profile?.age
    ? ` (${currentLang === 'en' ? 'Age ' : currentLang === 'hi' ? 'आयु ' : 'वय '}${profile.age}${profile.bloodGroup ? ` · ${profile.bloodGroup}` : ''})`
    : '';

  const subtitle = profile?.fullName
    ? `👤 ${profile.fullName}${ageStr}`
    : currentLang === 'en'
    ? '👤 Live Supabase Database'
    : currentLang === 'hi'
    ? '👤 वारी डेटाबेस कनेक्टेड'
    : '👤 वारी डेटाबेस कनेक्टेड';

  const currentPresets = PRESET_QUESTIONS[mode][currentLang] || PRESET_QUESTIONS[mode].mr;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* ===================== VIEW MODE 1: TEXT CHAT ===================== */}
        {viewMode === 'chat' ? (
          <>
            {/* Top Bar with Profile Badge, Language Switcher, and Voice Toggle */}
            <View style={styles.topBar}>
              <View style={styles.topTitleGroup}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>

              {/* Language Switcher Bar (मराठी | हिन्दी | English) */}
              <View style={styles.langSelectorPill}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSwitchLanguage('mr')}
                  style={[
                    styles.langOptionBtn,
                    currentLang === 'mr' && styles.langOptionBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      currentLang === 'mr' && styles.langOptionTextActive,
                    ]}
                  >
                    मराठी
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSwitchLanguage('hi')}
                  style={[
                    styles.langOptionBtn,
                    currentLang === 'hi' && styles.langOptionBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      currentLang === 'hi' && styles.langOptionTextActive,
                    ]}
                  >
                    हिन्दी
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSwitchLanguage('en')}
                  style={[
                    styles.langOptionBtn,
                    currentLang === 'en' && styles.langOptionBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      currentLang === 'en' && styles.langOptionTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.topActions}>
                {/* Reset / New Chat */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleNewChat}
                  style={styles.circleIconButton}
                  accessibilityLabel="New Chat"
                >
                  <Ionicons name="refresh" size={17} color={colors.maroon} />
                </TouchableOpacity>

                {/* Switch to Voice Mode */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Vibration.vibrate(30);
                    setViewMode('voice');
                  }}
                  style={styles.voiceModeTriggerButton}
                  accessibilityLabel="Switch to Voice Mode"
                >
                  <Ionicons name="mic" size={16} color="#FFFFFF" />
                  <Text style={styles.voiceModeTriggerText}>
                    {currentLang === 'en' ? 'Voice' : currentLang === 'hi' ? 'वॉइस' : 'व्हॉईस'}
                  </Text>
                </TouchableOpacity>

                {/* Close Button if provided */}
                {onClose && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    style={styles.circleIconButton}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={18} color={colors.maroon} />
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
                      <Text style={styles.thinkingText}>
                        {currentLang === 'en'
                          ? 'Thinking...'
                          : currentLang === 'hi'
                          ? 'विचार कर रहा हूँ...'
                          : 'विचार करत आहे (Thinking)...'}
                      </Text>
                    </View>
                  </View>
                )}
              </MessageScrollerViewport>
            </MessageScrollerProvider>

            {/* Chat Input Bar */}
            <View style={styles.inputBar}>
              {/* Dynamic Localized Preset Question Chips */}
              <View style={styles.presetsRow}>
                {currentPresets.map((preset, idx) => (
                  <TouchableOpacity
                    key={`preset-${idx}`}
                    activeOpacity={0.7}
                    onPress={() => handleSendMessage(preset.text)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    currentLang === 'en'
                      ? 'Type your query...'
                      : currentLang === 'hi'
                      ? 'प्रश्न पूछें (Type your query)...'
                      : 'प्रश्न विचारा (Type your query)...'
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
            {/* Top Bar with Language selector and Close/Switch to Chat */}
            <View style={styles.voiceTopBar}>
              <View style={styles.voiceTitleGroup}>
                <Text style={styles.voiceTitle}>{title}</Text>
                <Text style={styles.voiceSubtitle}>
                  {isMuted
                    ? currentLang === 'en'
                      ? 'Microphone muted'
                      : 'मायक्रोफोन बंद आहे'
                    : voiceState === 'listening'
                    ? currentLang === 'en'
                      ? '🎧 Listening...'
                      : currentLang === 'hi'
                      ? '🎧 सुन रहा हूँ...'
                      : '🎧 ऐकत आहे (Listening)...'
                    : voiceState === 'processing'
                    ? currentLang === 'en'
                      ? '⚡ Thinking...'
                      : currentLang === 'hi'
                      ? '⚡ विचार कर रहा हूँ...'
                      : '⚡ विचार करत आहे (Thinking)...'
                    : voiceState === 'speaking'
                    ? currentLang === 'en'
                      ? '🗣️ Speaking...'
                      : currentLang === 'hi'
                      ? '🗣️ बोल रहा हूँ...'
                      : '🗣️ बोलत आहे (Speaking)...'
                    : 'Idle'}
                </Text>
              </View>

              {/* Language Switcher in Voice Mode */}
              <View style={styles.langSelectorPill}>
                {(['mr', 'hi', 'en'] as ChatLanguage[]).map((code) => (
                  <TouchableOpacity
                    key={`voice-lang-${code}`}
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

              {/* Cross button: Exits voice mode to chat */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Vibration.vibrate(25);
                  setViewMode('chat');
                }}
                style={styles.circleIconButton}
                accessibilityLabel="Close Voice Mode"
              >
                <Ionicons name="close" size={20} color={colors.maroon} />
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
                  placeholder={
                    currentLang === 'en'
                      ? 'Or type your question...'
                      : 'किंवा प्रश्न टाईप करा...'
                  }
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  topTitleGroup: {
    flex: 1,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
    paddingVertical: 4,
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93, 0, 30, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModeTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffronDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  voiceModeTriggerText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: '#EBD8B8',
    paddingHorizontal: 9,
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
    gap: 8,
  },
  voiceTitleGroup: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  voiceSubtitle: {
    fontSize: 11,
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
