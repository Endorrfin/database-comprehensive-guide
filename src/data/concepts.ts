import type { Level, Localized, Module, Section } from './types';
// CHANGED (S2): M1–M3 authored from stubs.
import { m1 } from './modules/m1-what-is-a-database';
import { m2 } from './modules/m2-landscape';
import { m3 } from './modules/m3-sql-vs-nosql';
// CHANGED (S3): M4–M5 authored from stubs.
import { m4 } from './modules/m4-relational-model';
import { m5 } from './modules/m5-anatomy-of-a-query';
// CHANGED (S4): M6–M7 authored from stubs.
import { m6 } from './modules/m6-er-modeling';
import { m7 } from './modules/m7-normalization';
// CHANGED (S5): M8–M9 authored from stubs.
import { m8 } from './modules/m8-keys-constraints';
import { m9 } from './modules/m9-data-types';
import { m13 } from './modules/m13-btree';

/*
 * concepts.ts — the SINGLE SOURCE OF TRUTH (CLAUDE.md §2, §4).
 * 8 sections · 36 modules. M1–M9 + M13 are fully authored; the remaining modules are
 * navigable bilingual stubs (title + tagline + mental model authored now; topics,
 * key points, pitfalls and sources land in later sessions per the roadmap).
 */

export const sections: Section[] = [
  {
    id: 's1-foundations',
    roman: 'I',
    name: { en: 'Foundations & the landscape', uk: 'Основи та ландшафт' },
    accent: '#5B9BD5',
    blurb: {
      en: 'The on-ramp: what a database is, the family map, and SQL vs NoSQL trade-offs.',
      uk: 'Вхід у тему: що таке база даних, карта родин і компроміси SQL проти NoSQL.',
    },
  },
  {
    id: 's2-relational',
    roman: 'II',
    name: { en: 'Relational design & SQL mastery', uk: 'Реляційний дизайн і майстерність SQL' },
    accent: '#86BCEA',
    blurb: {
      en: 'The PostgreSQL-centric spine: modeling, normalization, constraints, types, advanced SQL.',
      uk: 'PostgreSQL-центричний хребет: моделювання, нормалізація, constraints, типи, просунутий SQL.',
    },
  },
  {
    id: 's3-storage',
    roman: 'III',
    name: { en: 'Storage & indexing internals', uk: 'Внутрішня будова зберігання та індексів' },
    accent: '#A78BFA',
    blurb: {
      en: 'Universal internals: pages & the heap, B-Tree/B+Tree, LSM, the index toolbox, query planning.',
      uk: 'Універсальні внутрішні механізми: pages і heap, B-Tree/B+Tree, LSM, набір індексів, планування запитів.',
    },
  },
  {
    id: 's4-transactions',
    roman: 'IV',
    name: { en: 'Transactions & concurrency', uk: 'Транзакції та конкурентність' },
    accent: '#6CC24A',
    blurb: {
      en: 'ACID & the WAL, isolation levels & anomalies, MVCC vs locking, distributed transactions.',
      uk: 'ACID і WAL, isolation levels та аномалії, MVCC проти locking, розподілені транзакції.',
    },
  },
  {
    id: 's5-distribution',
    roman: 'V',
    name: { en: 'Distribution, scale & reliability', uk: 'Розподіл, масштаб і надійність' },
    accent: '#38BDF8',
    blurb: {
      en: 'Replication, partitioning & sharding, CAP/PACELC & consensus, high availability & DR.',
      uk: 'Replication, partitioning і sharding, CAP/PACELC та consensus, висока доступність і DR.',
    },
  },
  {
    id: 's6-nosql',
    roman: 'VI',
    name: { en: 'The NoSQL families in depth', uk: 'Родини NoSQL у деталях' },
    accent: '#F2A93B',
    blurb: {
      en: 'First-class coverage: document, key-value & caching, wide-column, graph.',
      uk: 'Повноцінне покриття: document, key-value і кешування, wide-column, graph.',
    },
  },
  {
    id: 's7-modern',
    roman: 'VII',
    name: { en: 'Modern & specialized engines', uk: 'Сучасні та спеціалізовані движки' },
    accent: '#C084FC',
    blurb: {
      en: 'The modern wave: vector/AI, distributed SQL/NewSQL, analytics/columnar/time-series, cloud-native.',
      uk: 'Сучасна хвиля: vector/AI, distributed SQL/NewSQL, аналітика/columnar/time-series, cloud-native.',
    },
  },
  {
    id: 's8-mastery',
    roman: 'VIII',
    name: { en: 'Mastery', uk: 'Майстерність' },
    accent: '#34D399',
    blurb: {
      en: 'Security, performance engineering, choosing the right database, and the mental-models gallery.',
      uk: 'Безпека, інженерія продуктивності, вибір правильної бази даних і галерея ментальних моделей.',
    },
  },
];

