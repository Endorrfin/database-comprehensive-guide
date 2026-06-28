import type { Module } from '../types';
import { families } from '../families';

/*
 * M2 · The database landscape — the families map (S2). Signature module.
 * The "family → typical engines → when it fits" table is DERIVED from the shared
 * data/families.ts, so it can never drift from the interactive map (sim 'families-map')
 * or the landing. Engine names stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): DB-Engines H1 2026 — PostgreSQL the
 * fastest-growing engine (+21.97); MySQL still leads the ranking by score; the top-4
 * (Oracle, MySQL, SQL Server, PostgreSQL) unchanged for >1 year; MongoDB +11.24.
 */
export const m2: Module = {
  id: 'm2-landscape',
  num: 2,
  section: 's1-foundations',
  order: 2,
  level: 'beginner',
  signature: true,
  title: { en: 'The database landscape', uk: 'Ландшафт баз даних' },
  tagline: {
    en: 'The families map — relational, document, key-value, wide-column, graph, vector, time-series, search, OLAP.',
    uk: 'Карта родин — relational, document, key-value, wide-column, graph, vector, time-series, search, OLAP.',
  },
  readMins: 9,
  mentalModel: {
    en: 'Fit the data model to the access pattern, not to the hype.',
    uk: 'Підбирайте модель даних під access pattern, а не під хайп.',
  },
  topics: [
    {
      id: 'the-families',
      title: { en: 'The families', uk: 'Родини' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'There is no single thing called "a database". There are **families** — relational, document, key-value, wide-column, graph, vector, time-series, analytics/columnar, search — each shaped around a different way of reading and writing data. They are not competitors so much as different tools: a graph database and a columnar warehouse are no more rivals than a wrench and a saw. The skill is recognizing which shape your problem has.',
            uk: 'Немає єдиної речі на імʼя «база даних». Є **родини** — relational, document, key-value, wide-column, graph, vector, time-series, analytics/columnar, search — кожна зроблена під свій спосіб читати й писати дані. Вони радше різні інструменти, ніж конкуренти: graph database і columnar warehouse не більші суперники, ніж гайковий ключ і пилка. Майстерність — упізнати, якої форми ваша задача.',
          },
        },
        {
          kind: 'sim',
          sim: 'families-map',
        },
        {
          kind: 'prose',
          md: {
            en: 'One pole of the map is the **relational** family (PostgreSQL, MySQL): tables, joins, and strong guarantees — the general-purpose default. Everything else is, loosely, "the rest": specialized engines that give up some generality to win at one thing — lowest latency (key-value), horizontal write scale (wide-column), relationship traversal (graph), semantic similarity (vector), or huge analytical scans (columnar). The map above is interactive; the next section turns it into a quick lookup table.',
            uk: 'Один полюс карти — **relational** родина (PostgreSQL, MySQL): tables, joins і сильні гарантії — універсальний default. Усе інше — умовно «решта»: спеціалізовані движки, що жертвують частиною універсальності заради перемоги в одному — найнижча latency (key-value), горизонтальний write scale (wide-column), обхід звʼязків (graph), семантична схожість (vector) чи величезні аналітичні scans (columnar). Карта вище інтерактивна; наступний розділ робить із неї швидку таблицю.',
          },
        },
      ],
    },
    {
      id: 'shape-of-data-drives-choice',
      title: { en: 'The shape of your data drives the choice', uk: 'Форма даних визначає вибір' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The right question is never "what is everyone using?" — it is **"how will I read and write this data?"** Entities and their relationships, the read/write ratio, the queries you must answer, the consistency you need, the scale and latency you are targeting: those facts point at a family. Get the access pattern clear and the choice is usually obvious; skip that step and the most popular engine is just a guess.',
            uk: 'Правильне питання ніколи не «що всі використовують?» — а **«як я читатиму й писатиму ці дані?»** Сутності та їхні звʼязки, співвідношення читань/записів, запити, на які треба відповісти, потрібна consistency, цільові scale і latency: ці факти вказують на родину. Зробіть access pattern зрозумілим — і вибір зазвичай очевидний; пропустіть цей крок — і найпопулярніший движок лише здогад.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Family → typical engines → when it fits. Tap any family in the map above for detail.',
            uk: 'Родина → типові движки → коли пасує. Торкніться будь-якої родини на карті вище для деталей.',
          },
          head: [
            { en: 'Family', uk: 'Родина' },
            { en: 'Typical engines', uk: 'Типові движки' },
            { en: 'When it fits', uk: 'Коли пасує' },
          ],
          rows: families.map((f) => [
            f.name,
            { en: f.engines.join(' · '), uk: f.engines.join(' · ') },
            f.when,
          ]),
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Start from the query, not the engine', uk: 'Починайте з запиту, а не з движка' },
          md: {
            en: 'Write down the three or four questions your system must answer and how often, before naming a product. "Look up a user by id", "list a customer\'s recent orders", "find the 10 most similar images" each lean toward a different family. The query is the requirement; the engine is the implementation.',
            uk: 'Випишіть три-чотири питання, на які система мусить відповідати, і як часто, перш ніж називати продукт. «Знайти user за id», «показати останні замовлення клієнта», «знайти 10 найсхожіших зображень» — кожне хилиться до іншої родини. Запит — це вимога; движок — реалізація.',
          },
        },
      ],
    },
    {
      id: 'engines-on-the-map',
      title: { en: 'Engines on the map (2026)', uk: 'Движки на карті (2026)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A few names anchor each family in 2026. **PostgreSQL** is the relational default and was the *fastest-growing* engine in the first half of 2026 on the DB-Engines ranking; **MySQL** still leads that ranking by absolute score, and the top four (Oracle, MySQL, SQL Server, PostgreSQL) have held their order for over a year. **MongoDB** leads document; **Redis** (and its fork **Valkey**) lead key-value; **Cassandra**/**ScyllaDB** cover wide-column; **Neo4j** is the graph reference; **ClickHouse** and **DuckDB** dominate analytics; **pgvector**, **Qdrant** and friends carry the vector/AI wave.',
            uk: 'Кілька імен закріплюють кожну родину у 2026. **PostgreSQL** — реляційний default і *найшвидше зростав* у першій половині 2026 за рейтингом DB-Engines; **MySQL** усе ще лідирує в цьому рейтингу за абсолютним score, а четвірка лідерів (Oracle, MySQL, SQL Server, PostgreSQL) тримає порядок понад рік. **MongoDB** лідирує в document; **Redis** (і його fork **Valkey**) — у key-value; **Cassandra**/**ScyllaDB** покривають wide-column; **Neo4j** — еталон graph; **ClickHouse** і **DuckDB** домінують в аналітиці; **pgvector**, **Qdrant** і подібні несуть vector/AI-хвилю.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: '"Boring" is usually the right default', uk: '«Нудне» зазвичай і є правильним default' },
          md: {
            en: 'The stability of the DB-Engines top four is a signal: for the large majority of applications a mature relational database is the correct, low-regret choice, and modern PostgreSQL absorbs JSON, full-text, geo and vectors as extensions. Specialized engines earn their place at the extremes — billions of vectors, petabyte analytics, global write scale — not as a default. M35 turns this into a decision framework.',
            uk: 'Стабільність четвірки лідерів DB-Engines — це сигнал: для переважної більшості застосунків зріла реляційна база — правильний вибір із низьким жалем, а сучасний PostgreSQL вбирає JSON, full-text, geo і vectors як extensions. Спеціалізовані движки заслуговують місце на екстремумах — мільярди vectors, петабайтна аналітика, глобальний write scale — не як default. M35 перетворює це на фреймворк рішення.',
          },
        },
      ],
    },
    {
      id: 'how-to-read-this-guide',
      title: { en: 'How to read the rest of this guide', uk: 'Як читати решту посібника' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'This guide is **internals-first**: it teaches the universal machinery once — storage, indexing, transactions, concurrency, distribution — then shows how each family instantiates it. **PostgreSQL** is the worked example and the relational spine; the **NoSQL families** (document, key-value, wide-column, graph) get their own first-class section; and a full **modern & specialized** section covers vector, distributed-SQL, analytics and cloud-native engines.',
            uk: 'Цей посібник — **internals-first**: він навчає універсальної механіки один раз — storage, indexing, transactions, concurrency, distribution — а потім показує, як кожна родина її втілює. **PostgreSQL** — пророблений приклад і реляційний хребет; **NoSQL-родини** (document, key-value, wide-column, graph) мають власний повноцінний розділ; а цілий розділ **modern & specialized** покриває vector, distributed-SQL, аналітику й cloud-native движки.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Modules are **not a forced sequence** — every one stands on its own, so dive straight into the internals if you already know the basics. If you want a route, follow the **Start here** path on the landing page, which runs from these foundations to the golden **B-Tree visualizer** (M13) and on into transactions. Beginners should read M1, this module, and the relational model (M4) next; everyone else can skip freely.',
            uk: 'Модулі — **не примусова послідовність**: кожен самодостатній, тож пірнайте прямо в internals, якщо основи вже знаєте. Якщо хочете маршрут — ідіть шляхом **Start here** на головній сторінці, що веде від цих основ до золотого **B-Tree visualizer** (M13) і далі в транзакції. Початківцям варто читати M1, цей модуль і реляційну модель (M4) далі; решта може пропускати вільно.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'There is no single "database" — there are families, each optimized for a different access pattern.',
      uk: 'Немає єдиної «бази даних» — є родини, кожна оптимізована під свій access pattern.',
    },
    {
      en: 'Relational is the general-purpose default; reach for a specialized family only when the access pattern demands it.',
      uk: 'Relational — універсальний default; беріть спеціалізовану родину лише коли цього вимагає access pattern.',
    },
    {
      en: 'Choose by how you read and write the data — entities, query shapes, consistency, scale — not by popularity.',
      uk: 'Обирайте за тим, як читаєте й пишете дані — сутності, форми запитів, consistency, scale — а не за популярністю.',
    },
    {
      en: 'In 2026 PostgreSQL is the fastest-growing engine and the usual default; MySQL still leads DB-Engines by score.',
      uk: 'У 2026 PostgreSQL — найшвидше зростаючий движок і звичний default; MySQL усе ще лідирує в DB-Engines за score.',
    },
    {
      en: 'This guide teaches the internals once, then instantiates them across engines — skip between modules freely.',
      uk: 'Цей посібник навчає internals один раз, потім втілює їх у різних движках — переходьте між модулями вільно.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Choosing a family by hype', uk: 'Вибір родини за хайпом' },
      body: {
        en: '"Everyone uses X" is not a requirement. The same data with a different access pattern wants a different family. Derive the choice from your queries, not from a conference talk.',
        uk: '«Усі використовують X» — не вимога. Ті самі дані з іншим access pattern хочуть іншу родину. Виводьте вибір із ваших запитів, а не з доповіді на конференції.',
      },
    },
    {
      title: { en: 'Assuming "NoSQL = faster and more scalable"', uk: 'Припущення «NoSQL = швидше й масштабованіше»' },
      body: {
        en: 'NoSQL stores trade joins and cross-entity consistency for a specific scale or shape; they are not universally faster. Modern PostgreSQL scales far before a specialized engine is required (M3 makes the trade-offs precise).',
        uk: 'NoSQL-сховища міняють joins і крос-сутнісну consistency на конкретний scale чи форму; вони не швидші всюди. Сучасний PostgreSQL масштабується далеко, перш ніж знадобиться спеціалізований движок (M3 робить компроміси точними).',
      },
    },
    {
      title: { en: 'Going polyglot too early', uk: 'Зарано йти в polyglot' },
      body: {
        en: 'Every additional store is another system to operate, back up, secure and keep consistent. Start with one good default; add a specialized store when a real requirement proves it necessary, not preemptively.',
        uk: 'Кожне додаткове сховище — ще одна система для експлуатації, backups, безпеки й узгодження. Починайте з одного доброго default; додавайте спеціалізоване сховище, коли реальна вимога це доведе, а не наперед.',
      },
    },
  ],
  interview: [
    {
      level: 'beginner',
      q: {
        en: 'Name the major database families and one use case for each.',
        uk: 'Назвіть основні родини баз даних і по одному застосуванню кожної.',
      },
      a: {
        en: 'Relational (transactions with joins and integrity), document (self-contained nested objects), key-value (caching and low-latency lookups), wide-column (write-heavy linear scale), graph (relationship traversal), vector (semantic/similarity search), time-series (metrics and events), columnar/OLAP (large analytical scans), and search (relevance-ranked full text).',
        uk: 'Relational (транзакції з joins та integrity), document (самодостатні вкладені обʼєкти), key-value (кешування й low-latency пошук), wide-column (write-heavy лінійний scale), graph (обхід звʼязків), vector (семантичний/similarity пошук), time-series (метрики й події), columnar/OLAP (великі аналітичні scans) і search (повний текст із ранжуванням за релевантністю).',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'How do you choose a database family for a new service?',
        uk: 'Як обрати родину бази даних для нового сервісу?',
      },
      a: {
        en: 'Start from access patterns: the entities and their relationships, the read/write ratio, the exact queries and how often, the consistency and latency requirements, and the expected scale and operational constraints. Map those onto a family, and default to relational unless a specific requirement (e.g. billions of vectors, global write scale, deep graph traversal) forces a specialized engine.',
        uk: 'Почніть з access patterns: сутності та їхні звʼязки, співвідношення читань/записів, точні запити і їх частота, вимоги до consistency й latency, очікуваний scale та операційні обмеження. Зіставте це з родиною і за замовчуванням беріть relational, поки конкретна вимога (напр. мільярди vectors, глобальний write scale, глибокий обхід graph) не змусить узяти спеціалізований движок.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Postgres can do JSON, full-text, geo and vectors — so why ever pick a specialized database?',
        uk: 'Postgres уміє JSON, full-text, geo і vectors — то навіщо колись брати спеціалізовану базу?',
      },
      a: {
        en: 'For most workloads Postgres\' extensions are enough and far simpler — one system, one operational story, one backup. Specialized engines win at the extremes: billions of vectors with strict recall/latency targets, petabyte columnar analytics, globally distributed write scale, or deep graph traversals where index-free adjacency beats repeated joins. The decision weighs scale and access-pattern fit against the operational simplicity of staying on one engine.',
        uk: 'Для більшості навантажень extensions Postgres достатньо і значно простіше — одна система, одна операційна історія, один backup. Спеціалізовані движки перемагають на екстремумах: мільярди vectors зі строгими цілями recall/latency, петабайтна columnar-аналітика, глобально розподілений write scale чи глибокий обхід graph, де index-free adjacency бʼє повторні joins. Рішення зважує scale і відповідність access pattern проти операційної простоти життя на одному движку.',
      },
    },
  ],
  seeAlso: ['m1-what-is-a-database', 'm3-sql-vs-nosql', 'm4-relational-model', 'm35-choosing', 'm29-vector'],
  sources: [
    {
      title: 'DB-Engines Ranking — popularity of database management systems',
      url: 'https://db-engines.com/en/ranking',
    },
    {
      title: 'DB-Engines: PostgreSQL leads H1 2026 database growth (press release)',
      url: 'https://www.red-gate.com/our-company/newsroom/press-releases/db-engines-postgresql-leads-h1-2026-database-growth-as-data-platforms-gain-momentum/',
    },
    {
      title: 'Redgate — What are the top database platforms in 2026?',
      url: 'https://www.red-gate.com/simple-talk/databases/what-are-the-top-database-platforms-in-2026-a-look-at-the-latest-data/',
    },
    {
      title: 'PostgreSQL Documentation — What Is PostgreSQL?',
      url: 'https://www.postgresql.org/docs/current/intro-whatis.html',
    },
    {
      title: 'MongoDB — Version History (document model & transactions timeline)',
      url: 'https://www.mongodb.com/resources/products/mongodb-version-history',
    },
  ],
};
