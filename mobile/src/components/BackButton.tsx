import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './AppText';
import { useTheme } from '../theme/useTheme';

type BackButtonProps = {
  onPress?: () => void;
  style?: ViewStyle;
  tintColor?: string;
  backgroundColor?: string;
};

export const BackButton = ({ onPress, style, tintColor, backgroundColor }: BackButtonProps) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedBackground =
    backgroundColor ?? (theme.isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.35)');

  return (
    <Pressable
      onPress={onPress ?? (() => navigation.goBack())}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: theme.spacing.lg,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: resolvedBackground,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          zIndex: 20,
        },
        style,
      ]}
    >
      <AppText style={{ color: tintColor ?? theme.colors.textPrimary, fontSize: 18 }}>{'<'}</AppText>
    </Pressable>
  );
};
