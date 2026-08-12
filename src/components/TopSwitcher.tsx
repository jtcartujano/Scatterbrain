import { useState } from 'react';

type SwitcherView = 'friends' | 'servers' | 'settings';

interface TopSwitcherProps {
  activeView: SwitcherView;
  onViewChange: (view: SwitcherView) => void;
}

export function TopSwitcher({ activeView, onViewChange }: TopSwitcherProps) {
  return (
    <div className="flex gap-[2px] p-3">
      <button
        onClick={() => onViewChange('friends')}
        className="px-3 py-[5px] rounded-full text-[11px] font-medium transition-colors"
        style={{
          backgroundColor: activeView === 'friends' ? 'var(--color-spark)' : 'rgba(236, 237, 245, 0.06)',
          color: activeView === 'friends' ? 'var(--color-void)' : 'var(--color-mist)',
        }}
      >
        Friends
      </button>
      <button
        onClick={() => onViewChange('servers')}
        className="px-3 py-[5px] rounded-full text-[11px] font-medium transition-colors"
        style={{
          backgroundColor: activeView === 'servers' ? 'var(--color-spark)' : 'rgba(236, 237, 245, 0.06)',
          color: activeView === 'servers' ? 'var(--color-void)' : 'var(--color-mist)',
        }}
      >
        Servers
      </button>
      <button
        onClick={() => onViewChange('settings')}
        className="px-3 py-[5px] rounded-full text-[11px] font-medium transition-colors"
        style={{
          backgroundColor: activeView === 'settings' ? 'var(--color-spark)' : 'rgba(236, 237, 245, 0.06)',
          color: activeView === 'settings' ? 'var(--color-void)' : 'var(--color-mist)',
        }}
      >
        Settings
      </button>
    </div>
  );
}
