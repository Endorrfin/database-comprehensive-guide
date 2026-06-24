import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ Two-phase commit stepper (M20). A coordinator drives two participants (A and B) through 2PC, and
 * a SCENARIO toggle decides whether it works or exposes the blocking problem:
 *   • commit → phase 1 prepare → both vote YES (durably prepared, holding locks) → coordinator decides
 *     COMMIT → phase 2 commit → both commit & release locks (atomic).
 *   • crash  → phase 1 prepare → both vote YES (holding locks) → the COORDINATOR CRASHES before the
 *     decision → A & B are in-doubt: they promised to commit so can't abort, weren't told to commit so
 *     can't commit → they BLOCK, holding their locks, until the coordinator recovers (the blocking
 *     problem). In PostgreSQL that is an orphaned prepared transaction that also blocks VACUUM.
 * Deterministic, no engine; play/pause/step + reduced-motion fallback + ARIA live region (mirrors
 * AcidWalSim / MvccSim). Facts: Gray 1978; Gray & Lamport 2006 (Consensus on Transaction Commit);
 * PostgreSQL PREPARE TRANSACTION / pg_prepared_xacts (max_prepared_transactions default 0).
 */
type Scenario = 'commit' | 'crash';
type PartState = 'idle' | 'prepared' | 'committed' | 'indoubt';
type CoordState = 'idle' | 'phase1' | 'decide' | 'phase2' | 'crashed';

type Frame = {
  phase: Localized;
  note: Localized;
  coordState: CoordState;
  coordStatus: Localized;
  msg?: string; // current message between coordinator and participants (mono)
  a: PartState;
  b: PartState;
  highlight?: 'prepare' | 'vote' | 'commit' | 'crash' | 'block';
  outcome?: { tone: 'good' | 'bad'; text: Localized };
};

const PART_LABEL: Record<PartState, Localized> = {
  idle: { en: 'idle', uk: 'очікує' },
  prepared: { en: 'prepared · voted YES · holding locks', uk: 'prepared · голос YES · тримає locks' },
  committed: { en: 'committed · locks released', uk: 'committed · locks звільнено' },
  indoubt: { en: 'in-doubt · BLOCKED · holding locks', uk: 'у сумніві · ЗАБЛОКОВАНО · тримає locks' },
};

const START: Pick<Frame, 'phase' | 'note' | 'coordState' | 'coordStatus' | 'a' | 'b'> = {
  phase: { en: 'Idle', uk: 'Очікування' },
  note: {
    en: 'A coordinator will commit one transaction across two participants, A and B — each its own database. 2PC runs two rounds to make them agree atomically.',
    uk: 'Координатор зафіксує одну транзакцію між двома учасниками, A і B — кожен своя база. 2PC виконує два раунди, щоб вони атомарно дійшли згоди.',
  },
  coordState: 'idle',
  coordStatus: { en: 'ready', uk: 'готовий' },
  a: 'idle',
  b: 'idle',
};

const PHASE1: Frame = {
  phase: { en: 'Phase 1 — prepare?', uk: 'Фаза 1 — prepare?' },
  note: {
    en: 'The coordinator asks both participants to prepare. This is round one of two.',
    uk: 'Координатор просить обох учасників підготуватися. Це перший із двох раундів.',
  },
  coordState: 'phase1',
  coordStatus: { en: 'phase 1: prepare', uk: 'фаза 1: prepare' },
  msg: '↓ prepare?   (round 1)',
  a: 'idle',
  b: 'idle',
  highlight: 'prepare',
};

const VOTE: Frame = {
  phase: { en: 'Participants prepare & vote YES', uk: 'Учасники готуються й голосують YES' },
  note: {
    en: "Each participant durably writes its changes (so it could commit even after a crash), takes its locks, and votes YES — a binding promise: it has given up the right to abort on its own.",
    uk: 'Кожен учасник durable записує свої зміни (щоб міг зафіксуватися навіть після збою), бере свої locks і голосує YES — звʼязуюча обіцянка: він віддав право скасувати самостійно.',
  },
  coordState: 'phase1',
  coordStatus: { en: 'collecting votes', uk: 'збирає голоси' },
  msg: '↑ vote: YES   (prepared, locks held)',
  a: 'prepared',
  b: 'prepared',
  highlight: 'vote',
};

