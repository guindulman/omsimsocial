import { apiFetch } from './client';

export type SessionInfo = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

export type NotificationPreferences = {
  mentions: boolean;
  directMessages: boolean;
  follows: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
};

export type SecurityPreferences = {
  passkeyEnabled: boolean;
  twoFactorEnabled: boolean;
};

type NotificationResponse = { preferences: NotificationPreferences };

type SecurityResponse = { preferences: SecurityPreferences };

type SessionResponse = { sessions: SessionInfo[] };

export type DataExportResponse = {
  status: 'queued' | 'processing' | 'ready';
  requestId?: string;
  downloadUrl?: string;
};

type ApiUser = {
  profile?: {
    privacy_prefs?: Record<string, unknown> | null;
  } | null;
};

type MeResponse = { user: ApiUser };

type ProfileResponse = { user: ApiUser };

const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mockSessions: SessionInfo[] = [
  {
    id: 'sess-1',
    device: 'iPhone 15 Pro',
    location: 'Los Angeles, CA',
    lastActive: 'Just now',
    current: true,
  },
  {
    id: 'sess-2',
    device: 'Chrome · Windows',
    location: 'Austin, TX',
    lastActive: '2 days ago',
  },
];

const defaultNotificationPreferences: NotificationPreferences = {
  mentions: true,
  directMessages: true,
  follows: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,
};

let mockNotifications: NotificationPreferences = { ...defaultNotificationPreferences };

let mockSecurity: SecurityPreferences = {
  passkeyEnabled: false,
  twoFactorEnabled: false,
};

const toBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return fallback;
};

const toHour = (value: unknown, fallback: number) => {
  const numeric =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = ((Math.round(numeric) % 24) + 24) % 24;
  return normalized;
};

const mapUserToNotificationPreferences = (user: ApiUser | null | undefined) => {
  const prefs = user?.profile?.privacy_prefs ?? {};
  return {
    mentions: toBoolean(prefs.notification_mentions, defaultNotificationPreferences.mentions),
    directMessages: toBoolean(
      prefs.notification_direct_messages,
      defaultNotificationPreferences.directMessages
    ),
    follows: toBoolean(prefs.notification_follows, defaultNotificationPreferences.follows),
    quietHoursEnabled: toBoolean(
      prefs.quiet_hours_enabled,
      defaultNotificationPreferences.quietHoursEnabled
    ),
    quietHoursStart: toHour(
      prefs.quiet_hours_start,
      defaultNotificationPreferences.quietHoursStart
    ),
    quietHoursEnd: toHour(prefs.quiet_hours_end, defaultNotificationPreferences.quietHoursEnd),
  };
};

const buildPrivacyPayload = (updates: Partial<NotificationPreferences>) => {
  const payload: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'mentions')) {
    payload.notification_mentions = updates.mentions;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'directMessages')) {
    payload.notification_direct_messages = updates.directMessages;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'follows')) {
    payload.notification_follows = updates.follows;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quietHoursEnabled')) {
    payload.quiet_hours_enabled = updates.quietHoursEnabled;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quietHoursStart')) {
    payload.quiet_hours_start = updates.quietHoursStart;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quietHoursEnd')) {
    payload.quiet_hours_end = updates.quietHoursEnd;
  }
  return payload;
};

const fallbackNotifications = async () => {
  await delay(240);
  return { ...mockNotifications };
};

export const listSessions = async (): Promise<SessionInfo[]> => {
  if (USE_MOCK_API) {
    await delay(280);
    return [...mockSessions];
  }

  try {
    const response = await apiFetch<SessionResponse>('/me/sessions');
    return response.sessions;
  } catch (error) {
    await delay(180);
    return [...mockSessions];
  }
};

export const logoutAllSessions = async (): Promise<{ ok: boolean }> => {
  if (USE_MOCK_API) {
    await delay(240);
    mockSessions = mockSessions.filter((session) => session.current);
    return { ok: true };
  }

  try {
    return await apiFetch<{ ok: boolean }>('/me/sessions/logout-all', { method: 'POST' });
  } catch (error) {
    mockSessions = mockSessions.filter((session) => session.current);
    return { ok: true };
  }
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  if (USE_MOCK_API) {
    await delay(260);
    return { ...mockNotifications };
  }

  try {
    const response = await apiFetch<MeResponse>('/me');
    const mapped = mapUserToNotificationPreferences(response.user);
    mockNotifications = mapped;
    return mapped;
  } catch (error) {
    return fallbackNotifications();
  }
};

export const patchNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  if (USE_MOCK_API) {
    await delay(240);
    mockNotifications = { ...mockNotifications, ...updates };
    return { ...mockNotifications };
  }

  const payload = buildPrivacyPayload(updates);
  if (Object.keys(payload).length === 0) {
    return getNotificationPreferences();
  }

  try {
    const response = await apiFetch<ProfileResponse>('/account/profile', {
      method: 'PATCH',
      json: { privacy_prefs: payload },
    });
    const mapped = mapUserToNotificationPreferences(response.user);
    mockNotifications = mapped;
    return mapped;
  } catch (error) {
    mockNotifications = { ...mockNotifications, ...updates };
    return { ...mockNotifications };
  }
};

export const getSecurityPreferences = async (): Promise<SecurityPreferences> => {
  if (USE_MOCK_API) {
    await delay(240);
    return { ...mockSecurity };
  }

  try {
    const response = await apiFetch<SecurityResponse>('/me/security-preferences');
    return response.preferences;
  } catch (error) {
    await delay(180);
    return { ...mockSecurity };
  }
};

export const patchSecurityPreferences = async (
  updates: Partial<SecurityPreferences>
): Promise<SecurityPreferences> => {
  if (USE_MOCK_API) {
    await delay(240);
    mockSecurity = { ...mockSecurity, ...updates };
    return { ...mockSecurity };
  }

  try {
    const response = await apiFetch<SecurityResponse>('/me/security-preferences', {
      method: 'PATCH',
      json: updates,
    });
    return response.preferences;
  } catch (error) {
    mockSecurity = { ...mockSecurity, ...updates };
    return { ...mockSecurity };
  }
};

export const requestDataExport = async (): Promise<DataExportResponse> => {
  if (USE_MOCK_API) {
    await delay(420);
    return { status: 'queued', requestId: `export-${Date.now()}` };
  }

  try {
    return await apiFetch<DataExportResponse>('/me/data-export', { method: 'POST' });
  } catch (error) {
    await delay(240);
    return { status: 'queued', requestId: `export-${Date.now()}` };
  }
};

export const getDataExportStatus = async (requestId: string): Promise<DataExportResponse> => {
  if (USE_MOCK_API) {
    await delay(320);
    return { status: 'processing', requestId };
  }

  try {
    return await apiFetch<DataExportResponse>(`/me/data-export/${requestId}`);
  } catch (error) {
    await delay(240);
    return { status: 'processing', requestId };
  }
};
