import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export const FirstMemoryCardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const draft = (route.params as { draft?: { body?: string; direct_user_id?: number } })?.draft;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>First Memory Draft</Text>
      <Text style={styles.subtitle}>A gentle draft to get you started.</Text>
      <View style={styles.card}>
        <Text style={styles.body}>{draft?.body || 'Share your first memory together.'}</Text>
      </View>
      <TouchableOpacity
        style={styles.primary}
        onPress={() => navigation.navigate('CreateEditor' as never)}
      >
        <Text style={styles.primaryText}>Post to a Circle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => navigation.navigate('CreateEditor' as never)}
      >
        <Text style={styles.secondaryText}>Send to Person</Text>
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
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  body: {
    fontSize: 15,
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
