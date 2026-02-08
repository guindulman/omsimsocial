import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { useTheme } from '../../theme/useTheme';
import { momentoConversations } from '../../mock/momentoData';
import { friendApi } from '../../api/friendApi';
import { api } from '../../api';
import { normalizeMediaUrl } from '../../utils/momentoAdapter';

export const MessagesScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendApi.friends(),
  });
  const unreadBySenderQuery = useQuery({
    queryKey: ['messages', 'unread-by-sender'],
    queryFn: () => api.messageUnreadBySender(),
  });

  const friends = friendsQuery.data?.data ?? [];
  const unreadBySender = unreadBySenderQuery.data?.data ?? [];
  const unreadMap = new Map<number, number>(
    unreadBySender.map((row) => [row.sender_id, row.unread_count])
  );
  const friendItems =
    friends
      .map((friendship) => {
        const user = friendship.user;
        if (!user) return null;
        return {
          id: `friend-${friendship.id}`,
          user: {
            id: String(user.id),
            name: user.name ?? 'Omsim Friend',
            username: user.username ?? 'friend',
            avatarUrl:
              normalizeMediaUrl(user.profile?.avatar_url) ??
              `https://i.pravatar.cc/200?img=${(user.id % 70) + 1}`,
          },
          lastMessage: 'Tap to start chatting.',
          timeAgo: '',
          unreadCount: unreadMap.get(user.id) ?? 0,
        };
      })
      .filter(Boolean) ?? [];

  const conversations = friendItems.length ? friendItems : momentoConversations;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) return conversations;
    return conversations.filter((conversation) => {
      const name = conversation.user.name?.toLowerCase() ?? '';
      const handle = conversation.user.username?.toLowerCase() ?? '';
      return name.includes(normalizedQuery) || handle.includes(normalizedQuery);
    });
  }, [conversations, normalizedQuery]);

  const activeUsers = useMemo(() => {
    const parseMinutes = (value?: string) => {
      if (!value) return null;
      const trimmed = value.trim().toLowerCase();
      if (trimmed.endsWith('m')) {
        const mins = Number.parseInt(trimmed.replace('m', ''), 10);
        return Number.isFinite(mins) ? mins : null;
      }
      if (trimmed.endsWith('h')) {
        const hours = Number.parseInt(trimmed.replace('h', ''), 10);
        return Number.isFinite(hours) ? hours * 60 : null;
      }
      return null;
    };

    const seen = new Set<string>();
    return conversations.filter((conversation) => {
      const minutes = parseMinutes(conversation.timeAgo);
      const isActive = conversation.unreadCount > 0 || (minutes !== null && minutes <= 10);
      if (!isActive) return false;
      if (seen.has(conversation.user.id)) return false;
      seen.add(conversation.user.id);
      return true;
    });
  }, [conversations]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Messages</AppText>
            <AppText tone="secondary">Catch up with your closest friends.</AppText>
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
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search chats"
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

            {activeUsers.length ? (
              <View style={{ marginTop: theme.spacing.lg }}>
                <AppText variant="subtitle">Active now</AppText>
                <FlatList
                  data={activeUsers}
                  keyExtractor={(item) => item.user.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        const parsedUserId = Number(item.user.id);
                        navigation.navigate(
                          'Chat' as never,
                          {
                            conversationId: item.id,
                            userId: Number.isFinite(parsedUserId) ? parsedUserId : undefined,
                            user: item.user,
                          } as never
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open chat with ${item.user.name}`}
                      style={{ alignItems: 'center', width: 72 }}
                    >
                      <View>
                        <Avatar
                          name={item.user.name}
                          size={52}
                          imageSource={{ uri: item.user.avatarUrl }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#2ecc71',
                            borderWidth: 2,
                            borderColor: theme.colors.background,
                          }}
                        />
                      </View>
                      <AppText variant="caption" numberOfLines={1} style={{ marginTop: 6 }}>
                        {item.user.name}
                      </AppText>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              const parsedUserId = Number(item.user.id);
              navigation.navigate(
                'Chat' as never,
                {
                  conversationId: item.id,
                  userId: Number.isFinite(parsedUserId) ? parsedUserId : undefined,
                  user: item.user,
                } as never
              );
            }}
            accessibilityRole="button"
            accessibilityLabel={`Open chat with ${item.user.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: item.unreadCount > 0 ? theme.colors.accentSoft : theme.colors.surface,
              borderRadius: theme.radii.md,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: item.unreadCount > 0 ? theme.colors.accent : theme.colors.borderSubtle,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Avatar name={item.user.name} size={50} imageSource={{ uri: item.user.avatarUrl }} />
            <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
              <AppText variant="subtitle">{item.user.name}</AppText>
              <AppText tone="secondary" numberOfLines={1}>
                {item.lastMessage}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
              <AppText variant="caption" tone="secondary">
                {item.timeAgo}
              </AppText>
              {item.unreadCount > 0 ? (
                <View
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}
                >
                  <AppText variant="caption" style={{ color: theme.colors.surface }}>
                    {item.unreadCount}
                  </AppText>
                </View>
              ) : (
                <Feather name="check" size={16} color={theme.colors.textSecondary} />
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};
