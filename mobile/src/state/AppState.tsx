import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AccentChoice, ThemeMode } from '../theme/tokens';
import {
  Adoption,
  AdoptionType,
  BackstageThread,
  CallRequest,
  Connection,
  Conversation,
  Post,
  ProfileViewData,
  User,
} from './types';
import {
  seedAdoptions,
  seedCalls,
  seedConnections,
  seedConversations,
  seedPosts,
  seedProfileViews,
  seedThreads,
  seedUsers,
} from '../mock/seed';

export type ThemePreferences = {
  mode: ThemeMode;
  oled: boolean;
};

export type ProfileCustomization = {
  name: string;
  handle: string;
  avatarUrl: string;
  isPublic: boolean;
  bio: string;
  city: string;
  coverStyle: 'image' | 'gradient-1' | 'gradient-2' | 'gradient-3' | 'gradient-4';
  accent: AccentChoice;
  layout: 'minimal' | 'cards' | 'gallery';
  links: {
    website: string;
    instagram: string;
    tiktok: string;
  };
};

export type PrivacyPreferences = {
  shareProfileViews: boolean;
};

export type AppState = {
  theme: ThemePreferences;
  profile: ProfileCustomization;
  privacy: PrivacyPreferences;
  users: User[];
  currentUserId: string;
  posts: Post[];
  adoptions: Adoption[];
  connections: Connection[];
  threads: BackstageThread[];
  conversations: Conversation[];
  calls: CallRequest[];
  profileViews: ProfileViewData;
  now: number;
  hydrated: boolean;
  updateTheme: (next: Partial<ThemePreferences>) => void;
  updateProfile: (next: Partial<ProfileCustomization>) => void;
  updatePrivacy: (next: Partial<PrivacyPreferences>) => void;
  addConnection: (userId: string) => void;
  savePost: (postId: string) => void;
  adoptPost: (
    postId: string,
    type: AdoptionType,
    contribution: string,
    media?: { id: string; type: 'image' | 'video' },
    locationTag?: string
  ) => void;
  createPost: (payload: { caption: string; visibility: Post['visibility']; media: Post['media'] }) => void;
  hasAdopted: (postId: string) => boolean;
  isConnected: (userId: string) => boolean;
};

type PersistedState = Pick<
  AppState,
  'theme' | 'profile' | 'privacy' | 'posts' | 'adoptions' | 'connections'
>;

type State = Omit<AppState, 'updateTheme' | 'updateProfile' | 'updatePrivacy' | 'addConnection' | 'savePost' | 'adoptPost' | 'createPost' | 'hasAdopted' | 'isConnected'>;

type Action =
  | { type: 'HYDRATE'; payload: Partial<PersistedState> }
  | { type: 'UPDATE_THEME'; payload: Partial<ThemePreferences> }
  | { type: 'UPDATE_PROFILE'; payload: Partial<ProfileCustomization> }
  | { type: 'UPDATE_PRIVACY'; payload: Partial<PrivacyPreferences> }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'SAVE_POST'; payload: { postId: string } }
  | { type: 'ADOPT_POST'; payload: { postId: string; adoption: Adoption; extensionMs: number } }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'TICK'; payload: { now: number } };

const STORAGE_KEYS = {
  theme: '@omsim/theme',
  profile: '@omsim/profile',
  privacy: '@omsim/privacy',
  posts: '@omsim/posts',
  adoptions: '@omsim/adoptions',
  connections: '@omsim/connections',
};

const LEGACY_THRESHOLD = 10;
const SAVE_EXTENSION_MS = 1000 * 60 * 60;
const ADOPT_EXTENSIONS: Record<AdoptionType, number> = {
  extend: 1000 * 60 * 60 * 6,
  remix: 1000 * 60 * 60 * 6,
  translate: 1000 * 60 * 60 * 3,
  localize: 1000 * 60 * 60 * 3,
};

const defaultTheme: ThemePreferences = {
  mode: 'system',
  oled: false,
};

