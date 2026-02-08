import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { PostCard } from '../components/PostCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { RootStackParamList } from '../navigation/types';
import { blendColors } from '../utils/colors';
import { formatCountdown, isDying, getTimeLeft } from '../utils/time';

const filters = [
  { label: 'Connections', value: 'connections' },
  { label: 'Near You', value: 'nearby' },
];

export const PulseScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, users, now, savePost } = useAppState();
  const [filter, setFilter] = useState<'connections' | 'nearby'>('connections');

  const data = useMemo(() => {
    return posts
      .filter((post) => post.visibility === filter)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, filter]);

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
          <Card>
            <AppText variant="title">Pulse</AppText>
            <View style={{ marginTop: theme.spacing.sm }}>
              <AppText tone="secondary">Real Connections. Lasting Legacies.</AppText>
            </View>
            <SegmentedControl
              options={filters}
              value={filter}
              onChange={(value) => setFilter(value as 'connections' | 'nearby')}
              style={{ marginTop: theme.spacing.lg }}
            />
          </Card>
        </View>
      }
      renderItem={({ item }) => {
        const author = users.find((user) => user.id === item.authorId);
        if (!author) return null;
        const timeLeft = getTimeLeft(item.expiresAt, now).diff;
        const totalWindow = item.expiresAt - item.createdAt;
        const ratio = totalWindow > 0 ? 1 - timeLeft / totalWindow : 1;
        const borderColor = item.legacy
          ? theme.colors.accent
          : blendColors(theme.colors.accent, theme.colors.urgency, ratio);
        const dying = !item.legacy && isDying(item.expiresAt, now);

        return (
          <PostCard
            post={item}
            author={author}
            timeLabel={item.legacy ? 'Legacy' : formatCountdown(item.expiresAt, now)}
            isDying={dying}
            borderColor={borderColor}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onLongPress={() => navigation.navigate('AdoptSheet', { postId: item.id })}
            onSave={() => savePost(item.id)}
            onAdopt={() => navigation.navigate('AdoptSheet', { postId: item.id })}
          />
        );
      }}
      ListEmptyComponent={
        <Card style={{ alignItems: 'center' }}>
          <AppText variant="subtitle">No pulses here yet.</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Switch filters or create a new pulse.</AppText>
          </View>
        </Card>
      }
    />
  );
};
