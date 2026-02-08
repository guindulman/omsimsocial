import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { MemoryCard } from '../../components/MemoryCard';
import { EmptyState } from '../../components/EmptyState';

export const OnThisDayScreen = () => {
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ['vaultOnThisDay'],
    queryFn: () => api.vaultOnThisDay(),
  });

  const memories = data?.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={memories}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MemoryCard memory={item} onReact={() => undefined} onAdopt={() => undefined} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No memories for this day yet"
            subtitle="Post a memory to start your timeline."
            ctaLabel="Post Memory"
            onPress={() => navigation.getParent()?.navigate('Create' as never)}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
});
