import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { followApi } from '../../api/followApi';
import { ApiError } from '../../api/client';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

type FollowListParams = {
  userId: number;
  type: 'followers' | 'following';
  userName?: string;
};

export const FollowListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, type, userName } = route.params as FollowListParams;
  const [search, setSearch] = useState('');

  const listQuery = useQuery({
    queryKey: ['follow-list', type, userId],
    queryFn: () => (type === 'followers' ? followApi.followers(userId) : followApi.following(userId)),
    enabled: Boolean(userId),
  });

  const accessDenied = listQuery.error instanceof ApiError && listQuery.error.status === 403;
  const rawRows = listQuery.data?.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rawRows;
    return rawRows.filter((row) => {
      const name = row.name?.toLowerCase() ?? '';
      const handle = row.username?.toLowerCase() ?? '';
      return name.includes(term) || handle.includes(term);
    });
  }, [rawRows, search]);

  const title = type === 'followers' ? 'Followers' : 'Following';
  const subtitle = accessDenied
    ? 'This list is private.'
    : type === 'followers'
    ? `People following ${userName ?? 'this account'}.`
    : `People ${userName ?? 'this account'} follows.`;

  const openProfile = (targetId: number) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('SearchTab' as never, { screen: 'UserProfile', params: { userId: targetId } } as never);
      return;
    }
    navigation.navigate('UserProfile' as never, { userId: targetId } as never);
  };

  const emptyCopy = accessDenied
    ? 'Followers and following are private.'
    : listQuery.isLoading
    ? 'Loading...'
    : `No ${title.toLowerCase()} yet.`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={accessDenied ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle,
                }}
              >
                <Feather name="chevron-left" size={18} color={theme.colors.textPrimary} />
              </Pressable>
              <AppText variant="title">{title}</AppText>
            </View>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              {subtitle}
            </AppText>
            {!accessDenied ? (
              <View style={{ marginTop: theme.spacing.lg }}>
                <Input
                  placeholder={`Search ${title.toLowerCase()}`}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => openProfile(item.id)}
            style={{
              marginBottom: theme.spacing.sm,
              padding: theme.spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Avatar
                name={item.name ?? 'Omsim member'}
                size={48}
                imageSource={item.profile?.avatar_url ? { uri: item.profile.avatar_url } : undefined}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">{item.name ?? 'Omsim member'}</AppText>
                {item.username ? (
                  <AppText variant="caption" tone="secondary">
                    @{item.username}
                  </AppText>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={theme.colors.textSecondary} />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: theme.spacing.md }}>
            <Card>
              <AppText variant="subtitle">{title}</AppText>
              <AppText tone="secondary">{emptyCopy}</AppText>
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};
