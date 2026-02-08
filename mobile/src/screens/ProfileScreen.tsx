import React from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { Icon } from '../components/Icon';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

export const ProfileScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, posts, connections, updatePrivacy, privacy, currentUserId } = useAppState();

  const legacyCount = posts.filter((post) => post.legacy && post.authorId === currentUserId).length;
  const connectionCount = connections.length;

  const coverIndex = profile.coverStyle.startsWith('gradient')
    ? Number(profile.coverStyle.split('-')[1]) - 1
    : 0;
  const coverGradient = theme.gradients.coverPresets[coverIndex] ?? theme.gradients.coverPresets[0];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
      <View style={{ padding: theme.spacing.lg }}>
        <View style={{ borderRadius: theme.radii.card, overflow: 'hidden' }}>
          <LinearGradient colors={coverGradient} style={{ height: 180, padding: theme.spacing.lg }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Icon name="pulse" />
            </View>
          </LinearGradient>
        </View>

        <View style={{ marginTop: -32 }}>
          <Avatar
            name={profile.name}
            size={72}
            imageSource={profile.avatarUrl ? { uri: profile.avatarUrl } : undefined}
          />
        </View>

        <View style={{ marginTop: theme.spacing.md }}>
          <AppText variant="title">{profile.name}</AppText>
          <AppText tone="secondary">@{profile.handle}</AppText>
        </View>

        <View style={{ marginTop: theme.spacing.sm }}>
          <AppText>{profile.bio}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
            <Icon name="pin" />
            <View style={{ marginLeft: theme.spacing.sm }}>
              <AppText variant="caption" tone="secondary">
                {profile.city}
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: theme.spacing.md }}>
          <Button label="Connect Hub" icon="handshake" variant="secondary" onPress={() => navigation.navigate('ConnectHub')} />
          <View style={{ width: theme.spacing.sm }} />
          <Button label="Create Pulse" icon="pulse" variant="primary" onPress={() => navigation.navigate('CreatePost')} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg }}>
          <Card style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppText variant="subtitle">{connectionCount}</AppText>
            <AppText variant="caption" tone="secondary">
              Connections
            </AppText>
          </Card>
          <Card style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <AppText variant="subtitle">{legacyCount}</AppText>
            <AppText variant="caption" tone="secondary">
              Legacy Marks
            </AppText>
          </Card>
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ padding: theme.spacing.lg }}>
        <AppText variant="subtitle">Links</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          {[
            { label: 'website', value: profile.links.website },
            { label: 'instagram', value: profile.links.instagram },
            { label: 'tiktok', value: profile.links.tiktok },
          ].map((link) => (
            <View key={link.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Icon name="link" />
              <View style={{ marginLeft: theme.spacing.sm }}>
                <AppText tone="secondary">{link.value}</AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ padding: theme.spacing.lg }}>
        {[
          { label: 'Profile Views', target: 'ProfileViews' as const, icon: 'views' as const },
          { label: 'Edit Profile', target: 'ProfileEdit' as const, icon: 'edit' as const },
          { label: 'Appearance', target: 'Appearance' as const, icon: 'settings' as const },
        ].map((item) => (
          <Card key={item.label} onPress={() => navigation.navigate(item.target)} style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name={item.icon} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <AppText variant="subtitle">{item.label}</AppText>
              </View>
              <Icon name="chevron-right" />
            </View>
          </Card>
        ))}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ padding: theme.spacing.lg }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="subtitle">Share Profile Views</AppText>
              <AppText tone="secondary">Visible to connections only.</AppText>
            </View>
            <Switch
              value={privacy.shareProfileViews}
              onValueChange={(value) => updatePrivacy({ shareProfileViews: value })}
              trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
              thumbColor={privacy.shareProfileViews ? theme.colors.accent : theme.colors.surfaceAlt}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};
