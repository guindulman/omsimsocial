import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'glass' | 'solid';
  onLongPress?: () => void;
};

export const Card = ({ children, style, onPress, onLongPress, variant = 'solid' }: CardProps) => {
  const theme = useTheme();
  const sharedStyle: ViewStyle = {
    backgroundColor: variant === 'glass' ? theme.colors.surfaceAlt : theme.colors.surface,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable style={[sharedStyle, style]} onPress={onPress} onLongPress={onLongPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={[sharedStyle, style]}>{children}</View>;
};
