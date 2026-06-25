// CHANGED (S11): M21 — Replication & failover sim (signature ★)
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';

type Loc = Localized;

type Mode = 'async' | 'sync';
type PrimaryState = 'active' | 'crashed';
type StandbyState = 'standby' | 'promoted';

interface Frame {
  label: Loc;
  detail: Loc;
  primaryLsn: number;
  aLsn: number;
  bLsn: number;
  primaryState: PrimaryState;
  aState: StandbyState;
  bState: StandbyState;
  walArrow?: boolean;   // primary → A WAL streaming
  ackArrow?: boolean;   // A → primary ACK (sync only)
  successArrow?: boolean; // primary → client SUCCESS
  clientWait?: boolean;
  outcome?: Loc;
}

const FRAMES: Record<Mode, Frame[]> = {
  async: [
    {
      label: { en: 'Idle — all nodes at LSN 100', uk: 'Idle — всі вузли на LSN 100' },
      detail: {
        en: 'Primary serves reads & writes. Both standbys stream WAL continuously (async).',
        uk: 'Primary обслуговує читання та записи. Обидва standby стрімлять WAL безперервно (async).',
      },
      primaryLsn: 100, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
    },
    {
      label: { en: 'Client sends INSERT', uk: 'Клієнт надсилає INSERT' },
      detail: {
        en: 'INSERT INTO orders … — the client waits for the primary to respond.',
        uk: 'INSERT INTO orders … — клієнт очікує відповіді від primary.',
      },
      primaryLsn: 100, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      clientWait: true,
    },
    {
      label: { en: 'Primary commits immediately — SUCCESS', uk: 'Primary комітує негайно — SUCCESS' },
      detail: {
        en: 'synchronous_commit = local (default): primary flushes WAL 101 and returns SUCCESS without waiting for any standby. Standbys are still at 100.',
        uk: 'synchronous_commit = local (за замовч.): primary flush WAL 101 і повертає SUCCESS без очікування standby. Standbys досі на 100.',
      },
      primaryLsn: 101, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      walArrow: true, successArrow: true,
    },
    {
      label: { en: 'WAL ships to standbys in background', uk: 'WAL відправляється на standbys у фоні' },
      detail: {
        en: 'WAL record for LSN 101 is being streamed to A and B. Data is safe on primary — not yet durable on any standby.',
        uk: 'WAL-запис для LSN 101 стрімиться до A і B. Дані в безпеці на primary — ще не довговічні на жодному standby.',
      },
      primaryLsn: 101, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      walArrow: true,
    },
    {
      label: { en: 'PRIMARY CRASHES — standbys still at LSN 100', uk: 'PRIMARY ПАДАЄ — standbys досі на LSN 100' },
      detail: {
        en: 'Primary fails before LSN 101 reached either standby. The committed write exists only in the now-lost primary WAL.',
        uk: "Primary відмовляє до того, як LSN 101 досяг standby. Закомічений запис існував лише у WAL primary, якого тепер немає.",
      },
      primaryLsn: 101, aLsn: 100, bLsn: 100,
      primaryState: 'crashed', aState: 'standby', bState: 'standby',
    },
    {
      label: { en: 'Failover → Standby A promoted (DATA LOSS)', uk: 'Failover → Standby A підвищено (ВТРАТА ДАНИХ)' },
      detail: {
        en: 'Patroni / etcd elects A as the new primary. A is at LSN 100 — the write at LSN 101 is gone. This is the async replication data-loss window.',
        uk: 'Patroni / etcd обирає A новим primary. A на LSN 100 — запис на LSN 101 зник. Це вікно втрати даних async replication.',
      },
      primaryLsn: 101, aLsn: 100, bLsn: 100,
      primaryState: 'crashed', aState: 'promoted', bState: 'standby',
      outcome: { en: '⚠ DATA LOSS — committed write at LSN 101 is gone', uk: '⚠ ВТРАТА ДАНИХ — закомічений запис на LSN 101 зник' },
    },
  ],
  sync: [
    {
      label: { en: 'Idle — all nodes at LSN 100', uk: 'Idle — всі вузли на LSN 100' },
      detail: {
        en: "synchronous_standby_names = 'ANY 1 (standby_a, standby_b)'. Primary will wait for ≥ 1 standby flush ACK before committing.",
        uk: "synchronous_standby_names = 'ANY 1 (standby_a, standby_b)'. Primary чекатиме flush ACK від ≥ 1 standby перед комітом.",
      },
      primaryLsn: 100, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
    },
    {
      label: { en: 'Client sends INSERT', uk: 'Клієнт надсилає INSERT' },
      detail: {
        en: 'INSERT INTO orders … — the client waits. Primary will not respond until the sync durability guarantee is met.',
        uk: 'INSERT INTO orders … — клієнт чекає. Primary не відповість, поки не виконана гарантія синхронної довговічності.',
      },
      primaryLsn: 100, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      clientWait: true,
    },
    {
      label: { en: 'Primary flushes WAL 101, ships to standbys', uk: 'Primary flush WAL 101, відправляє на standbys' },
      detail: {
        en: "Primary writes LSN 101 to its own WAL and streams it to A and B. Client still waits — primary hasn't committed yet.",
        uk: 'Primary записує LSN 101 до свого WAL і стрімить до A і B. Клієнт ще чекає — primary ще не закомітував.',
      },
      primaryLsn: 101, aLsn: 100, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      walArrow: true, clientWait: true,
    },
    {
      label: { en: 'Standby A flushes LSN 101 → ACKs primary', uk: 'Standby A flush LSN 101 → ACK до primary' },
      detail: {
        en: 'Standby A writes LSN 101 to its WAL and sends a flush ACK. Quorum condition ANY 1 is now satisfied.',
        uk: 'Standby A записує LSN 101 до свого WAL і надсилає flush ACK. Умова кворуму ANY 1 виконана.',
      },
      primaryLsn: 101, aLsn: 101, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      walArrow: true, ackArrow: true, clientWait: true,
    },
    {
      label: { en: 'Primary commits → SUCCESS', uk: 'Primary комітує → SUCCESS' },
      detail: {
        en: 'Quorum met. Primary commits and returns SUCCESS. LSN 101 is now durable on primary + Standby A.',
        uk: 'Кворум досягнуто. Primary комітує і повертає SUCCESS. LSN 101 тепер довговічний на primary + Standby A.',
      },
      primaryLsn: 101, aLsn: 101, bLsn: 100,
      primaryState: 'active', aState: 'standby', bState: 'standby',
      successArrow: true,
    },
    {
      label: { en: 'PRIMARY CRASHES — Standby A is at LSN 101', uk: 'PRIMARY ПАДАЄ — Standby A на LSN 101' },
      detail: {
        en: 'Primary fails. Standby A already flushed LSN 101 — the write survives. B is at 100 (quorum was met by A alone).',
        uk: 'Primary відмовляє. Standby A вже flush LSN 101 — запис виживає. B на 100 (кворум виконав A самостійно).',
      },
      primaryLsn: 101, aLsn: 101, bLsn: 100,
      primaryState: 'crashed', aState: 'standby', bState: 'standby',
    },
    {
      label: { en: 'Failover → Standby A promoted (ZERO DATA LOSS)', uk: 'Failover → Standby A підвищено (НУЛЬОВА ВТРАТА ДАНИХ)' },
      detail: {
        en: 'Patroni promotes A. It already has LSN 101 — the committed write is intact. Synchronous replication guarantees committed data survives a single-node failure.',
        uk: 'Patroni підвищує A. Він вже має LSN 101 — закомічений запис цілий. Synchronous replication гарантує, що закомічені дані виживають при відмові одного вузла.',
      },
      primaryLsn: 101, aLsn: 101, bLsn: 100,
      primaryState: 'crashed', aState: 'promoted', bState: 'standby',
      outcome: { en: '✓ ZERO DATA LOSS — LSN 101 is intact on Standby A', uk: '✓ НУЛЬОВА ВТРАТА ДАНИХ — LSN 101 цілий на Standby A' },
    },
  ],
};

