import type { Module } from '../types';

/*
 * M22 · Partitioning & sharding — Section V (S11). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-25 (see `sources`):
 *  - PostgreSQL declarative partitioning: RANGE and LIST since PG 10 (Oct 2017); HASH since PG 11
 *    (Oct 2018). Partition pruning: planning-time (PG 10) + execution-time (PG 11). Partition-wise
 *    joins (PG 11, enable_partitionwise_join, default OFF) and partition-wise aggregates (PG 11,
 *    enable_partitionwise_aggregate, default OFF) — both off because high-partition-count tables
 *    can make the planner slow. Primary use cases: table manageability, fast DROP of old partitions,
 *    parallel maintenance; bounded by a single-server I/O, storage, and CPU.
 *  - pg_partman v5.4.3 (2026-03-05): automates partition creation and maintenance (creates future
 *    partitions ahead of time, drops old per retention policy, migrates unpartitioned tables).
 *    v5+ declarative only (trigger-based removed). Background Worker (BGW) for automated maintenance.
 *    Minimum PG version: >= 14. Available on Amazon RDS (PG 12.5+).
 *  - DB-level partitioning vs application-level sharding: single server vs multiple independent
 *    servers each holding a subset. ACID is free within one server; cross-shard transactions need
 *    2PC or sagas. Both can coexist (each shard uses internal partitioning).
 *  - Sharding approaches:
 *    Hash: key hash mod N → even distribution; range queries scatter-gather.
 *    Range: sorted ranges → good for time-series scans; hot-spots with monotonic keys.
 *    Consistent hashing (ring): key and node hashes on a circle; join/leave moves only K/N keys.
 *      Virtual nodes (vnodes, e.g. Cassandra default 256/node): better balance under skew,
 *      heterogeneous capacity (larger nodes → more vnodes).
 *    Directory/lookup: lookup table maps each key to a shard → flexible; directory = bottleneck.
 *  - Hot spots: monotonic IDs (SERIAL, BIGSERIAL, IDENTITY, timestamp) → all writes to last shard.
 *    Mitigations: UUID (random, distribution), uuidv7() (PG 18, time-ordered+better distribution),
 *    key salting, consistent hashing with vnodes, read replicas for hot-read keys.
 *  - Citus: PG extension for distributed tables. Founded 2011, open-sourced March 2016, acquired by
 *    Microsoft January 2019; went 100% open source (PostgreSQL license) with Citus 11 (June 2022).
 *    Current version: Citus 14.0.0 (2026-02-17), supports PG 16/17/18. Powers Azure Cosmos DB for
 *    PostgreSQL. create_distributed_table(), create_reference_table(), transparent routing,
 *    co-location to avoid cross-shard joins, 2PC for cross-shard DML.
 *  - Cross-shard: scatter-gather for non-key queries; 2PC for multi-shard DML (blocking problem
 *    from M20 applies). Co-location is the main discipline: same shard key → related rows land
 *    together → no cross-shard joins for that workload.
 *  - postgres_fdw: federation (not full sharding), but with declarative partitioning + ATTACH
 *    PARTITION foreign_table enables partition-aware query routing to remote PG nodes.
 * Signature module: ★ sim 'sharding' + figure 'consistent-hashing'. PG stable 18.4.
 */
