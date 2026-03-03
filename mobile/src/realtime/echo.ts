import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

import { API_URL } from '../api/client';
import { useAuthStore } from '../state/authStore';

type EchoWithPusher = Echo<any> & { connector?: { pusher?: Pusher } };
type PusherConnectionLike = {
  state?: string;
  connect?: () => void;
  bind?: (event: string, callback: (payload: any) => void) => void;
  unbind?: (event: string, callback: (payload: any) => void) => void;
};

let echoInstance: EchoWithPusher | null = null;
let lastToken: string | null = null;

const getApiBaseUrl = () => API_URL.replace(/\/api(?:\/v1)?\/?$/, '');

const getBroadcastAuthEndpoint = () => {
  const trimmed = API_URL.replace(/\/+$/, '');
  if (/\/api\/v1$/i.test(trimmed)) {
    return `${trimmed.replace(/\/v1$/i, '')}/broadcasting/auth`;
  }
  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/broadcasting/auth`;
  }
  return `${getApiBaseUrl()}/api/broadcasting/auth`;
};

const getApiHost = () => {
  try {
    return new URL(getApiBaseUrl()).hostname;
  } catch {
    return undefined;
  }
};

export const getEcho = () => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return null;
  }

  if (echoInstance && lastToken === token) {
    return echoInstance;
  }

  if (echoInstance) {
    echoInstance.disconnect();
  }

  lastToken = token;
  const apiBaseUrl = getApiBaseUrl();
  const reverbKey = process.env.EXPO_PUBLIC_REVERB_APP_KEY;
  const pusherKey = process.env.EXPO_PUBLIC_PUSHER_KEY;
  const usingReverb = Boolean(reverbKey || process.env.EXPO_PUBLIC_REVERB_HOST);
  const appKey = usingReverb ? reverbKey : pusherKey;
  if (!appKey) {
    return null;
  }
  const wsHost =
    (usingReverb
      ? process.env.EXPO_PUBLIC_REVERB_HOST
      : process.env.EXPO_PUBLIC_PUSHER_HOST) ?? getApiHost();
  const wsPort = usingReverb
    ? process.env.EXPO_PUBLIC_REVERB_PORT
      ? Number(process.env.EXPO_PUBLIC_REVERB_PORT)
      : 8080
    : process.env.EXPO_PUBLIC_PUSHER_PORT
    ? Number(process.env.EXPO_PUBLIC_PUSHER_PORT)
    : 6001;
  const forceTLS = (
    usingReverb
      ? process.env.EXPO_PUBLIC_REVERB_TLS
      : process.env.EXPO_PUBLIC_PUSHER_TLS
  ) === 'true';

  const pusherOptions = {
    cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'mt1',
    ...(wsHost ? { wsHost } : {}),
    wsPort,
    wssPort: wsPort,
    forceTLS,
    disableStats: true,
    enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
    authEndpoint: getBroadcastAuthEndpoint(),
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  };
  const pusherClient = new Pusher(appKey, pusherOptions);

  echoInstance = new Echo({
    broadcaster: 'pusher',
    client: pusherClient,
  }) as EchoWithPusher;

  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    lastToken = null;
  }
};

const getPusherConnection = (echo: EchoWithPusher | null): PusherConnectionLike | null => {
  if (!echo?.connector?.pusher) {
    return null;
  }

  const pusher = echo.connector.pusher as unknown as { connection?: PusherConnectionLike };
  return pusher.connection ?? null;
};

export const waitForEchoConnection = async (timeoutMs: number = 2500): Promise<boolean> => {
  const echo = getEcho();
  const connection = getPusherConnection(echo);
  if (!echo || !connection) {
    return false;
  }

  if (connection.state === 'connected') {
    return true;
  }

  if (typeof connection.connect === 'function') {
    connection.connect();
  }

  if (typeof connection.bind !== 'function' || typeof connection.unbind !== 'function') {
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    return connection.state === 'connected';
  }

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      connection.unbind?.('state_change', handleStateChange);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const handleStateChange = (states?: { current?: string }) => {
      const current = states?.current ?? connection.state;
      if (current === 'connected') {
        finish(true);
      }
    };

    connection.bind?.('state_change', handleStateChange);
    timeoutHandle = setTimeout(() => finish(connection.state === 'connected'), timeoutMs);
  });
};
