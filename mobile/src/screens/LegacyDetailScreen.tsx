import React from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { MediaPlaceholder } from '../components/MediaPlaceholder';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const LegacyDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LegacyDetail'>>();
  const { posts, users } = useAppState();

  const post = posts.find((item) => item.id === route.params.postId);
  if (!post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText>Legacy post not found.</AppText>
      </View>
    );
  }

  const author = users.find((user) => user.id === post.authorId);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Card>
        <AppText variant="title">Legacy Detail</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          <AppText tone="secondary">Archived from the Pulse. Timers removed.</AppText>
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <MediaPlaceholder type={post.media[0]?.type ?? 'image'} style={{ height: 240 }} />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">{author?.name ?? 'Omsim Member'}</AppText>
        <AppText tone="secondary">@{author?.handle ?? 'omsim'}</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          <Chip label="Legacy" tone="accent" />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <AppText>{post.caption}</AppText>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="Share Legacy (stub)" icon="share" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
};
