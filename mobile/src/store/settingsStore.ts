import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSettings, patchSettings, UserSettings } from '../api/settingsApi';
import { ThemeMode } from '../theme/tokens';

type UpdateResult = {
  ok: boolean;
  error?: unknown;
};

type SettingsState = {
  settings: UserSettings;
  themePreference: ThemeMode;
  themePreferenceInitialized: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  loadRequestId: number;
  localUpdateId: number;
  pendingUpdates: number;
  loadSettings: (options?: { force?: boolean }) => Promise<void>;
  setThemePreference: (mode: ThemeMode) => Promise<UpdateResult>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<UpdateResult>;
  markHydrated: () => void;
};

const defaultSettings: UserSettings = {
  accountActive: true,
  privateProfile: false,
  darkMode: false,
  showFollowers: true,
  showFollowing: true,
  pushNotifications: true,
  locationSharing: true,
};

const REMOTE_KEYS: Array<keyof UserSettings> = [
  'accountActive',
  'privateProfile',
  'showFollowers',
  'showFollowing',
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      themePreference: 'system',
      themePreferenceInitialized: false,
      hydrated: false,
      loading: false,
      error: null,
      loadRequestId: 0,
      localUpdateId: 0,
      pendingUpdates: 0,
      markHydrated: () => set({ hydrated: true }),
      loadSettings: async ({ force = true } = {}) => {
        if (get().loading) return;
        if (!force && get().hydrated) return;
        const requestId = get().loadRequestId + 1;
        const localAtStart = get().localUpdateId;
        set({ loading: true, error: null, loadRequestId: requestId });
        try {
          const settings = await getSettings();
          const {
            loadRequestId,
            localUpdateId,
            pendingUpdates,
            themePreference,
            themePreferenceInitialized,
          } = get();
          if (loadRequestId !== requestId) {
            return;
          }
          const preferLocal = localUpdateId !== localAtStart || pendingUpdates > 0;
          const merged = preferLocal
            ? { ...defaultSettings, ...settings, ...get().settings }
            : { ...defaultSettings, ...get().settings, ...settings };
          const nextThemePreference =
            !themePreferenceInitialized && settings.darkMode ? 'dark' : themePreference;
          set({
            settings: merged,
            themePreference: nextThemePreference,
            themePreferenceInitialized: themePreferenceInitialized || settings.darkMode,
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unable to load settings.' });
        } finally {
          if (get().loadRequestId === requestId) {
            set({ loading: false });
          }
        }
      },
      setThemePreference: async (mode) => {
        const previous = get().themePreference;
        set({ themePreference: mode, themePreferenceInitialized: true });
        const result = await get().updateSetting('darkMode', mode === 'dark');
        if (!result.ok) {
          set({ themePreference: previous });
        }
        return result;
      },
      updateSetting: async (key, value) => {
        const previous = get().settings[key];
        if (previous === value) {
          return { ok: true };
        }
        const isRemoteKey = REMOTE_KEYS.includes(key);
        const nextUpdateId = get().localUpdateId + 1;
        set((state) => ({
          settings: { ...state.settings, [key]: value },
          localUpdateId: nextUpdateId,
          pendingUpdates: isRemoteKey ? state.pendingUpdates + 1 : state.pendingUpdates,
        }));
        if (!isRemoteKey) {
          return { ok: true };
        }
        try {
          const updated = await patchSettings({ [key]: value } as Partial<UserSettings>);
          set((state) => ({
            settings: { ...state.settings, ...updated },
            pendingUpdates: Math.max(0, state.pendingUpdates - 1),
          }));
          return { ok: true };
        } catch (error) {
          set((state) => ({
            settings: { ...state.settings, [key]: previous },
            pendingUpdates: Math.max(0, state.pendingUpdates - 1),
          }));
          return { ok: false, error };
        }
      },
    }),
    {
      name: 'omsim-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        themePreference: state.themePreference,
        themePreferenceInitialized: state.themePreferenceInitialized,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
