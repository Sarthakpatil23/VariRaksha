import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MedicalStaffTabParamList } from './types';

import MedicalStaffDashboardScreen from '../screens/medicalStaff/MedicalStaffDashboardScreen';
import MedicalStaffAlertsScreen from '../screens/medicalStaff/MedicalStaffAlertsScreen';
import MedicalStaffTasksScreen from '../screens/medicalStaff/MedicalStaffTasksScreen';
import MedicalStaffProfileScreen from '../screens/medicalStaff/MedicalStaffProfileScreen';

const Tab = createBottomTabNavigator<MedicalStaffTabParamList>();

export const MedicalStaffNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="MedicalStaffDashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B1E1E',
        tabBarInactiveTintColor: '#78716C',
        tabBarStyle: {
          backgroundColor: '#FAF4EE',
          borderTopColor: '#E8DED2',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#2B1A09',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home / Medical Staff Dashboard */}
      <Tab.Screen
        name="MedicalStaffDashboard"
        component={MedicalStaffDashboardScreen}
        options={{
          title: t('home', 'Home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Alerts (with highlighted circle beacon matching reference image 3) */}
      <Tab.Screen
        name="Alerts"
        component={MedicalStaffAlertsScreen}
        options={{
          title: t('alerts', 'Alerts'),
          tabBarIcon: ({ color: _color, size, focused }) => (
            <View style={[styles.alertsIconContainer, focused && styles.alertsIconContainerFocused]}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={focused ? 20 : (size || 22)}
                color={focused ? '#FFFFFF' : '#8B1E1E'}
              />
            </View>
          ),
        }}
      />

      {/* 3. Tasks */}
      <Tab.Screen
        name="Tasks"
        component={MedicalStaffTasksScreen}
        options={{
          title: t('tasks', 'Tasks'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Profile */}
      <Tab.Screen
        name="Profile"
        component={MedicalStaffProfileScreen}
        options={{
          title: t('profile', 'Profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  alertsIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertsIconContainerFocused: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E85D38',
    shadowColor: '#E85D38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default MedicalStaffNavigator;
