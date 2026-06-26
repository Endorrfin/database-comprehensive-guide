import type { Module } from '../types';

/*
 * M27 · Wide-column stores — Section VI (S14). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-26 (see `sources`).
 *
 * Cassandra version facts (verified 2026-06-26 via cassandra.apache.org):
 *  - Latest stable: Apache Cassandra 5.0.7, released 2026-03-23.
 *  - Cassandra 4.1.x is the previous stable series.
 *  - Cassandra 5.0 introduced UCS (Unified Compaction Strategy) as the new recommended
 *    default compaction strategy.
 *
 * ScyllaDB version facts (verified 2026-06-26 via docs.scylladb.com):
 *  - Current stable: ScyllaDB 2026.1. ScyllaDB 2026.2 is the next branch / preview.
 *  - ScyllaDB is a C++ rewrite of Cassandra on the Seastar framework (shard-per-core,
 *    shared-nothing, async I/O). Each vCPU gets its own shard: dedicated cache,
 *    memtable, SSTables, and network queue — no lock contention across cores.
 *
 * Data model (verified, Cassandra 5.0 docs):
 *  - "A partitioned wide-column storage model."
 *  - Partition key: determines which node(s) store the partition (via token ring).
 *    "All performant queries supply the partition key in the query."
 *  - Clustering keys: sort order within a partition. Multiple rows per partition.
 *  - Wide row: a partition can hold millions of column values (e.g. one partition per
 *    device holding every time-stamped sensor reading). Max partition size: 2 GB (soft
 *    limit; practical limit is much lower for performance).
 *
 * Consistency (verified, Cassandra 5.0 dynamo docs + ScyllaDB CQL docs):
 *  - Levels: ONE, TWO, THREE, QUORUM (⌊RF/2⌋+1), ALL, LOCAL_QUORUM, EACH_QUORUM,
 *    LOCAL_ONE, ANY (write only).
 *  - Strong consistency formula: W + R > RF.
 *    Example: RF=3, W=QUORUM(2), R=QUORUM(2) → 2+2=4 > 3 → at least one replica
 *    participated in both → guaranteed to see the latest write.
 *  - Write always goes to ALL replicas; the CL only controls how many ACKs the
 *    coordinator waits for before responding to the client.
 *  - Default CL = ONE → eventual consistency out of the box.
 *
 * LSM storage (verified, Cassandra 5.0 storage-engine docs):
 *  - Write path: commit log → memtable → (flush) → SSTable (immutable).
 *  - SSTables are never overwritten; a partition's rows may span many SSTable files.
 *  - Bloom filter (Filter.db): probabilistic test to skip SSTables that definitely
 *    do not contain the queried partition. Zero false negatives.
 *  - Compaction strategies (Cassandra 5.0):
 *      UCS  – Unified Compaction Strategy (NEW in 5.0; recommended default).
 *      STCS – Size-Tiered Compaction (traditional default; good write throughput).
 *      LCS  – Leveled Compaction (lower read amplification; higher write amplification).
 *      TWCS – Time Window Compaction (purpose-built for time-series / TTL workloads).
 *  - Tombstones: deletes write a tombstone marker; the marker is purged during compaction
 *    after gc_grace_seconds (default 10 days). Heavy deletes → tombstone accumulation →
 *    read latency spikes — the #1 Cassandra production hazard.
 *
 * CQL (verified, Cassandra 5.0 overview):
 *  - CQL introduced Cassandra 0.8 (2011); CQL3 stable in Cassandra 1.2 (2013).
 *  - SQL-like syntax (SELECT/INSERT/UPDATE/DELETE/CREATE TABLE) but fundamentally
 *    query-first: tables are designed around the queries they serve.
 *  - No cross-partition transactions; no JOINs; no subqueries; no foreign keys.
 *  - Queries without the partition key require ALLOW FILTERING → full cluster scan.
 *
 * Ring architecture (verified, Cassandra 5.0 dynamo docs):
 *  - Peer-to-peer, no single master. Every node is equivalent.
 *  - Consistent hashing ring: each node (or vnode) owns a token range.
 *  - Virtual nodes (vnodes): each physical node owns many small token ranges,
 *    spreading load evenly and making rebalancing cheap (only K/N keys move).
 *  - Gossip protocol: every second, each node exchanges heartbeat + endpoint state
 *    with a random peer + seed nodes + potentially unreachable nodes.
 *  - Phi Accrual Failure Detector: each node independently decides if peers are up.
 *
 * Non-signature module: figures-only per locked plan (§6). Figure: 'partition-row-model'.
 */
