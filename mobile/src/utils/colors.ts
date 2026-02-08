const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace('#', '');
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleaned;
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')}`;

export const blendColors = (from: string, to: string, ratio: number) => {
  const safeRatio = clamp(ratio);
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  return rgbToHex(
    start.r + (end.r - start.r) * safeRatio,
    start.g + (end.g - start.g) * safeRatio,
    start.b + (end.b - start.b) * safeRatio
  );
};
