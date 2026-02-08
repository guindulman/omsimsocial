import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingStackParamList } from '../types';
import { SplashScreen } from '../../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../../screens/onboarding/WelcomeScreen';
import { HowItWorksScreen } from '../../screens/onboarding/HowItWorksScreen';
import { RegisterScreen } from '../../screens/onboarding/RegisterScreen';
import { LoginScreen } from '../../screens/onboarding/LoginScreen';
import { PermissionsScreen } from '../../screens/onboarding/PermissionsScreen';
import { QuickStartScreen } from '../../screens/onboarding/QuickStartScreen';
import { DemoFeedScreen } from '../../screens/onboarding/DemoFeedScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack = ({ initialRoute }: { initialRoute: keyof OnboardingStackParamList }) => {
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="QuickStart" component={QuickStartScreen} />
      <Stack.Screen name="DemoFeed" component={DemoFeedScreen} />
    </Stack.Navigator>
  );
};
