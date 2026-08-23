import { useEffect } from 'react';
import type { Thread } from '../../lib/mockData';
import { ImageFan } from './ImageFan';
import { formatTimestamp } from './formatTimestamp';

interface ThreadPreviewPanelProps {
  thread: Thread;
  onDismiss: () => void;
}

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
 */
export function ThreadPreviewPanel({ thread, onDismiss }: ThreadPreviewPanelProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  const images = thread.images ?? [];

  return (
    <section
      className="relative flex flex-shrink-0 items-start overflow-y-auto"
      style={{
        // Sizes to content up to a cap — the provisional answer while
        // "fixed 50/50 vs content-sized" is still open.
        maxHeight: '50%',
        gap: 'var(--space-6)',
        margin: 'var(--space-4) var(--space-4) 0',
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 'var(--space-3)' }}>
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

        <div className="flex flex-wrap items-center" style={{ gap: 'var(--space-3)' }}>
          {thread.participants.length > 0 && (
            <div className="flex items-center">
              {thread.participants.slice(0, 5).map((participant, index) => (
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
              {thread.participants.length > 5 && (
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
                  +{thread.participants.length - 5}
                </div>
              )}
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
            {images.length > 0 && (
              <>
                <span>•</span>
                <span>{images.length} images</span>
              </>
            )}
          </span>
        </div>
      </div>

      {images.length > 0 && <ImageFan images={images} size="large" />}

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
