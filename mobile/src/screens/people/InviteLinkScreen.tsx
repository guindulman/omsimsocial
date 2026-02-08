import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, Share, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useOnboardingStore } from '../../state/onboardingStore';
import { useTheme } from '../../theme/useTheme';

export const InviteLinkScreen = () => {
  const addInvite = useOnboardingStore((state) => state.addInvite);
  const theme = useTheme();
  const {
    mutate: createInvite,
    data,
    isPending,
    isError,
  } = useMutation({
    mutationFn: () => api.createInvite(),
    onSuccess: () => {
      addInvite();
    },
  });

  useEffect(() => {
    createInvite();
  }, [createInvite]);

  const inviteLink = data?.invite_link;
  const inviteCode = data?.invite_code;
  const qrUrl = useMemo(() => {
    if (!inviteLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteLink)}`;
  }, [inviteLink]);

  const share = async () => {
    if (!inviteLink) return;
    await Share.share({ message: `Join me on OmsimSocial: ${inviteLink}` });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">Invite Link</AppText>
      <AppText tone="secondary">Share this private code with someone you trust.</AppText>
      <Card style={styles.card}>
        <AppText tone="secondary">Invite Code</AppText>
        {isPending ? (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}>
            <ActivityIndicator />
          </View>
        ) : (
          <AppText variant="display">{inviteCode || 'Unavailable'}</AppText>
        )}
        {qrUrl ? (
          <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
            <Image
              source={{ uri: qrUrl }}
              style={{ width: 220, height: 220, borderRadius: 12 }}
            />
            <AppText variant="caption" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
              Scan to accept this invite.
            </AppText>
          </View>
        ) : null}
        <Button label="Share Invite" onPress={share} disabled={!inviteLink} />
        {isError ? <AppText tone="urgent">Unable to create invite.</AppText> : null}
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
    gap: 12,
  },
});
