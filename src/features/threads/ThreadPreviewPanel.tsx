import { useEffect } from 'react';
import type { Channel, Thread } from '../../lib/mockData';
import { ImageGrid } from './ImageGrid';
import { formatTimestamp } from './formatTimestamp';

interface ThreadPreviewPanelProps {
  thread: Thread;
  channel: Channel;
  /** False while the panel is still mounted but collapsing shut. */
  open: boolean;
  onDismiss: () => void;
}

const AVATARS_SHOWN = 5;
const NAMES_SHOWN = 3;

/**
 * The peek half of click-once-to-preview / click-again-to-open.
 *
 * Occupies the top half of the main content region; the canvas stays live and
 * scrollable below, so the clicked bubble remains visible and a second click on
 * it enters the thread. That means this panel deliberately has **no open
 * affordance of its own** — adding one would give the pattern two doors.
 *
 * It is chrome, not a thread node: conventional rounded rect, no rotation, no
 * blob radius, no shadow. Only thread nodes cast shadows.
 *
 * This and the open thread view are the only places a description is ever seen.
 *
 * Sizing and inset are content-driven with neither cap nor margin of its own —
 * the animating row in `ChannelView` owns both. A percentage max-height here
 * would resolve against a grid area this element is itself sizing, and the row
 * has to measure the inset to animate to the right height.
 */
export function ThreadPreviewPanel({
  thread,
  channel,
  open,
  onDismiss,
}: ThreadPreviewPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onDismiss]);

  const images = thread.images ?? [];
  const hasImages = images.length > 0;

  // Channel, then state. All Mist, no colour and no dot: Spark on chrome already
  // means selected, and the panel is the one surface that's definitionally
  // selected already. The word does the work instead of a second coloured mark.
  // Honest because unread clears on opening a thread in full, not on previewing it.
  const kicker = [
    `#${channel.name}`,
    thread.isPinned ? 'pinned' : null,
    thread.isUnread ? 'unread' : null,
  ].filter(Boolean);

  // Author names are user content, so they stay lowercase.
  const names = thread.participants.slice(0, NAMES_SHOWN).map((p) => p.name).join(', ');
  const unnamed = thread.participants.length - NAMES_SHOWN;

  return (
    <section
      className="relative flex items-start"
      style={{
        gap: 'var(--space-6)',
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 'var(--space-3)' }}>
        <div
          className="flex items-center"
          style={{
            gap: 'var(--space-1-5)',
            paddingRight: 'var(--space-6)',
            fontSize: 'var(--text-md)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
          }}
        >
          {kicker.map((part, index) => (
            <span key={part} className="flex items-center" style={{ gap: 'var(--space-1-5)' }}>
              {index > 0 && <span>·</span>}
              <span>{part}</span>
            </span>
          ))}
        </div>

        <h2
          style={{
            margin: 0,
            paddingRight: 'var(--space-6)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-semibold)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--color-ink)',
            textWrap: 'pretty',
          }}
        >
          {thread.title}
        </h2>

        {thread.description && (
          <p
            style={{
              margin: 0,
              maxWidth: '58ch',
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--leading-relaxed)',
              color: 'var(--color-mist)',
              textWrap: 'pretty',
            }}
          >
            {thread.description}
          </p>
        )}

        {thread.participants.length > 0 && (
          <div className="flex min-w-0 items-center" style={{ gap: 'var(--space-2-5)' }}>
            <div className="flex shrink-0 items-center">
              {thread.participants.slice(0, AVATARS_SHOWN).map((participant, index) => (
                <div
                  key={participant.id}
                  className="rounded-full border-2"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: participant.color,
                    borderColor: 'var(--color-surface)',
                    marginLeft: index > 0 ? '-8px' : '0',
                    zIndex: thread.participants.length - index,
                  }}
                />
              ))}
              {thread.participants.length > AVATARS_SHOWN && (
                <div
                  className="flex items-center justify-center rounded-full border-2 font-semibold"
                  style={{
                    width: '24px',
                    height: '24px',
                    marginLeft: '-8px',
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'var(--fill-mist)',
                    borderColor: 'var(--color-surface)',
                    color: 'var(--color-ink)',
                  }}
                >
                  +{thread.participants.length - AVATARS_SHOWN}
                </div>
              )}
            </div>

            <span
              className="truncate"
              style={{
                fontSize: 'var(--text-base-plus)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-ink)',
                opacity: 0.86,
              }}
            >
              {names}
              {unnamed > 0 && (
                <span style={{ color: 'var(--color-mist)' }}> +{unnamed} more</span>
              )}
            </span>
          </div>
        )}

        <span
          className="flex items-center"
          style={{
            gap: 'var(--space-1-5)',
            fontSize: 'var(--text-md)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
          }}
        >
          <span>{thread.replyCount} replies</span>
          <span>•</span>
          <span>{formatTimestamp(thread.lastActivity)}</span>
          {/* No image count here — the grid's own label carries it. */}
        </span>
      </div>

      {hasImages && <ImageGrid images={images} />}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss preview"
        className="absolute cursor-pointer leading-none"
        style={{
          top: 'var(--space-4)',
          right: 'var(--space-4)',
          padding: 'var(--space-1)',
          fontSize: 'var(--text-xl)',
          color: 'var(--color-mist)',
          borderRadius: 'var(--radius-md)',
          transition: 'var(--transition-colors)',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.color = 'var(--color-ink)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.color = 'var(--color-mist)';
        }}
      >
        ×
      </button>
    </section>
  );
}
