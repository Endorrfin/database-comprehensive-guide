// M36 · Mental models gallery + glossary [middle] — S18 (the capstone: a one-page cheat-sheet)
// This module is the recap. It does not introduce new facts — it condenses the highest-value
// "pictures to recall" from across all 35 prior modules into one place, and points at the two
// standalone study surfaces (the Mental Models gallery at #/mental-models, the Glossary at
// #/glossary). All facts are re-statements verified in their home modules; sources below are the
// canonical primary references for the recapped tables (PostgreSQL 18 docs, Codd/Kent, CAP).
import type { Module } from '../types';

const m36: Module = {
  id:        'm36-mental-models',
  num:       36,
  section:   's8-mastery',
  order:     4,
  level:     'middle',
  readMins:  10,

  title:   { en: 'Mental models gallery + glossary', uk: 'Галерея ментальних моделей + глосарій' },
  tagline: {
    en: 'Every mental model to recall from memory, a bilingual glossary, and a one-page cheat-sheet.',
    uk: 'Кожна ментальна модель для пригадування з памʼяті, двомовний глосарій і шпаргалка на одну сторінку.',
  },

  mentalModel: {
    en: 'If you can redraw the picture from memory, you understand it.',
    uk: 'Якщо можете перемалювати картину з памʼяті — ви це розумієте.',
  },

  topics: [
    // ── Topic 1: how to use this ──────────────────────────────────────────
    {
      id:    'how-to-use',
      title: { en: 'How to use the mental models', uk: 'Як користуватися ментальними моделями' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "This is the capstone — the page to re-read before an interview or a design review. The whole guide is built on a simple idea: every module reduces to **one picture or one line you can recall from memory**, and if you can redraw that picture you understand the concept well enough to use it. Facts you can look up; mental models are what let you reason about a system you have never seen.\n\nTwo standalone surfaces support this, both reachable from the top navigation. The **Mental Models gallery** collects the one-line model from all 36 modules in one scrollable grid — read it, cover it, and try to reproduce each line and the diagram behind it. The **Glossary** is the bilingual term bank: every technical term stays English, with the explanation in your chosen language. Use the gallery for *recall* (can I produce this from memory?) and the glossary for *precision* (do I have the exact definition right?).\n\nThe rest of this module is a **condensed cheat-sheet** — the highest-value tables from across the guide, grouped so you can scan the whole landscape on one page: the access-cost and Big-O recap, the index-by-query-shape map, the normal forms, the ACID guarantees, the isolation × anomaly matrix, CAP/PACELC, and the family decision one-liners. Each is a compression of a full module; follow the cross-links when you need the depth behind a row.",
            uk: "Це капстоун — сторінка, яку варто перечитати перед співбесідою чи design review. Весь посібник побудований на простій ідеї: кожен модуль зводиться до **однієї картини чи одного рядка, які можна пригадати з памʼяті**, і якщо ви можете перемалювати цю картину — ви розумієте концепцію достатньо, щоб нею користуватися. Факти можна подивитися; ментальні моделі — це те, що дозволяє міркувати про систему, якої ви ніколи не бачили.\n\nДві окремі поверхні підтримують це, обидві доступні з верхньої навігації. **Галерея ментальних моделей** збирає однорядкову модель з усіх 36 модулів в одну прокручувану сітку — прочитайте, закрийте й спробуйте відтворити кожен рядок і діаграму за ним. **Глосарій** — це двомовний банк термінів: кожен технічний термін лишається англійською, з поясненням обраною мовою. Використовуйте галерею для *пригадування* (чи можу я відтворити це з памʼяті?), а глосарій — для *точності* (чи правильне в мене точне визначення?).\n\nРешта цього модуля — це **стиснута шпаргалка**: найцінніші таблиці з усього посібника, згруповані так, щоб ви могли охопити весь ландшафт на одній сторінці: recap access-cost і Big-O, мапа index-by-query-shape, нормальні форми, гарантії ACID, матриця isolation × anomaly, CAP/PACELC і однорядкові правила вибору родин. Кожна — стиснення цілого модуля; ідіть за cross-links, коли потрібна глибина за рядком.",
          },
        },
        {
          kind: 'figure',
          fig: 'guide-map',
          caption: {
            en: 'The guide at a glance: eight sections from the on-ramp to mastery. Each is one layer of how databases actually work — recall the one-line model behind each before moving on.',
            uk: 'Посібник з першого погляду: вісім розділів від входу до майстерності. Кожен — це один шар того, як насправді працюють бази даних — пригадайте однорядкову модель за кожним, перш ніж рухатись далі.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Recall beats re-reading', uk: 'Пригадування краще за перечитування' },
          md: {
            en: "The most efficient way to make these stick is active recall, not re-reading: look at a module title, try to draw its mental model and state its one rule from memory, then check against the gallery. Space the attempts out over days. Re-reading feels productive and mostly is not — the struggle to reproduce a diagram is what moves it into long-term memory. The gallery is built for exactly this drill.",
            uk: "Найефективніший спосіб закріпити це — активне пригадування, а не перечитування: подивіться на назву модуля, спробуйте намалювати його ментальну модель і сформулювати його одне правило з памʼяті, потім звірте з галереєю. Розподіляйте спроби на дні. Перечитування відчувається продуктивним, але переважно ні — саме боротьба за відтворення діаграми переносить її в довготривалу памʼять. Галерея створена саме для цього тренування.",
          },
        },
      ],
    },

    // ── Topic 2: cheat-sheet — data, storage & indexing ───────────────────
    {
      id:    'cheatsheet-storage',
      title: { en: 'Cheat-sheet — data, storage & indexing', uk: 'Шпаргалка — дані, зберігання та індекси' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The internals reduce to a handful of cost facts. A database is fast because the **right structure turns O(n) into O(log n)**: a sequential scan reads every page, a B-Tree finds a row in a few page reads, and the whole craft of indexing is matching the index type to the shape of the query. Below: the access-cost recap (M12–M14), the index-by-query-shape map (M14), and the normal forms that keep one fact in one place (M7).",
            uk: "Internals зводяться до жмені фактів про вартість. База швидка, бо **правильна структура перетворює O(n) на O(log n)**: sequential scan читає кожну page, B-Tree знаходить рядок за кілька читань page, і все мистецтво індексування — це зіставлення типу index із формою запиту. Нижче: recap access-cost (M12–M14), мапа index-by-query-shape (M14) і нормальні форми, що тримають один факт в одному місці (M7).",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Access cost — the structure decides the Big-O', uk: 'Вартість доступу — структура вирішує Big-O' },
          head: [
            { en: 'Operation', uk: 'Операція' },
            { en: 'Cost', uk: 'Вартість' },
            { en: 'Why', uk: 'Чому' },
          ],
          rows: [
            [
              { en: 'Sequential (heap) scan', uk: 'Sequential (heap) scan' },
              { en: 'O(n)', uk: 'O(n)' },
              { en: 'Reads every page — no shortcut', uk: 'Читає кожну page — без скорочення' },
            ],
            [
              { en: 'B-Tree equality / lookup', uk: 'B-Tree рівність / lookup' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'High fan-out → a few page reads (M13)', uk: 'Високий fan-out → кілька читань page (M13)' },
            ],
            [
              { en: 'B-Tree range scan', uk: 'B-Tree range scan' },
              { en: 'O(log n + k)', uk: 'O(log n + k)' },
              { en: 'Descend once, then walk linked leaves', uk: 'Спуск раз, потім хід звʼязаними leaves' },
            ],
            [
              { en: 'Hash index equality', uk: 'Hash index рівність' },
              { en: 'O(1) avg', uk: 'O(1) у серед.' },
              { en: 'Equality only — nothing ordered', uk: 'Лише рівність — нічого впорядкованого' },
            ],
            [
              { en: 'Index-only scan', uk: 'Index-only scan' },
              { en: 'O(log n), no heap', uk: 'O(log n), без heap' },
              { en: 'Answer from the leaf; visibility map (M14)', uk: 'Відповідь з leaf; visibility map (M14)' },
            ],
          ],
        },
        {
          kind: 'table',
          caption: { en: 'Index by query shape (M14)', uk: 'Index за формою запиту (M14)' },
          head: [
            { en: 'Query shape', uk: 'Форма запиту' },
            { en: 'Index', uk: 'Index' },
          ],
          rows: [
            [
              { en: 'Equality  ( = )', uk: 'Рівність  ( = )' },
              { en: 'B-Tree (or Hash)', uk: 'B-Tree (чи Hash)' },
            ],
            [
              { en: 'Range / ORDER BY', uk: 'Діапазон / ORDER BY' },
              { en: 'B-Tree (BRIN on huge ordered tables)', uk: 'B-Tree (BRIN на величезних упорядкованих)' },
            ],
            [
              { en: 'Containment @> (array / jsonb)', uk: 'Containment @> (array / jsonb)' },
              { en: 'GIN', uk: 'GIN' },
            ],
            [
              { en: 'Full-text search', uk: 'Full-text пошук' },
              { en: 'GIN on tsvector', uk: 'GIN на tsvector' },
            ],
            [
              { en: "Anchored prefix  LIKE 'a%'", uk: "Закріплений префікс  LIKE 'a%'" },
              { en: 'B-Tree (text_pattern_ops)', uk: 'B-Tree (text_pattern_ops)' },
            ],
            [
              { en: "Substring / fuzzy  '%a%'", uk: "Підрядок / fuzzy  '%a%'" },
              { en: 'Trigram (pg_trgm, GIN/GiST)', uk: 'Trigram (pg_trgm, GIN/GiST)' },
            ],
          ],
        },
        {
          kind: 'table',
          caption: { en: 'Normal forms — "the key, the whole key, and nothing but the key" (M7)', uk: 'Нормальні форми — «ключ, увесь ключ і нічого, крім ключа» (M7)' },
          head: [
            { en: 'Form', uk: 'Форма' },
            { en: 'Rule', uk: 'Правило' },
          ],
          rows: [
            [
              { en: '1NF', uk: '1NF' },
              { en: 'Atomic values; no repeating groups', uk: 'Атомарні значення; без повторюваних груп' },
            ],
            [
              { en: '2NF', uk: '2NF' },
              { en: '1NF + no partial dependency on part of a composite key', uk: '1NF + без часткової залежності від частини складеного ключа' },
            ],
            [
              { en: '3NF', uk: '3NF' },
              { en: '2NF + no transitive dependency (non-key → non-key)', uk: '2NF + без транзитивної залежності (non-key → non-key)' },
            ],
            [
              { en: 'BCNF', uk: 'BCNF' },
              { en: 'Every determinant is a candidate key', uk: 'Кожен детермінант — candidate key' },
            ],
          ],
        },
      ],
    },

    // ── Topic 3: cheat-sheet — transactions & concurrency ─────────────────
    {
      id:    'cheatsheet-transactions',
      title: { en: 'Cheat-sheet — transactions & concurrency', uk: 'Шпаргалка — транзакції та конкурентність' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Correctness under concurrency reduces to two pictures: the **ACID guarantees** (what a transaction promises) and the **isolation × anomaly matrix** (which anomalies each level still allows). The key subtlety, PostgreSQL-specific: PG never returns a dirty read, its Repeatable Read is actually Snapshot Isolation (so it also prevents phantoms), but Snapshot Isolation still permits **write-skew** — only Serializable (SSI) catches it (M17–M19).",
            uk: "Коректність під конкурентністю зводиться до двох картин: **гарантії ACID** (що обіцяє транзакція) і **матриця isolation × anomaly** (які аномалії кожен рівень ще дозволяє). Ключова тонкість, специфічна для PostgreSQL: PG ніколи не повертає dirty read, його Repeatable Read насправді Snapshot Isolation (тож також запобігає phantoms), але Snapshot Isolation усе ще допускає **write-skew** — лише Serializable (SSI) його ловить (M17–M19).",
          },
        },
        {
          kind: 'table',
          caption: { en: 'ACID — the four guarantees (M17)', uk: 'ACID — чотири гарантії (M17)' },
          head: [
            { en: 'Letter', uk: 'Літера' },
            { en: 'Guarantee', uk: 'Гарантія' },
            { en: 'Mechanism (PostgreSQL)', uk: 'Механізм (PostgreSQL)' },
          ],
          rows: [
            [
              { en: 'Atomicity', uk: 'Atomicity' },
              { en: 'All of a transaction, or none', uk: 'Уся транзакція або нічого' },
              { en: 'MVCC visibility + commit log (no undo log)', uk: 'MVCC visibility + commit log (без undo log)' },
            ],
            [
              { en: 'Consistency', uk: 'Consistency' },
              { en: 'Constraints hold before and after', uk: 'Constraints тримаються до й після' },
              { en: 'Constraints, FKs, triggers', uk: 'Constraints, FKs, triggers' },
            ],
            [
              { en: 'Isolation', uk: 'Isolation' },
              { en: 'Concurrent txns do not interfere', uk: 'Конкурентні txns не заважають' },
              { en: 'MVCC snapshots + isolation levels', uk: 'MVCC snapshots + isolation levels' },
            ],
            [
              { en: 'Durability', uk: 'Durability' },
              { en: 'Committed data survives a crash', uk: 'Закомічені дані переживають збій' },
              { en: 'Write-Ahead Log (WAL) fsync at commit', uk: 'Write-Ahead Log (WAL) fsync на commit' },
            ],
          ],
        },
        {
          kind: 'table',
          caption: { en: 'Isolation × anomaly in PostgreSQL — can occur / prevented (M18)', uk: 'Isolation × anomaly у PostgreSQL — можлива / запобігнено (M18)' },
          head: [
            { en: 'Anomaly', uk: 'Аномалія' },
            { en: 'Read Committed', uk: 'Read Committed' },
            { en: 'Repeatable Read (SI)', uk: 'Repeatable Read (SI)' },
            { en: 'Serializable (SSI)', uk: 'Serializable (SSI)' },
          ],
          rows: [
            [
              { en: 'Dirty read', uk: 'Dirty read' },
              { en: 'prevented*', uk: 'запобігнено*' },
              { en: 'prevented', uk: 'запобігнено' },
              { en: 'prevented', uk: 'запобігнено' },
            ],
            [
              { en: 'Non-repeatable read', uk: 'Non-repeatable read' },
              { en: 'can occur', uk: 'можлива' },
              { en: 'prevented', uk: 'запобігнено' },
              { en: 'prevented', uk: 'запобігнено' },
            ],
            [
              { en: 'Phantom read', uk: 'Phantom read' },
              { en: 'can occur', uk: 'можлива' },
              { en: 'prevented', uk: 'запобігнено' },
              { en: 'prevented', uk: 'запобігнено' },
            ],
            [
              { en: 'Lost update', uk: 'Lost update' },
              { en: 'can occur', uk: 'можлива' },
              { en: 'prevented (aborts, 40001)', uk: 'запобігнено (abort, 40001)' },
              { en: 'prevented', uk: 'запобігнено' },
            ],
            [
              { en: 'Write-skew', uk: 'Write-skew' },
              { en: 'can occur', uk: 'можлива' },
              { en: 'can occur', uk: 'можлива' },
              { en: 'prevented', uk: 'запобігнено' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'PostgreSQL is stricter than the SQL standard', uk: 'PostgreSQL суворіший за SQL-стандарт' },
          md: {
            en: "*PG maps Read Uncommitted to Read Committed, so it never returns a dirty read at any level. Its Repeatable Read is Snapshot Isolation and so also prevents phantom reads — stronger than the standard requires. The one anomaly Snapshot Isolation cannot stop is write-skew (two transactions each read an overlapping set and write disjoint rows, breaking an invariant across them); reach for Serializable (SSI) when an invariant spans rows. Always handle serialization failures (SQLSTATE 40001) with a retry loop.",
            uk: "*PG мапить Read Uncommitted на Read Committed, тож ніколи не повертає dirty read на жодному рівні. Його Repeatable Read — це Snapshot Isolation, тож також запобігає phantom reads — суворіше, ніж вимагає стандарт. Єдина аномалія, яку Snapshot Isolation не може спинити, — write-skew (дві транзакції кожна читає перетинний набір і пише непересічні рядки, ламаючи інваріант між ними); беріть Serializable (SSI), коли інваріант охоплює рядки. Завжди обробляйте serialization failures (SQLSTATE 40001) циклом повтору.",
          },
        },
      ],
    },

    // ── Topic 4: cheat-sheet — distribution & choosing ────────────────────
    {
      id:    'cheatsheet-distribution',
      title: { en: 'Cheat-sheet — distribution & choosing', uk: 'Шпаргалка — розподіл і вибір' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Once data leaves one node, two ideas govern everything. **CAP**: during a network partition you must choose Consistency or Availability — you cannot have both while partitioned. **PACELC** completes it: if Partitioned, choose A or C; Else (the normal case), choose Latency or Consistency. And the whole landscape collapses to one decision table: the family decision one-liners, which the M35 Database Picker turns into an interactive wizard.",
            uk: "Щойно дані залишають один вузол, усім керують дві ідеї. **CAP**: під час network partition ви мусите обрати Consistency чи Availability — обох під час partition мати не можна. **PACELC** доповнює: якщо Partitioned, обирайте A чи C; Else (звичайний випадок), обирайте Latency чи Consistency. І весь ландшафт згортається до однієї таблиці рішень: однорядкові правила вибору родин, які M35 Database Picker перетворює на інтерактивний wizard.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'CAP / PACELC — the partition and the normal case (M23)', uk: 'CAP / PACELC — partition і звичайний випадок (M23)' },
          head: [
            { en: 'Class', uk: 'Клас' },
            { en: 'Partition → / Else →', uk: 'Partition → / Else →' },
            { en: 'Example engines', uk: 'Приклади движків' },
          ],
          rows: [
            [
              { en: 'PA / EL', uk: 'PA / EL' },
              { en: 'Stay available, stale / favour latency', uk: 'Лишатись доступним, stale / на користь latency' },
              { en: 'Cassandra, DynamoDB, async PostgreSQL', uk: 'Cassandra, DynamoDB, async PostgreSQL' },
            ],
            [
              { en: 'PC / EC', uk: 'PC / EC' },
              { en: 'Refuse to diverge / favour consistency', uk: 'Відмова розходитись / на користь consistency' },
              { en: 'ZooKeeper, HBase, sync PostgreSQL', uk: 'ZooKeeper, HBase, sync PostgreSQL' },
            ],
          ],
        },
        {
          kind: 'table',
          caption: { en: 'Family decision one-liners — when to reach for each (M2, M25–M31, M35)', uk: 'Однорядкові правила вибору родин — коли брати кожну (M2, M25–M31, M35)' },
          head: [
            { en: 'Family', uk: 'Родина' },
            { en: 'Reach for it when…', uk: 'Беріть, коли…' },
            { en: 'Engines', uk: 'Движки' },
          ],
          rows: [
            [
              { en: 'Relational', uk: 'Relational' },
              { en: 'ACID, joins, ad-hoc queries — the default', uk: 'ACID, joins, ad-hoc запити — default' },
              { en: 'PostgreSQL', uk: 'PostgreSQL' },
            ],
            [
              { en: 'Document', uk: 'Document' },
              { en: 'Self-contained nested objects read whole', uk: 'Самодостатні вкладені обʼєкти, читані цілком' },
              { en: 'MongoDB', uk: 'MongoDB' },
            ],
            [
              { en: 'Key-value', uk: 'Key-value' },
              { en: 'Lowest-latency lookups, cache, queues', uk: 'Найнижча latency, кеш, черги' },
              { en: 'Redis · Valkey', uk: 'Redis · Valkey' },
            ],
            [
              { en: 'Wide-column', uk: 'Wide-column' },
              { en: 'Write-heavy, horizontal, tunable consistency', uk: 'Write-heavy, горизонтально, tunable consistency' },
              { en: 'Cassandra · ScyllaDB', uk: 'Cassandra · ScyllaDB' },
            ],
            [
              { en: 'Graph', uk: 'Graph' },
              { en: 'The relationships are the data; traversals', uk: 'Звʼязки і є даними; traversals' },
              { en: 'Neo4j', uk: 'Neo4j' },
            ],
            [
              { en: 'Vector', uk: 'Vector' },
              { en: 'Semantic similarity / RAG', uk: 'Семантична подібність / RAG' },
              { en: 'pgvector · Qdrant', uk: 'pgvector · Qdrant' },
            ],
            [
              { en: 'Time-series', uk: 'Time-series' },
              { en: 'Timestamped metrics, time-window queries', uk: 'Мітковані часом метрики, запити за вікном' },
              { en: 'TimescaleDB · InfluxDB', uk: 'TimescaleDB · InfluxDB' },
            ],
            [
              { en: 'Analytics / columnar', uk: 'Analytics / columnar' },
              { en: 'Big scans & aggregations (OLAP)', uk: 'Великі scans та агрегації (OLAP)' },
              { en: 'ClickHouse · DuckDB', uk: 'ClickHouse · DuckDB' },
            ],
            [
              { en: 'Search', uk: 'Search' },
              { en: 'Relevance-ranked full-text', uk: 'Full-text за релевантністю' },
              { en: 'Elasticsearch · Postgres FTS', uk: 'Elasticsearch · Postgres FTS' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The whole guide in one sentence', uk: 'Весь посібник в одному реченні' },
          md: {
            en: "Understand the internals — how data is stored, indexed, made transactional, and distributed — and the engine landscape stops being a list to memorise and becomes a set of trade-offs you can reason about. Then choosing well is the easy part: start from requirements, default to PostgreSQL, and add a specialist only for the one thing it does poorly. If you can redraw the pictures behind that sentence from memory, you have the mastery this guide set out to build.",
            uk: "Зрозумійте internals — як дані зберігаються, індексуються, стають транзакційними й розподіляються — і ландшафт движків перестає бути списком для зубріння і стає набором компромісів, про які ви можете міркувати. Тоді добре обрати — легка частина: починайте з вимог, беріть за default PostgreSQL і додавайте спеціаліста лише для тієї однієї речі, яку він робить погано. Якщо ви можете перемалювати картини за цим реченням з памʼяті — ви маєте майстерність, яку цей посібник мав на меті збудувати.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'A mental model is the one picture or line per module you can recall from memory; facts you look up, models let you reason. Use the Mental Models gallery for recall and the Glossary for precise definitions — both are in the top navigation.',
      uk: 'Ментальна модель — це одна картина чи рядок на модуль, які можна пригадати з памʼяті; факти ви дивитесь, моделі дають міркувати. Використовуйте галерею ментальних моделей для пригадування, а глосарій — для точних визначень — обидва у верхній навігації.',
    },
    {
      en: 'Storage in one line: the right structure turns O(n) into O(log n). A sequential scan reads every page; a B-Tree finds a row in a few; index-only scans answer from the leaf. Match the index type to the query shape (equality→B-Tree, containment/FTS→GIN, fuzzy→trigram).',
      uk: 'Зберігання в одному рядку: правильна структура перетворює O(n) на O(log n). Sequential scan читає кожну page; B-Tree знаходить рядок за кілька; index-only scans відповідають з leaf. Зіставляйте тип index із формою запиту (рівність→B-Tree, containment/FTS→GIN, fuzzy→trigram).',
    },
    {
      en: 'Transactions in one matrix: ACID = Atomicity, Consistency, Isolation, Durability. In PostgreSQL there is never a dirty read; Repeatable Read is Snapshot Isolation (also stops phantoms) but still allows write-skew — only Serializable (SSI) prevents it. Always retry on SQLSTATE 40001.',
      uk: 'Транзакції в одній матриці: ACID = Atomicity, Consistency, Isolation, Durability. У PostgreSQL ніколи немає dirty read; Repeatable Read — це Snapshot Isolation (також спиняє phantoms), але все ще допускає write-skew — лише Serializable (SSI) йому запобігає. Завжди повторюйте на SQLSTATE 40001.',
    },
    {
      en: 'Distribution in two ideas: CAP — during a partition choose Consistency or Availability; PACELC — Else (normal operation) choose Latency or Consistency. Cassandra/DynamoDB lean PA/EL; synchronous Postgres and ZooKeeper lean PC/EC.',
      uk: 'Розподіл у двох ідеях: CAP — під час partition обирайте Consistency чи Availability; PACELC — Else (звичайна робота) обирайте Latency чи Consistency. Cassandra/DynamoDB схиляються до PA/EL; синхронний Postgres і ZooKeeper — до PC/EC.',
    },
    {
      en: 'Choosing in one sentence: start from requirements, default to PostgreSQL, add a specialist only for the one thing it does poorly. The family decision one-liners (and the M35 Database Picker) collapse the whole landscape into that single move.',
      uk: 'Вибір в одному реченні: починайте з вимог, беріть за default PostgreSQL, додавайте спеціаліста лише для тієї однієї речі, яку він робить погано. Однорядкові правила вибору родин (і M35 Database Picker) згортають весь ландшафт у цей один крок.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Memorising facts instead of building models', uk: 'Зубріння фактів замість побудови моделей' },
      body: {
        en: 'Trying to remember a database as a list of features and version numbers does not survive contact with a real design problem. The durable knowledge is the mental model — the picture of how a B-Tree splits, how MVCC keeps readers from blocking writers, what CAP forces during a partition. Drill the pictures with active recall (cover the gallery, redraw from memory); look up the exact facts in the glossary or the home module when you need precision.',
        uk: 'Спроба памʼятати базу як список фіч і номерів версій не переживає зіткнення з реальною задачею дизайну. Тривке знання — це ментальна модель: картина того, як B-Tree розщеплюється, як MVCC утримує читачів від блокування записів, що CAP змушує під час partition. Тренуйте картини активним пригадуванням (закрийте галерею, перемалюйте з памʼяті); дивіться точні факти в глосарії чи домашньому модулі, коли потрібна точність.',
      },
    },
    {
      title: { en: 'Trusting a half-remembered isolation or CAP claim', uk: 'Довіра напівзгаданому твердженню про isolation чи CAP' },
      body: {
        en: 'The recap tables are precise for a reason: the commonly-repeated versions are often wrong. "Repeatable Read prevents phantoms" is false in the SQL standard but true in PostgreSQL; "Serializable is the same as Snapshot Isolation" is false — SI allows write-skew; "CAP means pick two of three" misstates it — partitions are not optional, so the real choice is C or A only while partitioned. When it matters, check the matrix here against the home module rather than your memory of a blog post.',
        uk: 'Recap-таблиці точні не випадково: широко повторювані версії часто хибні. «Repeatable Read запобігає phantoms» хибне в SQL-стандарті, але правдиве в PostgreSQL; «Serializable — те саме, що Snapshot Isolation» хибне — SI допускає write-skew; «CAP означає обрати два з трьох» спотворює його — partitions не опційні, тож справжній вибір — лише C чи A під час partition. Коли це важливо, звіряйте матрицю тут із домашнім модулем, а не з памʼяттю про допис у блозі.',
      },
    },
    {
      title: { en: 'Treating the cheat-sheet as a substitute for the modules', uk: 'Сприймати шпаргалку як заміну модулям' },
      body: {
        en: 'A one-page recap is for fast review once you already understand each row — it is not a shortcut to understanding. Each cell here is a compression of a full module of prose, diagrams, and an interactive simulator; reading only the table gives you the answer without the reasoning, which collapses the first time someone asks "why". Use the cheat-sheet to revise and the cross-linked modules to actually learn.',
        uk: 'Однсторінковий recap — для швидкого повторення, коли ви вже розумієте кожен рядок — це не скорочення до розуміння. Кожна комірка тут — стиснення цілого модуля прози, діаграм та інтерактивного симулятора; читання лише таблиці дає відповідь без міркування, що руйнується першого разу, коли хтось питає «чому». Використовуйте шпаргалку для повторення, а звʼязані модулі — щоб насправді вчитися.',
      },
    },
  ],

  interview: [
    {
      level: 'middle',
      q: { en: 'How do you actually retain this much material long-term?', uk: 'Як насправді утримати стільки матеріалу надовго?' },
      a: {
        en: "By converting each topic into one mental model and drilling it with active recall rather than re-reading. For every module I keep a single picture or sentence — a B-Tree finding a row in a few page reads, MVCC letting readers and writers not block each other, CAP forcing a choice during a partition — and I practise reproducing it from memory: look at the title, draw the diagram and state the one rule, then check against the gallery. Spacing those attempts over days is what moves them into long-term memory; re-reading feels productive but mostly is not. The glossary is the companion for precision — the exact definition of a term when the model alone is not enough. The cheat-sheet in this module is for fast revision once the models are in place, not a substitute for building them.",
        uk: "Перетворюючи кожну тему на одну ментальну модель і тренуючи її активним пригадуванням, а не перечитуванням. Для кожного модуля я тримаю одну картину чи речення — B-Tree знаходить рядок за кілька читань page, MVCC дає читачам і записувачам не блокувати одне одного, CAP змушує вибір під час partition — і практикую відтворення з памʼяті: дивлюсь на назву, малюю діаграму й формулюю одне правило, потім звіряю з галереєю. Розподіл цих спроб на дні — це те, що переносить їх у довготривалу памʼять; перечитування відчувається продуктивним, але переважно ні. Глосарій — супутник для точності: точне визначення терміна, коли самої моделі замало. Шпаргалка в цьому модулі — для швидкого повторення, коли моделі вже на місці, а не заміна їх побудові.",
      },
    },
    {
      level: 'senior',
      q: { en: 'Give the one-sentence summary of how databases work — and why it matters for choosing one.', uk: 'Дайте однореченнєве резюме того, як працюють бази — і чому це важливо для вибору.' },
      a: {
        en: "A database is fast and correct because of a few internals: data lives in fixed-size pages, the right index turns an O(n) scan into an O(log n) lookup, transactions get atomicity and durability from MVCC and the write-ahead log, isolation levels trade strictness for concurrency, and distribution forces CAP/PACELC trade-offs the moment data leaves one node. That matters for choosing because once you understand those trade-offs, the engine landscape stops being a list to memorise and becomes a map: each family is a different point on the same axes — consistency vs availability, read vs write optimisation, flexibility vs query power. So choosing well is just reading your workload onto that map: start from requirements, default to PostgreSQL because it covers most of the map competently, and add a specialist only for the one axis where your workload is extreme. The internals are what let you make that call from first principles instead of from a benchmark or a blog post.",
        uk: "База швидка й коректна завдяки кільком internals: дані живуть у pages фіксованого розміру, правильний index перетворює O(n) scan на O(log n) lookup, транзакції отримують atomicity і durability від MVCC та write-ahead log, isolation levels міняють суворість на конкурентність, а розподіл змушує CAP/PACELC-компроміси в мить, коли дані залишають один вузол. Це важливо для вибору, бо щойно ви розумієте ці компроміси, ландшафт движків перестає бути списком для зубріння й стає мапою: кожна родина — інша точка на тих самих осях — consistency проти availability, оптимізація читань проти записів, гнучкість проти потужності запитів. Тож добре обрати — це просто накласти ваш workload на цю мапу: починайте з вимог, беріть за default PostgreSQL, бо він компетентно покриває більшість мапи, і додавайте спеціаліста лише для тієї однієї осі, де ваш workload екстремальний. Internals — це те, що дозволяє ухвалити це рішення від перших принципів, а не з benchmark чи допису в блозі.",
      },
    },
    {
      level: 'staff',
      q: { en: 'You are mentoring an engineer who memorises trivia but freezes on system-design questions. What do you change?', uk: 'Ви менторите інженера, який зубрить дрібниці, але завмирає на питаннях system design. Що ви змінюєте?' },
      a: {
        en: "I shift them from memorising facts to building and using mental models, because the freeze is a sign they have details without the structure those details hang on. Concretely: for each area, I have them reduce it to one picture they can draw — how a B-Tree splits, how MVCC versions a row, what a partition forces under CAP — and then defend a design decision out loud starting from that picture, not from a remembered fact. I push active recall over re-reading: cover the material, reproduce the diagram, check, repeat spaced over days. Then I make them practise the move that system design actually tests — reasoning from requirements to a trade-off: given this workload, what does it need on each axis, what is the boring default, and what single thing justifies deviating. The trivia becomes useful only once it is attached to a model; the goal is an engineer who can derive an answer to a question they have never seen, which is exactly what the mental-model approach trains and rote memorisation does not. The gallery and this cheat-sheet are the drill surface; the home modules with their simulators are where the models actually form.",
        uk: "Я переводжу їх із зубріння фактів на побудову й використання ментальних моделей, бо завмирання — ознака того, що в них є деталі без структури, на якій ці деталі тримаються. Конкретно: для кожної області я прошу звести її до однієї картини, яку можна намалювати — як B-Tree розщеплюється, як MVCC версіонує рядок, що partition змушує під CAP — і потім захистити рішення дизайну вголос, починаючи з цієї картини, а не зі згаданого факту. Я наполягаю на активному пригадуванні замість перечитування: закрий матеріал, відтвори діаграму, звір, повтори з розподілом на дні. Потім змушую практикувати саме той крок, який system design насправді перевіряє — міркування від вимог до компромісу: маючи цей workload, що йому потрібно на кожній осі, який нудний default і яка одна річ виправдовує відхилення. Дрібниці стають корисними лише коли прикріплені до моделі; мета — інженер, який може вивести відповідь на питання, якого ніколи не бачив, а це саме те, що тренує підхід ментальних моделей і не дає зубріння. Галерея й ця шпаргалка — поверхня для тренування; домашні модулі з їхніми симуляторами — там, де моделі насправді формуються.",
      },
    },
  ],

  seeAlso: ['m35-choosing', 'm2-landscape', 'm13-btree', 'm17-acid-wal'],

  sources: [
    { title: 'PostgreSQL 18 docs — Transaction Isolation (Table 13.1)', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
    { title: 'PostgreSQL 18 docs — Indexes (Chapter 11)', url: 'https://www.postgresql.org/docs/current/indexes.html' },
    { title: 'PostgreSQL 18 docs — Reliability and the Write-Ahead Log', url: 'https://www.postgresql.org/docs/current/wal-intro.html' },
    { title: 'Kent 1983 — A Simple Guide to Five Normal Forms', url: 'https://dl.acm.org/doi/10.1145/358024.358054' },
    { title: 'Gilbert & Lynch 2002 — Brewer\'s conjecture (CAP, formal proof)', url: 'https://dl.acm.org/doi/10.1145/564585.564601' },
    { title: 'Use The Index, Luke! — how indexing really works', url: 'https://use-the-index-luke.com/' },
  ],
};

export default m36;
