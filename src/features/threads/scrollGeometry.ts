/** Short enough to stay out of the way, long enough to be a grabbable-looking mark. */
const INDICATOR_MIN = 28;

/**
 * Places the drawn scrollbar from a scroll container's current position.
 *
 * Written straight to the element rather than held in state: this runs on every
 * scroll frame, and a `setState` per frame would be a re-render per frame. The
 * element is hidden outright whenever the container doesn't overflow, so the only
 * thing it can ever say is "there is more here" — which is exactly what the native
 * bar it replaced said.
 *
 * Split from `ScrollIndicator.tsx` for `react/only-export-components`, and named
 * for the geometry rather than the component because a `scrollIndicator.ts` beside
 * `ScrollIndicator.tsx` is the same file on a case-insensitive filesystem.
 */
export function syncScrollIndicator(frame: HTMLElement, indicator: HTMLElement | null) {
  if (!indicator) return;

  const scrollable = frame.scrollHeight - frame.clientHeight;
  if (scrollable <= 1) {
    indicator.style.opacity = '0';
    return;
  }

  const size = Math.max(
    INDICATOR_MIN,
    frame.clientHeight * (frame.clientHeight / frame.scrollHeight),
  );
  indicator.style.height = `${size}px`;
  indicator.style.top = `${(frame.scrollTop / scrollable) * (frame.clientHeight - size)}px`;
  indicator.style.opacity = '0.28';
}
