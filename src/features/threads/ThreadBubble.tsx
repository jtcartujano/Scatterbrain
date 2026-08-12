import type { Thread } from '../../lib/mockData';
import { mockUsers } from '../../lib/mockData';

interface ThreadBubbleProps {
  thread: Thread;
  onClick: (threadId: string) => void;
}

export function ThreadBubble({ thread, onClick }: ThreadBubbleProps) {
  const sizeStyles = {
    small: { width: '140px', minHeight: '100px', padding: '16px' },
    medium: { width: '180px', minHeight: '130px', padding: '20px' },
    large: { width: '225px', minHeight: '160px', padding: '24px' },
  };

  const style = sizeStyles[thread.size];
  const hasRing = thread.isPinned || thread.isUnread;

  return (
    <button
      onClick={() => onClick(thread.id)}
      className="absolute cursor-pointer transition-transform hover:scale-105"
      style={{
        left: `${thread.position.x}px`,
        top: `${thread.position.y}px`,
        transform: `rotate(${thread.rotation}deg)`,
      }}
    >
      <div
        className="relative"
        style={{
          ...style,
          backgroundColor: 'var(--color-surface)',
          borderRadius: thread.borderRadius,
          border: '1px solid rgba(236, 237, 245, 0.08)',
          boxShadow: hasRing
            ? thread.isPinned
              ? '0 0 0 2px var(--color-spark), 0 0 0 4px rgba(245, 185, 66, 0.22), 0 10px 26px rgba(0, 0, 0, 0.35)'
              : '0 0 0 2px var(--color-signal), 0 0 0 4px rgba(79, 209, 197, 0.22), 0 10px 26px rgba(0, 0, 0, 0.35)'
            : '0 8px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Status Indicator Dot */}
        {(thread.isPinned || thread.isUnread) && (
          <div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: thread.isPinned ? 'var(--color-spark)' : 'var(--color-signal)',
              boxShadow: `0 0 0 3px var(--color-surface)`,
            }}
          />
        )}

        {/* Thread Title */}
        <h3
          className="font-semibold mb-2 line-clamp-2"
          style={{
            fontSize: thread.size === 'small' ? '11.5px' : thread.size === 'medium' ? '13px' : '14.5px',
            color: 'var(--color-ink)',
            lineHeight: '1.4',
          }}
        >
          {thread.title}
        </h3>

        {/* Metadata */}
        <div
          className="flex items-center gap-1.5 mb-3"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-mist)',
            opacity: 0.7,
          }}
        >
          <span>{thread.replyCount} replies</span>
          <span>•</span>
          <span>{formatTimestamp(thread.lastActivity)}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center">
          {thread.participants.slice(0, 3).map((participant, index) => {
            const user = mockUsers.find(u => u.id === participant.id) || participant;
            return (
              <div
                key={participant.id}
                className="rounded-full border-2"
                style={{
                  width: thread.size === 'small' ? '15px' : '18px',
                  height: thread.size === 'small' ? '15px' : '18px',
                  backgroundColor: user.color,
                  borderColor: 'var(--color-surface)',
                  marginLeft: index > 0 ? '-6px' : '0',
                }}
              />
            );
          })}
          {thread.participants.length > 3 && (
            <div
              className="rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
              style={{
                width: thread.size === 'small' ? '15px' : '18px',
                height: thread.size === 'small' ? '15px' : '18px',
                backgroundColor: 'rgba(139, 141, 168, 0.2)',
                borderColor: 'var(--color-surface)',
                color: 'var(--color-ink)',
                marginLeft: '-6px',
              }}
            >
              +{thread.participants.length - 3}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}
