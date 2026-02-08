import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { MemoryCard } from '../../components/MemoryCard';
import { useOnboardingStore } from '../../state/onboardingStore';
import { useTheme } from '../../theme/useTheme';

const demoMemories = [
  {
    id: 1,
    body: 'First coffee after the rain.',
    scope: 'circle',
    created_at: new Date().toISOString(),
    author: { name: 'Omsim Demo', id: 0, username: 'demo' },
  },
  {
    id: 2,
    body: 'Late-night walk by the bay.',
    scope: 'circle',
    created_at: new Date().toISOString(),
    author: { name: 'Omsim Demo', id: 0, username: 'demo' },
  },
];

export const DemoFeedScreen = () => {
  const navigation = useNavigation();
  const markDemoSeen = useOnboardingStore((state) => state.markDemoSeen);
  const theme = useTheme();
  const { data } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.listConnections(),
  });

  useEffect(() => {
    if (data?.data?.length) {
      navigation.getParent()?.navigate('People' as never);
    }
  }, [data, navigation]);

  useEffect(() => {
    markDemoSeen();
  }, [markDemoSeen]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Demo Feed</AppText>
      <AppText tone="secondary">Sample memories until you make your first real one.</AppText>
      {demoMemories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory as any}
          onReact={() => undefined}
          onAdopt={() => undefined}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
});
