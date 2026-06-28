import type { Module } from '../types';

/*
 * M16 · Query planning & optimization — Section III (S8). Authored EN first, UA second; technical
 * terms stay English in both. Facts web-verified 2026-06-24 (see `sources`):
 *  - The planner is COST-BASED: from the rewritten query tree it enumerates physical plans
 *    (access paths × join methods × join orders), estimates each plan's cost, and picks the cheapest.
 *  - Cost constants (runtime-config-query): seq_page_cost = 1.0 (the unit), random_page_cost = 4.0
 *    (random I/O assumed 4× sequential — HDD-era; lower it, ~1.1, for SSD → index scans look cheaper),
 *    cpu_tuple_cost 0.01, cpu_index_tuple_cost 0.005, cpu_operator_cost 0.0025. Cost is an abstract
 *    number in seq-page-fetch units, NOT milliseconds.
 *  - Statistics (planner-stats): ANALYZE samples → pg_statistic/pg_stats: null_frac, n_distinct,
 *    MCV list (most-common values + freqs, capped by default_statistics_target = 100, max 10000),
 *    histogram of bounds for the non-MCV remainder, correlation. Equality uses the MCV list; ranges
 *    use the histogram; ANDs assume column independence (the dangerous assumption).
 *  - Extended statistics (CREATE STATISTICS): capture cross-column correlation — functional
 *    dependencies + n-distinct since PG10, multivariate MCV lists since PG13.
 *  - Join algorithms (planner-optimizer 51.5): nested loop (inner scanned per outer row; great when
 *    outer small + inner indexed), hash join (build hash on smaller side, probe; large equality
 *    joins, needs work_mem, unordered), merge join (both inputs sorted on the key, merged).
 *  - Join order: < geqo_threshold (default 12) relations → near-exhaustive dynamic programming;
 *    ≥ 12 → GEQO genetic search to bound planning time.
 *  - EXPLAIN (using-explain 14.1): plain = estimated cost/rows/width, no execution; EXPLAIN ANALYZE
 *    actually runs it and adds actual time/rows/loops; BUFFERS is ON by default with ANALYZE since
 *    PG18. The misestimate hunt: find the lowest node where estimated and actual rows diverge ~10×+.
 *  - PostgreSQL has NO per-query hints by design (pg_hint_plan is an extension); you steer the
 *    planner by fixing statistics, indexes and query shape, with enable_* GUCs as a diagnostic.
 * Signature module: hero ★ Query Planner / EXPLAIN sim (key 'query-planner') + figure 'plan-tree'.
 */
