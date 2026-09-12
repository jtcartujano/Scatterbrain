import type { Thread } from '../../lib/mockData';
import { ParticipantStack } from './ParticipantStack';
import { formatTimestamp } from './formatTimestamp';
import { getGridSlot, getPreviewLift } from './gridLayout';

interface ThreadCardProps {
  thread: Thread;
  onClick: (threadId: string) => void;
  /** The card the preview panel is currently showing. */
  isPreviewed?: boolean;
  /** Every other card, while a preview is open. */
  isDimmed?: boolean;
  /** The grid element's measured width — everything else is derived from it. */
  gridWidth: number;
}

/** Thumbnails on the card face before the count chip takes over. */
const THUMBS_SHOWN = 3;

/**
 * A thread as drawn in the grid view, where the canvas draws it as a blob.
 *
 * The rect is a scoping of the shape language, not an exception to it: the blob
 * is the *canvas node's* signature and earns it on a scattered spatial plane,
 * where a grid exists for the opposite reason — scanning a channel in order — and
 * organic radii plus per-node rotation fight the alignment that is the only thing
 * a grid is for. So the rule is by surface: a blob on the plane, a card in the grid.
 *
 * The face carries what the bubble carries and nothing more — title, participants,
 * the mono metadata row, plus images when there are any. A card has more room than
 * a small bubble, and the room is deliberately not spent: a second lowercase line
 * competes with the title, the author is already the first disc in the stack, and
 * the channel is in the header. Descriptions stay out, as they do everywhere but
 * the preview panel. What changes from the bubble is composition, not contents.
 */
export function ThreadCard({
  thread,
  onClick,
  isPreviewed = false,
  isDimmed = false,
  gridWidth,
}: ThreadCardProps) {
  const slot = getGridSlot(thread);
  const lift = getPreviewLift(gridWidth, slot);
  const images = thread.images ?? [];
  const hasImages = images.length > 0;
  const hiddenImages = images.length - THUMBS_SHOWN;

  // One outset ring per card, exactly as on a bubble — pinned wins over unread.
  // No status dot: a rect reaches its own corners, so a dot there would sit on
  // top of the ring and read as a notch in it, saying the same thing twice.
  const ring = thread.isPinned
    ? 'var(--ring-pinned-strokes)'
    : thread.isUnread
      ? 'var(--ring-unread-strokes)'
      : null;

  // Raised, not lifted: there is no plane here for nine cards to float above, so
  // at rest the grid is flat and the shadow is spent only on the previewed card.
  // A card with no ring gets no achromatic stand-in either — unlike a bubble, the
  // fill and the lift are enough on an aligned surface.
  const shadow = isPreviewed
    ? [ring, 'var(--shadow-bubble-raised)'].filter(Boolean).join(',')
    : (ring ?? undefined);

  const meta = [
    `${thread.replyCount} replies`,
    `• ${formatTimestamp(thread.lastActivity)}`,
    ...(hasImages ? [`• ${images.length} images`] : []),
  ];

  return (
    <button
      data-thread-id={thread.id}
      onClick={() => onClick(thread.id)}
      className="thread-card group relative flex h-full w-full cursor-pointer flex-col justify-between text-left"
      style={{
        gridColumn: `span ${slot.columnSpan}`,
        gridRow: `span ${slot.rowSpan}`,
        padding: 'var(--space-3)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: shadow,
        // A constant 10×6px growth, so a 2×2 rises exactly as far as a 1×1 —
        // 5px into a 16px gutter on each side, never touching a neighbour.
        transform: isPreviewed ? `scale(${lift.scaleX},${lift.scaleY})` : undefined,
        opacity: isDimmed ? 'var(--opacity-deselected)' : undefined,
        zIndex: isPreviewed ? 1 : undefined,
      }}
    >
      {/* Held fill — its own layer so it can crossfade, as on a bubble. Hover
          lands on the same fill and moves nothing: on an aligned grid, movement
          under the pointer is noise. */}
      <div
        aria-hidden="true"
        className="thread-card-fill pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--fill-subtle)',
          // Inline beats both classes, so a previewed card stays filled whether or
          // not the pointer is on it — held is hover that didn't let go.
          opacity: isPreviewed ? 1 : undefined,
        }}
      />

      <div className="relative flex items-start justify-between" style={{ gap: 'var(--space-2)' }}>
        <h3
          className="line-clamp-2 min-w-0 flex-1 font-semibold"
          style={{
            margin: 0,
            fontSize: slot.titleSize,
            lineHeight: 'var(--leading-tight)',
            color: 'var(--color-ink)',
            textWrap: 'pretty',
          }}
        >
          {thread.title}
        </h3>

        {/* A flat gallery rather than the bubble's `ImageFan`: the fan's rotation
            fights the grid's alignment, and putting the images up here leaves the
            avatar stack the bottom-left corner of every card. */}
        {hasImages && (
          <div className="flex shrink-0 items-center" style={{ gap: 'var(--space-1)' }}>
            {images.slice(0, THUMBS_SHOWN).map((src) => (
              <div
                key={src}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--fill-mist)',
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
            {hiddenImages > 0 && (
              <span
                className="inline-flex items-center font-semibold"
                style={{
                  height: '18px',
                  padding: '0 var(--space-1-5)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  backgroundColor: 'var(--fill-chip)',
                  color: 'var(--color-ink)',
                }}
              >
                +{hiddenImages}
              </span>
            )}
          </div>
        )}
      </div>

      {/* A fixed footer, so every card's stack and metadata sit on one line across
          the row whatever the title above them did. */}
      <div
        className="relative flex items-center justify-between"
        style={{ height: '28px', gap: 'var(--space-2)' }}
      >
        <ParticipantStack
          participants={thread.participants}
          size={18}
          overlap={6}
          max={3}
          chipFill="var(--fill-chip)"
        />

        {/* Each part carries its own separator rather than the bubble's standalone
            bullets, so the row wraps cleanly inside a narrow 1×1 card. */}
        <span
          className="flex flex-wrap justify-end text-right"
          style={{
            columnGap: 'var(--space-1-5)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
            opacity: 0.7,
          }}
        >
          {meta.map((part) => (
            <span key={part} className="whitespace-nowrap">
              {part}
            </span>
          ))}
        </span>
      </div>
    </button>
  );
}
