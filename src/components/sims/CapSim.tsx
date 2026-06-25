// CHANGED (S12): M23 — CAP/PACELC consistency sim (signature ★)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../../i18n/lang';

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Scenario = 'partition' | 'normal';
type PartitionChoice = 'cp' | 'ap';
type PacelcChoice = 'sync' | 'async';

/* ── Node state ─────────────────────────────────────────────────────────────── */
type NodeStatus = 'ok' | 'partitioned' | 'refusing' | 'stale' | 'syncing';

interface NodeState {
  id: string;
  label: string;
  role: 'leader' | 'follower';
  value: number;   // the "current" data value
  status: NodeStatus;
  highlight?: 'write' | 'read' | 'error' | 'ok' | 'stale';
}

/* ── Animation frame ────────────────────────────────────────────────────────── */
interface Frame {
  label: { en: string; uk: string };
  detail: { en: string; uk: string };
  nodes: NodeState[];
  partitionLine?: boolean;   // show the lightning bolt partition
  clientWrite?: boolean;
  clientRead?: boolean;
  clientOutcome?: { kind: 'ok' | 'error' | 'stale'; text: { en: string; uk: string } };
  verdict?: { en: string; uk: string };
}

/* ── Frame definitions ──────────────────────────────────────────────────────── */
const PARTITION_FRAMES: Record<PartitionChoice, Frame[]> = {
  cp: [
    {
      label: { en: 'Healthy cluster — 3 nodes, all connected', uk: 'Справний кластер — 3 вузли, усі з\'єднані' },
      detail: { en: 'N1 is the leader (writer). N2 and N3 are followers. All nodes agree: value = 42.', uk: 'N1 — leader (writer). N2 і N3 — followers. Всі вузли погоджуються: value = 42.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'ok' },
      ],
    },
    {
      label: { en: 'Network partition — N3 is isolated', uk: 'Network partition — N3 ізольований' },
      detail: { en: 'A partition cuts N3 off from N1 and N2. N1+N2 form a majority (2/3 = quorum). N3 is alone on the minority side.', uk: 'Partition відрізає N3 від N1 і N2. N1+N2 утворюють більшість (2/3 = кворум). N3 — один на меншій стороні.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'partitioned' },
      ],
      partitionLine: true,
    },
    {
      label: { en: 'Client writes to N3 (minority side)', uk: 'Клієнт пише на N3 (менша сторона)' },
      detail: { en: 'CP choice: N3 cannot reach a quorum. It REFUSES the write — returns an error rather than risk divergence.', uk: 'Вибір CP: N3 не може досягти кворуму. Він ВІДХИЛЯЄ запис — повертає помилку, щоб не ризикувати розходженням.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'refusing', highlight: 'error' },
      ],
      partitionLine: true,
      clientWrite: true,
      clientOutcome: {
        kind: 'error',
        text: { en: 'ERROR: cannot reach quorum — write refused', uk: 'ERROR: не вдалося досягти кворуму — запис відхилено' },
      },
    },
    {
      label: { en: 'Client reads from N3 — also refused', uk: 'Клієнт читає з N3 — теж відхилено' },
      detail: { en: 'N3 cannot guarantee the read is fresh (N1 may have newer data). CP: refuse the read rather than return stale data.', uk: 'N3 не може гарантувати свіжість читання (N1 може мати новіші дані). CP: відхилити читання, а не повернути застарілі дані.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 43, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 43, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'refusing', highlight: 'error' },
      ],
      partitionLine: true,
      clientRead: true,
      clientOutcome: {
        kind: 'error',
        text: { en: 'ERROR: cannot guarantee consistency — read refused', uk: 'ERROR: не можу гарантувати consistency — читання відхилено' },
      },
      verdict: { en: 'Consistent (no stale data), but Unavailable on the minority side', uk: 'Consistent (немає застарілих даних), але Unavailable на меншій стороні' },
    },
  ],

  ap: [
    {
      label: { en: 'Healthy cluster — 3 nodes, all connected', uk: 'Справний кластер — 3 вузли, усі з\'єднані' },
      detail: { en: 'N1 is the leader. N2 and N3 are followers. All nodes agree: value = 42.', uk: 'N1 — leader. N2 і N3 — followers. Всі погоджуються: value = 42.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'ok' },
      ],
    },
    {
      label: { en: 'Network partition — N3 is isolated', uk: 'Network partition — N3 ізольований' },
      detail: { en: 'N3 is cut off. AP choice: N3 will keep serving requests on its own — accepting both reads and writes independently.', uk: 'N3 відрізаний. Вибір AP: N3 продовжує обслуговувати запити самостійно — приймає і читання, і записи незалежно.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'partitioned' },
      ],
      partitionLine: true,
    },
    {
      label: { en: 'Writes proceed on both sides independently', uk: 'Записи відбуваються на обох сторонах незалежно' },
      detail: { en: 'N1 accepts a write: value → 99. N3 also accepts a write (independently): value → 77. The cluster now has conflicting values.', uk: 'N1 приймає запис: value → 99. N3 теж приймає запис (незалежно): value → 77. Кластер тепер має конфліктуючі значення.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 99, status: 'ok',         highlight: 'write' },
        { id: 'n2', label: 'N2', role: 'follower', value: 99, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 77, status: 'stale',       highlight: 'write' },
      ],
      partitionLine: true,
      clientOutcome: {
        kind: 'ok',
        text: { en: 'OK (writes accepted on both sides — but values diverged!)', uk: 'OK (записи прийнято з обох сторін — але значення розійшлися!)' },
      },
    },
    {
      label: { en: 'Client reads from N3 — gets stale/diverged data', uk: 'Клієнт читає з N3 — отримує застарілі/розбіжні дані' },
      detail: { en: 'AP: N3 responds with its local value = 77. The true value on the majority side is 99. This is a stale (or conflicting) read.', uk: 'AP: N3 відповідає локальним value = 77. Справжнє значення на більшій стороні — 99. Це застаріле (або конфліктуюче) читання.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 99, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 99, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 77, status: 'stale', highlight: 'stale' },
      ],
      partitionLine: true,
      clientRead: true,
      clientOutcome: {
        kind: 'stale',
        text: { en: 'STALE READ: value = 77 (majority has 99 — conflict!)', uk: 'STALE READ: value = 77 (більшість має 99 — конфлікт!)' },
      },
      verdict: { en: 'Available (always responds), but Inconsistent (diverged values on partition)', uk: 'Available (завжди відповідає), але Inconsistent (розбіжні значення при partition)' },
    },
  ],
};

