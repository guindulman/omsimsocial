import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const ChatsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { conversations, users, currentUserId, isConnected } = useAppState();

  const data = useMemo(() => {
    return conversations.filter((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== currentUserId);
      return otherId ? isConnected(otherId) : false;
    });
  }, [conversations, currentUserId, isConnected]);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.lg }}>
          <AppText variant="title">Chats</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Connections-only direct messages.</AppText>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const otherId = item.participantIds.find((id) => id !== currentUserId);
        const otherUser = users.find((user) => user.id === otherId);
        const lastMessage = item.messages[item.messages.length - 1];
        return (
          <Card onPress={() => navigation.navigate('ChatThread', { chatId: item.id })}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={otherUser?.name ?? item.title} imageSource={otherUser?.avatarUrl ? { uri: otherUser.avatarUrl } : undefined} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <AppText variant="subtitle">{otherUser?.name ?? item.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {lastMessage?.text ?? 'Start a conversation.'}
                </AppText>
              </View>
              <Icon name="chevron-right" />
            </View>
          </Card>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
      ListEmptyComponent={
        <Card style={{ alignItems: 'center' }}>
          <AppText variant="subtitle">No connections yet.</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Connect to unlock direct messages.</AppText>
          </View>
        </Card>
      }
    />
  );
};
