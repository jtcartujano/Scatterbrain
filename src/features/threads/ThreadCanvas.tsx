import type { Thread } from '../../lib/mockData';
import { ThreadBubble } from './ThreadBubble';

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
      <div className="relative min-h-full" style={{ minWidth: '100%' }}>
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
