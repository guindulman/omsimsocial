import React from 'react';
import { SafeAreaView, ScrollView, Switch, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Card } from '../components/Card';
import { SegmentedControl } from '../components/SegmentedControl';
import { usePreferencesStore } from '../store/preferencesStore';
import { useTheme } from '../theme/useTheme';

export const AccessibilityScreen = () => {
  const theme = useTheme();
  const accessibility = usePreferencesStore((state) => state.accessibility);
  const updateAccessibility = usePreferencesStore((state) => state.updateAccessibility);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Accessibility</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Customize text and motion settings.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Card style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="subtitle">Text size</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              Adjust the base text size across the app.
            </AppText>
            <SegmentedControl
              options={[
                { label: 'Small', value: 'sm' },
                { label: 'Default', value: 'md' },
                { label: 'Large', value: 'lg' },
              ]}
              value={accessibility.textSize}
              onChange={(value) => updateAccessibility({ textSize: value as 'sm' | 'md' | 'lg' })}
              style={{ marginTop: theme.spacing.md }}
            />
          </Card>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
                <AppText variant="subtitle">Reduce motion</AppText>
                <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                  Minimize animations and transitions.
                </AppText>
              </View>
              <Switch
                value={accessibility.reduceMotion}
                onValueChange={(value) => updateAccessibility({ reduceMotion: value })}
                trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                thumbColor={accessibility.reduceMotion ? theme.colors.accent : theme.colors.surfaceAlt}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
