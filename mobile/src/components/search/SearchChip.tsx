import React from 'react';
import { Pressable, ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../../theme/useTheme';

type SearchChipProps = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export const SearchChip = ({ label, onPress, style }: SearchChipProps) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Search ${label}`}
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
};
