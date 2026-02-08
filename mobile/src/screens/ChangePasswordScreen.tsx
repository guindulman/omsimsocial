import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { updatePassword } from '../api/settingsApi';
import { useTheme } from '../theme/useTheme';

export const ChangePasswordScreen = () => {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Change password</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Update your password below.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
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
          {error ? <AppText tone="urgent">{error}</AppText> : null}
          <Button
            label={submitting ? 'Updating...' : 'Update password'}
            variant="primary"
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
