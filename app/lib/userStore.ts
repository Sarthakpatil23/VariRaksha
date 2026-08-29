import { useState, useEffect } from 'react';

/**
 * Lightweight User State Store for VariRaksha
 */

// TODO: persist role to Supabase/local storage so it survives app restarts

export type UserRole = 'varkari' | 'pilgrim' | 'dindiLeader' | 'volunteer' | 'medicalStaff';

let currentRole: UserRole = 'varkari';
const listeners: Set<(role: UserRole) => void> = new Set();

export const setUserRole = (role: UserRole) => {
  currentRole = role;
  listeners.forEach((listener) => listener(role));
};

export const getUserRole = (): UserRole => {
  return currentRole;
};

export const subscribeUserRole = (listener: (role: UserRole) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
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
