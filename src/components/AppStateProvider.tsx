import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LevelFilter } from '../lib/appState';
import { AppStateCtx, KNOWN_KEY } from '../lib/appState';

function loadKnown(): Set<string> {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set<string>();
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [known, setKnown] = useState<Set<string>>(loadKnown);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KNOWN_KEY, JSON.stringify([...known]));
    } catch {
      /* ignore persistence failures */
    }
  }, [known]);

  const toggleKnown = useCallback((id: string) => {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isKnown = useCallback((id: string) => known.has(id), [known]);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const value = useMemo(
    () => ({
      levelFilter,
      setLevelFilter,
      isKnown,
      toggleKnown,
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
    }),
    [levelFilter, isKnown, toggleKnown, sidebarOpen, toggleSidebar, closeSidebar],
  );

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
