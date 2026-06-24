import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { cx } from '../../lib/utils';

/*
 * ★ Query Planner / EXPLAIN sim (M16, signature). One fixed two-table join; two toggles model
 * what the cost-based planner actually reacts to — (1) does an index exist on the filter column,
 * (2) how selective is the predicate. The 2×2 flips BOTH the access path (Index Scan vs Seq Scan)
 * AND the join algorithm (Nested Loop vs Hash Join), and the estimated cost/rows move with them —
 * the payoff that "the planner bets on statistics, then picks the cheapest physical plan".
 * Toggle-driven and inherently reduced-motion-safe (no animation loop); ARIA tablists + live region.
 * Facts (postgresql.org/docs/current): planner-optimizer 51.5 (nested-loop/hash/merge), using-explain
 * 14.1 (estimated vs actual rows), planner cost constants (seq_page_cost 1.0 / random_page_cost 4.0).
 */
const SQL = `SELECT o.id, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'open';`;

type Combo = 'is' | 'ib' | 'ns' | 'nb'; // (i)ndexed/(n)o-index × (s)elective/(b)road
type Plan = {
  scan: string; // access-path keyword (stays English)
  join: string; // join-algorithm keyword (stays English)
  cost: number;
  rows: number;
  tree: string[]; // plan-tree lines (monospace, English keywords)
  why: Localized;
};

const PLANS: Record<Combo, Plan> = {
  is: {
    scan: 'Index Scan',
    join: 'Nested Loop',
    cost: 340,
    rows: 80,
    tree: [
      'Nested Loop                          (rows=80  cost=340)',
      '├─ Index Scan using orders_status_idx on orders',
      "│    Index Cond: status = 'open'      (rows=80)",
      '└─ Index Scan using customers_pkey on customers',
      '     Index Cond: id = o.customer_id   (once per outer row)',
    ],
    why: {
      en: 'Few driving rows + an indexed inner table → a nested loop that probes the customers primary key ~80 times is cheapest. The index turns “find the open orders” into a handful of page reads, and with so few outer rows there is no reason to build a hash table.',
      uk: 'Мало рядків на ведучому боці + індексована внутрішня таблиця → найдешевший nested loop, що зондує primary key customers ~80 разів. Index перетворює «знайти відкриті замовлення» на кілька читань pages, а за такої малої кількості зовнішніх рядків будувати hash-таблицю нема сенсу.',
    },
  },
  ib: {
    scan: 'Seq Scan',
    join: 'Hash Join',
    cost: 28500,
    rows: 600000,
    tree: [
      'Hash Join                            (rows=600000  cost=28500)',
      "│  Hash Cond: o.customer_id = c.id",
      '├─ Seq Scan on orders',
      "│    Filter: status = 'open'         (rows=600000)",
      '└─ Hash',
      '     └─ Seq Scan on customers        (rows=50000)',
    ],
    why: {
      en: 'The predicate matches most of the table, so an Index Scan would do ~600,000 random heap fetches — more expensive than reading the table sequentially once. The index exists, and the planner correctly refuses it. Many rows on both sides → a hash join beats a nested loop.',
      uk: 'Предикат зачіпає більшість таблиці, тож Index Scan зробив би ~600 000 випадкових походів у heap — дорожче, ніж один послідовний прохід таблицею. Index є, і planner правильно від нього відмовляється. Багато рядків з обох боків → hash join перемагає nested loop.',
    },
  },
  ns: {
    scan: 'Seq Scan',
    join: 'Nested Loop',
    cost: 14200,
    rows: 80,
    tree: [
      'Nested Loop                          (rows=80  cost=14200)',
      '├─ Seq Scan on orders',
      "│    Filter: status = 'open'         (rows=80, scanned 1,000,000)",
      '└─ Index Scan using customers_pkey on customers',
      '     Index Cond: id = o.customer_id',
    ],
    why: {
      en: 'Only 80 rows match, so a nested loop on the customers primary key is still the right join — but with no index on status the planner must Seq Scan all 1,000,000 orders to find those 80. Same selective predicate as the indexed case, ~40× the cost: a selective predicate only pays off if it is also indexable (sargable).',
      uk: 'Збігається лише 80 рядків, тож nested loop по primary key customers усе ще правильний join — але без index на status planner мусить Seq Scan-ити всі 1 000 000 orders, щоб знайти ті 80. Той самий селективний предикат, що й в індексованому випадку, ~40× вартості: селективний предикат вигідний лише якщо він ще й індексовний (sargable).',
    },
  },
  nb: {
    scan: 'Seq Scan',
    join: 'Hash Join',
    cost: 29000,
    rows: 600000,
    tree: [
      'Hash Join                            (rows=600000  cost=29000)',
      "│  Hash Cond: o.customer_id = c.id",
      '├─ Seq Scan on orders',
      "│    Filter: status = 'open'         (rows=600000)",
      '└─ Hash',
      '     └─ Seq Scan on customers        (rows=50000)',
    ],
    why: {
      en: 'No useful index and most rows match: read both tables sequentially and hash-join them. This is the baseline plan the other three are measured against — the planner only departs from it when statistics say a cheaper path exists.',
      uk: 'Корисного index немає й більшість рядків збігається: читаємо обидві таблиці послідовно й зʼєднуємо hash join. Це базовий план, з яким порівнюються інші три — planner відходить від нього лише коли statistics кажуть, що є дешевший шлях.',
    },
  },
};

