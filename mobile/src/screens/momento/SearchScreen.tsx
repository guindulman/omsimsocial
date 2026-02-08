import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextPostCover } from '../../components/TextPostCover';
import { SearchBar } from '../../components/search/SearchBar';
import { SearchChip } from '../../components/search/SearchChip';
import { SearchSectionHeader } from '../../components/search/SearchSectionHeader';
import { SearchSkeletonGrid, SearchSkeletonRow } from '../../components/search/SearchSkeleton';
import { api } from '../../api';
import { followApi } from '../../api/followApi';
import { User } from '../../api/types';
import { useAuthStore } from '../../state/authStore';
import { useTheme } from '../../theme/useTheme';
import { MomentoPost, MomentoUser } from '../../types/momento';
import { mapMemoryToMomentoPost, normalizeMediaUrl } from '../../utils/momentoAdapter';
import { useDebouncedValue } from '../../utils/debounce';
import {
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches,
} from '../../storage/recentSearches';

type SearchTab = 'top' | 'accounts' | 'posts';

const fallbackAvatar = (id: number) =>
  `https://i.pravatar.cc/200?img=${(id % 70) + 1}`;

const mapUserToMomentoUser = (user: User): MomentoUser => ({
  id: String(user.id),
  name: user.name ?? 'Omsim member',
  username: user.username ?? `user${user.id}`,
  avatarUrl: normalizeMediaUrl(user.profile?.avatar_url) ?? fallbackAvatar(user.id),
});

