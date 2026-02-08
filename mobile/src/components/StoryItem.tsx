import React from 'react';
import { Pressable, View } from 'react-native';

import { MomentoStory } from '../types/momento';
import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';

type StoryItemProps = {
  story: MomentoStory;
  onPressStory?: () => void;
  onPressProfile?: () => void;
};

export const StoryItem = ({ story, onPressStory, onPressProfile }: StoryItemProps) => {
  const theme = useTheme();
  const nameLabel = story.user.name.split(' ')[0];
  return (
    <View style={{ alignItems: 'center', width: 78 }}>
      <Pressable
        onPress={onPressStory}
        accessibilityRole={onPressStory ? 'button' : undefined}
        accessibilityLabel={onPressStory ? `Open ${story.user.name} story` : undefined}
      >
        <Avatar
          name={story.user.name}
          size={62}
          imageSource={{ uri: story.user.avatarUrl }}
          showRing
        />
      </Pressable>
      <View style={{ marginTop: theme.spacing.xs }}>
        {onPressProfile ? (
          <Pressable
            onPress={onPressProfile}
            accessibilityRole="button"
            accessibilityLabel={`Open ${story.user.name} profile`}
          >
            <AppText variant="caption" numberOfLines={1}>
              {nameLabel}
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="caption" numberOfLines={1}>
            {nameLabel}
          </AppText>
        )}
      </View>
    </View>
  );
};
