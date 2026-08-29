import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import { ChatMessage } from '../components/chat/MessageScroller';
import { askSarvamAI } from '../services/sarvamService';

export type ChatPersona = 'varkari' | 'dindiLeader';

const VARKARI_STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'v-init-1',
    role: 'assistant',
    content:
      'राम कृष्ण हरी! 🙏 मी आपला वारीरक्षक AI सहाय्यक आहे. पाणी, अन्नछत्र, पालखी मार्ग किंवा वैद्यकीय मदतीबाबत विचारा.',
  },
];

const LEADER_STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'l-init-1',
    role: 'assistant',
    content:
      'जय हरी महाराज! 🚩 मी आपला दिंडी कमांडर AI आहे. हरवलेले वारकरी, अन्नछत्र समन्वय आणि दिंडी घोषणा तयार करण्यात मी मदत करू शकतो.',
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

// Offline Rule Engine Fallback
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
          '💧 पुढील २.४ किमी अंतरावर फलटण अन्नछत्र येथे शुद्ध थंड पाणी व ओआरएस पाकिटांचे मोफत वाटप सुरू आहे.',
      };
    }

    if (query.includes('leader') || query.includes('sopanrao') || query.includes('प्रमुख') || query.includes('call') || query.includes('कॉल')) {
      return {
        role: 'assistant',
        content:
          '📞 दिंडी प्रमुख: ह.भ.प. सोपानराव महाराज (+91 98765 43210). त्वरित संपर्क करण्यासाठी खाली दाबा:',
        actionType: 'call_leader',
        actionLabel: 'Call Dindi Leader Now',
      };
    }

    if (query.includes('flag') || query.includes('dindi') || query.includes('झेंडा') || query.includes('lost') || query.includes('मागे')) {
      return {
        role: 'assistant',
        content:
          '🚩 दिंडी क्रमांक १२ चा मुख्य ध्वज सध्या पालखी मार्गावर व्यवस्थित चालत आहे. आपण मागे पडल्यास पिवळ्या वारीरक्षक सेवकांशी संपर्क साधा.',
        actionType: 'call_leader',
        actionLabel: 'Alert Leader of My Position',
      };
    }

    if (query.includes('heat') || query.includes('blister') || query.includes('fever') || query.includes('ऊन') || query.includes('तप') || query.includes('पाय') || query.includes('त्रास')) {
      return {
        role: 'assistant',
        content:
          '☀️ प्रथमोपचार सल्ला: तापमान ३४°C आहे. झाडांच्या सावलीत विश्रांती घ्या, थोडे-थोडे पाणी प्या आणि पायात फोड असल्यास पादत्राणे सैल करा.',
        actionType: 'medical_sos',
        actionLabel: 'Request Route First-Aid Kit',
      };
    }

    if (query.includes('phaltan') || query.includes('distance') || query.includes('किती') || query.includes('मार्ग')) {
      return {
        role: 'assistant',
        content:
          '📍 मार्ग स्थिती: आपण वाखरी ➔ फलटण टप्प्यावर आहात. अंदाजे १२ किमी अंतर बाकी आहे. पुढील मुख्य विसावा फलटण आश्रम येथे दुपारी १ वाजता आहे.',
      };
    }

    return {
      role: 'assistant',
      content:
        'राम कृष्ण हरी 🙏 मी आपल्या सेवेसाठी तत्पर आहे. पालखी मार्ग, पाणी किंवा आपत्कालीन मदतीसाठी विचारा.',
      actionType: 'call_leader',
      actionLabel: 'Call Dindi Leader',
    };
  } else {
    // Dindi Leader Mode
    if (query.includes('lunch') || query.includes('broadcast') || query.includes('जेवण') || query.includes('घोषणा') || query.includes('संदेश')) {
      return {
        role: 'assistant',
        content:
          '📢 प्रस्तावित दिंडी घोषणा:\n"सर्व वारकरी बंधू-भगिनींनी लक्ष द्या: पुढील ५०० मीटर अंतरावर फलटण अन्नछत्र मंडप आहे. सर्व दिंडीने दुपारी १ वाजता भोजनासाठी एकत्र यावे."',
        actionType: 'broadcast',
        actionLabel: 'Open Broadcast Composer',
      };
    }

    if (query.includes('drift') || query.includes('missing') || query.includes('member') || query.includes('हरवला') || query.includes('मागे') || query.includes('शोध')) {
      return {
        role: 'assistant',
        content:
          '📍 हरवलेले वारकरी प्रोटोकॉल: २ वारकरी सतर्क (पांडुरंग पाटील: ४२० मी वायव्य, शांताबाई शिंदे: १५० मी मागे). रिले #४ आणि #२ त्यांना संपर्क करत आहेत.',
        actionType: 'call_leader',
        actionLabel: 'Call Pandurang Patil',
      };
    }

    if (query.includes('medical') || query.includes('ambulance') || query.includes('doctor') || query.includes('दवाखाना') || query.includes('क्लिनिक')) {
      return {
        role: 'assistant',
        content:
          '🚑 वैद्यकीय समन्वय: फिरते क्लिनिक #२ (डॉ. देशमुख) फलटण कॅम्पजवळ १.८ किमी अंतरावर ऑक्सिजन व सलाईनसह सज्ज आहे.',
        actionType: 'medical_sos',
        actionLabel: 'Emergency Mobile Clinic Dispatch',
      };
    }

    return {
      role: 'assistant',
      content:
        'जय हरी महाराज 🚩 आपला आदेश नोंदवला आहे. दिंडीतील वारकऱ्यांसाठी घोषणा किंवा समन्वय साधायचा आहे का?',
      actionType: 'broadcast',
      actionLabel: 'Open Dindi Broadcast',
    };
  }
};

export const sendUserChatMessage = async (
  persona: ChatPersona,
  text: string,
  onAiResponse?: (response: string) => void
) => {
  const cleanText = text.trim();
  if (!cleanText) return;

  Vibration.vibrate(25);

  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: cleanText,
  };

  // Capture prior conversation history before appending new user message
  const priorHistory = chatState[persona].map((m) => ({
    role: (m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system') as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  addChatMessage(persona, userMsg);

  try {
    const aiContent = await askSarvamAI(cleanText, persona, priorHistory);
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: aiContent,
    };
    addChatMessage(persona, aiMsg);
    Vibration.vibrate(35);
    if (onAiResponse) onAiResponse(aiContent);
  } catch (error) {
    console.warn('[Sarvam Chat fallback triggered]:', error);
    const offlineResponse = generateAIResponse(cleanText, persona);
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      ...offlineResponse,
    };
    addChatMessage(persona, aiMsg);
    Vibration.vibrate(35);
    if (onAiResponse) onAiResponse(aiMsg.content);
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
