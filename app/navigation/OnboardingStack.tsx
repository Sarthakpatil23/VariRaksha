import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';

import SplashScreen from '../screens/onboarding/SplashScreen';
import LanguageSelectScreen from '../screens/onboarding/LanguageSelectScreen';
import RoleSelectScreen from '../screens/onboarding/RoleSelectScreen';
import MobileNumberScreen from '../screens/onboarding/MobileNumberScreen';
import OTPVerificationScreen from '../screens/onboarding/OTPVerificationScreen';
import LoadingScreen from '../screens/onboarding/LoadingScreen';
import ProfileConfirmScreen from '../screens/onboarding/ProfileConfirmScreen';
import ProfileNotFoundScreen from '../screens/onboarding/ProfileNotFoundScreen';
import EmergencyIDScreen from '../screens/onboarding/EmergencyIDScreen';
import HowItWorksScreen from '../screens/onboarding/HowItWorksScreen';
import ConsentScreen from '../screens/onboarding/ConsentScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="MobileNumber" component={MobileNumberScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="ProfileConfirm" component={ProfileConfirmScreen} />
      <Stack.Screen name="ProfileNotFound" component={ProfileNotFoundScreen} />
      <Stack.Screen name="EmergencyID" component={EmergencyIDScreen} />
      <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
