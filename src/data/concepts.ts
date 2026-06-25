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
// CHANGED (S6): M10–M11 authored from stubs.
import { m10 } from './modules/m10-sql-in-depth';
import { m11 } from './modules/m11-views-procedural';
// CHANGED (S7): M12 + M14 authored from stubs (M13 was the S1 golden module).
import { m12 } from './modules/m12-storage';
import { m13 } from './modules/m13-btree';
import { m14 } from './modules/m14-index-toolbox';
// CHANGED (S8): M15 + M16 authored from stubs (two signature sims). Section III complete.
import { m15 } from './modules/m15-lsm';
import { m16 } from './modules/m16-query-planning';
// CHANGED (S9): M17 + M18 authored from stubs (ACID/WAL stepper + Isolation anomalies sim). Section IV begins.
import { m17 } from './modules/m17-acid-wal';
import { m18 } from './modules/m18-isolation';
// CHANGED (S10): M19 + M20 authored from stubs (MVCC sim + distributed-tx figures). Section IV complete.
import { m19 } from './modules/m19-mvcc';
import { m20 } from './modules/m20-distributed-tx';
// CHANGED (S11): M21 + M22 authored from stubs (Replication sim + Sharding sim). Section V begins.
import { m21 } from './modules/m21-replication';
import { m22 } from './modules/m22-sharding';

/*
 * concepts.ts — the SINGLE SOURCE OF TRUTH (CLAUDE.md §2, §4).
 * 8 sections · 36 modules. M1–M14 are fully authored; the remaining modules are
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
  // CHANGED (S6): M10–M11 now fully authored (imported above).
  m10,
  m11,

  // ── Section III · Storage & indexing internals ───────────────────────────
  // CHANGED (S7): M12 + M14 now fully authored (imported above). M12 is figures-only
  // (signature:false — strong static visuals, no widget); M14 ships the ★ index-picker sim.
  m12,
  m13, // ★ GOLDEN — fully authored
  m14, // ★ index access-path picker
  // CHANGED (S8): M15 + M16 now fully authored (imported above). M15 ships the ★ LSM compaction
  // stepper; M16 ships the ★ Query Planner / EXPLAIN sim. Section III (storage internals) complete.
  m15, // ★ LSM-tree compaction stepper
  m16, // ★ Query Planner / EXPLAIN

  // ── Section IV · Transactions & concurrency ──────────────────────────────
  // CHANGED (S9): M17 + M18 now fully authored (imported above). M17 ships the ★ ACID/WAL crash-
  // recovery stepper; M18 ships the ★ Isolation anomalies sim. Section IV (transactions) begins.
  m17, // ★ ACID/WAL crash-recovery stepper
  m18, // ★ Isolation anomalies
  // CHANGED (S10): M19 + M20 now fully authored (imported above). M19 ships the ★ MVCC version-chain
  // + lock-contrast sim and references the pre-built deadlock-cycle figure; M20 is figures-only
  // (2PC / saga / outbox). Section IV (transactions & concurrency) complete.
  m19, // ★ MVCC sim
  m20,

  // ── Section V · Distribution, scale & reliability ────────────────────────
  // CHANGED (S11): M21 + M22 authored (replication sim + sharding sim).
  m21, // ★ Replication & failover sim
  m22, // ★ Sharding strategy sim
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
