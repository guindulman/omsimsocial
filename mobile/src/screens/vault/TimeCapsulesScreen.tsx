import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { EmptyState } from '../../components/EmptyState';

export const TimeCapsulesScreen = () => {
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ['timeCapsules'],
    queryFn: () => api.listTimeCapsules(),
  });

  const capsules = data?.data ?? [];

  return (
    <View style={styles.container}>
      {capsules.length === 0 ? (
        <EmptyState
          title="No time capsules yet"
          subtitle="Create a capsule to unlock a future moment."
          ctaLabel="Create Time Capsule"
          onPress={() => navigation.navigate('CreateTimeCapsule' as never)}
        />
      ) : (
        <FlatList
          data={capsules}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{item.title || 'Untitled capsule'}</Text>
              <Text style={styles.rowMeta}>Unlocks {new Date(item.unlock_at).toDateString()}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTimeCapsule' as never)}>
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
  row: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowMeta: {
    color: '#6b7280',
    marginTop: 6,
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
