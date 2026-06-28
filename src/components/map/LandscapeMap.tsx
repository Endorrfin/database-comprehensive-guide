import { useState } from 'react';
// CHANGED (S19): the landing reads lightweight meta (title/level/signature only), so the heavy
// concepts.ts content chunk is deferred until a real module view — not pulled on first paint.
import { getModuleMeta as getModule, modulesBySectionMeta as modulesBySection, sectionsMeta as sections } from '../../data/meta';
// CHANGED (S2): families now come from the shared single source of truth (data/families.ts),
// reused by both this landing and M2's embedded interactive map — they can never drift apart.
import { families } from '../../data/families';
import type { Family } from '../../data/families';
import type { Level } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import { hrefModule, navigate } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';
import { Drawer } from './Drawer';

// CHANGED (S2): the guided beginner→staff route surfaced on the landing ("Start here" polish).
const START_PATH: string[] = [
  'm1-what-is-a-database',
  'm2-landscape',
  'm4-relational-model',
  'm3-sql-vs-nosql',
  'm5-anatomy-of-a-query',
  'm13-btree',
  'm17-acid-wal',
  'm19-mvcc',
];

const LEVELS: Level[] = ['beginner', 'middle', 'senior', 'staff'];
const LEVEL_LABEL: Record<Level, (typeof ui)['beginner']> = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
};

export function LandscapeMap() {
  const { t, lang } = useLang();
  // CHANGED (S2): reuse the GLOBAL level filter so the landing and the top bar stay in sync.
  const { levelFilter, setLevelFilter } = useAppState();
  const [selected, setSelected] = useState<Family | null>(null);

  const matches = (lv: Level) => levelFilter === 'all' || lv === levelFilter;

  return (
    <div className="content map">
      <section className="map-hero">
        <p className="map-eyebrow">{t(ui.brandSubtitle)}</p>
        <h1>{t({ en: 'How databases actually work', uk: 'Як насправді працюють бази даних' })}</h1>
        <p className="map-lede">
          {t({
            en: 'An internals-first, bilingual deep dive — from the relational model to B-Tree and LSM storage, transactions, distribution, and the modern vector & distributed-SQL wave. Start anywhere; every module stands on its own.',
            uk: 'Поглиблення з фокусом на internals, двомовне — від реляційної моделі до B-Tree та LSM storage, транзакцій, розподілу й сучасної хвилі vector та distributed-SQL. Починайте будь-де; кожен модуль самодостатній.',
          })}
        </p>
        <div className="map-cta">
          <a className="btn btn-primary" href={hrefModule('m1-what-is-a-database')}>
            {t(ui.startHere)} →
          </a>
          <a className="btn" href={hrefModule('m13-btree')}>
            ★ {t({ en: 'Open the B-Tree visualizer', uk: 'Відкрити B-Tree visualizer' })}
          </a>
        </div>
      </section>

      {/* CHANGED (S2): guided "Start here" learning path — beginner → staff, level-coded. */}
      <section className="map-path">
        <h2>{t(ui.suggestedPath)}</h2>
        <p className="muted">{t(ui.suggestedPathLede)}</p>
        <ol className="path-row">
          {START_PATH.map((id, i) => {
            const m = getModule(id);
            if (!m) return null;
            return (
              <li className="path-step" key={id}>
                <a className="path-node" href={hrefModule(id)}>
                  <span className="path-num mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="path-title">{t(m.title)}</span>
                  <span className="path-meta">
                    <span className="path-level" data-level={m.level} title={t(LEVEL_LABEL[m.level])} />
                    {m.signature && <span className="star">★</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="map-families">
        {/* CHANGED (S2): section header now carries a level filter that mirrors the top bar. */}
        <div className="map-sec-head">
          <div>
            <h2>{t({ en: 'The families', uk: 'Родини' })}</h2>
            <p className="muted">
              {t({
                en: 'Fit the data model to the access pattern. Tap a family to see when it fits.',
                uk: 'Підбирайте модель даних під access pattern. Торкніться родини, щоб побачити, коли вона пасує.',
              })}
            </p>
          </div>
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
        </div>
        <div className="fam-grid">
          {families.map((f) => (
            <button
              key={f.id}
              className={cx('fam-card', !matches(f.level) && 'dimmed')}
              style={{ ['--fam' as string]: f.color }}
              onClick={() => setSelected(f)}
              aria-pressed={selected?.id === f.id}
            >
              <span className="fam-top">
                <span className="fam-dot" />
                <span className="fam-level" data-level={f.level} title={t(LEVEL_LABEL[f.level])} />
              </span>
              <span className="fam-name">{t(f.name)}</span>
              {/* CHANGED (S2): refined card — a "when it fits" peek above the engine list. */}
              <span className="fam-when">{t(f.when)}</span>
              <span className="fam-engines dim">{f.engines.join(' · ')}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="map-overview">
        <h2>{t({ en: 'All modules', uk: 'Усі модулі' })}</h2>
        <div className="ov-grid">
          {sections.map((s) => (
            <div className="ov-section" key={s.id}>
              <div className="ov-head" style={{ ['--sec' as string]: s.accent }}>
                <span className="ov-roman" style={{ color: s.accent }}>
                  {s.roman}
                </span>
                <span>{t(s.name)}</span>
              </div>
              <ul className="ov-mods">
                {modulesBySection(s.id).map((m) => (
                  <li key={m.id}>
                    {/* CHANGED (S2): modules outside the chosen level dim, matching the sidebar. */}
                    <a className={cx('ov-mod', !matches(m.level) && 'dimmed')} href={hrefModule(m.id)}>
                      <span className="mono dim">{String(m.num).padStart(2, '0')}</span>
                      <span className="ov-mod-title">{t(m.title)}</span>
                      <span className="ov-mod-level" data-level={m.level} />
                      {m.signature && <span className="star">★</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.name[lang] || selected.name.en : ''}
        accent={selected?.color ?? 'var(--accent)'}
      >
        {selected && (
          <div className="fam-detail">
            <p>{t(selected.when)}</p>
            <div className="fam-chips">
              {selected.engines.map((e) => (
                <span className="chip" key={e}>
                  {e}
                </span>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigate(hrefModule(selected.moduleId));
                setSelected(null);
              }}
            >
              {t({ en: 'Open the module', uk: 'Відкрити модуль' })} →
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
