import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { Memory } from '../../api/types';
import { MemoryCard } from '../../components/MemoryCard';
import { EmptyState } from '../../components/EmptyState';

export const CircleFeedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { circleId } = route.params as { circleId: number };
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['circleFeed', circleId],
    queryFn: () => api.circleFeed(circleId),
  });

  const reactMutation = useMutation({
    mutationFn: ({ memoryId, emoji }: { memoryId: number; emoji: string }) =>
      api.reactMemory(memoryId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circleFeed', circleId] }),
  });

  const adoptMutation = useMutation({
    mutationFn: ({ memoryId, note, visibility }: { memoryId: number; note?: string; visibility: 'private' | 'shared' }) =>
      api.adoptMemory(memoryId, { note, visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circleFeed', circleId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      queryClient.invalidateQueries({ queryKey: ['vaultAdopted'] });
      queryClient.invalidateQueries({ queryKey: ['inboxNotes'] });
    },
  });

  const memories = data?.memories ?? [];

  return (
    <View style={styles.container}>
      {data?.prompt ? (
        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>Prompt</Text>
          <Text style={styles.promptBody}>{data.prompt.prompt}</Text>
        </View>
      ) : null}

      {memories.length === 0 ? (
        <EmptyState
          title="No memories yet"
          subtitle="Post the first memory for this circle."
          ctaLabel="Post Memory"
          onPress={() => navigation.navigate('CreateEditor' as never)}
        />
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MemoryCard
              memory={item}
              onReact={(emoji) => reactMutation.mutate({ memoryId: item.id, emoji })}
              onAdopt={(payload) => adoptMutation.mutate({ memoryId: item.id, ...payload })}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateEditor' as never)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  prompt: {
    backgroundColor: '#fff7ed',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  promptTitle: {
    fontWeight: '600',
  },
  promptBody: {
    color: '#6b7280',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#111827',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 22,
  },
});
