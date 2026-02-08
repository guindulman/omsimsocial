import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { SegmentedControl } from '../components/SegmentedControl';
import { useAppState } from '../state/AppState';
import { AccentChoice } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const coverPresets = [
  { id: 'gradient-1', label: 'Midnight' },
  { id: 'gradient-2', label: 'Cyan' },
  { id: 'gradient-3', label: 'Violet' },
  { id: 'gradient-4', label: 'Deep' },
] as const;

const accents: Array<{ id: AccentChoice; label: string }> = [
  { id: 'cyan', label: 'Cyan' },
  { id: 'sky', label: 'Sky' },
  { id: 'violet', label: 'Violet' },
];

const layouts = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'cards', label: 'Cards' },
  { id: 'gallery', label: 'Gallery' },
] as const;

export const ProfileEditScreen = () => {
  const theme = useTheme();
  const { profile, updateProfile } = useAppState();
  const [draft, setDraft] = useState(profile);

  const handleSave = () => {
    updateProfile(draft);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <AppText variant="title">Edit Profile</AppText>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Cover</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
          {coverPresets.map((preset) => {
            const active = draft.coverStyle === preset.id;
            return (
              <Button
                key={preset.id}
                label={preset.label}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => setDraft((prev) => ({ ...prev, coverStyle: preset.id }))}
                style={{ marginRight: theme.spacing.sm, marginBottom: theme.spacing.sm }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Accent</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
          {accents.map((accent) => {
            const active = draft.accent === accent.id;
            return (
              <Button
                key={accent.id}
                label={accent.label}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => setDraft((prev) => ({ ...prev, accent: accent.id }))}
                style={{ marginRight: theme.spacing.sm, marginBottom: theme.spacing.sm }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Layout</AppText>
        <SegmentedControl
          options={layouts.map((layout) => ({ label: layout.label, value: layout.id }))}
          value={draft.layout}
          onChange={(value) => setDraft((prev) => ({ ...prev, layout: value as typeof draft.layout }))}
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Bio</AppText>
        <Input
          multiline
          numberOfLines={3}
          value={draft.bio}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, bio: value }))}
          placeholder="Tell your legacy story..."
          containerStyle={{ marginTop: theme.spacing.sm }}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">City</AppText>
        <Input
          value={draft.city}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, city: value }))}
          placeholder="City, Region"
          containerStyle={{ marginTop: theme.spacing.sm }}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="subtitle">Links</AppText>
        <View style={{ marginTop: theme.spacing.sm }}>
          <Input
            value={draft.links.website}
            onChangeText={(value) =>
              setDraft((prev) => ({ ...prev, links: { ...prev.links, website: value } }))
            }
            placeholder="Website"
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />
          <Input
            value={draft.links.instagram}
            onChangeText={(value) =>
              setDraft((prev) => ({ ...prev, links: { ...prev.links, instagram: value } }))
            }
            placeholder="Instagram"
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />
          <Input
            value={draft.links.tiktok}
            onChangeText={(value) =>
              setDraft((prev) => ({ ...prev, links: { ...prev.links, tiktok: value } }))
            }
            placeholder="TikTok"
          />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="Save Changes" icon="edit" size="lg" onPress={handleSave} />
      </View>
    </ScrollView>
  );
};
