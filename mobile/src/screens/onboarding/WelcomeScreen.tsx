import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/useTheme';

export const WelcomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AppText variant="display" style={styles.heroTitle}>
          Omsim
        </AppText>
        <AppText tone="secondary" style={styles.heroBody}>
          A social app with a clean feed, vibrant moments, and people you actually know.
        </AppText>
      </LinearGradient>

      <View style={styles.content}>
        <AppText variant="title">Stay close without the noise.</AppText>
        <AppText tone="secondary">Real people. Real friends.</AppText>
        <View style={styles.actions}>
          <Button label="Create account" onPress={() => navigation.navigate('Register' as never)} />
          <Button
            label="Sign in"
            variant="secondary"
            onPress={() => navigation.navigate('Login' as never)}
          />
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
  },
  heroTitle: {
    textAlign: 'center',
    color: '#fff',
  },
  heroBody: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    gap: 10,
  },
  actions: {
    marginTop: 12,
    gap: 10,
  },
});
