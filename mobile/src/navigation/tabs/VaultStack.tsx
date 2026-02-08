import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VaultStackParamList } from '../types';
import { VaultHomeScreen } from '../../screens/vault/VaultHomeScreen';
import { AdoptedListScreen } from '../../screens/vault/AdoptedListScreen';
import { TimeCapsulesScreen } from '../../screens/vault/TimeCapsulesScreen';
import { CreateTimeCapsuleScreen } from '../../screens/vault/CreateTimeCapsuleScreen';
import { OnThisDayScreen } from '../../screens/vault/OnThisDayScreen';

const Stack = createNativeStackNavigator<VaultStackParamList>();

export const VaultStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VaultHome" component={VaultHomeScreen} options={{ title: 'Vault' }} />
      <Stack.Screen name="AdoptedList" component={AdoptedListScreen} options={{ title: 'Saved' }} />
      <Stack.Screen name="TimeCapsules" component={TimeCapsulesScreen} options={{ title: 'Time Capsules' }} />
      <Stack.Screen name="CreateTimeCapsule" component={CreateTimeCapsuleScreen} options={{ title: 'Create Capsule' }} />
      <Stack.Screen name="OnThisDay" component={OnThisDayScreen} options={{ title: 'On This Day' }} />
    </Stack.Navigator>
  );
};
