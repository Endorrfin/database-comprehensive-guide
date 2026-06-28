import { useEffect, useRef, useState } from 'react';
import { glossary } from '../../data/glossary';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

// CHANGED (S21): accepts an optional `term` (deep-link from global search → #/glossary/<term>);
// it scrolls that entry into view and highlights it briefly. The local filter box still works.
export function GlossaryPage({ term }: { term?: string } = {}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const [highlight, setHighlight] = useState<string | undefined>(term);
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const needle = q.trim().toLowerCase();
  const entries = glossary
    .filter(
      (g) =>
        !needle ||
        g.term.toLowerCase().includes(needle) ||
        (g.def[lang] || g.def.en).toLowerCase().includes(needle),
    )
    .sort((a, b) => a.term.localeCompare(b.term));

  // Scroll to + highlight the linked term on arrival (and whenever it changes via hashchange).
  useEffect(() => {
    setHighlight(term);
    if (!term) return;
    const el = refs.current.get(term);
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const id = window.setTimeout(() => setHighlight(undefined), 2400);
    return () => window.clearTimeout(id);
  }, [term]);

  return (
    <div className="content">
      <h1>{t(ui.glossary)}</h1>
      <p className="muted">
        {t({
          en: 'Core terms, bilingual. Technical terms stay English; the explanation follows the language toggle.',
          uk: 'Базові терміни, двомовно. Технічні терміни лишаються англійською; пояснення йде за перемикачем мови.',
        })}
      </p>
      <div className="searchbox glossary-search">
        <span className="search-ic" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (highlight) setHighlight(undefined);
          }}
          placeholder={t(ui.searchPlaceholder)}
          aria-label={t(ui.search)}
        />
      </div>
      <dl className="glossary">
        {entries.map((g) => (
          <div
            className={cx('gloss-entry', highlight === g.term && 'gloss-entry--on')}
            key={g.term}
            ref={(el) => {
              if (el) refs.current.set(g.term, el);
              else refs.current.delete(g.term);
            }}
          >
            <dt className="mono">{g.term}</dt>
            <dd>
              {g.def[lang] || g.def.en}
              {g.seeAlso && g.seeAlso.length > 0 && (
                <span className="gloss-see dim"> → {g.seeAlso.join(', ')}</span>
              )}
            </dd>
          </div>
        ))}
        {entries.length === 0 && <p className="muted">{t(ui.searchNoResults)}</p>}
      </dl>
    </div>
  );
}
