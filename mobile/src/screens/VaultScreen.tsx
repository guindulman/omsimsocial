import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { MediaPlaceholder } from '../components/MediaPlaceholder';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const VaultScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts } = useAppState();

  const legacyPosts = useMemo(() => posts.filter((post) => post.legacy), [posts]);

  return (
    <FlatList
      data={legacyPosts}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: theme.spacing.md }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
        gap: theme.spacing.md,
      }}
      ListHeaderComponent={
        <View style={{ marginBottom: theme.spacing.lg }}>
          <AppText variant="title">Legacy Vault</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">
              Posts reach legacy when saves hit the threshold.
            </AppText>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Card onPress={() => navigation.navigate('LegacyDetail', { postId: item.id })} style={{ flex: 1 }}>
          <MediaPlaceholder type={item.media[0]?.type ?? 'image'} style={{ height: 120 }} />
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText variant="caption">{item.caption}</AppText>
          </View>
        </Card>
      )}
      ListEmptyComponent={
        <Card style={{ alignItems: 'center' }}>
          <AppText variant="subtitle">No legacy posts yet.</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">Save to push a pulse into the vault.</AppText>
          </View>
        </Card>
      }
    />
  );
};
