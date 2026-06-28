// M35 · Choosing the right database [senior] — S18 (★ signature: the Database Picker wizard)
// Web-verified 2026-06-28:
//   PostgreSQL latest stable 18.4 (2026-06-04); 19 Beta 1 (2026-06-04), 19 GA ~Sept/Oct 2026.
//   DB-Engines H1 2026: PostgreSQL the fastest-growing engine (+21.97); top-4 by score
//     (Oracle, MySQL, SQL Server, PostgreSQL) static for >12 months. Stack Overflow 2025/2026:
//     PostgreSQL the most-used database among professional developers (overtook MySQL) and the
//     #1 most-wanted — supports the "Postgres as the safe default" thesis.
//   Polyglot persistence: coined by Martin Fowler (NoSQL Distilled, Sadalage & Fowler 2012);
//     "different problems are best solved with different data storage technologies"; descends
//     from polyglot programming (Neal Ford, 2006). Modern Postgres covers JSONB, full-text,
//     vector (pgvector HNSW), and time-series (TimescaleDB ext.) — one engine goes a long way.
//   Decision dimensions (synthesis of M2/M3 + the family modules): data shape, access pattern,
//     consistency, scale & write volume, latency, and special needs (search/vector/analytics/
//     graph/cache), plus the operational reality (team size, managed vs self-host, cost/lock-in).
import type { Module } from '../types';