const COMMIT: Frame[] = [
  START,
  PHASE1,
  VOTE,
  {
    phase: { en: 'Coordinator decides COMMIT', uk: 'Координатор вирішує COMMIT' },
    note: {
      en: 'All votes are YES, so the decision is COMMIT. The coordinator makes that decision durable before sending it, so it can finish the job even if it restarts.',
      uk: 'Усі голоси YES, тож рішення — COMMIT. Координатор робить це рішення durable перед надсиланням, щоб міг завершити роботу навіть після перезапуску.',
    },
    coordState: 'decide',
    coordStatus: { en: 'decision: COMMIT', uk: 'рішення: COMMIT' },
    a: 'prepared',
    b: 'prepared',
  },
  {
    phase: { en: 'Phase 2 — COMMIT', uk: 'Фаза 2 — COMMIT' },
    note: {
      en: 'The coordinator tells both participants to commit. This is round two.',
      uk: 'Координатор каже обом учасникам фіксуватися. Це другий раунд.',
    },
    coordState: 'phase2',
    coordStatus: { en: 'phase 2: commit', uk: 'фаза 2: commit' },
    msg: '↓ COMMIT   (round 2)',
    a: 'prepared',
    b: 'prepared',
    highlight: 'commit',
  },
  {
    phase: { en: 'Committed — atomic', uk: 'Committed — атомарно' },
    note: {
      en: 'Both participants commit and release their locks. Every participant reached the same outcome: an atomic commit across two machines — which is exactly what 2PC is for.',
      uk: 'Обидва учасники фіксуються й звільняють свої locks. Кожен учасник дійшов одного результату: атомарний commit між двома машинами — саме для цього й існує 2PC.',
    },
    coordState: 'idle',
    coordStatus: { en: 'done ✓', uk: 'готово ✓' },
    a: 'committed',
    b: 'committed',
    highlight: 'commit',
    outcome: {
      tone: 'good',
      text: {
        en: '2PC done right: every participant committed, atomically. The cost was two network round trips, and locks held across them — fine for a few participants on a fast network, painful at scale.',
        uk: '2PC зроблено правильно: кожен учасник зафіксувався, атомарно. Ціна — два мережеві round trips і locks, утримані впродовж них — прийнятно для кількох учасників на швидкій мережі, болісно на масштабі.',
      },
    },
  },
];

const CRASH: Frame[] = [
  START,
  PHASE1,
  VOTE,
  {
    phase: { en: 'Coordinator CRASHES', uk: 'Координатор ПАДАЄ' },
    note: {
      en: 'Before the coordinator can send the phase-2 decision, it crashes. A and B have already voted YES and are holding their locks — but they were never told what to do next.',
      uk: 'Перш ніж координатор може надіслати рішення фази 2, він падає. A і B уже проголосували YES і тримають свої locks — але їм так і не сказали, що робити далі.',
    },
    coordState: 'crashed',
    coordStatus: { en: '✕ CRASHED', uk: '✕ ВПАВ' },
    msg: '✕  coordinator down — no decision sent',
    a: 'prepared',
    b: 'prepared',
    highlight: 'crash',
  },
  {
    phase: { en: 'Participants in-doubt — BLOCKED', uk: 'Учасники в сумніві — ЗАБЛОКОВАНО' },
    note: {
      en: 'A and B are now in doubt: each promised to commit, so it may not abort on its own; but it was never told to commit, so it may not commit either. All they can do is WAIT — holding their locks — until the coordinator comes back.',
      uk: 'A і B тепер у сумніві: кожен пообіцяв зафіксуватися, тож не може скасувати самостійно; але йому не сказали фіксуватися, тож не може й зафіксуватися. Усе, що вони можуть — ЧЕКАТИ, тримаючи свої locks, доки координатор повернеться.',
    },
    coordState: 'crashed',
    coordStatus: { en: '✕ CRASHED', uk: '✕ ВПАВ' },
    a: 'indoubt',
    b: 'indoubt',
    highlight: 'block',
  },
  {
    phase: { en: 'The blocking problem', uk: 'Проблема блокування' },
    note: {
      en: 'A single coordinator failure has frozen every participant. In PostgreSQL this is an orphaned prepared transaction: it keeps holding its locks AND pins the xmin horizon, so it blocks VACUUM across the whole database (M19) — which is why 2PC is off by default.',
      uk: 'Один збій координатора заморозив кожного учасника. У PostgreSQL це осиротіла підготовлена транзакція: вона далі тримає свої locks І приколює xmin horizon, тож блокує VACUUM по всій базі (M19) — тому 2PC вимкнено за замовчуванням.',
    },
    coordState: 'crashed',
    coordStatus: { en: '✕ CRASHED', uk: '✕ ВПАВ' },
    a: 'indoubt',
    b: 'indoubt',
    highlight: 'block',
    outcome: {
      tone: 'bad',
      text: {
        en: 'The blocking problem: 2PC is not fault-tolerant against coordinator failure. Prepared participants block — holding locks — until recovery. This is why microservices prefer sagas, and why PostgreSQL keeps 2PC off by default.',
        uk: 'Проблема блокування: 2PC не стійкий до збою координатора. Підготовлені учасники блокуються — тримаючи locks — до відновлення. Тому мікросервіси віддають перевагу sagas, а PostgreSQL тримає 2PC вимкненим за замовчуванням.',
      },
    },
  },
];

