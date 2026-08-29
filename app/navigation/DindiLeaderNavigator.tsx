import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DindiLeaderTabParamList } from './types';
import { colors, typography } from '../constants';

import DindiLeaderDashboardScreen from '../screens/dindi/DindiLeaderDashboardScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import DindiMembersScreen from '../screens/dindi/DindiMembersScreen';
import BroadcastScreen from '../screens/dindi/BroadcastScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<DindiLeaderTabParamList>();

export const DindiLeaderNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="DindiLeaderDashboard"
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
        name="DindiLeaderDashboard"
        component={DindiLeaderDashboardScreen}
        options={{
          title: t('dashboard', 'Dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: t('commanderAI', 'Commander AI'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DindiMembers"
        component={DindiMembersScreen}
        options={{
          title: t('dindiMembersTitle', 'Members'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Broadcast"
        component={BroadcastScreen}
        options={{
          title: t('broadcastTitle', 'Broadcast'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-sharp" size={size} color={color} />
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

export default DindiLeaderNavigator;
