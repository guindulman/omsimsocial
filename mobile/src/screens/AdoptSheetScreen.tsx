import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../components/AppText';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon, IconName } from '../components/Icon';
import { Input } from '../components/Input';
import { RootStackParamList } from '../navigation/types';
import { AdoptionType, MediaItem } from '../state/types';
import { useAppState } from '../state/AppState';
import { useTheme } from '../theme/useTheme';

const options: Array<{
  label: string;
  value: AdoptionType;
  description: string;
  icon: IconName;
}> = [
  { label: 'Extend', value: 'extend', description: 'Big boost (+6h)', icon: 'plus' },
  { label: 'Remix', value: 'remix', description: 'Media reply (+6h)', icon: 'gallery' },
  { label: 'Translate', value: 'translate', description: 'Language shift (+3h)', icon: 'link' },
  { label: 'Localize', value: 'localize', description: 'City context (+3h)', icon: 'pin' },
];

export const AdoptSheetScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdoptSheet'>>();
  const { adoptPost } = useAppState();
  const [selected, setSelected] = useState<AdoptionType>('extend');
  const [text, setText] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [remixMedia, setRemixMedia] = useState<MediaItem | null>(null);

  const isDisabled = useMemo(() => text.trim().length === 0, [text]);

  const handleAdopt = () => {
    const contribution = text.trim();
    const media = selected === 'remix' ? remixMedia ?? undefined : undefined;
    const location = selected === 'localize' ? locationTag.trim() || undefined : undefined;
    adoptPost(route.params.postId, selected, contribution, media, location);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.overlay }}>
      <BottomSheet title="Save Pulse" onClose={() => navigation.goBack()}>
        <View>
          {options.map((option) => {
            const active = selected === option.value;
            return (
              <Pressable key={option.value} onPress={() => setSelected(option.value)}>
                <Card
                  style={{
                    marginBottom: theme.spacing.sm,
                    borderColor: active ? theme.colors.accent : theme.colors.glassBorder,
                    backgroundColor: active ? theme.colors.surfaceGlassStrong : theme.colors.surfaceGlass,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name={option.icon} />
                    <View style={{ marginLeft: theme.spacing.md }}>
                      <AppText variant="subtitle">{option.label}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {option.description}
                      </AppText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: theme.spacing.md }}>
          <AppText variant="caption" tone="secondary">
            Contribution
          </AppText>
          <Input
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            placeholder="Add your save note..."
            containerStyle={{ marginTop: theme.spacing.sm }}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
        </View>

        {selected === 'localize' ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant="caption" tone="secondary">
              Location tag
            </AppText>
            <Input
              value={locationTag}
              onChangeText={setLocationTag}
              placeholder="e.g. Downtown LA, Night Market"
              containerStyle={{ marginTop: theme.spacing.sm }}
            />
          </View>
        ) : null}

        {selected === 'remix' ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant="caption" tone="secondary">
              Remix media
            </AppText>
            <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
              <Button
                label="Photo"
                icon="gallery"
                variant={remixMedia?.type === 'image' ? 'primary' : 'secondary'}
                size="sm"
                onPress={() =>
                  setRemixMedia({ id: `remix-${Date.now()}`, type: 'image' })
                }
              />
              <View style={{ width: theme.spacing.sm }} />
              <Button
                label="Video"
                icon="video"
                variant={remixMedia?.type === 'video' ? 'primary' : 'secondary'}
                size="sm"
                onPress={() =>
                  setRemixMedia({ id: `remix-${Date.now()}`, type: 'video' })
                }
              />
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label="Save Now" icon="adopt" size="lg" onPress={handleAdopt} disabled={isDisabled} />
        </View>
      </BottomSheet>
    </View>
  );
};
