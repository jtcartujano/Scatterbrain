import type { Channel } from '../../lib/mockData';
import { mockUsers } from '../../lib/mockData';

interface ChannelInfoPanelProps {
  channel: Channel;
}

export function ChannelInfoPanel({ channel }: ChannelInfoPanelProps) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Channel Info */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
          About
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-mist)' }}>
          {channel.type === 'discussion'
            ? 'A discussion channel where threads stay organized spatially.'
            : 'A text channel for quick conversations.'}
        </p>
      </div>

      {/* Members */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
          Members
        </h3>
        <div className="space-y-2">
          {mockUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-sm" style={{ color: 'var(--color-ink)' }}>
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
