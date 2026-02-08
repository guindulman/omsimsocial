import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconElement?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

type SpacingScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

const sizeStyles = (size: ButtonSize, spacing: SpacingScale) => {
  switch (size) {
    case 'sm':
      return { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.lg, minHeight: 34 };
    case 'lg':
      return { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, minHeight: 52 };
    default:
      return { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, minHeight: 44 };
  }
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconElement,
  disabled = false,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const buttonStyle: ViewStyle = {
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: variant === 'ghost' ? theme.colors.transparent : theme.colors.surface,
  };

  const contentColor =
    variant === 'primary' ? theme.colors.surface : variant === 'ghost' ? theme.colors.accent : theme.colors.textPrimary;
  const renderedIcon = iconElement ?? (icon ? <Icon name={icon} size={18} color={contentColor} /> : null);
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      {renderedIcon}
      <AppText variant="subtitle" style={{ color: contentColor }}>
        {label}
      </AppText>
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [{ opacity: pressed || disabled ? 0.85 : 1 }]}
      >
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            buttonStyle,
            sizeStyles(size, theme.spacing),
            { shadowColor: theme.colors.accentGlow, shadowOpacity: 0.25, shadowRadius: 10 },
            style,
          ]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        buttonStyle,
        sizeStyles(size, theme.spacing),
        { opacity: pressed || disabled ? 0.85 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
};
