import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import {
  getSecurityPreferences,
  listSessions,
  logoutAllSessions,
  patchSecurityPreferences,
  SessionInfo,
} from '../api/preferencesApi';
import { useAuthStore } from '../state/authStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useTheme } from '../theme/useTheme';

export const SecurityCenterScreen = () => {
  const theme = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const security = usePreferencesStore((state) => state.security);
  const setSecurity = usePreferencesStore((state) => state.setSecurity);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const loadRequestId = useRef(0);
  const localUpdateId = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = loadRequestId.current + 1;
    const localAtStart = localUpdateId.current;
    loadRequestId.current = requestId;
    setLoading(true);
    try {
      const [sessionsResponse, securityResponse] = await Promise.all([
        listSessions(),
        getSecurityPreferences(),
      ]);
      if (loadRequestId.current !== requestId) return;
      if (localUpdateId.current !== localAtStart) return;
      setSessions(sessionsResponse);
      setSecurity(securityResponse);
    } catch (error) {
      Alert.alert('Unable to load', 'Security settings could not be loaded.');
    } finally {
      if (loadRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, [setSecurity]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleSecurityToggle = useCallback(
    async (key: 'passkeyEnabled' | 'twoFactorEnabled', value: boolean) => {
      const previous = usePreferencesStore.getState().security;
      const optimistic = { ...previous, [key]: value };
      const updateId = localUpdateId.current + 1;
      localUpdateId.current = updateId;
      setSecurity(optimistic);
      try {
        const response = await patchSecurityPreferences({ [key]: value });
        if (localUpdateId.current !== updateId) return;
        setSecurity(response);
      } catch (error) {
        if (localUpdateId.current === updateId) {
          setSecurity(previous);
        }
        Alert.alert('Update failed', 'We could not update your security settings.');
      }
    },
    [setSecurity]
  );

  const handleLogoutAll = () => {
    Alert.alert(
      'Log out of all devices?',
      'You will need to sign in again on every device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: loggingOut ? 'Logging out...' : 'Log out',
          style: 'destructive',
          onPress: async () => {
            if (loggingOut) return;
            setLoggingOut(true);
            try {
              await logoutAllSessions();
              await logout();
            } catch (error) {
              Alert.alert('Unable to log out', 'We could not log out of all devices.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Security center</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Manage devices and sign-in protections.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Card style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="subtitle">Passkey</AppText>
                <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                  Use a device passkey to sign in faster.
                </AppText>
              </View>
              <Switch
                value={security.passkeyEnabled}
                onValueChange={(value) => void handleSecurityToggle('passkeyEnabled', value)}
                trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                thumbColor={security.passkeyEnabled ? theme.colors.accent : theme.colors.surfaceAlt}
              />
            </View>
          </Card>

          <Card style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="subtitle">Two-factor authentication</AppText>
                <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                  Add a second step to secure your account.
                </AppText>
              </View>
              <Switch
                value={security.twoFactorEnabled}
                onValueChange={(value) => void handleSecurityToggle('twoFactorEnabled', value)}
                trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                thumbColor={security.twoFactorEnabled ? theme.colors.accent : theme.colors.surfaceAlt}
              />
            </View>
          </Card>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Active sessions</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            {loading ? (
              <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : sessions.length === 0 ? (
              <Card style={{ marginBottom: theme.spacing.md }}>
                <AppText tone="secondary">No active sessions found.</AppText>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} style={{ marginBottom: theme.spacing.md }}>
                  <AppText variant="subtitle">{session.device}</AppText>
                  <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                    {session.location} · {session.lastActive}
                    {session.current ? ' · This device' : ''}
                  </AppText>
                </Card>
              ))
            )}
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label="Log out of all devices" variant="secondary" onPress={handleLogoutAll} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
