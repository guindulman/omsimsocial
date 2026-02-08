import { apiFetch } from './client';
import { FriendRequest, FriendshipSummary } from './types';

export const friendApi = {
  sendFriendRequest: (userId: number, message?: string) =>
    apiFetch<{ request: FriendRequest }>('/friend-requests', {
      method: 'POST',
      json: { to_user_id: userId, ...(message ? { message } : {}) },
    }),
  incomingFriendRequests: () => apiFetch<{ data: FriendRequest[] }>('/friend-requests/incoming'),
  outgoingFriendRequests: () => apiFetch<{ data: FriendRequest[] }>('/friend-requests/outgoing'),
  confirmFriendRequest: (id: number) =>
    apiFetch<{ request: FriendRequest }>(`/friend-requests/${id}/confirm`, { method: 'POST' }),
  declineFriendRequest: (id: number) =>
    apiFetch<{ request: FriendRequest }>(`/friend-requests/${id}/decline`, { method: 'POST' }),
  cancelFriendRequest: (id: number) =>
    apiFetch<{ request: FriendRequest }>(`/friend-requests/${id}/cancel`, { method: 'POST' }),
  unfriend: (userId: number) => apiFetch<{ message: string }>(`/friends/${userId}`, { method: 'DELETE' }),
  verifyFriend: (userId: number) =>
    apiFetch<{ friendship: { id: number; verified_at: string | null } }>(`/friends/${userId}/verify`, {
      method: 'POST',
    }),
  friends: () => apiFetch<{ data: FriendshipSummary[] }>('/friends'),
};
