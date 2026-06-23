import { useState } from 'react';
import { glossary } from '../../data/glossary';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';

export function GlossaryPage() {
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const entries = glossary
    .filter(
      (g) =>
        !needle ||
        g.term.toLowerCase().includes(needle) ||
        (g.def[lang] || g.def.en).toLowerCase().includes(needle),
    )
    .sort((a, b) => a.term.localeCompare(b.term));

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
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(ui.searchPlaceholder)}
          aria-label={t(ui.search)}
        />
      </div>
      <dl className="glossary">
        {entries.map((g) => (
          <div className="gloss-entry" key={g.term}>
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