const defaultProfile: ProfileCustomization = {
  name: 'Ari Sol',
  handle: 'arisol',
  avatarUrl: 'https://i.pravatar.cc/200?img=11',
  isPublic: true,
  bio: 'Real connections, lasting legacies.',
  city: 'Los Angeles, CA',
  coverStyle: 'gradient-2',
  accent: 'cyan',
  layout: 'cards',
  links: {
    website: 'omsimsocial.com',
    instagram: '@omsim',
    tiktok: '@omsim',
  },
};

const defaultPrivacy: PrivacyPreferences = {
  shareProfileViews: true,
};

const initialState: State = {
  theme: defaultTheme,
  profile: defaultProfile,
  privacy: defaultPrivacy,
  users: seedUsers,
  currentUserId: 'u0',
  posts: seedPosts,
  adoptions: seedAdoptions,
  connections: seedConnections,
  threads: seedThreads,
  conversations: seedConversations,
  calls: seedCalls,
  profileViews: seedProfileViews,
  now: Date.now(),
  hydrated: false,
};

const resolveThreadUnlock = (
  threads: BackstageThread[],
  posts: Post[],
  connection: Connection
) => {
  return threads.map((thread) => {
    const post = posts.find((item) => item.id === thread.postId);
    if (!post) return thread;
    const isMatch =
      connection.userId === post.authorId || connection.connectedUserId === post.authorId;
    if (!isMatch) return thread;
    return { ...thread, unlockedBy: thread.unlockedBy ?? 'connected' };
  });
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        hydrated: true,
      };
    case 'UPDATE_THEME':
      return { ...state, theme: { ...state.theme, ...action.payload } };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'UPDATE_PRIVACY':
      return { ...state, privacy: { ...state.privacy, ...action.payload } };
    case 'ADD_CONNECTION': {
      const exists = state.connections.some(
        (connection) =>
          (connection.userId === action.payload.userId &&
            connection.connectedUserId === action.payload.connectedUserId) ||
          (connection.userId === action.payload.connectedUserId &&
            connection.connectedUserId === action.payload.userId)
      );
      if (exists) return state;
      const nextConnections = [...state.connections, action.payload];
      return {
        ...state,
        connections: nextConnections,
        threads: resolveThreadUnlock(state.threads, state.posts, action.payload),
      };
    }
    case 'SAVE_POST':
      return {
        ...state,
        posts: state.posts.map((post) => {
          if (post.id !== action.payload.postId || post.legacy) return post;
          return {
            ...post,
            expiresAt: post.expiresAt + SAVE_EXTENSION_MS,
            saveCount: post.saveCount + 1,
          };
        }),
      };
    case 'ADOPT_POST': {
      const nextPosts = state.posts.map((post) => {
        if (post.id !== action.payload.postId) return post;
        const nextAdoptionCount = post.adoptionCount + 1;
        const legacy = post.legacy || nextAdoptionCount >= LEGACY_THRESHOLD;
        return {
          ...post,
          adoptionCount: nextAdoptionCount,
          legacy,
          expiresAt: legacy ? post.expiresAt : post.expiresAt + action.payload.extensionMs,
        };
      });

      return {
        ...state,
        posts: nextPosts,
        adoptions: [action.payload.adoption, ...state.adoptions],
        threads: state.threads.map((thread) =>
          thread.postId === action.payload.postId
            ? { ...thread, unlockedBy: 'adopted' }
            : thread
        ),
      };
    }
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'TICK': {
      const prunedPosts = state.posts.filter(
        (post) => post.legacy || post.expiresAt > action.payload.now
      );
      return { ...state, now: action.payload.now, posts: prunedPosts };
    }
    default:
      return state;
  }
};

const AppStateContext = createContext<AppState | undefined>(undefined);

