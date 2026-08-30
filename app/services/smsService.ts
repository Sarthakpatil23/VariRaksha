/**
 * VariRaksha — Emergency Contacts Native SMS Notification Service
 *
 * 100% Free & Zero-Setup Native SMS Dispatch via `expo-sms` with `Linking.openURL` fallback.
 * Sends pre-filled emergency SOS alerts and Resolution/Safety confirmations directly to
 * family & emergency contacts of Varkaris with live GPS coordinates and Google Maps links.
 */

import * as SMS from 'expo-sms';
import { Linking, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { ProfileEmergencyContact } from '../lib/userStore';
import { EmergencyAlert } from './alertService';

export interface SMSDispatchResult {
  success: boolean;
  recipients: string[];
  message: string;
  error?: string;
}

/**
 * Clean phone number to E.164 or valid dialable Indian digits
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return cleaned;
}

/**
 * Check if Native SMS capability is available on the device
 */
export async function isSmsAvailable(): Promise<boolean> {
  try {
    return await SMS.isAvailableAsync();
  } catch (err) {
    console.warn('[SMSService] Error checking SMS availability:', err);
    return false;
  }
}

/**
 * Query Supabase to find registered emergency contacts for a given pilgrim phone, card ID, or user ID
 */
export async function fetchEmergencyContactsForPilgrim(
  identifier: string,
): Promise<ProfileEmergencyContact[]> {
  if (!identifier) return [];

  const clean = identifier.replace(/[^0-9]/g, '');
  const tenDigit = clean.slice(-10);

  try {
    // 1. Check direct table vari_actor_emergency_contacts if UUID
    if (identifier.includes('-') && identifier.length >= 32) {
      const { data: contacts, error } = await supabase
        .from('vari_actor_emergency_contacts')
        .select('*')
        .eq('actor_id', identifier);

      if (!error && contacts && contacts.length > 0) {
        return contacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phone_number,
          relationship: c.relationship || 'Emergency Contact',
        }));
      }
    }

    // 2. Query vari_varkaris by phone number or card ID
    let query = supabase.from('vari_varkaris').select('id, emergency_card_id, mobile_number');
    if (tenDigit.length === 10) {
      query = query.ilike('mobile_number', `%${tenDigit}%`);
    } else {
      query = query.eq('emergency_card_id', identifier);
    }

    const { data: varkariRows, error: vError } = await query.limit(1);

    if (!vError && varkariRows && varkariRows.length > 0) {
      const actorId = varkariRows[0].id;
      const { data: contacts } = await supabase
        .from('vari_actor_emergency_contacts')
        .select('*')
        .eq('actor_id', actorId);

      if (contacts && contacts.length > 0) {
        return contacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phone_number,
          relationship: c.relationship || 'Emergency Contact',
        }));
      }
    }
  } catch (e) {
    console.warn('[SMSService] Error looking up emergency contacts:', e);
  }

  return [];
}

/**
 * Generate SOS Emergency SMS Message text in Marathi / Hindi / English
 */
