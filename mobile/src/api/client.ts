import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../state/authStore';

type ExpoConstantsWithHost = {
  expoConfig?: { hostUri?: string };
  manifest?: { debuggerHost?: string };
  manifest2?: { extra?: { expoClient?: { debuggerHost?: string } } };
};

const getDevServerHost = () => {
  const constants = Constants as ExpoConstantsWithHost;
  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest?.debuggerHost ||
    constants.manifest2?.extra?.expoClient?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const cleaned = hostUri.replace(/^[a-z]+:\/\//i, '');
  const host = cleaned.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return null;
  }

  return host;
};

const getDefaultApiUrl = () => {
  const devHost = getDevServerHost();
  if (devHost) {
    return `http://${devHost}:8000/api/v1`;
  }

  return (
    Platform.select({
      ios: 'http://localhost:8000/api/v1',
      android: 'http://10.0.2.2:8000/api/v1',
      default: 'http://localhost:8000/api/v1',
    }) || 'http://localhost:8000/api/v1'
  );
};

const normalizeLocalhost = (url: string, host: string) => {
  return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|::1)/i, `$1${host}`);
};

const resolveApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const devHost = getDevServerHost();
    if (devHost) {
      return normalizeLocalhost(envUrl, devHost);
    }
    if (Platform.OS === 'android') {
      return normalizeLocalhost(envUrl, '10.0.2.2');
    }
    return envUrl;
  }

  return getDefaultApiUrl();
};

export const API_URL = resolveApiUrl();

const handleUnauthorized = (status: number) => {
  if (status === 401) {
    const logout = useAuthStore.getState().logout;
    if (logout) {
      void logout();
    }
  }
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type FetchOptions = RequestInit & { json?: unknown };

const buildHeaders = (options?: FetchOptions) => {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (options?.json) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const apiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    handleUnauthorized(response.status);
    const message = (payload && (payload.message as string)) || response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};

export const apiUpload = async <T>(path: string, formData: FormData): Promise<T> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    handleUnauthorized(response.status);
    const message = (payload && (payload.message as string)) || response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};
