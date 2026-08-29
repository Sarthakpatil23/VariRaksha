import { useState, useEffect } from 'react';

export type UserRole = 'varkari' | 'pilgrim' | 'dindiLeader' | 'volunteer' | 'medicalStaff';

export interface UserProfile {
  id?: string;
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
  role: UserRole;
  age?: number;
  gender?: string;
}

let currentRole: UserRole = 'varkari';
let currentUserProfile: UserProfile | null = null;

const roleListeners: Set<(role: UserRole) => void> = new Set();
const profileListeners: Set<(profile: UserProfile | null) => void> = new Set();

export const setUserRole = (role: UserRole) => {
  currentRole = role;
  roleListeners.forEach((listener) => listener(role));
};

export const getUserRole = (): UserRole => {
  return currentRole;
};

export const setUserProfile = (profile: UserProfile | null) => {
  currentUserProfile = profile;
  if (profile?.role) {
    currentRole = profile.role;
    roleListeners.forEach((listener) => listener(profile.role));
  }
  profileListeners.forEach((listener) => listener(profile));
};

export const getUserProfile = (): UserProfile | null => {
  return currentUserProfile;
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
