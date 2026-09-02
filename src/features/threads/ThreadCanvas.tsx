import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { Thread } from '../../lib/mockData';
import { useLenis } from '../../hooks/useLenis';
import { ThreadBubble } from './ThreadBubble';
import { THREAD_CANVAS, getPlaneScale } from './threadLayout';
import { nudgeIntoView } from './planeScroll';

interface ThreadCanvasProps {
  threads: Thread[];
  onThreadClick: (threadId: string) => void;
  /** The thread the preview panel is showing, if any. */
  previewThreadId?: string | null;
  /** Set by `ChannelView`. The canvas takes its height in one frame and slides. */
  height?: number;
}

/** Below this the tether is too short to be a pointer, and reads as a speck. */
const TETHER_MIN = 14;

/** Matches --canvas-dot-size. The grid scales with the plane. */
const DOT_GRID = 22;

/** Short enough to stay out of the way, long enough to be a grabbable-looking mark. */
const INDICATOR_MIN = 28;

export function ThreadCanvas({
  threads,
  onThreadClick,
  previewThreadId = null,
  height,
}: ThreadCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const tetherRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const lenisRef = useLenis(frameRef, sizerRef);

  // The plane zooms out as the panel shortens the canvas, rather than being
  // clipped. A transform doesn't affect layout, so the sizer below carries the
  // scaled dimensions and the scroll container measures those.
  const scale = getPlaneScale(height ?? THREAD_CANVAS.height);

  /**
   * The two things drawn over the canvas but not scrolled by it.
   *
   * Geometry is computed rather than measured. During the zoom the plane is
   * mid-transition, so `getBoundingClientRect` would return wherever the
   * animation currently is; these need the *target*, which the numbers give
   * directly. Node offsets are unscaled plane coordinates, so they go through
   * `scale`, and the plane is centred in the sizer, so they go through that too.
   */
  const syncOverlays = useCallback(() => {
    const frame = frameRef.current;
    const tether = tetherRef.current;
    const indicator = indicatorRef.current;
    if (!frame) return;

    // The plane is flex-centred, and scaled about its own top centre, so its
    // visual left edge is whatever is left over either side, halved.
    const planeWidth = THREAD_CANVAS.width * scale;
    const sizerWidth = Math.max(planeWidth, frame.clientWidth);
    const planeLeft = (sizerWidth - planeWidth) / 2;

    if (tether) {
      const node = previewThreadId
        ? frame.querySelector<HTMLElement>(`[data-thread-id="${previewThreadId}"]`)
        : null;
      if (!node) {
        tether.style.opacity = '0';
        tether.style.height = '0px';
      } else {
        // Runs from the top of the viewport — the panel's edge — down to the node.
        // No ceiling on the length: with the plane zoomed out a node can sit
        // anywhere, and a hairline over a canvas at 45% still reads as a pointer.
        const x =
          planeLeft + (node.offsetLeft + node.offsetWidth / 2) * scale - frame.scrollLeft;
        const y = node.offsetTop * scale - frame.scrollTop;
        tether.style.left = `${Math.round(x)}px`;
        tether.style.height = `${Math.max(0, Math.round(y) - 3)}px`;
        tether.style.opacity = y > TETHER_MIN ? '1' : '0';
      }
    }

    if (indicator) {
      // Stands in for the native scrollbar, which is hidden. Only reachable state
      // here is "there is more canvas than fits" — which happens exactly when the
      // scale floor has bound and the plane has stopped shrinking.
      const scrollable = frame.scrollHeight - frame.clientHeight;
      if (scrollable <= 1) {
        indicator.style.opacity = '0';
      } else {
        const size = Math.max(
          INDICATOR_MIN,
          frame.clientHeight * (frame.clientHeight / frame.scrollHeight),
        );
        indicator.style.height = `${size}px`;
        indicator.style.top = `${(frame.scrollTop / scrollable) * (frame.clientHeight - size)}px`;
        indicator.style.opacity = '0.28';
      }
    }
  }, [previewThreadId, scale]);

  // A layout effect, not a timer: the canvas already has its final height by this
  // point, so clientHeight and scrollHeight are settled and there's nothing to
  // wait for. The nudge only fires when the scale floor has bound and the node is
  // genuinely cut off — with the plane zoomed to fit there is nothing to scroll.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || !previewThreadId) return;
    const node = frame.querySelector<HTMLElement>(`[data-thread-id="${previewThreadId}"]`);
    const cancel = node ? nudgeIntoView(frame, node, scale, lenisRef.current) : undefined;
    syncOverlays();
    return cancel;
  }, [previewThreadId, scale, syncOverlays, lenisRef]);

  useEffect(() => {
    const frame = frameRef.current;
    const sizer = sizerRef.current;
    if (!frame) return;
    frame.addEventListener('scroll', syncOverlays, { passive: true });
    const observer = new ResizeObserver(syncOverlays);
    observer.observe(frame);
    // The sizer's height is what the frame scrolls against, and it animates
    // through the zoom without resizing the frame — so the indicator would go
    // stale mid-transition if only the frame were watched.
    if (sizer) observer.observe(sizer);
    return () => {
      frame.removeEventListener('scroll', syncOverlays);
      observer.disconnect();
    };
  }, [syncOverlays]);

  return (
    // The outer box does not scroll, so the overlays below can be pinned to the
    // viewport — an absolutely-positioned child of a scroll container scrolls with
    // the content, which is the opposite of what an overlay wants.
    <div className="relative m-4 flex-none" style={{ height: height ? `${height}px` : undefined }}>
      <div
        ref={frameRef}
        className="no-scrollbar absolute inset-0 overflow-auto rounded-xl"
        style={{ backgroundColor: 'var(--color-void)' }}
      >
        {/*
          The sizer is the plane's *visual* footprint. Transforms are invisible to
          layout, so without it the scroll container would still measure the full
          1000×760 and offer scrollbars for content that plainly fits.

          The dot grid lives here rather than on the plane, and scales as a real
          length instead of through the transform: it stays crisp at any zoom, it
          travels with the nodes because it is inside the scroller, and
          minWidth/minHeight keep it covering the frame when the plane is smaller.
        */}
        <div
          ref={sizerRef}
          className="plane-sizer relative flex items-start justify-center"
          style={{
            width: `${THREAD_CANVAS.width * scale}px`,
            height: `${THREAD_CANVAS.height * scale}px`,
            minWidth: '100%',
            minHeight: '100%',
            background: `
              radial-gradient(circle at center, var(--dot-canvas) 1px, transparent 1px)
            `,
            backgroundSize: `${DOT_GRID * scale}px ${DOT_GRID * scale}px`,
          }}
        >
          {/*
            Fixed logical plane — stored thread coordinates only mean something if
            every client shares the same space. Positions stay absolute pixels
            inside it whatever the zoom; the browser hit-tests through the
            transform, so nothing has to undo the scale to know what was clicked.

            Centred horizontally and scaled about its own top centre, so the zoom
            converges on the middle of the canvas. The canvas is usually wider than
            the 1000px plane, so anchoring left would leave the field pinned to one
            edge and pull it further that way on every zoom.
          */}
          <div
            className="plane relative flex-none"
            style={{
              width: `${THREAD_CANVAS.width}px`,
              height: `${THREAD_CANVAS.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            {threads.map((thread) => (
              <ThreadBubble
                key={thread.id}
                thread={thread}
                onClick={onThreadClick}
                isPreviewed={thread.id === previewThreadId}
                isDimmed={previewThreadId !== null && thread.id !== previewThreadId}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        ref={tetherRef}
        aria-hidden="true"
        className="tether pointer-events-none absolute top-0 w-px"
        style={{
          height: 0,
          opacity: 0,
          background: 'linear-gradient(to bottom, var(--color-mist), transparent)',
        }}
      >
        <span
          className="absolute left-[-2.5px] top-0 block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--color-mist)' }}
        />
      </div>

      <div
        ref={indicatorRef}
        aria-hidden="true"
        className="scroll-indicator pointer-events-none absolute right-1.25 w-0.75 rounded-full"
        style={{ top: 0, height: 0, opacity: 0, backgroundColor: 'var(--color-mist)' }}
      />
    </div>
  );
}
