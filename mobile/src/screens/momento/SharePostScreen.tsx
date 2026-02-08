import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  Share,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { ApiError } from '../../api/client';
import { friendApi } from '../../api/friendApi';
import { normalizeMediaUrl } from '../../utils/momentoAdapter';
import { buildShareMessage, SharePostPayload } from '../../utils/share';

type SharePostParams = {
  post: SharePostPayload;
};

type ShareRecipient = {
  id: number;
  name: string;
  username: string;
  avatarUrl: string;
};

export const SharePostScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { post } = route.params as SharePostParams;
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRecipientId, setPendingRecipientId] = useState<number | null>(null);

  const friendsQuery = useQuery({
    queryKey: ['friends', 'share'],
    queryFn: () => friendApi.friends(),
  });

  const shareMessage = useMemo(() => buildShareMessage(post), [post]);

  const recipients = useMemo<ShareRecipient[]>(() => {
    const friends = friendsQuery.data?.data ?? [];
    return friends
      .map((friendship) => {
        const user = friendship.user;
        if (!user) return null;
        return {
          id: user.id,
          name: user.name ?? 'Omsim Friend',
          username: user.username ?? 'friend',
          avatarUrl:
            normalizeMediaUrl(user.profile?.avatar_url) ??
            `https://i.pravatar.cc/200?img=${(user.id % 70) + 1}`,
        } as ShareRecipient;
      })
      .filter(Boolean) as ShareRecipient[];
  }, [friendsQuery.data?.data]);

  const filteredRecipients = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return recipients;
    return recipients.filter((recipient) => {
      const name = recipient.name?.toLowerCase() ?? '';
      const handle = recipient.username?.toLowerCase() ?? '';
      return name.includes(normalized) || handle.includes(normalized);
    });
  }, [recipients, searchQuery]);

  const sendMutation = useMutation({
    mutationFn: async (recipient: ShareRecipient) => {
      await api.sendMessage({
        recipient_id: recipient.id,
        body: shareMessage,
      });
      return recipient;
    },
    onMutate: (recipient) => {
      setPendingRecipientId(recipient.id);
    },
    onSuccess: (recipient) => {
      setPendingRecipientId(null);
      navigation.dispatch(
        StackActions.replace('Chat' as never, {
          conversationId: `direct-${recipient.id}`,
          userId: recipient.id,
          user: {
            id: String(recipient.id),
            name: recipient.name,
            username: recipient.username,
            avatarUrl: recipient.avatarUrl,
          },
        } as never)
      );
    },
    onError: (error) => {
      setPendingRecipientId(null);
      const messageText =
        error instanceof ApiError
          ? (error.payload as { message?: string } | null)?.message || error.message
          : error instanceof Error
          ? error.message
          : 'Unable to share this moment right now.';
      Alert.alert('Share failed', messageText);
    },
  });

  const handleShareOutside = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
    }
  };

  const previewCaption = post.caption?.trim() || 'Shared moment';
  const previewHandle = post.authorUsername ? `@${post.authorUsername}` : null;
  const previewName = post.authorName ?? 'Omsim friend';
  const previewMediaUri = normalizeMediaUrl(post.mediaUri) ?? null;
  const isVideo = post.mediaType === 'video';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <FlatList
        data={filteredRecipients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Share to chat</AppText>
            <AppText tone="secondary">Send this moment to a friend.</AppText>

            <Card style={{ marginTop: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                {previewMediaUri ? (
                  <View>
                    <Image
                      source={{ uri: previewMediaUri }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: theme.radii.md,
                        backgroundColor: theme.colors.surfaceAlt,
                      }}
                    />
                    {isVideo ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 24,
                          left: 24,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather name="play" size={10} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {previewName}
                  </AppText>
                  {previewHandle ? (
                    <AppText variant="caption" tone="secondary">
                      {previewHandle}
                    </AppText>
                  ) : null}
                  <AppText tone="secondary" numberOfLines={2}>
                    {previewCaption}
                  </AppText>
                </View>
              </View>
              <Button
                label="Share to other apps"
                variant="secondary"
                size="sm"
                onPress={handleShareOutside}
                style={{ marginTop: theme.spacing.md }}
              />
            </Card>

            <View
              style={{
                marginTop: theme.spacing.lg,
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
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends"
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
          </View>
        }
        ListEmptyComponent={
          friendsQuery.isLoading ? (
            <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : friendsQuery.isError ? (
            <Card>
              <AppText tone="urgent">Unable to load friends right now.</AppText>
            </Card>
          ) : (
            <Card>
              <AppText tone="secondary">No friends available to message yet.</AppText>
            </Card>
          )
        }
        renderItem={({ item }) => {
          const isSending = pendingRecipientId === item.id;
          const isBusy = pendingRecipientId !== null;
          return (
            <Pressable
              onPress={() => {
                if (isBusy) return;
                sendMutation.mutate(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Share with ${item.name}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.md,
                padding: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Avatar name={item.name} size={48} imageSource={{ uri: item.avatarUrl }} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <AppText variant="subtitle">{item.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  @{item.username}
                </AppText>
              </View>
              {isSending ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <Feather name="send" size={18} color={theme.colors.textSecondary} />
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
};
