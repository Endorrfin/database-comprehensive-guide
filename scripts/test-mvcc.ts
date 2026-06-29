/*
 * test-mvcc.ts — golden invariants for the MVCC engine (src/lib/mvcc), run via `npm run test:mvcc`.
 * Reproduces the M19 T1/T2 schedule and proves the rules the sim teaches: a writer's new version is
 * invisible to an older snapshot, readers never block, snapshots are stable across others' commits
 * (repeatable read), a txn sees its own writes, aborts vanish, and VACUUM only reclaims truly-dead
 * tuples. Exactly one version is ever visible to a snapshot.
 */
import { Mvcc } from '../src/lib/mvcc';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

// ── The M19 schedule on accounts.id = 1 ──────────────────────────────────────────────────────────
const db = new Mvcc();
db.insert(90, 500); // v1 created by xid 90…
db.commit(90); //               …and committed → the live, current version

// T1 begins and snapshots; reads 500.
const snapT1 = db.snapshot(100);
assert(db.read(snapT1) === 500, 'T1 reads the committed value (500)');
assert(db.visibleCount(snapT1) === 1, 'exactly one version visible to T1');

// T2 updates to 600 — a NEW version appears; T2 not yet committed.
db.begin(101);
db.update(101, 600);
assert(db.chain().length === 2, 'UPDATE appends a version (no overwrite)');
assert(db.chain()[0].xmax === 101, 'old version is stamped with the updater xid (xmax = 101)');

// Readers never block writers: T1 STILL sees 500; T2 sees its own 600.
assert(db.read(snapT1) === 500, "T1 still sees 500 — T2's uncommitted v2 is invisible");
const snapT2 = db.snapshot(101);
assert(db.read(snapT2) === 600, 'T2 sees its own uncommitted write (600)');

// A fresh concurrent reader BEFORE T2 commits still sees 500.
const snapBefore = db.snapshot(150);
assert(db.read(snapBefore) === 500, 'a concurrent snapshot taken pre-commit sees 500');

// T2 commits. New snapshots see 600 — but T1's existing snapshot is stable at 500 (repeatable read).
db.commit(101);
const snapAfter = db.snapshot(200);
assert(db.read(snapAfter) === 600, 'a snapshot taken after commit sees the new value (600)');
assert(db.read(snapT1) === 500, "T1's original snapshot is unchanged by T2's commit (repeatable read)");
assert(db.visibleCount(snapT1) === 1 && db.visibleCount(snapAfter) === 1, 'still exactly one visible version per snapshot');

// ── VACUUM only reclaims tuples no active snapshot can see ────────────────────────────────────────
assert(db.deadVersions([snapT1, snapAfter]).length === 0, 'v1 is NOT dead while T1 can still see it');
assert(db.vacuum([snapT1, snapAfter]) === 0, 'VACUUM reclaims nothing while T1 is active');
// T1 finishes → its snapshot is no longer active.
const removed = db.vacuum([snapAfter]);
assert(removed === 1 && db.chain().length === 1, 'once T1 ends, VACUUM reclaims the dead v1');
assert(db.read(snapAfter) === 600, 'the surviving version still reads correctly after VACUUM');

// ── Abort path: an aborted update leaves the original visible ─────────────────────────────────────
const db2 = new Mvcc();
db2.insert(90, 500);
db2.commit(90);
db2.begin(101);
db2.update(101, 600);
db2.abort(101);
const s = db2.snapshot(300);
assert(db2.read(s) === 500, 'an aborted UPDATE is invisible — original value (500) stands');
assert(db2.visibleCount(s) === 1, 'aborted writer does not create a second visible version');

console.log('— MVCC engine tests —');
console.log(`  ${checks} checks: version chain, snapshot isolation, self-visibility, abort, VACUUM`);
if (failures > 0) {
  console.error(`\n✖ ${failures} invariant failure(s).`);
  process.exit(1);
}
console.log('\n✓ All MVCC invariants hold.');
