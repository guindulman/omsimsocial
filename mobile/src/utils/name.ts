export const firstName = (name?: string, fallback?: string) => {
  const trimmed = (name ?? '').trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0];
  }
  const fallbackTrimmed = (fallback ?? '').trim();
  if (fallbackTrimmed) {
    return fallbackTrimmed.split(/\s+/)[0];
  }
  return 'User';
};
