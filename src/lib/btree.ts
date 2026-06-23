/*
 * btree.ts — a correct, deterministic in-memory B-Tree / B+Tree engine.
 * Pure logic (no React), so the golden M13 visualizer renders it and the
 * test (scripts/test-btree.ts) can verify its invariants directly.
 *
 * Reactive insertion: descend to the leaf, insert, then split upward — the tree
 * grows from the leaves and stays balanced (all leaves at equal depth).
 */

export type Mode = 'btree' | 'bplus';

/** Max keys per node before a split (min degree t = 2). Small so splits are visible. */
export const MAX = 3;

// layout constants (shared with the renderer)
export const KEY_W = 30;
export const BOX_H = 38;
export const PAD = 9;
const GAPX = 22;
const LEVEL_H = 86;
const TOP = 16;

export type BNode = {
  id: number;
  leaf: boolean;
  keys: number[];
  children: BNode[];
  next: BNode | null; // B+Tree leaf link
};

function insertSorted(arr: number[], k: number): void {
  let i = arr.length;
  while (i > 0 && arr[i - 1] > k) i--;
  arr.splice(i, 0, k);
}

export function childIndexFor(keys: number[], key: number): number {
  let i = keys.findIndex((k) => key < k);
  if (i === -1) i = keys.length;
  return i;
}

/** Build a fresh tree from a list of keys, inserting in order. Ids are deterministic. */
export function build(keys: number[], mode: Mode): { root: BNode; count: number } {
  let nextId = 0;
  const alloc = () => nextId++;
  let root: BNode = { id: alloc(), leaf: true, keys: [], children: [], next: null };
  for (const key of keys) root = insertKey(root, key, mode, alloc);
  // Splits create fresh leaf objects, so a left sibling's stale `next` can dangle.
  // Rebuild the leaf chain in structural order — correct by construction.
  relinkLeaves(root);
  return { root, count: keys.length };
}

function relinkLeaves(root: BNode): void {
  const leaves = leavesInOrder(root);
  for (let i = 0; i < leaves.length; i++) {
    leaves[i].next = i + 1 < leaves.length ? leaves[i + 1] : null;
  }
}

function insertKey(root: BNode, key: number, mode: Mode, alloc: () => number): BNode {
  const path: { node: BNode; idx: number }[] = [];
  let node = root;
  while (!node.leaf) {
    const idx = childIndexFor(node.keys, key);
    path.push({ node, idx });
    node = node.children[idx];
  }
  if (node.keys.includes(key)) return root; // ignore duplicates for a clean demo
  insertSorted(node.keys, key);

  let current = node;
  while (current.keys.length > MAX) {
    const { up, left, right } = splitNode(current, mode, alloc);
    const parent = path.pop();
    if (!parent) {
      return { id: alloc(), leaf: false, keys: [up], children: [left, right], next: null };
    }
    parent.node.children.splice(parent.idx, 1, left, right);
    insertSorted(parent.node.keys, up);
    current = parent.node;
  }
  return root;
}

function splitNode(
  node: BNode,
  mode: Mode,
  alloc: () => number,
): { up: number; left: BNode; right: BNode } {
  const left: BNode = { id: node.id, leaf: node.leaf, keys: [], children: [], next: null };
  const right: BNode = { id: alloc(), leaf: node.leaf, keys: [], children: [], next: null };

  // Leaf `next` links are rebuilt in relinkLeaves() after the whole tree is built.
  if (node.leaf && mode === 'bplus') {
    const mid = Math.ceil(node.keys.length / 2);
    left.keys = node.keys.slice(0, mid);
    right.keys = node.keys.slice(mid); // B+ leaf keeps all keys; separator is copied up
    return { up: right.keys[0], left, right };
  }

  const mid = Math.floor(node.keys.length / 2);
  const up = node.keys[mid];
  left.keys = node.keys.slice(0, mid);
  right.keys = node.keys.slice(mid + 1);
  if (!node.leaf) {
    left.children = node.children.slice(0, mid + 1);
    right.children = node.children.slice(mid + 1);
  }
  return { up, left, right };
}

export function treeHeight(node: BNode): number {
  let h = 1;
  let n = node;
  while (!n.leaf) {
    h++;
    n = n.children[0];
  }
  return h;
}

export function searchPath(root: BNode, key: number, mode: Mode): { path: number[]; found: boolean } {
  const path: number[] = [];
  let node: BNode | undefined = root;
  while (node) {
    path.push(node.id);
    if (node.leaf) return { path, found: node.keys.includes(key) };
    if (mode === 'btree' && node.keys.includes(key)) return { path, found: true };
    node = node.children[childIndexFor(node.keys, key)];
  }
  return { path, found: false };
}

export function searchPathToLeaf(root: BNode, key: number): BNode {
  let node = root;
  while (!node.leaf) node = node.children[childIndexFor(node.keys, key)];
  return node;
}

export function firstLeaf(root: BNode): BNode {
  let n = root;
  while (!n.leaf) n = n.children[0];
  return n;
}

export function leavesInOrder(root: BNode): BNode[] {
  const out: BNode[] = [];
  const walk = (n: BNode) => {
    if (n.leaf) out.push(n);
    else n.children.forEach(walk);
  };
  walk(root);
  return out;
}

export function collectNodes(root: BNode): BNode[] {
  const out: BNode[] = [];
  const walk = (n: BNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

export function collectLeafLinks(root: BNode): [number, number][] {
  const links: [number, number][] = [];
  let leaf: BNode | null = firstLeaf(root);
  while (leaf && leaf.next) {
    links.push([leaf.id, leaf.next.id]);
    leaf = leaf.next;
  }
  return links;
}

export type Pos = { x: number; y: number; w: number };

export function layout(root: BNode): { pos: Map<number, Pos>; width: number; height: number } {
  const pos = new Map<number, Pos>();
  let cursor = PAD;
  const place = (node: BNode, depth: number): number => {
    const w = Math.max(node.keys.length, 1) * KEY_W + PAD * 2;
    let cx: number;
    if (node.leaf) {
      cx = cursor + w / 2;
      cursor += w + GAPX;
    } else {
      const centers = node.children.map((c) => place(c, depth + 1));
      cx = (centers[0] + centers[centers.length - 1]) / 2;
    }
    pos.set(node.id, { x: cx, y: TOP + depth * LEVEL_H, w });
    return cx;
  };
  place(root, 0);
  return { pos, width: cursor, height: TOP + treeHeight(root) * LEVEL_H };
}
