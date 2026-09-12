import type { Thread } from '../../lib/mockData';

/**
 * The grid view's geometry, as `threadLayout.ts` is the canvas plane's — and
 * named for what it holds rather than after `ThreadGrid.tsx`, which on a
 * case-insensitive filesystem would be the same file.
 *
 * Nothing here is shared with the canvas on purpose: the grid gets none of the
 * plane machinery — no fixed logical plane, no zoom, no scale floor, no dot grid.
 * A card is laid out by the browser's grid algorithm, not placed at a stored
 * coordinate, so `position` is simply unused in this view.
 */
export const THREAD_GRID = {
  /** Four at every width. The column floats; the count does not. */
  columns: 4,
  rowHeight: 116,
  gutter: 16,
  /**
   * Below this the region scrolls sideways rather than dropping to fewer
   * columns — the same call the canvas makes about its plane. Both side columns
   * open puts a window under roughly 1300px past this floor.
   */
  minWidth: 660,
} as const;

/**
 * How far the previewed card grows, in pixels, whatever slot it occupies.
 *
 * Deliberately not a percentage: at 1.05 a 2×2 card gains ~25px where a 1×1
 * gains ~10, and the big card stops reading as *risen* and starts reading as
 * shoving its row. A constant growth means every card rises the same amount,
 * 5px into a 16px gutter on each side, so nothing ever touches a neighbour.
 */
export const PREVIEW_LIFT = { x: 10, y: 6 } as const;

export type GridSlot = {
  columnSpan: number;
  rowSpan: number;
  /** Steps with the slot; the face is otherwise identical at every size. */
  titleSize: string;
};

/**
 * Pinned first, then most recent activity.
 *
 * Unread is deliberately *not* sorted up: it is a state, and its ring finds it
 * wherever it lands. There is no section header above the pinned row either —
 * the ring says it, and a label would turn the first row into a rail.
 */
export function sortForGrid(threads: Thread[]): Thread[] {
  return [...threads].sort(
    (a, b) =>
      Number(b.isPinned ?? false) - Number(a.isPinned ?? false) ||
      b.lastActivity.getTime() - a.lastActivity.getTime(),
  );
}

/**
 * The persisted `size` survives into the grid, but expressed as a footprint in
 * slots rather than a bubble's pixel dimensions: `large` spans two columns and
 * the pinned large thread takes 2×2. Medium and small are both 1×1 — in this
 * view `size` is effectively "large or not", which is the hierarchy a grid can
 * carry without becoming a list.
 */
export function getGridSlot(thread: Thread): GridSlot {
  if (thread.size === 'large') {
    return thread.isPinned
      ? { columnSpan: 2, rowSpan: 2, titleSize: 'var(--text-xl-plus)' }
      : { columnSpan: 2, rowSpan: 1, titleSize: 'var(--text-lg-plus)' };
  }
  return { columnSpan: 1, rowSpan: 1, titleSize: 'var(--text-base-plus)' };
}

/**
 * The previewed card's non-uniform scale, derived rather than measured.
 *
 * One observation of the grid element's width gives every card's footprint —
 * the columns are equal fractions of it — so there is no need to measure the
 * previewed card itself, and nothing to re-measure when the preview moves.
 *
 * Returns 1,1 before the grid has been measured, so the first paint is at rest
 * rather than at some arbitrary scale.
 */
export function getPreviewLift(gridWidth: number, slot: GridSlot) {
  const { columns, gutter, rowHeight } = THREAD_GRID;
  const columnWidth = (gridWidth - (columns - 1) * gutter) / columns;
  if (columnWidth <= 0) return { scaleX: 1, scaleY: 1 };

  const width = columnWidth * slot.columnSpan + gutter * (slot.columnSpan - 1);
  const height = rowHeight * slot.rowSpan + gutter * (slot.rowSpan - 1);

  return {
    scaleX: (width + PREVIEW_LIFT.x) / width,
    scaleY: (height + PREVIEW_LIFT.y) / height,
  };
}
