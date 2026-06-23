import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ Query-lifecycle stepper (M5, signature). A fixed SQL statement walks the real
 * PostgreSQL pipeline — Parser → Rewriter → Planner/Optimizer → Executor → Storage →
 * Result (postgresql.org/docs/current/query-path.html). One toggle — "is there an index
 * on the filter column?" — flips the planner's chosen path between Seq Scan and Index
 * Scan and changes the pages read, the payoff of "same SQL, many physical plans" (M5.2).
 * Deterministic, no engine; play/pause/step + reduced-motion fallback + ARIA, like BTreeSim.
 */
type StageId = 'sql' | 'parser' | 'rewriter' | 'planner' | 'executor' | 'storage' | 'result';

type Stage = {
  id: StageId;
  label: string; // chip text — a technical term, stays English in both languages
  accent: string; // CSS var
  job: Localized; // one-line "what this stage does"
};

const STAGES: Stage[] = [
  {
    id: 'sql',
    label: 'SQL',
    accent: 'var(--c-query)',
    job: { en: 'The text you send — what you want, not how to get it.', uk: 'Текст, який ви надсилаєте — що хочете, а не як це дістати.' },
  },
  {
    id: 'parser',
    label: 'Parser',
    accent: 'var(--c-query)',
    job: { en: 'Check the syntax, build a query tree.', uk: 'Перевірити синтаксис, побудувати query tree.' },
  },
  {
    id: 'rewriter',
    label: 'Rewriter',
    accent: 'var(--accent)',
    job: { en: 'Apply rules; expand any views into their base tables.', uk: 'Застосувати rules; розгорнути будь-які views у їхні base tables.' },
  },
  {
    id: 'planner',
    label: 'Planner',
    accent: 'var(--c-storage)',
    job: { en: 'Estimate the cost of each path; pick the cheapest plan.', uk: 'Оцінити cost кожного шляху; обрати найдешевший plan.' },
  },
  {
    id: 'executor',
    label: 'Executor',
    accent: 'var(--c-commit)',
    job: { en: 'Pull rows up through the plan tree, one at a time.', uk: 'Тягнути рядки вгору через plan tree, по одному.' },
  },
  {
    id: 'storage',
    label: 'Storage',
    accent: 'var(--c-storage)',
    job: { en: 'Read the pages the plan asks for, from heap and indexes.', uk: 'Читати pages, які просить plan, з heap та indexes.' },
  },
  {
    id: 'result',
    label: 'Result',
    accent: 'var(--c-commit)',
    job: { en: 'Hand the finished, ordered rows back to the client.', uk: 'Повернути готові, відсортовані рядки клієнту.' },
  },
];

const SQL_TEXT = `SELECT name, total
FROM orders
WHERE customer_id = 42
ORDER BY total DESC;`;

/** The per-stage artifact (monospace) + a localized note. Plan keywords stay English. */
function artifact(id: StageId, indexed: boolean): string {
  switch (id) {
    case 'sql':
      return SQL_TEXT;
    case 'parser':
      return [
        'SelectStmt',
        '├─ target  → name, total',
        '├─ from    → orders',
        '├─ where   → customer_id = 42',
        '└─ sortBy  → total DESC',
      ].join('\n');
    case 'rewriter':
      return ['(no view or rule to apply)', 'query tree → passed through unchanged'].join('\n');
    case 'planner':
      return indexed
        ? [
            'paths for orders: Seq Scan  vs  Index Scan',
            'cheapest → Index Scan',
            '',
            'Sort  (key: total DESC)',
            '└─ Index Scan  using orders_customer_id_idx',
            '     Cond: customer_id = 42',
            '   est. rows=8   cost≈12',
          ].join('\n')
        : [
            'paths for orders: Seq Scan  (no index exists)',
            'only choice → Seq Scan',
            '',
            'Sort  (key: total DESC)',
            '└─ Seq Scan on orders',
            '     Filter: customer_id = 42',
            '   est. rows=8   cost≈1300',
          ].join('\n');
    case 'executor':
      return indexed
        ? [
            'Sort  ⇽ asks its child for rows',
            '└─ Index Scan ⇾ emits matches one by one',
            '',
            'rows flow UP the tree, lazily (pull model)',
          ].join('\n')
        : [
            'Sort  ⇽ asks its child for rows',
            '└─ Seq Scan ⇾ emits surviving rows one by one',
            '',
            'rows flow UP the tree, lazily (pull model)',
          ].join('\n');
    case 'storage':
      return indexed
        ? [
            'descend the B-Tree → leaf for customer_id = 42',
            'fetch ~8 matching rows from the heap',
            'pages read ≈ 3',
          ].join('\n')
        : [
            'scan the whole heap of orders',
            'discard every row where customer_id ≠ 42',
            'pages read ≈ 1,300',
          ].join('\n');
    case 'result':
      return [
        ' name      | total',
        '-----------+-------',
        ' Priya     |  980',
        ' Lee       |  640',
        ' …8 rows, ordered by total DESC',
      ].join('\n');
    default:
      return '';
  }
}

