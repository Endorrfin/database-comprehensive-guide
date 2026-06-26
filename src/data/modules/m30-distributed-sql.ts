// M30 · Distributed SQL / NewSQL [staff] — S15
// Web-verified 2026-06-26:
//   CockroachDB v26.2 (CalVer — year.release); range-based Raft sharding; Postgres wire.
//   TiDB 8.5 GA (Dec 2024), TiDB Cloud v8.5.3; HTAP via TiKV (row) + TiFlash (Raft Learner,
//   columnar); MySQL wire compatible, limited Postgres compat mode. YugabyteDB v2025.2.5.0
//   (Jun 12 2026): YSQL (PG-compatible) + YCQL (Cassandra), DocDB/RocksDB storage layer.
//   Google Spanner: TrueTime = GPS + atomic clock; Spanner Omni (on-prem) is PREVIEW as of
//   Jun 2026 (NOT GA — CLAUDE.md §12 "on-prem GA 2025" is incorrect). Aurora DSQL: GA May 2025,
//   PostgreSQL 16 compatible, serverless active-active multi-region, 99.999% multi-region SLA.
//   "Postgres won the API": CockroachDB, YSQL, Aurora DSQL, and Spanner (via PGAdapter) all
//   expose the Postgres wire protocol.
import type { Module } from '../types';

