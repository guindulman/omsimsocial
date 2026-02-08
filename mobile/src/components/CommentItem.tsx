import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { MomentoUser } from '../types/momento';
import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';

type CommentItemProps = {
  user: MomentoUser;
  comment: string;
  timeAgo: string;
  likesCount?: number;
  liked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onLike?: () => void;
  onShowLikes?: () => void;
};

export const CommentItem = ({
  user,
  comment,
  timeAgo,
  likesCount = 0,
  liked = false,
  onEdit,
  onDelete,
  onReply,
  onLike,
  onShowLikes,
}: CommentItemProps) => {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      <Avatar name={user.name} size={36} imageSource={{ uri: user.avatarUrl }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <AppText variant="subtitle">{user.name}</AppText>
          <AppText variant="caption" tone="secondary">
            {timeAgo}
          </AppText>
        </View>
        <AppText>{comment}</AppText>
        {onEdit || onDelete || onReply || onLike ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xs }}>
            {onLike ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Pressable
                  onPress={onLike}
                  onLongPress={onShowLikes}
                  delayLongPress={250}
                  accessibilityRole="button"
                  accessibilityLabel="Like comment"
                >
                  <Feather
                    name="heart"
                    size={14}
                    color={liked ? theme.colors.urgency : theme.colors.textSecondary}
                  />
                </Pressable>
                {onShowLikes ? (
                  <Pressable
                    onPress={onShowLikes}
                    accessibilityRole="button"
                    accessibilityLabel="View comment likes"
                  >
                    <AppText variant="caption" tone="secondary">
                      {likesCount}
                    </AppText>
                  </Pressable>
                ) : (
                  <AppText variant="caption" tone="secondary">
                    {likesCount}
                  </AppText>
                )}
              </View>
            ) : null}
            {onReply ? (
              <Pressable onPress={onReply} accessibilityRole="button" accessibilityLabel="Reply to comment">
                <AppText variant="caption" tone="secondary">
                  Reply
                </AppText>
              </Pressable>
            ) : null}
            {onEdit ? (
              <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit comment">
                <AppText variant="caption" tone="secondary">
                  Edit
                </AppText>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete comment">
                <AppText variant="caption" tone="secondary">
                  Delete
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};
