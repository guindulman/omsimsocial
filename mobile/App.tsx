import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/state/authStore';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useTheme } from './src/theme/useTheme';
import { useSettingsStore } from './src/store/settingsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

const Bootstrap = () => {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return null;
};

const SettingsBootstrap = () => {
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings({ force: true });
  }, [loadSettings]);

  return null;
};

const SettingsThemeSync = () => {
  const themePreference = useSettingsStore((state) => state.themePreference);
  const settingsHydrated = useSettingsStore((state) => state.hydrated);
  const { theme, updateTheme } = useAppState();

  useEffect(() => {
    if (!settingsHydrated) return;
    const desiredMode = themePreference;
    if (theme.mode !== desiredMode) {
      updateTheme({ mode: desiredMode });
    }
  }, [settingsHydrated, theme.mode, themePreference, updateTheme]);

  return null;
};

const NavigationShell = () => {
  const theme = useTheme();
  const navTheme = {
    ...DefaultTheme,
    dark: theme.isDark,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.borderSubtle,
      primary: theme.colors.accent,
      notification: theme.colors.urgency,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Bootstrap />
          <SettingsBootstrap />
          <NavigationContainer theme={navTheme}>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const ThemedApp = () => {
  const { theme, profile } = useAppState();
  return (
    <>
      <SettingsThemeSync />
      <ThemeProvider mode={theme.mode} oled={theme.oled} accent={profile.accent}>
        <NavigationShell />
      </ThemeProvider>
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AppStateProvider>
      <ThemedApp />
    </AppStateProvider>
  );
}
