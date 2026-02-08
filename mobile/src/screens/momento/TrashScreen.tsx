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
import { formatTimeAgo } from '../../utils/time';

type TrashItem = {
  key: string;
  memoryId: number;
  memory: Memory;
  deletedAt?: string | null;
};

const buildDeletedMeta = (deletedAt?: string | null) => {
  if (!deletedAt) return null;
  const deletedMs = Date.parse(deletedAt);
  if (!Number.isFinite(deletedMs)) return null;
  const expiresMs = deletedMs + 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
  const deletedAgo = formatTimeAgo(deletedAt);
  const dayLabel = daysLeft === 1 ? 'day' : 'days';
  return `Deleted ${deletedAgo} ago · ${daysLeft} ${dayLabel} left`;
};

export const TrashScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const trashQuery = useQuery({
    queryKey: ['memories', 'trash'],
    queryFn: () => api.trashMemories(),
  });

  const restoreMutation = useMutation({
    mutationFn: (memoryId: number) => api.restoreMemory(memoryId),
    onSuccess: (_response, memoryId) => {
      queryClient.setQueryData(['memories', 'trash'], (prev: { data: Memory[] } | undefined) => {
        if (!prev) return prev;
        return { data: prev.data.filter((item) => item.id !== memoryId) };
      });
      queryClient.invalidateQueries({ queryKey: ['momento-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-memories'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to restore this post.';
      Alert.alert('Restore failed', message);
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (memoryId: number) => api.purgeMemory(memoryId),
    onSuccess: (_response, memoryId) => {
      queryClient.setQueryData(['memories', 'trash'], (prev: { data: Memory[] } | undefined) => {
        if (!prev) return prev;
        return { data: prev.data.filter((item) => item.id !== memoryId) };
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Unable to delete this post.';
      Alert.alert('Delete failed', message);
    },
  });

  const items = useMemo<TrashItem[]>(() => {
    const memories = trashQuery.data?.data ?? [];
    return memories.map((memory) => ({
      key: String(memory.id),
      memoryId: memory.id,
      memory,
      deletedAt: memory.deleted_at,
    }));
  }, [trashQuery.data?.data]);

  const handleRestore = (memoryId: number) => {
    restoreMutation.mutate(memoryId);
  };

  const handleDelete = (memoryId: number) => {
    Alert.alert(
      'Delete permanently?',
      'This post will be removed forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => purgeMutation.mutate(memoryId),
        },
      ],
      { cancelable: true }
    );
  };

  const isBusy = trashQuery.isLoading || restoreMutation.isPending || purgeMutation.isPending;
  const emptyCopy = trashQuery.isLoading
    ? 'Loading trash...'
    : 'Nothing in trash yet.';

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
            <AppText variant="title">Trash</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Deleted posts stay here for 10 days before they are removed.
            </AppText>
            <View style={{ marginTop: theme.spacing.md }}>
              <Card>
                <AppText variant="caption" tone="secondary">
                  Tip: Restored posts return to your profile and feeds immediately.
                </AppText>
              </Card>
            </View>
            {trashQuery.isLoading ? (
              <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const post = mapMemoryToMomentoPost(item.memory);
          const meta = buildDeletedMeta(item.deletedAt);
          return (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <PostItem post={post} />
              <View
                style={{
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.sm,
                }}
              >
                <Button
                  label={restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                  variant="secondary"
                  size="sm"
                  onPress={() => handleRestore(item.memoryId)}
                  disabled={isBusy}
                  style={{ flex: 1 }}
                />
                <Button
                  label={purgeMutation.isPending ? 'Deleting...' : 'Delete'}
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDelete(item.memoryId)}
                  disabled={isBusy}
                  style={{ flex: 1 }}
                />
              </View>
              {meta ? (
                <AppText variant="caption" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                  {meta}
                </AppText>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingTop: theme.spacing.md }}>
            <Card>
              <AppText variant="subtitle">Trash</AppText>
              <AppText tone="secondary">{emptyCopy}</AppText>
            </Card>
          </View>
        }
      />
    </SafeAreaView>
  );
};
