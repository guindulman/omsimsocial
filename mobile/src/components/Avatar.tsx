import React from 'react';
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { normalizeMediaUrl } from '../utils/momentoAdapter';
import { AppText } from './AppText';

type AvatarProps = {
  name: string;
  size?: number;
  style?: ViewStyle;
  variant?: 'solid' | 'gradient';
  imageSource?: ImageSourcePropType;
  showRing?: boolean;
  ringColors?: string[];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export const Avatar = ({
  name,
  size = 44,
  style,
  variant = 'gradient',
  imageSource,
  showRing = false,
  ringColors,
}: AvatarProps) => {
  const theme = useTheme();
  const initials = getInitials(name);
  const normalizedSource = (() => {
    if (!imageSource) {
      return undefined;
    }
    if (typeof imageSource === 'number') {
      return imageSource;
    }
    if (Array.isArray(imageSource)) {
      return imageSource.map((source) => {
        if (source && typeof source === 'object' && 'uri' in source && source.uri) {
          const normalized = normalizeMediaUrl(source.uri) ?? source.uri;
          return { ...source, uri: normalized };
        }
        return source;
      });
    }
    if (typeof imageSource === 'object' && 'uri' in imageSource && imageSource.uri) {
      const normalized = normalizeMediaUrl(imageSource.uri) ?? imageSource.uri;
      return { ...imageSource, uri: normalized };
    }
    return imageSource;
  })();
  const sharedStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  };

  const avatarBody = normalizedSource ? (
    <View style={[sharedStyle, style]}>
      <Image source={normalizedSource} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  ) : variant === 'solid' ? (
    <View style={[sharedStyle, { backgroundColor: theme.colors.surfaceAlt }, style]}>
      <AppText variant="caption">{initials}</AppText>
    </View>
  ) : (
    <LinearGradient
      colors={theme.gradients.accent}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[sharedStyle, style]}
    >
      <AppText variant="caption">{initials}</AppText>
    </LinearGradient>
  );

  if (!showRing) {
    return avatarBody;
  }

  return (
    <LinearGradient
      colors={ringColors ?? theme.gradients.accent}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        padding: 2,
        borderRadius: size / 2 + 3,
      }}
    >
      {avatarBody}
    </LinearGradient>
  );
};
