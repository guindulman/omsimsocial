import { fromByteArray, toByteArray } from 'base64-js';

export const bytesToBase64 = (bytes: Uint8Array) => fromByteArray(bytes);

export const base64ToBytes = (value: string) => toByteArray(value);