export function buildSosSmsMessage(
  alert: EmergencyAlert,
  lang: 'mr' | 'hi' | 'en' = 'mr',
): string {
  const name = alert.pilgrim_name || 'वारकरी भाविक';
  const cardId = alert.emergency_card_id || 'VK-WARI01';
  const dindi = alert.dindi_name || 'संत पालखी दिंडी';
  const problem = alert.problem_type || 'वैद्यकीय आणीबाणी (Medical Emergency)';
  const location = alert.location_name || 'पालखी मार्ग';
  const lat = alert.latitude || 17.7120;
  const lng = alert.longitude || 75.2410;
  const mapsLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (lang === 'en') {
    return (
      `🚨 [VariRaksha - EMERGENCY SOS]\n` +
      `Your contact ${name} (Card: ${cardId}, Dindi: ${dindi}) has initiated an Emergency SOS on the Palkhi Route.\n\n` +
      `• Reason: ${problem}\n` +
      `• Location: ${location}\n` +
      `• Live GPS Map: ${mapsLink}\n` +
      `• Time: ${timeStr}\n\n` +
      `Nearby VariRaksha volunteer responders have been dispatched.`
    );
  }

  if (lang === 'hi') {
    return (
      `🚨 [वारकरी रक्षा - आपातकालीन सूचना (SOS)]\n` +
      `आपके परिजन ${name} (कार्ड: ${cardId}, दिंडी: ${dindi}) ने पालखी मार्ग पर आपातकालीन सहायता (SOS) मांगी है।\n\n` +
      `• समस्या: ${problem}\n` +
      `• स्थान: ${location}\n` +
      `• लाइव लोकेशन लिंक: ${mapsLink}\n` +
      `• समय: ${timeStr}\n\n` +
      `नजदीकी स्वयंसेवक दल को सहायता हेतु भेजा गया है।`
    );
  }

  // Default Marathi (मराठी)
  return (
    `🚨 [वारकरी रक्षा - आणीबाणी सूचना (SOS)]\n` +
    `आपले आप्त ${name} (कार्ड: ${cardId}, दिंडी: ${dindi}) यांनी पालखी मार्गावर आणीबाणीची सूचना दिली आहे.\n\n` +
    `• समस्या: ${problem}\n` +
    `• स्थान: ${location}\n` +
    `• लाईव्ह जीपीएस मॅप: ${mapsLink}\n` +
    `• वेळ: ${timeStr}\n\n` +
    `जवळच्या वारकरी रक्षा स्वयंसेवक पथकाला तत्काळ मदतीसाठी पाचारण केले आहे.`
  );
}

/**
 * Generate SOS Resolution / Safety SMS Message text in Marathi / Hindi / English
 */
export function buildResolvedSmsMessage(
  alert: EmergencyAlert,
  volunteer?: { name: string; phone?: string },
  lang: 'mr' | 'hi' | 'en' = 'mr',
): string {
  const name = alert.pilgrim_name || 'वारकरी भाविक';
  const volName = volunteer?.name || alert.responder_name || 'वारकरी रक्षा स्वयंसेवक';
  const volPhone = volunteer?.phone || alert.responder_phone;
  const volContactStr = volPhone ? ` (मो. ${volPhone})` : '';
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (lang === 'en') {
    return (
      `✅ [VariRaksha - SAFE & RESOLVED]\n` +
      `Good News! Your contact ${name} has been safely attended to and taken care of.\n\n` +
      `• Assisted By: Volunteer ${volName}${volContactStr}\n` +
      `• Status: Stabilized & Issue Resolved\n` +
      `• Time: ${timeStr}\n\n` +
      `They are safe and continuing their pilgrimage. - VariRaksha Seva Team`
    );
  }

  if (lang === 'hi') {
    return (
      `✅ [वारकरी रक्षा - संकट निवारण / सुरक्षित]\n` +
      `शुभ समाचार! आपके परिजन ${name} तक सहायता पहुंच गई है और वे अब पूरी तरह सुरक्षित हैं।\n\n` +
      `• सहायक स्वयंसेवक: ${volName}${volContactStr}\n` +
      `• स्थिति: प्राथमिक उपचार पूर्ण / सुरक्षित\n` +
      `• समय: ${timeStr}\n\n` +
      `वे सकुशल हैं। - वारकरी रक्षा सेवा दल`
    );
  }

  // Default Marathi (मराठी)
  return (
    `✅ [वारकरी रक्षा - संकट निवारण / सुरक्षित]\n` +
    `आनंदाची बातमी! आपले आप्त ${name} यांच्यापर्यंत मदत पोहोचली असून ते आता सुरक्षित आणि धोक्याबाहेर आहेत.\n\n` +
    `• मदत करणारे स्वयंसेवक: ${volName}${volContactStr}\n` +
    `• प्रकृती: प्राथमिक उपचार पूर्ण / सुरक्षित\n` +
    `• वेळ: ${timeStr}\n\n` +
    `काळजी नसावी, ते पालखी सोहळ्यात सुखरूप आहेत. - वारकरी रक्षा सेवा दल`
  );
}

