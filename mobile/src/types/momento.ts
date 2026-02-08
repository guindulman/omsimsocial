export type MomentoUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
};

export type MomentoStory = {
  id: string;
  user: MomentoUser;
  memoryId?: number;
  memoryIds?: number[];
  isLive?: boolean;
  expiresAt?: string | null;
};

export type MomentoMedia = {
  id: string;
  type: 'image' | 'video';
  uri: string;
};

export type MomentoPost = {
  id: string;
  feedKey?: string;
  coverSeed?: string;
  user: MomentoUser;
  timeAgo: string;
  caption: string;
  location?: string | null;
  taggedUsers?: MomentoUser[];
  feedType?: 'memory' | 'reshare';
  reshare?: {
    user: MomentoUser;
    createdAt: string;
  };
  reshareUsers?: MomentoUser[];
  reshareMeta?: {
    total?: number;
    previewCount?: number;
    hasMore?: boolean;
  };
  media?: MomentoMedia;
  mediaItems?: MomentoMedia[];
  likes: number;
  comments: number;
  saves?: number;
  reshares?: number;
  liked?: boolean;
  saved?: boolean;
  reshared?: boolean;
  scope?: 'circle' | 'direct' | 'private' | 'public' | 'followers' | 'friends' | 'story';
  expiresAt?: string | null;
};

export type MomentoConversation = {
  id: string;
  user: MomentoUser;
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
};

export type MomentoMessage = {
  id: string;
  from: 'me' | string;
  text: string;
  time: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
};

export type MomentoNotification = {
  id: string;
  user: MomentoUser;
  type: 'like' | 'comment' | 'comment_like' | 'follow' | 'save' | 'reshare';
  timeAgo: string;
  text: string;
  memoryId?: number;
  commentId?: number;
  isUnread?: boolean;
};

export type MomentoSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  avatarUrl?: string;
};

export type MomentoTrend = {
  id: string;
  imageUrl: string;
};
