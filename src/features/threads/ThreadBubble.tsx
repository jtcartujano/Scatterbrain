import type { Thread } from '../../lib/mockData';
import { mockUsers } from '../../lib/mockData';
import { THREAD_SIZES, getThreadAppearance } from './threadLayout';
import { ImageFan } from './ImageFan';
import { formatTimestamp } from './formatTimestamp';

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
          border: '1px solid var(--border-subtle)',
          boxShadow: hasRing
            ? thread.isPinned
              ? 'var(--ring-pinned)'
              : 'var(--ring-unread)'
            : 'var(--shadow-bubble)',
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
                  backgroundColor: 'var(--fill-mist)',
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

