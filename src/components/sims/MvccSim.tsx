import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ MVCC sim (M19, signature). Steps a fixed schedule on one row of `accounts` and shows the heart
 * of Multi-Version Concurrency Control: every UPDATE writes a NEW version (tuple) tagged with
 * xmin/xmax instead of overwriting, two transactions read their own snapshots, readers never block
 * writers, and VACUUM later reclaims the dead tuple. A MODEL toggle replays the SAME schedule under
 * lock-based (strict 2PL) concurrency, where T2's write BLOCKS on T1's read lock — the contrast that
 * makes the MVCC bargain concrete (no waiting now, garbage collection later).
 *   • mvcc  → version chain v1/v2, snapshot visibility, T1 keeps seeing v1 while T2 writes v2, VACUUM.
 *   • lock  → one in-place value, shared/exclusive locks, T2 waits the whole time T1 holds the row.
 * Deterministic, no engine; play/pause/step + reduced-motion fallback + ARIA live region (mirrors
 * AcidWalSim / LsmSim). Facts (postgresql.org/docs/current): mvcc-intro 13.1 ("reading never blocks
 * writing and writing never blocks reading"), storage-hot (UPDATE = new version), routine-vacuuming
 * (dead tuples reclaimed by VACUUM), explicit-locking (2PL row locks). xmin/xmax per transaction-id.
 */
type Model = 'mvcc' | 'lock';
type TupleState = 'live' | 'new' | 'dead' | 'gone';
type Tuple = { v: string; xmin: number; xmax: number | null; val: number; state: TupleState };
type Lock = { holder: string; tone: string };
type See = { who: string; sees: string; tone: string };

type Frame = {
  phase: Localized;
  note: Localized;
  op: string; // current operation (mono; SQL keywords stay English)
  who: string; // actor label, e.g. "T1 · xid 100"
  whoTone: string; // CSS color var for the actor
  tuples?: Tuple[]; // mvcc model — the heap version chain
  rowVal?: number; // lock model — the single in-place value
  locks?: Lock[]; // lock model — held locks
  waiting?: string; // lock model — a blocked acquirer
  sees?: See[]; // mvcc model — who-sees-what strip
  highlight?: 'read' | 'write' | 'commit' | 'vacuum' | 'block';
  outcome?: { tone: 'good' | 'info'; text: Localized };
};

const QUERY = 'var(--c-query)';
const DIST = 'var(--c-dist)';
const ANALYTICS = 'var(--c-analytics)';
const COMMIT = 'var(--c-commit)';
const STORAGE = 'var(--c-storage)';

const STATE_LABEL: Record<TupleState, Localized> = {
  live: { en: 'current', uk: 'поточна' },
  new: { en: 'new · uncommitted', uk: 'нова · незафіксована' },
  dead: { en: 'dead', uk: 'мертва' },
  gone: { en: 'reclaimed', uk: 'звільнено' },
};

const MVCC: Frame[] = [
  {
    phase: { en: 'One row, one version', uk: 'Один рядок, одна версія' },
    note: {
      en: 'The row accounts.id=1 starts as a single live version (tuple) v1. xmin = 90 is the transaction that inserted it; xmax is empty, so v1 is the current version. Any transaction sees balance = 500.',
      uk: 'Рядок accounts.id=1 починається як одна жива версія (tuple) v1. xmin = 90 — транзакція, що його вставила; xmax порожній, тож v1 — поточна версія. Будь-яка транзакція бачить balance = 500.',
    },
    op: 'table accounts — id = 1',
    who: 'heap',
    whoTone: STORAGE,
    tuples: [{ v: 'v1', xmin: 90, xmax: null, val: 500, state: 'live' }],
    sees: [{ who: 'any txn', sees: 'v1 → 500', tone: STORAGE }],
  },
  {
    phase: { en: 'T1 begins — reads its snapshot', uk: 'T1 починається — читає свій snapshot' },
    note: {
      en: 'T1 (xid 100) starts and takes a snapshot. It reads the live version v1 → 500. It takes NO row lock — a read under MVCC just follows the snapshot.',
      uk: 'T1 (xid 100) починається й бере snapshot. Вона читає живу версію v1 → 500. Вона НЕ бере row lock — читання за MVCC просто йде за snapshot.',
    },
    op: 'T1:  BEGIN;  SELECT balance FROM accounts WHERE id = 1;',
    who: 'T1 · xid 100',
    whoTone: QUERY,
    tuples: [{ v: 'v1', xmin: 90, xmax: null, val: 500, state: 'live' }],
    sees: [{ who: 'T1 (snapshot 100)', sees: 'v1 → 500', tone: QUERY }],
    highlight: 'read',
  },
  {
    phase: { en: 'T2 updates — a NEW version appears', uk: 'T2 оновлює — зʼявляється НОВА версія' },
    note: {
      en: "T2 (xid 101) updates the balance to 600. It does NOT overwrite v1 — it stamps v1.xmax = 101 and writes a brand-new version v2 (xmin = 101, 600). Both versions now sit on the page. T2 hasn't committed, so to everyone else v1 is still current.",
      uk: 'T2 (xid 101) оновлює balance до 600. Вона НЕ перезаписує v1 — вона штампує v1.xmax = 101 і пише цілком нову версію v2 (xmin = 101, 600). Обидві версії тепер на page. T2 не зафіксувалася, тож для всіх інших v1 досі поточна.',
    },
    op: 'T2:  BEGIN;  UPDATE accounts SET balance = 600 WHERE id = 1;',
    who: 'T2 · xid 101',
    whoTone: DIST,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'live' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'new' },
    ],
    sees: [
      { who: 'T1 (snapshot 100)', sees: 'v1 → 500', tone: QUERY },
      { who: 'T2 (uncommitted)', sees: 'v2 → 600', tone: DIST },
    ],
    highlight: 'write',
  },
  {
    phase: { en: 'T1 re-reads — still its snapshot', uk: 'T1 перечитує — досі свій snapshot' },
    note: {
      en: "T1 reads id=1 again and STILL sees v1 → 500. v2's xmin = 101 is not in T1's snapshot and is uncommitted, so v2 is invisible to T1. Readers don't block writers — T1 never waited for T2, and T2 never waited for T1.",
      uk: 'T1 читає id=1 знову й ДОСІ бачить v1 → 500. xmin v2 = 101 немає в snapshot T1 і він незафіксований, тож v2 невидимий для T1. Читачі не блокують записувачів — T1 не чекала на T2, а T2 не чекала на T1.',
    },
    op: 'T1:  SELECT balance FROM accounts WHERE id = 1;   -- → 500',
    who: 'T1 · xid 100',
    whoTone: QUERY,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'live' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'new' },
    ],
    sees: [
      { who: 'T1 (snapshot 100)', sees: 'v1 → 500  (stable!)', tone: QUERY },
      { who: 'T2 (uncommitted)', sees: 'v2 → 600', tone: DIST },
    ],
    highlight: 'read',
  },
  {
    phase: { en: 'T2 commits — v2 is now current', uk: 'T2 фіксується — v2 тепер поточна' },
    note: {
      en: "T2 commits. New snapshots will now see v2 = 600. v1 is a dead-tuple candidate — but T1 (xid 100) is still running and its snapshot still needs v1, so v1 can't be reclaimed yet.",
      uk: 'T2 фіксується. Нові snapshots тепер бачитимуть v2 = 600. v1 — кандидат на мертвий tuple — але T1 (xid 100) ще працює, і її snapshot ще потребує v1, тож v1 поки не можна звільнити.',
    },
    op: 'T2:  COMMIT;',
    who: 'T2 · xid 101',
    whoTone: DIST,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'dead' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'live' },
    ],
    sees: [
      { who: 'T1 (snapshot 100)', sees: 'v1 → 500', tone: QUERY },
      { who: 'new txn', sees: 'v2 → 600', tone: COMMIT },
    ],
    highlight: 'commit',
  },
  {
    phase: { en: 'T3 begins — sees the new version', uk: 'T3 починається — бачить нову версію' },
    note: {
      en: 'A fresh transaction T3 (xid 102) takes a later snapshot and sees the newest committed version: v2 → 600. Two transactions, two snapshots, two different answers — and both are correct for their point in time.',
      uk: 'Свіжа транзакція T3 (xid 102) бере пізніший snapshot і бачить найновішу зафіксовану версію: v2 → 600. Дві транзакції, два snapshots, дві різні відповіді — і обидві коректні для свого моменту.',
    },
    op: 'T3:  BEGIN;  SELECT balance FROM accounts WHERE id = 1;   -- → 600',
    who: 'T3 · xid 102',
    whoTone: ANALYTICS,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'dead' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'live' },
    ],
    sees: [
      { who: 'T1 (snapshot 100)', sees: 'v1 → 500', tone: QUERY },
      { who: 'T3 (snapshot 102)', sees: 'v2 → 600', tone: ANALYTICS },
    ],
    highlight: 'read',
  },
  {
    phase: { en: 'T1 ends — v1 is dead to everyone', uk: 'T1 завершується — v1 мертвий для всіх' },
    note: {
      en: 'T1 commits and ends. Now no active snapshot can see v1 — it is dead to everyone, pure garbage occupying space on the page. Until something reclaims it, it counts as bloat.',
      uk: 'T1 фіксується й завершується. Тепер жоден активний snapshot не бачить v1 — він мертвий для всіх, чисте сміття, що займає місце на page. Доки щось його не звільнить, це bloat.',
    },
    op: 'T1:  COMMIT;',
    who: 'T1 · xid 100',
    whoTone: QUERY,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'dead' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'live' },
    ],
    sees: [{ who: 'any txn', sees: 'v2 → 600', tone: COMMIT }],
    highlight: 'commit',
  },
  {
    phase: { en: 'VACUUM reclaims the dead tuple', uk: 'VACUUM звільняє мертвий tuple' },
    note: {
      en: 'VACUUM (usually autovacuum) finds v1 dead to every snapshot and frees its space for reuse. Only v2 remains. This collection step is the price of MVCC — and why an update-heavy table must be vacuumed.',
      uk: 'VACUUM (зазвичай autovacuum) знаходить v1 мертвим для кожного snapshot і звільняє його місце для повторного використання. Лишається лише v2. Цей крок збирання — ціна MVCC, і саме тому таблицю з рясними оновленнями треба вакуумити.',
    },
    op: '(autovacuum)  VACUUM accounts;',
    who: 'VACUUM',
    whoTone: COMMIT,
    tuples: [
      { v: 'v1', xmin: 90, xmax: 101, val: 500, state: 'gone' },
      { v: 'v2', xmin: 101, xmax: null, val: 600, state: 'live' },
    ],
    sees: [{ who: 'any txn', sees: 'v2 → 600', tone: COMMIT }],
    highlight: 'vacuum',
    outcome: {
      tone: 'good',
      text: {
        en: 'MVCC: T1 and T2 ran concurrently — a reader never blocked a writer. The cost is the dead tuple v1, which VACUUM had to reclaim. That is the bargain: no waiting now, garbage collection later.',
        uk: 'MVCC: T1 і T2 працювали конкурентно — читач ніколи не блокував записувача. Ціна — мертвий tuple v1, який VACUUM мусив звільнити. Така угода: без очікування зараз, збирання сміття згодом.',
      },
    },
  },
];

