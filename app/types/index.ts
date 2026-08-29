/**
 * VariRaksha - TypeScript Interfaces
 */

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface MedicalProfile {
  id: string;
  pilgrimId: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  organDonor: boolean;
  notes?: string;
}

export interface DindiGroup {
  id: string;
  name: string;
  leaderName: string;
  leaderPhone: string;
  route: string;
  totalMembers: number;
  qrCode?: string;
}

export interface DindiMember {
  id: string;
  name: string;
  mobileNumber: string;
  status: 'checked_in' | 'not_checked_in' | 'urgent_alert';
  lastSeen: string;
  distanceAway?: string;
  avatarUrl?: string;
  age?: number;
  gender?: string;
}

export interface DindiAlert {
  id: string;
  memberId?: string;
  memberName?: string;
  type: 'urgent' | 'info';
  statusLine: string;
  timestamp: string;
  distanceAway?: string;
  phone?: string;
}

export interface Pilgrim {
  id: string;
  fullName: string;
  mobileNumber: string;
  role: 'pilgrim' | 'leader' | 'volunteer' | 'medical_staff';
  preferredLanguage: 'en' | 'hi' | 'mr';
  emergencyId?: string;
  dindiGroup?: DindiGroup;
  medicalProfile?: MedicalProfile;
  emergencyContacts: EmergencyContact[];
  hasCompletedOnboarding: boolean;
  createdAt: string;
}
