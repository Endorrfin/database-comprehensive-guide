import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ Window-frame stepper (M10). Promotes the static `window-frame` figure into an interactive:
 * step a window's frame across ordered rows and watch a running aggregate fill in per row. Two
 * toggles teach the two subtleties:
 *   • Frame mode ROWS vs the default RANGE … CURRENT ROW — on TIED order-by values, RANGE lumps
 *     the tied peers together (they share one frame end → identical totals), while ROWS counts
 *     only up to the physical current row. This is the most-missed window-function fact.
 *   • PARTITION BY on/off — with PARTITION BY the running total RESETS at each partition boundary.
 * Every input row is kept (unlike GROUP BY). Deterministic, click-any-row + play/pause/step +
 * reduced-motion fallback (Play hidden) + ARIA live region, mirroring AcidWalSim. SQL/identifiers
 * stay English; only explanation is bilingual.
 */
type WRow = { part: 'West' | 'East'; k: number; amt: number };
type Mode = 'rows' | 'range';

// Ordered by k within each partition; ties at West k=2 and East k=1 drive the ROWS↔RANGE contrast.
const ROWS: WRow[] = [
  { part: 'West', k: 1, amt: 100 },
  { part: 'West', k: 2, amt: 50 },
  { part: 'West', k: 2, amt: 80 }, // tie with the row above (k=2)
  { part: 'West', k: 3, amt: 40 },
  { part: 'East', k: 1, amt: 60 },
  { part: 'East', k: 1, amt: 90 }, // tie with the row above (k=1)
];

function partitionRange(i: number, partitionOn: boolean): [number, number] {
  if (!partitionOn) return [0, ROWS.length - 1];
  let s = i;
  let e = i;
  while (s > 0 && ROWS[s - 1].part === ROWS[i].part) s--;
  while (e < ROWS.length - 1 && ROWS[e + 1].part === ROWS[i].part) e++;
  return [s, e];
}

function frameSet(i: number, mode: Mode, partitionOn: boolean): Set<number> {
  const [ps, pe] = partitionRange(i, partitionOn);
  const set = new Set<number>();
  if (mode === 'rows') {
    for (let j = ps; j <= i; j++) set.add(j);
  } else {
    // RANGE UNBOUNDED PRECEDING AND CURRENT ROW → all peers with k <= current.k in the partition.
    for (let j = ps; j <= pe; j++) if (ROWS[j].k <= ROWS[i].k) set.add(j);
  }
  return set;
}

function runningTotal(i: number, mode: Mode, partitionOn: boolean): number {
  let sum = 0;
  for (const j of frameSet(i, mode, partitionOn)) sum += ROWS[j].amt;
  return sum;
}

