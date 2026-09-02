import { useCallback, useEffect, useRef, useState } from 'react';
import type { Thread } from '../../lib/mockData';
import { mockUsers } from '../../lib/mockData';
import { THREAD_SIZES, getStatusDotOffset, getThreadAppearance } from './threadLayout';
import { ImageFan } from './ImageFan';
import { formatTimestamp } from './formatTimestamp';

interface ThreadBubbleProps {
  thread: Thread;
  onClick: (threadId: string) => void;
  /** The node the preview panel is currently showing. */
  isPreviewed?: boolean;
  /** Every other node, while a preview is open. */
  isDimmed?: boolean;
}

/** How long the node stays pressed past rest as the second click commits. */
const PRESS_DURATION = 130;

export function ThreadBubble({
  thread,
  onClick,
  isPreviewed = false,
  isDimmed = false,
}: ThreadBubbleProps) {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(pressTimer.current), []);

  // The second click on a held node is the one that opens the thread, and until
  // the thread view exists it has nothing else to show for itself. The lift
  // returning past rest reads as the commit without adding a new gesture.
  const handleClick = useCallback(() => {
    if (isPreviewed) {
      setIsPressed(true);
      window.clearTimeout(pressTimer.current);
      pressTimer.current = window.setTimeout(() => setIsPressed(false), PRESS_DURATION);
    }
    onClick(thread.id);
  }, [isPreviewed, onClick, thread.id]);

  const footprint = THREAD_SIZES[thread.size];
  // Tilt and blob radius are derived from the thread id, not stored on it.
  const { rotation, borderRadius, corners } = getThreadAppearance(thread.id);
  // ...and so, from the same corners, is where the status dot sits on the edge.
  const dotOffset = getStatusDotOffset(corners);
  const images = thread.images ?? [];
  const hasImages = images.length > 0;

  // A bubble never carries more than one outset ring. Pinned and unread win when
  // present; the achromatic held ring only fills in for a node that has neither,
  // so the previewed state never stacks a second stroke on top of a state one.
  const stateStrokes = thread.isPinned
    ? 'var(--ring-pinned-strokes)'
    : thread.isUnread
      ? 'var(--ring-unread-strokes)'
      : null;

  const restingShadow = thread.isPinned
    ? 'var(--ring-pinned)'
    : thread.isUnread
      ? 'var(--ring-unread)'
      : 'var(--shadow-bubble)';

  return (
    <button
      data-thread-id={thread.id}
      onClick={handleClick}
      className="absolute cursor-pointer hover:scale-105"
      style={{
        left: `${thread.position.x}px`,
        top: `${thread.position.y}px`,
        // Rotation stays in `transform` and the lift in `scale`, so the two never
        // clobber each other. Inline `scale` also outranks the hover class, which
        // is the point: a held node is hover that didn't let go, not one that
        // grows again under the pointer.
        transform: `rotate(${rotation}deg)`,
        scale: isPressed
          ? 'var(--press-scale)'
          : isPreviewed
            ? 'var(--hover-lift-scale)'
            : undefined,
        opacity: isDimmed ? 'var(--opacity-deselected)' : undefined,
        zIndex: isPreviewed ? 2 : undefined,
        transition: `transform var(--duration-expand) var(--ease-soft),
                     scale var(--duration-expand) var(--ease-soft),
                     box-shadow var(--duration-expand) var(--ease-soft),
                     opacity var(--duration-base) linear`,
      }}
    >
      <div
        className="relative flex flex-col items-center justify-center text-center gap-2"
        style={{
          width: `${footprint.width}px`,
          minHeight: `${footprint.minHeight}px`,
          padding: `${footprint.padding}px`,
          backgroundColor: 'var(--color-surface)',
          borderRadius,
          border: '1px solid var(--border-subtle)',
          boxShadow: isPreviewed
            ? `${stateStrokes ?? 'var(--ring-held)'}, var(--shadow-bubble-lifted)`
            : restingShadow,
        }}
      >
        {/* Held fill — its own layer so it can crossfade. A background-image swap
            can't animate to `none`, and the fill has to sit *over* Surface. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius,
            backgroundColor: 'var(--fill-subtle)',
            opacity: isPreviewed ? 1 : 0,
            transition: 'opacity var(--duration-base) linear',
          }}
        />

        {/* Status dot — sits on the blob's own top-right curve, so it moves with
            the silhouette instead of anchoring to a bounding-box corner the shape
            never reaches. */}
        {(thread.isPinned || thread.isUnread) && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              top: dotOffset.top,
              right: dotOffset.right,
              backgroundColor: thread.isPinned ? 'var(--color-spark)' : 'var(--color-signal)',
              boxShadow: `0 0 0 3px var(--color-surface)`,
            }}
          />
        )}

        {/* 1. Thread Title */}
        <h3
          className="relative font-semibold line-clamp-2"
          style={{
            fontSize: thread.size === 'small' ? '11.5px' : thread.size === 'medium' ? '13px' : '14.5px',
            color: 'var(--color-ink)',
            lineHeight: '1.4',
          }}
        >
          {thread.title}
        </h3>

        {/* 2. Image fan (when the thread has images) — falls back to participant avatars */}
        {hasImages ? (
          <div className="relative">
            <ImageFan images={images} size={thread.size} />
          </div>
        ) : (
          <div className="relative flex items-center">
            {thread.participants.slice(0, 3).map((participant, index) => {
              const user = mockUsers.find((u) => u.id === participant.id) || participant;
              return (
                <div
                  key={participant.id}
                  className="rounded-full border-2"
                  style={{
                    width: thread.size === 'small' ? '15px' : '18px',
                    height: thread.size === 'small' ? '15px' : '18px',
                    backgroundColor: user.color,
                    borderColor: 'var(--color-surface)',
                    marginLeft: index > 0 ? '-6px' : '0',
                  }}
                />
              );
            })}
            {thread.participants.length > 3 && (
              <div
                className="rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
                style={{
                  width: thread.size === 'small' ? '15px' : '18px',
                  height: thread.size === 'small' ? '15px' : '18px',
                  backgroundColor: 'var(--fill-mist)',
                  borderColor: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  marginLeft: '-6px',
                }}
              >
                +{thread.participants.length - 3}
              </div>
            )}
          </div>
        )}

        {/* 3. Metadata — replies, last activity, and (optionally) image count */}
        <div
          className="relative flex items-center gap-1.5"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
            opacity: 0.7,
          }}
        >
          <span>{thread.replyCount} replies</span>
          <span>•</span>
          <span>{formatTimestamp(thread.lastActivity)}</span>
          {hasImages && (
            <>
              <span>•</span>
              <span>{images.length} images</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
