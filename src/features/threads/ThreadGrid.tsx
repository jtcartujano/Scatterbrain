import { useCallback, useEffect, useRef, useState } from 'react';
import type { Thread } from '../../lib/mockData';
import { useLenis } from '../../hooks/useLenis';
import { ThreadCard } from './ThreadCard';
import { ScrollIndicator } from './ScrollIndicator';
import { syncScrollIndicator } from './scrollGeometry';
import { ThreadEmptyState } from './ThreadEmptyState';
import { THREAD_GRID, sortForGrid } from './gridLayout';

interface ThreadGridProps {
  threads: Thread[];
  onThreadClick: (threadId: string) => void;
  /** The thread the preview panel is showing, if any. */
  previewThreadId?: string | null;
  /** Set by `ChannelView`. The grid takes its height in one frame and slides. */
  height?: number;
}

/**
 * The alternative to the thread canvas: the same threads as rect cards in four
 * columns, for scanning a channel in order rather than roaming it spatially.
 *
 * It gets **none** of the plane machinery — no fixed logical plane, no zoom-out
 * under the preview panel, no scale floor, no tether, no dot grid. The panel
 * shortens the region and the grid simply has less room and scrolls. That is the
 * whole difference between this and the canvas structurally; the rest is the card.
 *
 * What it does share is the frame: the same outer geometry, the same hidden
 * native scrollbar with the same drawn indicator in its place, and the same
 * element-scoped Lenis. Two views of one region should scroll the same way.
 */
export function ThreadGrid({
  threads,
  onThreadClick,
  previewThreadId = null,
  height,
}: ThreadGridProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useLenis(frameRef, gridRef);

  /**
   * One number describes the whole layout: the columns are equal fractions of it,
   * so the previewed card's footprint — and therefore its lift — falls out of this
   * without measuring any card. Held in state rather than written to the DOM
   * because, unlike the indicator, a card reads it during render.
   */
  const [gridWidth, setGridWidth] = useState(0);

  const sync = useCallback(() => {
    const frame = frameRef.current;
    if (frame) syncScrollIndicator(frame, indicatorRef.current);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const grid = gridRef.current;
    if (!frame) return;

    frame.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(() => {
      if (grid) setGridWidth(grid.clientWidth);
      sync();
    });
    observer.observe(frame);
    // The grid's own height is what the frame scrolls against, and it changes
    // without the frame changing whenever a row is added or a title rewraps.
    if (grid) observer.observe(grid);

    return () => {
      frame.removeEventListener('scroll', sync);
      observer.disconnect();
    };
  }, [sync]);

  // The panel opening shortens the frame in one step, which changes what overflows
  // before any resize is observed on the elements above.
  useEffect(sync, [sync, height, previewThreadId, threads]);

  const sorted = sortForGrid(threads);

  return (
    // The outer box does not scroll, so the indicator can be pinned to the
    // viewport — an absolutely-positioned child of a scroll container scrolls away
    // with the content, which is the opposite of what an overlay wants.
    <div className="relative flex-none" style={{ height: height ? `${height}px` : undefined }}>
      {/*
        The 16px inset is padding *inside* the scroller rather than a margin
        outside it, which is the one place this frame deliberately differs from the
        canvas's. The previewed card grows 5px past its slot and casts a raised
        shadow well beyond that; with the cards flush to an `overflow: auto` edge
        both would be sheared off along the first column and the top row. Padding
        puts the clipping boundary 16px away from anything that can grow into it,
        and the inset from the region is the same 16 either way.
      */}
      <div
        ref={frameRef}
        className="no-scrollbar absolute inset-0 overflow-auto"
        style={{ backgroundColor: 'var(--color-void)', padding: 'var(--space-4)' }}
      >
        {sorted.length === 0 ? (
          <ThreadEmptyState />
        ) : (
          <div
            ref={gridRef}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${THREAD_GRID.columns}, minmax(0, 1fr))`,
              gridAutoRows: `${THREAD_GRID.rowHeight}px`,
              // Back-fills the holes a two-wide card leaves behind it, so the rows
              // stay full rather than gappy wherever a `large` thread lands.
              gridAutoFlow: 'dense',
              gap: `${THREAD_GRID.gutter}px`,
              // Four columns at every width. Under the floor the region scrolls
              // sideways, as the canvas plane does, rather than dropping columns.
              minWidth: `${THREAD_GRID.minWidth}px`,
            }}
          >
            {sorted.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onClick={onThreadClick}
                isPreviewed={thread.id === previewThreadId}
                isDimmed={previewThreadId !== null && thread.id !== previewThreadId}
                gridWidth={gridWidth}
              />
            ))}
          </div>
        )}
      </div>

      <ScrollIndicator ref={indicatorRef} />
    </div>
  );
}
