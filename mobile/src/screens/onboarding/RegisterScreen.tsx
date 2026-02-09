import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';
import { ApiError, apiFetch, API_URL } from '../../api/client';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { IconMark } from '../../branding/IconMark';
import { Input } from '../../components/Input';
import { TurnstileWidget } from '../../components/TurnstileWidget';
import { useAuthStore } from '../../state/authStore';
import { useTheme } from '../../theme/useTheme';

const schema = z
  .object({
    name: z.string().min(2),
    username: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;
type RegisterPayload = FormValues & { turnstile_token?: string };

const SOCIAL_AUTH_ENABLED = process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED === 'true';

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [turnstileRequired, setTurnstileRequired] = React.useState(false);
  const [turnstilePath, setTurnstilePath] = React.useState('/auth/turnstile');
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileError, setTurnstileError] = React.useState<string | null>(null);
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  React.useEffect(() => {
    register('name');
    register('username');
    register('email');
    register('password');
    register('password_confirmation');
  }, [register]);

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<{ turnstile: { required: boolean; path: string } }>('/auth/anti-bot')
      .then((data) => {
        if (cancelled) {
          return;
        }
        setTurnstileRequired(Boolean(data.turnstile?.required));
        if (typeof data.turnstile?.path === 'string' && data.turnstile.path) {
          setTurnstilePath(data.turnstile.path);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.register({
        ...payload,
        email: payload.email || undefined,
      }),
    onSuccess: async (data) => {
      await setAuth(data.token, data.user);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const payload = error.payload as { code?: string } | null;
        if (payload?.code === 'captcha_required' || payload?.code === 'captcha_failed') {
          setTurnstileRequired(true);
        }
      }
    },
  });

  const errorMessage = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : 'Unable to create account. Try again.'
    : '';

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({ ...values, turnstile_token: turnstileToken || undefined });
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <IconMark size={48} />
          <AppText variant="title" style={{ marginTop: 12 }}>
            Create your account
          </AppText>
          <AppText tone="secondary">Moments are better with real people.</AppText>
        </View>

        <View style={{ gap: 12 }}>
          <Input placeholder="Full name" onChangeText={(t) => setValue('name', t)} />
          {errors.name ? <AppText tone="urgent">Name is required.</AppText> : null}
          <Input
            placeholder="Username"
            autoCapitalize="none"
            onChangeText={(t) => setValue('username', t)}
          />
          {errors.username ? <AppText tone="urgent">Username is required.</AppText> : null}
          <Input
            placeholder="Email (optional)"
            autoCapitalize="none"
            onChangeText={(t) => setValue('email', t)}
          />
          <Input placeholder="Password" secureTextEntry onChangeText={(t) => setValue('password', t)} />
          <Input
            placeholder="Confirm password"
            secureTextEntry
            onChangeText={(t) => setValue('password_confirmation', t)}
          />
            {errors.password_confirmation ? (
              <AppText tone="urgent">{errors.password_confirmation.message}</AppText>
            ) : null}
          </View>

        {turnstileRequired ? (
          <View style={{ gap: 8 }}>
            <AppText tone="secondary">Anti-bot check</AppText>
            <TurnstileWidget
              url={`${API_URL}${turnstilePath}`}
              onToken={(token) => {
                setTurnstileToken(token);
                setTurnstileError(null);
              }}
              onExpired={() => setTurnstileToken(null)}
              onError={() => setTurnstileError('Anti-bot check failed to load. Please try again.')}
            />
            {turnstileToken ? (
              <AppText tone="secondary">Verified.</AppText>
            ) : (
              <AppText tone="secondary">Complete the check to continue.</AppText>
            )}
            {turnstileError ? <AppText tone="urgent">{turnstileError}</AppText> : null}
          </View>
        ) : null}

        <Button
          label={mutation.isPending ? 'Creating...' : 'Create account'}
          onPress={onSubmit}
          disabled={mutation.isPending || (turnstileRequired && !turnstileToken)}
        />

        {SOCIAL_AUTH_ENABLED ? (
          <View style={{ gap: 10 }}>
            <Button
              label="Continue with Google"
              variant="secondary"
              iconElement={<Feather name="chrome" size={18} color={theme.colors.textPrimary} />}
              onPress={() => undefined}
            />
            <Button
              label="Continue with Apple"
              variant="secondary"
              iconElement={<Feather name="aperture" size={18} color={theme.colors.textPrimary} />}
              onPress={() => undefined}
            />
          </View>
        ) : null}

        <Button
          label="Already have an account? Sign in"
          variant="ghost"
          onPress={() => navigation.navigate('Login' as never)}
        />
        {mutation.isError ? <AppText tone="urgent">{errorMessage}</AppText> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
