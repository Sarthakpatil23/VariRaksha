/**
 * VariRaksha Personalized Profile-Aware RAG AI Chatbot Service
 * 
 * Flow:
 * 1. Resolve active authenticated user profile from userStore (Strict Data Isolation)
 * 2. Build personalized user medical & demographic context (Name, Age, Conditions, Meds, Contacts)
 * 3. Retrieve relevant global knowledge documents (Wari Route, First Aid, Chronic Care, Emergency Protocols)
 * 4. Assemble system prompt with 3-tier severity classification (Eliminating SOS overuse)
 * 5. Feed multi-turn conversation context to Groq / Sarvam LLM
 * 6. Parse structured AI response (message, severity, show_sos, action_type, language)
 */

import {
  getUserProfile,
  getUserAIContext,
  getUserLanguagePreference,
  UserProfile,
} from '../lib/userStore';
import {
  retrieveRelevantKnowledge,
  formatKnowledgeForPrompt,
  KnowledgeDocument,
} from '../lib/ragKnowledgeBase';

const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  process.env.GROQ_API_KEY ||
  '';

const SARVAM_API_KEY =
  process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
  process.env.SARVAM_API_KEY ||
  '';

export type ChatLanguage = 'mr' | 'hi' | 'en';
export type ChatSeverity = 'low' | 'moderate' | 'emergency';
export type ChatActionType = 'call_leader' | 'medical_sos' | 'broadcast' | 'meetup' | 'none';

