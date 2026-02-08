import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { useOnboardingStore } from '../../state/onboardingStore';

export const CreateCircleScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const markCircleCreated = useOnboardingStore((state) => state.markCircleCreated);
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.createCircle({ name, invite_only: true }),
    onSuccess: (data) => {
      markCircleCreated();
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      navigation.navigate('CircleFeed' as never, { circleId: data.circle.id } as never);
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Circle</Text>
      <TextInput
        placeholder="Circle name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity style={styles.primary} onPress={() => mutation.mutate()} disabled={!name}>
        <Text style={styles.primaryText}>{mutation.isPending ? 'Creating...' : 'Create'}</Text>
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
