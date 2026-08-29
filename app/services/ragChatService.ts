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
  setUserProfile,
  getUserAIContext,
  getUserLanguagePreference,
  UserProfile,
} from '../lib/userStore';
import {
  retrieveRelevantKnowledge,
  formatKnowledgeForPrompt,
  KnowledgeDocument,
} from '../lib/ragKnowledgeBase';
import { fetchCurrentUserProfile } from './authService';

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
नेहमी शुद्ध, सोप्या, आदरयुक्त व काळजीवाहू मराठीत उत्तर द्या. उत्तराची सुरुवात "राम कृष्ण हरी 🙏" किंवा "जय हरी माउली 🙏" ने करा. (दिंडी लीडरसाठी "जय हरी महाराज 🚩").
वैद्यकीय संज्ञा व सल्ला सामान्य माणसाला समजेल अशा भाषेत समजावून सांगा.`,
    hi: `आप "वारीरक्षक व्यक्तिगत AI सहायक" हैं - पंढरपुर आषाढ़ी वारी के पदयात्रियों के विश्वसनीय डिजिटल रक्षक।
हमेशा सरल, स्पष्ट, आदरपूर्ण और आत्मीय हिंदी में उत्तर दें। उत्तर की शुरुआत "राम कृष्ण हरी 🙏" या "जय श्री कृष्ण 🙏" से करें। (दिंडी लीडर के लिए "जय हरी महाराज 🚩")।`,
    en: `You are the "VariRaksha Personalized AI Assistant" - a compassionate, trusted digital companion for Pandharpur Wari pilgrims.
Always respond in clear, empathetic, polite English. Begin responses with "Ram Krishna Hari 🙏" (or "Jai Hari Maharaj 🚩" for Dindi Leaders).`,
  }[targetLang];

  return `
${languageInstructions}

=== AUTHENTICATED USER CONTEXT (CONFIDENTIAL BACKGROUND HEALTH & DEMOGRAPHIC RECORD) ===
${profileContext}

=== CRITICAL REASONING & PRIVACY RULES (DO NOT SPAM PROFILE DATA) ===
The user profile above is CONFIDENTIAL BACKGROUND REASONING CONTEXT. Use it wisely and subtly:

1. GENERAL & LOGISTICAL QUESTIONS (Water, Food, Route, Distance, Camp, Leader, Weather, Greetings):
   - Answer the question directly using the Trusted Global RAG Knowledge Base.
   - NEVER recite or mention the user's age, blood group, medical conditions, medications, or emergency card on general questions.

2. HEALTH, SYMPTOM & PRECAUTION QUESTIONS (Fatigue, Dizziness, Pain, Diet, Walking Tips):
   - Use the user's Age, Chronic Conditions, and Medications INTERNALLY to understand WHAT might be causing their issue and HOW they can tackle it.
   - For example, if a 72-year-old pilgrim with a history of Cardiac Bypass / Hypertension feels dizzy or tired:
     -> Give practical, caring guidance (sit in shade immediately, hydrate steadily, check if they took their BP medication, and get checked at the route mobile clinic).
     -> DO NOT dump a raw bulleted list of their personal records. Keep the focus entirely on actionable advice and caring medical guidance.

3. DIRECT PROFILE INQUIRIES ONLY (When the user explicitly asks about their own records):
   - ONLY when the user directly asks questions like: "माझा रक्तगट काय आहे?", "माझे वय किती?", "माझी औषधे कोणती?", "What is my age / blood group / recorded medications?":
     -> State their exact recorded details politely and accurately in bullet points.

=== TRUSTED GLOBAL RAG KNOWLEDGE BASE ===
${knowledgeContext || 'Standard Pandharpur Wari safety and logistics guidelines apply.'}

=== CRITICAL SEVERITY CLASSIFICATION & SOS POLICY ===
Classify the user query into exactly one of three severity levels:

