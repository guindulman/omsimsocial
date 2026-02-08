import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';

type SegmentOption = {
  label: string;
  value: string;
};

type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
};

export const SegmentedControl = ({ options, value, onChange, style }: SegmentedControlProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          padding: theme.spacing.xs,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surfaceGlassStrong,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radii.pill,
                alignItems: 'center',
                backgroundColor: active ? theme.colors.accentSoft : theme.colors.transparent,
                borderWidth: 1,
                borderColor: active ? theme.colors.accent : theme.colors.transparent,
              }}
            >
              <AppText variant="caption" tone={active ? 'accent' : 'secondary'}>
                {option.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