type StubInput = Pick<
  Module,
  'id' | 'num' | 'section' | 'order' | 'level' | 'title' | 'tagline' | 'readMins' | 'mentalModel'
> &
  Partial<Pick<Module, 'signature' | 'seeAlso'>>;

/** Build a navigable stub module (empty topics/keyPoints/pitfalls/sources — authored later). */
function stub(s: StubInput): Module {
  return {
    topics: [],
    keyPoints: [],
    pitfalls: [],
    seeAlso: s.seeAlso ?? [],
    sources: [],
    ...s,
  };
}

export const modules: Module[] = [
  // ── Section I · Foundations & the landscape ──────────────────────────────
  // CHANGED (S3): M1–M5 now fully authored (imported above); Section I complete.
  m1,
  m2,
  m3,
  m4,
  m5,

  // ── Section II · Relational design & SQL mastery ─────────────────────────
  // CHANGED (S4): M6–M7 now fully authored (imported above).
  m6,
  m7,
  // CHANGED (S5): M8–M9 now fully authored (imported above).
  m8,
  m9,
  stub({
    id: 'm10-sql-in-depth',
    num: 10,
    section: 's2-relational',
    order: 5,
    level: 'senior',
    title: { en: 'SQL in depth', uk: 'SQL поглиблено' },
    tagline: {
      en: 'Joins and how they run, subqueries/CTEs, window functions, GROUPING/CUBE/ROLLUP, NULL logic.',
      uk: 'Joins і як вони виконуються, subqueries/CTEs, window functions, GROUPING/CUBE/ROLLUP, логіка NULL.',
    },
    readMins: 14,
    mentalModel: {
      en: "Most 'hard' SQL is a window function or a CTE you haven't reached for yet.",
      uk: 'Більшість «складного» SQL — це window function або CTE, до яких ви ще не дотягнулися.',
    },
  }),
  stub({
    id: 'm11-views-procedural',
    num: 11,
    section: 's2-relational',
    order: 6,
    level: 'senior',
    title: { en: 'Views, procedural SQL & triggers', uk: 'Views, процедурний SQL і triggers' },
    tagline: {
      en: 'Views vs materialized views, PL/pgSQL, triggers, and when logic belongs in the DB.',
      uk: 'Views проти materialized views, PL/pgSQL, triggers і коли логіці місце в БД.',
    },
    readMins: 11,
    mentalModel: {
      en: 'Logic in the database is power and opacity in the same move — use it deliberately.',
      uk: 'Логіка в базі — це водночас сила і непрозорість; застосовуйте свідомо.',
    },
  }),

  // ── Section III · Storage & indexing internals ───────────────────────────
  stub({
    id: 'm12-storage',
    num: 12,
    section: 's3-storage',
    order: 1,
    level: 'senior',
    signature: true,
    title: { en: 'How data is stored', uk: 'Як зберігаються дані' },
    tagline: {
      en: 'The memory hierarchy, pages & the heap, row vs columnar, TOAST.',
      uk: 'Ієрархія памʼяті, pages і heap, row проти columnar, TOAST.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Disk is far; every design choice is about minimizing trips to it.',
      uk: 'Диск далеко; кожне рішення дизайну — про мінімізацію походів до нього.',
    },
  }),
  m13, // ★ GOLDEN — fully authored
  stub({
    id: 'm14-index-toolbox',
    num: 14,
    section: 's3-storage',
    order: 3,
    level: 'senior',
    signature: true,
    title: { en: 'The index toolbox', uk: 'Набір індексів' },
    tagline: {
      en: 'Hash, GIN/GiST/BRIN, full-text, covering/partial/expression — and what NOT to index.',
      uk: 'Hash, GIN/GiST/BRIN, full-text, covering/partial/expression — і що НЕ індексувати.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Pick the index to the query shape; each index is a write you pay for.',
      uk: 'Підбирайте index під форму запиту; кожен index — це запис, за який ви платите.',
    },
    seeAlso: ['m13-btree'],
  }),
  stub({
    id: 'm15-lsm',
    num: 15,
    section: 's3-storage',
    order: 4,
    level: 'staff',
    signature: true,
    title: { en: 'LSM-trees & write-optimized storage', uk: 'LSM-trees і зберігання, оптимізоване під запис' },
    tagline: {
      en: 'Memtable → SSTable → compaction; read/write/space amplification vs the B-Tree.',
      uk: 'Memtable → SSTable → compaction; read/write/space amplification проти B-Tree.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Buffer writes in memory, sort them later — trade read effort for write speed.',
      uk: 'Буферизуйте записи в памʼяті, сортуйте пізніше — міняйте зусилля читання на швидкість запису.',
    },
    seeAlso: ['m13-btree'],
  }),
  stub({
    id: 'm16-query-planning',
    num: 16,
    section: 's3-storage',
    order: 5,
    level: 'staff',
    signature: true,
    title: { en: 'Query planning & optimization', uk: 'Планування та оптимізація запитів' },
    tagline: {
      en: 'Cost model, statistics, access paths, join order/algorithms, reading EXPLAIN ANALYZE.',
      uk: 'Cost model, statistics, access paths, порядок/алгоритми join, читання EXPLAIN ANALYZE.',
    },
    readMins: 14,
    mentalModel: {
      en: 'The planner bets on statistics; bad estimates, bad plans.',
      uk: 'Planner робить ставку на statistics; погані оцінки — погані плани.',
    },
    seeAlso: ['m13-btree'],
  }),

  // ── Section IV · Transactions & concurrency ──────────────────────────────
  stub({
    id: 'm17-acid-wal',
    num: 17,
    section: 's4-transactions',
    order: 1,
    level: 'senior',
    signature: true,
    title: { en: 'ACID & durability', uk: 'ACID та durability' },
    tagline: {
      en: 'The four guarantees, the Write-Ahead Log, commit & crash recovery.',
      uk: 'Чотири гарантії, Write-Ahead Log, commit і відновлення після збою.',
    },
    readMins: 12,
    mentalModel: {
      en: "Write your intentions down first (WAL); then it's safe to change the data.",
      uk: 'Спершу запишіть наміри (WAL); потім безпечно змінювати дані.',
    },
  }),
  stub({
    id: 'm18-isolation',
    num: 18,
    section: 's4-transactions',
    order: 2,
    level: 'staff',
    signature: true,
    title: { en: 'Isolation levels & anomalies', uk: 'Isolation levels та аномалії' },
    tagline: {
      en: 'Dirty/non-repeatable/phantom/write-skew; the SQL levels vs what engines really do.',
      uk: 'Dirty/non-repeatable/phantom/write-skew; рівні SQL проти того, що движки роблять насправді.',
    },
    readMins: 13,
    mentalModel: {
      en: "Isolation is the illusion that you're alone — each level buys more of it for more cost.",
      uk: 'Isolation — це ілюзія, що ви самі; кожен рівень купує її більше за більшу ціну.',
    },
  }),
  stub({
    id: 'm19-mvcc',
    num: 19,
    section: 's4-transactions',
    order: 3,
    level: 'staff',
    signature: true,
    title: { en: 'Concurrency control', uk: 'Контроль конкурентності' },
    tagline: {
      en: 'MVCC vs locking, 2PL, snapshot isolation, deadlocks, vacuum/bloat.',
      uk: 'MVCC проти locking, 2PL, snapshot isolation, deadlocks, vacuum/bloat.',
    },
    readMins: 13,
    mentalModel: {
      en: "Everyone reads their own snapshot; readers don't block writers.",
      uk: 'Кожен читає власний snapshot; читачі не блокують записувачів.',
    },
  }),
  stub({
    id: 'm20-distributed-tx',
    num: 20,
    section: 's4-transactions',
    order: 4,
    level: 'staff',
    title: { en: 'Distributed transactions', uk: 'Розподілені транзакції' },
    tagline: {
      en: '2PC and its blocking problem, sagas & compensation, the outbox, idempotency.',
      uk: '2PC і його проблема блокування, sagas і компенсація, outbox, idempotency.',
    },
    readMins: 12,
    mentalModel: {
      en: "Across machines you agree then act — or you undo. 'Exactly-once' is a myth.",
      uk: 'Між машинами ви домовляєтесь, тоді дієте — або відкочуєте. «Exactly-once» — міф.',
    },
  }),

  // ── Section V · Distribution, scale & reliability ────────────────────────
  stub({
    id: 'm21-replication',
    num: 21,
    section: 's5-distribution',
    order: 1,
    level: 'senior',
    signature: true,
    title: { en: 'Replication', uk: 'Replication' },
    tagline: {
      en: 'Leader/follower, sync vs async, physical vs logical, failover, replication lag.',
      uk: 'Leader/follower, sync проти async, physical проти logical, failover, replication lag.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Copies cost you latency or safety — pick which one consciously.',
      uk: 'Копії коштують вам latency або safety — обирайте свідомо.',
    },
  }),
  stub({
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
    readMins: 12,
    mentalModel: {
      en: 'The shard key is destiny — it decides every future query and hotspot.',
      uk: 'Shard key — це доля: він вирішує кожен майбутній запит і hotspot.',
    },
  }),
  stub({
    id: 'm23-cap',
    num: 23,
    section: 's5-distribution',
    order: 3,
    level: 'staff',
    signature: true,
    title: { en: 'CAP, PACELC & consensus', uk: 'CAP, PACELC та consensus' },
    tagline: {
      en: "CAP stated precisely, PACELC's latency trade, consistency models, quorums, Raft/Paxos.",
      uk: 'CAP точно сформульований, компроміс latency у PACELC, моделі consistency, quorums, Raft/Paxos.',
    },
    readMins: 13,
    mentalModel: {
      en: 'During a partition you answer wrong or not at all — CAP is that choice.',
      uk: 'Під час partition ви відповідаєте неправильно або ніяк — CAP саме про цей вибір.',
    },
  }),
  stub({
    id: 'm24-ha-backups-dr',
    num: 24,
    section: 's5-distribution',
    order: 4,
    level: 'senior',
    title: { en: 'High availability, backups & DR', uk: 'Висока доступність, backups і DR' },
    tagline: {
      en: 'Patroni/etcd, PITR & the WAL archive, RPO/RTO, testing restores.',
      uk: 'Patroni/etcd, PITR і WAL archive, RPO/RTO, тестування відновлень.',
    },
    readMins: 11,
    mentalModel: {
      en: "HA is fast failover; DR is surviving the region — and an untested backup doesn't exist.",
      uk: 'HA — це швидкий failover; DR — пережити втрату регіону; а неперевірений backup не існує.',
    },
  }),

  // ── Section VI · The NoSQL families in depth ─────────────────────────────
  stub({
    id: 'm25-document',
    num: 25,
    section: 's6-nosql',
    order: 1,
    level: 'middle',
    title: { en: 'Document databases', uk: 'Document databases' },
    tagline: {
      en: "MongoDB's model & internals, embed vs reference, the aggregation pipeline.",
      uk: 'Модель і внутрішня будова MongoDB, embed проти reference, aggregation pipeline.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Store together what you read together — the document is your access pattern.',
      uk: 'Зберігайте разом те, що читаєте разом — document і є вашим access pattern.',
    },
  }),
  stub({
    id: 'm26-key-value',
    num: 26,
    section: 's6-nosql',
    order: 2,
    level: 'middle',
    title: { en: 'Key-value & caching', uk: 'Key-value та кешування' },
    tagline: {
      en: 'Redis/Valkey structures, caching patterns, eviction & persistence, the 2024 license fork.',
      uk: 'Структури Redis/Valkey, патерни кешування, eviction і persistence, ліцензійний fork 2024.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Fast because it forgets — and because it lives in memory.',
      uk: 'Швидкий, бо забуває — і бо живе в памʼяті.',
    },
  }),
  stub({
    id: 'm27-wide-column',
    num: 27,
    section: 's6-nosql',
    order: 3,
    level: 'senior',
    title: { en: 'Wide-column stores', uk: 'Wide-column сховища' },
    tagline: {
      en: 'Cassandra/ScyllaDB, partition + clustering keys, tunable consistency, LSM heritage.',
      uk: 'Cassandra/ScyllaDB, partition + clustering keys, tunable consistency, спадок LSM.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Model the query, not the data — the partition key is the whole game.',
      uk: 'Моделюйте запит, а не дані — partition key вирішує все.',
    },
  }),
  stub({
    id: 'm28-graph',
    num: 28,
    section: 's6-nosql',
    order: 4,
    level: 'senior',
    title: { en: 'Graph databases', uk: 'Graph databases' },
    tagline: {
      en: 'Property graph vs RDF, traversal & Cypher, index-free adjacency.',
      uk: 'Property graph проти RDF, traversal і Cypher, index-free adjacency.',
    },
    readMins: 11,
    mentalModel: {
      en: 'When the relationships ARE the data, make edges first-class.',
      uk: 'Коли звʼязки і Є даними, робіть edges повноцінними обʼєктами.',
    },
  }),

  // ── Section VII · Modern & specialized engines ───────────────────────────
  stub({
    id: 'm29-vector',
    num: 29,
    section: 's7-modern',
    order: 1,
    level: 'senior',
    signature: true,
    title: { en: 'Vector databases & AI', uk: 'Vector databases та AI' },
    tagline: {
      en: 'Embeddings & similarity, ANN/HNSW vs exact kNN, pgvector vs dedicated, RAG.',
      uk: 'Embeddings і similarity, ANN/HNSW проти exact kNN, pgvector проти спеціалізованих, RAG.',
    },
    readMins: 13,
    mentalModel: {
      en: 'Search by meaning, not by match — trade a little recall for a lot of speed.',
      uk: 'Шукайте за змістом, а не за збігом — міняйте трохи recall на багато швидкості.',
    },
  }),
  stub({
    id: 'm30-distributed-sql',
    num: 30,
    section: 's7-modern',
    order: 2,
    level: 'staff',
    title: { en: 'Distributed SQL / NewSQL', uk: 'Distributed SQL / NewSQL' },
    tagline: {
      en: 'Raft-replicated ranges, distributed txns; CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL.',
      uk: 'Raft-репльовані ranges, розподілені txns; CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL.',
    },
    readMins: 12,
    mentalModel: {
      en: "Shards you don't have to think about (mostly) — 'Postgres won the API'.",
      uk: 'Shards, про які (здебільшого) не треба думати — «Postgres виграв API».',
    },
  }),
  stub({
    id: 'm31-analytics',
    num: 31,
    section: 's7-modern',
    order: 3,
    level: 'senior',
    title: { en: 'Analytics, columnar & time-series', uk: 'Аналітика, columnar і time-series' },
    tagline: {
      en: 'Columnar + vectorized execution, ClickHouse & DuckDB, TimescaleDB/InfluxDB, the lakehouse.',
      uk: 'Columnar + vectorized execution, ClickHouse і DuckDB, TimescaleDB/InfluxDB, lakehouse.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Scan columns, not rows — OLAP is a different machine from OLTP.',
      uk: 'Скануйте колонки, а не рядки — OLAP — це інша машина, ніж OLTP.',
    },
  }),
  stub({
    id: 'm32-cloud-native',
    num: 32,
    section: 's7-modern',
    order: 4,
    level: 'senior',
    title: { en: 'Cloud-native & the modern DBA', uk: 'Cloud-native і сучасний DBA' },
    tagline: {
      en: 'Managed DBs, Docker/K8s operators, IaC, observability, autoscaling.',
      uk: 'Керовані БД, Docker/K8s operators, IaC, observability, autoscaling.',
    },
    readMins: 11,
    mentalModel: {
      en: 'The DBA moved up the stack — from tuning disks to wiring platforms.',
      uk: 'DBA піднявся стеком — від тюнінгу дисків до звʼязування платформ.',
    },
  }),

  // ── Section VIII · Mastery ───────────────────────────────────────────────
  stub({
    id: 'm33-security',
    num: 33,
    section: 's8-mastery',
    order: 1,
    level: 'senior',
    title: { en: 'Security & data protection', uk: 'Безпека та захист даних' },
    tagline: {
      en: 'AuthN/Z, RBAC/RLS, encryption at rest/in transit, hashing, SQL injection, least privilege.',
      uk: 'AuthN/Z, RBAC/RLS, шифрування at rest/in transit, hashing, SQL injection, least privilege.',
    },
    readMins: 13,
    mentalModel: {
      en: 'Treat every input as hostile and grant the least privilege that works.',
      uk: 'Вважайте кожен вхід ворожим і давайте найменші привілеї, що працюють.',
    },
  }),
  stub({
    id: 'm34-performance',
    num: 34,
    section: 's8-mastery',
    order: 2,
    level: 'senior',
    title: { en: 'Performance engineering', uk: 'Інженерія продуктивності' },
    tagline: {
      en: 'Measure→bottleneck→fix→verify, slow queries, pooling, N+1, caching, capacity.',
      uk: 'Measure→bottleneck→fix→verify, повільні запити, pooling, N+1, кешування, capacity.',
    },
    readMins: 13,
    mentalModel: {
      en: 'Measure first — the database is usually I/O-bound, and the bottleneck is rarely where you guessed.',
      uk: 'Спершу вимірюйте — база зазвичай I/O-bound, і вузьке місце рідко там, де ви думали.',
    },
  }),
  stub({
    id: 'm35-choosing',
    num: 35,
    section: 's8-mastery',
    order: 3,
    level: 'senior',
    signature: true,
    title: { en: 'Choosing the right database', uk: 'Вибір правильної бази даних' },
    tagline: {
      en: 'The decision framework, workload walkthroughs, polyglot persistence, anti-patterns.',
      uk: 'Фреймворк рішення, розбори workload, polyglot persistence, анти-патерни.',
    },
    readMins: 12,
    mentalModel: {
      en: 'Requirements first, engine second — never résumé-driven.',
      uk: 'Спершу вимоги, потім движок — ніколи не «résumé-driven».',
    },
  }),
  stub({
    id: 'm36-mental-models',
    num: 36,
    section: 's8-mastery',
    order: 4,
    level: 'middle',
    title: { en: 'Mental models gallery + glossary', uk: 'Галерея ментальних моделей + глосарій' },
    tagline: {
      en: 'Every mental model to recall from memory, a bilingual glossary, a one-page reference.',
      uk: 'Кожна ментальна модель для пригадування з памʼяті, двомовний глосарій, довідка на одну сторінку.',
    },
    readMins: 8,
    mentalModel: {
      en: 'If you can redraw the picture from memory, you understand it.',
      uk: 'Якщо можете перемалювати картину з памʼяті — ви це розумієте.',
    },
  }),
];

