import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';

/*
 * N+1 query demo (M34, light/signature). Render a list of N authors with their books two ways:
 * LAZY loading fires 1 query for the authors + 1 per author (N+1 round-trips); EAGER loading pulls
 * everything in a single JOIN. Pick N and watch the query count and round-trip latency collapse.
 * The module's most common real-world trap made interactive. Toggle-driven, deterministic (no
 * animation loop → inherently prefers-reduced-motion safe); ARIA tablists + live region. SQL stays
 * English; only the explanation is bilingual. Round-trip model per M34 sources (connection cost).
 */
type Mode = 'lazy' | 'eager';
const RTT = 0.8; // ms per round-trip (network + a cheap indexed query)
const NS = [3, 25, 100];

const MODES: { key: Mode; label: Localized }[] = [
  { key: 'lazy', label: { en: 'Lazy (N+1)', uk: 'Lazy (N+1)' } },
  { key: 'eager', label: { en: 'Eager (JOIN)', uk: 'Eager (JOIN)' } },
];

const queriesFor = (mode: Mode, n: number) => (mode === 'lazy' ? n + 1 : 1);
const msFor = (mode: Mode, n: number) => +(queriesFor(mode, n) * RTT).toFixed(1);

export function NPlusOneSim() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('lazy');
  const [n, setN] = useState<number>(25);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const queries = queriesFor(mode, n);
  const lazyMs = msFor('lazy', n);
  const eagerMs = msFor('eager', n);
  const ms = mode === 'lazy' ? lazyMs : eagerMs;

  const status = useMemo(
    () =>
      `${t(MODES.find((m) => m.key === mode)!.label)} · ${n} ${t({ en: 'authors', uk: 'авторів' })} → ${queries} ${t({ en: 'queries', uk: 'запитів' })}, ≈ ${ms} ms`,
    [mode, n, queries, ms, t],
  );
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  // a few child rows to show, then a "× N" indicator
  const childPreview = Math.min(n, 4);

  return (
    <section className="sim nplus1-sim" aria-label="N plus one query demo">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Loading strategy">
          {MODES.map((m) => (
            <button key={m.key} role="tab" aria-selected={mode === m.key}
              className={mode === m.key ? 'seg-on' : ''} onClick={() => setMode(m.key)}>
              {t(m.label)}
            </button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Number of authors">
          {NS.map((opt) => (
            <button key={opt} role="tab" aria-selected={n === opt}
              className={n === opt ? 'seg-on' : ''} onClick={() => setN(opt)}>
              {opt}
            </button>
          ))}
        </div>
        <span className="dim nplus1-scenario">{t({ en: 'list authors + their books', uk: 'список авторів + їхні книги' })}</span>
      </div>

      {/* query log */}
      <div className="nplus1-log" aria-label="query log">
        {mode === 'lazy' ? (
          <>
            <div className="nplus1-q nplus1-q--parent mono">SELECT * FROM authors<span className="nplus1-tag">1 query → {n} rows</span></div>
            {Array.from({ length: childPreview }).map((_, i) => (
              <div key={i} className="nplus1-q nplus1-q--child mono">SELECT * FROM books WHERE author_id = {i + 1}</div>
            ))}
            {n > childPreview && <div className="nplus1-mult">… ×{n} {t({ en: 'one per author', uk: 'по одному на автора' })}</div>}
          </>
        ) : (
          <div className="nplus1-q nplus1-q--join mono">
            SELECT a.*, b.* FROM authors a LEFT JOIN books b ON b.author_id = a.id
            <span className="nplus1-tag">1 query → {t({ en: 'all rows', uk: 'усі рядки' })}</span>
          </div>
        )}
      </div>

      {/* stats */}
      <div className="nplus1-stats">
        <div className="nplus1-stat">
          <span className="nplus1-stat-n">{queries}</span>
          <span className="nplus1-stat-l">{t({ en: 'queries', uk: 'запитів' })}</span>
        </div>
        <div className="nplus1-stat">
          <span className="nplus1-stat-n">{queries}</span>
          <span className="nplus1-stat-l">{t({ en: 'round-trips', uk: 'round-trips' })}</span>
        </div>
        <div className="nplus1-stat">
          <span className="nplus1-stat-n">≈ {ms} ms</span>
          <span className="nplus1-stat-l">{t({ en: 'latency', uk: 'latency' })}</span>
        </div>
      </div>

      {/* comparison bars (both modes, current N) */}
      <div className="nplus1-bars">
        {(['lazy', 'eager'] as Mode[]).map((m) => {
          const mMs = msFor(m, n);
          const pct = Math.max(3, (mMs / lazyMs) * 100);
          return (
            <div key={m} className={`nplus1-bar${m === mode ? ' nplus1-bar--on' : ''}`}>
              <span className="nplus1-bar-label">{t(MODES.find((x) => x.key === m)!.label)}</span>
              <span className="nplus1-bar-track">
                <span className={`nplus1-bar-fill nplus1-bar-fill--${m}`} style={{ width: `${pct}%` }} />
              </span>
              <span className="nplus1-bar-val mono">{queriesFor(m, n)}q · {mMs} ms</span>
            </div>
          );
        })}
      </div>

      <div className={`nplus1-out ${mode === 'lazy' ? 'nplus1-out--warn' : 'nplus1-out--ok'}`}>
        {mode === 'lazy'
          ? t({ en: `${n} authors → ${queries} round-trips. Each query is fast, but they add up — and it grows with the data.`, uk: `${n} авторів → ${queries} round-trips. Кожен запит швидкий, але вони накопичуються — і це росте з даними.` })
          : t({ en: 'One JOIN returns everything in a single round-trip — constant, regardless of N.', uk: 'Один JOIN повертає все за один round-trip — стало, незалежно від N.' })}
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>{status}</p>
    </section>
  );
}
