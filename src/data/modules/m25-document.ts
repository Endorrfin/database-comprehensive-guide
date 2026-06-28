import type { Module } from '../types';

/*
 * M25 · Document databases — Section VI (S13). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-25 (see `sources`).
 *
 * MongoDB version facts (verified 2026-06-25 via mongodb.com):
 *  - Latest stable: MongoDB 8.3 (released May 7, 2026). Delivers security hardening,
 *    availability + performance improvements, expanded query expressions (type coercion,
 *    string manipulation). The 8.x line is the current major version.
 *  - MongoDB 8.0 (Sept 2024): 45+ improvements over 7; better throughput, faster bulk &
 *    concurrent writes, queryable encryption GA, native Atlas Vector Search (HNSW).
 *  - Multi-document ACID transactions:
 *      4.0 (June 2018) — single replica set.
 *      4.2 (Aug 2019) — sharded clusters; retryable writes GA.
 *  - BSON: Binary JSON; types: Double, String, Object, Array, Binary, ObjectId (12-byte),
 *    Boolean, Date, Null, Regex, Int32, Timestamp, Int64, Decimal128, MinKey/MaxKey.
 *
 * WiredTiger storage engine (verified 2026-06-25, MongoDB docs + wiredtiger.com):
 *  - Default storage engine since MongoDB 3.0 (March 2015).
 *  - Data structures: B-tree (B+Tree variant) for both collections and indexes. All data at
 *    leaf level; linked leaf pages for range scans.
 *  - Concurrency: MVCC — document-level concurrency, no collection-level locking.
 *  - Compression (per-collection or global setting):
 *      Snappy  (default for collections) — fast, moderate ratio.
 *      Zlib    — better ratio, slower.
 *      Zstd    (MongoDB 4.2+) — best balance.
 *      None    — for indexes by default; collection can opt in.
 *  - Durability: journal (WAL) + checkpoint every 60 s (configurable). Journal replays on
 *    crash recovery to the last checkpoint (same redo-log principle as PG WAL).
 *  - Cache size: defaults to 50% of (RAM − 1 GB) or 256 MB, whichever is larger. Both the
 *    WiredTiger cache (evicts dirty data) AND the OS page cache are utilised.
 *  - oplog: a capped collection inside the local database; the replication log (not WiredTiger
 *    internals). A replica-set secondary tails the primary's oplog.
 *
 * Indexing (verified, MongoDB docs):
 *  - Default _id index on every collection (unique).
 *  - Single-field, compound (left-to-right prefix rule), multikey (array fields, one
 *    indexed per document), text (full-text, stemmed), geospatial (2d / 2dsphere), hashed
 *    (shard key equality), wildcard, sparse, partial, TTL (auto-delete by date field).
 *  - EXPLAIN("executionStats") to view winning plan + rejected candidates.
 *  - index intersection: planner can AND two indexes; less common than PG bitmap scan.
 *
 * Aggregation pipeline (verified, MongoDB docs):
 *  - $match (filter) → $group (accumulate) → $project (reshape) → $sort → $limit/$skip
 *  - $lookup (left outer join between collections, like SQL LEFT JOIN — added 3.2)
 *  - $unwind (flatten array field into multiple documents)
 *  - $addFields / $set (add/overwrite fields, non-destructive)
 *  - $bucket / $bucketAuto (histogram), $facet (multi-faceted aggregations in one pass)
 *  - $unionWith (union two pipelines — like SQL UNION ALL)
 *  - $merge / $out (materialise pipeline result into a collection)
 *  - Atlas Search / Atlas Vector Search stages: $search, $vectorSearch (since MongoDB 6.0.3 / 8.0).
 *  - Best practice: $match as early as possible; $project early to cut document size; create
 *    indexes on $match and $sort fields; use $limit before $sort where semantics permit.
 *
 * Embed vs reference decision (verified, MongoDB docs "Data Modelling"):
 *  Embed when: data is read together, 1:1 or 1:few, child never queried independently,
 *    document stays < 16 MB (max document size), bounded sub-arrays.
 *  Reference when: 1:many (many = thousands), M:N, child queried independently,
 *    large arrays that would bloat the parent, normalisation needed for consistency.
 *  Hybrid: embed hot fields (e.g. latest 3 comments) + reference the rest.
 *
 * Replica set (verified, MongoDB docs):
 *  - 3+ members: 1 primary (all writes), ≥ 1 secondary (tails oplog), 1 optional arbiter.
 *  - Write concern: w:1 (primary ack), w:"majority" (quorum ack), w:0 (fire-and-forget).
 *  - Read concern: local (default), majority, linearizable.
 *  - Election: Raft-influenced protocol; majority of voting members elect new primary on failure.
 *
 * Non-signature module: figures-only per locked plan (§6). Figure: 'embed-vs-reference'.
 * MongoDB stable: 8.3 (May 7, 2026).
 */
