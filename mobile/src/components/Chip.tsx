import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  tone?: 'neutral' | 'urgent' | 'accent';
  pulse?: boolean;
  style?: ViewStyle;
};

export const Chip = ({ label, tone = 'neutral', pulse = false, style }: ChipProps) => {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) {
      anim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [anim, pulse]);

  const backgroundColor =
    tone === 'urgent'
      ? theme.colors.chipUrgency
      : tone === 'accent'
      ? theme.colors.accentSoft
      : theme.colors.chipNeutral;
  const textTone = tone === 'urgent' ? 'urgent' : tone === 'accent' ? 'accent' : 'secondary';
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] });

  return (
    <Animated.View
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radii.pill,
          backgroundColor,
          borderWidth: 1,
          borderColor: tone === 'neutral' ? theme.colors.borderSubtle : theme.colors.transparent,
          transform: pulse ? [{ scale }] : undefined,
          opacity: pulse ? opacity : 1,
        },
        style,
      ]}
    >
      <AppText variant="caption" tone={textTone}>
        {label}
      </AppText>
    </Animated.View>
  );
};
