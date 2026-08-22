import type { Thread } from '../../lib/mockData';
import { mockUsers } from '../../lib/mockData';
import { THREAD_SIZES, getThreadAppearance } from './threadLayout';

interface ThreadBubbleProps {
  thread: Thread;
  onClick: (threadId: string) => void;
}

export function ThreadBubble({ thread, onClick }: ThreadBubbleProps) {
  const footprint = THREAD_SIZES[thread.size];
  // Tilt and blob radius are derived from the thread id, not stored on it.
  const { rotation, borderRadius } = getThreadAppearance(thread.id);
  const hasRing = thread.isPinned || thread.isUnread;
  const images = thread.images ?? [];
  const hasImages = images.length > 0;

  return (
    <button
      onClick={() => onClick(thread.id)}
      className="absolute cursor-pointer transition-transform hover:scale-105"
      style={{
        left: `${thread.position.x}px`,
        top: `${thread.position.y}px`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        className="relative flex flex-col items-center justify-center text-center gap-2"
        style={{
          width: `${footprint.width}px`,
          minHeight: `${footprint.minHeight}px`,
          padding: `${footprint.padding}px`,
          backgroundColor: 'var(--color-surface)',
          borderRadius,
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

        {/* 1. Thread Title */}
        <h3
          className="font-semibold line-clamp-2"
          style={{
            fontSize: thread.size === 'small' ? '11.5px' : thread.size === 'medium' ? '13px' : '14.5px',
            color: 'var(--color-ink)',
            lineHeight: '1.4',
          }}
        >
          {thread.title}
        </h3>

        {/* 2. Image fan (when the thread has images) — falls back to participant avatars */}
        {hasImages ? (
          <ImageFan images={images} size={thread.size} />
        ) : (
          <div className="flex items-center">
            {thread.participants.slice(0, 3).map((participant, index) => {
              const user = mockUsers.find((u) => u.id === participant.id) || participant;
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
        )}

        {/* 3. Metadata — replies, last activity, and (optionally) image count */}
        <div
          className="flex items-center gap-1.5"
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
          {hasImages && (
            <>
              <span>•</span>
              <span>{images.length} images</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function ImageFan({ images, size }: { images: string[]; size: 'small' | 'medium' | 'large' }) {
  const cardSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
  const shown = images.slice(0, 3);
  // A 4th card (null = placeholder) appears only when there's more to show beyond the first 3.
  const cards: (string | null)[] = images.length > 3 ? [...shown, null] : shown;
  const mid = (cards.length - 1) / 2;

  return (
    <div className="flex items-center justify-center" style={{ height: cardSize }}>
      {cards.map((src, index) => (
        <div
          key={index}
          className="rounded-md border-2 flex-shrink-0"
          style={{
            width: cardSize,
            height: cardSize,
            marginLeft: index === 0 ? 0 : -cardSize * 0.5,
            transform: `rotate(${(index - mid) * 9}deg)`,
            borderColor: 'var(--color-surface)',
            backgroundImage: src
              ? `url(${src})`
              : 'linear-gradient(135deg, #A8AABF, #F2F2F6)', // blank grey-to-white "more" placeholder
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)',
            zIndex: cards.length - index,
          }}
        />
      ))}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}
