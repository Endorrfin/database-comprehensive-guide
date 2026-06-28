// M34 · Performance engineering [senior] — S17
// Web-verified 2026-06-26:
//   Method: measure → find the bottleneck → fix → verify. Databases are usually I/O-bound; the
//     bottleneck is rarely where you guessed → never tune by intuition.
//   Slow queries: EXPLAIN (ANALYZE) runs the query and shows actual time/rows; PG18 includes
//     BUFFERS automatically with ANALYZE (no need to add it). auto_explain (F.3) logs plans of
//     slow queries (log_min_duration; log_analyze/log_buffers off by default). pg_stat_statements
//     ranks queries by TOTAL time. The N+1 problem: lazy-loading an ORM relation fires 1 query for
//     the parents + 1 per parent = N+1; fix with eager loading (a JOIN) or a single batched IN query.
//   Connection cost: each PostgreSQL connection is a forked backend process (~5-10 MB RAM, ~1-20 ms
//     to establish: fork + shared-memory map + TLS handshake + catalog cache) vs ~0.1-0.3 ms for a
//     PK SELECT. Default max_connections=100. A pooler reuses warm connections (~0.1 ms).
//   PgBouncer (latest 1.25.2, May 2026): pool_mode session (default; all session features work) /
//     transaction (recommended for web apps; highest reuse; breaks session-scoped state unless
//     handled — prepared-statement support in transaction mode since 1.21) / statement (breaks
//     multi-statement txns). default_pool_size default 20. Alternatives: pgcat (Rust, drop-in,
//     read/write split + sharding), Supavisor (Elixir, multi-tenant, millions of connections).
//   Pool sizing: HikariCP formula connections = (core_count * 2) + effective_spindle_count; small
//     pools beat large ones (queuing theory). Size the pool, not max_connections, for concurrency.
//   Read replicas: offload reads via streaming replication; route writes + read-your-writes to the
//     primary (read from primary for a few seconds after a write, or until the replica LSN catches
//     up); fall back to primary if replication lag is high. Caching: app memory < Redis/Valkey
//     (cache-aside, M26) < materialized views (M11). Capacity: scale up (bigger box, simple, has a
//     ceiling) vs scale out (read replicas, partitioning/sharding M22, distributed SQL M30). PG 18.4.
import type { Module } from '../types';

