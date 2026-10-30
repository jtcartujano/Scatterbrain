import { useCallback, useEffect, useRef } from 'react';
import type { Channel, Thread } from '../../lib/mockData';
import { useSettings } from '../../hooks/useSettings';
import { useLenis } from '../../hooks/useLenis';
import { ReplyList } from './ReplyList';
import { ThreadComposer } from './ThreadComposer';
import { ScrollIndicator } from './ScrollIndicator';
import { syncScrollIndicator } from './scrollGeometry';
import { formatTimestamp } from './formatTimestamp';

interface ThreadDetailViewProps {
  thread: Thread;
  channel: Channel;
  /**
   * The reply the `new` divider sits after, captured by `App` at the moment of
   * opening. It cannot be derived here: opening the thread clears its unread
   * flag in the same render batch, so by the first paint there is nothing left
   * to derive it from.
   */
  dividerAfterId: string | null;
  /** Up to the channel. Always the channel — see the note on the back bar. */
  onBack: () => void;
  onSendReply: (content: string) => void;
}

/** Matches the channel header's box, so the region's top edge doesn't move. */
const BAR_HEIGHT = 57;

const HEADER_TILE = 96;

/**
 * A thread, open. The destination of the preview panel's click, and the first
 * genuinely functional messaging in the app.
 *
 * It **replaces the channel region** — the rail and the info panel persist, so
 * this renders into `MainLayout`'s `main` slot in place of `ChannelView`.
 *
 * The thread header scrolls away with the list rather than pinning under the
 * bar. A 140-character description runs three lines, so pinning would spend
 * ~120px permanently on something read once, against a house rhythm of 13px rows
 * and 4px padding. Held for judgement against the running app.
 */
export function ThreadDetailView({
  thread,
  channel,
  dividerAfterId,
  onBack,
  onSendReply,
}: ThreadDetailViewProps) {
  const { compact } = useSettings();
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useLenis(frameRef, contentRef);

  const sync = useCallback(() => {
    const frame = frameRef.current;
    if (frame) syncScrollIndicator(frame, indicatorRef.current);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame) return;

    frame.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    // The list grows as replies are sent, without the frame changing at all.
    if (content) observer.observe(content);

    return () => {
      frame.removeEventListener('scroll', sync);
      observer.disconnect();
    };
  }, [sync]);

  // Esc leaves, matching the preview panel, where it already means "back out one
  // level". The same shape of handler, deliberately.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const images = thread.images ?? [];
  const kicker = [thread.isPinned ? 'pinned' : null].filter(Boolean);

  return (
    <>
      {/*
        The arrow outlives the problem it solves. When routing lands the browser's
        own back button starts working, and this still stays: back means "wherever
        you came from", which might be another thread or a fresh tab where it does
        nothing. This means *up to the channel this thread is in* — a fixed
        destination, always right. So it navigates to the channel explicitly and
        never to history.
      */}
      <div
        className="flex shrink-0 items-center border-b px-6"
        style={{
          height: `${BAR_HEIGHT}px`,
          backgroundColor: 'var(--color-void)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${channel.name}`}
          className="back-link flex cursor-pointer items-center"
          style={{
            gap: 'var(--space-1-5)',
            fontSize: 'var(--text-md)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
            transition: 'var(--transition-colors)',
          }}
        >
          <span style={{ fontSize: 'var(--text-lg)', lineHeight: 1 }}>&larr;</span>
          <span>#{channel.name}</span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={frameRef} className="no-scrollbar flex-1 overflow-auto">
          {/*
            Fills the region rather than sitting in a fixed column.

            It was capped at 660px, which matched the region almost exactly at the
            width the design was drawn at and so looked deliberate there. On a wide
            window it is barely half the space, pinned left, and reads as a layout
            that failed rather than one that chose — especially against the canvas,
            the grid and the preview panel, every one of which fills the region.

            Line length is held where it belongs instead: on the prose. The
            description keeps its own measure and so does a reply's text, so
            nothing here runs to 180 characters just because the window is wide.
          */}
          <div
            ref={contentRef}
            className="flex flex-col"
            style={{ padding: '0 var(--space-6)' }}
          >
            <header
              className="flex flex-col"
              style={{ gap: 'var(--space-3)', paddingTop: 'var(--space-5)' }}
            >
              {kicker.length > 0 && (
                <span
                  style={{
                    fontSize: 'var(--text-md)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-mist)',
                  }}
                >
                  {kicker.join(' · ')}
                </span>
              )}

              <h1
                style={{
                  margin: 0,
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-semibold)',
                  lineHeight: 'var(--leading-tight)',
                  color: 'var(--color-ink)',
                  textWrap: 'pretty',
                }}
              >
                {thread.title}
              </h1>

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

              {/*
                Author and creation time. Rejected for the preview panel, where a
                peek is about deciding whether to enter; this is the view where
                they earn their place. The placement was settled at the time:
                one mono line under the title.
              */}
              <span
                style={{
                  fontSize: 'var(--text-md)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-mist)',
                }}
              >
                {thread.participants[0]?.name} · {formatTimestamp(thread.createdAt)}
              </span>

              {/*
                Fourth treatment of the same crops, and the sizes encode distance:
                the canvas fans them at 32–48px as a hint, the preview panel grids
                them at 60px as a peek, the grid card indexes them at 24px. Here
                they are 96px and all of them show, because this is where you
                actually look. No `+N` — there is nothing further to open.
              */}
              {images.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 'var(--space-2)' }}>
                  {images.map((src) => (
                    <div
                      key={src}
                      role="img"
                      aria-label="Thread image"
                      className="shrink-0 bg-cover bg-center"
                      style={{
                        width: `${HEADER_TILE}px`,
                        height: `${HEADER_TILE}px`,
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        backgroundImage: `url(${src})`,
                      }}
                    />
                  ))}
                </div>
              )}
            </header>

            {/*
              The reply count, relocated from the thread's metadata to the list's
              heading — above the replies it counts, it labels them.
            */}
            <div
              className="border-b"
              style={{
                margin: 'var(--space-5) 0 var(--space-2)',
                paddingBottom: 'var(--space-2)',
                fontSize: 'var(--text-md)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-mist)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
            </div>

            {thread.messages.length === 0 ? (
              <EmptyThread />
            ) : (
              <ReplyList
                messages={thread.messages}
                participants={thread.participants}
                compact={compact}
                dividerAfterId={dividerAfterId}
              />
            )}

            <div style={{ height: 'var(--space-4)' }} />
          </div>
        </div>

        <ScrollIndicator ref={indicatorRef} />
      </div>

      <ThreadComposer onSend={onSendReply} />
    </>
  );
}

/**
 * A thread nobody has answered yet.
 *
 * Not an error and not an empty screen: a thread's root post *is* its title plus
 * optional description, so this is the complete thread. Two lines, Ink over Mist,
 * no glyph and no button — matching the channel empty state, and because the
 * composer directly below is already the call to action.
 */
function EmptyThread() {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ gap: 'var(--space-1)', padding: 'var(--space-6) 0' }}
    >
      <span
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-ink)',
        }}
      >
        No replies yet
      </span>
      <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-mist)' }}>
        The first reply starts the conversation.
      </span>
    </div>
  );
}
