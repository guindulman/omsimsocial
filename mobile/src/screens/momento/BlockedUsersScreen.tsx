import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { ApiError } from '../../api/client';
import { User } from '../../api/types';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

export const BlockedUsersScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const blockedQuery = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => api.blockedUsers(),
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: number) => api.unblockUser(userId),
    onSuccess: (_response, userId) => {
      queryClient.setQueryData(['blocked-users'], (prev: { data: User[] } | undefined) => {
        if (!prev) return prev;
        return { data: prev.data.filter((user) => user.id !== userId) };
      });
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to unblock this user.';
      Alert.alert('Unblock failed', message);
    },
  });

  const rows = useMemo(() => {
    const list = blockedQuery.data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((user) => {
      const name = user.name?.toLowerCase() ?? '';
      const handle = user.username?.toLowerCase() ?? '';
      return name.includes(term) || handle.includes(term);
    });
  }, [blockedQuery.data?.data, search]);

  const emptyCopy = blockedQuery.isLoading
    ? 'Loading blocked users...'
    : 'No blocked users yet.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={rows}
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
              <AppText variant="title">Blocked users</AppText>
            </View>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Manage people you blocked.
            </AppText>
            <View style={{ marginTop: theme.spacing.lg }}>
              <Input
                placeholder="Search blocked users"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card
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
              <Button
                label={unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
                variant="secondary"
                size="sm"
                onPress={() => unblockMutation.mutate(item.id)}
                disabled={unblockMutation.isPending}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: theme.spacing.md }}>
            <Card>
              <AppText variant="subtitle">Blocked users</AppText>
              <AppText tone="secondary">{emptyCopy}</AppText>
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};
