import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CirclesStackParamList } from '../types';
import { CirclesHomeScreen } from '../../screens/circles/CirclesHomeScreen';
import { CreateCircleScreen } from '../../screens/circles/CreateCircleScreen';
import { CircleFeedScreen } from '../../screens/circles/CircleFeedScreen';
import { CircleSettingsScreen } from '../../screens/circles/CircleSettingsScreen';

const Stack = createNativeStackNavigator<CirclesStackParamList>();

export const CirclesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CirclesHome" component={CirclesHomeScreen} options={{ title: 'Circles' }} />
      <Stack.Screen name="CreateCircle" component={CreateCircleScreen} options={{ title: 'Create Circle' }} />
      <Stack.Screen name="CircleFeed" component={CircleFeedScreen} options={{ title: 'Circle Feed' }} />
      <Stack.Screen name="CircleSettings" component={CircleSettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
};
