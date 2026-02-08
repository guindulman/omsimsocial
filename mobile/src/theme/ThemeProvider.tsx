import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { AccentChoice, Theme, ThemeMode, createTheme } from './tokens';

type ThemeProviderProps = {
  mode: ThemeMode;
  oled: boolean;
  accent: AccentChoice;
  children: React.ReactNode;
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider = ({ mode, oled, accent, children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const resolvedMode =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const theme = useMemo(() => createTheme(resolvedMode, oled, accent), [resolvedMode, oled, accent]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};