const LOCK: Frame[] = [
  {
    phase: { en: 'One row, one value (lock-based)', uk: 'Один рядок, одне значення (lock-based)' },
    note: {
      en: 'In a lock-based engine (strict 2PL) the row is a single cell, overwritten in place — there are no versions. Concurrency is managed by locks instead of snapshots.',
      uk: 'У lock-based движку (strict 2PL) рядок — це одна клітинка, що перезаписується на місці — версій немає. Конкурентність керується locks замість snapshots.',
    },
    op: 'table accounts — id = 1',
    who: 'heap',
    whoTone: STORAGE,
    rowVal: 500,
  },
  {
    phase: { en: 'T1 reads — takes a SHARED lock', uk: 'T1 читає — бере SHARED lock' },
    note: {
      en: 'Under strict two-phase locking a read takes a SHARED lock and holds it until commit. T1 reads 500 and keeps the lock on the row.',
      uk: 'За strict two-phase locking читання бере SHARED lock і тримає його до commit. T1 читає 500 і тримає lock на рядку.',
    },
    op: 'T1:  BEGIN;  SELECT balance FROM accounts WHERE id = 1;',
    who: 'T1 · xid 100',
    whoTone: QUERY,
    rowVal: 500,
    locks: [{ holder: 'T1 · SHARED (read)', tone: QUERY }],
    highlight: 'read',
  },
  {
    phase: { en: 'T2 wants to write — BLOCKED', uk: 'T2 хоче писати — ЗАБЛОКОВАНО' },
    note: {
      en: "T2 needs an EXCLUSIVE lock to write, but that conflicts with T1's shared lock — so T2 BLOCKS and waits. There is only one row, and it is locked. Writers block on readers: this is exactly the wait MVCC avoids.",
      uk: 'T2 потрібен EXCLUSIVE lock, щоб писати, але він конфліктує з shared lock T1 — тож T2 БЛОКУЄТЬСЯ і чекає. Рядок лише один, і він заблокований. Записувачі блокуються на читачах: це саме те очікування, якого уникає MVCC.',
    },
    op: 'T2:  BEGIN;  UPDATE accounts SET balance = 600 WHERE id = 1;   -- waits',
    who: 'T2 · xid 101',
    whoTone: DIST,
    rowVal: 500,
    locks: [{ holder: 'T1 · SHARED (read)', tone: QUERY }],
    waiting: 'T2 · EXCLUSIVE — WAITING for T1',
    highlight: 'block',
  },
  {
    phase: { en: 'T1 commits — releases its lock', uk: 'T1 фіксується — звільняє свій lock' },
    note: {
      en: 'T1 commits and drops its shared lock. Only now can T2 proceed — it was blocked the entire time T1 held the row, even though T1 only read it.',
      uk: 'T1 фіксується й скидає свій shared lock. Лише тепер T2 може просунутися — вона була заблокована весь час, поки T1 тримала рядок, хоч T1 його лише читала.',
    },
    op: 'T1:  COMMIT;',
    who: 'T1 · xid 100',
    whoTone: QUERY,
    rowVal: 500,
    locks: [],
    waiting: 'T2 · EXCLUSIVE — acquiring…',
    highlight: 'commit',
  },
  {
    phase: { en: 'T2 writes in place — no new version', uk: 'T2 пише на місці — без нової версії' },
    note: {
      en: 'T2 finally gets the exclusive lock and overwrites the value to 600 in place, then commits. No second version was ever created — so there is nothing for VACUUM to collect.',
      uk: 'T2 нарешті отримує exclusive lock і перезаписує значення на 600 на місці, тоді фіксується. Другої версії так і не створено — тож VACUUM нічого збирати.',
    },
    op: 'T2:  UPDATE → 600;  COMMIT;',
    who: 'T2 · xid 101',
    whoTone: DIST,
    rowVal: 600,
    locks: [],
    highlight: 'write',
    outcome: {
      tone: 'info',
      text: {
        en: 'Lock-based (2PL): T2 overwrote in place, so there are NO dead tuples to vacuum — but T2 was blocked the whole time T1 read the row. A reader blocked a writer. That is the trade MVCC makes the other way: no blocking, paid for with garbage.',
        uk: 'Lock-based (2PL): T2 перезаписала на місці, тож НЕМАЄ мертвих tuples для vacuum — але T2 була заблокована весь час, поки T1 читала рядок. Читач заблокував записувача. Це компроміс, який MVCC робить навпаки: без блокування, оплаченого сміттям.',
      },
    },
  },
];

