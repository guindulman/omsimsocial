import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const PostSuccessScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory posted</Text>
      <Text style={styles.subtitle}>Want a thoughtful Save Note?</Text>
      <TouchableOpacity style={styles.primary} onPress={() => navigation.getParent()?.navigate('Inbox' as never)}>
        <Text style={styles.primaryText}>Ask for Save Note</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.getParent()?.navigate('People' as never)}>
        <Text style={styles.secondaryText}>Share Circle Invite</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  primary: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
});
