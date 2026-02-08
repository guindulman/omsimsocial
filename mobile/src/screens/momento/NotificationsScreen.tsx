import React from 'react';
import { FlatList, Pressable, SafeAreaView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { useTheme } from '../../theme/useTheme';
import { momentoNotifications } from '../../mock/momentoData';

const iconForType = (type: 'like' | 'comment' | 'follow') => {
  switch (type) {
    case 'comment':
      return 'message-circle';
    case 'follow':
      return 'user-plus';
    default:
      return 'heart';
  }
};

export const NotificationsScreen = () => {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={momentoNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: theme.spacing.lg }}>
            <AppText variant="title">Notifications</AppText>
            <AppText tone="secondary">Recent activity from friends and followers.</AppText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notification from ${item.user.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.md,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Avatar name={item.user.name} size={46} imageSource={{ uri: item.user.avatarUrl }} />
            <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
              <AppText variant="subtitle">{item.user.name}</AppText>
              <AppText tone="secondary">{item.text}</AppText>
              <AppText variant="caption" tone="secondary">
                {item.timeAgo}
              </AppText>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name={iconForType(item.type)} size={16} color={theme.colors.accent} />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};
