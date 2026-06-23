/*
 * test-btree.ts — invariant tests for the golden B-Tree / B+Tree engine.
 * Run via `npm run test:btree` (also in CI). Verifies the structural guarantees
 * M13 teaches: balanced (all leaves equal depth), sorted keys, n keys → n+1
 * children, correct in-order, B+ linked-leaf ordering, and search correctness.
 */
import type { BNode, Mode } from '../src/lib/btree';
import { MAX, build, collectNodes, firstLeaf, leavesInOrder, searchPath } from '../src/lib/btree';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

function leafDepths(root: BNode): number[] {
  const depths: number[] = [];
  const walk = (n: BNode, d: number) => {
    if (n.leaf) depths.push(d);
    else n.children.forEach((c) => walk(c, d + 1));
  };
  walk(root, 0);
  return depths;
}

function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1] >= a[i]) return false;
  return true;
}

function inorderFull(n: BNode): number[] {
  if (n.leaf) return [...n.keys];
  const out: number[] = [];
  n.children.forEach((c, i) => {
    out.push(...inorderFull(c));
    if (i < n.keys.length) out.push(n.keys[i]);
  });
  return out;
}

function leafConcat(root: BNode): number[] {
  return leavesInOrder(root).flatMap((l) => l.keys);
}

function bplusChain(root: BNode): number[] {
  const out: number[] = [];
  let leaf: BNode | null = firstLeaf(root);
  const guard = 10000;
  let i = 0;
  while (leaf && i++ < guard) {
    out.push(...leaf.keys);
    leaf = leaf.next;
  }
  return out;
}

function run(label: string, input: number[], mode: Mode): void {
  const { root } = build(input, mode);
  const sortedUnique = [...new Set(input)].sort((a, b) => a - b);
  const nodes = collectNodes(root);

  // 1. balance: all leaves at the same depth
  const depths = leafDepths(root);
  assert(new Set(depths).size === 1, `${label}: all leaves at equal depth (got ${[...new Set(depths)].join(',')})`);

  // 2. node-level invariants
  for (const n of nodes) {
    assert(n.keys.length <= MAX, `${label}: node ${n.id} within MAX keys (${n.keys.length})`);
    assert(isSorted(n.keys), `${label}: node ${n.id} keys sorted`);
    if (n !== root) assert(n.keys.length >= 1, `${label}: non-root node ${n.id} has ≥1 key`);
    if (!n.leaf) {
      assert(
        n.children.length === n.keys.length + 1,
        `${label}: internal node ${n.id} has n+1 children (${n.keys.length} keys, ${n.children.length} children)`,
      );
    }
  }

  // 3. correctness of contents (mode-specific)
  if (mode === 'btree') {
    assert(
      JSON.stringify(inorderFull(root)) === JSON.stringify(sortedUnique),
      `${label}: B-Tree in-order equals the sorted unique input`,
    );
  } else {
    assert(
      JSON.stringify(leafConcat(root)) === JSON.stringify(sortedUnique),
      `${label}: B+Tree leaves (in order) hold exactly the sorted unique input`,
    );
    assert(
      JSON.stringify(bplusChain(root)) === JSON.stringify(sortedUnique),
      `${label}: B+Tree next-pointer chain visits all keys in sorted order`,
    );
  }

  // 4. search finds every key and rejects an absent one
  for (const k of sortedUnique) {
    if (!searchPath(root, k, mode).found) {
      assert(false, `${label}: search finds inserted key ${k}`);
    }
  }
  checks++; // count the search sweep as one logical check when it passes
  const absent = Math.max(...sortedUnique) + 1;
  assert(!searchPath(root, absent, mode).found, `${label}: search rejects absent key ${absent}`);
}

const DEMO = [50, 30, 70, 20, 40, 60, 80, 35, 10, 45, 25, 65, 15, 55, 75];
const ASC = Array.from({ length: 25 }, (_, i) => i + 1);
const DESC = [...ASC].reverse();
const DUPES = [10, 20, 10, 30, 20, 40, 5, 5, 15];

for (const mode of ['btree', 'bplus'] as Mode[]) {
  run(`DEMO/${mode}`, DEMO, mode);
  run(`ASC/${mode}`, ASC, mode);
  run(`DESC/${mode}`, DESC, mode);
  run(`DUPES/${mode}`, DUPES, mode);
}

console.log('— B-Tree engine tests —');
console.log(`  ${checks} checks across B-Tree & B+Tree (DEMO, ascending, descending, duplicates)`);
if (failures > 0) {
  console.error(`\n✖ ${failures} invariant failure(s).`);
  process.exit(1);
}
console.log('\n✓ All B-Tree / B+Tree invariants hold.');
