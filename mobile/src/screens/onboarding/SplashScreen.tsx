import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const loginGlow = require('../../../assets/login-glow.png');

export const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' as never }] });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image source={loginGlow} style={styles.logoImage} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoImage: {
    width: '90%',
    maxWidth: 380,
    aspectRatio: 1366 / 768,
    alignSelf: 'center',
  },
});
