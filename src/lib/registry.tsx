import type { ComponentType } from 'react';
import { BTreeSim } from '../components/sims/BTreeSim';
// CHANGED (S2): M2 embedded families map.
import { FamiliesMap } from '../components/sims/FamiliesMap';
// CHANGED (S3): M5 query-lifecycle stepper.
import { QueryLifecycleSim } from '../components/sims/QueryLifecycleSim';
// CHANGED (S4): M6 ER explorer + M7 normalization stepper.
import { ErExplorer } from '../components/sims/ErExplorer';
import { NormalizationSim } from '../components/sims/NormalizationSim';
// CHANGED (S7): M14 index access-path picker.
import { IndexPicker } from '../components/sims/IndexPicker';
// CHANGED (S8): M15 LSM compaction stepper + M16 Query Planner / EXPLAIN.
import { LsmSim } from '../components/sims/LsmSim';
import { QueryPlannerSim } from '../components/sims/QueryPlannerSim';
// CHANGED (S9): M17 ACID/WAL crash-recovery stepper + M18 Isolation anomalies sim.
import { AcidWalSim } from '../components/sims/AcidWalSim';
import { IsolationSim } from '../components/sims/IsolationSim';
// CHANGED (S10): M19 MVCC version-chain + lock-contrast sim.
import { MvccSim } from '../components/sims/MvccSim';
// CHANGED (S10): M20 two-phase-commit stepper (pulled forward from the §13 backlog at user request).
import { TwoPhaseCommitSim } from '../components/sims/TwoPhaseCommitSim';
// CHANGED (S11): M21 Replication & failover sim + M22 Sharding strategy sim.
import { ReplicationSim } from '../components/sims/ReplicationSim';
import { ShardingSim } from '../components/sims/ShardingSim';
import { BTreeNodeAnatomy } from '../components/figures/BTreeNodeAnatomy';
// CHANGED (S2): M1 + M3 figures.
import { FilesVsDbms } from '../components/figures/FilesVsDbms';
import { SqlNoSqlQuadrant } from '../components/figures/SqlNoSqlQuadrant';
// CHANGED (S3): M4 relational-model figure.
import { RelationalModel } from '../components/figures/RelationalModel';
// CHANGED (S4): M6 ER-notation legend + M7 update-anomalies figure.
import { ErNotation } from '../components/figures/ErNotation';
import { UpdateAnomalies } from '../components/figures/UpdateAnomalies';
// CHANGED (S5): M8 referential-actions + M9 float-trap figures.
import { ReferentialActions } from '../components/figures/ReferentialActions';
import { FloatTrap } from '../components/figures/FloatTrap';
// CHANGED (S6): M10 window-frame + M11 view-vs-matview figures.
import { WindowFrame } from '../components/figures/WindowFrame';
import { ViewVsMatview } from '../components/figures/ViewVsMatview';
// CHANGED (S7): M12 memory-hierarchy + heap-page; M14 index-only-scan.
import { MemoryHierarchy } from '../components/figures/MemoryHierarchy';
import { HeapPage } from '../components/figures/HeapPage';
import { IndexOnlyScan } from '../components/figures/IndexOnlyScan';
// CHANGED (S8): M15 B-Tree-vs-LSM write paths + M16 EXPLAIN plan tree.
import { LsmVsBtree } from '../components/figures/LsmVsBtree';
import { PlanTree } from '../components/figures/PlanTree';
// CHANGED (S9): M17 WAL + checkpoint figure + M18 level×anomaly matrix.
import { WalCheckpoint } from '../components/figures/WalCheckpoint';
import { LevelAnomalyMatrix } from '../components/figures/LevelAnomalyMatrix';
// CHANGED (S9): pre-built for M19 (S10) — deadlock wait-for cycle figure.
import { DeadlockCycle } from '../components/figures/DeadlockCycle';
// CHANGED (S10): M20 distributed-transaction figures.
import { TwoPhaseCommit } from '../components/figures/TwoPhaseCommit';
import { SagaCompensation } from '../components/figures/SagaCompensation';
import { OutboxPattern } from '../components/figures/OutboxPattern';
// CHANGED (S11): M21 streaming-replication figure + M22 consistent-hashing figure.
import { StreamingReplication } from '../components/figures/StreamingReplication';
import { ConsistentHashing } from '../components/figures/ConsistentHashing';

/*
 * Registry — content references figures and sims by KEY (CLAUDE.md §4), resolved here.
 * Keeps the data layer declarative and widgets reusable. New sims/figures register here.
 */
export const sims: Record<string, ComponentType> = {
  btree: BTreeSim,
  'families-map': FamiliesMap, // CHANGED (S2)
  'query-lifecycle': QueryLifecycleSim, // CHANGED (S3)
  'er-explorer': ErExplorer, // CHANGED (S4)
  'normalization-stepper': NormalizationSim, // CHANGED (S4)
  'index-picker': IndexPicker, // CHANGED (S7)
  'lsm-tree': LsmSim, // CHANGED (S8)
  'query-planner': QueryPlannerSim, // CHANGED (S8)
  'acid-wal': AcidWalSim, // CHANGED (S9)
  isolation: IsolationSim, // CHANGED (S9)
  mvcc: MvccSim, // CHANGED (S10)
  '2pc': TwoPhaseCommitSim, // CHANGED (S10): M20 stepper, pulled forward from backlog
  replication: ReplicationSim, // CHANGED (S11)
  sharding: ShardingSim,       // CHANGED (S11)
};

export const figures: Record<string, ComponentType> = {
  'btree-node-anatomy': BTreeNodeAnatomy,
  'files-vs-dbms': FilesVsDbms, // CHANGED (S2)
  'sql-nosql-quadrant': SqlNoSqlQuadrant, // CHANGED (S2)
  'relational-model': RelationalModel, // CHANGED (S3)
  'er-notation': ErNotation, // CHANGED (S4)
  'update-anomalies': UpdateAnomalies, // CHANGED (S4)
  'referential-actions': ReferentialActions, // CHANGED (S5)
  'float-trap': FloatTrap, // CHANGED (S5)
  'window-frame': WindowFrame, // CHANGED (S6)
  'view-vs-matview': ViewVsMatview, // CHANGED (S6)
  'memory-hierarchy': MemoryHierarchy, // CHANGED (S7)
  'heap-page': HeapPage, // CHANGED (S7)
  'index-only-scan': IndexOnlyScan, // CHANGED (S7)
  'lsm-vs-btree': LsmVsBtree, // CHANGED (S8)
  'plan-tree': PlanTree, // CHANGED (S8)
  'wal-checkpoint': WalCheckpoint, // CHANGED (S9)
  'level-anomaly-matrix': LevelAnomalyMatrix, // CHANGED (S9)
  'deadlock-cycle': DeadlockCycle, // CHANGED (S9): pre-built; M19 references it in S10
  'two-phase-commit': TwoPhaseCommit, // CHANGED (S10)
  'saga-compensation': SagaCompensation, // CHANGED (S10)
  'outbox-pattern': OutboxPattern, // CHANGED (S10)
  'streaming-replication': StreamingReplication, // CHANGED (S11)
  'consistent-hashing': ConsistentHashing,       // CHANGED (S11)
};

export const getSim = (key: string): ComponentType | undefined => sims[key];
export const getFigure = (key: string): ComponentType | undefined => figures[key];
