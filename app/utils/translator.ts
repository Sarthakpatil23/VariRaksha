/**
 * VariRaksha Client-Side Indic Phonetic Transliteration & Translation Engine
 * 100% Offline-First Algorithmic Transliteration for Devanagari (Marathi & Hindi)
 * Converts any arbitrary English name, village, route, or medical text into Marathi / Hindi.
 */

import { UserProfile } from '../lib/userStore';

// Inherent Matras (Vowel signs attached to consonants)
const MATRA_MAP: Record<string, string> = {
  aa: 'ा',
  a: '',
  ai: 'ै',
  au: 'ौ',
  ee: 'ी',
  oo: 'ू',
  i: 'ि',
  u: 'ु',
  e: 'े',
  o: 'ो',
  ou: 'ौ',
  ri: 'ृ',
};

// Independent Initial Vowels (At the beginning of a word or syllable)
const INIT_VOWEL_MAP: Record<string, string> = {
  aa: 'आ',
  a: 'अ',
  ai: 'ऐ',
  au: 'औ',
  ee: 'ई',
  oo: 'ऊ',
  i: 'इ',
  u: 'उ',
  e: 'ए',
  o: 'ओ',
  ou: 'औ',
  ri: 'ऋ',
};

// Multi-character and single consonants
const CONSONANT_MAP: Record<string, string> = {
  dny: 'ज्ञ',
  jny: 'ज्ञ',
  gy: 'ज्ञ',
  ksh: 'क्ष',
  shr: 'श्र',
  chh: 'छ',
  kh: 'ख',
  gh: 'घ',
  ch: 'च',
  jh: 'झ',
  th: 'थ',
  dh: 'ध',
  ph: 'फ',
  bh: 'भ',
  sh: 'श',
  shh: 'ष',
  ng: 'ङ',
  ny: 'ञ',
  tr: 'त्र',
  k: 'क',
  g: 'ग',
  j: 'ज',
  t: 'त',
  d: 'द',
  n: 'न',
  p: 'प',
  f: 'फ',
  b: 'ब',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  s: 'स',
  h: 'ह',
  z: 'झ',
};

// Common Indian / Marathi name suffixes and prefixes rules
const COMMON_SUFFIX_MAP: Record<string, { mr: string; hi: string }> = {
  bai: { mr: 'बाई', hi: 'बाई' },
  tai: { mr: 'ताई', hi: 'ताई' },
  rao: { mr: 'राव', hi: 'राव' },
  saheb: { mr: 'साहेब', hi: 'साहब' },
  nath: { mr: 'नाथ', hi: 'नाथ' },
  dev: { mr: 'देव', hi: 'देव' },
  kar: { mr: 'कर', hi: 'कर' },
  war: { mr: 'वार', hi: 'वार' },
  patil: { mr: 'पाटील', hi: 'पाटिल' },
  shinde: { mr: 'शिंदे', hi: 'शिंदे' },
  pawar: { mr: 'पवार', hi: 'पवार' },
  more: { mr: 'मोरे', hi: 'मोरे' },
  jadhav: { mr: 'जाधव', hi: 'जाधव' },
  gaikwad: { mr: 'गायकवाड', hi: 'गायकवाड़' },
  chavan: { mr: 'चव्हाण', hi: 'चव्हाण' },
  kadam: { mr: 'कदम', hi: 'कदम' },
  jagtap: { mr: 'जगताप', hi: 'जगताप' },
  deshmukh: { mr: 'देशमुख', hi: 'देशमुख' },
  kulkarni: { mr: 'कुलकर्णी', hi: 'कुलकर्णी' },
  maharaj: { mr: 'महाराज', hi: 'महाराज' },
};

// Medical conditions and symptoms translation dictionary
const MEDICAL_VOCAB_MAP: Record<string, { mr: string; hi: string }> = {
  bp: { mr: 'रक्तदाब (बीपी)', hi: 'रक्तचाप (बीपी)' },
  'high bp': { mr: 'उच्च रक्तदाब (हाय बीपी)', hi: 'उच्च रक्तचाप (हाई बीपी)' },
  'low bp': { mr: 'कमी रक्तदाब (लो बीपी)', hi: 'निम्न रक्तचाप (लो बीपी)' },
  hypertension: { mr: 'उच्च रक्तदाब (हायपरटेन्शन)', hi: 'उच्च रक्तचाप (हाइपरटेंशन)' },
  diabetes: { mr: 'मधुमेह (डायबेटीस)', hi: 'मधुमेह (डायबिटीज)' },
  'diabetes type 2': { mr: 'मधुमेह (टाईप २)', hi: 'मधुमेह (टाइप २)' },
  asthma: { mr: 'दमा (अस्थमा)', hi: 'दमा (अस्थमा)' },
  arthritis: { mr: 'संधिवात', hi: 'गठिया' },
  'joint pain': { mr: 'सांधेदुखी', hi: 'जोड़ों का दर्द' },
  'joint pain / arthritis': { mr: 'सांधेदुखी / संधिवात', hi: 'जोड़ों का दर्द / गठिया' },
  cardiac: { mr: 'हृदयरोग', hi: 'हृदयरोग' },
  'cardiac bypass': { mr: 'बायपास शस्त्रक्रिया', hi: 'बाईपास सर्जरी' },
  penicillin: { mr: 'पेनिसिलिन ॲलर्जी', hi: 'पेनिसिलिन एलर्जी' },
  peanut: { mr: 'शेंगदाणे ॲलर्जी', hi: 'मूंगफली एलर्जी' },
  dust: { mr: 'धुळीची ॲलर्जी', hi: 'धूल की एलर्जी' },
  pollen: { mr: 'परागकण ॲलर्जी', hi: 'परागकण एलर्जी' },
  none: { mr: 'कोणतीही नाही', hi: 'कोई नहीं' },
};

