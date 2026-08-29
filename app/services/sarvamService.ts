import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// Sarvam AI API Key
const SARVAM_API_KEY =
  process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
  process.env.SARVAM_API_KEY ||
  'sk_m91ip2w5_Kib2CpaZRsEXiZrDc47tsjlo';

// Active sound instance tracker
let currentSound: Audio.Sound | null = null;

export interface SarvamChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 1. Speech-to-Text (STT) via Sarvam AI saaras:v3
 * Transcribes recorded audio into accurate Marathi / Hindi text.
 */
export async function transcribeWithSarvam(
  audioUri: string,
  languageCode: 'mr-IN' | 'hi-IN' | 'en-IN' = 'mr-IN'
): Promise<string> {
  try {
    if (!audioUri) {
      throw new Error('No audio URI provided for transcription');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    formData.append('model', 'saaras:v3');
    formData.append('language_code', languageCode);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Sarvam STT] HTTP Error ${response.status}:`, errText);
      throw new Error(`STT failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.transcript ? data.transcript.trim() : '';
  } catch (error) {
    console.error('[Sarvam STT Error]:', error);
    throw error;
  }
}

/**
 * 2. Conversational AI Sahayak (LLM) via Sarvam AI sarvam-105b-conversations
 * Generates contextual, respectful responses in Marathi with pilgrim safety guidance.
 */
export async function askSarvamAI(
  userQuery: string,
  persona: 'varkari' | 'dindiLeader',
  recentHistory: SarvamChatMessage[] = []
): Promise<string> {
  try {
    const systemPrompt =
      persona === 'varkari'
        ? `तुम्ही "वारीरक्षक AI सहाय्यक" आहात - पंढरपूर आषाढी वारीच्या वारकऱ्यांचे डिजिटल रक्षक.
वारकऱ्यांच्या प्रश्नांना (पाण्याचे थांबे, अन्नछत्र, पालखी मार्ग, अंतर, विश्रांती, प्रथमोपचार, वैद्यकीय मदत) आदरपूर्वक, स्पष्ट आणि मराठीत उत्तरे द्या.
प्रत्येक उत्तराची सुरुवात "राम कृष्ण हरी 🙏" किंवा "जय हरी माउली 🙏" ने करा.
उत्तर संक्षिप्त, थेट व समजायला सोपे (२ ते ३ वाक्यांत) ठेवा.
जर वारकऱ्याला आपत्कालीन मदत किंवा वैद्यकीय त्रास असेल तर त्यांना ताबडतोब जवळच्या वैद्यकीय शिबिरात जाण्यास किंवा लाल SOS बटण दाबण्यास सांगा.`
        : `तुम्ही "वारीरक्षक दिंडी कमांडर AI" आहात - दिंडी प्रमुख आणि व्यवस्थापकांचे सहाय्यक.
दिंडीतील वारकऱ्यांचे व्यवस्थापन, हरवलेल्या वारकऱ्यांचा शोध, अन्नछत्र वेळ, आणि दिंडी घोषणा (Broadcast drafts) तयार करण्यास मदत करा.
संभाषण आदरयुक्त व कार्यक्षम ठेवा. "जय हरी महाराज 🚩" ने सुरुवात करा.`;

    const messages: SarvamChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.slice(-4),
      { role: 'user', content: userQuery },
    ];

    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages,
        temperature: 0.3,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Sarvam LLM] HTTP Error ${response.status}:`, errText);
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    return reply ? reply.trim() : 'राम कृष्ण हरी 🙏 मी आपल्या सेवेसाठी तत्पर आहे.';
  } catch (error) {
    console.error('[Sarvam LLM Error]:', error);
    throw error;
  }
}

/**
 * 3. Text-to-Speech (TTS) via Sarvam AI bulbul:v3
 * Converts Marathi response text into natural voice audio stream.
 */
export async function convertTextToSpeech(
  text: string,
  targetLanguageCode: 'mr-IN' | 'hi-IN' = 'mr-IN',
  speaker: string = 'pooja'
): Promise<string> {
  try {
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [cleanText.slice(0, 450)],
        target_language_code: targetLanguageCode,
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
  onFinish?: () => void
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

    // Fallback to native speech
    if (fallbackText) {
      Speech.speak(fallbackText, {
        language: 'mr',
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
