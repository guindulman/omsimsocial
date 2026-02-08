import { apiFetch } from './client';
import { ConnectRequest, Connection } from './types';

export const connectApi = {
  createRequest: (toUserId: number, message?: string) =>
    apiFetch<{ request: ConnectRequest }>('/connect/requests', {
      method: 'POST',
      json: { to_user_id: toUserId, message },
    }),
  incomingRequests: () => apiFetch<{ data: ConnectRequest[] }>('/connect/requests/incoming'),
  outgoingRequests: () => apiFetch<{ data: ConnectRequest[] }>('/connect/requests/outgoing'),
  acceptRequest: (id: number) =>
    apiFetch<{ request: ConnectRequest; connection?: Connection | null }>(
      `/connect/requests/${id}/accept`,
      { method: 'POST' }
    ),
  declineRequest: (id: number) =>
    apiFetch<{ request: ConnectRequest }>(`/connect/requests/${id}/decline`, { method: 'POST' }),
  cancelRequest: (id: number) =>
    apiFetch<{ request: ConnectRequest }>(`/connect/requests/${id}/cancel`, { method: 'POST' }),
};
