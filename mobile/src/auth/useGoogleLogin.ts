import React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
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
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const { webClientId, iosClientId, androidClientId } = getClientIds();

  const isExpoGo = Constants.appOwnership === 'expo';
  const requiredClientId =
    Platform.OS === 'web' || isExpoGo
      ? webClientId
      : Platform.OS === 'ios'
        ? iosClientId
        : Platform.OS === 'android'
          ? androidClientId
          : undefined;

  const configured = Boolean(requiredClientId);
  const lastHandledIdTokenRef = React.useRef<string | null>(null);

  const redirectUri = React.useMemo(() => {
    if (!isExpoGo) {
      return undefined;
    }
    // Use the Expo AuthSession proxy on Expo Go (matches https://auth.expo.io/@owner/slug).
    return AuthSession.getRedirectUrl();
  }, [isExpoGo]);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    // Required by the provider on native (iosClientId/androidClientId) even if you only configure webClientId.
    // We gate sign-in with `configured` so this is just to prevent the hook from throwing at render time.
    clientId:
      requiredClientId ||
      webClientId ||
      iosClientId ||
      androidClientId ||
      'MISSING_GOOGLE_CLIENT_ID',
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    redirectUri,
    responseType: isExpoGo ? 'id_token' : undefined,
    shouldAutoExchangeCode: false,
    scopes: ['profile', 'email'],
    selectAccount: true,
  });

  const mutation = useMutation({
    mutationFn: (idToken: string) => api.googleLogin({ id_token: idToken }),
    onSuccess: async (data) => {
      await setAuth(data.token, data.user);
    },
  });

  const handleIdToken = React.useCallback(
    async (idToken: string) => {
      if (!idToken || lastHandledIdTokenRef.current === idToken) {
        return;
      }
      lastHandledIdTokenRef.current = idToken;

      try {
        await mutation.mutateAsync(idToken);
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
        } else {
          setErrorMessage('Google login failed. Please try again.');
        }
      }
    },
    [mutation]
  );

  const signIn = React.useCallback(async () => {
    setErrorMessage(null);

    if (!configured || !request) {
      if (isExpoGo) {
        setErrorMessage('Google login is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      } else if (Platform.OS === 'ios') {
        setErrorMessage('Google login is not configured. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.');
      } else if (Platform.OS === 'android') {
        setErrorMessage('Google login is not configured. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.');
      } else {
        setErrorMessage('Google login is not configured.');
      }
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        if (result.type === 'error') {
          setErrorMessage(result.error?.message || 'Google authentication failed.');
        }
        return;
      }

      const params = result.params as unknown as { id_token?: string; code?: string };

      if (params?.id_token) {
        await handleIdToken(params.id_token);
        return;
      }

      if (params?.code) {
        const codeVerifier = request.codeVerifier;
        if (!codeVerifier) {
          setErrorMessage('Google authentication failed (missing PKCE verifier).');
          return;
        }

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: request.clientId,
            redirectUri: request.redirectUri,
            code: params.code,
            scopes: ['profile', 'email'],
            extraParams: { code_verifier: codeVerifier },
          },
          Google.discovery
        );

        const idToken = tokenResponse.idToken;
        if (!idToken) {
          setErrorMessage('Google authentication did not return an ID token.');
          return;
        }

        await handleIdToken(idToken);
        return;
      }

      setErrorMessage('Google authentication did not return an ID token.');
    } catch (e) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage('Google login failed. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [configured, handleIdToken, isExpoGo, promptAsync, request]);

  return {
    configured,
    signIn,
    isPending: mutation.isPending || isAuthenticating,
    errorMessage,
  };
};
