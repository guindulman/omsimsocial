import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useOnboardingProgress } from '../../state/onboardingStore';
import { useTheme } from '../../theme/useTheme';

export const QuickStartScreen = () => {
  const navigation = useNavigation();
  const progress = useOnboardingProgress();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">QuickStart Missions</AppText>
      <AppText tone="secondary">
        Complete 3 missions to unlock your calm feed. {progress.completed}/{progress.total}
      </AppText>
      <Card>
        <AppText variant="subtitle">1. Create a Circle</AppText>
        <AppText tone="secondary">{progress.createdCircle ? 'Done' : 'Pending'}</AppText>
        <View style={styles.cta}>
          <Button
            label="Create Circle"
            size="sm"
            onPress={() => navigation.getParent()?.navigate('Circles' as never)}
          />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">2. Invite 3 people</AppText>
        <AppText tone="secondary">
          {Math.min(progress.inviteCount, 3)}/3 invited
        </AppText>
        <View style={styles.cta}>
          <Button
            label="Invite People"
            size="sm"
            onPress={() => navigation.getParent()?.navigate('People' as never)}
          />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">3. Post your first Memory</AppText>
        <AppText tone="secondary">{progress.postedMemory ? 'Done' : 'Pending'}</AppText>
        <View style={styles.cta}>
          <Button
            label="Post Memory"
            size="sm"
            onPress={() => navigation.getParent()?.navigate('Create' as never)}
          />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  cta: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});
