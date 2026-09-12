import type { Ref } from 'react';

interface ScrollIndicatorProps {
  ref: Ref<HTMLDivElement>;
}

/**
 * The 3px Mist bar that stands in for the native scrollbar, on both thread views.
 *
 * The rule it exists for: the native bar is never hidden (`.no-scrollbar`) without
 * something taking its place, or nothing tells you the content continues. Two
 * views of one region also scroll the same way, so the canvas and the grid share
 * this rather than each picking an answer.
 *
 * Belongs to the *outer*, non-scrolling box — an absolutely-positioned child of a
 * scroll container scrolls away with the content, which is the opposite of what an
 * overlay wants. Its geometry is written to the element by `syncScrollIndicator`.
 */
export function ScrollIndicator({ ref }: ScrollIndicatorProps) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="scroll-indicator pointer-events-none absolute right-1.25 w-0.75 rounded-full"
      style={{ top: 0, height: 0, opacity: 0, backgroundColor: 'var(--color-mist)' }}
    />
  );
}
