import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { api } from '../api';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../theme/useTheme';

export const UserProfileScreen = () => {
  const theme = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'UserProfile'>>();
  const { users } = useAppState();
  const targetUserId = route.params.userId;
  const user = users.find((item) => item.id === targetUserId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSelf = Boolean(currentUserId && targetUserId === currentUserId);
  const recordedProfileViewsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!targetUserId || isSelf) {
      return;
    }
    if (recordedProfileViewsRef.current.has(targetUserId)) {
      return;
    }
    recordedProfileViewsRef.current.add(targetUserId);
    api
      .recordProfileView(targetUserId, { source: 'profile_link' })
      .catch(() => null);
  }, [isSelf, targetUserId]);

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>User not found.</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <Avatar
          name={user.name}
          size={96}
          imageSource={user.avatarUrl ? { uri: user.avatarUrl } : undefined}
        />
        <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
          <AppText variant="title">{user.name}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
            <AppText tone="secondary">@{user.handle}</AppText>
            {!user.isPublic ? (
              <View style={{ marginLeft: theme.spacing.xs }}>
                <Icon name="lock" size={14} color={theme.colors.textSecondary} />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {!user.isPublic ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="lock" />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <AppText variant="subtitle">Private profile</AppText>
                <AppText tone="secondary">
                  This user has set their profile to private.
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      ) : (
        <>
          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="subtitle">Bio</AppText>
            <View style={{ marginTop: theme.spacing.sm }}>
              <AppText>{user.bio}</AppText>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="subtitle">City</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
              <Icon name="pin" />
              <View style={{ marginLeft: theme.spacing.sm }}>
                <AppText tone="secondary">{user.city}</AppText>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};
