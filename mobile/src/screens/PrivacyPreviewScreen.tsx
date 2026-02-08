import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Card } from '../components/Card';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../theme/useTheme';

export const PrivacyPreviewScreen = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Privacy preview</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          See how your profile appears to the public.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Card>
            <AppText variant="subtitle">{user?.name ?? 'Your Name'}</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              @{user?.username ?? 'username'}
            </AppText>
            <AppText style={{ marginTop: theme.spacing.sm }}>
              {user?.profile?.bio ?? 'This is how your bio appears to others.'}
            </AppText>
          </Card>

          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant="caption" tone="secondary">
              This preview hides private contact details and connection-only info.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
