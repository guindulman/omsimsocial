import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../theme/useTheme';

const cards = [
  { title: 'Follow + Friends', body: 'Follow people you know and add friends for private sharing.' },
  { title: 'Memories', body: 'Post Memory Cards to circles, people, or keep them private.' },
  { title: 'Save', body: 'Save meaningful memories to your Vault with a note.' },
];

export const HowItWorksScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppText variant="title">How it works</AppText>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {cards.map((card) => (
          <Card key={card.title} style={styles.card}>
            <LinearGradient
              colors={theme.gradients.subtle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardHeader}
            >
              <AppText variant="subtitle">{card.title}</AppText>
            </LinearGradient>
            <AppText tone="secondary" style={styles.cardBody}>
              {card.body}
            </AppText>
          </Card>
        ))}
      </ScrollView>
      <View style={{ marginTop: 'auto' }}>
        <Button label="Get started" onPress={() => navigation.navigate('Register' as never)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  carousel: {
    flexGrow: 0,
    marginBottom: 24,
  },
  card: {
    width: 280,
    marginRight: 16,
  },
  cardHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardBody: {
    lineHeight: 20,
  },
});