export const SearchScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('top');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, 360);
  const showSearchResults = debouncedQuery.length >= 1;
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
  }, []);

  const followingQuery = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => followApi.following(currentUserId ?? 0),
    enabled: Boolean(currentUserId),
  });

  const outgoingFollowRequestsQuery = useQuery({
    queryKey: ['follow-requests', 'outgoing'],
    queryFn: () => followApi.outgoingFollowRequests(),
    enabled: Boolean(currentUserId),
  });

  const refreshFollowState = () => {
    queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
  };

  const followMutation = useMutation({
    mutationFn: (targetId: number) => followApi.follow(targetId),
    onSuccess: refreshFollowState,
  });

  const suggestedAccountsQuery = useQuery({
    queryKey: ['search', 'suggested-accounts'],
    queryFn: () => api.searchSuggestedAccounts({ limit: 10 }),
    enabled: !showSearchResults,
  });

  const trendingQuery = useQuery({
    queryKey: ['search', 'trending'],
    queryFn: () => api.searchTrending({ limit: 12 }),
    enabled: !showSearchResults,
  });

  const topQuery = useQuery({
    queryKey: ['search', 'top', debouncedQuery],
    queryFn: () => api.search(debouncedQuery, { type: 'top' }),
    enabled: showSearchResults,
  });

  const accountsQuery = useInfiniteQuery({
    queryKey: ['search', 'accounts', debouncedQuery],
    queryFn: ({ pageParam }) =>
      api.search(debouncedQuery, { type: 'accounts', limit: 20, cursor: pageParam }),
    enabled: showSearchResults && activeTab === 'accounts',
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.accounts?.next_cursor ?? undefined,
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ['search', 'posts', debouncedQuery],
    queryFn: ({ pageParam }) =>
      api.search(debouncedQuery, { type: 'posts', limit: 24, cursor: pageParam }),
    enabled: showSearchResults && activeTab === 'posts',
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.posts?.next_cursor ?? undefined,
  });

  const following = followingQuery.data?.data ?? [];
  const outgoingFollowRequests = outgoingFollowRequestsQuery.data?.data ?? [];

  const getFollowState = (targetId: number) => {
    if (following.some((user) => user.id === targetId)) {
      return { state: 'following' as const };
    }

    const outgoing = outgoingFollowRequests.find((request) => request.target?.id === targetId);
    if (outgoing) {
      return { state: 'requested' as const };
    }

    return { state: 'none' as const };
  };

  const suggestedAccounts = useMemo(() => {
    const users = suggestedAccountsQuery.data?.data ?? [];
    return users.map(mapUserToMomentoUser);
  }, [suggestedAccountsQuery.data?.data]);

  const trendingPosts = useMemo(() => {
    const memories = trendingQuery.data?.data ?? [];
    return memories.map(mapMemoryToMomentoPost);
  }, [trendingQuery.data?.data]);

  const topAccounts = useMemo(() => {
    const users = topQuery.data?.accounts?.data ?? [];
    return users.map(mapUserToMomentoUser);
  }, [topQuery.data?.accounts?.data]);

  const topPosts = useMemo(() => {
    const memories = topQuery.data?.posts?.data ?? [];
    return memories.map(mapMemoryToMomentoPost);
  }, [topQuery.data?.posts?.data]);

  const accountResults = useMemo(() => {
    const pages = accountsQuery.data?.pages ?? [];
    return pages.flatMap((page) => page.accounts?.data ?? []);
  }, [accountsQuery.data?.pages]);

  const postResults = useMemo(() => {
    const pages = postsQuery.data?.pages ?? [];
    return pages.flatMap((page) => page.posts?.data ?? []);
  }, [postsQuery.data?.pages]);

  const accountResultsMapped = useMemo(
    () => accountResults.map(mapUserToMomentoUser),
    [accountResults]
  );

  const postResultsMapped = useMemo(
    () => postResults.map(mapMemoryToMomentoPost),
    [postResults]
  );

  const handleAddRecent = async (term: string) => {
    const updated = await addRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleSubmit = async () => {
    if (!trimmedQuery.length) return;
    await handleAddRecent(trimmedQuery);
  };

  const handleClearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const openPost = (post: MomentoPost) => {
    navigation.navigate(
      'PostDetail' as never,
      { memoryId: Number(post.id) } as never
    );
  };

  const renderAccountCard = (user: MomentoUser) => {
    const targetId = Number(user.id);
    const followState = Number.isNaN(targetId) ? { state: 'none' as const } : getFollowState(targetId);
    const label =
      followState.state === 'following'
        ? 'Following'
        : followState.state === 'requested'
        ? 'Requested'
        : 'Follow';
    const disabled = followState.state !== 'none';
    const canFollow = Number.isFinite(targetId) && targetId !== currentUserId;
    const handlePress = () => {
      if (Number.isNaN(targetId) || !canFollow) return;
      if (followState.state === 'none') {
        followMutation.mutate(targetId);
      }
    };

    return (
      <Card style={{ width: 160, padding: theme.spacing.md }}>
        <Pressable
          onPress={() => {
            const userId = Number(user.id);
            navigation.navigate(
              'UserProfile' as never,
              {
                userId: Number.isNaN(userId) ? undefined : userId,
                user,
              } as never
            );
          }}
          accessibilityRole="button"
          accessibilityLabel={`View ${user.name} profile`}
        >
          <Avatar name={user.name} size={52} imageSource={{ uri: user.avatarUrl }} />
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText variant="subtitle">{user.name}</AppText>
            <AppText variant="caption" tone="secondary">
              @{user.username}
            </AppText>
          </View>
        </Pressable>
        {canFollow ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Follow ${user.name}`}
            onPress={handlePress}
            disabled={disabled}
            style={{
              marginTop: theme.spacing.sm,
              backgroundColor: theme.colors.accentSoft,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radii.pill,
              alignItems: 'center',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <AppText variant="caption" tone={disabled ? 'secondary' : 'accent'}>
              {label}
            </AppText>
          </Pressable>
        ) : null}
      </Card>
    );
  };

  const renderAccountRow = (user: MomentoUser) => {
    const targetId = Number(user.id);
    const followState = Number.isNaN(targetId) ? { state: 'none' as const } : getFollowState(targetId);
    const label =
      followState.state === 'following'
        ? 'Following'
        : followState.state === 'requested'
        ? 'Requested'
        : 'Follow';
    const disabled = followState.state !== 'none';
    const canFollow = Number.isFinite(targetId) && targetId !== currentUserId;
    const handlePress = () => {
      if (Number.isNaN(targetId) || !canFollow) return;
      if (followState.state === 'none') {
        followMutation.mutate(targetId);
      }
    };

    return (
      <Card key={user.id} style={{ marginBottom: theme.spacing.sm, padding: theme.spacing.md }}>
        <Pressable
          onPress={() => {
            const userId = Number(user.id);
            navigation.navigate(
              'UserProfile' as never,
              {
                userId: Number.isNaN(userId) ? undefined : userId,
                user,
              } as never
            );
          }}
          accessibilityRole="button"
          accessibilityLabel={`View ${user.name} profile`}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Avatar name={user.name} size={52} imageSource={{ uri: user.avatarUrl }} />
          <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
            <AppText variant="subtitle">{user.name}</AppText>
            <AppText variant="caption" tone="secondary">
              @{user.username}
            </AppText>
          </View>
          {canFollow ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label} ${user.name}`}
              onPress={handlePress}
              disabled={disabled}
              style={{
                backgroundColor: theme.colors.accentSoft,
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radii.pill,
                alignItems: 'center',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <AppText variant="caption" tone={disabled ? 'secondary' : 'accent'}>
                {label}
              </AppText>
            </Pressable>
          ) : null}
        </Pressable>
      </Card>
    );
  };

  const searchHeader = (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSubmit}
        onClear={() => setQuery('')}
      />
      {showSearchResults ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <SegmentedControl
            options={[
              { label: 'Top', value: 'top' },
              { label: 'Accounts', value: 'accounts' },
              { label: 'Posts', value: 'posts' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as SearchTab)}
          />
        </View>
      ) : null}
    </View>
  );

  const renderEmptyState = (message: string) => (
    <View style={{ paddingVertical: theme.spacing.lg }}>
      <AppText tone="secondary">{message}</AppText>
    </View>
  );

  const renderErrorState = (message: string, onRetry?: () => void) => (
    <View style={{ marginTop: theme.spacing.sm }}>
      <AppText tone="secondary">{message}</AppText>
      {onRetry ? (
        <Button
          label="Retry"
          size="sm"
          variant="secondary"
          onPress={onRetry}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </View>
  );

  const emptyQueryListHeader = (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {searchHeader}

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        <SearchSectionHeader
          title="Recent searches"
          actionLabel={recentSearches.length ? 'Clear' : undefined}
          onPressAction={recentSearches.length ? handleClearRecent : undefined}
        />
        {recentSearches.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            {recentSearches.map((term) => (
              <SearchChip
                key={term}
                label={term}
                onPress={() => {
                  setQuery(term);
                  void handleAddRecent(term);
                }}
              />
            ))}
          </View>
        ) : (
          <AppText tone="secondary" style={{ marginTop: theme.spacing.sm }}>
            No recent searches yet.
          </AppText>
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        <SearchSectionHeader title="Suggested accounts" />
        {suggestedAccountsQuery.isLoading ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <SearchSkeletonRow />
            <SearchSkeletonRow />
          </View>
        ) : suggestedAccountsQuery.isError ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Unable to load suggestions.</AppText>
            <Button
              label="Retry"
              size="sm"
              variant="secondary"
              onPress={() => suggestedAccountsQuery.refetch()}
              style={{ marginTop: theme.spacing.sm }}
            />
          </View>
        ) : suggestedAccounts.length ? (
          <FlatList
            data={suggestedAccounts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}
            renderItem={({ item }) => renderAccountCard(item)}
          />
        ) : (
          <AppText tone="secondary" style={{ marginTop: theme.spacing.sm }}>
            No suggestions yet.
          </AppText>
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        <SearchSectionHeader title="Trending now" />
        {trendingQuery.isLoading ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <SearchSkeletonGrid count={6} />
          </View>
        ) : trendingQuery.isError ? (
          renderErrorState('Unable to load trending posts.', () => trendingQuery.refetch())
        ) : null}
      </View>
    </View>
  );

  const topListHeader = (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {searchHeader}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        <SearchSectionHeader title="Accounts" />
        {topQuery.isLoading ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <SearchSkeletonRow />
            <SearchSkeletonRow />
          </View>
        ) : topQuery.isError ? (
          renderErrorState('Unable to load accounts.', () => topQuery.refetch())
        ) : topAccounts.length ? (
          <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
            {topAccounts.map((user) => renderAccountRow(user))}
          </View>
        ) : (
          renderEmptyState('No accounts matched your search yet.')
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
        <SearchSectionHeader title="Posts" />
        {topQuery.isLoading ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <SearchSkeletonGrid count={6} />
          </View>
        ) : topQuery.isError ? (
          renderErrorState('Unable to load posts.', () => topQuery.refetch())
        ) : null}
      </View>
    </View>
  );

  const trendingItems = trendingQuery.isError ? [] : trendingPosts;

  if (!showSearchResults) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <FlatList
          key="search-discover"
          data={trendingItems}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{
            paddingBottom: theme.spacing.xxl,
            paddingTop: Math.max(theme.spacing.sm, insets.top ? 0 : theme.spacing.sm),
          }}
          columnWrapperStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
          ListHeaderComponent={emptyQueryListHeader}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openPost(item)}
              accessibilityRole="button"
              accessibilityLabel="Open post"
              style={{
                flex: 1,
                marginBottom: theme.spacing.sm,
              }}
            >
              {item.media?.uri ? (
                <Image
                  source={{ uri: item.media.uri }}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: theme.radii.md,
                  }}
                />
              ) : (
                <TextPostCover
                  seed={item.coverSeed ?? item.id}
                  text={item.caption}
                  variant="tile"
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: theme.radii.md,
                  }}
                />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            trendingQuery.isLoading || trendingQuery.isError
              ? null
              : renderEmptyState('No trending posts yet.')
          }
        />
      </SafeAreaView>
    );
  }

  if (activeTab === 'accounts') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <FlatList
          key="search-accounts"
          data={accountResultsMapped}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
            paddingTop: Math.max(theme.spacing.sm, insets.top ? 0 : theme.spacing.sm),
          }}
          ListHeaderComponent={searchHeader}
          renderItem={({ item }) => renderAccountRow(item)}
          ListEmptyComponent={
            accountsQuery.isLoading
              ? null
              : accountsQuery.isError
              ? renderErrorState('Unable to load accounts.', () => accountsQuery.refetch())
              : renderEmptyState('No accounts matched your search.')
          }
          ListFooterComponent={
            accountsQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (accountsQuery.hasNextPage && !accountsQuery.isFetchingNextPage) {
              accountsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.6}
        />
      </SafeAreaView>
    );
  }

  if (activeTab === 'posts') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <FlatList
          key="search-posts"
          data={postResultsMapped}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{
            paddingBottom: theme.spacing.xxl,
            paddingTop: Math.max(theme.spacing.sm, insets.top ? 0 : theme.spacing.sm),
          }}
          columnWrapperStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
          ListHeaderComponent={searchHeader}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openPost(item)}
              accessibilityRole="button"
              accessibilityLabel="Open post"
              style={{ flex: 1, marginBottom: theme.spacing.sm }}
            >
              {item.media?.uri ? (
                <Image
                  source={{ uri: item.media.uri }}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: theme.radii.md,
                  }}
                />
              ) : (
                <TextPostCover
                  seed={item.coverSeed ?? item.id}
                  text={item.caption}
                  variant="tile"
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: theme.radii.md,
                  }}
                />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            postsQuery.isLoading
              ? null
              : postsQuery.isError
              ? renderErrorState('Unable to load posts.', () => postsQuery.refetch())
              : renderEmptyState('No posts matched your search.')
          }
          ListFooterComponent={
            postsQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
              postsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.6}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <FlatList
        key="search-top"
        data={topPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{
          paddingBottom: theme.spacing.xxl,
          paddingTop: Math.max(theme.spacing.sm, insets.top ? 0 : theme.spacing.sm),
        }}
        columnWrapperStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
        ListHeaderComponent={topListHeader}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openPost(item)}
            accessibilityRole="button"
            accessibilityLabel="Open post"
            style={{ flex: 1, marginBottom: theme.spacing.sm }}
          >
            {item.media?.uri ? (
              <Image
                source={{ uri: item.media.uri }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: theme.radii.md,
                }}
              />
            ) : (
              <TextPostCover
                seed={item.coverSeed ?? item.id}
                text={item.caption}
                variant="tile"
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: theme.radii.md,
                }}
              />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          topQuery.isLoading
            ? null
            : topQuery.isError
            ? renderErrorState('Unable to load results.', () => topQuery.refetch())
            : renderEmptyState('No results matched your search.')
        }
      />
    </SafeAreaView>
  );
};
