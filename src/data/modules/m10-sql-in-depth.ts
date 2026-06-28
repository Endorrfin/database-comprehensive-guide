import type { Module } from '../types';

/*
 * M10 · SQL in depth — Section II (S6). Authored EN first, UA second; technical terms stay
 * English in both. Facts web-verified 2026-06-23 (PostgreSQL latest stable 18.4; see `sources`):
 *  - Three physical join algorithms: nested loop, hash join, merge join (planner-optimizer §51.5).
 *  - CTE inlining: since PostgreSQL 12 a non-recursive, side-effect-free, single-reference CTE is
 *    inlined by default (no longer an optimization fence); MATERIALIZED / NOT MATERIALIZED control it.
 *    WITH RECURSIVE = anchor term UNION [ALL] recursive term.
 *  - Window frame units ROWS / RANGE / GROUPS and EXCLUDE landed in PostgreSQL 11. With ORDER BY the
 *    DEFAULT frame is RANGE UNBOUNDED PRECEDING AND CURRENT ROW — includes the current row's PEERS
 *    (ties), not just physical rows. Without ORDER BY the frame is the whole partition.
 *  - GROUPING SETS / CUBE / ROLLUP added in PostgreSQL 9.5; GROUPING(col) distinguishes a subtotal
 *    row from a real NULL.
 *  - Three-valued logic: any comparison with NULL is UNKNOWN; WHERE keeps only TRUE. IS [NOT] NULL,
 *    IS [NOT] DISTINCT FROM (null-safe). NOT IN (subquery with a NULL) yields no rows — use NOT EXISTS.
 *    GREATEST/LEAST IGNORE NULL inputs in PostgreSQL (NULL only if all args NULL) — deviates from the
 *    SQL standard. COALESCE/NULLIF/CASE.
 *  - Deliberately out of scope per the locked curriculum: MERGE / INSERT ... ON CONFLICT (data
 *    modification, not read-query depth) — candidate for a future module if ever added.
 * Figure 'window-frame' is the motivating diagram. Non-signature module: figure + tables + compare
 * + code, no hero sim (the window-frame stepper is on the §13 backlog).
 */
