export type VisibilityScope = 'connections' | 'nearby';

export type MediaItem = {
  id: string;
  type: 'image' | 'video';
  uri?: string;
};

export type User = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  city: string;
  isPublic: boolean;
  bio: string;
};

export type Post = {
  id: string;
  authorId: string;
  caption: string;
  media: MediaItem[];
  createdAt: number;
  expiresAt: number;
  visibility: VisibilityScope;
  adoptionCount: number;
  saveCount: number;
  legacy: boolean;
};

export type AdoptionType = 'extend' | 'remix' | 'translate' | 'localize';

export type Adoption = {
  id: string;
  postId: string;
  userId: string;
  type: AdoptionType;
  contribution: string;
  createdAt: number;
  media?: MediaItem;
  locationTag?: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  title: string;
  messages: Message[];
};

export type BackstageThread = {
  id: string;
  postId: string;
  title: string;
  topic: string;
  messages: Message[];
  unlockedBy?: 'connected' | 'adopted';
};

export type Connection = {
  id: string;
  userId: string;
  connectedUserId: string;
  createdAt: number;
};

export type CallRequest = {
  id: string;
  conversationId: string;
  type: 'voice' | 'video';
  status: 'idle' | 'ringing' | 'active' | 'ended';
};

export type ProfileView = {
  id: string;
  viewerId: string;
  viewedAt: number;
};

export type ProfileInsights = {
  total24h: number;
  total7d: number;
  sources: Array<{ label: string; value: number }>;
};

export type ProfileViewData = {
  insights: ProfileInsights;
  viewers: ProfileView[];
};
