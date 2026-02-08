import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { pickCoverPreset } from '../utils/postCover';
import { AppText } from './AppText';

type Variant = 'post' | 'tile' | 'preview';

type TextPostCoverProps = {
  seed: string | number;
  text: string;
  style?: ViewStyle;
  variant?: Variant;
  maxLines?: number;
};

const trimText = (value?: string | null) => value?.trim() ?? '';

export const TextPostCover = ({
  seed,
  text,
  style,
  variant = 'post',
  maxLines,
}: TextPostCoverProps) => {
  const theme = useTheme();
  const coverPresets = theme.gradients.coverPresets;
  const colors = useMemo(
    () => pickCoverPreset(seed, coverPresets),
    [coverPresets, seed]
  );
  const trimmedText = trimText(text);
  const message = trimmedText;
  const length = message.length;
  const textVariant =
    variant === 'tile'
      ? 'caption'
      : length <= 72
      ? 'title'
      : length <= 140
      ? 'subtitle'
      : 'body';
  const resolvedMaxLines =
    typeof maxLines === 'number'
      ? maxLines
      : variant === 'tile'
      ? 4
      : variant === 'preview'
      ? 6
      : 8;
  const padding =
    variant === 'tile'
      ? theme.spacing.md
      : variant === 'preview'
      ? theme.spacing.lg
      : theme.spacing.xl;

  return (
    <View
      style={[
        {
          borderRadius: theme.radii.md,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          padding,
          justifyContent: 'center',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -64,
            right: -72,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: 'rgba(255,255,255,0.16)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -90,
            left: -70,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: 'rgba(0,0,0,0.12)',
          }}
        />

        {message.length ? (
          <AppText
            variant={textVariant as any}
            numberOfLines={resolvedMaxLines}
            ellipsizeMode="tail"
            style={{
              color: 'rgba(255,255,255,0.96)',
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.35)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}
          >
            {message}
          </AppText>
        ) : null}

        {variant === 'tile' ? null : length > 140 ? (
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{
              marginTop: theme.spacing.sm,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
            }}
          >
            Tap to read more
          </AppText>
        ) : null}
      </LinearGradient>
    </View>
  );
};