export const m10: Module = {
  id: 'm10-sql-in-depth',
  num: 10,
  section: 's2-relational',
  order: 5,
  level: 'senior',
  signature: true, // CHANGED (S19): promoted the window-frame figure → ★ window-frame stepper
  title: { en: 'SQL in depth', uk: 'SQL поглиблено' },
  tagline: {
    en: 'Joins and how they run, subqueries/CTEs, window functions, GROUPING/CUBE/ROLLUP, NULL logic.',
    uk: 'Joins і як вони виконуються, subqueries/CTEs, window functions, GROUPING/CUBE/ROLLUP, логіка NULL.',
  },
  readMins: 14,
  mentalModel: {
    en: "Most 'hard' SQL is a window function or a CTE you haven't reached for yet.",
    uk: 'Більшість «складного» SQL — це window function або CTE, до яких ви ще не дотягнулися.',
  },
  topics: [
    {
      id: 'joins-and-how-they-run',
      title: { en: 'Joins & how they actually run', uk: 'Joins і як вони насправді виконуються' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **join** answers one question: *which rows from table A pair with which rows from table B?* The `JOIN` type you write declares **which rows survive** when there is no match. An **`INNER JOIN`** keeps only pairs that match. A **`LEFT JOIN`** keeps every left row and pads the right side with `NULL` when nothing matches — the workhorse for “all customers, with their orders if any”. A **`FULL JOIN`** keeps unmatched rows from *both* sides. A **`CROSS JOIN`** pairs every row with every row (the Cartesian product). And a table can join **to itself** (a self-join) to compare rows to other rows in the same table.",
            uk: "**Join** відповідає на одне питання: *які рядки таблиці A паруються з якими рядками таблиці B?* Тип `JOIN`, який ви пишете, оголошує, **які рядки виживають**, коли збігу немає. **`INNER JOIN`** лишає лише пари, що збіглися. **`LEFT JOIN`** лишає кожен лівий рядок і доповнює правий бік `NULL`, коли збігу нема — робоча конячка для «усі клієнти з їхніми orders, якщо є». **`FULL JOIN`** лишає неспарені рядки з *обох* боків. **`CROSS JOIN`** парує кожен рядок з кожним (Cartesian product). А таблиця може join **сама з собою** (self-join), щоб порівнювати рядки з іншими рядками тієї ж таблиці.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The join types by what they keep when a row has no match on the other side.',
            uk: 'Типи join за тим, що вони лишають, коли рядок не має збігу з іншого боку.',
          },
          head: [
            { en: 'Join', uk: 'Join' },
            { en: 'Keeps', uk: 'Лишає' },
            { en: 'Typical use', uk: 'Типове застосування' },
          ],
          rows: [
            [
              { en: 'INNER JOIN', uk: 'INNER JOIN' },
              { en: 'Only rows that match on both sides', uk: 'Лише рядки, що збіглися з обох боків' },
              { en: 'The default — combine related rows', uk: 'Дефолт — обʼєднати повʼязані рядки' },
            ],
            [
              { en: 'LEFT [OUTER] JOIN', uk: 'LEFT [OUTER] JOIN' },
              { en: 'All left rows; NULLs where the right has no match', uk: 'Усі ліві рядки; NULL там, де праворуч нема збігу' },
              { en: 'Keep all of A, attach B if present', uk: 'Лишити все A, додати B, якщо є' },
            ],
            [
              { en: 'FULL [OUTER] JOIN', uk: 'FULL [OUTER] JOIN' },
              { en: 'All rows from both sides; NULLs on the unmatched side', uk: 'Усі рядки з обох боків; NULL на неспареному боці' },
              { en: 'Reconcile two sets; find what is missing on either', uk: 'Звірити два набори; знайти, чого бракує з будь-якого боку' },
            ],
            [
              { en: 'CROSS JOIN', uk: 'CROSS JOIN' },
              { en: 'Every combination (Cartesian product)', uk: 'Кожна комбінація (Cartesian product)' },
              { en: 'Generate combinations — rarely on purpose', uk: 'Згенерувати комбінації — рідко навмисно' },
            ],
            [
              { en: 'self-join', uk: 'self-join' },
              { en: 'A table joined to an alias of itself', uk: 'Таблиця, зʼєднана з власним alias' },
              { en: 'Hierarchies; comparing a row to other rows', uk: 'Ієрархії; порівняння рядка з іншими рядками' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "Here is the part most people never separate: **which rows match is your intent; *how* the engine finds the matches is the planner's choice.** The same `LEFT JOIN` can run three completely different ways, and the planner picks one from statistics, indexes, and row-count estimates (M16). Knowing the three algorithms is what lets you read an `EXPLAIN` and understand why a join is slow.",
            uk: "Ось що майже ніхто не розділяє: **які рядки збігаються — це ваш намір; *як* движок знаходить збіги — вибір планувальника.** Той самий `LEFT JOIN` може виконатися трьома цілком різними способами, і планувальник обирає один зі statistics, indexes та оцінок кількості рядків (M16). Знання трьох алгоритмів — це те, що дає прочитати `EXPLAIN` і зрозуміти, чому join повільний.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The three physical join algorithms PostgreSQL chooses between.',
            uk: 'Три фізичні алгоритми join, між якими обирає PostgreSQL.',
          },
          head: [
            { en: 'Algorithm', uk: 'Алгоритм' },
            { en: 'How it runs', uk: 'Як виконується' },
            { en: 'Planner picks it when', uk: 'Планувальник обирає, коли' },
          ],
          rows: [
            [
              { en: 'Nested loop', uk: 'Nested loop' },
              { en: 'For each outer row, probe the inner side (ideally via an index)', uk: 'Для кожного зовнішнього рядка зондує внутрішній бік (бажано через index)' },
              { en: 'One side is small, or an index makes the inner probe cheap', uk: 'Один бік малий, або index робить внутрішнє зондування дешевим' },
            ],
            [
              { en: 'Hash join', uk: 'Hash join' },
              { en: 'Build a hash table on the smaller input, probe it with the larger', uk: 'Будує hash table на меншому вході, зондує її більшим' },
              { en: 'Large, unsorted inputs joined on equality (=)', uk: 'Великі несортовані входи, зʼєднані за рівністю (=)' },
            ],
            [
              { en: 'Merge join', uk: 'Merge join' },
              { en: 'Sort both inputs on the join key, then walk them in lockstep', uk: 'Сортує обидва входи за join key, тоді йде ними синхронно' },
              { en: 'Inputs are already sorted (or cheap to sort) on the key', uk: 'Входи вже відсортовані (чи дешево сортуються) за ключем' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The join type is intent; the algorithm is the planner’s job', uk: 'Тип join — це намір; алгоритм — справа планувальника' },
          md: {
            en: "When a join is slow, the instinct is to blame the join *type* — but the type only changes which rows you get back, never the speed. Speed is the **algorithm**, and a bad one almost always traces to one of two causes: a **missing index** (so a nested loop scans the whole inner table per outer row) or **bad statistics** (so the planner mis-estimates row counts and chooses a nested loop where a hash join would crush it). The fix is rarely rewriting `LEFT` to `INNER`; it is adding the index the join key needs or running `ANALYZE` so the estimates are honest. Read the `EXPLAIN`, see which algorithm was chosen and on what estimate, and fix *that*.",
            uk: "Коли join повільний, інстинкт — звинувачувати *тип* join, але тип лише змінює, які рядки ви отримаєте, а не швидкість. Швидкість — це **алгоритм**, і поганий майже завжди зводиться до однієї з двох причин: **відсутній index** (тож nested loop сканує всю внутрішню таблицю на кожен зовнішній рядок) або **погана statistics** (тож планувальник хибно оцінює кількість рядків і обирає nested loop там, де hash join розчавив би задачу). Виправлення рідко полягає в переписуванні `LEFT` на `INNER`; це додавання index, потрібного для join key, або запуск `ANALYZE`, щоб оцінки були чесними. Прочитайте `EXPLAIN`, побачте, який алгоритм обрано і на якій оцінці, і виправляйте *саме це*.",
          },
        },
      ],
    },
    {
      id: 'subqueries-and-ctes',
      title: { en: 'Subqueries & CTEs', uk: 'Subqueries і CTEs' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **subquery** is a query nested inside another. Three forms cover almost everything: a **scalar subquery** returns one value and stands in for an expression (`WHERE price > (SELECT avg(price) FROM products)`); **`IN` / `NOT IN`** test membership in a returned set; **`EXISTS` / `NOT EXISTS`** test whether *any* matching row exists. A subquery is **correlated** when it references the outer row — it conceptually re-runs per outer row (though the planner often rewrites it into a join). For “does a related row exist”, prefer **`EXISTS`**: it stops at the first match and, crucially, sidesteps the `NOT IN`-with-`NULL` trap covered below.",
            uk: "**Subquery** — це запит, вкладений в інший. Три форми покривають майже все: **scalar subquery** повертає одне значення і заміняє вираз (`WHERE price > (SELECT avg(price) FROM products)`); **`IN` / `NOT IN`** перевіряють належність до поверненого набору; **`EXISTS` / `NOT EXISTS`** перевіряють, чи існує *хоч один* відповідний рядок. Subquery є **correlated**, коли посилається на зовнішній рядок — концептуально вона перевиконується на кожен зовнішній рядок (хоча планувальник часто переписує її в join). Для «чи існує повʼязаний рядок» віддавайте перевагу **`EXISTS`**: він зупиняється на першому збігу і, головне, оминає пастку `NOT IN`-із-`NULL`, описану нижче.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "A **Common Table Expression (CTE)** — the `WITH` clause — names a subquery so the main query can read top-to-bottom as named stages instead of nested parentheses. It is the single biggest readability upgrade in SQL. And `WITH RECURSIVE` unlocks a whole class of queries plain SQL cannot express: walking a hierarchy or graph. A recursive CTE has an **anchor term** (the starting rows) `UNION ALL` a **recursive term** that joins back to the CTE, iterating until no new rows are produced:",
            uk: "**Common Table Expression (CTE)** — клауза `WITH` — іменує subquery, щоб головний запит читався згори вниз як названі етапи замість вкладених дужок. Це найбільше покращення читабельності в SQL. А `WITH RECURSIVE` відмикає цілий клас запитів, які звичайний SQL не виражає: обхід ієрархії чи graph. Рекурсивний CTE має **anchor term** (початкові рядки) `UNION ALL` **recursive term**, що приєднується назад до CTE, ітеруючи, доки не перестануть зʼявлятися нові рядки:",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Walk an org chart down from the CEO, tracking depth.
WITH RECURSIVE subordinates AS (
  -- anchor term: where the walk starts
  SELECT id, name, manager_id, 1 AS depth
  FROM   employees
  WHERE  id = 1                         -- the CEO

  UNION ALL

  -- recursive term: join the table back to the CTE's previous rows
  SELECT e.id, e.name, e.manager_id, s.depth + 1
  FROM   employees   e
  JOIN   subordinates s ON e.manager_id = s.id
)
SELECT depth, name
FROM   subordinates
ORDER  BY depth, name;`,
          note: {
            en: 'The recursive term runs against the rows the previous iteration produced; it stops when an iteration adds nothing. Add a depth guard or CYCLE clause to be safe on dirty data.',
            uk: 'Recursive term виконується проти рядків, що дала попередня ітерація; зупиняється, коли ітерація нічого не додає. Додайте обмеження глибини чи клаузу CYCLE для безпеки на «брудних» даних.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'CTEs stopped being an optimization fence in PostgreSQL 12', uk: 'CTE перестали бути optimization fence у PostgreSQL 12' },
          md: {
            en: "For years a PostgreSQL `WITH` clause was an **optimization fence**: it was always materialized (computed in full, to a temporary result) before the outer query ran, so a CTE could quietly make a query *slower* than the equivalent subquery. **Since PostgreSQL 12 that changed**: a CTE that is non-recursive, side-effect-free, and referenced **exactly once** is now **inlined** by default, so the planner optimizes across it like any subquery. You control it explicitly: `WITH x AS MATERIALIZED (...)` forces the old fence (compute once — useful when the CTE is expensive and referenced many times, or has volatile functions), and `AS NOT MATERIALIZED` forces inlining. The lesson: write CTEs freely for readability, but on PG 12+ know whether yours is being inlined, and reach for `MATERIALIZED` deliberately when one evaluation is what you want.",
            uk: "Роками клауза `WITH` у PostgreSQL була **optimization fence**: вона завжди матеріалізувалася (обчислювалася повністю в тимчасовий результат) до виконання зовнішнього запиту, тож CTE міг тихо зробити запит *повільнішим* за еквівалентну subquery. **Від PostgreSQL 12 це змінилося**: CTE, що нерекурсивний, без side-effects і використаний **рівно раз**, тепер за замовчуванням **inlined**, тож планувальник оптимізує крізь нього, як будь-яку subquery. Ви керуєте цим явно: `WITH x AS MATERIALIZED (...)` форсує старий fence (обчислити раз — корисно, коли CTE дорогий і використовується багато разів, чи має volatile-функції), а `AS NOT MATERIALIZED` форсує inlining. Урок: пишіть CTE вільно заради читабельності, але на PG 12+ знайте, inlined ваш чи ні, і свідомо беріть `MATERIALIZED`, коли потрібне саме одне обчислення.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for a CTE (WITH) when…', uk: 'Беріть CTE (WITH), коли…' },
          b: { en: 'Reach for a plain subquery when…', uk: 'Беріть звичайну subquery, коли…' },
          rows: [
            [
              { en: 'Structure', uk: 'Структура' },
              { en: 'Multi-step logic you want to name and read top-to-bottom', uk: 'Багатоетапна логіка, яку хочете назвати й читати згори вниз' },
              { en: 'A single small expression used inline, once', uk: 'Один малий вираз, вжитий inline, один раз' },
            ],
            [
              { en: 'Recursion', uk: 'Рекурсія' },
              { en: 'You need WITH RECURSIVE — trees, graphs, running sequences', uk: 'Потрібен WITH RECURSIVE — дерева, graphs, послідовності' },
              { en: 'No recursion is involved', uk: 'Рекурсія не потрібна' },
            ],
            [
              { en: 'Plan control', uk: 'Контроль плану' },
              { en: 'You want one evaluation, pinned with MATERIALIZED', uk: 'Потрібне одне обчислення, закріплене MATERIALIZED' },
              { en: 'You want the planner free to optimize across it (default since PG 12)', uk: 'Хочете, щоб планувальник вільно оптимізував крізь неї (дефолт від PG 12)' },
            ],
          ],
        },
      ],
    },
    {
      id: 'window-functions',
      title: { en: 'Window functions', uk: 'Window functions' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Window functions are the feature that turns a page of application code into one line of SQL — and the thing most people reach for last. The idea: a normal aggregate like `sum()` **collapses** a group of rows into one. A **window function computes across a set of rows related to the current row but does *not* collapse them** — every input row stays, with the computed value attached. You define the “window” with `OVER (PARTITION BY … ORDER BY … frame)`: `PARTITION BY` splits rows into independent groups, `ORDER BY` orders them within each group, and the optional **frame** picks which rows around the current one are in scope.",
            uk: "Window functions — це фіча, що перетворює сторінку коду застосунку на один рядок SQL, і те, до чого більшість тягнеться останнім. Ідея: звичайний агрегат на кшталт `sum()` **згортає** групу рядків в один. **Window function обчислює над набором рядків, повʼязаних із поточним, але *не* згортає їх** — кожен вхідний рядок лишається, з прикріпленим обчисленим значенням. Ви визначаєте «вікно» через `OVER (PARTITION BY … ORDER BY … frame)`: `PARTITION BY` ділить рядки на незалежні групи, `ORDER BY` упорядковує їх усередині групи, а необовʼязковий **frame** обирає, які рядки навколо поточного в області видимості.",
          },
        },
        {
          // CHANGED (S19): static window-frame figure promoted to the interactive window-frame stepper.
          kind: 'sim',
          sim: 'window-frame-stepper',
        },
        {
          kind: 'table',
          caption: {
            en: 'The window function catalog — three families do almost all the work.',
            uk: 'Каталог window functions — три родини роблять майже всю роботу.',
          },
          head: [
            { en: 'Family', uk: 'Родина' },
            { en: 'Functions', uk: 'Функції' },
            { en: 'What it gives you', uk: 'Що дає' },
          ],
          rows: [
            [
              { en: 'Ranking', uk: 'Ranking' },
              { en: 'row_number, rank, dense_rank, ntile, percent_rank, cume_dist', uk: 'row_number, rank, dense_rank, ntile, percent_rank, cume_dist' },
              { en: 'Position within the partition (top-N, percentiles, deduping)', uk: 'Позиція в partition (top-N, percentiles, дедуплікація)' },
            ],
            [
              { en: 'Offset', uk: 'Offset' },
              { en: 'lag, lead, first_value, last_value, nth_value', uk: 'lag, lead, first_value, last_value, nth_value' },
              { en: 'Reach to another row (deltas vs the previous row, first/last in group)', uk: 'Дотягнутися до іншого рядка (дельти проти попереднього, перший/останній у групі)' },
            ],
            [
              { en: 'Aggregates as windows', uk: 'Агрегати як вікна' },
              { en: 'sum, avg, count, min, max … OVER (…)', uk: 'sum, avg, count, min, max … OVER (…)' },
              { en: 'Running totals, moving averages, share-of-group', uk: 'Running totals, ковзні середні, частка від групи' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `SELECT
  region,
  order_date,
  amount,
  -- running total within each region, oldest → newest (explicit ROWS frame)
  sum(amount) OVER (PARTITION BY region ORDER BY order_date
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
  -- biggest orders first, ranked inside the region
  rank()      OVER (PARTITION BY region ORDER BY amount DESC)         AS rank_in_region,
  -- each order vs the one before it in the same region
  amount - lag(amount) OVER (PARTITION BY region ORDER BY order_date) AS delta_from_prev
FROM orders;`,
          note: {
            en: 'One pass, no self-join, no collapsing: every order row is returned with its running total, its rank, and its change from the previous order.',
            uk: 'Один прохід, без self-join, без згортання: кожен рядок order повертається з running total, рангом і зміною від попереднього order.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The default window frame is RANGE, not ROWS — and it includes ties', uk: 'Дефолтний window frame — RANGE, а не ROWS — і він включає ties' },
          md: {
            en: "The subtlest window-function bug: the moment you add `ORDER BY` to an `OVER` clause **without** a frame, PostgreSQL applies the default frame `RANGE UNBOUNDED PRECEDING AND CURRENT ROW` — and under `RANGE`, “current row” means the current row **plus all its peers** (rows equal under the `ORDER BY`). So a running `sum(...) OVER (ORDER BY day)` where several rows share the same `day` will show the **same total** for the whole tied group — it jumps in steps, not row by row. If you mean *physical* rows (a true row-by-row running total), say so explicitly: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. The distinction (`ROWS` = physical rows, `RANGE` = value peers, `GROUPS` = peer groups; all since PostgreSQL 11) is exactly what separates a correct running total from a confusing one.",
            uk: "Найтонший баг window functions: щойно ви додаєте `ORDER BY` до клаузи `OVER` **без** frame, PostgreSQL застосовує дефолтний frame `RANGE UNBOUNDED PRECEDING AND CURRENT ROW` — а за `RANGE` «поточний рядок» означає поточний рядок **плюс усі його peers** (рядки, рівні за `ORDER BY`). Тож running `sum(...) OVER (ORDER BY day)`, де кілька рядків мають той самий `day`, покаже **однаковий total** для всієї групи ties — він стрибає сходинками, а не рядок за рядком. Якщо ви маєте на увазі *фізичні* рядки (справжній running total рядок-за-рядком), скажіть це явно: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Розрізнення (`ROWS` = фізичні рядки, `RANGE` = peers за значенням, `GROUPS` = групи peers; усі від PostgreSQL 11) — саме те, що відрізняє правильний running total від заплутаного.",
          },
        },
      ],
    },
    {
      id: 'aggregation-beyond-group-by',
      title: { en: 'Aggregation beyond GROUP BY: ROLLUP, CUBE, GROUPING SETS', uk: 'Агрегація поза GROUP BY: ROLLUP, CUBE, GROUPING SETS' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A plain `GROUP BY` gives you exactly one level of grouping. Reports usually want several at once: revenue per `(region, product)`, **and** a subtotal per region, **and** a grand total. The naïve way is a `UNION ALL` of three queries that each re-scan the table. PostgreSQL (since 9.5) does it in **one pass** with grouping-set syntax: **`ROLLUP (a, b)`** produces the hierarchical subtotals — `(a, b)`, then `(a)`, then `()` the grand total; **`CUBE (a, b)`** produces *every* combination — `(a,b)`, `(a)`, `(b)`, `()`; and **`GROUPING SETS (...)`** lets you list the exact groupings you want.",
            uk: "Звичайний `GROUP BY` дає рівно один рівень групування. Звітам зазвичай треба кілька водночас: дохід на `(region, product)`, **і** підсумок на region, **і** загальний підсумок. Наївний спосіб — `UNION ALL` трьох запитів, кожен з яких пересканує таблицю. PostgreSQL (від 9.5) робить це за **один прохід** синтаксисом grouping-set: **`ROLLUP (a, b)`** дає ієрархічні підсумки — `(a, b)`, тоді `(a)`, тоді `()` загальний підсумок; **`CUBE (a, b)`** дає *кожну* комбінацію — `(a,b)`, `(a)`, `(b)`, `()`; а **`GROUPING SETS (...)`** дозволяє перелічити точні групування, які потрібні.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `SELECT
  region,
  product,
  sum(amount)            AS revenue,
  grouping(region, product) AS g   -- bitmask: which columns are rolled up on this row
FROM   sales
GROUP  BY ROLLUP (region, product)
ORDER  BY region NULLS LAST, product NULLS LAST;
-- rows for each (region, product); a subtotal per region (product = NULL, g = 1);
-- and one grand-total row (both NULL, g = 3).`,
          note: {
            en: 'ROLLUP turns one query into detail + subtotals + grand total. grouping() returns 1 for a column that is aggregated away on that row — the key to reading the result.',
            uk: 'ROLLUP перетворює один запит на деталі + підсумки + загальний підсумок. grouping() повертає 1 для колонки, згорнутої на цьому рядку — ключ до читання результату.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Tell a subtotal apart from a real NULL with GROUPING()', uk: 'Відрізняйте підсумок від справжнього NULL через GROUPING()' },
          md: {
            en: "In a `ROLLUP`/`CUBE` result, a subtotal row has `NULL` in the columns it aggregated away — but a column might *also* contain a genuine `NULL` from the data, and the two look identical. Do **not** test `region IS NULL` to find subtotal rows; it cannot tell “this is the all-regions subtotal” from “this row's region was actually missing”. Use the **`GROUPING(col)`** function, which returns `1` precisely when the column was rolled up on that row and `0` otherwise. That bit is the only reliable way to label subtotals — `CASE WHEN grouping(region) = 1 THEN 'All regions' ELSE region END`.",
            uk: "У результаті `ROLLUP`/`CUBE` рядок-підсумок має `NULL` у колонках, які він згорнув — але колонка може *також* містити справжній `NULL` з даних, і ці двоє виглядають однаково. **Не** перевіряйте `region IS NULL`, щоб знайти рядки-підсумки; це не відрізнить «це підсумок по всіх regions» від «region цього рядка справді відсутній». Вживайте функцію **`GROUPING(col)`**, що повертає `1` саме тоді, коли колонка згорнута на цьому рядку, і `0` інакше. Цей біт — єдиний надійний спосіб позначити підсумки: `CASE WHEN grouping(region) = 1 THEN 'All regions' ELSE region END`.",
          },
        },
      ],
    },
    {
      id: 'null-three-valued-logic',
      title: { en: 'NULL: the three-valued logic that bites everyone', uk: 'NULL: тризначна логіка, що кусає всіх' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "SQL logic is **three-valued**: an expression is `TRUE`, `FALSE`, or `UNKNOWN`, and `NULL` is what produces the third. `NULL` does not mean zero or empty — it means *unknown*, and the rule that follows is strict: **any comparison with `NULL` yields `UNKNOWN`**. `NULL = NULL` is not `TRUE`, it is `UNKNOWN` (one unknown thing is not *known* to equal another). And `WHERE` keeps only rows where the condition is `TRUE` — so `UNKNOWN` rows are silently **dropped**. This single fact is behind a surprising share of “the query is missing rows” bugs.",
            uk: "Логіка SQL **тризначна**: вираз — це `TRUE`, `FALSE` чи `UNKNOWN`, і `NULL` — те, що породжує третє. `NULL` не означає нуль чи порожнечу — він означає *невідомо*, і правило строге: **будь-яке порівняння з `NULL` дає `UNKNOWN`**. `NULL = NULL` — не `TRUE`, а `UNKNOWN` (одна невідома річ не *відома* як рівна іншій). А `WHERE` лишає лише рядки, де умова `TRUE` — тож рядки `UNKNOWN` тихо **відкидаються**. Цей єдиний факт стоїть за дивовижною часткою багів «у запиті бракує рядків».",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Three-valued logic in practice — why NULL comparisons surprise people.',
            uk: 'Тризначна логіка на практиці — чому порівняння з NULL дивують.',
          },
          head: [
            { en: 'Expression', uk: 'Вираз' },
            { en: 'Result', uk: 'Результат' },
            { en: 'Why', uk: 'Чому' },
          ],
          rows: [
            [
              { en: 'NULL = NULL', uk: 'NULL = NULL' },
              { en: 'UNKNOWN', uk: 'UNKNOWN' },
              { en: 'One unknown is not known to equal another', uk: 'Одне невідоме не відоме як рівне іншому' },
            ],
            [
              { en: 'NULL <> 5', uk: 'NULL <> 5' },
              { en: 'UNKNOWN', uk: 'UNKNOWN' },
              { en: 'A comparison with NULL is never TRUE or FALSE', uk: 'Порівняння з NULL ніколи не TRUE і не FALSE' },
            ],
            [
              { en: 'TRUE AND UNKNOWN', uk: 'TRUE AND UNKNOWN' },
              { en: 'UNKNOWN', uk: 'UNKNOWN' },
              { en: 'Could still resolve either way', uk: 'Ще може вирішитися будь-як' },
            ],
            [
              { en: 'FALSE AND UNKNOWN', uk: 'FALSE AND UNKNOWN' },
              { en: 'FALSE', uk: 'FALSE' },
              { en: 'Already false — the unknown cannot save it', uk: 'Вже false — невідоме не врятує' },
            ],
            [
              { en: 'TRUE OR UNKNOWN', uk: 'TRUE OR UNKNOWN' },
              { en: 'TRUE', uk: 'TRUE' },
              { en: 'Already true — the unknown cannot break it', uk: 'Вже true — невідоме не зламає' },
            ],
            [
              { en: 'x IS NOT DISTINCT FROM NULL', uk: 'x IS NOT DISTINCT FROM NULL' },
              { en: 'TRUE only when x is NULL', uk: 'TRUE лише коли x є NULL' },
              { en: 'Null-safe equality — treats NULL as a comparable value', uk: 'Null-safe рівність — трактує NULL як порівнюване значення' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'NOT IN with a nullable subquery silently returns nothing', uk: 'NOT IN із nullable subquery тихо повертає порожнечу' },
          md: {
            en: "This is the most expensive `NULL` bug in practice. `x NOT IN (SELECT col FROM t)` is defined as `x <> v1 AND x <> v2 AND …` over every value the subquery returns. If **even one** of those values is `NULL`, that term becomes `UNKNOWN`, the whole `AND` collapses to `UNKNOWN` (never `TRUE`), and the row is dropped — so the query returns **zero rows**, no error, no warning. It works perfectly in testing and fails the day a `NULL` appears in production. Use **`NOT EXISTS`** instead (it is null-safe and usually plans better), or filter the `NULL`s out of the subquery explicitly. Treat `NOT IN (subquery)` as a code smell.",
            uk: "Це найдорожчий баг із `NULL` на практиці. `x NOT IN (SELECT col FROM t)` визначено як `x <> v1 AND x <> v2 AND …` над кожним значенням, що повертає subquery. Якщо **хоч одне** з них `NULL`, цей терм стає `UNKNOWN`, увесь `AND` згортається в `UNKNOWN` (ніколи `TRUE`), і рядок відкидається — тож запит повертає **нуль рядків**, без помилки, без попередження. Воно ідеально працює в тестуванні й ламається того дня, коли `NULL` зʼявляється в продакшні. Вживайте **`NOT EXISTS`** (він null-safe і зазвичай краще планується) або явно відфільтруйте `NULL` із subquery. Вважайте `NOT IN (subquery)` за code smell.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The conditional toolbox tames `NULL`: **`COALESCE(a, b, …)`** returns the first non-`NULL` argument (the standard way to supply a default); **`NULLIF(a, b)`** returns `NULL` when `a = b` (handy to turn a sentinel like `0` into `NULL` before dividing); and **`CASE`** is the general branch for everything else. One PostgreSQL-specific trap worth memorizing: **`GREATEST` and `LEAST` ignore `NULL` inputs** — `GREATEST(5, NULL)` is `5`, not `NULL`, and the result is `NULL` only if *every* argument is `NULL`. That **deviates from the SQL standard** (where any `NULL` argument makes the result `NULL`), so do not assume the standard behavior when porting queries between engines.",
            uk: "Набір умовних приборкує `NULL`: **`COALESCE(a, b, …)`** повертає перший не-`NULL` аргумент (стандартний спосіб дати дефолт); **`NULLIF(a, b)`** повертає `NULL`, коли `a = b` (зручно перетворити sentinel на кшталт `0` на `NULL` перед діленням); а **`CASE`** — загальне розгалуження для решти. Одна специфічна для PostgreSQL пастка, варта запамʼятовування: **`GREATEST` і `LEAST` ігнорують `NULL`-входи** — `GREATEST(5, NULL)` це `5`, а не `NULL`, і результат `NULL` лише якщо *кожен* аргумент `NULL`. Це **відхиляється від стандарту SQL** (де будь-який `NULL`-аргумент робить результат `NULL`), тож не припускайте стандартну поведінку, переносячи запити між движками.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Put together, the module's payoff is its mental model: **most “hard” SQL is just a window function or a CTE you haven't reached for yet** — and most SQL *bugs* are three-valued logic you forgot about. Learn to see a problem as “which rows match (join), named in stages (CTE), computed across neighbors (window), rolled up (GROUPING SETS), with `NULL` handled deliberately”, and the queries that used to need a page of application code become a few lines that the database runs in one pass.",
            uk: "Разом виграш модуля — у його ментальній моделі: **більшість «складного» SQL — це лише window function чи CTE, до яких ви ще не дотягнулися**, а більшість *багів* SQL — це тризначна логіка, про яку ви забули. Навчіться бачити задачу як «які рядки збігаються (join), названі етапами (CTE), обчислені над сусідами (window), згорнуті (GROUPING SETS), із `NULL`, оброблюваним свідомо» — і запити, що колись потребували сторінки коду застосунку, стають кількома рядками, які база виконує за один прохід.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'The join type (INNER/LEFT/FULL/CROSS/self) declares which rows survive a non-match; the physical algorithm (nested loop, hash join, merge join) is the planner’s choice from statistics and indexes. A slow join is usually the wrong algorithm or a missing index, not the wrong type.',
      uk: 'Тип join (INNER/LEFT/FULL/CROSS/self) оголошує, які рядки виживають при відсутності збігу; фізичний алгоритм (nested loop, hash join, merge join) — вибір планувальника зі statistics та indexes. Повільний join — зазвичай хибний алгоритм чи відсутній index, а не хибний тип.',
    },
    {
      en: 'CTEs (WITH) name subqueries for readability and enable recursion (WITH RECURSIVE = anchor term UNION ALL recursive term). Since PostgreSQL 12 a non-recursive, single-reference CTE is inlined by default — use MATERIALIZED / NOT MATERIALIZED to control evaluation.',
      uk: 'CTE (WITH) іменують subqueries заради читабельності й вмикають рекурсію (WITH RECURSIVE = anchor term UNION ALL recursive term). Від PostgreSQL 12 нерекурсивний CTE з одним посиланням за замовчуванням inlined — вживайте MATERIALIZED / NOT MATERIALIZED для контролю обчислення.',
    },
    {
      en: 'Window functions compute across rows related to the current one without collapsing them — OVER (PARTITION BY … ORDER BY … frame). With ORDER BY the default frame is RANGE … CURRENT ROW, which includes tied peers; say ROWS BETWEEN explicitly for a true row-by-row running total.',
      uk: 'Window functions обчислюють над рядками, повʼязаними з поточним, не згортаючи їх — OVER (PARTITION BY … ORDER BY … frame). З ORDER BY дефолтний frame — RANGE … CURRENT ROW, що включає peers-ties; пишіть ROWS BETWEEN явно для справжнього running total рядок-за-рядком.',
    },
    {
      en: 'ROLLUP / CUBE / GROUPING SETS compute several groupings (subtotals, grand totals, all combinations) in one pass (PostgreSQL 9.5+); use GROUPING(col) — not col IS NULL — to tell a subtotal row from a genuine data NULL.',
      uk: 'ROLLUP / CUBE / GROUPING SETS обчислюють кілька групувань (підсумки, загальні підсумки, усі комбінації) за один прохід (PostgreSQL 9.5+); вживайте GROUPING(col) — а не col IS NULL — щоб відрізнити рядок-підсумок від справжнього NULL у даних.',
    },
    {
      en: 'SQL is three-valued: any comparison with NULL is UNKNOWN, and WHERE drops UNKNOWN rows. Use IS [NOT] NULL / IS [NOT] DISTINCT FROM, prefer NOT EXISTS over NOT IN with nullable subqueries, and reach for COALESCE/NULLIF/CASE (note: GREATEST/LEAST ignore NULLs in PostgreSQL).',
      uk: 'SQL тризначний: будь-яке порівняння з NULL — UNKNOWN, а WHERE відкидає UNKNOWN-рядки. Вживайте IS [NOT] NULL / IS [NOT] DISTINCT FROM, віддавайте перевагу NOT EXISTS над NOT IN із nullable subqueries, і беріть COALESCE/NULLIF/CASE (зауважте: GREATEST/LEAST ігнорують NULL у PostgreSQL).',
    },
  ],
  pitfalls: [
    {
      title: { en: 'NOT IN against a subquery that can return NULL', uk: 'NOT IN проти subquery, що може повернути NULL' },
      body: {
        en: 'A single NULL in the subquery makes every NOT IN comparison UNKNOWN, so the query returns zero rows — silently, with no error, often only in production. Use NOT EXISTS (null-safe and usually faster) or explicitly exclude NULLs from the subquery.',
        uk: 'Єдиний NULL у subquery робить кожне порівняння NOT IN UNKNOWN, тож запит повертає нуль рядків — тихо, без помилки, часто лише в продакшні. Вживайте NOT EXISTS (null-safe і зазвичай швидше) чи явно виключіть NULL із subquery.',
      },
    },
    {
      title: { en: 'Assuming a windowed running total counts physical rows', uk: 'Вважати, що віконний running total рахує фізичні рядки' },
      body: {
        en: 'With ORDER BY and no explicit frame, the default RANGE frame treats all rows tied on the ORDER BY value as one step, so a running total jumps per tied group instead of per row. Write ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW when you want a true row-by-row total.',
        uk: 'З ORDER BY і без явного frame дефолтний RANGE-frame трактує всі рядки, рівні за значенням ORDER BY, як один крок, тож running total стрибає на групу ties замість на рядок. Пишіть ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, коли потрібен справжній total рядок-за-рядком.',
      },
    },
    {
      title: { en: 'Treating a CTE as a guaranteed optimization boundary', uk: 'Вважати CTE гарантованою межею оптимізації' },
      body: {
        en: 'Before PostgreSQL 12 a CTE was always materialized; since 12 a single-reference, non-recursive CTE is inlined by default, which can change the plan from what older advice assumed. If you depend on one evaluation (expensive CTE referenced many times, or volatile functions), pin it with MATERIALIZED rather than trusting the old fence behavior.',
        uk: 'До PostgreSQL 12 CTE завжди матеріалізувався; від 12 нерекурсивний CTE з одним посиланням за замовчуванням inlined, що може змінити план проти того, що припускали старі поради. Якщо залежите від одного обчислення (дорогий CTE, використаний багато разів, чи volatile-функції), закріпіть його MATERIALIZED, а не покладайтеся на стару поведінку fence.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'To find rows in A that have a matching row in B, when would you use EXISTS vs IN vs a JOIN — and what is the NULL gotcha?',
        uk: 'Щоб знайти рядки A, що мають відповідний рядок у B, коли вживати EXISTS проти IN проти JOIN — і яка пастка з NULL?',
      },
      a: {
        en: 'For pure existence (“A rows that have at least one match in B”), EXISTS is usually the cleanest: it is correlated, short-circuits at the first matching row, and is null-safe. IN works for the positive case and the planner often turns IN and EXISTS into the same semi-join, so on the positive side it is largely a readability choice. A JOIN also finds matches but can multiply rows when B has several matches per A row, so you often need DISTINCT — which is why I prefer EXISTS when I only care whether a match exists, and a JOIN when I actually need columns from B. The gotcha is the negative case: NOT IN against a subquery that can yield NULL is defined as a chain of <> ANDs, and one NULL makes the whole thing UNKNOWN, so it returns no rows at all. NOT EXISTS does not have that problem and generally plans better, so I default to NOT EXISTS for anti-joins.',
        uk: 'Для чистого існування («рядки A, що мають хоч один збіг у B») EXISTS зазвичай найчистіший: він correlated, зупиняється на першому збігу й null-safe. IN працює для позитивного випадку, і планувальник часто перетворює IN та EXISTS на той самий semi-join, тож на позитивному боці це переважно вибір читабельності. JOIN теж знаходить збіги, але може множити рядки, коли B має кілька збігів на рядок A, тож часто потрібен DISTINCT — тому я віддаю перевагу EXISTS, коли важливо лише, чи є збіг, і JOIN, коли справді потрібні колонки з B. Пастка — у негативному випадку: NOT IN проти subquery, що може дати NULL, визначено як ланцюг <> через AND, і один NULL робить усе UNKNOWN, тож воно не повертає жодного рядка. NOT EXISTS не має цієї проблеми й загалом краще планується, тож для anti-join я за замовчуванням беру NOT EXISTS.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Explain window functions versus GROUP BY, and give a problem only a window function solves cleanly.',
        uk: 'Поясніть window functions проти GROUP BY і дайте задачу, яку чисто розвʼязує лише window function.',
      },
      a: {
        en: 'GROUP BY collapses each group into a single output row, so you lose the individual rows. A window function computes over a related set of rows — defined by OVER (PARTITION BY … ORDER BY … frame) — but keeps every input row, attaching the computed value. So when you need a per-row result that also depends on other rows, only a window function does it in one pass without a self-join. Classic cases: a running total or moving average; rank within a group (top 3 products per region) using rank/dense_rank/row_number; or comparing each row to its group, like “each order’s amount minus the region average” via avg(amount) OVER (PARTITION BY region), or the delta from the previous row via lag(). The one nuance I always mention is the frame: once you add ORDER BY, the default is RANGE … CURRENT ROW which includes tied peers, so for a strict row-by-row running total I write ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW explicitly.',
        uk: 'GROUP BY згортає кожну групу в один вихідний рядок, тож окремі рядки втрачаються. Window function обчислює над повʼязаним набором рядків — визначеним OVER (PARTITION BY … ORDER BY … frame) — але лишає кожен вхідний рядок, прикріплюючи обчислене значення. Тож коли потрібен результат на рядок, що також залежить від інших рядків, лише window function робить це за один прохід без self-join. Класичні випадки: running total чи ковзне середнє; ранг усередині групи (топ-3 продукти на region) через rank/dense_rank/row_number; чи порівняння кожного рядка з його групою, як-от «amount кожного order мінус середнє по region» через avg(amount) OVER (PARTITION BY region), чи дельта від попереднього рядка через lag(). Нюанс, який я завжди згадую, — frame: щойно додаєте ORDER BY, дефолт — RANGE … CURRENT ROW, що включає peers-ties, тож для строгого running total рядок-за-рядком я пишу ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW явно.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'What is SQL’s three-valued logic, and name two real bugs it causes.',
        uk: 'Що таке тризначна логіка SQL і назвіть два реальні баги, які вона спричиняє.',
      },
      a: {
        en: 'SQL conditions evaluate to TRUE, FALSE, or UNKNOWN, and any comparison involving NULL produces UNKNOWN, because NULL means “unknown value”, not zero or empty. WHERE and JOIN keep only rows where the predicate is TRUE, so UNKNOWN rows are dropped. Bug one: NOT IN against a subquery that contains a NULL returns no rows, because x <> NULL is UNKNOWN and the AND-chain collapses — a silent, production-only failure; the fix is NOT EXISTS. Bug two: filtering with an inequality like WHERE status <> \'active\' silently excludes rows where status IS NULL, because NULL <> \'active\' is UNKNOWN, not TRUE — people expect the NULL rows to be included and they are not; you have to add OR status IS NULL or use IS DISTINCT FROM. A related class is aggregates ignoring NULLs (COUNT(col) skips NULLs while COUNT(*) does not, and AVG divides by the non-null count), which quietly changes results. The discipline is to decide what NULL means for each column, prefer IS [NOT] DISTINCT FROM for null-safe equality, and use COALESCE to make the intent explicit.',
        uk: 'Умови SQL обчислюються в TRUE, FALSE чи UNKNOWN, і будь-яке порівняння за участі NULL дає UNKNOWN, бо NULL означає «невідоме значення», а не нуль чи порожнечу. WHERE і JOIN лишають лише рядки, де предикат TRUE, тож рядки UNKNOWN відкидаються. Баг один: NOT IN проти subquery, що містить NULL, не повертає рядків, бо x <> NULL це UNKNOWN, і ланцюг AND згортається — тихий збій лише в продакшні; виправлення — NOT EXISTS. Баг два: фільтр із нерівністю на кшталт WHERE status <> \'active\' тихо виключає рядки, де status IS NULL, бо NULL <> \'active\' це UNKNOWN, а не TRUE — люди очікують, що NULL-рядки включені, а їх немає; треба додати OR status IS NULL чи вжити IS DISTINCT FROM. Споріднений клас — агрегати, що ігнорують NULL (COUNT(col) пропускає NULL, а COUNT(*) ні, і AVG ділить на кількість не-NULL), що тихо змінює результати. Дисципліна — вирішити, що означає NULL для кожної колонки, віддавати перевагу IS [NOT] DISTINCT FROM для null-safe рівності й вживати COALESCE, щоб намір був явним.',
      },
    },
  ],
  seeAlso: ['m5-anatomy-of-a-query', 'm4-relational-model', 'm16-query-planning', 'm11-views-procedural', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 51.5. Planner/Optimizer (nested loop, merge join, hash join)',
      url: 'https://www.postgresql.org/docs/current/planner-optimizer.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 7.8. WITH Queries (CTEs; recursive; MATERIALIZED/NOT MATERIALIZED; inlined since PG 12)',
      url: 'https://www.postgresql.org/docs/current/queries-with.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 3.5. Window Functions (the default frame is RANGE … CURRENT ROW; ROWS/RANGE/GROUPS)',
      url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 7.2.4. GROUPING SETS, CUBE, and ROLLUP (one-pass subtotals; the GROUPING function)',
      url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 9.2. Comparison Functions and Operators (three-valued logic; IS [NOT] DISTINCT FROM)',
      url: 'https://www.postgresql.org/docs/current/functions-comparison.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 9.18. Conditional Expressions (COALESCE, NULLIF, CASE; GREATEST/LEAST ignore NULLs — a deviation from the SQL standard)',
      url: 'https://www.postgresql.org/docs/current/functions-conditional.html',
    },
  ],
};
