import type { Channel } from '../../lib/mockData';

type ViewMode = 'canvas' | 'grid';

interface ChannelHeaderProps {
  channel: Channel;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewThread: () => void;
}

export function ChannelHeader({ channel, viewMode, onViewModeChange, onNewThread }: ChannelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{
        backgroundColor: 'var(--color-void)',
        borderColor: 'rgba(236, 237, 245, 0.06)',
      }}
    >
      {/* Channel Name */}
      <div className="flex items-center gap-2.5">
        {channel.type === 'discussion' && <DiscussionIconLarge />}
        {channel.type === 'text' && (
          <span className="text-base" style={{ color: 'var(--color-mist)' }}>#</span>
        )}
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
          {channel.name}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <div
          className="flex gap-[2px] p-[3px] rounded-full"
          style={{
            backgroundColor: 'rgba(236, 237, 245, 0.06)',
          }}
        >
          <button
            onClick={() => onViewModeChange('canvas')}
            className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'canvas' ? 'var(--color-spark)' : 'transparent',
              color: viewMode === 'canvas' ? 'var(--color-void)' : 'var(--color-mist)',
            }}
          >
            Canvas
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'grid' ? 'var(--color-spark)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--color-void)' : 'var(--color-mist)',
            }}
          >
            Grid
          </button>
        </div>

        {/* New Thread Button */}
        <button
          onClick={onNewThread}
          className="px-4 py-2 rounded-full text-[12px] font-semibold transition-transform hover:scale-105"
          style={{
            backgroundColor: 'var(--color-spark)',
            color: 'var(--color-void)',
          }}
        >
          New Thread
        </button>
      </div>
    </div>
  );
}

function DiscussionIconLarge() {
  return (
    <div className="grid grid-cols-2 gap-[3px] w-[11px] h-[11px]">
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-mist)' }} />
    </div>
  );
}
