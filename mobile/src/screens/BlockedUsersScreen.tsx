import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { api } from '../api';
import { User } from '../api/types';
import { useTheme } from '../theme/useTheme';

export const BlockedUsersScreen = () => {
  const theme = useTheme();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadBlocked = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await api.blockedUsers();
      setItems(response.data ?? []);
    } catch (error) {
      Alert.alert('Unable to load', 'Blocked users could not be loaded.');
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
      void loadBlocked();
    }, [loadBlocked])
  );

  const handleUnblock = async (id: number) => {
    if (busyId === id) return;
    setBusyId(id);
    try {
      await api.unblockUser(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert('Unable to unblock', 'We could not unblock this user.');
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
        onRefresh={() => loadBlocked(true)}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Blocked users</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Manage people you have blocked.
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
              <AppText tone="secondary">No blocked users.</AppText>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="subtitle">{item.name ?? item.username ?? 'User'}</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              @{item.username ?? 'unknown'}
            </AppText>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={busyId === item.id ? 'Unblocking...' : 'Unblock'}
                variant="secondary"
                onPress={() => void handleUnblock(item.id)}
                disabled={busyId === item.id}
              />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};
