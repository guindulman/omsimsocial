import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Memory } from '../api/types';
import { AdoptModal } from './AdoptModal';
import { ReactRow } from './ReactRow';
import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';

type MemoryCardProps = {
  memory: Memory;
  onReact: (emoji: string) => void;
  onAdopt: (payload: { note?: string; visibility: 'private' | 'shared' }) => void;
};

export const MemoryCard = ({ memory, onReact, onAdopt }: MemoryCardProps) => {
  const [showAdopt, setShowAdopt] = useState(false);
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Avatar
            name={memory.author?.name ?? 'Someone'}
            size={42}
            imageSource={memory.author?.profile?.avatar_url ? { uri: memory.author.profile.avatar_url } : undefined}
          />
          <View>
            <AppText variant="subtitle">{memory.author?.name ?? 'Someone'}</AppText>
            <AppText variant="caption" tone="secondary">
              {new Date(memory.created_at).toLocaleDateString()}
            </AppText>
          </View>
        </View>
        <Icon name="more" size={18} color={theme.colors.textSecondary} />
      </View>

      <AppText style={styles.body}>{memory.body || 'Shared a memory'}</AppText>
      <ReactRow onReact={onReact} />

      <View style={{ marginTop: theme.spacing.md, alignSelf: 'flex-start' }}>
        <Button label="Save" size="sm" onPress={() => setShowAdopt(true)} />
      </View>

      <AdoptModal
        visible={showAdopt}
        onClose={() => setShowAdopt(false)}
        onSubmit={(payload) => {
          onAdopt(payload);
          setShowAdopt(false);
        }}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    marginBottom: 8,
  },
});
