import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { ApiError } from '../../api/client';
import { Memory } from '../../api/types';
import { AppText } from '../../components/AppText';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PostItem } from '../../components/PostItem';
import { useTheme } from '../../theme/useTheme';
import { mapMemoryToMomentoPost } from '../../utils/momentoAdapter';

type HiddenItem = {
  key: string;
  memoryId: number;
  memory: Memory;
};

export const HiddenPostsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const hiddenQuery = useQuery({
    queryKey: ['memories', 'hidden'],
    queryFn: () => api.hiddenMemories(),
  });

  const unhideMutation = useMutation({
    mutationFn: (memoryId: number) => api.unhideMemory(memoryId),
    onSuccess: (_response, memoryId) => {
      queryClient.setQueryData(['memories', 'hidden'], (prev: { data: Memory[] } | undefined) => {
        if (!prev) return prev;
        return { data: prev.data.filter((item) => item.id !== memoryId) };
      });
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-memories'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to unhide this post.';
      Alert.alert('Unhide failed', message);
    },
  });

  const items = useMemo<HiddenItem[]>(() => {
    const memories = hiddenQuery.data?.data ?? [];
    return memories.map((memory) => ({
      key: String(memory.id),
      memoryId: memory.id,
      memory,
    }));
  }, [hiddenQuery.data?.data]);

  const isBusy = hiddenQuery.isLoading || unhideMutation.isPending;
  const emptyCopy = hiddenQuery.isLoading
    ? 'Loading hidden posts...'
    : 'No hidden posts.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton onPress={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          paddingTop: theme.spacing.xxl,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Hidden posts</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Hidden posts are removed from your feed until you unhide them.
            </AppText>
            {hiddenQuery.isLoading ? (
              <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const post = mapMemoryToMomentoPost(item.memory);
          return (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <PostItem post={post} />
              <View style={{ marginTop: theme.spacing.sm }}>
                <Button
                  label={unhideMutation.isPending ? 'Unhiding...' : 'Unhide'}
                  variant="secondary"
                  size="sm"
                  onPress={() => unhideMutation.mutate(item.memoryId)}
                  disabled={isBusy}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingTop: theme.spacing.md }}>
            <Card>
              <AppText variant="subtitle">Hidden posts</AppText>
              <AppText tone="secondary">{emptyCopy}</AppText>
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};
