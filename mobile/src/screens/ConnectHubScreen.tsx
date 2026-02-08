import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { SegmentedControl } from '../components/SegmentedControl';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

const tabs = [
  { label: 'QR', value: 'qr' },
  { label: 'Scan', value: 'scan' },
  { label: 'NFC', value: 'nfc' },
  { label: 'Invite', value: 'invite' },
];

const buildToken = () => `OMS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const ConnectHubScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { users, currentUserId, addConnection, isConnected, conversations } = useAppState();
  const [tab, setTab] = useState('qr');
  const [qrCode, setQrCode] = useState(buildToken());
  const [inviteToken, setInviteToken] = useState(buildToken());
  const [connectedUserId, setConnectedUserId] = useState<string | null>(null);

  const availableUser = useMemo(
    () => users.find((user) => user.id !== currentUserId && !isConnected(user.id)),
    [users, currentUserId, isConnected]
  );

  const handleConnect = () => {
    if (!availableUser) return;
    addConnection(availableUser.id);
    setConnectedUserId(availableUser.id);
  };

  const connectedUser = users.find((user) => user.id === connectedUserId);
  const chat = conversations.find((conversation) =>
    conversation.participantIds.includes(connectedUserId ?? '')
  );

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="title">Connect Hub</AppText>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon name="close" />
        </Pressable>
      </View>

      <SegmentedControl options={tabs} value={tab} onChange={setTab} style={{ marginTop: theme.spacing.lg }} />

      {connectedUser ? (
        <Card style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Connected!</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">You are now connected with {connectedUser.name}.</AppText>
          </View>
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.md }}>
            <Button
              label="Say Hi"
              icon="chats"
              variant="secondary"
              size="sm"
              onPress={() => chat && navigation.navigate('ChatThread', { chatId: chat.id })}
            />
            <View style={{ width: theme.spacing.sm }} />
            <Button
              label="View Profile"
              icon="profile"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('UserProfile', { userId: connectedUser.id })}
            />
          </View>
        </Card>
      ) : null}

      {tab === 'qr' ? (
        <Card style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
          <AppText variant="subtitle">Your O+ Code</AppText>
          <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: theme.radii.card,
                borderWidth: 1,
                borderColor: theme.colors.glassBorder,
                backgroundColor: theme.colors.surfaceGlassStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="qr" size={48} />
              <View style={{ marginTop: theme.spacing.sm }}>
                <AppText variant="caption" tone="secondary">
                  {qrCode}
                </AppText>
              </View>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label="Refresh Code" icon="refresh" variant="secondary" size="sm" onPress={() => setQrCode(buildToken())} />
          </View>
        </Card>
      ) : null}

      {tab === 'scan' ? (
        <Card style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Scan to Connect</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Camera access placeholder. Scan a QR to connect.</AppText>
          </View>
          <View
            style={{
              marginTop: theme.spacing.lg,
              height: 200,
              borderRadius: theme.radii.card,
              borderWidth: 1,
              borderColor: theme.colors.glassBorder,
              backgroundColor: theme.colors.surfaceGlassStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="scan" size={48} />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label="Simulate Connection" icon="handshake" size="sm" onPress={handleConnect} />
          </View>
        </Card>
      ) : null}

      {tab === 'nfc' ? (
        <Card style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">NFC Tap</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">
              Hold devices together to exchange O+ signals. NFC hardware required.
            </AppText>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label="Simulate Connection" icon="handshake" size="sm" onPress={handleConnect} />
          </View>
        </Card>
      ) : null}

      {tab === 'invite' ? (
        <Card style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Invite Link</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">One-time link - Expires in 24h</AppText>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant="caption" tone="secondary">
              https://omsimsocial.com/invite/{inviteToken}
            </AppText>
          </View>
          <View style={{ marginTop: theme.spacing.md, flexDirection: 'row' }}>
            <Button label="Refresh Link" icon="refresh" variant="secondary" size="sm" onPress={() => setInviteToken(buildToken())} />
            <View style={{ width: theme.spacing.sm }} />
            <Button label="Simulate Connection" icon="handshake" size="sm" onPress={handleConnect} />
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
};
