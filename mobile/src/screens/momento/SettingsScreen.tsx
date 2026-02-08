import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Switch, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../../components/AppText';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../api';
import { useTheme } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../state/authStore';

export const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(Boolean(user?.is_private));
  const [accountActive, setAccountActive] = useState(user?.is_active !== false);
  const [showFollowers, setShowFollowers] = useState(
    user?.profile?.privacy_prefs?.show_followers ?? true
  );
  const [showFollowing, setShowFollowing] = useState(
    user?.profile?.privacy_prefs?.show_following ?? true
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [deleteScheduled, setDeleteScheduled] = useState(false);
  const isDarkMode = themePreference === 'dark';
  const deleteLabel = deleteScheduled ? 'Cancel deletion' : 'Delete profile';
  const deleteDescription = deleteScheduled
    ? 'Your account will be deleted in 10 days unless you cancel.'
    : 'Your account will be deleted after 10 days.';
  const deleteIcon: keyof typeof Feather.glyphMap = deleteScheduled ? 'x-circle' : 'trash-2';
  const deleteTone: 'default' | 'urgent' = deleteScheduled ? 'default' : 'urgent';

  useEffect(() => {
    if (!user) return;
    setPrivateProfile(Boolean(user.is_private));
    setAccountActive(user.is_active !== false);
    setShowFollowers(user.profile?.privacy_prefs?.show_followers ?? true);
    setShowFollowing(user.profile?.privacy_prefs?.show_following ?? true);
  }, [user]);

  const settingsMutation = useMutation({
    mutationFn: (payload: { is_private?: boolean; is_active?: boolean }) => api.updateSettings(payload),
    onSuccess: (data) => setUser(data.user),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    },
  });

  const privacyMutation = useMutation({
    mutationFn: (payload: { show_followers?: boolean; show_following?: boolean }) =>
      api.updateProfile({ privacy_prefs: payload }),
    onSuccess: (data) => setUser(data.user),
  });

  const handlePasswordSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    passwordMutation.mutate();
  };

  const handlePasswordToggle = () => {
    if (showPasswordForm) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
    setShowPasswordForm((prev) => !prev);
  };

  const handleDeletePress = () => {
    if (deleteScheduled) {
      Alert.alert(
        'Cancel scheduled deletion?',
        'Your account will remain active and the 10-day timer will stop.',
        [
          { text: 'Keep deletion', style: 'cancel' },
          { text: 'Cancel deletion', onPress: () => setDeleteScheduled(false) },
        ],
        { cancelable: true }
      );
      return;
    }

    Alert.alert(
      'Delete profile?',
      'Your account will be deleted 10 days after you confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule delete',
          style: 'destructive',
          onPress: () => setDeleteScheduled(true),
        },
      ],
      { cancelable: true }
    );
  };

  const handleTrashPress = () => {
    navigation.navigate('Trash' as never);
  };

  const handleHiddenPostsPress = () => {
    navigation.navigate('HiddenPosts' as never);
  };

  const handleBlockedUsersPress = () => {
    navigation.navigate('BlockedUsers' as never);
  };

  const handleAccountActiveChange = (value: boolean) => {
    setAccountActive(value);
    settingsMutation.mutate(
      { is_active: value },
      { onError: () => setAccountActive(!value) }
    );
  };

  const handlePrivateProfileChange = (value: boolean) => {
    setPrivateProfile(value);
    settingsMutation.mutate(
      { is_private: value },
      { onError: () => setPrivateProfile(!value) }
    );
  };

  const handleShowFollowersChange = (value: boolean) => {
    setShowFollowers(value);
    privacyMutation.mutate(
      { show_followers: value },
      { onError: () => setShowFollowers(!value) }
    );
  };

  const handleShowFollowingChange = (value: boolean) => {
    setShowFollowing(value);
    privacyMutation.mutate(
      { show_following: value },
      { onError: () => setShowFollowing(!value) }
    );
  };

  const SettingRow = ({
    label,
    description,
    icon,
    children,
    onPress,
    tone = 'default',
  }: {
    label: string;
    description?: string;
    icon: keyof typeof Feather.glyphMap;
    children?: React.ReactNode;
    onPress?: () => void;
    tone?: 'default' | 'urgent';
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? label : undefined}
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
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: tone === 'urgent' ? theme.colors.chipUrgency : theme.colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name={icon}
          size={16}
          color={tone === 'urgent' ? theme.colors.urgency : theme.colors.accent}
        />
      </View>
      <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
        <AppText variant="subtitle" tone={tone === 'urgent' ? 'urgent' : 'primary'}>
          {label}
        </AppText>
        {description ? <AppText tone="secondary">{description}</AppText> : null}
      </View>
      {children}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View style={{ padding: theme.spacing.lg }}>
          <AppText variant="title">Settings</AppText>
          <AppText tone="secondary">Manage account and preferences.</AppText>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <AppText variant="subtitle">Account</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <View style={{ marginBottom: theme.spacing.sm }}>
              <Button
                label={showPasswordForm ? 'Cancel password change' : 'Change password'}
                variant="secondary"
                iconElement={<Feather name="key" size={18} color={theme.colors.textPrimary} />}
                onPress={handlePasswordToggle}
              />
              {showPasswordForm ? (
                <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
                  <Input
                    placeholder="Current password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <Input
                    placeholder="New password"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <Input
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {passwordError ? <AppText tone="urgent">{passwordError}</AppText> : null}
                  <Button
                    label={passwordMutation.isPending ? 'Updating...' : 'Update password'}
                    variant="secondary"
                    onPress={handlePasswordSave}
                    disabled={passwordMutation.isPending}
                  />
                  {passwordMutation.isError ? (
                    <AppText tone="urgent">Unable to update password.</AppText>
                  ) : null}
                </View>
              ) : null}
            </View>
            <SettingRow
              label="Account active"
              description={accountActive ? 'Active' : 'Inactive'}
              icon="power"
            >
              <Switch
                value={accountActive}
                onValueChange={handleAccountActiveChange}
                trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
              />
            </SettingRow>

            <SettingRow
              label="Private profile"
              description="Follow requests required. Default audience becomes Friends."
              icon="lock"
            >
              <Switch
                value={privateProfile}
                onValueChange={handlePrivateProfileChange}
                trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
              />
            </SettingRow>

            <SettingRow
              label="Dark mode"
              description="Switch between light and dark themes"
              icon="moon"
            >
              <Switch
                value={isDarkMode}
                onValueChange={(value) => void setThemePreference(value ? 'dark' : 'system')}
                trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
              />
            </SettingRow>
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="subtitle">Privacy</AppText>
          </View>

          <SettingRow
            label="Show followers"
            description="Let others see who follows you"
            icon="users"
          >
            <Switch
              value={showFollowers}
              onValueChange={handleShowFollowersChange}
              trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
            />
          </SettingRow>

          <SettingRow
            label="Show following"
            description="Let others see who you follow"
            icon="user-check"
          >
            <Switch
              value={showFollowing}
              onValueChange={handleShowFollowingChange}
              trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
            />
          </SettingRow>

          <View style={{ marginTop: theme.spacing.lg }}>
            <SettingRow
              label={deleteLabel}
              description={deleteDescription}
              icon={deleteIcon}
              tone={deleteTone}
              onPress={handleDeletePress}
            />
            <SettingRow
              label="Trash"
              description="All deleted items will expire after 10 days if not restored."
              icon="trash"
              onPress={handleTrashPress}
            />
            <SettingRow
              label="Hidden posts"
              description="Manage posts you have hidden from your feed."
              icon="eye-off"
              onPress={handleHiddenPostsPress}
            />
            <SettingRow
              label="Blocked users"
              description="Manage people you blocked."
              icon="user-x"
              onPress={handleBlockedUsersPress}
            />
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="subtitle">Preferences</AppText>
          </View>

          <SettingRow
            label="Push notifications"
            description="Get alerts for comments and messages"
            icon="bell"
          >
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
            />
          </SettingRow>

          <SettingRow
            label="Location sharing"
            description="Show nearby suggestions in discovery"
            icon="map-pin"
          >
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ true: theme.colors.accent, false: theme.colors.borderSubtle }}
            />
          </SettingRow>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