const PACELC_FRAMES: Record<PacelcChoice, Frame[]> = {
  sync: [
    {
      label: { en: 'Normal operation — no partition', uk: 'Нормальна робота — без partition' },
      detail: { en: 'All 3 nodes healthy. Synchronous mode: N1 will wait for ALL followers to acknowledge before responding to the client.', uk: 'Всі 3 вузли справні. Режим synchronous: N1 чекатиме підтвердження від УСІХ followers перед відповіддю клієнту.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'ok' },
      ],
    },
    {
      label: { en: 'Client writes — N1 receives, replicates synchronously', uk: 'Клієнт пише — N1 отримує, реплікує синхронно' },
      detail: { en: 'N1 appends to its WAL, then waits for N2 and N3 to flush and acknowledge. Client is blocked waiting for the quorum ACK.', uk: 'N1 додає до WAL, потім чекає flush і підтвердження від N2 і N3. Клієнт заблокований в очікуванні quorum ACK.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 43, status: 'syncing', highlight: 'write' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'syncing' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'syncing' },
      ],
      clientWrite: true,
    },
    {
      label: { en: 'Quorum ACK received — N1 responds SUCCESS', uk: 'Отримано quorum ACK — N1 відповідає SUCCESS' },
      detail: { en: 'N2 and N3 have flushed value=43 to disk and acknowledged. N1 now responds to the client. Total latency: ~20ms (sync round-trip to followers).', uk: 'N2 і N3 виконали flush value=43 на диск і підтвердили. N1 відповідає клієнту. Загальна latency: ~20ms (sync round-trip до followers).' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 43, status: 'ok', highlight: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 43, status: 'ok', highlight: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 43, status: 'ok', highlight: 'ok' },
      ],
      clientOutcome: {
        kind: 'ok',
        text: { en: 'SUCCESS — all nodes consistent. Latency: ~20ms', uk: 'SUCCESS — всі вузли узгоджені. Latency: ~20ms' },
      },
      verdict: { en: 'PACELC: EC (Else Consistent) — strong consistency, higher latency', uk: 'PACELC: EC (Else Consistent) — strong consistency, вища latency' },
    },
  ],

  async: [
    {
      label: { en: 'Normal operation — no partition', uk: 'Нормальна робота — без partition' },
      detail: { en: 'All 3 nodes healthy. Async mode: N1 will respond to the client immediately after its own local write, before followers confirm.', uk: 'Всі 3 вузли справні. Async-режим: N1 відповідає клієнту одразу після локального запису, не чекаючи підтвердження followers.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 42, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'ok' },
      ],
    },
    {
      label: { en: 'Client writes — N1 commits locally and responds immediately', uk: 'Клієнт пише — N1 комітує локально і відповідає негайно' },
      detail: { en: 'N1 flushes to its own WAL and sends SUCCESS to the client immediately — no waiting for followers. Followers are still at value=42.', uk: 'N1 виконує flush до власного WAL і відразу надсилає SUCCESS клієнту — без очікування followers. Followers досі мають value=42.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 43, status: 'ok', highlight: 'write' },
        { id: 'n2', label: 'N2', role: 'follower', value: 42, status: 'stale' },
        { id: 'n3', label: 'N3', role: 'follower', value: 42, status: 'stale' },
      ],
      clientWrite: true,
      clientOutcome: {
        kind: 'ok',
        text: { en: 'SUCCESS — immediate response. Latency: ~3ms', uk: 'SUCCESS — негайна відповідь. Latency: ~3ms' },
      },
    },
    {
      label: { en: 'Followers catch up — eventually consistent', uk: 'Followers надоганяють — eventually consistent' },
      detail: { en: 'N2 and N3 receive the WAL stream and apply value=43 shortly after. Any read from N2/N3 between frames 2 and 3 would have returned stale value=42.', uk: 'N2 і N3 отримують WAL-потік і застосовують value=43 невдовзі. Будь-яке читання з N2/N3 між кадрами 2 і 3 повертало б застаріле value=42.' },
      nodes: [
        { id: 'n1', label: 'N1', role: 'leader',   value: 43, status: 'ok' },
        { id: 'n2', label: 'N2', role: 'follower', value: 43, status: 'ok', highlight: 'ok' },
        { id: 'n3', label: 'N3', role: 'follower', value: 43, status: 'ok', highlight: 'ok' },
      ],
      verdict: { en: 'PACELC: EL (Else Latency) — lower latency, eventual consistency window', uk: 'PACELC: EL (Else Latency) — нижча latency, вікно eventual consistency' },
    },
  ],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function statusClass(s: NodeStatus): string {
  if (s === 'ok')         return 'cap-node--ok';
  if (s === 'partitioned') return 'cap-node--partitioned';
  if (s === 'refusing')   return 'cap-node--refusing';
  if (s === 'stale')      return 'cap-node--stale';
  if (s === 'syncing')    return 'cap-node--syncing';
  return '';
}

