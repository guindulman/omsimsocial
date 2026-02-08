import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export const PersonProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: number };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Person Profile</Text>
      <Text style={styles.subtitle}>User #{userId}</Text>
      <TouchableOpacity
        style={styles.primary}
        onPress={() => navigation.navigate('MessageThread' as never, { userId } as never)}
      >
        <Text style={styles.primaryText}>Message</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary}>
        <Text style={styles.secondaryText}>Mute</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.danger}>
        <Text style={styles.dangerText}>Block</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  danger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  dangerText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
