import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../theme/useTheme';
import { useAppState } from '../state/AppState';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Divider } from '../components/Divider';
import { Icon } from '../components/Icon';
import { MediaPlaceholder } from '../components/MediaPlaceholder';
import { blendColors } from '../utils/colors';
import { formatCountdown, getTimeLeft, isDying } from '../utils/time';

export const PostDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostDetail'>>();
  const { posts, users, adoptions, threads, now, savePost, hasAdopted, isConnected } = useAppState();

  const post = posts.find((item) => item.id === route.params.postId);
  if (!post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Pulse not found.</AppText>
      </View>
    );
  }

  const author = users.find((user) => user.id === post.authorId);
  const postAdoptions = adoptions.filter((adoption) => adoption.postId === post.id);
  const thread = threads.find((item) => item.postId === post.id);
  const hasThread = Boolean(thread);
  const timeLeft = getTimeLeft(post.expiresAt, now);
  const totalWindow = post.expiresAt - post.createdAt;
  const ratio = totalWindow > 0 ? 1 - timeLeft.diff / totalWindow : 1;
  const borderColor = post.legacy
    ? theme.colors.accent
    : blendColors(theme.colors.accent, theme.colors.urgency, ratio);
  const dying = !post.legacy && isDying(post.expiresAt, now);
  const unlocked = isConnected(post.authorId) || hasAdopted(post.id);

  const adoptionPreview = useMemo(() => {
    return postAdoptions.slice(0, 3).map((adoption) => {
      const adopter = users.find((user) => user.id === adoption.userId);
      return {
        id: adoption.id,
        name: adopter?.name ?? 'Omsim Member',
        type: adoption.type,
        contribution: adoption.contribution,
      };
    });
  }, [postAdoptions, users]);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Card style={{ borderColor }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <Avatar name={author?.name ?? 'Unknown'} imageSource={author?.avatarUrl ? { uri: author.avatarUrl } : undefined} />
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">{author?.name ?? 'Unknown'}</AppText>
            <AppText variant="caption" tone="secondary">
              @{author?.handle ?? 'unknown'}
            </AppText>
          </View>
          {post.legacy ? <Chip label="Legacy" tone="accent" /> : null}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {post.media.length === 0 ? (
            <MediaPlaceholder type="image" style={{ width: 260, marginRight: theme.spacing.md }} />
          ) : (
            post.media.map((media) => (
              <MediaPlaceholder
                key={media.id}
                type={media.type}
                style={{ width: 260, marginRight: theme.spacing.md }}
              />
            ))
          )}
        </ScrollView>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText>{post.caption}</AppText>
      </View>

      <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {post.legacy ? (
          <Chip label="Legacy" tone="accent" />
        ) : (
          <Chip label={formatCountdown(post.expiresAt, now)} tone={dying ? 'urgent' : 'neutral'} pulse={dying} />
        )}
        <Chip label={`${post.adoptionCount} saves`} tone="neutral" />
      </View>

      {!post.legacy ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <View
            style={{
              height: 6,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.surfaceGlassStrong,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 6,
                width: `${Math.max(6, (1 - ratio) * 100)}%`,
                backgroundColor: borderColor,
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg }}>
        <Button label="Save (+1h)" icon="save" variant="secondary" onPress={() => savePost(post.id)} />
        <View style={{ width: theme.spacing.sm }} />
        <Button label="Save Pulse" icon="adopt" onPress={() => navigation.navigate('AdoptSheet', { postId: post.id })} />
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Backstage</AppText>
        <Card
          onPress={unlocked && hasThread ? () => navigation.navigate('BackstageThread', { threadId: thread.id }) : undefined}
          style={{ marginTop: theme.spacing.sm, opacity: unlocked ? 1 : 0.7 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="backstage" />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <AppText variant="subtitle">
                {unlocked ? (hasThread ? 'Open Backstage' : 'Backstage not started') : 'Locked Backstage'}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {unlocked
                  ? hasThread
                    ? 'Continue the thread with connections.'
                    : 'Start after your first save.'
                  : 'Unlock by connecting or saving.'}
              </AppText>
            </View>
            <Icon name={unlocked && hasThread ? 'chevron-right' : 'lock'} />
          </View>
        </Card>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <AppText variant="subtitle">Save Chain</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          {adoptionPreview.length === 0 ? (
            <Card>
              <AppText tone="secondary">No saves yet. Start the chain.</AppText>
            </Card>
          ) : (
            adoptionPreview.map((adoption) => (
              <Card key={adoption.id} style={{ marginBottom: theme.spacing.sm }}>
                <AppText variant="subtitle">{adoption.name}</AppText>
                <AppText variant="caption" tone="secondary">
                  {adoption.type.toUpperCase()} - {adoption.contribution}
                </AppText>
              </Card>
            ))
          )}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Safety</AppText>
        <View style={{ marginTop: theme.spacing.sm, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="report" />
                <View style={{ marginLeft: theme.spacing.sm }}>
                  <AppText variant="subtitle">Report</AppText>
                </View>
              </View>
            </Card>
          </Pressable>
          <Pressable style={{ flex: 1 }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="block" />
                <View style={{ marginLeft: theme.spacing.sm }}>
                  <AppText variant="subtitle">Block</AppText>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};