export interface AIResponsePayload {
  message: string;
  language: ChatLanguage;
  severity: ChatSeverity;
  show_sos: boolean;
  requires_medical_attention: boolean;
  action_type?: ChatActionType;
  action_label?: string;
  retrieved_knowledge_titles?: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Builds localized system instructions for the LLM based on user profile and target language
 */
function buildSystemPrompt(
  profileContext: string,
  knowledgeContext: string,
  persona: 'varkari' | 'dindiLeader',
  targetLang: ChatLanguage
): string {
  const languageInstructions = {
    mr: `तुम्ही "वारीरक्षक वैयक्तिक AI सहाय्यक" आहात - पंढरपूर वारीच्या वारकऱ्यांचे हक्काचे, विश्वासू डिजिटल रक्षक.
नेहमी शुद्ध, सोप्या व आदरयुक्त मराठीत उत्तर द्या. उत्तराची सुरुवात "राम कृष्ण हरी 🙏" किंवा "जय हरी माउली 🙏" ने करा. (दिंडी लीडरसाठी "जय हरी महाराज 🚩").
वैद्यकीय संज्ञा सोप्या भाषेत सांगा.`,
    hi: `आप "वारीरक्षक व्यक्तिगत AI सहायक" हैं - पंढरपुर आषाढ़ी वारी के पदयात्रियों के विश्वसनीय डिजिटल रक्षक।
हमेशा सरल, स्पष्ट और आदरपूर्ण हिंदी में उत्तर दें। उत्तर की शुरुआत "राम कृष्ण हरी 🙏" या "जय श्री कृष्ण 🙏" से करें। (दिंडी लीडर के लिए "जय हरी महाराज 🚩")।`,
    en: `You are the "VariRaksha Personalized AI Assistant" - a compassionate, trusted digital companion for Pandharpur Wari pilgrims.
Always respond in clear, empathetic, polite English. Begin responses with "Ram Krishna Hari 🙏" (or "Jai Hari Maharaj 🚩" for Dindi Leaders).`,
  }[targetLang];

  return `
${languageInstructions}

=== AUTHENTICATED USER CONTEXT (CONFIDENTIAL) ===
${profileContext}
* Use this user profile to understand the person's age, medical conditions, medications, allergies, and dindi details.
* NEVER repeat the entire profile back to the user robotically. Use it as hidden reasoning context.
* If a symptom could be related to their condition (e.g., dizziness in a diabetic/hypertensive person), provide appropriate caution without making an absolute diagnosis.

=== TRUSTED GLOBAL RAG KNOWLEDGE BASE ===
${knowledgeContext || 'Standard Pandharpur Wari safety and logistics guidelines apply.'}

=== CRITICAL SEVERITY CLASSIFICATION & SOS POLICY ===
Classify the user query into exactly one of three severity levels:

1. LEVEL 1 — LOW RISK (Common / Minor issues):
   - Examples: Mild foot blisters, leg muscle soreness, mild tiredness, asking for water points, meal tent (annachhatra) timings, distance to next camp, route directions, weather/sun protection.
   - Action: Give practical, comforting suggestions (rest in shade, drink ORS/water, elevate feet, don't pop blisters).
   - SOS Rule: NEVER recommend or trigger SOS for Level 1 queries. "show_sos": false.

2. LEVEL 2 — CAUTION & MONITORING (Needs attention if worsening):
   - Examples: Persistent dizziness, repeated vomiting, moderate dehydration, fever, symptoms where user's existing chronic condition (diabetes/BP/asthma) is a factor.
   - Action: Give clear first-aid advice, suggest monitoring, and recommend consulting a healthcare worker or visiting the route medical camp if symptoms persist.
   - SOS Rule: Do NOT treat as an emergency unless escalating. "show_sos": false.

3. LEVEL 3 — POTENTIAL EMERGENCY (Life-threatening / Urgent):
   - Examples: Chest pain or pressure radiating to arm/jaw, severe difficulty breathing, loss of consciousness/fainting, signs of stroke (FAST: facial droop, arm weakness, slurred speech), severe allergic reaction (anaphylaxis), heavy bleeding, severe confusion.
   - Action: Instruct the user to halt immediately, sit down safely, and seek immediate emergency medical care.
   - SOS Rule: Set "show_sos": true and "action_type": "medical_sos".

=== JSON RESPONSE FORMAT ===
You MUST return your answer in valid JSON format matching this schema:
{
  "message": "<your conversational response in the requested language>",
  "language": "${targetLang}",
  "severity": "low" | "moderate" | "emergency",
  "show_sos": true | false,
  "requires_medical_attention": true | false,
  "action_type": "call_leader" | "medical_sos" | "broadcast" | "none",
  "action_label": "<optional short button label in target language if action_type is set>"
}
Only output the JSON object. Do not include markdown code fence formatting or surrounding commentary.
`.trim();
}

/**
 * Parses raw LLM text into a validated AIResponsePayload with robust fallbacks
 */
function parseLLMResponse(
  rawText: string,
  targetLang: ChatLanguage,
  retrievedDocs: KnowledgeDocument[]
): AIResponsePayload {
  const docTitles = retrievedDocs.map((d) => d.title);

  try {
    let cleanJson = rawText.trim();
    // Remove markdown code fences if present
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(cleanJson);

      let severity: ChatSeverity = 'low';
      if (parsed.severity === 'emergency' || parsed.show_sos === true) {
        severity = 'emergency';
      } else if (parsed.severity === 'moderate' || parsed.requires_medical_attention === true) {
        severity = 'moderate';
      }

      const show_sos = severity === 'emergency' || parsed.show_sos === true;

      let actionType: ChatActionType = parsed.action_type || 'none';
      if (show_sos && (!actionType || actionType === 'none')) {
        actionType = 'medical_sos';
      }

      let actionLabel = parsed.action_label;
      if (!actionLabel) {
        if (actionType === 'medical_sos') {
          actionLabel =
            targetLang === 'mr'
              ? '🚨 तातडीची वैद्यकीय मदत (SOS)'
              : targetLang === 'hi'
              ? '🚨 आपातकालीन चिकित्सा (SOS)'
              : '🚨 Emergency Medical SOS';
        } else if (actionType === 'call_leader') {
          actionLabel =
            targetLang === 'mr'
              ? '📞 दिंडी प्रमुखांना कॉल करा'
              : targetLang === 'hi'
              ? '📞 दिंडी प्रमुख को कॉल करें'
              : '📞 Call Dindi Leader';
        }
      }

      return {
        message: parsed.message || rawText,
        language: targetLang,
        severity,
        show_sos,
        requires_medical_attention: parsed.requires_medical_attention || severity !== 'low',
        action_type: actionType,
        action_label: actionLabel,
        retrieved_knowledge_titles: docTitles,
      };
    }
  } catch (err) {
    // Non-JSON plain text fallback
  }

