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
// CHANGED (S12): M23 + M24 authored from stubs (CAP/consistency sim + HA/backups figures). Section V complete.
import { m23 } from './modules/m23-cap';
import { m24 } from './modules/m24-ha-backups-dr';
// CHANGED (S13): M25 + M26 authored from stubs (figures-only: embed-vs-reference, cache-aside-flow). Section VI begins.
import { m25 } from './modules/m25-document';
import { m26 } from './modules/m26-key-value';
// CHANGED (S14): M27 + M28 authored from stubs (figures-only: partition-row-model, property-graph). Section VI complete.
import { m27 } from './modules/m27-wide-column';
import { m28 } from './modules/m28-graph';
// CHANGED (S15): M29 + M30 authored from stubs (★ Vector/ANN sim + Distributed SQL figures). Section VII begins.
import m29 from './modules/m29-vector';
import m30 from './modules/m30-distributed-sql';
// CHANGED (S16): M31 + M32 authored from stubs (figures-only: columnar-scan, hypertable, shared-responsibility).
import m31 from './modules/m31-analytics';
import m32 from './modules/m32-cloud-native';
// CHANGED (S17): M33 + M34 authored from stubs (SQL-injection sim + N+1 sim). Section VIII begins.
import m33 from './modules/m33-security';
import m34 from './modules/m34-performance';
// CHANGED (S18): M35 + M36 authored from stubs (★ Database Picker wizard + cheat-sheet capstone).
// Section VIII and the full 36-module curriculum are now complete.
import m35 from './modules/m35-choosing';
import m36 from './modules/m36-mental-models';

/*
 * concepts.ts — the SINGLE SOURCE OF TRUTH (CLAUDE.md §2, §4).
 * 8 sections · 36 modules — ALL fully authored (S18 completed the curriculum).
 * Each module lives in its own file under ./modules and is imported here.
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

// CHANGED (S18): the `stub()` helper + `StubInput` type were removed — all 36 modules are now
// authored and imported, so the navigable-skeleton scaffolding is no longer needed.

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
  // CHANGED (S12): M23 + M24 authored (CAP/consistency sim + HA/backups figures). Section V complete.
  m21, // ★ Replication & failover sim
  m22, // ★ Sharding strategy sim
  m23, // ★ CAP/consistency sim
  m24, // HA, backups & DR (figures: ha-cluster, backup-pitr)

  // ── Section VI · The NoSQL families in depth ─────────────────────────────
  // CHANGED (S13): M25 + M26 fully authored (imported above). Section VI begins (M25, M26).
  m25, // document databases: MongoDB model, embed/ref, aggregation, WiredTiger
  m26, // key-value & caching: Redis/Valkey structures, caching patterns, licensing story
  // CHANGED (S14): M27 + M28 fully authored (imported above). Section VI complete.
  m27, // wide-column: Cassandra/ScyllaDB, partition/clustering model, tunable consistency, LSM heritage
  m28, // graph databases: LPG vs RDF, index-free adjacency, Cypher/GQL, graph algorithms

  // ── Section VII · Modern & specialized engines ───────────────────────────
  // CHANGED (S15): M29 + M30 fully authored (imported above). Section VII begins.
  m29, // vector databases & AI: embeddings, HNSW, pgvector, Qdrant/Milvus/Weaviate, RAG (★ vector-search sim)
  m30, // distributed SQL / NewSQL: CockroachDB, TiDB HTAP, YugabyteDB, Spanner TrueTime, Aurora DSQL
  // CHANGED (S16): M31 + M32 now fully authored (imported above). Section VII continues.
  m31, // analytics, columnar & time-series: ClickHouse/DuckDB, TimescaleDB/InfluxDB 3, the lakehouse
  m32, // cloud-native & the modern DBA: managed DBs, K8s operators, IaC, observability

  // ── Section VIII · Mastery ───────────────────────────────────────────────
  // CHANGED (S17): M33 + M34 fully authored (imported above). Section VIII begins.
  m33, // ★ security: authN/Z, RBAC/RLS, encryption, hashing, SQL-injection sim
  m34, // ★ performance: method, slow queries/N+1 sim, pooling, caching/replicas, capacity
  // CHANGED (S18): M35 + M36 fully authored (imported above). Section VIII and the curriculum complete.
  m35, // ★ Choosing the right database — Database Picker wizard (sim 'db-picker') + decision-flow figure
  m36, // Mental models gallery + glossary — cheat-sheet capstone (guide-map figure)
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
