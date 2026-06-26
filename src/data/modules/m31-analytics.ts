// M31 · Analytics, columnar & time-series [senior] — S16
// Web-verified 2026-06-26:
//   ClickHouse v26.2 (2026-02-26; CalVer YY.M) — columnar, vectorized execution, MergeTree engine
//     family, materialized views that aggregate on INSERT, projections. VLDB 2024 paper (Schulze
//     et al., "ClickHouse — Lightning Fast Analytics for Everyone").
//   DuckDB 1.x (1.5.2, Apr 2026; v2.0 expected Fall 2026) — in-process/embedded columnar OLAP
//     ("SQLite for analytics"); reads Parquet/CSV/JSON directly (incl. s3://) with predicate
//     pushdown; ~10× faster than pandas on Parquet. DuckLake 1.0 lakehouse extension.
//   TimescaleDB — Postgres extension; company rebranded to TigerData (2025-06-17); the EXTENSION
//     stays "TimescaleDB". Hypertables (auto time/space chunking), continuous aggregates
//     (incremental refresh), native columnar compression (~90–95%), retention + tiered storage to
//     S3. Dual-licensed: Apache-2.0 (Open Source core) + Timescale License/TSL (Community:
//     compression, continuous aggregates, retention) — free to self-host, MAY NOT be resold as DBaaS.
//   InfluxDB 3 Core + Enterprise GA 2025-04-15 — full rewrite in Rust on the FDAP stack (Apache
//     Flight + DataFusion + Arrow + Parquet), columnar, unlimited cardinality, object-store native.
//   Lakehouse: Parquet = columnar file format; open table formats add ACID/schema-evolution/
//     time-travel: Apache Iceberg (the converging industry standard — vendor-neutral, partition
//     evolution; Databricks bought Tabular >$1B mid-2024; AWS S3 Tables; Snowflake Polaris),
//     Delta Lake (largest installed base, Databricks-native, UniForm), Apache Hudi (streaming/CDC).
import type { Module } from '../types';

