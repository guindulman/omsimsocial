import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ImageBackground, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextPostCover } from '../../components/TextPostCover';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { ApiError } from '../../api/client';
import { followApi } from '../../api/followApi';
import { friendApi } from '../../api/friendApi';
import {
  isStoryMemory,
  mapMemoryToMomentoPost,
  mapMemoryToMomentoUser,
  normalizeMediaUrl,
} from '../../utils/momentoAdapter';
import { MomentoUser } from '../../types/momento';
import { useAuthStore } from '../../state/authStore';

type UserProfileParams = {
  userId?: number;
  user?: MomentoUser;
};

const tabs = [
  { label: 'Posts', value: 'posts' },
  { label: 'Reshares', value: 'reshares' },
  { label: 'Info', value: 'info' },
];

export const UserProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, user } = route.params as UserProfileParams;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const targetUserId = userId ?? (user?.id ? Number(user.id) : undefined);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posts');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const isSelf = Boolean(currentUserId && targetUserId === currentUserId);
  const recordedProfileViewsRef = useRef<Set<number>>(new Set());
  const headerHeight = 170;
  const headerOverlap = 56;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerStretch = 160;
  const headerScale = scrollY.interpolate({
    inputRange: [-headerStretch, 0, headerHeight],
    outputRange: [1.35, 1, 1],
    extrapolate: 'clamp',
  });
  const contentTopPadding = headerHeight;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-headerStretch, 0, headerHeight],
    outputRange: [0, 0, -headerHeight],
    extrapolate: 'clamp',
  });

  const blockStatusQuery = useQuery({
    queryKey: ['block-status', targetUserId],
    queryFn: () => api.blockStatus(targetUserId ?? 0),
    enabled: Boolean(targetUserId) && !isSelf,
  });

  const blockStatus = blockStatusQuery.data;
  const isBlocked = blockStatus?.blocked ?? false;
  const isBlockedByMe = blockStatus?.blocked_by_me ?? false;
  const canLoadProfile = Boolean(targetUserId) && (!blockStatusQuery.isSuccess || !isBlocked);

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

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendApi.friends(),
    enabled: Boolean(currentUserId),
  });

  const incomingFriendRequestsQuery = useQuery({
    queryKey: ['friend-requests', 'incoming'],
    queryFn: () => friendApi.incomingFriendRequests(),
    enabled: Boolean(currentUserId),
  });

  const outgoingFriendRequestsQuery = useQuery({
    queryKey: ['friend-requests', 'outgoing'],
    queryFn: () => friendApi.outgoingFriendRequests(),
    enabled: Boolean(currentUserId),
  });

  const memoriesQuery = useQuery({
    queryKey: ['user-profile', targetUserId],
    enabled: canLoadProfile,
    queryFn: async () => {
      const [publicResult, followingResult] = await Promise.allSettled([
        api.publicFeed(),
        api.followingFeed(),
      ]);
      const publicMemories =
        publicResult.status === 'fulfilled' ? publicResult.value.data ?? [] : [];
      const followingMemories =
        followingResult.status === 'fulfilled' ? followingResult.value.data ?? [] : [];
      const memories = [...publicMemories, ...followingMemories].filter(
        (memory) => memory.author?.id === targetUserId
      );
      return memories;
    },
  });

  const profileFeedQuery = useQuery({
    queryKey: ['user-profile-feed', targetUserId],
    enabled: canLoadProfile,
    queryFn: () => api.profileFeed(targetUserId ?? 0),
  });

  const privacyPrefs =
    memoriesQuery.data?.[0]?.author?.profile?.privacy_prefs ??
    profileFeedQuery.data?.data?.[0]?.author?.profile?.privacy_prefs ??
    null;
  const showFollowersPref = privacyPrefs?.show_followers;
  const showFollowingPref = privacyPrefs?.show_following;
  const canViewFollowers = isSelf || showFollowersPref !== false;
  const canViewFollowing = isSelf || showFollowingPref !== false;

  const followersListQuery = useQuery({
    queryKey: ['followers', 'list', targetUserId],
    queryFn: () => followApi.followers(targetUserId ?? 0),
    enabled: Boolean(targetUserId) && canViewFollowers && !isBlocked,
  });

  const followingListQuery = useQuery({
    queryKey: ['following', 'list', targetUserId],
    queryFn: () => followApi.following(targetUserId ?? 0),
    enabled: Boolean(targetUserId) && canViewFollowing && !isBlocked,
  });

  const memories = memoriesQuery.data ?? [];
  const author = memories[0]?.author;
  const derivedUser = useMemo(() => {
    if (memories.length && author) {
      return mapMemoryToMomentoUser(memories[0]);
    }
    return user;
  }, [author, memories, user]);

  const coverUrl = normalizeMediaUrl(author?.profile?.cover_url ?? null);
  const avatarUrl = derivedUser?.avatarUrl;
  const displayName = derivedUser?.name ?? 'Omsim Friend';
  const handle = derivedUser?.username ? `@${derivedUser.username}` : '@friend';
  const profileDetails = author?.profile ?? null;
  const bio = profileDetails?.bio ?? 'Follow to see more updates.';
  const trimmedBio = bio.trim();
  const canToggleBio = trimmedBio.length > 80;
  const city = profileDetails?.city ?? '';
  const websiteUrl = profileDetails?.website_url ?? '';
  const birthday = profileDetails?.birthday ?? '';
  const gender = profileDetails?.gender ?? '';
  const instagramUrl = profileDetails?.instagram_url ?? '';
  const facebookUrl = profileDetails?.facebook_url ?? '';
  const tiktokUrl = profileDetails?.tiktok_url ?? '';

  useEffect(() => {
    setIsBioExpanded(false);
  }, [targetUserId, bio]);

  useEffect(() => {
    if (!targetUserId || isSelf) {
      return;
    }
    if ((blockStatusQuery.isSuccess && isBlocked) || recordedProfileViewsRef.current.has(targetUserId)) {
      return;
    }
    if (!blockStatusQuery.isSuccess && !blockStatusQuery.isError) {
      return;
    }
    recordedProfileViewsRef.current.add(targetUserId);
    api
      .recordProfileView(targetUserId, { source: 'profile_link' })
      .catch(() => null);
  }, [
    blockStatusQuery.isError,
    blockStatusQuery.isSuccess,
    isBlocked,
    isSelf,
    targetUserId,
  ]);

  const feedEntries = useMemo(() => {
    const feedMemories = profileFeedQuery.data?.data ?? [];
    return feedMemories.map((memory) => {
      const mapped = mapMemoryToMomentoPost(memory);
      const primaryMedia = mapped.media;
      return {
        id: mapped.feedKey ?? mapped.id,
        memoryId: mapped.id,
        feedType: mapped.feedType ?? 'memory',
        imageUrl: primaryMedia?.uri ?? null,
        mediaType: primaryMedia?.type ?? null,
        caption: mapped.caption,
        mediaItems: mapped.mediaItems,
        coverSeed: mapped.coverSeed ?? mapped.id,
      };
    });
  }, [profileFeedQuery.data?.data]);

  const posts = useMemo(
    () => feedEntries.filter((entry) => entry.feedType !== 'reshare'),
    [feedEntries]
  );

  const reshares = useMemo(
    () => feedEntries.filter((entry) => entry.feedType === 'reshare'),
    [feedEntries]
  );

  const storyMemories = useMemo(() => {
    const now = Date.now();
    const seen = new Set<number>();
    return memories.filter((memory) => {
      if (!isStoryMemory(memory)) return false;
      if (seen.has(memory.id)) return false;
      seen.add(memory.id);
      const expiresAt = memory.expires_at
        ? Date.parse(memory.expires_at)
        : Number.isFinite(Date.parse(memory.created_at))
        ? Date.parse(memory.created_at) + 24 * 60 * 60 * 1000
        : null;
      return !expiresAt || expiresAt > now;
    });
  }, [memories]);

  const storyMemoryIds = useMemo(() => {
    return [...storyMemories]
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      .map((memory) => memory.id);
  }, [storyMemories]);

  const latestStory = storyMemories.length
    ? storyMemories.reduce(
        (latest, memory) =>
          Date.parse(memory.created_at) > Date.parse(latest.created_at) ? memory : latest,
        storyMemories[0]
      )
    : null;

  const followersAccessDenied =
    followersListQuery.error instanceof ApiError && followersListQuery.error.status === 403;
  const followingAccessDenied =
    followingListQuery.error instanceof ApiError && followingListQuery.error.status === 403;
  const showFollowersCount = !isBlocked && canViewFollowers && !followersAccessDenied;
  const showFollowingCount = !isBlocked && canViewFollowing && !followingAccessDenied;
  const followersCount = followersListQuery.data?.data?.length ?? 0;
  const followingCount = followingListQuery.data?.data?.length ?? 0;
  const followersValue = isBlocked
    ? '--'
    : !showFollowersCount
    ? 'Private'
    : followersListQuery.isLoading
    ? '...'
    : followersListQuery.isError
    ? '--'
    : `${followersCount}`;
  const followingValue = isBlocked
    ? '--'
    : !showFollowingCount
    ? 'Private'
    : followingListQuery.isLoading
    ? '...'
    : followingListQuery.isError
    ? '--'
    : `${followingCount}`;

  const stats = [
    { label: 'Posts', value: `${posts.length}` },
    {
      label: 'Followers',
      value: followersValue,
      onPress: showFollowersCount
        ? () => {
            if (!targetUserId) return;
            navigation.navigate(
              'FollowList' as never,
              { userId: targetUserId, type: 'followers', userName: displayName } as never
            );
          }
        : undefined,
    },
    {
      label: 'Following',
      value: followingValue,
      onPress: showFollowingCount
        ? () => {
            if (!targetUserId) return;
            navigation.navigate(
              'FollowList' as never,
              { userId: targetUserId, type: 'following', userName: displayName } as never
            );
          }
        : undefined,
    },
  ];

  const following = followingQuery.data?.data ?? [];
  const outgoingFollowRequests = outgoingFollowRequestsQuery.data?.data ?? [];
  const friends = friendsQuery.data?.data ?? [];
  const incomingFriendRequests = incomingFriendRequestsQuery.data?.data ?? [];
  const outgoingFriendRequests = outgoingFriendRequestsQuery.data?.data ?? [];

  const isFollowing = Boolean(
    targetUserId && following.some((followedUser) => followedUser.id === targetUserId)
  );
  const outgoingFollowRequest = targetUserId
    ? outgoingFollowRequests.find((request) => request.target?.id === targetUserId)
    : undefined;
  const followState = isFollowing ? 'following' : outgoingFollowRequest ? 'requested' : 'none';
  const friendshipEntry = targetUserId
    ? friends.find((friendship) => friendship.user?.id === targetUserId)
    : undefined;
  const incomingFriendRequest = targetUserId
    ? incomingFriendRequests.find((request) => request.from_user?.id === targetUserId)
    : undefined;
  const outgoingFriendRequest = targetUserId
    ? outgoingFriendRequests.find((request) => request.to_user?.id === targetUserId)
    : undefined;
  const friendState = friendshipEntry
    ? 'friends'
    : incomingFriendRequest
    ? 'incoming'
    : outgoingFriendRequest
    ? 'outgoing'
    : 'none';
  const isVerifiedFriend = Boolean(friendshipEntry?.verified_at);

  const refreshFollowState = () => {
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    if (targetUserId) {
      queryClient.invalidateQueries({ queryKey: ['followers', 'list', targetUserId] });
    }
  };

  const refreshFriendState = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
  };

  const followMutation = useMutation({
    mutationFn: () => followApi.follow(targetUserId ?? 0),
    onSuccess: refreshFollowState,
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(targetUserId ?? 0),
    onSuccess: refreshFollowState,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: () => friendApi.sendFriendRequest(targetUserId ?? 0),
    onSuccess: refreshFriendState,
  });

  const confirmFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.confirmFriendRequest(id),
    onSuccess: refreshFriendState,
  });

  const declineFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.declineFriendRequest(id),
    onSuccess: refreshFriendState,
  });

  const cancelFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.cancelFriendRequest(id),
    onSuccess: refreshFriendState,
  });

  const unfriendMutation = useMutation({
    mutationFn: () => friendApi.unfriend(targetUserId ?? 0),
    onSuccess: refreshFriendState,
  });

  const blockMutation = useMutation({
    mutationFn: () => api.blockUser(targetUserId ?? 0),
    onSuccess: () => {
      if (!targetUserId) return;
      queryClient.setQueryData(['block-status', targetUserId], {
        blocked: true,
        blocked_by_me: true,
        blocked_me: false,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile-feed', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
    onError: () => {
      Alert.alert('Unable to block', 'Please try again.');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.unblockUser(targetUserId ?? 0),
    onSuccess: () => {
      if (!targetUserId) return;
      queryClient.setQueryData(['block-status', targetUserId], {
        blocked: false,
        blocked_by_me: false,
        blocked_me: false,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile-feed', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
    onError: () => {
      Alert.alert('Unable to unblock', 'Please try again.');
    },
  });

  const handleFollowingPress = () => {
    if (!targetUserId) return;
    Alert.alert('Following', `Manage your follow for ${displayName}.`, [
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: () => unfollowMutation.mutate(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleFriendsPress = () => {
    if (!targetUserId) return;
    Alert.alert('Friends', `Manage friendship with ${displayName}.`, [
      {
        text: 'Verify in person',
        onPress: () => navigation.navigate('HandshakeQR' as never),
      },
      {
        text: 'Unfriend',
        style: 'destructive',
        onPress: () => unfriendMutation.mutate(),
      },
      {
        text: `Block ${displayName}`,
        style: 'destructive',
        onPress: () => handleBlockPress(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBlockPress = () => {
    if (!targetUserId || blockMutation.isPending) return;
    Alert.alert('Block user', `Block ${displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => blockMutation.mutate(),
      },
    ]);
  };

  const handleUnblockPress = () => {
    if (!targetUserId || unblockMutation.isPending) return;
    Alert.alert('Unblock user', `Unblock ${displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => unblockMutation.mutate(),
      },
    ]);
  };

  if (!isSelf && blockStatusQuery.isSuccess && isBlocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <BackButton />
        <View style={{ padding: theme.spacing.lg }}>
          <Card style={{ padding: theme.spacing.md }}>
            <AppText variant="subtitle">
              {isBlockedByMe ? `You blocked ${displayName}` : 'Profile unavailable'}
            </AppText>
            <AppText tone="secondary">
              {isBlockedByMe
                ? 'Unblock to view their profile or send messages.'
                : 'This profile is not available.'}
            </AppText>
            {isBlockedByMe ? (
              <Button
                label={unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
                variant="secondary"
                size="sm"
                onPress={handleUnblockPress}
                disabled={unblockMutation.isPending}
                style={{ marginTop: theme.spacing.sm }}
              />
            ) : null}
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <BackButton />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          height: headerHeight,
          transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
        }}
      >
        {coverUrl ? (
          <ImageBackground
            source={{ uri: coverUrl }}
            style={{ height: '100%', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                height: 64,
                backgroundColor: 'rgba(0,0,0,0.25)',
                padding: theme.spacing.md,
              }}
            >
              <AppText variant="subtitle" style={{ color: '#fff' }}>
                {displayName}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {handle}
              </AppText>
            </View>
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: '100%', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                height: 64,
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: theme.spacing.md,
              }}
            >
              <AppText variant="subtitle" style={{ color: '#fff' }}>
                {displayName}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {handle}
              </AppText>
            </View>
          </LinearGradient>
        )}
      </Animated.View>
      <Animated.FlatList
        data={
          isBlocked
            ? []
            : activeTab === 'posts'
            ? posts
            : activeTab === 'reshares'
            ? reshares
            : []
        }
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        style={{ zIndex: 6 }}
        contentContainerStyle={{
          paddingTop: contentTopPadding,
          paddingBottom: theme.spacing.xxl,
        }}
        columnWrapperStyle={{ gap: theme.spacing.sm }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        ListEmptyComponent={
            isBlocked ? (
              <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
                <Card>
                  <AppText variant="subtitle">
                    {isBlockedByMe ? `You blocked ${displayName}` : 'Profile unavailable'}
                  </AppText>
                  <AppText tone="secondary">
                    {isBlockedByMe
                      ? 'Unblock to view their moments.'
                      : 'This profile is not available.'}
                  </AppText>
                </Card>
              </View>
            ) : activeTab === 'posts' || activeTab === 'reshares' ? (
            profileFeedQuery.isLoading ? null : (
              <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
                <Card>
                  <AppText variant="subtitle">
                    {activeTab === 'reshares' ? 'No reshares yet' : 'No public moments yet'}
                  </AppText>
                  <AppText tone="secondary">
                    {activeTab === 'reshares' ? 'Check back later.' : 'Check back later or follow.'}
                  </AppText>
                </Card>
              </View>
            )
          ) : null
        }
        ListHeaderComponent={
          <View>
            <View style={{ padding: theme.spacing.lg, marginTop: -headerOverlap }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
                <Pressable
                  onPress={() => {
                    if (!storyMemoryIds.length || !latestStory) return;
                    navigation.navigate(
                      'StoryViewer' as never,
                      { memoryId: latestStory.id, memoryIds: storyMemoryIds } as never
                    );
                  }}
                  accessibilityRole={latestStory ? 'button' : undefined}
                  accessibilityLabel={latestStory ? `View ${displayName} story` : undefined}
                >
                  <Avatar
                    name={displayName}
                    size={80}
                    imageSource={avatarUrl ? { uri: avatarUrl } : undefined}
                    showRing={Boolean(latestStory)}
                    ringColors={theme.gradients.accent}
                  />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                    <AppText variant="title">{displayName}</AppText>
                    {isVerifiedFriend ? <Chip label="Verified" tone="accent" /> : null}
                  </View>
                  <AppText
                    tone="secondary"
                    numberOfLines={isBioExpanded ? undefined : 2}
                    ellipsizeMode="tail"
                  >
                    {bio}
                  </AppText>
                  {canToggleBio ? (
                    <Pressable
                      onPress={() => setIsBioExpanded((current) => !current)}
                      accessibilityRole="button"
                      accessibilityLabel={isBioExpanded ? 'Collapse bio' : 'Expand bio'}
                      style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start' }}
                    >
                      <AppText variant="caption" tone="accent">
                        {isBioExpanded ? 'Less' : 'More'}
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                  <Feather name="map-pin" size={16} color={theme.colors.textSecondary} />
                  <AppText variant="caption">{city}</AppText>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: theme.spacing.lg,
                }}
              >
                {stats.map((stat) => {
                  const isInteractive = Boolean(stat.onPress);
                  return (
                    <Pressable
                      key={stat.label}
                      onPress={stat.onPress}
                      disabled={!isInteractive}
                      accessibilityRole={isInteractive ? 'button' : undefined}
                      accessibilityLabel={isInteractive ? `${stat.label} ${stat.value}` : undefined}
                      hitSlop={isInteractive ? 8 : undefined}
                      style={({ pressed }) => [
                        { alignItems: 'center', paddingVertical: theme.spacing.xs },
                        isInteractive && pressed ? { opacity: 0.6 } : null,
                      ]}
                    >
                      <AppText variant="subtitle">{stat.value}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {stat.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {!isSelf ? (
                isBlocked ? (
                  <View style={{ marginTop: theme.spacing.lg }}>
                    <Card style={{ padding: theme.spacing.md }}>
                      <AppText variant="subtitle">
                        {isBlockedByMe ? `You blocked ${displayName}` : 'Profile unavailable'}
                      </AppText>
                      <AppText tone="secondary">
                        {isBlockedByMe
                          ? 'Unblock to view their profile or send messages.'
                          : 'This profile is not available.'}
                      </AppText>
                      {isBlockedByMe ? (
                        <Button
                          label={unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
                          variant="secondary"
                          size="sm"
                          onPress={handleUnblockPress}
                          disabled={unblockMutation.isPending}
                          style={{ marginTop: theme.spacing.sm }}
                        />
                      ) : null}
                    </Card>
                  </View>
                ) : (
                  <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                      {followState === 'following' ? (
                        <Button
                          label="Following"
                          variant="secondary"
                          onPress={handleFollowingPress}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      ) : followState === 'requested' ? (
                        <Button label="Requested" variant="secondary" disabled size="sm" style={{ flex: 1 }} />
                      ) : (
                        <Button
                          label="Follow"
                          onPress={() => {
                            if (!targetUserId) return;
                            followMutation.mutate();
                          }}
                          iconElement={<Feather name="user-plus" size={16} color={theme.colors.textPrimary} />}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      )}

                      <Button
                        label="Message"
                        variant="secondary"
                        onPress={() => {
                          if (!targetUserId) return;
                          navigation.navigate(
                            'Chat' as never,
                            {
                              conversationId: `direct-${targetUserId}`,
                              user: derivedUser,
                              userId: targetUserId,
                            } as never
                          );
                        }}
                        size="sm"
                        style={{ flex: 1 }}
                      />

                      {friendState === 'friends' ? (
                        <Button
                          label="Friends"
                          variant="secondary"
                          onPress={handleFriendsPress}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      ) : friendState === 'incoming' ? (
                        <Button
                          label="Confirm"
                          onPress={() =>
                            incomingFriendRequest && confirmFriendRequestMutation.mutate(incomingFriendRequest.id)
                          }
                          disabled={!incomingFriendRequest}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      ) : friendState === 'outgoing' ? (
                        <Button label="Requested" variant="secondary" disabled size="sm" style={{ flex: 1 }} />
                      ) : (
                        <Button
                          label="Add"
                          variant="secondary"
                          onPress={() => {
                            if (!targetUserId) return;
                            sendFriendRequestMutation.mutate();
                          }}
                          iconElement={<Feather name="user-plus" size={16} color={theme.colors.textPrimary} />}
                          size="sm"
                          style={{ flex: 1 }}
                        />
                      )}
                    </View>

                    {friendState === 'incoming' ? (
                      <Button
                        label="Decline"
                        variant="secondary"
                        onPress={() =>
                          incomingFriendRequest && declineFriendRequestMutation.mutate(incomingFriendRequest.id)
                        }
                        disabled={!incomingFriendRequest}
                      />
                    ) : friendState === 'outgoing' ? (
                      <Button
                        label="Cancel"
                        variant="ghost"
                        onPress={() =>
                          outgoingFriendRequest && cancelFriendRequestMutation.mutate(outgoingFriendRequest.id)
                        }
                        disabled={!outgoingFriendRequest}
                      />
                    ) : null}

                  </View>
                )
              ) : null}

              <View style={{ marginTop: theme.spacing.lg }}>
                <SegmentedControl
                  options={tabs}
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as string)}
                />
              </View>

              {activeTab === 'info' ? (
                <Card style={{ marginTop: theme.spacing.lg }}>
                  <View style={{ gap: theme.spacing.sm }}>
                    {city ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="map-pin" size={16} color={theme.colors.textSecondary} />
                        <AppText>{city}</AppText>
                      </View>
                    ) : null}
                    {birthday ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="calendar" size={16} color={theme.colors.textSecondary} />
                        <AppText>{birthday}</AppText>
                      </View>
                    ) : null}
                    {gender ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="user" size={16} color={theme.colors.textSecondary} />
                        <AppText>{gender}</AppText>
                      </View>
                    ) : null}
                    {websiteUrl ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="globe" size={16} color={theme.colors.textSecondary} />
                        <AppText>{websiteUrl.replace(/^https?:\/\//, '')}</AppText>
                      </View>
                    ) : null}
                    {instagramUrl ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="instagram" size={16} color={theme.colors.textSecondary} />
                        <AppText>{instagramUrl.replace(/^https?:\/\//, '')}</AppText>
                      </View>
                    ) : null}
                    {facebookUrl ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="facebook" size={16} color={theme.colors.textSecondary} />
                        <AppText>{facebookUrl.replace(/^https?:\/\//, '')}</AppText>
                      </View>
                    ) : null}
                    {tiktokUrl ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="music" size={16} color={theme.colors.textSecondary} />
                        <AppText>{tiktokUrl.replace(/^https?:\/\//, '')}</AppText>
                      </View>
                    ) : null}
                    {author?.email ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="mail" size={16} color={theme.colors.textSecondary} />
                        <AppText>{author.email}</AppText>
                      </View>
                    ) : null}
                    {author?.phone ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="phone" size={16} color={theme.colors.textSecondary} />
                        <AppText>{author.phone}</AppText>
                      </View>
                    ) : null}
                    {!city &&
                    !birthday &&
                    !gender &&
                    !websiteUrl &&
                    !instagramUrl &&
                    !facebookUrl &&
                    !tiktokUrl &&
                    !author?.email &&
                    !author?.phone ? (
                      <AppText tone="secondary">No public info yet.</AppText>
                    ) : null}
                  </View>
                </Card>
              ) : null}

            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1, marginBottom: theme.spacing.sm }}
            onPress={() => {
              if (item.imageUrl && item.mediaType) {
                navigation.navigate(
                  'MediaViewer' as never,
                  {
                    uri: item.imageUrl,
                    type: item.mediaType,
                    caption: item.caption,
                    mediaItems: item.mediaItems?.length ? item.mediaItems : undefined,
                    initialIndex: 0,
                  } as never
                );
                return;
              }
              navigation.navigate(
                'PostDetail' as never,
                { memoryId: Number(item.memoryId) } as never
              );
            }}
            accessibilityRole="button"
            accessibilityLabel={item.imageUrl ? 'Open media fullscreen' : 'Open post'}
          >
            {item.imageUrl ? (
              <>
                <ImageBackground
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', aspectRatio: 1 }}
                  imageStyle={{ borderRadius: theme.radii.md }}
                />
                {item.mediaType === 'video' ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: [{ translateX: -14 }, { translateY: -14 }],
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="play" size={12} color={theme.colors.surface} />
                  </View>
                ) : null}
              </>
            ) : (
              <TextPostCover
                seed={item.coverSeed ?? item.id}
                text={item.caption}
                variant="tile"
                style={{ width: '100%', aspectRatio: 1, borderRadius: theme.radii.md }}
              />
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};
