import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AlertsHubScreen } from '../../screens/momento/AlertsHubScreen';

const Stack = createNativeStackNavigator();

export const NotificationsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlertsHub" component={AlertsHubScreen} />
    </Stack.Navigator>
  );
};