/**
 * Core Helper: Dispatch SMS via expo-sms or native linking deep-link
 */
async function launchNativeSmsComposer(
  phoneNumbers: string[],
  message: string,
): Promise<boolean> {
  const validRecipients = phoneNumbers
    .map(sanitizePhoneNumber)
    .filter((num) => num.length >= 8);

  if (validRecipients.length === 0) {
    console.warn('[SMSService] No valid recipient phone numbers found');
    return false;
  }

  console.log(`[SMSService] Opening SMS composer for: ${validRecipients.join(', ')}`);

  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const result = await SMS.sendSMSAsync(validRecipients, message);
      console.log('[SMSService] expo-sms result:', result.result);
      return result.result === 'sent' || result.result === 'unknown';
    }
  } catch (err) {
    console.warn('[SMSService] expo-sms send error, falling back to Linking:', err);
  }

  // Fallback to Native Deep Link (Linking.openURL)
  try {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const recipientStr = validRecipients.join(',');
    const url = `sms:${recipientStr}${separator}body=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      // Direct single recipient attempt
      const singleUrl = `sms:${validRecipients[0]}${separator}body=${encodeURIComponent(message)}`;
      await Linking.openURL(singleUrl);
      return true;
    }
  } catch (linkErr) {
    console.error('[SMSService] Linking openURL failed:', linkErr);
    Alert.alert(
      'SMS Dispatch',
      `Unable to open SMS app automatically. Please SMS emergency contacts:\n${validRecipients.join(', ')}`,
    );
    return false;
  }
}

/**
 * 1. TRIGGER SOS SMS: Sent when Varkari triggers Emergency SOS
 */
export async function sendEmergencySosSMS(
  alert: EmergencyAlert,
  contacts?: ProfileEmergencyContact[],
  options?: { language?: 'mr' | 'hi' | 'en' },
): Promise<SMSDispatchResult> {
  const lang = options?.language || 'mr';
  const message = buildSosSmsMessage(alert, lang);

  // Retrieve contacts if not passed
  let recipientList: string[] = [];
  if (contacts && contacts.length > 0) {
    recipientList = contacts.map((c) => c.phoneNumber);
  } else if (alert.pilgrim_phone || alert.emergency_card_id || alert.varkari_id) {
    const fetched = await fetchEmergencyContactsForPilgrim(
      alert.varkari_id || alert.emergency_card_id || alert.pilgrim_phone || '',
    );
    if (fetched && fetched.length > 0) {
      recipientList = fetched.map((c) => c.phoneNumber);
    }
  }

  // Fallback default sample contact if none configured
  if (recipientList.length === 0) {
    recipientList = ['+91 94230 11221'];
  }

  const success = await launchNativeSmsComposer(recipientList, message);
  return {
    success,
    recipients: recipientList,
    message,
  };
}

/**
 * 2. RESOLUTION SMS: Sent when Volunteer marks Emergency Alert as Resolved
 */
export async function sendEmergencyResolvedSMS(
  alert: EmergencyAlert,
  contacts?: ProfileEmergencyContact[],
  volunteer?: { name: string; phone?: string },
  options?: { language?: 'mr' | 'hi' | 'en' },
): Promise<SMSDispatchResult> {
  const lang = options?.language || 'mr';
  const message = buildResolvedSmsMessage(alert, volunteer, lang);

  let recipientList: string[] = [];
  if (contacts && contacts.length > 0) {
    recipientList = contacts.map((c) => c.phoneNumber);
  } else if (alert.pilgrim_phone || alert.emergency_card_id || alert.varkari_id) {
    const fetched = await fetchEmergencyContactsForPilgrim(
      alert.varkari_id || alert.emergency_card_id || alert.pilgrim_phone || '',
    );
    if (fetched && fetched.length > 0) {
      recipientList = fetched.map((c) => c.phoneNumber);
    }
  }

  if (recipientList.length === 0) {
    recipientList = ['+91 94230 11221'];
  }

  const success = await launchNativeSmsComposer(recipientList, message);
  return {
    success,
    recipients: recipientList,
    message,
  };
}
