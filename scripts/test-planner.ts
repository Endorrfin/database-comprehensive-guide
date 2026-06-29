/*
 * test-planner.ts — golden invariants for the cost-based planner (src/lib/planner), run via
 * `npm run test:planner`. Proves the engine reproduces the M16 sim's four plan DECISIONS from a real
 * cost model (not hand-tuned numbers): an Index Scan is chosen only when the predicate is both
 * indexed AND selective; a Nested Loop wins on few driving rows, a Hash Join on many.
 */
import type { Combo, ScanKind, JoinKind } from '../src/lib/planner';
import {
  BROAD,
  ORDERS,
  SCENARIOS,
  SELECTIVE,
  indexScanCost,
  planQuery,
  seqScanCost,
} from '../src/lib/planner';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

// Expected plan per combo — mirrors QueryPlannerSim's PLANS table (the narrative we must reproduce).
const EXPECT: Record<Combo, { scan: ScanKind; join: JoinKind }> = {
  is: { scan: 'Index Scan', join: 'Nested Loop' },
  ib: { scan: 'Seq Scan', join: 'Hash Join' },
  ns: { scan: 'Seq Scan', join: 'Nested Loop' },
  nb: { scan: 'Seq Scan', join: 'Hash Join' },
};

const plans = Object.fromEntries(
  (Object.keys(SCENARIOS) as Combo[]).map((c) => [c, planQuery(SCENARIOS[c])]),
) as Record<Combo, ReturnType<typeof planQuery>>;

// 1. Each combo's access path + join match the sim.
for (const c of Object.keys(EXPECT) as Combo[]) {
  assert(plans[c].scan === EXPECT[c].scan, `${c}: access path is ${EXPECT[c].scan} (got ${plans[c].scan})`);
  assert(plans[c].join === EXPECT[c].join, `${c}: join is ${EXPECT[c].join} (got ${plans[c].join})`);
}

// 2. Why the access path flips: index scan beats seq scan only while the predicate is selective.
assert(indexScanCost(SELECTIVE) < seqScanCost(ORDERS), 'selective index scan is cheaper than a seq scan');
assert(indexScanCost(BROAD) > seqScanCost(ORDERS), 'broad index scan is MORE expensive than a seq scan (so it is refused)');
assert(plans.is.scan === 'Index Scan' && plans.ib.scan === 'Seq Scan' && plans.ns.scan === 'Seq Scan' && plans.nb.scan === 'Seq Scan', 'Index Scan is chosen for is only');

// 3. Join flips on selectivity (driving-row count), independent of the index.
assert(plans.is.join === 'Nested Loop' && plans.ns.join === 'Nested Loop', 'few driving rows → Nested Loop');
assert(plans.ib.join === 'Hash Join' && plans.nb.join === 'Hash Join', 'many driving rows → Hash Join');

// 4. is (indexed + selective) is the cheapest plan overall.
const cheapest = (Object.keys(plans) as Combo[]).reduce((a, b) => (plans[a].cost <= plans[b].cost ? a : b));
assert(cheapest === 'is', `the indexed+selective plan is cheapest (got ${cheapest})`);

// 5. Same selective predicate, ~30–40× the cost without an index (the sim's "sargable" lesson).
assert(plans.ns.cost > plans.is.cost * 10, `dropping the index on a selective predicate is far costlier (${plans.ns.cost} vs ${plans.is.cost})`);

// 6. Honest correction to the sim: for a BROAD predicate the index is irrelevant, so ib == nb exactly
//    (the sim's 28500 vs 29000 is arbitrary; the real planner produces the identical plan).
assert(plans.ib.scan === plans.nb.scan && plans.ib.join === plans.nb.join, 'ib and nb make identical decisions');
assert(plans.ib.cost === plans.nb.cost, `ib and nb cost the same — an index cannot help a broad predicate (${plans.ib.cost})`);

// 7. A selective seq+nested-loop still beats a broad seq+hash-join.
assert(plans.ns.cost < plans.nb.cost, 'selective Seq+NestedLoop is cheaper than broad Seq+HashJoin');

console.log('— Query-planner engine tests —');
console.log(`  ${checks} checks across the 2×2 (index × selectivity): access path, join, cost ordering`);
console.log(`  costs: is=${plans.is.cost}  ns=${plans.ns.cost}  ib=${plans.ib.cost}  nb=${plans.nb.cost}`);
if (failures > 0) {
  console.error(`\n✖ ${failures} invariant failure(s).`);
  process.exit(1);
}
console.log('\n✓ All query-planner invariants hold.');
