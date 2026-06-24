import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ Isolation anomalies sim (M18, signature). Pick an anomaly (dirty read · non-repeatable ·
 * phantom · lost update · write-skew) and an isolation level (Read Committed · Repeatable Read ·
 * Serializable), then step through a fixed two-transaction schedule on a T1 | T2 timeline. The
 * verdict panel flips live as you change the level — you watch each anomaly appear and disappear.
 * Semantics are PostgreSQL-accurate (verified against docs 13.2, Table 13.1):
 *   - PG never returns dirty reads (Read Uncommitted is mapped to Read Committed).
 *   - PG Repeatable Read = Snapshot Isolation → prevents non-repeatable AND phantom reads (stronger
 *     than the SQL standard), and aborts a conflicting update with 40001 (lost update prevented).
 *   - Snapshot Isolation still ALLOWS write-skew; only Serializable (SSI) catches it and rolls one
 *     transaction back with serialization_failure (40001).
 * Toggle/step-driven, reduced-motion-safe (Step works without Play); ARIA tablists + live region.
 * Facts: postgresql.org/docs/current/transaction-iso.html (Table 13.1; the SUM write-skew example;
 * "could not serialize access…"); Berenson et al. 1995; Cahill/Fekete/Röhm SSI (PG 9.1+).
 */
type Lvl = 'rc' | 'rr' | 'ser';
type Tx = 'T1' | 'T2';
type Step = { t: Tx; op: string; detail?: Localized };
type Outcome = { occurs: boolean; how: Localized };
type Anomaly = {
  id: string;
  name: Localized;
  premise: Localized;
  schedule: Step[];
  outcome: Record<Lvl, Outcome>;
};

