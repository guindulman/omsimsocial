import { Memory, User } from '../api/types';
import { API_URL } from '../api/client';
import { MomentoMedia, MomentoPost, MomentoStory, MomentoUser } from '../types/momento';
import { formatTimeAgo } from './time';
import { buildGeneratedCoverUrl, extractPostSeed } from './postCover';

const fallbackAvatar = (id: number) => `https://i.pravatar.cc/200?img=${(id % 70) + 1}`;
const fallbackImage = (seed: string | number) => buildGeneratedCoverUrl(seed);
const apiBaseUrl = API_URL.replace(/\/api\/v1\/?$/, '');

export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(file|content|data):/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${apiBaseUrl}${trimmed}`;
  }
  if (!/^https?:\/\//i.test(trimmed) && trimmed.startsWith('storage/')) {
    return `${apiBaseUrl}/${trimmed}`;
  }
  if (/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/i.test(trimmed)) {
    return trimmed.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?/i,
      apiBaseUrl
    );
  }
  return trimmed;
};

const mapUserToMomentoUser = (user: User): MomentoUser => {
  return {
    id: String(user.id),
    name: user.name ?? 'Omsim Friend',
    username: user.username ?? `user${user.id}`,
    avatarUrl: normalizeMediaUrl(user.profile?.avatar_url) ?? fallbackAvatar(user.id),
  };
};

export const mapMemoryToMomentoUser = (memory: Memory): MomentoUser => {
  const author = memory.author;
  const id = author?.id ?? memory.id;
  return {
    id: String(id),
    name: author?.name ?? 'Omsim Friend',
    username: author?.username ?? `user${id}`,
    avatarUrl: normalizeMediaUrl(author?.profile?.avatar_url) ?? fallbackAvatar(id),
  };
};

export const mapMemoryToMomentoPost = (memory: Memory): MomentoPost => {
  const isStory = isStoryMemory(memory);
  const user = mapMemoryToMomentoUser(memory);
  const postSeed = extractPostSeed(memory.client_post_id, memory.id);
  const reshareUser = memory.reshare?.user;
  const reshare =
    reshareUser && memory.reshare?.created_at
      ? {
          user: mapUserToMomentoUser(reshareUser),
          createdAt: memory.reshare.created_at,
        }
      : undefined;
  const resharePreviewUsers = memory.reshare_preview?.users?.map(mapUserToMomentoUser) ?? [];
  const previewCount = resharePreviewUsers.length;
  const totalInWindow = memory.reshare_preview?.count_in_window;
  const hasMoreInWindow = Boolean(memory.reshare_preview?.has_more_in_window);
  const reshareUsers = resharePreviewUsers.length
    ? resharePreviewUsers
    : reshare
    ? [reshare.user]
    : undefined;
  const feedKey =
    memory.feed_type === 'reshare' && memory.reshare?.id
      ? `reshare-${memory.reshare.id}`
      : String(memory.id);
  const likes =
    (memory.hearts_count ??
      memory.hearts_count_cached ??
      memory.likes_count ??
      memory.reactions_count ??
      null) ??
    (memory.reactions?.reduce((sum, reaction) => sum + (reaction.count ?? 0), 0) ?? 0);
  const comments = memory.comments_count ?? memory.comments_count_cached ?? 0;
  const saves = memory.adoptions_count ?? memory.saves_count ?? memory.saves_count_cached ?? 0;
  const reshares =
    memory.reshares_count ??
    memory.reshares_count_cached ??
    (typeof totalInWindow === 'number' ? totalInWindow : 0);
  const taggedUsers = memory.tagged_users?.map(mapUserToMomentoUser) ?? [];
  const derivedStoryExpiry = (() => {
    if (!isStory || memory.expires_at) return null;
    const createdMs = Date.parse(memory.created_at);
    if (!Number.isFinite(createdMs)) return null;
    return new Date(createdMs + 24 * 60 * 60 * 1000).toISOString();
  })();
  const mediaItems: MomentoMedia[] =
    memory.media?.map((item, index) => ({
      id: String(item.id ?? `media-${memory.id}-${index}`),
      type: item.type === 'video' ? ('video' as const) : ('image' as const),
      uri: normalizeMediaUrl(item.url) ?? fallbackImage(`${postSeed}-${index}`),
    })) ?? [];
  const primaryMedia = mediaItems[0];

  return {
    id: String(memory.id),
    feedKey,
    coverSeed: postSeed,
    user,
    timeAgo: formatTimeAgo(memory.created_at),
    caption: memory.body ?? '',
    location: memory.location ?? null,
    taggedUsers: taggedUsers.length ? taggedUsers : undefined,
    feedType: memory.feed_type ?? undefined,
    reshare,
    reshareUsers,
    reshareMeta: {
      total:
        typeof memory.reshares_count === 'number'
          ? memory.reshares_count
          : typeof totalInWindow === 'number'
          ? totalInWindow
          : undefined,
      previewCount,
      hasMore:
        hasMoreInWindow ||
        (typeof totalInWindow === 'number' ? totalInWindow > previewCount : false),
    },
    media: primaryMedia
      ? {
          id: primaryMedia.id,
          type: primaryMedia.type,
          uri: primaryMedia.uri,
        }
      : undefined,
    mediaItems: mediaItems.length ? mediaItems : undefined,
    likes,
    comments,
    saves,
    liked: Boolean(memory.is_liked),
    saved: Boolean(memory.is_saved),
    reshares,
    reshared: Boolean(memory.is_reshared),
    scope: isStory ? 'story' : memory.scope,
    expiresAt: memory.expires_at ?? derivedStoryExpiry,
  };
};

export const isStoryMemory = (memory: Memory) =>
  memory.scope === 'story' || Boolean(memory.story_audience) || Boolean(memory.expires_at);

const scopePriority: Record<Memory['scope'], number> = {
  public: 5,
  followers: 4,
  friends: 3,
  circle: 2,
  direct: 1,
  private: 0,
  story: -1,
};

const pickPreferredMemory = (current: Memory | undefined, candidate: Memory) => {
  if (!current) return candidate;
  const currentPriority = scopePriority[current.scope] ?? 0;
  const candidatePriority = scopePriority[candidate.scope] ?? 0;
  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority ? candidate : current;
  }
  return Date.parse(candidate.created_at) > Date.parse(current.created_at) ? candidate : current;
};

export const dedupeMemories = (memories: Memory[]) => {
  const selected = new Map<string, Memory>();
  memories.forEach((memory) => {
    const clientKey = (() => {
      if (memory.client_post_id && memory.client_post_id.length) {
        const [groupId] = memory.client_post_id.split(':');
        return groupId || memory.client_post_id;
      }
      return `memory-${memory.id}`;
    })();
    const isStory = isStoryMemory(memory);
    const normalized = isStory && memory.scope !== 'story' ? { ...memory, scope: 'story' } : memory;
    const key = isStory ? `story-${clientKey}` : `post-${clientKey}`;
    const existing = selected.get(key);
    selected.set(key, pickPreferredMemory(existing, normalized));
  });
  return Array.from(selected.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
};

export const buildStoriesFromPosts = (posts: MomentoPost[]): MomentoStory[] => {
  const sourcePosts = posts.filter((post) => post.scope === 'story');
  if (!sourcePosts.length) {
    return [];
  }
  const seen = new Set<string>();
  return sourcePosts
    .filter((post) => {
      if (seen.has(post.user.id)) return false;
      seen.add(post.user.id);
      return true;
    })
    .map((post, index) => ({
      id: `story-${post.user.id}`,
      user: post.user,
      memoryId: Number(post.id),
      isLive: index % 4 === 0,
      expiresAt: post.expiresAt ?? null,
    }));
};
