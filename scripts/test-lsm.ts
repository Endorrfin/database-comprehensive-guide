/*
 * test-lsm.ts — golden invariants for the LSM engine (src/lib/lsm), run via `npm run test:lsm`.
 * Proves: newest-wins, tombstone purge at the bottom level, sorted/unique SSTables, get() semantics,
 * the M15 sim's exact final state, and (the strong one) parity with an authoritative Map model over a
 * randomized op stream — the Map is the ground truth an LSM must reproduce.
 */
import type { Cell, SSTable } from '../src/lib/lsm';
import { Lsm, mergeSSTables } from '../src/lib/lsm';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}
const pairs = (cells: Cell[]) => cells.map((c) => `${c.key}=${c.value ?? '⊘'}`).join(',');
const isSorted = (cells: Cell[]) => cells.every((c, i) => i === 0 || cells[i - 1].key < c.key);

// ── 1. mergeSSTables: newest wins; purge flag controls tombstone survival ────────────────────────
const older: SSTable = { id: 'o', cells: [{ key: 'a', value: '1' }, { key: 'c', value: '3' }, { key: 'd', value: '4' }] };
const newer: SSTable = { id: 'n', cells: [{ key: 'a', value: '9' }, { key: 'c', value: null }, { key: 'e', value: '5' }] };
const bottom = mergeSSTables([older, newer], { purgeTombstones: true }, 'B');
assert(pairs(bottom.cells) === 'a=9,d=4,e=5', `bottom merge purges tombstone & takes newest (got ${pairs(bottom.cells)})`);
assert(isSorted(bottom.cells), 'merged run is sorted by key');
const mid = mergeSSTables([older, newer], { purgeTombstones: false }, 'M');
assert(pairs(mid.cells) === 'a=9,c=⊘,d=4,e=5', `non-bottom merge KEEPS the tombstone (got ${pairs(mid.cells)})`);

// ── 2. Reproduce the M15 sim's exact narrative (capacity 4) ───────────────────────────────────────
const e = new Lsm(4);
e.put('a', '1'); e.put('c', '3'); e.put('b', '2'); // memtable [a,b,c]
e.put('d', '4');                                    // fills → flush L0·1 [a1,b2,c3,d4]
assert(e.level0().length === 1 && pairs(e.level0()[0].cells) === 'a=1,b=2,c=3,d=4', 'first flush → sorted L0·1');
e.put('a', '9'); e.del('c'); e.put('e', '5');       // memtable [a9, c⊘, e5]
e.put('f', '6');                                    // fills → flush L0·2 [a9,c⊘,e5,f6]
assert(e.level0().length === 2, 'second flush → two L0 SSTables');
e.compact();                                        // → L1·1 [a9,b2,d4,e5,f6]
assert(e.level0().length === 0, 'compaction drains L0');
assert(e.level1().length === 1, 'compaction produces one bottom run');
assert(pairs(e.level1()[0].cells) === 'a=9,b=2,d=4,e=5,f=6', `final L1 matches the sim (got ${pairs(e.level1()[0].cells)})`);
assert(e.stats().flushes === 2 && e.stats().compactions === 1, 'flush/compaction counts');

// ── 3. get() semantics after compaction ──────────────────────────────────────────────────────────
assert(e.get('a') === '9', 'get newest value (a=9, not 1)');
assert(e.get('b') === '2' && e.get('d') === '4' && e.get('f') === '6', 'get surviving keys');
assert(e.get('c') === undefined, 'get a deleted key → undefined (tombstone purged)');
assert(e.get('z') === undefined, 'get an absent key → undefined');

// structural: bottom run sorted with unique keys
const l1cells = e.level1()[0].cells;
assert(isSorted(l1cells), 'bottom run sorted');
assert(new Set(l1cells.map((c) => c.key)).size === l1cells.length, 'bottom run has unique keys');

// ── 4. Property test: LSM must read identically to an authoritative Map over a random op stream ───
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const keyspace = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
for (let seed = 1; seed <= 5; seed++) {
  const rnd = mulberry32(seed * 7919);
  const lsm = new Lsm(4);
  const truth = new Map<string, string>();
  for (let i = 0; i < 200; i++) {
    const k = keyspace[Math.floor(rnd() * keyspace.length)];
    if (rnd() < 0.25) {
      lsm.del(k); truth.delete(k);
    } else {
      const v = String(Math.floor(rnd() * 1000));
      lsm.put(k, v); truth.set(k, v);
    }
  }
  lsm.flush();   // drain the memtable so the bottom run reflects every write…
  lsm.compact(); // …then merge everything into one purged bottom run
  let mism = 0;
  for (const k of keyspace) if (lsm.get(k) !== (truth.get(k) ?? undefined)) mism++;
  assert(mism === 0, `seed ${seed}: LSM reads match the Map ground truth for all keys`);
  // After flush+compact the bottom run must equal the live truth exactly: no tombstones, current
  // values, same size, sorted, unique.
  const live = lsm.level1()[0]?.cells ?? [];
  const liveMap = new Map(live.map((c) => [c.key, c.value]));
  let structOk = live.every((c) => c.value !== null) && isSorted(live) && live.length === truth.size;
  for (const [k, v] of truth) if (liveMap.get(k) !== v) structOk = false;
  assert(structOk, `seed ${seed}: bottom run equals the live truth (${live.length} live vs ${truth.size})`);
}

console.log('— LSM engine tests —');
console.log(`  ${checks} checks: merge/newest-wins, tombstone purge, sim reproduction, get(), Map-parity (5 seeds)`);
if (failures > 0) {
  console.error(`\n✖ ${failures} invariant failure(s).`);
  process.exit(1);
}
console.log('\n✓ All LSM invariants hold.');
