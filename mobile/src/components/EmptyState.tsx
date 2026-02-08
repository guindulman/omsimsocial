import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onPress: () => void;
};

export const EmptyState = ({ title, subtitle, ctaLabel, onPress }: EmptyStateProps) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <AppText variant="title" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText tone="secondary" style={{ textAlign: 'center' }}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={{ marginTop: theme.spacing.sm }}>
        <Button label={ctaLabel} onPress={onPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
});
