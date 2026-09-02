import { useEffect, useRef, type RefObject } from 'react';
import Lenis from 'lenis';

/**
 * Smooth scrolling for one scroll container.
 *
 * Lenis is a site-level concern — one way of scrolling, defined once — but it is
 * pointed at an element rather than the window, because the app shell itself never
 * scrolls. `MainLayout` is a fixed-height frame; the thread canvas is the only
 * thing inside it with more content than room, so it is the only caller today.
 *
 * `autoRaf` lets Lenis own its own frame loop, so nothing here has to.
 *
 * Vertical only: Lenis takes a single orientation, and the canvas overflows
 * vertically far more often than horizontally — the plane is wider than it is
 * tall, so sideways overflow needs a genuinely narrow window. Horizontal
 * scrolling stays native.
 *
 * Returns a ref rather than the instance so callers can reach it from an effect
 * without re-running on every re-creation.
 */
export function useLenis(
  wrapperRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled = true,
): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!enabled || !wrapper || !content) return;

    // Smoothing is motion, and someone who has asked for less of it should get
    // the browser's own instant scroll instead.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ wrapper, content, autoRaf: true });
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [wrapperRef, contentRef, enabled]);

  return lenisRef;
}
