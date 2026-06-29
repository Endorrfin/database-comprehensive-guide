/*
 * planner.ts — a tiny cost-based query planner (the model behind the M16 EXPLAIN sim).
 *
 * Pure logic (no React). QueryPlannerSim shows four hand-tuned illustrative plans; this module
 * *computes* the same access-path and join decisions from PostgreSQL's real cost structure, so
 * scripts/test-planner.ts can prove the planner reacts to the two things that matter: whether the
 * filter column is indexed, and how selective the predicate is.
 *
 * Modelled on the one fixed query the sim uses:
 *   SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'open';
 * orders is the filtered (driving) table; customers is joined on its primary key.
 * Cost constants follow postgresql.org/docs/current planner cost constants.
 */

export type ScanKind = 'Seq Scan' | 'Index Scan';
export type JoinKind = 'Nested Loop' | 'Hash Join';
export type Table = { name: string; rows: number; pages: number };

/** PostgreSQL default planner cost constants (relative to a sequential page read = 1.0). */
export const COST = { seqPage: 1.0, randomPage: 4.0, cpuTuple: 0.01 } as const;

export const ORDERS: Table = { name: 'orders', rows: 1_000_000, pages: 10_000 };
export const CUSTOMERS: Table = { name: 'customers', rows: 50_000, pages: 500 };

/** Predicate selectivity: how many orders rows `status = 'open'` matches. */
export const SELECTIVE = 80;
export const BROAD = 600_000;

/** Sequential scan: read every page, process every row. */
export function seqScanCost(t: Table): number {
  return t.pages * COST.seqPage + t.rows * COST.cpuTuple;
}

/** Index scan: one random heap fetch per matched row (plus per-row CPU). Cheap only when selective. */
export function indexScanCost(matchedRows: number): number {
  return matchedRows * (COST.randomPage + COST.cpuTuple);
}

/** Pick the access path for the filtered table: Index Scan only if it actually beats a Seq Scan. */
export function chooseScan(table: Table, indexed: boolean, matchedRows: number): { scan: ScanKind; cost: number } {
  const seq = seqScanCost(table);
  if (indexed) {
    const idx = indexScanCost(matchedRows);
    if (idx < seq) return { scan: 'Index Scan', cost: idx };
  }
  return { scan: 'Seq Scan', cost: seq };
}

/** Nested loop: for each outer row, probe the inner table's index. Great when few outer rows. */
export function nestedLoopCost(outerRows: number, outerCost: number): number {
  return outerCost + outerRows * (COST.randomPage + COST.cpuTuple);
}

/** Hash join: scan + hash the inner table once, then probe per outer row. Wins when many rows. */
export function hashJoinCost(outerRows: number, outerCost: number, inner: Table): number {
  return outerCost + seqScanCost(inner) + inner.rows * COST.cpuTuple + outerRows * COST.cpuTuple;
}

export type QueryInput = { indexedOnFilter: boolean; matchedRows: number };
export type QueryPlan = { scan: ScanKind; join: JoinKind; cost: number; rows: number };

/** Plan the fixed two-table join: choose the access path, then the cheaper join algorithm. */
export function planQuery(input: QueryInput, outer: Table = ORDERS, inner: Table = CUSTOMERS): QueryPlan {
  const { scan, cost: scanCost } = chooseScan(outer, input.indexedOnFilter, input.matchedRows);
  const nl = nestedLoopCost(input.matchedRows, scanCost);
  const hj = hashJoinCost(input.matchedRows, scanCost, inner);
  const useNL = nl <= hj;
  return { scan, join: useNL ? 'Nested Loop' : 'Hash Join', cost: Math.round(useNL ? nl : hj), rows: input.matchedRows };
}

/** The sim's 2×2: (i)ndexed/(n)o-index × (s)elective/(b)road. */
export type Combo = 'is' | 'ib' | 'ns' | 'nb';
export const SCENARIOS: Record<Combo, QueryInput> = {
  is: { indexedOnFilter: true, matchedRows: SELECTIVE },
  ib: { indexedOnFilter: true, matchedRows: BROAD },
  ns: { indexedOnFilter: false, matchedRows: SELECTIVE },
  nb: { indexedOnFilter: false, matchedRows: BROAD },
};
