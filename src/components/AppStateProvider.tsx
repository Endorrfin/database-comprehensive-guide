import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EffectiveTheme, LevelFilter, ThemeMode } from '../lib/appState';
import { AppStateCtx, KNOWN_KEY, THEME_KEY } from '../lib/appState';

function loadKnown(): Set<string> {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set<string>();
}

function loadThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function prefersLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: light)').matches;
}

function resolveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode === 'system') return prefersLight() ? 'light' : 'dark';
  return mode;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [known, setKnown] = useState<Set<string>>(loadKnown);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(loadThemeMode);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveTheme(loadThemeMode()));

  // Apply the effective theme to <html data-theme> + the address-bar colour, and persist the mode.
  useEffect(() => {
    const eff = resolveTheme(themeMode);
    setEffectiveTheme(eff);
    document.documentElement.setAttribute('data-theme', eff);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', eff === 'light' ? '#f5f7fa' : '#0e1217');
    try {
      localStorage.setItem(THEME_KEY, themeMode);
    } catch {
      /* ignore persistence failures */
    }
  }, [themeMode]);

  // While following the system, react to OS light/dark changes live.
  useEffect(() => {
    if (themeMode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const eff: EffectiveTheme = mq.matches ? 'light' : 'dark';
      setEffectiveTheme(eff);
      document.documentElement.setAttribute('data-theme', eff);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', eff === 'light' ? '#f5f7fa' : '#0e1217');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  const setThemeMode = useCallback((m: ThemeMode) => setThemeModeState(m), []);

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
      themeMode,
      effectiveTheme,
      setThemeMode,
    }),
    [
      levelFilter,
      isKnown,
      toggleKnown,
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      themeMode,
      effectiveTheme,
      setThemeMode,
    ],
  );

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
