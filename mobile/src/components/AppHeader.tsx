import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';

const wordmark = require('../../assets/feedLOGO.png');

type AppHeaderProps = {
  onPressMessages?: () => void;
  unreadCount?: number;
};

export const AppHeader = ({ onPressMessages, unreadCount = 0 }: AppHeaderProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: theme.spacing.lg,
        height: insets.top + 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={wordmark} style={{ height: 28, width: 140 }} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }} />
      <View>
        <Pressable
          onPress={onPressMessages}
          accessibilityRole="button"
          accessibilityLabel="Open messages"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            shadowColor: theme.colors.shadow,
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textPrimary} />
        </Pressable>
        {unreadCount > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 4,
              backgroundColor: theme.colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: theme.colors.background,
            }}
          >
            <AppText variant="caption" style={{ color: theme.colors.surface }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};