const m31: Module = {
  id:        'm31-analytics',
  num:       31,
  section:   's7-modern',
  order:     3,
  level:     'senior',
  signature: false,
  readMins:  12,

  title:   { en: 'Analytics, columnar & time-series', uk: 'Аналітика, columnar і time-series' },
  tagline: {
    en: 'Columnar + vectorized execution, ClickHouse & DuckDB, TimescaleDB/InfluxDB, the lakehouse.',
    uk: 'Columnar + vectorized execution, ClickHouse і DuckDB, TimescaleDB/InfluxDB, lakehouse.',
  },

  mentalModel: {
    en: 'Scan columns, not rows — OLAP is a different machine from OLTP.',
    uk: 'Скануйте колонки, а не рядки — OLAP — це інша машина, ніж OLTP.',
  },

  topics: [
    // ── Topic 1: columnar storage & vectorized execution ──────────────────
    {
      id:    'columnar-execution',
      title: { en: 'Columnar storage & vectorized execution', uk: 'Columnar storage та vectorized execution' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'OLTP and OLAP are two different machines. OLTP (your transactional primary) reads and writes a few whole rows at a time — "fetch order 4711", "insert this payment". OLAP (analytics) scans millions of rows but only a few columns — "sum revenue by month over three years". A **row store** keeps each row contiguous on disk, so the query `SELECT sum(amount) FROM sales` on a 50-column table drags all 50 columns off disk just to read one. A **column store** keeps each column contiguous, so it reads only the `amount` column — a fraction of the I/O.\n\nTwo more wins follow from storing a column together. First, **compression**: a column holds values of one type, often repetitive, so run-length, dictionary, and delta encoding shrink it 5–20×, cutting I/O again. Second, **vectorized execution**: instead of the classic tuple-at-a-time (Volcano) model, the engine processes columns in batches of thousands of values through tight CPU loops that the compiler can auto-vectorize to SIMD. Less I/O, less per-row overhead, more cache- and CPU-friendly — that is why a column store can be orders of magnitude faster on an aggregate.',
            uk: 'OLTP та OLAP — це дві різні машини. OLTP (ваш транзакційний primary) читає та пише кілька цілих рядків за раз — «дістати замовлення 4711», «вставити цей платіж». OLAP (аналітика) сканує мільйони рядків, але лише кілька колонок — «сума виручки за місяцями за три роки». **Row store** тримає кожен рядок суцільним на диску, тож запит `SELECT sum(amount) FROM sales` на таблиці з 50 колонок витягує всі 50 колонок з диска лише щоб прочитати одну. **Column store** тримає суцільною кожну колонку, тож читає лише колонку `amount` — частку I/O.\n\nЗі зберігання колонки разом випливають ще два виграші. По-перше, **compression**: колонка містить значення одного типу, часто повторювані, тож run-length, dictionary та delta encoding стискають її у 5–20×, знову зменшуючи I/O. По-друге, **vectorized execution**: замість класичної моделі tuple-at-a-time (Volcano), движок обробляє колонки батчами по тисячі значень через щільні CPU-цикли, які компілятор авто-векторизує у SIMD. Менше I/O, менше накладних витрат на рядок, дружніше до cache і CPU — ось чому column store може бути на порядки швидшим на агрегаті.',
          },
        },
        {
          kind: 'figure',
          fig: 'columnar-scan',
          caption: {
            en: 'Same data, same query (sum of one column): a row store reads every column off disk; a column store reads only the one column it needs — and that column compresses hard.',
            uk: 'Ті самі дані, той самий запит (сума однієї колонки): row store читає кожну колонку з диска; column store читає лише потрібну колонку — і ця колонка добре стискається.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Why a column compresses: values of one type sit together', uk: 'Чому колонка стискається: значення одного типу лежать поруч' },
          head: [
            { en: 'Encoding', uk: 'Encoding' },
            { en: 'What it does', uk: 'Що робить' },
            { en: 'Great for', uk: 'Гарно для' },
          ],
          rows: [
            [
              { en: 'Run-length (RLE)', uk: 'Run-length (RLE)' },
              { en: 'Stores "value × count" for repeated runs', uk: 'Зберігає «value × count» для повторюваних серій' },
              { en: 'Sorted / low-cardinality columns (status, country)', uk: 'Сортовані / low-cardinality колонки (status, country)' },
            ],
            [
              { en: 'Dictionary', uk: 'Dictionary' },
              { en: 'Maps distinct values → small integer codes', uk: 'Мапить унікальні значення → малі цілі коди' },
              { en: 'Repeated strings (city, event type)', uk: 'Повторювані рядки (city, event type)' },
            ],
            [
              { en: 'Delta / delta-of-delta', uk: 'Delta / delta-of-delta' },
              { en: 'Stores differences between adjacent values', uk: 'Зберігає різниці між сусідніми значеннями' },
              { en: 'Monotonic columns (timestamps, ids)', uk: 'Монотонні колонки (timestamps, id)' },
            ],
            [
              { en: 'Frame-of-reference (FOR)', uk: 'Frame-of-reference (FOR)' },
              { en: 'Stores small offsets from a base value', uk: 'Зберігає малі зсуви від базового значення' },
              { en: 'Numeric columns in a narrow range', uk: 'Числові колонки у вузькому діапазоні' },
            ],
          ],
        },
        {
          kind: 'compare',
          a: { en: 'OLTP machine (row store)', uk: 'OLTP-машина (row store)' },
          b: { en: 'OLAP machine (column store)', uk: 'OLAP-машина (column store)' },
          rows: [
            [
              { en: 'Access pattern', uk: 'Патерн доступу' },
              { en: 'Few whole rows; point lookups + writes', uk: 'Кілька цілих рядків; point lookups + записи' },
              { en: 'Few columns × millions of rows; scans + aggregates', uk: 'Кілька колонок × мільйони рядків; scans + агрегати' },
            ],
            [
              { en: 'Storage + index', uk: 'Зберігання + index' },
              { en: 'Row-contiguous heap + B-Tree', uk: 'Row-суцільний heap + B-Tree' },
              { en: 'Column-contiguous + compression + sort key', uk: 'Column-суцільний + compression + sort key' },
            ],
            [
              { en: 'Execution', uk: 'Виконання' },
              { en: 'Tuple-at-a-time, index-driven', uk: 'Tuple-at-a-time, керований index' },
              { en: 'Vectorized batches, SIMD', uk: 'Vectorized батчі, SIMD' },
            ],
            [
              { en: 'Sweet spot', uk: 'Сильна сторона' },
              { en: 'Many small concurrent transactions', uk: 'Багато малих конкурентних транзакцій' },
              { en: 'Few large aggregate queries over big data', uk: 'Кілька великих агрегатних запитів над big data' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Compression is a first-class feature of columnar, not an afterthought', uk: 'Compression — першокласна риса columnar, а не додаток' },
          md: {
            en: 'In a row store, compression fights the access pattern (you decompress a whole block to read one row). In a column store, compression *helps* the access pattern: less data on disk means less to scan, and many operators (counts, filters, aggregates) can run directly on the encoded data without fully decompressing. The sort/order key matters — order rows so that low-cardinality columns form long runs, and RLE does the rest.',
            uk: 'У row store compression бореться з патерном доступу (ви розпаковуєте цілий блок, щоб прочитати один рядок). У column store compression *допомагає* патерну доступу: менше даних на диску означає менше сканувати, а багато операторів (counts, filters, aggregates) можуть працювати прямо на закодованих даних без повної розпаковки. Sort/order key має значення — впорядкуйте рядки так, щоб low-cardinality колонки утворювали довгі серії, і RLE зробить решту.',
          },
        },
      ],
    },

    // ── Topic 2: ClickHouse & DuckDB ──────────────────────────────────────
    {
      id:    'clickhouse-duckdb',
      title: { en: 'ClickHouse & DuckDB — two ends of OLAP', uk: 'ClickHouse та DuckDB — два кінці OLAP' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**ClickHouse v26.2** is a columnar database *server* built for large-scale, high-concurrency real-time analytics. Its storage is the **MergeTree** engine family — data lands in sorted, immutable parts that background merges combine (LSM-like), with per-column compression and a sort key that drives both compression and scan locality. ClickHouse runs vectorized SQL, scales out by sharding + replication, and offers **materialized views that aggregate on INSERT** (the rollup is maintained as data arrives, not recomputed on read) plus projections (alternative sort orders of the same table). It powers observability, product analytics, and clickstream workloads at petabyte scale.\n\n**DuckDB** is the opposite shape: an **in-process** columnar engine — "the SQLite of analytics". There is no server; you embed the library inside Python, R, Node, or the CLI and it runs in your process. It reads **Parquet, CSV, and JSON directly** (from local disk or `s3://`) with predicate and projection pushdown, so you can run SQL over lake files with no load step. It is vectorized, single-node, MIT-licensed, and routinely ~10× faster than pandas on the same Parquet. ClickHouse is the warehouse engine; DuckDB is the analyst-in-a-library.',
            uk: '**ClickHouse v26.2** — це колонковий *сервер* бази даних, створений для масштабної real-time аналітики з високою конкурентністю. Його зберігання — родина движків **MergeTree** — дані потрапляють у сортовані незмінні parts, які фонові merges обʼєднують (LSM-подібно), з per-column compression і sort key, що керує і compression, і локальністю scan. ClickHouse виконує vectorized SQL, масштабується через sharding + replication і пропонує **materialized views, що агрегують на INSERT** (rollup підтримується в міру надходження даних, а не перераховується на читанні) плюс projections (альтернативні sort orders тієї ж таблиці). Він живить observability, product analytics та clickstream-навантаження на petabyte-масштабі.\n\n**DuckDB** — протилежна форма: **in-process** колонковий движок — «SQLite для аналітики». Сервера немає; ви вбудовуєте бібліотеку всередину Python, R, Node чи CLI, і вона працює у вашому процесі. Вона читає **Parquet, CSV та JSON напряму** (з локального диска чи `s3://`) з predicate та projection pushdown, тож можна виконувати SQL над lake-файлами без кроку завантаження. Вона vectorized, single-node, під ліцензією MIT і зазвичай у ~10× швидша за pandas на тому ж Parquet. ClickHouse — це движок-сховище; DuckDB — аналітик-у-бібліотеці.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- ClickHouse: a columnar MergeTree table; the ORDER BY is the sort key
CREATE TABLE events
(
    ts       DateTime,
    user_id  UInt64,
    event    LowCardinality(String),   -- dictionary-encoded automatically
    amount   Decimal(18, 2)
)
ENGINE = MergeTree
ORDER BY (event, ts);                  -- drives compression + scan locality

-- DuckDB: query Parquet on S3 directly — no server, no load step
SELECT event, count(*), sum(amount)
FROM 's3://bucket/events/*.parquet'    -- reads only 3 columns; predicate pushdown
WHERE ts >= '2026-06-01'
GROUP BY event;`,
          note: {
            en: 'ClickHouse maintains the sorted parts as data arrives; DuckDB scans Parquet in-process, touching only the columns and row-groups the query needs.',
            uk: 'ClickHouse підтримує сортовані parts у міру надходження даних; DuckDB сканує Parquet in-process, торкаючись лише колонок та row-groups, потрібних запиту.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'The analytics / OLAP engine landscape (2026)', uk: 'Ландшафт analytics / OLAP движків (2026)' },
          head: [
            { en: 'Engine', uk: 'Engine' },
            { en: 'Shape', uk: 'Форма' },
            { en: 'Best for', uk: 'Найкраще для' },
          ],
          rows: [
            [
              { en: 'ClickHouse', uk: 'ClickHouse' },
              { en: 'Columnar server, sharded', uk: 'Колонковий сервер, sharded' },
              { en: 'Real-time analytics at scale; observability, clickstream', uk: 'Real-time аналітика на масштабі; observability, clickstream' },
            ],
            [
              { en: 'DuckDB', uk: 'DuckDB' },
              { en: 'In-process library', uk: 'In-process бібліотека' },
              { en: 'Local / notebook analytics; query engine over Parquet', uk: 'Локальна / notebook аналітика; движок запитів над Parquet' },
            ],
            [
              { en: 'StarRocks / Apache Doris', uk: 'StarRocks / Apache Doris' },
              { en: 'Columnar MPP, MySQL wire', uk: 'Колонковий MPP, MySQL wire' },
              { en: 'Low-latency BI dashboards, joins on the lake', uk: 'Low-latency BI dashboards, joins на lake' },
            ],
            [
              { en: 'Apache Druid / Pinot', uk: 'Apache Druid / Pinot' },
              { en: 'Real-time ingest + serving', uk: 'Real-time ingest + serving' },
              { en: 'Sub-second user-facing analytics, high concurrency', uk: 'Sub-second user-facing аналітика, висока конкурентність' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A ClickHouse materialized view is not a Postgres materialized view', uk: 'ClickHouse materialized view — це не Postgres materialized view' },
          md: {
            en: 'In Postgres a materialized view is a snapshot you `REFRESH` (M11). A ClickHouse materialized view is an **insert trigger**: each block inserted into the source table is transformed and written to the target (often an aggregating engine) as it arrives, so the rollup is always current with no refresh job. Powerful — but it only sees *new* inserts, so backfilling history is a separate, deliberate step.',
            uk: 'У Postgres materialized view — це снапшот, який ви `REFRESH` (M11). ClickHouse materialized view — це **insert-тригер**: кожен блок, вставлений у source-таблицю, трансформується і записується у target (часто aggregating engine) у міру надходження, тож rollup завжди актуальний без refresh-завдання. Потужно — але він бачить лише *нові* inserts, тож backfill історії — окремий свідомий крок.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'DuckDB needs no server — that is the point', uk: 'DuckDB не потребує сервера — у цьому суть' },
          md: {
            en: 'Reach for DuckDB when the data fits one machine (which today means up to terabytes) and you want SQL without standing up infrastructure: ad-hoc analysis in a notebook, a transformation step in a pipeline, or an embedded analytics engine inside an application. It also makes a fine local query engine over your lakehouse Parquet — no cluster required.',
            uk: 'Беріть DuckDB, коли дані вміщуються на одну машину (що сьогодні означає до терабайтів) і ви хочете SQL без розгортання інфраструктури: ad-hoc аналіз у notebook, крок трансформації у pipeline чи вбудований аналітичний движок усередині застосунку. Він також чудовий локальний движок запитів над вашим lakehouse Parquet — кластер не потрібен.',
          },
        },
      ],
    },

    // ── Topic 3: time-series — TimescaleDB & InfluxDB 3 ───────────────────
    {
      id:    'time-series',
      title: { en: 'Time-series: TimescaleDB & InfluxDB 3', uk: 'Time-series: TimescaleDB та InfluxDB 3' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Time-series is a specialized analytics shape: data is **append-mostly**, arrives **in time order**, is read **recent-heavy**, and is governed by **retention** (drop old data) and **downsampling** (keep coarse rollups, discard raw detail). Metrics, IoT sensors, financial ticks, and observability all fit it. Two camps serve it.\n\n**TimescaleDB** is a **Postgres extension** that teaches Postgres this shape. A **hypertable** is one logical table automatically partitioned into **chunks** by time (and optionally by a space dimension); the planner prunes to the chunks a query needs. On top it adds **continuous aggregates** (rollups that refresh *incrementally* — only changed time buckets recompute), native **columnar compression** of old chunks (~90–95%), and **retention** + tiered storage to S3. You keep full SQL, joins, and the Postgres ecosystem. (The company rebranded to **TigerData** in 2025; the extension is still called TimescaleDB.)\n\n**InfluxDB 3** is the purpose-built camp, rewritten from scratch in **Rust** on the **FDAP stack** — Apache **F**light + **D**ataFusion + **A**rrow + **P**arquet. It is columnar, handles **unlimited cardinality** (the weakness of InfluxDB 1/2), and is object-store native, persisting data as Parquet. Core (open source) and Enterprise editions went GA in April 2025.',
            uk: 'Time-series — це спеціалізована форма аналітики: дані **переважно append**, надходять **у часовому порядку**, читаються **з нахилом на свіже** і керуються **retention** (видаляти старі дані) та **downsampling** (тримати грубі rollups, відкидати сирі деталі). Metrics, IoT-сенсори, фінансові ticks та observability — все підходить. Два табори обслуговують це.\n\n**TimescaleDB** — це **Postgres extension**, що навчає Postgres цій формі. **Hypertable** — це одна логічна таблиця, автоматично розбита на **chunks** за часом (і опційно за просторовим виміром); планувальник відсікає до chunks, потрібних запиту. Згори додаються **continuous aggregates** (rollups, що оновлюються *інкрементально* — перераховуються лише змінені time buckets), нативна **columnar compression** старих chunks (~90–95%) та **retention** + tiered storage до S3. Ви зберігаєте повний SQL, joins та екосистему Postgres. (Компанія перейменувалась на **TigerData** у 2025; extension досі зветься TimescaleDB.)\n\n**InfluxDB 3** — табір спеціалізованих систем, переписаний з нуля на **Rust** на **FDAP stack** — Apache **F**light + **D**ataFusion + **A**rrow + **P**arquet. Він колонковий, тримає **unlimited cardinality** (слабкість InfluxDB 1/2) і object-store-native, зберігаючи дані як Parquet. Core (open source) та Enterprise редакції вийшли у GA у квітні 2025.',
          },
        },
        {
          kind: 'figure',
          fig: 'hypertable',
          caption: {
            en: 'A hypertable is one logical table split into time chunks: recent chunks stay row-format for fast writes, older chunks are compressed columnar, and chunks past the retention window are dropped whole.',
            uk: 'Hypertable — це одна логічна таблиця, розбита на time chunks: свіжі chunks лишаються у row-форматі для швидких записів, старіші — стиснуті columnar, а chunks за межею retention видаляються цілком.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- TimescaleDB: turn a plain table into a hypertable (auto time-partitioned)
SELECT create_hypertable('metrics', by_range('ts', INTERVAL '1 day'));

-- continuous aggregate: an incrementally-refreshed hourly rollup
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', ts) AS hour,
         device_id, avg(value), max(value)
  FROM metrics
  GROUP BY hour, device_id;

-- compress chunks older than 7 days; drop chunks older than 1 year
ALTER TABLE metrics SET (timescaledb.compress,
                         timescaledb.compress_segmentby = 'device_id');
SELECT add_compression_policy('metrics', INTERVAL '7 days');
SELECT add_retention_policy('metrics',  INTERVAL '1 year');`,
          note: {
            en: 'Hypertable + continuous aggregate + compression/retention policies — the three moves that turn Postgres into a time-series engine, all in SQL.',
            uk: 'Hypertable + continuous aggregate + compression/retention policies — три кроки, що перетворюють Postgres на time-series движок, усе у SQL.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'TimescaleDB (Postgres extension)', uk: 'TimescaleDB (Postgres extension)' },
          b: { en: 'InfluxDB 3 (purpose-built)', uk: 'InfluxDB 3 (спеціалізований)' },
          rows: [
            [
              { en: 'Foundation', uk: 'Основа' },
              { en: 'Adds hypertables to PostgreSQL', uk: 'Додає hypertables до PostgreSQL' },
              { en: 'New Rust engine on Arrow/Parquet', uk: 'Новий Rust-движок на Arrow/Parquet' },
            ],
            [
              { en: 'Query language', uk: 'Мова запитів' },
              { en: 'Full SQL + joins + PG ecosystem', uk: 'Повний SQL + joins + екосистема PG' },
              { en: 'SQL + InfluxQL; FDAP internals', uk: 'SQL + InfluxQL; FDAP всередині' },
            ],
            [
              { en: 'Best when', uk: 'Найкраще коли' },
              { en: 'You already run Postgres / need relational joins', uk: 'Ви вже на Postgres / потрібні реляційні joins' },
              { en: 'Pure high-cardinality metrics at huge ingest', uk: 'Чисті high-cardinality metrics при величезному ingest' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'TimescaleDB licensing: the features you want are TSL, not Apache-2', uk: 'Ліцензування TimescaleDB: потрібні вам функції — TSL, не Apache-2' },
          md: {
            en: 'TimescaleDB is dual-licensed. The **Apache-2.0** core gives you hypertables. But the headline features — **compression, continuous aggregates, and retention policies** — live in the **Community** edition under the **Timescale License (TSL)**. TSL is source-available and free to run yourself, but it **forbids offering TimescaleDB as a managed database service**. Fine for your own product; a blocker if your product *is* a hosted database. Read the license before you build on it.',
            uk: 'TimescaleDB має подвійну ліцензію. **Apache-2.0** core дає вам hypertables. Але ключові функції — **compression, continuous aggregates та retention policies** — живуть у **Community** редакції під **Timescale License (TSL)**. TSL — source-available і безкоштовна для самостійного запуску, але **забороняє пропонувати TimescaleDB як керований сервіс бази даних**. Нормально для власного продукту; блокер, якщо ваш продукт *і є* хостинговою базою даних. Прочитайте ліцензію перед тим, як будувати на ній.',
          },
        },
      ],
    },

    // ── Topic 4: the lakehouse — separating storage & compute ─────────────
    {
      id:    'lakehouse',
      title: { en: 'The lakehouse: separating storage & compute', uk: 'Lakehouse: розділення storage та compute' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The data warehouse coupled storage and compute in one proprietary system: powerful, but you paid to keep compute running and your data was locked in. The **data lake** broke that apart — dump files cheaply into object storage (S3/GCS) — but lost transactions, schema, and consistency; it became a "data swamp". The **lakehouse** is the synthesis: keep the cheap open files, but add a **table format** on top that brings ACID transactions, schema evolution, and time travel.\n\nThe physical layer is **Parquet** — the columnar file format everything reads. The table format is metadata that turns a pile of Parquet files into a real table: **Apache Iceberg**, **Delta Lake**, or **Apache Hudi**. Because the data sits once in open storage, **any** engine — Spark, Trino, DuckDB, ClickHouse, Snowflake, BigQuery — can read and write the same tables. That is the cloud-native shift: **storage and compute are decoupled**, so you store data once and pay for compute only when a query runs.',
            uk: 'Data warehouse поєднував storage і compute в одній пропрієтарній системі: потужно, але ви платили за те, щоб compute працював, а ваші дані були замкнені. **Data lake** розбив це — скидайте файли дешево в object storage (S3/GCS) — але втратив транзакції, схему та консистентність; він став «болотом даних». **Lakehouse** — це синтез: зберегти дешеві відкриті файли, але додати згори **table format**, що приносить ACID-транзакції, schema evolution та time travel.\n\nФізичний шар — це **Parquet** — колонковий файловий формат, який усі читають. Table format — це метадані, що перетворюють купу Parquet-файлів на справжню таблицю: **Apache Iceberg**, **Delta Lake** чи **Apache Hudi**. Оскільки дані лежать один раз у відкритому storage, **будь-який** движок — Spark, Trino, DuckDB, ClickHouse, Snowflake, BigQuery — може читати й писати ті самі таблиці. Це і є cloud-native зсув: **storage і compute розділені**, тож ви зберігаєте дані один раз і платите за compute лише коли виконується запит.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Open table formats (2026): the metadata layer over Parquet', uk: 'Open table formats (2026): шар метаданих над Parquet' },
          head: [
            { en: 'Format', uk: 'Format' },
            { en: 'Origin & strength', uk: 'Походження та сила' },
            { en: 'Status in 2026', uk: 'Статус у 2026' },
          ],
          rows: [
            [
              { en: 'Apache Iceberg', uk: 'Apache Iceberg' },
              { en: 'Netflix; vendor-neutral, partition evolution, broad engine support', uk: 'Netflix; vendor-neutral, partition evolution, широка підтримка движків' },
              { en: 'The converging industry standard (S3 Tables, Snowflake Polaris, BigQuery)', uk: 'Конвергентний галузевий стандарт (S3 Tables, Snowflake Polaris, BigQuery)' },
            ],
            [
              { en: 'Delta Lake', uk: 'Delta Lake' },
              { en: 'Databricks; largest installed base, mature on Spark', uk: 'Databricks; найбільша база встановлень, зріла на Spark' },
              { en: 'Strong in Databricks; UniForm exposes Iceberg reads', uk: 'Сильна у Databricks; UniForm відкриває Iceberg-читання' },
            ],
            [
              { en: 'Apache Hudi', uk: 'Apache Hudi' },
              { en: 'Uber; streaming ingest, upserts, CDC', uk: 'Uber; streaming ingest, upserts, CDC' },
              { en: 'Narrower but strong for streaming/CDC pipelines', uk: 'Вужча, але сильна для streaming/CDC pipelines' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Decoupling storage from compute is the whole game', uk: 'Розділення storage і compute — це вся суть' },
          md: {
            en: 'In a classic warehouse, idle compute still costs money and scaling means resizing the whole box. In a lakehouse, the data is just Parquet in S3; you spin compute up to query and down to nothing afterward, and ten teams can run ten different engines on the same tables without copies. The trade is operational: catalogs to manage, small-file and compaction maintenance, and table-format/engine support that is still maturing — though converging on Iceberg.',
            uk: 'У класичному warehouse простоюючий compute все одно коштує грошей, а масштабування означає зміну розміру всієї машини. У lakehouse дані — це просто Parquet у S3; ви піднімаєте compute, щоб виконати запит, і опускаєте до нуля опісля, а десять команд можуть запускати десять різних движків на тих самих таблицях без копій. Компроміс — операційний: catalogs для керування, обслуговування small-file та compaction, і підтримка table-format/движків, що все ще дозріває — хоч і конвергує на Iceberg.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'You do not need a warehouse to query Parquet', uk: 'Вам не потрібен warehouse, щоб запитувати Parquet' },
          md: {
            en: 'A surprising amount of "analytics infrastructure" is unnecessary. DuckDB (in your process) and ClickHouse both query Parquet on object storage directly. For datasets up to terabytes, `SELECT ... FROM \'s3://.../*.parquet\'` in DuckDB replaces a whole ETL-to-warehouse step — read the lakehouse files in place, no cluster, no copy.',
            uk: 'Дивовижна кількість «аналітичної інфраструктури» — зайва. DuckDB (у вашому процесі) та ClickHouse обидва запитують Parquet в object storage напряму. Для датасетів до терабайтів `SELECT ... FROM \'s3://.../*.parquet\'` у DuckDB замінює цілий крок ETL-до-warehouse — читайте lakehouse-файли на місці, без кластера, без копіювання.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Columnar + vectorized execution is the OLAP machine: read only the columns a query touches, compress them hard (similar values adjacent), and process in SIMD batches — orders of magnitude faster than row-at-a-time for aggregates over wide tables.',
      uk: 'Columnar + vectorized execution — це OLAP-машина: читай лише колонки, яких торкається запит, стискай їх сильно (схожі значення поруч) і обробляй у SIMD-батчах — на порядки швидше за tuple-at-a-time для агрегатів над широкими таблицями.',
    },
    {
      en: 'ClickHouse = a columnar server for large-scale, high-concurrency analytics (MergeTree, materialized views aggregate on INSERT); DuckDB = an in-process columnar library ("SQLite for analytics") that queries Parquet directly. Same idea, opposite deployment.',
      uk: 'ClickHouse = колонковий сервер для масштабної аналітики з високою конкурентністю (MergeTree, materialized views агрегують на INSERT); DuckDB = in-process колонкова бібліотека («SQLite для аналітики»), що запитує Parquet напряму. Та сама ідея, протилежне розгортання.',
    },
    {
      en: 'Time-series is a specialized OLAP shape (append-mostly, time-ordered, recent-heavy, with retention & downsampling). TimescaleDB adds hypertables + continuous aggregates + compression to Postgres; InfluxDB 3 is a Rust/Arrow columnar rewrite for unlimited cardinality.',
      uk: 'Time-series — спеціалізована форма OLAP (переважно append, time-ordered, з нахилом на свіже, з retention та downsampling). TimescaleDB додає hypertables + continuous aggregates + compression до Postgres; InfluxDB 3 — це Rust/Arrow columnar-переписування для unlimited cardinality.',
    },
    {
      en: 'TimescaleDB is dual-licensed: Apache-2 core (hypertables) + TSL/Community (compression, continuous aggregates, retention) — free to self-host, but you may not resell it as a managed service.',
      uk: 'TimescaleDB має подвійну ліцензію: Apache-2 core (hypertables) + TSL/Community (compression, continuous aggregates, retention) — безкоштовно для self-host, але не можна перепродавати як керований сервіс.',
    },
    {
      en: 'The lakehouse decouples storage (open Parquet on object storage) from compute (any engine), with table formats (Iceberg, Delta, Hudi) adding ACID, schema evolution, and time travel. Iceberg is converging into the industry standard.',
      uk: 'Lakehouse розділяє storage (відкритий Parquet в object storage) і compute (будь-який движок), де table formats (Iceberg, Delta, Hudi) додають ACID, schema evolution та time travel. Iceberg конвергує у галузевий стандарт.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Running OLAP queries on your OLTP primary (or the reverse)', uk: 'Запуск OLAP-запитів на OLTP-primary (або навпаки)' },
      body: {
        en: 'A row-store transactional primary chokes on full-table aggregate scans — and worse, those scans evict the hot OLTP working set from cache, hurting every other query. Replicate analytics to a columnar store (ClickHouse, a warehouse) or use an HTAP design (TiDB/TiFlash, AlloyDB columnar engine) — do not bolt a warehouse workload onto the transactional box. The opposite also bites: columnar stores are terrible at high-frequency single-row writes.',
        uk: 'Row-store транзакційний primary захлинається на повнотабличних агрегатних scans — і гірше, ці scans витісняють гарячий OLTP working set з cache, шкодячи кожному іншому запиту. Реплікуйте аналітику у column store (ClickHouse, warehouse) або використовуйте HTAP-дизайн (TiDB/TiFlash, AlloyDB columnar engine) — не навішуйте warehouse-навантаження на транзакційну машину. Протилежне теж кусає: column stores жахливі на високочастотних записах одного рядка.',
      },
    },
    {
      title: { en: 'Treating a columnar store like Postgres', uk: 'Ставлення до column store як до Postgres' },
      body: {
        en: 'Columnar engines are weak exactly where row stores are strong: single-row point lookups, updates, and deletes (which rewrite parts and trigger merges), and high-frequency small inserts (batch them instead). They typically lack real foreign keys and unique constraints, and dedup/merge semantics are eventual (e.g. ReplacingMergeTree dedups only at merge time). Model for append + scan, not for mutation.',
        uk: 'Колонкові движки слабкі саме там, де сильні row stores: point lookups одного рядка, updates та deletes (що переписують parts і запускають merges), та високочастотні малі inserts (батчіть їх натомість). Вони зазвичай не мають справжніх foreign keys та unique constraints, а семантика dedup/merge — eventual (напр. ReplacingMergeTree дедуплікує лише під час merge). Моделюйте під append + scan, а не під мутацію.',
      },
    },
    {
      title: { en: '"TimescaleDB is Apache-licensed, so I can build a DBaaS on it"', uk: '«TimescaleDB під Apache, тож я можу побудувати DBaaS на ній»' },
      body: {
        en: 'Only the bare hypertable core is Apache-2. The features people actually adopt TimescaleDB for — compression, continuous aggregates, retention — are TSL (Community), which explicitly forbids offering it as a managed database service. If your business model is hosting databases, that clause is the whole ballgame. Verify the license against your use case before committing.',
        uk: 'Лише голий hypertable-core під Apache-2. Функції, заради яких насправді беруть TimescaleDB — compression, continuous aggregates, retention — це TSL (Community), що явно забороняє пропонувати її як керований сервіс бази даних. Якщо ваша бізнес-модель — хостинг баз даних, цей пункт вирішує все. Перевірте ліцензію щодо вашого випадку перед тим, як зобовʼязуватись.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'Why is a column store so much faster than a row store for analytical queries — and what does it cost you?', uk: 'Чому column store настільки швидший за row store для аналітичних запитів — і що це коштує?' },
      a: {
        en: 'Three compounding wins. (1) Less I/O from projection: it reads only the columns the query touches, not whole rows. (2) Less I/O from compression: a column holds one type of often-repetitive value, so RLE/dictionary/delta shrink it 5–20×, and many operators run on the encoded data. (3) Less CPU per row: vectorized execution processes batches of thousands of values through tight SIMD loops instead of tuple-at-a-time. The cost is the mirror image: poor single-row point lookups, expensive updates/deletes (parts get rewritten and merged), slow high-frequency small writes (you must batch), and weaker transactional/constraint semantics. It is an OLAP machine, not an OLTP one.',
        uk: 'Три виграші, що накладаються. (1) Менше I/O від projection: читаються лише колонки, яких торкається запит, а не цілі рядки. (2) Менше I/O від compression: колонка тримає один тип часто повторюваного значення, тож RLE/dictionary/delta стискають у 5–20×, а багато операторів працюють на закодованих даних. (3) Менше CPU на рядок: vectorized execution обробляє батчі по тисячі значень через щільні SIMD-цикли замість tuple-at-a-time. Ціна — дзеркальна: погані point lookups одного рядка, дорогі updates/deletes (parts переписуються і merge), повільні високочастотні малі записи (треба батчити) і слабша транзакційна/constraint семантика. Це OLAP-машина, а не OLTP.',
      },
    },
    {
      level: 'senior',
      q: { en: 'What does a TimescaleDB hypertable + continuous aggregate give you over plain Postgres partitioning + a materialized view?', uk: 'Що дає TimescaleDB hypertable + continuous aggregate понад звичайний Postgres partitioning + materialized view?' },
      a: {
        en: 'A hypertable auto-creates and routes time (and optional space) chunks — no manual partition DDL as data advances — and it enables per-chunk columnar compression and chunk-level retention/tiering, with the planner pruning to the needed chunks. A continuous aggregate refreshes *incrementally*: only the time buckets whose source rows changed are recomputed, and you can read the rollup with the live recent tail included — versus `REFRESH MATERIALIZED VIEW`, which recomputes the entire view every time. And you stay inside Postgres: full SQL, joins to relational tables, and the extension ecosystem. The trade is the TSL licensing on those exact features.',
        uk: 'Hypertable авто-створює та маршрутизує time- (і опційно space-) chunks — без ручного partition DDL у міру надходження даних — і вмикає per-chunk columnar compression та chunk-level retention/tiering, де планувальник відсікає до потрібних chunks. Continuous aggregate оновлюється *інкрементально*: перераховуються лише ті time buckets, чиї source-рядки змінились, і можна читати rollup з увімкненим живим свіжим хвостом — на відміну від `REFRESH MATERIALIZED VIEW`, що перераховує весь view щоразу. І ви лишаєтесь усередині Postgres: повний SQL, joins до реляційних таблиць та екосистема extensions. Компроміс — TSL-ліцензування саме на цих функціях.',
      },
    },
    {
      level: 'staff',
      q: { en: 'What problem does the lakehouse solve that a classic warehouse does not?', uk: 'Яку проблему вирішує lakehouse, що класичний warehouse — ні?' },
      a: {
        en: 'It decouples storage from compute and from any single vendor. Data lives once as open Parquet in cheap object storage; an open table format (Iceberg/Delta/Hudi) adds ACID transactions, schema evolution, and time travel on top. Many engines — Spark, Trino, DuckDB, ClickHouse, Snowflake, BigQuery — read and write the same tables, so you avoid copying data into a proprietary warehouse, pay for compute only when querying, and avoid lock-in. The cost is operational complexity: a metadata catalog to run, file compaction and the small-file problem to manage, and table-format/engine support that is still maturing — though the industry is converging on Iceberg, which reduces that risk. You would still pick a tightly-integrated warehouse when you want zero ops and one vendor to own the whole stack.',
        uk: 'Він розділяє storage і compute та звільняє від будь-якого єдиного вендора. Дані живуть один раз як відкритий Parquet у дешевому object storage; open table format (Iceberg/Delta/Hudi) додає згори ACID-транзакції, schema evolution та time travel. Багато движків — Spark, Trino, DuckDB, ClickHouse, Snowflake, BigQuery — читають і пишуть ті самі таблиці, тож ви уникаєте копіювання даних у пропрієтарний warehouse, платите за compute лише під час запитів і уникаєте lock-in. Ціна — операційна складність: metadata catalog, який треба тримати, file compaction та small-file проблема, і підтримка table-format/движків, що все ще дозріває — хоч галузь конвергує на Iceberg, що знижує цей ризик. Ви все одно оберете щільно інтегрований warehouse, коли хочете нуль операцій і одного вендора на весь стек.',
      },
    },
  ],

  seeAlso: ['m12-storage', 'm15-lsm', 'm16-query-planning', 'm30-distributed-sql', 'm32-cloud-native'],

  sources: [
    { title: 'ClickHouse — Changelog 2026 (v26.x, MergeTree, materialized views)', url: 'https://clickhouse.com/docs/whats-new/changelog' },
    { title: 'Schulze et al. — ClickHouse: Lightning Fast Analytics for Everyone (VLDB 2024)', url: 'https://www.vldb.org/pvldb/vol17/p3731-schulze.pdf' },
    { title: 'DuckDB — An in-process SQL OLAP database (official site)', url: 'https://duckdb.org/' },
    { title: 'TimescaleDB — hypertables, continuous aggregates, compression (GitHub)', url: 'https://github.com/timescale/timescaledb' },
    { title: 'Tiger Data — Timescale License (TSL) & editions', url: 'https://www.tigerdata.com/legal/licenses' },
    { title: 'InfluxData — InfluxDB 3 Core & Enterprise GA (Apr 2025, FDAP stack)', url: 'https://www.influxdata.com/blog/influxdata-announces-influxdb-3-OSS-GA/' },
    { title: 'Apache Iceberg vs Delta Lake vs Apache Hudi (2026 comparison)', url: 'https://risingwave.com/blog/apache-iceberg-vs-delta-lake-vs-hudi-2026/' },
  ],
};

export default m31;