const FRAMES: Record<Scenario, Frame[]> = { commit: COMMIT, crash: CRASH };

function Participant({ name, state, tone }: { name: string; state: PartState; tone: string }) {
  const { t } = useLang();
  const locks = state === 'prepared' || state === 'indoubt';
  return (
    <div className={cx('tpc-part', `tpc-part--${state}`)}>
      <div className="tpc-part-head">
        <span className="tpc-part-name" style={{ color: tone }}>
          {name}
        </span>
        {locks && <span className="tpc-locks" title="row locks held">🔒</span>}
      </div>
      <span className="tpc-part-state">{t(PART_LABEL[state])}</span>
    </div>
  );
}

export function TwoPhaseCommitSim() {
  const { t } = useLang();
  const [scenario, setScenario] = useState<Scenario>('commit');
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const frames = FRAMES[scenario];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [scenario]);

  const atEnd = idx >= frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), 1700);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx, frames.length]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), [frames.length]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const frame = frames[idx];
  const crashed = frame.coordState === 'crashed';

  const status = useMemo(
    () => `${idx + 1}/${frames.length} · ${t(frame.phase)} — ${t(frame.note)}`,
    [idx, frames.length, frame, t],
  );
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim tpc" aria-label="Two-phase commit stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Scenario">
          <button
            role="tab"
            aria-selected={scenario === 'commit'}
            className={scenario === 'commit' ? 'seg-on' : ''}
            onClick={() => setScenario('commit')}
          >
            {t({ en: 'Commit (happy path)', uk: 'Commit (щасливий шлях)' })}
          </button>
          <button
            role="tab"
            aria-selected={scenario === 'crash'}
            className={scenario === 'crash' ? 'seg-on' : ''}
            onClick={() => setScenario('crash')}
          >
            {t({ en: 'Coordinator crash', uk: 'Збій координатора' })}
          </button>
        </div>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({idx + 1}/{frames.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <div className="tpc-body">
        {/* Coordinator */}
        <div className={cx('tpc-coord', crashed && 'tpc-coord--crashed')}>
          <div className="tpc-coord-head">
            <span className="tpc-coord-name" style={{ color: crashed ? 'var(--c-danger)' : 'var(--accent-bright)' }}>
              {t({ en: 'Coordinator', uk: 'Координатор' })}
            </span>
            <span className={cx('tpc-coord-status', crashed && 'tpc-coord-status--crashed')}>{t(frame.coordStatus)}</span>
          </div>
          {frame.msg && (
            <pre className={cx('tpc-msg mono', frame.highlight === 'crash' && 'tpc-msg--crash')}>
              <code>{frame.msg}</code>
            </pre>
          )}
        </div>

        {/* Participants */}
        <div className="tpc-parts">
          <Participant name={t({ en: 'Participant A', uk: 'Учасник A' })} state={frame.a} tone="var(--c-storage)" />
          <Participant name={t({ en: 'Participant B', uk: 'Учасник B' })} state={frame.b} tone="var(--c-storage)" />
        </div>

        {frame.outcome && (
          <div className={cx('tpc-outcome', `tpc-outcome--${frame.outcome.tone}`)} role="status">
            {t(frame.outcome.text)}
          </div>
        )}
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span className="dim">
          {t({
            en: 'Phase 1 prepares and votes; phase 2 commits. Toggle to “Coordinator crash” to watch prepared participants block in-doubt — holding their locks — because no one can tell them how it ended. That is the blocking problem.',
            uk: 'Фаза 1 готує й голосує; фаза 2 фіксує. Перемкніть на «Збій координатора», щоб побачити, як підготовлені учасники блокуються в сумніві — тримаючи свої locks — бо ніхто не може сказати їм, чим усе скінчилося. Це і є проблема блокування.',
          })}
        </span>
      </div>
    </section>
  );
}
