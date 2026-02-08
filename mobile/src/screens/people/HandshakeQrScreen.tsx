import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';

export const HandshakeQrScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const {
    mutate: initiateHandshake,
    data: initiateData,
    isPending: initiatePending,
    isError: initiateError,
  } = useMutation({
    mutationFn: () => api.handshakeInitiate(),
  });

  const confirm = useMutation({
    mutationFn: (inviteCode: string) => api.handshakeConfirm(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Alert.alert('Verified', 'Friend verification completed.');
      navigation.goBack();
    },
  });

  useEffect(() => {
    initiateHandshake();
  }, [initiateHandshake]);

  const normalizeHandshakeInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/code=([^&\s]+)/i);
    const raw = match?.[1] ?? trimmed;
    return raw.replace(/[^a-z0-9]/gi, '').toUpperCase();
  };

  const handleConfirm = () => {
    const value = normalizeHandshakeInput(code);
    if (!value) return;
    if (value !== code) {
      setCode(value);
    }
    confirm.mutate(value);
  };

  const handshakeCode = initiateData?.handshake_code ?? '';
  const qrValue = handshakeCode ? `omsim://connect?code=${handshakeCode}` : '';
  const qrUrl = useMemo(() => {
    if (!qrValue) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}`;
  }, [qrValue]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Verify in person</AppText>
      <AppText tone="secondary">Show this code or scan theirs to verify a friend.</AppText>
      <Card style={styles.card}>
        <AppText tone="secondary">Your Verify Code</AppText>
        {initiatePending ? (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <AppText variant="display">{handshakeCode || 'Unavailable'}</AppText>
            {qrUrl ? (
              <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
                <Image
                  source={{ uri: qrUrl }}
                  style={{ width: 220, height: 220, borderRadius: 12 }}
                />
                <AppText variant="caption" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
                  Ask a friend to scan this QR.
                </AppText>
              </View>
            ) : null}
          </>
        )}
        {initiateError ? <AppText tone="urgent">Unable to generate a code.</AppText> : null}
      </Card>
      <AppText tone="secondary">Enter the code you scanned</AppText>
      <Input
        placeholder="Enter code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        onSubmitEditing={handleConfirm}
      />
      <Button label={confirm.isPending ? 'Verifying...' : 'Verify'} onPress={handleConfirm} />
      {confirm.isError ? <AppText tone="urgent">Unable to verify with that code.</AppText> : null}
      <Button
        label={initiatePending ? 'Refreshing...' : 'Refresh code'}
        variant="secondary"
        onPress={() => initiateHandshake()}
        disabled={initiatePending}
      />
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
    gap: 8,
  },
});