const UI = {
  asyncMode: { en: 'Async (default)', uk: 'Async (за замовч.)' },
  syncMode:  { en: 'Sync (ANY 1)', uk: 'Sync (ANY 1)' },
  play:  { en: 'Play', uk: 'Грати' },
  pause: { en: 'Pause', uk: 'Пауза' },
  step:  { en: 'Step', uk: 'Крок' },
  reset: { en: 'Reset', uk: 'Скинути' },
  primary:   { en: 'Primary', uk: 'Primary' },
  standbyA:  { en: 'Standby A', uk: 'Standby A' },
  standbyB:  { en: 'Standby B', uk: 'Standby B' },
  client:    { en: 'Client', uk: 'Клієнт' },
  lsn:       { en: 'LSN', uk: 'LSN' },
  wal:       { en: 'WAL', uk: 'WAL' },
  ack:       { en: 'ACK', uk: 'ACK' },
  success:   { en: 'SUCCESS', uk: 'SUCCESS' },
  waiting:   { en: 'waiting…', uk: 'очікування…' },
  crashed:   { en: 'CRASHED', uk: 'CRASHED' },
  promoted:  { en: 'NEW PRIMARY', uk: 'НОВИЙ PRIMARY' },
  step_n:    { en: 'Step', uk: 'Крок' },
  of:        { en: 'of', uk: 'з' },
};

