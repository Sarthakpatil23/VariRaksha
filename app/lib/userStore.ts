import { useState, useEffect } from 'react';

export type UserRole = 'varkari' | 'pilgrim' | 'dindiLeader' | 'volunteer' | 'medicalStaff';

export interface ProfileEmergencyContact {
  id?: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface UserProfile {
  id?: string;
  variId?: string;
  fullName: string;
  mobileNumber: string;
  village?: string;
  dindiName?: string;
  dindiNumber?: string;
  dindiLeaderName?: string;
  emergencyCardId?: string;
  bloodGroup?: string;
  medicalConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  criticalNotes?: string;
  role: UserRole;
  age?: number;
  gender?: string;
  preferredLanguage?: 'mr' | 'hi' | 'en';
  specialization?: string;
  medicalCampLocation?: string;
  assignedSector?: string;
  dutyType?: string;
  totalPilgrims?: number;
  palkhiRoute?: string;
  emergencyContacts?: ProfileEmergencyContact[];
}

let currentRole: UserRole = 'varkari';
let currentUserProfile: UserProfile | null = null;
let currentLanguage: 'mr' | 'hi' | 'en' = 'mr';

const roleListeners: Set<(role: UserRole) => void> = new Set();
const profileListeners: Set<(profile: UserProfile | null) => void> = new Set();
const languageListeners: Set<(lang: 'mr' | 'hi' | 'en') => void> = new Set();

export const setUserRole = (role: UserRole) => {
  currentRole = role;
  roleListeners.forEach((listener) => listener(role));
};

export const getUserRole = (): UserRole => {
  return currentRole;
};

export const setUserLanguagePreference = (lang: 'mr' | 'hi' | 'en') => {
  currentLanguage = lang;
  if (currentUserProfile) {
    currentUserProfile.preferredLanguage = lang;
  }
  languageListeners.forEach((listener) => listener(lang));
};

export const getUserLanguagePreference = (): 'mr' | 'hi' | 'en' => {
  return currentUserProfile?.preferredLanguage || currentLanguage || 'mr';
};

export const subscribeUserLanguage = (listener: (lang: 'mr' | 'hi' | 'en') => void) => {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
};

export const setUserProfile = (profile: UserProfile | null) => {
  currentUserProfile = profile;
  if (profile?.role) {
    currentRole = profile.role;
    roleListeners.forEach((listener) => listener(profile.role));
  }
  if (profile?.preferredLanguage) {
    currentLanguage = profile.preferredLanguage;
    languageListeners.forEach((listener) => listener(profile.preferredLanguage!));
  }
  profileListeners.forEach((listener) => listener(profile));
};

export const getUserProfile = (): UserProfile | null => {
  return currentUserProfile;
};

export const clearUserSession = () => {
  currentUserProfile = null;
  currentRole = 'varkari';
  profileListeners.forEach((listener) => listener(null));
  roleListeners.forEach((listener) => listener('varkari'));
};

/**
 * Builds clean, secure, privacy-isolated medical and profile context for the active user.
 * Strictly scopes data to the currently authenticated user profile retrieved from Supabase database.
 */
export const getUserAIContext = (profile: UserProfile | null = currentUserProfile): string => {
  if (!profile) {
    return '[User: Guest Pilgrim - No authenticated user record currently loaded from Supabase database]';
  }

  const p = profile;

  const conditions =
    p.medicalConditions && p.medicalConditions.length > 0
      ? p.medicalConditions.filter((c) => c && c.toLowerCase() !== 'none').join(', ')
      : 'None reported (कोणतीही गंभीर व्याधी नाही)';

  const allergies =
    p.allergies && p.allergies.length > 0
      ? p.allergies.filter((a) => a && a.toLowerCase() !== 'none').join(', ')
      : 'None reported (कोणतीही ऍलर्जी नाही)';

  const meds =
    p.currentMedications && p.currentMedications.length > 0
      ? p.currentMedications.filter((m) => m && m.toLowerCase() !== 'none').join(', ')
      : 'None reported';

  const parts: string[] = [
    `• Full Name: ${p.fullName || 'Varkari Pilgrim'}`,
    `• Age: ${p.age !== undefined && p.age !== null ? `${p.age} years old` : 'Not specified in database'}`,
    `• Gender: ${p.gender || 'Not specified'}`,
    `• Blood Group: ${p.bloodGroup || 'Not specified in database'}`,
    `• Role in Wari: ${p.role || 'varkari'}`,
    `• Dindi Name & Number: ${p.dindiName || 'Sant Palkhi Dindi'} (#${p.dindiNumber || '12'})`,
    `• Dindi Leader: ${p.dindiLeaderName || 'ह.भ.प. सोपानराव महाराज'}`,
    `• Home Village/City: ${p.village || 'Maharashtra'}`,
    `• Emergency Card ID: ${p.emergencyCardId || 'Not registered'}`,
    `• Chronic Medical Conditions: ${conditions}`,
    `• Known Allergies: ${allergies}`,
    `• Current Medications: ${meds}`,
  ];

  if (p.criticalNotes) {
    parts.push(`• Critical Health Notes: ${p.criticalNotes}`);
  }

  if (p.emergencyContacts && p.emergencyContacts.length > 0) {
    const contactsStr = p.emergencyContacts
      .map((c) => `${c.name} (${c.relationship || 'Contact'}: ${c.phoneNumber})`)
      .join('; ');
    parts.push(`• Registered Emergency Contacts: ${contactsStr}`);
  }

  return `[CONFIDENTIAL SUPABASE AUTHENTICATED USER RECORD]\n${parts.join('\n')}`;
};

export const subscribeUserRole = (listener: (role: UserRole) => void) => {
  roleListeners.add(listener);
  return () => {
    roleListeners.delete(listener);
  };
};

export const subscribeUserProfile = (listener: (profile: UserProfile | null) => void) => {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
};

export const useUserRole = (): UserRole => {
  const [role, setRole] = useState<UserRole>(currentRole);

  useEffect(() => {
    setRole(currentRole);
    const unsubscribe = subscribeUserRole((newRole) => {
      setRole(newRole);
    });
    return unsubscribe;
  }, []);

  return role;
};

export const useUserProfile = (): UserProfile | null => {
  const [profile, setProfile] = useState<UserProfile | null>(currentUserProfile);

  useEffect(() => {
    setProfile(currentUserProfile);
    const unsubscribe = subscribeUserProfile((newProfile) => {
      setProfile(newProfile);
    });
    return unsubscribe;
  }, []);

  return profile;
};
