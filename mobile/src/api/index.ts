import { apiFetch, apiUpload } from './client';
import {
  Adoption,
  CallSession,
  Circle,
  Connection,
  InboxEvent,
  Message,
  MemoryComment,
  ProfileSettings,
  ProfileViewEntry,
  ProfileViewsSummary,
  SearchResponse,
  Memory,
  TimeCapsule,
  User,
  VaultItem,
} from './types';

export const api = {
  register: (payload: {
    name: string;
    username: string;
    email?: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    turnstile_token?: string;
  }) =>
    apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      json: payload,
    }),
  login: (payload: { identifier: string; password: string }) =>
    apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      json: payload,
    }),
  me: () => apiFetch<{ user: User }>('/me'),
  updateProfile: (payload: {
    name?: string;
    username?: string;
    email?: string | null;
    phone?: string | null;
    bio?: string;
    city?: string;
    website_url?: string;
    birthday?: string;
    gender?: string;
    instagram_url?: string;
    facebook_url?: string;
    tiktok_url?: string;
    avatar_url?: string;
    cover_url?: string;
    privacy_prefs?: {
      show_followers?: boolean;
      show_following?: boolean;
      [key: string]: unknown;
    };
  }) =>
    apiFetch<{ user: User }>('/account/profile', {
      method: 'PATCH',
      json: payload,
    }),
  updateSettings: (payload: { is_private?: boolean; is_active?: boolean }) =>
    apiFetch<{ user: User }>('/account/settings', {
      method: 'PATCH',
      json: payload,
    }),
  updatePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) =>
    apiFetch<{ message: string }>('/account/password', {
      method: 'PATCH',
      json: payload,
    }),
  uploadAvatar: (payload: { uri: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: payload.uri,
      name: `avatar-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
    return apiUpload<{ user: User }>('/account/avatar', formData);
  },
  uploadCover: (payload: { uri: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: payload.uri,
      name: `cover-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
    return apiUpload<{ user: User }>('/account/cover', formData);
  },
  listConnections: () => apiFetch<{ data: Connection[] }>('/connections'),
  updateConnection: (id: number, payload: { type?: string; level?: string; muted?: boolean }) =>
    apiFetch<{ connection: Connection }>(`/connections/${id}`, { method: 'PATCH', json: payload }),
  createInvite: (payload?: { method?: 'invite' | 'event'; type?: string; level?: string }) =>
    apiFetch<{ connection: Connection; invite_code: string; invite_link: string }>('/connections/invite', {
      method: 'POST',
      json: payload ?? {},
    }),
  acceptInvite: (code: string) =>
    apiFetch<{ connection: Connection; first_memory_draft?: Record<string, unknown> }>('/connections/accept-invite', {
      method: 'POST',
      json: { code },
    }),
  handshakeInitiate: () =>
    apiFetch<{ handshake_code: string }>('/connections/handshake/initiate', {
      method: 'POST',
      json: {},
    }),
  handshakeConfirm: (code: string) =>
    apiFetch<{ friendship: { id: number; verified_at: string | null } }>(
      '/connections/handshake/confirm',
      {
        method: 'POST',
        json: { code },
      }
    ),
  listCircles: () => apiFetch<{ data: Circle[] }>('/circles'),
  createCircle: (payload: { name: string; icon?: string; invite_only?: boolean }) =>
    apiFetch<{ circle: Circle }>('/circles', { method: 'POST', json: payload }),
  getCircle: (id: number) => apiFetch<{ circle: Circle }>(`/circles/${id}`),
  updateCircle: (id: number, payload: { name?: string; prompt_frequency?: string }) =>
    apiFetch<{ circle: Circle }>(`/circles/${id}`, { method: 'PATCH', json: payload }),
  circleFeed: (id: number) =>
    apiFetch<{ prompt?: { id: number; prompt: string } | null; memories: Memory[] }>(`/circles/${id}/feed`),
  createMemory: (payload: {
    scope: 'circle' | 'direct' | 'private' | 'public' | 'followers' | 'friends' | 'story';
    circle_id?: number;
    direct_user_id?: number;
    body?: string;
    location?: string;
    client_post_id?: string;
    tags?: number[];
  }) => apiFetch<{ memory: Memory }>('/memories', { method: 'POST', json: payload }),
  homeFeed: (params?: { limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: Memory[]; next_cursor?: string | null; has_more?: boolean }>(
      `/feed/home${suffix}`
    );
  },
  profileFeed: (userId: number, params?: { limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: Memory[]; next_cursor?: string | null; has_more?: boolean }>(
      `/users/${userId}/profile-feed${suffix}`
    );
  },
  publicFeed: (query?: string) => {
    const q = query?.trim();
    const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiFetch<{ data: Memory[] }>(`/memories/public${suffix}`);
  },
  search: (query: string, params?: { type?: 'top' | 'accounts' | 'posts'; limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    search.set('q', query);
    if (params?.type) {
      search.set('type', params.type);
    }
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<SearchResponse>(`/search${suffix}`);
  },
  searchSuggestedAccounts: (params?: { limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: User[]; next_cursor?: string | null; has_more?: boolean }>(
      `/search/suggested-accounts${suffix}`
    );
  },
  searchTrending: (params?: { limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: Memory[]; next_cursor?: string | null; has_more?: boolean }>(
      `/search/trending${suffix}`
    );
  },
  followingFeed: () => apiFetch<{ data: Memory[] }>('/memories/following'),
  viewStory: (memoryId: number) =>
    apiFetch<{ count: number }>(`/memories/${memoryId}/story-view`, { method: 'POST' }),
  storyViewers: (memoryId: number) =>
    apiFetch<{ count: number; viewers: User[] }>(`/memories/${memoryId}/story-viewers`),
  myMemories: () => apiFetch<{ data: Memory[] }>('/memories/mine'),
  trashMemories: () => apiFetch<{ data: Memory[] }>('/memories/trash'),
  hiddenMemories: () => apiFetch<{ data: Memory[] }>('/memories/hidden'),
  getMemory: (id: number) => apiFetch<{ memory: Memory }>(`/memories/${id}`),
  deleteMemory: (id: number) => apiFetch<{ message?: string }>(`/memories/${id}`, { method: 'DELETE' }),
  restoreMemory: (id: number) =>
    apiFetch<{ memory: Memory }>(`/memories/${id}/restore`, { method: 'POST' }),
  purgeMemory: (id: number) => apiFetch<{ message?: string }>(`/memories/${id}/purge`, { method: 'DELETE' }),
  uploadMemoryMedia: (memoryId: number, payload: { type: 'image' | 'video' | 'voice'; uri: string }) => {
    const formData = new FormData();
    formData.append('type', payload.type);
    formData.append('file', {
      uri: payload.uri,
      name: `${payload.type}-${Date.now()}`,
      type: payload.type === 'image' ? 'image/jpeg' : payload.type === 'video' ? 'video/mp4' : 'audio/m4a',
    } as unknown as Blob);
    return apiUpload<{ media: unknown }>(`/memories/${memoryId}/media`, formData);
  },
  reactMemory: (memoryId: number, emoji: string) =>
    apiFetch<{ reaction: unknown }>(`/memories/${memoryId}/react`, {
      method: 'POST',
      json: { emoji },
    }),
  unreactMemory: (memoryId: number, emoji: string) =>
    apiFetch<{ message: string }>(`/memories/${memoryId}/react?emoji=${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    }),
  reshareMemory: (memoryId: number) =>
    apiFetch<{ reshare: unknown }>(`/memories/${memoryId}/reshare`, { method: 'POST' }),
  unreshareMemory: (memoryId: number) =>
    apiFetch<{ message: string }>(`/memories/${memoryId}/reshare`, { method: 'DELETE' }),
  adoptMemory: (memoryId: number, payload: { note?: string; visibility?: 'private' | 'shared' }) =>
    apiFetch<{ adoption: unknown }>(`/memories/${memoryId}/adopt`, {
      method: 'POST',
      json: payload,
    }),
  listMemoryAdoptions: (memoryId: number) =>
    apiFetch<{ data: Adoption[] }>(`/memories/${memoryId}/adoptions`),
  hideMemory: (memoryId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/memories/${memoryId}/hide`, { method: 'POST' }),
  unhideMemory: (memoryId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/memories/${memoryId}/hide`, { method: 'DELETE' }),
  muteUser: (userId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/users/${userId}/mute`, { method: 'POST' }),
  unmuteUser: (userId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/users/${userId}/mute`, { method: 'DELETE' }),
  blockUser: (userId: number) =>
    apiFetch<{ blocked: boolean; block_id?: number }>(`/blocks`, {
      method: 'POST',
      json: { blocked_user_id: userId },
    }),
  unblockUser: (userId: number) =>
    apiFetch<{ blocked: boolean }>(`/blocks/${userId}`, { method: 'DELETE' }),
  blockStatus: (userId: number) =>
    apiFetch<{ blocked: boolean; blocked_by_me?: boolean; blocked_me?: boolean }>(`/blocks/${userId}`),
  blockedUsers: () => apiFetch<{ data: User[] }>('/blocks'),
  report: (payload: {
    target_type: 'memory' | 'comment' | 'user' | 'story' | 'post' | 'message' | 'live_room';
    target_id: number;
    reason: string;
    details?: string;
    notes?: string;
  }) =>
    apiFetch<{ ok?: boolean; message?: string; report?: unknown }>('/report', {
      method: 'POST',
      json: payload,
    }),
  listMemoryHearts: (memoryId: number) =>
    apiFetch<{ count?: number; data: User[] }>(`/memories/${memoryId}/hearts`),
  profileViewsSummary: () =>
    apiFetch<ProfileViewsSummary>('/profile/views/summary'),
  profileViews: (params?: { range?: '24h' | '7d' | '30d'; limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params?.range) {
      search.set('range', params.range);
    }
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: ProfileViewEntry[]; next_cursor?: string | null; has_more?: boolean }>(
      `/profile/views${suffix}`
    );
  },
  recordProfileView: (
    userId: number | string,
    payload: { source: string; viewer_visibility?: 'named' | 'anonymous' }
  ) =>
    apiFetch<{ view: ProfileViewEntry }>(`/profile/views/${userId}`, {
      method: 'POST',
      json: payload,
    }),
  updateProfileSettings: (payload: { share_profile_views?: boolean }) =>
    apiFetch<{ settings: ProfileSettings }>('/profile/settings', {
      method: 'PATCH',
      json: payload,
    }),
  listMemoryReshares: (memoryId: number | string, params?: { limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: User[]; next_cursor?: string | null; has_more?: boolean }>(
      `/memories/${memoryId}/reshares${suffix}`
    );
  },
  listMemoryComments: (memoryId: number, params?: { limit?: number; cursor?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) {
      search.set('limit', String(params.limit));
    }
    if (params?.cursor) {
      search.set('cursor', params.cursor);
    }
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return apiFetch<{ data: MemoryComment[]; next_cursor?: string | null; has_more?: boolean }>(
      `/memories/${memoryId}/comments${suffix}`
    );
  },
  createMemoryComment: (memoryId: number, payload: { body: string; parent_id?: number | null }) =>
    apiFetch<{ comment?: MemoryComment; data?: MemoryComment }>(`/memories/${memoryId}/comments`, {
      method: 'POST',
      json: payload,
    }),
  updateComment: (commentId: number, payload: { body: string }) =>
    apiFetch<{ comment?: MemoryComment; data?: MemoryComment }>(`/comments/${commentId}`, {
      method: 'PATCH',
      json: payload,
    }),
  likeComment: (commentId: number) =>
    apiFetch<{ message: string }>(`/comments/${commentId}/like`, { method: 'POST' }),
  unlikeComment: (commentId: number) =>
    apiFetch<{ message: string }>(`/comments/${commentId}/like`, { method: 'DELETE' }),
  listCommentLikes: (commentId: number) =>
    apiFetch<{ count?: number; data: User[] }>(`/comments/${commentId}/likes`),
  deleteComment: (commentId: number) =>
    apiFetch<{ message: string }>(`/comments/${commentId}`, { method: 'DELETE' }),
  saveMemory: (memoryId: number) => apiFetch<{ adoption: unknown }>(`/memories/${memoryId}/save`, { method: 'POST' }),
  unsaveMemory: (memoryId: number) =>
    apiFetch<{ message?: string }>(`/memories/${memoryId}/save`, { method: 'DELETE' }),
  vaultSummary: () =>
    apiFetch<{ adopted: VaultItem[]; by_people: unknown[]; by_circles: unknown[]; time_capsules_count: number }>(
      '/vault'
    ),
  vaultAdopted: () => apiFetch<{ data: VaultItem[] }>('/vault/adopted'),
  vaultOnThisDay: () => apiFetch<{ data: Memory[] }>('/vault/on-this-day'),
  inboxAdoptionNotes: () => apiFetch<{ data: InboxEvent[] }>('/inbox/adoption-notes'),
  inboxActivity: () => apiFetch<{ data: InboxEvent[] }>('/inbox/activity'),
  inboxRequests: () => apiFetch<{ data: InboxEvent[] }>('/inbox/requests'),
  inboxUnreadCount: () =>
    apiFetch<{ activity: number; friend_requests: number; follow_requests: number; total: number }>(
      '/inbox/unread-count'
    ),
  markInboxActivityRead: () => apiFetch<{ ok?: boolean; message?: string }>('/inbox/activity/read', { method: 'POST' }),
  markInboxEventRead: (eventId: number) =>
    apiFetch<{ ok?: boolean; event?: InboxEvent; message?: string }>(`/inbox/activity/${eventId}/read`, {
      method: 'POST',
    }),
  listTimeCapsules: () => apiFetch<{ data: TimeCapsule[] }>('/time-capsules'),
  createTimeCapsule: (payload: {
    unlock_at: string;
    scope: 'private' | 'circle' | 'direct';
    circle_id?: number;
    direct_user_id?: number;
    title?: string;
    memory_ids: number[];
  }) => apiFetch<{ time_capsule: TimeCapsule }>('/time-capsules', { method: 'POST', json: payload }),
  sendMessage: (payload: {
    recipient_id: number;
    body?: string;
    media?: { uri: string; type: 'image' | 'video' };
  }) => {
    if (payload.media) {
      const formData = new FormData();
      formData.append('recipient_id', String(payload.recipient_id));
      if (payload.body) {
        formData.append('body', payload.body);
      }
      formData.append('file', {
        uri: payload.media.uri,
        name: `${payload.media.type}-${Date.now()}.${payload.media.type === 'video' ? 'mp4' : 'jpg'}`,
        type: payload.media.type === 'video' ? 'video/mp4' : 'image/jpeg',
      } as unknown as Blob);
      return apiUpload<{ message: Message }>('/messages', formData);
    }
    return apiFetch<{ message: Message }>('/messages', {
      method: 'POST',
      json: { recipient_id: payload.recipient_id, body: payload.body ?? '' },
    });
  },
  requestCall: (recipientId: number, type: 'voice' | 'video' = 'video') =>
    apiFetch<{ call: CallSession }>('/calls/request', {
      method: 'POST',
      json: { recipient_id: recipientId, type },
    }),
  acceptCall: (callId: number) =>
    apiFetch<{ call: CallSession }>(`/calls/${callId}/accept`, { method: 'POST' }),
  declineCall: (callId: number) =>
    apiFetch<{ call: CallSession }>(`/calls/${callId}/decline`, { method: 'POST' }),
  endCall: (callId: number) =>
    apiFetch<{ call: CallSession }>(`/calls/${callId}/end`, { method: 'POST' }),
  sendCallSignal: (callId: number, payload: { signal: Record<string, unknown> }) =>
    apiFetch<{ ok: boolean }>(`/calls/${callId}/signal`, {
      method: 'POST',
      json: payload,
    }),
  messageThread: (userId: number) => apiFetch<{ data: Message[] }>(`/messages/thread/${userId}`),
  deleteMessage: (messageId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/messages/${messageId}`, { method: 'DELETE' }),
  unsendMessage: (messageId: number) =>
    apiFetch<{ ok?: boolean; message?: string }>(`/messages/${messageId}/unsend`, { method: 'DELETE' }),
  messageUnreadCount: () => apiFetch<{ total: number }>('/messages/unread-count'),
  messageUnreadBySender: () =>
    apiFetch<{ data: { sender_id: number; unread_count: number }[] }>('/messages/unread-by-sender'),
};
