import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../theme/useTheme';
import { followApi } from '../../api/followApi';
import { friendApi } from '../../api/friendApi';
import { api } from '../../api';
import { ApiError } from '../../api/client';
import { formatTimeAgo } from '../../utils/time';
import { isStoryMemory, normalizeMediaUrl } from '../../utils/momentoAdapter';
import { MomentoNotification, MomentoUser } from '../../types/momento';

const iconForType = (type: MomentoNotification['type']) => {
  switch (type) {
    case 'comment':
      return 'message-circle';
    case 'comment_like':
      return 'heart';
    case 'follow':
      return 'user-plus';
    case 'save':
      return 'bookmark';
    case 'reshare':
      return 'repeat';
    default:
      return 'heart';
  }
};

export const AlertsHubScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [alertsQuery, setAlertsQuery] = useState('');
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const queryClient = useQueryClient();

  const incomingFriendRequestsQuery = useQuery({
    queryKey: ['friend-requests', 'incoming'],
    queryFn: () => friendApi.incomingFriendRequests(),
  });

  const outgoingFriendRequestsQuery = useQuery({
    queryKey: ['friend-requests', 'outgoing'],
    queryFn: () => friendApi.outgoingFriendRequests(),
  });

  const incomingFollowRequestsQuery = useQuery({
    queryKey: ['follow-requests', 'incoming'],
    queryFn: () => followApi.incomingFollowRequests(),
  });

  const activityQuery = useQuery({
    queryKey: ['inboxActivity'],
    queryFn: () => api.inboxActivity(),
  });

  const outgoingFollowRequestsQuery = useQuery({
    queryKey: ['follow-requests', 'outgoing'],
    queryFn: () => followApi.outgoingFollowRequests(),
  });

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['inbox', 'unread-count'] });
  };

  const confirmFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.confirmFriendRequest(id),
    onSuccess: refreshRequests,
  });

  const declineFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.declineFriendRequest(id),
    onSuccess: refreshRequests,
  });

  const cancelFriendRequestMutation = useMutation({
    mutationFn: (id: number) => friendApi.cancelFriendRequest(id),
    onSuccess: refreshRequests,
  });

  const acceptFollowRequestMutation = useMutation({
    mutationFn: (id: number) => followApi.acceptFollowRequest(id),
    onSuccess: refreshRequests,
  });

  const declineFollowRequestMutation = useMutation({
    mutationFn: (id: number) => followApi.declineFollowRequest(id),
    onSuccess: refreshRequests,
  });

  const cancelFollowRequestMutation = useMutation({
    mutationFn: (id: number) => followApi.cancelFollowRequest(id),
    onSuccess: refreshRequests,
  });

  const openProfile = (userId?: number) => {
    if (!userId) return;
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('SearchTab' as never, { screen: 'UserProfile', params: { userId } } as never);
      return;
    }
    navigation.navigate('UserProfile' as never, { userId } as never);
  };


  const headerCopy = {
    title: 'Alerts',
    subtitle: 'Recent activity from friends and followers.',
  };

  const incomingFriendRequests = incomingFriendRequestsQuery.data?.data ?? [];
  const outgoingFriendRequests = outgoingFriendRequestsQuery.data?.data ?? [];
  const incomingFollowRequests = incomingFollowRequestsQuery.data?.data ?? [];
  const outgoingFollowRequests = outgoingFollowRequestsQuery.data?.data ?? [];
  const activityEvents = activityQuery.data?.data ?? [];

  const markEventReadMutation = useMutation({
    mutationFn: (eventId: number) => api.markInboxEventRead(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['inboxActivity'] });
    },
  });

  const handleOpenAlert = async (alertItem: MomentoNotification) => {
    if (typeof alertItem.memoryId !== 'number') return;
    markEventReadMutation.mutate(Number(alertItem.id));

    try {
      const response = await api.getMemory(alertItem.memoryId);
      if (isStoryMemory(response.memory)) {
        navigation.navigate(
          'FeedTab' as never,
          {
            screen: 'StoryViewer',
            params: { memoryId: alertItem.memoryId, memoryIds: [alertItem.memoryId] },
          } as never
        );
        return;
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) {
        navigation.navigate(
          'FeedTab' as never,
          {
            screen: 'StoryViewer',
            params: { memoryId: alertItem.memoryId, memoryIds: [alertItem.memoryId] },
          } as never
        );
        return;
      }
    }

    navigation.navigate(
      'FeedTab' as never,
      {
        screen: 'PostDetail',
        params: {
          memoryId: alertItem.memoryId,
          commentId: alertItem.commentId,
        },
      } as never
    );
  };

  const activityNotifications = useMemo(() => {
    if (!activityEvents.length) return [];
    const fallbackAvatar = (id: number) => `https://i.pravatar.cc/200?img=${(id % 70) + 1}`;
    const truncate = (value: string, limit = 80) =>
      value.length > limit ? `${value.slice(0, limit).trim()}...` : value;

    return activityEvents
      .map((event) => {
        const data = event.data ?? {};
        const actorId = Number((data as { actor_id?: number }).actor_id ?? event.id);
        const memoryIdValue = Number((data as { memory_id?: number }).memory_id);
        const commentIdValue = Number((data as { comment_id?: number }).comment_id);
        const memoryId = Number.isFinite(memoryIdValue) ? memoryIdValue : undefined;
        const commentId = Number.isFinite(commentIdValue) ? commentIdValue : undefined;
        const actor: MomentoUser = {
          id: String(actorId),
          name: (data as { actor_name?: string }).actor_name ?? 'Omsim member',
          username: (data as { actor_username?: string }).actor_username ?? 'omsim',
          avatarUrl:
            normalizeMediaUrl((data as { actor_avatar_url?: string }).actor_avatar_url) ??
            fallbackAvatar(actorId),
        };
        const timeAgo = formatTimeAgo(event.created_at);
        switch (event.type) {
          case 'memory_liked':
            return {
              id: String(event.id),
              user: actor,
              type: 'like' as const,
              timeAgo,
              text: 'loved your post.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          case 'memory_commented': {
            const body = (data as { comment_body?: string }).comment_body;
            return {
              id: String(event.id),
              user: actor,
              type: 'comment' as const,
              timeAgo,
              text: body ? `commented: "${truncate(body)}"` : 'commented on your post.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          }
          case 'comment_liked':
            return {
              id: String(event.id),
              user: actor,
              type: 'comment_like' as const,
              timeAgo,
              text: 'loved your comment.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          case 'comment_replied':
            return {
              id: String(event.id),
              user: actor,
              type: 'comment' as const,
              timeAgo,
              text: 'replied to your comment.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          case 'memory_saved':
            return {
              id: String(event.id),
              user: actor,
              type: 'save' as const,
              timeAgo,
              text: 'saved your post.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          case 'adoption_note': {
            const note = (data as { note?: string }).note;
            return {
              id: String(event.id),
              user: actor,
              type: 'save' as const,
              timeAgo,
              text: note ? `saved your post: "${truncate(note)}"` : 'saved your post.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          }
          case 'memory_reshared':
            return {
              id: String(event.id),
              user: actor,
              type: 'reshare' as const,
              timeAgo,
              text: 'reshared your post.',
              memoryId,
              commentId,
              isUnread: !event.read_at,
            };
          default:
            return null;
        }
      })
      .filter(Boolean) as MomentoNotification[];
  }, [activityEvents]);

  useEffect(() => {
    setShowAllAlerts(false);
  }, [alertsQuery]);

  const filteredAlerts = useMemo(() => {
    const normalized = alertsQuery.trim().toLowerCase();
    if (!normalized) return activityNotifications;
    return activityNotifications.filter((alert) => {
      const name = alert.user.name?.toLowerCase() ?? '';
      const handle = alert.user.username?.toLowerCase() ?? '';
      const text = alert.text?.toLowerCase() ?? '';
      return name.includes(normalized) || handle.includes(normalized) || text.includes(normalized);
    });
  }, [activityNotifications, alertsQuery]);

  const visibleAlerts = useMemo(() => {
    if (showAllAlerts || alertsQuery.trim().length) {
      return filteredAlerts;
    }
    return filteredAlerts.slice(0, 10);
  }, [alertsQuery, filteredAlerts, showAllAlerts]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <FlatList
        data={visibleAlerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">{headerCopy.title}</AppText>
            <AppText tone="secondary">{headerCopy.subtitle}</AppText>
            <View
              style={{
                marginTop: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
              }}
            >
              <Feather name="search" size={16} color={theme.colors.textSecondary} />
              <TextInput
                value={alertsQuery}
                onChangeText={setAlertsQuery}
                placeholder="Search alerts"
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  marginLeft: theme.spacing.sm,
                  flex: 1,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.body.fontSize,
                }}
              />
            </View>
            <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
              <View style={{ gap: theme.spacing.sm }}>
                <AppText variant="subtitle">Friend requests</AppText>
                {!incomingFriendRequests.length && !outgoingFriendRequests.length ? (
                  <AppText tone="secondary">No friend requests.</AppText>
                ) : (
                  <>
                    {incomingFriendRequests.map((request) => {
                      const fromUser = request.from_user;
                      return (
                        <Card
                          key={`friend-incoming-${request.id}`}
                          onPress={fromUser?.id ? () => openProfile(fromUser.id) : undefined}
                          style={{
                            padding: theme.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                          }}
                        >
                          <Avatar
                            name={fromUser?.name ?? 'Omsim Member'}
                            size={44}
                            imageSource={
                              fromUser?.profile?.avatar_url
                                ? { uri: fromUser.profile.avatar_url }
                                : undefined
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <AppText variant="subtitle">{fromUser?.name ?? 'New request'}</AppText>
                            <AppText tone="secondary">
                              {request.message || 'Sent a friend request.'}
                            </AppText>
                          </View>
                          <View style={{ gap: theme.spacing.xs }}>
                            <Button
                              label="Confirm"
                              size="sm"
                              onPress={() => confirmFriendRequestMutation.mutate(request.id)}
                            />
                            <Button
                              label="Decline"
                              size="sm"
                              variant="secondary"
                              onPress={() => declineFriendRequestMutation.mutate(request.id)}
                            />
                          </View>
                        </Card>
                      );
                    })}
                    {outgoingFriendRequests.map((request) => {
                      const toUser = request.to_user;
                      return (
                        <Card
                          key={`friend-outgoing-${request.id}`}
                          onPress={toUser?.id ? () => openProfile(toUser.id) : undefined}
                          style={{
                            padding: theme.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                          }}
                        >
                          <Avatar
                            name={toUser?.name ?? 'Omsim Member'}
                            size={44}
                            imageSource={
                              toUser?.profile?.avatar_url
                                ? { uri: toUser.profile.avatar_url }
                                : undefined
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <AppText variant="subtitle">{toUser?.name ?? 'Pending request'}</AppText>
                            <AppText tone="secondary">Friend request sent.</AppText>
                          </View>
                          <Button
                            label="Cancel"
                            size="sm"
                            variant="secondary"
                            onPress={() => cancelFriendRequestMutation.mutate(request.id)}
                          />
                        </Card>
                      );
                    })}
                  </>
                )}
              </View>
              <View style={{ gap: theme.spacing.sm }}>
                <AppText variant="subtitle">Follow requests</AppText>
                {!incomingFollowRequests.length && !outgoingFollowRequests.length ? (
                  <AppText tone="secondary">No follow requests.</AppText>
                ) : (
                  <>
                    {incomingFollowRequests.map((request) => {
                      const fromUser = request.requester;
                      return (
                        <Card
                          key={`follow-incoming-${request.id}`}
                          onPress={fromUser?.id ? () => openProfile(fromUser.id) : undefined}
                          style={{
                            padding: theme.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                          }}
                        >
                          <Avatar
                            name={fromUser?.name ?? 'Omsim Member'}
                            size={44}
                            imageSource={
                              fromUser?.profile?.avatar_url
                                ? { uri: fromUser.profile.avatar_url }
                                : undefined
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <AppText variant="subtitle">{fromUser?.name ?? 'New follower'}</AppText>
                            <AppText tone="secondary">Requested to follow you.</AppText>
                          </View>
                          <View style={{ gap: theme.spacing.xs }}>
                            <Button
                              label="Accept"
                              size="sm"
                              onPress={() => acceptFollowRequestMutation.mutate(request.id)}
                            />
                            <Button
                              label="Decline"
                              size="sm"
                              variant="secondary"
                              onPress={() => declineFollowRequestMutation.mutate(request.id)}
                            />
                          </View>
                        </Card>
                      );
                    })}
                    {outgoingFollowRequests.map((request) => {
                      const toUser = request.target;
                      return (
                        <Card
                          key={`follow-outgoing-${request.id}`}
                          onPress={toUser?.id ? () => openProfile(toUser.id) : undefined}
                          style={{
                            padding: theme.spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing.md,
                          }}
                        >
                          <Avatar
                            name={toUser?.name ?? 'Omsim Member'}
                            size={44}
                            imageSource={
                              toUser?.profile?.avatar_url
                                ? { uri: toUser.profile.avatar_url }
                                : undefined
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <AppText variant="subtitle">{toUser?.name ?? 'Pending request'}</AppText>
                            <AppText tone="secondary">Follow request sent.</AppText>
                          </View>
                          <Button
                            label="Cancel"
                            size="sm"
                            variant="secondary"
                            onPress={() => cancelFollowRequestMutation.mutate(request.id)}
                          />
                        </Card>
                      );
                    })}
                  </>
                )}
              </View>
            </View>
          </View>
        }
        ListFooterComponent={
          !alertsQuery.trim().length &&
          !showAllAlerts &&
          filteredAlerts.length > 10 ? (
            <Pressable
              onPress={() => setShowAllAlerts(true)}
              accessibilityRole="button"
              accessibilityLabel="See previous alerts"
              style={{
                marginTop: theme.spacing.md,
                alignItems: 'center',
                paddingVertical: theme.spacing.sm,
              }}
            >
              <AppText tone="accent">See previous alerts</AppText>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const alertItem = item as MomentoNotification;
          const canOpen = typeof alertItem.memoryId === 'number';
          return (
            <Card
              onPress={
                canOpen ? () => void handleOpenAlert(alertItem) : undefined
              }
              style={{
                marginBottom: theme.spacing.sm,
                padding: theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: alertItem.isUnread ? theme.colors.accentSoft : theme.colors.surface,
                borderColor: alertItem.isUnread ? theme.colors.accent : theme.colors.borderSubtle,
              }}
            >
              <Avatar name={alertItem.user.name} size={46} imageSource={{ uri: alertItem.user.avatarUrl }} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <AppText variant="subtitle">{alertItem.user.name}</AppText>
                <AppText tone="secondary">{alertItem.text}</AppText>
                <AppText variant="caption" tone="secondary">
                  {alertItem.timeAgo}
                </AppText>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={iconForType(alertItem.type)} size={16} color={theme.colors.accent} />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: theme.spacing.lg }}>
            <AppText tone="secondary">You are all caught up.</AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};



