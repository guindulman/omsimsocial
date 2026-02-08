import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';

export const CircleSettingsScreen = () => {
  const route = useRoute();
  const { circleId } = route.params as { circleId: number };
  const [name, setName] = useState('');
  const [promptFrequency, setPromptFrequency] = useState<'off' | 'daily' | 'weekly'>('weekly');

  const mutation = useMutation({
    mutationFn: () => api.updateCircle(circleId, { name, prompt_frequency: promptFrequency }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Circle Settings</Text>
      <TextInput placeholder="Circle name" style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Prompt cadence</Text>
      <View style={styles.row}>
        {(['off', 'daily', 'weekly'] as const).map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.chip, promptFrequency === value && styles.chipActive]}
            onPress={() => setPromptFrequency(value)}
          >
            <Text style={promptFrequency === value ? styles.chipActiveText : styles.chipText}>
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.primary} onPress={() => mutation.mutate()}>
        <Text style={styles.primaryText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  label: {
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
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
