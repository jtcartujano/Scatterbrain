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

/**
 * Hard cap on a thread description. Mirrored in the database as
 * `CHECK (char_length(description) <= 140)` — chosen so a description never
 * needs truncating on a bubble.
 */
export const THREAD_DESCRIPTION_MAX_LENGTH = 140;

/**
 * A thread's root post is its title plus optional description — there is no
 * body message. So `messages` holds replies only, and `replyCount` is just
 * their number; `authorId` / `createdAt` describe who started the thread.
 *
 * `position` and `size` persist (curated layout, and a fixed footprint keeps
 * stored coordinates collision-free). Rotation and blob radius are derived
 * from the id instead — see `features/threads/threadLayout.ts`.
 */
export type Thread = {
  id: string;
  title: string;
  channelId: string;
  description?: string;
  authorId: string;
  createdAt: Date;
  messages: Message[];
  participants: User[];
  isPinned?: boolean;
  isUnread?: boolean;
  replyCount: number;
  lastActivity: Date;
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms);

/**
 * Authoring shape for the mock threads. `replies` is a compact
 * `[authorIndex, content]` tuple list — writing 156 literal Message objects
 * would bury the file and let the derived fields drift out of sync.
 */
type ThreadSeed = Omit<Thread, 'messages' | 'replyCount' | 'participants'> & {
  replies: [authorIndex: number, content: string][];
};

/**
 * Expands a seed into a Thread, deriving everything derivable so the
 * invariants hold by construction: replies are chronological, the last one
 * lands exactly on `lastActivity`, `replyCount` matches the messages, and
 * participants are exactly the people who appear in the thread.
 */
function toThread(seed: ThreadSeed): Thread {
  const { replies, ...thread } = seed;

  const start = seed.createdAt.getTime();
  const span = seed.lastActivity.getTime() - start;
  const step = replies.length > 0 ? span / replies.length : 0;

  const messages: Message[] = replies.map(([authorIndex, content], index) => ({
    id: `${seed.id}-m${index + 1}`,
    authorId: mockUsers[authorIndex].id,
    content,
    timestamp: new Date(start + step * (index + 1)),
  }));

  // Author first, then each distinct replier in the order they first spoke.
  const participants = [...new Set([seed.authorId, ...messages.map((m) => m.authorId)])]
    .map((id) => mockUsers.find((user) => user.id === id))
    .filter((user): user is User => user !== undefined);

  return { ...thread, messages, replyCount: messages.length, participants };
}

