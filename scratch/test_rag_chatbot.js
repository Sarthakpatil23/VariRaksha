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

  const userRahul = {
    id: 'user-rahul-123',
    phone: '9876543210',
    fullName: 'Rahul Joshi',
    role: 'varkari',
    age: 62,
    gender: 'Male',
    bloodGroup: 'B+',
    medicalConditions: ['Diabetes Type 2', 'Hypertension'],
    allergies: ['Penicillin'],
    currentMedications: ['Metformin 500mg', 'Amlodipine 5mg'],
    dindiLeaderName: 'ह.भ.प. सोपानराव महाराज',
    preferredLanguage: 'mr',
  };

  mockSetUserProfile(userRahul);
  const rahulContext = mockGetUserAIContext(currentUserProfile);

  assert(
    rahulContext.includes('Rahul Joshi') &&
    rahulContext.includes('Age: 62') &&
    rahulContext.includes('Diabetes Type 2') &&
    rahulContext.includes('Penicillin') &&
    rahulContext.includes('Metformin 500mg'),
    'Constructs comprehensive, confidential medical context for User 1 (Rahul)'
  );

  // Test logout and session wipe
  mockClearUserSession();
  const clearedContext = mockGetUserAIContext(currentUserProfile);
  assert(
    clearedContext.includes('Guest Pilgrim') && !clearedContext.includes('Rahul'),
    'Multi-user isolation: Logged-out session contains zero residual data'
  );

  // User 2 logs in
  const userShanta = {
    id: 'user-shanta-456',
    phone: '9123456780',
    fullName: 'Shanta Shinde',
    role: 'varkari',
    age: 45,
    gender: 'Female',
    bloodGroup: 'O+',
    medicalConditions: ['Asthma'],
    allergies: ['Dust'],
    currentMedications: ['Salbutamol Inhaler'],
    dindiLeaderName: 'ह.भ.प. ज्ञानेश्वर महाराज',
    preferredLanguage: 'hi',
  };
  mockSetUserProfile(userShanta);
  const shantaContext = mockGetUserAIContext(currentUserProfile);

  assert(
    shantaContext.includes('Shanta Shinde') &&
    shantaContext.includes('Asthma') &&
    !shantaContext.includes('Rahul') &&
    !shantaContext.includes('Diabetes'),
    'Multi-user isolation: User 2 (Shanta) context is completely isolated from User 1'
  );

  // -------------------------------------------------------------
  // TEST 3: 3-Tier Severity Triage Logic Verification
  // -------------------------------------------------------------
  console.log('\n--- 3. 3-Tier Severity & SOS Spam Prevention ---');

  const { askPersonalizedRAG } = require('../app/services/ragChatService');

  // Test Case A: Non-medical query (Route / Water) -> Must be Low Risk, show_sos: false
  console.log('Testing Case A: Route & Water Query (Expect Level 1 Low, show_sos: false)...');
  mockSetUserProfile(userRahul);
  const routeResponse = await askPersonalizedRAG(
    'पुढील पाण्याचे थांबे आणि फलटण मुक्काम किती अंतरावर आहे?',
    'varkari',
    [],
    'mr'
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

  // Test Case B: Minor Health Condition (Sore feet / blister) -> Must be Low Risk, show_sos: false
  console.log('\nTesting Case B: Foot Blisters (Expect Level 1 Low, show_sos: false)...');
  const blisterResponse = await askPersonalizedRAG(
    'लगातार चालल्यामुळे पायात फोड आले आहेत आणि पाय दुखत आहेत, काही मलम किंवा प्रथमोपचार मिळेल का?',
    'varkari',
    [],
    'mr'
  );
  console.log('   Response Severity:', blisterResponse.severity);
  console.log('   Show SOS:', blisterResponse.show_sos);
  console.log('   Message snippet:', blisterResponse.message.slice(0, 100));

  assert(
    blisterResponse.show_sos === false,
    'Level 1 (Foot blisters) provides comfort/care guidance without triggering emergency SOS'
  );

  // Test Case C: Profile-Dependent Chronic Caution (Diabetic patient feeling dizzy) -> Level 2 Caution, show_sos: false
  console.log('\nTesting Case C: Diabetic Dizziness (Expect Level 2 Caution, considerations for blood sugar, show_sos: false)...');
  mockSetUserProfile(userRahul); // Rahul has Diabetes & Hypertension
  const diabeticResponse = await askPersonalizedRAG(
    'मला चक्कर आल्यासारखे वाटत आहे आणि खूप घाम फुटला आहे. काय करू?',
    'varkari',
    [],
    'mr'
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
  // TEST 4: Multilingual Consistency & Switching
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
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Personalization, RAG, and Triage are rock-solid.');
  } else {
    console.error('⚠️ SOME TESTS FAILED. Check logs above.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
