import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Named for what it does rather than where it started. It began as a sidebar
 * setting and already sizes the right panel too, so `sidebarMode` had stopped
 * describing it. The values are unchanged and so is the storage key — this is a
 * rename, not a migration.
 */
export type Density = 'standard' | 'compact';

export type ThreadView = 'canvas' | 'grid';

export type SettingsValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: Density;
  setDensity: (density: Density) => void;
  /** `density === 'compact'`, derived once so call sites don't each repeat it. */
  compact: boolean;
  threadView: ThreadView;
  setThreadView: (view: ThreadView) => void;
};

/**
 * Split from the provider that fills it so that neither file exports both a
 * component and a plain function — `react/only-export-components`, which the
 * project keeps on as a warning.
 */
export const SettingsContext = createContext<SettingsValue | null>(null);

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used within a SettingsProvider');
  return value;
}
