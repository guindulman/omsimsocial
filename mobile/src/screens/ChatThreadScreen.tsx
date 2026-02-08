import React, { useLayoutEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { MessageBubble } from '../components/MessageBubble';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const ChatThreadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatThread'>>();
  const { conversations, users, currentUserId } = useAppState();

  const chat = conversations.find((item) => item.id === route.params.chatId);
  const otherId = chat?.participantIds.find((id) => id !== currentUserId);
  const otherUser = users.find((user) => user.id === otherId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUser?.name ?? chat?.title ?? 'Chat',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <Pressable style={{ marginRight: theme.spacing.md }}>
            <Icon name="call" />
          </Pressable>
          <Pressable>
            <Icon name="video" />
          </Pressable>
        </View>
      ),
    });
  }, [chat?.title, navigation, otherUser?.name, theme]);

  if (!chat) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Chat not found.</AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        {chat.messages.map((message) => (
          <MessageBubble
            key={message.id}
            text={message.text}
            isMine={message.senderId === currentUserId}
          />
        ))}
      </ScrollView>
      <View
        style={{
          padding: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.background,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button label="Attach" icon="attach" variant="ghost" size="sm" />
          <View style={{ flex: 1, marginHorizontal: theme.spacing.sm }}>
            <Input placeholder="Send a message..." />
          </View>
          <Button label="Voice" icon="mic" variant="secondary" size="sm" />
        </View>
      </View>
    </View>
  );
};
