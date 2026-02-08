import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { friendApi } from '../../api/friendApi';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

type ConnectionRow = {
  key: string;
  userId: number;
  name: string;
  username?: string;
  avatarUrl?: string | null;
  detail?: string;
};

export const ConnectionsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendApi.friends(),
  });

  const rows = useMemo(() => {
    const friendships = friendsQuery.data?.data ?? [];
    return friendships
      .map((friendship) => {
        const other = friendship.user;
        if (!other?.id) return null;
        const detailParts = [];
        if (friendship.verified_at) detailParts.push('Verified');
        return {
          key: String(friendship.id),
          userId: other.id,
          name: other.name ?? 'Friend',
          username: other.username ?? undefined,
          avatarUrl: other.profile?.avatar_url ?? null,
          detail: detailParts.length ? detailParts.join(' \u00b7 ') : undefined,
        };
      })
      .filter((row): row is ConnectionRow => Boolean(row));
  }, [friendsQuery.data?.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const name = row.name.toLowerCase();
      const handle = row.username ? row.username.toLowerCase() : '';
      return name.includes(term) || handle.includes(term);
    });
  }, [rows, search]);

  const openProfile = (userId: number) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('SearchTab' as never, { screen: 'UserProfile', params: { userId } } as never);
      return;
    }
    navigation.navigate('UserProfile' as never, { userId } as never);
  };

  const emptyCopy = friendsQuery.isLoading
    ? 'Loading friends...'
    : 'No friends yet.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
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
              <AppText variant="title">Friends</AppText>
            </View>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              People you have added as friends.
            </AppText>
            <View style={{ marginTop: theme.spacing.lg }}>
              <Input
                placeholder="Search friends"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => openProfile(item.userId)}
            style={{
              marginBottom: theme.spacing.sm,
              padding: theme.spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Avatar
                name={item.name}
                size={48}
                imageSource={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">{item.name}</AppText>
                {item.username ? (
                  <AppText variant="caption" tone="secondary">
                    @{item.username}
                  </AppText>
                ) : null}
                {item.detail ? (
                  <AppText variant="caption" tone="secondary">
                    {item.detail}
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
              <AppText variant="subtitle">Friends</AppText>
              <AppText tone="secondary">{emptyCopy}</AppText>
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};
