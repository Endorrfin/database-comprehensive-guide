import { createContext, useContext } from 'react';
import type { Level } from '../data/types';

export type LevelFilter = Level | 'all';

export const KNOWN_KEY = 'dbguide.known';

export type AppStateValue = {
  levelFilter: LevelFilter;
  setLevelFilter: (l: LevelFilter) => void;
  isKnown: (id: string) => boolean;
  toggleKnown: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

export const AppStateCtx = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error('useAppState must be used within <AppStateProvider>');
  return ctx;
}
