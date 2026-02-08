import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { EmptyState } from '../../components/EmptyState';

export const RequestsScreen = () => {
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ['inboxRequests'],
    queryFn: () => api.inboxRequests(),
  });

  return (
    <View style={styles.container}>
      {data?.data?.length ? (
        data.data.map((event) => (
          <View key={event.id} style={styles.row}>
            <Text style={styles.rowTitle}>Connection request</Text>
            <Text style={styles.rowMeta}>Check People to accept.</Text>
          </View>
        ))
      ) : (
        <EmptyState
          title="No requests yet"
          subtitle="Invite someone to connect."
          ctaLabel="Invite"
          onPress={() => navigation.getParent()?.navigate('People' as never)}
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
