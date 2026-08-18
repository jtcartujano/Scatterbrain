import { useEffect, useState, useCallback } from 'react';

export type SidebarMode = 'standard' | 'compact';

const STORAGE_KEY = 'scatterbrain-sidebar-mode';

function getInitialMode(): SidebarMode {
  if (typeof window === 'undefined') return 'standard';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'standard' || stored === 'compact') return stored;
  return 'standard';
}

export function useSidebarMode() {
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>(getInitialMode);

  const setSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    // Dispatch storage event for other components using this hook
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: mode }));
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'standard' || e.newValue === 'compact')) {
        setSidebarModeState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const compact = sidebarMode === 'compact';

  return { sidebarMode, setSidebarMode, compact };
}
