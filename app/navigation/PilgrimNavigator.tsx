import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PilgrimTabParamList } from './types';
import { colors, typography } from '../constants';

import HomeSOSScreen from '../screens/home/HomeSOSScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import MedicalIDScreen from '../screens/medical/MedicalIDScreen';
import DindiGroupScreen from '../screens/dindi/DindiGroupScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<PilgrimTabParamList>();

export const PilgrimNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
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
          fontSize: 11,
          fontWeight: typography.fontWeight.bold,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeSOSScreen}
        options={{
          title: t('home', 'Home / SOS'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: t('chat', 'AI Sahayak'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Medical"
        component={MedicalIDScreen}
        options={{
          title: t('medical', 'Medical ID'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Dindi"
        component={DindiGroupScreen}
        options={{
          title: t('dindi', 'Dindi Group'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-sharp" size={size} color={color} />
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

export default PilgrimNavigator;
