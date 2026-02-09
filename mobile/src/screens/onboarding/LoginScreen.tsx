import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';
import { useGoogleLogin } from '../../auth/useGoogleLogin';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { IconMark } from '../../branding/IconMark';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../state/authStore';
import { useTheme } from '../../theme/useTheme';

const schema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const SOCIAL_AUTH_ENABLED = process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED === 'true';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);
  const googleLogin = useGoogleLogin();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  React.useEffect(() => {
    register('identifier');
    register('password');
  }, [register]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => api.login(payload),
    onSuccess: async (data) => {
      await setAuth(data.token, data.user);
    },
  });

  const errorMessage = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : 'Unable to sign in. Check your details.'
    : '';

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <IconMark size={44} />
          <AppText variant="title" style={{ marginTop: 12 }}>
            Welcome back
          </AppText>
          <AppText tone="secondary">Sign in to keep your friends close.</AppText>
        </View>

        <View style={{ gap: 12 }}>
          <Input
            placeholder="Email or username"
            autoCapitalize="none"
            onChangeText={(t) => setValue('identifier', t)}
          />
          {errors.identifier ? <AppText tone="urgent">Enter your email or username.</AppText> : null}
          <Input
            placeholder="Password"
            secureTextEntry
            onChangeText={(t) => setValue('password', t)}
          />
          {errors.password ? <AppText tone="urgent">Enter your password.</AppText> : null}
        </View>

        <Button label={mutation.isPending ? 'Signing in...' : 'Sign in'} onPress={onSubmit} />

        {SOCIAL_AUTH_ENABLED ? (
          <View style={{ gap: 10 }}>
            <Button
              label="Continue with Google"
              variant="secondary"
              iconElement={<Feather name="chrome" size={18} color={theme.colors.textPrimary} />}
              onPress={googleLogin.signIn}
              disabled={googleLogin.isPending || !googleLogin.configured}
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
          label="New here? Create an account"
          variant="ghost"
          onPress={() => navigation.navigate('Register' as never)}
        />
        {googleLogin.errorMessage ? <AppText tone="urgent">{googleLogin.errorMessage}</AppText> : null}
        {mutation.isError ? <AppText tone="urgent">{errorMessage}</AppText> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