/**
 * Phonetically transliterate an arbitrary English word into Devanagari script.
 * Fully offline, rule-based algorithmic parser.
 */
export const transliterateWordToDevanagari = (
  word: string,
  targetLang: 'mr' | 'hi' = 'mr',
): string => {
  if (!word) return '';
  const clean = word.toLowerCase().trim();

  // 1. Check direct common suffixes or full words (e.g. "Patil", "Deshmukh")
  if (COMMON_SUFFIX_MAP[clean]) {
    return COMMON_SUFFIX_MAP[clean][targetLang];
  }

  // 2. Check compound suffixes (e.g., "Shantabai" -> "Shanta" + "bai")
  for (const suffix of ['bai', 'tai', 'rao', 'saheb', 'nath', 'kar']) {
    if (clean.endsWith(suffix) && clean.length > suffix.length) {
      const stem = clean.slice(0, -suffix.length);
      const translatedStem = transliterateWordToDevanagari(stem, targetLang);
      const translatedSuffix = COMMON_SUFFIX_MAP[suffix][targetLang];
      return `${translatedStem}${translatedSuffix}`;
    }
  }

  // 3. Algorithmic Phonetic Tokenizer
  let output = '';
  let i = 0;
  const len = clean.length;
  let isWordStart = true;

  while (i < len) {
    // Check 3-letter, 2-letter, or 1-letter consonant
    let consonant = '';
    let cLen = 0;

    if (i + 3 <= len && CONSONANT_MAP[clean.slice(i, i + 3)]) {
      consonant = CONSONANT_MAP[clean.slice(i, i + 3)];
      cLen = 3;
    } else if (i + 2 <= len && CONSONANT_MAP[clean.slice(i, i + 2)]) {
      consonant = CONSONANT_MAP[clean.slice(i, i + 2)];
      cLen = 2;
    } else if (CONSONANT_MAP[clean[i]]) {
      consonant = CONSONANT_MAP[clean[i]];
      cLen = 1;
    }

    if (consonant) {
      i += cLen;
      isWordStart = false;

      // Handle 'r' before consonant (e.g. Sarthak -> 'r' + 'th' -> र् + थ = र्थ)
      if (consonant === 'र' && i < len) {
        // Look ahead for next consonant
        let nextConsonant = '';
        let nextCLen = 0;
        if (i + 2 <= len && CONSONANT_MAP[clean.slice(i, i + 2)]) {
          nextConsonant = CONSONANT_MAP[clean.slice(i, i + 2)];
          nextCLen = 2;
        } else if (CONSONANT_MAP[clean[i]]) {
          nextConsonant = CONSONANT_MAP[clean[i]];
          nextCLen = 1;
        }

        if (nextConsonant && clean[i] !== 'a' && clean[i] !== 'e' && clean[i] !== 'i' && clean[i] !== 'o' && clean[i] !== 'u') {
          output += 'र्' + nextConsonant;
          i += nextCLen;

          // Check vowel after conjunct
          let matra = '';
          let mLen = 0;
          if (i + 2 <= len && MATRA_MAP[clean.slice(i, i + 2)] !== undefined) {
            matra = MATRA_MAP[clean.slice(i, i + 2)];
            mLen = 2;
          } else if (i < len && MATRA_MAP[clean[i]] !== undefined) {
            matra = MATRA_MAP[clean[i]];
            mLen = 1;
          }

          output += matra;
          i += mLen;
          continue;
        }
      }

      // Look ahead for vowel attached to consonant
      let matra: string | null = null;
      let mLen = 0;

      if (i + 2 <= len && MATRA_MAP[clean.slice(i, i + 2)] !== undefined) {
        matra = MATRA_MAP[clean.slice(i, i + 2)];
        mLen = 2;
      } else if (i < len && MATRA_MAP[clean[i]] !== undefined) {
        matra = MATRA_MAP[clean[i]];
        mLen = 1;
      }

      if (matra !== null) {
        output += consonant + matra;
        i += mLen;
      } else {
        // No vowel immediately after:
        // If at the end of word in Marathi/Hindi, implicit 'a' is dropped (Halant not needed)
        // If in middle of word, combine with Virama / Halant
        if (i >= len) {
          output += consonant;
        } else {
          output += consonant + '्';
        }
      }
    } else {
      // Independent Vowel at start of word or after another vowel
      let initVowel: string | null = null;
      let vLen = 0;

      if (i + 2 <= len && (isWordStart ? INIT_VOWEL_MAP[clean.slice(i, i + 2)] : MATRA_MAP[clean.slice(i, i + 2)]) !== undefined) {
        initVowel = isWordStart ? INIT_VOWEL_MAP[clean.slice(i, i + 2)] : MATRA_MAP[clean.slice(i, i + 2)];
        vLen = 2;
      } else if (i < len && (isWordStart ? INIT_VOWEL_MAP[clean[i]] : MATRA_MAP[clean[i]]) !== undefined) {
        initVowel = isWordStart ? INIT_VOWEL_MAP[clean[i]] : MATRA_MAP[clean[i]];
        vLen = 1;
      }

      if (initVowel !== null) {
        output += initVowel;
        i += vLen;
      } else {
        // Punctuation or numbers
        output += clean[i];
        i++;
      }
      isWordStart = false;
    }
  }

  return output;
};

