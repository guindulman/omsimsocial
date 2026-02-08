import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';
import { formatCountdown, isDying } from '../utils/time';

export const PulseAlertsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, adoptions, connections, users, now } = useAppState();

  const dyingPosts = useMemo(
    () => posts.filter((post) => !post.legacy && isDying(post.expiresAt, now)).slice(0, 3),
    [posts, now]
  );
  const latestAdoptions = useMemo(() => adoptions.slice(0, 3), [adoptions]);
  const latestConnections = useMemo(() => connections.slice(0, 3), [connections]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.overlay }}>
      <BottomSheet title="Pulse Alerts" onClose={() => navigation.goBack()}>
        <View>
          <AppText variant="subtitle">Dying Pulses</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            {dyingPosts.length === 0 ? (
              <Card>
                <AppText tone="secondary">No pulses in the danger zone.</AppText>
              </Card>
            ) : (
              dyingPosts.map((post) => (
                <Card key={post.id} style={{ marginBottom: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="alert" />
                    <View style={{ marginLeft: theme.spacing.sm }}>
                      <AppText variant="subtitle">{formatCountdown(post.expiresAt, now)}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {post.caption}
                      </AppText>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">New Saves</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            {latestAdoptions.length === 0 ? (
              <Card>
                <AppText tone="secondary">No new saves yet.</AppText>
              </Card>
            ) : (
              latestAdoptions.map((adoption) => {
                const adopter = users.find((user) => user.id === adoption.userId);
                return (
                  <Card key={adoption.id} style={{ marginBottom: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="adopt" />
                      <View style={{ marginLeft: theme.spacing.sm }}>
                        <AppText variant="subtitle">
                          {adopter?.name ?? 'Omsim Member'} - {adoption.type.toUpperCase()}
                        </AppText>
                        <AppText variant="caption" tone="secondary">
                          {adoption.contribution}
                        </AppText>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">New Connections</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            {latestConnections.length === 0 ? (
              <Card>
                <AppText tone="secondary">No new connections yet.</AppText>
              </Card>
            ) : (
              latestConnections.map((connection) => {
                const otherId = connection.connectedUserId;
                const user = users.find((item) => item.id === otherId);
                return (
                  <Card key={connection.id} style={{ marginBottom: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="handshake" />
                      <View style={{ marginLeft: theme.spacing.sm }}>
                        <AppText variant="subtitle">{user?.name ?? 'Omsim Member'}</AppText>
                        <AppText variant="caption" tone="secondary">
                          Connected on Omsim Social
                        </AppText>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};
