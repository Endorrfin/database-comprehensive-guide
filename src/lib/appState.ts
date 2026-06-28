import { createContext, useContext } from 'react';
import type { Level } from '../data/types';

export type LevelFilter = Level | 'all';

// CHANGED (S22): theme. `mode` is the user's choice (persisted); `effective` is what's applied to
// <html data-theme> after resolving 'system' against prefers-color-scheme.
export type ThemeMode = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'dark' | 'light';

export const KNOWN_KEY = 'dbguide.known';
export const THEME_KEY = 'dbguide.theme';

export type AppStateValue = {
  levelFilter: LevelFilter;
  setLevelFilter: (l: LevelFilter) => void;
  isKnown: (id: string) => boolean;
  toggleKnown: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setThemeMode: (m: ThemeMode) => void;
};

export const AppStateCtx = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error('useAppState must be used within <AppStateProvider>');
  return ctx;
}
