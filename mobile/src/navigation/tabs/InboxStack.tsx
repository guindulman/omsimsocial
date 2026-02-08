import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { InboxStackParamList } from '../types';
import { InboxHomeScreen } from '../../screens/inbox/InboxHomeScreen';
import { AdoptionNotesListScreen } from '../../screens/inbox/AdoptionNotesListScreen';
import { RequestsScreen } from '../../screens/inbox/RequestsScreen';
import { MessageThreadScreen } from '../../screens/inbox/MessageThreadScreen';

const Stack = createNativeStackNavigator<InboxStackParamList>();

export const InboxStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="InboxHome" component={InboxHomeScreen} options={{ title: 'Inbox' }} />
      <Stack.Screen name="AdoptionNotesList" component={AdoptionNotesListScreen} options={{ title: 'Save Notes' }} />
      <Stack.Screen name="Requests" component={RequestsScreen} options={{ title: 'Requests' }} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
};
