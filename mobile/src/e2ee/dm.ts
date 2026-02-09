import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';

import { base64ToBytes, bytesToBase64 } from './base64';
import { bytesToUtf8, utf8ToBytes } from './utf8';
import type { E2eeKeyPair } from './keys';
import type { Message } from '../api/types';

export type DmE2eePayloadV1 = {
  v: 1;
  sender_public_key: string;
  ciphertext_sender: string;
  nonce_sender: string;
  ciphertext_recipient: string;
  nonce_recipient: string;
};

export const encryptDmBodyV1 = async (
  plaintext: string,
  myKeyPair: E2eeKeyPair,
  recipientPublicKeyBase64: string
): Promise<DmE2eePayloadV1> => {
  const messageBytes = utf8ToBytes(plaintext);
  const recipientPublicKey = base64ToBytes(recipientPublicKeyBase64);
  if (recipientPublicKey.length !== nacl.box.publicKeyLength) {
    throw new Error('Invalid recipient key.');
  }

  const nonceRecipient = await Crypto.getRandomBytesAsync(nacl.box.nonceLength);
  const nonceSender = await Crypto.getRandomBytesAsync(nacl.box.nonceLength);

  const ciphertextRecipient = nacl.box(
    messageBytes,
    nonceRecipient,
    recipientPublicKey,
    myKeyPair.secretKey
  );
  const ciphertextSender = nacl.box(
    messageBytes,
    nonceSender,
    myKeyPair.publicKey,
    myKeyPair.secretKey
  );

  return {
    v: 1,
    sender_public_key: myKeyPair.publicKeyBase64,
    ciphertext_sender: bytesToBase64(ciphertextSender),
    nonce_sender: bytesToBase64(nonceSender),
    ciphertext_recipient: bytesToBase64(ciphertextRecipient),
    nonce_recipient: bytesToBase64(nonceRecipient),
  };
};

export const decryptDmBody = (
  message: Message,
  currentUserId: number,
  myKeyPair: E2eeKeyPair
) => {
  const e2ee = message.e2ee;
  if (!e2ee || e2ee.v !== 1) {
    return message.body ?? '';
  }

  const isMine = message.sender?.id === currentUserId;
  const nonce = base64ToBytes(isMine ? e2ee.nonce_sender : e2ee.nonce_recipient);
  const ciphertext = base64ToBytes(isMine ? e2ee.ciphertext_sender : e2ee.ciphertext_recipient);

  if (nonce.length !== nacl.box.nonceLength) {
    return '';
  }

  const senderPublicKey = isMine
    ? myKeyPair.publicKey
    : base64ToBytes(e2ee.sender_public_key);

  if (senderPublicKey.length !== nacl.box.publicKeyLength) {
    return '';
  }

  const opened = nacl.box.open(ciphertext, nonce, senderPublicKey, myKeyPair.secretKey);
  if (!opened) {
    return '';
  }

  return bytesToUtf8(opened);
};

