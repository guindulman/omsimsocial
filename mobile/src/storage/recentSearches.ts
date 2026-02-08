import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recent_searches';
const DEFAULT_LIMIT = 10;

const normalizeTerm = (term: string) => term.trim();

export const loadRecentSearches = async (): Promise<string[]> => {
  const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    return [];
  }
  return [];
};

export const addRecentSearch = async (
  term: string,
  limit: number = DEFAULT_LIMIT
): Promise<string[]> => {
  const normalized = normalizeTerm(term);
  if (!normalized) {
    return loadRecentSearches();
  }
  const existing = await loadRecentSearches();
  const deduped = existing.filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase()
  );
  const next = [normalized, ...deduped].slice(0, limit);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
};

export const clearRecentSearches = async (): Promise<void> => {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
};
