import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Card } from '../components/Card';
import {
  getNotificationPreferences,
  patchNotificationPreferences,
  NotificationPreferences,
} from '../api/preferencesApi';
import { usePreferencesStore } from '../store/preferencesStore';
import { useTheme } from '../theme/useTheme';

const formatHour = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}:00 ${period}`;
};

export const NotificationPreferencesScreen = () => {
  const theme = useTheme();
  const notifications = usePreferencesStore((state) => state.notifications);
  const setNotifications = usePreferencesStore((state) => state.setNotifications);
  const [loading, setLoading] = useState(false);
  const loadRequestId = useRef(0);
  const localUpdateId = useRef(0);

  const loadPreferences = useCallback(async () => {
    const requestId = loadRequestId.current + 1;
    const localAtStart = localUpdateId.current;
    loadRequestId.current = requestId;
    setLoading(true);
    try {
      const preferences = await getNotificationPreferences();
      if (loadRequestId.current !== requestId) return;
      if (localUpdateId.current !== localAtStart) return;
      setNotifications(preferences);
    } catch (error) {
      Alert.alert('Unable to load', 'Notification preferences could not be loaded.');
    } finally {
      if (loadRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, [setNotifications]);

  const applyUpdates = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      const previous = usePreferencesStore.getState().notifications;
      const optimistic = { ...previous, ...updates };
      const updateId = localUpdateId.current + 1;
      localUpdateId.current = updateId;
      setNotifications(optimistic);
      try {
        const response = await patchNotificationPreferences(updates);
        if (localUpdateId.current !== updateId) return;
        setNotifications(response);
      } catch (error) {
        if (localUpdateId.current === updateId) {
          setNotifications(previous);
        }
        Alert.alert('Update failed', 'We could not update your notification preferences.');
      }
    },
    [setNotifications]
  );

  useFocusEffect(
    useCallback(() => {
      void loadPreferences();
    }, [loadPreferences])
  );

  const adjustHour = (field: 'quietHoursStart' | 'quietHoursEnd', delta: number) => {
    const current = notifications[field];
    const next = (current + delta + 24) % 24;
    const nextStart = field === 'quietHoursStart' ? next : notifications.quietHoursStart;
    const nextEnd = field === 'quietHoursEnd' ? next : notifications.quietHoursEnd;
    void applyUpdates({ quietHoursStart: nextStart, quietHoursEnd: nextEnd });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Notification preferences</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Choose which alerts you want to receive.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          {loading ? (
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : null}
          {[
            {
              key: 'mentions' as const,
              title: 'Mentions',
              description: 'Get notified when someone mentions you.',
            },
            {
              key: 'directMessages' as const,
              title: 'Direct messages',
              description: 'Alerts for new DMs and replies.',
            },
            {
              key: 'follows' as const,
              title: 'New followers',
              description: 'Know when someone follows you.',
            },
          ].map((item) => (
            <Card key={item.key} style={{ marginBottom: theme.spacing.md }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle">{item.title}</AppText>
                  <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                    {item.description}
                  </AppText>
                </View>
                <Switch
                  value={notifications[item.key]}
                  onValueChange={(value) => void applyUpdates({ [item.key]: value })}
                  trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                  thumbColor={notifications[item.key] ? theme.colors.accent : theme.colors.surfaceAlt}
                />
              </View>
            </Card>
          ))}

          <Card style={{ marginBottom: theme.spacing.md }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">Quiet hours</AppText>
                <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                  Silence notifications during set hours.
                </AppText>
              </View>
              <Switch
                value={notifications.quietHoursEnabled}
                onValueChange={(value) => void applyUpdates({ quietHoursEnabled: value })}
                trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                thumbColor={notifications.quietHoursEnabled ? theme.colors.accent : theme.colors.surfaceAlt}
              />
            </View>

            {notifications.quietHoursEnabled ? (
              <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                {([
                  { label: 'Start', field: 'quietHoursStart' as const },
                  { label: 'End', field: 'quietHoursEnd' as const },
                ] as const).map((item) => (
                  <View key={item.field} style={styles.timeRow}>
                    <AppText variant="caption" tone="secondary">
                      {item.label}
                    </AppText>
                    <View style={styles.stepperGroup}>
                      <Pressable
                        onPress={() => adjustHour(item.field, -1)}
                        style={({ pressed }) => [
                          styles.stepper,
                          {
                            borderColor: theme.colors.borderSubtle,
                            backgroundColor: theme.colors.surfaceAlt,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <AppText>-</AppText>
                      </Pressable>
                      <AppText style={{ minWidth: 90, textAlign: 'center' }}>
                        {formatHour(notifications[item.field])}
                      </AppText>
                      <Pressable
                        onPress={() => adjustHour(item.field, 1)}
                        style={({ pressed }) => [
                          styles.stepper,
                          {
                            borderColor: theme.colors.borderSubtle,
                            backgroundColor: theme.colors.surfaceAlt,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <AppText>+</AppText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
