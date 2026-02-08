import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PeopleStackParamList } from '../types';
import { PeopleHomeScreen } from '../../screens/people/PeopleHomeScreen';
import { ConnectMethodsScreen } from '../../screens/people/ConnectMethodsScreen';
import { InviteLinkScreen } from '../../screens/people/InviteLinkScreen';
import { HandshakeQrScreen } from '../../screens/people/HandshakeQrScreen';
import { ConfirmConnectionScreen } from '../../screens/people/ConfirmConnectionScreen';
import { FirstMemoryCardScreen } from '../../screens/people/FirstMemoryCardScreen';
import { PersonProfileScreen } from '../../screens/people/PersonProfileScreen';
import { MessageThreadScreen } from '../../screens/inbox/MessageThreadScreen';
import { QuickStartScreen } from '../../screens/onboarding/QuickStartScreen';
import { DemoFeedScreen } from '../../screens/onboarding/DemoFeedScreen';

const Stack = createNativeStackNavigator<PeopleStackParamList>();

export const PeopleStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PeopleHome" component={PeopleHomeScreen} options={{ title: 'People' }} />
      <Stack.Screen name="ConnectMethods" component={ConnectMethodsScreen} options={{ title: 'Connect' }} />
      <Stack.Screen name="InviteLink" component={InviteLinkScreen} options={{ title: 'Invite Link' }} />
      <Stack.Screen name="HandshakeQR" component={HandshakeQrScreen} options={{ title: 'Verify in person' }} />
      <Stack.Screen name="ConfirmConnection" component={ConfirmConnectionScreen} options={{ title: 'Confirm' }} />
      <Stack.Screen name="FirstMemoryCard" component={FirstMemoryCardScreen} options={{ title: 'First Memory' }} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} options={{ title: 'Message' }} />
      <Stack.Screen name="QuickStart" component={QuickStartScreen} options={{ title: 'QuickStart' }} />
      <Stack.Screen name="DemoFeed" component={DemoFeedScreen} options={{ title: 'Demo Feed' }} />
    </Stack.Navigator>
  );
};
