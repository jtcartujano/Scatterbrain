import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  SettingsContext,
  type Density,
  type SettingsValue,
  type Theme,
  type ThreadView,
} from './useSettings';

/**
 * One key per setting rather than a single serialised blob. Settings arrive one at
 * a time — `threadView` is new here — and a blob would have to be versioned and
 * migrated the first time the shape changed, where a missing key just falls back.
 *
 * The first two keys predate this file and are kept verbatim: changing them would
 * silently discard whatever anyone already has stored.
 */
const KEYS = {
  theme: 'scatterbrain-theme',
  density: 'scatterbrain-sidebar-mode',
  threadView: 'scatterbrain-thread-view',
} as const;

// Module-level so their identity is stable across renders — they're effect
// dependencies below.
const isTheme = (value: string): value is Theme => value === 'light' || value === 'dark';
const isDensity = (value: string): value is Density =>
  value === 'standard' || value === 'compact';
const isThreadView = (value: string): value is ThreadView =>
  value === 'canvas' || value === 'grid';

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

/**
 * One persisted setting: reads through on mount, writes through on change, and
 * follows the same key in other tabs.
 *
 * The `storage` event fires only in tabs *other* than the one that wrote, which is
 * exactly right now that Context covers this tab. It used to be the other way
 * round — `useSidebarMode` dispatched a synthetic `StorageEvent` at itself to reach
 * a sibling component, because there was no shared owner to reach it through. This
 * provider is that owner, so the listener can go back to meaning what it says.
 */
function usePersistentSetting<T extends string>(
  key: string,
  isValid: (value: string) => value is T,
  fallback: () => T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return fallback();
    const stored = localStorage.getItem(key);
    return stored !== null && isValid(stored) ? stored : fallback();
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      localStorage.setItem(key, next);
    },
    [key],
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return;
      if (isValid(event.newValue)) setValue(event.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, isValid]);

  return [value, set];
}

/**
 * App settings, owned in one place.
 *
 * These were three separate pieces of per-component state, which worked only while
 * each was read by exactly one component. Two things broke that: `density` is read
 * by both the sidebar and the right panel, and `threadView` is *set* in the Settings
 * tab inside `ServerSidebar` but *read* by `ChannelView` — sibling subtrees under
 * `App`, with no path between them that isn't this.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistentSetting(KEYS.theme, isTheme, systemTheme);
  const [density, setDensity] = usePersistentSetting(
    KEYS.density,
    isDensity,
    () => 'standard',
  );
  const [threadView, setThreadView] = usePersistentSetting(
    KEYS.threadView,
    isThreadView,
    () => 'canvas',
  );

  // The one setting with an effect outside React: everything else is read through
  // the context, but the theme is spent almost entirely in CSS.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      setTheme,
      density,
      setDensity,
      compact: density === 'compact',
      threadView,
      setThreadView,
    }),
    [theme, setTheme, density, setDensity, threadView, setThreadView],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
