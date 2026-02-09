import { useEffect, useMemo, useState } from 'react';

import { api } from '../api';
import { ApiError } from '../api/client';
import { useAuthStore } from '../state/authStore';
import { getOrCreateDmKeyPair, type E2eeKeyPair } from './keys';

type DmE2eeState =
  | { status: 'idle' | 'loading'; keyPair: null; error: null }
  | { status: 'ready'; keyPair: E2eeKeyPair; error: null }
  | { status: 'error'; keyPair: null; error: string };

export const useDmE2eeKeyPair = () => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const [state, setState] = useState<DmE2eeState>({
    status: 'idle',
    keyPair: null,
    error: null,
  });

  useEffect(() => {
    if (!token || !userId) {
      setState({ status: 'idle', keyPair: null, error: null });
      return;
    }

    let active = true;
    setState({ status: 'loading', keyPair: null, error: null });

    (async () => {
      const keyPair = await getOrCreateDmKeyPair();
      try {
        await api.e2eeRegisterKey(keyPair.publicKeyBase64);
      } catch (err) {
        // If the backend is down, local keys still exist; messages will fail to send.
        if (err instanceof ApiError) {
          // Ignore 409/422 mismatches in older backends.
          if (err.status === 409 || err.status === 404) {
            // no-op
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (!active) return;
      setState({ status: 'ready', keyPair, error: null });
    })().catch((err: unknown) => {
      if (!active) return;
      const message =
        err instanceof ApiError
          ? (err.payload as { message?: string } | null)?.message || err.message
          : err instanceof Error
          ? err.message
          : 'Unable to initialize encrypted messaging.';
      setState({ status: 'error', keyPair: null, error: message });
    });

    return () => {
      active = false;
    };
  }, [token, userId]);

  return useMemo(() => state, [state]);
};

