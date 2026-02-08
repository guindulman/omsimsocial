import React from 'react';
import { Platform, Text, TextProps, TextStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { textScaleForSize, usePreferencesStore } from '../store/preferencesStore';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type Tone = 'primary' | 'secondary' | 'accent' | 'urgent';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
  useSystemFont?: boolean;
};

export const AppText = ({
  variant = 'body',
  tone = 'primary',
  useSystemFont = false,
  style,
  ...props
}: AppTextProps) => {
  const theme = useTheme();
  const textSize = usePreferencesStore((state) => state.accessibility.textSize);
  const baseStyle = (theme.typography[variant] ?? {}) as TextStyle;
  const { fontFamily: baseFontFamily, ...restBaseStyle } = baseStyle;
  const fontSize =
    typeof restBaseStyle.fontSize === 'number'
      ? restBaseStyle.fontSize * textScaleForSize[textSize]
      : restBaseStyle.fontSize;
  const fontFamily = useSystemFont
    ? Platform.select({ ios: 'System', android: 'sans-serif', default: undefined })
    : baseFontFamily ?? theme.typography.fontFamily;
  const color =
    tone === 'secondary'
      ? theme.colors.textSecondary
      : tone === 'accent'
      ? theme.colors.accent
      : tone === 'urgent'
      ? theme.colors.urgency
      : theme.colors.textPrimary;

  return (
    <Text
      {...props}
      style={[restBaseStyle, { fontFamily, color, ...(fontSize ? { fontSize } : {}) }, style]}
    />
  );
};
