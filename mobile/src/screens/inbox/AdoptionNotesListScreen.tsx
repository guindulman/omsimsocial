import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { EmptyState } from '../../components/EmptyState';

export const AdoptionNotesListScreen = () => {
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ['inboxNotes'],
    queryFn: () => api.inboxAdoptionNotes(),
  });

  return (
    <View style={styles.container}>
      {data?.data?.length ? (
        data.data.map((event) => (
          <View key={event.id} style={styles.row}>
            <Text style={styles.rowTitle}>Save Note</Text>
            <Text style={styles.rowMeta}>{event.data?.note || 'A memory was saved.'}</Text>
          </View>
        ))
      ) : (
        <EmptyState
          title="No save notes yet"
          subtitle="Post a memory to invite a meaningful save."
          ctaLabel="Post Memory"
          onPress={() => navigation.getParent()?.navigate('Create' as never)}
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
    gap: 10,
  },
  row: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowMeta: {
    color: '#6b7280',
    marginTop: 4,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
