import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../../theme/useTheme';

type SearchSectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export const SearchSectionHeader = ({
  title,
  actionLabel,
  onPressAction,
}: SearchSectionHeaderProps) => {
  const theme = useTheme();
  const canAction = Boolean(actionLabel && onPressAction);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <AppText variant="subtitle">{title}</AppText>
      {canAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onPressAction}
        >
          <AppText variant="caption" tone="accent">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};
