// CHANGED (S11): M22 — Sharding strategy sim (signature ★)
// Shows hash vs range sharding; monotonic IDs → visible hotspot in range mode.
import { useState, useCallback } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
// CHANGED (S23, Wave 2.2): hash/range routing extracted to the pure src/lib/sharding engine, shared
// with scripts/test-sharding.ts so the sim and its golden tests use one source of truth.
import { IDS, shardFor, type Strategy } from '../../lib/sharding';

type Loc = Localized;

const SHARD_NAMES: Loc[] = [
  { en: 'Shard 1', uk: 'Shard 1' },
  { en: 'Shard 2', uk: 'Shard 2' },
  { en: 'Shard 3', uk: 'Shard 3' },
];

const RANGE_LABELS: Loc[] = [
  { en: 'id < 1004', uk: 'id < 1004' },
  { en: '1004 ≤ id < 1007', uk: '1004 ≤ id < 1007' },
  { en: 'id ≥ 1007 (NEW)', uk: 'id ≥ 1007 (НОВІ)' },
];

const UI = {
  hashStrategy: { en: 'Hash (id % 3)', uk: 'Hash (id % 3)' },
  rangeStrategy: { en: 'Range (monotonic IDs)', uk: 'Range (монотонні ID)' },
  insert:   { en: 'Insert next', uk: 'Вставити наступний' },
  reset:    { en: 'Reset', uk: 'Скинути' },
  insertAll: { en: 'Insert all', uk: 'Вставити всі' },
  rows:     { en: 'rows', uk: 'рядків' },
  hot:      { en: 'HOT', uk: 'ГАРЯЧИЙ' },
  balanced: { en: 'balanced ✓', uk: 'збалансований ✓' },
  hotspot:  { en: 'all new writes → here (hotspot!)', uk: 'всі нові записи → сюди (hotspot!)' },
  outcome_hash: { en: 'Hash sharding distributes evenly — each shard gets exactly 3 rows.', uk: 'Hash sharding розподіляє рівномірно — кожен shard отримує рівно 3 рядки.' },
  outcome_range: { en: 'Range sharding with monotonic IDs: all 9 newest writes went to Shard 3 — the classic hotspot problem.', uk: 'Range sharding з монотонними ID: всі 9 останніх записів пішли до Shard 3 — класична проблема hotspot.' },
  strategy:  { en: 'Strategy', uk: 'Стратегія' },
  inserted:  { en: 'Inserted', uk: 'Вставлено' },
  id_label:  { en: 'id', uk: 'id' },
  shard_label: { en: '→ shard', uk: '→ shard' },
};

export function ShardingSim() {
  const { t } = useLang();

  const [strategy, setStrategy] = useState<Strategy>('hash');
  const [insertedCount, setInsertedCount] = useState(0);

  // Compute shard assignments for all inserted IDs
  const assignments = IDS.slice(0, insertedCount).map(id => ({
    id,
    shard: shardFor(id, strategy),
  }));

  // Per-shard row counts
  const counts = [0, 1, 2].map(s => assignments.filter(a => a.shard === s).length);
  const maxCount = Math.max(...counts, 1);

  // Last inserted
  const lastInsert = insertedCount > 0 ? assignments[insertedCount - 1] : null;

  const isHotspot = strategy === 'range' && insertedCount > 0;
  const hotShardIdx = 2; // Shard 3 (index 2) is always the hot shard in range mode

  const handleStrategy = (s: Strategy) => { setStrategy(s); setInsertedCount(0); };
  const handleInsert = useCallback(() => setInsertedCount(c => Math.min(c + 1, IDS.length)), []);
  const handleInsertAll = useCallback(() => setInsertedCount(IDS.length), []);
  const handleReset = useCallback(() => setInsertedCount(0), []);

  const done = insertedCount >= IDS.length;

  return (
    <div className="shard-root" role="region"
      aria-label={t({ en: 'Sharding strategy simulator', uk: 'Симулятор стратегії sharding' })}>

      {/* Strategy toggle */}
      <div className="shard-toggle" role="tablist"
        aria-label={t({ en: 'Sharding strategy', uk: 'Стратегія sharding' })}>
        {(['hash', 'range'] as Strategy[]).map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={strategy === s}
            className={`shard-tab${strategy === s ? ' shard-tab--active' : ''}`}
            onClick={() => handleStrategy(s)}
          >
            {t(s === 'hash' ? UI.hashStrategy : UI.rangeStrategy)}
          </button>
        ))}
      </div>

      {/* Shard columns */}
      <div className="shard-columns">
        {[0, 1, 2].map(si => {
          const count = counts[si];
          const isHot = isHotspot && si === hotShardIdx && count > 0;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={si} className={`shard-col${isHot ? ' shard-col--hot' : ''}`}>
              <div className="shard-col-name">
                {t(SHARD_NAMES[si])}
                {isHot && <span className="shard-hot-badge">{t(UI.hot)}</span>}
              </div>

              {/* Range label */}
              {strategy === 'range' && (
                <div className="shard-range-label">{t(RANGE_LABELS[si])}</div>
              )}

              {/* Bar */}
              <div className="shard-bar-wrap">
                <div
                  className={`shard-bar${isHot ? ' shard-bar--hot' : ''}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  aria-label={`${count} ${t(UI.rows)}`}
                />
              </div>

              {/* Count */}
              <div className="shard-count">
                {count} {t(UI.rows)}
              </div>

              {/* Hotspot warning */}
              {isHot && (
                <div className="shard-hotspot-warn">{t(UI.hotspot)}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Last insert indicator */}
      <div className="shard-last" aria-live="polite" aria-atomic="true">
        {lastInsert != null ? (
          <span>
            {t(UI.id_label)} <strong>{lastInsert.id}</strong>
            {' '}
            {t(UI.shard_label)} <strong>{t(SHARD_NAMES[lastInsert.shard])}</strong>
            {strategy === 'hash' && ` (${lastInsert.id} % 3 = ${lastInsert.shard === 0 ? 0 : lastInsert.shard})`}
          </span>
        ) : (
          <span style={{ color: 'var(--tx3)' }}>
            {t({ en: 'Click Insert to add rows', uk: 'Натисніть Insert для додавання рядків' })}
          </span>
        )}
      </div>

      {/* Inserted IDs list (compact chips) */}
      {insertedCount > 0 && (
        <div className="shard-chips">
          {assignments.map(({ id, shard }) => (
            <span
              key={id}
              className={`shard-chip shard-chip--s${shard}${
                lastInsert?.id === id ? ' shard-chip--last' : ''
              }`}
            >
              {id}→S{shard + 1}
            </span>
          ))}
        </div>
      )}

      {/* Outcome */}
      {done && (
        <div className={`shard-outcome${strategy === 'range' ? ' shard-outcome--warn' : ' shard-outcome--ok'}`}>
          {t(strategy === 'hash' ? UI.outcome_hash : UI.outcome_range)}
        </div>
      )}

      {/* Controls */}
      <div className="shard-controls">
        <button className="sim-btn" onClick={handleInsert} disabled={done}>
          {t(UI.insert)} {insertedCount < IDS.length ? `(id=${IDS[insertedCount]})` : ''}
        </button>
        <button className="sim-btn" onClick={handleInsertAll} disabled={done}>
          {t(UI.insertAll)}
        </button>
        <button className="sim-btn sim-btn--ghost" onClick={handleReset}>
          {t(UI.reset)}
        </button>
      </div>
    </div>
  );
}
