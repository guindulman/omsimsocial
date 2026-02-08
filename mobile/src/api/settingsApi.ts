import { apiFetch } from './client';

export type UserSettings = {
  accountActive: boolean;
  privateProfile: boolean;
  darkMode: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  pushNotifications: boolean;
  locationSharing: boolean;
};

type DeleteRequestResponse = { scheduled: boolean; days: number };

type PasswordResponse = { message: string };

type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ApiUser = {
  is_active?: boolean | null;
  is_private?: boolean | null;
  profile?: {
    privacy_prefs?: {
      show_followers?: boolean;
      show_following?: boolean;
    } | null;
  } | null;
};

type MeResponse = { user: ApiUser };

type AccountSettingsResponse = { user: ApiUser };

type ProfileResponse = { user: ApiUser };

const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mockSettings: UserSettings = {
  accountActive: true,
  privateProfile: false,
  darkMode: false,
  showFollowers: true,
  showFollowing: true,
  pushNotifications: true,
  locationSharing: true,
};

const mapUserToSettings = (user: ApiUser): Partial<UserSettings> => {
  const mapped: Partial<UserSettings> = {};
  if (typeof user.is_active === 'boolean') {
    mapped.accountActive = user.is_active;
  }
  if (typeof user.is_private === 'boolean') {
    mapped.privateProfile = user.is_private;
  }
  const prefs = user.profile?.privacy_prefs;
  if (typeof prefs?.show_followers === 'boolean') {
    mapped.showFollowers = prefs.show_followers;
  }
  if (typeof prefs?.show_following === 'boolean') {
    mapped.showFollowing = prefs.show_following;
  }
  return mapped;
};

export const getSettings = async (): Promise<Partial<UserSettings>> => {
  if (USE_MOCK_API) {
    await delay(300);
    return { ...mockSettings };
  }

  const response = await apiFetch<MeResponse>('/me');
  return mapUserToSettings(response.user);
};

export const patchSettings = async (
  updates: Partial<UserSettings>
): Promise<Partial<UserSettings>> => {
  if (USE_MOCK_API) {
    await delay(280);
    mockSettings = { ...mockSettings, ...updates };
    return { ...mockSettings };
  }

  const accountPayload: { is_private?: boolean; is_active?: boolean } = {};
  const privacyPrefs: { show_followers?: boolean; show_following?: boolean } = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'privateProfile')) {
    accountPayload.is_private = updates.privateProfile;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'accountActive')) {
    accountPayload.is_active = updates.accountActive;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'showFollowers')) {
    privacyPrefs.show_followers = updates.showFollowers;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'showFollowing')) {
    privacyPrefs.show_following = updates.showFollowing;
  }

  let merged: Partial<UserSettings> = {};

  if (Object.keys(accountPayload).length > 0) {
    const response = await apiFetch<AccountSettingsResponse>('/account/settings', {
      method: 'PATCH',
      json: accountPayload,
    });
    merged = { ...merged, ...mapUserToSettings(response.user) };
  }

  if (Object.keys(privacyPrefs).length > 0) {
    const response = await apiFetch<ProfileResponse>('/account/profile', {
      method: 'PATCH',
      json: { privacy_prefs: privacyPrefs },
    });
    merged = { ...merged, ...mapUserToSettings(response.user) };
  }

  return merged;
};

export const requestDeleteProfile = async (): Promise<DeleteRequestResponse> => {
  if (USE_MOCK_API) {
    await delay(420);
    return { scheduled: true, days: 10 };
  }

  return apiFetch<DeleteRequestResponse>('/me/delete-request', { method: 'POST' });
};

export const updatePassword = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}: UpdatePasswordPayload): Promise<PasswordResponse> => {
  if (USE_MOCK_API) {
    await delay(380);
    if (!currentPassword) {
      throw new Error('Current password is required.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
    return { message: 'Password updated.' };
  }

  return apiFetch<PasswordResponse>('/account/password', {
    method: 'PATCH',
    json: {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    },
  });
};
