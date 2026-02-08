import React from 'react';
import { View } from 'react-native';

import { Post, User } from '../state/types';
import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { MediaPlaceholder } from './MediaPlaceholder';

export type PostCardProps = {
  post: Post;
  author: User;
  timeLabel: string;
  isDying?: boolean;
  borderColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onSave?: () => void;
  onAdopt?: () => void;
};

export const PostCard = ({
  post,
  author,
  timeLabel,
  isDying = false,
  borderColor,
  onPress,
  onLongPress,
  onSave,
  onAdopt,
}: PostCardProps) => {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        marginBottom: theme.spacing.lg,
        borderColor: borderColor ?? theme.colors.glassBorder,
        borderWidth: 1,
        shadowColor: borderColor ?? theme.colors.shadow,
        shadowOpacity: 0.4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <Avatar name={author.name} imageSource={author.avatarUrl ? { uri: author.avatarUrl } : undefined} />
        <View style={{ flex: 1 }}>
          <AppText variant="subtitle">{author.name}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText variant="caption" tone="secondary">
              @{author.handle}
            </AppText>
            {!author.isPublic ? (
              <View style={{ marginLeft: theme.spacing.xs }}>
                <Icon name="lock" size={14} color={theme.colors.textSecondary} />
              </View>
            ) : null}
          </View>
        </View>
        {post.legacy ? <Chip label="Legacy" tone="accent" /> : null}
      </View>
      <View style={{ marginTop: theme.spacing.md }}>
        <MediaPlaceholder type={post.media[0]?.type ?? 'image'} />
      </View>
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText numberOfLines={2}>{post.caption}</AppText>
        <Chip label={timeLabel} tone={isDying ? 'urgent' : 'neutral'} pulse={isDying} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: theme.spacing.md }}>
        <Button label="Save" icon="save" variant="secondary" size="sm" onPress={onSave} />
        <View style={{ width: theme.spacing.sm }} />
        <Button label="Save Pulse" icon="adopt" variant="primary" size="sm" onPress={onAdopt} />
      </View>
    </Card>
  );
};
