const encodeFallback = (value: string) => {
  // Fallback for runtimes without TextEncoder.
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    const ch = encoded[i];
    if (ch === '%') {
      bytes.push(Number.parseInt(encoded.slice(i + 1, i + 3), 16));
      i += 2;
      continue;
    }
    bytes.push(ch.charCodeAt(0));
  }
  return new Uint8Array(bytes);
};

const decodeFallback = (bytes: Uint8Array) => {
  let encoded = '';
  for (let i = 0; i < bytes.length; i++) {
    encoded += `%${bytes[i].toString(16).padStart(2, '0')}`;
  }
  return decodeURIComponent(encoded);
};

export const utf8ToBytes = (value: string) => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value);
  }
  return encodeFallback(value);
};

export const bytesToUtf8 = (bytes: Uint8Array) => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  return decodeFallback(bytes);
};

