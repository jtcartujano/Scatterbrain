/**
 * The thread canvas is a fixed logical plane. Thread positions are stored as
 * integer coordinates inside it, so every client places a thread identically
 * regardless of viewport — the canvas scrolls rather than reflowing.
 */
export const THREAD_CANVAS = { width: 1000, height: 760 } as const;

/**
 * How far the plane is allowed to shrink when the preview panel shortens the
 * canvas. Below this the 10px mono metadata row stops being readable — 0.72 puts
 * it at 7.2px, and whatever the floor cuts off, the canvas scrolls for.
 */
export const PLANE_SCALE_FLOOR = 0.72;

/**
 * The plane zooms out to keep itself visible as the canvas gets shorter, rather
 * than being clipped. It never scales *up*: past the plane's own height there is
 * nothing more to reveal, and 1:1 is where the type was drawn.
 */
export function getPlaneScale(canvasHeight: number): number {
  if (canvasHeight <= 0) return 1;
  return Math.max(PLANE_SCALE_FLOOR, Math.min(1, canvasHeight / THREAD_CANVAS.height));
}

/** Bubble footprints. Persisted `size` picks one; the footprint never changes under a thread. */
export const THREAD_SIZES = {
  small: { width: 115, minHeight: 85, padding: 14 },
  medium: { width: 175, minHeight: 125, padding: 18 },
  large: { width: 255, minHeight: 175, padding: 24 },
} as const;

/**
 * The four values the blob is built from, each paired with its complement so
 * opposite corners sum to 100%. Kept alongside the assembled string because the
 * status dot has to find the same silhouette the radius describes.
 */
export type BlobCorners = { a: number; b: number; c: number; d: number };

export type ThreadAppearance = {
  rotation: number;
  borderRadius: string;
  corners: BlobCorners;
};

/**
 * FNV-1a, 32-bit. Small, dependency-free, and bit-for-bit identical in any JS
 * engine — a thread has to look the same on every client, and eventually on the
 * server too.
 */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — seeded PRNG, so one id can yield several independent values. */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, ThreadAppearance>();

/**
 * Rotation and blob radius are derived from the thread id rather than stored.
 * They're arbitrary either way, so there's nothing to gain from a column — and
 * a pure function keeps the canvas, grid and preview panel in agreement for free.
 *
 * Note: swapping mock ids for real UUIDs reshuffles every shape once. Expected.
 */
export function getThreadAppearance(threadId: string): ThreadAppearance {
  const cached = cache.get(threadId);
  if (cached) return cached;

  const next = rng(hash32(threadId));

  // Cosmetic warm-up, not a correctness fix: the generator is uniform with or
  // without it, but the first draw happened to land the current mock ids in a
  // narrow band of rotations. Discarding one spreads them across the range.
  next();

  // Hand-authored rotations sat in -2…2 degrees. Stay in that register.
  const rotation = Math.round((next() * 5 - 2.5) * 10) / 10;

  // The authored radii all paired opposite corners to sum to 100% —
  // '65% 35% 30% 70%/60% 40% 65% 35%'. Preserving that rule keeps each edge's
  // total consistent and rules out degenerate, lopsided blobs.
  const corner = () => Math.round(next() * 40) + 30; // 30…70
  const [a, b, c, d] = [corner(), corner(), corner(), corner()];
  const borderRadius = `${a}% ${100 - a}% ${b}% ${100 - b}%/${c}% ${100 - c}% ${d}% ${100 - d}%`;

  const appearance = { rotation, borderRadius, corners: { a, b, c, d } };
  cache.set(threadId, appearance);
  return appearance;
}

/** The dot is 10px across, so half of it is what an offset has to account for. */
const STATUS_DOT_SIZE = 10;

/** Pulled this far in along the diagonal, so the dot sits inside the edge rather
 *  than straddling it — the placement every canvas design uses. */
const STATUS_DOT_INSET = 3;

/** cos 45° subtracted from 1: how far in from a corner the curve's midpoint sits. */
const CORNER_45 = 1 - Math.SQRT1_2;

/**
 * Where the pinned / unread dot goes: on the blob's own top-right curve.
 *
 * `border-radius` orders corners top-left, top-right, bottom-right, bottom-left,
 * horizontal radii first — so against the string the generator writes, the
 * top-right corner's radii are `(100 − a)%` of the width and `(100 − c)%` of the
 * height. That corner is a quarter ellipse centred at `(W − rx, ry)`, and the
 * point 45° along it is `(W − 0.2929·rx, 0.2929·ry)`.
 *
 * Returned as percentages rather than pixels on purpose: a bubble grows past its
 * `minHeight` when a title wraps to two lines, and the browser resolves these
 * against the real box exactly as it resolves the radius itself. Anchoring to the
 * bounding-box corner instead — which is what shipped — leaves the dot floating in
 * empty space, because on a blob that corner isn't part of the shape.
 */
export function getStatusDotOffset(corners: BlobCorners) {
  const half = STATUS_DOT_SIZE / 2 - STATUS_DOT_INSET;
  return {
    top: `calc(${(CORNER_45 * (100 - corners.c)).toFixed(3)}% - ${half}px)`,
    right: `calc(${(CORNER_45 * (100 - corners.a)).toFixed(3)}% - ${half}px)`,
  };
}
