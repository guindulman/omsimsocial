import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

export const SearchSkeletonRow = () => {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.colors.surfaceAlt,
        }}
      />
      <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
        <View
          style={{
            height: 12,
            width: '60%',
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: 6,
          }}
        />
        <View
          style={{
            marginTop: 6,
            height: 10,
            width: '40%',
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: 6,
          }}
        />
      </View>
    </View>
  );
};

export const SearchSkeletonGrid = ({ count = 6 }: { count?: number }) => {
  const theme = useTheme();
  const items = Array.from({ length: count });
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {items.map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={{
            width: '31%',
            aspectRatio: 1,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        />
      ))}
    </View>
  );
};
