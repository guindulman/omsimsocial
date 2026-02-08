import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SegmentedControl } from '../components/SegmentedControl';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { MediaItem } from '../state/types';
import { useTheme } from '../theme/useTheme';

export const CreatePostScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { createPost } = useAppState();
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'connections' | 'nearby'>('connections');
  const [media, setMedia] = useState<MediaItem[]>([]);

  const addMedia = (type: MediaItem['type']) => {
    const id = `media-${Date.now()}-${type}`;
    setMedia((prev) => [...prev, { id, type }]);
  };

  const handlePublish = () => {
    if (!caption.trim()) return;
    createPost({ caption: caption.trim(), visibility, media });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Create Pulse</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          <AppText tone="secondary">Expires in 24h</AppText>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Visibility</AppText>
          <SegmentedControl
            options={[
              { label: 'Connections', value: 'connections' },
              { label: 'Near You', value: 'nearby' },
            ]}
            value={visibility}
            onChange={(value) => setVisibility(value as 'connections' | 'nearby')}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Caption</AppText>
          <Input
            multiline
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
            placeholder="Share your pulse..."
            containerStyle={{ marginTop: theme.spacing.sm }}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Media</AppText>
        <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
          <Button label="Add Photo" icon="gallery" variant="secondary" size="sm" onPress={() => addMedia('image')} />
        </View>
        {media.length > 0 ? (
          <View style={{ marginTop: theme.spacing.md }}>
            {media.map((item) => (
              <Card key={item.id} style={{ marginBottom: theme.spacing.sm }}>
                <AppText variant="subtitle">Photo attached</AppText>
                <AppText tone="secondary">Media placeholder</AppText>
              </Card>
            ))}
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label="Publish Pulse" icon="pulse" size="lg" onPress={handlePublish} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
