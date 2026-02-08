import React, { useMemo, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextPostCover } from '../../components/TextPostCover';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../api';
import { friendApi } from '../../api/friendApi';
import { followApi } from '../../api/followApi';
import { isStoryMemory, mapMemoryToMomentoPost, normalizeMediaUrl } from '../../utils/momentoAdapter';

const tabs = [
  { label: 'Posts', value: 'posts' },
  { label: 'Reshares', value: 'reshares' },
  { label: 'Info', value: 'info' },
];

export const ProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('posts');
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

  const friendsQuery = useQuery({
    queryKey: ['friends', 'summary'],
    queryFn: () => friendApi.friends(),
  });

  const followersQuery = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => followApi.followers(user?.id ?? 0),
    enabled: Boolean(user?.id),
  });

  const followingQuery = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => followApi.following(user?.id ?? 0),
    enabled: Boolean(user?.id),
  });

  const friendCount = useMemo(() => {
    const friends = friendsQuery.data?.data ?? [];
    return friends.length;
  }, [friendsQuery.data?.data]);

  const followerCount = followersQuery.data?.data?.length ?? 0;
  const followingCount = followingQuery.data?.data?.length ?? 0;

  const profileName = user?.name ?? 'Your name';
  const profileHandle = user?.username ? `@${user.username}` : '@username';
  const profileBio = user?.profile?.bio ?? 'Add a short bio so friends know it is you.';
  const avatarUrl = normalizeMediaUrl(user?.profile?.avatar_url ?? null) ?? '';
  const coverUrl = normalizeMediaUrl(user?.profile?.cover_url ?? null) ?? '';
  const city = user?.profile?.city ?? '';
  const websiteUrl = user?.profile?.website_url ?? '';
  const birthday = user?.profile?.birthday ?? '';
  const gender = user?.profile?.gender ?? '';
  const instagramUrl = user?.profile?.instagram_url ?? '';
  const facebookUrl = user?.profile?.facebook_url ?? '';
  const tiktokUrl = user?.profile?.tiktok_url ?? '';

  const memoriesQuery = useQuery({
    queryKey: ['profile-memories'],
    queryFn: () => api.myMemories(),
  });

  const profileFeedQuery = useQuery({
    queryKey: ['profile-feed', user?.id],
    queryFn: () => api.profileFeed(user?.id ?? 0),
    enabled: Boolean(user?.id),
  });

  const rawMemories = memoriesQuery.data?.data ?? [];

  const profileFeedMemories = useMemo(() => {
    return profileFeedQuery.data?.data ?? [];
  }, [profileFeedQuery.data?.data]);

  const feedEntries = useMemo(() => {
    return profileFeedMemories.map((memory) => {
      const mapped = mapMemoryToMomentoPost(memory);
      const primaryMedia = mapped.media;
      return {
        id: mapped.feedKey ?? mapped.id,
        feedType: mapped.feedType ?? 'memory',
        memoryId: mapped.id,
        imageUrl: primaryMedia?.uri ?? null,
        mediaType: primaryMedia?.type ?? null,
        caption: mapped.caption,
        mediaItems: mapped.mediaItems,
        coverSeed: mapped.coverSeed ?? mapped.id,
      };
    });
  }, [profileFeedMemories]);

  const postItems = useMemo(
    () => feedEntries.filter((entry) => entry.feedType !== 'reshare'),
    [feedEntries]
  );

  const reshareItems = useMemo(
    () => feedEntries.filter((entry) => entry.feedType === 'reshare'),
    [feedEntries]
  );

  const storyMemories = useMemo(() => {
    const now = Date.now();
    return rawMemories.filter((memory) => {
      if (!isStoryMemory(memory)) return false;
      const expiresAt = memory.expires_at
        ? Date.parse(memory.expires_at)
        : Number.isFinite(Date.parse(memory.created_at))
        ? Date.parse(memory.created_at) + 24 * 60 * 60 * 1000
        : null;
      return !expiresAt || expiresAt > now;
    });
  }, [rawMemories]);

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

  const goToFriends = () => {
    navigation.navigate('Connections' as never);
  };
  const goToFollowers = () => {
    if (!user?.id) return;
    navigation.navigate(
      'FollowList' as never,
      { userId: user.id, type: 'followers', userName: profileName } as never
    );
  };
  const goToFollowing = () => {
    if (!user?.id) return;
    navigation.navigate(
      'FollowList' as never,
      { userId: user.id, type: 'following', userName: profileName } as never
    );
  };

  const stats = [
    { label: 'Posts', value: `${postItems.length}`, onPress: () => setActiveTab('posts') },
    { label: 'Friends', value: `${friendCount}`, onPress: goToFriends },
    { label: 'Followers', value: `${followerCount}`, onPress: goToFollowers },
    { label: 'Following', value: `${followingCount}`, onPress: goToFollowing },
  ];
  const profileViewsQuery = useQuery({
    queryKey: ['profile-views', 'summary'],
    queryFn: () => api.profileViewsSummary(),
  });
  const viewCount = profileViewsQuery.data?.total_24h ?? 0;

  const ActionTile = ({
    label,
    icon,
    onPress,
    tone = 'default',
    detail,
  }: {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
    tone?: 'default' | 'urgent';
    detail?: string;
  }) => {
    const isUrgent = tone === 'urgent';
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          flex: 1,
          alignItems: 'center',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xs,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isUrgent ? theme.colors.chipUrgency : theme.colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name={icon} size={14} color={isUrgent ? theme.colors.urgency : theme.colors.accent} />
        </View>
        <AppText
          variant="caption"
          tone={isUrgent ? 'urgent' : 'primary'}
          style={{ textAlign: 'center' }}
        >
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
            {detail}
          </AppText>
        ) : null}
      </Pressable>
    );
  };
  const feedItems =
    activeTab === 'posts'
      ? postItems
      : activeTab === 'reshares'
      ? reshareItems
      : [];

  const emptyPosts = profileFeedQuery.isLoading ? (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
      <Card>
        <AppText tone="secondary">Loading your moments...</AppText>
      </Card>
    </View>
  ) : (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
      <Card>
        <AppText variant="subtitle">No moments yet</AppText>
        <AppText tone="secondary">Share your first post to start your grid.</AppText>
      </Card>
    </View>
  );
  const emptyReshares = profileFeedQuery.isLoading ? null : (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
      <Card>
        <AppText variant="subtitle">No reshares yet</AppText>
        <AppText tone="secondary">Reshare a moment to see it here.</AppText>
      </Card>
    </View>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
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
                {profileName}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {profileHandle}
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
                {profileName}
              </AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {profileHandle}
              </AppText>
            </View>
          </LinearGradient>
        )}
      </Animated.View>
      <Animated.FlatList
        data={feedItems}
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
          activeTab === 'posts'
            ? emptyPosts
            : activeTab === 'reshares'
            ? emptyReshares
            : null
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
                  accessibilityLabel={latestStory ? 'View your story' : undefined}
                >
                  <Avatar
                    name={profileName}
                    size={80}
                    imageSource={avatarUrl ? { uri: avatarUrl } : undefined}
                    showRing={Boolean(latestStory)}
                    ringColors={theme.gradients.accent}
                  />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">{profileName}</AppText>
                  <AppText tone="secondary" numberOfLines={2} ellipsizeMode="tail">
                    {profileBio}
                  </AppText>
                </View>
              </View>

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

              <View style={{ marginTop: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <ActionTile
                    label="Edit profile"
                    icon="edit-3"
                    onPress={() => navigation.navigate('EditProfile' as never)}
                  />
                  <ActionTile
                    label="Settings"
                    icon="settings"
                    onPress={() => navigation.navigate('Settings' as never)}
                  />
                  <ActionTile
                    label={`${viewCount}`}
                    icon="eye"
                    onPress={() => navigation.navigate('ProfileViews' as never)}
                  />
                  <ActionTile label="Log out" icon="log-out" tone="urgent" onPress={() => logout()} />
                </View>
              </View>
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
                    {user?.email ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="mail" size={16} color={theme.colors.textSecondary} />
                        <AppText>{user.email}</AppText>
                      </View>
                    ) : null}
                    {user?.phone ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Feather name="phone" size={16} color={theme.colors.textSecondary} />
                        <AppText>{user.phone}</AppText>
                      </View>
                    ) : null}
                    {!city &&
                    !birthday &&
                    !gender &&
                    !websiteUrl &&
                    !instagramUrl &&
                    !facebookUrl &&
                    !tiktokUrl &&
                    !user?.email &&
                    !user?.phone ? (
                      <AppText tone="secondary">Add your details in Edit profile.</AppText>
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


