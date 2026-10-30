import type { Message, User } from '../../lib/mockData';
import { AttachmentStrip } from './AttachmentStrip';

interface ReplyProps {
  message: Message;
  /** Resolved from the thread's participants, which are derived and complete. */
  author: User | undefined;
  /** Short relative time — "12m", "2d". The list formats it once for both rows. */
  time: string;
}

/**
 * Width of the author column in the inline layout.
 *
 * Sized off the longest name in the member set at 13px rather than left to the
 * content, because the constant left edge it gives the text is the entire reason
 * the dense layout scans. A shrink-to-fit column would make every row start
 * somewhere different.
 */
const AUTHOR_COLUMN = 128;

const INLINE_TILE = 64;
const GROUPED_TILE = 96;

/**
 * Reading measure for a reply, in characters. Wider than the thread
 * description's 58ch, which is deliberate — a description is a summary and wants
 * to be tight, a reply is the content and wants room.
 */
const TEXT_MEASURE = 80;

/**
 * `Layout: Compact` — one row per reply, author inline with the text.
 *
 * Replies in this product run five or six words, and at one line there is no
 * author header to avoid repeating, which is the only thing a same-author
 * collapse would buy. So every row carries its author: a headless row is harder
 * to scan, not easier.
 */
export function InlineReply({ message, author, time }: ReplyProps) {
  return (
    <div
      className="reply-row flex items-start"
      style={{
        gap: 'var(--space-2-5)',
        padding: 'var(--space-1) var(--space-2)',
        margin: '0 calc(var(--space-2) * -1)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span
        className="flex shrink-0 items-center"
        style={{ width: `${AUTHOR_COLUMN}px`, gap: 'var(--space-2)' }}
      >
        <Disc color={author?.color} size={18} />
        <span
          className="truncate"
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-mist)',
          }}
        >
          {author?.name}
        </span>
      </span>

      <span
        className="flex min-w-0 flex-1 flex-col items-start"
        style={{ gap: 'var(--space-1-5)' }}
      >
        <Body message={message} />
        {message.attachments && (
          <AttachmentStrip attachments={message.attachments} size={INLINE_TILE} />
        )}
      </span>

      <Time time={time} pending={message.pending} />
    </div>
  );
}

/**
 * `Layout: Standard` — an avatar beside a block, author above the text.
 *
 * Half the density of the inline row for the same content, and what that buys is
 * room: a reply that runs to a paragraph gets somewhere to run, the author reads
 * as a speaker rather than a column entry, and attachments sit at full size.
 *
 * Consecutive replies from one author are *not* collapsed. Partly because every
 * seeded thread alternates authors so the rule would never fire, and partly
 * because collapsing here would make the two layouts an unfair comparison —
 * one of them silently doing less.
 */
export function GroupedReply({ message, author, time }: ReplyProps) {
  return (
    <div
      className="reply-row flex items-start"
      style={{
        gap: 'var(--space-2-5)',
        padding: 'var(--space-1-5) var(--space-2)',
        margin: '0 calc(var(--space-2) * -1)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Disc color={author?.color} size={28} />

      <span
        className="flex min-w-0 flex-1 flex-col items-start"
        style={{ gap: 'var(--space-1)' }}
      >
        <span className="flex items-baseline" style={{ gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-ink)',
            }}
          >
            {author?.name}
          </span>
          <Time time={time} pending={message.pending} />
        </span>

        <Body message={message} />
        {message.attachments && (
          <AttachmentStrip attachments={message.attachments} size={GROUPED_TILE} />
        )}
      </span>
    </div>
  );
}

/**
 * The reply text, and the one place the optimistic state shows.
 *
 * A sent-but-unconfirmed reply drops from Ink to Mist. Not a spinner — there are
 * none in this product — and not `--opacity-deselected`, which means "not
 * selected" and would be a second job for one number. Ink→Mist is the system's
 * own hover vocabulary run backwards, and it crossfades back at 150ms.
 */
function Body({ message }: { message: Message }) {
  return (
    <span
      className="reply-body"
      style={{
        // The row fills the region; the *text* is what needs a measure. Without
        // this a long reply would run the full width of a wide window, which no
        // amount of space makes readable. Generous rather than tight, because
        // replies here are five or six words and almost never reach it — this is
        // the safety net for the rare one, not the common case.
        maxWidth: `${TEXT_MEASURE}ch`,
        fontSize: 'var(--text-lg)',
        lineHeight: 'var(--leading-normal)',
        color: message.pending ? 'var(--color-mist)' : 'var(--color-ink)',
        textWrap: 'pretty',
      }}
    >
      {message.content}
    </span>
  );
}

/**
 * Held empty while a reply is pending, because there genuinely is no server time
 * yet. The slot stays so the row doesn't reflow when the real one arrives.
 */
function Time({ time, pending }: { time: string; pending?: boolean }) {
  return (
    <span
      className="shrink-0 tabular-nums"
      style={{
        paddingTop: '3px',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-mist)',
      }}
    >
      {pending ? '' : time}
    </span>
  );
}

/** A participant's flat colour disc. No image, matching every avatar in the app. */
function Disc({ color, size }: { color: string | undefined; size: number }) {
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color ?? 'var(--color-mist)',
      }}
    />
  );
}
