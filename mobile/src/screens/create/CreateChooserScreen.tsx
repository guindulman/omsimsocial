import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/useTheme';

export const CreateChooserScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const go = (mode: 'text' | 'photo' | 'voice') => {
    navigation.navigate('CreateEditor' as never, { mode } as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Create a Memory</AppText>
      <AppText tone="secondary">Pick a format and share your moment.</AppText>

      <View style={styles.grid}>
        <Card onPress={() => go('photo')} style={styles.card}>
          <Icon name="gallery" size={24} color={theme.colors.accent} />
          <AppText variant="subtitle">Photo</AppText>
          <AppText tone="secondary">Capture a real moment.</AppText>
        </Card>
        <Card onPress={() => go('voice')} style={styles.card}>
          <Icon name="mic" size={24} color={theme.colors.accent} />
          <AppText variant="subtitle">Voice</AppText>
          <AppText tone="secondary">Send a quick note.</AppText>
        </Card>
        <Card onPress={() => go('text')} style={styles.card}>
          <Icon name="edit" size={24} color={theme.colors.accent} />
          <AppText variant="subtitle">Text</AppText>
          <AppText tone="secondary">Share a small story.</AppText>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  grid: {
    gap: 12,
  },
  card: {
    gap: 8,
  },
});
