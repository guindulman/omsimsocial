import React from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { MessageBubble } from '../components/MessageBubble';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const BackstageThreadScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BackstageThread'>>();
  const { threads, posts, users, hasAdopted, isConnected, currentUserId } = useAppState();

  const thread = threads.find((item) => item.id === route.params.threadId);
  const post = thread ? posts.find((item) => item.id === thread.postId) : undefined;
  const author = post ? users.find((user) => user.id === post.authorId) : undefined;
  const unlocked = post ? isConnected(post.authorId) || hasAdopted(post.id) : false;

  if (!thread || !post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Thread not found.</AppText>
      </View>
    );
  }

  if (!unlocked) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg }}>
        <Card>
          <AppText variant="title">Backstage Locked</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">
              Unlock by connecting with {author?.name ?? 'the author'} or saving this pulse.
            </AppText>
          </View>
          <View style={{ marginTop: theme.spacing.lg }}>
            <Button label="Connect Hub" icon="handshake" onPress={() => navigation.navigate('ConnectHub')} />
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Button label="Save Pulse" icon="adopt" variant="secondary" onPress={() => navigation.navigate('AdoptSheet', { postId: post.id })} />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <AppText variant="title">{thread.title}</AppText>
        <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <AppText tone="secondary">{thread.topic}</AppText>
        </View>
        {thread.messages.map((message) => (
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
            <Input placeholder="Send a backstage note..." />
          </View>
          <Button label="Send" icon="send" variant="primary" size="sm" />
        </View>
      </View>
    </View>
  );
};