/** Stage-specific note shown above the artifact (localized). */
const NOTE: Record<StageId, Localized> = {
  sql: { en: 'A declarative request. Nothing about indexes or scan order is stated — that is the engine’s job.', uk: 'Декларативний запит. Жодного слова про indexes чи порядок scan — це робота движка.' },
  parser: { en: 'Pure syntax + shape. A typo here is the “syntax error” you see; the tree means nothing has run yet.', uk: 'Лише синтаксис і форма. Друкарська помилка тут — це ваш «syntax error»; дерево означає, що ще нічого не виконувалось.' },
  rewriter: { en: 'Where views become their base tables and rules/RLS rewrite the tree. Here, nothing to expand.', uk: 'Тут views стають своїми base tables, а rules/RLS переписують дерево. Тут розгортати нічого.' },
  planner: { en: 'The one stage where the index matters: it changes which path is cheapest, and so the whole plan.', uk: 'Єдина стадія, де index важить: він змінює, який шлях найдешевший, а отже й весь plan.' },
  executor: { en: 'Same Volcano pull model either way — only the leaf scan node differs.', uk: 'Та сама Volcano pull-модель в обох випадках — різниться лише листковий scan-вузол.' },
  storage: { en: 'Here the toggle pays off: a few index pages, or the entire table. This is where the time goes.', uk: 'Тут toggle і дає ефект: кілька index-pages чи вся таблиця. Саме сюди йде час.' },
  result: { en: 'Identical rows in both cases — the index changes the cost, never the answer.', uk: 'Однакові рядки в обох випадках — index змінює cost, а не відповідь.' },
};

type Metrics = { plan: string; rows: number; pages: number };
function metrics(indexed: boolean): Metrics {
  return indexed
    ? { plan: 'Index Scan', rows: 8, pages: 3 }
    : { plan: 'Seq Scan', rows: 8, pages: 1300 };
}
const MAX_PAGES = 1300;

export function QueryLifecycleSim() {
  const { t } = useLang();
  const [stageIdx, setStageIdx] = useState(0);
  const [indexed, setIndexed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const atEnd = stageIdx >= STAGES.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)), 1100);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, stageIdx]);

  const step = useCallback(() => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setStageIdx(0);
  }, []);

  const stage = STAGES[stageIdx];
  const m = useMemo(() => metrics(indexed), [indexed]);
  const art = useMemo(() => artifact(stage.id, indexed), [stage.id, indexed]);

  // Once the planner has run, the chosen plan is "known" — surface it on later stages.
  const planKnown = stageIdx >= 3;

  const status = useMemo(() => {
    const where = `${stageIdx + 1}/${STAGES.length} · ${stage.label}`;
    return `${where} — ${t(stage.job)}`;
  }, [stageIdx, stage, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim qlife" aria-label="Query lifecycle stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Index on customer_id">
          <button
            role="tab"
            aria-selected={!indexed}
            className={!indexed ? 'seg-on' : ''}
            onClick={() => setIndexed(false)}
          >
            {t({ en: 'No index', uk: 'Без index' })}
          </button>
          <button
            role="tab"
            aria-selected={indexed}
            className={indexed ? 'seg-on' : ''}
            onClick={() => setIndexed(true)}
          >
            {t({ en: 'Index on customer_id', uk: 'Index на customer_id' })}
          </button>
        </div>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({stageIdx + 1}/{STAGES.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <ol className="qlife-pipe" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const done = i < stageIdx;
          const on = i === stageIdx;
          return (
            <li key={s.id} className="qlife-pipe-item">
              <button
                className={cx('qlife-stage', on && 'on', done && 'done')}
                style={{ ['--st' as string]: s.accent }}
                aria-current={on ? 'step' : undefined}
                onClick={() => {
                  setPlaying(false);
                  setStageIdx(i);
                }}
              >
                <span className="qlife-num">{i + 1}</span>
                <span className="qlife-label">{s.label}</span>
              </button>
              {i < STAGES.length - 1 && (
                <span className="qlife-arrow" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="qlife-body">
        <div className="qlife-detail">
          <h4 style={{ color: stage.accent }}>
            <span className="qlife-detail-num">{stageIdx + 1}</span> {stage.label}
          </h4>
          <p className="qlife-job">{t(stage.job)}</p>
          <p className="qlife-note muted">{t(NOTE[stage.id])}</p>
          <pre className="qlife-art mono">
            <code>{art}</code>
          </pre>
        </div>

        <aside className="qlife-cost" aria-label="Chosen plan and cost">
          <div className="qlife-cost-head dim">
            {planKnown
              ? t({ en: 'Chosen plan', uk: 'Обраний plan' })
              : t({ en: 'Plan — not chosen yet', uk: 'Plan — ще не обрано' })}
          </div>
          <div className={cx('qlife-plan', planKnown && 'live')} style={{ ['--st' as string]: indexed ? 'var(--c-storage)' : 'var(--c-analytics)' }}>
            {planKnown ? m.plan : '—'}
          </div>
          <dl className="qlife-metrics">
            <div>
              <dt className="dim">{t({ en: 'Rows matched', uk: 'Знайдено рядків' })}</dt>
              <dd className="mono">{planKnown ? `~${m.rows}` : '—'}</dd>
            </div>
            <div>
              <dt className="dim">{t({ en: 'Pages read', uk: 'Прочитано pages' })}</dt>
              <dd className="mono">{planKnown ? `~${m.pages.toLocaleString('en-US')}` : '—'}</dd>
            </div>
          </dl>
          <div className="qlife-meter" aria-hidden="true">
            <div
              className="qlife-meter-fill"
              style={{
                width: planKnown ? `${Math.max(2, (m.pages / MAX_PAGES) * 100)}%` : '0%',
                background: indexed ? 'var(--c-commit)' : 'var(--c-danger)',
              }}
            />
          </div>
          <p className="qlife-cost-foot dim">
            {t({
              en: 'Same query, same rows — the index changes only the work, not the answer.',
              uk: 'Той самий запит, ті самі рядки — index змінює лише роботу, а не відповідь.',
            })}
          </p>
        </aside>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          {t({ en: 'Click any stage to jump', uk: 'Клацніть стадію, щоб перейти' })}
        </span>
        <span className="dim">
          {t({ en: 'pipeline: postgresql.org/docs — “The Path of a Query”', uk: 'pipeline: postgresql.org/docs — «The Path of a Query»' })}
        </span>
      </div>
    </section>
  );
}
