import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';

type MediaPlaceholderProps = {
  type: 'image' | 'video';
  style?: ViewStyle;
};

export const MediaPlaceholder = ({ type, style }: MediaPlaceholderProps) => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={theme.gradients.subtle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          height: 180,
          borderRadius: theme.radii.card,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <Icon name={type === 'video' ? 'video' : 'gallery'} size={28} />
        <AppText variant="caption" tone="secondary">
          {type === 'video' ? 'Video preview' : 'Image preview'}
        </AppText>
      </View>
    </LinearGradient>
  );
};
