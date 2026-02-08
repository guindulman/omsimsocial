import { apiFetch } from './client';
import { FollowRequest, User } from './types';

export const followApi = {
  follow: (userId: number) =>
    apiFetch<{ status: 'following' | 'requested'; request?: FollowRequest }>(`/follow/${userId}`, {
      method: 'POST',
    }),
  unfollow: (userId: number) =>
    apiFetch<{ status: 'unfollowed' }>(`/follow/${userId}`, { method: 'DELETE' }),
  incomingFollowRequests: () => apiFetch<{ data: FollowRequest[] }>('/follow-requests/incoming'),
  outgoingFollowRequests: () => apiFetch<{ data: FollowRequest[] }>('/follow-requests/outgoing'),
  acceptFollowRequest: (id: number) =>
    apiFetch<{ status: 'following'; request: FollowRequest }>(`/follow-requests/${id}/accept`, {
      method: 'POST',
    }),
  declineFollowRequest: (id: number) =>
    apiFetch<{ request: FollowRequest }>(`/follow-requests/${id}/decline`, { method: 'POST' }),
  cancelFollowRequest: (id: number) =>
    apiFetch<{ request: FollowRequest }>(`/follow-requests/${id}/cancel`, { method: 'POST' }),
  followers: (userId: number) => apiFetch<{ data: User[] }>(`/users/${userId}/followers`),
  following: (userId: number) => apiFetch<{ data: User[] }>(`/users/${userId}/following`),
};