  // Fallback heuristic classification
  const lower = rawText.toLowerCase();
  const isEmergency =
    lower.includes('heart attack') ||
    lower.includes('stroke') ||
    lower.includes('हार्ट') ||
    lower.includes('छातीत कळ') ||
    lower.includes('बेशुद्ध') ||
    lower.includes('लकवा');

  const isModerate =
    !isEmergency &&
    (lower.includes('डॉक्टर') ||
      lower.includes('क्लिनिक') ||
      lower.includes('तपासणी') ||
      lower.includes('doctor') ||
      lower.includes('clinic'));

  return {
    message: rawText.trim(),
    language: targetLang,
    severity: isEmergency ? 'emergency' : isModerate ? 'moderate' : 'low',
    show_sos: isEmergency,
    requires_medical_attention: isEmergency || isModerate,
    action_type: isEmergency ? 'medical_sos' : 'none',
    action_label: isEmergency
      ? targetLang === 'mr'
        ? '🚨 तातडीची वैद्यकीय मदत (SOS)'
        : '🚨 Emergency SOS'
      : undefined,
    retrieved_knowledge_titles: docTitles,
  };
}

/**
 * Offline Rule-Based Fallback Engine
 */
function generateOfflineRAGResponse(
  query: string,
  persona: 'varkari' | 'dindiLeader',
  targetLang: ChatLanguage,
  profile: UserProfile | null,
  retrievedDocs: KnowledgeDocument[]
): AIResponsePayload {
  const lower = query.toLowerCase();
  const userName = profile?.fullName ? ` ${profile.fullName}` : '';

  // 1. Emergency
  if (
    lower.includes('chest') ||
    lower.includes('chhati') ||
    lower.includes('छाती') ||
    lower.includes('heart') ||
    lower.includes('हार्ट') ||
    lower.includes('stroke') ||
    lower.includes('पक्षाघात') ||
    lower.includes('बेशुद्ध')
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 ही गंभीर आपत्कालीन परिस्थिती असू शकते. कृपया त्वरित हालचाल थांबवून विश्रांती घ्या. ताबडतोब खालील लाल SOS बटण दाबा किंवा १०८ रुग्णवाहिकेला पाचारण करा.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 यह गंभीर आपातकालीन स्थिति हो सकती है। कृपया तुरंत चलना बंद कर बैठ जाएं। तुरंत नीचे दिया गया लाल SOS बटन दबाएं या १०८ एम्बुलेंस को कॉल करें।`
        : `Ram Krishna Hari${userName} 🙏 This may require immediate medical attention. Please stop moving and sit down safely. Press the red SOS button below immediately.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'emergency',
      show_sos: true,
      requires_medical_attention: true,
      action_type: 'medical_sos',
      action_label:
        targetLang === 'mr'
          ? '🚨 तातडीची मदत (SOS)'
          : targetLang === 'hi'
          ? '🚨 आपातकालीन SOS'
          : '🚨 Emergency SOS',
    };
  }

  // 2. Profile-aware chronic symptom (Dizziness / Weakness)
  const isDiabetic = profile?.medicalConditions?.some(
    (c) => c.toLowerCase().includes('diabet') || c.includes('मधुमेह')
  );
  const isHypertensive = profile?.medicalConditions?.some(
    (c) => c.toLowerCase().includes('bp') || c.toLowerCase().includes('hypertens') || c.includes('रक्तदाब')
  );

  if (
    lower.includes('dizzy') ||
    lower.includes('chakkar') ||
    lower.includes('चक्कर') ||
    lower.includes('shaky') ||
    lower.includes('थरथर')
  ) {
    let msg = '';
    if (isDiabetic) {
      msg =
        targetLang === 'mr'
          ? `राम कृष्ण हरी${userName} 🙏 आपल्याला चक्कर किंवा थरथर जाणवत असल्यास रक्तातील साखर कमी (Hypoglycemia) असण्याची शक्यता आहे. ताबडतोब सावलीत बसा आणि गूळ, साखर किंवा फळांचा रस घ्या. विश्रांतीनंतरही बरे न वाटल्यास जवळच्या वैद्यकीय कक्षात साखर तपासून घ्या.`
          : targetLang === 'hi'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर या कमजोरी शुगर कम होने का संकेत हो सकता है। तुरंत छांव में बैठें और गुड़, चीनी या फल का रस लें। आराम न मिलने पर नजदीकी मेडिकल कैंप में शुगर जांच कराएं।`
          : `Ram Krishna Hari${userName} 🙏 Dizziness and shakiness may indicate low blood sugar. Please rest in shade immediately and consume quick-acting sugar (jaggery/juice). Consult route doctors if it persists.`;
    } else if (isHypertensive) {
      msg =
        targetLang === 'mr'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर जाणवत असल्यास चालणे थांबवून शांत बसा आणि पाणी प्या. नियमित बीपीची औषधे घेतली आहेत का ते तपासा. प्रत्येक थांब्यावर मोबाईल क्लिनिकमध्ये मोफत बीपी तपासणी उपलब्ध आहे.`
          : targetLang === 'hi'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर आने पर तुरंत बैठें और पानी पिएं। अपनी नियमित बीपी की दवा समय पर लें और मार्ग के मेडिकल कैंप में बीपी जांच कराएं।`
          : `Ram Krishna Hari${userName} 🙏 Please rest in shade and hydrate. Check if you have taken your BP medication, and get your blood pressure checked at the nearest route medical unit.`;
    } else {
      msg =
        targetLang === 'mr'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर किंवा थकवा जाणवल्यास सावलीत बसा, ओआरएस किंवा लिंबू पाणी प्या आणि १० मिनिटे विश्रांती घ्या. त्रास कायम राहिल्यास वैद्यकीय मदत केंद्रात संपर्क करा.`
          : targetLang === 'hi'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर आने पर छांव में बैठें, ओआरएस या पानी पिएं और विश्राम करें। आराम न मिलने पर डॉक्टर को दिखाएं।`
          : `Ram Krishna Hari${userName} 🙏 Please rest in the shade, drink some ORS/water, and relax for a few minutes.`;
    }

    return {
      message: msg,
      language: targetLang,
      severity: 'moderate',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 3. Blisters / Foot Soreness
  if (
    lower.includes('blister') ||
    lower.includes('foot') ||
    lower.includes('feet') ||
    lower.includes('pay') ||
    lower.includes('पाय') ||
    lower.includes('फोड')
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 चालल्यामुळे पाय दुखत असल्यास सावलीत विश्रांती घ्या, पाय किंचित वर ठेवा आणि ओआरएस प्या. पायात फोड असल्यास तो फोडू नका; मुक्कामावरील वैद्यकीय केंद्रात मोफत मलम व पट्टी उपलब्ध आहे.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 लगातार चलने से पैर दुख रहे हों तो विश्राम करें और पैर थोड़ा ऊपर रखें। पैरों के छाले न फोड़ें; पड़ाव पर मेडिकल कैंप से निःशुल्क मरहम व पट्टी लें।`
        : `Ram Krishna Hari${userName} 🙏 Rest your feet in the shade, elevate them slightly, and drink water. Do not pop blisters; antiseptic care is available at route medical booths.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 4. Water / Logistics
  if (lower.includes('water') || lower.includes('pani') || lower.includes('पाणी') || lower.includes('पानी')) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 पुढील १.५ किमी अंतरावर शुद्ध पिण्याचे पाणी आणि ओआरएस वाटप केंद्र सज्ज आहे. दर तासाला पाणी पीत राहा.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 अगले १.५ किमी पर शुद्ध पेयजल और ओआरएस केंद्र उपलब्ध है। नियमित रूप से पानी पीते रहें।`
        : `Ram Krishna Hari${userName} 🙏 Pure drinking water and ORS kiosks are located every 1-2 km along the march. Stay hydrated!`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 5. Leader Contact
  if (
    lower.includes('leader') ||
    lower.includes('प्रमुख') ||
    lower.includes('malak') ||
    lower.includes('flag') ||
    lower.includes('झेंडा') ||
    lower.includes('haravle') ||
    lower.includes('हरवले')
  ) {
    const leaderName = profile?.dindiLeaderName || 'ह.भ.प. सोपानराव महाराज';
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 आपले दिंडी प्रमुख ${leaderName} यांच्याशी थेट संपर्क साधण्यासाठी खालील बटण दाबा.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 अपने दिंडी प्रमुख ${leaderName} से सीधे संपर्क के लिए नीचे दिया गया बटन दबाएं।`
        : `Ram Krishna Hari${userName} 🙏 To contact your Dindi Leader (${leaderName}), tap the button below.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'call_leader',
      action_label:
        targetLang === 'mr'
          ? `📞 ${leaderName} यांना कॉल करा`
          : targetLang === 'hi'
          ? `📞 ${leaderName} को कॉल करें`
          : `📞 Call ${leaderName}`,
    };
  }

  // Default response
  const defaultMsg =
    targetLang === 'mr'
      ? `राम कृष्ण हरी${userName} 🙏 मी आपल्या सेवेसाठी तत्पर आहे. पाणी, अन्नछत्र, पालखी मार्ग, विश्रांती किंवा आरोग्याबाबत काहीही विचारा.`
      : targetLang === 'hi'
      ? `राम कृष्ण हरी${userName} 🙏 मैं आपकी सेवा में उपस्थित हूँ। जल, अन्नछत्र, पालकी मार्ग अथवा स्वास्थ्य संबंधी किसी भी प्रश्न के लिए पूछें।`
      : `Ram Krishna Hari${userName} 🙏 I am here to help. Feel free to ask about water, meals, resting points, route status, or health assistance.`;

  return {
    message: defaultMsg,
    language: targetLang,
    severity: 'low',
    show_sos: false,
    requires_medical_attention: false,
    action_type: 'none',
  };
}