const MAX_COST = 29000;

export function QueryPlannerSim() {
  const { t } = useLang();
  const [indexed, setIndexed] = useState(true);
  const [selective, setSelective] = useState(true);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const combo: Combo = `${indexed ? 'i' : 'n'}${selective ? 's' : 'b'}` as Combo;
  const plan = PLANS[combo];

  const status = useMemo(
    () =>
      `${t({ en: 'Chosen plan', uk: 'Обраний план' })}: ${plan.join} / ${plan.scan} — cost≈${plan.cost.toLocaleString(
        'en-US',
      )}, rows≈${plan.rows.toLocaleString('en-US')}`,
    [plan, t],
  );

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim qplan" aria-label="Query planner / EXPLAIN">
      <pre className="qplan-sql mono">
        <code>{SQL}</code>
      </pre>

      <div className="sim-bar qplan-toggles">
        <div className="qplan-toggle">
          <span className="qplan-toggle-label dim">{t({ en: "Index on orders.status?", uk: 'Index на orders.status?' })}</span>
          <div className="seg" role="tablist" aria-label="Index on orders.status">
            <button role="tab" aria-selected={!indexed} className={!indexed ? 'seg-on' : ''} onClick={() => setIndexed(false)}>
              {t({ en: 'No index', uk: 'Без index' })}
            </button>
            <button role="tab" aria-selected={indexed} className={indexed ? 'seg-on' : ''} onClick={() => setIndexed(true)}>
              {t({ en: 'B-Tree index', uk: 'B-Tree index' })}
            </button>
          </div>
        </div>

        <div className="qplan-toggle">
          <span className="qplan-toggle-label dim">{t({ en: "status = 'open' matches…", uk: "status = 'open' зачіпає…" })}</span>
          <div className="seg" role="tablist" aria-label="Predicate selectivity">
            <button role="tab" aria-selected={selective} className={selective ? 'seg-on' : ''} onClick={() => setSelective(true)}>
              {t({ en: '~80 rows (selective)', uk: '~80 рядків (селективно)' })}
            </button>
            <button role="tab" aria-selected={!selective} className={!selective ? 'seg-on' : ''} onClick={() => setSelective(false)}>
              {t({ en: '~600k rows (broad)', uk: '~600k рядків (широко)' })}
            </button>
          </div>
        </div>
      </div>

      <div className="qplan-body">
        <div className="qplan-plan">
          <div className="qplan-plan-head dim">{t({ en: 'EXPLAIN — chosen plan tree', uk: 'EXPLAIN — обране дерево плану' })}</div>
          <pre className="qplan-tree mono">
            <code>
              {plan.tree.map((line, i) => (
                <div
                  key={i}
                  className={cx(
                    'qplan-tree-line',
                    i === 0 && 'qplan-tree-root',
                    /Index Scan/.test(line) && 'qplan-line--index',
                    /Seq Scan/.test(line) && 'qplan-line--seq',
                  )}
                >
                  {line}
                </div>
              ))}
            </code>
          </pre>
        </div>

        <aside className="qplan-side" aria-label="Plan summary">
          <div className="qplan-chips">
            <div className="qplan-chip" style={{ ['--chip' as string]: plan.scan === 'Index Scan' ? 'var(--c-storage)' : 'var(--c-analytics)' }}>
              <span className="qplan-chip-k dim">{t({ en: 'Access path', uk: 'Шлях доступу' })}</span>
              <span className="qplan-chip-v">{plan.scan}</span>
            </div>
            <div className="qplan-chip" style={{ ['--chip' as string]: plan.join === 'Nested Loop' ? 'var(--c-query)' : 'var(--c-dist)' }}>
              <span className="qplan-chip-k dim">{t({ en: 'Join algorithm', uk: 'Алгоритм join' })}</span>
              <span className="qplan-chip-v">{plan.join}</span>
            </div>
          </div>

          <dl className="qplan-metrics">
            <div>
              <dt className="dim">{t({ en: 'Est. rows', uk: 'Оцін. рядків' })}</dt>
              <dd className="mono">{plan.rows.toLocaleString('en-US')}</dd>
            </div>
            <div>
              <dt className="dim">{t({ en: 'Est. cost', uk: 'Оцін. cost' })}</dt>
              <dd className="mono">{plan.cost.toLocaleString('en-US')}</dd>
            </div>
          </dl>
          <div className="qplan-meter" aria-hidden="true">
            <div
              className="qplan-meter-fill"
              style={{
                width: `${Math.max(2, (plan.cost / MAX_COST) * 100)}%`,
                background: plan.cost < 1000 ? 'var(--c-commit)' : plan.cost < 20000 ? 'var(--c-analytics)' : 'var(--c-danger)',
              }}
            />
          </div>
          <p className="qplan-why">{t(plan.why)}</p>
        </aside>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span className="dim">
          {t({
            en: 'Costs are illustrative, in seq_page_cost units. EXPLAIN shows these estimates; EXPLAIN ANALYZE runs the query and adds the actual rows next to them.',
            uk: 'Cost-и ілюстративні, в одиницях seq_page_cost. EXPLAIN показує ці оцінки; EXPLAIN ANALYZE виконує запит і додає фактичні рядки поруч.',
          })}
        </span>
      </div>
    </section>
  );
}