export const m22: Module = {
  id: 'm22-sharding',
  num: 22,
  section: 's5-distribution',
  order: 2,
  level: 'senior',
  signature: true,
  title: { en: 'Partitioning & sharding', uk: 'Partitioning та sharding' },
  tagline: {
    en: 'Vertical/horizontal, the shard key, routing & rebalancing, hotspots.',
    uk: 'Vertical/horizontal, shard key, маршрутизація і ребалансування, hotspots.',
  },
  readMins: 13,
  mentalModel: {
    en: 'The shard key is destiny — it decides every future query and hotspot.',
    uk: 'Shard key — це доля: він вирішує кожен майбутній запит і hotspot.',
  },
  topics: [
    // ── Topic 1: Table partitioning in PostgreSQL ─────────────────────────
    {
      id: 'pg-table-partitioning',
      title: {
        en: 'Table partitioning in PostgreSQL',
        uk: 'Partitioning таблиць у PostgreSQL',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "When a single table grows so large that routine operations become painful — vacuuming millions of rows, querying a month of data that shares a table with five years of history, archiving old records — **table partitioning** lets you split it into physically separate child tables that share the parent's schema. The database still appears as one table to queries, but operations can target only the relevant partitions.\n\nPostgreSQL's **declarative partitioning** (PG 10+) supports three strategies:\n- **RANGE** — rows are assigned to partitions based on non-overlapping key ranges. Classic for time-series data (one partition per month, quarter, or year). Dropping an old partition is an instant metadata operation, not a DELETE.\n- **LIST** — explicit value lists per partition (region='EU', region='US', …). Good for categorical keys with small cardinality.\n- **HASH** — the hash of the partition key modulo N determines the partition. Produces even distribution for numeric or UUID keys.\n\nThe planner uses **partition pruning** — eliminating partitions whose key range cannot satisfy the query predicate — to avoid scanning irrelevant data. Pruning works at planning time (PG 10) and at execution time for parameterized queries (PG 11). Two additional planner options remain **off by default** because they can cause planner overhead on tables with many hundreds of partitions: `enable_partitionwise_join` and `enable_partitionwise_aggregate` (both PG 11).",
            uk: "Коли одна таблиця виростає настільки, що рутинні операції стають болісними — vacuum мільйонів рядків, запит місяця даних, що розділяє таблицю з п'ятьма роками історії, архівування старих записів — **table partitioning** дає змогу розбити її на фізично окремі дочірні таблиці зі спільною схемою батьківської. База даних виглядає для запитів як одна таблиця, але операції можуть цілити лише у відповідні партиції.\n\n**Declarative partitioning** PostgreSQL (PG 10+) підтримує три стратегії:\n- **RANGE** — рядки призначаються партиціям за неперетинними діапазонами ключів. Класика для time-series даних (одна партиція на місяць, квартал або рік). Видалення старої партиції — миттєва метадатна операція, а не DELETE.\n- **LIST** — явні списки значень на партицію (region='EU', region='US', …). Добре для категоріальних ключів із малою кардинальністю.\n- **HASH** — хеш ключа партиції по модулю N визначає партицію. Дає рівномірний розподіл для числових або UUID-ключів.\n\nПланувальник використовує **partition pruning** — виключення партицій, чий діапазон ключів не може задовольнити предикат запиту — для уникнення сканування нерелевантних даних. Pruning працює під час планування (PG 10) і під час виконання для параметризованих запитів (PG 11). Дві додаткові опції планувальника залишаються **вимкненими за замовчуванням**, оскільки можуть спричиняти накладні витрати планувальника на таблицях із сотнями партицій: `enable_partitionwise_join` і `enable_partitionwise_aggregate` (обидві PG 11).",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- RANGE partition by month (the most common pattern)
CREATE TABLE orders (
  id         BIGINT GENERATED ALWAYS AS IDENTITY,
  order_date DATE           NOT NULL,
  customer_id BIGINT        NOT NULL,
  total      NUMERIC(12, 2) NOT NULL
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE orders_2026 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- A query with a date predicate only scans the relevant partition
EXPLAIN SELECT * FROM orders WHERE order_date >= '2026-03-01';
-- → Seq Scan on orders_2026 (others pruned)

-- Dropping old data is instant: a metadata-only DROP PARTITION
ALTER TABLE orders DETACH PARTITION orders_2024;
DROP TABLE orders_2024;`,
          note: {
            en: 'Each partition is an ordinary table and can have its own indexes, tablespace, and VACUUM settings.',
            uk: 'Кожна партиція — звичайна таблиця і може мати власні indexes, tablespace та налаштування VACUUM.',
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Strategy', uk: 'Стратегія' },
            { en: 'Best for', uk: 'Найкраще для' },
            { en: 'Hot-spot risk?', uk: 'Ризик hotspot?' },
            { en: 'Range queries', uk: 'Range-запити' },
          ],
          rows: [
            [
              { en: 'RANGE', uk: 'RANGE' },
              { en: 'Time-series data, logs, archive + purge workflows', uk: 'Time-series дані, логи, архів і очищення' },
              { en: 'Yes — monotonic inserts always hit the latest partition', uk: 'Так — монотонні вставки завжди в останню партицію' },
              { en: 'Excellent — single partition', uk: 'Відмінно — одна партиція' },
            ],
            [
              { en: 'LIST', uk: 'LIST' },
              { en: 'Categorical keys (region, status, tenant)', uk: 'Категоріальні ключі (регіон, статус, tenant)' },
              { en: 'Possible — skewed categories', uk: 'Можливо — перекошені категорії' },
              { en: 'Per-value lookup', uk: 'Пошук по значенню' },
            ],
            [
              { en: 'HASH', uk: 'HASH' },
              { en: 'Even load distribution when no natural range is needed', uk: 'Рівний розподіл навантаження без природного діапазону' },
              { en: 'Low — even distribution', uk: 'Низький — рівномірний розподіл' },
              { en: 'Poor — all partitions must be scanned for non-key predicates', uk: 'Погано — всі партиції скануються для предикатів не за ключем' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'pg_partman: automate partition lifecycle management',
            uk: 'pg_partman: автоматизуйте lifecycle-управління партиціями',
          },
          md: {
            en: '**pg_partman v5.4.3** (March 2026, requires PG ≥ 14) automates the tedious parts: creating future partitions ahead of time, dropping old partitions per a retention policy, and migrating existing unpartitioned tables to a partitioned design. Since v5.0, declarative partitioning only (trigger-based removed). It ships a Background Worker (BGW) that runs maintenance automatically — no external cron needed.',
            uk: '**pg_partman v5.4.3** (березень 2026, вимагає PG ≥ 14) автоматизує нудну частину: створення майбутніх партицій заздалегідь, видалення старих за політикою утримання та міграцію існуючих непартиційованих таблиць на партиційований дизайн. Від v5.0 — лише declarative partitioning (trigger-based видалено). Постачається з Background Worker (BGW), що запускає обслуговування автоматично — зовнішній cron не потрібен.',
          },
        },
      ],
    },
    // ── Topic 2: Sharding — when and why ─────────────────────────────────
    {
      id: 'sharding-when-and-why',
      title: {
        en: 'Sharding — when and why',
        uk: 'Sharding — коли і чому',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Partitioning keeps all data on **one server**. Sharding distributes data across **multiple independent servers** — each shard holds a distinct subset of the data, and together they cover the whole dataset. Sharding is the answer when you need write throughput, storage capacity, or isolation that a single server (even a beefy one) cannot provide.\n\nThe trade-off is steep: sharding introduces **distribution complexity**. Cross-shard queries must scatter across multiple servers and gather results. Cross-shard transactions require coordination (2PC or sagas, with all the associated complexity from M20). Schema changes must be applied to every shard in a coordinated way. These costs are real and significant — **sharding is a last resort, not a first instinct**.\n\nThe two approaches are not mutually exclusive: each shard node can itself use declarative partitioning internally (e.g., time partitions within each shard) — the layers compose.",
            uk: "Partitioning тримає всі дані на **одному сервері**. Sharding розподіляє дані між **кількома незалежними серверами** — кожен shard тримає окрему підмножину даних, і разом вони охоплюють весь датасет. Sharding — відповідь, коли потрібна throughput запису, місткість сховища або ізоляція, яку один сервер (навіть потужний) не може забезпечити.\n\nКомпроміс серйозний: sharding вводить **складність розподілу**. Cross-shard-запити мусять розсіюватися по кількох серверах і збирати результати. Cross-shard-транзакції потребують координації (2PC або sagas з усією пов'язаною складністю з M20). Зміни схеми потрібно координовано застосовувати до кожного shard. Ці витрати реальні та суттєві — **sharding — це крайній захід, а не перший рефлекс**.\n\nОбидва підходи не виключають один одного: кожен вузол shard може сам використовувати declarative partitioning внутрішньо (напр., time-партиції всередині кожного shard) — рівні компонуються.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'DB-level partitioning (one server)', uk: 'DB-level partitioning (один сервер)' },
          b: { en: 'Application-level sharding (multiple servers)', uk: 'Application-level sharding (кілька серверів)' },
          rows: [
            [
              { en: 'Scale limit', uk: 'Межа масштабу' },
              { en: 'Single-server I/O, RAM, CPU, disk', uk: 'Обмежений одним сервером: I/O, RAM, CPU, диск' },
              { en: 'Scales horizontally with node count', uk: 'Масштабується горизонтально з кількістю вузлів' },
            ],
            [
              { en: 'ACID guarantees', uk: 'Гарантії ACID' },
              { en: 'Full ACID — one transaction manager, one WAL', uk: 'Повний ACID — один transaction manager, один WAL' },
              { en: 'ACID within a shard; cross-shard = 2PC or sagas', uk: 'ACID у межах shard; cross-shard = 2PC або sagas' },
            ],
            [
              { en: 'Cross-partition queries', uk: 'Cross-partition-запити' },
              { en: 'Local — planner handles it (partition-wise join)', uk: 'Локальні — планувальник обробляє (partition-wise join)' },
              { en: 'Scatter-gather — fan out to all shards, merge results', uk: 'Scatter-gather — розгортання до всіх shards, злиття результатів' },
            ],
            [
              { en: 'Operational complexity', uk: 'Операційна складність' },
              { en: 'Low — managed within one PostgreSQL cluster', uk: 'Низька — управляється в одному кластері PostgreSQL' },
              { en: 'High — routing, rebalancing, cross-shard DDL', uk: 'Висока — маршрутизація, ребалансування, cross-shard DDL' },
            ],
          ],
        },
        {
          kind: 'figure',
          fig: 'consistent-hashing',
          caption: {
            en: 'Consistent hashing: keys and nodes are mapped to positions on a ring. A key is owned by the nearest clockwise node. When a node is added, only the keys in its clockwise arc need to move — K/N keys on average.',
            uk: 'Consistent hashing: ключі та вузли відображаються на позиції кільця. Ключем володіє найближчий за годинниковою стрілкою вузол. Коли додається вузол, потрібно перемістити лише ключі в його дузі — в середньому K/N ключів.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Citus: sharding as a PostgreSQL extension',
            uk: 'Citus: sharding як розширення PostgreSQL',
          },
          md: {
            en: '**Citus** (v14.0.0, February 2026; supports PG 16/17/18; 100% open source under the PostgreSQL license since Citus 11 in June 2022; engine behind Azure Cosmos DB for PostgreSQL) is a PostgreSQL extension that adds transparent sharding. `create_distributed_table(table, distribution_column)` shards the table across a pool of worker nodes; `create_reference_table()` replicates small lookup tables to all nodes. The coordinator rewrites queries and routes them to the right workers — the application sees ordinary PostgreSQL. Co-location (`colocate_with`) ensures related tables shard by the same key, eliminating cross-node joins for tenant-scoped workloads.',
            uk: "**Citus** (v14.0.0, лютий 2026; підтримує PG 16/17/18; 100% open source під ліцензією PostgreSQL від Citus 11 у червні 2022 р.; движок за Azure Cosmos DB for PostgreSQL) — розширення PostgreSQL, що додає прозорий sharding. `create_distributed_table(table, distribution_column)` розбиває таблицю між пулом worker-вузлів; `create_reference_table()` реплікує малі lookup-таблиці на всі вузли. Координатор переписує запити й маршрутизує їх до потрібних workers — застосунок бачить звичайний PostgreSQL. Co-location (`colocate_with`) гарантує, що пов'язані таблиці шардуються за тим самим ключем, усуваючи cross-node joins для tenant-scoped навантажень.",
          },
        },
      ],
    },
    // ── Topic 3: The shard key — destiny and hotspots ────────────────────
    {
      id: 'shard-key-and-hotspots',
      title: {
        en: 'The shard key — destiny and hotspots',
        uk: 'Shard key — доля та hotspots',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The shard key (or distribution column) is the column used to decide which shard a row lives on. This choice is the most consequential design decision in a sharded system — it determines which queries are single-shard (fast and ACID), which require scatter-gather (expensive), and whether any shard becomes overloaded.\n\nA **good shard key** has: high cardinality (many distinct values → even distribution); no temporal skew (values don't cluster at one shard over time); co-location potential (related rows for the same logical entity hash to the same shard).\n\nA **bad shard key** creates **hotspots**. The most common pitfall is using a **monotonically increasing key** — SERIAL, BIGSERIAL, IDENTITY, or timestamp-based IDs — for range-based sharding. Because new IDs are always larger than old ones, every recent insert hits the same shard (the one holding the current range), saturating it while the others sit idle. This is the same problem that makes sequential writes hot in B-Trees (fillfactor), but at the network level.",
            uk: "Shard key (або distribution column) — це колонка, яка вирішує, в якому shard живе рядок. Цей вибір є найважливішим дизайнерським рішенням у шардованій системі — він визначає, які запити є single-shard (швидкі і ACID), які потребують scatter-gather (дорогі), і чи стане якийсь shard перевантаженим.\n\n**Хороший shard key** має: висока кардинальність (багато різних значень → рівномірний розподіл); відсутність часового перекосу (значення не кластеризуються в одному shard згодом); потенціал co-location (пов'язані рядки для однієї логічної сутності хешуються до того ж shard).\n\n**Поганий shard key** створює **hotspots**. Найпоширена пастка — використання **монотонно зростаючого ключа** — SERIAL, BIGSERIAL, IDENTITY або timestamp-based ID — для range-based sharding. Оскільки нові ID завжди більші за старі, кожна нова вставка потрапляє в той самий shard (той, що тримає поточний діапазон), перевантажуючи його, поки інші простоюють. Це та ж проблема, що робить sequential writes гарячими в B-Trees (fillfactor), але на мережевому рівні.",
          },
        },
        {
          kind: 'sim',
          sim: 'sharding',
        },
        {
          kind: 'table',
          head: [
            { en: 'Hot-spot mitigation', uk: 'Засіб проти hotspot' },
            { en: 'How it works', uk: 'Як працює' },
            { en: 'Trade-off', uk: 'Компроміс' },
          ],
          rows: [
            [
              { en: 'Hash sharding (mod N)', uk: 'Hash sharding (mod N)' },
              { en: 'Any value modulo the number of shards → deterministic, even spread', uk: 'Будь-яке значення по модулю кількість shards → детермінований рівномірний розподіл' },
              { en: 'Range queries must scatter-gather; resharding = full rehash', uk: 'Range-запити мають scatter-gather; resharding = повний rehash' },
            ],
            [
              { en: 'UUIDs (random)', uk: 'UUIDs (random)' },
              { en: 'Random IDs distribute evenly by nature', uk: 'Випадкові ID природно рівномірно розподіляються' },
              { en: 'No write locality; B-Tree index fragmentation', uk: 'Немає write-локальності; фрагментація B-Tree index' },
            ],
            [
              { en: 'uuidv7() (PG 18)', uk: 'uuidv7() (PG 18)' },
              { en: 'Time-ordered UUID: temporal locality + better distribution than v4', uk: 'Time-ordered UUID: часова локальність + кращий розподіл ніж v4' },
              { en: 'Still monotonic within a millisecond; somewhat hot at high TPS', uk: 'Все ще монотонний у межах мілісекунди; дещо гарячий при високому TPS' },
            ],
            [
              { en: 'Key salting', uk: 'Key salting' },
              { en: 'Append a random 0–N suffix to spread a hot key across N buckets', uk: 'Додайте випадковий суфікс 0–N, щоб розподілити гарячий ключ по N бакетах' },
              { en: 'Reads must fan out and aggregate across all N buckets', uk: 'Читання мають розгорнутися і агрегувати по всіх N бакетах' },
            ],
            [
              { en: 'Consistent hashing + vnodes', uk: 'Consistent hashing + vnodes' },
              { en: 'Multiple virtual positions per node; adding a node moves only K/N keys', uk: 'Кілька virtual positions на вузол; додавання вузла переміщує лише K/N ключів' },
              { en: 'More complex routing; vnode count tuning needed for heterogeneous hardware', uk: 'Складніша маршрутизація; потрібне налаштування кількості vnode для різнорідного заліза' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Co-location: the discipline that makes sharding bearable',
            uk: 'Co-location: дисципліна, що робить sharding терпимим',
          },
          md: {
            en: "The golden rule: **rows that are queried together should live on the same shard**. In a multi-tenant SaaS, use `tenant_id` as the shard key for every table — `orders`, `order_items`, `invoices`, etc. With co-location, all joins within a tenant's scope require zero cross-shard communication. A query like `SELECT … FROM orders JOIN order_items USING (order_id) WHERE tenant_id = $1` hits exactly one shard and runs like a normal local join. Without co-location it becomes scatter-gather across every shard in the cluster.",
            uk: "Золоте правило: **рядки, що запитуються разом, мають жити в одному shard**. У multi-tenant SaaS використовуйте `tenant_id` як shard key для кожної таблиці — `orders`, `order_items`, `invoices` тощо. З co-location всі join'и в межах скоупу tenant вимагають нульової cross-shard-комунікації. Запит типу `SELECT … FROM orders JOIN order_items USING (order_id) WHERE tenant_id = $1` потрапляє рівно в один shard і виконується як звичайний локальний join. Без co-location він стає scatter-gather по кожному shard у кластері.",
          },
        },
      ],
    },
    // ── Topic 4: Cross-shard operations — the price of distribution ───────
    {
      id: 'cross-shard-operations',
      title: {
        en: 'Cross-shard operations — the price of distribution',
        uk: 'Cross-shard-операції — ціна розподілу',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**Cross-shard reads (scatter-gather):** A query that does not filter by the shard key — `SELECT COUNT(*) FROM orders` on a tenant-sharded cluster — must be sent to every shard. Each shard executes its local portion and returns a partial result; the coordinator merges them. Wall-clock latency is determined by the **slowest shard**, not the average. With N shards the work is parallelized but the network fan-out cost and coordination overhead is real — scatter-gather does not scale as well as single-shard queries.\n\n**Cross-shard writes (distributed transactions):** Modifying rows on multiple shards atomically requires distributed transaction coordination — either 2PC (PostgreSQL's `PREPARE TRANSACTION` / `COMMIT PREPARED`, used internally by Citus for cross-shard DML) or sagas (M20). The blocking problem from M20 applies: if the coordinator crashes between the prepare and commit phases, participants are in-doubt and hold locks. This is why **co-location is not just a performance optimization but a correctness strategy** — it keeps writes single-shard and ACID by construction.\n\n**Schema changes across shards** must be applied to every shard in a coordinated manner. Citus propagates DDL to all workers automatically. For hand-rolled sharding you need a migration framework that runs each DDL change on every shard node, ideally with an ordering guarantee so no shard is left in an inconsistent schema state.",
            uk: "**Cross-shard читання (scatter-gather):** Запит без фільтра за shard key — `SELECT COUNT(*) FROM orders` на tenant-шардованому кластері — потрібно відправити на кожен shard. Кожен shard виконує свою локальну частину і повертає частковий результат; координатор зливає їх. Wall-clock latency визначається **найповільнішим shards**, а не середнім. З N shards робота паралелізується, але вартість мережевого fan-out і накладні витрати координації реальні — scatter-gather не масштабується так само добре, як single-shard-запити.\n\n**Cross-shard записи (розподілені транзакції):** Атомарна модифікація рядків на кількох shards вимагає координації розподіленої транзакції — або 2PC (PostgreSQL `PREPARE TRANSACTION` / `COMMIT PREPARED`, внутрішньо використовується Citus для cross-shard DML), або sagas (M20). Проблема блокування з M20 застосовується: якщо координатор падає між фазами prepare і commit, учасники знаходяться у сумніві й тримають locks. Ось чому **co-location — не просто оптимізація продуктивності, а стратегія коректності** — вона тримає записи single-shard і ACID за побудовою.\n\n**Зміни схеми між shards** потрібно координовано застосовувати до кожного shard. Citus автоматично поширює DDL на всіх workers. Для ручного sharding потрібна фреймворк міграції, що запускає кожну DDL-зміну на кожному вузлі shard, бажано з гарантією порядку, щоб жоден shard не залишився у непослідовному стані схеми.",
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Operation', uk: 'Операція' },
            { en: 'Single-shard (co-located)', uk: 'Single-shard (co-located)' },
            { en: 'Cross-shard', uk: 'Cross-shard' },
          ],
          rows: [
            [
              { en: 'Point read (by shard key)', uk: 'Point read (за shard key)' },
              { en: 'One node — local B-Tree lookup', uk: 'Один вузол — локальний B-Tree lookup' },
              { en: 'N/A — key identifies the shard', uk: 'Н/Д — ключ ідентифікує shard' },
            ],
            [
              { en: 'Aggregation (no shard key filter)', uk: 'Агрегація (без фільтра shard key)' },
              { en: 'One node', uk: 'Один вузол' },
              { en: 'Scatter to N shards → partial results → coordinator merge', uk: 'Scatter до N shards → часткові результати → злиття координатором' },
            ],
            [
              { en: 'Write (single row)', uk: 'Запис (один рядок)' },
              { en: 'One node — full ACID', uk: 'Один вузол — повний ACID' },
              { en: '2PC across N shards — coordinator, prepare, vote, commit/abort', uk: '2PC через N shards — координатор, prepare, vote, commit/abort' },
            ],
            [
              { en: 'JOIN (same shard key)', uk: 'JOIN (той самий shard key)' },
              { en: 'One node — local join', uk: 'Один вузол — локальний join' },
              { en: 'N/A with co-location; without it: broadcast one table to N shards', uk: 'Н/Д із co-location; без нього: broadcast однієї таблиці до N shards' },
            ],
            [
              { en: 'Schema change (DDL)', uk: 'Зміна схеми (DDL)' },
              { en: 'One node', uk: 'Один вузол' },
              { en: 'Must be applied to every shard — ordered, coordinated migration', uk: 'Треба застосувати до кожного shard — впорядкована, координована міграція' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: 'Do not shard prematurely',
            uk: 'Не шардуйте завчасно',
          },
          md: {
            en: 'Sharding multiplies operational complexity — monitoring, failover, schema migrations, cross-shard joins, and distributed transactions all become harder. Before sharding: (1) vertically scale (larger machine); (2) add read replicas for read-heavy workloads; (3) partition the hottest tables locally; (4) optimize queries and indexes. The checklist above rarely exhausts its headroom below 10 TB or 100k TPS. Many teams shard too early and spend years fighting the operational overhead.',
            uk: "Sharding множить операційну складність — моніторинг, failover, міграції схем, cross-shard-join'и та розподілені транзакції — всі стають складнішими. Перед sharding: (1) вертикально масштабуйтесь (більша машина); (2) додайте read replicas для read-heavy навантажень; (3) локально партиціюйте найгарячіші таблиці; (4) оптимізуйте запити та indexes. Наведений вище чеклист рідко вичерпує резерви нижче 10 ТБ або 100k TPS. Багато команд шардують завчасно і роками борються з операційними накладними витратами.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'PostgreSQL declarative partitioning (RANGE/LIST/HASH) splits a table across child tables on one server — fast DROP of old data, partition pruning, no cross-server coordination needed.',
      uk: 'Declarative partitioning PostgreSQL (RANGE/LIST/HASH) ділить таблицю на дочірні таблиці на одному сервері — швидке видалення старих даних, partition pruning, без cross-server координації.',
    },
    {
      en: 'Sharding distributes rows across multiple independent servers by a shard key. It scales writes and storage beyond one machine but adds distributed-system complexity to every operation.',
      uk: 'Sharding розподіляє рядки між кількома незалежними серверами за shard key. Він масштабує записи та сховище за межі однієї машини, але додає складність розподіленої системи до кожної операції.',
    },
    {
      en: "The shard key is destiny: it determines which queries are single-shard (fast, ACID) and which scatter-gather. Choose it for co-location of related rows — never by 'intuition'.",
      uk: "Shard key — це доля: він визначає, які запити single-shard (швидкі, ACID), а які scatter-gather. Вибирайте його для co-location пов'язаних рядків — ніколи за 'інтуїцією'.",
    },
    {
      en: 'Monotonic IDs (SERIAL, BIGSERIAL, timestamps) create hotspots in range sharding — all new writes go to the same shard. Use hash sharding, random UUIDs, or uuidv7() (PG 18) to distribute evenly.',
      uk: 'Монотонні ID (SERIAL, BIGSERIAL, timestamps) створюють hotspots у range sharding — всі нові записи йдуть до одного shard. Використовуйте hash sharding, random UUIDs або uuidv7() (PG 18) для рівного розподілу.',
    },
    {
      en: 'Cross-shard writes need 2PC or sagas — the same blocking problem as M20. Co-location (same shard key for related tables) keeps joins and writes local and avoids distributed transactions by design.',
      uk: 'Cross-shard-записи потребують 2PC або sagas — та сама проблема блокування, що в M20. Co-location (той самий shard key для пов\'язаних таблиць) тримає join\'и та записи локальними й уникає розподілених транзакцій за дизайном.',
    },
  ],
  pitfalls: [
    {
      title: {
        en: 'Using a monotonic key for range sharding',
        uk: 'Використання монотонного ключа для range sharding',
      },
      body: {
        en: 'SERIAL or IDENTITY keys with range-based sharding send 100% of recent inserts to the last shard. That shard becomes a CPU, I/O, and lock bottleneck while the others are idle. Switch to hash sharding or a better key (UUIDv7, a composite key with a non-monotonic component) before you shard — retrofitting the shard key is one of the most painful migrations in a distributed system.',
        uk: 'SERIAL або IDENTITY ключі з range-based sharding надсилають 100% нових вставок до останнього shard. Той shard стає CPU-, I/O- та lock-вузьким місцем, поки інші простоюють. Переходьте на hash sharding або кращий ключ (UUIDv7, складений ключ із немонотонним компонентом) до sharding — зміна shard key після — одна з найболісніших міграцій у розподіленій системі.',
      },
    },
    {
      title: {
        en: 'Forgetting that cross-shard queries cost the slowest shard',
        uk: 'Забування, що cross-shard-запити коштують найповільнішого shard',
      },
      body: {
        en: "Scatter-gather queries have a latency floor set by the slowest shard — even if 99% of shards respond in 5 ms, one lagging or overloaded shard can pull P99 to seconds. Monitor per-shard latency, not just the coordinator's aggregate view, and ensure shards are balanced. A hot shard slows every global query that touches it.",
        uk: "Scatter-gather запити мають нижню межу latency, встановлену найповільнішим shard — навіть якщо 99% shards відповідають за 5 мс, один затримуючий або перевантажений shard може підняти P99 до секунд. Моніторте latency на рівні кожного shard, а не лише агрегований вигляд координатора, і переконайтеся, що shards збалансовані. Гарячий shard сповільнює кожен глобальний запит, що торкається його.",
      },
    },
    {
      title: {
        en: 'Sharding too early',
        uk: 'Передчасний sharding',
      },
      body: {
        en: 'Most applications will never need sharding. A well-indexed, well-vacuumed PostgreSQL instance on modern hardware can sustain tens of thousands of TPS and multi-terabyte datasets. Read replicas handle read-heavy workloads; partitioning handles table manageability and archiving. The operational overhead of sharding — monitoring, migrations, distributed transactions, rebalancing — is large enough that premature sharding typically costs more than it saves.',
        uk: 'Більшість застосунків ніколи не потребуватимуть sharding. Добре проіндексований і провакуумований PostgreSQL на сучасному залізі може підтримувати десятки тисяч TPS і мультитерабайтні датасети. Read replicas обробляють read-heavy навантаження; partitioning обробляє керованість таблиць і архівування. Операційні витрати sharding — моніторинг, міграції, розподілені транзакції, ребалансування — достатньо великі, щоб передчасний sharding зазвичай коштував більше, ніж заощаджував.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: "What is the difference between table partitioning and sharding? When would you use each?",
        uk: "Яка різниця між table partitioning та sharding? Коли використовувати кожне?",
      },
      a: {
        en: "Partitioning splits a logical table into physical child tables on the same server — same ACID guarantees, same transaction manager, but better manageability (fast DROP of old partitions, partition pruning). Use it for time-series data, archiving, or tables that are simply large. Sharding distributes rows across multiple independent servers — it breaks ACID at the cross-shard boundary and adds scatter-gather and distributed-transaction complexity, but allows write throughput and storage to scale linearly. Use sharding only when a single (even partitioned) server cannot meet write throughput or storage requirements.",
        uk: "Partitioning ділить логічну таблицю на фізичні дочірні таблиці на тому ж сервері — ті ж ACID-гарантії, той самий transaction manager, але краща керованість (швидке DROP старих партицій, partition pruning). Використовуйте для time-series даних, архівування або просто великих таблиць. Sharding розподіляє рядки між кількома незалежними серверами — він порушує ACID на cross-shard межі й додає scatter-gather та складність розподілених транзакцій, але дозволяє throughput запису та сховищу масштабуватися лінійно. Використовуйте sharding лише тоді, коли один (навіть партиційований) сервер не може задовольнити вимоги до throughput запису або сховища.",
      },
    },
    {
      level: 'senior',
      q: {
        en: "Why does consistent hashing avoid the 'full rehash' problem of simple hash sharding when adding nodes?",
        uk: "Чому consistent hashing уникає проблеми 'повного rehash' простого hash sharding при додаванні вузлів?",
      },
      a: {
        en: "In simple hash sharding (key mod N), changing N from 3 to 4 changes the target shard for roughly (N−1)/N = 75% of all keys — a massive migration. In consistent hashing, keys and nodes are mapped to positions on a ring. A key is owned by the first node clockwise from it. When a new node is inserted at a position on the ring, it only takes ownership of the keys in the arc between itself and the previous node — on average K/N keys (K total keys, N nodes). All other keys remain where they are. Virtual nodes (vnodes) further improve balance: each physical node occupies multiple ring positions, so adding a heterogeneous (bigger) node with more vnodes receives a proportionally larger share of keys without disturbing the rest.",
        uk: "У простому hash sharding (key mod N), зміна N з 3 на 4 змінює цільовий shard приблизно для (N−1)/N = 75% всіх ключів — масова міграція. У consistent hashing ключі та вузли відображаються на позиції кільця. Ключем володіє перший вузол за годинниковою стрілкою від нього. Коли новий вузол вставляється в позицію кільця, він тільки перебирає владу над ключами в дузі між собою та попереднім вузлом — в середньому K/N ключів (K загальних ключів, N вузлів). Всі інші ключі залишаються там, де вони є. Virtual nodes (vnodes) додатково покращують баланс: кожен фізичний вузол займає кілька позицій кільця, тож додавання різнорідного (більшого) вузла з більшою кількістю vnode отримує пропорційно більшу частку ключів, не турбуючи решту.",
      },
    },
    {
      level: 'staff',
      q: {
        en: "You are designing a multi-tenant SaaS on a sharded PostgreSQL cluster. How do you choose the shard key and what does co-location mean in practice?",
        uk: "Ви проектуєте multi-tenant SaaS на шардованому кластері PostgreSQL. Як вибрати shard key і що означає co-location на практиці?",
      },
      a: {
        en: "For a multi-tenant SaaS, `tenant_id` is almost always the right shard key: it has high cardinality (many tenants), zero temporal skew (writes spread across tenants over time), and naturally co-locates all data for a tenant. Co-location means using `tenant_id` as the distribution column for every tenant-scoped table — `orders`, `order_items`, `invoices`, `audit_logs`, etc. With Citus: `SELECT create_distributed_table('orders', 'tenant_id')` then `SELECT create_distributed_table('order_items', 'tenant_id', colocate_with => 'orders')`. The effect: a query `SELECT … FROM orders JOIN order_items USING (order_id) WHERE tenant_id=$1` is routed to exactly one worker and executes as a local join. Without co-location that join becomes scatter-gather. The two pitfalls: (1) very large ('whale') tenants that saturate one shard — use key-level rebalancing or isolate whales to dedicated shards; (2) cross-tenant reporting queries that must scatter-gather — route them to a denormalized analytics replica rather than running them on the OLTP cluster.",
        uk: "Для multi-tenant SaaS `tenant_id` майже завжди правильний shard key: висока кардинальність (багато tenants), відсутність часового перекосу (записи розподіляються між tenants згодом), і він природно co-locate всі дані tenant. Co-location означає використання `tenant_id` як distribution column для кожної tenant-scoped таблиці — `orders`, `order_items`, `invoices`, `audit_logs` тощо. З Citus: `SELECT create_distributed_table('orders', 'tenant_id')`, потім `SELECT create_distributed_table('order_items', 'tenant_id', colocate_with => 'orders')`. Ефект: запит `SELECT … FROM orders JOIN order_items USING (order_id) WHERE tenant_id=$1` маршрутизується рівно до одного worker і виконується як локальний join. Без co-location той join стає scatter-gather. Дві пастки: (1) дуже великі ('whale') tenants, що насичують один shard — використовуйте key-level rebalancing або ізолюйте whales до виділених shards; (2) cross-tenant-звіти, що мають scatter-gather — маршрутизуйте їх до денормалізованої аналітичної репліки, а не запускайте на OLTP-кластері.",
      },
    },
  ],
  seeAlso: ['m12-storage', 'm13-btree', 'm20-distributed-tx', 'm21-replication', 'm23-cap'],
  sources: [
    {
      title: 'PostgreSQL 18 — Table Partitioning (§5.11): RANGE/LIST/HASH, pruning, partition-wise',
      url: 'https://www.postgresql.org/docs/18/ddl-partitioning.html',
    },
    {
      title: 'pg_partman v5.4.3 — automated partition management extension',
      url: 'https://github.com/pgpartman/pg_partman',
    },
    {
      title: 'Citus 14.0.0 release — 100% open source PostgreSQL sharding extension (PostgreSQL license)',
      url: 'https://www.citusdata.com/updates/v14-0/',
    },
    {
      title: 'Consistent Hashing (Karger et al. 1997): ring hashing, virtual nodes, minimal key movement',
      url: 'https://dl.acm.org/doi/10.1145/258533.258660',
    },
    {
      title: 'PostgreSQL 18 — postgres_fdw: foreign-data wrapper for federation and partition routing',
      url: 'https://www.postgresql.org/docs/18/postgres-fdw.html',
    },
  ],
};