/**
 * Main Entry Point: Ask the Personalized RAG Assistant
 */
export async function askPersonalizedRAG(
  userQuery: string,
  persona: 'varkari' | 'dindiLeader' = 'varkari',
  conversationHistory: ConversationTurn[] = [],
  explicitLang?: ChatLanguage,
  overrideProfile?: UserProfile | null
): Promise<AIResponsePayload> {
  const targetLang: ChatLanguage =
    explicitLang || getUserLanguagePreference() || 'mr';

  // 1. Strict User Context Isolation
  const activeProfile =
    overrideProfile !== undefined ? overrideProfile : getUserProfile();
  const profileContext = getUserAIContext(activeProfile);

  // 2. Retrieve Top Global Knowledge Chunks
  const retrievedDocs = retrieveRelevantKnowledge(userQuery, 3, targetLang);
  const knowledgeContext = formatKnowledgeForPrompt(retrievedDocs, targetLang);

  // 3. Assemble System Prompt with Strict Severity & Personalization Rules
  const systemPrompt = buildSystemPrompt(
    profileContext,
    knowledgeContext,
    persona,
    targetLang
  );

  // 4. Sanitize and structure history turns
  const filteredHistory = conversationHistory
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  // Prevent duplicate query at tail
  if (
    filteredHistory.length > 0 &&
    filteredHistory[filteredHistory.length - 1].role === 'user' &&
    filteredHistory[filteredHistory.length - 1].content === userQuery.trim()
  ) {
    filteredHistory.pop();
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...filteredHistory,
    { role: 'user', content: userQuery.trim() },
  ];

  // 5. Attempt Groq LLM Generation
  if (GROQ_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages,
          temperature: 0.2,
          max_tokens: 600,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          return parseLLMResponse(rawContent, targetLang, retrievedDocs);
        }
      } else {
        const errText = await response.text();
        console.warn(`[Groq RAG API] HTTP ${response.status}:`, errText);
      }
    } catch (groqErr) {
      console.warn('[Groq RAG API Call Failed, falling back]:', groqErr);
    }
  }

  // 6. Attempt Sarvam LLM Generation Fallback
  if (SARVAM_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY,
          Authorization: `Bearer ${SARVAM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'sarvam-105b-conversations',
          messages,
          temperature: 0.2,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          return parseLLMResponse(rawContent, targetLang, retrievedDocs);
        }
      }
    } catch (sarvamErr) {
      console.warn('[Sarvam RAG API Fallback Failed]:', sarvamErr);
    }
  }

  // 7. Offline Rule-Based RAG Engine (Zero network fallback)
  return generateOfflineRAGResponse(
    userQuery,
    persona,
    targetLang,
    activeProfile,
    retrievedDocs
  );
}
