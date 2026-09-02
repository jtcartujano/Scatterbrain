import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Channel, Thread } from '../../lib/mockData';
import { ChannelHeader } from './ChannelHeader';
import { ThreadCanvas } from '../threads/ThreadCanvas';
import { ThreadPreviewPanel } from '../threads/ThreadPreviewPanel';

interface ChannelViewProps {
  channel: Channel;
  threads: Thread[];
}

/** --duration-expand. Matched here so the panel can outlive its own collapse. */
const EXPAND_DURATION = 240;

/** The canvas's own `m-4`, top and bottom. */
const CANVAS_MARGIN = 32;

/** Below this the canvas has stopped being a canvas, so the panel gives way instead. */
const CANVAS_MIN = 160;

/**
 * The panel is content-sized under this share of the region — provisional until
 * the open thread view exists and there is real content to judge a preview
 * against. A 140-character description bounds the tallest panel at around 190px,
 * so in practice the cap only engages on short viewports.
 */
const PANEL_CAP = 0.5;

function measure(element: HTMLElement | null): number {
  return element ? element.getBoundingClientRect().height : 0;
}

/**
 * Owns the main content region for a channel: header, optional thread preview,
 * and the canvas. The preview lives here rather than in a `MainLayout` slot so
 * the app shell stays a generic three-slot frame — Friends, DMs and Settings all
 * render into the same slot and have no use for a preview.
 *
 * The region is measured rather than left to flex, because the canvas has to take
 * its new height in a single frame while the panel animates. Left as `flex-1` it
 * would squeeze across the whole 240ms, and a canvas contracting around its own
 * contents reads as the plane zooming out. Here it is a rigid block that the
 * growing panel pushes down — the only thing that travels is the boundary.
 */
export function ChannelView({ channel, threads }: ChannelViewProps) {
  const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);
  // Lags `previewThreadId` by one collapse, so the panel's contents survive the
  // close instead of vanishing the instant the row starts shutting.
  const [displayedThreadId, setDisplayedThreadId] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const [regionHeight, setRegionHeight] = useState(0);

  const stackRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const displayedThread = threads.find((thread) => thread.id === displayedThreadId) ?? null;
  const isOpen = previewThreadId !== null;

  // The cap is applied here rather than as a CSS `max-height` so the row and the
  // canvas are sized from one number. Left to CSS they could disagree, and the
  // difference would show as a gap under the canvas.
  const rowHeight = isOpen ? Math.min(panelHeight, regionHeight * PANEL_CAP) : 0;
  const canvasHeight = Math.max(CANVAS_MIN, regionHeight - rowHeight - CANVAS_MARGIN);

  // A preview belongs to the channel it was opened in.
  useEffect(() => {
    setPreviewThreadId(null);
  }, [channel.id]);

  useEffect(() => {
    if (previewThreadId) {
      setDisplayedThreadId(previewThreadId);
      return;
    }
    const timer = window.setTimeout(() => setDisplayedThreadId(null), EXPAND_DURATION);
    return () => window.clearTimeout(timer);
  }, [previewThreadId]);

  // Seeded synchronously so the first paint isn't a CANVAS_MIN stub.
  useLayoutEffect(() => {
    setRegionHeight(measure(stackRef.current));
  }, []);

  useEffect(() => {
    const element = stackRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setRegionHeight(measure(element)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The row animates between explicit pixel heights rather than 0fr → 1fr. Same
  // property, same easing — but `1fr → 1fr` has nothing to interpolate, so
  // switching between two threads of different length would snap. Measured, the
  // open, the close and the swap are each one move.
  useEffect(() => {
    const element = measureRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      setPanelHeight(box ? box.blockSize : measure(entry.target as HTMLElement));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [displayedThreadId]);

  // One click previews. A second click on the *same* bubble opens the thread.
  const handleThreadClick = (threadId: string) => {
    if (previewThreadId === threadId) {
      console.log('Open thread:', threadId);
      // Future: navigate to the open thread view (roadmap 2.4), which is also
      // where unread clears — previewing a thread deliberately does not.
      return;
    }
    setPreviewThreadId(threadId);
  };

  const handleNewThread = () => {
    console.log('New thread clicked');
    // Future: open new thread modal (roadmap 2.5)
  };

  return (
    <>
      <ChannelHeader channel={channel} onNewThread={handleNewThread} />

      <div ref={stackRef} className="flex min-h-0 flex-1 flex-col">
        <div
          className="preview-row grid shrink-0"
          style={{
            gridTemplateRows: `${rowHeight}px`,
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="min-h-0 overflow-hidden" inert={!isOpen}>
            <div
              ref={measureRef}
              className="preview-panel"
              style={{
                padding: 'var(--space-4) var(--space-4) 0',
                transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
              }}
            >
              {displayedThread && (
                <ThreadPreviewPanel
                  thread={displayedThread}
                  channel={channel}
                  open={isOpen}
                  onDismiss={() => setPreviewThreadId(null)}
                />
              )}
            </div>
          </div>
        </div>

        <ThreadCanvas
          threads={threads}
          onThreadClick={handleThreadClick}
          previewThreadId={previewThreadId}
          height={canvasHeight}
        />
      </div>
    </>
  );
}
