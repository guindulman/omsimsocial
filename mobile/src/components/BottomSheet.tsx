import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';

type BottomSheetProps = {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  maxHeight?: number | string;
  style?: ViewStyle;
};

export const BottomSheet = ({ title, onClose, children, maxHeight = '90%', style }: BottomSheetProps) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 4 }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable
        style={{ ...StyleSheet.absoluteFillObject }}
        onPress={onClose}
      />
      <Animated.View
        style={[
          {
            transform: [{ translateY }],
            opacity,
            borderTopLeftRadius: theme.radii.card,
            borderTopRightRadius: theme.radii.card,
            backgroundColor: theme.colors.surfaceGlassStrong,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
            maxHeight,
          },
          style,
        ]}
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.borderStrong,
            }}
          />
        </View>
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="title">{title}</AppText>
            {onClose ? (
              <Pressable onPress={onClose}>
                <Icon name="close" />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={{ marginTop: title ? theme.spacing.md : 0 }}>{children}</View>
      </Animated.View>
    </View>
  );
};
