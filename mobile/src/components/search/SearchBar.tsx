import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../theme/useTheme';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
};

export const SearchBar = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search people, places, posts',
}: SearchBarProps) => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.pill,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        gap: theme.spacing.sm,
      }}
    >
      <Feather name="search" size={18} color={theme.colors.textSecondary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        style={{
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body.fontSize,
        }}
      />
      {value.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          hitSlop={8}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <Feather name="x" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
};
