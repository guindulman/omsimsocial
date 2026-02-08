import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../api';
import { ApiError } from '../../api/client';
import { normalizeMediaUrl } from '../../utils/momentoAdapter';

const BIO_MAX_LENGTH = 120;

export const EditProfileScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.profile?.website_url ?? '');
  const [birthday, setBirthday] = useState(user?.profile?.birthday ?? '');
  const [gender, setGender] = useState(user?.profile?.gender ?? '');
  const [instagramUrl, setInstagramUrl] = useState(user?.profile?.instagram_url ?? '');
  const [facebookUrl, setFacebookUrl] = useState(user?.profile?.facebook_url ?? '');
  const [tiktokUrl, setTiktokUrl] = useState(user?.profile?.tiktok_url ?? '');
  const [avatarPreview, setAvatarPreview] = useState(user?.profile?.avatar_url ?? '');
  const [coverPreview, setCoverPreview] = useState(user?.profile?.cover_url ?? '');
  const [mediaError, setMediaError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const avatarPreviewUrl = normalizeMediaUrl(avatarPreview) ?? avatarPreview;
  const coverPreviewUrl = normalizeMediaUrl(coverPreview) ?? coverPreview;

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setUsername(user.username ?? '');
    setPhone(user.phone ?? '');
    setEmail(user.email ?? '');
    setBio(user.profile?.bio ?? '');
    setCity(user.profile?.city ?? '');
    setWebsiteUrl(user.profile?.website_url ?? '');
    setBirthday(user.profile?.birthday ?? '');
    setGender(user.profile?.gender ?? '');
    setInstagramUrl(user.profile?.instagram_url ?? '');
    setFacebookUrl(user.profile?.facebook_url ?? '');
    setTiktokUrl(user.profile?.tiktok_url ?? '');
    setAvatarPreview(user.profile?.avatar_url ?? '');
    setCoverPreview(user.profile?.cover_url ?? '');
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: () =>
      api.updateProfile({
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        bio: bio.trim(),
        city: city.trim(),
        website_url: websiteUrl.trim() || undefined,
        birthday: birthday.trim() || undefined,
        gender: gender.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        facebook_url: facebookUrl.trim() || undefined,
        tiktok_url: tiktokUrl.trim() || undefined,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setAvatarPreview(data.user.profile?.avatar_url ?? avatarPreview);
      setCoverPreview(data.user.profile?.cover_url ?? coverPreview);
      setSaveNotice('Saved successfully');
    },
  });

  const avatarUploadMutation = useMutation({
    mutationFn: (uri: string) => api.uploadAvatar({ uri }),
    onSuccess: (data) => {
      setUser(data.user);
      setAvatarPreview(data.user.profile?.avatar_url ?? '');
    },
  });

  const coverUploadMutation = useMutation({
    mutationFn: (uri: string) => api.uploadCover({ uri }),
    onSuccess: (data) => {
      setUser(data.user);
      setCoverPreview(data.user.profile?.cover_url ?? '');
    },
  });

  useEffect(() => {
    if (!saveNotice) return;
    const timer = setTimeout(() => setSaveNotice(''), 2000);
    return () => clearTimeout(timer);
  }, [saveNotice]);

  const isValidUrl = (value: string) => {
    if (!value.trim()) return true;
    try {
      const normalized = value.startsWith('http') ? value : `https://${value}`;
      const url = new URL(normalized);
      return Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const isWebsiteValid = useMemo(() => isValidUrl(websiteUrl), [websiteUrl]);
  const canSaveProfile =
    name.trim().length >= 2 &&
    username.trim().length >= 2 &&
    isWebsiteValid &&
    !profileMutation.isPending;

  const profileErrorMessage = profileMutation.isError
    ? profileMutation.error instanceof ApiError
      ? ((profileMutation.error.payload as { message?: string } | null)?.message ?? profileMutation.error.message)
      : profileMutation.error instanceof Error
      ? profileMutation.error.message
      : 'Unable to update profile.'
    : '';

  const avatarErrorMessage = avatarUploadMutation.isError
    ? avatarUploadMutation.error instanceof ApiError
      ? ((avatarUploadMutation.error.payload as { message?: string } | null)?.message ?? avatarUploadMutation.error.message)
      : avatarUploadMutation.error instanceof Error
      ? avatarUploadMutation.error.message
      : 'Unable to upload profile photo.'
    : '';

  const coverErrorMessage = coverUploadMutation.isError
    ? coverUploadMutation.error instanceof ApiError
      ? ((coverUploadMutation.error.payload as { message?: string } | null)?.message ?? coverUploadMutation.error.message)
      : coverUploadMutation.error instanceof Error
      ? coverUploadMutation.error.message
      : 'Unable to upload header banner.'
    : '';

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Allow photo access to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      exif: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setMediaError('');
        setAvatarPreview(uri);
        avatarUploadMutation.mutate(uri);
      }
    }
  };

  const handlePickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Allow photo access to upload a header banner.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      exif: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setMediaError('');
        setCoverPreview(uri);
        coverUploadMutation.mutate(uri);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackButton />
      {saveNotice ? (
        <View
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.lg,
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            zIndex: 10,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.accentSoft,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radii.pill,
              borderWidth: 1,
              borderColor: theme.colors.accent,
              alignItems: 'center',
            }}
          >
            <AppText tone="accent">{saveNotice}</AppText>
          </View>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: Math.max(theme.spacing.lg, insets.top + theme.spacing.xl),
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
      >
        <View>
          <AppText variant="title">Edit profile</AppText>
          <AppText tone="secondary">Keep your details up to date.</AppText>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Profile media</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Avatar
              name={name || 'You'}
              size={64}
              imageSource={avatarPreviewUrl ? { uri: avatarPreviewUrl } : undefined}
            />
            <View style={{ flex: 1 }}>
              <AppText>Profile photo</AppText>
              <AppText variant="caption" tone="secondary">
                Square image works best.
              </AppText>
            </View>
            <Button
              label={avatarUploadMutation.isPending ? 'Uploading...' : 'Upload'}
              variant="secondary"
              size="sm"
              onPress={handlePickAvatar}
              disabled={avatarUploadMutation.isPending}
            />
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <AppText variant="subtitle">Header banner</AppText>
            <Pressable
              onPress={handlePickCover}
              accessibilityRole="button"
              accessibilityLabel="Upload header banner"
              style={{
                borderRadius: theme.radii.md,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                backgroundColor: theme.colors.surfaceAlt,
                overflow: 'hidden',
              }}
            >
              {coverPreviewUrl ? (
                <Image source={{ uri: coverPreviewUrl }} style={{ width: '100%', height: 140 }} />
              ) : (
                <View
                  style={{
                    height: 140,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.xs,
                    padding: theme.spacing.md,
                  }}
                >
                  <AppText>Tap to upload header banner</AppText>
                  <AppText variant="caption" tone="secondary">
                    Landscape images work best.
                  </AppText>
                </View>
              )}
            </Pressable>
            <Button
              label={coverUploadMutation.isPending ? 'Uploading...' : 'Change banner'}
              variant="secondary"
              size="sm"
              onPress={handlePickCover}
              disabled={coverUploadMutation.isPending}
            />
          </View>

          {mediaError ? <AppText tone="urgent">{mediaError}</AppText> : null}
          {avatarUploadMutation.isError ? <AppText tone="urgent">{avatarErrorMessage}</AppText> : null}
          {coverUploadMutation.isError ? <AppText tone="urgent">{coverErrorMessage}</AppText> : null}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Basics</AppText>
          <Input placeholder="Full name" value={name} onChangeText={setName} />
          <Input placeholder="Username" value={username} onChangeText={setUsername} />
          <Input
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={BIO_MAX_LENGTH}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">About</AppText>
          <Input placeholder="City" value={city} onChangeText={setCity} />
          <Input
            placeholder="Birthday (YYYY-MM-DD)"
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="numbers-and-punctuation"
          />
          <Input placeholder="Gender" value={gender} onChangeText={setGender} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Links</AppText>
          <Input
            placeholder="Website"
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          {!isWebsiteValid ? <AppText tone="urgent">Enter a valid website URL.</AppText> : null}
          <Input
            placeholder="Instagram"
            value={instagramUrl}
            onChangeText={setInstagramUrl}
            autoCapitalize="none"
          />
          <Input
            placeholder="Facebook"
            value={facebookUrl}
            onChangeText={setFacebookUrl}
            autoCapitalize="none"
          />
          <Input
            placeholder="TikTok"
            value={tiktokUrl}
            onChangeText={setTiktokUrl}
            autoCapitalize="none"
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Contact</AppText>
          <Input
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={profileMutation.isPending ? 'Saving...' : 'Save profile'}
            onPress={() => profileMutation.mutate()}
            disabled={!canSaveProfile}
          />
          {profileMutation.isError ? <AppText tone="urgent">{profileErrorMessage}</AppText> : null}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};
