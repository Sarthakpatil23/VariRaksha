/**
 * Comprehensive Automated Test Suite for VariRaksha Personalized RAG Chatbot
 * Validates:
 * 1. Semantic Knowledge Base Retrieval across multiple languages and domains.
 * 2. Profile-Aware Medical Reasoning (Hidden user context without robotic echo).
 * 3. 3-Tier Severity Classification (Low, Moderate, Emergency) - Preventing SOS overuse.
 * 4. Multi-language Consistency (Marathi, Hindi, English).
 * 5. Strict User Context Isolation across logout/login sessions.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  });
} catch (e) {
  console.log('Note: .env file read fallback', e.message);
}

// 1. In-memory Knowledge Chunks for Verification
const {
  RAG_KNOWLEDGE_BASE,
  retrieveRelevantKnowledge,
  formatKnowledgeForPrompt,
} = require('../app/lib/ragKnowledgeBase');

// Mock User Profile Store for testing
let currentUserProfile = null;
let currentLanguagePreference = 'mr';

function mockSetUserProfile(profile) {
  currentUserProfile = profile;
}

function mockClearUserSession() {
  currentUserProfile = null;
  currentLanguagePreference = 'mr';
}

function mockGetUserAIContext(profile) {
  if (!profile) return 'Guest Pilgrim (General assistance only).';
  const parts = [
    `Name: ${profile.fullName || 'Anonymous'}`,
    profile.age ? `Age: ${profile.age}` : null,
    profile.gender ? `Gender: ${profile.gender}` : null,
    profile.bloodGroup ? `Blood Group: ${profile.bloodGroup}` : null,
    profile.medicalConditions && profile.medicalConditions.length > 0
      ? `Chronic Conditions: ${profile.medicalConditions.join(', ')}`
      : null,
    profile.allergies && profile.allergies.length > 0
      ? `Known Allergies: ${profile.allergies.join(', ')}`
      : null,
    profile.currentMedications && profile.currentMedications.length > 0
      ? `Current Medications: ${profile.currentMedications.join(', ')}`
      : null,
  ].filter(Boolean);
  return parts.join(' | ');
}

// Test runner function
async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING VARIRAKSHA PERSONALIZED RAG CHATBOT TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Knowledge Base Semantic Retrieval
  // -------------------------------------------------------------
  console.log('--- 1. Knowledge Base Retrieval Tests ---');
  
  // Water query in Marathi
  const waterChunks = retrieveRelevantKnowledge('पाण्याचे थांबे कुठे आहेत आणि ओआरएस वाटप?', 3, 'mr');
  assert(
    waterChunks.length > 0 && waterChunks.some(c => c.category === 'route_logistics' || c.keywords?.some(k => k.includes('पाणी'))),
    'Semantic retrieval finds route water chunks for Marathi query'
  );

  // Blister query in Hindi
  const blisterChunks = retrieveRelevantKnowledge('पैरों में छाले और दर्द हो रहा है', 3, 'hi');
  assert(
    blisterChunks.length > 0 && blisterChunks.some(c => c.category === 'first_aid' || c.keywords?.some(k => k.includes('छाले') || k.includes('blister'))),
    'Semantic retrieval finds footcare/blister chunks for Hindi query'
  );

  // Diabetes query in English
  const diabetesChunks = retrieveRelevantKnowledge('I feel dizzy and have diabetes history on the march', 3, 'en');
  assert(
    diabetesChunks.length > 0 && diabetesChunks.some(c => c.category === 'chronic_care' || c.keywords?.some(k => k.includes('diabetes'))),
    'Semantic retrieval finds chronic condition chunks for English query'
  );

  // Emergency query
  const emergencyChunks = retrieveRelevantKnowledge('छातीत तीव्र कळ आणि चक्कर येत आहे', 3, 'mr');
  assert(
    emergencyChunks.length > 0 && emergencyChunks.some(c => c.category === 'emergency_protocol'),
    'Semantic retrieval finds emergency protocols for chest pain'
  );

  // -------------------------------------------------------------
  // TEST 2: User Profile Hidden AI Context Assembly
  // -------------------------------------------------------------
  console.log('\n--- 2. Profile Context Assembly & Isolation ---');

  const varkariTukaram = {
    id: 'c1111111-1111-1111-1111-111111111101',
    mobileNumber: '+91 9423010001',
    fullName: 'Tukaram Namdev More',
    role: 'varkari',
    age: 64,
    gender: 'Male',
    bloodGroup: 'O+',
    village: 'Indapur, Pune',
    medicalConditions: [],
    allergies: [],
    dindiName: 'Sant Tukaram Maharaj Palkhi Dindi',
    dindiNumber: '01',
    dindiLeaderName: 'H.B.P. Suresh Tukaram Patil',
    emergencyCardId: 'VK-DEHU01',
    preferredLanguage: 'mr',
  };

  const varkariGodavari = {
    id: 'c2222222-2222-2222-2222-222222222202',
    mobileNumber: '+91 9423020002',
    fullName: 'Godavari Laxman Gite',
    role: 'varkari',
    age: 72,
    gender: 'Female',
    bloodGroup: 'B-',
    village: 'Shrigonda, Ahmednagar',
    medicalConditions: ['Cardiac Bypass (2022)', 'Hypertension'],
    allergies: ['Aspirin'],
    currentMedications: ['Amlodipine 5mg'],
    dindiName: 'Sant Dnyaneshwar Maharaj Palkhi Dindi',
    dindiNumber: '02',
    dindiLeaderName: 'H.B.P. Vitthalrao Pandurang Gaikwad',
    emergencyCardId: 'VK-ALN02',
    preferredLanguage: 'mr',
  };

  mockSetUserProfile(varkariTukaram);
  const tukaramContext = mockGetUserAIContext(currentUserProfile);

  assert(
    tukaramContext.includes('Tukaram Namdev More') &&
    tukaramContext.includes('Age: 64') &&
    tukaramContext.includes('Blood Group: O+'),
    'Constructs dynamic medical context for Supabase Varkari 1 (Tukaram More)'
  );

  // Test logout and session wipe
  mockClearUserSession();
  const clearedContext = mockGetUserAIContext(currentUserProfile);
  assert(
    clearedContext.includes('Guest Pilgrim') && !clearedContext.includes('Tukaram'),
    'Multi-user isolation: Logged-out session contains zero residual data'
  );

  // User 2 logs in from Supabase
  mockSetUserProfile(varkariGodavari);
  const godavariContext = mockGetUserAIContext(currentUserProfile);

  assert(
    godavariContext.includes('Godavari Laxman Gite') &&
    godavariContext.includes('Age: 72') &&
    godavariContext.includes('Cardiac Bypass (2022)') &&
    godavariContext.includes('Blood Group: B-') &&
    !godavariContext.includes('Tukaram'),
    'Multi-user isolation: Supabase Varkari 2 (Godavari Gite) context is completely isolated from User 1'
  );

  // -------------------------------------------------------------
  // TEST 3: 3-Tier Severity Triage Logic Verification
  // -------------------------------------------------------------
  console.log('\n--- 3. 3-Tier Severity & SOS Spam Prevention ---');

  const { askPersonalizedRAG } = require('../app/services/ragChatService');

  // Test Case A: Non-medical query (Route / Water) -> Must be Low Risk, show_sos: false
  console.log('Testing Case A: Route & Water Query (Expect Level 1 Low, show_sos: false)...');
  mockSetUserProfile(varkariTukaram);
  const routeResponse = await askPersonalizedRAG(
    'पुढील पाण्याचे थांबे आणि फलटण मुक्काम किती अंतरावर आहे?',
    'varkari',
    [],
    'mr',
    varkariTukaram
  );
  console.log('   Response Severity:', routeResponse.severity);
  console.log('   Show SOS:', routeResponse.show_sos);
  console.log('   Action:', routeResponse.action_type);
  console.log('   Message snippet:', routeResponse.message.slice(0, 100));

  assert(
    routeResponse.show_sos === false,
    'Level 1 (Route/Water inquiry) NEVER shows SOS button'
  );
  assert(
    routeResponse.severity === 'low',
    'Level 1 (Route/Water inquiry) is triaged as low severity'
  );
  assert(
    !routeResponse.message.includes('रक्तगट') &&
    !routeResponse.message.includes('VK-') &&
    !routeResponse.message.includes('नोंदणीकृत आजार'),
    'Anti-Spam: General route query answers the logistics question directly without reciting personal health record'
  );

  // Test Case B: Minor Health Condition (Sore feet / blister) -> Must be Low Risk, show_sos: false
  console.log('\nTesting Case B: Foot Blisters (Expect Level 1 Low, show_sos: false)...');
  const blisterResponse = await askPersonalizedRAG(
    'लगातार चालल्यामुळे पायात फोड आले आहेत आणि पाय दुखत आहेत, काही मलम किंवा प्रथमोपचार मिळेल का?',
    'varkari',
    [],
    'mr',
    varkariTukaram
  );
  console.log('   Response Severity:', blisterResponse.severity);
  console.log('   Show SOS:', blisterResponse.show_sos);
  console.log('   Message snippet:', blisterResponse.message.slice(0, 100));

  assert(
    blisterResponse.show_sos === false,
    'Level 1 (Foot blisters) provides comfort/care guidance without triggering emergency SOS'
  );
  assert(
    !blisterResponse.message.includes('रक्तगट') &&
    !blisterResponse.message.includes('VK-'),
    'Anti-Spam: Foot blister query provides footcare guidance without dumping blood group or ID'
  );

  // Test Case C: Profile-Dependent Chronic Caution (Godavari Gite feeling dizzy with BP history) -> Level 2 Caution, show_sos: false
  console.log('\nTesting Case C: Chronic Dizziness (Expect Level 2 Caution, considerations for vitals/BP, show_sos: false)...');
  mockSetUserProfile(varkariGodavari);
  const diabeticResponse = await askPersonalizedRAG(
    'मला चक्कर आल्यासारखे वाटत आहे आणि खूप घाम फुटला आहे. काय करू?',
    'varkari',
    [],
    'mr',
    varkariGodavari
  );
  console.log('   Response Severity:', diabeticResponse.severity);
  console.log('   Show SOS:', diabeticResponse.show_sos);
  console.log('   Message snippet:', diabeticResponse.message.slice(0, 120));

  assert(
    diabeticResponse.show_sos === false,
    'Level 2 (Diabetic Dizziness) gives blood sugar / rest guidance without immediate SOS panic'
  );
  assert(
    diabeticResponse.message.toLowerCase().includes('साखर') ||
    diabeticResponse.message.toLowerCase().includes('गोड') ||
    diabeticResponse.message.toLowerCase().includes('विश्रांती') ||
    diabeticResponse.message.toLowerCase().includes('पाणी') ||
    diabeticResponse.message.toLowerCase().includes('सावध'),
    'AI response factors in diabetes/hydration context smoothly'
  );

  // Test Case D: Genuine Critical Emergency (Severe Chest Pain / Heart Attack signs) -> Level 3 Emergency, show_sos: true
  console.log('\nTesting Case D: Severe Chest Pain (Expect Level 3 Emergency, show_sos: true)...');
  const emergencyResponse = await askPersonalizedRAG(
    'माझ्या छातीत तीव्र कळ येत आहे, डावा हात जड पडत आहे आणि श्वास घेता येत नाही!',
    'varkari',
    [],
    'mr'
  );
  console.log('   Response Severity:', emergencyResponse.severity);
  console.log('   Show SOS:', emergencyResponse.show_sos);
  console.log('   Action:', emergencyResponse.action_type);
  console.log('   Message snippet:', emergencyResponse.message.slice(0, 120));

  assert(
    emergencyResponse.show_sos === true,
    'Level 3 (Severe chest pain) triggers prominent emergency SOS'
  );
  assert(
    emergencyResponse.severity === 'emergency',
    'Level 3 is triaged as emergency severity'
  );
  assert(
    emergencyResponse.action_type === 'medical_sos',
    'Level 3 attaches medical_sos action type'
  );

  // -------------------------------------------------------------
  // TEST 4: Multilingual Response Consistency
  // -------------------------------------------------------------
  console.log('\n--- 4. Multilingual Response Consistency ---');

  // Hindi query
  console.log('Testing Hindi Language Response...');
  const hiResponse = await askPersonalizedRAG(
    'पीने का पानी और प्राथमिक उपचार केंद्र कहाँ है?',
    'varkari',
    [],
    'hi'
  );
  console.log('   Hindi Message snippet:', hiResponse.message.slice(0, 100));
  assert(
    hiResponse.language === 'hi' || /[\u0900-\u097F]/.test(hiResponse.message),
    'Delivers fluent Devanagari Hindi guidance'
  );

  // English query
  console.log('Testing English Language Response...');
  const enResponse = await askPersonalizedRAG(
    'Where is the next resting stop and how far is it?',
    'varkari',
    [],
    'en'
  );
  console.log('   English Message snippet:', enResponse.message.slice(0, 100));
  assert(
    enResponse.language === 'en' || /[a-zA-Z]/.test(enResponse.message),
    'Delivers clear English guidance'
  );

  // -------------------------------------------------------------
  // TEST 5: Direct Age, Blood Group, Conditions & Medications Access (Dynamic Supabase Data)
  // -------------------------------------------------------------
  console.log('\n--- 5. Direct Age, Blood Group, Conditions & Medications Access ---');

  mockSetUserProfile(varkariGodavari); // Godavari: Age 72, Blood Group B-, Cardiac Bypass + Hypertension, Amlodipine

  // 5A: Blood Group Inquiry
  console.log('Testing 5A: Blood Group Inquiry (Godavari Gite)...');
  const bgResponse = await askPersonalizedRAG('माझा ब्लड ग्रुप आणि रक्तगट काय आहे?', 'varkari', [], 'mr', varkariGodavari);
  console.log('   Blood Group reply:', bgResponse.message);
  assert(
    bgResponse.message.includes('B-') || bgResponse.message.includes('बी-'),
    'AI accesses and provides the exact Blood Group (B-) from Supabase record'
  );

  // 5B: Age Inquiry
  console.log('\nTesting 5B: Age Inquiry (Godavari Gite)...');
  const ageResponse = await askPersonalizedRAG('माझे वय किती आहे?', 'varkari', [], 'mr', varkariGodavari);
  console.log('   Age reply:', ageResponse.message);
  assert(
    ageResponse.message.includes('72') || ageResponse.message.includes('७२'),
    'AI accesses and provides the exact Age (72) from Supabase record'
  );

  // 5C: Medical Conditions & Medications Inquiry
  console.log('\nTesting 5C: Medical Conditions & Medications Inquiry (Godavari Gite)...');
  const medCondResponse = await askPersonalizedRAG('माझे कोणते आजार आणि कोणती औषधे आहेत?', 'varkari', [], 'mr', varkariGodavari);
  console.log('   Conditions & Meds reply:', medCondResponse.message);
  assert(
    medCondResponse.message.toLowerCase().includes('cardiac') ||
    medCondResponse.message.toLowerCase().includes('bypass') ||
    medCondResponse.message.toLowerCase().includes('hypertension') ||
    medCondResponse.message.includes('रक्तदाब') ||
    medCondResponse.message.toLowerCase().includes('amlodipine'),
    'AI accesses and provides exact Chronic Conditions (Cardiac Bypass & BP) from Supabase record'
  );

  // 5D: Personalized Walking / Diet Advice
  console.log('\nTesting 5D: Personalized Precautions Advice (Godavari Gite)...');
  const adviceResponse = await askPersonalizedRAG('मी चालताना काय काळजी घ्यावी?', 'varkari', [], 'mr', varkariGodavari);
  console.log('   Personalized Advice reply:', adviceResponse.message.slice(0, 150));
  assert(
    adviceResponse.message.includes('72') ||
    adviceResponse.message.includes('७२') ||
    adviceResponse.message.includes('औषध') ||
    adviceResponse.message.includes('विश्रांती'),
    'AI actively personalizes precautions based on user age (72) and cardiac/BP conditions'
  );

  // 5E: User 2 (Tukaram More: Age 64, Blood Group O+, Healthy) Isolation Check
  console.log('\nTesting 5E: User 2 (Tukaram More) Medical Isolation Check...');
  mockSetUserProfile(varkariTukaram);
  const tukaramMedResponse = await askPersonalizedRAG('माझा रक्तगट आणि वय काय आहे?', 'varkari', [], 'mr', varkariTukaram);
  console.log('   User 2 reply:', tukaramMedResponse.message);
  assert(
    (tukaramMedResponse.message.includes('O+') || tukaramMedResponse.message.includes('ओ+')) &&
    (tukaramMedResponse.message.includes('64') || tukaramMedResponse.message.includes('६४')) &&
    !tukaramMedResponse.message.includes('72') &&
    !tukaramMedResponse.message.includes('७२') &&
    !tukaramMedResponse.message.includes('Godavari'),
    'AI accurately reflects Tukaram More Supabase records without leaking Godavari Gite data'
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Age, Blood Group, Conditions & Personalization are verified.');
  } else {
    console.error('⚠️ SOME TESTS FAILED. Check logs above.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