const ANOMALIES: Anomaly[] = [
  {
    id: 'dirty',
    name: { en: 'Dirty read', uk: 'Dirty read' },
    premise: {
      en: 'accounts.balance = 100. T2 tries to read a value while T1 has changed it but not committed.',
      uk: 'accounts.balance = 100. T2 намагається прочитати значення, поки T1 його змінив, але не зафіксував.',
    },
    schedule: [
      { t: 'T1', op: 'BEGIN;' },
      { t: 'T1', op: 'UPDATE accounts SET balance = 0 WHERE id = 1;', detail: { en: 'uncommitted change', uk: 'незафіксована зміна' } },
      { t: 'T2', op: 'SELECT balance FROM accounts WHERE id = 1;', detail: { en: 'reads… 100 or 0?', uk: 'читає… 100 чи 0?' } },
      { t: 'T1', op: 'ROLLBACK;', detail: { en: 'the 0 never existed', uk: 'нуля ніколи не існувало' } },
    ],
    outcome: {
      rc: {
        occurs: false,
        how: {
          en: 'Prevented. PostgreSQL never returns uncommitted data: T2 reads the last committed value (100), not T1’s uncommitted 0.',
          uk: 'Запобігнуто. PostgreSQL ніколи не повертає незафіксовані дані: T2 читає останнє зафіксоване значення (100), а не незафіксований 0 від T1.',
        },
      },
      rr: {
        occurs: false,
        how: {
          en: 'Prevented — same as Read Committed. A dirty read is the one anomaly no PostgreSQL level permits.',
          uk: 'Запобігнуто — як і Read Committed. Dirty read — єдина аномалія, якої не дозволяє жоден рівень PostgreSQL.',
        },
      },
      ser: {
        occurs: false,
        how: {
          en: 'Prevented. In the SQL standard a dirty read is allowed at Read Uncommitted; PostgreSQL has no such mode — it maps Read Uncommitted to Read Committed.',
          uk: 'Запобігнуто. За SQL-стандартом dirty read дозволено на Read Uncommitted; у PostgreSQL такого режиму немає — він зводить Read Uncommitted до Read Committed.',
        },
      },
    },
  },
  {
    id: 'nonrepeatable',
    name: { en: 'Non-repeatable read', uk: 'Non-repeatable read' },
    premise: {
      en: 'products.price = 100. T1 reads the same row twice; T2 commits a change in between.',
      uk: 'products.price = 100. T1 читає той самий рядок двічі; T2 фіксує зміну поміж ними.',
    },
    schedule: [
      { t: 'T1', op: 'BEGIN;' },
      { t: 'T1', op: 'SELECT price FROM products WHERE id = 7;', detail: { en: '→ 100', uk: '→ 100' } },
      { t: 'T2', op: 'UPDATE products SET price = 120 WHERE id = 7;  COMMIT;', detail: { en: 'committed', uk: 'зафіксовано' } },
      { t: 'T1', op: 'SELECT price FROM products WHERE id = 7;', detail: { en: 'same row again…', uk: 'той самий рядок знову…' } },
      { t: 'T1', op: 'COMMIT;' },
    ],
    outcome: {
      rc: {
        occurs: true,
        how: {
          en: 'Occurs. Read Committed takes a fresh snapshot per statement, so T1’s second read returns 120 — the same row gave two different answers in one transaction.',
          uk: 'Стається. Read Committed бере свіжий snapshot на кожен statement, тож друге читання T1 повертає 120 — той самий рядок дав дві різні відповіді в одній транзакції.',
        },
      },
      rr: {
        occurs: false,
        how: {
          en: 'Prevented. Repeatable Read fixes one snapshot at transaction start, so T1’s re-read still sees 100. T2’s change is invisible until T1 ends.',
          uk: 'Запобігнуто. Repeatable Read фіксує один snapshot на старті транзакції, тож повторне читання T1 досі бачить 100. Зміна T2 невидима, доки T1 не завершиться.',
        },
      },
      ser: {
        occurs: false,
        how: {
          en: 'Prevented — Serializable includes the snapshot guarantee of Repeatable Read, so the re-read is stable at 100.',
          uk: 'Запобігнуто — Serializable включає snapshot-гарантію Repeatable Read, тож повторне читання стабільне на 100.',
        },
      },
    },
  },
  {
    id: 'phantom',
    name: { en: 'Phantom read', uk: 'Phantom read' },
    premise: {
      en: '2 items match price < 50. T1 counts them twice; T2 inserts a new matching row in between.',
      uk: '2 items відповідають price < 50. T1 рахує їх двічі; T2 вставляє новий відповідний рядок поміж ними.',
    },
    schedule: [
      { t: 'T1', op: 'BEGIN;' },
      { t: 'T1', op: 'SELECT count(*) FROM items WHERE price < 50;', detail: { en: '→ 2', uk: '→ 2' } },
      { t: 'T2', op: "INSERT INTO items(price) VALUES (10);  COMMIT;", detail: { en: 'a new matching row', uk: 'новий відповідний рядок' } },
      { t: 'T1', op: 'SELECT count(*) FROM items WHERE price < 50;', detail: { en: 'same query again…', uk: 'той самий запит знову…' } },
      { t: 'T1', op: 'COMMIT;' },
    ],
    outcome: {
      rc: {
        occurs: true,
        how: {
          en: 'Occurs. The second count returns 3 — a phantom row appeared in the result set because Read Committed re-snapshots each statement.',
          uk: 'Стається. Другий count повертає 3 — у вибірці зʼявився phantom-рядок, бо Read Committed бере новий snapshot на кожен statement.',
        },
      },
      rr: {
        occurs: false,
        how: {
          en: 'Prevented — and this is where PostgreSQL is stronger than the SQL standard. Its Repeatable Read (Snapshot Isolation) prevents phantoms; the count stays 2. The standard actually permits phantoms at this level.',
          uk: 'Запобігнуто — і саме тут PostgreSQL сильніший за SQL-стандарт. Його Repeatable Read (Snapshot Isolation) запобігає phantom-ам; count лишається 2. Стандарт же дозволяє phantom-и на цьому рівні.',
        },
      },
      ser: {
        occurs: false,
        how: {
          en: 'Prevented. Serializable also keeps the count at 2 and additionally guards against serialization anomalies built on such reads.',
          uk: 'Запобігнуто. Serializable теж тримає count на 2 і додатково захищає від serialization-аномалій, збудованих на таких читаннях.',
        },
      },
    },
  },
  {
    id: 'lostupdate',
    name: { en: 'Lost update', uk: 'Lost update' },
    premise: {
      en: 'counters.value = 100. Both transactions read it, add 1, and write back (read-modify-write).',
      uk: 'counters.value = 100. Обидві транзакції читають його, додають 1 і записують назад (read-modify-write).',
    },
    schedule: [
      { t: 'T1', op: 'BEGIN;  SELECT value FROM counters WHERE id = 1;', detail: { en: '→ 100', uk: '→ 100' } },
      { t: 'T2', op: 'BEGIN;  SELECT value FROM counters WHERE id = 1;', detail: { en: '→ 100 (same)', uk: '→ 100 (те саме)' } },
      { t: 'T1', op: 'UPDATE counters SET value = 101 WHERE id = 1;  COMMIT;', detail: { en: '100 + 1', uk: '100 + 1' } },
      { t: 'T2', op: 'UPDATE counters SET value = 101 WHERE id = 1;', detail: { en: 'based on its stale 100…', uk: 'на основі застарілого 100…' } },
      { t: 'T2', op: 'COMMIT;' },
    ],
    outcome: {
      rc: {
        occurs: true,
        how: {
          en: 'Occurs. Both read 100; T2’s write of 101 lands on top of T1’s 101 — one increment is lost (final 101, should be 102). Avoid it with SELECT … FOR UPDATE or an atomic UPDATE … SET value = value + 1.',
          uk: 'Стається. Обидві прочитали 100; запис T2 (101) лягає поверх 101 від T1 — один інкремент втрачено (фінал 101, мало б 102). Уникайте через SELECT … FOR UPDATE або атомарний UPDATE … SET value = value + 1.',
        },
      },
      rr: {
        occurs: false,
        how: {
          en: 'Prevented by abort. When T2 tries to update a row T1 already updated and committed, PostgreSQL raises “could not serialize access due to concurrent update” (40001). T2 retries, reads 101, writes 102.',
          uk: 'Запобігнуто скасуванням. Коли T2 намагається оновити рядок, який T1 уже оновив і зафіксував, PostgreSQL кидає «could not serialize access due to concurrent update» (40001). T2 повторює, читає 101, пише 102.',
        },
      },
      ser: {
        occurs: false,
        how: {
          en: 'Prevented — Serializable gives at least the Repeatable Read protection, so the conflicting update aborts with 40001 and the retry computes 102.',
          uk: 'Запобігнуто — Serializable дає щонайменше захист Repeatable Read, тож конфліктний update скасовується з 40001, а повтор обчислює 102.',
        },
      },
    },
  },
  {
    id: 'writeskew',
    name: { en: 'Write-skew', uk: 'Write-skew' },
    premise: {
      en: 'Invariant: ≥ 1 doctor on call. Alice and Bob are both on call. Each transaction takes one off.',
      uk: 'Інваріант: ≥ 1 лікар на чергуванні. Alice і Bob обидва на чергуванні. Кожна транзакція знімає одного.',
    },
    schedule: [
      { t: 'T1', op: "BEGIN;  SELECT count(*) FROM doctors WHERE on_call;", detail: { en: '→ 2  (ok, ≥ 1)', uk: '→ 2  (ок, ≥ 1)' } },
      { t: 'T2', op: "BEGIN;  SELECT count(*) FROM doctors WHERE on_call;", detail: { en: '→ 2  (ok, ≥ 1)', uk: '→ 2  (ок, ≥ 1)' } },
      { t: 'T1', op: "UPDATE doctors SET on_call = false WHERE name = 'Alice';" },
      { t: 'T2', op: "UPDATE doctors SET on_call = false WHERE name = 'Bob';", detail: { en: 'a different row', uk: 'інший рядок' } },
      { t: 'T1', op: 'COMMIT;' },
      { t: 'T2', op: 'COMMIT;' },
    ],
    outcome: {
      rc: {
        occurs: true,
        how: {
          en: 'Occurs. The two updates touch different rows, so nothing conflicts: both commit and now 0 doctors are on call — the invariant is broken.',
          uk: 'Стається. Два update-и зачіпають різні рядки, тож нічого не конфліктує: обидві фіксуються, і тепер 0 лікарів на чергуванні — інваріант зламано.',
        },
      },
      rr: {
        occurs: true,
        how: {
          en: 'Still occurs — this is the limit of Snapshot Isolation. Each transaction reads a snapshot showing 2 on call and writes a disjoint row, so neither sees the other. Both commit; 0 on call. SI does NOT prevent write-skew.',
          uk: 'Усе одно стається — це межа Snapshot Isolation. Кожна транзакція читає snapshot, де 2 на чергуванні, і пише неперетинний рядок, тож жодна не бачить іншу. Обидві фіксуються; 0 на чергуванні. SI НЕ запобігає write-skew.',
        },
      },
      ser: {
        occurs: false,
        how: {
          en: 'Prevented. Serializable (SSI) tracks the read/write dependency between the two transactions, detects that no serial order produces this result, and rolls one back with serialization_failure (40001). The retry sees 1 on call and is refused.',
          uk: 'Запобігнуто. Serializable (SSI) відстежує read/write-залежність між двома транзакціями, виявляє, що жоден серійний порядок не дає такого результату, і відкочує одну з serialization_failure (40001). Повтор бачить 1 на чергуванні й отримує відмову.',
        },
      },
    },
  },
];

