/*
 * node-truth-sharding.mjs — independent ground-truth derivation for the M22 sharding goldens.
 *
 * Methodology (mirrors the Node-js guide's node-truth-*.mjs): this script re-derives the numbers
 * that scripts/test-sharding.ts asserts using a SECOND, self-contained implementation (it does NOT
 * import src/lib/sharding), so the engine is checked against an independent oracle, not itself.
 * Run: `node scripts/node-truth-sharding.mjs`
 */
const SHARDS = 3;
const IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];
const BOUNDS = [1004, 1007];

const hash = (id) => ((id % SHARDS) + SHARDS) % SHARDS;
const range = (id) => {
  for (let i = 0; i < BOUNDS.length; i++) if (id < BOUNDS[i]) return i;
  return BOUNDS.length;
};
const dist = (ids, fn) => ids.reduce((a, id) => ((a[fn(id)]++), a), Array(SHARDS).fill(0));

const hashDemo = dist(IDS, hash);
const rangeDemo = dist(IDS, range);
const monotonic = Array.from({ length: 60 }, (_, i) => 2000 + i); // all ≥ top bound
const rangeMono = dist(monotonic, range);
const hashMono = dist(monotonic, hash);
const spread = (c) => Math.max(...c) - Math.min(...c);

console.log('— node-truth: sharding —');
console.log(`  demo ids ${IDS[0]}…${IDS.at(-1)} (monotonic SERIAL)`);
console.log(`  hash  (id % ${SHARDS}) distribution : [${hashDemo}]   spread ${spread(hashDemo)}  → ground truth [3,3,3]`);
console.log(`  range (bounds ${JSON.stringify(BOUNDS)})    : [${rangeDemo}]   spread ${spread(rangeDemo)}  → ground truth [3,3,3]`);
console.log(`  ${monotonic.length} new monotonic writes (all ≥ ${BOUNDS.at(-1)}):`);
console.log(`    range → [${rangeMono}]  (100% to the last shard — the hotspot)`);
console.log(`    hash  → [${hashMono}]  (spread ${spread(hashMono)} — stays balanced)`);
console.log('  These are the values test-sharding.ts encodes; no magic numbers.');
