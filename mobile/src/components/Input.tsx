import React from 'react';
import { TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { textScaleForSize, usePreferencesStore } from '../store/preferencesStore';

type InputProps = TextInputProps & {
  containerStyle?: ViewStyle;
};

export const Input = ({ containerStyle, style, ...props }: InputProps) => {
  const theme = useTheme();
  const textSize = usePreferencesStore((state) => state.accessibility.textSize);
  const fontSize = theme.typography.body.fontSize * textScaleForSize[textSize];
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.surfaceAlt,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        containerStyle,
      ]}
    >
      <TextInput
        {...props}
        style={[
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
            fontSize,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textSecondary}
        selectionColor={theme.colors.accent}
      />
    </View>
  );
};
