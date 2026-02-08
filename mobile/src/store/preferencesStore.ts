import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TextSize = 'sm' | 'md' | 'lg';

export const textScaleForSize: Record<TextSize, number> = {
  sm: 0.92,
  md: 1,
  lg: 1.08,
};

type NotificationPreferences = {
  mentions: boolean;
  directMessages: boolean;
  follows: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
};

type AccessibilityPreferences = {
  textSize: TextSize;
  reduceMotion: boolean;
};

type SecurityPreferences = {
  passkeyEnabled: boolean;
  twoFactorEnabled: boolean;
};

type PreferencesState = {
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
  security: SecurityPreferences;
  setNotifications: (next: NotificationPreferences) => void;
  setSecurity: (next: SecurityPreferences) => void;
  updateNotification: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
  updateQuietHours: (start: number, end: number) => void;
  updateAccessibility: (next: Partial<AccessibilityPreferences>) => void;
  updateSecurity: (next: Partial<SecurityPreferences>) => void;
};

const defaultState: PreferencesState = {
  notifications: {
    mentions: true,
    directMessages: true,
    follows: true,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 7,
  },
  accessibility: {
    textSize: 'md',
    reduceMotion: false,
  },
  security: {
    passkeyEnabled: false,
    twoFactorEnabled: false,
  },
  setNotifications: () => undefined,
  setSecurity: () => undefined,
  updateNotification: () => undefined,
  updateQuietHours: () => undefined,
  updateAccessibility: () => undefined,
  updateSecurity: () => undefined,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,
      setNotifications: (next) => set({ notifications: { ...next } }),
      setSecurity: (next) => set({ security: { ...next } }),
      updateNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
      updateQuietHours: (start, end) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            quietHoursStart: start,
            quietHoursEnd: end,
          },
        })),
      updateAccessibility: (next) =>
        set((state) => ({
          accessibility: { ...state.accessibility, ...next },
        })),
      updateSecurity: (next) =>
        set((state) => ({
          security: { ...state.security, ...next },
        })),
    }),
    {
      name: 'omsim-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        accessibility: state.accessibility,
        security: state.security,
      }),
    }
  )
);
