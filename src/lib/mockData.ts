// User types
export type User = {
  id: string;
  name: string;
  avatar: string;
  color: string;
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
};

// Channel types
export type Channel = {
  id: string;
  name: string;
  serverId: string;
  type: 'text' | 'discussion';
  unreadCount?: number;
  hasMention?: boolean;
};

// Server types
export type Server = {
  id: string;
  name: string;
  icon?: string;
  channels: Channel[];
};

export const mockUsers: User[] = [
  { id: '1', name: 'Alice', avatar: '', color: 'oklch(65% 0.15 260)' },
  { id: '2', name: 'Bob', avatar: '', color: 'oklch(65% 0.15 320)' },
  { id: '3', name: 'Charlie', avatar: '', color: 'oklch(65% 0.15 140)' },
  { id: '4', name: 'Diana', avatar: '', color: 'oklch(65% 0.15 40)' },
  { id: '5', name: 'Eve', avatar: '', color: 'oklch(65% 0.15 210)' },
];

export const mockServers: Server[] = [
  {
    id: 's1',
    name: 'Product Design',
    channels: [
      { id: 'c1', name: 'general', serverId: 's1', type: 'text' },
      { id: 'c2', name: 'design-review', serverId: 's1', type: 'discussion', unreadCount: 3 },
      { id: 'c3', name: 'feedback', serverId: 's1', type: 'discussion', hasMention: true },
    ],
  },
  {
    id: 's2',
    name: 'Engineering',
    channels: [
      { id: 'c4', name: 'frontend', serverId: 's2', type: 'text' },
      { id: 'c5', name: 'backend', serverId: 's2', type: 'text' },
    ],
  },
];

export const mockThreads: Thread[] = [
  {
    id: 't1',
    title: 'New navigation patterns',
    channelId: 'c2',
    messages: [],
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
    isPinned: true,
    replyCount: 12,
    lastActivity: new Date('2024-01-15T10:30:00'),
    position: { x: 120, y: 80 },
    rotation: -2,
    size: 'large',
    borderRadius: '65% 35% 30% 70%/60% 40% 65% 35%',
  },
  {
    id: 't2',
    title: 'Color system updates',
    channelId: 'c2',
    messages: [],
    participants: [mockUsers[1], mockUsers[3]],
    isUnread: true,
    replyCount: 5,
    lastActivity: new Date('2024-01-15T14:20:00'),
    position: { x: 400, y: 140 },
    rotation: 1,
    size: 'medium',
    borderRadius: '45% 55% 60% 40%/55% 45% 50% 50%',
  },
  {
    id: 't3',
    title: 'Dashboard redesign',
    channelId: 'c2',
    messages: [],
    participants: [mockUsers[0], mockUsers[2], mockUsers[4]],
    replyCount: 8,
    lastActivity: new Date('2024-01-14T16:45:00'),
    position: { x: 280, y: 280 },
    rotation: -1,
    size: 'medium',
    borderRadius: '50% 50% 45% 55%/65% 35% 50% 50%',
  },
  {
    id: 't4',
    title: 'Icon refresh',
    channelId: 'c2',
    messages: [],
    participants: [mockUsers[1]],
    replyCount: 3,
    lastActivity: new Date('2024-01-14T09:15:00'),
    position: { x: 620, y: 100 },
    rotation: 2,
    size: 'small',
    borderRadius: '60% 40% 50% 50%/55% 60% 40% 45%',
  },
  {
    id: 't5',
    title: 'Mobile app explorations',
    channelId: 'c2',
    messages: [],
    participants: [mockUsers[0], mockUsers[1], mockUsers[3], mockUsers[4]],
    replyCount: 15,
    lastActivity: new Date('2024-01-13T11:30:00'),
    position: { x: 180, y: 420 },
    rotation: -3,
    size: 'large',
    borderRadius: '70% 30% 55% 45%/50% 50% 60% 40%',
  },
];
