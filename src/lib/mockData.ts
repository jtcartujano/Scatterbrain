// User types
export type User = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  status?: 'online' | 'offline';
};

// Direct Message types
export type DirectMessage = {
  id: string;
  user: User;
  unreadCount?: number;
};

// Message types
export type Message = {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
};

// Thread types
export type Thread = {
  id: string;
  title: string;
  channelId: string;
  messages: Message[];
  participants: User[];
  isPinned?: boolean;
  isUnread?: boolean;
  replyCount: number;
  lastActivity: Date;
  position: { x: number; y: number };
  rotation: number;
  size: 'small' | 'medium' | 'large';
  borderRadius: string;
  images?: string[];
};

// Channel types
export type Channel = {
  id: string;
  name: string;
  serverId: string;
  type: 'text' | 'discussion';
  unreadCount?: number;
  hasMention?: boolean;
  description?: string;
};

// Server types
export type Server = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  channels: Channel[];
  unreadCount?: number;
  hasInvite?: boolean;
};

// Members for brainstorm channel — 24 total, showing 5 + "+19 more"
export const mockUsers: User[] = [
  { id: 'u1', name: 'jae mercer', avatar: '', color: 'oklch(65% 0.18 145)', status: 'online' },
  { id: 'u2', name: 'kip loewen', avatar: '', color: 'oklch(65% 0.18 85)', status: 'online' },
  { id: 'u3', name: 'ren ostara', avatar: '', color: 'oklch(65% 0.18 340)', status: 'online' },
  { id: 'u4', name: 'sy park', avatar: '', color: 'oklch(65% 0.18 200)', status: 'online' },
  { id: 'u5', name: 'avi nakamura', avatar: '', color: 'oklch(65% 0.18 30)', status: 'offline' },
  // Additional members (not shown individually, part of "+19 more")
  { id: 'u6', name: 'quinn hayes', avatar: '', color: 'oklch(65% 0.15 260)', status: 'online' },
  { id: 'u7', name: 'drew kim', avatar: '', color: 'oklch(65% 0.15 120)', status: 'offline' },
];

// Direct Messages
export const mockDirectMessages: DirectMessage[] = [
  { id: 'dm1', user: mockUsers[1], unreadCount: 2 }, // kip loewen — 2 unread
  { id: 'dm2', user: mockUsers[3] }, // sy park — no unread
];

export const mockServers: Server[] = [
  {
    id: 's1',
    name: 'Nightcrew',
    icon: 'NC',
    color: 'oklch(55% 0.2 270)',
    unreadCount: 1,
    channels: [
      { id: 'c1', name: 'general', serverId: 's1', type: 'text' },
      { id: 'c2', name: 'random', serverId: 's1', type: 'text' },
      { id: 'c3', name: 'announcements', serverId: 's1', type: 'text', unreadCount: 3 },
      {
        id: 'c4',
        name: 'brainstorm',
        serverId: 's1',
        type: 'discussion',
        description: 'Loose ideas, feedback, half-formed plans. Anything can spin into its own thread.',
      },
      { id: 'c5', name: 'feedback', serverId: 's1', type: 'discussion' },
      { id: 'c6', name: 'show-and-tell', serverId: 's1', type: 'discussion' },
    ],
  },
  {
    id: 's2',
    name: 'DevJam',
    icon: 'DJ',
    color: 'oklch(60% 0.18 45)',
    unreadCount: 12,
    channels: [
      { id: 'c7', name: 'general', serverId: 's2', type: 'text' },
      { id: 'c8', name: 'projects', serverId: 's2', type: 'discussion' },
    ],
  },
  {
    id: 's3',
    name: 'Book Club',
    icon: 'BC',
    color: 'oklch(65% 0.15 160)',
    hasInvite: true,
    channels: [
      { id: 'c9', name: 'general', serverId: 's3', type: 'text' },
      { id: 'c10', name: 'current-read', serverId: 's3', type: 'discussion' },
    ],
  },
  {
    id: 's4',
    name: 'Running Log',
    icon: 'RL',
    color: 'oklch(60% 0.18 180)',
    channels: [
      { id: 'c11', name: 'general', serverId: 's4', type: 'text' },
      { id: 'c12', name: 'routes', serverId: 's4', type: 'discussion' },
    ],
  },
];

