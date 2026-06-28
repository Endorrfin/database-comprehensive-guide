import type { Module } from '../types';

/*
 * M5 · Anatomy of a query — the lifecycle, signature module (S3).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 against the PostgreSQL 18 docs (see `sources`):
 * "The Path of a Query" (parser → rewrite system → planner/optimizer → executor),
 * the planner's seq-scan-vs-index-scan path choice by estimated cost, the executor's
 * recursive plan-tree pull from the storage system, and EXPLAIN (logical vs physical).
 * The embedded sim 'query-lifecycle' walks this exact pipeline.
 */
export const m5: Module = {
  id: 'm5-anatomy-of-a-query',
  num: 5,
  section: 's1-foundations',
  order: 5,
  level: 'middle',
  signature: true,
  title: { en: 'Anatomy of a query', uk: 'Анатомія запиту' },
  tagline: {
    en: 'Parse → plan → execute → storage → result: the lifecycle every later module hangs off.',
    uk: 'Parse → plan → execute → storage → result: життєвий цикл, на якому тримається решта модулів.',
  },
  readMins: 10,
  mentalModel: {
    en: 'SQL is a request, not a recipe — the planner decides how.',
    uk: 'SQL — це запит, а не рецепт: planner вирішує як.',
  },
  topics: [
    {
      id: 'the-lifecycle',
      title: { en: 'The lifecycle of a query', uk: 'Життєвий цикл запиту' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "When you send one line of SQL, the database does not \"run\" it the way a script runs. The text passes through a short **pipeline**, and each stage transforms it into something closer to actual data access. PostgreSQL's documentation calls this *the path of a query*, and it is the single most useful mental model in this whole guide: parser → rewriter → planner/optimizer → executor → storage → result. Step through it below — and flip the one toggle to watch a single decision (is there an index?) change everything downstream.",
            uk: "Коли ви надсилаєте один рядок SQL, база не «виконує» його як скрипт. Текст проходить короткий **pipeline**, і кожна стадія перетворює його на щось ближче до реального доступу до даних. Документація PostgreSQL зве це *the path of a query*, і це найкорисніша ментальна модель усього посібника: parser → rewriter → planner/optimizer → executor → storage → result. Пройдіть її нижче — і перемкніть єдиний toggle, щоб побачити, як одне рішення (чи є index?) змінює все далі за течією.",
          },
        },
        {
          kind: 'sim',
          sim: 'query-lifecycle',
        },
        {
          kind: 'prose',
          md: {
            en: "Walk the stages once. The **parser** checks syntax and builds a *query tree* — at this point nothing has run; a typo here is your \"syntax error\". The **rewriter** applies stored rules and, crucially, expands any **views** into their underlying base tables (row-level security rewrites here too). The **planner/optimizer** is where the intelligence lives: it enumerates the possible *paths* — for a table with an index, that means at least a sequential scan and an index scan — estimates the cost of each, and keeps the cheapest, producing a **plan tree**. The **executor** walks that plan tree, pulling rows up through it and calling into the **storage** system to read pages. The finished rows are the **result**.",
            uk: "Пройдіть стадії раз. **Parser** перевіряє синтаксис і будує *query tree* — тут ще нічого не виконано; друкарська помилка тут — це ваш «syntax error». **Rewriter** застосовує збережені rules і, головне, розгортає будь-які **views** у їхні базові base tables (row-level security теж переписується тут). **Planner/optimizer** — місце, де живе інтелект: він перелічує можливі *paths* — для table з index це щонайменше sequential scan та index scan — оцінює cost кожного і лишає найдешевший, видаючи **plan tree**. **Executor** обходить цей plan tree, тягнучи rows угору крізь нього й звертаючись до **storage**, щоб читати pages. Готові rows — це **result**.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Each stage has one job — and a place it visibly shows up in real life.',
            uk: 'Кожна стадія має одну роботу — і місце, де вона помітно проявляється на практиці.',
          },
          head: [
            { en: 'Stage', uk: 'Стадія' },
            { en: 'Its job', uk: 'Її робота' },
            { en: 'Where you notice it', uk: 'Де ви це помічаєте' },
          ],
          rows: [
            [
              { en: 'Parser', uk: 'Parser' },
              { en: 'Syntax check → query tree', uk: 'Перевірка синтаксису → query tree' },
              { en: '"syntax error at or near…"', uk: '«syntax error at or near…»' },
            ],
            [
              { en: 'Rewriter', uk: 'Rewriter' },
              { en: 'Apply rules; expand views & RLS', uk: 'Застосувати rules; розгорнути views і RLS' },
              { en: 'Views, row-level security', uk: 'Views, row-level security' },
            ],
            [
              { en: 'Planner / Optimizer', uk: 'Planner / Optimizer' },
              { en: 'Pick the cheapest physical plan', uk: 'Обрати найдешевший фізичний plan' },
              { en: 'EXPLAIN, indexes, statistics', uk: 'EXPLAIN, indexes, statistics' },
            ],
            [
              { en: 'Executor', uk: 'Executor' },
              { en: 'Run the plan, pull rows', uk: 'Виконати plan, тягнути rows' },
              { en: 'EXPLAIN ANALYZE actual time/rows', uk: 'EXPLAIN ANALYZE — фактичні час/rows' },
            ],
            [
              { en: 'Storage', uk: 'Storage' },
              { en: 'Read/write pages (heap, index, WAL)', uk: 'Читати/писати pages (heap, index, WAL)' },
              { en: 'Buffer cache, disk I/O', uk: 'Buffer cache, дисковий I/O' },
            ],
          ],
        },
      ],
    },
    {
      id: 'logical-vs-physical-plan',
      title: { en: 'Logical vs physical plan', uk: 'Логічний проти фізичного plan' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The toggle in the simulator is the heart of the matter. Your SQL is a **logical** statement — *which* rows and columns you want. It says nothing about *how*. The planner turns that single logical request into one of many possible **physical** plans — concrete algorithms: a sequential scan or an index scan, a nested-loop or hash or merge join, an in-memory or on-disk sort. All physical plans for a query return the **same rows**; they differ only in cost. The PostgreSQL docs use exactly this example: if an index exists, the scan has two paths, and the planner estimates both and chooses the cheaper.",
            uk: "Toggle у симуляторі — це суть справи. Ваш SQL — **логічний** стейтмент: *які* rows і columns ви хочете. Про *як* — ні слова. Planner перетворює цей один логічний запит на один із багатьох можливих **фізичних** plans — конкретних алгоритмів: sequential scan чи index scan, nested-loop, hash чи merge join, сортування в памʼяті чи на диску. Усі фізичні plans запиту повертають **ті самі rows**; різниця лише в cost. Документація PostgreSQL бере саме цей приклад: якщо index існує, у scan два paths, і planner оцінює обидва й обирає дешевший.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Logical plan — the "what"', uk: 'Логічний plan — «що»' },
          b: { en: 'Physical plan — the "how"', uk: 'Фізичний plan — «як»' },
          rows: [
            [
              { en: 'Describes', uk: 'Описує' },
              { en: 'The result: which rows & columns', uk: 'Результат: які rows і columns' },
              { en: 'The algorithm: scans, joins, sorts', uk: 'Алгоритм: scans, joins, sorts' },
            ],
            [
              { en: 'How many exist', uk: 'Скільки існує' },
              { en: 'One — it is your SQL', uk: 'Один — це ваш SQL' },
              { en: 'Many equivalent ones', uk: 'Багато еквівалентних' },
            ],
            [
              { en: 'Chosen by', uk: 'Хто обирає' },
              { en: 'You, by writing the query', uk: 'Ви, пишучи запит' },
              { en: 'The planner, by estimated cost', uk: 'Planner, за оцінкою cost' },
            ],
            [
              { en: 'You inspect it via', uk: 'Як оглянути' },
              { en: 'The SQL text', uk: 'Текст SQL' },
              { en: 'EXPLAIN / EXPLAIN ANALYZE', uk: 'EXPLAIN / EXPLAIN ANALYZE' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'EXPLAIN is how you see the physical plan', uk: 'EXPLAIN — це як побачити фізичний plan' },
          md: {
            en: "`EXPLAIN <query>` prints the plan tree the planner chose, with its **estimated** cost and rows; `EXPLAIN ANALYZE` actually runs the query and adds the **real** time and row counts so you can compare estimate to reality. Almost all query tuning is reading that tree, spotting a sequential scan that should be an index scan, or an estimate that is wildly off — the skill M16 is built around. Learn to read it early; it turns performance from guesswork into observation.",
            uk: "`EXPLAIN <query>` друкує plan tree, який обрав planner, з його **оцінковими** cost і rows; `EXPLAIN ANALYZE` справді виконує запит і додає **реальні** час і кількість rows, щоб порівняти оцінку з реальністю. Майже весь тюнінг запитів — це читання цього дерева, виявлення sequential scan, який мав би бути index scan, чи оцінки, що геть хибна — навичка, навколо якої збудовано M16. Вчіться читати його рано; це перетворює продуктивність із здогадів на спостереження.",
          },
        },
      ],
    },
    {
      id: 'where-time-goes',
      title: { en: 'Where the time goes', uk: 'Куди йде час' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Knowing the pipeline tells you **where** a slow query is actually spending its time — and the answer is almost never \"parsing\". Parsing and rewriting are microseconds. Planning is usually sub-millisecond, though it can grow for queries joining many tables. The real cost lives in the last two stages: the **executor** burning CPU on big sorts, hashes and function calls, and above all the **storage** layer doing **I/O** — reading pages that are not cached. A missing index that forces a full table scan, or an N+1 pattern that fires hundreds of network round-trips, dwarfs everything else.",
            uk: "Знання pipeline каже вам, **де** повільний запит насправді витрачає час — і відповідь майже ніколи не «parsing». Parsing і rewriting — це мікросекунди. Planning зазвичай менше за мілісекунду, хоч може рости для запитів із багатьма tables у join. Справжня ціна — в останніх двох стадіях: **executor** палить CPU на великих sorts, hashes і викликах функцій, а передусім шар **storage** робить **I/O** — читає pages, яких немає в кеші. Відсутній index, що змушує повний scan table, чи патерн N+1, що стріляє сотнями мережевих round-trips, затьмарює все інше.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'A rough cost ladder. Optimize from the bottom up — I/O and round-trips first, parsing essentially never.',
            uk: 'Груба драбина cost. Оптимізуйте знизу вгору — спершу I/O і round-trips, parsing — практично ніколи.',
          },
          head: [
            { en: 'Phase', uk: 'Фаза' },
            { en: 'Typical cost', uk: 'Типова ціна' },
            { en: 'When it dominates', uk: 'Коли домінує' },
          ],
          rows: [
            [
              { en: 'Parse', uk: 'Parse' },
              { en: 'Microseconds', uk: 'Мікросекунди' },
              { en: 'Almost never a real concern', uk: 'Майже ніколи не проблема' },
            ],
            [
              { en: 'Plan', uk: 'Plan' },
              { en: 'Sub-ms to a few ms', uk: 'Менше мс — кілька мс' },
              { en: 'Many-table joins; fix via prepared statements', uk: 'Joins багатьох tables; лікують prepared statements' },
            ],
            [
              { en: 'Execute (CPU)', uk: 'Execute (CPU)' },
              { en: 'Varies widely', uk: 'Дуже різна' },
              { en: 'Big sorts/hashes, expensive functions', uk: 'Великі sorts/hashes, дорогі функції' },
            ],
            [
              { en: 'Storage I/O', uk: 'Storage I/O' },
              { en: 'The usual bottleneck', uk: 'Звичне вузьке місце' },
              { en: 'Cold cache, missing index, full scans', uk: 'Холодний кеш, відсутній index, повні scans' },
            ],
            [
              { en: 'Network', uk: 'Network' },
              { en: 'Round-trip latency × N', uk: 'Latency round-trip × N' },
              { en: 'N+1 queries, chatty apps, huge result sets', uk: 'N+1 запити, балакучі застосунки, величезні результати' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Plan once, run many: prepared statements', uk: 'План раз, виконуй багато: prepared statements' },
          md: {
            en: "If planning cost matters because you run the same shape of query thousands of times, a **prepared statement** lets the engine reuse a plan instead of re-planning every call. It also defends against SQL injection by separating code from data (M33). It is the standard answer to \"planning is showing up in my profile\" — but verify first; for most queries, planning is not where your time goes.",
            uk: "Якщо ціна planning важить, бо ви виконуєте ту саму форму запиту тисячі разів, **prepared statement** дає движку перевикористати plan замість переплановувати щоразу. Він також захищає від SQL injection, відділяючи код від даних (M33). Це стандартна відповідь на «planning світиться в моєму профілі» — але спершу перевірте; для більшості запитів час іде не туди.",
          },
        },
      ],
    },
    {
      id: 'why-this-matters',
      title: { en: 'Why this matters', uk: 'Чому це важливо' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "This module is short because it is a **map**, not a destination. Almost every remaining topic in this guide is a deep dive into one stage of this pipeline. Get the lifecycle firmly in your head and the rest of the curriculum stops being a pile of unrelated features and becomes a tour of one machine. When you study indexes, you are studying how the planner and storage stages cooperate. When you study isolation and MVCC, you are studying what the executor sees while other transactions run. When you study replication and the WAL, you are studying what storage does after the result is sent.",
            uk: "Цей модуль короткий, бо це **карта**, а не пункт призначення. Майже кожна решта тема посібника — це поглиблення в одну стадію цього pipeline. Закріпіть життєвий цикл у голові — і решта програми перестає бути купою неповʼязаних фіч і стає екскурсією однією машиною. Коли вивчаєте indexes, ви вивчаєте, як співпрацюють стадії planner і storage. Коли вивчаєте isolation і MVCC — що бачить executor, поки виконуються інші транзакції. Коли вивчаєте replication і WAL — що робить storage після того, як result надіслано.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The pipeline is the table of contents. Each stage opens into its own modules.',
            uk: 'Pipeline — це зміст. Кожна стадія розкривається у власні модулі.',
          },
          head: [
            { en: 'Pipeline stage', uk: 'Стадія pipeline' },
            { en: 'Goes deep in', uk: 'Поглиблюється в' },
          ],
          rows: [
            [
              { en: 'SQL / Parser', uk: 'SQL / Parser' },
              { en: 'M4 relational model · M10 SQL in depth', uk: 'M4 реляційна модель · M10 SQL поглиблено' },
            ],
            [
              { en: 'Rewriter', uk: 'Rewriter' },
              { en: 'M11 views & rules · M33 row-level security', uk: 'M11 views і rules · M33 row-level security' },
            ],
            [
              { en: 'Planner / Optimizer', uk: 'Planner / Optimizer' },
              { en: 'M16 query planning · M13–M14 indexes', uk: 'M16 планування запитів · M13–M14 indexes' },
            ],
            [
              { en: 'Executor', uk: 'Executor' },
              { en: 'M10 join algorithms · M18–M19 isolation & MVCC', uk: 'M10 алгоритми join · M18–M19 isolation і MVCC' },
            ],
            [
              { en: 'Storage', uk: 'Storage' },
              { en: 'M12 pages & heap · M15 LSM · M17 ACID & the WAL', uk: 'M12 pages і heap · M15 LSM · M17 ACID і WAL' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'SQL is a request, not a recipe', uk: 'SQL — це запит, а не рецепт' },
          md: {
            en: "Hold this one picture: you hand the database a *request* (the logical what), and a pipeline turns it into a *recipe* (the physical how) and cooks it. Every performance question reduces to \"which stage, and why did it choose that?\" — and you answer it with EXPLAIN. That single reframing is what separates someone who writes SQL from someone who understands databases.",
            uk: "Тримайте цю одну картину: ви даєте базі *запит* (логічне «що»), а pipeline перетворює його на *рецепт* (фізичне «як») і готує. Будь-яке питання продуктивності зводиться до «яка стадія і чому вона так обрала?» — і ви відповідаєте через EXPLAIN. Саме це переосмислення відділяє того, хто пише SQL, від того, хто розуміє бази даних.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A query flows through a pipeline: parser → rewriter → planner/optimizer → executor → storage → result. This is the map for the whole guide.',
      uk: 'Запит тече крізь pipeline: parser → rewriter → planner/optimizer → executor → storage → result. Це карта всього посібника.',
    },
    {
      en: 'Your SQL is a logical request (what); the planner turns it into one of many equivalent physical plans (how), chosen by estimated cost.',
      uk: 'Ваш SQL — логічний запит (що); planner перетворює його на один із багатьох еквівалентних фізичних plans (як), обраний за оцінкою cost.',
    },
    {
      en: 'All physical plans for a query return the same rows — an index changes the cost, never the answer.',
      uk: 'Усі фізичні plans запиту повертають ті самі rows — index змінює cost, а не відповідь.',
    },
    {
      en: 'Time goes to execution and storage I/O, not parsing; optimize I/O and round-trips first, read it all with EXPLAIN ANALYZE.',
      uk: 'Час іде на execution і storage I/O, а не parsing; спершу оптимізуйте I/O і round-trips, читайте все через EXPLAIN ANALYZE.',
    },
    {
      en: 'Every later module is a deep dive into one stage — indexes (planner+storage), MVCC (executor), the WAL (storage).',
      uk: 'Кожен наступний модуль — поглиблення в одну стадію — indexes (planner+storage), MVCC (executor), WAL (storage).',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Believing the database runs SQL "top to bottom"', uk: 'Вірити, що база виконує SQL «згори вниз»' },
      body: {
        en: 'SQL is declarative: the planner is free to reorder operations into any equivalent plan. Reasoning as if clauses execute in written order leads to wrong performance intuitions; read the actual plan with EXPLAIN instead.',
        uk: 'SQL декларативний: planner вільний переставляти операції в будь-який еквівалентний plan. Міркування, ніби клаузи виконуються в письмовому порядку, дають хибну інтуїцію про продуктивність; читайте реальний plan через EXPLAIN.',
      },
    },
    {
      title: { en: 'Optimizing the query text instead of the plan', uk: 'Оптимізувати текст запиту замість plan' },
      body: {
        en: 'Rewriting SQL cosmetically rarely helps if the plan is unchanged. The lever is the physical plan: add the right index, fix statistics, or restructure so the planner picks a cheaper path — confirmed with EXPLAIN ANALYZE, not guessed.',
        uk: 'Косметичне переписування SQL рідко допомагає, якщо plan не змінився. Важіль — фізичний plan: додайте правильний index, полагодьте statistics або перебудуйте так, щоб planner обрав дешевший path — підтверджено EXPLAIN ANALYZE, а не вгадано.',
      },
    },
    {
      title: { en: 'Blaming the planner before checking estimates', uk: 'Звинувачувати planner до перевірки оцінок' },
      body: {
        en: 'A "bad plan" is usually a bad estimate: stale or missing statistics make the planner mis-guess row counts and pick the wrong path. Run ANALYZE, compare estimated vs actual rows in EXPLAIN ANALYZE, and fix the estimate first (M16).',
        uk: '«Поганий plan» — зазвичай погана оцінка: застарілі чи відсутні statistics змушують planner хибно вгадувати кількість rows і брати не той path. Запустіть ANALYZE, порівняйте оцінкові й фактичні rows в EXPLAIN ANALYZE і спершу полагодьте оцінку (M16).',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'Walk me through what happens between sending a SELECT and getting rows back.',
        uk: 'Проведіть мене через те, що відбувається між надсиланням SELECT і отриманням rows.',
      },
      a: {
        en: 'The parser checks syntax and builds a query tree; the rewriter applies rules and expands views (and row-level security); the planner/optimizer enumerates possible physical paths — sequential vs index scans, join algorithms and orders — estimates each by cost using table statistics, and keeps the cheapest as a plan tree; the executor walks that tree, pulling rows and calling the storage layer to read pages from cache or disk; the resulting rows are streamed back to the client. PostgreSQL documents this as "the path of a query".',
        uk: 'Parser перевіряє синтаксис і будує query tree; rewriter застосовує rules і розгортає views (і row-level security); planner/optimizer перелічує можливі фізичні paths — sequential проти index scans, алгоритми й порядок join — оцінює кожен за cost через statistics table і лишає найдешевший як plan tree; executor обходить це дерево, тягнучи rows і звертаючись до storage, щоб читати pages з кешу чи диска; отримані rows стрімляться клієнту. PostgreSQL документує це як «the path of a query».',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'What is the difference between a logical and a physical query plan?',
        uk: 'Яка різниця між логічним і фізичним планом запиту?',
      },
      a: {
        en: 'The logical plan is what your SQL expresses — the set of rows and columns to produce, independent of method. The physical plan is one concrete way to compute it: specific access methods (seq vs index scan), join algorithms (nested-loop/hash/merge), and sort strategies. There is one logical request but many equivalent physical plans, all returning the same rows; the planner picks one by estimated cost, and you inspect it with EXPLAIN.',
        uk: 'Логічний plan — це те, що виражає ваш SQL: множина rows і columns на виході, незалежно від методу. Фізичний plan — один конкретний спосіб це обчислити: конкретні методи доступу (seq проти index scan), алгоритми join (nested-loop/hash/merge) і стратегії sort. Логічний запит один, а еквівалентних фізичних plans багато, усі повертають ті самі rows; planner обирає один за оцінкою cost, а ви оглядаєте його через EXPLAIN.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'A query suddenly got slow in production though the SQL did not change. Where do you look?',
        uk: 'Запит раптом сповільнився в проді, хоч SQL не мінявся. Куди дивитесь?',
      },
      a: {
        en: 'The plan probably changed even though the text did not. Run EXPLAIN ANALYZE and compare estimated vs actual rows: large gaps point to stale statistics (run ANALYZE) or data growth that flipped the planner from an index scan to a sequential scan. Also check whether an index was dropped or became unusable, whether the cache is cold, and whether parameter values hit a skewed distribution. The fix is at the planner/storage stages — restore good statistics or the right index — not in rewriting the SQL.',
        uk: 'Plan, імовірно, змінився, хоч текст ні. Запустіть EXPLAIN ANALYZE і порівняйте оцінкові й фактичні rows: великі розриви вказують на застарілі statistics (запустіть ANALYZE) чи ріст даних, що перекинув planner з index scan на sequential scan. Перевірте також, чи не видалили index, чи не став він непридатним, чи не холодний кеш і чи не влучили значення параметрів у перекошений розподіл. Лікування — на стадіях planner/storage (відновити хороші statistics чи правильний index), а не в переписуванні SQL.',
      },
    },
  ],
  seeAlso: ['m4-relational-model', 'm12-storage', 'm13-btree', 'm16-query-planning', 'm10-sql-in-depth'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 51.1. The Path of a Query',
      url: 'https://www.postgresql.org/docs/current/query-path.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — Chapter 51. Overview of PostgreSQL Internals',
      url: 'https://www.postgresql.org/docs/current/overview.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — Using EXPLAIN (logical vs physical plan, cost)',
      url: 'https://www.postgresql.org/docs/current/using-explain.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — Planner/Optimizer',
      url: 'https://www.postgresql.org/docs/current/planner-optimizer.html',
    },
    {
      title: 'AWS Database Blog — How PostgreSQL processes queries and how to analyze them',
      url: 'https://aws.amazon.com/blogs/database/how-postgresql-processes-queries-and-how-to-analyze-them/',
    },
  ],
};