/**
 * Phonetically transliterate an entire multi-word sentence or phrase
 * (e.g. "Sarthak Kailas Patil" -> "सार्थक कैलास पाटील")
 */
export const transliterateSentenceToDevanagari = (
  text: string,
  targetLang: 'mr' | 'hi' = 'mr',
): string => {
  if (!text) return '';
  const tokens = text.split(/([,\s/]+)/);

  return tokens
    .map((token) => {
      const lower = token.trim().toLowerCase();
      if (!lower) return token;

      // Check medical vocabulary
      if (MEDICAL_VOCAB_MAP[lower]) {
        return MEDICAL_VOCAB_MAP[lower][targetLang];
      }

      // Check punctuation or whitespace
      if (/^[,\s/]+$/.test(token)) {
        return token;
      }

      return transliterateWordToDevanagari(token, targetLang);
    })
    .join('');
};

/**
 * Dynamically translate & transliterate a complete UserProfile on-device (Offline-First)
 */
export const translateUserProfile = (
  profile: UserProfile,
  lang: 'mr' | 'hi' | 'en' = 'mr',
): UserProfile => {
  if (!profile) return profile;
  if (lang === 'en') return profile;

  const targetLang = lang === 'hi' ? 'hi' : 'mr';

  // 1. Dynamically transliterate Name
  const translatedName = transliterateSentenceToDevanagari(profile.fullName, targetLang);

  // 2. Dynamically transliterate Village / District
  const translatedVillage = profile.village
    ? transliterateSentenceToDevanagari(profile.village, targetLang)
    : targetLang === 'mr'
    ? 'महाराष्ट्र'
    : 'महाराष्ट्र';

  // 3. Dynamically format Dindi Name
  let translatedDindi = profile.dindiName;
  if (profile.dindiName) {
    if (profile.dindiName.includes('Dehu') || profile.dindiName.includes('Tukaram')) {
      translatedDindi =
        targetLang === 'hi'
          ? `संत तुकाराम महाराज पालकी दिंडी (सं. ${profile.dindiNumber || '०१'})`
          : `श्री संत तुकाराम महाराज पालखी दिंडी (क्र. ${profile.dindiNumber || '०१'})`;
    } else if (profile.dindiName.includes('Alandi') || profile.dindiName.includes('Dnyaneshwar')) {
      translatedDindi =
        targetLang === 'hi'
          ? `संत ज्ञानेश्वर महाराज पालकी दिंडी (सं. ${profile.dindiNumber || '०२'})`
          : `श्री संत ज्ञानेश्वर माऊली पालखी दिंडी (क्र. ${profile.dindiNumber || '०२'})`;
    } else {
      translatedDindi =
        targetLang === 'hi'
          ? `दिंडी संख्या ${profile.dindiNumber || '१२'}`
          : `दिंडी क्र. ${profile.dindiNumber || '१२'}`;
    }
  }

  // 4. Dynamically translate Medical Conditions & Allergies
  const translatedConditions = profile.medicalConditions
    ? profile.medicalConditions.map((c) => transliterateSentenceToDevanagari(c, targetLang))
    : [];

  const translatedAllergies = profile.allergies
    ? profile.allergies.map((a) => transliterateSentenceToDevanagari(a, targetLang))
    : [];

  // 5. Dynamically transliterate Emergency Contacts
  const translatedContacts = profile.emergencyContacts
    ? profile.emergencyContacts.map((c) => ({
        ...c,
        name: transliterateSentenceToDevanagari(c.name, targetLang),
        relationship: c.relationship
          ? transliterateSentenceToDevanagari(c.relationship, targetLang)
          : undefined,
      }))
    : undefined;

  return {
    ...profile,
    fullName: translatedName,
    village: translatedVillage,
    dindiName: translatedDindi,
    medicalConditions: translatedConditions,
    allergies: translatedAllergies,
    emergencyContacts: translatedContacts,
  };
};
