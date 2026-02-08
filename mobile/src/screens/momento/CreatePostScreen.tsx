import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { Memory } from '../../api/types';
import { friendApi } from '../../api/friendApi';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';
import { isStoryMemory } from '../../utils/momentoAdapter';
import { createPostSeed } from '../../utils/postCover';

export const CreatePostScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const maxMediaItems = 10;
  const [caption, setCaption] = useState('');
  const [mediaItems, setMediaItems] = useState<{ uri: string; type: 'image' }[]>([]);
  const [postSeed, setPostSeed] = useState(() => createPostSeed());
  const [taggedFriendIds, setTaggedFriendIds] = useState<number[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [mode, setMode] = useState<'post' | 'story'>('post');
  const [shareToFeed, setShareToFeed] = useState(false);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [postNotice, setPostNotice] = useState('');
  const composerRef = useRef<TextInput | null>(null);
  const AUDIENCE_STORAGE_KEY = 'omsim:create:audiences';

  const circlesQuery = useQuery({
    queryKey: ['circles'],
    queryFn: () => api.listCircles(),
  });

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendApi.friends(),
  });

  const circles = circlesQuery.data?.data ?? [];
  const audiences = useMemo(() => {
    const circleTargets = circles.map((circle) => ({
      key: `circle-${circle.id}`,
      label: circle.name,
      description: 'Share with this circle',
      scope: 'circle' as const,
      circleId: circle.id,
    }));

    return [
      {
        key: 'public',
        label: 'Public',
        description: 'Visible to anyone on OmsimSocial',
        scope: 'public' as const,
      },
      {
        key: 'followers',
        label: 'Followers',
        description: 'Visible to people who follow you',
        scope: 'followers' as const,
      },
      {
        key: 'friends',
        label: 'Friends',
        description: 'Only your friends can see this',
        scope: 'friends' as const,
      },
      ...circleTargets,
      {
        key: 'story',
        label: 'My Story (24h)',
        description: 'Show on your story for 24 hours',
        scope: 'story' as const,
      },
    ];
  }, [circles]);

  const storyAudience = useMemo(
    () => audiences.find((audience) => audience.scope === 'story'),
    [audiences]
  );
  const feedAudiences = useMemo(
    () => audiences.filter((audience) => audience.scope !== 'story'),
    [audiences]
  );

  const friendOptions = useMemo(() => {
    const friendships = friendsQuery.data?.data ?? [];
    return friendships
      .map((friendship) => friendship.user)
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
  }, [friendsQuery.data?.data]);

  const taggedFriends = useMemo(
    () => friendOptions.filter((friend) => taggedFriendIds.includes(friend.id)),
    [friendOptions, taggedFriendIds]
  );

  const defaultAudienceKey = useMemo(() => {
    const entry = feedAudiences.find((audience) => audience.scope === 'public');
    return entry?.key ?? feedAudiences[0]?.key ?? 'public';
  }, [feedAudiences]);

  const [selectedAudienceKeys, setSelectedAudienceKeys] = useState<string[]>(
    defaultAudienceKey ? [defaultAudienceKey] : []
  );
  const selectedAudiences = useMemo(
    () => feedAudiences.filter((audience) => selectedAudienceKeys.includes(audience.key)),
    [feedAudiences, selectedAudienceKeys]
  );

  useEffect(() => {
    setSelectedAudienceKeys((current) => {
      const validKeys = new Set(feedAudiences.map((audience) => audience.key));
      const filtered = current.filter((key) => validKeys.has(key));
      const next = filtered.length
        ? filtered
        : defaultAudienceKey
        ? [defaultAudienceKey]
        : [];
      if (next.length === current.length && next.every((key, index) => key === current[index])) {
        return current;
      }
      return next;
    });
  }, [defaultAudienceKey, feedAudiences]);

  useEffect(() => {
    if (!feedAudiences.length) return;
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUDIENCE_STORAGE_KEY);
        if (!stored || !isMounted) return;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return;
        const validKeys = new Set(feedAudiences.map((audience) => audience.key));
        const filtered = parsed.filter((key) => validKeys.has(key));
        if (filtered.length) {
          setSelectedAudienceKeys(filtered);
        }
      } catch {
        // Ignore stored audience errors.
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [feedAudiences]);

  useEffect(() => {
    if (!feedAudiences.length) return;
    AsyncStorage.setItem(AUDIENCE_STORAGE_KEY, JSON.stringify(selectedAudienceKeys)).catch(() => {
      // Ignore persistence errors.
    });
  }, [feedAudiences.length, selectedAudienceKeys]);

  useEffect(() => {
    if (mode === 'story' && !shareToFeed) {
      setShowAudiencePicker(false);
    }
  }, [mode, shareToFeed]);

  const toggleTaggedFriend = (userId: number) => {
    setTaggedFriendIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const removeMediaAt = (index: number) => {
    setMediaItems((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSelectAudience = (key: string) => {
    if (!key) return;
    setSelectedAudienceKeys((current) => {
      const isSelected = current.includes(key);
      if (isSelected) {
        const next = current.filter((entry) => entry !== key);
        return next.length ? next : [defaultAudienceKey];
      }
      return [...current, key];
    });
  };

  const focusComposer = () => {
    setTimeout(() => {
      composerRef.current?.focus();
    }, 120);
  };

  const uploadWithRetry = async (memoryId: number, media: { uri: string; type: 'image' }) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await api.uploadMemoryMedia(memoryId, {
          type: media.type,
          uri: media.uri,
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmedCaption = caption.trim();
      const trimmedLocation = location.trim();
      const defaultFeedAudience = feedAudiences.find((audience) => audience.key === defaultAudienceKey);
      const resolvedFeedTargets = selectedAudiences.length
        ? selectedAudiences
        : defaultFeedAudience
        ? [defaultFeedAudience]
        : [];
      const shouldShareFeed = mode === 'post' || (mode === 'story' && shareToFeed);
      const storyTargets = storyAudience ? [storyAudience] : [];
      const targets =
        mode === 'story'
          ? shouldShareFeed
            ? [...resolvedFeedTargets, ...storyTargets]
            : storyTargets
          : resolvedFeedTargets;
      const clientPostGroupId = postSeed;
      const responses = [];

      for (const target of targets) {
        const circleId = target.scope === 'circle' ? target.circleId : undefined;
        const response = await api.createMemory({
          scope: target.scope,
          circle_id: circleId,
          body: trimmedCaption.length ? trimmedCaption : undefined,
          location: trimmedLocation.length ? trimmedLocation : undefined,
          client_post_id: `${clientPostGroupId}:${target.key}`,
          tags: taggedFriendIds.length ? taggedFriendIds : undefined,
        });

        if (mediaItems.length) {
          await Promise.all(mediaItems.map((media) => uploadWithRetry(response.memory.id, media)));
        }

        responses.push(response);
      }

      return { responses, targets };
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        return error.status >= 500 && failureCount < 2;
      }
      return failureCount < 2;
    },
    onSuccess: ({ responses, targets }) => {
      const labels = targets.map((audience) => audience.label).filter(Boolean);
      const message = labels.length
        ? `Your post was shared to ${labels.join(', ')}.`
        : mode === 'story'
        ? 'Your story was uploaded.'
        : 'Your post was uploaded.';
      setPostNotice('Posted');
      const onlyStory = targets.length === 1 && targets[0]?.scope === 'story';
      const storyMemories = responses
        ?.map((response) => response?.memory)
        .filter(Boolean)
        .filter((memory) => isStoryMemory(memory as Memory)) as Memory[];
      const storyMemoryId = storyMemories[0]?.id;
      const primaryMemoryId = responses?.[0]?.memory?.id;
      const cachedMemories = queryClient.getQueryData<{ data: Memory[] }>(['profile-memories'])?.data ?? [];
      const now = Date.now();
      const activeCachedStories = cachedMemories.filter((memory) => {
        if (!isStoryMemory(memory)) return false;
        const expiresAt = memory.expires_at
          ? Date.parse(memory.expires_at)
          : Number.isFinite(Date.parse(memory.created_at))
          ? Date.parse(memory.created_at) + 24 * 60 * 60 * 1000
          : null;
        return !expiresAt || expiresAt > now;
      });
      const storyMap = new Map<number, Memory>();
      activeCachedStories.forEach((memory) => storyMap.set(memory.id, memory));
      storyMemories.forEach((memory) => storyMap.set(memory.id, memory));
      const storySequence = Array.from(storyMap.values()).sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
      );
      const storyMemoryIds = storySequence.map((memory) => memory.id);
      setCaption('');
      setMediaItems([]);
      setPostSeed(createPostSeed());
      setTaggedFriendIds([]);
      setLocation('');
      setShowTagPicker(false);
      setShowLocationInput(false);
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-memories'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
      if (onlyStory && storyMemoryId) {
        navigation.getParent()?.navigate(
          'FeedTab' as never,
          {
            screen: 'StoryViewer',
            params: { memoryId: storyMemoryId, memoryIds: storyMemoryIds.length ? storyMemoryIds : undefined },
          } as never
        );
        return;
      }
      if (primaryMemoryId) {
        navigation.getParent()?.navigate(
          'FeedTab' as never,
          {
            screen: 'PostDetail',
            params: { memoryId: primaryMemoryId },
          } as never
        );
        return;
      }
      Alert.alert('Posted', message);
    },
  });

  useEffect(() => {
    if (!postNotice) return;
    const timer = setTimeout(() => setPostNotice(''), 2000);
    return () => clearTimeout(timer);
  }, [postNotice]);

  const errorMessage = useMemo(() => {
    if (!createMutation.isError) return '';
    const error = createMutation.error;
    if (error instanceof ApiError) {
      const payload = error.payload as { message?: string } | null;
      return payload?.message || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return mediaItems.length ? 'The file failed to upload.' : 'Unable to post right now.';
  }, [createMutation.error, createMutation.isError, mediaItems.length]);

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxMediaItems,
      quality: 0.7,
      exif: false,
    });

    if (!result.canceled) {
      const mergeMediaItems = (
        current: { uri: string; type: 'image' }[],
        incoming: { uri: string; type: 'image' }[]
      ) => {
        if (!incoming.length) {
          return current;
        }
        const seen = new Set<string>();
        const combined = [...current, ...incoming].filter((item) => {
          if (seen.has(item.uri)) return false;
          seen.add(item.uri);
          return true;
        });
        const limited = combined.slice(0, maxMediaItems);
        if (combined.length > limited.length) {
          Alert.alert('Limit reached', `You can select up to ${maxMediaItems} items.`);
        }
        return limited;
      };

      const assets = result.assets;
      const nextItems = assets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
      }));
      setMediaItems((current) => mergeMediaItems(current, nextItems));
      focusComposer();
    }
  };

  const isPost = mode === 'post';
  const isStory = mode === 'story';
  const isStoryToFeed = isStory && shareToFeed;
  const hasText = caption.trim().length > 0;
  const hasMedia = mediaItems.length > 0;
  const footerNote = mode === 'story'
    ? shareToFeed
      ? 'Story will appear in My Story and the feed you choose.'
      : 'Stories disappear after 24 hours.'
    : 'Moments can post publicly, to followers, friends, or circles.';
  const postTextRequirementLabel = 'Add a caption to post.';
  const storyTextRequirementLabel = 'Add text for your story.';

  const defaultFeedAudienceLabel =
    feedAudiences.find((audience) => audience.key === defaultAudienceKey)?.label ?? 'Public';
  const feedSummary = selectedAudiences.length
    ? selectedAudiences.map((audience) => audience.label).join(', ')
    : defaultFeedAudienceLabel;
  const audienceSummary =
    mode === 'story'
      ? shareToFeed
        ? `My Story + ${feedSummary}`
        : 'My Story'
      : feedSummary;
  const postButtonLabel = createMutation.isPending
    ? 'Posting...'
    : mode === 'story'
    ? 'Share story'
    : 'Post';
  const canPickFeedAudience = mode === 'post' || shareToFeed;
  const audiencesToShow = canPickFeedAudience ? feedAudiences : [];
  const contentBottomPadding = insets.bottom + theme.spacing.xxl;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {postNotice ? (
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.lg,
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.accentSoft,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radii.pill,
              borderWidth: 1,
              borderColor: theme.colors.accent,
              alignItems: 'center',
            }}
          >
            <AppText tone="accent">{postNotice}</AppText>
          </View>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: contentBottomPadding + 70,
            gap: theme.spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="title">Create</AppText>
              <AppText tone="secondary">Share a moment with your people.</AppText>
            </View>
            {mediaItems.length || caption.trim().length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear draft"
                onPress={() => {
                  setCaption('');
                  setMediaItems([]);
                  setPostSeed(createPostSeed());
                  setTaggedFriendIds([]);
                  setLocation('');
                  setShowTagPicker(false);
                  setShowLocationInput(false);
                }}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.radii.pill,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle,
                }}
              >
                <AppText variant="caption">Clear</AppText>
              </Pressable>
            ) : null}
          </View>

          <SegmentedControl
            options={[
              { label: 'Post', value: 'post' },
              { label: 'Story', value: 'story' },
            ]}
            value={mode}
            onChange={(value) => setMode(value as 'post' | 'story')}
          />

          <Card style={{ padding: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Avatar
                name={currentUser?.name ?? 'You'}
                size={48}
                imageSource={
                  currentUser?.profile?.avatar_url
                    ? { uri: currentUser.profile.avatar_url }
                    : undefined
                }
              />
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">{currentUser?.name ?? 'You'}</AppText>
                <Pressable
                  onPress={() => {
                    if (!canPickFeedAudience) return;
                    setShowAudiencePicker((current) => !current);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose audience"
                  style={{
                    marginTop: theme.spacing.xs,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: 4,
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.accentSoft,
                    borderWidth: 1,
                    borderColor: theme.colors.accent,
                  }}
                >
                  <AppText variant="caption" tone="accent">
                    {audienceSummary}
                  </AppText>
                  <Feather name={showAudiencePicker ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.accent} />
                </Pressable>
              </View>
            </View>

            <TextInput
              ref={composerRef}
              value={caption}
              onChangeText={setCaption}
              placeholder="What is on your mind?"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                marginTop: theme.spacing.md,
                minHeight: 120,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily,
                textAlignVertical: 'top',
              }}
              multiline
            />
            {isPost && !hasText ? (
              <AppText variant="caption" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
                {postTextRequirementLabel}
              </AppText>
            ) : null}
            {isStory && !hasText ? (
              <AppText variant="caption" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
                {storyTextRequirementLabel}
              </AppText>
            ) : null}
            {mode === 'story' ? (
              <View
                style={{
                  marginTop: theme.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText>Share to feed</AppText>
                  <AppText variant="caption" tone="secondary">
                    Also publish this story as a feed post.
                  </AppText>
                </View>
                <Switch
                  value={shareToFeed}
                  onValueChange={setShareToFeed}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
                />
              </View>
            ) : null}
          </Card>

          {showAudiencePicker && audiencesToShow.length ? (
            <View style={{ gap: theme.spacing.sm }}>
              {audiencesToShow.map((audience) => {
                const selected = selectedAudienceKeys.includes(audience.key);
                return (
                  <Pressable
                    key={audience.key}
                    onPress={() => handleSelectAudience(audience.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Share to ${audience.label}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radii.md,
                      padding: theme.spacing.md,
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.accent : theme.colors.borderSubtle,
                    }}
                  >
                    <View>
                      <AppText>{audience.label}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {audience.description}
                      </AppText>
                    </View>
                    <Feather
                      name={selected ? 'check-circle' : 'circle'}
                      size={18}
                      color={selected ? theme.colors.accent : theme.colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View>
            <AppText variant="subtitle">Photos</AppText>
            <Pressable
              onPress={handlePickMedia}
              accessibilityRole="button"
              accessibilityLabel="Pick photos"
              style={{
                marginTop: theme.spacing.sm,
                borderRadius: theme.radii.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                backgroundColor: theme.colors.surfaceAlt,
                padding: theme.spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
              }}
            >
              <Feather name="image" size={20} color={theme.colors.textPrimary} />
              <AppText>Add photos (optional)</AppText>
              <AppText variant="caption" tone="secondary">
                Up to {maxMediaItems} photos
              </AppText>
            </Pressable>

            {mediaItems.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}
              >
                {mediaItems.map((item, index) => (
                  <View key={`${item.uri}-${index}`} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: 120, height: 120, borderRadius: theme.radii.md }}
                    />
                    <Pressable
                      onPress={() => removeMediaAt(index)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove selected media"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="x" size={14} color={theme.colors.surface} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Pressable
              onPress={() => setShowTagPicker((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel="Tag friends"
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <Feather name="user-plus" size={18} color={theme.colors.textPrimary} />
                <AppText>Tag people</AppText>
              </View>
              {taggedFriends.length ? (
                <AppText variant="caption" tone="secondary">
                  {taggedFriends.length}
                </AppText>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => setShowLocationInput((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel="Add location"
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <Feather name="map-pin" size={18} color={theme.colors.textPrimary} />
                <AppText>Add location</AppText>
              </View>
              {location.trim().length ? (
                <AppText variant="caption" tone="secondary">
                  Set
                </AppText>
              ) : null}
            </Pressable>
          </View>

          {showTagPicker ? (
            <View style={{ gap: theme.spacing.sm }}>
              {friendsQuery.isLoading ? (
                <AppText tone="secondary">Loading friends...</AppText>
              ) : friendsQuery.isError ? (
                <AppText tone="secondary">Unable to load friends right now.</AppText>
              ) : friendOptions.length ? (
                friendOptions.map((friend) => {
                  const selected = taggedFriendIds.includes(friend.id);
                  return (
                    <Pressable
                      key={friend.id}
                      onPress={() => toggleTaggedFriend(friend.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Tag ${friend.name}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radii.md,
                        padding: theme.spacing.md,
                        borderWidth: 1,
                        borderColor: selected ? theme.colors.accent : theme.colors.borderSubtle,
                      }}
                    >
                      <AppText>{friend.name}</AppText>
                      <Feather
                        name={selected ? 'check-circle' : 'circle'}
                        size={18}
                        color={selected ? theme.colors.accent : theme.colors.textSecondary}
                      />
                    </Pressable>
                  );
                })
              ) : (
                <AppText tone="secondary">No friends to tag yet.</AppText>
              )}
            </View>
          ) : null}

          {taggedFriends.length ? (
            <AppText variant="caption" tone="secondary">
              Tagged: {taggedFriends.map((friend) => friend.name).join(', ')}
            </AppText>
          ) : null}

          {showLocationInput || location.trim().length ? (
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily,
              }}
            />
          ) : null}

          <View>
            <AppText variant="caption" tone="secondary">
              {footerNote}
            </AppText>
            {createMutation.isError ? <AppText tone="urgent">{errorMessage}</AppText> : null}
          </View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            bottom: insets.bottom + theme.spacing.md,
          }}
        >
          <Button
            label={postButtonLabel}
            onPress={() => {
              if (!hasText && (isPost || isStory)) {
                Alert.alert(
                  isPost ? 'Add a caption' : 'Add story text',
                  isPost ? postTextRequirementLabel : 'Stories require a short caption.'
                );
                focusComposer();
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
