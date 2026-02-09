import React from 'react';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useMutation } from '@tanstack/react-query';

import { api } from '../api';
import { useAuthStore } from '../state/authStore';

WebBrowser.maybeCompleteAuthSession();

const getClientIds = () => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

  return { webClientId, iosClientId, androidClientId };
};

export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { webClientId, iosClientId, androidClientId } = getClientIds();

  const configured = Boolean(webClientId || iosClientId || androidClientId);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    scopes: ['profile', 'email'],
    selectAccount: true,
  });

  const mutation = useMutation({
    mutationFn: (idToken: string) => api.googleLogin({ id_token: idToken }),
    onSuccess: async (data) => {
      await setAuth(data.token, data.user);
    },
  });

  const signIn = React.useCallback(async () => {
    setErrorMessage(null);

    if (!configured || !request) {
      setErrorMessage('Google login is not configured.');
      return;
    }

    const useProxy = Constants.appOwnership === 'expo';
    const result = await promptAsync({ useProxy });
    if (result.type !== 'success') {
      return;
    }

    const params = result.params as unknown as { id_token?: string };
    const idToken = params?.id_token;
    if (!idToken) {
      setErrorMessage('Google authentication did not return an ID token.');
      return;
    }

    try {
      await mutation.mutateAsync(idToken);
    } catch (e) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage('Google login failed. Please try again.');
      }
    }
  }, [configured, mutation, promptAsync, request]);

  return {
    configured,
    signIn,
    isPending: mutation.isPending,
    errorMessage,
  };
};

