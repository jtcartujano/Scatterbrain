import type { Thread } from '../../lib/mockData';
import { ThreadBubble } from './ThreadBubble';
import { THREAD_CANVAS } from './threadLayout';

interface ThreadCanvasProps {
  threads: Thread[];
  onThreadClick: (threadId: string) => void;
}

export function ThreadCanvas({ threads, onThreadClick }: ThreadCanvasProps) {
  return (
    <div
      className="relative flex-1 overflow-auto rounded-xl m-4"
      style={{
        background: `
          radial-gradient(circle at center, rgba(139, 141, 168, 0.18) 1px, transparent 1px)
        `,
        backgroundSize: '22px 22px',
        backgroundColor: 'var(--color-void)',
      }}
    >
      {/*
        Fixed logical plane, not a viewport-sized box — stored thread
        coordinates only mean something if every client shares the same space.
        The wrapper above scrolls when the viewport is smaller.
      */}
      <div
        className="relative"
        style={{
          width: `${THREAD_CANVAS.width}px`,
          height: `${THREAD_CANVAS.height}px`,
          minWidth: '100%',
          minHeight: '100%',
        }}
      >
        {threads.map((thread) => (
          <ThreadBubble
            key={thread.id}
            thread={thread}
            onClick={onThreadClick}
          />
        ))}
      </div>
    </div>
  );
}
