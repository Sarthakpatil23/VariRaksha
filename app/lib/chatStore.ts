import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import { ChatMessage } from '../components/chat/MessageScroller';
import {
  askPersonalizedRAG,
  AIResponsePayload,
  ChatLanguage,
} from '../services/ragChatService';
import {
  getUserProfile,
  getUserLanguagePreference,
} from './userStore';

export type ChatPersona = 'varkari' | 'dindiLeader';

/**
 * Returns localized initial starter greeting for the given persona & language
 */
export const getStarterMessage = (
  persona: ChatPersona,
  lang: ChatLanguage = 'mr'
): ChatMessage => {
  const profile = getUserProfile();
  const userName = profile?.fullName ? ` ${profile.fullName}` : '';

  if (persona === 'varkari') {
    if (lang === 'en') {
      return {
        id: 'v-init-1',
        role: 'assistant',
        content: `Ram Krishna Hari${userName}! 🙏 I am your VariRaksha AI companion. Feel free to ask about water kiosks, meal camps, route updates, or health assistance.`,
        severity: 'low',
        show_sos: false,
      };
    }
    if (lang === 'hi') {
      return {
        id: 'v-init-1',
        role: 'assistant',
        content: `राम कृष्ण हरी${userName}! 🙏 मैं आपका वारीरक्षक AI सहायक हूँ। जल सेवा, अन्नछत्र, पालकी मार्ग अथवा स्वास्थ्य सहायता के लिए पूछें।`,
        severity: 'low',
        show_sos: false,
      };
    }
    return {
      id: 'v-init-1',
      role: 'assistant',
      content: `राम कृष्ण हरी${userName}! 🙏 मी आपला वारीरक्षक AI सहाय्यक आहे. पाणी, अन्नछत्र, पालखी मार्ग किंवा वैद्यकीय मदतीबाबत विचारा.`,
      severity: 'low',
      show_sos: false,
    };
  } else {
    // Dindi Leader persona
    if (lang === 'en') {
      return {
        id: 'l-init-1',
        role: 'assistant',
        content: `Jai Hari Maharaj${userName}! 🚩 I am your Dindi Commander AI. I can assist with member tracking, meal coordination, and drafting broadcast announcements.`,
        severity: 'low',
        show_sos: false,
      };
    }
    if (lang === 'hi') {
      return {
        id: 'l-init-1',
        role: 'assistant',
        content: `जय हरी महाराज${userName}! 🚩 मैं आपका दिंडी कमांडर AI हूँ। पदयात्री प्रबंधन, अन्नछत्र समय और दिंडी घोषणाएं तैयार करने में सहायता कर सकता हूँ।`,
        severity: 'low',
        show_sos: false,
      };
    }
    return {
      id: 'l-init-1',
      role: 'assistant',
      content: `जय हरी महाराज${userName}! 🚩 मी आपला दिंडी कमांडर AI आहे. हरवलेले वारकरी, अन्नछत्र समन्वय आणि दिंडी घोषणा तयार करण्यात मी मदत करू शकतो.`,
      severity: 'low',
      show_sos: false,
    };
  }
};

// Persistent in-memory store for active session
const chatState: Record<ChatPersona, ChatMessage[]> = {
  varkari: [getStarterMessage('varkari', 'mr')],
  dindiLeader: [getStarterMessage('dindiLeader', 'mr')],
};

const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeChat = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getChatMessages = (persona: ChatPersona): ChatMessage[] => {
  return chatState[persona];
};

export const clearChatMessages = (persona: ChatPersona, lang?: ChatLanguage) => {
  const currentLang = lang || getUserLanguagePreference() || 'mr';
  chatState[persona] = [getStarterMessage(persona, currentLang)];
  notifyListeners();
};

export const clearAllChatHistory = () => {
  const currentLang = getUserLanguagePreference() || 'mr';
  chatState.varkari = [getStarterMessage('varkari', currentLang)];
  chatState.dindiLeader = [getStarterMessage('dindiLeader', currentLang)];
  notifyListeners();
};

export const resetUserChatSession = (persona: ChatPersona, lang: ChatLanguage) => {
  chatState[persona] = [getStarterMessage(persona, lang)];
  notifyListeners();
};

export const addChatMessage = (persona: ChatPersona, message: ChatMessage) => {
  chatState[persona] = [...chatState[persona], message];
  notifyListeners();
};

export const sendUserChatMessage = async (
  persona: ChatPersona,
  text: string,
  explicitLang?: ChatLanguage,
  onAiResponse?: (responsePayload: AIResponsePayload) => void
) => {
  const cleanText = text.trim();
  if (!cleanText) return;

  Vibration.vibrate(25);

  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: cleanText,
  };

  // Capture prior conversation history for multi-turn reasoning
  const priorHistory = chatState[persona].map((m) => ({
    role: (m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system') as
      | 'user'
      | 'assistant'
      | 'system',
    content: m.content,
  }));

  addChatMessage(persona, userMsg);

  try {
    const responsePayload: AIResponsePayload = await askPersonalizedRAG(
      cleanText,
      persona,
      priorHistory,
      explicitLang
    );

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: responsePayload.message,
      actionType: responsePayload.action_type !== 'none' ? responsePayload.action_type : undefined,
      actionLabel: responsePayload.action_label,
      severity: responsePayload.severity,
      show_sos: responsePayload.show_sos,
    };

    addChatMessage(persona, aiMsg);
    Vibration.vibrate(35);
    if (onAiResponse) onAiResponse(responsePayload);
  } catch (error) {
    console.warn('[Personalized Chat fallback triggered]:', error);
    const targetLang = explicitLang || getUserLanguagePreference() || 'mr';
    const fallbackPayload: AIResponsePayload = await askPersonalizedRAG(
      cleanText,
      persona,
      priorHistory,
      targetLang
    );

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: fallbackPayload.message,
      actionType: fallbackPayload.action_type !== 'none' ? fallbackPayload.action_type : undefined,
      actionLabel: fallbackPayload.action_label,
      severity: fallbackPayload.severity,
      show_sos: fallbackPayload.show_sos,
    };

    addChatMessage(persona, aiMsg);
    Vibration.vibrate(35);
    if (onAiResponse) onAiResponse(fallbackPayload);
  }
};

export const useChatMessages = (persona: ChatPersona): ChatMessage[] => {
  const [messages, setMessages] = useState<ChatMessage[]>(chatState[persona]);

  useEffect(() => {
    setMessages(chatState[persona]);
    const unsubscribe = subscribeChat(() => {
      setMessages(chatState[persona]);
    });
    return unsubscribe;
  }, [persona]);

  return messages;
};