const FRAMES: Record<Model, Frame[]> = { mvcc: MVCC, lock: LOCK };

function TupleChip({ tuple }: { tuple: Tuple }) {
  const { t } = useLang();
  return (
    <div className={cx('mvcc-tuple', `mvcc-tuple--${tuple.state}`)}>
      <span className="mvcc-tuple-v mono">{tuple.v}</span>
      <span className="mvcc-tuple-meta mono">
        xmin {tuple.xmin} · xmax {tuple.xmax ?? '—'}
      </span>
      <span className="mvcc-tuple-val mono">balance {tuple.val}</span>
      <span className="mvcc-tuple-state">{t(STATE_LABEL[tuple.state])}</span>
    </div>
  );
}

export function MvccSim() {
  const { t } = useLang();
  const [model, setModel] = useState<Model>('mvcc');
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const frames = FRAMES[model];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Reset the walk whenever the model changes.
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [model]);

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

  const status = useMemo(
    () => `${idx + 1}/${frames.length} · ${t(frame.phase)} — ${t(frame.note)}`,
    [idx, frames.length, frame, t],
  );
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim mvcc" aria-label="MVCC sim">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Concurrency model">
          <button
            role="tab"
            aria-selected={model === 'mvcc'}
            className={model === 'mvcc' ? 'seg-on' : ''}
            onClick={() => setModel('mvcc')}
          >
            {t({ en: 'MVCC (PostgreSQL)', uk: 'MVCC (PostgreSQL)' })}
          </button>
          <button
            role="tab"
            aria-selected={model === 'lock'}
            className={model === 'lock' ? 'seg-on' : ''}
            onClick={() => setModel('lock')}
          >
            {t({ en: 'Lock-based (2PL)', uk: 'Lock-based (2PL)' })}
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

      <div className="mvcc-body">
        {/* Current operation */}
        <div className={cx('mvcc-lane mvcc-op', frame.highlight === 'block' && 'mvcc-lane--block')}>
          <div className="mvcc-lane-head">
            <span className="mvcc-actor" style={{ color: frame.whoTone }}>
              {frame.who}
            </span>
            <span className="mvcc-phase dim">{t(frame.phase)}</span>
          </div>
          <pre className="mvcc-sql mono">
            <code>{frame.op}</code>
          </pre>
        </div>

        {/* Heap: version chain (mvcc) or single locked row (lock) */}
        <div className={cx('mvcc-lane', (frame.highlight === 'write' || frame.highlight === 'vacuum') && 'mvcc-lane--hot')}>
          <div className="mvcc-lane-head">
            <span className="mvcc-lane-name" style={{ color: STORAGE }}>
              {model === 'mvcc'
                ? t({ en: 'Heap — row versions (tuples)', uk: 'Heap — версії рядка (tuples)' })
                : t({ en: 'Heap — one row, overwritten in place', uk: 'Heap — один рядок, перезапис на місці' })}
            </span>
            <span className="mvcc-lane-tag dim">accounts · id = 1</span>
          </div>

          {model === 'mvcc' ? (
            <div className="mvcc-chain">
              {frame.tuples?.map((tp, i) => (
                <TupleChip key={tp.v + i} tuple={tp} />
              ))}
            </div>
          ) : (
            <div className="mvcc-lockrow">
              <span className="mvcc-lockrow-val mono">balance {frame.rowVal}</span>
              <div className="mvcc-locks">
                {(frame.locks ?? []).length === 0 && !frame.waiting && (
                  <span className="mvcc-lock-none dim">{t({ en: 'no locks held', uk: 'locks не тримаються' })}</span>
                )}
                {frame.locks?.map((l) => (
                  <span key={l.holder} className="mvcc-lock" style={{ color: l.tone, borderColor: l.tone }}>
                    🔒 {l.holder}
                  </span>
                ))}
                {frame.waiting && <span className="mvcc-wait">⏳ {frame.waiting}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Who-sees-what (mvcc only) */}
        {model === 'mvcc' && frame.sees && (
          <div className="mvcc-lane mvcc-sees">
            <span className="mvcc-lane-name dim">{t({ en: 'Visibility — who sees which version', uk: 'Видимість — хто яку версію бачить' })}</span>
            <div className="mvcc-sees-rows">
              {frame.sees.map((s) => (
                <div key={s.who} className="mvcc-see">
                  <span className="mvcc-see-who" style={{ color: s.tone }}>
                    {s.who}
                  </span>
                  <span className="mvcc-see-arrow dim">sees</span>
                  <span className="mvcc-see-val mono">{s.sees}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {frame.outcome && (
          <div className={cx('mvcc-outcome', `mvcc-outcome--${frame.outcome.tone}`)} role="status">
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
            en: 'MVCC: an UPDATE writes a new row version and stamps the old one — readers follow their snapshot, so reading never blocks writing. The cost is dead tuples that VACUUM reclaims. Toggle to lock-based to see the same schedule turn into a wait.',
            uk: 'MVCC: UPDATE пише нову версію рядка й штампує стару — читачі йдуть за своїм snapshot, тож читання ніколи не блокує запис. Ціна — мертві tuples, які звільняє VACUUM. Перемкніть на lock-based, щоб побачити, як той самий розклад стає очікуванням.',
          })}
        </span>
      </div>
    </section>
  );
}
