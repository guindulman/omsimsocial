import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from '../../screens/momento/ProfileScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { ChangePasswordScreen } from '../../screens/ChangePasswordScreen';
import { TrashScreen } from '../../screens/TrashScreen';
import { HiddenPostsScreen } from '../../screens/HiddenPostsScreen';
import { BlockedUsersScreen } from '../../screens/BlockedUsersScreen';
import { AppearanceScreen } from '../../screens/AppearanceScreen';
import { SecurityCenterScreen } from '../../screens/SecurityCenterScreen';
import { PrivacyPreviewScreen } from '../../screens/PrivacyPreviewScreen';
import { DataControlsScreen } from '../../screens/DataControlsScreen';
import { NotificationPreferencesScreen } from '../../screens/NotificationPreferencesScreen';
import { AccessibilityScreen } from '../../screens/AccessibilityScreen';
import { EditProfileScreen } from '../../screens/momento/EditProfileScreen';
import { PostDetailScreen } from '../../screens/momento/PostDetailScreen';
import { StoryViewerScreen } from '../../screens/momento/StoryViewerScreen';
import { MediaViewerScreen } from '../../screens/momento/MediaViewerScreen';
import { UserProfileScreen } from '../../screens/momento/UserProfileScreen';
import { ConnectionsScreen } from '../../screens/momento/ConnectionsScreen';
import { ProfileViewsScreen } from '../../screens/ProfileViewsScreen';
import { ChatScreen } from '../../screens/momento/ChatScreen';
import { VideoCallScreen } from '../../screens/momento/VideoCallScreen';
import { FollowListScreen } from '../../screens/momento/FollowListScreen';
import { ResharersScreen } from '../../screens/momento/ResharersScreen';

const Stack = createNativeStackNavigator();

export const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="SecurityCenter" component={SecurityCenterScreen} />
      <Stack.Screen name="PrivacyPreview" component={PrivacyPreviewScreen} />
      <Stack.Screen name="DataControls" component={DataControlsScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} />
      <Stack.Screen name="Trash" component={TrashScreen} />
      <Stack.Screen name="HiddenPosts" component={HiddenPostsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ProfileViews" component={ProfileViewsScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
      <Stack.Screen name="Resharers" component={ResharersScreen} />
      <Stack.Screen name="MediaViewer" component={MediaViewerScreen} />
    </Stack.Navigator>
  );
};
