/*
 * node-truth-lsm.mjs — independent ground-truth derivation for the M15 LSM goldens.
 *
 * Methodology (mirrors the Node-js guide's node-truth-*.mjs): the authoritative meaning of a stream
 * of put/del operations is "apply them in order to a plain map; newest wins; a delete removes the
 * key". This script computes that oracle directly (it does NOT import src/lib/lsm), so the engine's
 * flush→compaction result is verified against an independent source of truth, not itself.
 * Run: `node scripts/node-truth-lsm.mjs`
 */

// The M15 sim's exact workload (order matters; del writes a tombstone the compaction later purges).
const ops = [
  ['put', 'a', '1'], ['put', 'c', '3'], ['put', 'b', '2'], ['put', 'd', '4'],
  ['put', 'a', '9'], ['del', 'c'], ['put', 'e', '5'], ['put', 'f', '6'],
];

const truth = new Map();
for (const [op, k, v] of ops) {
  if (op === 'del') truth.delete(k);
  else truth.set(k, v);
}
const sorted = [...truth.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const render = sorted.map(([k, v]) => `${k}=${v}`).join(',');

console.log('— node-truth: LSM compaction —');
console.log('  workload :', ops.map((o) => o.join(' ')).join('  '));
console.log('  After flush + bottom-level compaction, the surviving SSTable must equal the live map:');
console.log(`  ground truth → [${render}]`);
console.log("  (c was deleted, so its tombstone is purged; a's newest version 9 wins.)");
console.log('  This is the value test-lsm.ts asserts for the sim reproduction.');
