/*
 * moduleContent.ts — lazy per-module content loaders (S20 per-module code-split).
 *
 * Each entry dynamically imports ONE module's full content file, so ModulePage loads only the
 * module being viewed (~5–15 KB) instead of the 480 KB aggregated concepts.ts chunk. Combined with
 * the S19 meta data-split (nav/search read meta), this removes concepts.ts from the app bundle
 * entirely — it now exists only for the build-time scripts (gen-meta, check-data).
 *
 * Export shape note: m1–m28 use named exports (`export const mN`), m29–m36 use default exports —
 * mirrored here per file. tsc validates each accessor, so a wrong one fails typecheck, not at runtime.
 */
import type { Module } from './types';

export type ModuleLoader = () => Promise<Module>;

export const moduleContent: Record<string, ModuleLoader> = {
  'm1-what-is-a-database': () => import('./modules/m1-what-is-a-database').then((m) => m.m1),
  'm2-landscape': () => import('./modules/m2-landscape').then((m) => m.m2),
  'm3-sql-vs-nosql': () => import('./modules/m3-sql-vs-nosql').then((m) => m.m3),
  'm4-relational-model': () => import('./modules/m4-relational-model').then((m) => m.m4),
  'm5-anatomy-of-a-query': () => import('./modules/m5-anatomy-of-a-query').then((m) => m.m5),
  'm6-er-modeling': () => import('./modules/m6-er-modeling').then((m) => m.m6),
  'm7-normalization': () => import('./modules/m7-normalization').then((m) => m.m7),
  'm8-keys-constraints': () => import('./modules/m8-keys-constraints').then((m) => m.m8),
  'm9-data-types': () => import('./modules/m9-data-types').then((m) => m.m9),
  'm10-sql-in-depth': () => import('./modules/m10-sql-in-depth').then((m) => m.m10),
  'm11-views-procedural': () => import('./modules/m11-views-procedural').then((m) => m.m11),
  'm12-storage': () => import('./modules/m12-storage').then((m) => m.m12),
  'm13-btree': () => import('./modules/m13-btree').then((m) => m.m13),
  'm14-index-toolbox': () => import('./modules/m14-index-toolbox').then((m) => m.m14),
  'm15-lsm': () => import('./modules/m15-lsm').then((m) => m.m15),
  'm16-query-planning': () => import('./modules/m16-query-planning').then((m) => m.m16),
  'm17-acid-wal': () => import('./modules/m17-acid-wal').then((m) => m.m17),
  'm18-isolation': () => import('./modules/m18-isolation').then((m) => m.m18),
  'm19-mvcc': () => import('./modules/m19-mvcc').then((m) => m.m19),
  'm20-distributed-tx': () => import('./modules/m20-distributed-tx').then((m) => m.m20),
  'm21-replication': () => import('./modules/m21-replication').then((m) => m.m21),
  'm22-sharding': () => import('./modules/m22-sharding').then((m) => m.m22),
  'm23-cap': () => import('./modules/m23-cap').then((m) => m.m23),
  'm24-ha-backups-dr': () => import('./modules/m24-ha-backups-dr').then((m) => m.m24),
  'm25-document': () => import('./modules/m25-document').then((m) => m.m25),
  'm26-key-value': () => import('./modules/m26-key-value').then((m) => m.m26),
  'm27-wide-column': () => import('./modules/m27-wide-column').then((m) => m.m27),
  'm28-graph': () => import('./modules/m28-graph').then((m) => m.m28),
  'm29-vector': () => import('./modules/m29-vector').then((m) => m.default),
  'm30-distributed-sql': () => import('./modules/m30-distributed-sql').then((m) => m.default),
  'm31-analytics': () => import('./modules/m31-analytics').then((m) => m.default),
  'm32-cloud-native': () => import('./modules/m32-cloud-native').then((m) => m.default),
  'm33-security': () => import('./modules/m33-security').then((m) => m.default),
  'm34-performance': () => import('./modules/m34-performance').then((m) => m.default),
  'm35-choosing': () => import('./modules/m35-choosing').then((m) => m.default),
  'm36-mental-models': () => import('./modules/m36-mental-models').then((m) => m.default),
};

export function loadModuleContent(id: string): Promise<Module> | undefined {
  return moduleContent[id]?.();
}