export function WindowFrameSim() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('range');
  const [partitionOn, setPartitionOn] = useState(true);
  const [idx, setIdx] = useState(0);
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

  const atEnd = idx >= ROWS.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, ROWS.length - 1)), 1400);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, ROWS.length - 1)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const frame = useMemo(() => frameSet(idx, mode, partitionOn), [idx, mode, partitionOn]);
  const value = useMemo(() => runningTotal(idx, mode, partitionOn), [idx, mode, partitionOn]);
  const cur = ROWS[idx];

  // Does RANGE pull in a tied peer that sits *below* the current row? (the teachable difference)
  const tieAhead = useMemo(() => {
    if (mode !== 'range') return false;
    const [, pe] = partitionRange(idx, partitionOn);
    for (let j = idx + 1; j <= pe; j++) if (ROWS[j].k === cur.k) return true;
    return false;
  }, [mode, partitionOn, idx, cur.k]);

  const frameText = mode === 'rows' ? 'ROWS UNBOUNDED PRECEDING' : 'RANGE UNBOUNDED PRECEDING';
  const over = `OVER (${partitionOn ? 'PARTITION BY region ' : ''}ORDER BY k ${frameText} AND CURRENT ROW)`;

  const status = useMemo(
    () => `${idx + 1}/${ROWS.length} · ${mode.toUpperCase()}${partitionOn ? ' · PARTITION BY region' : ''} → running_total = ${value}`,
    [idx, mode, partitionOn, value],
  );
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim wf" aria-label="Window-frame stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Frame mode">
          <button role="tab" aria-selected={mode === 'range'} className={mode === 'range' ? 'seg-on' : ''} onClick={() => setMode('range')}>
            RANGE (default)
          </button>
          <button role="tab" aria-selected={mode === 'rows'} className={mode === 'rows' ? 'seg-on' : ''} onClick={() => setMode('rows')}>
            ROWS
          </button>
        </div>
        <div className="seg" role="tablist" aria-label="Partitioning">
          <button role="tab" aria-selected={partitionOn} className={partitionOn ? 'seg-on' : ''} onClick={() => setPartitionOn(true)}>
            PARTITION BY
          </button>
          <button role="tab" aria-selected={!partitionOn} className={!partitionOn ? 'seg-on' : ''} onClick={() => setPartitionOn(false)}>
            {t({ en: 'no partition', uk: 'без partition' })}
          </button>
        </div>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({idx + 1}/{ROWS.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <code className="wf-over mono">sum(amount) {over}</code>

      <div className="wf-table" role="table" aria-label="Window rows">
        <div className="wf-row wf-row--head" role="row">
          <span role="columnheader">region</span>
          <span role="columnheader">k (ORDER BY)</span>
          <span role="columnheader">amount</span>
          <span role="columnheader">running_total</span>
        </div>
        {ROWS.map((r, j) => {
          const visited = j <= idx;
          const inFrame = frame.has(j);
          const isCur = j === idx;
          const newPart = j > 0 && partitionOn && ROWS[j - 1].part !== r.part;
          return (
            <button
              key={j}
              type="button"
              role="row"
              className={cx('wf-row', isCur && 'wf-row--cur', inFrame && 'wf-row--frame', newPart && 'wf-row--newpart')}
              onClick={() => setIdx(j)}
              aria-current={isCur ? 'true' : undefined}
            >
              <span role="cell" className="wf-part" data-part={r.part}>{r.part}</span>
              <span role="cell" className="mono">{r.k}</span>
              <span role="cell" className="mono">{r.amt}</span>
              <span role="cell" className="wf-total mono">
                {visited ? runningTotal(j, mode, partitionOn) : '·'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="wf-note" role="status">
        <span>
          {t({ en: 'Current row', uk: 'Поточний рядок' })}: <b>{cur.part}</b>, k={cur.k}, amount={cur.amt} →{' '}
          {t({ en: 'frame of', uk: 'frame з' })} <b>{frame.size}</b> {t({ en: 'row(s)', uk: 'рядк(ів)' })},{' '}
          running_total = <b className="mono">{value}</b>.
        </span>{' '}
        {tieAhead && (
          <span className="wf-tie">
            {t({
              en: 'RANGE includes the tied peer below (same k) — both tied rows get this same total. ROWS would not.',
              uk: 'RANGE включає рівного сусіда нижче (той самий k) — обидва рівні рядки отримують цю саму суму. ROWS — ні.',
            })}
          </span>
        )}
        {!partitionOn && idx > 0 && (
          <span className="wf-tie dim">
            {t({ en: 'No PARTITION BY → one running total across all rows (no reset).', uk: 'Без PARTITION BY → одна наскрізна сума по всіх рядках (без скидання).' })}
          </span>
        )}
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span className="dim">
          {t({
            en: 'A window function keeps every row and computes over a frame. With ORDER BY, the default frame is RANGE … CURRENT ROW — it includes tied peers; switch to ROWS to count only up to the physical row. PARTITION BY restarts the total per group.',
            uk: 'Window-функція зберігає кожен рядок і рахує по frame. З ORDER BY дефолтний frame — RANGE … CURRENT ROW — він включає рівних сусідів; перемкніть на ROWS, щоб рахувати лише до фізичного рядка. PARTITION BY перезапускає суму на кожну групу.',
          })}
        </span>
      </div>
    </section>
  );
}
