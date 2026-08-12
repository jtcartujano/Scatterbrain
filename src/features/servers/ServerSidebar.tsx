import { useState } from 'react';
import { TopSwitcher } from '../../components/TopSwitcher';
import type { Server, Channel } from '../../lib/mockData';

interface ServerSidebarProps {
  servers: Server[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

export function ServerSidebar({ servers, activeChannelId, onChannelSelect }: ServerSidebarProps) {
  const [activeView, setActiveView] = useState<'friends' | 'servers' | 'settings'>('servers');
  const [expandedServerId, setExpandedServerId] = useState<string | null>(servers[0]?.id || null);

  const toggleServer = (serverId: string) => {
    setExpandedServerId(expandedServerId === serverId ? null : serverId);
  };

  return (
    <div className="flex flex-col h-full">
      <TopSwitcher activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {activeView === 'servers' && (
          <div className="space-y-1">
            {servers.map((server) => (
              <div key={server.id} className="mb-4">
                {/* Server Header */}
                <button
                  onClick={() => toggleServer(server.id)}
                  className="w-full px-2 py-1.5 text-left rounded-lg text-[13.5px] font-semibold transition-colors"
                  style={{
                    color: 'var(--color-ink)',
                    backgroundColor: expandedServerId === server.id ? 'rgba(236, 237, 245, 0.06)' : 'transparent',
                  }}
                >
                  {server.name}
                </button>

                {/* Channels List */}
                {expandedServerId === server.id && (
                  <div className="mt-1 space-y-0.5">
                    {server.channels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === activeChannelId}
                        onClick={() => onChannelSelect(channel.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeView === 'friends' && (
          <div className="p-4 text-center" style={{ color: 'var(--color-mist)' }}>
            <p className="text-sm">Friends view coming soon</p>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="p-4 text-center" style={{ color: 'var(--color-mist)' }}>
            <p className="text-sm">Settings view coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-2.5 py-1.5 rounded-lg text-left text-[13px] flex items-center gap-2 transition-colors"
      style={{
        backgroundColor: isActive ? 'rgba(245, 185, 66, 0.13)' : 'transparent',
        color: isActive ? 'var(--color-ink)' : 'var(--color-mist)',
      }}
    >
      {/* Channel Icon */}
      {channel.type === 'discussion' && (
        <DiscussionIcon />
      )}
      {channel.type === 'text' && (
        <span className="text-[11px]" style={{ color: 'var(--color-mist)' }}>#</span>
      )}

      {/* Channel Name */}
      <span className="flex-1 font-medium">{channel.name}</span>

      {/* Badges */}
      {channel.hasMention && (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{
            backgroundColor: 'var(--color-spark)',
            color: 'var(--color-void)'
          }}
        >
          @
        </span>
      )}
      {channel.unreadCount && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: '#12958A',
            color: '#0B1712'
          }}
        >
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}

function DiscussionIcon() {
  return (
    <div className="grid grid-cols-2 gap-[2px] w-2 h-2">
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
    </div>
  );
}
