export const getTimeLeft = (expiresAt: number, now: number) => {
  const diff = Math.max(0, expiresAt - now);
  const totalMinutes = Math.ceil(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { diff, hours, minutes };
};

export const formatCountdown = (expiresAt: number, now: number) => {
  const { hours, minutes } = getTimeLeft(expiresAt, now);
  return `${hours}h ${minutes}m left`;
};

export const isDying = (expiresAt: number, now: number) => {
  const { diff } = getTimeLeft(expiresAt, now);
  return diff <= 1000 * 60 * 60 * 2;
};

export const formatTimeAgo = (value: string | number | Date, nowValue = Date.now()) => {
  const now = typeof nowValue === 'number' ? nowValue : nowValue.getTime();
  const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  const diff = Math.max(0, now - time);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
};
