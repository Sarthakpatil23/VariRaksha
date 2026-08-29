import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type OnboardingStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  RoleSelect: undefined;
  MobileNumber: { selectedRole?: string } | undefined;
  OTPVerification: { mobileNumber: string; selectedRole?: string };
  Loading: { mobileNumber: string; selectedRole?: string; preloadedPlayer?: any };
  ProfileConfirm: { profile?: any } | undefined;
  ProfileNotFound: { mobileNumber?: string; selectedRole?: string } | undefined;
  EmergencyID: undefined;
  HowItWorks: undefined;
  Consent: undefined;
};

export type PilgrimTabParamList = {
  Home: undefined;
  Chat: undefined;
  Calendar: undefined;
  Dindi: undefined;
  Settings: undefined;
  Medical?: undefined;
};

// MainTabsParamList kept as alias for backward compatibility
export type MainTabsParamList = PilgrimTabParamList;

export type DindiLeaderTabParamList = {
  DindiLeaderDashboard: undefined;
  Chat: undefined;
  DindiMembers: undefined;
  Broadcast: undefined;
  Settings: undefined;
};

export type VolunteerTabParamList = {
  VolunteerDashboard: undefined;
  VolunteerTasks: undefined;
  Settings: undefined;
};

export type MedicalStaffTabParamList = {
  MedicalStaffDashboard: undefined;
  PatientRecords: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
};

// Screen props helpers for TypeScript
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type PilgrimTabScreenProps<T extends keyof PilgrimTabParamList> =
  BottomTabScreenProps<PilgrimTabParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabsParamList> =
  BottomTabScreenProps<MainTabsParamList, T>;

export type DindiLeaderTabScreenProps<T extends keyof DindiLeaderTabParamList> =
  BottomTabScreenProps<DindiLeaderTabParamList, T>;

export type VolunteerTabScreenProps<T extends keyof VolunteerTabParamList> =
  BottomTabScreenProps<VolunteerTabParamList, T>;

export type MedicalStaffTabScreenProps<T extends keyof MedicalStaffTabParamList> =
  BottomTabScreenProps<MedicalStaffTabParamList, T>;
