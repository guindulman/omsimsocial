import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreatePostScreen } from '../../screens/momento/CreatePostScreen';

const Stack = createNativeStackNavigator();

export const CreateStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
    </Stack.Navigator>
  );
};