const m30: Module = {
  id:        'm30-distributed-sql',
  num:       30,
  section:   's7-modern',
  order:     2,
  level:     'staff',
  signature: false,
  readMins:  12,

  title:    { en: 'Distributed SQL / NewSQL', uk: 'Distributed SQL / NewSQL' },
  tagline:  { en: 'CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL — and why Postgres won the API', uk: 'CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL — і чому Postgres виграв API' },

  mentalModel: {
    en: 'NewSQL = distributed storage + Raft consensus + (often) a Postgres wire — ACID guarantees at horizontal scale without the dual-write problem.',
    uk: 'NewSQL = розподілене зберігання + Raft consensus + (часто) Postgres wire — ACID-гарантії при горизонтальному масштабі без проблеми dual-write.',
  },

  topics: [
    // ── Topic 1: the problem NewSQL solves ───────────────────────────────
    {
      id:    'why-distributed-sql',
      title: { en: 'Why NewSQL — what it solves', uk: 'Навіщо NewSQL — яку проблему вирішує' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Traditional relational databases scale vertically — throw more CPU and RAM at the primary. At some point the write throughput or working set exceeds what one machine can hold. Manual sharding (application-layer) solves the storage problem but breaks cross-shard transactions, makes schema changes painful, and moves referential integrity into the application.\n\n**NewSQL** (a term from 2011, coined by 451 Research) is the category of systems that deliver SQL semantics, ACID transactions, and horizontal write scalability together. The shared-nothing architecture stores data as ranges or tablets distributed across many nodes, replicates each range via a Raft consensus group, and presents a unified SQL interface on top.',
            uk: 'Традиційні реляційні бази даних масштабуються вертикально — додають більше CPU та RAM до primary. В якийсь момент write throughput або working set перевищує те, що одна машина може витримати. Ручний sharding (на рівні застосунку) вирішує проблему зберігання, але порушує cross-shard транзакції, ускладнює зміни схеми та переміщує referential integrity у застосунок.\n\n**NewSQL** (термін з 2011 р., введений 451 Research) — категорія систем, що забезпечують SQL-семантику, ACID-транзакції та горизонтальне масштабування записів разом. Архітектура shared-nothing зберігає дані у вигляді ranges або tablets, розподілених по вузлах, реплікує кожен range через Raft consensus group та представляє уніфікований SQL-інтерфейс поверх.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Manual sharding (application layer)', uk: 'Ручний sharding (рівень застосунку)' },
          b: { en: 'Distributed SQL / NewSQL', uk: 'Distributed SQL / NewSQL' },
          rows: [
            [
              { en: 'Cross-shard transactions', uk: 'Cross-shard транзакції' },
              { en: 'You implement (saga / 2PC)', uk: 'Ви реалізуєте (saga / 2PC)' },
              { en: 'Native (Raft groups + 2PC internally)', uk: 'Нативні (Raft groups + 2PC всередині)' },
            ],
            [
              { en: 'Rebalancing on hotspot', uk: 'Rebalancing при hotspot' },
              { en: 'Manual migration scripts', uk: 'Ручні міграційні скрипти' },
              { en: 'Automatic range splitting + rebalancing', uk: 'Автоматичне range splitting + rebalancing' },
            ],
            [
              { en: 'Foreign keys / joins', uk: 'Foreign keys / joins' },
              { en: 'Broken or in-app only', uk: 'Відсутні або лише в app' },
              { en: 'SQL-native (within co-located data)', uk: 'SQL-нативні (для co-located даних)' },
            ],
            [
              { en: 'Operational overhead', uk: 'Операційні накладні витрати' },
              { en: 'High (you own routing, migrations)', uk: 'Висока (ви керуєте routing, міграціями)' },
              { en: 'Lower (the DB handles topology)', uk: 'Нижча (DB керує топологією)' },
            ],
          ],
        },
      ],
    },

    // ── Topic 2: CockroachDB & YugabyteDB ────────────────────────────────
    {
      id:    'cockroachdb-yugabyte',
      title: { en: 'CockroachDB & YugabyteDB', uk: 'CockroachDB та YugabyteDB' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**CockroachDB v26.2** (CalVer — year.release; formerly semantic-versioned) uses **range-based Raft sharding**: the key space is divided into 128 MB ranges, each replicated by a 3-node Raft group. Ranges split automatically when they hit the size limit and rebalance across nodes. The Postgres wire protocol means most Postgres drivers work without changes. It trades low-latency single-region writes for multi-region linearizability via its multi-active availability model.\n\n**YugabyteDB v2025.2.5.0** (June 2026) runs two query layers over a shared DocDB storage engine (RocksDB-based, LSM): **YSQL** (full Postgres-compatible SQL via a modified PostgreSQL 11 query layer) and **YCQL** (Cassandra Query Language for wide-column). Each is a tablet-based Raft architecture. The dual-API design is its differentiator — teams can migrate Postgres apps (YSQL) while keeping Cassandra workloads (YCQL) in one cluster.',
            uk: '**CockroachDB v26.2** (CalVer — рік.реліз; раніше semantic-versioned) використовує **range-based Raft sharding**: простір ключів ділиться на ranges по 128 МБ, кожен реплікований 3-вузловою Raft group. Ranges автоматично діляться при досягненні ліміту розміру та перебалансуються між вузлами. Postgres wire protocol дозволяє більшості Postgres drivers працювати без змін. Він жертвує low-latency одно-регіональними записами заради multi-region linearizability через свою multi-active availability model.\n\n**YugabyteDB v2025.2.5.0** (червень 2026) запускає два query шари над спільним storage engine DocDB (на базі RocksDB, LSM): **YSQL** (повний Postgres-сумісний SQL через модифікований query layer PostgreSQL 11) та **YCQL** (Cassandra Query Language для wide-column). Кожен — tablet-based Raft архітектура. Dual-API дизайн є його відмінною рисою — команди можуть мігрувати Postgres застосунки (YSQL), зберігаючи Cassandra workloads (YCQL) в одному кластері.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Cross-region writes are expensive — design for locality first', uk: 'Cross-region writes дорогі — спочатку проєктуйте для locality' },
          md: {
            en: 'Every write to a range must reach a quorum (2/3 replicas) before committing. In a 3-region deployment, that round-trip adds ~100 ms to each write. Use region affinity (CockroachDB `REGIONAL BY ROW`, YugabyteDB tablespaces) to keep hot rows close to the users who write them.',
            uk: 'Кожен запис у range повинен досягти quorum (2/3 replicas) перед commit. У 3-регіональному розгортанні це round-trip додає ~100 мс до кожного запису. Використовуйте region affinity (CockroachDB `REGIONAL BY ROW`, YugabyteDB tablespaces), щоб тримати гарячі рядки близько до користувачів, що їх записують.',
          },
        },
      ],
    },

    // ── Topic 3: TiDB HTAP ────────────────────────────────────────────────
    {
      id:    'tidb-htap',
      title: { en: 'TiDB — HTAP with TiKV and TiFlash', uk: 'TiDB — HTAP з TiKV та TiFlash' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**TiDB 8.5 GA** (Dec 2024; TiDB Cloud on v8.5.3) is a **HTAP** (Hybrid Transactional/Analytical Processing) database. It separates storage into two engines running simultaneously:\n\n- **TiKV** — row-oriented, RocksDB-backed, Raft-replicated storage for OLTP. Each key range is a Raft group; writes go here.\n- **TiFlash** — columnar storage, replicated from TiKV via **Raft Learner** (read-only replica that receives replication asynchronously without participating in Raft leader elections). TiFlash stores the same data in column format for vectorized OLAP execution.\n\nThe TiDB SQL layer routes queries: point lookups and small transactional queries hit TiKV; large analytical scans that touch TiFlash get columnar scan. The optimizer can join TiKV and TiFlash tables in a single query — real-time OLAP over live OLTP data without ETL.',
            uk: '**TiDB 8.5 GA** (груд. 2024; TiDB Cloud на v8.5.3) — **HTAP** (Hybrid Transactional/Analytical Processing) база даних. Вона розділяє зберігання на два одночасно працюючих engine:\n\n- **TiKV** — row-орієнтоване, RocksDB-backed, Raft-реплікаційне зберігання для OLTP. Кожен key range є Raft group; записи йдуть сюди.\n- **TiFlash** — columnar storage, реплікований від TiKV через **Raft Learner** (read-only replica, що отримує реплікацію асинхронно без участі у виборах Raft leader). TiFlash зберігає ті самі дані в column format для векторизованого OLAP-виконання.\n\nSQL шар TiDB маршрутизує запити: point lookups та малі транзакційні запити йдуть до TiKV; великі аналітичні сканування, що торкаються TiFlash, отримують columnar scan. Optimizer може join TiKV та TiFlash таблиці в одному запиті — real-time OLAP над живими OLTP даними без ETL.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'ALTER TABLE ... SET TIFLASH REPLICA to opt a table into columnar', uk: 'ALTER TABLE ... SET TIFLASH REPLICA для підключення таблиці до columnar' },
          md: {
            en: 'TiFlash replication is opt-in per table. Not every table needs it — only the ones your analytical queries scan. `ALTER TABLE orders SET TIFLASH REPLICA 2;` adds two TiFlash replicas and replication starts automatically. Queries touching those columns route to TiFlash automatically via the optimizer.',
            uk: 'TiFlash реплікація є opt-in для кожної таблиці. Не кожна таблиця потребує її — лише ті, які скануються аналітичними запитами. `ALTER TABLE orders SET TIFLASH REPLICA 2;` додає два TiFlash replica, і реплікація починається автоматично. Запити, що торкаються цих стовпців, автоматично маршрутизуються до TiFlash через optimizer.',
          },
        },
      ],
    },

    // ── Topic 4: Google Spanner & Aurora DSQL ────────────────────────────
    {
      id:    'spanner-aurora-dsql',
      title: { en: 'Google Spanner & Aurora DSQL', uk: 'Google Spanner та Aurora DSQL' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Google Spanner** is the original externally-consistent distributed SQL database (Corbett et al., OSDI 2012). Its defining property is **TrueTime** — a globally synchronised clock API backed by GPS receivers and atomic clocks in every Google data centre. TrueTime provides a bounded uncertainty interval `[earliest, latest]` for the current wall-clock time; Spanner waits out this uncertainty before committing to guarantee external consistency (a write commit timestamp is always later than any prior read). This eliminates the need for distributed locking for most serialisable reads.\n\n**Spanner Omni** (on-premises deployment) remains in **Preview** as of June 2026 — not GA. Production Spanner is a Google Cloud service only.\n\n**Aurora DSQL** reached **General Availability in May 2025**. It is PostgreSQL 16-compatible, serverless (scales to zero, no capacity planning), active-active multi-region (reads and writes go to the nearest region), and log-structured (no heap files; immutable journal). AWS advertises 99.999% availability SLA for multi-region deployments. Transactions use optimistic concurrency control (OCC) rather than 2PL — conflicts abort rather than wait.',
            uk: '**Google Spanner** — оригінальна externally-consistent розподілена SQL база даних (Corbett et al., OSDI 2012). Її визначальна властивість — **TrueTime** — глобально синхронізований API годинника, підкріплений GPS-приймачами та атомними годинниками у кожному датацентрі Google. TrueTime надає обмежений інтервал невизначеності `[earliest, latest]` для поточного wall-clock часу; Spanner очікує цю невизначеність перед commit для гарантії external consistency (timestamp commit запису завжди пізніший за будь-яке попереднє читання). Це усуває необхідність distributed locking для більшості serialisable reads.\n\n**Spanner Omni** (on-premises розгортання) залишається у **Preview** станом на червень 2026 — не GA. Production Spanner — лише Google Cloud сервіс.\n\n**Aurora DSQL** досяг **General Availability у травні 2025**. Він сумісний з PostgreSQL 16, serverless (масштабується до нуля, без capacity planning), active-active multi-region (читання та записи йдуть до найближчого регіону), і log-structured (без heap files; незмінний журнал). AWS рекламує SLA доступності 99.999% для multi-region розгортань. Транзакції використовують optimistic concurrency control (OCC) замість 2PL — конфлікти скасовуються замість очікування.',
          },
        },
        {
          kind: 'figure',
          fig: 'distributed-sql-arch',
          caption: {
            en: 'CockroachDB (range/Raft), TiDB (TiKV+TiFlash HTAP), and Aurora DSQL (active-active serverless) — all expose the Postgres wire protocol.',
            uk: 'CockroachDB (range/Raft), TiDB (TiKV+TiFlash HTAP) та Aurora DSQL (active-active serverless) — всі відкривають Postgres wire protocol.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: '"Postgres won the API" — and what that means for portability', uk: '"Postgres виграв API" — і що це означає для портабельності' },
          md: {
            en: 'CockroachDB, YugabyteDB YSQL, Aurora DSQL, and Spanner (via Google\'s PGAdapter) all speak the Postgres wire protocol. This means psycopg2, pg, Sequelize, and TypeORM connect without changes. **But SQL compatibility is not 100%** — CockroachDB lacks some Postgres functions; YSQL has transaction retry semantics differences; DSQL lacks cross-region transactions for now. Always run your test suite against the target engine.',
            uk: 'CockroachDB, YugabyteDB YSQL, Aurora DSQL та Spanner (через Google PGAdapter) — всі говорять Postgres wire protocol. Це означає, що psycopg2, pg, Sequelize та TypeORM підключаються без змін. **Але SQL сумісність не є 100%** — CockroachDB бракує деяких Postgres функцій; YSQL має відмінності в семантиці retry транзакцій; DSQL поки не має cross-region транзакцій. Завжди запускайте тестовий набір проти цільового engine.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Spanner Omni is Preview, not GA — do not use in production', uk: 'Spanner Omni — Preview, не GA — не використовуйте у production' },
          md: {
            en: 'As of June 2026, Spanner Omni (the on-premises deployment option) is still in Preview. The CLAUDE.md §12 claim "on-prem GA 2025" is incorrect — it should not be cited as production-ready. Cloud Spanner (Google Cloud-managed) is GA and production-grade.',
            uk: 'Станом на червень 2026, Spanner Omni (on-premises варіант розгортання) все ще знаходиться у Preview. Твердження CLAUDE.md §12 "on-prem GA 2025" є неправильним — на нього не слід посилатися як на готовий до production. Cloud Spanner (керований Google Cloud) є GA та придатний для production.',
          },
        },
      ],
    },

    // ── Topic 5: choosing — and the trade-offs ────────────────────────────
    {
      id:    'choosing-distributed-sql',
      title: { en: 'Choosing a distributed SQL system', uk: 'Вибір distributed SQL системи' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The "right" distributed SQL system depends heavily on your primary constraint: consistency model, existing wire-protocol dependencies, OLTP vs OLAP balance, and operational model (cloud-managed vs self-hosted).',
            uk: 'Правильна distributed SQL система значно залежить від вашого основного обмеження: моделі консистентності, наявних wire-protocol залежностей, балансу OLTP vs OLAP та операційної моделі (cloud-managed vs self-hosted).',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Distributed SQL engine decision guide', uk: 'Посібник з вибору distributed SQL engine' },
          head: [
            { en: 'Engine', uk: 'Engine' },
            { en: 'Best fit', uk: 'Найкраще підходить' },
            { en: 'Caution', uk: 'Застереження' },
          ],
          rows: [
            [
              { en: 'CockroachDB v26.2', uk: 'CockroachDB v26.2' },
              { en: 'Multi-region OLTP, geo-partitioned data, strong Postgres compat', uk: 'Multi-region OLTP, geo-partitioned дані, сильна Postgres compat' },
              { en: 'Cross-region write latency; complex licensing tiers', uk: 'Затримка cross-region write; складні рівні ліцензування' },
            ],
            [
              { en: 'TiDB 8.5', uk: 'TiDB 8.5' },
              { en: 'HTAP: real-time analytics over live OLTP data without ETL', uk: 'HTAP: real-time аналітика над живими OLTP даними без ETL' },
              { en: 'MySQL wire (Postgres compat is partial); operational complexity', uk: 'MySQL wire (Postgres compat часткова); операційна складність' },
            ],
            [
              { en: 'YugabyteDB 2025.x', uk: 'YugabyteDB 2025.x' },
              { en: 'Postgres + Cassandra migration; dual-API single cluster', uk: 'Postgres + Cassandra міграція; dual-API єдиний кластер' },
              { en: 'YSQL uses PG11 query layer; some PG features missing', uk: 'YSQL використовує PG11 query layer; деякі PG функції відсутні' },
            ],
            [
              { en: 'Google Spanner', uk: 'Google Spanner' },
              { en: 'Google Cloud-only, extreme global consistency, TrueTime', uk: 'Тільки Google Cloud, екстремальна глобальна консистентність, TrueTime' },
              { en: 'Vendor lock-in; Omni still Preview; expensive', uk: 'Vendor lock-in; Omni все ще Preview; дорогий' },
            ],
            [
              { en: 'Aurora DSQL (GA May 2025)', uk: 'Aurora DSQL (GA травень 2025)' },
              { en: 'AWS-native, serverless active-active, zero-ops PG16', uk: 'AWS-нативний, serverless active-active, zero-ops PG16' },
              { en: 'AWS lock-in; OCC may need retry logic; no cross-region txns yet', uk: 'AWS lock-in; OCC може потребувати логіки retry; поки без cross-region txn' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Start with Postgres — move to NewSQL when you have evidence', uk: 'Починайте з Postgres — переходьте до NewSQL при наявності доказів' },
          md: {
            en: 'NewSQL systems add significant operational complexity, higher costs, and partial SQL compatibility. Most applications never outgrow Postgres with proper indexing, connection pooling, read replicas, and partitioning. Move to a NewSQL system only when you have concrete, measured evidence that Postgres is the bottleneck — not when you imagine it might be.',
            uk: 'NewSQL системи додають значну операційну складність, вищі витрати та часткову SQL сумісність. Більшість застосунків ніколи не виростають з Postgres при правильній індексації, connection pooling, read replicas та partitioning. Переходьте до NewSQL системи лише коли маєте конкретні виміряні докази, що Postgres є вузьким місцем — не коли уявляєте, що він може ним бути.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'NewSQL = horizontal write scale + ACID + SQL — achieved via range-based Raft consensus over a shared-nothing architecture.',
      uk: 'NewSQL = горизонтальне масштабування записів + ACID + SQL — досягається через range-based Raft consensus над shared-nothing архітектурою.',
    },
    {
      en: 'CockroachDB (v26.2) and YugabyteDB (v2025.x) both expose the Postgres wire — most PG drivers connect without changes, but SQL compat is not 100%.',
      uk: 'CockroachDB (v26.2) та YugabyteDB (v2025.x) обидва відкривають Postgres wire — більшість PG drivers підключаються без змін, але SQL compat не є 100%.',
    },
    {
      en: 'TiDB\'s HTAP stores the same rows as both TiKV (row/OLTP) and TiFlash (columnar/OLAP) — real-time analytics over live data without ETL.',
      uk: 'HTAP TiDB зберігає ті самі рядки у TiKV (row/OLTP) та TiFlash (columnar/OLAP) — real-time аналітика над живими даними без ETL.',
    },
    {
      en: 'Spanner\'s TrueTime (GPS + atomic clock) enables external consistency globally. Spanner Omni (on-prem) is still Preview as of June 2026.',
      uk: 'TrueTime Spanner (GPS + атомний годинник) забезпечує external consistency глобально. Spanner Omni (on-prem) все ще Preview станом на червень 2026.',
    },
    {
      en: 'Aurora DSQL is GA (May 2025): serverless active-active PG16, OCC, 99.999% multi-region SLA — AWS-native zero-ops option.',
      uk: 'Aurora DSQL є GA (травень 2025): serverless active-active PG16, OCC, SLA 99.999% multi-region — AWS-нативний zero-ops варіант.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Assuming Postgres wire = full Postgres compatibility', uk: 'Припущення, що Postgres wire = повна Postgres сумісність' },
      body: {
        en: 'CockroachDB lacks some Postgres system-catalog views, certain PL/pgSQL features, and some DDL semantics. YugabyteDB YSQL is built on a PostgreSQL 11 fork — newer PG features (partitioning improvements, MERGE, generated-column changes from PG18) may be missing. Aurora DSQL lacks DDL transactionality. Run your full test suite before committing.',
        uk: 'CockroachDB бракує деяких системних catalog views Postgres, певних функцій PL/pgSQL та деякої DDL семантики. YugabyteDB YSQL побудований на форку PostgreSQL 11 — новіші функції PG (покращення partitioning, MERGE, зміни generated-column від PG18) можуть бути відсутні. Aurora DSQL не має DDL транзакційності. Запускайте повний тестовий набір перед прийняттям рішення.',
      },
    },
    {
      title: { en: 'Ignoring cross-region write latency', uk: 'Ігнорування затримки cross-region write' },
      body: {
        en: 'In a 3-region Raft group, every write must wait for acknowledgement from at least 2 of 3 replicas. Speed of light between US-east and EU-west is ~80 ms one-way; a round trip adds ~160 ms to every write. This is physics, not a bug. Design region affinity so hot-path writes commit locally — and measure before assuming a multi-region topology is needed.',
        uk: 'У 3-регіональній Raft group кожен запис повинен очікувати підтвердження від мінімум 2 з 3 replicas. Швидкість світла між US-east та EU-west становить ~80 мс в одну сторону; round trip додає ~160 мс до кожного запису. Це фізика, а не баг. Проектуйте region affinity, щоб hot-path записи committed locally — та вимірюйте перед тим, як припускати необхідність multi-region топології.',
      },
    },
    {
      title: { en: 'Treating Spanner Omni as GA-ready for on-prem deployments', uk: 'Ставлення до Spanner Omni як до GA-готового для on-prem розгортань' },
      body: {
        en: 'Spanner Omni is in Preview as of June 2026. Preview products are not covered by Google Cloud SLAs and can have breaking changes. Production on-prem deployments that need Spanner-class consistency should evaluate CockroachDB or YugabyteDB, both of which are GA for self-hosted use.',
        uk: 'Spanner Omni знаходиться у Preview станом на червень 2026. Preview продукти не покриваються SLA Google Cloud та можуть мати breaking changes. Production on-prem розгортання, яким потрібна Spanner-класна консистентність, повинні оцінити CockroachDB або YugabyteDB, обидва з яких є GA для self-hosted використання.',
      },
    },
  ],

  interview: [
    {
      level: 'staff',
      q: { en: 'How does TrueTime enable external consistency in Spanner?', uk: 'Як TrueTime забезпечує external consistency у Spanner?' },
      a: {
        en: 'TrueTime is a clock API backed by GPS and atomic clocks in every Google data centre. It returns not a single timestamp but an interval `[earliest, latest]` bounding the true current time. Before a transaction commits, Spanner waits until `now > latest` from the uncertainty interval of that transaction\'s proposed commit timestamp. This guarantees the commit timestamp is strictly greater than any prior event\'s timestamp — so reads at that timestamp see all prior writes. External consistency (linearisability) is then provable by induction without distributed locks.',
        uk: 'TrueTime — API годинника, підкріплений GPS та атомними годинниками у кожному датацентрі Google. Він повертає не єдиний timestamp, а інтервал `[earliest, latest]`, що обмежує справжній поточний час. Перед commit транзакції, Spanner очікує поки `now > latest` з інтервалу невизначеності пропонованого commit timestamp цієї транзакції. Це гарантує, що commit timestamp строго більший за timestamp будь-якої попередньої події — тому читання при цьому timestamp бачать всі попередні записи. External consistency (лінеаризованість) тоді доказова за індукцією без distributed locks.',
      },
    },
    {
      level: 'staff',
      q: { en: 'What makes TiDB\'s HTAP design interesting — and what are its limits?', uk: 'Що робить HTAP дизайн TiDB цікавим — і які його обмеження?' },
      a: {
        en: 'TiDB routes OLTP writes to TiKV (row/Raft) and replicates them asynchronously to TiFlash (columnar) via Raft Learner — no separate ETL pipeline. The optimizer can issue a query that reads from TiKV for point lookups and TiFlash for large aggregations in the same query. The limit is that TiFlash replication is asynchronous — analytical queries over TiFlash read slightly stale data (typically seconds behind TiKV). For "read your own write" on analytics you\'d need to route to TiKV which loses the columnar benefit. Also, TiFlash must be explicitly enabled per table, and the MySQL-wire interface means some Postgres tooling requires workarounds.',
        uk: 'TiDB маршрутизує OLTP записи до TiKV (row/Raft) і реплікує їх асинхронно до TiFlash (columnar) через Raft Learner — без окремого ETL pipeline. Optimizer може видати запит, що читає з TiKV для point lookups та TiFlash для великих агрегацій в одному запиті. Обмеження в тому, що реплікація TiFlash є асинхронною — аналітичні запити до TiFlash читають трохи застарілі дані (типово секунди за TiKV). Для "read your own write" в аналітиці потрібно маршрутизувати до TiKV, що втрачає columnar перевагу. Також TiFlash потрібно явно увімкнути для кожної таблиці, а MySQL-wire інтерфейс означає, що деякий Postgres tooling вимагає обхідних шляхів.',
      },
    },
    {
      level: 'staff',
      q: { en: 'When does it make sense to choose a distributed SQL system over Postgres + read replicas + partitioning?', uk: 'Коли має сенс обрати distributed SQL систему замість Postgres + read replicas + partitioning?' },
      a: {
        en: 'Postgres with proper indexing, read replicas, and declarative partitioning handles most workloads. The concrete triggers for distributed SQL are: (1) write throughput that exceeds what a single Postgres primary can sustain — typically >100k writes/sec sustained; (2) multi-region active-active writes where you need <50 ms write latency from multiple geographies simultaneously; (3) a need for automatic range splitting and rebalancing without downtime (Postgres partition management is manual); (4) a regulatory or business requirement for geographic data residency with automatic enforcement. Without these specific, measured constraints, the operational overhead and partial SQL compat of NewSQL are usually not worth it.',
        uk: 'Postgres з правильною індексацією, read replicas та declarative partitioning впорається з більшістю workloads. Конкретні тригери для distributed SQL: (1) write throughput, що перевищує можливості одного Postgres primary — зазвичай >100k записів/сек стабільно; (2) multi-region active-active записи, де потрібна затримка запису <50 мс з кількох географій одночасно; (3) необхідність автоматичного range splitting та rebalancing без простою (управління partition у Postgres ручне); (4) регуляторна або бізнес-вимога до географічного residence даних з автоматичним виконанням. Без цих конкретних, виміряних обмежень, операційні накладні витрати та часткова SQL compat NewSQL зазвичай не варті цього.',
      },
    },
  ],

  seeAlso: ['m20-distributed-tx', 'm22-sharding', 'm23-cap', 'm31-analytics', 'm32-cloud-native'],

  sources: [
    {
      title: 'CockroachDB v26.2 release notes (2026)',
      url:   'https://www.cockroachlabs.com/docs/releases/',
    },
    {
      title: 'TiDB 8.5 GA release blog (Dec 2024)',
      url:   'https://www.pingcap.com/blog/tidb-8-5-ga-release/',
    },
    {
      title: 'YugabyteDB v2025.2.5.0 release (Jun 2026)',
      url:   'https://docs.yugabyte.com/preview/releases/',
    },
    {
      title: 'Corbett et al. — Spanner: Google\'s Globally Distributed Database (OSDI 2012)',
      url:   'https://www.usenix.org/system/files/conference/osdi12/osdi12-final-16.pdf',
    },
    {
      title: 'Aurora DSQL General Availability (May 2025) — AWS announcement',
      url:   'https://aws.amazon.com/blogs/database/',
    },
    {
      title: 'Spanner Omni preview documentation (Google Cloud)',
      url:   'https://cloud.google.com/spanner/docs/spanner-omni-overview',
    },
  ],
};

export default m30;