const m35: Module = {
  id:        'm35-choosing',
  num:       35,
  section:   's8-mastery',
  order:     3,
  level:     'senior',
  signature: true, // ★ the Database Picker questionnaire wizard (sim 'db-picker')
  readMins:  14,

  title:   { en: 'Choosing the right database', uk: 'Вибір правильної бази даних' },
  tagline: {
    en: 'The decision framework, the questions that matter, workload walkthroughs, polyglot persistence, anti-patterns.',
    uk: 'Фреймворк рішення, питання, що мають значення, розбори workload, polyglot persistence, анти-патерни.',
  },

  mentalModel: {
    en: 'Requirements first, engine second — never résumé-driven.',
    uk: 'Спершу вимоги, потім движок — ніколи не résumé-driven.',
  },

  topics: [
    // ── Topic 1: the decision framework ───────────────────────────────────
    {
      id:    'framework',
      title: { en: 'The framework: requirements first, engine second', uk: 'Фреймворк: спершу вимоги, потім движок' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Every module in this guide leads here: given a real workload, which database do you choose? The reliable answer is not a favourite engine — it is a **method**. Start from the **requirements**, not the technology: what is the shape of the data, how will it be queried, how strict must consistency be, how much will it grow, and what one thing — if any — does this workload do that a general-purpose database does badly. The technology is the *last* decision, derived from those answers, not the first.\n\nThe reason to be disciplined is that **getting it wrong is expensive and sticky**. The database is the hardest part of a system to change: data has to be migrated, queries rewritten, operational knowledge rebuilt, and the application's assumptions about consistency and transactions re-examined. A wrong call made for a good reason is recoverable; a wrong call made because an engine was fashionable is the one teams live with for years.\n\nSo the framework has a **strong default**: a relational database — **PostgreSQL** above all — until a concrete requirement forces something else. That is not conservatism for its own sake. Postgres gives you ACID, joins, ad-hoc queries, a huge ecosystem, and — crucially — it now also does JSONB documents, full-text search, vector similarity (pgvector), and time-series (the TimescaleDB extension), so a single, well-understood engine covers a remarkable range before you take on a second system. Deviate when the workload sends a clear signal; default when it does not.",
            uk: "Кожен модуль цього посібника веде сюди: маючи реальний workload, яку базу даних обрати? Надійна відповідь — не улюблений движок, а **метод**. Починайте з **вимог**, а не з технології: яка форма даних, як їх запитуватимуть, наскільки сувора має бути consistency, як вони зростатимуть і що одне — якщо взагалі — цей workload робить так, що база загального призначення робить це погано. Технологія — *останнє* рішення, виведене з цих відповідей, а не перше.\n\nПричина бути дисциплінованим у тому, що **помилитися дорого й надовго**. База — найважча частина системи для зміни: дані треба мігрувати, запити переписати, операційні знання відбудувати, а припущення застосунку про consistency й транзакції переглянути. Неправильний вибір із доброї причини відновний; неправильний вибір тому, що движок був модним, — це той, з яким команди живуть роками.\n\nТож фреймворк має **сильний default**: реляційну базу — передусім **PostgreSQL** — доки конкретна вимога не змусить узяти інше. Це не консерватизм заради консерватизму. Postgres дає ACID, joins, ad-hoc запити, величезну екосистему і — критично — тепер також робить JSONB-документи, full-text пошук, vector-подібність (pgvector) і time-series (розширення TimescaleDB), тож один, добре зрозумілий движок покриває вражаючий діапазон, перш ніж ви візьмете другу систему. Відхиляйтесь, коли workload дає чіткий сигнал; беріть default, коли ні.",
          },
        },
        {
          kind: 'figure',
          fig: 'decision-flow',
          caption: {
            en: 'The default-and-deviate flow: a relational database (PostgreSQL) is the answer unless the workload sends one clear signal — then take the specialist that signal points to.',
            uk: 'Потік «default-and-deviate»: реляційна база (PostgreSQL) — відповідь, доки workload не дасть один чіткий сигнал — тоді беріть спеціаліста, на якого цей сигнал указує.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Boring is a feature; default to Postgres', uk: '«Нудно» — це перевага; default — Postgres' },
          md: {
            en: "The most senior move is usually the least exciting one: reach for the well-understood, well-operated database your team already knows, and make it justify being replaced. PostgreSQL has been the fastest-growing engine in the DB-Engines ranking and the most-used database among professional developers, which means deep documentation, tooling, hiring, and battle-tested operations — all of which are real engineering value, not nostalgia. A specialist database is a liability until the workload proves it is an asset. Choose excitement deliberately, never by default.",
            uk: "Найбільш senior-крок зазвичай найменш захопливий: візьміть добре зрозумілу, добре експлуатовану базу, яку команда вже знає, і змусьте її доводити право бути заміненою. PostgreSQL був найшвидше зростаючим движком у рейтингу DB-Engines і найвживанішою базою серед професійних розробників — а це глибока документація, tooling, найм і перевірені бойовими умовами операції — усе це реальна інженерна цінність, а не ностальгія. Спеціалізована база — це зобовʼязання, доки workload не доведе, що вона актив. Обирайте захопливе свідомо, ніколи — за замовчуванням.",
          },
        },
      ],
    },

    // ── Topic 2: the questions that matter ────────────────────────────────
    {
      id:    'questions',
      title: { en: 'The questions that matter', uk: 'Питання, що мають значення' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A good choice falls out of a small set of questions about the workload. **Data shape:** are these rows with relationships you will join, self-contained documents you read as a whole, simple key→value pairs, a network where the relationships *are* the data, embeddings, or timestamped events? **Access pattern:** ad-hoc queries and joins, point lookups by key, big scans and aggregations, multi-hop traversals, nearest-neighbour search, or full-text relevance? **Consistency:** strict ACID for money and inventory, or is eventual consistency an acceptable price for scale? **Scale and writes:** does it fit on one (big) node — the common case — or do you genuinely need write-heavy, multi-region, horizontal scale? **Latency:** is sub-millisecond response a hard requirement, pointing at an in-memory store in front of the database?\n\nThen the question people skip: the **special need**. Most of the time there is exactly one thing the workload does that a general database does poorly — semantic/AI search, caching and queues, heavy analytics, relationship analytics, first-class full-text — and that one thing, not the bulk of the data, is what justifies a specialist (usually *alongside* the relational store, not instead of it).\n\nFinally, the dimension that decides as many real projects as any technical one: **operational reality.** How big is the team, can it run another system well, do you want managed/serverless to minimise ops, and how much does cost and vendor lock-in matter? A theoretically perfect engine your team cannot operate is the wrong engine. Use the **Database Picker** below to walk these questions interactively — it ranks the best-fit families and defaults to Postgres when no specialist clearly wins.",
            uk: "Хороший вибір випадає з невеликого набору питань про workload. **Форма даних:** це рядки зі звʼязками, які ви join-итимете, самодостатні документи, які читаєте цілком, прості пари key→value, мережа, де звʼязки *і є* даними, embeddings чи мітковані часом події? **Access pattern:** ad-hoc запити й joins, point lookups за ключем, великі scans та агрегації, multi-hop traversals, nearest-neighbour пошук чи full-text за релевантністю? **Consistency:** сувора ACID для грошей та inventory — чи eventual consistency прийнятна ціна за масштаб? **Масштаб і записи:** вміщається на одному (великому) вузлі — звичайний випадок — чи вам справді потрібен write-heavy, мультирегіональний, горизонтальний масштаб? **Latency:** субмілісекундна відповідь — жорстка вимога, що вказує на in-memory сховище перед базою?\n\nПотім питання, яке пропускають: **особлива потреба**. Найчастіше є рівно одна річ, яку workload робить так, що база загального призначення робить її погано — семантичний/AI пошук, кешування й черги, важка аналітика, аналітика звʼязків, повноцінний full-text — і саме ця одна річ, а не основна маса даних, виправдовує спеціаліста (зазвичай *поряд* із реляційним сховищем, а не замість нього).\n\nНарешті, вимір, що вирішує не менше реальних проєктів, ніж будь-який технічний: **операційна реальність.** Який розмір команди, чи зможе вона добре експлуатувати ще одну систему, чи хочете ви managed/serverless для мінімізації ops і наскільки важливі вартість та vendor lock-in? Теоретично ідеальний движок, який ваша команда не може експлуатувати, — неправильний движок. Скористайтесь **Database Picker** нижче, щоб пройти ці питання інтерактивно — він ранжує найкращі родини й бере default Postgres, коли жоден спеціаліст явно не перемагає.",
          },
        },
        {
          kind: 'sim',
          sim: 'db-picker',
        },
        {
          kind: 'table',
          caption: { en: 'The decision dimensions — what to ask, and what the answer points to', uk: 'Виміри рішення — що питати і на що вказує відповідь' },
          head: [
            { en: 'Dimension', uk: 'Вимір' },
            { en: 'Ask', uk: 'Питайте' },
            { en: 'Points to', uk: 'Вказує на' },
          ],
          rows: [
            [
              { en: 'Data shape', uk: 'Форма даних' },
              { en: 'Relations, documents, key→value, graph, vectors, events?', uk: 'Relations, документи, key→value, graph, vectors, події?' },
              { en: 'Relational · document · KV · graph · vector · time-series', uk: 'Relational · document · KV · graph · vector · time-series' },
            ],
            [
              { en: 'Access pattern', uk: 'Access pattern' },
              { en: 'Joins, point reads, scans, traversals, similarity, FTS?', uk: 'Joins, point reads, scans, traversals, similarity, FTS?' },
              { en: 'Relational · KV · OLAP · graph · vector · search', uk: 'Relational · KV · OLAP · graph · vector · search' },
            ],
            [
              { en: 'Consistency', uk: 'Consistency' },
              { en: 'Strict ACID, or eventual acceptable?', uk: 'Сувора ACID — чи eventual прийнятна?' },
              { en: 'Relational (strict) vs KV/wide-column (eventual)', uk: 'Relational (сувора) проти KV/wide-column (eventual)' },
            ],
            [
              { en: 'Scale & writes', uk: 'Масштаб і записи' },
              { en: 'One node, or write-heavy multi-region?', uk: 'Один вузол — чи write-heavy мультирегіон?' },
              { en: 'Relational vs wide-column / distributed SQL (M30)', uk: 'Relational проти wide-column / distributed SQL (M30)' },
            ],
            [
              { en: 'Latency', uk: 'Latency' },
              { en: 'Is sub-ms a hard requirement?', uk: 'Субмілісекунда — жорстка вимога?' },
              { en: 'In-memory KV cache in front (M26)', uk: 'In-memory KV-кеш попереду (M26)' },
            ],
            [
              { en: 'Special need', uk: 'Особлива потреба' },
              { en: 'AI, cache, analytics, graph, search?', uk: 'AI, кеш, аналітика, graph, пошук?' },
              { en: 'A specialist, usually alongside Postgres', uk: 'Спеціаліст, зазвичай поряд із Postgres' },
            ],
            [
              { en: 'Operational reality', uk: 'Операційна реальність' },
              { en: 'Team size, managed vs self-host, cost, lock-in?', uk: 'Розмір команди, managed vs self-host, вартість, lock-in?' },
              { en: 'Often the deciding constraint', uk: 'Часто вирішальне обмеження' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'One workload, one question at a time', uk: 'Один workload, по одному питанню' },
          md: {
            en: "Answer the questions for the *dominant* workload of a service, not for every edge case. A typical app is overwhelmingly relational with one hot specialty (a cache, or search, or vectors). Optimising the whole architecture around a 1% query is how a team ends up with five datastores to operate. Decide for the 95%, then add a specialist for the part that earns it.",
            uk: "Відповідайте на питання для *домінантного* workload сервісу, а не для кожного крайнього випадку. Типовий застосунок переважно реляційний з однією гарячою спеціалізацією (кеш, чи пошук, чи vectors). Оптимізація всієї архітектури навколо 1% запитів — це те, як команда опиняється з пʼятьма сховищами для експлуатації. Вирішуйте для 95%, потім додавайте спеціаліста для тієї частини, що це заслуговує.",
          },
        },
      ],
    },

    // ── Topic 3: workload walkthroughs ────────────────────────────────────
    {
      id:    'walkthroughs',
      title: { en: 'Workload walkthroughs', uk: 'Розбори workload' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The framework is clearest worked through real workloads. A **typical SaaS or transactional app** — users, orders, billing, relationships, reporting — is relational to its core: PostgreSQL, full stop. A **product catalog with flexible per-category attributes plus fast cart/session state** is still Postgres for the catalog and orders (JSONB handles the variable attributes), with **Redis/Valkey** in front for sessions and rate limiting — a two-store split where each does what it is best at.\n\nThe specialist cases each have a tell. **IoT or observability metrics** — append-only, timestamped, queried by time window — point at **TimescaleDB** (still Postgres and SQL) or InfluxDB. **Recommendations, fraud rings, or access graphs**, where queries are deep multi-hop traversals, point at a **graph database**. **Semantic search, RAG, or 'find similar'** points at **vectors** — start with pgvector inside the Postgres you already run, and only graduate to Qdrant/Milvus at very large scale. **Dashboards and heavy analytics** over hundreds of millions of rows point at a **columnar OLAP engine** (ClickHouse, DuckDB) kept *separate* from the OLTP database. **Write-heavy at global, multi-region, always-on scale** is where a **wide-column store** (Cassandra/ScyllaDB) or distributed SQL (M30) finally earns its complexity.\n\nNotice the pattern: in almost every case the answer is **Postgres plus, at most, one specialist for the one thing it does poorly** — not a specialist instead of Postgres. The art is identifying that one thing honestly, and resisting the urge to add a second specialist for a problem you do not actually have yet.",
            uk: "Фреймворк найясніший, коли пройдений через реальні workloads. **Типовий SaaS чи транзакційний застосунок** — користувачі, замовлення, білінг, звʼязки, звітність — реляційний до основи: PostgreSQL, крапка. **Каталог товарів із гнучкими атрибутами на категорію плюс швидкий стан cart/session** — це все ще Postgres для каталогу й замовлень (JSONB тримає змінні атрибути), з **Redis/Valkey** попереду для сесій і rate limiting — розподіл на два сховища, де кожне робить те, у чому найкраще.\n\nСпеціалізовані випадки кожен має свою ознаку. **IoT чи observability-метрики** — append-only, мітковані часом, запитувані за вікном часу — указують на **TimescaleDB** (досі Postgres і SQL) чи InfluxDB. **Рекомендації, fraud rings чи графи доступу**, де запити — глибокі multi-hop traversals, указують на **graph-базу**. **Семантичний пошук, RAG чи «знайти схоже»** указують на **vectors** — починайте з pgvector усередині Postgres, який уже працює, і переходьте до Qdrant/Milvus лише на дуже великому масштабі. **Дашборди й важка аналітика** над сотнями мільйонів рядків указують на **columnar OLAP** (ClickHouse, DuckDB), тримане *окремо* від OLTP-бази. **Write-heavy на глобальному, мультирегіональному, always-on масштабі** — це там, де **wide-column** (Cassandra/ScyllaDB) чи distributed SQL (M30) нарешті виправдовує свою складність.\n\nПомітьте патерн: майже в кожному випадку відповідь — **Postgres плюс щонайбільше один спеціаліст для тієї однієї речі, яку він робить погано**, а не спеціаліст замість Postgres. Мистецтво — чесно визначити цю одну річ і опиратися спокусі додати другого спеціаліста для проблеми, якої у вас насправді ще немає.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Workload → primary store → add-on, and the signal that decided it', uk: 'Workload → основне сховище → доповнення і сигнал, що вирішив' },
          head: [
            { en: 'Workload', uk: 'Workload' },
            { en: 'Primary', uk: 'Основне' },
            { en: 'Add-on (if any) & the signal', uk: 'Доповнення (якщо є) і сигнал' },
          ],
          rows: [
            [
              { en: 'Typical SaaS / transactional app', uk: 'Типовий SaaS / транзакційний застосунок' },
              { en: 'PostgreSQL', uk: 'PostgreSQL' },
              { en: 'None — relations + ACID + ad-hoc queries', uk: 'Жодного — relations + ACID + ad-hoc запити' },
            ],
            [
              { en: 'Catalog + cart/sessions', uk: 'Каталог + cart/sessions' },
              { en: 'PostgreSQL (JSONB)', uk: 'PostgreSQL (JSONB)' },
              { en: 'Redis/Valkey — sub-ms session & rate-limit', uk: 'Redis/Valkey — субмс сесії й rate-limit' },
            ],
            [
              { en: 'IoT / metrics / observability', uk: 'IoT / метрики / observability' },
              { en: 'TimescaleDB / InfluxDB', uk: 'TimescaleDB / InfluxDB' },
              { en: 'Append-only, timestamped, time-window queries', uk: 'Append-only, мітковані часом, запити за вікном' },
            ],
            [
              { en: 'Recommendations / fraud', uk: 'Рекомендації / fraud' },
              { en: 'Graph (Neo4j)', uk: 'Graph (Neo4j)' },
              { en: 'Deep multi-hop traversals are the hot query', uk: 'Глибокі multi-hop traversals — гарячий запит' },
            ],
            [
              { en: 'Semantic search / RAG', uk: 'Семантичний пошук / RAG' },
              { en: 'PostgreSQL + pgvector', uk: 'PostgreSQL + pgvector' },
              { en: 'Embeddings + nearest-neighbour; Qdrant at scale', uk: 'Embeddings + nearest-neighbour; Qdrant на масштабі' },
            ],
            [
              { en: 'Dashboards / heavy analytics', uk: 'Дашборди / важка аналітика' },
              { en: 'ClickHouse / DuckDB', uk: 'ClickHouse / DuckDB' },
              { en: 'Big scans & aggregations — keep off OLTP', uk: 'Великі scans і агрегації — геть від OLTP' },
            ],
            [
              { en: 'Global write-heavy, always-on', uk: 'Глобальний write-heavy, always-on' },
              { en: 'Cassandra / distributed SQL', uk: 'Cassandra / distributed SQL' },
              { en: 'Multi-region writes beyond one primary (M30)', uk: 'Мультирегіон-записи понад один primary (M30)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The answer is usually Postgres + one specialist', uk: 'Відповідь зазвичай Postgres + один спеціаліст' },
          md: {
            en: "Across these walkthroughs the relational store is the constant and the specialist is the variable. That is the practical meaning of 'requirements first': you are not choosing *the* database, you are choosing a system of record (almost always Postgres) and then deciding whether one hot specialty earns a second store. If you find yourself justifying a third and fourth datastore for a single service, stop — that is usually a sign the workload was split wrong, not that it needs four engines.",
            uk: "Через ці розбори реляційне сховище — константа, а спеціаліст — змінна. Це практичний сенс «спершу вимоги»: ви обираєте не *ту саму* базу, ви обираєте систему запису (майже завжди Postgres), а потім вирішуєте, чи одна гаряча спеціалізація заслуговує другого сховища. Якщо ви виправдовуєте третє й четверте сховище для одного сервісу — зупиніться: це зазвичай ознака, що workload розділили неправильно, а не що йому потрібні чотири движки.",
          },
        },
      ],
    },

    // ── Topic 4: polyglot persistence ─────────────────────────────────────
    {
      id:    'polyglot',
      title: { en: 'Polyglot persistence — and its cost', uk: 'Polyglot persistence — і її ціна' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**Polyglot persistence** — a term Martin Fowler popularised — is the practice of using different data stores for different jobs within one system, because different problems are best solved with different storage technologies. It is the honest answer to the walkthroughs above: a system of record in Postgres, a Redis cache for hot lookups, a vector index for semantic search, a columnar store for analytics. Used deliberately, it lets each part of the workload run on the engine built for it.\n\nThe catch is that **every store you add is a permanent tax**. It is another system to deploy, monitor, back up, secure, upgrade, and staff; another failure mode; and — the subtle one — a **consistency problem across stores**. The moment the same fact lives in two systems (the order in Postgres and a denormalised copy in the cache or search index) you have a **dual-write problem**: the two can diverge if one write succeeds and the other fails. The disciplined fix is to make Postgres the single source of truth and propagate to the others **asynchronously and idempotently** — the transactional **outbox** and change-data-capture patterns from M20 — never two independent synchronous writes from the application.\n\nSo the rule is: **polyglot when the workload demands it, monoglot when it does not.** Reach for a second store when one hot specialty clearly outgrows what Postgres can do well, not because the architecture diagram looks more sophisticated with more boxes. The strongest systems are often the ones that resisted adding the third box.",
            uk: "**Polyglot persistence** — термін, який популяризував Martin Fowler — це практика використання різних сховищ для різних задач у межах однієї системи, бо різні проблеми найкраще розвʼязуються різними технологіями зберігання. Це чесна відповідь на розбори вище: система запису в Postgres, Redis-кеш для гарячих lookups, vector-index для семантичного пошуку, columnar-сховище для аналітики. Вжите свідомо, воно дозволяє кожній частині workload працювати на створеному для неї движку.\n\nПідступ у тому, що **кожне сховище, яке ви додаєте, — це постійний податок**. Це ще одна система для деплою, моніторингу, бекапу, безпеки, апгрейду й персоналу; ще один режим відмови; і — тонкий — **проблема consistency між сховищами**. У мить, коли той самий факт живе у двох системах (замовлення в Postgres і денормалізована копія в кеші чи search-index), ви маєте **dual-write problem**: ці двоє можуть розійтися, якщо один запис успішний, а інший провалився. Дисциплінований фікс — зробити Postgres єдиним джерелом істини й поширювати в інші **асинхронно та ідемпотентно** — патерни transactional **outbox** і change-data-capture з M20 — ніколи не два незалежні синхронні записи із застосунку.\n\nТож правило: **polyglot, коли workload вимагає, monoglot, коли ні.** Беріть друге сховище, коли одна гаряча спеціалізація явно переростає те, що Postgres робить добре, а не тому, що діаграма архітектури виглядає вишуканіше з більшою кількістю прямокутників. Найсильніші системи часто ті, що опиралися додаванню третього прямокутника.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Single store (monoglot)', uk: 'Одне сховище (monoglot)' },
          b: { en: 'Polyglot persistence', uk: 'Polyglot persistence' },
          rows: [
            [
              { en: 'Best when', uk: 'Найкраще коли' },
              { en: 'One coherent workload; Postgres covers it', uk: 'Один цілісний workload; Postgres його покриває' },
              { en: 'A hot specialty clearly outgrows the default', uk: 'Гаряча спеціалізація явно переростає default' },
            ],
            [
              { en: 'Consistency', uk: 'Consistency' },
              { en: 'One transactional boundary — simple', uk: 'Одна транзакційна межа — просто' },
              { en: 'Cross-store; needs outbox/CDC (M20)', uk: 'Між сховищами; потрібен outbox/CDC (M20)' },
            ],
            [
              { en: 'Operations', uk: 'Операції' },
              { en: 'One system to run, back up, staff', uk: 'Одна система для запуску, бекапу, персоналу' },
              { en: 'N systems — N× the ops surface', uk: 'N систем — N× операційної поверхні' },
            ],
            [
              { en: 'Risk', uk: 'Ризик' },
              { en: 'Can hit a ceiling on the one specialty', uk: 'Може впертись у стелю на одній спеціалізації' },
              { en: 'Complexity & drift between stores', uk: 'Складність і drift між сховищами' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Two copies of a fact is a dual-write problem', uk: 'Дві копії факту — це dual-write problem' },
          md: {
            en: "The hidden cost of polyglot persistence is not running two databases — it is keeping them in agreement. As soon as the application writes the same fact to Postgres and to a cache or search index in two separate steps, a crash between them leaves the copies inconsistent. Do not solve this with two synchronous writes and hope; make one store authoritative and propagate changes through a transactional outbox or change-data-capture (M20), so the copy is eventually-consistent by design rather than by luck.",
            uk: "Прихована ціна polyglot persistence — не запуск двох баз, а тримання їх у згоді. Щойно застосунок пише той самий факт у Postgres і в кеш чи search-index двома окремими кроками, збій між ними лишає копії неконсистентними. Не розвʼязуйте це двома синхронними записами з надією; зробіть одне сховище авторитетним і поширюйте зміни через transactional outbox чи change-data-capture (M20), щоб копія була eventually-consistent за дизайном, а не за везінням.",
          },
        },
      ],
    },

    // ── Topic 5: anti-patterns ────────────────────────────────────────────
    {
      id:    'anti-patterns',
      title: { en: 'Anti-patterns: how database choices go wrong', uk: 'Анти-патерни: як вибір бази йде не так' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Most bad database decisions are not technical mistakes — they are decisions made for the wrong reason. **Résumé-driven development** picks the engine that looks best on a CV rather than the one that fits the workload. **Hype-driven** choices follow whatever was loudest at the last conference. **'NoSQL because scale'** adopts a horizontally-scaled store to handle traffic the team will not see for years, paying its consistency and query-model costs now for a benefit that may never arrive. Each of these inverts the framework: the technology is chosen first, and requirements are bent to fit it.\n\nThe quieter anti-patterns are just as costly. **Choosing by benchmark** — picking the engine that won a synthetic throughput test — ignores that your workload is not the benchmark; the right comparison is a prototype on *your* data and queries. **Premature distribution** reaches for sharding or distributed SQL before a single well-tuned Postgres has been exhausted, inheriting cross-shard complexity that was never needed (M22, M34). And **ignoring operational reality** — adopting an engine the team cannot run, monitor, or hire for — produces a system that is correct on paper and broken at 3am.\n\nThe antidote is the same in every case: **return to requirements.** Write down what the workload actually needs, default to the boring, well-operated choice, prototype the one decision you are unsure about against real data, and add complexity only when a measured requirement forces it. A database chosen this way is one you can defend in a design review and live with in production.",
            uk: "Більшість поганих рішень про базу — не технічні помилки, а рішення, ухвалені з неправильної причини. **Résumé-driven development** обирає движок, що краще виглядає в резюме, а не той, що пасує workload. **Hype-driven** вибори йдуть за тим, що було найгучнішим на останній конференції. **«NoSQL because scale»** бере горизонтально-масштабоване сховище під трафік, якого команда не побачить роками, платячи його consistency- та query-model-ціни зараз за вигоду, що може ніколи не настати. Кожен із цих інвертує фреймворк: технологію обирають першою, а вимоги згинають під неї.\n\nТихіші анти-патерни не менш дорогі. **Вибір за benchmark** — узяти движок, що виграв синтетичний throughput-тест — ігнорує, що ваш workload — не benchmark; правильне порівняння — прототип на *ваших* даних і запитах. **Передчасна дистрибуція** тягнеться до sharding чи distributed SQL, перш ніж вичерпано один добре налаштований Postgres, успадковуючи cross-shard складність, яка ніколи не була потрібна (M22, M34). А **ігнорування операційної реальності** — узяти движок, який команда не може запустити, моніторити чи найняти під нього — дає систему, правильну на папері й зламану о 3-й ночі.\n\nПротиотрута та сама в кожному випадку: **поверніться до вимог.** Запишіть, що workload насправді потребує, беріть за default нудний, добре експлуатований вибір, прототипуйте те одне рішення, у якому ви не впевнені, на реальних даних і додавайте складність лише тоді, коли виміряна вимога це змусить. Базу, обрану так, можна захистити на design review і з нею можна жити в production.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Anti-pattern → the reality → what to do instead', uk: 'Анти-патерн → реальність → що робити натомість' },
          head: [
            { en: 'Anti-pattern', uk: 'Анти-патерн' },
            { en: 'The reality', uk: 'Реальність' },
            { en: 'Do instead', uk: 'Натомість' },
          ],
          rows: [
            [
              { en: 'Résumé / hype-driven', uk: 'Résumé / hype-driven' },
              { en: 'Engine chosen first, requirements bent to fit', uk: 'Движок обрано першим, вимоги зігнуто під нього' },
              { en: 'Requirements first; justify deviating from Postgres', uk: 'Спершу вимоги; виправдайте відхід від Postgres' },
            ],
            [
              { en: "'NoSQL because scale'", uk: '«NoSQL because scale»' },
              { en: 'Paying scale costs for traffic you do not have', uk: 'Платите ціни масштабу за трафік, якого немає' },
              { en: 'Scale up + tune first; shard only when measured', uk: 'Спершу scale up + тюнінг; shard лише за вимірами' },
            ],
            [
              { en: 'Choosing by benchmark', uk: 'Вибір за benchmark' },
              { en: 'Your workload is not the synthetic test', uk: 'Ваш workload — не синтетичний тест' },
              { en: 'Prototype on your own data & queries', uk: 'Прототип на власних даних і запитах' },
            ],
            [
              { en: 'Premature distribution', uk: 'Передчасна дистрибуція' },
              { en: 'Cross-shard complexity you never needed', uk: 'Cross-shard складність, яка не була потрібна' },
              { en: 'Exhaust one tuned Postgres first (M22/M34)', uk: 'Спершу вичерпайте один тюнений Postgres (M22/M34)' },
            ],
            [
              { en: 'Ignoring operations', uk: 'Ігнорування операцій' },
              { en: 'Correct on paper, broken at 3am', uk: 'Правильно на папері, зламано о 3-й ночі' },
              { en: 'Pick what the team can run, monitor, hire for', uk: 'Беріть те, що команда може запустити й наймати' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The choice you can defend in a design review', uk: 'Вибір, який можна захистити на design review' },
          md: {
            en: "A good database decision has a one-sentence justification that starts with the workload, not the technology: 'We chose X because the data is shaped like this, queried like that, must be this consistent, at this scale, and our team can operate it.' If the honest justification is 'it is what I wanted to learn' or 'it is what everyone is using', that is the signal to go back to the requirements. The discipline is unglamorous and it is exactly what separates a senior choice from an expensive one.",
            uk: "Хороше рішення про базу має однореченнєве виправдання, що починається з workload, а не з технології: «Ми обрали X, бо дані мають таку форму, запитуються так, мусять бути настільки консистентні, на такому масштабі, і наша команда може це експлуатувати.» Якщо чесне виправдання — «це те, що я хотів вивчити» чи «це те, що всі використовують», — це сигнал повернутися до вимог. Дисципліна негламурна, і саме вона відрізняє senior-вибір від дорогого.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Choose by a method, not a favourite: requirements first (data shape, access pattern, consistency, scale, latency, special need, operational reality), technology last. The database is the hardest thing to change later, so a wrong call is expensive and sticky.',
      uk: 'Обирайте методом, а не улюбленцем: спершу вимоги (форма даних, access pattern, consistency, масштаб, latency, особлива потреба, операційна реальність), технологія — останньою. Базу найважче змінити потім, тож неправильний вибір дорогий і надовго.',
    },
    {
      en: 'Default to a relational database — PostgreSQL — until a concrete requirement forces otherwise. Modern Postgres also does JSONB, full-text, vector (pgvector) and time-series, so one well-operated engine covers a remarkable range before you add a second system.',
      uk: 'За default беріть реляційну базу — PostgreSQL — доки конкретна вимога не змусить інакше. Сучасний Postgres також робить JSONB, full-text, vector (pgvector) і time-series, тож один добре експлуатований движок покриває вражаючий діапазон, перш ніж ви додасте другу систему.',
    },
    {
      en: 'Most workloads are Postgres plus, at most, one specialist for the single thing it does poorly — a cache (Redis), analytics (ClickHouse), vectors (pgvector→Qdrant), time-series (TimescaleDB), graph (Neo4j), or wide-column at multi-region write scale (Cassandra).',
      uk: 'Більшість workloads — це Postgres плюс щонайбільше один спеціаліст для тієї однієї речі, яку він робить погано — кеш (Redis), аналітика (ClickHouse), vectors (pgvector→Qdrant), time-series (TimescaleDB), graph (Neo4j) чи wide-column на мультирегіон-масштабі записів (Cassandra).',
    },
    {
      en: 'Polyglot persistence is right when the workload demands it, but every store is a permanent ops tax and a cross-store consistency risk. Make one store authoritative and propagate via the outbox / CDC (M20) — never two independent synchronous writes (the dual-write problem).',
      uk: 'Polyglot persistence доречна, коли workload вимагає, але кожне сховище — постійний операційний податок і ризик consistency між сховищами. Зробіть одне сховище авторитетним і поширюйте через outbox / CDC (M20) — ніколи не два незалежні синхронні записи (dual-write problem).',
    },
    {
      en: 'Database choices fail for non-technical reasons: résumé/hype-driven, "NoSQL because scale" without the scale, choosing by benchmark instead of a prototype on your data, premature distribution, and ignoring operational reality. The antidote is always to return to requirements.',
      uk: 'Вибір бази провалюється з нетехнічних причин: résumé/hype-driven, «NoSQL because scale» без масштабу, вибір за benchmark замість прототипу на ваших даних, передчасна дистрибуція й ігнорування операційної реальності. Протиотрута завжди — повернутися до вимог.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Choosing the engine before understanding the workload', uk: 'Вибір движка до розуміння workload' },
      body: {
        en: 'Picking a database because it is fashionable, looks good on a résumé, or won a benchmark inverts the decision: the technology gets chosen first and the requirements are bent to fit it. The result is a system that fights its own storage layer. Always derive the choice from the workload — data shape, access pattern, consistency, scale, and the operational reality of running it — and make any deviation from the relational default earn its place.',
        uk: 'Вибір бази тому, що вона модна, добре виглядає в резюме чи виграла benchmark, інвертує рішення: технологію обирають першою, а вимоги згинають під неї. Результат — система, що бореться з власним шаром зберігання. Завжди виводьте вибір із workload — форма даних, access pattern, consistency, масштаб і операційна реальність — і змусьте будь-яке відхилення від реляційного default заслужити своє місце.',
      },
    },
    {
      title: { en: 'Adopting a scale-out store before you have the scale', uk: 'Узяти scale-out сховище, перш ніж є масштаб' },
      body: {
        en: '"We will need to handle massive scale" justifies a wide-column or distributed store whose consistency limits and rigid query model you pay for immediately, for traffic that may be years away or never arrive. A single well-tuned PostgreSQL on modern hardware handles far more than teams expect. Scale up, index, pool, and cache first (M34); reach for horizontal write scale only when a measured requirement — not a hypothetical one — forces it.',
        uk: '«Нам знадобиться величезний масштаб» виправдовує wide-column чи distributed сховище, чиї межі consistency й жорстку модель запитів ви платите одразу, за трафік, що може бути за роки чи не настати ніколи. Один добре налаштований PostgreSQL на сучасному залізі тримає набагато більше, ніж команди очікують. Спершу scale up, indexes, pooling і кеш (M34); беріть горизонтальний масштаб записів лише тоді, коли виміряна вимога — не гіпотетична — це змусить.',
      },
    },
    {
      title: { en: 'Adding stores without owning the consistency between them', uk: 'Додавати сховища, не володіючи consistency між ними' },
      body: {
        en: 'Polyglot persistence is powerful but the moment the same fact lives in two stores you have a dual-write problem: writing to Postgres and to a cache or search index in two steps can leave them inconsistent on a crash. Teams add the second store for performance and forget they have signed up for cross-store consistency. Make one store the source of truth and propagate asynchronously and idempotently via an outbox or change-data-capture (M20) — never two independent synchronous writes.',
        uk: 'Polyglot persistence потужна, але в мить, коли той самий факт живе у двох сховищах, ви маєте dual-write problem: запис у Postgres і в кеш чи search-index двома кроками може лишити їх неконсистентними при збої. Команди додають друге сховище заради продуктивності й забувають, що підписалися на consistency між сховищами. Зробіть одне сховище джерелом істини й поширюйте асинхронно та ідемпотентно через outbox чи change-data-capture (M20) — ніколи не два незалежні синхронні записи.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'How do you choose a database for a new service?', uk: 'Як ви обираєте базу даних для нового сервісу?' },
      a: {
        en: "I start from the workload, not from a preferred engine. I ask a small set of questions: what is the shape of the data (relational, document, key-value, graph, vectors, time-series), what is the dominant access pattern (joins and ad-hoc queries, point lookups, big scans, traversals, similarity, full-text), how strict does consistency need to be, what is the realistic scale and write volume, is there a hard latency requirement, and is there one special need the workload has that a general database does poorly. Then the operational question that decides as many projects as the technical ones: can my team actually run, monitor, and hire for this, and how much do cost and lock-in matter. My default is PostgreSQL, because it gives ACID, joins, ad-hoc queries, a deep ecosystem, and now also JSONB, full-text, vectors, and time-series, so one well-understood engine covers most of what a service needs. I only deviate when the workload sends a clear signal — and then usually I add a specialist alongside Postgres for that one hot specialty rather than replacing it. The choice I want to walk into a design review with is one whose justification starts with the requirements, not the technology.",
        uk: "Я починаю з workload, а не з улюбленого движка. Я ставлю невеликий набір питань: яка форма даних (relational, document, key-value, graph, vectors, time-series), який домінантний access pattern (joins та ad-hoc запити, point lookups, великі scans, traversals, similarity, full-text), наскільки сувора має бути consistency, який реалістичний масштаб та обсяг записів, чи є жорстка вимога до latency і чи є одна особлива потреба, яку workload має, а база загального призначення робить погано. Потім операційне питання, що вирішує не менше проєктів, ніж технічні: чи може моя команда реально це запустити, моніторити й наймати під нього, і наскільки важливі вартість та lock-in. Мій default — PostgreSQL, бо він дає ACID, joins, ad-hoc запити, глибоку екосистему, а тепер ще JSONB, full-text, vectors і time-series, тож один добре зрозумілий движок покриває більшість потреб сервісу. Я відхиляюсь лише коли workload дає чіткий сигнал — і тоді зазвичай додаю спеціаліста поряд із Postgres для тієї однієї гарячої спеціалізації, а не замінюю його. Вибір, з яким я хочу зайти на design review, — той, чиє виправдання починається з вимог, а не з технології.",
      },
    },
    {
      level: 'senior',
      q: { en: 'When would you NOT use PostgreSQL?', uk: 'Коли б ви НЕ використали PostgreSQL?' },
      a: {
        en: "When the workload sends a clear, measured signal that a specialist does the dominant job materially better and Postgres cannot. A few concrete cases: an in-memory cache or sub-millisecond session/counter/queue layer belongs in Redis or Valkey, not Postgres. Heavy analytical scans and aggregations over hundreds of millions of rows belong in a columnar OLAP engine like ClickHouse or DuckDB, kept separate from the OLTP database so reporting does not fight transactions. Genuinely write-heavy, multi-region, always-on workloads that exceed what one primary plus replicas can do are where a wide-column store like Cassandra or distributed SQL finally earns its complexity. And queries that are overwhelmingly deep multi-hop traversals — recommendations, fraud rings — are where a graph database with index-free adjacency beats recursive SQL joins. Note that several of these are additions to Postgres, not replacements — and that for documents, full-text, vectors at moderate scale, and time-series, modern Postgres is often good enough that adding a specialist is premature. The test is always whether the specialty is the dominant workload and whether Postgres has actually been pushed to its limit, not whether a specialist is theoretically better at that one thing.",
        uk: "Коли workload дає чіткий, виміряний сигнал, що спеціаліст робить домінантну задачу істотно краще, а Postgres не може. Кілька конкретних випадків: in-memory кеш чи субмілісекундний шар сесій/лічильників/черг належить Redis чи Valkey, а не Postgres. Важкі аналітичні scans та агрегації над сотнями мільйонів рядків належать columnar OLAP-движку на кшталт ClickHouse чи DuckDB, триманому окремо від OLTP-бази, щоб звітність не боролася з транзакціями. Справді write-heavy, мультирегіональні, always-on навантаження, що перевищують можливості одного primary плюс replicas, — там wide-column на кшталт Cassandra чи distributed SQL нарешті виправдовує складність. А запити, що переважно є глибокими multi-hop traversals — рекомендації, fraud rings — там graph-база з index-free adjacency перемагає рекурсивні SQL joins. Зауважте: кілька з цих — доповнення до Postgres, а не заміни — і що для документів, full-text, vectors на помірному масштабі й time-series сучасний Postgres часто достатньо добрий, тож додавати спеціаліста передчасно. Тест завжди — чи спеціалізація є домінантним workload і чи Postgres справді доведено до межі, а не чи спеціаліст теоретично кращий у тій одній речі.",
      },
    },
    {
      level: 'staff',
      q: { en: 'A team wants to introduce a new datastore for one feature. How do you evaluate the proposal?', uk: 'Команда хоче ввести нове сховище заради однієї фічі. Як ви оцінюєте пропозицію?' },
      a: {
        en: "I treat adding a datastore as a significant, long-lived commitment and evaluate it on three axes: requirement, cost, and consistency. First, the requirement: what specifically does the existing store (usually Postgres) do badly for this feature, is that the dominant workload of the feature or a 1% edge case, and has Postgres actually been pushed — right indexes, the right extension (pgvector, full-text, TimescaleDB), proper tuning — before concluding it cannot do the job. A lot of proposals evaporate here because the real problem was a missing index, not a missing database. Second, the total cost of ownership: every new store is deploy, monitor, back up, secure, upgrade, on-call, and hire — a permanent operational tax the team pays forever, not just the afternoon it is added. Third, and most overlooked, consistency: if the feature duplicates a fact that also lives in Postgres, we now own a dual-write problem and need an outbox or change-data-capture pipeline to keep the copies in agreement; that machinery is part of the cost, not an afterthought. If the requirement is real and dominant, Postgres has genuinely been exhausted, the team can operate the new system, and we have a concrete plan for cross-store consistency, I am for it — ideally as a specialist alongside Postgres-as-source-of-truth, introduced behind an abstraction so it can be reversed. If any of those is missing, the answer is to fix the existing store first. The goal is to make the decision boring and defensible, not to accumulate datastores.",
        uk: "Я ставлюся до додавання сховища як до значного, довгоживучого зобовʼязання й оцінюю його за трьома осями: вимога, вартість і consistency. Перше, вимога: що саме наявне сховище (зазвичай Postgres) робить погано для цієї фічі, чи це домінантний workload фічі чи 1% крайній випадок, і чи Postgres справді доведено до межі — правильні indexes, правильне розширення (pgvector, full-text, TimescaleDB), належний тюнінг — перш ніж вирішити, що він не може. Багато пропозицій випаровуються тут, бо справжньою проблемою був відсутній index, а не відсутня база. Друге, повна вартість володіння: кожне нове сховище — це деплой, моніторинг, бекап, безпека, апгрейд, on-call і найм — постійний операційний податок, який команда платить завжди, а не лише в день додавання. Третє, і найбільш недооцінене, consistency: якщо фіча дублює факт, що також живе в Postgres, ми тепер володіємо dual-write problem і потребуємо outbox чи change-data-capture pipeline, щоб тримати копії у згоді; ця механіка — частина вартості, а не другорядна думка. Якщо вимога реальна й домінантна, Postgres справді вичерпано, команда може експлуатувати нову систему і ми маємо конкретний план consistency між сховищами — я за — ідеально як спеціаліста поряд із Postgres-як-джерелом-істини, уведеного за абстракцією, щоб це можна було відкотити. Якщо чогось із цього бракує, відповідь — спершу виправити наявне сховище. Мета — зробити рішення нудним і захищуваним, а не накопичувати сховища.",
      },
    },
  ],

  seeAlso: ['m2-landscape', 'm3-sql-vs-nosql', 'm20-distributed-tx', 'm34-performance'],

  sources: [
    { title: 'PostgreSQL — Versioning Policy (18.4 current; 19 in beta)', url: 'https://www.postgresql.org/support/versioning/' },
    { title: 'PostgreSQL 18.4 release announcement (2026-06-04)', url: 'https://www.postgresql.org/about/news/postgresql-184-1710-1614-1518-and-1423-released-3297/' },
    { title: 'DB-Engines — PostgreSQL leads H1 2026 database growth (+21.97)', url: 'https://www.red-gate.com/our-company/newsroom/press-releases/db-engines-postgresql-leads-h1-2026-database-growth-as-data-platforms-gain-momentum/' },
    { title: 'DB-Engines Ranking', url: 'https://db-engines.com/en/ranking' },
    { title: 'Martin Fowler — Polyglot Persistence (bliki)', url: 'https://martinfowler.com/bliki/PolyglotPersistence.html' },
    { title: 'Sadalage & Fowler — NoSQL Distilled (polyglot persistence)', url: 'https://martinfowler.com/books/nosql.html' },
  ],
};

export default m35;