const parseStored = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const load = async () => {
      const [themeRaw, profileRaw, privacyRaw, postsRaw, adoptionsRaw, connectionsRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.theme),
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.privacy),
          AsyncStorage.getItem(STORAGE_KEYS.posts),
          AsyncStorage.getItem(STORAGE_KEYS.adoptions),
          AsyncStorage.getItem(STORAGE_KEYS.connections),
        ]);

      dispatch({
        type: 'HYDRATE',
        payload: {
          theme: parseStored(themeRaw, defaultTheme),
          profile: parseStored(profileRaw, defaultProfile),
          privacy: parseStored(privacyRaw, defaultPrivacy),
          posts: parseStored(postsRaw, seedPosts),
          adoptions: parseStored(adoptionsRaw, seedAdoptions),
          connections: parseStored(connectionsRaw, seedConnections),
        },
      });

      hasHydrated.current = true;
    };

    load();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'TICK', payload: { now: Date.now() } });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(state.theme));
  }, [state.theme]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
  }, [state.profile]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.privacy, JSON.stringify(state.privacy));
  }, [state.privacy]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(state.posts));
  }, [state.posts]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.adoptions, JSON.stringify(state.adoptions));
  }, [state.adoptions]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(state.connections));
  }, [state.connections]);

  const updateTheme = useCallback((next: Partial<ThemePreferences>) => {
    dispatch({ type: 'UPDATE_THEME', payload: next });
  }, []);

  const updateProfile = useCallback((next: Partial<ProfileCustomization>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: next });
  }, []);

  const updatePrivacy = useCallback((next: Partial<PrivacyPreferences>) => {
    dispatch({ type: 'UPDATE_PRIVACY', payload: next });
  }, []);

  const addConnection = useCallback((userId: string) => {
    dispatch({
      type: 'ADD_CONNECTION',
      payload: {
        id: `conn-${Date.now()}`,
        userId: state.currentUserId,
        connectedUserId: userId,
        createdAt: Date.now(),
      },
    });
  }, [state.currentUserId]);

  const savePost = useCallback((postId: string) => {
    dispatch({ type: 'SAVE_POST', payload: { postId } });
  }, []);

  const adoptPost = useCallback((
    postId: string,
    type: AdoptionType,
    contribution: string,
    media?: { id: string; type: 'image' | 'video' },
    locationTag?: string
  ) => {
    dispatch({
      type: 'ADOPT_POST',
      payload: {
        postId,
        extensionMs: ADOPT_EXTENSIONS[type],
        adoption: {
          id: `adopt-${Date.now()}`,
          postId,
          userId: state.currentUserId,
          type,
          contribution,
          createdAt: Date.now(),
          media: media ?? undefined,
          locationTag,
        },
      },
    });
  }, [state.currentUserId]);

  const createPost = useCallback((payload: { caption: string; visibility: Post['visibility']; media: Post['media'] }) => {
    const now = Date.now();
    dispatch({
      type: 'ADD_POST',
      payload: {
        id: `post-${now}`,
        authorId: state.currentUserId,
        caption: payload.caption,
        media: payload.media,
        createdAt: now,
        expiresAt: now + 1000 * 60 * 60 * 24,
        visibility: payload.visibility,
        adoptionCount: 0,
        saveCount: 0,
        legacy: false,
      },
    });
  }, [state.currentUserId]);

  const hasAdopted = useCallback(
    (postId: string) =>
      state.adoptions.some(
        (adoption) => adoption.postId === postId && adoption.userId === state.currentUserId
      ),
    [state.adoptions, state.currentUserId]
  );

  const isConnected = useCallback(
    (userId: string) =>
      state.connections.some(
        (connection) =>
          (connection.userId === state.currentUserId && connection.connectedUserId === userId) ||
          (connection.userId === userId && connection.connectedUserId === state.currentUserId)
      ),
    [state.connections, state.currentUserId]
  );

  const value = useMemo(
    () => ({
      ...state,
      updateTheme,
      updateProfile,
      updatePrivacy,
      addConnection,
      savePost,
      adoptPost,
      createPost,
      hasAdopted,
      isConnected,
    }),
    [
      state,
      updateTheme,
      updateProfile,
      updatePrivacy,
      addConnection,
      savePost,
      adoptPost,
      createPost,
      hasAdopted,
      isConnected,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const LEGACY_THRESHOLD_COUNT = LEGACY_THRESHOLD;
