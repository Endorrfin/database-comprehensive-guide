import { useCallback, useEffect, useState } from 'react';
// CHANGED (S19): nav reads lightweight meta (not concepts) so module content stays out of the index chunk.
import { modulesBySectionMeta as modulesBySection, sectionsMeta as sections } from '../../data/meta';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import {
  hrefDecide,
  hrefFlashcards,
  hrefGlossary,
  hrefMap,
  hrefMentalModels,
  hrefModule,
  hrefQuiz,
  useRoute,
} from '../../lib/hashRouter';
import type { Route } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';

// CHANGED (S22): the page links also live in the sidebar so the mobile drawer (which replaces the
// hidden top-links < 900px) can reach Overview / Mental Models / Flashcards / Quiz / Glossary / Picker.
const PAGE_LINKS: { name: Route['name']; href: string; label: (typeof ui)[keyof typeof ui] }[] = [
  { name: 'map', href: hrefMap(), label: ui.landscapeMap },
  { name: 'mentalModels', href: hrefMentalModels(), label: ui.mentalModels },
  { name: 'flashcards', href: hrefFlashcards(), label: ui.flashcards },
  { name: 'quiz', href: hrefQuiz(), label: ui.quiz },
  { name: 'glossary', href: hrefGlossary(), label: ui.glossary },
  { name: 'decide', href: hrefDecide(), label: ui.decide },
];

const OPEN_KEY = 'dbguide.sidebar';

function loadOpen(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

export function Sidebar() {
  const route = useRoute();
  const { t } = useLang();
  const { levelFilter, sidebarOpen, closeSidebar } = useAppState();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(loadOpen);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(openMap));
    } catch {
      /* ignore */
    }
  }, [openMap]);

  const activeModule = route.name === 'module' ? route.moduleId : null;
  const isOpen = (id: string) => openMap[id] !== false; // default open
  const toggle = useCallback(
    (id: string) => setOpenMap((m) => ({ ...m, [id]: m[id] === false })),
    [],
  );

  return (
    <>
      <div
        className={cx('sidebar-scrim', sidebarOpen && 'show')}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <aside className={cx('sidebar', sidebarOpen && 'open')} aria-label="Modules">
        <nav className="side-nav">
          <ul className="side-pages">
            {PAGE_LINKS.map((p) => (
              <li key={p.name}>
                <a
                  className={cx('side-page', route.name === p.name && 'active')}
                  href={p.href}
                  onClick={closeSidebar}
                  aria-current={route.name === p.name ? 'page' : undefined}
                >
                  {t(p.label)}
                </a>
              </li>
            ))}
          </ul>
          {sections.map((s) => {
            const mods = modulesBySection(s.id);
            const open = isOpen(s.id);
            return (
              <div className="side-section" key={s.id}>
                <button
                  className="side-head"
                  onClick={() => toggle(s.id)}
                  aria-expanded={open}
                  style={{ ['--sec' as string]: s.accent }}
                >
                  <span className="side-roman" style={{ color: s.accent }}>
                    {s.roman}
                  </span>
                  <span className="side-name">{t(s.name)}</span>
                  <span className={cx('side-caret', open && 'open')}>›</span>
                </button>
                {open && (
                  <ul className="side-mods">
                    {mods.map((m) => {
                      const dim = levelFilter !== 'all' && m.level !== levelFilter;
                      const active = m.id === activeModule;
                      return (
                        <li key={m.id}>
                          <a
                            className={cx('side-mod', active && 'active', dim && 'dim-mod')}
                            href={hrefModule(m.id)}
                            onClick={closeSidebar}
                            aria-current={active ? 'page' : undefined}
                          >
                            <span className="side-mod-num mono">{String(m.num).padStart(2, '0')}</span>
                            <span className="side-mod-title">{t(m.title)}</span>
                            {m.signature && (
                              <span className="side-star" title="interactive">
                                ★
                              </span>
                            )}
                            <span
                              className="side-mod-level"
                              data-level={m.level}
                              aria-hidden="true"
                            />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
