import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import { ChatMessage } from '../components/chat/MessageScroller';

export type ChatPersona = 'varkari' | 'dindiLeader';

const VARKARI_STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'v-init-1',
    role: 'assistant',
    content:
      'जय हरी विठ्ठल! 🙏 I am your VariRaksha Pilgrim Assistant. Ask me about water stations, route distance to Phaltan, or tap the mic for voice assistance.',
  },
];

const LEADER_STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'l-init-1',
    role: 'assistant',
    content:
      'जय हरी महाराज! 🚩 I am your Dindi Commander Assistant. I can help draft announcements, track missing pilgrims, or guide emergency camp protocols.',
  },
];

// Persistent in-memory store for active session
const chatState: Record<ChatPersona, ChatMessage[]> = {
  varkari: [...VARKARI_STARTER_MESSAGES],
  dindiLeader: [...LEADER_STARTER_MESSAGES],
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

export const clearChatMessages = (persona: ChatPersona) => {
  chatState[persona] =
    persona === 'varkari' ? [...VARKARI_STARTER_MESSAGES] : [...LEADER_STARTER_MESSAGES];
  notifyListeners();
};

export const addChatMessage = (persona: ChatPersona, message: ChatMessage) => {
  chatState[persona] = [...chatState[persona], message];
  notifyListeners();
};

// Offline AI Rule Engine
export const generateAIResponse = (
  input: string,
  persona: ChatPersona,
): Omit<ChatMessage, 'id'> => {
  const query = input.toLowerCase();

  if (persona === 'varkari') {
    if (query.includes('water') || query.includes('pani') || query.includes('तहान') || query.includes('पाणी')) {
      return {
        role: 'assistant',
        content:
          '💧 Water & Seva Mandap is stationed 2.4 km ahead at Phaltan Annachhatra. Cold filtered water and ORS packets are being distributed free by Shri Vitthal Seva Mandal.',
      };
    }

    if (query.includes('leader') || query.includes('sopanrao') || query.includes('प्रमुख') || query.includes('call') || query.includes('कॉल')) {
      return {
        role: 'assistant',
        content:
          '📞 Dindi Leader: ह.भ.प. सोपानराव महाराज (+91 98765 43210). Tap below to connect immediately:',
        actionType: 'call_leader',
        actionLabel: 'Call Dindi Leader Now',
      };
    }

    if (query.includes('flag') || query.includes('dindi') || query.includes('झेंडा') || query.includes('lost') || query.includes('मागे')) {
      return {
        role: 'assistant',
        content:
          '🚩 Dindi 12 main flag is currently walking at pace (Phaltan Highway, km 42). If you are separated, remain calm and look for the yellow VariRaksha relay marshals.',
        actionType: 'call_leader',
        actionLabel: 'Alert Leader of My Position',
      };
    }

    if (query.includes('heat') || query.includes('blister') || query.includes('fever') || query.includes('ऊन') || query.includes('तप') || query.includes('पाय') || query.includes('त्रास')) {
      return {
        role: 'assistant',
        content:
          '☀️ First-Aid Advice: The temperature is 34°C. Please rest under shaded trees immediately, hydrate with small sips of water, and loosen footwear if blisters appear.',
        actionType: 'medical_sos',
        actionLabel: 'Request Route First-Aid Kit',
      };
    }

    if (query.includes('phaltan') || query.includes('distance') || query.includes('किती') || query.includes('मार्ग')) {
      return {
        role: 'assistant',
        content:
          '📍 Route Status: You are on Wakhari ➔ Phaltan segment. 12 km remaining (Approx. 3 hours walking time). Next major rest halt is Phaltan Ashram at 1:00 PM.',
      };
    }

    // Default Varkari Response
    return {
      role: 'assistant',
      content:
        'जय हरी! I have noted your message: "' +
        input +
        '". For urgent safety, you can call Dindi Leader Sopanrao Maharaj or trigger SOS.',
      actionType: 'call_leader',
      actionLabel: 'Call Dindi Leader',
    };
  } else {
    // Dindi Leader Mode
    if (query.includes('lunch') || query.includes('broadcast') || query.includes('जेवण') || query.includes('घोषणा') || query.includes('संदेश')) {
      return {
        role: 'assistant',
        content:
          '📢 Suggested Broadcast Draft:\n"सर्व वारकरी बंधू-भगिनींनी लक्ष द्या: पुढील ५०० मीटर अंतरावर फलटण अन्नछत्र मंडप आहे. सर्व दिंडीने दुपारी १ वाजता भोजनासाठी एकत्र यावे."',
        actionType: 'broadcast',
        actionLabel: 'Open Broadcast Composer',
      };
    }

    if (query.includes('drift') || query.includes('missing') || query.includes('member') || query.includes('हरवला') || query.includes('मागे') || query.includes('शोध')) {
      return {
        role: 'assistant',
        content:
          '📍 Lost Member Protocol: 2 pilgrims currently alert (Pandurang Patil: 420m NW, Shantabai Shinde: 150m Behind). Relay #4 and #2 are pinging their devices.',
        actionType: 'call_leader',
        actionLabel: 'Call Pandurang Patil',
      };
    }

    if (query.includes('medical') || query.includes('ambulance') || query.includes('doctor') || query.includes('दवाखाना') || query.includes('क्लिनिक')) {
      return {
        role: 'assistant',
        content:
          '🚑 Medical Coordination: Mobile Clinic #2 (Dr. Deshmukh) is stationed 1.8 km ahead at Phaltan camp with oxygen, saline, and ambulance support.',
        actionType: 'medical_sos',
        actionLabel: 'Emergency Mobile Clinic Dispatch',
      };
    }

    if (query.includes('heat') || query.includes('weather') || query.includes('हवामान') || query.includes('ऊन') || query.includes('विश्रांती')) {
      return {
        role: 'assistant',
        content:
          '☀️ Weather Alert: 34°C peak between 12:30 PM - 2:30 PM. Recommended Leader Action: Announce a mandatory 30-minute shade halt before 1:00 PM.',
        actionType: 'broadcast',
        actionLabel: 'Broadcast Heat Warning Alert',
      };
    }

    // Default Leader Response
    return {
      role: 'assistant',
      content:
        'महाराज, your command: "' +
        input +
        '" has been processed. Would you like to transmit a group broadcast or coordinate with volunteers?',
      actionType: 'broadcast',
      actionLabel: 'Open Dindi Broadcast',
    };
  }
};

export const sendUserChatMessage = (persona: ChatPersona, text: string) => {
  const cleanText = text.trim();
  if (!cleanText) return;

  Vibration.vibrate(25);

  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: cleanText,
  };

  addChatMessage(persona, userMsg);

  // Generate simulated instant assistant reply
  setTimeout(() => {
    const aiResponse = generateAIResponse(cleanText, persona);
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      ...aiResponse,
    };
    addChatMessage(persona, aiMsg);
    Vibration.vibrate(35);
  }, 400);
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
