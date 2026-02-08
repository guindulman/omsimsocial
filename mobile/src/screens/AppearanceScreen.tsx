import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Switch, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Card } from '../components/Card';
import { useAppState } from '../state/AppState';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/useTheme';

const modes = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const;

export const AppearanceScreen = () => {
  const theme = useTheme();
  const { theme: preferences, updateTheme } = useAppState();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Appearance</AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Theme mode</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
            {modes.map((mode) => {
              const active = themePreference === mode.id;
              return (
                <Pressable key={mode.id} onPress={() => void setThemePreference(mode.id)}>
                  <View
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.radii.pill,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.accent : theme.colors.borderSubtle,
                      backgroundColor: active ? theme.colors.accentSoft : theme.colors.surfaceAlt,
                      marginRight: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <AppText variant="caption" tone={active ? 'accent' : 'secondary'}>
                      {mode.label}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="subtitle">True Black (OLED)</AppText>
                <AppText tone="secondary">Dark mode only.</AppText>
              </View>
              <Switch
                value={preferences.oled}
                onValueChange={(value) => updateTheme({ oled: value })}
                trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
                thumbColor={preferences.oled ? theme.colors.accent : theme.colors.surfaceAlt}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
