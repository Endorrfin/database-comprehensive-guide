import { useState } from 'react';
import { families } from '../../data/families';
import type { Family } from '../../data/families';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule, navigate } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';

/*
 * ★ Embedded families map (M2). A compact, clickable version of the landing's Landscape
 * Map — reuses the shared data/families.ts so the two can never drift. Pick a family →
 * see when it fits, its engines, and jump straight into the module. Keyboard + ARIA.
 */
const LEVEL_LABEL = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
} as const;

export function FamiliesMap() {
  const { t } = useLang();
  const [sel, setSel] = useState<Family | null>(null);

  return (
    <section className="sim fammap" aria-label="Database families map">
      <div className="fammap-grid" role="list">
        {families.map((f) => (
          <button
            key={f.id}
            role="listitem"
            className={cx('fammap-node', sel?.id === f.id && 'on')}
            style={{ ['--fam' as string]: f.color }}
            aria-pressed={sel?.id === f.id}
            onClick={() => setSel((cur) => (cur?.id === f.id ? null : f))}
          >
            <span className="fammap-dot" />
            <span className="fammap-name">{t(f.name)}</span>
            <span className="fammap-eng dim">{f.engines.join(' · ')}</span>
          </button>
        ))}
      </div>

      <div className="fammap-detail" aria-live="polite">
        {sel ? (
          <>
            <h4 style={{ color: sel.color }}>{t(sel.name)}</h4>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {t(sel.when)}
            </p>
            <div className="fam-chips">
              <span className="chip badge-level" data-level={sel.level}>
                {t(LEVEL_LABEL[sel.level])}
              </span>
              {sel.engines.map((e) => (
                <span className="chip" key={e}>
                  {e}
                </span>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => navigate(hrefModule(sel.moduleId))}>
              {t({ en: 'Open the module', uk: 'Відкрити модуль' })} →
            </button>
          </>
        ) : (
          <span className="muted">
            {t({
              en: 'Pick a family to see when it fits, its engines, and where to read more.',
              uk: 'Оберіть родину, щоб побачити, коли вона пасує, її движки та де читати далі.',
            })}
          </span>
        )}
      </div>
    </section>
  );
}