export const m25: Module = {
  id: 'm25-document',
  num: 25,
  section: 's6-nosql',
  order: 1,
  level: 'middle',
  signature: false,
  title: { en: 'Document databases', uk: 'Document databases' },
  tagline: {
    en: "MongoDB's model & internals, embed vs reference, the aggregation pipeline.",
    uk: 'Модель і внутрішня будова MongoDB, embed проти reference, aggregation pipeline.',
  },
  readMins: 13,
  mentalModel: {
    en: 'Store together what you read together — the document is your access pattern.',
    uk: 'Зберігайте разом те, що читаєте разом — document і є вашим access pattern.',
  },
  topics: [
    // ── Topic 1: The document model ───────────────────────────────────────
    {
      id: 'document-model',
      title: { en: 'The document model — BSON, collections, flexible schema', uk: 'Модель document — BSON, collections, flexible schema' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **document database** stores records as self-describing, nested data objects rather than as rows spread across many tables. MongoDB, the dominant document store (latest stable: **8.3, released May 7, 2026**), uses **BSON** (Binary JSON) — a binary encoding that extends JSON with typed values: `ObjectId` (the default 12-byte primary key), `Decimal128` (for exact numeric values), `Date`, `Regex`, and more.\n\nDocuments live in **collections** — analogous to tables, but without an enforced column schema. Two documents in the same collection can have entirely different fields; the database does not reject either. This is called **schema-on-read**: the application, not the database, validates shape.\n\nA document can contain nested documents and arrays, which is the key structural difference from a relational row:\n\n```json\n{\n  \"_id\": ObjectId(\"…\"),\n  \"name\": \"Alice\",\n  \"address\": { \"city\": \"Kyiv\", \"zip\": \"01001\" },\n  \"orders\": [\n    { \"id\": 1001, \"total\": 49.99, \"status\": \"shipped\" },\n    { \"id\": 1002, \"total\": 12.50, \"status\": \"pending\" }\n  ]\n}\n```\n\nFetching this user and their recent orders is **one read of one document** — no join required. That locality is the core value proposition. The trade-off is that the same data may live in multiple documents, so updates to shared facts become your responsibility.",
            uk: "**Document database** зберігає записи як самоописові вкладені обʼєкти даних, а не як рядки, розкидані по багатьох таблицях. MongoDB — домінантне document-сховище (найновіша стабільна версія: **8.3, випущена 7 травня 2026 р.**) — використовує **BSON** (Binary JSON): бінарне кодування, що розширює JSON типізованими значеннями: `ObjectId` (стандартний 12-байтний primary key), `Decimal128` (для точних числових значень), `Date`, `Regex` тощо.\n\nDocuments зберігаються у **collections** — аналог таблиць, але без примусової схеми колонок. Два documents у одній collection можуть мати повністю різні поля; база даних не відхиляє жодного. Це називається **schema-on-read**: застосунок, а не база даних, перевіряє форму.\n\nDocument може містити вкладені documents і масиви — це ключова структурна відмінність від реляційного рядка:\n\n```json\n{\n  \"_id\": ObjectId(\"…\"),\n  \"name\": \"Alice\",\n  \"address\": { \"city\": \"Kyiv\", \"zip\": \"01001\" },\n  \"orders\": [\n    { \"id\": 1001, \"total\": 49.99, \"status\": \"shipped\" },\n    { \"id\": 1002, \"total\": 12.50, \"status\": \"pending\" }\n  ]\n}\n```\n\nОтримати цього користувача з його замовленнями — це **одне читання одного document** — жодних join. Саме ця локальність є ключовою цінністю. Компроміс: одні й ті самі дані можуть існувати у кількох documents, тому оновлення спільних фактів стає вашою відповідальністю.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Flexible schema ≠ no schema', uk: 'Flexible schema ≠ відсутність schema' },
          md: {
            en: 'MongoDB 3.6+ supports **schema validation** via `$jsonSchema` validators on a collection. Production systems should always enforce a minimum shape — not for rigidity, but to catch bugs early. Schema-on-read without validation is a debugging nightmare at scale.',
            uk: 'MongoDB 3.6+ підтримує **schema validation** через `$jsonSchema` validator на collection. Продакшн-системи завжди повинні enforced мінімальну форму — не для жорсткості, а щоб ловити помилки рано. Schema-on-read без validation — це налагоджувальний кошмар у масштабі.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'BSON type', uk: 'BSON тип' },
            { en: 'Use case', uk: 'Використання' },
            { en: 'Note', uk: 'Примітка' },
          ],
          rows: [
            [
              { en: 'ObjectId', uk: 'ObjectId' },
              { en: 'Default _id: 12-byte = 4 timestamp + 5 random + 3 counter', uk: 'Стандартний _id: 12 байт = 4 timestamp + 5 random + 3 counter' },
              { en: 'Monotone within a second; sortable by insertion time', uk: 'Монотонний у межах секунди; сортується за часом вставки' },
            ],
            [
              { en: 'Decimal128', uk: 'Decimal128' },
              { en: 'Money, scientific values requiring exact decimal arithmetic', uk: 'Гроші, наукові значення з точною десятковою арифметикою' },
              { en: 'Use instead of Double for financial data (avoids float errors)', uk: 'Використовуйте замість Double для фінансових даних (уникає float-помилок)' },
            ],
            [
              { en: 'Date', uk: 'Date' },
              { en: 'Timestamps, created_at / updated_at', uk: 'Мітки часу, created_at / updated_at' },
              { en: '64-bit milliseconds since epoch; always store UTC', uk: '64-бітні мілісекунди від epoch; завжди зберігайте UTC' },
            ],
            [
              { en: 'Array', uk: 'Array' },
              { en: 'Tags, embedded sub-documents, multi-valued fields', uk: 'Теги, вбудовані sub-documents, багатозначні поля' },
              { en: 'Multikey index indexes each array element separately', uk: 'Multikey index індексує кожен елемент масиву окремо' },
            ],
            [
              { en: 'Binary (BinData)', uk: 'Binary (BinData)' },
              { en: 'Encrypted fields, raw bytes, UUIDs', uk: 'Зашифровані поля, raw bytes, UUID-и' },
              { en: 'Queryable Encryption (MongoDB 7.0+) stores encrypted BinData', uk: 'Queryable Encryption (MongoDB 7.0+) зберігає зашифровані BinData' },
            ],
          ],
          caption: { en: 'Key BSON types and their use cases.', uk: 'Ключові BSON-типи та їхнє призначення.' },
        },
      ],
    },

    // ── Topic 2: Embed vs reference ───────────────────────────────────────
    {
      id: 'embed-vs-reference',
      title: { en: 'Embed vs reference — model for the access pattern', uk: 'Embed проти reference — моделюйте для access pattern' },
      blocks: [
        {
          kind: 'figure',
          fig: 'embed-vs-reference',
          caption: {
            en: 'Left: normalized relational schema (3 tables, 2 JOINs). Right: embedded MongoDB document (1 read). The trade-off: locality vs updatability of shared data.',
            uk: 'Зліва: нормалізована реляційна схема (3 таблиці, 2 JOINs). Справа: вбудований MongoDB document (1 читання). Компроміс: локальність проти оновлюваності спільних даних.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The most important design decision in a document database is **where to put related data**: inside the parent document (**embedding**) or in a separate collection linked by an id (**referencing**). Unlike the relational world, where normalization has clear rules (1NF → BCNF), the document world has no universally correct answer — only trade-offs.\n\n**Embed when:**\n- You read the parent and child together almost always (e.g. a blog post and its 3 latest comments).\n- The relationship is 1:1 or 1:few (bounded sub-array, not thousands).\n- The child document is never queried independently — it has no life of its own.\n- Embedding keeps the total document under ~16 MB (MongoDB's hard limit).\n\n**Reference when:**\n- The relationship is 1:many-large (thousands of orders per customer) — embedding grows without bound.\n- Many-to-many (M:N) — the same entity relates to many others; duplication would be extreme.\n- The child entity is queried independently and updated frequently.\n- Multiple parents share the same child (e.g. a product referenced by many orders).\n\n**The hybrid pattern:** embed the hot fields (most-read attributes + a small bounded slice of the child array) and store a reference for the rest. A product document might embed the current price and stock status, while full pricing history lives in a `price_history` collection.",
            uk: "Найважливіше рішення дизайну у document database — **де розмістити повʼязані дані**: всередині батьківського document (**embedding**) або в окремій collection, повʼязаній через id (**referencing**). На відміну від реляційного світу, де нормалізація має чіткі правила (1NF → BCNF), у document-світі немає універсально правильної відповіді — лише компроміси.\n\n**Embed, коли:**\n- Батьківський і дочірній документ читаються разом майже завжди (наприклад, пост блогу та його 3 останні коментарі).\n- Відношення 1:1 або 1:few (обмежений sub-array, не тисячі).\n- Дочірній document ніколи не запитується незалежно — він не має самостійного існування.\n- Embedding тримає загальний розмір document в межах ~16 МБ (жорсткий ліміт MongoDB).\n\n**Reference, коли:**\n- Відношення 1:many-large (тисячі замовлень на клієнта) — embedding зростає безмежно.\n- Багато-до-багатьох (M:N) — одна сутність повʼязана з багатьма; дублювання було б надмірним.\n- Дочірня сутність запитується незалежно і часто оновлюється.\n- Кілька батьків посилаються на один і той же child (наприклад, product у багатьох orders).\n\n**Гібридний патерн:** вбудовуйте hot-поля (найбільш читані атрибути + невеликий обмежений зріз дочірнього масиву) і зберігайте reference для решти. Document продукту може вбудовувати поточну ціну та статус запасів, тоді як повна історія цін зберігається у collection `price_history`.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Embed', uk: 'Embed' },
          b: { en: 'Reference', uk: 'Reference' },
          rows: [
            [
              { en: 'Read performance', uk: 'Продуктивність читання' },
              { en: 'Excellent — one document fetch', uk: 'Відмінна — одне завантаження document' },
              { en: 'Requires $lookup or app-level join (extra round-trip)', uk: 'Потребує $lookup або join на рівні застосунку (зайвий round-trip)' },
            ],
            [
              { en: 'Write / update', uk: 'Запис / оновлення' },
              { en: 'Update every parent that embeds the shared fact', uk: "Оновлюйте кожного батька, що вбудовує спільний факт" },
              { en: 'Update in one place; all parents see it via the id', uk: 'Оновлення в одному місці; всі батьки бачать через id' },
            ],
            [
              { en: 'Relationship cardinality', uk: 'Cardinality відношення' },
              { en: 'Best for 1:1 or 1:few (bounded arrays)', uk: 'Найкраще для 1:1 або 1:few (обмежені масиви)' },
              { en: 'Required for 1:many-large, M:N', uk: 'Необхідний для 1:many-large, M:N' },
            ],
            [
              { en: 'Document size', uk: 'Розмір document' },
              { en: 'Grows with children; hard limit 16 MB', uk: 'Зростає разом з children; жорсткий ліміт 16 МБ' },
              { en: 'Parent stays small; children can be arbitrary', uk: 'Батько залишається малим; children можуть бути довільними' },
            ],
            [
              { en: 'Independent access', uk: 'Незалежний доступ' },
              { en: 'Child cannot be queried without the parent context', uk: 'Child не може бути запитаний без контексту батька' },
              { en: 'Child has its own _id and is queryable on its own', uk: 'Child має власний _id та доступний для запиту самостійно' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'The unbounded array anti-pattern', uk: 'Анти-патерн unbounded array' },
          md: {
            en: 'Embedding an array that grows without limit (e.g. all comments on a post, all events for a user) eventually pushes documents past MongoDB\'s **16 MB limit** and causes performance degradation as the array is partially returned on every read. Use a reference collection with a `parent_id` index for any 1:many-large relationship.',
            uk: "Вбудовування масиву, що зростає без ліміту (наприклад, всі коментарі до поста, всі події користувача), з часом перевищить **ліміт MongoDB у 16 МБ** і спричинить деградацію продуктивності, оскільки масив частково повертається при кожному читанні. Для будь-якого відношення 1:many-large використовуйте reference-collection з індексом по `parent_id`.",
          },
        },
      ],
    },

    // ── Topic 3: Indexing & the aggregation pipeline ──────────────────────
    {
      id: 'indexing-aggregation',
      title: { en: 'Indexing & the aggregation pipeline', uk: 'Indexing та aggregation pipeline' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "MongoDB indexes use the same **B+Tree** structure as PostgreSQL. The `_id` field is automatically indexed (unique) on every collection. Beyond that, you create indexes explicitly:\n\n- **Single-field** — index on one field (or a nested path like `address.city`).\n- **Compound** — left-to-right prefix rule: `{ status: 1, createdAt: -1 }` supports queries filtering by `status`, or by `status` + `createdAt`, but not by `createdAt` alone.\n- **Multikey** — when you index an array field, MongoDB creates an entry for each array element. One `_id` can produce many index entries. At most one multikey field per compound index.\n- **Text** — full-text index with stemming and stop-word removal; one per collection; `$text` operator.\n- **TTL** — index on a `Date` field that automatically deletes documents after a specified number of seconds. Great for session tokens, audit logs, ephemeral data.\n- **Partial** — only indexes documents matching a filter expression; smaller index, faster writes.\n- **Wildcard** — indexes all fields (or a sub-tree) matching a pattern; for highly dynamic schemas.\n\nThe **aggregation pipeline** is MongoDB's primary analytics and transformation tool — the equivalent of SQL's `SELECT`, `GROUP BY`, `JOIN`, and `WINDOW` in a composable stage model. Each stage transforms the stream of documents:",
            uk: "MongoDB-індекси використовують ту саму структуру **B+Tree**, що і PostgreSQL. Поле `_id` автоматично індексується (унікально) у кожній collection. Інші індекси створюються явно:\n\n- **Single-field** — індекс по одному полю (або вкладеному шляху, наприклад `address.city`).\n- **Compound** — правило лівого префіксу: `{ status: 1, createdAt: -1 }` підтримує запити з фільтром по `status`, або `status` + `createdAt`, але не лише по `createdAt`.\n- **Multikey** — коли індексується масивне поле, MongoDB створює запис для кожного елемента масиву. Один `_id` може давати багато записів індексу. Щонайбільше одне multikey-поле в compound index.\n- **Text** — повнотекстовий індекс зі stemming і видаленням стоп-слів; один на collection; оператор `$text`.\n- **TTL** — індекс по полю `Date`, що автоматично видаляє documents після певної кількості секунд. Чудово для session-токенів, audit-логів, ефемерних даних.\n- **Partial** — індексує лише documents, що відповідають filter-виразу; менший індекс, швидкіший запис.\n- **Wildcard** — індексує всі поля (або гілку) за шаблоном; для динамічних схем.\n\n**Aggregation pipeline** — основний аналітичний та трансформаційний інструмент MongoDB — еквівалент SQL `SELECT`, `GROUP BY`, `JOIN` і `WINDOW` у компонованій моделі stages. Кожна stage перетворює потік documents:",
          },
        },
        {
          kind: 'code',
          lang: 'javascript',
          code: `// Aggregation pipeline: total revenue per product category in the last 30 days
db.orders.aggregate([
  // Stage 1: filter early — only shipped orders in the last 30 days
  { $match: {
      status:    "shipped",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }},
  // Stage 2: flatten the embedded line_items array (one doc per item)
  { $unwind: "$line_items" },
  // Stage 3: join to the products collection to get the category
  { $lookup: {
      from:         "products",
      localField:   "line_items.product_id",
      foreignField: "_id",
      as:           "product"
  }},
  { $unwind: "$product" },
  // Stage 4: group by category and sum revenue
  { $group: {
      _id:          "$product.category",
      totalRevenue: { $sum: { $multiply: ["$line_items.qty", "$line_items.price"] } },
      orderCount:   { $sum: 1 }
  }},
  // Stage 5: sort descending by revenue, take the top 10
  { $sort:  { totalRevenue: -1 }},
  { $limit: 10 },
  // Stage 6: reshape the output
  { $project: {
      category:     "$_id",
      totalRevenue: { $round: ["$totalRevenue", 2] },
      orderCount:   1,
      _id:          0
  }}
])`,
          note: {
            en: 'Place $match and $project as early as possible. EXPLAIN the pipeline to confirm index usage on $match fields.',
            uk: 'Розміщуйте $match і $project якомога раніше. Запустіть EXPLAIN для pipeline, щоб підтвердити використання index на полях $match.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'EXPLAIN the pipeline, not just the query', uk: 'EXPLAIN для pipeline, не лише для query' },
          md: {
            en: 'Run `db.collection.explain("executionStats").aggregate([…])` to see the winning plan, rejected candidates, and whether a `COLLSCAN` (full-collection scan) slipped past your `$match`. Pay attention to `nReturned` vs `totalDocsExamined` — a large ratio signals a missing index.',
            uk: 'Запускайте `db.collection.explain("executionStats").aggregate([…])`, щоб побачити winning plan, відхилені кандидати та чи проскочив `COLLSCAN` (повне сканування collection) попри ваш `$match`. Зверніть увагу на `nReturned` vs `totalDocsExamined` — велике співвідношення сигналізує про відсутній index.',
          },
        },
      ],
    },

    // ── Topic 4: Transactions, consistency & WiredTiger internals ─────────
    {
      id: 'transactions-internals',
      title: { en: 'Transactions, consistency & internals', uk: 'Transactions, consistency і внутрішня будова' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**WiredTiger** is MongoDB's default storage engine since version 3.0 (2015). Its key characteristics:\n\n- **MVCC concurrency** — document-level multi-version concurrency control; readers never block writers and vice-versa. This mirrors PostgreSQL's MVCC model, with WiredTiger maintaining version chains per document.\n- **Compression** — Snappy by default for collection data (fast, moderate ratio); Zlib for better compression; Zstd (MongoDB 4.2+) for the best balance. Compression saves I/O at the cost of CPU.\n- **Durability** — an in-memory write-back cache + a journal (WAL). Changes hit the journal immediately (fsync by default). A **checkpoint** is taken every 60 seconds, writing all dirty cache pages to the data files and creating a consistent recovery point. On crash, the journal is replayed from the last checkpoint.\n- **Cache sizing** — WiredTiger defaults to `50% × (RAM − 1 GB)` or 256 MB, whichever is larger. *Both* WiredTiger cache and the OS page cache serve reads; the OS cache is extra for free. Oversizing WT cache leaves less room for the OS cache, which can hurt performance.\n\n**Multi-document ACID transactions** were added in two steps:\n- **MongoDB 4.0 (June 2018)** — single replica set: `session.startTransaction()` → … → `session.commitTransaction()` with full ACID semantics.\n- **MongoDB 4.2 (Aug 2019)** — sharded clusters: the coordinator uses 2PC (two-phase commit) across shards, with the same retryable write infrastructure as replica sets.\n\nMongoDB transactions are intentionally heavier than single-document operations. **Prefer single-document atomicity** (within one document, writes are always atomic by MVCC) wherever possible; reach for multi-document transactions only when multiple collections or documents truly must change together.",
            uk: "**WiredTiger** — стандартний storage engine MongoDB з версії 3.0 (2015 р.). Його ключові характеристики:\n\n- **MVCC concurrency** — document-рівневий multi-version concurrency control; читачі ніколи не блокують записувачів і навпаки. Це нагадує модель MVCC у PostgreSQL: WiredTiger підтримує version chains для кожного document.\n- **Compression** — Snappy за замовчуванням для даних collection (швидко, помірне стиснення); Zlib для кращого стиснення; Zstd (MongoDB 4.2+) — найкращий баланс. Compression зменшує I/O ціною CPU.\n- **Durability** — in-memory write-back cache + журнал (WAL). Зміни потрапляють у журнал негайно (fsync за замовчуванням). **Checkpoint** робиться кожні 60 секунд: всі dirty pages cache записуються у data-файли, створюючи консистентну точку відновлення. Після збою журнал відтворюється з останнього checkpoint.\n- **Cache sizing** — WiredTiger за замовчуванням `50% × (RAM − 1 ГБ)` або 256 МБ, залежно від того, що більше. *Обидва* — WiredTiger cache і OS page cache — обслуговують читання; OS cache — додатковий безкоштовно. Надмірне збільшення WT cache залишає менше місця для OS cache, що може погіршити продуктивність.\n\n**Multi-document ACID transactions** були додані у два кроки:\n- **MongoDB 4.0 (червень 2018 р.)** — single replica set: `session.startTransaction()` → … → `session.commitTransaction()` з повною ACID-семантикою.\n- **MongoDB 4.2 (серпень 2019 р.)** — sharded clusters: координатор використовує 2PC (two-phase commit) між шардами з тією самою інфраструктурою retryable write, що і replica sets.\n\nTransactions у MongoDB навмисно важчі за single-document операції. **Надавайте перевагу single-document atomicity** (в межах одного document записи завжди атомарні через MVCC) де можливо; використовуйте multi-document transactions лише тоді, коли кілька collections або documents справді мають змінюватися разом.",
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Write concern', uk: 'Write concern' },
            { en: 'Meaning', uk: 'Значення' },
            { en: 'Durability', uk: 'Durability' },
          ],
          rows: [
            [
              { en: 'w: 0 (unacknowledged)', uk: 'w: 0 (unacknowledged)' },
              { en: 'Fire and forget — no ack', uk: 'Fire and forget — без підтвердження' },
              { en: 'None — may be lost on crash', uk: 'Відсутня — може бути втрачений при збої' },
            ],
            [
              { en: 'w: 1 (default)', uk: 'w: 1 (за замовчуванням)' },
              { en: 'Primary acknowledges the write', uk: 'Primary підтверджує запис' },
              { en: 'Durable on primary if journal=true (default)', uk: 'Довговічний на primary, якщо journal=true (за замовчуванням)' },
            ],
            [
              { en: 'w: "majority"', uk: 'w: "majority"' },
              { en: 'Majority of voting nodes acknowledge', uk: 'Більшість voting nodes підтверджують' },
              { en: 'Survives a primary failure; safe for critical data', uk: 'Витримує відмову primary; безпечно для критичних даних' },
            ],
          ],
          caption: { en: 'MongoDB write-concern levels and their durability guarantees.', uk: 'Рівні write-concern MongoDB та їхні гарантії durability.' },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'w: "majority" is the safe default for critical writes', uk: 'w: "majority" — безпечне значення за замовчуванням для критичних записів' },
          md: {
            en: 'With the default `w: 1`, a write acknowledged by the primary may not yet be replicated. If the primary fails before replication, the write is **lost without notification** — the driver received an ack, but the data rolled back during election. Use `w: "majority"` for any financially or safety-critical write.',
            uk: 'З типовим `w: 1`, запис, підтверджений primary, може ще не бути реплікованим. Якщо primary відмовляє до реплікації, запис **загубиться без попередження** — драйвер отримав підтвердження, але дані відкотилися під час вибору primary. Використовуйте `w: "majority"` для будь-якого фінансово або критично важливого запису.',
          },
        },
      ],
    },

    // ── Topic 5: When document fits — and when you're not ─────────────────
    {
      id: 'when-document-fits',
      title: { en: "When document fits — and when you're hiding a relational model", uk: 'Коли document підходить — і коли ви приховуєте реляційну модель' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The document model excels for a specific class of problems. **It fits when:**\n\n- **Natural document structure** — the entity itself is a self-contained object with limited cross-entity relationships. A product catalog, a user profile with preferences, a content-management record, a sensor reading.\n- **Variable schema per entity type** — different product categories need different fields. A `shoes` document has `size_eu` and `material`; a `laptop` document has `ram_gb` and `cpu_model`. A single relational table would require many nullable columns or an EAV anti-pattern.\n- **Read-heavy with the same access path every time** — you always read the document as a whole (or a predictable sub-set), and the embedding matches that read pattern.\n- **Horizontal scale** — document stores like MongoDB shard naturally; the document is the unit of distribution.\n\n**It's a warning sign when:**\n\n- Your `$lookup` joins grow to 3–4 stages involving many large collections. This is a relational workload — reach for PostgreSQL or another RDBMS.\n- You find yourself needing to update the same fact in hundreds of embedded documents simultaneously. Normalise into a reference collection.\n- Your ad-hoc query requirements are unpredictable. The relational model with its join flexibility and mature query planner handles this better.\n- You need strong schema enforcement and referential integrity at the database layer — relational with foreign keys is the right tool.",
            uk: "Модель document відмінно підходить для певного класу задач. **Вона підходить, коли:**\n\n- **Природна структура document** — сутність сама по собі є самодостатнім обʼєктом з обмеженими міжсутнісними звʼязками. Каталог продуктів, профіль користувача з уподобаннями, запис CMS, показник датчика.\n- **Змінна schema для кожного типу сутності** — різні категорії продуктів потребують різних полів. Document `взуття` має `size_eu` і `material`; document `ноутбук` — `ram_gb` і `cpu_model`. Одна реляційна таблиця потребувала б багатьох NULL-колонок або EAV-анти-патерн.\n- **Read-heavy з однаковим access path кожного разу** — ви завжди читаєте document цілком (або передбачувану підмножину), і embedding відповідає цьому патерну читання.\n- **Горизонтальне масштабування** — document-сховища як MongoDB природно шардуються; document є одиницею розподілу.\n\n**Це попереджувальний знак, коли:**\n\n- Ваші `$lookup`-join зростають до 3–4 stages із залученням багатьох великих collections. Це реляційне навантаження — використайте PostgreSQL або інший RDBMS.\n- Ви знаходите, що вам потрібно одночасно оновити той самий факт у сотнях вбудованих documents. Нормалізуйте до reference-collection.\n- Ваші вимоги до ad-hoc запитів непередбачувані. Реляційна модель з гнучкістю join і зрілим планувальником запитів впорається краще.\n- Вам потрібне суворе дотримання схеми і referential integrity на рівні бази даних — реляційна модель з foreign keys — правильний інструмент.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'MongoDB is not "web-scale" by default — it is a modeling choice', uk: 'MongoDB — це не "web-scale" за замовчуванням — це вибір моделювання' },
          md: {
            en: "MongoDB does not magically outperform PostgreSQL. Its advantages are **modelling fit** (document matches your entity), **schema flexibility** (evolve without migrations), and **horizontal sharding** (when you genuinely need it). For workloads with many joins, strict referential integrity, and complex ad-hoc queries, PostgreSQL's mature query planner and JOIN engine will outperform a MongoDB `$lookup` chain. Choose for the access pattern, not for the hype.",
            uk: "MongoDB не перевершує PostgreSQL магічно. Його переваги — **відповідність моделі** (document відповідає вашій сутності), **гнучкість схеми** (еволюція без міграцій) і **горизонтальний sharding** (коли він справді потрібен). Для навантажень з багатьма joins, строгою referential integrity і складними ad-hoc запитами зрілий планувальник та JOIN-движок PostgreSQL перевершать ланцюг MongoDB `$lookup`. Обирайте за access pattern, а не за хайпом.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'A MongoDB document is a BSON object (max 16 MB) with nested sub-documents and arrays; the collection has no enforced schema by default.',
      uk: 'Document MongoDB — це BSON-обʼєкт (макс. 16 МБ) з вкладеними sub-documents і масивами; collection не enforced schema за замовчуванням.',
    },
    {
      en: 'Embed for 1:1/1:few (read together), reference for 1:many-large/M:N (shared, frequently updated, or independently queried data). Match the model to the access pattern.',
      uk: 'Embed для 1:1/1:few (читається разом), reference для 1:many-large/M:N (спільні, часто оновлювані або незалежно запитувані дані). Відповідайте моделі access pattern.',
    },
    {
      en: 'WiredTiger (default engine) gives document-level MVCC, Snappy compression, and a 60-second checkpoint WAL; durability mirrors PostgreSQL WAL semantics.',
      uk: 'WiredTiger (стандартний движок) забезпечує document-рівневий MVCC, Snappy compression і 60-секундний checkpoint WAL; durability нагадує семантику WAL PostgreSQL.',
    },
    {
      en: 'The aggregation pipeline ($match → $group → $project → $lookup) is MongoDB\'s SQL equivalent. Filter early with $match — always index the $match fields.',
      uk: 'Aggregation pipeline ($match → $group → $project → $lookup) — це SQL-еквівалент MongoDB. Фільтруйте якомога раніше через $match — завжди індексуйте поля $match.',
    },
    {
      en: 'Multi-document ACID transactions exist (since 4.0/4.2) but are heavier than single-document writes — prefer single-document atomicity when possible.',
      uk: 'Multi-document ACID transactions існують (з 4.0/4.2), але важчі за single-document записи — надавайте перевагу single-document atomicity де можливо.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Using w: 1 for critical writes', uk: 'Використання w: 1 для критичних записів' },
      body: {
        en: 'With the default `w: 1`, acknowledged writes may still be lost if the primary fails before replication. Use `w: "majority"` for any data you cannot afford to lose.',
        uk: 'З типовим `w: 1`, підтверджені записи можуть бути втрачені, якщо primary відмовляє до реплікації. Використовуйте `w: "majority"` для даних, які не можна втратити.',
      },
    },
    {
      title: { en: 'Embedding unbounded arrays', uk: 'Вбудовування unbounded arrays' },
      body: {
        en: "An array inside a document that grows without bound (all comments, all events) will eventually hit the 16 MB document limit and degrade query performance. Reference large collections instead.",
        uk: "Масив всередині document, що зростає безмежно (всі коментарі, всі події), врешті-решт досягне ліміту document у 16 МБ і деградує продуктивність запитів. Замість цього використовуйте reference для великих collections.",
      },
    },
    {
      title: { en: 'Reaching for $lookup when a relational DB is the right tool', uk: 'Звертатися до $lookup, коли реляційна БД — правильний інструмент' },
      body: {
        en: 'Multiple `$lookup` stages joining large collections is a signal that your data is inherently relational. MongoDB\'s `$lookup` is a left-outer join with no query-planner join-order optimization — it is powerful but not a replacement for a RDBMS on join-heavy workloads.',
        uk: 'Кілька stages `$lookup`, що зʼєднують великі collections — сигнал, що ваші дані є реляційними. `$lookup` MongoDB — це left-outer join без оптимізації порядку join у планувальнику — потужний, але не заміна RDBMS для join-навантажень.',
      },
    },
  ],

  interview: [
    {
      q: {
        en: 'When would you choose embedding over referencing in MongoDB, and vice versa?',
        uk: 'Коли ви б обрали embedding замість referencing у MongoDB, і навпаки?',
      },
      a: {
        en: 'Embed when the child entity is always read with the parent (single-document read = one I/O), the relationship is 1:few, and the child is never queried independently. Reference when the array is unbounded (hits the 16 MB doc limit), the relationship is M:N, the child is frequently updated across multiple parents, or it needs to be queried on its own. The decision is driven by the access pattern, not by schema aesthetics.',
        uk: 'Embed, коли дочірня сутність завжди читається разом з батьком (single-document read = один I/O), відношення 1:few і child ніколи не запитується незалежно. Reference, коли масив unbounded (досягає ліміту 16 МБ), відношення M:N, child часто оновлюється через кілька батьків або потрібно запитувати його самостійно. Рішення визначається access pattern, а не естетикою схеми.',
      },
      level: 'middle',
    },
    {
      q: {
        en: 'What is WiredTiger and how does its durability model work?',
        uk: 'Що таке WiredTiger і як працює його модель durability?',
      },
      a: {
        en: 'WiredTiger is MongoDB\'s default storage engine since 3.0. It uses MVCC at the document level (readers don\'t block writers), B+Tree structures for collections and indexes, and a journal (WAL) for durability. Changes hit the journal on every write (fsync, default j:true). A checkpoint is created every 60 seconds, flushing all dirty cache pages to the data files. On crash, the journal is replayed from the last checkpoint — exactly the redo-log semantics of PostgreSQL WAL. WiredTiger also compresses data by default (Snappy) and keeps a write-back cache (50% of RAM - 1 GB).',
        uk: 'WiredTiger — стандартний storage engine MongoDB з 3.0. Використовує MVCC на рівні document (читачі не блокують записувачів), структури B+Tree для collections і indexes, і журнал (WAL) для durability. Зміни потрапляють у журнал при кожному записі (fsync, стандартний j:true). Checkpoint створюється кожні 60 секунд: всі dirty pages cache скидаються у data-файли. Після збою журнал відтворюється з останнього checkpoint — точно такі ж redo-log семантики, що і у WAL PostgreSQL. WiredTiger також стискає дані за замовчуванням (Snappy) і тримає write-back cache (50% RAM - 1 ГБ).',
      },
      level: 'senior',
    },
    {
      q: {
        en: "What are multi-document ACID transactions in MongoDB, and when should you avoid them?",
        uk: "Що таке multi-document ACID transactions у MongoDB і коли їх варто уникати?",
      },
      a: {
        en: 'Multi-document ACID transactions were introduced in MongoDB 4.0 (single replica set) and 4.2 (sharded clusters via 2PC). They provide full ACID semantics across multiple documents and collections. However, they are significantly heavier than single-document writes: they hold locks, have a 60-second timeout, and use 2PC across shards. Avoid them when: (1) a single-document write can express the operation atomically (the common case in a well-designed document model); (2) performance is critical and eventual consistency is acceptable. Use them when regulatory requirements or data integrity genuinely demand multi-document atomicity.',
        uk: 'Multi-document ACID transactions введені в MongoDB 4.0 (single replica set) і 4.2 (sharded clusters через 2PC). Вони надають повну ACID-семантику для кількох documents і collections. Проте вони значно важчі за single-document записи: тримають locks, мають таймаут 60 секунд і використовують 2PC між шардами. Уникайте їх, коли: (1) single-document запис може виразити операцію атомарно (поширений випадок у правильно спроектованій document-моделі); (2) продуктивність критична і eventual consistency прийнятна. Використовуйте, коли регуляторні вимоги або цілісність даних справді вимагають multi-document atomicity.',
      },
      level: 'senior',
    },
  ],

  seeAlso: ['m3-sql-vs-nosql', 'm19-mvcc', 'm22-sharding', 'm27-wide-column'],

  sources: [
    {
      title: 'MongoDB 8.3 release (May 7, 2026)',
      url: 'https://www.mongodb.com/products/updates/mongodb-8-3/',
    },
    {
      title: 'WiredTiger Storage Engine — MongoDB Docs',
      url: 'https://www.mongodb.com/docs/manual/core/wiredtiger/',
    },
    {
      title: 'Aggregation Pipeline — MongoDB Docs',
      url: 'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/',
    },
    {
      title: 'Data Model Design — Embed vs Reference — MongoDB Docs',
      url: 'https://www.mongodb.com/docs/manual/data-modeling/',
    },
    {
      title: 'Transactions — MongoDB Docs',
      url: 'https://www.mongodb.com/docs/manual/core/transactions/',
    },
    {
      title: 'Write Concern — MongoDB Docs',
      url: 'https://www.mongodb.com/docs/manual/reference/write-concern/',
    },
  ],
};
