import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';

import { base64ToBytes, bytesToBase64 } from './base64';

const DM_SECRET_KEY_STORAGE = 'omsim_e2ee_box_secret_v1';

export type E2eeKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  publicKeyBase64: string;
  secretKeyBase64: string;
};

export const getOrCreateDmKeyPair = async (): Promise<E2eeKeyPair> => {
  const existing = await SecureStore.getItemAsync(DM_SECRET_KEY_STORAGE);
  if (existing) {
    const secretKey = base64ToBytes(existing);
    if (secretKey.length !== nacl.box.secretKeyLength) {
      await SecureStore.deleteItemAsync(DM_SECRET_KEY_STORAGE);
    } else {
      const pair = nacl.box.keyPair.fromSecretKey(secretKey);
      return {
        publicKey: pair.publicKey,
        secretKey: pair.secretKey,
        publicKeyBase64: bytesToBase64(pair.publicKey),
        secretKeyBase64: existing,
      };
    }
  }

  const secretKey = await Crypto.getRandomBytesAsync(nacl.box.secretKeyLength);
  const pair = nacl.box.keyPair.fromSecretKey(secretKey);
  const secretKeyBase64 = bytesToBase64(secretKey);
  await SecureStore.setItemAsync(DM_SECRET_KEY_STORAGE, secretKeyBase64);

  return {
    publicKey: pair.publicKey,
    secretKey: pair.secretKey,
    publicKeyBase64: bytesToBase64(pair.publicKey),
    secretKeyBase64,
  };
};

