export type ProfilePrivacyPrefs = {
  show_followers?: boolean;
  show_following?: boolean;
  [key: string]: unknown;
};

export type Profile = {
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  city?: string | null;
  website_url?: string | null;
  birthday?: string | null;
  gender?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  privacy_prefs?: ProfilePrivacyPrefs | null;
};

export type User = {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  is_private?: boolean | null;
  is_active?: boolean | null;
  profile?: Profile | null;
};

export type FollowRequest = {
  id: number;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  requester?: User | null;
  target?: User | null;
  created_at: string;
  updated_at?: string;
};

export type FriendRequest = {
  id: number;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  message?: string | null;
  from_user?: User | null;
  to_user?: User | null;
  created_at: string;
  updated_at?: string;
};

export type FriendshipSummary = {
  id: number;
  verified_at?: string | null;
  created_at?: string;
  user?: User | null;
};

export type ConnectRequest = {
  id: number;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  message?: string | null;
  from_user?: User | null;
  to_user?: User | null;
  created_at: string;
  updated_at?: string;
};

export type Connection = {
  id: number;
  status: 'pending' | 'accepted' | 'blocked';
  method: 'handshake' | 'invite' | 'event';
  type: 'friend' | 'family' | 'work' | 'community';
  level: 'acquaintance' | 'friend' | 'inner';
  invite_code?: string | null;
  requester?: User;
  addressee?: User;
};

export type Circle = {
  id: number;
  name: string;
  icon?: string | null;
  invite_only: boolean;
  prompt_frequency: 'off' | 'daily' | 'weekly';
};

export type MemoryMedia = {
  id: number;
  type: 'image' | 'video' | 'voice';
  url: string;
};

export type MemoryComment = {
  id: number | string;
  parent_id?: number | null;
  body: string;
  created_at: string;
  user?: User | null;
  likes_count?: number;
  is_liked?: boolean;
};

export type Memory = {
  id: number;
  author?: User;
  scope: 'circle' | 'direct' | 'private' | 'public' | 'followers' | 'friends' | 'story';
  circle_id?: number | null;
  direct_user_id?: number | null;
  body?: string | null;
  location?: string | null;
  client_post_id?: string | null;
  story_audience?: 'public' | 'followers' | 'friends' | 'circle' | null;
  media?: MemoryMedia[];
  reactions?: { emoji: string; count: number }[];
  hearts_count?: number;
  hearts_count_cached?: number;
  likes_count?: number;
  reactions_count?: number;
  adoptions_count?: number;
  saves_count?: number;
  saves_count_cached?: number;
  comments_count?: number;
  comments_count_cached?: number;
  reshares_count?: number;
  reshares_count_cached?: number;
  tagged_users?: User[];
  is_liked?: boolean;
  is_reshared?: boolean;
  is_saved?: boolean;
  feed_type?: 'memory' | 'reshare';
  reshare?: {
    id: number;
    created_at: string;
    user?: User | null;
  } | null;
  reshare_preview?: {
    count_in_window?: number;
    users?: User[];
    has_more_in_window?: boolean;
  } | null;
  story_views_count?: number | null;
  expires_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
};

export type Adoption = {
  id: number;
  note?: string | null;
  visibility: 'private' | 'shared';
  user?: User;
  memory_id: number;
  created_at: string;
};

export type Message = {
  id: number;
  body?: string | null;
  e2ee?: {
    v: number;
    sender_public_key: string;
    ciphertext_sender: string;
    nonce_sender: string;
    ciphertext_recipient: string;
    nonce_recipient: string;
  } | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  read_at?: string | null;
  sender?: User | null;
  recipient?: User | null;
  created_at: string;
};

export type E2eeKey = {
  user_id: number;
  public_key: string;
  algorithm: string;
  created_at?: string;
  updated_at?: string;
};

export type CallSession = {
  id: number;
  conversation_id: number;
  requested_by_user_id: number;
  type: 'voice' | 'video';
  status: 'requested' | 'accepted' | 'declined' | 'ended' | 'expired';
  expires_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string | null;
};

export type VaultItem = {
  id: number;
  source: 'adoption' | 'private';
  memory?: Memory;
  created_at: string;
};

export type InboxEvent = {
  id: number;
  type:
    | 'adoption_note'
    | 'memory_saved'
    | 'memory_liked'
    | 'memory_commented'
    | 'comment_liked'
    | 'comment_replied'
    | 'memory_reshared'
    | 'connection_request'
    | 'system';
  data?: {
    memory_id?: number;
    comment_id?: number;
    parent_comment_id?: number;
    [key: string]: unknown;
  };
  read_at?: string | null;
  created_at: string;
};

export type TimeCapsule = {
  id: number;
  title?: string | null;
  scope: 'private' | 'circle' | 'direct';
  unlock_at: string;
  circle_id?: number | null;
  direct_user_id?: number | null;
};

export type ProfileViewSource = {
  label: string;
  value: number;
};

export type ProfileViewsSummary = {
  total_24h: number;
  total_7d: number;
  sources: ProfileViewSource[];
  share_profile_views?: boolean;
};

export type ProfileViewEntry = {
  id: number;
  viewed_user_id?: number;
  viewer_user_id?: number | null;
  viewer_visibility?: 'named' | 'anonymous';
  source?: string | null;
  created_at: string;
  viewer?: User | null;
};

export type ProfileSettings = {
  profile_visibility?: 'public' | 'connections';
  share_profile_views?: boolean;
  show_city?: boolean;
  show_links?: boolean;
  allow_invites_from?: 'everyone' | 'mutuals' | 'nobody';
  allow_calls_from?: 'connections' | 'favorites' | 'nobody';
};

export type CursorEnvelope<T> = {
  data: T[];
  next_cursor?: string | null;
  has_more?: boolean;
};

export type SearchResponse = {
  accounts?: CursorEnvelope<User>;
  posts?: CursorEnvelope<Memory>;
};
