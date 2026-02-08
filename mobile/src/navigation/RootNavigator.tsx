import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { api } from '../api';
import { useAuthStore } from '../state/authStore';
import { OnboardingStack } from './onboarding/OnboardingStack';
import { MainTabs } from './tabs/MainTabs';

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const ready = useAuthStore((state) => state.ready);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (token && !user) {
      api
        .me()
        .then((response) => setUser(response.user))
        .catch(() => undefined);
    }
  }, [token, user, setUser]);

  if (!ready) {
    return <OnboardingStack initialRoute="Splash" />;
  }

  if (!token) {
    return <OnboardingStack initialRoute="Welcome" />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
};
