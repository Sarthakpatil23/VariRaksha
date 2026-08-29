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
 * Strictly scopes data to the currently logged in user profile.
 */
export const getUserAIContext = (profile: UserProfile | null = currentUserProfile): string => {
  if (!profile) {
    return '[User Context: Anonymous Pilgrim, No medical conditions on record]';
  }

  const parts: string[] = [];
  parts.push(`Name: ${profile.fullName || 'Varkari Pilgrim'}`);
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.gender) parts.push(`Gender: ${profile.gender}`);
  if (profile.bloodGroup) parts.push(`Blood Group: ${profile.bloodGroup}`);
  if (profile.role) parts.push(`Role in Wari: ${profile.role}`);
  if (profile.dindiName) parts.push(`Dindi: ${profile.dindiName} (#${profile.dindiNumber || '12'})`);
  if (profile.dindiLeaderName) parts.push(`Dindi Leader: ${profile.dindiLeaderName}`);
  if (profile.village) parts.push(`Home Village/District: ${profile.village}`);

  const conditions =
    profile.medicalConditions && profile.medicalConditions.length > 0
      ? profile.medicalConditions.filter((c) => c && c.toLowerCase() !== 'none').join(', ')
      : 'None reported';
  parts.push(`Known Medical Conditions: ${conditions}`);

  const allergies =
    profile.allergies && profile.allergies.length > 0
      ? profile.allergies.filter((a) => a && a.toLowerCase() !== 'none').join(', ')
      : 'None reported';
  parts.push(`Allergies: ${allergies}`);

  const meds =
    profile.currentMedications && profile.currentMedications.length > 0
      ? profile.currentMedications.filter((m) => m && m.toLowerCase() !== 'none').join(', ')
      : 'None reported';
  parts.push(`Current Medications: ${meds}`);

  if (profile.criticalNotes) {
    parts.push(`Critical Notes: ${profile.criticalNotes}`);
  }

  if (profile.emergencyContacts && profile.emergencyContacts.length > 0) {
    const contactsStr = profile.emergencyContacts
      .map((c) => `${c.name} (${c.relationship || 'Contact'}: ${c.phoneNumber})`)
      .join('; ');
    parts.push(`Emergency Contacts: ${contactsStr}`);
  }

  return `[CONFIDENTIAL ACTIVE USER PROFILE]\n${parts.join('\n')}`;
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