export const m27: Module = {
  id: 'm27-wide-column',
  num: 27,
  section: 's6-nosql',
  order: 3,
  level: 'senior',
  signature: false,
  title: { en: 'Wide-column stores', uk: 'Wide-column stores' },
  tagline: {
    en: 'Cassandra & ScyllaDB: partition/clustering model, tunable consistency, LSM heritage.',
    uk: 'Cassandra і ScyllaDB: partition/clustering модель, tunable consistency, LSM-спадщина.',
  },
  readMins: 15,
  mentalModel: {
    en: 'Design your table around the query: the partition key is the only free WHERE clause.',
    uk: "Проектуйте таблицю під запит: partition key — єдиний безкоштовний WHERE clause.",
  },
  topics: [
    // ── Topic 1: The wide-column model ────────────────────────────────
    {
      id: 'partition-clustering-model',
      title: {
        en: 'The partition/clustering model — wide rows',
        uk: 'Partition/clustering модель — wide rows',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **wide-column store** is not a spreadsheet with columns — it is a model where each row can hold a different set of columns, and where a *partition* groups many rows under a single partition key. Apache **Cassandra** (latest stable: **5.0.7, released 2026-03-23**) describes itself as a *partitioned wide-column storage model*.\n\nEvery table has a **primary key** made of two parts:\n\n- **Partition key** (mandatory): hashed to determine which node(s) own the data. All rows sharing the same partition key live on the same set of replicas and can be fetched in a single I/O sweep. A query without the partition key must scan every partition — avoid it.\n- **Clustering key(s)** (optional): define the physical sort order of rows *within* a partition. You can think of a partition as a mini sorted table. In a `sensor_data` table, `(device_id)` might be the partition key and `timestamp DESC` the clustering key, giving you the latest readings first for free.\n\nThe term *wide row* comes from the fact that a single partition can hold millions of clustering-key/value pairs — e.g. every sensor reading for one device. This is the canonical Cassandra time-series pattern.",
            uk: "**Wide-column store** — це не таблиця зі стовпчиками, а модель, де кожен рядок може мати інший набір стовпчиків, а *partition* об'єднує багато рядків під єдиним partition key. Apache **Cassandra** (найновіша стабільна: **5.0.7, випущена 2026-03-23**) описує себе як *partitioned wide-column storage model*.\n\nКожна таблиця має **primary key** з двох частин:\n\n- **Partition key** (обов'язково): хешується для визначення того, які вузли зберігають дані. Всі рядки з однаковим partition key знаходяться на одному наборі реплік і можуть бути отримані одним I/O-sweep. Запит без partition key повинен сканувати кожну partition — уникайте цього.\n- **Clustering key(s)** (опційно): визначають фізичний порядок сортування рядків *усередині* partition. Уявіть partition як міні відсортовану таблицю. В таблиці `sensor_data` partition key може бути `(device_id)`, а clustering key — `timestamp DESC`, що безкоштовно дає найновіші зчитування першими.\n\nТермін *wide row* походить від того, що одна partition може містити мільйони пар clustering-key/value — наприклад, кожне зчитування сенсора для одного пристрою. Це канонічний Cassandra time-series патерн.",
          },
        },
        {
          kind: 'figure',
          fig: 'partition-row-model',
          caption: {
            en: 'A sensor_data table split into two partitions. The partition key (device_id) routes rows to a node via consistent hashing; the clustering key (timestamp DESC) sorts rows within each partition — enabling efficient range scans without a full table scan.',
            uk: 'Таблиця sensor_data, розбита на дві partition. Partition key (device_id) маршрутизує рядки до вузла через consistent hashing; clustering key (timestamp DESC) сортує рядки всередині кожної partition — дозволяючи ефективні range scans без повного сканування таблиці.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Partition key vs clustering key — roles and constraints',
            uk: 'Partition key проти clustering key — ролі та обмеження',
          },
          head: [
            { en: 'Attribute', uk: 'Атрибут' },
            { en: 'Partition key', uk: 'Partition key' },
            { en: 'Clustering key', uk: 'Clustering key' },
          ],
          rows: [
            [
              { en: 'Purpose', uk: 'Мета' },
              { en: 'Routes data to a node via the token ring', uk: 'Маршрутизує дані до вузла через token ring' },
              { en: 'Sorts rows within a partition (ASC/DESC)', uk: 'Сортує рядки всередині partition (ASC/DESC)' },
            ],
            [
              { en: 'Required?', uk: 'Обов\'язковий?' },
              { en: 'Yes — every table must have one', uk: 'Так — кожна таблиця повинна мати один' },
              { en: 'Optional — tables can have zero clustering keys', uk: 'Опційно — таблиці можуть не мати clustering keys' },
            ],
            [
              { en: 'Query filter', uk: 'Фільтр запиту' },
              { en: 'Must supply exact value (= only, no range)', uk: 'Треба вказати точне значення (лише =, без range)' },
              { en: 'Supports range filters (>, >=, <, <=)', uk: 'Підтримує range-фільтри (>, >=, <, <=)' },
            ],
            [
              { en: 'Cardinality sweet spot', uk: 'Оптимальна кардинальність' },
              { en: 'High — many distinct values (good distribution)', uk: 'Висока — багато різних значень (рівний розподіл)' },
              { en: 'Any — determines partition depth ("width")', uk: 'Будь-яка — визначає глибину partition ("ширину")' },
            ],
            [
              { en: 'Physical storage', uk: 'Фізичне зберігання' },
              { en: 'All rows on the same set of replicas (RF nodes)', uk: 'Всі рядки на одному наборі реплік (RF вузлів)' },
              { en: 'Rows stored in sorted order within the SSTable', uk: 'Рядки зберігаються у відсортованому порядку в SSTable' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Partition size limit', uk: 'Обмеження розміру partition' },
          md: {
            en: 'Cassandra has a soft 2 GB partition size limit, but in practice partitions above ~100 MB cause compaction and repair problems. If your wide row would grow unboundedly (e.g. all readings for a device forever), add a **bucketing** dimension to the partition key — for example `(device_id, year_month)` — so each partition stays bounded.',
            uk: "Cassandra має м'яке обмеження розміру partition у 2 ГБ, але на практиці partition вище ~100 МБ викликають проблеми з compaction і repair. Якщо ваш wide row зростає необмежено (наприклад, всі зчитування пристрою назавжди), додайте виміру **bucketing** до partition key — наприклад `(device_id, year_month)` — щоб кожна partition залишалась обмеженою.",
          },
        },
      ],
    },

    // ── Topic 2: Ring architecture ────────────────────────────────────
    {
      id: 'ring-architecture',
      title: {
        en: 'Ring architecture — peer-to-peer, vnodes, gossip',
        uk: 'Ring-архітектура — peer-to-peer, vnodes, gossip',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Cassandra has **no single master** — every node is equal. Data is distributed across a **consistent hashing ring**: each node owns one or more contiguous token ranges, and a row's partition key is hashed to a token to determine which node is its primary replica.\n\n**Virtual nodes (vnodes)** let each physical server own many small, non-contiguous token ranges rather than one large arc. The benefits: adding or removing a node shifts only K/N keys (not N-1/N as in naive hash sharding), and heterogeneous machines naturally get more vnodes proportional to their capacity.\n\n**Gossip protocol**: every second, each node picks a random peer and exchanges its *endpoint state* — which nodes it knows about, their load, schema version, and heartbeat counter. Within a few rounds, every node has a consistent view of the cluster without any central coordinator. A variant of the **Phi Accrual Failure Detector** turns the gossip heartbeat cadence into a probabilistic suspicion score, letting each node independently decide if a peer is down.",
            uk: "У Cassandra **немає єдиного master** — кожен вузол рівний. Дані розподілені по **consistent hashing ring**: кожен вузол володіє одним або кількома суміжними token ranges, і partition key рядка хешується до token, щоб визначити, який вузол є його первинною реплікою.\n\n**Virtual nodes (vnodes)** дозволяють кожному фізичному серверу володіти багатьма малими несуміжними token ranges, а не одним великим arc. Переваги: додавання або видалення вузла зміщує лише K/N ключів (не N-1/N як у наївному hash sharding), а різнорідні машини природньо отримують більше vnodes пропорційно до своєї потужності.\n\n**Gossip protocol**: щосекунди кожен вузол вибирає випадкового peer і обмінюється своїм *endpoint state* — які вузли йому відомі, їх навантаження, версія схеми і heartbeat лічильник. За кілька раундів кожен вузол має узгоджений погляд на кластер без будь-якого центрального координатора. Варіант **Phi Accrual Failure Detector** перетворює каденцію gossip heartbeat на імовірнісну оцінку підозри, дозволяючи кожному вузлу незалежно вирішувати, чи вузол-peer не відповідає.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Replication factor', uk: 'Replication factor' },
          md: {
            en: 'The **replication factor (RF)** controls how many nodes store a copy of each partition. `NetworkTopologyStrategy` with RF=3 per datacenter is the standard production setting — it tolerates one node failure without losing availability for `LOCAL_QUORUM` reads and writes.',
            uk: "**Replication factor (RF)** контролює, скільки вузлів зберігають копію кожної partition. `NetworkTopologyStrategy` з RF=3 на datacenter — це стандартне production-налаштування — воно витримує відмову одного вузла без втрати availability для `LOCAL_QUORUM` читань і записів.",
          },
        },
      ],
    },

    // ── Topic 3: Tunable consistency ──────────────────────────────────
    {
      id: 'tunable-consistency',
      title: {
        en: 'Tunable consistency — the W + R > RF formula',
        uk: 'Tunable consistency — формула W + R > RF',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Every read and write in Cassandra specifies a **consistency level (CL)** that determines how many replicas must respond before the coordinator returns to the client. Write operations are *always* sent to all RF replicas; the CL only controls how many ACKs the coordinator waits for.\n\n**The strong consistency formula: W + R > RF.** If the sum of write quorum + read quorum exceeds the replication factor, at least one replica participated in both the write *and* the read — guaranteeing the client sees the latest committed value.\n\nExample with RF=3:\n- `QUORUM` write (2 ACKs) + `QUORUM` read (2 ACKs) → 2+2=4 > 3 → **strongly consistent**.\n- `ONE` write + `ONE` read → 1+1=2 ≤ 3 → **eventually consistent** (the default).\n- `ALL` write + `ONE` read → 3+1=4 > 3 → consistent, but write availability drops to 0 on any node failure.\n\nThe sweet spot for most production workloads is `LOCAL_QUORUM` for both reads and writes — it provides strong consistency within a datacenter while tolerating one node failure, without the cross-datacenter latency penalty of `QUORUM`.",
            uk: "Кожен запит читання та запису у Cassandra вказує **consistency level (CL)**, що визначає, скільки реплік повинні відповісти до того, як координатор поверне відповідь клієнту. Write-операції *завжди* відправляються на всі RF-репліки; CL лише контролює, скільки ACK чекає координатор.\n\n**Формула сильної узгодженості: W + R > RF.** Якщо сума write quorum + read quorum перевищує replication factor, принаймні одна репліка брала участь і в запису, *і* в читанні — гарантуючи клієнту перегляд останнього підтвердженого значення.\n\nПриклад з RF=3:\n- `QUORUM` write (2 ACK) + `QUORUM` read (2 ACK) → 2+2=4 > 3 → **сильно узгоджений**.\n- `ONE` write + `ONE` read → 1+1=2 ≤ 3 → **eventually consistent** (за замовчуванням).\n- `ALL` write + `ONE` read → 3+1=4 > 3 → узгоджений, але availability запису падає до 0 при будь-якій відмові вузла.\n\nЗолота середина для більшості production-workloads — `LOCAL_QUORUM` для обох читань і записів — забезпечує сильну узгодженість у межах datacenter, витримуючи відмову одного вузла, без затримки `QUORUM` між datacenter.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Common consistency levels (RF=3)',
            uk: 'Поширені consistency levels (RF=3)',
          },
          head: [
            { en: 'Level', uk: 'Level' },
            { en: 'Replicas required', uk: 'Реплік потрібно' },
            { en: 'Strong with QUORUM partner?', uk: 'Сильна з QUORUM партнером?' },
            { en: 'Best for', uk: 'Найкраще для' },
          ],
          rows: [
            [
              { en: 'ONE', uk: 'ONE' },
              { en: '1', uk: '1' },
              { en: 'No — eventual', uk: 'Ні — eventual' },
              { en: 'Low-latency reads, cache-like use cases', uk: 'Читання з низькою затримкою, cache-подібні випадки' },
            ],
            [
              { en: 'LOCAL_ONE', uk: 'LOCAL_ONE' },
              { en: '1 (same DC)', uk: '1 (той самий DC)' },
              { en: 'No — eventual', uk: 'Ні — eventual' },
              { en: 'Cross-DC replication with local reads', uk: 'Крос-DC реплікація з локальними читаннями' },
            ],
            [
              { en: 'QUORUM', uk: 'QUORUM' },
              { en: '⌊RF/2⌋+1 = 2', uk: '⌊RF/2⌋+1 = 2' },
              { en: 'Yes (W=QUORUM, R=QUORUM)', uk: 'Так (W=QUORUM, R=QUORUM)' },
              { en: 'Global strong consistency across DCs', uk: 'Глобальна сильна узгодженість між DC' },
            ],
            [
              { en: 'LOCAL_QUORUM', uk: 'LOCAL_QUORUM' },
              { en: '⌊RF/2⌋+1 local', uk: '⌊RF/2⌋+1 локально' },
              { en: 'Yes (within DC)', uk: 'Так (у межах DC)' },
              { en: 'Production default — strong local, low cross-DC latency', uk: 'Production default — сильна локальна, низька крос-DC затримка' },
            ],
            [
              { en: 'ALL', uk: 'ALL' },
              { en: 'RF = 3', uk: 'RF = 3' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Maximum durability; zero tolerance for node failure', uk: 'Максимальна довговічність; нульова толерантність до відмов вузлів' },
            ],
          ],
        },
      ],
    },

    // ── Topic 4: LSM storage & compaction ─────────────────────────────
    {
      id: 'lsm-storage-compaction',
      title: {
        en: 'LSM storage — memtable, SSTables & compaction',
        uk: 'LSM storage — memtable, SSTables і compaction',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Cassandra inherits the **LSM-tree write path** from its design lineage (see M15 for the detailed LSM internals):\n\n1. **Commit log** — every write is first appended to an on-disk commit log (durability guarantee).\n2. **Memtable** — the write is applied to the in-memory memtable (fast, per-table sorted buffer).\n3. **Flush** — when the memtable reaches a threshold, it is flushed to an immutable **SSTable** on disk.\n4. **Compaction** — background process merges SSTables, purging tombstones and old versions.\n\nBecause SSTables are immutable, a single partition's rows may be spread across many SSTable files. Cassandra uses a **Bloom filter** (per SSTable) to avoid reading files that definitely do not contain the queried partition.\n\n**Cassandra 5.0 introduced UCS (Unified Compaction Strategy)** as the new recommended default, replacing the traditional STCS default. UCS adapts its behaviour across the size-tiered and leveled spectrums based on workload, reducing the need to manually choose a compaction strategy.",
            uk: "Cassandra успадковує **LSM-tree write path** (детальні внутрішні механізми LSM — у M15):\n\n1. **Commit log** — кожен запис спочатку дописується до on-disk commit log (гарантія довговічності).\n2. **Memtable** — запис застосовується до in-memory memtable (швидкий, per-table відсортований буфер).\n3. **Flush** — коли memtable досягає порогу, вона скидається до незмінного **SSTable** на диску.\n4. **Compaction** — фоновий процес об'єднує SSTables, очищаючи tombstones та старі версії.\n\nОскільки SSTables незмінні, рядки однієї partition можуть бути розкидані по багатьох SSTable-файлах. Cassandra використовує **Bloom filter** (на SSTable), щоб уникати читання файлів, які точно не містять запитуваної partition.\n\n**Cassandra 5.0 представила UCS (Unified Compaction Strategy)** як новий рекомендований default, замінивши традиційний STCS. UCS адаптує свою поведінку між size-tiered та leveled спектрами залежно від workload, зменшуючи потребу вручну обирати стратегію compaction.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Cassandra 5.0 compaction strategies',
            uk: 'Стратегії compaction у Cassandra 5.0',
          },
          head: [
            { en: 'Strategy', uk: 'Стратегія' },
            { en: 'How it works', uk: 'Як працює' },
            { en: 'Best for', uk: 'Найкраще для' },
            { en: 'Trade-off', uk: 'Компроміс' },
          ],
          rows: [
            [
              { en: 'UCS (Unified)', uk: 'UCS (Unified)' },
              { en: 'Adapts between size-tiered and leveled; new in 5.0', uk: "Адаптується між size-tiered і leveled; нова у 5.0" },
              { en: 'Most workloads (recommended default in 5.0)', uk: 'Більшість workloads (рекомендований default у 5.0)' },
              { en: 'New — less battle-tested than STCS/LCS', uk: 'Нова — менш перевірена ніж STCS/LCS' },
            ],
            [
              { en: 'STCS', uk: 'STCS' },
              { en: 'Merge SSTables of similar size tiers', uk: 'Об\'єднує SSTables подібного розміру' },
              { en: 'Write-heavy; large sequential data', uk: 'Write-heavy; великі sequential дані' },
              { en: 'High read amplification (many files per partition)', uk: 'Висока read amplification (багато файлів на partition)' },
            ],
            [
              { en: 'LCS', uk: 'LCS' },
              { en: 'Non-overlapping levels; compact to keep each level small', uk: 'Не-перетинні рівні; компактує щоб кожен рівень був малим' },
              { en: 'Read-heavy; predictable read latency', uk: 'Read-heavy; передбачувана read latency' },
              { en: 'High write amplification (~10×); more I/O per write', uk: 'Висока write amplification (~10×); більше I/O на запис' },
            ],
            [
              { en: 'TWCS', uk: 'TWCS' },
              { en: 'One SSTable per time window; old windows compact in isolation', uk: 'Один SSTable на time window; старі windows компактуються ізольовано' },
              { en: 'Time-series + TTL data (non-overlapping time buckets)', uk: 'Time-series + TTL дані (non-overlapping time buckets)' },
              { en: 'Requires time-ordered writes; breaks with out-of-order data', uk: 'Потребує time-ordered writes; ламається з out-of-order даними' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'The tombstone trap', uk: 'Пастка tombstone' },
          md: {
            en: 'DELETE in Cassandra writes a **tombstone** — a mutation record marking the row as deleted. Tombstones accumulate in SSTables and must be *read* when scanning a partition, inflating latency. They are only purged during compaction after `gc_grace_seconds` (default 10 days). Patterns that generate many deletes (e.g. expiring items, queue-draining) require careful compaction tuning and `TTL` on the data instead of explicit `DELETE` where possible.',
            uk: 'DELETE у Cassandra записує **tombstone** — запис мутації, що позначає рядок як видалений. Tombstones накопичуються в SSTables і повинні *читатися* при скануванні partition, збільшуючи latency. Вони очищаються лише під час compaction після `gc_grace_seconds` (за замовчуванням 10 днів). Патерни, що генерують багато видалень (наприклад, Items, що закінчуються, або queue-draining), потребують ретельного налаштування compaction та використання `TTL` на даних замість явних `DELETE` там, де це можливо.',
          },
        },
      ],
    },

    // ── Topic 5: CQL & query-first modeling ──────────────────────────
    {
      id: 'cql-query-first',
      title: {
        en: 'CQL & query-first data modeling',
        uk: 'CQL і query-first моделювання даних',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**CQL (Cassandra Query Language)** looks like SQL but operates on a fundamentally different physical model. It was introduced in Cassandra 0.8 (2011) and is the primary interface since Cassandra 1.2 (CQL3, 2013).\n\nKey rules that differentiate CQL from SQL:\n- **No JOINs, no subqueries, no foreign keys.** Each table must be self-contained.\n- **No arbitrary WHERE.** Only the partition key can be used without `ALLOW FILTERING` (a full-cluster scan — avoid in production). Clustering key predicates are allowed after the partition key.\n- **No ORDER BY on any column.** You can only ORDER BY clustering key columns, and only in the direction declared at `CREATE TABLE`.\n- **Denormalization is mandatory.** If you need the same data in two query patterns, create two tables — one per query. This is not a limitation to work around; it is the design.\n\nA `CREATE TABLE` in CQL is fundamentally a query declaration:\n```sql\n-- Query: \"latest N readings for a device\"\nCREATE TABLE sensor_data (\n  device_id  text,\n  ts         timestamp,\n  temp       float,\n  battery    int,\n  PRIMARY KEY ((device_id), ts)\n) WITH CLUSTERING ORDER BY (ts DESC);\n\n-- This table answers: SELECT * FROM sensor_data WHERE device_id = ? LIMIT N;\n-- It does NOT answer: SELECT * FROM sensor_data WHERE temp > 30;\n```",
            uk: "**CQL (Cassandra Query Language)** виглядає як SQL, але працює на принципово іншій фізичній моделі. Введений у Cassandra 0.8 (2011 р.) і є основним інтерфейсом з Cassandra 1.2 (CQL3, 2013 р.).\n\nКлючові правила, що відрізняють CQL від SQL:\n- **Без JOINs, без subqueries, без foreign keys.** Кожна таблиця повинна бути самодостатньою.\n- **Без довільного WHERE.** Лише partition key можна використовувати без `ALLOW FILTERING` (повне сканування кластера — уникайте у production). Предикати clustering key дозволені після partition key.\n- **Без ORDER BY на будь-якому стовпчику.** ORDER BY можна лише по clustering key columns, і лише у напрямку, оголошеному при `CREATE TABLE`.\n- **Денормалізація обов'язкова.** Якщо потрібні однакові дані для двох патернів запитів, створіть дві таблиці — по одній на запит. Це не обмеження для обходу; це дизайн.\n\n`CREATE TABLE` у CQL — це по суті оголошення запиту:\n```sql\n-- Запит: \"останні N зчитувань для пристрою\"\nCREATE TABLE sensor_data (\n  device_id  text,\n  ts         timestamp,\n  temp       float,\n  battery    int,\n  PRIMARY KEY ((device_id), ts)\n) WITH CLUSTERING ORDER BY (ts DESC);\n\n-- Ця таблиця відповідає: SELECT * FROM sensor_data WHERE device_id = ? LIMIT N;\n-- Вона НЕ відповідає: SELECT * FROM sensor_data WHERE temp > 30;\n```",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Cassandra / wide-column', uk: 'Cassandra / wide-column' },
          b: { en: 'PostgreSQL / relational', uk: 'PostgreSQL / реляційний' },
          rows: [
            [
              { en: 'Schema design', uk: 'Дизайн схеми' },
              { en: 'Query-first: one table per query pattern', uk: 'Query-first: одна таблиця на патерн запиту' },
              { en: 'Entity-first: normalize, then add indexes for queries', uk: "Entity-first: нормалізуй, потім додай indexes для запитів" },
            ],
            [
              { en: 'JOINs', uk: 'JOINs' },
              { en: 'Not supported — denormalize into each table', uk: 'Не підтримуються — денормалізуй у кожну таблицю' },
              { en: 'First-class: INNER, LEFT, FULL, cross-partition', uk: 'Першокласні: INNER, LEFT, FULL, cross-partition' },
            ],
            [
              { en: 'Filtering', uk: 'Фільтрація' },
              { en: 'Only on partition + clustering key (ALLOW FILTERING = full scan)', uk: 'Тільки на partition + clustering key (ALLOW FILTERING = full scan)' },
              { en: 'Arbitrary WHERE; optimizer chooses the access path', uk: 'Довільний WHERE; optimizer обирає шлях доступу' },
            ],
            [
              { en: 'Transactions', uk: 'Транзакції' },
              { en: 'Lightweight Transactions (LWT) for single-partition CAS only', uk: 'Lightweight Transactions (LWT) лише для single-partition CAS' },
              { en: 'Full ACID multi-statement transactions', uk: 'Повні ACID multi-statement транзакції' },
            ],
            [
              { en: 'Scale-out', uk: 'Scale-out' },
              { en: 'Linear: add nodes to the ring, rebalances automatically', uk: 'Лінійний: додай вузли до ring, автоматичне перебалансування' },
              { en: 'Vertical first; horizontal sharding is an application concern', uk: 'Спочатку вертикальний; горизонтальний sharding — відповідальність застосунку' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'ScyllaDB: the C++ Cassandra', uk: 'ScyllaDB: C++ Cassandra' },
          md: {
            en: 'ScyllaDB (current stable: **2026.1**) is a full C++ rewrite of Cassandra on the **Seastar** framework: one thread per core, shared-nothing, async I/O, each vCPU owns its own shard (dedicated memtable, SSTable I/O, cache, and network queue). No lock contention between cores. ScyllaDB is CQL-compatible and is a drop-in replacement for Cassandra in most cases. Choose ScyllaDB when you need Cassandra\'s model with higher throughput and lower p99 tail latency on the same hardware.',
            uk: 'ScyllaDB (поточна стабільна: **2026.1**) — це повне переписання Cassandra на C++ за допомогою фреймворку **Seastar**: один потік на core, shared-nothing, async I/O, кожен vCPU має власний shard (виділений memtable, SSTable I/O, cache та мережева черга). Жодної lock contention між cores. ScyllaDB сумісний з CQL і є drop-in заміною Cassandra у більшості випадків. Обирайте ScyllaDB, коли потрібна модель Cassandra з вищим throughput і меншою p99 tail latency на тому самому hardware.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'ALLOW FILTERING is a code smell', uk: 'ALLOW FILTERING — code smell' },
          md: {
            en: '`ALLOW FILTERING` forces Cassandra to scan every partition in the cluster to satisfy the query — it is the equivalent of `SELECT * FROM big_table` in PostgreSQL with no index. It works in development but will time out or OOM under production load. The fix is always to redesign the table so the query uses the partition key.',
            uk: '`ALLOW FILTERING` змушує Cassandra сканувати кожну partition у кластері для задоволення запиту — це еквівалент `SELECT * FROM big_table` у PostgreSQL без index. Він працює при розробці, але завершиться timeout або OOM під production навантаженням. Виправлення завжди полягає у перепроектуванні таблиці так, щоб запит використовував partition key.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Design tables around queries, not entities — Cassandra has no JOINs, so every query pattern needs its own table.',
      uk: 'Проектуйте таблиці навколо запитів, а не сутностей — у Cassandra немає JOINs, тому кожен патерн запиту потребує власної таблиці.',
    },
    {
      en: 'The partition key is the only free WHERE clause — always supply it; everything else triggers a full cluster scan (ALLOW FILTERING).',
      uk: 'Partition key — єдиний безкоштовний WHERE clause — завжди вказуйте його; все інше ініціює повне сканування кластера (ALLOW FILTERING).',
    },
    {
      en: 'Strong consistency formula: W + R > RF. LOCAL_QUORUM + LOCAL_QUORUM with RF=3 is the production standard — tolerates one node failure.',
      uk: 'Формула сильної узгодженості: W + R > RF. LOCAL_QUORUM + LOCAL_QUORUM з RF=3 — production стандарт — витримує відмову одного вузла.',
    },
    {
      en: 'LSM write path (commit log → memtable → SSTable) makes writes fast; Bloom filters make point reads acceptable; tombstones are the main operational hazard.',
      uk: 'LSM write path (commit log → memtable → SSTable) робить записи швидкими; Bloom filters роблять точкові читання прийнятними; tombstones — головна операційна небезпека.',
    },
    {
      en: 'No single point of failure: peer-to-peer ring with vnodes and gossip. Adding nodes shifts only K/N keys; the cluster self-heals.',
      uk: "Жодної єдиної точки відмови: peer-to-peer ring з vnodes і gossip. Додавання вузлів зміщує лише K/N ключів; кластер самовідновлюється.",
    },
  ],

  pitfalls: [
    {
      title: { en: 'Modeling like a relational database', uk: 'Моделювання як реляційна база даних' },
      body: {
        en: 'Normalizing data and expecting JOINs will fail. Cassandra requires denormalization — accept data duplication as the cost of distributed, join-free querying.',
        uk: "Нормалізація даних і очікування JOINs призведуть до невдачі. Cassandra вимагає денормалізації — прийміть дублювання даних як вартість розподілених, join-вільних запитів.",
      },
    },
    {
      title: { en: 'Unbounded partition growth', uk: 'Необмежений ріст partition' },
      body: {
        en: 'A partition that grows forever (e.g. all events for a user, ever) eventually becomes a hot spot and a compaction problem. Always include a time bucket in the partition key for append-heavy, time-ordered data.',
        uk: "Partition, що зростає вічно (наприклад, всі події для користувача, назавжди) в кінцевому підсумку стає гарячою точкою та проблемою compaction. Завжди включайте time bucket у partition key для append-heavy, time-ordered даних.",
      },
    },
    {
      title: { en: 'Tombstone accumulation from heavy deletes', uk: 'Накопичення tombstone від масових видалень' },
      body: {
        en: 'Queue-style patterns (write → read → delete) are a tombstone factory. Use TTL columns instead of DELETE, prefer TWCS compaction for time-series, and monitor `tombstone_scanned` in query traces.',
        uk: "Queue-style патерни (write → read → delete) — це фабрика tombstone. Використовуйте TTL columns замість DELETE, надавайте перевагу TWCS compaction для time-series, і моніторте `tombstone_scanned` в query traces.",
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: {
        en: 'How does Cassandra achieve strong consistency, and what is the formula?',
        uk: 'Як Cassandra досягає сильної узгодженості і яка формула?',
      },
      a: {
        en: 'Strong consistency requires W + R > RF. With RF=3, writing at QUORUM (2 ACKs) and reading at QUORUM (2 ACKs) gives 4 > 3, guaranteeing at least one replica was in both the write and read sets. LOCAL_QUORUM for both sides of the equation is the production standard — it confines the quorum to a single datacenter, avoiding cross-DC latency.',
        uk: 'Сильна узгодженість потребує W + R > RF. З RF=3, запис на QUORUM (2 ACK) і читання на QUORUM (2 ACK) дає 4 > 3, гарантуючи, що принаймні одна репліка була як у write, так і в read наборах. LOCAL_QUORUM для обох сторін рівняння — production стандарт — він обмежує quorum одним datacenter, уникаючи крос-DC затримки.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Why can a Cassandra query without a partition key be catastrophic in production?',
        uk: 'Чому запит Cassandra без partition key може бути катастрофічним у production?',
      },
      a: {
        en: 'Without the partition key, the coordinator must scatter the query to every node in the cluster (ALLOW FILTERING). Each node must scan all its local SSTables for matches. At production scale this is an O(total data) operation rather than O(partition size), causing timeouts, GC pressure, and in severe cases node crashes. The fix is always schema redesign — create a table whose primary key matches the query pattern.',
        uk: "Без partition key координатор повинен розсилати запит до кожного вузла в кластері (ALLOW FILTERING). Кожен вузол повинен сканувати всі свої локальні SSTables на збіги. При production масштабі це O(total data) операція, а не O(partition size), що спричиняє timeouts, GC pressure і у важких випадках збій вузлів. Виправлення завжди полягає у перепроектуванні схеми — створіть таблицю, primary key якої відповідає патерну запиту.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'How does ScyllaDB\'s shard-per-core architecture differ from Cassandra\'s threading model, and when does it matter?',
        uk: 'Чим shard-per-core архітектура ScyllaDB відрізняється від threading моделі Cassandra, і коли це важливо?',
      },
      a: {
        en: 'Cassandra uses a traditional thread-pool model with shared data structures protected by locks, leading to lock contention and context switching at high concurrency. ScyllaDB (on the Seastar framework) assigns each vCPU its own shard: a dedicated memtable, SSTable I/O path, network queue, and cache — no shared mutable state between cores. This eliminates lock contention entirely. It matters most under high-concurrency, latency-sensitive workloads where Cassandra\'s thread scheduler becomes a bottleneck (p99 tail latency); ScyllaDB typically delivers significantly lower and more stable p99/p999 latencies on the same hardware.',
        uk: "Cassandra використовує традиційну thread-pool модель зі спільними структурами даних, захищеними locks, що призводить до lock contention і context switching при високому паралелізмі. ScyllaDB (на фреймворку Seastar) призначає кожному vCPU власний shard: виділений memtable, SSTable I/O path, мережеву чергу і cache — жодного спільного змінного стану між cores. Це повністю усуває lock contention. Це має значення найбільше при високопаралельних, latency-чутливих workloads, де scheduler потоків Cassandra стає вузьким місцем (p99 tail latency); ScyllaDB зазвичай забезпечує значно нижчі та більш стабільні p99/p999 latencies на тому самому hardware.",
      },
    },
  ],

  seeAlso: ['m15-lsm', 'm21-replication', 'm22-sharding', 'm23-cap', 'm26-key-value'],

  sources: [
    {
      title: 'Apache Cassandra 5.0 — Architecture Overview',
      url: 'https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html',
    },
    {
      title: 'Apache Cassandra 5.0 — Dynamo (ring, vnodes, gossip, consistency levels)',
      url: 'https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html',
    },
    {
      title: 'Apache Cassandra 5.0 — Storage Engine (commit log, memtable, SSTable, Bloom filter)',
      url: 'https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html',
    },
    {
      title: 'Apache Cassandra 5.0 — Compaction (UCS, STCS, LCS, TWCS, tombstones)',
      url: 'https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html',
    },
    {
      title: 'ScyllaDB Shard-per-Core Architecture',
      url: 'https://www.scylladb.com/product/technology/shard-per-core-architecture/',
    },
    {
      title: 'Apache Cassandra 5.0.7 — Download (verified latest stable)',
      url: 'https://cassandra.apache.org/_/download.html',
    },
  ],
};
