import type { Channel } from '../../lib/mockData';
import { mockUsers, mockThreads, BRAINSTORM_MEMBER_COUNT } from '../../lib/mockData';
import { useSidebarMode } from '../../hooks/useSidebarMode';

interface ChannelInfoPanelProps {
  channel: Channel;
  onCollapse?: () => void;
}

export function ChannelInfoPanel({ channel, onCollapse }: ChannelInfoPanelProps) {
  const { compact } = useSidebarMode();

  const pinnedThread = mockThreads.find(
    (thread) => thread.channelId === channel.id && thread.isPinned
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between flex-shrink-0 ${
          compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
        }`}
        style={{ borderBottom: '1px solid rgba(236, 237, 245, 0.08)' }}
      >
        <h2
          className={`font-bold ${compact ? 'text-[12px]' : 'text-[13.5px]'}`}
          style={{ color: 'var(--color-ink)' }}
        >
          Channel info
        </h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className={compact ? 'text-xs leading-none' : 'text-sm leading-none'}
            style={{ color: 'var(--color-mist)' }}
            aria-label="Collapse channel info"
          >
            »
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${compact ? 'p-3' : 'p-4'}`}>
        {/* Description */}
        <p
          className={`leading-relaxed ${compact ? 'text-[11px] mb-4' : 'text-xs mb-6'}`}
          style={{ color: 'var(--color-mist)' }}
        >
          {channel.description ??
            (channel.type === 'discussion'
              ? 'A discussion channel where threads stay organized spatially.'
              : 'A text channel for quick conversations.')}
        </p>

        {/* Pinned */}
        {pinnedThread && (
          <div className={compact ? 'mb-4' : 'mb-6'}>
            <h3
              className={`font-bold uppercase tracking-wide ${
                compact ? 'text-[9.5px] mb-2' : 'text-[10.5px] mb-2.5'
              }`}
              style={{ color: 'var(--color-mist)' }}
            >
              Pinned
            </h3>
            <div className="flex items-start gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-spark)' }}
              />
              <div>
                <div
                  className={`font-medium ${compact ? 'text-[12px]' : 'text-sm'}`}
                  style={{ color: 'var(--color-ink)' }}
                >
                  {pinnedThread.title}
                </div>
                <div
                  className={compact ? 'text-[10px]' : 'text-[11px]'}
                  style={{ color: 'var(--color-mist)' }}
                >
                  {pinnedThread.replyCount} replies
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <h3
            className={`font-bold uppercase tracking-wide ${
              compact ? 'text-[9.5px] mb-2' : 'text-[10.5px] mb-3'
            }`}
            style={{ color: 'var(--color-mist)' }}
          >
            Members — {BRAINSTORM_MEMBER_COUNT}
          </h3>
          <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
            {mockUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'}`}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={compact ? 'w-5 h-5 rounded-full' : 'w-7 h-7 rounded-full'}
                    style={{ backgroundColor: user.color }}
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 ${
                      compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
                    }`}
                    style={{
                      backgroundColor:
                        user.status === 'online' ? 'var(--color-signal)' : 'var(--color-mist)',
                      borderColor: 'var(--color-surface)',
                      opacity: user.status === 'online' ? 1 : 0.5,
                    }}
                  />
                </div>
                <span
                  className={compact ? 'text-[12px]' : 'text-sm'}
                  style={{ color: 'var(--color-ink)' }}
                >
                  {user.name}
                </span>
              </div>
            ))}
            {/* +N more */}
            <div
              className={compact ? 'text-[11px] pl-7' : 'text-[12px] pl-9'}
              style={{ color: 'var(--color-mist)' }}
            >
              +{BRAINSTORM_MEMBER_COUNT - 5} more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
