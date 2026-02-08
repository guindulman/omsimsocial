import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/useTheme';
import { IconMark } from '../branding/IconMark';

type OmsimFabProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeUp?: () => void;
  bottomOffset?: number;
  size?: number;
};

export const OmsimFab = ({
  onPress,
  onLongPress,
  onSwipeUp,
  bottomOffset = 74,
  size = 64,
}: OmsimFabProps) => {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -20) {
          onSwipeUp?.();
        }
      },
    })
  ).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 25,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: bottomOffset,
        transform: [{ translateX: -size / 2 }],
      }}
    >
      <View {...panResponder.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Omsim Connect Hub"
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <LinearGradient
              colors={theme.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.colors.glassBorder,
                shadowColor: theme.colors.accentGlow,
                shadowOpacity: 0.5,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <IconMark size={size * 0.55} />
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};
