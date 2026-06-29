/*
 * sharding.ts — pure key→shard routing for the M22 sharding sim and its golden tests.
 *
 * Two strategies, one source of truth (ShardingSim renders this; scripts/test-sharding.ts asserts it):
 *   • hash  — id % N. Uniform spread; rebalancing on N change is the cost (not modelled here).
 *   • range — contiguous key ranges. Range scans stay local, but monotonically increasing keys
 *             (SERIAL/IDENTITY/snowflake) all fall past the top boundary into the last shard — the
 *             classic write hotspot. `rangeShardBy` makes that property testable for any stream.
 */

export type Strategy = 'hash' | 'range';

/** Number of shards in the demo. */
export const SHARD_COUNT = 3;

/** The demo workload: 9 monotonically increasing ids (typical SERIAL/IDENTITY inserts). */
export const IDS: readonly number[] = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];

/**
 * Upper-exclusive boundaries for the demo's range partitions (SHARD_COUNT-1 of them):
 * shard 0 = id < 1004, shard 1 = 1004 ≤ id < 1007, shard 2 = id ≥ 1007.
 */
export const RANGE_BOUNDS: readonly number[] = [1004, 1007];

/** Hash routing: id % shards, normalised so negative ids still map into [0, shards). */
export function hashShard(id: number, shards: number = SHARD_COUNT): number {
  return ((Math.trunc(id) % shards) + shards) % shards;
}

/**
 * Range routing against arbitrary ascending boundaries: the shard is the index of the first bound
 * the id is below; ids at or above every bound land in the last shard (index bounds.length).
 */
export function rangeShardBy(id: number, bounds: readonly number[]): number {
  for (let i = 0; i < bounds.length; i++) {
    if (id < bounds[i]) return i;
  }
  return bounds.length;
}

/** Range routing for the demo's fixed partitions. */
export function rangeShard(id: number): number {
  return rangeShardBy(id, RANGE_BOUNDS);
}

/** Route one id under the chosen strategy. */
export function shardFor(id: number, strategy: Strategy): number {
  return strategy === 'hash' ? hashShard(id) : rangeShard(id);
}

/** Per-shard row counts for a list of ids under a strategy (length === SHARD_COUNT). */
export function distribution(ids: readonly number[], strategy: Strategy): number[] {
  const counts = new Array<number>(SHARD_COUNT).fill(0);
  for (const id of ids) counts[shardFor(id, strategy)]++;
  return counts;
}

/** Spread = max shard count − min shard count. 0 = perfectly even; large = hotspot. */
export function spread(counts: readonly number[]): number {
  return Math.max(...counts) - Math.min(...counts);
}
