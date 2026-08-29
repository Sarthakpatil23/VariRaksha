import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MedicalStaffTabParamList } from './types';
import { colors, typography } from '../constants';

import MedicalStaffDashboardScreen from '../screens/medicalStaff/MedicalStaffDashboardScreen';
import PatientRecordsScreen from '../screens/medicalStaff/PatientRecordsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MedicalStaffTabParamList>();

export const MedicalStaffNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="MedicalStaffDashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.saffronDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: typography.fontWeight.bold,
        },
      }}
    >
      <Tab.Screen
        name="MedicalStaffDashboard"
        component={MedicalStaffDashboardScreen}
        options={{
          title: t('dashboard', 'Triage'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PatientRecords"
        component={PatientRecordsScreen}
        options={{
          title: t('records', 'Records'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings', 'Settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MedicalStaffNavigator;
