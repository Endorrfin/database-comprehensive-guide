import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Lang, Localized } from '../data/types';
import { LANG_KEY, LangCtx, pick, useLang } from './lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'uk') return saved;
  } catch {
    /* localStorage unavailable — fall back */
  }
  return 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore persistence failures */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === 'en' ? 'uk' : 'en')), []);
  const t = useCallback((value: Localized) => pick(value, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

/** Inline bilingual text node: <T value={someLocalized} />. */
export function T({ value }: { value: Localized }) {
  const { t } = useLang();
  return <>{t(value)}</>;
}
