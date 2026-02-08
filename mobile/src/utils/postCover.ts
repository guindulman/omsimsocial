export const createPostSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const hashSeed = (seed: string | number) => {
  const input = String(seed);
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(31, hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export const pickCoverPreset = <T>(seed: string | number, presets: readonly T[]) => {
  if (!presets.length) {
    throw new Error('pickCoverPreset requires at least one preset.');
  }
  const idx = Math.abs(hashSeed(seed)) % presets.length;
  return presets[idx];
};

export const extractPostSeed = (
  clientPostId?: string | null,
  fallbackId?: number | string
) => {
  const raw = clientPostId?.trim();
  if (raw) {
    const [groupId] = raw.split(':');
    if (groupId) {
      return groupId;
    }
  }
  if (fallbackId !== undefined && fallbackId !== null) {
    return String(fallbackId);
  }
  return '0';
};

export const buildGeneratedCoverUrl = (seed: string | number) => {
  const encoded = encodeURIComponent(String(seed));
  return `https://picsum.photos/seed/omsim-${encoded}/900/900`;
};