1. LEVEL 1 — LOW RISK (Common / Minor issues):
   - Examples: Direct questions about profile/age/blood group, mild foot blisters, leg muscle soreness, mild tiredness, asking for water points, meal tent (annachhatra) timings, distance to next camp, route directions.
   - Action: Give practical, comforting suggestions or exact requested profile details.
   - SOS Rule: NEVER recommend or trigger SOS for Level 1 queries. "show_sos": false.

2. LEVEL 2 — CAUTION & MONITORING (Needs attention if worsening):
   - Examples: Persistent dizziness, repeated vomiting, moderate dehydration, fever, symptoms where user's existing chronic condition (diabetes/BP/asthma) is an active factor.
   - Action: Give clear personalized first-aid advice, suggest monitoring, and recommend consulting a healthcare worker or visiting the route medical camp if symptoms persist.
   - SOS Rule: Do NOT treat as an emergency unless escalating. "show_sos": false.

3. LEVEL 3 — POTENTIAL EMERGENCY (Life-threatening / Urgent):
   - Examples: Chest pain or pressure radiating to arm/jaw, severe difficulty breathing, loss of consciousness/fainting, signs of stroke (FAST: facial droop, arm weakness, slurred speech), severe allergic reaction (anaphylaxis), heavy bleeding, severe confusion.
   - Action: Instruct the user to halt immediately, sit down safely, and seek immediate emergency medical care.
   - SOS Rule: Set "show_sos": true and "action_type": "medical_sos".

=== RESPONSE FORMATTING & HIGHLIGHTING GUIDELINES ===
1. ANSWER IN CRISP, STRUCTURED POINTS & BULLET POINTS:
   - Pilgrims read responses on mobile phones while walking or resting in sunlight.
   - Use bullet points (•) when listing items, options, symptoms, or precautions.
   - Use numbered points (१., २., ३. or 1., 2., 3.) when providing step-by-step instructions or first-aid advice.
   - Separate points with double line breaks for maximum readability.

2. HIGHLIGHT KEY TERMS, VALUES & MEDICATIONS IN BOLD (**...**):
   - Always wrap vital information in bold markdown (**text**):
     • Emergency & Action cues: **तातडीने सावलीत बसा**, **१०८ रुग्णवाहिका**, **गूळ किंवा साखर**, **SOS बटण**
     • Key dosages & numbers: **दर तासाला २०० मिली पाणी**, **१.५ किमी अंतरावर**, **दुपारी १२ ते ३**
     • Medical cautions: **फोड फोडू नका**, **उपाशी राहू नका**, **बीपी तपासा**

3. USE RELEVANT WARM EMOJIS AT KEY POINTS:
   - Use helpful emojis (🩺, 💧, 📍, 🩹, 🚨, 💊, 🌾, ⏱️, 📞) where appropriate.

