import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { VolunteerTabParamList } from './types';
import { colors, typography } from '../constants';

import VolunteerDashboardScreen from '../screens/volunteer/VolunteerDashboardScreen';
import VolunteerTasksScreen from '../screens/volunteer/VolunteerTasksScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<VolunteerTabParamList>();

export const VolunteerNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="VolunteerDashboard"
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
        name="VolunteerDashboard"
        component={VolunteerDashboardScreen}
        options={{
          title: t('dashboard', 'Dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="VolunteerTasks"
        component={VolunteerTasksScreen}
        options={{
          title: t('tasks', 'Tasks'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-sharp" size={size} color={color} />
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

export default VolunteerNavigator;