const m34: Module = {
  id:        'm34-performance',
  num:       34,
  section:   's8-mastery',
  order:     2,
  level:     'senior',
  signature: true, // light interactive: the N+1 query demo (n-plus-one sim)
  readMins:  14,

  title:   { en: 'Performance engineering', uk: 'Інженерія продуктивності' },
  tagline: {
    en: 'Measure→bottleneck→fix→verify, slow queries, pooling, N+1, caching, capacity.',
    uk: 'Measure→bottleneck→fix→verify, повільні запити, pooling, N+1, кешування, capacity.',
  },

  mentalModel: {
    en: 'Measure first — the database is usually I/O-bound, and the bottleneck is rarely where you guessed.',
    uk: 'Спершу вимірюйте — база зазвичай I/O-bound, і вузьке місце рідко там, де ви думали.',
  },

  topics: [
    // ── Topic 1: a method ─────────────────────────────────────────────────
    {
      id:    'method',
      title: { en: 'A method: measure → bottleneck → fix → verify', uk: 'Метод: measure → bottleneck → fix → verify' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Performance work goes wrong the moment it becomes guessing. The reliable loop is **measure → find the bottleneck → fix one thing → verify** — then repeat. You measure to find *where* time actually goes; you change *one* variable; you re-measure to confirm it helped and did not move the problem elsewhere. Skipping the first and last steps is how teams spend a sprint adding indexes that change nothing.\n\nTwo facts make the measuring productive. First, a database is usually **I/O-bound**: the dominant cost is reading pages from disk (or missing the cache), not CPU, so the wins come from touching less data — an index, a tighter query, a better data type (M9), the right access path (M16). Second, the bottleneck is **rarely where intuition points**: the query you suspect is often fine, while a tiny query run a million times an hour dominates the total. That is why you rank by *total* time, not the single slowest call.\n\nThe tools map onto the loop. **`pg_stat_statements`** (M32) finds the queries that cost the most overall; **`EXPLAIN (ANALYZE)`** (M16) shows where a single query spends its time and I/O; `pg_stat_activity` shows what is slow *right now*. Establish a baseline before you change anything, so 'verify' has something to compare against.",
            uk: "Робота над продуктивністю йде не так у мить, коли стає вгадуванням. Надійний цикл — **measure → знайти bottleneck → виправити одне → verify** — потім повторити. Ви вимірюєте, щоб знайти, *куди* насправді йде час; змінюєте *одну* змінну; перевимірюєте, щоб підтвердити, що це допомогло й не перенесло проблему деінде. Пропуск першого й останнього кроків — це те, як команди витрачають спринт на indexes, що нічого не змінюють.\n\nДва факти роблять вимірювання продуктивним. По-перше, база зазвичай **I/O-bound**: домінантна вартість — читання pages з диска (чи промах кешу), а не CPU, тож виграші приходять від того, щоб торкатися менше даних — index, тісніший запит, кращий тип даних (M9), правильний access path (M16). По-друге, bottleneck **рідко там, куди вказує інтуїція**: запит, який ви підозрюєте, часто нормальний, тоді як крихітний запит, що виконується мільйон разів на годину, домінує над сумою. Саме тому ранжуйте за *сумарним* часом, а не за одним найповільнішим викликом.\n\nІнструменти лягають на цикл. **`pg_stat_statements`** (M32) знаходить запити, що коштують найбільше загалом; **`EXPLAIN (ANALYZE)`** (M16) показує, де один запит витрачає час та I/O; `pg_stat_activity` показує, що повільне *прямо зараз*. Встановіть baseline, перш ніж щось змінювати, щоб «verify» мав із чим порівняти.",
          },
        },
        {
          kind: 'figure',
          fig: 'bottleneck-loop',
          caption: {
            en: 'The optimization loop: measure to locate the bottleneck, change one thing, then verify against a baseline — never tune by intuition.',
            uk: 'Цикл оптимізації: вимірюйте, щоб локалізувати bottleneck, змініть одне, потім перевірте проти baseline — ніколи не тюнингуйте за інтуїцією.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Measure first, and rank by total time', uk: 'Спершу вимірюйте і ранжуйте за сумарним часом' },
          md: {
            en: 'The single most common performance mistake is optimizing the query that *feels* slow instead of the one that *costs* the most. Enable pg_stat_statements, sort by total execution time, and you will usually find the bottleneck is a cheap query run absurdly often — fix that and the whole system speeds up. Always capture a baseline before the change so you can prove the fix worked rather than hope it did.',
            uk: 'Найпоширеніша помилка продуктивності — оптимізувати запит, що *відчувається* повільним, замість того, що *коштує* найбільше. Увімкніть pg_stat_statements, сортуйте за сумарним часом виконання, і зазвичай виявите, що bottleneck — це дешевий запит, що виконується абсурдно часто; виправте його — і вся система пришвидшиться. Завжди фіксуйте baseline перед зміною, щоб довести, що виправлення спрацювало, а не сподіватися на це.',
          },
        },
      ],
    },

    // ── Topic 2: slow queries, EXPLAIN & the N+1 problem ──────────────────
    {
      id:    'slow-queries',
      title: { en: 'Slow queries, EXPLAIN & the N+1 problem', uk: 'Повільні запити, EXPLAIN та проблема N+1' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Once `pg_stat_statements` points at a query, **`EXPLAIN (ANALYZE)`** tells you why it is slow: it runs the statement and shows the real plan with actual time and rows per node (PostgreSQL 18 includes **BUFFERS** automatically, so you also see cache hits vs disk reads). The usual culprits are a **missing index** turning a lookup into a sequential scan, a stale statistics estimate picking the wrong plan (M16), or a query that simply asks for too much data. For continuous coverage, **`auto_explain`** logs the plans of queries slower than a threshold so you catch the slow ones in production.\n\nBut the most common application-level performance bug never shows up as one slow query — it is the **N+1 problem**. An ORM lazily loads a relationship: you fetch a list of N parents with one query, then touch each parent's children, and the ORM quietly fires one more query *per parent*. A page of 100 authors becomes **101 round-trips**, each cheap on its own but together dominated by network latency. It hides because every individual query looks instant in the logs.\n\nThe fix is **eager loading**: pull the parents and their children in a **single JOIN**, or in two queries (parents, then all children via one `WHERE child.parent_id IN (...)` batch). Both collapse N+1 into a constant number of round-trips. Try it in the simulator below — watch the query count and latency drop as you switch from lazy to eager.",
            uk: "Щойно `pg_stat_statements` вкаже на запит, **`EXPLAIN (ANALYZE)`** скаже, чому він повільний: він виконує statement і показує реальний план з фактичним часом та рядками на вузол (PostgreSQL 18 включає **BUFFERS** автоматично, тож ви також бачите cache hits проти disk reads). Звичайні винуватці — **відсутній index**, що перетворює пошук на sequential scan, застаріла оцінка статистики, що обирає неправильний план (M16), або запит, який просто просить забагато даних. Для безперервного покриття **`auto_explain`** логує плани запитів, повільніших за поріг, тож ви ловите повільні в production.\n\nАле найпоширеніший баг продуктивності рівня застосунку ніколи не показується як один повільний запит — це **проблема N+1**. ORM лінько завантажує звʼязок: ви дістаєте список з N батьків одним запитом, потім торкаєтесь дітей кожного батька, і ORM тихо запускає ще один запит *на кожного батька*. Сторінка зі 100 авторів стає **101 round-trip**, кожен дешевий сам по собі, але разом домінований мережевою latency. Він ховається, бо кожен окремий запит виглядає миттєвим у логах.\n\nВиправлення — **eager loading**: витягніть батьків і їхніх дітей одним **JOIN** або двома запитами (батьки, потім усі діти через один batch `WHERE child.parent_id IN (...)`). Обидва згортають N+1 у сталу кількість round-trips. Спробуйте в симуляторі нижче — дивіться, як кількість запитів та latency падають, коли ви перемикаєтесь із lazy на eager.",
          },
        },
        {
          kind: 'sim',
          sim: 'n-plus-one',
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// ❌ N+1: lazy loading fires 1 query for the parents + 1 per parent
const authors = await Author.findAll();                 // 1 query
for (const a of authors)
  a.books = await Book.findAll({ where: { authorId: a.id } });  // N queries
//  100 authors → 101 round-trips, each waiting on network latency

// ✅ Eager load in a single JOIN — a constant number of round-trips
const authors = await Author.findAll({ include: [Book] });      // 1 query
//  SELECT a.*, b.* FROM authors a LEFT JOIN books b ON b.author_id = a.id;
//  (or batch: SELECT * FROM books WHERE author_id IN ($1, $2, ...) → 2 queries)`,
          note: {
            en: 'N+1 rarely shows up as one slow query — each call is fast. You find it by counting queries per request, not by EXPLAIN on a single statement.',
            uk: 'N+1 рідко показується як один повільний запит — кожен виклик швидкий. Ви знаходите його, рахуючи запити на запит, а не EXPLAIN на одному statement.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Symptom → likely cause → fix', uk: 'Симптом → ймовірна причина → виправлення' },
          head: [
            { en: 'Symptom', uk: 'Симптом' },
            { en: 'Likely cause', uk: 'Ймовірна причина' },
            { en: 'Fix', uk: 'Виправлення' },
          ],
          rows: [
            [
              { en: 'One query slow, Seq Scan on a big table', uk: 'Один запит повільний, Seq Scan на великій таблиці' },
              { en: 'Missing or unusable index', uk: 'Відсутній чи непридатний index' },
              { en: 'Add the right index (M14); rewrite the predicate', uk: 'Додайте правильний index (M14); перепишіть предикат' },
            ],
            [
              { en: 'Fast queries, but hundreds per page', uk: 'Швидкі запити, але сотні на сторінку' },
              { en: 'N+1 lazy loading', uk: 'N+1 lazy loading' },
              { en: 'Eager-load with a JOIN or a batched IN', uk: 'Eager-load через JOIN чи batched IN' },
            ],
            [
              { en: 'Plan flips to a bad join/scan', uk: 'План перемикається на поганий join/scan' },
              { en: 'Stale statistics / row misestimate', uk: 'Застаріла статистика / промах оцінки рядків' },
              { en: 'ANALYZE; CREATE STATISTICS (M16)', uk: 'ANALYZE; CREATE STATISTICS (M16)' },
            ],
            [
              { en: 'Slow only under load, many idle sessions', uk: 'Повільно лише під навантаженням, багато idle-сесій' },
              { en: 'Connection storm / no pooling', uk: 'Connection storm / немає pooling' },
              { en: 'Add a connection pooler (topic 3)', uk: 'Додайте connection pooler (тема 3)' },
            ],
            [
              { en: 'Writes slow, table bloated', uk: 'Записи повільні, таблиця роздута' },
              { en: 'Dead tuples / autovacuum behind', uk: 'Dead tuples / autovacuum відстає' },
              { en: 'Tune autovacuum (M19)', uk: 'Налаштуйте autovacuum (M19)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'N+1 is invisible to single-query profiling', uk: 'N+1 невидимий для профілювання одного запиту' },
          md: {
            en: 'Because each of the N+1 queries is individually fast, EXPLAIN and even pg_stat_statements per-call timings look healthy — the damage is in the *count* and the round-trip latency. Watch queries-per-request (an APM trace or the ORM log) for the tell: the same SELECT repeated with different ids. The fix is eager loading; the trap is "fixing" it by caching the symptom instead of collapsing the queries.',
            uk: 'Оскільки кожен із N+1 запитів окремо швидкий, EXPLAIN і навіть per-call тайминги pg_stat_statements виглядають здоровими — шкода в *кількості* та round-trip latency. Слідкуйте за запитами-на-запит (APM-trace чи лог ORM) для ознаки: той самий SELECT, повторений з різними id. Виправлення — eager loading; пастка — «виправити» це кешуванням симптому замість згортання запитів.',
          },
        },
      ],
    },

    // ── Topic 3: connection pooling ───────────────────────────────────────
    {
      id:    'pooling',
      title: { en: 'Connection pooling', uk: 'Connection pooling' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "In PostgreSQL **every connection is a full backend process** — a fork with its own memory (~5–10 MB) that takes a few milliseconds to set up (process fork, shared-memory mapping, TLS handshake, catalog-cache warm-up) against ~0.1–0.3 ms for a primary-key `SELECT`. So a flood of short-lived connections spends most of its time *connecting*, and a few thousand idle ones can eat gigabytes of RAM before any work happens. The default `max_connections` of 100 is a deliberately modest ceiling, not a target.\n\nA **connection pooler** sits between the app and the database, keeping a small set of warm server connections and multiplexing many clients onto them. **PgBouncer** (the standard, latest 1.25.2) has three modes: **session** (the safe default — a server connection is held for the whole client session, so every feature works), **transaction** (released after each transaction — the highest reuse and the right default for most web apps, though session-scoped state like temp tables or `SET` needs care; prepared statements work in transaction mode since 1.21), and **statement** (released per statement — breaks multi-statement transactions). `pgcat` (Rust, drop-in, adds read/write splitting and sharding) and `Supavisor` (Elixir, multi-tenant, scales to millions of connections) are modern alternatives.\n\nCounter-intuitively, **smaller pools are usually faster**. HikariCP's queuing-theory result — `connections = (core_count × 2) + effective_spindle_count` — lands around a dozen per node, because a right-sized pool keeps every connection busy instead of thrashing the CPU between hundreds. Size the *pool* for concurrency; let `max_connections` stay modest behind it.",
            uk: "У PostgreSQL **кожне підключення — це повноцінний backend-процес** — fork із власною памʼяттю (~5–10 MB), який встановлюється за кілька мілісекунд (fork процесу, мапування shared-memory, TLS handshake, прогрів catalog-cache) проти ~0.1–0.3 мс для `SELECT` за primary key. Тож потік короткоживучих підключень витрачає більшість часу на *підключення*, а кілька тисяч idle можуть зʼїсти гігабайти RAM, перш ніж почнеться робота. Дефолтний `max_connections` 100 — це навмисно скромна стеля, а не ціль.\n\n**Connection pooler** сидить між застосунком і базою, тримаючи невеликий набір теплих серверних підключень і мультиплексуючи на них багатьох клієнтів. **PgBouncer** (стандарт, останній 1.25.2) має три режими: **session** (безпечний дефолт — серверне підключення тримається на всю клієнтську сесію, тож працює кожна функція), **transaction** (звільняється після кожної транзакції — найвище повторне використання і правильний дефолт для більшості вебзастосунків, хоча session-scoped стан на кшталт temp tables чи `SET` потребує уваги; prepared statements працюють у transaction mode з 1.21) та **statement** (звільняється на кожен statement — ламає багатоstatement-транзакції). `pgcat` (Rust, drop-in, додає read/write splitting та sharding) і `Supavisor` (Elixir, multi-tenant, масштабується до мільйонів підключень) — сучасні альтернативи.\n\nКонтрінтуїтивно, **менші пули зазвичай швидші**. Результат queuing-theory від HikariCP — `connections = (core_count × 2) + effective_spindle_count` — дає близько дюжини на вузол, бо правильно розмірений пул тримає кожне підключення зайнятим замість того, щоб ганяти CPU між сотнями. Розмірте *пул* під конкурентність; нехай `max_connections` лишається скромним за ним.",
          },
        },
        {
          kind: 'figure',
          fig: 'connection-pool',
          caption: {
            en: 'A pooler multiplexes thousands of short-lived client connections onto a small set of warm backend processes — turning a connection storm into a steady, sized workload.',
            uk: 'Pooler мультиплексує тисячі короткоживучих клієнтських підключень на невеликий набір теплих backend-процесів — перетворюючи connection storm на стабільне, розмірене навантаження.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'PgBouncer pool modes', uk: 'Режими пулу PgBouncer' },
          head: [
            { en: 'Mode', uk: 'Режим' },
            { en: 'Server released', uk: 'Сервер звільняється' },
            { en: 'Trade-off', uk: 'Компроміс' },
          ],
          rows: [
            [
              { en: 'session (default)', uk: 'session (дефолт)' },
              { en: 'When the client disconnects', uk: 'Коли клієнт відключається' },
              { en: 'Everything works; least reuse', uk: 'Усе працює; найменше повторне використання' },
            ],
            [
              { en: 'transaction', uk: 'transaction' },
              { en: 'After each transaction', uk: 'Після кожної транзакції' },
              { en: 'Best reuse; mind session state', uk: 'Найкраще повторне використання; зважайте на session state' },
            ],
            [
              { en: 'statement', uk: 'statement' },
              { en: 'After each statement', uk: 'Після кожного statement' },
              { en: 'Max reuse; no multi-statement txns', uk: 'Макс. повторне використання; без багатоstatement-txns' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'ini',
          code: `; pgbouncer.ini — multiplex thousands of clients onto a small warm pool
[databases]
app = host=10.0.0.5 dbname=app

[pgbouncer]
pool_mode = transaction      ; release the server connection after each txn
max_client_conn = 5000       ; clients PgBouncer will accept
default_pool_size = 20        ; real PostgreSQL connections per (user, db)
; 5000 clients share 20 backends — Postgres never sees the storm`,
          note: {
            en: 'The app points at PgBouncer instead of Postgres. 5000 clients are served by 20 backend processes, kept warm and busy.',
            uk: 'Застосунок дивиться на PgBouncer замість Postgres. 5000 клієнтів обслуговують 20 backend-процесів, що тримаються теплими й зайнятими.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Size the pool small, on purpose', uk: 'Розмірте пул малим — навмисно' },
          md: {
            en: 'A bigger pool feels safer and is usually slower: past a point, more connections just make the CPU context-switch and contend on locks. Start near (cores × 2) + spindles per node, load-test, and raise only if you see queuing with the database under-utilized. The pooler, not max_connections, is your concurrency knob — and transaction mode is the default that lets a handful of backends serve thousands of clients.',
            uk: 'Більший пул відчувається безпечнішим і зазвичай повільніший: за певною межею більше підключень лише змушують CPU перемикати контекст і конкурувати за locks. Почніть біля (cores × 2) + spindles на вузол, навантажте тестом і піднімайте, лише якщо бачите чергу при недовантаженій базі. Pooler, а не max_connections, — це ваш регулятор конкурентності — а transaction mode є дефолтом, що дозволяє жменьці backends обслуговувати тисячі клієнтів.',
          },
        },
      ],
    },

    // ── Topic 4: caching layers & read replicas ───────────────────────────
    {
      id:    'caching-replicas',
      title: { en: 'Caching layers & read replicas', uk: 'Шари кешування та read replicas' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "When the database is the bottleneck and the query is already tuned, the next move is to **stop asking it the same thing**. Caching layers form a hierarchy by speed and staleness: in-process application memory (fastest, but per-instance and small), a shared **Redis/Valkey** cache (the cache-aside pattern from M26 — check the cache, fall back to the database, populate on a miss, expire with a TTL), and **materialized views** (M11) for expensive aggregations refreshed on a schedule. The hard part is never the read; it is **invalidation** — deciding when cached data is stale enough to drop.\n\nThe complementary move is to **offload reads to replicas**. Streaming replication (M21) gives you standby copies that can serve `SELECT`s, so the primary is freed for writes — horizontal read scaling. The catch is **replication lag**: a replica is milliseconds-to-seconds behind, so a user who just wrote and immediately reads from a replica may not see their own change. The standard fixes are **read-your-writes routing** (send a user's reads to the primary for a few seconds after they write, or until the replica's LSN catches up) and falling back to the primary when lag spikes.\n\nThe ordering matters: cache and replicas are powerful but they add moving parts and consistency caveats. Reach for them *after* indexing, query rewriting, and pooling — not as a way to avoid fixing a missing index.",
            uk: "Коли база — це bottleneck, а запит уже налаштований, наступний крок — **перестати питати її те саме**. Шари кешування утворюють ієрархію за швидкістю та staleness: in-process памʼять застосунку (найшвидша, але per-instance і мала), спільний кеш **Redis/Valkey** (патерн cache-aside з M26 — перевір кеш, відкотись до бази, заповни при промаху, простроч за TTL) та **materialized views** (M11) для дорогих агрегацій, оновлюваних за розкладом. Найскладніше — ніколи не читання; це **invalidation** — рішення, коли кешовані дані достатньо застарілі, щоб їх скинути.\n\nДоповнювальний крок — **офлоадити читання на replicas**. Streaming replication (M21) дає standby-копії, що можуть обслуговувати `SELECT`-и, тож primary звільняється для записів — горизонтальне масштабування читань. Підступ — **replication lag**: replica відстає на мілісекунди-до-секунд, тож користувач, який щойно записав і одразу читає з replica, може не побачити власної зміни. Стандартні виправлення — **read-your-writes routing** (надсилайте читання користувача на primary кілька секунд після запису або доки LSN replica не наздожене) та відкат на primary, коли lag стрибає.\n\nПорядок має значення: кеш і replicas потужні, але додають рухомих частин та застережень щодо консистентності. Беріть їх *після* indexing, переписування запитів і pooling — а не як спосіб уникнути виправлення відсутнього index.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Where to offload a read — fastest to most consistent', uk: 'Куди офлоадити читання — від найшвидшого до найконсистентнішого' },
          head: [
            { en: 'Layer', uk: 'Шар' },
            { en: 'Good for', uk: 'Добре для' },
            { en: 'Watch out for', uk: 'На що зважати' },
          ],
          rows: [
            [
              { en: 'In-process memory', uk: 'In-process памʼять' },
              { en: 'Tiny, hot, per-instance lookups', uk: 'Малі, гарячі, per-instance пошуки' },
              { en: 'Not shared; lost on restart', uk: 'Не спільна; губиться при рестарті' },
            ],
            [
              { en: 'Redis / Valkey (cache-aside)', uk: 'Redis / Valkey (cache-aside)' },
              { en: 'Shared hot data across instances', uk: 'Спільні гарячі дані між instances' },
              { en: 'Invalidation; stampede on expiry', uk: 'Invalidation; stampede при простроченні' },
            ],
            [
              { en: 'Materialized view', uk: 'Materialized view' },
              { en: 'Expensive aggregations / reports', uk: 'Дорогі агрегації / звіти' },
              { en: 'Stale until REFRESH (M11)', uk: 'Застаріла до REFRESH (M11)' },
            ],
            [
              { en: 'Read replica', uk: 'Read replica' },
              { en: 'Scaling raw read throughput', uk: 'Масштабування сирого read-throughput' },
              { en: 'Replication lag; read-your-writes', uk: 'Replication lag; read-your-writes' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Caches and replicas trade freshness for speed', uk: 'Кеші та replicas міняють свіжість на швидкість' },
          md: {
            en: 'Both layers serve data that may be slightly out of date, so design for it: pick a TTL and an invalidation strategy for caches, and a read-your-writes rule for replicas (route a user to the primary right after they write). If correctness needs the latest value — balances, inventory, auth — read from the primary. Most reads tolerate seconds of staleness; the bugs come from assuming they all do.',
            uk: 'Обидва шари віддають дані, що можуть бути трохи застарілими, тож проєктуйте з огляду на це: оберіть TTL та стратегію invalidation для кешів і правило read-your-writes для replicas (маршрутизуйте користувача на primary одразу після запису). Якщо коректність потребує найновішого значення — баланси, inventory, auth — читайте з primary. Більшість читань терплять секунди staleness; баги приходять із припущення, що всі терплять.',
          },
        },
      ],
    },

    // ── Topic 5: capacity & scaling ───────────────────────────────────────
    {
      id:    'capacity',
      title: { en: 'Capacity: scale up, out, or change the model', uk: 'Capacity: scale up, out чи зміна моделі' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "When tuning runs out, you add capacity — and there is a cheap-to-expensive order. **Scale up (vertical):** a bigger box — more RAM (so the working set fits in cache), faster NVMe, more cores. It is the simplest lever and requires no application change, which is why it is almost always the right *first* hardware move; the limits are a real ceiling (the biggest instance is finite) and cost that climbs faster than capacity. **Scale out (horizontal):** spread load across machines — read replicas for read-heavy workloads (topic 4), partitioning for one large table (M22), then sharding or distributed SQL (M30) for write throughput beyond a single primary.\n\nThe trap is jumping to scale-out too early. Sharding multiplies operational complexity — cross-shard queries, rebalancing, distributed transactions — and a well-indexed single Postgres on a large modern instance handles far more than teams expect. The honest sequence is: fix the queries and indexes, add pooling, scale up, offload reads to replicas and caches, and only then partition or shard.\n\nSometimes the right answer is **changing the model**, not adding hardware: move analytics off the OLTP database to a columnar store (M31), pull a hot key-value workload into Redis (M26), or accept a different consistency model for a piece that does not need full ACID. Capacity planning is choosing the cheapest change that buys enough headroom for the next stage of growth.",
            uk: "Коли тюнінг вичерпується, ви додаєте capacity — і є порядок від дешевого до дорогого. **Scale up (вертикально):** більша машина — більше RAM (щоб робочий набір вмістився в кеш), швидший NVMe, більше cores. Це найпростіший важіль, що не потребує зміни застосунку, тому це майже завжди правильний *перший* апаратний крок; межі — це реальна стеля (найбільший instance скінченний) і вартість, що зростає швидше за capacity. **Scale out (горизонтально):** розподіліть навантаження між машинами — read replicas для read-важких workloads (тема 4), partitioning для однієї великої таблиці (M22), потім sharding чи distributed SQL (M30) для write-throughput понад один primary.\n\nПастка — стрибнути до scale-out зарано. Sharding множить операційну складність — cross-shard запити, rebalancing, розподілені транзакції — а добре проіндексований одиночний Postgres на великому сучасному instance тримає набагато більше, ніж команди очікують. Чесна послідовність: виправте запити та indexes, додайте pooling, scale up, офлоадьте читання на replicas і кеші, і лише потім partition чи shard.\n\nІноді правильна відповідь — **зміна моделі**, а не додавання заліза: винесіть аналітику з OLTP-бази в columnar store (M31), витягніть гарячий key-value workload у Redis (M26) чи прийміть іншу модель консистентності для частини, що не потребує повного ACID. Планування capacity — це вибір найдешевшої зміни, що купує достатньо запасу для наступної стадії зростання.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Scale up (vertical)', uk: 'Scale up (вертикально)' },
          b: { en: 'Scale out (horizontal)', uk: 'Scale out (горизонтально)' },
          rows: [
            [
              { en: 'How', uk: 'Як' },
              { en: 'Bigger machine: RAM, CPU, faster disk', uk: 'Більша машина: RAM, CPU, швидший диск' },
              { en: 'More machines: replicas, partitions, shards', uk: 'Більше машин: replicas, partitions, shards' },
            ],
            [
              { en: 'App changes', uk: 'Зміни застосунку' },
              { en: 'None — transparent', uk: 'Жодних — прозоро' },
              { en: 'Routing, shard keys, lag handling', uk: 'Routing, shard keys, обробка lag' },
            ],
            [
              { en: 'Limit', uk: 'Межа' },
              { en: 'A hard ceiling; cost climbs steeply', uk: 'Жорстка стеля; вартість круто росте' },
              { en: 'Near-linear, but complex to operate', uk: 'Майже лінійно, але складно експлуатувати' },
            ],
            [
              { en: 'Best first for', uk: 'Найкраще спершу для' },
              { en: 'Almost everything — do this first', uk: 'Майже все — робіть це першим' },
              { en: 'Reads (replicas) before writes (shards)', uk: 'Читання (replicas) перед записами (shards)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Cheapest fixes first; shard last', uk: 'Найдешевші виправлення першими; sharding останнім' },
          md: {
            en: 'The order that saves the most money and pain: index and rewrite the slow queries, add a connection pooler, scale up the instance, offload reads to caches and replicas — and only then partition or shard. Sharding is the most powerful and the most expensive option operationally; teams that reach for it before exhausting the cheaper levers usually inherit cross-shard complexity they did not need. A single well-tuned Postgres goes remarkably far on modern hardware.',
            uk: 'Порядок, що економить найбільше грошей і болю: проіндексуйте й перепишіть повільні запити, додайте connection pooler, scale up instance, офлоадьте читання на кеші та replicas — і лише потім partition чи shard. Sharding — найпотужніший і найдорожчий операційно варіант; команди, що тягнуться до нього, не вичерпавши дешевших важелів, зазвичай успадковують cross-shard складність, яка їм не була потрібна. Один добре налаштований Postgres заходить напрочуд далеко на сучасному залізі.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Optimize by a loop, not intuition: measure → find the bottleneck → fix one thing → verify against a baseline. Databases are usually I/O-bound, and the costliest query is often a cheap one run very often — rank by total time (pg_stat_statements), not the single slowest call.',
      uk: 'Оптимізуйте циклом, а не інтуїцією: measure → знайти bottleneck → виправити одне → перевірити проти baseline. Бази зазвичай I/O-bound, а найдорожчий запит часто дешевий, але виконується дуже часто — ранжуйте за сумарним часом (pg_stat_statements), а не за одним найповільнішим викликом.',
    },
    {
      en: 'EXPLAIN (ANALYZE) (BUFFERS automatic in PG18) explains a single slow query; the N+1 problem is invisible to it because each query is fast — find N+1 by counting queries per request and fix it with eager loading (a JOIN or a batched IN).',
      uk: 'EXPLAIN (ANALYZE) (BUFFERS автоматично в PG18) пояснює один повільний запит; проблема N+1 для нього невидима, бо кожен запит швидкий — знаходьте N+1, рахуючи запити на запит, і виправляйте eager loading (JOIN чи batched IN).',
    },
    {
      en: 'Each PostgreSQL connection is a backend process (~5–10 MB, slow to create), so use a pooler (PgBouncer transaction mode) to multiplex thousands of clients onto a small warm pool. Smaller pools are usually faster — size near (cores × 2) + spindles, not max_connections.',
      uk: 'Кожне підключення PostgreSQL — backend-процес (~5–10 MB, повільне у створенні), тож використовуйте pooler (PgBouncer transaction mode), щоб мультиплексувати тисячі клієнтів на малий теплий пул. Менші пули зазвичай швидші — розмірте біля (cores × 2) + spindles, а не max_connections.',
    },
    {
      en: 'Offload reads to caching layers (in-process < Redis/Valkey cache-aside < materialized views) and read replicas, but both trade freshness for speed: design invalidation (TTL) for caches and read-your-writes routing for replicas; read from the primary when correctness needs the latest value.',
      uk: 'Офлоадьте читання на шари кешування (in-process < Redis/Valkey cache-aside < materialized views) та read replicas, але обидва міняють свіжість на швидкість: проєктуйте invalidation (TTL) для кешів і read-your-writes routing для replicas; читайте з primary, коли коректність потребує найновішого значення.',
    },
    {
      en: 'Add capacity cheapest-first: tune queries/indexes, add pooling, scale up (simple, no app change, but a ceiling), offload reads, and only then scale out (partition/shard, M22/M30). A single well-tuned Postgres handles far more than teams expect — shard last.',
      uk: 'Додавайте capacity від найдешевшого: налаштуйте запити/indexes, додайте pooling, scale up (просто, без зміни застосунку, але є стеля), офлоадьте читання і лише потім scale out (partition/shard, M22/M30). Один добре налаштований Postgres тримає набагато більше, ніж команди очікують — sharding останнім.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Tuning by intuition instead of measurement', uk: 'Тюнінг за інтуїцією замість вимірювання' },
      body: {
        en: 'Adding indexes and rewriting queries by gut feeling wastes effort and sometimes makes things worse (every index slows writes). Without pg_stat_statements and EXPLAIN (ANALYZE) you optimize the query that feels slow, not the one that costs the most — and without a baseline you cannot tell whether a change helped. Measure, change one thing, re-measure. The bottleneck is rarely where you guessed.',
        uk: 'Додавання indexes і переписування запитів за відчуттям марнує зусилля й іноді робить гірше (кожен index сповільнює записи). Без pg_stat_statements та EXPLAIN (ANALYZE) ви оптимізуєте запит, що відчувається повільним, а не той, що коштує найбільше — а без baseline не скажете, чи зміна допомогла. Вимірюйте, змініть одне, перевиміряйте. Bottleneck рідко там, де ви вгадали.',
      },
    },
    {
      title: { en: 'Shipping an N+1 query pattern', uk: 'Випуск патерну запитів N+1' },
      body: {
        en: 'Lazy-loading a relationship in a loop turns one logical request into N+1 database round-trips. Each query is fast, so it passes review and looks fine in per-query metrics — then falls over at scale because latency multiplies. Catch it by watching queries-per-request in an APM trace or the ORM log, and fix it with eager loading (a JOIN) or a single batched IN query, not by caching the symptom.',
        uk: 'Lazy-loading звʼязку в циклі перетворює один логічний запит на N+1 round-trips до бази. Кожен запит швидкий, тож він проходить review і виглядає нормально в per-query метриках — а потім падає на масштабі, бо latency множиться. Ловіть це, спостерігаючи за запитами-на-запит в APM-trace чи лозі ORM, і виправляйте eager loading (JOIN) чи одним batched IN-запитом, а не кешуванням симптому.',
      },
    },
    {
      title: { en: 'Running without a pooler — or making the pool huge', uk: 'Робота без pooler — чи величезний пул' },
      body: {
        en: 'Opening a fresh PostgreSQL connection per request pays the process-fork cost every time and can exhaust max_connections under load; thousands of idle connections waste gigabytes of RAM. But the opposite over-correction — a giant pool — is also slow, because past (cores × 2) + spindles the CPU just thrashes between connections. Put PgBouncer (transaction mode) in front and size the pool small and deliberately.',
        uk: 'Відкриття свіжого підключення PostgreSQL на кожен запит щоразу платить вартість fork процесу і може вичерпати max_connections під навантаженням; тисячі idle-підключень марнують гігабайти RAM. Але протилежна надкорекція — гігантський пул — теж повільна, бо за межею (cores × 2) + spindles CPU лише ганяється між підключеннями. Поставте PgBouncer (transaction mode) попереду і розмірте пул малим і свідомо.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'A page got slow as data grew, but every individual query is fast in the logs. What is your diagnosis?', uk: 'Сторінка стала повільною зі зростанням даних, але кожен окремий запит швидкий у логах. Який ваш діагноз?' },
      a: {
        en: 'That pattern is the signature of the N+1 problem: the page issues one query for a list of N items and then one more query per item to load a relationship, so the total is N+1 round-trips. Each query is individually fast, which is exactly why it hides in per-query metrics and EXPLAIN — the cost is in the count and the accumulated network latency, and it grows with the data. I would confirm it by counting queries per request in an APM trace or the ORM query log, looking for the same SELECT repeated with different ids. The fix is eager loading: fetch the parents and children in a single JOIN, or in two queries with a batched WHERE id IN (...). I would not paper over it with a cache — that hides a structural problem and adds invalidation risk. Once collapsed, the page does a constant number of queries regardless of N.',
        uk: 'Цей патерн — підпис проблеми N+1: сторінка робить один запит за списком з N елементів, а потім ще один запит на кожен елемент, щоб завантажити звʼязок, тож усього N+1 round-trips. Кожен запит окремо швидкий, і саме тому він ховається в per-query метриках та EXPLAIN — вартість у кількості та накопиченій мережевій latency, і вона росте з даними. Я б підтвердив це, рахуючи запити на запит в APM-trace чи лозі запитів ORM, шукаючи той самий SELECT, повторений із різними id. Виправлення — eager loading: дістати батьків і дітей одним JOIN або двома запитами з batched WHERE id IN (...). Я б не замазував це кешем — це ховає структурну проблему й додає ризик invalidation. Після згортання сторінка робить сталу кількість запитів незалежно від N.',
      },
    },
    {
      level: 'senior',
      q: { en: 'Why does PostgreSQL need a connection pooler, and which pool mode would you choose?', uk: 'Чому PostgreSQL потребує connection pooler і який режим пулу ви б обрали?' },
      a: {
        en: 'Because every PostgreSQL connection is a full backend process, not a lightweight thread: it costs a few milliseconds and several megabytes of RAM to create, against a fraction of a millisecond for a primary-key SELECT. A web app that opens a connection per request pays that fork cost constantly, and a few thousand concurrent or idle connections can exhaust max_connections and gigabytes of memory before doing real work. A pooler (PgBouncer is the standard) keeps a small set of warm server connections and multiplexes many clients onto them. For most web workloads I would choose transaction mode: the server connection is returned to the pool after each transaction, giving the highest reuse so a handful of backends serve thousands of clients. The caveat is that session-scoped state — temp tables, SET, session advisory locks — does not survive across transactions, so the app must not rely on it (prepared statements have worked in transaction mode since PgBouncer 1.21). Session mode is the safe fallback when you genuinely need session features. And I would size the pool small — around (cores × 2) + spindles — because smaller pools are usually faster.',
        uk: 'Бо кожне підключення PostgreSQL — це повноцінний backend-процес, а не легкий thread: його створення коштує кілька мілісекунд і кілька мегабайтів RAM проти частки мілісекунди для SELECT за primary key. Вебзастосунок, що відкриває підключення на кожен запит, постійно платить цю вартість fork, а кілька тисяч одночасних чи idle-підключень можуть вичерпати max_connections і гігабайти памʼяті, перш ніж зробити реальну роботу. Pooler (PgBouncer — стандарт) тримає невеликий набір теплих серверних підключень і мультиплексує на них багатьох клієнтів. Для більшості вебнавантажень я б обрав transaction mode: серверне підключення повертається в пул після кожної транзакції, даючи найвище повторне використання, тож жменька backends обслуговує тисячі клієнтів. Застереження: session-scoped стан — temp tables, SET, session advisory locks — не переживає між транзакціями, тож застосунок не має на нього покладатися (prepared statements працюють у transaction mode з PgBouncer 1.21). Session mode — безпечний відкат, коли вам справді потрібні session-функції. І я б розмірив пул малим — біля (cores × 2) + spindles — бо менші пули зазвичай швидші.',
      },
    },
    {
      level: 'staff',
      q: { en: 'A single Postgres can no longer keep up. How do you decide what to do, in what order?', uk: 'Один Postgres більше не встигає. Як ви вирішуєте, що робити і в якому порядку?' },
      a: {
        en: 'I work cheapest-and-least-risky first, measuring at each step so I add only what is needed. First, make sure it really is the database and not the app: profile with pg_stat_statements and EXPLAIN (ANALYZE), and fix the obvious wins — missing indexes, N+1 patterns, queries asking for too much, stale statistics. Second, add a connection pooler if there is not one, since connection overhead masquerades as database slowness under load. Third, scale up: a bigger instance with enough RAM to hold the working set is transparent to the app and buys a lot of headroom; this is almost always the right first hardware move. Fourth, offload reads — caching (Redis/Valkey cache-aside, materialized views) and read replicas via streaming replication, handling read-your-writes by routing recent writers to the primary. Only after those do I scale out writes: partition a single huge table (M22), then shard or move to distributed SQL (M30), accepting the cross-shard and rebalancing complexity that comes with it. Sometimes the real answer is changing the model — move analytics to a columnar store (M31) rather than scaling the OLTP system to do a job it is not built for. The discipline is to exhaust the cheap, low-complexity levers before taking on the operational cost of sharding.',
        uk: 'Я працюю від найдешевшого й найменш ризикового, вимірюючи на кожному кроці, щоб додавати лише потрібне. Спершу переконаюсь, що це справді база, а не застосунок: профілюю pg_stat_statements та EXPLAIN (ANALYZE) і виправляю очевидні виграші — відсутні indexes, патерни N+1, запити, що просять забагато, застарілу статистику. По-друге, додаю connection pooler, якщо його немає, бо вартість підключень видає себе за повільність бази під навантаженням. По-третє, scale up: більший instance з достатнім RAM, щоб тримати робочий набір, прозорий для застосунку й купує багато запасу; це майже завжди правильний перший апаратний крок. По-четверте, офлоадю читання — кешування (Redis/Valkey cache-aside, materialized views) та read replicas через streaming replication, обробляючи read-your-writes маршрутизацією нещодавніх записувачів на primary. Лише після цього масштабую записи: partition однієї величезної таблиці (M22), потім shard чи перехід на distributed SQL (M30), приймаючи cross-shard та rebalancing складність, що з цим приходить. Іноді справжня відповідь — зміна моделі: винести аналітику в columnar store (M31), а не масштабувати OLTP-систему під роботу, для якої вона не створена. Дисципліна — вичерпати дешеві важелі низької складності, перш ніж брати на себе операційну вартість sharding.',
      },
    },
  ],

  seeAlso: ['m16-query-planning', 'm14-index-toolbox', 'm26-key-value', 'm21-replication'],

  sources: [
    { title: 'PostgreSQL 18 docs — EXPLAIN', url: 'https://www.postgresql.org/docs/current/sql-explain.html' },
    { title: 'PostgreSQL 18 docs — Using EXPLAIN (14.1)', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
    { title: 'PostgreSQL 18 docs — auto_explain (F.3)', url: 'https://www.postgresql.org/docs/current/auto-explain.html' },
    { title: 'PgBouncer — features & pool modes', url: 'https://www.pgbouncer.org/features.html' },
    { title: 'PgBouncer — configuration (pool sizing)', url: 'https://www.pgbouncer.org/config.html' },
    { title: 'EDB — Why you should use connection pooling when setting max_connections', url: 'https://www.enterprisedb.com/postgres-tutorials/why-you-should-use-connection-pooling-when-setting-maxconnections-postgres' },
    { title: 'HikariCP — About Pool Sizing (wiki)', url: 'https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing' },
  ],
};

export default m34;
