import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

const EMOJIS = ['❤️', '👏', '😂', '😮', '✨'];

export const ReactRow = ({ onReact }: { onReact: (emoji: string) => void }) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onReact(emoji)}
          style={[
            styles.chip,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderSubtle,
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 16,
  },
});
