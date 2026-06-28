import { useEffect, useRef, useState } from 'react';
import { LEVELS } from '../../data/meta'; // CHANGED (S19): lightweight meta (not concepts)
import type { Level } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import {
  hrefFlashcards,
  hrefGlossary,
  hrefMap,
  hrefMentalModels,
  hrefQuiz,
  navigate,
} from '../../lib/hashRouter';
import { search } from '../../lib/search';
import type { SearchKind, SearchResult } from '../../lib/search';
import { cx } from '../../lib/utils';

const LEVEL_LABEL: Record<Level, typeof ui.beginner> = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
};

const KIND_LABEL: Record<SearchKind, typeof ui.searchKindModule> = {
  module: ui.searchKindModule,
  topic: ui.searchKindTopic,
  glossary: ui.searchKindGlossary,
};

/** Render a title with its matched span wrapped in <mark> for highlight. */
function highlight(title: string, match?: [number, number]) {
  if (!match) return title;
  const [s, e] = match;
  return (
    <>
      {title.slice(0, s)}
      <mark className="search-mark">{title.slice(s, e)}</mark>
      {title.slice(e)}
    </>
  );
}

export function TopBar() {
  const { lang, toggle, t } = useLang();
  const { levelFilter, setLevelFilter, toggleSidebar, themeMode, setThemeMode } = useAppState();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [openResults, setOpenResults] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(q.trim() ? search(q, lang, 8) : []);
    setActive(0);
  }, [q, lang]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenResults(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Keep the active option scrolled into view as the user arrows through results.
  useEffect(() => {
    if (openResults) document.getElementById(`search-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, openResults]);

  const go = (r: SearchResult) => {
    navigate(r.href);
    setQ('');
    setOpenResults(false);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenResults(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[active]) go(results[active]);
    } else if (e.key === 'Escape') {
      setOpenResults(false);
    }
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
            role="combobox"
            aria-expanded={openResults && results.length > 0}
            aria-controls="search-listbox"
            aria-activedescendant={
              openResults && results[active] ? `search-opt-${active}` : undefined
            }
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value);
              setOpenResults(true);
            }}
            onFocus={() => setOpenResults(true)}
            onKeyDown={onKeyDown}
          />
        </div>
        {openResults && q.trim() !== '' && (
          <ul className="search-results" role="listbox" id="search-listbox">
            {results.length === 0 ? (
              <li className="search-empty muted">{t(ui.searchNoResults)}</li>
            ) : (
              results.map((r, i) => (
                <li key={`${r.kind}-${r.href}`}>
                  <button
                    id={`search-opt-${i}`}
                    className={cx('search-hit', i === active && 'search-hit--active')}
                    onClick={() => go(r)}
                    onMouseEnter={() => setActive(i)}
                    role="option"
                    aria-selected={i === active}
                  >
                    <span className="search-hit-main">
                      <span className={cx('search-kind', `search-kind--${r.kind}`)}>
                        {t(KIND_LABEL[r.kind])}
                      </span>
                      <span className="search-hit-title">{highlight(r.title, r.match)}</span>
                    </span>
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
          <a href={hrefFlashcards()}>{t(ui.flashcards)}</a>
          <a href={hrefQuiz()}>{t(ui.quiz)}</a>
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

        <div className="themeseg" role="radiogroup" aria-label={t(ui.theme)}>
          {(
            [
              ['system', '◐', ui.themeSystem],
              ['dark', '☾', ui.themeDark],
              ['light', '☼', ui.themeLight],
            ] as const
          ).map(([mode, glyph, label]) => (
            <button
              key={mode}
              role="radio"
              aria-checked={themeMode === mode}
              className={cx('themeseg-btn', themeMode === mode && 'on')}
              onClick={() => setThemeMode(mode)}
              title={t(label)}
              aria-label={t(label)}
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
