import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';

const TYPES = ['friend', 'family', 'work', 'community'] as const;
const LEVELS = ['acquaintance', 'friend', 'inner'] as const;

export const ConfirmConnectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { connectionId, draft } = route.params as { connectionId: number; draft?: { body?: string; direct_user_id?: number } };

  const [type, setType] = useState<(typeof TYPES)[number]>('friend');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('friend');

  const mutation = useMutation({
    mutationFn: () => api.updateConnection(connectionId, { type, level }),
    onSuccess: () =>
      navigation.navigate('FirstMemoryCard' as never, {
        draft,
      } as never),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm connection</Text>
      <Text style={styles.subtitle}>Choose a relationship type and level.</Text>
      <View style={styles.group}>
        <Text style={styles.groupTitle}>Type</Text>
        <View style={styles.row}>
          {TYPES.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, type === value && styles.chipActive]}
              onPress={() => setType(value)}
            >
              <Text style={type === value ? styles.chipActiveText : styles.chipText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text style={styles.groupTitle}>Level</Text>
        <View style={styles.row}>
          {LEVELS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, level === value && styles.chipActive]}
              onPress={() => setLevel(value)}
            >
              <Text style={level === value ? styles.chipActiveText : styles.chipText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.primary} onPress={() => mutation.mutate()}>
        <Text style={styles.primaryText}>{mutation.isPending ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  group: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  groupTitle: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    color: '#6b7280',
  },
  chipActiveText: {
    color: '#fff',
  },
  primary: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
