import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useTheme } from '../../theme/useTheme';

const tabs = [
  { label: 'Messages', value: 'messages' },
  { label: 'Save Notes', value: 'notes' },
  { label: 'Requests', value: 'requests' },
] as const;

type TabValue = (typeof tabs)[number]['value'];

export const InboxHomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [active, setActive] = useState<TabValue>('messages');

  const adoptionNotes = useQuery({
    queryKey: ['inboxNotes'],
    queryFn: () => api.inboxAdoptionNotes(),
  });

  const requests = useQuery({
    queryKey: ['inboxRequests'],
    queryFn: () => api.inboxRequests(),
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedControl
        options={tabs}
        value={active}
        onChange={(value) => setActive(value as TabValue)}
      />

      {active === 'messages' ? (
        <EmptyState
          title="No messages yet"
          subtitle="Messages are only between connections."
          ctaLabel="Connect"
          onPress={() => navigation.getParent()?.navigate('People' as never)}
        />
      ) : null}

      {active === 'notes' ? (
        <View style={{ gap: theme.spacing.md }}>
          {adoptionNotes.data?.data?.length ? (
            adoptionNotes.data.data.map((event) => (
              <Card key={event.id} style={styles.row}>
                <AppText variant="subtitle">Save Note</AppText>
                <AppText tone="secondary">{event.data?.note || 'A memory was saved.'}</AppText>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No save notes yet"
              subtitle="Post a memory and invite someone to save it."
              ctaLabel="Post Memory"
              onPress={() => navigation.getParent()?.navigate('Create' as never)}
            />
          )}
        </View>
      ) : null}

      {active === 'requests' ? (
        <View style={{ gap: theme.spacing.md }}>
          {requests.data?.data?.length ? (
            requests.data.data.map((event) => (
              <Card key={event.id} style={styles.row}>
                <AppText variant="subtitle">Connection request</AppText>
                <AppText tone="secondary">Check People tab to accept.</AppText>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No requests"
              subtitle="Invite someone to connect."
              ctaLabel="Invite"
              onPress={() => navigation.getParent()?.navigate('People' as never)}
            />
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  row: {
    gap: 6,
  },
});
