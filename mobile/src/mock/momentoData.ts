import {
  MomentoConversation,
  MomentoMessage,
  MomentoNotification,
  MomentoPost,
  MomentoStory,
  MomentoSuggestion,
  MomentoTrend,
  MomentoUser,
} from '../types/momento';

export const momentoUsers: MomentoUser[] = [
  {
    id: 'u1',
    name: 'Ava Santos',
    username: 'avas',
    avatarUrl: 'https://i.pravatar.cc/200?img=11',
  },
  {
    id: 'u2',
    name: 'Liam Reyes',
    username: 'liamr',
    avatarUrl: 'https://i.pravatar.cc/200?img=12',
  },
  {
    id: 'u3',
    name: 'Mia Cruz',
    username: 'miacruz',
    avatarUrl: 'https://i.pravatar.cc/200?img=32',
  },
  {
    id: 'u4',
    name: 'Noah Tan',
    username: 'noaht',
    avatarUrl: 'https://i.pravatar.cc/200?img=36',
  },
  {
    id: 'u5',
    name: 'Sofia Lim',
    username: 'sofial',
    avatarUrl: 'https://i.pravatar.cc/200?img=45',
  },
  {
    id: 'u6',
    name: 'Lucas Diaz',
    username: 'lucasd',
    avatarUrl: 'https://i.pravatar.cc/200?img=48',
  },
];

export const momentoStories: MomentoStory[] = [
  { id: 's1', user: momentoUsers[0], isLive: true },
  { id: 's2', user: momentoUsers[1] },
  { id: 's3', user: momentoUsers[2] },
  { id: 's4', user: momentoUsers[3] },
  { id: 's5', user: momentoUsers[4] },
  { id: 's6', user: momentoUsers[5] },
];

export const momentoPosts: MomentoPost[] = [
  {
    id: 'p1',
    user: momentoUsers[0],
    timeAgo: '12m',
    caption: 'Morning light and a slow start. Keeping it simple today.',
    media: { id: 'm1', type: 'image', uri: 'https://picsum.photos/seed/omsim-1/900/900' },
    likes: 128,
    comments: 24,
    liked: true,
  },
  {
    id: 'p2',
    user: momentoUsers[2],
    timeAgo: '46m',
    caption: 'Cafe corner finds and good conversation.',
    media: { id: 'm2', type: 'image', uri: 'https://picsum.photos/seed/omsim-2/900/900' },
    likes: 92,
    comments: 12,
  },
  {
    id: 'p3',
    user: momentoUsers[4],
    timeAgo: '1h',
    caption: 'Weekend reset. New playlist, new focus.',
    media: { id: 'm3', type: 'image', uri: 'https://picsum.photos/seed/omsim-3/900/900' },
    likes: 210,
    comments: 35,
  },
];

export const momentoConversations: MomentoConversation[] = [
  {
    id: 'c1',
    user: momentoUsers[1],
    lastMessage: 'Are we still on for tonight?',
    timeAgo: '2m',
    unreadCount: 2,
  },
  {
    id: 'c2',
    user: momentoUsers[3],
    lastMessage: 'Sent the photos from yesterday.',
    timeAgo: '18m',
    unreadCount: 0,
  },
  {
    id: 'c3',
    user: momentoUsers[5],
    lastMessage: 'Let us plan the weekend hang.',
    timeAgo: '1h',
    unreadCount: 1,
  },
];

export const momentoMessages: Record<string, MomentoMessage[]> = {
  c1: [
    { id: 'm1', from: 'u2', text: 'Are we still on for tonight?', time: '2:41 PM' },
    { id: 'm2', from: 'me', text: 'Yes, see you after work.', time: '2:42 PM' },
    { id: 'm3', from: 'u2', text: 'Perfect. I will grab seats.', time: '2:43 PM' },
  ],
  c2: [
    { id: 'm4', from: 'u4', text: 'Sent the photos from yesterday.', time: '1:50 PM' },
    { id: 'm5', from: 'me', text: 'Thanks. They look great.', time: '1:52 PM' },
  ],
  c3: [
    { id: 'm6', from: 'u6', text: 'Let us plan the weekend hang.', time: '11:10 AM' },
    { id: 'm7', from: 'me', text: 'Saturday afternoon works for me.', time: '11:12 AM' },
  ],
};

export const momentoNotifications: MomentoNotification[] = [
  {
    id: 'n1',
    user: momentoUsers[2],
    type: 'like',
    timeAgo: '5m',
    text: 'liked your post.',
  },
  {
    id: 'n2',
    user: momentoUsers[0],
    type: 'comment',
    timeAgo: '20m',
    text: 'commented: "Love this vibe."',
  },
  {
    id: 'n3',
    user: momentoUsers[5],
    type: 'follow',
    timeAgo: '2h',
    text: 'started following you.',
  },
];

export const momentoSuggestions: MomentoSuggestion[] = [
  { id: 'sg1', title: 'Design coffee spots', subtitle: 'Trending near you' },
  { id: 'sg2', title: 'Weekend hikes', subtitle: 'Popular right now' },
  { id: 'sg3', title: 'Photo walks', subtitle: 'Suggested for you' },
];

export const momentoTrends: MomentoTrend[] = Array.from({ length: 18 }).map((_, index) => ({
  id: `t${index}`,
  imageUrl: `https://picsum.photos/seed/omsim-trend-${index}/400/400`,
}));

export const momentoProfile = {
  name: 'Ava Santos',
  username: '@avas',
  bio: 'Design lead, coffee runs, and golden hour captures.',
  avatarUrl: 'https://i.pravatar.cc/300?img=11',
  coverUrl: 'https://picsum.photos/seed/omsim-cover/1200/600',
  stats: [
    { label: 'Posts', value: '128' },
    { label: 'Friends', value: '432' },
    { label: 'Saved', value: '56' },
  ],
};
