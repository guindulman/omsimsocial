import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

import { API_URL } from '../api/client';
import { useAuthStore } from '../state/authStore';

type EchoWithPusher = Echo & { connector?: { pusher?: Pusher } };

let echoInstance: EchoWithPusher | null = null;
let lastToken: string | null = null;

const getApiBaseUrl = () => API_URL.replace(/\/api\/v1\/?$/, '');

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
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
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