// Threads in "brainstorm" channel (c4)
// Positions are logical-plane coordinates — see features/threads/threadLayout.ts
const threadSeeds: ThreadSeed[] = [
  {
    id: 't1',
    title: 'logo direction: bubble vs bolt',
    channelId: 'c4',
    description:
      'Two directions on the table — the soft bubble mark and the sharper bolt. Post variants here, keep the arguing in one place.',
    authorId: 'u1',
    createdAt: ago(2 * DAY),
    isPinned: true,
    lastActivity: ago(12 * MINUTE),
    position: { x: 80, y: 60 },
    size: 'large',
    replies: [
      [0, 'bolt reads sharper at 16px'],
      [1, 'bubble has more warmth though'],
      [2, 'lorem ipsum dolor sit'],
      [3, 'can we see both on dark?'],
      [0, 'posting variants in a sec'],
      [4, 'the bolt feels generic tbh'],
      [5, 'agreed, seen it everywhere'],
      [1, 'warmth > sharpness here'],
      [6, 'what about a hybrid'],
      [2, 'consectetur adipiscing elit'],
      [3, 'hybrid usually means neither'],
      [0, 'fair'],
      [4, 'try it at favicon size'],
      [1, 'bubble survives the scale down'],
      [5, 'bolt turns into a smudge'],
      [2, 'sed do eiusmod tempor'],
      [6, 'ok bubble is winning'],
      [3, 'not so fast'],
      [0, 'lol'],
      [4, 'the bolt with rounded ends?'],
      [1, 'now thats interesting'],
      [5, 'incididunt ut labore'],
      [2, 'mocking it up'],
      [6, 'take your time'],
      [3, 'et dolore magna aliqua'],
      [0, 'this is the one'],
      [4, 'still too busy'],
      [1, 'busy how'],
      [5, 'too many curves fighting'],
      [2, 'ut enim ad minim veniam'],
      [6, 'simplify the tail'],
      [3, 'done, v4 posted'],
      [0, 'much better'],
      [4, 'ship it'],
      [1, 'hold on, colours'],
      [5, 'spark on void obviously'],
      [2, 'quis nostrud exercitation'],
      [6, 'signal for the accent?'],
      [3, 'too teal'],
      [0, 'agreed'],
      [4, 'locking v4 then'],
      [1, 'finally'],
    ],
  },
  {
    id: 't2',
    title: 'should DMs be encrypted by default?',
    channelId: 'c4',
    authorId: 'u3',
    createdAt: ago(30 * HOUR),
    isUnread: true,
    lastActivity: ago(38 * MINUTE),
    position: { x: 380, y: 100 },
    size: 'large',
    replies: [
      [2, 'e2e by default or opt in?'],
      [3, 'default. anything else is theatre'],
      [4, 'key management is the hard part'],
      [5, 'lorem ipsum dolor sit amet'],
      [6, 'device loss = history loss'],
      [2, 'thats the tradeoff yeah'],
      [3, 'backup keys?'],
      [4, 'then whats the point'],
      [0, 'point is transport safety'],
      [5, 'consectetur adipiscing'],
      [6, 'search breaks completely'],
      [2, 'client side index'],
      [3, 'on mobile? good luck'],
      [4, 'fair'],
      [0, 'scope it to DMs only'],
      [5, 'sed do eiusmod tempor'],
      [6, 'servers stay plaintext then'],
      [2, 'for now'],
      [3, 'v1 doesnt need this at all'],
      [4, 'disagree strongly'],
      [0, 'we can ship the flag off'],
      [5, 'incididunt ut labore et dolore'],
      [6, 'flags rot'],
      [2, 'everything rots'],
      [3, 'ok but seriously'],
      [4, 'lets timebox the spike'],
      [0, 'two days?'],
      [5, 'magna aliqua ut enim'],
      [6, 'three'],
      [2, 'three then'],
      [3, 'noted, writing it up'],
    ],
  },
  {
    id: 't3',
    title: "who's up for game night friday",
    channelId: 'c4',
    authorId: 'u2',
    createdAt: ago(20 * HOUR),
    lastActivity: ago(1 * HOUR),
    position: { x: 680, y: 50 },
    size: 'medium',
    replies: [
      [1, 'im in'],
      [0, 'same'],
      [4, 'what time'],
      [6, 'lorem ipsum dolor'],
      [1, 'eight works for me'],
      [0, 'eight is late'],
      [4, 'seven thirty?'],
      [6, 'fine by me'],
      [1, 'what are we playing'],
      [0, 'anything but that one'],
      [4, 'sit amet consectetur'],
      [6, 'be specific'],
      [1, 'the long one'],
      [0, 'ha'],
      [4, 'ill bring snacks'],
      [6, 'adipiscing elit sed'],
      [1, 'seven thirty locked'],
      [0, 'see you then'],
    ],
  },
  {
    id: 't4',
    title: 'onboarding flow — too many steps?',
    channelId: 'c4',
    description:
      'Six screens before anyone sends a message. Where can we cut, and what genuinely has to stay?',
    authorId: 'u4',
    createdAt: ago(26 * HOUR),
    isUnread: true,
    lastActivity: ago(2 * HOUR),
    position: { x: 100, y: 320 },
    size: 'large',
    replies: [
      [1, 'six screens is a lot'],
      [3, 'four of them are legal'],
      [5, 'can legal be one screen'],
      [1, 'lorem ipsum dolor sit'],
      [3, 'probably, asking'],
      [5, 'avatar step can go'],
      [1, 'people skip it anyway'],
      [3, 'then why is it blocking'],
      [5, 'legacy'],
      [1, 'consectetur adipiscing elit'],
      [3, 'cut to three total'],
      [5, 'three feels right'],
      [1, 'ill draft it'],
      [3, 'thanks'],
    ],
  },
  {
    id: 't5',
    title: 'new emoji pack: rough sketches',
    channelId: 'c4',
    description: 'Rough pencil passes, nothing final.',
    authorId: 'u6',
    createdAt: ago(9 * HOUR),
    lastActivity: ago(3 * HOUR),
    position: { x: 380, y: 340 },
    size: 'small',
    replies: [
      [6, 'these are rough, be nice'],
      [0, 'the third one is great'],
      [2, 'lorem ipsum'],
      [6, 'thats the throwaway one lol'],
      [0, 'still great'],
      [2, 'more of that direction'],
    ],
  },
  {
    id: 't6',
    title: 'bug: notifications double-firing',
    channelId: 'c4',
    description: 'Reproduces on mobile after a background sync. Steps and logs below.',
    authorId: 'u5',
    createdAt: ago(14 * HOUR),
    isUnread: true,
    lastActivity: ago(5 * HOUR),
    position: { x: 580, y: 320 },
    size: 'medium',
    replies: [
      [5, 'only after a background sync'],
      [1, 'ios or android'],
      [5, 'both'],
      [4, 'lorem ipsum dolor sit amet'],
      [1, 'sounds like a dedupe key issue'],
      [5, 'logs attached'],
      [4, 'yep, two subscriptions'],
      [1, 'unsubscribe on unmount then'],
      [5, 'testing a fix'],
    ],
  },
  {
    id: 't7',
    title: 'naming the mascot',
    channelId: 'c4',
    authorId: 'u7',
    createdAt: ago(30 * HOUR),
    lastActivity: ago(1 * DAY),
    position: { x: 220, y: 520 },
    size: 'small',
    replies: [
      [6, 'scatter? too on the nose'],
      [2, 'lorem ipsum dolor'],
      [6, 'ok noted'],
    ],
  },
  {
    id: 't8',
    title: "what's everyone building this weekend",
    channelId: 'c4',
    authorId: 'u1',
    createdAt: ago(3 * DAY),
    lastActivity: ago(1 * DAY),
    position: { x: 450, y: 500 },
    size: 'medium',
    replies: [
      [0, 'finishing the parser finally'],
      [2, 'a small game jam thing'],
      [4, 'sleeping'],
      [6, 'lorem ipsum dolor sit'],
      [0, 'valid'],
      [2, 'post screenshots'],
      [4, 'of sleeping?'],
      [6, 'yes'],
      [0, 'consectetur adipiscing'],
      [2, 'ill post monday'],
      [4, 'looking forward to it'],
    ],
  },
  {
    id: 't9',
    title: 'server icon meme thread',
    channelId: 'c4',
    description: 'Dump the worst ones here. No curation, no taste, no mercy.',
    authorId: 'u3',
    createdAt: ago(5 * DAY),
    lastActivity: ago(2 * DAY),
    position: { x: 680, y: 460 },
    size: 'large',
    images: [
      'https://picsum.photos/seed/meme1/200',
      'https://picsum.photos/seed/meme2/200',
      'https://picsum.photos/seed/meme3/200',
      'https://picsum.photos/seed/meme4/200',
      'https://picsum.photos/seed/meme5/200',
      'https://picsum.photos/seed/meme6/200',
    ],
    replies: [
      [3, 'starting strong'],
      [0, 'thats awful'],
      [1, 'thats the point'],
      [5, 'lorem ipsum dolor sit amet'],
      [3, 'no notes'],
      [0, 'delete this'],
      [1, 'never'],
      [5, 'consectetur adipiscing elit'],
      [3, 'round two'],
      [0, 'worse somehow'],
      [1, 'improving'],
      [5, 'sed do eiusmod'],
      [3, 'the gradient one wins'],
      [0, 'it really does'],
      [1, 'tempor incididunt ut labore'],
      [5, 'nominating it for the actual icon'],
      [3, 'absolutely not'],
      [0, 'democracy'],
      [1, 'this is not a democracy'],
      [5, 'et dolore magna aliqua'],
      [3, 'closing nominations'],
      [0, 'rigged'],
    ],
  },
];

export const mockThreads: Thread[] = threadSeeds.map(toThread);

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
