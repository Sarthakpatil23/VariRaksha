import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import { AIBlob } from './AIBlob';
import { sendUserChatMessage, ChatPersona } from '../../lib/chatStore';

interface VoiceBlobModalProps {
  visible: boolean;
  onClose: () => void;
  onTranscriptComplete?: (transcript: string) => void;
  onSwitchToChat?: () => void;
  mode?: ChatPersona;
}

/**
 * Clean, minimalist Voice Mode UI matching the reference layout
 * but styled in VariRaksha's signature Saffron, Maroon, and Cream theme.
 * Tapping the cross button immediately closes voice mode and switches to normal chat mode
 * while maintaining conversation continuity via chatStore.
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

  useEffect(() => {
    if (!visible) return;

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
  }, [visible]);

  const handleToggleMute = () => {
    Vibration.vibrate(30);
    setIsMuted(!isMuted);
    setVoiceState(!isMuted ? 'idle' : 'listening');
  };

  const handleCloseAndSwitchToChat = () => {
    Vibration.vibrate(25);
    if (onSwitchToChat) {
      onSwitchToChat();
    } else {
      onClose();
    }
  };

  const handleSendText = () => {
    const text = inputText.trim();
    if (!text) return;

    sendUserChatMessage(mode, text);
    if (onTranscriptComplete) {
      onTranscriptComplete(text);
    }
    setInputText('');
    handleCloseAndSwitchToChat();
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
              <Text style={styles.topTitle}>व्हॉईस मोड (Voice Mode)</Text>
              <Text style={styles.topSubtitle}>
                {isMuted ? 'Microphone Muted' : 'Speaking / Listening Active'}
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

          {/* Center Area with Simplified Calm Voice Orb */}
          <View style={styles.centerOrbContainer}>
            <AIBlob
              size={220}
              state={isMuted ? 'idle' : voiceState}
            />
          </View>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            {/* Input Pill Container */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCloseAndSwitchToChat}
              style={styles.inputPill}
            >
              <Feather name="edit-3" size={16} color={colors.saffronDark} style={styles.plusIcon} />
              <TextInput
                style={styles.pillTextInput}
                placeholder="Type or speak (विचारणा करा)..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
            </TouchableOpacity>

            {/* Circular Maroon Mic Mute Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleMute}
              style={[styles.circleButton, isMuted && styles.circleButtonMuted]}
              accessibilityLabel="Mute microphone"
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Circular Saffron Cross Button: Closes voice and switches to chat mode */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCloseAndSwitchToChat}
              style={styles.closeButton}
              accessibilityLabel="Close voice mode and open chat"
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
  circleButtonMuted: {
    backgroundColor: '#8E2800',
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