export function ReplicationSim() {
  const { t } = useLang();

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const [mode, setMode] = useState<Mode>('async');
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frames = useMemo(() => FRAMES[mode], [mode]);
  const frame = frames[frameIdx];
  const total = frames.length;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const advance = useCallback(() => {
    setFrameIdx(i => {
      if (i + 1 >= FRAMES[mode].length) { clearTimer(); setPlaying(false); return i; }
      return i + 1;
    });
  }, [mode, clearTimer]);

  useEffect(() => {
    if (playing && !prefersReduced) {
      intervalRef.current = setInterval(advance, 1800);
    } else { clearTimer(); }
    return clearTimer;
  }, [playing, advance, prefersReduced, clearTimer]);

  const handleMode = (m: Mode) => { clearTimer(); setPlaying(false); setMode(m); setFrameIdx(0); };
  const handlePlay = () => { if (frameIdx >= total - 1) setFrameIdx(0); setPlaying(true); };
  const handlePause = () => setPlaying(false);
  const handleStep = () => { clearTimer(); setPlaying(false); setFrameIdx(i => Math.min(i + 1, total - 1)); };
  const handleReset = () => { clearTimer(); setPlaying(false); setFrameIdx(0); };

  const isDataLoss = mode === 'async' && frame.outcome != null;
  const isZeroLoss = mode === 'sync' && frame.outcome != null;

  return (
    <div className="repl-root" role="region" aria-label={t({ en: 'Replication & failover simulator', uk: 'Симулятор replication та failover' })}>

      {/* Mode toggle */}
      <div className="repl-toggle" role="tablist" aria-label={t({ en: 'Replication mode', uk: 'Режим replication' })}>
        {(['async', 'sync'] as Mode[]).map(m => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={`repl-tab${mode === m ? ' repl-tab--active' : ''}`}
            onClick={() => handleMode(m)}
          >
            {t(m === 'async' ? UI.asyncMode : UI.syncMode)}
          </button>
        ))}
      </div>

      {/* Stage diagram */}
      <div className="repl-stage">

        {/* Client */}
        <div className="repl-client">
          <div className="repl-node repl-node--client">
            <span className="repl-node-label">{t(UI.client)}</span>
            {frame.clientWait && <span className="repl-blink">{t(UI.waiting)}</span>}
            {frame.successArrow && <span className="repl-success-pill">{t(UI.success)}</span>}
          </div>
          {frame.successArrow && <div className="repl-arrow repl-arrow--success" aria-hidden="true">← {t(UI.success)}</div>}
        </div>

        {/* Primary */}
        <div className={`repl-node repl-node--primary${frame.primaryState === 'crashed' ? ' repl-node--crashed' : ''}`}>
          <span className="repl-node-label">
            {t(UI.primary)}{frame.primaryState === 'crashed' ? ` (${t(UI.crashed)})` : ''}
          </span>
          <span className="repl-lsn">{t(UI.lsn)} {frame.primaryLsn}</span>
          {frame.walArrow && (
            <div className="repl-wal-out" aria-hidden="true">
              <span className="repl-arrow-label">{t(UI.wal)} →</span>
            </div>
          )}
          {frame.ackArrow && (
            <div className="repl-ack-in" aria-hidden="true">
              <span className="repl-arrow-label">← {t(UI.ack)}</span>
            </div>
          )}
        </div>

        {/* Standbys */}
        <div className="repl-standbys">
          {/* Standby A */}
          <div className={`repl-node repl-node--standby${frame.aState === 'promoted' ? ' repl-node--promoted' : ''}`}>
            <span className="repl-node-label">
              {t(UI.standbyA)}{frame.aState === 'promoted' ? ` — ${t(UI.promoted)}` : ''}
            </span>
            <span className="repl-lsn">{t(UI.lsn)} {frame.aLsn}</span>
            {frame.walArrow && <div className="repl-wal-in" aria-hidden="true">← WAL</div>}
          </div>

          {/* Standby B */}
          <div className="repl-node repl-node--standby">
            <span className="repl-node-label">{t(UI.standbyB)}</span>
            <span className="repl-lsn">{t(UI.lsn)} {frame.bLsn}</span>
          </div>
        </div>
      </div>

      {/* Frame label + detail */}
      <div
        className="repl-label"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="repl-step-counter">
          {t(UI.step_n)} {frameIdx + 1} {t(UI.of)} {total}
        </div>
        <div className="repl-frame-title">{t(frame.label)}</div>
        <div className="repl-frame-detail">{t(frame.detail)}</div>
      </div>

      {/* Outcome */}
      {frame.outcome && (
        <div className={`repl-outcome${isDataLoss ? ' repl-outcome--loss' : ''}${isZeroLoss ? ' repl-outcome--safe' : ''}`}>
          {t(frame.outcome)}
        </div>
      )}

      {/* Controls */}
      <div className="repl-controls">
        {!prefersReduced && (
          playing
            ? <button className="sim-btn" onClick={handlePause}>{t(UI.pause)}</button>
            : <button className="sim-btn" onClick={handlePlay} disabled={frameIdx >= total - 1 && !playing}>{t(UI.play)}</button>
        )}
        <button className="sim-btn" onClick={handleStep} disabled={frameIdx >= total - 1}>{t(UI.step)}</button>
        <button className="sim-btn sim-btn--ghost" onClick={handleReset}>{t(UI.reset)}</button>
      </div>
    </div>
  );
}
