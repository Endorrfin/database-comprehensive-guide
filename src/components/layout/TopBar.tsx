import { useEffect, useRef, useState } from 'react';
import { LEVELS } from '../../data/meta'; // CHANGED (S19): lightweight meta (not concepts)
import type { Level } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import {
  hrefGlossary,
  hrefMap,
  hrefMentalModels,
  hrefModule,
  navigate,
} from '../../lib/hashRouter';
import { search } from '../../lib/search';
import type { SearchResult } from '../../lib/search';
import { cx } from '../../lib/utils';

const LEVEL_LABEL: Record<Level, typeof ui.beginner> = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
};

export function TopBar() {
  const { lang, toggle, t } = useLang();
  const { levelFilter, setLevelFilter, toggleSidebar } = useAppState();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [openResults, setOpenResults] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(q.trim() ? search(q, lang, 8) : []);
  }, [q, lang]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenResults(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const go = (r: SearchResult) => {
    navigate(hrefModule(r.moduleId, r.topicId));
    setQ('');
    setOpenResults(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn btn-icon hamburger"
          onClick={toggleSidebar}
          aria-label={t(ui.toggleSidebar)}
        >
          ☰
        </button>
        <a className="brand" href={hrefMap()}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <strong>{t(ui.brandTitle)}</strong>
            <span className="brand-sub">{t(ui.brandSubtitle)}</span>
          </span>
        </a>
      </div>

      <div className="topbar-search" ref={boxRef}>
        <div className="searchbox">
          <span className="search-ic" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={q}
            placeholder={t(ui.searchPlaceholder)}
            aria-label={t(ui.search)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpenResults(true);
            }}
            onFocus={() => setOpenResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0]);
              if (e.key === 'Escape') setOpenResults(false);
            }}
          />
        </div>
        {openResults && q.trim() !== '' && (
          <ul className="search-results" role="listbox">
            {results.length === 0 ? (
              <li className="search-empty muted">{t(ui.searchNoResults)}</li>
            ) : (
              results.map((r) => (
                <li key={`${r.moduleId}-${r.topicId ?? 'mod'}`}>
                  <button className="search-hit" onClick={() => go(r)} role="option" aria-selected="false">
                    <span className="search-hit-title">{r.title}</span>
                    <span className="search-hit-ctx dim">{r.context}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="topbar-right">
        <nav className="top-links" aria-label="Sections">
          <a href={hrefMap()}>{t(ui.landscapeMap)}</a>
          <a href={hrefMentalModels()}>{t(ui.mentalModels)}</a>
          <a href={hrefGlossary()}>{t(ui.glossary)}</a>
        </nav>

        <div className="levelseg" role="group" aria-label={t(ui.levelFilter)}>
          <button
            className={cx(levelFilter === 'all' && 'on')}
            onClick={() => setLevelFilter('all')}
          >
            {t(ui.allLevels)}
          </button>
          {LEVELS.map((lv) => (
            <button
              key={lv}
              className={cx('lvl', levelFilter === lv && 'on')}
              data-level={lv}
              onClick={() => setLevelFilter(lv)}
              title={t(LEVEL_LABEL[lv])}
            >
              {t(LEVEL_LABEL[lv])}
            </button>
          ))}
        </div>

        <button
          className="langtoggle"
          onClick={toggle}
          aria-label={t(ui.language)}
          title={t(ui.language)}
        >
          <span className={cx(lang === 'en' && 'on')}>EN</span>
          <span className="dim">/</span>
          <span className={cx(lang === 'uk' && 'on')}>UA</span>
        </button>
      </div>
    </header>
  );
}
