import { createContext, useContext } from 'react';
import type { Lang, Localized } from '../data/types';

export type { Lang };

export const LANG_KEY = 'dbguide.lang';

export type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Resolve a Localized value in the current language. */
  t: (value: Localized) => string;
};

export const LangCtx = createContext<LangContextValue | null>(null);

export function useLang(): LangContextValue {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang must be used within <LangProvider>');
  return ctx;
}

/** Resolve a Localized value for a language, falling back to EN (UA may lag during authoring). */
export function pick(value: Localized, lang: Lang): string {
  return value[lang] || value.en;
}
