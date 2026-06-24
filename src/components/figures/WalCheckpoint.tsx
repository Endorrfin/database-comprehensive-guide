/*
 * Static diagram (M17): the Write-Ahead Log + checkpoint, and what recovery replays. The WAL is a
 * single sequential, append-only log on disk. A change is logged BEFORE its data page is flushed;
 * at COMMIT the log is fsync'd — that flush is the durability point. Periodically a CHECKPOINT
 * flushes the dirty data pages and writes a checkpoint record, which BOUNDS recovery: after a crash,
 * REDO (roll-forward) replays the WAL only from the last checkpoint onward. Commit-green for the
 * durability boundary; storage-violet for data pages; danger-red for the crash. Labels stay English.
 * Facts: postgresql.org/docs/current/wal-intro.html (28.3) + wal-configuration.html (checkpoints).
 */
export function WalCheckpoint() {
  return (
    <svg
      viewBox="0 0 660 332"
      width="100%"
      role="img"
      aria-label="A diagram of the Write-Ahead Log and a checkpoint. The WAL is drawn as a horizontal append-only log on disk, divided left to right into records: a CHECKPOINT record, then a data-change record, a COMMIT record marked fsync (the durability point), and a final change record, ending at a crash marker. An arrow labelled REDO — roll-forward — shows recovery replaying the log from the last checkpoint forward up to the crash. Below the log sit the data files on disk, which are flushed lazily; an arrow labelled log-before-page points from a change record down to a data page. The caption notes the checkpoint bounds how much WAL must be replayed."
      style={{ maxWidth: 660 }}
    >
      <title>The Write-Ahead Log + checkpoint: log before pages, redo from the last checkpoint</title>

      <defs>
        <marker id="wal-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
        <marker id="wal-arrow-v" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-storage)" />
        </marker>
      </defs>

      <text x={28} y={30} fontFamily="var(--font-body)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        Write-Ahead Log
      </text>
      <text x={170} y={30} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx3)">
        append-only · sequential · on disk
      </text>

      {/* the log track */}
      <rect x={28} y={44} width={604} height={56} rx="8" fill="var(--s2)" stroke="var(--line2)" />

      {/* checkpoint record */}
      <rect x={36} y={52} width={120} height={40} rx="6" fill="var(--c-dist-soft)" stroke="var(--c-dist)" strokeWidth="1.3" />
      <text x={96} y={70} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={700} fill="var(--c-dist)">
        CHECKPOINT
      </text>
      <text x={96} y={84} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        pages flushed
      </text>

      {/* change record 1 */}
      <rect x={164} y={52} width={108} height={40} rx="6" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.2" />
      <text x={218} y={76} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx2)">
        redo: id=1
      </text>

      {/* commit record */}
      <rect x={280} y={52} width={132} height={40} rx="6" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.6" />
      <text x={346} y={70} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={700} fill="var(--c-commit)">
        COMMIT (fsync)
      </text>
      <text x={346} y={84} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-commit)">
        durability point
      </text>

      {/* change record 2 */}
      <rect x={420} y={52} width={104} height={40} rx="6" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.2" />
      <text x={472} y={76} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx2)">
        redo: id=2
      </text>

      {/* crash marker */}
      <rect x={532} y={52} width={92} height={40} rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.4" />
      <text x={578} y={70} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight={700} fill="var(--c-danger)">
        ✕ crash
      </text>
      <text x={578} y={84} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-danger)">
        RAM lost
      </text>

      {/* REDO span: from last checkpoint → crash */}
      <line x1={96} y1={118} x2={578} y2={118} stroke="var(--c-commit)" strokeWidth="1.6" markerEnd="url(#wal-arrow)" />
      <line x1={96} y1={110} x2={96} y2={126} stroke="var(--c-commit)" strokeWidth="1.6" />
      <text x={300} y={112} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--c-commit)">
        REDO — roll-forward from the last checkpoint
      </text>
      <text x={300} y={140} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx2)">
        recovery replays only this span; the checkpoint bounds how much WAL must be redone
      </text>

      {/* log-before-page arrow down to data files */}
      <line x1={218} y1={92} x2={218} y2={196} stroke="var(--c-storage)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#wal-arrow-v)" />
      <text x={228} y={170} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        log-before-page
      </text>

      {/* data files box */}
      <text x={28} y={188} fontFamily="var(--font-body)" fontSize="12.5" fontWeight={700} fill="var(--c-storage)">
        Data files (disk)
      </text>
      <text x={172} y={188} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx3)">
        flushed lazily — not on every commit
      </text>
      <rect x={28} y={200} width={604} height={56} rx="8" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.2" />
      <text x={48} y={224} fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx2)">
        page (id=1, id=2 …)
      </text>
      <text x={48} y={242} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        may lag the WAL — the checkpoint catches them up
      </text>
      <text x={420} y={232} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        only the WAL must be fsync’d to commit
      </text>

      {/* footer rule */}
      <rect x={28} y={272} width={604} height={48} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={48} y={293} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        <tspan fill="var(--accent-bright)" fontWeight={700}>One sequential log, fsync’d once at commit, </tspan>
        buys both durability (replay committed work) and
      </text>
      <text x={48} y={310} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        atomicity (a txn with no COMMIT record is discarded) — far cheaper than flushing every data page.
      </text>
    </svg>
  );
}
