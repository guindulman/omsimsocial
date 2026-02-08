import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';

export const CreateTimeCapsuleScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [unlockAt, setUnlockAt] = useState(new Date().toISOString());
  const [memoryIds, setMemoryIds] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.createTimeCapsule({
        title,
        unlock_at: unlockAt,
        scope: 'private',
        memory_ids: memoryIds
          .split(',')
          .map((value) => Number(value.trim()))
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules'] });
      navigation.goBack();
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Time Capsule</Text>
      <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput
        placeholder="Unlock date (ISO)"
        style={styles.input}
        value={unlockAt}
        onChangeText={setUnlockAt}
      />
      <TextInput
        placeholder="Memory IDs (comma separated)"
        style={styles.input}
        value={memoryIds}
        onChangeText={setMemoryIds}
      />
      <TouchableOpacity style={styles.primary} onPress={() => mutation.mutate()}>
        <Text style={styles.primaryText}>Create</Text>
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
