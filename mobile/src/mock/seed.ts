import {
  Adoption,
  BackstageThread,
  CallRequest,
  Connection,
  Conversation,
  Post,
  ProfileViewData,
  User,
} from '../state/types';

const now = Date.now();

export const seedUsers: User[] = [
  {
    id: 'u0',
    name: 'Ari Sol',
    handle: 'arisol',
    avatarUrl: 'https://i.pravatar.cc/200?img=11',
    city: 'Los Angeles, CA',
    isPublic: true,
    bio: 'Real connections, lasting legacies.',
  },
  {
    id: 'u1',
    name: 'Nova Reese',
    handle: 'novareese',
    avatarUrl: 'https://i.pravatar.cc/200?img=13',
    city: 'Seattle, WA',
    isPublic: true,
    bio: 'Legacy curator. Pulse chaser.',
  },
  {
    id: 'u2',
    name: 'Mateo Cruz',
    handle: 'mateocruz',
    avatarUrl: 'https://i.pravatar.cc/200?img=15',
    city: 'Austin, TX',
    isPublic: false,
    bio: 'Connections only. O+ verified.',
  },
  {
    id: 'u3',
    name: 'Lina Kade',
    handle: 'linakade',
    avatarUrl: 'https://i.pravatar.cc/200?img=32',
    city: 'Toronto, ON',
    isPublic: true,
    bio: 'Pulse editor and translator.',
  },
  {
    id: 'u4',
    name: 'Kai Monroe',
    handle: 'kaimonroe',
    avatarUrl: 'https://i.pravatar.cc/200?img=43',
    city: 'Brooklyn, NY',
    isPublic: true,
    bio: 'Remix lab. Legacy builder.',
  },
];

export const seedPosts: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    caption: 'Midnight walk. Capture the glow before it fades.',
    media: [{ id: 'm1', type: 'image' }],
    createdAt: now - 1000 * 60 * 35,
    expiresAt: now + 1000 * 60 * 60 * 22,
    visibility: 'connections',
    adoptionCount: 4,
    saveCount: 12,
    legacy: false,
  },
  {
    id: 'p2',
    authorId: 'u2',
    caption: 'Near you: rooftop signal. Save to extend the night.',
    media: [{ id: 'm2', type: 'video' }],
    createdAt: now - 1000 * 60 * 90,
    expiresAt: now + 1000 * 60 * 60 * 3,
    visibility: 'nearby',
    adoptionCount: 8,
    saveCount: 6,
    legacy: false,
  },
  {
    id: 'p3',
    authorId: 'u3',
    caption: 'Legacy-bound story arc. Keep the thread alive.',
    media: [{ id: 'm3', type: 'image' }, { id: 'm4', type: 'image' }],
    createdAt: now - 1000 * 60 * 240,
    expiresAt: now + 1000 * 60 * 60 * 6,
    visibility: 'connections',
    adoptionCount: 12,
    saveCount: 22,
    legacy: true,
  },
  {
    id: 'p4',
    authorId: 'u4',
    caption: 'Translate this pulse for your city.',
    media: [{ id: 'm5', type: 'video' }],
    createdAt: now - 1000 * 60 * 30,
    expiresAt: now + 1000 * 60 * 60 * 1.5,
    visibility: 'nearby',
    adoptionCount: 6,
    saveCount: 9,
    legacy: false,
  },
];

export const seedAdoptions: Adoption[] = [
  {
    id: 'a1',
    postId: 'p1',
    userId: 'u0',
    type: 'extend',
    contribution: 'Extending the story with a late-night detail.',
    createdAt: now - 1000 * 60 * 90,
  },
];

export const seedConnections: Connection[] = [
  {
    id: 'c1',
    userId: 'u0',
    connectedUserId: 'u1',
    createdAt: now - 1000 * 60 * 60 * 24,
  },
  {
    id: 'c2',
    userId: 'u0',
    connectedUserId: 'u3',
    createdAt: now - 1000 * 60 * 60 * 48,
  },
];

export const seedThreads: BackstageThread[] = [
  {
    id: 't1',
    postId: 'p1',
    title: 'Pulse: Midnight Walk',
    topic: 'Lighting cues, location swaps, and legacy edits.',
    messages: [
      {
        id: 'tm1',
        senderId: 'u1',
        text: 'Need a last scene for the bridge.',
        createdAt: now - 1000 * 60 * 50,
      },
      {
        id: 'tm2',
        senderId: 'u0',
        text: 'I can remix the ending with a sunset shot.',
        createdAt: now - 1000 * 60 * 40,
      },
    ],
  },
  {
    id: 't2',
    postId: 'p2',
    title: 'Pulse: Rooftop Signal',
    topic: 'Translate ideas for global regions.',
    messages: [
      {
        id: 'tm3',
        senderId: 'u2',
        text: 'Waiting on a localized variant.',
        createdAt: now - 1000 * 60 * 30,
      },
    ],
  },
];

export const seedConversations: Conversation[] = [
  {
    id: 'chat1',
    participantIds: ['u0', 'u1'],
    title: 'Nova Reese',
    messages: [
      { id: 'cm1', senderId: 'u1', text: 'Pulse looks strong today.', createdAt: now - 1000 * 60 * 40 },
      { id: 'cm2', senderId: 'u0', text: 'Let us sync for a legacy push.', createdAt: now - 1000 * 60 * 32 },
    ],
  },
  {
    id: 'chat2',
    participantIds: ['u0', 'u3'],
    title: 'Lina Kade',
    messages: [
      { id: 'cm3', senderId: 'u3', text: 'Translation drop ready?', createdAt: now - 1000 * 60 * 22 },
      { id: 'cm4', senderId: 'u0', text: 'Yes, sharing now.', createdAt: now - 1000 * 60 * 18 },
    ],
  },
];

export const seedCalls: CallRequest[] = [
  { id: 'call1', conversationId: 'chat1', type: 'voice', status: 'idle' },
];

export const seedProfileViews: ProfileViewData = {
  insights: {
    total24h: 42,
    total7d: 214,
    sources: [
      { label: 'Connections', value: 60 },
      { label: 'Pulse', value: 28 },
      { label: 'Legacy', value: 12 },
    ],
  },
  viewers: [
    { id: 'pv1', viewerId: 'u1', viewedAt: now - 1000 * 60 * 45 },
    { id: 'pv2', viewerId: 'u3', viewedAt: now - 1000 * 60 * 120 },
  ],
};