export const m16: Module = {
  id: 'm16-query-planning',
  num: 16,
  section: 's3-storage',
  order: 5,
  level: 'staff',
  signature: true,
  title: { en: 'Query planning & optimization', uk: 'Планування та оптимізація запитів' },
  tagline: {
    en: 'Cost model, statistics, access paths, join order/algorithms, reading EXPLAIN ANALYZE.',
    uk: 'Cost model, statistics, access paths, порядок/алгоритми join, читання EXPLAIN ANALYZE.',
  },
  readMins: 15,
  mentalModel: {
    en: 'The planner bets on statistics; bad estimates, bad plans.',
    uk: 'Planner робить ставку на statistics; погані оцінки — погані плани.',
  },
  topics: [
    {
      id: 'optimizers-job',
      title: { en: "The optimizer's job", uk: 'Робота оптимізатора' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "SQL is **declarative**: you say *what* rows you want, never *how* to fetch them (M4, M5). Between your query and the data sits the **planner** (the optimizer), and its job is to turn one logical request into the **cheapest physical plan** out of many equivalent ones. For a simple two-table join it already has choices to make: scan each table sequentially or via an index, join them with a nested loop or a hash or a merge, and — with more tables — in which **order**. All of those produce the same rows; they differ wildly in cost. The planner's task is to estimate the cost of the candidates and pick the cheapest.",
            uk: "SQL **декларативний**: ви кажете, *які* рядки хочете, ніколи — *як* їх дістати (M4, M5). Між вашим запитом і даними стоїть **planner** (оптимізатор), і його робота — перетворити один логічний запит на **найдешевший фізичний план** із багатьох еквівалентних. Навіть для простого join двох таблиць у нього вже є вибір: сканувати кожну таблицю послідовно чи через index, зʼєднати їх nested loop, hash чи merge — і, з більшою кількістю таблиць, у якому **порядку**. Усе це дає ті самі рядки; вони шалено різняться вартістю. Завдання planner — оцінити вартість кандидатів і обрати найдешевший.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "PostgreSQL's planner is **cost-based**, not rule-based. It does not follow a fixed recipe (“always use an index if one exists”); it assigns every candidate plan a number — an estimated **cost** — and chooses the minimum. That cost is an abstract figure in units of **`seq_page_cost`**, the cost of one sequential page fetch, fixed at `1.0`. A non-sequential fetch is **`random_page_cost`**, defaulting to `4.0` — the planner assumes random I/O is four times slower than sequential, an HDD-era ratio you lower toward `1.1` on SSDs to make index scans look fairly priced. CPU work is priced too (`cpu_tuple_cost`, `cpu_operator_cost`). The number is **not milliseconds**; it is a relative yardstick the planner uses to compare plans.",
            uk: "Planner PostgreSQL **cost-based**, а не rule-based. Він не йде за фіксованим рецептом («завжди вживай index, якщо він є»); він присвоює кожному плану-кандидату число — оцінений **cost** — і обирає мінімум. Цей cost — абстрактна величина в одиницях **`seq_page_cost`**, вартості одного послідовного читання page, зафіксованої на `1.0`. Непослідовне читання — це **`random_page_cost`**, дефолт `4.0`: planner припускає, що випадковий I/O вчетверо повільніший за послідовний — співвідношення епохи HDD, яке ви знижуєте до ~`1.1` на SSD, щоб index scans виглядали справедливо оціненими. Робота CPU теж оцінюється (`cpu_tuple_cost`, `cpu_operator_cost`). Це число — **не мілісекунди**; це відносна мірка, якою planner порівнює плани.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Every cost rests on one guess: how many rows', uk: 'Кожен cost спирається на одну здогадку: скільки рядків' },
          md: {
            en: "The decisive input to every cost estimate is **cardinality** — how many rows each step will produce. Pick an index scan or a seq scan? It depends on how many rows match. Nested loop or hash join? It depends on how big the inputs are. Get the row counts right and the cost model usually picks a good plan; get them wrong and every downstream decision is built on sand. That is why this module spends as much time on **statistics** as on the plans themselves: the planner is only ever as good as its estimate of how many rows it is about to touch.",
            uk: "Вирішальний вхід для кожної оцінки cost — **cardinality**: скільки рядків дасть кожен крок. Обрати index scan чи seq scan? Залежить від того, скільки рядків збігається. Nested loop чи hash join? Залежить від того, які великі входи. Вгадайте кількість рядків правильно — і cost model зазвичай обере добрий план; помиліться — і кожне подальше рішення збудоване на піску. Тому цей модуль приділяє стільки ж уваги **statistics**, скільки й самим планам: planner рівно настільки добрий, наскільки точна його оцінка кількості рядків, яких він збирається торкнутися.",
          },
        },
      ],
    },
    {
      id: 'statistics-cardinality',
      title: { en: 'Statistics & cardinality estimation', uk: 'Statistics і оцінка cardinality' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Where do the row estimates come from? From **statistics** that **`ANALYZE`** (and autovacuum's autoanalyze) gathers by sampling each table into the `pg_statistic` catalog (readable via `pg_stats`). Per column, the planner stores: the fraction of NULLs, the number of **distinct** values (`n_distinct`), a list of the **most common values** with their frequencies (the **MCV list**), a **histogram** of value ranges for everything *not* in the MCV list, and the physical-vs-logical ordering correlation. From these it computes **selectivity** — the fraction of rows a predicate will keep — and multiplies by the table size to get a row estimate.",
            uk: "Звідки беруться оцінки рядків? Зі **statistics**, що їх **`ANALYZE`** (і autoanalyze від autovacuum) збирає, семплуючи кожну таблицю в каталог `pg_statistic` (читається через `pg_stats`). На кожну колонку planner зберігає: частку NULL, кількість **різних** значень (`n_distinct`), список **найчастіших значень** з їхніми частотами (**MCV list**), **histogram** діапазонів значень для всього, чого *немає* в MCV list, і кореляцію фізичного й логічного впорядкування. З цього він обчислює **selectivity** — частку рядків, яку лишить предикат — і множить на розмір таблиці, щоб отримати оцінку рядків.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The two structures split the work. For an **equality** predicate (`status = 'open'`), the planner looks the value up in the **MCV list**: if it is a common value, it has its exact stored frequency; if not, it uses the residual `(1 − sum of MCV freqs) / n_distinct`. For a **range** predicate (`created_at > '2026-01-01'`), it uses the **histogram**, whose buckets each hold roughly the same number of rows, to estimate what fraction falls in range. The famous failure mode is **correlated columns**: by default the planner assumes predicates are **independent** and multiplies their selectivities, so `WHERE city = 'Lviv' AND country = 'UA'` is wildly under-estimated (the two are not independent — every Lviv is in UA). That single wrong assumption is behind a large share of bad plans.",
            uk: "Дві структури ділять роботу. Для предиката **рівності** (`status = 'open'`) planner шукає значення в **MCV list**: якщо це часте значення, у нього є точна збережена частота; якщо ні — він бере залишок `(1 − сума частот MCV) / n_distinct`. Для предиката **діапазону** (`created_at > '2026-01-01'`) він вживає **histogram**, чиї bucket-и тримають приблизно однакову кількість рядків, щоб оцінити, яка частка потрапляє в діапазон. Відома вада — **корельовані колонки**: за замовчуванням planner припускає, що предикати **незалежні**, і перемножує їхні selectivities, тож `WHERE city = 'Lviv' AND country = 'UA'` шалено недооцінюється (вони не незалежні — кожен Львів у UA). Це єдине хибне припущення стоїть за великою часткою поганих планів.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The per-column statistics the planner leans on (from ANALYZE → pg_stats).',
            uk: 'Постовпцеві statistics, на які спирається planner (з ANALYZE → pg_stats).',
          },
          head: [
            { en: 'Statistic', uk: 'Statistic' },
            { en: 'What it captures', uk: 'Що фіксує' },
            { en: 'Used to estimate', uk: 'Використовується для оцінки' },
          ],
          rows: [
            [
              { en: 'MCV list', uk: 'MCV list' },
              { en: 'The most common values + their frequencies', uk: 'Найчастіші значення + їхні частоти' },
              { en: 'Equality on skewed/common values', uk: 'Рівність на перекошених/частих значеннях' },
            ],
            [
              { en: 'Histogram', uk: 'Histogram' },
              { en: 'Equal-frequency buckets over the non-MCV values', uk: 'Bucket-и рівної частоти над не-MCV значеннями' },
              { en: 'Range / inequality predicates (<, >, BETWEEN)', uk: 'Діапазонні / нерівностні предикати (<, >, BETWEEN)' },
            ],
            [
              { en: 'n_distinct', uk: 'n_distinct' },
              { en: 'Number of distinct values in the column', uk: 'Кількість різних значень у колонці' },
              { en: 'Equality on non-MCV values; GROUP BY sizes', uk: 'Рівність на не-MCV значеннях; розміри GROUP BY' },
            ],
            [
              { en: 'null_frac', uk: 'null_frac' },
              { en: 'Fraction of rows that are NULL', uk: 'Частка рядків, що є NULL' },
              { en: 'IS NULL / IS NOT NULL selectivity', uk: 'Selectivity IS NULL / IS NOT NULL' },
            ],
            [
              { en: 'correlation', uk: 'correlation' },
              { en: 'How well physical order matches column order', uk: 'Наскільки фізичний порядок збігається з порядком колонки' },
              { en: 'Index-scan cost (sequential vs random heap reads)', uk: 'Cost index-scan (послідовні vs випадкові читання heap)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Teach the planner about correlation: CREATE STATISTICS', uk: 'Навчіть planner про кореляцію: CREATE STATISTICS' },
          md: {
            en: "When two columns are correlated and the independence assumption wrecks the estimate, you can give the planner **extended statistics**: `CREATE STATISTICS s (dependencies, ndistinct, mcv) ON city, country FROM addresses`. Functional-dependency and n-distinct stats have existed since **PostgreSQL 10**; multivariate **MCV lists** were added in **PostgreSQL 13**. After an `ANALYZE`, the planner knows the columns move together and stops multiplying their selectivities into a vast underestimate. It is the targeted fix for the most common cardinality blunder.",
            uk: "Коли дві колонки корельовані й припущення незалежності руйнує оцінку, ви можете дати planner **extended statistics**: `CREATE STATISTICS s (dependencies, ndistinct, mcv) ON city, country FROM addresses`. Stats функціональних залежностей і n-distinct існують від **PostgreSQL 10**; багатовимірні **MCV lists** додано в **PostgreSQL 13**. Після `ANALYZE` planner знає, що колонки рухаються разом, і перестає перемножувати їхні selectivities у величезну недооцінку. Це прицільне виправлення найпоширенішої помилки cardinality.",
          },
        },
      ],
    },
    {
      id: 'access-paths-joins',
      title: { en: 'Access paths & join algorithms', uk: 'Access paths і алгоритми join' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "With estimates in hand, the planner chooses an **access path** per table — `Seq Scan`, `Index Scan`, `Index-Only Scan` (M14), or `Bitmap Heap Scan` — and a **join algorithm** per join. The access-path choice turns on selectivity: a predicate that keeps **few** rows favors an index scan; one that keeps **most** of the table favors a sequential scan, because thousands of random index fetches cost more than reading the table straight through. The sim makes the decision tangible: flip whether an index exists and how selective the filter is, and watch the plan switch between `Index Scan` + `Nested Loop` and `Seq Scan` + `Hash Join`.",
            uk: "Маючи оцінки, planner обирає **access path** на кожну таблицю — `Seq Scan`, `Index Scan`, `Index-Only Scan` (M14) чи `Bitmap Heap Scan` — і **алгоритм join** на кожен join. Вибір access path залежить від selectivity: предикат, що лишає **мало** рядків, тяжіє до index scan; той, що лишає **більшість** таблиці, тяжіє до послідовного scan, бо тисячі випадкових index-читань коштують більше, ніж прямий прохід таблицею. Симуляція робить це рішення відчутним: перемкніть, чи є index і наскільки селективний фільтр, і дивіться, як план перемикається між `Index Scan` + `Nested Loop` і `Seq Scan` + `Hash Join`.",
          },
        },
        {
          kind: 'sim',
          sim: 'query-planner',
        },
        {
          kind: 'table',
          caption: {
            en: 'The three join algorithms and when the planner reaches for each.',
            uk: 'Три алгоритми join і коли planner тягнеться до кожного.',
          },
          head: [
            { en: 'Join', uk: 'Join' },
            { en: 'How it runs', uk: 'Як працює' },
            { en: 'Cheapest when', uk: 'Найдешевший коли' },
          ],
          rows: [
            [
              { en: 'Nested Loop', uk: 'Nested Loop' },
              { en: 'For each outer row, look up matches in the inner (ideally via an index)', uk: 'На кожен зовнішній рядок шукати збіги у внутрішній (в ідеалі через index)' },
              { en: 'Outer side is small and the inner is indexed', uk: 'Зовнішній бік малий, а внутрішній індексований' },
            ],
            [
              { en: 'Hash Join', uk: 'Hash Join' },
              { en: 'Build a hash table on the smaller input, probe it with the other', uk: 'Побудувати hash-таблицю на меншому вході, зондувати її іншим' },
              { en: 'Large equality joins; enough work_mem; order not needed', uk: 'Великі equality-join-и; досить work_mem; порядок не потрібен' },
            ],
            [
              { en: 'Merge Join', uk: 'Merge Join' },
              { en: 'Sort both inputs on the join key (or read them pre-sorted), then merge', uk: 'Відсортувати обидва входи за ключем join (чи прочитати вже відсортованими), тоді злити' },
              { en: 'Inputs already sorted (indexes) or very large', uk: 'Входи вже відсортовані (indexes) або дуже великі' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "Join **order** is the other half, and it is where planning gets expensive: the number of possible orderings grows faster than exponentially with the number of tables. PostgreSQL handles it in two regimes. Below **`geqo_threshold`** (default **12**) relations, it runs a near-exhaustive **dynamic-programming** search (the classic System-R bottom-up approach) and finds the optimal order. At 12 or more, an exhaustive search would itself be too slow, so it switches to the **GEQO** — a *genetic* optimizer that searches heuristically for a good-enough order in bounded time. This is why very large joins can occasionally get an unstable or sub-optimal plan: above the threshold the planner is sampling the space, not solving it.",
            uk: "Join **order** — друга половина, і саме тут планування дорожчає: кількість можливих порядків росте швидше за експоненту з кількістю таблиць. PostgreSQL обробляє це у двох режимах. Нижче **`geqo_threshold`** (дефолт **12**) relations він виконує майже вичерпний пошук **dynamic programming** (класичний підхід System-R знизу вгору) і знаходить оптимальний порядок. На 12 і більше вичерпний пошук сам був би заповільним, тож він перемикається на **GEQO** — *генетичний* оптимізатор, що евристично шукає достатньо добрий порядок за обмежений час. Тому дуже великі join-и інколи отримують нестабільний чи неоптимальний план: понад поріг planner семплює простір, а не розвʼязує його.",
          },
        },
      ],
    },
    {
      id: 'reading-explain',
      title: { en: 'Reading EXPLAIN (ANALYZE)', uk: 'Читання EXPLAIN (ANALYZE)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**`EXPLAIN`** shows you the plan the planner chose, as a tree of nodes annotated with its **estimates**: `cost=startup..total`, `rows`, and `width`. It does **not** run the query. **`EXPLAIN ANALYZE`** does run it, and adds the **actuals** beside each estimate: `actual time=…`, `actual rows=…`, and `loops`. Since **PostgreSQL 18**, `EXPLAIN ANALYZE` also includes **`BUFFERS`** by default — the shared/local block hits and reads that tell you how much I/O each node really did. Read the tree **bottom-up**: the leaf scans run first and rows flow up to the root.",
            uk: "**`EXPLAIN`** показує план, який обрав planner, як дерево вузлів з його **оцінками**: `cost=startup..total`, `rows` і `width`. Він **не** виконує запит. **`EXPLAIN ANALYZE`** таки виконує його й додає **фактичні** дані поруч з кожною оцінкою: `actual time=…`, `actual rows=…` і `loops`. Від **PostgreSQL 18** `EXPLAIN ANALYZE` також включає **`BUFFERS`** за замовчуванням — block hits і reads, що кажуть, скільки I/O реально зробив кожен вузол. Читайте дерево **знизу вгору**: листкові scans виконуються першими, а рядки течуть угору до кореня.",
          },
        },
        {
          kind: 'figure',
          fig: 'plan-tree',
          caption: {
            en: 'A plan node carries the planner’s estimates; EXPLAIN ANALYZE prints the actuals beside them. The misestimate to hunt is the lowest node where estimated and actual rows diverge by a large factor — here 600,000 estimated vs 80 actual.',
            uk: 'Вузол плану несе оцінки planner; EXPLAIN ANALYZE друкує фактичні дані поруч. Misestimate, який шукають, — найнижчий вузол, де оцінені й фактичні рядки розходяться на великий множник — тут 600 000 оцінено проти 80 фактичних.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The single most useful skill is the **misestimate hunt**. Scan the tree for the **lowest node where the estimated `rows` and the actual `rows` differ by a large factor** — a rule of thumb is ~10× or more. That node is almost always the root cause; a slow join higher up is usually just a *consequence* of a bad row estimate feeding it. An **under-estimate** (planner thought few rows, got many) is the dangerous one: it tempts the planner into a nested loop that then executes millions of times. An **over-estimate** makes it avoid an index it should have used. Either way, the fix targets the *estimate*, not the symptom.",
            uk: "Найкорисніша навичка — **полювання на misestimate**. Перегляньте дерево на **найнижчий вузол, де оцінені `rows` і фактичні `rows` різняться на великий множник** — орієнтир ~10× чи більше. Цей вузол майже завжди першопричина; повільний join вище зазвичай лише *наслідок* поганої оцінки рядків, що його живить. **Недооцінка** (planner думав, що рядків мало, а їх багато) — небезпечна: вона спокушає planner на nested loop, що тоді виконується мільйони разів. **Переоцінка** змушує його уникати index, який слід було вжити. У будь-якому разі виправлення цілить в *оцінку*, а не в симптом.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'EXPLAIN', uk: 'EXPLAIN' },
          b: { en: 'EXPLAIN ANALYZE', uk: 'EXPLAIN ANALYZE' },
          rows: [
            [
              { en: 'Runs the query?', uk: 'Виконує запит?' },
              { en: 'No — plan + estimates only', uk: 'Ні — лише план + оцінки' },
              { en: 'Yes — actually executes it', uk: 'Так — справді виконує його' },
            ],
            [
              { en: 'Shows', uk: 'Показує' },
              { en: 'cost=startup..total, rows, width (estimates)', uk: 'cost=startup..total, rows, width (оцінки)' },
              { en: '+ actual time, actual rows, loops, BUFFERS (PG18)', uk: '+ фактичний час, фактичні рядки, loops, BUFFERS (PG18)' },
            ],
            [
              { en: 'Use it to', uk: 'Вживайте, щоб' },
              { en: 'See the chosen plan cheaply, even for huge queries', uk: 'Дешево побачити обраний план, навіть для величезних запитів' },
              { en: 'Compare estimate vs reality; find the misestimate', uk: 'Порівняти оцінку з реальністю; знайти misestimate' },
            ],
            [
              { en: 'Caution', uk: 'Обережно' },
              { en: 'Estimates can be wrong — it is only a prediction', uk: 'Оцінки можуть бути хибні — це лише прогноз' },
              { en: 'It runs side effects; wrap writes in BEGIN/ROLLBACK', uk: 'Виконує побічні ефекти; обгортайте записи в BEGIN/ROLLBACK' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- PG18: BUFFERS is on by default with ANALYZE. Wrap writes so the run can't commit.
BEGIN;
EXPLAIN (ANALYZE)
SELECT o.id, c.name
FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'open';
ROLLBACK;

-- Read the output: estimate vs reality, bottom-up.
--   Seq Scan on orders  (cost=0.00..18500 rows=600000 width=8)
--                       (actual time=0.02..240 rows=80 loops=1)
--   → estimate 600000, actual 80  ← the misestimate: stats are stale or correlated

-- The fixes target the ESTIMATE, in order of preference:
ANALYZE orders;                                   -- refresh sampled statistics
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;  -- finer-grained MCV/histogram
CREATE STATISTICS ord_corr (dependencies, mcv) ON status, customer_id FROM orders;
ANALYZE orders;`,
          note: {
            en: 'Almost every “the planner chose a bad plan” turns out to be “the planner had a bad row estimate”. Fix the statistics first; reach for indexes (M13/M14) and query-shape changes next; touch enable_* GUCs only to diagnose.',
            uk: 'Майже кожне «planner обрав поганий план» виявляється «у planner була погана оцінка рядків». Спершу виправте statistics; далі беріть indexes (M13/M14) і зміни форми запиту; чіпайте enable_* GUCs лише для діагностики.',
          },
        },
      ],
    },
    {
      id: 'helping-the-planner',
      title: { en: 'Helping the planner', uk: 'Як допомогти planner' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Once you can read a plan, steering it is mostly about feeding it better inputs rather than overriding its decisions. In rough order of preference: **(1) keep statistics fresh** — let autovacuum analyze, and run `ANALYZE` manually after big bulk loads. **(2) Raise the resolution** where data is skewed — `ALTER TABLE … SET STATISTICS` for a column, or add **extended statistics** for correlated columns. **(3) Give it the right indexes** (M13/M14) and write **sargable** predicates so they can be used. **(4) Adjust the cost model to the hardware** — lower `random_page_cost` on SSDs so index scans are priced fairly. **(5) Reshape the query** if a rewrite exposes a cheaper plan.",
            uk: "Щойно ви вмієте читати план, керування ним — здебільшого про кращі входи, а не про перевизначення його рішень. Приблизно за пріоритетом: **(1) тримайте statistics свіжими** — дайте autovacuum аналізувати й запускайте `ANALYZE` вручну після великих bulk-завантажень. **(2) Підніміть роздільність** там, де дані перекошені — `ALTER TABLE … SET STATISTICS` для колонки чи додайте **extended statistics** для корельованих колонок. **(3) Дайте йому правильні indexes** (M13/M14) і пишіть **sargable** предикати, щоб їх можна було вжити. **(4) Підлаштуйте cost model під залізо** — знизьте `random_page_cost` на SSD, щоб index scans оцінювалися справедливо. **(5) Переформуйте запит**, якщо переписування відкриває дешевший план.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'PostgreSQL has no query hints — on purpose', uk: 'У PostgreSQL немає query hints — навмисно' },
          md: {
            en: "Unlike Oracle or MySQL, core PostgreSQL deliberately ships **no per-query planner hints** (`/*+ ... */`). The philosophy is that a hint freezes a decision that was right *today* and becomes wrong as data grows — far better to fix the statistics so the planner stays adaptive. You can flip session-level **`enable_*`** flags (`enable_nestloop = off`) to *test a hypothesis* about why a plan was chosen, but they are blunt, global, and not a production fix. (The out-of-core `pg_hint_plan` extension exists for the rare case you truly need to pin a plan.) The intended workflow is: diagnose the misestimate, correct the input, and let the planner re-decide.",
            uk: "На відміну від Oracle чи MySQL, ядро PostgreSQL навмисно постачає **жодних post-query planner hints** (`/*+ ... */`). Філософія в тому, що hint заморожує рішення, правильне *сьогодні*, і стає хибним зі зростанням даних — куди краще виправити statistics, щоб planner лишався адаптивним. Ви можете перемикати сесійні прапорці **`enable_*`** (`enable_nestloop = off`), щоб *перевірити гіпотезу*, чому обрано план, але вони грубі, глобальні й не продакшн-виправлення. (Зовнішнє розширення `pg_hint_plan` існує для рідкісного випадку, коли вам справді треба зафіксувати план.) Замислений процес такий: діагностувати misestimate, виправити вхід і дати planner вирішити заново.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Pulling the section together: the planner is a cost-minimizer whose every decision — access path, join algorithm, join order — rests on **estimated cardinality**, and that estimate comes from sampled **statistics**. Good plans follow from good estimates, so the work of query tuning is mostly the work of keeping the planner well-informed: fresh, high-resolution, correlation-aware statistics; the right indexes; and predicates it can actually use. `EXPLAIN ANALYZE` is the instrument that tells you, node by node, where the estimate and the reality parted ways. That diagnostic loop — read the plan, find the misestimate, fix the input — is the core skill that carries into performance engineering (M34).",
            uk: "Збираючи розділ воєдино: planner — мінімізатор cost, чиє кожне рішення — access path, алгоритм join, join order — спирається на **оцінену cardinality**, а ця оцінка походить із семпльованих **statistics**. Добрі плани випливають з добрих оцінок, тож робота з тюнінгу запитів — здебільшого робота з того, щоб planner був добре поінформований: свіжі, високороздільні, обізнані про кореляцію statistics; правильні indexes; і предикати, які він справді може вжити. `EXPLAIN ANALYZE` — інструмент, що каже вам, вузол за вузлом, де оцінка й реальність розійшлися. Цей діагностичний цикл — прочитати план, знайти misestimate, виправити вхід — і є ключовою навичкою, що переходить в інженерію продуктивності (M34).",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'The planner is cost-based: from one declarative query it enumerates physical plans (access path × join algorithm × join order), costs each in seq_page_cost units (random_page_cost defaults to 4.0), and picks the cheapest. The cost is a yardstick, not milliseconds.',
      uk: 'Planner cost-based: з одного декларативного запиту він перебирає фізичні плани (access path × алгоритм join × join order), оцінює кожен в одиницях seq_page_cost (random_page_cost дефолт 4.0) й обирає найдешевший. Cost — це мірка, а не мілісекунди.',
    },
    {
      en: 'Every cost rests on estimated cardinality, computed from ANALYZE statistics: MCV list (equality), histogram (ranges), n_distinct, null_frac, correlation. The default independence assumption wrecks estimates for correlated columns — fix with CREATE STATISTICS (deps/ndistinct since PG10, MCV since PG13).',
      uk: 'Кожен cost спирається на оцінену cardinality, обчислену зі statistics ANALYZE: MCV list (рівність), histogram (діапазони), n_distinct, null_frac, correlation. Дефолтне припущення незалежності руйнує оцінки для корельованих колонок — виправляйте через CREATE STATISTICS (deps/ndistinct з PG10, MCV з PG13).',
    },
    {
      en: 'Access path follows selectivity (few rows → index scan; most of the table → seq scan). Joins: nested loop (small outer + indexed inner), hash (large equality joins), merge (pre-sorted/huge inputs). Join order: dynamic programming below geqo_threshold=12, GEQO genetic search at or above.',
      uk: 'Access path іде за selectivity (мало рядків → index scan; більшість таблиці → seq scan). Join-и: nested loop (малий зовнішній + індексований внутрішній), hash (великі equality-join-и), merge (вже відсортовані/величезні входи). Join order: dynamic programming нижче geqo_threshold=12, генетичний GEQO на/понад.',
    },
    {
      en: 'EXPLAIN shows estimates (cost/rows/width); EXPLAIN ANALYZE runs the query and adds actual time/rows/loops, plus BUFFERS by default since PG18. Read bottom-up and hunt the lowest node where estimated vs actual rows diverge ~10×+.',
      uk: 'EXPLAIN показує оцінки (cost/rows/width); EXPLAIN ANALYZE виконує запит і додає фактичні час/рядки/loops, плюс BUFFERS за замовчуванням від PG18. Читайте знизу вгору й шукайте найнижчий вузол, де оцінені vs фактичні рядки розходяться ~10×+.',
    },
    {
      en: 'Steer the planner by fixing inputs, not overriding decisions: fresh ANALYZE, higher statistics targets, extended statistics, the right indexes and sargable predicates, hardware-tuned cost constants. PostgreSQL ships no per-query hints by design — fix the estimate so the planner stays adaptive.',
      uk: 'Керуйте planner, виправляючи входи, а не перевизначаючи рішення: свіжий ANALYZE, вищі statistics targets, extended statistics, правильні indexes і sargable предикати, налаштовані під залізо cost-константи. PostgreSQL навмисно не має post-query hints — виправте оцінку, щоб planner лишався адаптивним.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Reading EXPLAIN cost as milliseconds', uk: 'Читати cost у EXPLAIN як мілісекунди' },
      body: {
        en: 'The cost number is an abstract estimate in seq_page_cost units, not a time. Two plans’ costs are comparable to each other, but a cost of 1000 is not “1000 ms”. For real timing use EXPLAIN ANALYZE’s actual time. And remember the cost is only as good as the row estimate behind it — a confidently low cost on a stale estimate is exactly how bad plans get chosen.',
        uk: 'Число cost — абстрактна оцінка в одиницях seq_page_cost, а не час. Cost-и двох планів порівнянні між собою, але cost 1000 — це не «1000 мс». Для реального часу вживайте actual time з EXPLAIN ANALYZE. І памʼятайте: cost рівно настільки добрий, наскільки добра оцінка рядків за ним — упевнено низький cost на застарілій оцінці саме так і призводить до вибору поганих планів.',
      },
    },
    {
      title: { en: 'Assuming an index will always be used', uk: 'Вважати, що index завжди буде вжито' },
      body: {
        en: 'An index helps only a selective predicate. If the planner estimates that most of the table matches, a sequential scan is genuinely cheaper than thousands of random index fetches, so it correctly ignores the index. If you expected an index scan and got a seq scan, ask first whether the estimate is right (ANALYZE, statistics target) before blaming the planner — it is usually estimating, not misbehaving.',
        uk: 'Index допомагає лише селективному предикату. Якщо planner оцінює, що збігається більшість таблиці, послідовний scan справді дешевший за тисячі випадкових index-читань, тож він правильно ігнорує index. Якщо ви очікували index scan, а отримали seq scan, спершу спитайте, чи правильна оцінка (ANALYZE, statistics target), перш ніж винуватити planner — він зазвичай оцінює, а не помиляється.',
      },
    },
    {
      title: { en: 'Fighting the planner with enable_* flags in production', uk: 'Боротися з planner прапорцями enable_* у продакшені' },
      body: {
        en: 'Turning off enable_nestloop or enable_seqscan to force a plan treats the symptom and freezes a decision that will rot as data changes. These flags are global session diagnostics for testing a hypothesis, not a fix. The durable solution is to correct the cardinality estimate — refresh or extend statistics, add the missing index, or make the predicate sargable — and let the planner re-decide.',
        uk: 'Вимкнути enable_nestloop чи enable_seqscan, щоб навʼязати план, — це лікувати симптом і заморозити рішення, що зігниє зі зміною даних. Ці прапорці — глобальні сесійні діагностики для перевірки гіпотези, а не виправлення. Тривке рішення — виправити оцінку cardinality (оновити чи розширити statistics, додати відсутній index чи зробити предикат sargable) і дати planner вирішити заново.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'In EXPLAIN ANALYZE, what is the difference between the estimated and actual rows, and why do you look for the lowest node where they diverge?',
        uk: 'У EXPLAIN ANALYZE яка різниця між оціненими й фактичними рядками і чому ви шукаєте найнижчий вузол, де вони розходяться?',
      },
      a: {
        en: 'The estimated rows is what the planner predicted that node would emit, computed before execution from the table statistics — MCV lists, histograms, n_distinct — and the selectivity of the predicates. The actual rows is what the node really produced when EXPLAIN ANALYZE ran the query. Comparing them tells you how accurate the planner’s guess was, and the guess is what every cost and therefore every plan decision was built on. I look for the lowest node where they diverge by a large factor — say 10× or more — because plan errors propagate upward. If a scan deep in the tree estimated 80 rows but produced 600,000, every node above it was planned for 80 rows: the planner may have chosen a nested loop expecting a tiny input, and that nested loop now executes 600,000 times. The slow join at the top is a symptom; the misestimated scan at the bottom is the cause. Fixing the top node — say, forcing a different join — would only paper over it; fixing the estimate at the bottom, by refreshing statistics or adding extended statistics for correlated columns, corrects every decision above it at once. So the lowest divergence is the root cause, and that is where the fix belongs.',
        uk: 'Оцінені рядки — це те, що planner передбачив, що вузол видасть, обчислене до виконання зі statistics таблиці — MCV lists, histograms, n_distinct — і selectivity предикатів. Фактичні рядки — те, що вузол реально дав, коли EXPLAIN ANALYZE виконав запит. Їх порівняння каже, наскільки точною була здогадка planner, а саме на здогадці збудований кожен cost і, отже, кожне рішення про план. Я шукаю найнижчий вузол, де вони розходяться на великий множник — скажімо, 10× чи більше — бо помилки плану поширюються вгору. Якщо scan глибоко в дереві оцінив 80 рядків, а дав 600 000, кожен вузол над ним планувався під 80 рядків: planner міг обрати nested loop, очікуючи крихітний вхід, і цей nested loop тепер виконується 600 000 разів. Повільний join угорі — симптом; недооцінений scan унизу — причина. Виправлення верхнього вузла — скажімо, навʼязати інший join — лише замаскувало б це; виправлення оцінки внизу, оновленням statistics чи додаванням extended statistics для корельованих колонок, виправляє кожне рішення над ним одразу. Тож найнижче розходження — першопричина, і саме туди належить виправлення.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'When would the planner choose a hash join over a nested loop, and what makes a nested loop dangerous?',
        uk: 'Коли planner обере hash join замість nested loop і що робить nested loop небезпечним?',
      },
      a: {
        en: 'A nested loop scans the inner relation once for every row of the outer relation, so its cost is roughly the outer row count times the cost of one inner lookup. It is the cheapest join when the outer side is small and the inner side can be probed cheaply — ideally by an index — because then you do only a handful of fast index lookups. A hash join instead builds a hash table over the smaller input and probes it once with the other input; building the hash has an up-front cost and needs work_mem, but each probe is O(1), so it wins when both inputs are large and the join is on equality. So the planner picks a nested loop for small-outer, indexed-inner equality or non-equality joins, and a hash join for large equality joins where a nested loop’s repeated scans would be too expensive. What makes the nested loop dangerous is its sensitivity to the cardinality estimate: its cost scales with the number of outer rows. If the planner under-estimates the outer side — thinks 80 rows when there are 600,000 — it will happily choose a nested loop, and at runtime that loop executes hundreds of thousands of times instead of a few, turning a “cheap” plan into a query that runs for minutes. A hash join degrades far more gracefully under a bad estimate. That asymmetry is exactly why an under-estimate feeding a nested loop is the classic catastrophic plan, and why I check the actual-vs-estimated rows on the outer input of any nested loop in a slow plan.',
        uk: 'Nested loop сканує внутрішню relation раз на кожен рядок зовнішньої, тож його cost — приблизно кількість зовнішніх рядків помножена на вартість одного внутрішнього пошуку. Це найдешевший join, коли зовнішній бік малий, а внутрішній можна дешево зондувати — в ідеалі через index — бо тоді ви робите лише жменю швидких index-пошуків. Hash join натомість будує hash-таблицю над меншим входом і зондує її раз іншим входом; побудова hash має початкову вартість і потребує work_mem, зате кожне зондування O(1), тож він перемагає, коли обидва входи великі, а join за рівністю. Тож planner обирає nested loop для join-ів із малим зовнішнім та індексованим внутрішнім (за рівністю чи ні), і hash join для великих equality-join-ів, де повторні скани nested loop були б задорогі. Небезпечним nested loop робить його чутливість до оцінки cardinality: його cost масштабується з кількістю зовнішніх рядків. Якщо planner недооцінить зовнішній бік — думає 80 рядків, а їх 600 000 — він радо обере nested loop, і під час виконання цей цикл повториться сотні тисяч разів замість кількох, перетворивши «дешевий» план на запит, що працює хвилинами. Hash join деградує куди плавніше за поганої оцінки. Ця асиметрія — саме чому недооцінка, що живить nested loop, — класичний катастрофічний план, і чому я перевіряю фактичні-проти-оцінених рядки на зовнішньому вході будь-якого nested loop у повільному плані.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A query was fast for months, then suddenly became slow with no code or data-shape change. Walk through how you would diagnose it.',
        uk: 'Запит місяцями був швидким, тоді раптом став повільним без зміни коду чи форми даних. Проведіть, як ви це діагностуєте.',
      },
      a: {
        en: 'A plan that flips from fast to slow without a query change is almost always a planning problem — the planner started choosing a different plan because its estimates changed. My first move is EXPLAIN ANALYZE on the slow query and compare it to what the plan used to be, if I have it. I look for the node where estimated and actual rows diverge, because a sudden regression usually means statistics drifted: the table grew or its distribution shifted, autovacuum/autoanalyze fell behind, and the planner is now estimating off stale numbers and tipping a borderline decision the wrong way — typically from a hash join or index scan into a nested loop or seq scan, or vice versa. So I check the basics of staleness: when was the table last analyzed (pg_stat_user_tables), is autovacuum keeping up, did a bulk load land without a follow-up ANALYZE, or did the rows cross a threshold where the cheapest plan genuinely changed. A few other usual suspects: a parameterized/prepared statement that switched to a generic plan after several executions; a value that used to be in the MCV list aging out so its selectivity is now wrong; or correlated predicates whose independence assumption only started hurting once the data volume grew. The fix follows the diagnosis: run ANALYZE to refresh statistics, raise the statistics target or add extended statistics if the distribution is skewed or correlated, make sure the right index still exists and is being chosen, and only as a temporary stopgap consider pinning behavior. The reasoning I want to show is that “same query, newly slow” points at the planner and its statistics, not at the SQL — and that EXPLAIN ANALYZE plus the analyze/vacuum stats is exactly how you localize which estimate went bad.',
        uk: 'План, що перемикається зі швидкого на повільний без зміни запиту, майже завжди — проблема планування: planner почав обирати інший план, бо змінилися його оцінки. Мій перший крок — EXPLAIN ANALYZE на повільному запиті й порівняння з тим, яким план був раніше, якщо він у мене є. Я шукаю вузол, де оцінені й фактичні рядки розходяться, бо раптова регресія зазвичай означає, що statistics дрейфнули: таблиця зросла чи її розподіл змістився, autovacuum/autoanalyze відстав, і planner тепер оцінює за застарілими числами й перехиляє межове рішення не в той бік — типово з hash join чи index scan у nested loop чи seq scan, або навпаки. Тож я перевіряю основи застарілості: коли таблицю востаннє аналізували (pg_stat_user_tables), чи встигає autovacuum, чи приземлився bulk-load без подальшого ANALYZE, чи перетнули рядки поріг, де найдешевший план справді змінився. Кілька інших звичних підозрюваних: параметризований/prepared statement, що перемкнувся на generic plan після кількох виконань; значення, що було в MCV list, але «постаріло» й вибуло, тож його selectivity тепер хибна; або корельовані предикати, чиє припущення незалежності почало шкодити лише коли обсяг даних зріс. Виправлення йде за діагнозом: запустити ANALYZE, щоб оновити statistics, підняти statistics target чи додати extended statistics, якщо розподіл перекошений чи корельований, переконатися, що правильний index досі існує й обирається, і лише як тимчасовий захід розглянути фіксацію поведінки. Міркування, яке я хочу показати: «той самий запит, раптом повільний» вказує на planner і його statistics, а не на SQL — і що EXPLAIN ANALYZE плюс stats з analyze/vacuum — саме те, чим локалізують, яка оцінка зіпсувалася.',
      },
    },
  ],
  seeAlso: ['m13-btree', 'm14-index-toolbox', 'm12-storage', 'm5-anatomy-of-a-query', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 51.5. Planner/Optimizer (nested-loop / hash / merge joins; join order; GEQO threshold)',
      url: 'https://www.postgresql.org/docs/current/planner-optimizer.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 14.1. Using EXPLAIN (estimated vs actual rows; EXPLAIN ANALYZE)',
      url: 'https://www.postgresql.org/docs/current/using-explain.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 14.2. Statistics Used by the Planner (MCV, histogram, n_distinct; extended statistics)',
      url: 'https://www.postgresql.org/docs/current/planner-stats.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 19.7. Query Planning (seq_page_cost 1.0, random_page_cost 4.0, cpu_* costs)',
      url: 'https://www.postgresql.org/docs/current/runtime-config-query.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 69.1. Row Estimation Examples (selectivity from the MCV list and histogram)',
      url: 'https://www.postgresql.org/docs/current/row-estimation-examples.html',
    },
    {
      title: 'PostgreSQL 18 Release Notes (E.4) — EXPLAIN ANALYZE now includes BUFFERS output by default',
      url: 'https://www.postgresql.org/docs/current/release-18.html',
    },
  ],
};
