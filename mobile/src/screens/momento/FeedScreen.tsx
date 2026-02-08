import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useScrollToTop } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { StoryItem } from '../../components/StoryItem';
import { PostItem } from '../../components/PostItem';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { followApi } from '../../api/followApi';
import { Memory } from '../../api/types';
import { MomentoPost, MomentoStory, MomentoUser } from '../../types/momento';
import {
  dedupeMemories,
  isStoryMemory,
  mapMemoryToMomentoPost,
  mapMemoryToMomentoUser,
} from '../../utils/momentoAdapter';
import { buildSharePostPayload } from '../../utils/share';
import { useAuthStore } from '../../state/authStore';
import { firstName } from '../../utils/name';

export const FeedScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 56;
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<MomentoPost>>(null);
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<MomentoPost[]>([]);
  const [stories, setStories] = useState<MomentoStory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [optionsPost, setOptionsPost] = useState<MomentoPost | null>(null);
  const [showReportReasons, setShowReportReasons] = useState(false);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUser = useAuthStore((state) => state.user);
  const authToken = useAuthStore((state) => state.token);

  useScrollToTop(listRef);


  const unreadMessagesQuery = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => api.messageUnreadCount(),
    enabled: Boolean(authToken),
    refetchInterval: 15000,
  });

  const unreadMessages = unreadMessagesQuery.data?.total ?? 0;

  const feedQuery = useQuery({
    queryKey: ['momento-feed'],
    queryFn: async () => {
      const [homeResult, circlesResult, publicResult, followingResult, mineResult] =
        await Promise.allSettled([
          api.homeFeed(),
          api.listCircles(),
          api.publicFeed(),
          api.followingFeed(),
          api.myMemories(),
        ]);

      const homeMemories = homeResult.status === 'fulfilled' ? homeResult.value.data ?? [] : [];
      const feedPosts = homeMemories.map(mapMemoryToMomentoPost);

      const circles = circlesResult.status === 'fulfilled' ? circlesResult.value.data : [];
      const publicMemories =
        publicResult.status === 'fulfilled' ? publicResult.value.data ?? [] : [];
      const followingMemories =
        followingResult.status === 'fulfilled' ? followingResult.value.data ?? [] : [];
      const myMemories = mineResult.status === 'fulfilled' ? mineResult.value.data ?? [] : [];

      const circleFeeds = circles.length
        ? await Promise.allSettled(circles.map((circle) => api.circleFeed(circle.id)))
        : [];
      const circleMemories = circleFeeds.flatMap((feed) =>
        feed.status === 'fulfilled' ? feed.value.memories ?? [] : []
      );

      const storySourceMemories = [
        ...publicMemories,
        ...followingMemories,
        ...circleMemories,
        ...myMemories.map((memory) => {
          if (memory.author || !currentUser) return memory;
          return { ...memory, author: currentUser as any };
        }),
      ];
      const now = Date.now();
      const seenStoryIds = new Set<number>();
      const storyExpiry = (memory: Memory) => {
        if (memory.expires_at) return memory.expires_at;
        const createdAtMs = Date.parse(memory.created_at);
        if (!Number.isFinite(createdAtMs)) return null;
        return new Date(createdAtMs + 24 * 60 * 60 * 1000).toISOString();
      };
      const activeStoryMemories = storySourceMemories.filter((memory) => {
        if (!isStoryMemory(memory)) return false;
        if (seenStoryIds.has(memory.id)) return false;
        const expiresAt = storyExpiry(memory);
        if (!expiresAt) return false;
        seenStoryIds.add(memory.id);
        return Date.parse(expiresAt) > now;
      });
      const storyGroups = new Map<
        string,
        { user: MomentoUser; memories: Memory[]; expiresAt: string | null }
      >();
      activeStoryMemories.forEach((memory) => {
        const authorId = memory.author?.id ?? memory.id;
        const key = String(authorId);
        const entry =
          storyGroups.get(key) ?? {
            user: mapMemoryToMomentoUser(memory),
            memories: [],
            expiresAt: null,
          };
        entry.memories.push(memory);
        const expiresAt = storyExpiry(memory);
        if (expiresAt) {
          if (!entry.expiresAt || Date.parse(expiresAt) > Date.parse(entry.expiresAt)) {
            entry.expiresAt = expiresAt;
          }
        }
        storyGroups.set(key, entry);
      });
      const storyList = Array.from(storyGroups.values()).map((entry, index) => {
        const sortedMemories = entry.memories.sort(
          (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
        );
        const memoryIds = sortedMemories.map((memory) => memory.id);
        const latestMemory = sortedMemories[sortedMemories.length - 1];
        return {
          id: `story-${entry.user.id}`,
          user: entry.user,
          memoryId: latestMemory?.id,
          memoryIds,
          expiresAt: entry.expiresAt,
          isLive: index % 4 === 0,
        } as MomentoStory;
      });
      const orderedStories =
        currentUserId && storyList.length
          ? [
              ...storyList.filter((story) => story.user.id === String(currentUserId)),
              ...storyList.filter((story) => story.user.id !== String(currentUserId)),
            ]
          : storyList;

      const hasAnySuccess =
        homeResult.status === 'fulfilled' ||
        publicResult.status === 'fulfilled' ||
        followingResult.status === 'fulfilled' ||
        circleFeeds.some((feed) => feed.status === 'fulfilled') ||
        mineResult.status === 'fulfilled';

      if (!hasAnySuccess) {
        throw new Error('Unable to load feed data.');
      }

      return {
        posts: feedPosts,
        stories: orderedStories,
      };
    },
  });

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

  useEffect(() => {
    if (feedQuery.data?.posts) {
      const seen = new Set<string>();
      const deduped = feedQuery.data.posts.filter((post) => {
        const key = post.feedKey ?? post.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPosts(deduped);
    }
  }, [feedQuery.data]);

  const pruneStories = useCallback((items: MomentoStory[]) => {
    const now = Date.now();
    return items.filter((story) => {
      if (!story.expiresAt) return true;
      const expiresMs = Date.parse(story.expiresAt);
      if (!Number.isFinite(expiresMs)) return false;
      return expiresMs > now;
    });
  }, []);

  useEffect(() => {
    if (feedQuery.data?.stories) {
      setStories(pruneStories(feedQuery.data.stories));
    }
  }, [feedQuery.data?.stories, pruneStories]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStories((current) => pruneStories(current));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setStories((current) => pruneStories(current));
    }, [pruneStories])
  );

  const boostMutation = useMutation({
    mutationFn: (memoryId: number) => api.reactMemory(memoryId, 'heart'),
  });

  const refreshFollowState = () => {
    queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
  };

  const followMutation = useMutation({
    mutationFn: (targetId: number) => followApi.follow(targetId),
    onSuccess: refreshFollowState,
  });

  const unreactMutation = useMutation({
    mutationFn: (memoryId: number) => api.unreactMemory(memoryId, 'heart'),
  });

  const saveMutation = useMutation({
    mutationFn: (memoryId: number) => api.saveMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultAdopted'] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (memoryId: number) => api.unsaveMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultAdopted'] });
    },
  });

  const reshareMutation = useMutation({
    mutationFn: (memoryId: number) => api.reshareMemory(memoryId),
  });

  const unreshareMutation = useMutation({
    mutationFn: (memoryId: number) => api.unreshareMemory(memoryId),
  });

  const handleBoost = (postId: string) => {
    const memoryId = Number(postId);
    const target = posts.find((post) => post.id === postId);
    if (Number.isNaN(memoryId)) return;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post
      )
    );
    const rollback = () => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
              }
            : post
        )
      );
    };
    if (target?.liked) {
      unreactMutation.mutate(memoryId, { onError: rollback });
    } else {
      boostMutation.mutate(memoryId, { onError: rollback });
    }
  };

  const handleBuild = (postId: string) => {
    navigation.navigate('PostDetail' as never, { memoryId: Number(postId), focusComposer: true } as never);
  };

  const handleSave = (postId: string) => {
    const memoryId = Number(postId);
    const target = posts.find((post) => post.id === postId);
    if (Number.isNaN(memoryId)) return;
    const delta = target?.saved ? -1 : 1;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              saved: !post.saved,
              saves: Math.max(0, (post.saves ?? 0) + delta),
            }
          : post
      )
    );
    const rollback = () => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                saved: !post.saved,
                saves: Math.max(0, (post.saves ?? 0) - delta),
              }
            : post
        )
      );
    };
    if (target?.saved) {
      unsaveMutation.mutate(memoryId, { onError: rollback });
    } else {
      saveMutation.mutate(memoryId, { onError: rollback });
    }
  };

  const handleReshare = (postId: string) => {
    const memoryId = Number(postId);
    const target = posts.find((post) => post.id === postId);
    if (Number.isNaN(memoryId)) return;
    const delta = target?.reshared ? -1 : 1;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              reshared: !post.reshared,
              reshares: Math.max(0, (post.reshares ?? 0) + delta),
            }
          : post
      )
    );
    const rollback = () => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                reshared: !post.reshared,
                reshares: Math.max(0, (post.reshares ?? 0) - delta),
              }
            : post
        )
      );
    };
    if (target?.reshared) {
      unreshareMutation.mutate(memoryId, { onError: rollback });
    } else {
      reshareMutation.mutate(memoryId, { onError: rollback });
    }
  };

  const handleShare = (post: MomentoPost) => {
    navigation.navigate(
      'SharePost' as never,
      { post: buildSharePostPayload(post) } as never
    );
  };

  const handleShowLikes = async (postId: string) => {
    const memoryId = Number(postId);
    if (Number.isNaN(memoryId)) return;
    try {
      const response = await api.listMemoryHearts(memoryId);
      const names = response.data
        ?.map((user) => user.name || user.username || 'Omsim member')
        .filter(Boolean) ?? [];
      if (!names.length) {
        return;
      }
      const preview = names.slice(0, 20).join(', ');
      const suffix = names.length > 20 ? ` +${names.length - 20} more` : '';
      Alert.alert('Loved by', `${preview}${suffix}`);
    } catch {
      Alert.alert('Unable to load likes', 'Please try again in a moment.');
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const handleOpenMedia = (
    post: MomentoPost,
    media?: MomentoPost['media'],
    index?: number
  ) => {
    const mediaItems = post.mediaItems?.length ? post.mediaItems : post.media ? [post.media] : [];
    const target = media ?? mediaItems[0];
    if (!target) return;
    const initialIndex =
      typeof index === 'number' && index >= 0 ? Math.min(index, mediaItems.length - 1) : 0;
    navigation.navigate(
      'MediaViewer' as never,
      {
        uri: target.uri,
        type: target.type,
        caption: post.caption,
        mediaItems,
        initialIndex,
      } as never
    );
  };

  const handleOpenProfile = (post: MomentoPost) => {
    const userId = Number(post.user.id);
    navigation.navigate(
      'UserProfile' as never,
      {
        userId: Number.isNaN(userId) ? undefined : userId,
        user: post.user,
      } as never
    );
  };

  const handleOpenTaggedProfile = (user: MomentoUser) => {
    const userId = Number(user.id);
    navigation.navigate(
      'UserProfile' as never,
      {
        userId: Number.isNaN(userId) ? undefined : userId,
        user,
      } as never
    );
  };

  const handleShowTaggedUsers = (users: MomentoUser[]) => {
    const names = users
      .map((userItem) => firstName(userItem.name, userItem.username))
      .filter(Boolean);
    if (!names.length) {
      Alert.alert('Tagged friends', 'No tagged friends yet.');
      return;
    }
    Alert.alert('Tagged friends', names.join('\n'));
  };

  const handleOpenStoryProfile = (story: MomentoStory) => {
    const userId = Number(story.user.id);
    navigation.navigate(
      'UserProfile' as never,
      {
        userId: Number.isNaN(userId) ? undefined : userId,
        user: story.user,
      } as never
    );
  };

  const reportReasons = [
    { label: 'Spam', value: 'spam' },
    { label: 'Abuse', value: 'abuse' },
    { label: 'Harassment', value: 'harassment' },
    { label: 'Violence', value: 'violence' },
    { label: 'Nudity', value: 'nudity' },
    { label: 'Other', value: 'other' },
  ];

  const closeOptions = () => {
    setShowReportReasons(false);
    setOptionsPost(null);
  };

  const reportWithReason = async (post: MomentoPost, reason: string) => {
    const memoryId = Number(post.id);
    if (Number.isNaN(memoryId)) return;
    try {
      await api.report({
        target_type: 'memory',
        target_id: memoryId,
        reason,
      });
      Alert.alert('Report sent', 'Thanks for letting us know.');
    } catch {
      Alert.alert('Report failed', 'Unable to send your report right now.');
    }
  };

  const handleDeletePost = (post: MomentoPost) => {
    const memoryId = Number(post.id);
    Alert.alert('Delete post', 'This will remove it from your profile.', [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (Number.isNaN(memoryId)) return;
          const previous = posts;
          setPosts((prev) => prev.filter((item) => item.id !== post.id));
          try {
            await api.deleteMemory(memoryId);
            queryClient.invalidateQueries({ queryKey: ['profile-memories'] });
          } catch {
            setPosts(previous);
            Alert.alert('Unable to delete', 'Please try again.');
          } finally {
            closeOptions();
          }
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: closeOptions },
    ]);
  };

  const handleHidePost = async (post: MomentoPost) => {
    const memoryId = Number(post.id);
    if (Number.isNaN(memoryId)) return;
    const previous = posts;
    setPosts((prev) => prev.filter((item) => item.id !== post.id));
    try {
      await api.hideMemory(memoryId);
    } catch {
      setPosts(previous);
      Alert.alert('Unable to hide', 'Please try again.');
    } finally {
      closeOptions();
    }
  };

  const handleMuteUser = async (post: MomentoPost) => {
    const authorId = Number(post.user.id);
    if (!Number.isFinite(authorId)) return;
    const previous = posts;
    setPosts((prev) => prev.filter((item) => item.user.id !== post.user.id));
    try {
      await api.muteUser(authorId);
    } catch {
      setPosts(previous);
      Alert.alert('Unable to mute', 'Please try again.');
    } finally {
      closeOptions();
    }
  };

  const handlePostOptions = (post: MomentoPost) => {
    const authorId = Number(post.user.id);
    const canMute = Number.isFinite(authorId) && authorId !== currentUserId;
    const isAuthor = Number.isFinite(authorId) && authorId === currentUserId;

    if (Platform.OS === 'android') {
      setOptionsPost(post);
      return;
    }

    const confirmDelete = () => handleDeletePost(post);

    Alert.alert('Post options', 'Choose an action for this post.', [
      ...(isAuthor
        ? [
            {
              text: 'Delete',
              style: 'destructive',
              onPress: confirmDelete,
            },
          ]
        : []),
      {
        text: 'Hide',
        style: 'destructive',
        onPress: () => handleHidePost(post),
      },
      ...(canMute
        ? [
            {
              text: 'Mute user',
              onPress: () => handleMuteUser(post),
            },
          ]
        : []),
      {
        text: 'Report',
        onPress: () =>
          Alert.alert('Report post', 'Choose a reason', [
            { text: 'Spam', onPress: () => reportWithReason(post, 'spam') },
            { text: 'Abuse', onPress: () => reportWithReason(post, 'abuse') },
            { text: 'Harassment', onPress: () => reportWithReason(post, 'harassment') },
            { text: 'Violence', onPress: () => reportWithReason(post, 'violence') },
            { text: 'Nudity', onPress: () => reportWithReason(post, 'nudity') },
            { text: 'Other', onPress: () => reportWithReason(post, 'other') },
            { text: 'Cancel', style: 'cancel' },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await feedQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <AppHeader
          onPressMessages={() => navigation.navigate('Messages' as never)}
          unreadCount={unreadMessages}
        />
      </Animated.View>
      <Animated.FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.feedKey ?? item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
        }}
        scrollsToTop
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.md, marginTop: theme.spacing.xs }}>
            <FlatList
              data={stories}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: theme.spacing.sm, gap: theme.spacing.sm }}
              renderItem={({ item }) => (
                <StoryItem
                  story={item}
                  onPressStory={() => {
                    if (item.memoryIds?.length) {
                      navigation.navigate(
                        'StoryViewer' as never,
                        { memoryId: item.memoryId, memoryIds: item.memoryIds } as never
                      );
                      return;
                    }
                    if (!item.memoryId) return;
                    navigation.navigate('StoryViewer' as never, { memoryId: item.memoryId } as never);
                  }}
                  onPressProfile={() => handleOpenStoryProfile(item)}
                />
              )}
            />
            {feedQuery.isLoading ? (
              <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : feedQuery.isError ? (
              <View style={{ paddingVertical: theme.spacing.lg }}>
                <AppText tone="urgent">Unable to load your feed.</AppText>
              </View>
            ) : null}
          </View>
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => {
          const targetId = Number(item.user.id);
          const canShowFollow =
            Boolean(currentUserId) &&
            Number.isFinite(targetId) &&
            targetId !== currentUserId;
          const followState = canShowFollow ? getFollowState(targetId) : null;
          const handleFollow = () => {
            if (!followState || followState.state !== 'none') return;
            followMutation.mutate(targetId);
          };

          return (
            <PostItem
              post={item}
              followState={followState?.state}
              onFollow={followState?.state === 'none' ? handleFollow : undefined}
              onPressUser={() => handleOpenProfile(item)}
              onShowResharers={() =>
                navigation.navigate('Resharers' as never, { memoryId: Number(item.id) } as never)
              }
              onPressTaggedUser={(user) => handleOpenTaggedProfile(user)}
              onShowTaggedUsers={(users) => handleShowTaggedUsers(users)}
              onPressMedia={(media, index) => handleOpenMedia(item, media, index)}
              onLike={() => handleBoost(item.id)}
              onBuild={() => handleBuild(item.id)}
              onComment={() =>
                navigation.navigate('PostDetail' as never, { memoryId: Number(item.id) } as never)
              }
              onSave={() => handleSave(item.id)}
              onReshare={() => handleReshare(item.id)}
              onShare={() => handleShare(item)}
              onShowLikes={() => handleShowLikes(item.id)}
              onMore={() => handlePostOptions(item)}
            />
          );
        }}
        ListEmptyComponent={
          feedQuery.isLoading ? null : (
            <View
              style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.card,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
              }}
            >
              <AppText variant="subtitle">No moments yet.</AppText>
              <AppText tone="secondary">
                Share a public moment or create a circle to get started.
              </AppText>
            </View>
          )
        }
      />
      <Modal
        visible={Boolean(optionsPost)}
        transparent
        animationType="slide"
        onRequestClose={closeOptions}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: theme.colors.overlay,
          }}
          onPress={closeOptions}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.card,
              borderTopRightRadius: theme.radii.card,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              paddingBottom: theme.spacing.xl,
              gap: theme.spacing.sm,
            }}
          >
            {showReportReasons ? (
              <>
                <AppText variant="subtitle">Report post</AppText>
                {reportReasons.map((reason) => (
                  <Pressable
                    key={reason.value}
                    onPress={async () => {
                      if (!optionsPost) return;
                      await reportWithReason(optionsPost, reason.value);
                      closeOptions();
                    }}
                    style={{
                      paddingVertical: theme.spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.borderSubtle,
                    }}
                  >
                    <AppText>{reason.label}</AppText>
                  </Pressable>
                ))}
                <Button label="Cancel" variant="secondary" onPress={closeOptions} />
              </>
            ) : (
              <>
                <AppText variant="subtitle">Post options</AppText>
                {optionsPost &&
                Number(optionsPost.user.id) === currentUserId ? (
                  <Pressable
                    onPress={() => handleDeletePost(optionsPost)}
                    style={{ paddingVertical: theme.spacing.sm }}
                  >
                    <AppText tone="urgent">Delete</AppText>
                  </Pressable>
                ) : null}
                {optionsPost ? (
                  <Pressable
                    onPress={() => handleHidePost(optionsPost)}
                    style={{ paddingVertical: theme.spacing.sm }}
                  >
                    <AppText tone="urgent">Hide</AppText>
                  </Pressable>
                ) : null}
                {optionsPost &&
                Number.isFinite(Number(optionsPost.user.id)) &&
                Number(optionsPost.user.id) !== currentUserId ? (
                  <Pressable
                    onPress={() => handleMuteUser(optionsPost)}
                    style={{ paddingVertical: theme.spacing.sm }}
                  >
                    <AppText>Mute user</AppText>
                  </Pressable>
                ) : null}
                {optionsPost ? (
                  <Pressable
                    onPress={() => setShowReportReasons(true)}
                    style={{ paddingVertical: theme.spacing.sm }}
                  >
                    <AppText>Report</AppText>
                  </Pressable>
                ) : null}
                <Button label="Cancel" variant="secondary" onPress={closeOptions} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
