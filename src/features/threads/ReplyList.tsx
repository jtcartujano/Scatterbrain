import type { Message, User } from '../../lib/mockData';
import { formatAge } from './formatTimestamp';
import { GroupedReply, InlineReply } from './ReplyRow';

interface ReplyListProps {
  messages: Message[];
  /** The thread's participants — derived, so everyone who speaks is in here. */
  participants: User[];
  /** `density === 'compact'`. Picks the row, and nothing else on this screen. */
  compact: boolean;
  /**
   * The last reply already seen when the thread was opened. The `new` divider is
   * drawn directly after it. Null once there is nothing unread.
   */
  dividerAfterId: string | null;
}

/**
 * The replies, in one of two layouts.
 *
 * **One list with two row components, not two lists.** Everything around the row
 * — the divider, the list's spacing rhythm, the frame it scrolls in — is
 * identical either way; only the row changes. That is the same relationship
 * `ChannelView` already has with the canvas and the grid, where the region owns
 * everything and the setting picks only what fills the slot.
 */
export function ReplyList({
  messages,
  participants,
  compact,
  dividerAfterId,
}: ReplyListProps) {
  // Built once rather than a `find` per row. The bubble's redundant re-lookup was
  // removed in 2.3 for the same reason.
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const Reply = compact ? InlineReply : GroupedReply;

  return (
    <div
      className="flex flex-col"
      style={{ gap: compact ? 0 : 'var(--space-2-5)' }}
    >
      {messages.map((message) => (
        <div key={message.id} className="contents">
          <Reply
            message={message}
            author={byId.get(message.authorId)}
            time={formatAge(message.timestamp)}
          />
          {message.id === dividerAfterId && <UnreadDivider />}
        </div>
      ))}
    </div>
  );
}

/**
 * Where the replies already seen stop and the new ones begin.
 *
 * Signal, because it is the only accent that means "there is something new here"
 * — and this is the one place in the list that carries colour at all.
 *
 * It **stays where it is** while you read, rather than retreating ahead of the
 * scroll: a marker that moves while you are looking at it is not a marker. The
 * thread's unread flag clears the moment it is opened, so the position is
 * captured on entry and the divider outlives the state that produced it.
 */
function UnreadDivider() {
  return (
    <div
      className="flex items-center"
      style={{ gap: 'var(--space-2-5)', padding: 'var(--space-2-5) 0 var(--space-2)' }}
    >
      <span
        style={{
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-signal)',
        }}
      >
        new
      </span>
      <span className="h-px flex-1" style={{ backgroundColor: 'var(--ring-signal)' }} />
    </div>
  );
}
