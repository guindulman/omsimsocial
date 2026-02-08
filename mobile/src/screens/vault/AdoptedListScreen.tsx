import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { MemoryCard } from '../../components/MemoryCard';
import { EmptyState } from '../../components/EmptyState';

export const AdoptedListScreen = () => {
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ['vaultAdopted'],
    queryFn: () => api.vaultAdopted(),
  });

  const items = data?.data ?? [];

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <EmptyState
          title="No saved memories yet"
          subtitle="Save a memory from a circle to keep it here."
          ctaLabel="Browse Circles"
          onPress={() => navigation.getParent()?.navigate('Circles' as never)}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            item.memory ? (
              <MemoryCard
                memory={item.memory}
                onReact={() => undefined}
                onAdopt={() => undefined}
              />
            ) : (
              <Text>Memory unavailable</Text>
            )
          }
        />
      )}
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