function highlightClass(h?: string): string {
  if (!h) return '';
  if (h === 'write') return 'cap-highlight--write';
  if (h === 'read')  return 'cap-highlight--read';
  if (h === 'error') return 'cap-highlight--error';
  if (h === 'ok')    return 'cap-highlight--ok';
  if (h === 'stale') return 'cap-highlight--stale';
  return '';
}

/* ── Component ────────────────────────────────────────────────────────────── */
export function CapSim() {
  const { lang } = useLang();
  const [scenario, setScenario] = useState<Scenario>('partition');
  const [partitionChoice, setPartitionChoice] = useState<PartitionChoice>('cp');
  const [pacelcChoice, setPacelcChoice] = useState<PacelcChoice>('sync');
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const frames: Frame[] = scenario === 'partition'
    ? PARTITION_FRAMES[partitionChoice]
    : PACELC_FRAMES[pacelcChoice];

  const frame = frames[Math.min(frameIdx, frames.length - 1)];
  const isLast = frameIdx >= frames.length - 1;

  const step = useCallback(() => {
    setFrameIdx(i => Math.min(i + 1, frames.length - 1));
  }, [frames.length]);

  const reset = useCallback(() => {
    setFrameIdx(0);
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Reset on toggle changes
  useEffect(() => { reset(); }, [scenario, partitionChoice, pacelcChoice, reset]);

  // Autoplay
  useEffect(() => {
    if (!playing) return;
    if (isLast) { setPlaying(false); return; }
    timerRef.current = setTimeout(step, 1600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, isLast, step, frameIdx]);

  const l = (x: { en: string; uk: string }) => lang === 'uk' ? x.uk : x.en;

  return (
    <div className="cap-sim" role="region" aria-label={l({ en: 'CAP / PACELC interactive simulator', uk: 'Інтерактивний симулятор CAP / PACELC' })}>
      {/* ── Scenario toggle ──────────────────────────────────────────────── */}
      <div className="cap-header">
        <div role="tablist" aria-label={l({ en: 'Scenario', uk: 'Сценарій' })} className="cap-scenario-tabs">
          <button
            role="tab"
            aria-selected={scenario === 'partition'}
            className={`cap-tab${scenario === 'partition' ? ' cap-tab--active' : ''}`}
            onClick={() => setScenario('partition')}
          >
            {l({ en: '⚡ During Partition (CAP)', uk: '⚡ Під час Partition (CAP)' })}
          </button>
          <button
            role="tab"
            aria-selected={scenario === 'normal'}
            className={`cap-tab${scenario === 'normal' ? ' cap-tab--active' : ''}`}
            onClick={() => setScenario('normal')}
          >
            {l({ en: '🔄 Normal Operation (PACELC)', uk: '🔄 Нормальна робота (PACELC)' })}
          </button>
        </div>

        {/* ── Sub-choice ──────────────────────────────────────────────────── */}
        {scenario === 'partition' ? (
          <div role="tablist" aria-label={l({ en: 'Partition choice', uk: 'Вибір при partition' })} className="cap-choice-tabs">
            <button
              role="tab"
              aria-selected={partitionChoice === 'cp'}
              className={`cap-choice${partitionChoice === 'cp' ? ' cap-choice--active' : ''}`}
              onClick={() => setPartitionChoice('cp')}
            >
              {l({ en: 'Choose Consistency (CP)', uk: 'Обрати Consistency (CP)' })}
            </button>
            <button
              role="tab"
              aria-selected={partitionChoice === 'ap'}
              className={`cap-choice${partitionChoice === 'ap' ? ' cap-choice--active' : ''}`}
              onClick={() => setPartitionChoice('ap')}
            >
              {l({ en: 'Choose Availability (AP)', uk: 'Обрати Availability (AP)' })}
            </button>
          </div>
        ) : (
          <div role="tablist" aria-label={l({ en: 'PACELC choice', uk: 'Вибір PACELC' })} className="cap-choice-tabs">
            <button
              role="tab"
              aria-selected={pacelcChoice === 'sync'}
              className={`cap-choice${pacelcChoice === 'sync' ? ' cap-choice--active' : ''}`}
              onClick={() => setPacelcChoice('sync')}
            >
              {l({ en: 'Synchronous (EC — Else Consistent)', uk: 'Synchronous (EC — Else Consistent)' })}
            </button>
            <button
              role="tab"
              aria-selected={pacelcChoice === 'async'}
              className={`cap-choice${pacelcChoice === 'async' ? ' cap-choice--active' : ''}`}
              onClick={() => setPacelcChoice('async')}
            >
              {l({ en: 'Asynchronous (EL — Else Latency)', uk: 'Asynchronous (EL — Else Latency)' })}
            </button>
          </div>
        )}
      </div>

      {/* ── Main visualization ───────────────────────────────────────────── */}
      <div className="cap-stage">
        {/* Nodes */}
        <div className="cap-nodes">
          {frame.nodes.map((node) => (
            <div
              key={node.id}
              className={`cap-node ${statusClass(node.status)} ${highlightClass(node.highlight)}`}
            >
              <div className="cap-node-label">{node.label}</div>
              <div className="cap-node-role">{node.role === 'leader' ? l({ en: 'leader', uk: 'leader' }) : l({ en: 'follower', uk: 'follower' })}</div>
              <div className="cap-node-value">val = {node.value}</div>
              <div className="cap-node-status">
                {node.status === 'ok'          && l({ en: 'OK', uk: 'OK' })}
                {node.status === 'partitioned' && l({ en: 'isolated', uk: 'ізольований' })}
                {node.status === 'refusing'    && l({ en: 'REFUSING', uk: 'ВІДХИЛЯЄ' })}
                {node.status === 'stale'       && l({ en: 'stale', uk: 'застарілий' })}
                {node.status === 'syncing'     && l({ en: 'syncing…', uk: 'синхр…' })}
              </div>
            </div>
          ))}

          {/* Partition line between N2 and N3 */}
          {frame.partitionLine && (
            <div className="cap-partition-line" aria-label={l({ en: 'network partition', uk: 'network partition' })}>
              <span>⚡ partition</span>
            </div>
          )}
        </div>

        {/* Client outcome */}
        {frame.clientOutcome && (
          <div className={`cap-outcome cap-outcome--${frame.clientOutcome.kind}`} aria-live="polite">
            {l(frame.clientOutcome.text)}
          </div>
        )}

        {/* Verdict */}
        {frame.verdict && (
          <div className="cap-verdict" aria-live="polite">
            {l(frame.verdict)}
          </div>
        )}
      </div>

      {/* ── Frame description ─────────────────────────────────────────────── */}
      <div className="cap-desc" aria-live="polite">
        <div className="cap-desc-label">{l(frame.label)}</div>
        <div className="cap-desc-detail muted">{l(frame.detail)}</div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="cap-controls">
        <span className="cap-progress muted">
          {frameIdx + 1} / {frames.length}
        </span>
        {!reduced && (
          <button
            className="sim-btn"
            onClick={() => { if (isLast) reset(); else setPlaying(p => !p); }}
            aria-label={isLast
              ? l({ en: 'Restart simulation', uk: 'Перезапустити симуляцію' })
              : playing
                ? l({ en: 'Pause', uk: 'Пауза' })
                : l({ en: 'Play', uk: 'Відтворити' })}
          >
            {isLast ? l({ en: '↺ Restart', uk: '↺ Спочатку' }) : playing ? l({ en: '⏸ Pause', uk: '⏸ Пауза' }) : l({ en: '▶ Play', uk: '▶ Відтворити' })}
          </button>
        )}
        <button
          className="sim-btn"
          onClick={step}
          disabled={isLast}
          aria-label={l({ en: 'Next step', uk: 'Наступний крок' })}
        >
          {l({ en: 'Step →', uk: 'Крок →' })}
        </button>
        <button
          className="sim-btn sim-btn--ghost"
          onClick={reset}
          aria-label={l({ en: 'Reset', uk: 'Скинути' })}
        >
          {l({ en: '↺ Reset', uk: '↺ Скинути' })}
        </button>
      </div>
    </div>
  );
}
