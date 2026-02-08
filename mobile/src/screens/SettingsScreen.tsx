import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { SettingsRow } from '../components/SettingsRow';
import { IconName } from '../components/Icon';
import { requestDeleteProfile, UserSettings } from '../api/settingsApi';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../theme/useTheme';

type SettingsItem = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  rightAccessory: 'switch' | 'chevron' | 'none';
  key?: keyof UserSettings;
  onPress?: () => void;
  danger?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
  tone?: 'default' | 'danger';
};

const useToast = () => {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const showToast = useCallback(
    (text: string) => {
      setMessage(text);
      opacity.setValue(0);
      translateY.setValue(10);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
        Animated.delay(1800),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 8, duration: 180, useNativeDriver: true }),
        ]),
      ]).start(() => setMessage(null));
    },
    [opacity, translateY]
  );

  return { message, opacity, translateY, showToast };
};

export const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);
  const settings = useSettingsStore((state) => state.settings);
  const themePreference = useSettingsStore((state) => state.themePreference);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const { message, opacity, translateY, showToast } = useToast();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [accountActivePrompted, setAccountActivePrompted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings({ force: true });
    }, [loadSettings])
  );

  const handleToggle = useCallback(
    async (key: keyof UserSettings, value: boolean) => {
      const result = await updateSetting(key, value);
      if (!result.ok) {
        showToast('Unable to update settings.');
      }
    },
    [showToast, updateSetting]
  );

  const handleThemeToggle = useCallback(
    async (value: boolean) => {
      const nextPreference = value ? 'dark' : 'system';
      const result = await setThemePreference(nextPreference);
      if (!result.ok) {
        showToast('Unable to update theme preference.');
      }
    },
    [setThemePreference, showToast]
  );

  const handleAccountActiveChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setAccountActivePrompted(true);
        Alert.alert(
          'Deactivate account?',
          "You can reactivate anytime. Your profile won't be visible.",
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setAccountActivePrompted(false),
            },
            {
              text: 'Deactivate',
              style: 'destructive',
              onPress: () => {
                setAccountActivePrompted(false);
                void handleToggle('accountActive', false);
              },
            },
          ],
          { onDismiss: () => setAccountActivePrompted(false) }
        );
        return;
      }
      setAccountActivePrompted(false);
      void handleToggle('accountActive', true);
    },
    [handleToggle]
  );

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteBusy(true);
    try {
      const response = await requestDeleteProfile();
      showToast(`Deletion scheduled in ${response.days} days.`);
      await logout();
    } catch (error) {
      showToast('Unable to schedule deletion.');
    } finally {
      setDeleteBusy(false);
      setDeleteVisible(false);
    }
  }, [logout, showToast]);

  const sections: SettingsSection[] = useMemo(
    () => [
      {
        title: 'Account',
        items: [
          {
            id: 'change-password',
            title: 'Change password',
            description: 'Update your login credentials.',
            icon: 'lock',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('ChangePassword' as never),
          },
          {
            id: 'security-center',
            title: 'Security center',
            description: 'Manage devices, passkeys, and 2FA.',
            icon: 'lock',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('SecurityCenter' as never),
          },
          {
            id: 'account-active',
            title: 'Account active',
            description: 'Disable to hide your profile and posts.',
            icon: 'profile',
            rightAccessory: 'switch',
            key: 'accountActive',
          },
          {
            id: 'private-profile',
            title: 'Private profile',
            description: 'Approve followers before they see you.',
            icon: 'lock',
            rightAccessory: 'switch',
            key: 'privateProfile',
          },
        ],
      },
      {
        title: 'Appearance',
        items: [
          {
            id: 'dark-mode',
            title: 'Dark mode',
            description: 'On uses dark. Off follows your system theme.',
            icon: 'settings',
            rightAccessory: 'switch',
          },
          {
            id: 'theme-mode',
            title: 'Theme mode',
            description: 'Choose light, dark, or system.',
            icon: 'settings',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('Appearance' as never),
          },
        ],
      },
      {
        title: 'Privacy',
        items: [
          {
            id: 'show-followers',
            title: 'Show followers',
            description: 'Allow others to see your followers.',
            icon: 'people',
            rightAccessory: 'switch',
            key: 'showFollowers',
          },
          {
            id: 'show-following',
            title: 'Show following',
            description: 'Allow others to see who you follow.',
            icon: 'people',
            rightAccessory: 'switch',
            key: 'showFollowing',
          },
          {
            id: 'privacy-preview',
            title: 'View profile as public',
            description: 'Preview how your profile looks to others.',
            icon: 'views',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('PrivacyPreview' as never),
          },
        ],
      },
      {
        title: 'Content & Safety',
        items: [
          {
            id: 'hidden-posts',
            title: 'Hidden posts',
            description: 'Manage content hidden from your feed.',
            icon: 'legacy',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('HiddenPosts' as never),
          },
          {
            id: 'blocked-users',
            title: 'Blocked users',
            description: 'Review and unblock people you blocked.',
            icon: 'block',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('BlockedUsers' as never),
          },
        ],
      },
      {
        title: 'Storage',
        items: [
          {
            id: 'trash',
            title: 'Trash',
            description: 'Restore or permanently delete items.',
            icon: 'vault',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('Trash' as never),
          },
          {
            id: 'data-controls',
            title: 'Data controls',
            description: 'Manage storage and data exports.',
            icon: 'save',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('DataControls' as never),
          },
        ],
      },
      {
        title: 'Notifications',
        items: [
          {
            id: 'push-notifications',
            title: 'Push notifications',
            description: 'Alerts for comments, mentions, and DMs.',
            icon: 'alert',
            rightAccessory: 'switch',
            key: 'pushNotifications',
          },
          {
            id: 'notification-preferences',
            title: 'Notification channels',
            description: 'Fine-tune alerts and quiet hours.',
            icon: 'alert',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('NotificationPreferences' as never),
          },
        ],
      },
      {
        title: 'Discovery',
        items: [
          {
            id: 'location-sharing',
            title: 'Location sharing',
            description: 'Improve nearby and local discovery.',
            icon: 'nearby',
            rightAccessory: 'switch',
            key: 'locationSharing',
          },
        ],
      },
      {
        title: 'Accessibility',
        items: [
          {
            id: 'accessibility',
            title: 'Accessibility',
            description: 'Text size and motion preferences.',
            icon: 'settings',
            rightAccessory: 'chevron',
            onPress: () => navigation.navigate('Accessibility' as never),
          },
        ],
      },
      {
        title: 'Danger Zone',
        tone: 'danger',
        items: [
          {
            id: 'delete-profile',
            title: 'Delete profile',
            description: 'Schedule account deletion in 10 days.',
            icon: 'alert',
            rightAccessory: 'chevron',
            danger: true,
            onPress: () => setDeleteVisible(true),
          },
        ],
      },
    ],
    [navigation]
  );

  const SettingsCardList = ({ children }: { children: React.ReactNode }) => (
    <View style={{ marginTop: theme.spacing.sm }}>{children}</View>
  );
  const headerTint = theme.isDark ? '#F8FAFC' : theme.colors.textPrimary;
  const headerSub = theme.colors.textSecondary;
  const dangerColor = theme.colors.urgency;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <BackButton
        tintColor={headerTint}
        backgroundColor={theme.isDark ? 'rgba(19, 26, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl + 40 }}>
        <View style={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
          <AppText variant="title" style={{ color: headerTint }}>
            Settings
          </AppText>
          <AppText style={{ color: headerSub, marginTop: 4 }}>
            Control your account, privacy, and preferences.
          </AppText>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          {sections.map((section) => (
            <View key={section.title}>
              <SectionHeader
                title={section.title}
                color={section.tone === 'danger' ? dangerColor : headerSub}
              />
              <SettingsCardList>
                {section.items.map((item) => {
                  const isDarkModeRow = item.id === 'dark-mode';
                  const value = isDarkModeRow
                    ? themePreference === 'dark'
                    : item.key
                    ? settings[item.key]
                    : undefined;
                  const handleSwitch = (nextValue: boolean) => {
                    if (isDarkModeRow) {
                      void handleThemeToggle(nextValue);
                      return;
                    }
                    if (!item.key) return;
                    if (item.key === 'accountActive') {
                      handleAccountActiveChange(nextValue);
                      return;
                    }
                    void handleToggle(item.key, nextValue);
                  };

                  return (
                    <SettingsRow
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      rightAccessory={item.rightAccessory}
                      value={typeof value === 'boolean' ? value : undefined}
                      onValueChange={item.rightAccessory === 'switch' ? handleSwitch : undefined}
                      onPress={item.onPress}
                      danger={item.danger}
                      disabled={item.key === 'accountActive' && accountActivePrompted}
                    />
                  );
                })}
              </SettingsCardList>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <BottomSheet title="Delete profile?" onClose={() => setDeleteVisible(false)}>
            <AppText style={{ color: headerSub }}>
              Your account will be scheduled for deletion in 10 days. You can cancel before it
              completes.
            </AppText>
            <View style={{ marginTop: theme.spacing.lg }}>
              <Button label="Cancel" variant="secondary" onPress={() => setDeleteVisible(false)} />
            </View>
            <Pressable
              onPress={handleDeleteConfirm}
              disabled={deleteBusy}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  opacity: pressed || deleteBusy ? 0.85 : 1,
                  marginTop: theme.spacing.sm,
                },
              ]}
            >
              <AppText variant="subtitle" style={{ color: '#FFFFFF' }}>
                {deleteBusy ? 'Deleting...' : 'Delete'}
              </AppText>
            </Pressable>
          </BottomSheet>
        </View>
      </Modal>

      {message ? (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity,
              transform: [{ translateY }],
              paddingHorizontal: theme.spacing.lg,
              backgroundColor: theme.isDark ? 'rgba(18, 26, 44, 0.95)' : theme.colors.surface,
              borderColor: theme.colors.borderSubtle,
            },
          ]}
        >
          <AppText style={{ color: headerTint }}>{message}</AppText>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 16, 0.6)',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F43F5E',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
