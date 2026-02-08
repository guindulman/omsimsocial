import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const BackstageScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { threads, posts, users, isConnected, hasAdopted, connections } = useAppState();

  const data = useMemo(() => {
    return threads.map((thread) => {
      const post = posts.find((item) => item.id === thread.postId);
      const author = post ? users.find((user) => user.id === post.authorId) : undefined;
      const unlocked = post ? isConnected(post.authorId) || hasAdopted(post.id) : false;
      const lastMessage = thread.messages[thread.messages.length - 1];
      return { thread, post, author, unlocked, lastMessage };
    });
  }, [threads, posts, users, isConnected, hasAdopted]);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.thread.id}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Card>
            <AppText variant="title">Backstage</AppText>
            <View style={{ marginTop: theme.spacing.sm }}>
              <AppText tone="secondary">
                Locked by default. Unlock by connecting or saving a pulse.
              </AppText>
            </View>
            <View style={{ marginTop: theme.spacing.lg }}>
              <AppText variant="subtitle">Live Link (Phase 2)</AppText>
              <View style={{ marginTop: theme.spacing.sm }}>
                <AppText tone="secondary">Connection-only live rooms. UI frame only.</AppText>
              </View>
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={connections.length > 0 ? 'Enter Live Link' : 'Connections Only'}
                  icon="video"
                  variant={connections.length > 0 ? 'primary' : 'secondary'}
                  onPress={() => connections.length > 0 && navigation.navigate('LiveLink')}
                />
              </View>
            </View>
          </Card>
        </View>
      }
      renderItem={({ item }) => (
        <Card
          onPress={
            item.unlocked ? () => navigation.navigate('BackstageThread', { threadId: item.thread.id }) : undefined
          }
          style={{ opacity: item.unlocked ? 1 : 0.7 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="backstage" />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <AppText variant="subtitle">{item.thread.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {item.thread.topic}
              </AppText>
            </View>
            {item.unlocked ? <Icon name="chevron-right" /> : <Icon name="lock" />}
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">
                {item.unlocked
                  ? item.lastMessage?.text ?? 'No messages yet.'
                : 'Unlock by Connecting or Saving.'}
            </AppText>
          </View>
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
    />
  );
};
