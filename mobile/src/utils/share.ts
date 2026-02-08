import { MomentoPost } from '../types/momento';

export type SharePostPayload = {
  id: string;
  caption?: string;
  mediaUri?: string | null;
  mediaType?: 'image' | 'video';
  authorName?: string;
  authorUsername?: string;
};

const trimValue = (value?: string | null) => value?.trim() ?? '';

export const buildSharePostPayload = (post: MomentoPost): SharePostPayload => ({
  id: post.id,
  caption: post.caption,
  mediaUri: post.media?.uri,
  mediaType: post.media?.type,
  authorName: post.user?.name,
  authorUsername: post.user?.username,
});

export const buildShareMessage = (payload: SharePostPayload) => {
  const caption = trimValue(payload.caption);
  const mediaUri = trimValue(payload.mediaUri);
  const authorName = trimValue(payload.authorName);
  const authorHandle = trimValue(payload.authorUsername);
  const authorLine =
    authorName || authorHandle
      ? `${authorName || 'Omsim friend'}${authorHandle ? ` (@${authorHandle})` : ''}`
      : 'a friend';
  const base = caption || `Shared a moment from ${authorLine}.`;
  const message = mediaUri ? `${base}\n${mediaUri}` : base;
  if (message.length <= 2000) {
    return message;
  }
  return `${message.slice(0, 1990)}…`;
};
