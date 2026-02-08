import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../../api';
import { Circle } from '../../api/types';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/useTheme';

export const CirclesHomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { data } = useQuery({
    queryKey: ['circles'],
    queryFn: () => api.listCircles(),
  });

  const circles = data?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {circles.length === 0 ? (
        <EmptyState
          title="No circles yet"
          subtitle="Create a circle for friends, family, or work."
          ctaLabel="Create Circle"
          onPress={() => navigation.navigate('CreateCircle' as never)}
        />
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CircleRow circle={item} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateCircle' as never)}>
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabFill}
        >
          <Icon name="plus" size={22} color={theme.colors.surface} />
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const CircleRow = ({ circle }: { circle: Circle }) => {
  const navigation = useNavigation();
  return (
    <Card
      onPress={() => navigation.navigate('CircleFeed' as never, { circleId: circle.id } as never)}
      style={styles.row}
    >
      <AppText variant="subtitle">{circle.name}</AppText>
      <AppText tone="secondary" style={{ marginTop: 6 }}>
        {circle.prompt_frequency} prompts
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabFill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
