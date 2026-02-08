import React from 'react';
import { View } from 'react-native';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useTheme } from '../theme/useTheme';

export const LiveLinkScreen = () => {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg }}>
      <Card>
        <AppText variant="title">Live Link</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          <AppText tone="secondary">
            Phase 2 preview. Live rooms are connection-only.
          </AppText>
        </View>
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label="Start Live Link (stub)" icon="video" />
        </View>
      </Card>
    </View>
  );
};
