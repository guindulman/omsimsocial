import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../theme/useTheme';

export const PermissionsScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsGranted(status === 'granted');
  };

  const requestCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraGranted(status === 'granted');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Permissions</AppText>
      <AppText tone="secondary">Contacts are optional. Notifications are recommended.</AppText>
      <Card style={styles.card}>
        <AppText variant="subtitle">Notifications</AppText>
        <AppText tone="secondary">Get gentle reminders when your Moments are fading.</AppText>
        <Button
          label={notificationsGranted ? 'Enabled' : 'Enable notifications'}
          size="sm"
          onPress={requestNotifications}
        />
      </Card>
      <Card style={styles.card}>
        <AppText variant="subtitle">Camera</AppText>
        <AppText tone="secondary">Used for Verify QR and memory media.</AppText>
        <Button
          label={cameraGranted ? 'Enabled' : 'Enable camera'}
          size="sm"
          variant="secondary"
          onPress={requestCamera}
        />
      </Card>
      <Button label="Continue" onPress={() => navigation.navigate('QuickStart' as never)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  card: {
    gap: 10,
  },
});
