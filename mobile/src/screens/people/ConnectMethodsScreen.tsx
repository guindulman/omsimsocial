import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

export const ConnectMethodsScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const acceptInvite = useMutation({
    mutationFn: () => api.acceptInvite(code),
    onSuccess: (data) => {
      navigation.navigate('ConfirmConnection' as never, {
        connectionId: data.connection.id,
        draft: data.first_memory_draft as any,
      } as never);
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Connect</AppText>
      <Card onPress={() => navigation.navigate('HandshakeQR' as never)} style={styles.card}>
        <AppText variant="subtitle">Connect via QR</AppText>
        <AppText tone="secondary">Show your QR or scan theirs to connect instantly.</AppText>
      </Card>
      <Card onPress={() => navigation.navigate('InviteLink' as never)} style={styles.card}>
        <AppText variant="subtitle">Invite Link</AppText>
        <AppText tone="secondary">Share a private invite link or code.</AppText>
      </Card>
      <Card onPress={() => navigation.navigate('InviteLink' as never)} style={styles.card}>
        <AppText variant="subtitle">Event QR</AppText>
        <AppText tone="secondary">Create a QR for group events.</AppText>
      </Card>
      <Card style={styles.card}>
        <AppText variant="subtitle">Have a code?</AppText>
        <Input
          placeholder="Enter invite code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <Button label="Accept Invite" onPress={() => acceptInvite.mutate()} disabled={!code} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    gap: 6,
  },
});
