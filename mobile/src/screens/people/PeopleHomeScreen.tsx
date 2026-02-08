import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';
import { Connection } from '../../api/types';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useAuthStore } from '../../state/authStore';
import { useOnboardingProgress, useOnboardingStore } from '../../state/onboardingStore';
import { useTheme } from '../../theme/useTheme';

export const PeopleHomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [search, setSearch] = React.useState('');
  const [segment, setSegment] = React.useState<'pending' | 'recent' | 'all'>('all');
  const progress = useOnboardingProgress();
  const demoSeen = useOnboardingStore((state) => state.demoSeen);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { data, refetch } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.listConnections(),
  });

  const allConnections = data?.data || [];
  const connections =
    segment === 'pending'
      ? allConnections.filter((connection) => connection.status === 'pending')
      : segment === 'recent'
      ? allConnections.filter((connection) => connection.status === 'accepted').slice(0, 5)
      : allConnections.filter((connection) => connection.status === 'accepted');

  const filtered = connections.filter((connection) => {
    const other =
      connection.requester?.name === undefined ? '' : connection.requester?.name?.toLowerCase();
    const addressee = connection.addressee?.name?.toLowerCase() ?? '';
    return other.includes(search.toLowerCase()) || addressee.includes(search.toLowerCase());
  });

  const switchUser = async (identifier: string) => {
    const result = await api.login({ identifier, password: 'password' });
    await setAuth(result.token, result.user);
    await refetch();
  };

  React.useEffect(() => {
    if (!allConnections.length && !demoSeen) {
      navigation.navigate('DemoFeed' as never);
    }
  }, [allConnections.length, demoSeen, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {progress.completed < 3 ? (
        <Card onPress={() => navigation.navigate('QuickStart' as never)} style={styles.quickStart}>
          <View style={styles.quickStartRow}>
            <View>
              <AppText variant="subtitle">QuickStart Missions</AppText>
              <AppText tone="secondary">
                {progress.completed}/{progress.total} complete
              </AppText>
            </View>
            <Button
              label="View"
              size="sm"
              variant="secondary"
              onPress={() => navigation.navigate('QuickStart' as never)}
            />
          </View>
        </Card>
      ) : null}

      <SegmentedControl
        options={[
          { label: 'Pending', value: 'pending' },
          { label: 'Recent', value: 'recent' },
          { label: 'All', value: 'all' },
        ]}
        value={segment}
        onChange={(value) => setSegment(value as typeof segment)}
        style={{ marginBottom: theme.spacing.md }}
      />

      <View style={styles.searchRow}>
        <Input
          placeholder="Search people"
          value={search}
          onChangeText={setSearch}
          containerStyle={{ flex: 1 }}
        />
        <Button
          label="Connect"
          size="sm"
          onPress={() => navigation.navigate('ConnectMethods' as never)}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="No connections yet"
          subtitle="Start with a QR connect or invite link."
          ctaLabel="Connect"
          onPress={() => navigation.navigate('ConnectMethods' as never)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ConnectionRow connection={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {__DEV__ ? (
        <Card style={styles.devSwitch}>
          <AppText variant="subtitle">Dev Switch User</AppText>
          <View style={styles.devRow}>
            <Button label="Ari" size="sm" onPress={() => switchUser('ari@example.com')} />
            <Button label="Bea" size="sm" onPress={() => switchUser('bea@example.com')} />
          </View>
        </Card>
      ) : null}
    </View>
  );
};

const ConnectionRow = ({ connection }: { connection: Connection }) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const currentUser = useAuthStore((state) => state.user);
  const other =
    connection.requester?.id === currentUser?.id ? connection.addressee : connection.requester;
  const name = other?.name || 'Connection';
  const handle = other?.username ? `@${other.username}` : ' ';
  const detail = `${connection.type} · ${connection.level}`;

  return (
    <Card
      onPress={() =>
        navigation.navigate('PersonProfile' as never, { userId: other?.id ?? 0 } as never)
      }
      style={styles.row}
    >
      <View style={styles.rowTop}>
        <Avatar
          name={name}
          size={44}
          imageSource={other?.profile?.avatar_url ? { uri: other.profile.avatar_url } : undefined}
        />
        <View style={{ flex: 1 }}>
          <AppText variant="subtitle">{name}</AppText>
          <AppText variant="caption" tone="secondary">
            {handle}
          </AppText>
        </View>
        <Chip
          label={connection.status === 'pending' ? 'Pending' : 'Connected'}
          tone={connection.status === 'pending' ? 'urgent' : 'accent'}
        />
      </View>
      <AppText tone="secondary" style={{ marginTop: theme.spacing.sm }}>
        {detail}
      </AppText>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  quickStart: {
    paddingVertical: 6,
  },
  quickStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  row: {
    marginBottom: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devSwitch: {
    marginTop: 12,
    gap: 10,
  },
  devRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
