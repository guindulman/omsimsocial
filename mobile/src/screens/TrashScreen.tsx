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

export const TrashScreen = () => {
  const theme = useTheme();
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTrash = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await api.trashMemories();
      setItems(response.data ?? []);
    } catch (error) {
      Alert.alert('Unable to load', 'Trash could not be loaded.');
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
      void loadTrash();
    }, [loadTrash])
  );

  const handleRestore = async (id: number) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      await api.restoreMemory(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert('Unable to restore', 'We could not restore this item.');
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
        onRefresh={() => loadTrash(true)}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Trash</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Restore items or let them expire after 10 days.
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
              <AppText tone="secondary">Trash is empty.</AppText>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="subtitle">{item.body?.slice(0, 80) || 'Deleted memory'}</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Deleted {formatTimeAgo(item.deleted_at ?? item.created_at)}
            </AppText>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={busyId === item.id ? 'Restoring...' : 'Restore'}
                variant="secondary"
                onPress={() => void handleRestore(item.id)}
                disabled={busyId === item.id}
              />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};