// ── Lookups ────────────────────────────────────────────────────────────────
const moduleById = new Map(modules.map((m) => [m.id, m]));
const sectionById = new Map(sections.map((s) => [s.id, s]));

export function getModule(id: string): Module | undefined {
  return moduleById.get(id);
}
export function getSection(id: string): Section | undefined {
  return sectionById.get(id);
}
export function modulesBySection(sectionId: string): Module[] {
  return modules
    .filter((m) => m.section === sectionId)
    .sort((a, b) => a.order - b.order);
}
/** Previous / next module in global order (by `num`). */
export function adjacentModules(id: string): { prev?: Module; next?: Module } {
  const ordered = [...modules].sort((a, b) => a.num - b.num);
  const i = ordered.findIndex((m) => m.id === id);
  if (i === -1) return {};
  return { prev: ordered[i - 1], next: ordered[i + 1] };
}
/** A module is "authored" (vs a navigable stub) once it has topics. */
export function isAuthored(m: Module): boolean {
  return m.topics.length > 0;
}

export const LEVELS: Level[] = ['beginner', 'middle', 'senior', 'staff'];

export const COUNTS = {
  sections: sections.length,
  modules: modules.length,
  sims: modules.filter((m) => m.signature).length,
};

export type { Level, Localized, Module, Section };
