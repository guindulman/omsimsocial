import React from 'react';
import { View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../theme/useTheme';

type SectionHeaderProps = {
  title: string;
  color?: string;
};

export const SectionHeader = ({ title, color }: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <View style={{ marginTop: theme.spacing.xl }}>
      <AppText
        variant="label"
        style={{
          color: color ?? theme.colors.textSecondary,
          letterSpacing: 1.2,
        }}
      >
        {title}
      </AppText>
    </View>
  );
};
