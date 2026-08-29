import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import {
  askPersonalizedRAG,
  AIResponsePayload,
  ConversationTurn,
  ChatLanguage,
} from './ragChatService';
import { getUserLanguagePreference } from '../lib/userStore';

// Sarvam AI API Key (STT & TTS)
const SARVAM_API_KEY =
  process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
  process.env.SARVAM_API_KEY ||
  '';

// Groq API Key (LLM: openai/gpt-oss-120b)
const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  process.env.GROQ_API_KEY ||
  '';

// Active sound instance tracker
let currentSound: Audio.Sound | null = null;

export interface SarvamChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 1. Speech-to-Text (STT) via Sarvam AI saaras:v3
 * Listening: Transcribes recorded audio into accurate Marathi / Hindi / English text.
 */
export async function transcribeWithSarvam(
  audioUri: string,
  languageCode: 'mr-IN' | 'hi-IN' | 'en-IN' = 'mr-IN'
): Promise<string> {
  try {
    if (!audioUri) {
      return '';
    }

    const isWav = audioUri.endsWith('.wav');
    const mimeType = isWav ? 'audio/wav' : 'audio/mp4';
    const fileName = isWav ? 'recording.wav' : 'recording.mp4';

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: fileName,
    } as any);
    formData.append('model', 'saaras:v3');
    formData.append('language_code', languageCode);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        Authorization: `Bearer ${SARVAM_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Sarvam STT] HTTP Error ${response.status}:`, errText);
      return '';
    }

    const data = await response.json();
    return data.transcript ? data.transcript.trim() : '';
  } catch (error) {
    console.warn('[Sarvam STT Error]:', error);
    return '';
  }
}

/**
 * 2. Conversational LLM via Personalized RAG Engine
 * Invokes the profile-aware, knowledge-retrieved, severity-triaged assistant.
 */
export async function askGroqAI(
  userQuery: string,
  persona: 'varkari' | 'dindiLeader' = 'varkari',
  recentHistory: SarvamChatMessage[] = [],
  explicitLang?: ChatLanguage
): Promise<string> {
  const turns: ConversationTurn[] = recentHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload: AIResponsePayload = await askPersonalizedRAG(
    userQuery,
    persona,
    turns,
    explicitLang
  );

  return payload.message;
}

// Re-export askPersonalizedRAG for direct structured consumption
export { askPersonalizedRAG };
export const askSarvamAI = askGroqAI;

/**
 * 3. Text-to-Speech (TTS) via Sarvam AI bulbul:v3
 * Converts Marathi / Hindi response text into natural voice audio stream.
 */
export async function convertTextToSpeech(
  text: string,
  targetLanguageCode: 'mr-IN' | 'hi-IN' | 'en-IN' = 'mr-IN',
  speaker: string = 'pooja'
): Promise<string> {
  try {
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Map language code for Sarvam TTS (supports mr-IN, hi-IN, en-IN)
    const sarvamLang =
      targetLanguageCode === 'en-IN'
        ? 'en-IN'
        : targetLanguageCode === 'hi-IN'
        ? 'hi-IN'
        : 'mr-IN';

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
        Authorization: `Bearer ${SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: [cleanText.slice(0, 450)],
        target_language_code: sarvamLang,
        speaker,
        model: 'bulbul:v3',
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Sarvam TTS] HTTP Error ${response.status}:`, errText);
      throw new Error(`TTS failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.audios?.[0] || '';
  } catch (error) {
    console.error('[Sarvam TTS Error]:', error);
    throw error;
  }
}

/**
 * 4. Play Audio (Base64 data URI or Expo Speech Fallback)
 */
export async function playSarvamAudio(
  base64Audio: string,
  fallbackText?: string,
  onFinish?: () => void,
  lang: 'mr' | 'hi' | 'en' = 'mr'
): Promise<void> {
  try {
    await stopAudioPlayback();

    if (base64Audio) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/wav;base64,${base64Audio}` },
          { shouldPlay: true, volume: 1.0 }
        );

        currentSound = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            stopAudioPlayback();
            if (onFinish) onFinish();
          }
        });
        return;
      } catch (soundErr) {
        console.warn('[Audio.Sound playback failed, falling back to Speech]:', soundErr);
      }
    }

    // Fallback to native speech with appropriate language
    if (fallbackText) {
      const speechLang = lang === 'en' ? 'en' : lang === 'hi' ? 'hi' : 'mr';
      Speech.speak(fallbackText, {
        language: speechLang,
        pitch: 1.0,
        rate: 0.95,
        onDone: () => {
          if (onFinish) onFinish();
        },
        onError: () => {
          if (onFinish) onFinish();
        },
      });
    } else if (onFinish) {
      onFinish();
    }
  } catch (error) {
    console.error('[Audio Playback Error]:', error);
    if (onFinish) onFinish();
  }
}

/**
 * 5. Stop any active audio playback
 */
export async function stopAudioPlayback(): Promise<void> {
  try {
    Speech.stop();
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (err) {
    currentSound = null;
  }
}
