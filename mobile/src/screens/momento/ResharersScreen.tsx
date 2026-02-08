import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { ApiError } from '../../api/client';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

type ResharersParams = {
  memoryId: number;
};

export const ResharersScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { memoryId } = route.params as ResharersParams;
  const [search, setSearch] = useState('');

  const resharersQuery = useInfiniteQuery({
    queryKey: ['memory-reshares', memoryId],
    queryFn: ({ pageParam }) =>
      api.listMemoryReshares(memoryId, pageParam ? { cursor: String(pageParam) } : undefined),
    enabled: Boolean(memoryId),
    getNextPageParam: (lastPage) => {
      if (lastPage?.has_more && lastPage.next_cursor) {
        return lastPage.next_cursor;
      }
      return undefined;
    },
  });

  const error = resharersQuery.error;
  const accessDenied = error instanceof ApiError && error.status === 403;
  const isMissingEndpoint = error instanceof ApiError && error.status === 404;
  const flatUsers = resharersQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return flatUsers;
    return flatUsers.filter((user) => {
      const name = user.name?.toLowerCase() ?? '';
      const handle = user.username?.toLowerCase() ?? '';
      return name.includes(term) || handle.includes(term);
    });
  }, [flatUsers, search]);

  const openProfile = (targetId: number) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('SearchTab' as never, { screen: 'UserProfile', params: { userId: targetId } } as never);
      return;
    }
    navigation.navigate('UserProfile' as never, { userId: targetId } as never);
  };

  const emptyCopy = accessDenied
    ? 'Resharers are private.'
    : isMissingEndpoint
    ? 'Resharers list is unavailable right now.'
    : resharersQuery.isError
    ? 'Unable to load resharers.'
    : resharersQuery.isLoading
    ? 'Loading...'
    : 'No reshares yet.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={accessDenied ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        onEndReached={() => {
          if (resharersQuery.hasNextPage && !resharersQuery.isFetchingNextPage) {
            resharersQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.6}
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
              <AppText variant="title">Reshared by</AppText>
            </View>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              People who reshared this moment.
            </AppText>
            {!accessDenied ? (
              <View style={{ marginTop: theme.spacing.lg }}>
                <Input placeholder="Search resharers" value={search} onChangeText={setSearch} />
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
        ListFooterComponent={
          resharersQuery.isFetchingNextPage ? (
            <View style={{ paddingTop: theme.spacing.md, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ paddingTop: theme.spacing.md }}>
            {resharersQuery.isLoading ? (
              <ActivityIndicator />
            ) : (
              <Card>
                <AppText variant="subtitle">Reshared by</AppText>
                <AppText tone="secondary">{emptyCopy}</AppText>
              </Card>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};
