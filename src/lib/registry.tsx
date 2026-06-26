// CHANGED (S12): All sims/figures are now React.lazy dynamic imports so each component
// gets its own on-demand chunk. The records still export ComponentType — callers (blocks.tsx)
// wrap renders in <Suspense>. Named-export adapters use .then(m => ({ default: m[Name] })).
import { lazy, type ComponentType } from 'react';

/*
 * Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
 * Keeps the data layer declarative and widgets reusable.
 *
 * Code-split (§13 backlog, implemented S12):
 *   Each sim/figure is React.lazy so Vite emits a per-component chunk.
 *   blocks.tsx wraps FigureBlock/SimBlock in <Suspense>.
 *   App.tsx lazy-loads route pages. vite.config.ts adds the react-vendor manualChunk.
 */

// Helper: adapt a named-export lazy import to the { default } shape React.lazy requires.
// Cast to ComponentType: lazy() returns LazyExoticComponent which satisfies the interface
// at runtime but TypeScript's strict generics need the assertion here.
function lazyNamed<M extends Record<string, ComponentType>>(
  factory: () => Promise<M>,
  name: keyof M & string
): ComponentType {
  return lazy(() => factory().then(m => ({ default: m[name] }))) as unknown as ComponentType;
}

// ── Sims ─────────────────────────────────────────────────────────────────────
export const sims: Record<string, ComponentType> = {
  btree:                   lazyNamed(() => import('../components/sims/BTreeSim'),           'BTreeSim'),
  'families-map':          lazyNamed(() => import('../components/sims/FamiliesMap'),        'FamiliesMap'),        // S2
  'query-lifecycle':       lazyNamed(() => import('../components/sims/QueryLifecycleSim'),  'QueryLifecycleSim'), // S3
  'er-explorer':           lazyNamed(() => import('../components/sims/ErExplorer'),         'ErExplorer'),        // S4
  'normalization-stepper': lazyNamed(() => import('../components/sims/NormalizationSim'),   'NormalizationSim'),  // S4
  'index-picker':          lazyNamed(() => import('../components/sims/IndexPicker'),        'IndexPicker'),       // S7
  'lsm-tree':              lazyNamed(() => import('../components/sims/LsmSim'),             'LsmSim'),            // S8
  'query-planner':         lazyNamed(() => import('../components/sims/QueryPlannerSim'),    'QueryPlannerSim'),   // S8
  'acid-wal':              lazyNamed(() => import('../components/sims/AcidWalSim'),         'AcidWalSim'),        // S9
  isolation:               lazyNamed(() => import('../components/sims/IsolationSim'),       'IsolationSim'),      // S9
  mvcc:                    lazyNamed(() => import('../components/sims/MvccSim'),            'MvccSim'),           // S10
  '2pc':                   lazyNamed(() => import('../components/sims/TwoPhaseCommitSim'), 'TwoPhaseCommitSim'), // S10
  replication:             lazyNamed(() => import('../components/sims/ReplicationSim'),     'ReplicationSim'),    // S11
  sharding:                lazyNamed(() => import('../components/sims/ShardingSim'),        'ShardingSim'),       // S11
  'cap-consistency':       lazyNamed(() => import('../components/sims/CapSim'),             'CapSim'),            // S12
};

// ── Figures ───────────────────────────────────────────────────────────────────
export const figures: Record<string, ComponentType> = {
  'btree-node-anatomy':  lazyNamed(() => import('../components/figures/BTreeNodeAnatomy'),    'BTreeNodeAnatomy'),
  'files-vs-dbms':       lazyNamed(() => import('../components/figures/FilesVsDbms'),         'FilesVsDbms'),       // S2
  'sql-nosql-quadrant':  lazyNamed(() => import('../components/figures/SqlNoSqlQuadrant'),    'SqlNoSqlQuadrant'),  // S2
  'relational-model':    lazyNamed(() => import('../components/figures/RelationalModel'),     'RelationalModel'),   // S3
  'er-notation':         lazyNamed(() => import('../components/figures/ErNotation'),          'ErNotation'),        // S4
  'update-anomalies':    lazyNamed(() => import('../components/figures/UpdateAnomalies'),     'UpdateAnomalies'),   // S4
  'referential-actions': lazyNamed(() => import('../components/figures/ReferentialActions'),  'ReferentialActions'), // S5
  'float-trap':          lazyNamed(() => import('../components/figures/FloatTrap'),           'FloatTrap'),         // S5
  'window-frame':        lazyNamed(() => import('../components/figures/WindowFrame'),         'WindowFrame'),       // S6
  'view-vs-matview':     lazyNamed(() => import('../components/figures/ViewVsMatview'),       'ViewVsMatview'),     // S6
  'memory-hierarchy':    lazyNamed(() => import('../components/figures/MemoryHierarchy'),     'MemoryHierarchy'),   // S7
  'heap-page':           lazyNamed(() => import('../components/figures/HeapPage'),            'HeapPage'),          // S7
  'index-only-scan':     lazyNamed(() => import('../components/figures/IndexOnlyScan'),       'IndexOnlyScan'),     // S7
  'lsm-vs-btree':        lazyNamed(() => import('../components/figures/LsmVsBtree'),          'LsmVsBtree'),        // S8
  'plan-tree':           lazyNamed(() => import('../components/figures/PlanTree'),            'PlanTree'),          // S8
  'wal-checkpoint':      lazyNamed(() => import('../components/figures/WalCheckpoint'),       'WalCheckpoint'),     // S9
  'level-anomaly-matrix':lazyNamed(() => import('../components/figures/LevelAnomalyMatrix'),  'LevelAnomalyMatrix'), // S9
  'deadlock-cycle':      lazyNamed(() => import('../components/figures/DeadlockCycle'),       'DeadlockCycle'),     // S9 pre-built
  'two-phase-commit':    lazyNamed(() => import('../components/figures/TwoPhaseCommit'),      'TwoPhaseCommit'),    // S10
  'saga-compensation':   lazyNamed(() => import('../components/figures/SagaCompensation'),    'SagaCompensation'),  // S10
  'outbox-pattern':      lazyNamed(() => import('../components/figures/OutboxPattern'),       'OutboxPattern'),     // S10
  'streaming-replication': lazyNamed(() => import('../components/figures/StreamingReplication'), 'StreamingReplication'), // S11
  'consistent-hashing':  lazyNamed(() => import('../components/figures/ConsistentHashing'),   'ConsistentHashing'), // S11
  'pacelc-tree':         lazyNamed(() => import('../components/figures/PacelcTree'),          'PacelcTree'),        // S12
  'ha-cluster':          lazyNamed(() => import('../components/figures/HaCluster'),           'HaCluster'),         // S12
  'backup-pitr':         lazyNamed(() => import('../components/figures/BackupPitr'),          'BackupPitr'),        // S12
  'embed-vs-reference':  lazyNamed(() => import('../components/figures/EmbedVsReference'),    'EmbedVsReference'),  // S13
  'cache-aside-flow':    lazyNamed(() => import('../components/figures/CacheAsideFlow'),      'CacheAsideFlow'),    // S13
  'partition-row-model': lazyNamed(() => import('../components/figures/PartitionRowModel'),   'PartitionRowModel'), // S14
  'property-graph':      lazyNamed(() => import('../components/figures/PropertyGraph'),       'PropertyGraph'),     // S14
};

export const getSim    = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
