import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import OnboardingStack from './OnboardingStack';
import PilgrimNavigator from './PilgrimNavigator';
import DindiLeaderNavigator from './DindiLeaderNavigator';
import VolunteerNavigator from './VolunteerNavigator';
import MedicalStaffNavigator from './MedicalStaffNavigator';
import { useUserRole } from '../lib/userStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Role-based main application routing container
export const MainAppContainer: React.FC = () => {
  const role = useUserRole();

  return (
    <>
      {(role === 'pilgrim' || role === 'varkari') && <PilgrimNavigator />}
      {role === 'dindiLeader' && <DindiLeaderNavigator />}
      {role === 'volunteer' && <VolunteerNavigator />}
      {role === 'medicalStaff' && <MedicalStaffNavigator />}
    </>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="MainApp" component={MainAppContainer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
