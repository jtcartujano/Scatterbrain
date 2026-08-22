/**
 * The thread canvas is a fixed logical plane. Thread positions are stored as
 * integer coordinates inside it, so every client places a thread identically
 * regardless of viewport — the canvas scrolls rather than reflowing.
 */
export const THREAD_CANVAS = { width: 1000, height: 760 } as const;

/** Bubble footprints. Persisted `size` picks one; the footprint never changes under a thread. */
export const THREAD_SIZES = {
  small: { width: 115, minHeight: 85, padding: 14 },
  medium: { width: 175, minHeight: 125, padding: 18 },
  large: { width: 255, minHeight: 175, padding: 24 },
} as const;

export type ThreadAppearance = {
  rotation: number;
  borderRadius: string;
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

  const appearance = { rotation, borderRadius };
  cache.set(threadId, appearance);
  return appearance;
}