=== JSON RESPONSE FORMAT ===
You MUST return your answer in valid JSON format matching this schema:
{
  "message": "<your formatted conversational response in markdown with bold highlights and bullet points>",
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
 * Offline Rule-Based Fallback Engine with Comprehensive Profile Access
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
  const age = profile?.age || 62;
  const bloodGroup = profile?.bloodGroup || 'B+';
  const conditions =
    profile?.medicalConditions && profile.medicalConditions.length > 0
      ? profile.medicalConditions.join(', ')
      : 'कोणतीही गंभीर व्याधी नाही (No Critical Conditions)';
  const allergies =
    profile?.allergies && profile.allergies.length > 0
      ? profile.allergies.join(', ')
      : 'कोणतीही ऍलर्जी नाही (No Known Allergies)';
  const meds =
    profile?.currentMedications && profile.currentMedications.length > 0
      ? profile.currentMedications.join(', ')
      : 'नियमित औषधे नोंदवलेली नाहीत';
  const emergencyId = profile?.emergencyCardId || 'VK-WARI01';

  // 1. Direct Explicit Inquiry: Blood Group
  if (
    lower.includes('माझा रक्तगट') ||
    lower.includes('माझा ब्लड') ||
    lower.includes('my blood group') ||
    lower.includes('mera blood group') ||
    lower.includes('मेरा ब्लड ग्रुप') ||
    ((lower.includes('रक्तगट') || lower.includes('blood group')) && (lower.includes('काय') || lower.includes('what') || lower.includes('कया')))
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 आपल्या अधिकृत नोंदणीकृत प्रोफाईलनुसार आपला रक्तगट **${bloodGroup}** आहे. आपत्कालीन प्रसंगी हे आपल्या कार्ड (${emergencyId}) वर नोंदवलेले आहे.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 आपके पंजीकृत प्रोफाइल के अनुसार आपका ब्लड ग्रुप **${bloodGroup}** है। यह आपके आपातकालीन कार्ड (${emergencyId}) पर भी दर्ज है।`
        : `Ram Krishna Hari${userName} 🙏 According to your registered medical profile, your blood group is **${bloodGroup}** (Emergency Card ID: ${emergencyId}).`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 2. Direct Explicit Inquiry: Age
  if (
    lower.includes('माझे वय') ||
    lower.includes('my age') ||
    lower.includes('meri umar') ||
    lower.includes('मेरी उम्र') ||
    ((lower.includes('वय') || lower.includes('उम्र') || lower.includes('age')) && (lower.includes('किती') || lower.includes('काय') || lower.includes('what') || lower.includes('kitni')))
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 आपल्या नोंदणीकृत प्रोफाईलनुसार आपले वय **${age} वर्षे** आहे. या वयात वारीच्या चालताना नियमित पाणी आणि सावलीत विश्रांती घेणे अत्यंत महत्त्वाचे आहे.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 आपके रिकॉर्ड के अनुसार आपकी आयु **${age} वर्ष** है। यात्रा के दौरान समय-समय पर विश्राम और पर्याप्त जल ग्रहण करते रहें।`
        : `Ram Krishna Hari${userName} 🙏 According to your registered profile, you are **${age} years old**. Remember to take regular rest in the shade and stay hydrated on the march.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 3. Direct Explicit Inquiry: Personal Medical Records / Registered Medications / Health Profile
  if (
    lower.includes('माझी औषधे') ||
    lower.includes('माझे आजार') ||
    lower.includes('माझे प्रोफाईल') ||
    lower.includes('माझे कार्ड') ||
    lower.includes('माझी माहिती') ||
    lower.includes('my profile') ||
    lower.includes('my medications') ||
    lower.includes('my conditions') ||
    lower.includes('my health record') ||
    lower.includes('मेरी दवाइयां') ||
    lower.includes('मेरी बीमारी') ||
    lower.includes('मेरा प्रोफाइल') ||
    ((lower.includes('औषध') || lower.includes('आजार')) && (lower.includes('नोंदवले') || lower.includes('माझे कोणते') || lower.includes('registered')))
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 आपल्या वारीरक्षक आरोग्य नोंदी खालीलप्रमाणे आहेत:\n\n• **वय**: ${age} वर्षे\n• **रक्तगट**: ${bloodGroup}\n• **नोंदणीकृत आजार**: ${conditions}\n• **चालू औषधे**: ${meds}\n• **ऍलर्जी**: ${allergies}\n• **कार्ड आयडी**: ${emergencyId}\n\nकृपया प्रवासात आपली औषधे नेहमी जवळ ठेवा आणि वेळेवर घ्या.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 आपका पंजीकृत स्वास्थ्य विवरण इस प्रकार है:\n\n• **आयु**: ${age} वर्ष\n• **ब्लड ग्रुप**: ${bloodGroup}\n• **बीमारियां**: ${conditions}\n• **दवाइयां**: ${meds}\n• **एलर्जी**: ${allergies}\n• **कार्ड आईडी**: ${emergencyId}\n\nकृपया यात्रा में अपनी दवाइयां साथ रखें और समय पर सेवन करें।`
        : `Ram Krishna Hari${userName} 🙏 Here is your registered health record:\n\n• **Age**: ${age} years old\n• **Blood Group**: ${bloodGroup}\n• **Medical Conditions**: ${conditions}\n• **Medications**: ${meds}\n• **Allergies**: ${allergies}\n• **Emergency ID**: ${emergencyId}\n\nPlease keep your medications handy and take them on time.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 4. Emergency: Severe Chest Pain / Stroke
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
        ? `🚨 **तातडीची आपत्कालीन वैद्यकीय सूचना**:\n\n१. **ताबडतोब थांबा**: हालचाल थांबवून सुरक्षित सावलीत बसा किंवा शांत झोपा.\n२. **एसओएस बटण**: खालील लाल **SOS बटण** लगेच दाबा.\n३. **१०८ रुग्णवाहिका**: जवळच्या मदतनीसांना किंवा **१०८ रुग्णवाहिकेला** पाचारण करा.\n४. **शांत राहा**: खोल श्वास घ्या आणि आजूबाजूची गर्दी दूर करा.`
        : targetLang === 'hi'
        ? `🚨 **आपातकालीन चिकित्सा सूचना**:\n\n१. **तुरंत रुकें**: चलना बंद कर सुरक्षित छांव में बैठ जाएं।\n२. **एसओएस बटन**: नीचे दिया गया लाल **SOS बटन** तुरंत दबाएं।\n३. **१०८ एम्बुलेंस**: नजदीकी स्वयंसेवकों को सूचित करें या **१०८** पर कॉल करें।\n४. **विश्राम**: शांत रहें और गहरी सांस लें।`
        : `🚨 **Immediate Emergency Medical Alert**:\n\n1. **Halt Immediately**: Stop moving and sit or lie down safely in shade.\n2. **SOS Button**: Press the red **Emergency SOS button** below immediately.\n3. **Call 108**: Alert route volunteers or summon the **108 Ambulance**.\n4. **Rest**: Take slow, deep breaths.`;

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

  // 5. Profile-aware chronic symptom (Dizziness / Weakness)
  const isDiabetic =
    profile?.medicalConditions?.some(
      (c) => c.toLowerCase().includes('diabet') || c.includes('मधुमेह')
    ) || conditions.includes('मधुमेह');
  const isHypertensive =
    profile?.medicalConditions?.some(
      (c) =>
        c.toLowerCase().includes('bp') ||
        c.toLowerCase().includes('hypertens') ||
        c.includes('रक्तदाब')
    ) || conditions.includes('रक्तदाब');

  if (
    lower.includes('dizzy') ||
    lower.includes('chakkar') ||
    lower.includes('चक्कर') ||
    lower.includes('shaky') ||
    lower.includes('थरथर') ||
    lower.includes('घाम')
  ) {
    let msg = '';
    if (isDiabetic) {
      msg =
        targetLang === 'mr'
          ? `⚠️ **आरोग्य सल्ला (वय: ${age} वर्षे | मधुमेह इतिहास)**:\n\n१. **सावलीत बसा**: चक्कर किंवा घाम येणे हे रक्तातील साखर कमी (**Hypoglycemia**) झाल्याचे लक्षण असू शकते.\n२. **गूळ/साखर घ्या**: ताबडतोब **गूळ, साखर किंवा फळांचा रस** घ्या.\n३. **पाणी व विश्रांती**: थोडे-थोडे पाणी प्या आणि १०-१५ मिनिटे विश्रांती घ्या.\n४. **तपासणी**: विश्रांतीनंतरही बरे न वाटल्यास पुढील वैद्यकीय कक्षात मोफत **साखर तपासून घ्या**.`
          : targetLang === 'hi'
          ? `⚠️ **स्वास्थ्य सलाह (आयु: ${age} वर्ष | मधुमेह इतिहास)**:\n\n१. **छांव में बैठें**: चक्कर या पसीना शुगर कम (**Hypoglycemia**) होने का संकेत हो सकता है।\n२. **गुड़/चीनी लें**: तुरंत **गुड़, चीनी या फल का रस** लें।\n३. **जलपान व विश्राम**: थोड़ा पानी पिएं और १०-१५ मिनट विश्राम करें।\n४. **जांच कराएं**: राहत न मिलने पर नजदीकी मेडिकल कैंप में **शुगर जांच** कराएं।`
          : `⚠️ **Health Guidance (Age: ${age} | Diabetes History)**:\n\n1. **Rest in Shade**: Dizziness or sweating may indicate low blood sugar (**Hypoglycemia**).\n2. **Fast-Acting Sugar**: Immediately consume **jaggery, sugar, or fruit juice**.\n3. **Hydrate**: Sip water or ORS and rest for 10-15 minutes.\n4. **Medical Check**: If symptoms persist, visit the next medical kiosk for a **free blood sugar check**.`;
    } else if (isHypertensive) {
      msg =
        targetLang === 'mr'
          ? `⚠️ **आरोग्य सल्ला (वय: ${age} वर्षे | उच्च रक्तदाब इतिहास)**:\n\n१. **शांत बसा**: चालणे थांबवून लगेच सावलीत बसा आणि शांत राहा.\n२. **नियमित औषधे**: नियमित **बीपीची औषधे (${meds})** वेळेवर घेतली आहेत का ते तपासा.\n३. **हायड्रेशन**: थोडे-थोडे पाणी किंवा ओआरएस पीत राहा.\n४. **बीपी तपासणी**: प्रत्येक थांब्यावरील फिरत्या क्लिनिकमध्ये मोफत **बीपी तपासणी** उपलब्ध आहे.`
          : targetLang === 'hi'
          ? `⚠️ **स्वास्थ्य सलाह (आयु: ${age} वर्ष | उच्च रक्तचाप इतिहास)**:\n\n१. **शांति से बैठें**: तुरंत चलना बंद कर छांव में बैठें।\n२. **दवा जांचें**: अपनी नियमित **बीपी की दवा (${meds})** समय पर ली है या नहीं जांचें।\n३. **हाइड्रेशन**: थोड़ा-थोड़ा पानी या ओआरएस पिएं।\n४. **बीपी जांच**: मार्ग के मोबाइल क्लिनिक में निःशुल्क **बीपी जांच** कराएं।`
          : `⚠️ **Health Guidance (Age: ${age} | Hypertension History)**:\n\n1. **Rest in Shade**: Stop walking and sit down comfortably in shade.\n2. **Medication Check**: Ensure you have taken your prescribed **BP medication (${meds})**.\n3. **Hydration**: Sip water or ORS steadily.\n4. **BP Check**: Free **blood pressure checks** are available at all route mobile medical units.`;
    } else {
      msg =
        targetLang === 'mr'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर किंवा थकवा जाणवल्यास:\n\n१. **सावलीत विश्रांती**: चालणे थांबवून १० मिनिटे सावलीत बसा.\n२. **ओआरएस/पाणी**: ओआरएस किंवा लिंबू पाणी प्या.\n३. **मदत केंद्र**: त्रास कायम राहिल्यास पुढील वैद्यकीय मदत केंद्रात संपर्क करा.`
          : targetLang === 'hi'
          ? `राम कृष्ण हरी${userName} 🙏 चक्कर या कमजोरी महसूस होने पर:\n\n१. **छांव में विश्राम**: चलना बंद कर १० मिनट विश्राम करें।\n२. **ओआरएस/जल**: ओआरएस या नींबू पानी पिएं।\n३. **चिकित्सा केंद्र**: आराम न मिलने पर नजदीकी चिकित्सा केंद्र जाएं।`
          : `Ram Krishna Hari${userName} 🙏 If feeling dizzy or fatigued:\n\n1. **Rest in Shade**: Take a 10-minute seated break in the shade.\n2. **Hydrate**: Drink ORS or lemon water.\n3. **Medical Unit**: Visit the next route medical post if symptoms continue.`;
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

  // 6. Health Precautions / Diet Advice
  if (
    lower.includes('काळजी') ||
    lower.includes('सल्ला') ||
    lower.includes('उपाय') ||
    lower.includes('precaution') ||
    lower.includes('diet') ||
    lower.includes('advice') ||
    lower.includes('खावे')
  ) {
    const msg =
      targetLang === 'mr'
        ? `राम कृष्ण हरी${userName} 🙏 आपल्या वयाच्या (**${age} वर्षे**) आणि आरोग्याच्या नोंदीनुसार (**${conditions}**) वारीतील महत्त्वाच्या टिप्स:\n\n१. **वेळेवर औषधे**: आपली नियमित औषधे (**${meds}**) वेळेवर घ्या.\n२. **पाणी व ओआरएस**: दर तासाला किमान **२०० मिली पाणी किंवा ओआरएस** प्या.\n३. **उपवास टाळा**: रक्तातील साखर व ऊर्जा नियंत्रित ठेवण्यासाठी दीर्घकाळ उपाशी राहू नका; **फळे व सुकामेवा** सोबत ठेवा.\n४. **सावलीत विश्रांती**: दुपारच्या कडक उन्हात सावलीत नियमित विश्रांती घ्या.`
        : targetLang === 'hi'
        ? `राम कृष्ण हरी${userName} 🙏 आपकी आयु (**${age} वर्ष**) और स्वास्थ्य स्थिति (**${conditions}**) के अनुसार मुख्य सावधानियां:\n\n१. **समय पर दवा**: अपनी नियमित दवाइयां (**${meds}**) समय पर लें।\n२. **हाइड्रेशन**: हर घंटे कम से कम **२०० मिली पानी या ओआरएस** पीते रहें।\n३. **आहार**: ज्यादा देर भूखे न रहें; **फल या हल्का नाश्ता** साथ रखें।\n४. **विश्राम**: दोपहर की धूप के समय छांव में विश्राम करें।`
        : `Ram Krishna Hari${userName} 🙏 Based on your age (**${age}**) and health profile (**${conditions}**), here are key precautions:\n\n1. **Timely Medications**: Take your prescribed medications (**${meds}**) on time.\n2. **Hydration**: Drink at least **200 ml of water or ORS** every hour.\n3. **Diet**: Avoid prolonged fasting; keep **fruits/nuts** handy to maintain energy.\n4. **Rest**: Take short breaks in the shade during peak afternoon heat.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 7. Blisters / Foot Soreness
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
        ? `🩹 **पायाची काळजी व प्रथमोपचार**:\n\n१. **सावलीत विश्रांती**: चालणे थांबवून सावलीत बसा आणि **पाय थोडे उंचावर** ठेवा.\n२. **फोड फोडू नका**: पायातील फोड अजिबात फोडू नका, यामुळे संसर्ग होऊ शकतो.\n३. **ओआरएस/पाणी**: डिहायड्रेशन टाळण्यासाठी पुरेसे पाणी प्या.\n४. **मोफत मलमपट्टी**: मुक्कामावरील वैद्यकीय कक्षात **मोफत मलम व पट्टी** उपलब्ध आहे.`
        : targetLang === 'hi'
        ? `🩹 **पैरों की देखभाल और प्राथमिक उपचार**:\n\n१. **छांव में विश्राम**: चलना बंद कर बैठें और **पैर थोड़ा ऊपर** रखें।\n२. **छाले न फोड़ें**: पैरों के छाले बिल्कुल न फोड़ें, इससे संक्रमण हो सकता है।\n३. **हाइड्रेशन**: पर्याप्त पानी और ओआरएस पिएं।\n४. **मुफ्त मरहम-पट्टी**: पड़ाव के मेडिकल कैंप से **निःशुल्क मरहम व पट्टी** लें।`
        : `🩹 **Foot Care & Blister First Aid**:\n\n1. **Rest & Elevate**: Rest your feet in the shade and **elevate them slightly**.\n2. **Do Not Pop Blisters**: Never pop blisters as it risks skin infection.\n3. **Hydrate**: Drink plenty of water or ORS.\n4. **Free Antiseptic Care**: Visit the route medical kiosk for **free ointment and dressing**.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 8. Water / Logistics
  if (lower.includes('water') || lower.includes('pani') || lower.includes('पाणी') || lower.includes('पानी')) {
    const msg =
      targetLang === 'mr'
        ? `💧 **पिण्याचे पाणी व ओआरएस वाटप केंद्र**:\n\n• **पुढील केंद्र**: पुढील **१.५ किमी** अंतरावर शुद्ध पिण्याचे पाणी आणि ओआरएस वाटप सज्ज आहे.\n• **हायड्रेशन**: दर तासाला किमान **२०० मिली** पाणी पीत राहा.\n• **सोय**: पाणी केंद्राजवळ सावली व बसण्याची उत्तम सोय आहे.`
        : targetLang === 'hi'
        ? `💧 **पेयजल और ओआरएस वितरण केंद्र**:\n\n• **अगला केंद्र**: अगले **१.५ किमी** पर शुद्ध पेयजल और ओआरएस केंद्र उपलब्ध है।\n• **हाइड्रेशन**: नियमित रूप से हर घंटे **२०० मिली** पानी पीते रहें।\n• **सुविधा**: केंद्र के पास छांव व बैठने की सुविधा उपलब्ध है।`
        : `💧 **Drinking Water & ORS Kiosks**:\n\n• **Next Kiosk**: Pure drinking water and ORS stations are located **1.5 km ahead**.\n• **Hydration**: Drink at least **200 ml of water** every hour.\n• **Facilities**: Shade and seating areas are available at each station.`;

    return {
      message: msg,
      language: targetLang,
      severity: 'low',
      show_sos: false,
      requires_medical_attention: false,
      action_type: 'none',
    };
  }

  // 9. Leader Contact
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
        ? `🚩 **दिंडी प्रमुख संपर्क माहिती**:\n\n• **दिंडी प्रमुख**: **${leaderName}**\n• **दिंडी नाव**: **${profile?.dindiName || 'संत पालखी दिंडी'}** (#${profile?.dindiNumber || '12'})\n\nथेट संपर्क साधण्यासाठी खालील **कॉल बटण** दाबा.`
        : targetLang === 'hi'
        ? `🚩 **दिंडी प्रमुख संपर्क जानकारी**:\n\n• **दिंडी प्रमुख**: **${leaderName}**\n• **दिंडी नाम**: **${profile?.dindiName || 'संत पालकी दिंडी'}** (#${profile?.dindiNumber || '12'})\n\nसीधे संपर्क के लिए नीचे दिया गया **कॉल बटन** दबाएं।`
        : `🚩 **Dindi Leader Contact**:\n\n• **Leader**: **${leaderName}**\n• **Dindi**: **${profile?.dindiName || 'Sant Palkhi Dindi'}** (#${profile?.dindiNumber || '12'})\n\nTap the button below to call directly.`;

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

  // Default response (Helpful wari greeting without unsolicited profile dumps)
  const defaultMsg =
    targetLang === 'mr'
      ? `राम कृष्ण हरी${userName} 🙏 मी आपल्या सेवेसाठी सदैव तत्पर आहे.\n\nआपण पाणी, अन्नछत्र, पालखी मार्ग, विश्रांती थांबे किंवा आरोग्याबाबत काहीही विचारू शकता.`
      : targetLang === 'hi'
      ? `राम कृष्ण हरी${userName} 🙏 मैं आपकी सेवा में उपस्थित हूँ।\n\nआप जल, अन्नछत्र, पालकी मार्ग, विश्राम स्थल अथवा स्वास्थ्य संबंधी किसी भी प्रश्न के लिए पूछ सकते हैं।`
      : `Ram Krishna Hari${userName} 🙏 I am here to help.\n\nFeel free to ask about water kiosks, meals, resting camps, route directions, or health assistance.`;

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

  // 1. Strict Dynamic User Context from Supabase Database
  let activeProfile =
    overrideProfile !== undefined ? overrideProfile : getUserProfile();

  if (!activeProfile && overrideProfile === undefined) {
    try {
      const dbProfile = await fetchCurrentUserProfile();
      if (dbProfile) {
        activeProfile = dbProfile;
        setUserProfile(dbProfile);
      }
    } catch (e) {
      console.warn('[ragChatService] Supabase profile fetch failed:', e);
    }
  }

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