const LEVELS: { id: Lvl; label: Localized }[] = [
  { id: 'rc', label: { en: 'Read Committed', uk: 'Read Committed' } },
  { id: 'rr', label: { en: 'Repeatable Read', uk: 'Repeatable Read' } },
  { id: 'ser', label: { en: 'Serializable', uk: 'Serializable' } },
];

const byId = (id: string): Anomaly => ANOMALIES.find((a) => a.id === id) ?? ANOMALIES[0];

export function IsolationSim() {
  const { t } = useLang();
  const [anomalyId, setAnomalyId] = useState<string>('writeskew');
  const [level, setLevel] = useState<Lvl>('rr');
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const anomaly = byId(anomalyId);
  const steps = anomaly.schedule;
  const outcome = anomaly.outcome[level];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Restart the walk when the anomaly changes (the schedule is different).
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [anomalyId]);

  const atEnd = idx >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), 1500);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx, steps.length]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const verdict = useMemo<Localized>(
    () =>
      outcome.occurs
        ? { en: 'Anomaly occurs', uk: 'Аномалія стається' }
        : { en: 'Prevented', uk: 'Запобігнуто' },
    [outcome.occurs],
  );

  const status = useMemo(() => {
    const lvlLabel = LEVELS.find((l) => l.id === level)?.label ?? LEVELS[0].label;
    return `${t(anomaly.name)} @ ${t(lvlLabel)}: ${t(verdict)} — ${t(outcome.how)}`;
  }, [anomaly, level, verdict, outcome, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim iso" aria-label="Isolation anomalies sim">
      <div className="sim-bar iso-bar">
        <div className="iso-pick">
          <span className="iso-pick-label dim">{t({ en: 'Anomaly', uk: 'Аномалія' })}</span>
          <div className="seg seg-wrap" role="tablist" aria-label="Anomaly">
            {ANOMALIES.map((a) => (
              <button
                key={a.id}
                role="tab"
                aria-selected={anomalyId === a.id}
                className={anomalyId === a.id ? 'seg-on' : ''}
                onClick={() => setAnomalyId(a.id)}
              >
                {t(a.name)}
              </button>
            ))}
          </div>
        </div>

        <div className="iso-pick">
          <span className="iso-pick-label dim">{t({ en: 'Isolation level', uk: 'Isolation level' })}</span>
          <div className="seg seg-wrap" role="tablist" aria-label="Isolation level">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                role="tab"
                aria-selected={level === l.id}
                className={level === l.id ? 'seg-on' : ''}
                onClick={() => setLevel(l.id)}
              >
                {t(l.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="iso-premise">
        <span className="iso-premise-tag dim">{t({ en: 'Setup', uk: 'Початок' })}</span>
        {t(anomaly.premise)}
      </p>

      <div className="sim-inline" role="group" aria-label="Playback">
        {!reduced && (
          <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
            {playing ? t(ui.pause) : t(ui.play)}
          </button>
        )}
        <button className="btn" type="button" onClick={step} disabled={atEnd}>
          {t(ui.showStep)} ({idx + 1}/{steps.length})
        </button>
        <button className="btn btn-ghost" type="button" onClick={reset}>
          {t(ui.reset)}
        </button>
      </div>

      <div className="iso-timeline">
        <div className="iso-cols-head">
          <span className="iso-col-name" style={{ color: 'var(--c-query)' }}>
            T1
          </span>
          <span className="iso-time dim">{t({ en: 'time ↓', uk: 'час ↓' })}</span>
          <span className="iso-col-name" style={{ color: 'var(--c-dist)' }}>
            T2
          </span>
        </div>
        <ol className="iso-steps">
          {steps.slice(0, idx + 1).map((s, i) => (
            <li key={i} className={cx('iso-step', `iso-step--${s.t.toLowerCase()}`, i === idx && 'iso-step--now')}>
              <div className="iso-cell mono">
                <span className="iso-op">{s.op}</span>
                {s.detail && <span className="iso-detail dim">{t(s.detail)}</span>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={cx('iso-verdict', outcome.occurs ? 'iso-verdict--bad' : 'iso-verdict--good')} role="status">
        <span className="iso-verdict-tag">{t(verdict)}</span>
        <span className="iso-verdict-how">{t(outcome.how)}</span>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span className="dim">
          {t({
            en: 'Change the isolation level and the verdict flips. PostgreSQL semantics: Repeatable Read = Snapshot Isolation (prevents phantoms, allows write-skew); Serializable = SSI (catches write-skew, may raise 40001 → retry).',
            uk: 'Змініть isolation level — і вердикт перемикається. Семантика PostgreSQL: Repeatable Read = Snapshot Isolation (запобігає phantom-ам, дозволяє write-skew); Serializable = SSI (ловить write-skew, може кинути 40001 → повтор).',
          })}
        </span>
      </div>
    </section>
  );
}
