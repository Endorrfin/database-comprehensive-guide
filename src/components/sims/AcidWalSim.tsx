import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ ACID / WAL stepper (M17, light signature). One money-transfer transaction walks the
 * write-ahead path: each change appends a redo record to the WAL and dirties a page in the
 * buffer cache (RAM) — the data files on disk are NOT touched yet. A scenario toggle decides
 * WHERE the crash lands:
 *   • "Crash after COMMIT" → the COMMIT record was fsync'd, so recovery REDOes the change from
 *     the WAL and the transfer survives  → Durability.
 *   • "Crash before COMMIT" → there is no COMMIT record, so recovery discards the half-done work
 *     and the data is as if the txn never ran  → Atomicity.
 * One log gives you BOTH A and D — the whole point of write-ahead logging. Deterministic, no
 * engine; play/pause/step + reduced-motion fallback + ARIA live region, mirroring LsmSim/BTreeSim.
 * Facts (postgresql.org/docs/current): wal-intro 28.3 ("changes to data files must be written
 * only after WAL records … have been flushed … redone from the WAL records … REDO"), wal-async
 * 28.4 + runtime-config-wal 19.5 (synchronous_commit / fsync). ACID coined by Härder & Reuter 1983.
 */
type Scenario = 'after' | 'before';
type Acct = { a: number; b: number };
type WalRec = { id: string; text: string; commit?: boolean; pending?: boolean };
type Phase = 'wal' | 'commit' | 'crash' | 'recover';

type Frame = {
  phase: Localized;
  note: Localized;
  sql: string; // current operation (mono; SQL keywords stay English)
  wal: WalRec[]; // records appended so far
  ram: Acct | null; // buffer cache — null once a crash wipes RAM
  disk: Acct; // data files on disk
  highlight?: Phase;
  txStatus: Localized;
  durable?: boolean; // the commit/durability point has passed
  outcome?: { good: boolean; text: Localized };
};

const START: Acct = { a: 500, b: 300 };
const DONE: Acct = { a: 400, b: 400 };
const R_DEBIT: WalRec = { id: 'w1', text: 'redo: id=1  balance 500→400' };
const R_CREDIT: WalRec = { id: 'w2', text: 'redo: id=2  balance 300→400' };
const R_COMMIT: WalRec = { id: 'w3', text: 'COMMIT  (fsync → durable)', commit: true };

const COMMON: Frame[] = [
  {
    phase: { en: 'BEGIN', uk: 'BEGIN' },
    note: {
      en: 'A transfer of $100 from account 1 to account 2 begins. Both copies — the in-memory buffer cache and the on-disk data files — agree: 500 / 300. Nothing is logged yet.',
      uk: 'Починається переказ $100 з рахунку 1 на рахунок 2. Обидві копії — buffer cache у памʼяті й data files на диску — збігаються: 500 / 300. Ще нічого не залоговано.',
    },
    sql: 'BEGIN;',
    wal: [],
    ram: { ...START },
    disk: { ...START },
    txStatus: { en: 'running', uk: 'виконується' },
  },
  {
    phase: { en: 'Write-ahead the debit', uk: 'Write-ahead дебету' },
    note: {
      en: 'UPDATE debits account 1. Before the page changes, a redo record is appended to the WAL (sequential write). Only then is the page dirtied in the buffer cache → 400. The data file on disk is still 500.',
      uk: 'UPDATE дебетує рахунок 1. Перед зміною page до WAL додається redo-запис (послідовний запис). І лише тоді page брудниться в buffer cache → 400. Data file на диску досі 500.',
    },
    sql: "UPDATE accounts SET balance = balance - 100 WHERE id = 1;",
    wal: [R_DEBIT],
    ram: { a: 400, b: 300 },
    disk: { ...START },
    highlight: 'wal',
    txStatus: { en: 'running', uk: 'виконується' },
  },
  {
    phase: { en: 'Write-ahead the credit', uk: 'Write-ahead кредиту' },
    note: {
      en: 'UPDATE credits account 2 — again log first, then dirty the page → 400. Both changes now live in the WAL and in RAM, but the data files on disk are untouched (still 500 / 300). That is deliberate: pages are flushed lazily.',
      uk: 'UPDATE кредитує рахунок 2 — знову спершу лог, тоді бруднимо page → 400. Обидві зміни тепер у WAL і в RAM, але data files на диску незаймані (досі 500 / 300). Це навмисно: pages скидаються лінькувато.',
    },
    sql: "UPDATE accounts SET balance = balance + 100 WHERE id = 2;",
    wal: [R_DEBIT, R_CREDIT],
    ram: { a: 400, b: 400 },
    disk: { ...START },
    highlight: 'wal',
    txStatus: { en: 'running', uk: 'виконується' },
  },
];

const AFTER: Frame[] = [
  ...COMMON,
  {
    phase: { en: 'COMMIT → fsync the WAL', uk: 'COMMIT → fsync WAL' },
    note: {
      en: 'COMMIT appends a commit record and flushes the WAL up to it with one fsync. THIS is the durability point: the client is told "committed" the instant the log is on disk — even though the dirty data pages are still only in RAM. Flushing one sequential log beats flushing every scattered data page.',
      uk: 'COMMIT додає commit-запис і скидає WAL до нього одним fsync. САМЕ це точка durability: клієнту кажуть «committed» тієї миті, коли лог на диску — хоча брудні data pages досі лише в RAM. Скинути один послідовний лог дешевше, ніж кожен розкиданий data page.',
    },
    sql: 'COMMIT;',
    wal: [R_DEBIT, R_CREDIT, R_COMMIT],
    ram: { a: 400, b: 400 },
    disk: { ...START },
    highlight: 'commit',
    durable: true,
    txStatus: { en: "committed · WAL fsync'd", uk: 'committed · WAL fsync-нуто' },
  },
  {
    phase: { en: 'Crash (power loss)', uk: 'Збій (втрата живлення)' },
    note: {
      en: 'The server dies. The buffer cache (RAM) is gone, so the dirty 400 / 400 pages vanish — and they never reached the data files, which still read a stale 500 / 300. But the WAL on disk is intact and contains the COMMIT record. The committed change is not lost; it is recorded in the log.',
      uk: 'Сервер падає. Buffer cache (RAM) зникає, тож брудні pages 400 / 400 пропадають — і вони так і не дійшли до data files, які досі показують застарілі 500 / 300. Але WAL на диску цілий і містить commit-запис. Зафіксована зміна не втрачена; вона записана в лог.',
    },
    sql: '✕  crash  /  power loss',
    wal: [R_DEBIT, R_CREDIT, R_COMMIT],
    ram: null,
    disk: { ...START },
    highlight: 'crash',
    durable: true,
    txStatus: { en: 'server down', uk: 'сервер недоступний' },
  },
  {
    phase: { en: 'Recovery → REDO', uk: 'Відновлення → REDO' },
    note: {
      en: 'On restart the database replays the WAL forward from the last checkpoint. It sees the debit, the credit, and the COMMIT, so it re-applies them to the data files → 400 / 400. Roll-forward (REDO) reconstructs exactly what was lost from RAM.',
      uk: 'Під час перезапуску база відтворює WAL уперед від останнього checkpoint. Вона бачить дебет, кредит і COMMIT, тож повторно застосовує їх до data files → 400 / 400. Roll-forward (REDO) відновлює саме те, що зникло з RAM.',
    },
    sql: 'recovery: redo from last checkpoint',
    wal: [R_DEBIT, R_CREDIT, R_COMMIT],
    ram: { ...DONE },
    disk: { ...DONE },
    highlight: 'recover',
    durable: true,
    txStatus: { en: 'committed · durable ✓', uk: 'committed · durable ✓' },
    outcome: {
      good: true,
      text: {
        en: 'Durability (D): a transaction reported committed survives a crash — the WAL replayed it back into the data files.',
        uk: 'Durability (D): транзакція, про яку повідомлено «committed», переживає збій — WAL відтворив її назад у data files.',
      },
    },
  },
];

const BEFORE: Frame[] = [
  ...COMMON.map((f, i) =>
    i === 0
      ? f
      : {
          ...f,
          // No fsync yet — these records may still sit in the WAL buffer; mark them pending.
          wal: f.wal.map((r) => ({ ...r, pending: true })),
        },
  ),
  {
    phase: { en: 'Crash before COMMIT', uk: 'Збій до COMMIT' },
    note: {
      en: 'The server dies mid-transaction — no COMMIT was ever issued. RAM is wiped (the 400 / 400 pages are gone), the data files still read 500 / 300, and the WAL holds the two change records but NO commit record. The transaction was never durable, and the client was never told otherwise.',
      uk: 'Сервер падає посеред транзакції — COMMIT так і не було видано. RAM стерто (pages 400 / 400 зникли), data files досі показують 500 / 300, а WAL тримає два записи змін, але ЖОДНОГО commit-запису. Транзакція ніколи не була durable, і клієнту не казали інакше.',
    },
    sql: '✕  crash  (no COMMIT)',
    wal: [
      { ...R_DEBIT, pending: true },
      { ...R_CREDIT, pending: true },
    ],
    ram: null,
    disk: { ...START },
    highlight: 'crash',
    txStatus: { en: 'interrupted', uk: 'перервано' },
  },
  {
    phase: { en: 'Recovery → discard', uk: 'Відновлення → відкинути' },
    note: {
      en: 'Recovery replays the WAL but finds no COMMIT record for this transaction, so its changes are not made visible — the tuple versions are treated as aborted (and later vacuumed). The data files stay at 500 / 300, exactly as if the transfer never happened.',
      uk: 'Відновлення відтворює WAL, але не знаходить commit-запису для цієї транзакції, тож її зміни не стають видимими — версії рядків трактуються як aborted (і згодом вичищаються vacuum). Data files лишаються 500 / 300, точно ніби переказу й не було.',
    },
    sql: 'recovery: no COMMIT → roll back',
    wal: [
      { ...R_DEBIT, pending: true },
      { ...R_CREDIT, pending: true },
    ],
    ram: { ...START },
    disk: { ...START },
    highlight: 'recover',
    txStatus: { en: 'rolled back · atomic ✓', uk: 'rolled back · atomic ✓' },
    outcome: {
      good: true,
      text: {
        en: 'Atomicity (A): with no COMMIT in the log, the half-done transfer is discarded entirely — all-or-nothing, never half-applied.',
        uk: 'Atomicity (A): без COMMIT у лозі недороблений переказ відкидається повністю — все-або-нічого, ніколи наполовину.',
      },
    },
  },
];

const FRAMES: Record<Scenario, Frame[]> = { after: AFTER, before: BEFORE };

function Store({ label, tag, acct, gone }: { label: Localized; tag: Localized; acct: Acct | null; gone?: boolean }) {
  const { t } = useLang();
  return (
    <div className={cx('acid-store', gone && 'acid-store--gone')}>
      <div className="acid-store-head">
        <span className="acid-store-name">{t(label)}</span>
        <span className="acid-store-tag dim">{t(tag)}</span>
      </div>
      {acct === null ? (
        <span className="acid-store-wiped mono">{t({ en: '— wiped on crash —', uk: '— стерто збоєм —' })}</span>
      ) : (
        <div className="acid-accts">
          <span className="acid-acct mono">
            id=1 <b>{acct.a}</b>
          </span>
          <span className="acid-acct mono">
            id=2 <b>{acct.b}</b>
          </span>
        </div>
      )}
    </div>
  );
}

export function AcidWalSim() {
  const { t } = useLang();
  const [scenario, setScenario] = useState<Scenario>('after');
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

  // Reset the walk whenever the scenario changes.
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
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), 1600);
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
    <section className="sim acid" aria-label="ACID / WAL stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Crash scenario">
          <button
            role="tab"
            aria-selected={scenario === 'after'}
            className={scenario === 'after' ? 'seg-on' : ''}
            onClick={() => setScenario('after')}
          >
            {t({ en: 'Crash after COMMIT', uk: 'Збій після COMMIT' })}
          </button>
          <button
            role="tab"
            aria-selected={scenario === 'before'}
            className={scenario === 'before' ? 'seg-on' : ''}
            onClick={() => setScenario('before')}
          >
            {t({ en: 'Crash before COMMIT', uk: 'Збій до COMMIT' })}
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

      <div className="acid-body">
        {/* Transaction op */}
        <div className={cx('acid-lane acid-tx', frame.highlight === 'crash' && 'acid-lane--crash')}>
          <div className="acid-lane-head">
            <span className="acid-lane-name" style={{ color: 'var(--c-query)' }}>
              {t({ en: 'Transaction', uk: 'Транзакція' })}
            </span>
            <span className={cx('acid-txstatus', frame.durable && 'acid-txstatus--ok')}>{t(frame.txStatus)}</span>
          </div>
          <pre className="acid-sql mono">
            <code>{frame.sql}</code>
          </pre>
        </div>

        {/* WAL */}
        <div className={cx('acid-lane', (frame.highlight === 'wal' || frame.highlight === 'commit') && 'acid-lane--hot')}>
          <div className="acid-lane-head">
            <span className="acid-lane-name" style={{ color: 'var(--c-commit)' }}>
              {t({ en: 'WAL — sequential log on disk', uk: 'WAL — послідовний лог на диску' })}
            </span>
            <span className="acid-lane-tag dim">
              {t({ en: 'append-only · fsync at commit', uk: 'лише дозапис · fsync на commit' })}
            </span>
          </div>
          <div className="acid-wal">
            {frame.wal.length === 0 ? (
              <span className="acid-empty dim">{t({ en: 'empty', uk: 'порожньо' })}</span>
            ) : (
              frame.wal.map((r) => (
                <span
                  key={r.id}
                  className={cx('acid-wal-rec mono', r.commit && 'acid-wal-rec--commit', r.pending && 'acid-wal-rec--pending')}
                >
                  {r.text}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Data pages: RAM vs disk */}
        <div className={cx('acid-lane', frame.highlight === 'recover' && 'acid-lane--hot')}>
          <div className="acid-lane-head">
            <span className="acid-lane-name" style={{ color: 'var(--c-storage)' }}>
              {t({ en: 'Data pages', uk: 'Data pages' })}
            </span>
            <span className="acid-lane-tag dim">
              {t({ en: 'flushed lazily — the WAL is the source of truth', uk: 'скидаються лінькувато — джерело істини це WAL' })}
            </span>
          </div>
          <div className="acid-pages">
            <Store
              label={{ en: 'buffer cache (RAM)', uk: 'buffer cache (RAM)' }}
              tag={{ en: 'volatile', uk: 'нестійка' }}
              acct={frame.ram}
              gone={frame.ram === null}
            />
            <Store
              label={{ en: 'data files (disk)', uk: 'data files (диск)' }}
              tag={{ en: 'durable', uk: 'стійка' }}
              acct={frame.disk}
            />
          </div>
        </div>

        {frame.outcome && (
          <div className={cx('acid-outcome', frame.outcome.good ? 'acid-outcome--good' : 'acid-outcome--bad')} role="status">
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
            en: 'Rule: a change is logged (and the log fsync’d at commit) before the data pages are flushed — so any committed change can be redone from the WAL after a crash.',
            uk: 'Правило: зміна логується (а лог fsync-ується на commit) перш ніж скидаються data pages — тож будь-яку зафіксовану зміну можна повторити з WAL після збою.',
          })}
        </span>
      </div>
    </section>
  );
}
