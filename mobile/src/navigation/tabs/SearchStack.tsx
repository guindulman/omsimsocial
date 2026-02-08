import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SearchScreen } from '../../screens/momento/SearchScreen';
import { UserProfileScreen } from '../../screens/momento/UserProfileScreen';
import { ChatScreen } from '../../screens/momento/ChatScreen';
import { VideoCallScreen } from '../../screens/momento/VideoCallScreen';
import { PostDetailScreen } from '../../screens/momento/PostDetailScreen';
import { StoryViewerScreen } from '../../screens/momento/StoryViewerScreen';
import { MediaViewerScreen } from '../../screens/momento/MediaViewerScreen';
import { FollowListScreen } from '../../screens/momento/FollowListScreen';
import { SharePostScreen } from '../../screens/momento/SharePostScreen';
import { ConnectMethodsScreen } from '../../screens/people/ConnectMethodsScreen';
import { InviteLinkScreen } from '../../screens/people/InviteLinkScreen';
import { HandshakeQrScreen } from '../../screens/people/HandshakeQrScreen';
import { ConfirmConnectionScreen } from '../../screens/people/ConfirmConnectionScreen';

const Stack = createNativeStackNavigator();

export const SearchStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} />
      <Stack.Screen name="SharePost" component={SharePostScreen} />
      <Stack.Screen
        name="ConnectMethods"
        component={ConnectMethodsScreen}
        options={{ headerShown: true, title: 'Connect' }}
      />
      <Stack.Screen
        name="InviteLink"
        component={InviteLinkScreen}
        options={{ headerShown: true, title: 'Invite Link' }}
      />
      <Stack.Screen
        name="HandshakeQR"
        component={HandshakeQrScreen}
        options={{ headerShown: true, title: 'Verify in person' }}
      />
      <Stack.Screen
        name="ConfirmConnection"
        component={ConfirmConnectionScreen}
        options={{ headerShown: true, title: 'Confirm' }}
      />
    </Stack.Navigator>
  );
};
