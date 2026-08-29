export type StartPoint =
  | 'Dehu'
  | 'Alandi'
  | 'Paithan'
  | 'Trimbakeshwar'
  | 'Shegaon'
  | 'Sajjangad'
  | 'Saswad'
  | 'Murtijapur';

export interface Vari {
  id: string;
  vari_number: string;
  dindi_leader_name: string;
  start_point: StartPoint;
  destination: string;
  status: 'active' | 'completed' | 'archived';
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// Workspace tabs (Varkari, Volunteer, Medical Staff - Dindi Leader is global)
export type SheetTab = 'varkari' | 'volunteer' | 'medical_staff';

export interface EmergencyContact {
  id?: string;
  actor_id?: string;
  actor_type?: string;
  name: string;
  phone_number: string;
  relationship?: string;
  created_at?: string;
}

export interface BaseActorRecord {
  id: string;
  vari_id: string;
  full_name: string;
  mobile_number: string;
  medical_conditions?: string | null;
  allergies?: string | null;
  village: string;
  emergency_contacts?: EmergencyContact[];
  created_at: string;
  updated_at: string;
}

export interface VarkariRecord extends BaseActorRecord {
  emergency_card_id?: string | null;
  blood_group?: string | null;
}

export interface VolunteerRecord extends BaseActorRecord {}

export interface MedicalStaffRecord extends BaseActorRecord {
  specialization: string;
}

export interface DindiLeaderProfile extends BaseActorRecord {
  vari?: Vari;
  varkari_count?: number;
}

export type ActorRecord = VarkariRecord | VolunteerRecord | MedicalStaffRecord;
