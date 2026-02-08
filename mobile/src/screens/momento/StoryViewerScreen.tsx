import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Alert,
  Pressable,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { Memory } from '../../api/types';
import { formatTimeAgo } from '../../utils/time';
import { isStoryMemory, normalizeMediaUrl } from '../../utils/momentoAdapter';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';

type StoryViewerParams = {
  memoryId?: number;
  memoryIds?: number[];
};

type StorySlide = {
  id: string;
  memory: Memory;
  type: 'image' | 'video' | 'text';
  uri?: string;
};

const STORY_DURATION_MS = 10000;

export const StoryViewerScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { memoryId, memoryIds } = route.params as StoryViewerParams;
  const currentUser = useAuthStore((state) => state.user);
  const progress = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<StorySlide> | null>(null);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [deletedMemoryIds, setDeletedMemoryIds] = useState<number[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [likedById, setLikedById] = useState<Record<number, boolean>>({});
  const [likeCountsById, setLikeCountsById] = useState<Record<number, number>>({});
  const viewedMemoryIds = useRef(new Set<number>());
  const queryClient = useQueryClient();

  const sourceMemoryIds = useMemo(() => {
    const ids = memoryIds?.length ? memoryIds : memoryId ? [memoryId] : [];
    const seen = new Set<number>();
    return ids
      .map((id) => Number(id))
      .filter((id) => {
        if (!Number.isFinite(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [memoryId, memoryIds]);

  const storyQuery = useQuery({
    queryKey: ['story', sourceMemoryIds],
    enabled: sourceMemoryIds.length > 0,
    queryFn: async () => {
      const results = await Promise.allSettled(
        sourceMemoryIds.map((id) => api.getMemory(id))
      );
      const memories: Memory[] = [];
      let expiredOnly = results.length > 0;
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          memories.push(result.value.memory);
          expiredOnly = false;
          return;
        }
        const error = result.reason;
        if (!(error instanceof ApiError) || error.status !== 410) {
          expiredOnly = false;
        }
      });
      return { memories, expiredOnly };
    },
  });

  const orderedMemories = useMemo(() => {
    const memories = storyQuery.data?.memories ?? [];
    if (!memories.length) return [];
    const memoryMap = new Map(memories.map((memory) => [memory.id, memory]));
    return sourceMemoryIds
      .map((id) => memoryMap.get(id))
      .filter((memory): memory is Memory => Boolean(memory));
  }, [sourceMemoryIds, storyQuery.data?.memories]);

  const activeMemories = useMemo(() => {
    const now = Date.now();
    return orderedMemories.filter((memory) => {
      if (!isStoryMemory(memory)) return false;
      if (deletedMemoryIds.includes(memory.id)) return false;
      const expiresAt = memory.expires_at
        ? Date.parse(memory.expires_at)
        : Number.isFinite(Date.parse(memory.created_at))
        ? Date.parse(memory.created_at) + 24 * 60 * 60 * 1000
        : null;
      return !expiresAt || expiresAt > now;
    });
  }, [deletedMemoryIds, orderedMemories]);

  const storySlides = useMemo<StorySlide[]>(() => {
    if (!activeMemories.length) return [];
    return activeMemories.flatMap((memory) => {
      const mediaItems = memory.media ?? [];
      if (!mediaItems.length) {
        return [
          {
            id: `story-${memory.id}-text`,
            memory,
            type: 'text' as const,
          },
        ];
      }
      return mediaItems
        .map((item, index) => ({
          id: String(item.id ?? `story-${memory.id}-${index}`),
          memory,
          type: item.type === 'video' ? 'video' : 'image',
          uri: normalizeMediaUrl(item.url) ?? '',
        }))
        .filter((item) => item.type === 'text' || item.uri);
    });
  }, [activeMemories]);

  const activeSlide = storySlides[activeIndex];
  const activeMemory = activeSlide?.memory;
  const caption = activeMemory?.body ?? '';
  const isAuthor = Boolean(currentUser && activeMemory?.author?.id === currentUser.id);
  const canReact = Boolean(currentUser && activeMemory && !isAuthor);
  const author = useMemo(() => activeMemory?.author, [activeMemory?.author]);
  const avatarUrl = normalizeMediaUrl(author?.profile?.avatar_url) ?? undefined;
  const isExpiredView = Boolean(storyQuery.data?.expiredOnly && !storySlides.length);

  const getMemoryLikeCount = (memory: Memory) =>
    memory.reactions?.reduce((sum, reaction) => sum + reaction.count, 0) ?? 0;

  const getLikedState = (memory: Memory) =>
    typeof likedById[memory.id] === 'boolean' ? likedById[memory.id] : Boolean(memory.is_liked);

  const getLikeCount = (memory: Memory) =>
    typeof likeCountsById[memory.id] === 'number'
      ? likeCountsById[memory.id]
      : getMemoryLikeCount(memory);

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [sourceMemoryIds.join('|'), storySlides.length]);

  useEffect(() => {
    if (!activeMemories.length) return;
    setLikedById((prev) => {
      const next = { ...prev };
      activeMemories.forEach((memory) => {
        if (typeof next[memory.id] !== 'boolean') {
          next[memory.id] = Boolean(memory.is_liked);
        }
      });
      return next;
    });
    setLikeCountsById((prev) => {
      const next = { ...prev };
      activeMemories.forEach((memory) => {
        if (typeof next[memory.id] !== 'number') {
          next[memory.id] = getMemoryLikeCount(memory);
        }
      });
      return next;
    });
  }, [activeMemories]);

  useEffect(() => {
    setShowViewers(false);
  }, [activeMemory?.id]);

  useEffect(() => {
    if (!storySlides.length) return;
    if (activeIndex > storySlides.length - 1) {
      const nextIndex = Math.max(0, storySlides.length - 1);
      setActiveIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
    }
  }, [activeIndex, storySlides.length]);

  useEffect(() => {
    if (storyQuery.isLoading || storySlides.length) return;
    if (deletedMemoryIds.length) {
      navigation.goBack();
    }
  }, [deletedMemoryIds.length, navigation, storyQuery.isLoading, storySlides.length]);

  useEffect(() => {
    if (!activeSlide) return;
    progress.stopAnimation();
    progress.setValue(0);
    if (activeSlide.type !== 'video') {
      Animated.timing(progress, {
        toValue: 1,
        duration: STORY_DURATION_MS,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        if (activeIndex < storySlides.length - 1) {
          listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        } else {
          navigation.goBack();
        }
      });
    }
  }, [activeIndex, activeSlide, navigation, progress, storySlides.length]);

  const viewMutation = useMutation({
    mutationFn: (id: number) => api.viewStory(id),
  });

  const reactMutation = useMutation({
    mutationFn: (id: number) => api.reactMemory(id, 'heart'),
  });

  const unreactMutation = useMutation({
    mutationFn: (id: number) => api.unreactMemory(id, 'heart'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteMemory(id),
    onSuccess: (_, id) => {
      setDeletedMemoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-memories'] });
    },
    onError: () => {
      Alert.alert('Unable to delete story', 'Please try again.');
    },
  });

  useEffect(() => {
    if (!activeMemory || isAuthor) return;
    if (viewedMemoryIds.current.has(activeMemory.id)) return;
    viewMutation.mutate(activeMemory.id);
    viewedMemoryIds.current.add(activeMemory.id);
  }, [activeMemory, isAuthor, viewMutation]);

  const viewerMemoryId = activeMemory?.id;

  const viewersQuery = useQuery({
    queryKey: ['story-viewers', viewerMemoryId],
    queryFn: () => api.storyViewers(viewerMemoryId ?? 0),
    enabled: Boolean(isAuthor && viewerMemoryId),
  });

  const viewerCount = viewersQuery.data?.count ?? activeMemory?.story_views_count ?? 0;
  const viewerNames = viewersQuery.data?.viewers ?? [];

  const handleClose = () => navigation.goBack();
  const handleDeleteStory = () => {
    if (!activeMemory || deleteMutation.isPending) return;
    Alert.alert('Delete story', 'This will remove it from your story.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(activeMemory.id),
      },
    ]);
  };
  const handleToggleHeart = () => {
    if (!activeMemory || !canReact) return;
    const memoryId = activeMemory.id;
    const currentLiked = getLikedState(activeMemory);
    const currentCount = getLikeCount(activeMemory);
    const nextLiked = !currentLiked;
    setLikedById((prev) => ({ ...prev, [memoryId]: nextLiked }));
    setLikeCountsById((prev) => ({
      ...prev,
      [memoryId]: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
    }));
    const rollback = () => {
      setLikedById((prev) => ({ ...prev, [memoryId]: currentLiked }));
      setLikeCountsById((prev) => ({ ...prev, [memoryId]: currentCount }));
    };
    if (nextLiked) {
      reactMutation.mutate(memoryId, { onError: rollback });
    } else {
      unreactMutation.mutate(memoryId, { onError: rollback });
    }
  };
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={[]}>
      <View style={{ flex: 1 }}>
        {storyQuery.isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.surface} />
          </View>
        ) : isExpiredView ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.lg,
            }}
          >
            <AppText style={{ color: theme.colors.surface }}>This story expired.</AppText>
          </View>
        ) : !storySlides.length ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.lg,
            }}
          >
            <AppText style={{ color: theme.colors.surface }}>Story unavailable.</AppText>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={storySlides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
              setActiveIndex(Math.max(0, Math.min(storySlides.length - 1, nextIndex)));
            }}
            renderItem={({ item, index }) => (
              <View style={{ width: windowWidth, height: windowHeight }}>
                {item.type === 'video' && item.uri ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={index === activeIndex}
                    isMuted={false}
                    onPlaybackStatusUpdate={(status) => {
                      if (!status.isLoaded || index !== activeIndex) return;
                      if (status.durationMillis) {
                        const ratio = Math.min(1, status.positionMillis / status.durationMillis);
                        progress.setValue(ratio);
                      }
                      if (status.didJustFinish) {
                        if (activeIndex < storySlides.length - 1) {
                          listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
                        } else {
                          navigation.goBack();
                        }
                      }
                    }}
                  />
                ) : item.type === 'image' && item.uri ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: theme.spacing.xl,
                      backgroundColor: '#000',
                    }}
                  >
                    <AppText variant="title" style={{ color: theme.colors.surface, textAlign: 'center' }}>
                      {item.memory.body ?? 'My Story'}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          />
        )}

        <View
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.md,
            left: theme.spacing.md,
            right: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            {storySlides.map((item, index) => (
              <View
                key={item.id ?? `segment-${index}`}
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    height: 4,
                    backgroundColor: '#fff',
                    width: index < activeIndex ? '100%' : index === activeIndex ? progressWidth : '0%',
                  }}
                />
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md }}>
            <Pressable
              onPress={() => {
                if (!author?.id) return;
                navigation.navigate(
                  'UserProfile' as never,
                  { userId: Number(author.id) } as never
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${author?.name ?? 'user'} profile`}
            >
              <Avatar name={author?.name ?? 'You'} size={36} imageSource={avatarUrl ? { uri: avatarUrl } : undefined} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!author?.id) return;
                navigation.navigate(
                  'UserProfile' as never,
                  { userId: Number(author.id) } as never
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open ${author?.name ?? 'user'} profile`}
              style={{ marginLeft: theme.spacing.sm, flex: 1 }}
            >
              <AppText style={{ color: theme.colors.surface }}>
                {author?.name ?? 'My Story'}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {activeMemory?.created_at ? formatTimeAgo(activeMemory.created_at) : ''}
              </AppText>
            </Pressable>
            {isAuthor ? (
              <Pressable
                onPress={handleDeleteStory}
                accessibilityRole="button"
                accessibilityLabel="Delete story"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: theme.spacing.sm,
                }}
              >
                <Feather name="trash-2" size={14} color={theme.colors.surface} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close story"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: isAuthor ? theme.spacing.sm : 0,
              }}
            >
              <Feather name="x" size={16} color={theme.colors.surface} />
            </Pressable>
          </View>
        </View>

        {(caption || isAuthor || canReact) ? (
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + theme.spacing.lg,
              left: theme.spacing.lg,
              right: theme.spacing.lg,
              gap: theme.spacing.sm,
            }}
          >
            {canReact && activeMemory ? (
              <Pressable
                onPress={handleToggleHeart}
                disabled={reactMutation.isPending || unreactMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={getLikedState(activeMemory) ? 'Unlike story' : 'Like story'}
                style={({ pressed }) => [
                  {
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radii.pill,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  pressed ? { opacity: 0.75 } : null,
                ]}
              >
                <Feather
                  name="heart"
                  size={16}
                  color={getLikedState(activeMemory) ? theme.colors.urgency : theme.colors.surface}
                />
                <AppText variant="caption" style={{ color: theme.colors.surface }}>
                  {getLikeCount(activeMemory)}
                </AppText>
              </Pressable>
            ) : null}
            {caption ? (
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  borderRadius: theme.radii.md,
                  padding: theme.spacing.md,
                }}
              >
                <AppText style={{ color: theme.colors.surface }}>{caption}</AppText>
              </View>
            ) : null}

            {isAuthor ? (
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderRadius: theme.radii.md,
                  padding: theme.spacing.md,
                }}
              >
                <Pressable
                  onPress={() => setShowViewers((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle story viewers"
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <AppText style={{ color: theme.colors.surface }}>
                    {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                  </AppText>
                  <Feather
                    name={showViewers ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={theme.colors.surface}
                  />
                </Pressable>
                {showViewers ? (
                  viewerNames.length ? (
                    <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {viewerNames
                        .slice(0, 6)
                        .map((viewer) => viewer.name)
                        .join(', ')}
                      {viewerNames.length > 6 ? ' +' + (viewerNames.length - 6) : ''}
                    </AppText>
                  ) : (
                    <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      No viewers yet.
                    </AppText>
                  )
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};
