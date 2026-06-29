/*
 * test-sharding.ts — golden invariants for the M22 sharding engine (src/lib/sharding).
 * Run via `npm run test:sharding` (also in CI). Proves the two properties the sim teaches:
 *   hash spreads evenly; range keeps scans local but hotspots on monotonically increasing keys.
 */
import {
  IDS,
  RANGE_BOUNDS,
  SHARD_COUNT,
  distribution,
  hashShard,
  rangeShard,
  rangeShardBy,
  shardFor,
  spread,
} from '../src/lib/sharding';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const eq = (a: number[], b: number[]) => JSON.stringify(a) === JSON.stringify(b);

// 1. hashShard is deterministic and always lands in [0, SHARD_COUNT)
for (const id of [0, 1, 1001, 1007, 999999]) {
  const s = hashShard(id);
  assert(s >= 0 && s < SHARD_COUNT, `hashShard(${id})=${s} in [0,${SHARD_COUNT})`);
  assert(hashShard(id) === id % SHARD_COUNT, `hashShard(${id}) === id % ${SHARD_COUNT}`);
}
// negative ids are normalised into range (no negative index)
assert(hashShard(-1) >= 0 && hashShard(-1) < SHARD_COUNT, 'hashShard(-1) normalised into range');

// 2. Demo workload under hash → perfectly even 3/3/3
assert(eq(distribution(IDS, 'hash'), [3, 3, 3]), `hash distribution of demo ids is even (got ${distribution(IDS, 'hash')})`);
assert(spread(distribution(IDS, 'hash')) === 0, 'hash spread on demo ids is 0');

// 3. Demo workload under range → also 3/3/3 for THIS seed, with correct boundaries
assert(eq(distribution(IDS, 'range'), [3, 3, 3]), `range distribution of demo ids (got ${distribution(IDS, 'range')})`);
assert(rangeShard(1003) === 0 && rangeShard(1004) === 1, 'range boundary at 1004');
assert(rangeShard(1006) === 1 && rangeShard(1007) === 2, 'range boundary at 1007');
assert(rangeShard(50) === 0, 'range routes below-first-bound to shard 0');
assert(rangeShard(10 ** 9) === SHARD_COUNT - 1, 'range routes far-above-top-bound to the last shard');
assert(RANGE_BOUNDS.length === SHARD_COUNT - 1, 'range bounds partition into SHARD_COUNT shards');
assert(shardFor(1005, 'range') === rangeShard(1005) && shardFor(1005, 'hash') === hashShard(1005), 'shardFor dispatches by strategy');

// 4. THE TEACHING POINT — a monotonically increasing stream past the top boundary:
//    range piles 100% onto the last shard (hotspot); hash stays balanced.
const monotonic = Array.from({ length: 60 }, (_, i) => 2000 + i); // all ≥ top bound (1007)
const rangeCounts = monotonic.reduce((acc, id) => {
  acc[rangeShardBy(id, RANGE_BOUNDS)]++;
  return acc;
}, new Array<number>(SHARD_COUNT).fill(0));
assert(eq(rangeCounts, [0, 0, monotonic.length]), `monotonic stream hotspots the last shard under range (got ${rangeCounts})`);
assert(spread(distribution(monotonic, 'hash')) <= 1, `same stream stays balanced under hash (spread ${spread(distribution(monotonic, 'hash'))})`);

// 5. Hash scales evenly on a large contiguous keyspace
const big = Array.from({ length: 3000 }, (_, i) => i + 1);
assert(eq(distribution(big, 'hash'), [1000, 1000, 1000]), `hash splits 1..3000 evenly (got ${distribution(big, 'hash')})`);

console.log('— Sharding engine tests —');
console.log(`  ${checks} checks across hash + range routing, distribution, and the monotonic-ID hotspot`);
if (failures > 0) {
  console.error(`\n✖ ${failures} invariant failure(s).`);
  process.exit(1);
}
console.log('\n✓ All sharding invariants hold.');
