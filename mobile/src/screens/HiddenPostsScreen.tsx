import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { api } from '../api';
import { Memory } from '../api/types';
import { useTheme } from '../theme/useTheme';
import { formatTimeAgo } from '../utils/time';

export const HiddenPostsScreen = () => {
  const theme = useTheme();
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadHidden = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await api.hiddenMemories();
      setItems(response.data ?? []);
    } catch (error) {
      Alert.alert('Unable to load', 'Hidden posts could not be loaded.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHidden();
    }, [loadHidden])
  );

  const handleUnhide = async (id: number) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      await api.unhideMemory(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert('Unable to unhide', 'We could not unhide this post.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}
        refreshing={refreshing}
        onRefresh={() => loadHidden(true)}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Hidden posts</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Review content you have hidden from your feed.
            </AppText>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : (
            <Card>
              <AppText tone="secondary">No hidden posts yet.</AppText>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="subtitle">{item.body?.slice(0, 80) || 'Hidden memory'}</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Hidden {formatTimeAgo(item.created_at)}
            </AppText>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={busyId === item.id ? 'Unhiding...' : 'Unhide'}
                variant="secondary"
                onPress={() => void handleUnhide(item.id)}
                disabled={busyId === item.id}
              />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};