// Threads in "brainstorm" channel (c4)
// Positions roughly match the mockup layout
export const mockThreads: Thread[] = [
  {
    id: 't1',
    title: 'logo direction: bubble vs bolt',
    channelId: 'c4',
    messages: [],
    participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[5]],
    isPinned: true,
    replyCount: 42,
    lastActivity: new Date(Date.now() - 12 * 60 * 1000), // 12m ago
    position: { x: 80, y: 60 },
    rotation: -2,
    size: 'large',
    borderRadius: '65% 35% 30% 70%/60% 40% 65% 35%',
  },
  {
    id: 't2',
    title: 'should DMs be encrypted by default?',
    channelId: 'c4',
    messages: [],
    participants: [mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[5], mockUsers[6]],
    isUnread: true,
    replyCount: 31,
    lastActivity: new Date(Date.now() - 38 * 60 * 1000), // 38m ago
    position: { x: 380, y: 100 },
    rotation: 1,
    size: 'large',
    borderRadius: '45% 55% 60% 40%/55% 45% 50% 50%',
  },
  {
    id: 't3',
    title: "who's up for game night friday",
    channelId: 'c4',
    messages: [],
    participants: [mockUsers[0], mockUsers[1], mockUsers[4], mockUsers[6]],
    replyCount: 18,
    lastActivity: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    position: { x: 680, y: 50 },
    rotation: 2,
    size: 'medium',
    borderRadius: '50% 50% 45% 55%/65% 35% 50% 50%',
  },
  {
    id: 't4',
    title: 'onboarding flow — too many steps?',
    channelId: 'c4',
    messages: [],
    participants: [mockUsers[1], mockUsers[3], mockUsers[5]],
    isUnread: true,
    replyCount: 14,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    position: { x: 100, y: 320 },
    rotation: -1,
    size: 'large',
    borderRadius: '70% 30% 55% 45%/50% 50% 60% 40%',
  },
  {
    id: 't5',
    title: 'new emoji pack: rough sketches',
    channelId: 'c4',
    messages: [],
    participants: [],
    replyCount: 6,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
    position: { x: 380, y: 340 },
    rotation: 0,
    size: 'small',
    borderRadius: '55% 45% 50% 50%/60% 40% 55% 45%',
  },
  {
    id: 't6',
    title: 'bug: notifications double-firing',
    channelId: 'c4',
    messages: [],
    participants: [],
    isUnread: true,
    replyCount: 9,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
    position: { x: 580, y: 320 },
    rotation: 1,
    size: 'medium',
    borderRadius: '48% 52% 55% 45%/52% 48% 50% 50%',
  },
  {
    id: 't7',
    title: 'naming the mascot',
    channelId: 'c4',
    messages: [],
    participants: [],
    replyCount: 3,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1d ago
    position: { x: 220, y: 520 },
    rotation: -2,
    size: 'small',
    borderRadius: '60% 40% 50% 50%/55% 60% 40% 45%',
  },
  {
    id: 't8',
    title: "what's everyone building this weekend",
    channelId: 'c4',
    messages: [],
    participants: [mockUsers[0], mockUsers[2], mockUsers[4], mockUsers[6]],
    replyCount: 11,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1d ago
    position: { x: 450, y: 500 },
    rotation: 0,
    size: 'medium',
    borderRadius: '52% 48% 45% 55%/58% 42% 52% 48%',
  },
  {
    id: 't9',
    title: 'server icon meme thread',
    channelId: 'c4',
    messages: [],
    participants: [],
    replyCount: 22,
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2d ago
    position: { x: 680, y: 460 },
    rotation: 2,
    size: 'large',
    borderRadius: '58% 42% 48% 52%/50% 50% 55% 45%',
    images: [
      'https://picsum.photos/seed/meme1/200',
      'https://picsum.photos/seed/meme2/200',
      'https://picsum.photos/seed/meme3/200',
      'https://picsum.photos/seed/meme4/200',
      'https://picsum.photos/seed/meme5/200',
      'https://picsum.photos/seed/meme6/200',
    ],
  },
];

// Friends list for the Friends view (reusing some users)
export const mockFriends: User[] = [
  mockUsers[0], // jae mercer
  mockUsers[1], // kip loewen
  mockUsers[2], // ren ostara
  mockUsers[3], // sy park
  mockUsers[4], // avi nakamura
];

// Total member count for the brainstorm channel info panel
export const BRAINSTORM_MEMBER_COUNT = 24;
