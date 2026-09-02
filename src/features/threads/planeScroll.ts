import type Lenis from 'lenis';

/** Breathing room between a nudged node and the edge it was pulled in from. */
const INSET = 24;

/** --duration-plane. Matched here rather than read, so the tween can't desync. */
const DURATION = 300;

type Easing = (t: number) => number;

/**
 * A CSS `cubic-bezier(p1x, p1y, p2x, p2y)` as a function of t.
 *
 * The curve is parametric — x and y are both functions of some u — so evaluating
 * it at a given time means solving x(u) = t first. Newton's method converges in a
 * handful of steps for the shallow curves this product uses.
 */
export function cubicBezierEasing(p1x: number, p1y: number, p2x: number, p2y: number): Easing {
  // Polynomial coefficients from the control points: c = 3·p1, b = 3·(p2 − p1) − c,
  // a = 1 − c − b.
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  return (t) => {
    let u = t;
    for (let i = 0; i < 5; i++) {
      const x = ((ax * u + bx) * u + cx) * u - t;
      const dx = (3 * ax * u + 2 * bx) * u + cx;
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
    }
    return ((ay * u + by) * u + cy) * u;
  };
}

/** --ease-soft. */
const easeSoft = cubicBezierEasing(0.22, 0.8, 0.28, 1);

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Scrolls the canvas frame, over `--duration-plane` on `--ease-soft`.
 *
 * Routed through Lenis when an instance is live: Lenis animates `scrollTop`
 * itself, and a second frame loop writing the same property would fight it. The
 * hand-run tween below is the fallback — deliberately not
 * `scrollTo({ behavior: 'smooth' })`, whose duration the browser owns and varies
 * with distance, because the timing is a design decision.
 *
 * Returns a cancel function, so a second preview can interrupt the first.
 */
export function scrollPlaneTo(
  frame: HTMLElement,
  top: number,
  lenis?: Lenis | null,
): () => void {
  const to = Math.max(0, Math.min(top, frame.scrollHeight - frame.clientHeight));
  const from = frame.scrollTop;
  if (Math.abs(to - from) < 1) return () => {};

  if (prefersReducedMotion()) {
    frame.scrollTop = to;
    return () => {};
  }

  if (lenis) {
    lenis.scrollTo(to, { duration: DURATION / 1000, easing: easeSoft });
    // No cancel: a later scrollTo supersedes this one on its own, and `stop()`
    // would disable the container's scrolling rather than end the animation.
    return () => {};
  }

  let raf = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    frame.scrollTop = from + (to - from) * easeSoft(t);
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/**
 * Brings a node fully inside the canvas viewport — the shortest distance that
 * does it, and nothing at all when it already is.
 *
 * Conditional rather than unconditional, because the plane now zooms out to keep
 * itself visible when the panel shortens the canvas. There is usually nothing
 * left to scroll, and pulling the field on every click on top of that would move
 * it twice for one gesture. This only fires when the scale floor has bound and
 * part of the plane is genuinely cut off.
 *
 * Geometry is in scaled pixels: the plane is transformed, which layout doesn't
 * see, so the node's own offsets have to be multiplied through.
 */
export function nudgeIntoView(
  frame: HTMLElement,
  node: HTMLElement,
  scale: number,
  lenis?: Lenis | null,
): () => void {
  const top = node.offsetTop * scale;
  const bottom = top + node.offsetHeight * scale;
  const viewTop = frame.scrollTop;
  const viewBottom = viewTop + frame.clientHeight;

  let target: number | null = null;
  if (bottom + INSET > viewBottom) target = bottom + INSET - frame.clientHeight;
  // Checked second so a node taller than the viewport seats its top edge, not its
  // bottom — the title is the part worth keeping.
  if (top - INSET < viewTop) target = top - INSET;
  if (target === null) return () => {};

  return scrollPlaneTo(frame, target, lenis);
}
