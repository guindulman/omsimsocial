import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../theme/useTheme';

export const VaultHomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { data } = useQuery({
    queryKey: ['vault'],
    queryFn: () => api.vaultSummary(),
  });

  const adopted = data?.adopted ?? [];

  if (!adopted.length) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          title="Your Keeps are empty"
          subtitle="Save a memory to keep it forever."
          ctaLabel="Post Memory"
          onPress={() => navigation.navigate('Create' as never)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Keeps</AppText>
      <Card onPress={() => navigation.navigate('AdoptedList' as never)} style={styles.card}>
        <AppText variant="subtitle">Saved</AppText>
        <AppText tone="secondary">{adopted.length} items</AppText>
      </Card>
      <Card onPress={() => navigation.navigate('TimeCapsules' as never)} style={styles.card}>
        <AppText variant="subtitle">Time Capsules</AppText>
        <AppText tone="secondary">{data?.time_capsules_count ?? 0} capsules</AppText>
      </Card>
      <Card onPress={() => navigation.navigate('OnThisDay' as never)} style={styles.card}>
        <AppText variant="subtitle">On This Day</AppText>
        <AppText tone="secondary">View memories from this date</AppText>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    gap: 6,
  },
});
