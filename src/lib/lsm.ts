/*
 * lsm.ts — a correct, deterministic LSM-tree storage engine (the algorithm behind the M15 sim).
 *
 * Pure logic (no React). LsmSim renders a hand-authored teaching narrative; this module is the
 * *algorithmic ground truth* that narrative depicts, so scripts/test-lsm.ts can verify the real
 * invariants (and that the sim's final state is reproducible):
 *
 *   • writes buffer in a sorted in-memory memtable; a delete writes a tombstone (value = null);
 *   • when the memtable reaches capacity it is flushed as one immutable, sorted SSTable at L0;
 *   • compaction merge-sorts SSTables into the bottom level: newest version of each key wins, and
 *     tombstones cancel their key and are purged (safe only at the bottom — nothing older beneath);
 *   • get() reads newest-first: memtable, then SSTables newest→oldest; a tombstone means "deleted".
 */

/** A key/value cell. `value === null` is a tombstone (a delete marker). */
export type Cell = { key: string; value: string | null };

/** An immutable, sorted run of cells with unique keys. */
export type SSTable = { id: string; cells: Cell[] };

/** Sort cells by key ascending (stable). */
function byKey(a: Cell, b: Cell): number {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

/**
 * Merge SSTables (ordered oldest → newest) into one sorted run. The newest version of each key
 * wins. When `purgeTombstones` is true (a bottom-level compaction), deleted keys are dropped;
 * otherwise the tombstone is kept (a higher level may still hide older data below it).
 */
export function mergeSSTables(
  tables: SSTable[],
  opts: { purgeTombstones: boolean },
  id: string,
): SSTable {
  const newest = new Map<string, string | null>();
  for (const t of tables) {
    for (const c of t.cells) newest.set(c.key, c.value); // later tables overwrite earlier → newest wins
  }
  const cells: Cell[] = [];
  for (const [key, value] of newest) {
    if (opts.purgeTombstones && value === null) continue;
    cells.push({ key, value });
  }
  cells.sort(byKey);
  return { id, cells };
}

/** The write-optimized LSM engine. Default memtable capacity 4 matches the M15 sim. */
export class Lsm {
  readonly capacity: number;
  private memtable = new Map<string, string | null>();
  private l0: SSTable[] = [];
  private l1: SSTable[] = [];
  private flushes = 0;
  private compactions = 0;

  constructor(capacity = 4) {
    this.capacity = capacity;
  }

  /** Write (or overwrite) a key. Auto-flushes when the memtable fills. */
  put(key: string, value: string): void {
    this.memtable.set(key, value);
    this.maybeFlush();
  }

  /** Delete a key by writing a tombstone. Auto-flushes when the memtable fills. */
  del(key: string): void {
    this.memtable.set(key, null);
    this.maybeFlush();
  }

  private maybeFlush(): void {
    if (this.memtable.size >= this.capacity) this.flush();
  }

  /** Freeze the memtable into one immutable, sorted SSTable at L0; clear the memtable. */
  flush(): void {
    if (this.memtable.size === 0) return;
    const cells: Cell[] = [...this.memtable].map(([key, value]) => ({ key, value }));
    cells.sort(byKey);
    this.l0.push({ id: `L0·${++this.flushes}`, cells });
    this.memtable.clear();
  }

  /**
   * Compact all on-disk runs into a single bottom-level (L1) SSTable. Oldest→newest order makes the
   * newest version win; tombstones are purged because L1 is the bottom here.
   */
  compact(): void {
    const ordered = [...this.l1, ...this.l0]; // l1 (older) first, then l0 flushes oldest→newest
    if (ordered.length === 0) return;
    const merged = mergeSSTables(ordered, { purgeTombstones: true }, `L1·${++this.compactions}`);
    this.l1 = [merged];
    this.l0 = [];
  }

  /** Point read: newest-first across memtable then SSTables. Returns undefined if absent or deleted. */
  get(key: string): string | undefined {
    if (this.memtable.has(key)) {
      const v = this.memtable.get(key)!;
      return v === null ? undefined : v;
    }
    const runs = [...this.l0, ...this.l1]; // search newest→oldest
    for (let i = runs.length - 1; i >= 0; i--) {
      const hit = runs[i].cells.find((c) => c.key === key);
      if (hit) return hit.value === null ? undefined : hit.value;
    }
    return undefined;
  }

  // ── Inspectors (used by tests; the sim has its own renderer) ──────────────────────────────────
  memtableCells(): Cell[] {
    return [...this.memtable].map(([key, value]) => ({ key, value })).sort(byKey);
  }
  level0(): SSTable[] {
    return this.l0;
  }
  level1(): SSTable[] {
    return this.l1;
  }
  stats(): { flushes: number; compactions: number } {
    return { flushes: this.flushes, compactions: this.compactions };
  }
}
