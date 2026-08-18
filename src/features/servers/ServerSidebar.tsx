import { useState, type ReactNode } from 'react';
import { TopSwitcher } from '../../components/TopSwitcher';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { useSidebarMode, type SidebarMode } from '../../hooks/useSidebarMode';
import type { Server, Channel } from '../../lib/mockData';
import { mockFriends, mockDirectMessages } from '../../lib/mockData';

interface ServerSidebarProps {
  servers: Server[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

type CanvasView = 'canvas' | 'grid'; // not wired to the actual canvas yet — see note below

export function ServerSidebar({ servers, activeChannelId, onChannelSelect }: ServerSidebarProps) {
  const [activeView, setActiveView] = useState<'friends' | 'servers' | 'settings'>('servers');

  const [expandedServerIds, setExpandedServerIds] = useState<Set<string>>(
    () => new Set(servers[0] ? [servers[0].id] : [])
  );

  const { sidebarMode, setSidebarMode, compact } = useSidebarMode();

  // Canvas/Grid lives here now instead of the canvas top bar. Purely presentational
  // for the moment — remove the old toggle from the canvas header when you wire this up.
  const [canvasView, setCanvasView] = useState<CanvasView>('canvas');

  const { theme, setTheme } = useTheme();

  const toggleServer = (serverId: string) => {
    setExpandedServerIds((prev) => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        // Standard = single-open accordion. Compact = several can stay open at once.
        if (sidebarMode === 'standard') next.clear();
        next.add(serverId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <TopSwitcher activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {activeView === 'servers' && (
          <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {/* Org Header */}
            <div className="flex items-center gap-2 px-2 py-1">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                style={{ backgroundColor: 'var(--color-spark)', color: 'var(--color-void)' }}
              >
                S
              </div>
              <span className="font-semibold text-[13px]" style={{ color: 'var(--color-ink)' }}>
                Scatterbrain
              </span>
            </div>

            {/* Direct Messages */}
            <div>
              <SectionHeader compact={compact}>Direct Messages</SectionHeader>
              <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
                {mockDirectMessages.map((dm) => (
                  <button
                    key={dm.id}
                    className={`w-full flex items-center gap-2 rounded-lg transition-colors ${
                      compact ? 'px-2 py-1' : 'px-2 py-1.5'
                    }`}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={compact ? 'w-5 h-5' : 'w-6 h-6'}
                        style={{ backgroundColor: dm.user.color, borderRadius: '50%' }}
                      />
                    </div>
                    <span
                      className={`flex-1 font-medium truncate ${compact ? 'text-[12px]' : 'text-[13px]'}`}
                      style={{ color: 'var(--color-ink)' }}
                    >
                      {dm.user.name}
                    </span>
                    {dm.unreadCount && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: 'var(--color-signal)', color: '#0B1712' }}
                      >
                        {dm.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Servers */}
            <div>
              <SectionHeader compact={compact}>Servers</SectionHeader>
              <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
                {servers.map((server) => {
                  const isExpanded = expandedServerIds.has(server.id);
                  const textChannels = server.channels.filter((c) => c.type === 'text');
                  const discussionChannels = server.channels.filter((c) => c.type === 'discussion');

                  return (
                    <div key={server.id}>
                      {/* Server Header */}
                      <button
                        onClick={() => toggleServer(server.id)}
                        className={`w-full flex items-center gap-2 text-left rounded-lg font-semibold transition-colors ${
                          compact ? 'px-2 py-1 text-[12px]' : 'px-2 py-1.5 text-[13px]'
                        }`}
                        style={{
                          color: 'var(--color-ink)',
                          backgroundColor: isExpanded ? 'rgba(236, 237, 245, 0.06)' : 'transparent',
                        }}
                      >
                        <ServerIcon server={server} compact={compact} />
                        <span className="flex-1 truncate">{server.name}</span>
                        {server.hasInvite && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: 'rgba(139, 141, 168, 0.25)', color: 'var(--color-mist)' }}
                          >
                            Invite
                          </span>
                        )}
                        {server.unreadCount && !server.hasInvite && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--color-signal)', color: '#0B1712' }}
                          >
                            {server.unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Channels List */}
                      {isExpanded && (
                        <div className={compact ? 'mt-0.5 ml-2' : 'mt-1 ml-2 space-y-0.5'}>
                          {/* Text Channels */}
                          {textChannels.length > 0 && (
                            <div className={compact ? 'mb-1' : 'mb-2'}>
                              <ChannelGroupHeader compact={compact}>Text Channels</ChannelGroupHeader>
                              {textChannels.map((channel) => (
                                <ChannelItem
                                  key={channel.id}
                                  channel={channel}
                                  isActive={channel.id === activeChannelId}
                                  onClick={() => onChannelSelect(channel.id)}
                                  compact={compact}
                                />
                              ))}
                            </div>
                          )}

                          {/* Discussion Channels */}
                          {discussionChannels.length > 0 && (
                            <div>
                              <ChannelGroupHeader compact={compact}>Discussion</ChannelGroupHeader>
                              {discussionChannels.map((channel) => (
                                <ChannelItem
                                  key={channel.id}
                                  channel={channel}
                                  isActive={channel.id === activeChannelId}
                                  onClick={() => onChannelSelect(channel.id)}
                                  compact={compact}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Server */}
            <button
              className={`flex items-center gap-2 px-2 rounded-lg transition-colors ${
                compact ? 'py-1 text-[12px]' : 'py-1.5 text-[13px]'
              }`}
              style={{ color: 'var(--color-mist)' }}
            >
              <div
                className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-md flex items-center justify-center border border-dashed`}
                style={{ borderColor: 'var(--color-mist)' }}
              >
                <span className="text-[12px]">+</span>
              </div>
              <span className="font-medium">Add server</span>
            </button>
          </div>
        )}

        {activeView === 'friends' && (
          <div className={compact ? 'space-y-0.5 py-1' : 'space-y-1 py-2'}>
            {mockFriends.map((friend) => (
              <div
                key={friend.id}
                className={`flex items-center rounded-lg ${compact ? 'gap-2 px-2 py-1.5' : 'gap-2.5 px-2 py-2'}`}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={compact ? 'w-6 h-6 rounded-full' : 'w-8 h-8 rounded-full'}
                    style={{ backgroundColor: friend.color }}
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 ${
                      compact ? 'w-2 h-2' : 'w-2.5 h-2.5'
                    }`}
                    style={{
                      backgroundColor:
                        friend.status === 'online' ? 'var(--color-signal)' : 'var(--color-mist)',
                      borderColor: 'var(--color-surface)',
                      opacity: friend.status === 'online' ? 1 : 0.5,
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium truncate ${compact ? 'text-[12px]' : 'text-sm'}`}
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {friend.name}
                  </div>
                  <div
                    className={compact ? 'text-[10px]' : 'text-[11px]'}
                    style={{ color: 'var(--color-mist)' }}
                  >
                    {friend.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'settings' && (
          <div className="px-1 py-4 space-y-6">
            <SettingRow label="Theme">
              <SegmentedControl<Theme>
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </SettingRow>

            <SettingRow label="Sidebar">
              <SegmentedControl<SidebarMode>
                value={sidebarMode}
                onChange={setSidebarMode}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'compact', label: 'Compact' },
                ]}
              />
            </SettingRow>

            <SettingRow label="Thread view" hint="Not wired up yet">
              <SegmentedControl<CanvasView>
                value={canvasView}
                onChange={setCanvasView}
                options={[
                  { value: 'canvas', label: 'Canvas' },
                  { value: 'grid', label: 'Grid' },
                ]}
              />
            </SettingRow>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children, compact }: { children: ReactNode; compact: boolean }) {
  return (
    <div
      className={`uppercase tracking-wide font-bold ${compact ? 'text-[9px] px-2 mb-1' : 'text-[10px] px-2 mb-1.5'}`}
      style={{ color: 'var(--color-mist)' }}
    >
      {children}
    </div>
  );
}

function ChannelGroupHeader({ children, compact }: { children: ReactNode; compact: boolean }) {
  return (
    <div
      className={`uppercase tracking-wide font-semibold ${compact ? 'text-[8px] px-2.5 py-0.5' : 'text-[9px] px-2.5 py-1'}`}
      style={{ color: 'var(--color-mist)', opacity: 0.7 }}
    >
      {children}
    </div>
  );
}

function ServerIcon({ server, compact }: { server: Server; compact: boolean }) {
  const size = compact ? 20 : 24;
  const initials = server.icon ?? getServerInitials(server.name);
  return (
    <div
      className="rounded-md flex items-center justify-center flex-shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        fontSize: compact ? '8.5px' : '9.5px',
        backgroundColor: server.color ?? 'var(--color-spark)',
        color: 'var(--color-void)',
      }}
    >
      {initials}
    </div>
  );
}

function getServerInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
  compact: boolean;
}

function ChannelItem({ channel, isActive, onClick, compact }: ChannelItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg text-left flex items-center gap-2 transition-colors ${
        compact ? 'px-2.5 py-1 text-[12px]' : 'px-2.5 py-1.5 text-[13px]'
      }`}
      style={{
        backgroundColor: isActive ? 'rgba(245, 185, 66, 0.13)' : 'transparent',
        color: isActive ? 'var(--color-ink)' : 'var(--color-mist)',
      }}
    >
      {/* Channel Icon */}
      {channel.type === 'discussion' && <DiscussionIcon />}
      {channel.type === 'text' && (
        <span className="text-[11px]" style={{ color: 'var(--color-mist)' }}>
          #
        </span>
      )}

      {/* Channel Name */}
      <span className="flex-1 font-medium truncate">{channel.name}</span>

      {/* Badges */}
      {channel.hasMention && (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{
            backgroundColor: 'var(--color-spark)',
            color: 'var(--color-void)',
          }}
        >
          @
        </span>
      )}
      {channel.unreadCount && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: 'var(--color-signal)',
            color: '#0B1712',
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
    <div className="grid grid-cols-2 gap-[2px] w-2 h-2 flex-shrink-0">
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--color-ink)' }}>
          {label}
        </span>
        {hint && (
          <span className="text-[10.5px]" style={{ color: 'var(--color-mist)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: 'var(--color-surface)' }}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
          style={{
            backgroundColor: value === option.value ? 'var(--color-spark)' : 'transparent',
            color: value === option.value ? 'var(--color-void)' : 'var(--color-mist)',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
