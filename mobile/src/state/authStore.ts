import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  is_private?: boolean | null;
  is_active?: boolean | null;
  profile?: {
    avatar_url?: string | null;
    cover_url?: string | null;
    bio?: string | null;
    city?: string | null;
    website_url?: string | null;
    birthday?: string | null;
    gender?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    tiktok_url?: string | null;
    privacy_prefs?: {
      show_followers?: boolean;
      show_following?: boolean;
      [key: string]: unknown;
    } | null;
  } | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  bootstrap: () => Promise<void>;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'omsim_auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  bootstrap: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ token, ready: true });
  },
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
