import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';

type DividerProps = {
  style?: ViewStyle;
};

export const Divider = ({ style }: DividerProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.colors.borderSubtle,
          width: '100%',
        },
        style,
      ]}
    />
  );
};
