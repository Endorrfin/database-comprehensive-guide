/*
 * mvcc.ts — a deterministic MVCC visibility engine (the algorithm behind the M19 sim).
 *
 * Pure logic (no React). MvccSim renders a hand-authored schedule; this is the ground-truth model
 * of PostgreSQL-style multi-version visibility so scripts/test-mvcc.ts can assert the real rules:
 *
 *   • an UPDATE never overwrites — it stamps the live version's xmax and appends a new version;
 *   • each transaction reads against a SNAPSHOT captured at a point in time (the set of xids already
 *     committed then), so it keeps seeing the same data even as others commit (repeatable read);
 *   • a version is visible to a snapshot when its creator (xmin) is effectively committed-to-it and
 *     its deleter (xmax) is NOT — a transaction also sees its own uncommitted writes;
 *   • readers never block writers: visibility is a pure function of (version, snapshot), no locks.
 */

export type TxStatus = 'inprogress' | 'committed' | 'aborted';

/** One heap version (tuple) of a row. `xmax === null` ⇒ this is the live version. */
export type Version = { xmin: number; xmax: number | null; val: number };

/** A read snapshot: the reader's own xid plus the set of xids committed when it was taken. */
export type Snapshot = { self: number; committed: ReadonlySet<number> };

/** Single-row MVCC store (the sim follows accounts.id = 1). */
export class Mvcc {
  private versions: Version[] = [];
  private status = new Map<number, TxStatus>();

  begin(xid: number): void {
    if (!this.status.has(xid)) this.status.set(xid, 'inprogress');
  }
  commit(xid: number): void {
    this.status.set(xid, 'committed');
  }
  abort(xid: number): void {
    this.status.set(xid, 'aborted');
  }
  statusOf(xid: number): TxStatus | undefined {
    return this.status.get(xid);
  }

  /** Insert the first version of the row under `xid` (the row's creator). */
  insert(xid: number, val: number): void {
    this.begin(xid);
    this.versions.push({ xmin: xid, xmax: null, val });
  }

  /** UPDATE: stamp the live version's xmax and append a new version (no in-place overwrite). */
  update(xid: number, val: number): void {
    this.begin(xid);
    const live = this.liveVersion();
    if (live) live.xmax = xid;
    this.versions.push({ xmin: xid, xmax: null, val });
  }

  /** DELETE: stamp the live version's xmax; no new version is written. */
  del(xid: number): void {
    this.begin(xid);
    const live = this.liveVersion();
    if (live) live.xmax = xid;
  }

  /** Capture a snapshot for `self`: every xid currently committed is frozen as visible. */
  snapshot(self: number): Snapshot {
    this.begin(self);
    const committed = new Set<number>();
    for (const [xid, st] of this.status) if (st === 'committed') committed.add(xid);
    return { self, committed };
  }

  /** Is `xid`'s effect visible to `snap`? Own writes count (unless aborted); others must be both
   *  committed AND already committed when the snapshot was taken. */
  private effectivelyCommitted(xid: number, snap: Snapshot): boolean {
    if (xid === snap.self) return this.status.get(xid) !== 'aborted';
    return this.status.get(xid) === 'committed' && snap.committed.has(xid);
  }

  /** Core rule: visible iff creator is committed-to-snapshot and deleter is not. */
  isVisible(v: Version, snap: Snapshot): boolean {
    const creatorVisible = this.effectivelyCommitted(v.xmin, snap);
    const deleterVisible = v.xmax !== null && this.effectivelyCommitted(v.xmax, snap);
    return creatorVisible && !deleterVisible;
  }

  /** The single version visible to `snap` (or undefined). */
  visibleTo(snap: Snapshot): Version | undefined {
    return this.versions.find((v) => this.isVisible(v, snap));
  }

  /** Read the row's value through `snap` (undefined if no version is visible). */
  read(snap: Snapshot): number | undefined {
    return this.visibleTo(snap)?.val;
  }

  /** How many versions a snapshot can see — must always be ≤ 1 (the chain invariant). */
  visibleCount(snap: Snapshot): number {
    return this.versions.filter((v) => this.isVisible(v, snap)).length;
  }

  /** The current live (undeleted) version, regardless of commit state. */
  private liveVersion(): Version | undefined {
    return this.versions.find((v) => v.xmax === null);
  }

  /** Versions that are dead for every still-active snapshot — VACUUM may reclaim these. */
  deadVersions(activeSnapshots: Snapshot[]): Version[] {
    return this.versions.filter((v) => {
      if (v.xmax === null) return false;
      const deleterCommitted = this.status.get(v.xmax) === 'committed';
      if (!deleterCommitted) return false;
      // Dead only if NO active snapshot can still see it.
      return activeSnapshots.every((s) => !this.isVisible(v, s));
    });
  }

  /** Reclaim dead tuples (VACUUM); returns how many were removed. */
  vacuum(activeSnapshots: Snapshot[]): number {
    const dead = new Set(this.deadVersions(activeSnapshots));
    const before = this.versions.length;
    this.versions = this.versions.filter((v) => !dead.has(v));
    return before - this.versions.length;
  }

  /** Snapshot of the version chain (for inspection/tests). */
  chain(): Version[] {
    return this.versions.map((v) => ({ ...v }));
  }
}
