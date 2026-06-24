/*
 * Static diagram (M15): why an LSM-tree is write-optimized — the write path, head to head.
 * Left, a B-Tree updates in place: to write a row it must first find the right leaf page deep
 * in the tree and overwrite it — a random I/O, plus a WAL write. Right, an LSM-tree appends the
 * write to an in-memory memtable (sequential), later flushes the whole sorted memtable as one
 * immutable SSTable (sequential), and sorts/merges in the background via compaction. Random,
 * scattered writes (amber/danger) vs sequential, batched writes (commit-green). Labels stay
 * English; gloss in caption/prose. Storage-violet structure on the dark base.
 */
export function LsmVsBtree() {
  return (
    <svg
      viewBox="0 0 660 320"
      width="100%"
      role="img"
      aria-label="Two write paths side by side. On the left, a B-Tree updates in place: a write must descend the tree to the correct leaf page and overwrite it — a random disk write, plus a write-ahead log entry. On the right, an LSM-tree appends the write to an in-memory memtable (a sequential write), then later flushes the entire sorted memtable to disk as one new immutable SSTable, and merges SSTables in the background through compaction. The B-Tree does scattered random writes; the LSM-tree does batched sequential writes."
      style={{ maxWidth: 660 }}
    >
      <title>B-Tree (update in place) vs LSM-tree (buffer, then sort) write paths</title>

      <defs>
        <marker id="lvb-rand" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-danger)" />
        </marker>
        <marker id="lvb-seq" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
      </defs>

      {/* ── Left panel: B-Tree, update in place ───────────────────────────── */}
      <text x={20} y={22} fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--c-storage)">
        B-Tree — update in place
      </text>
      <text x={20} y={40} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        find the leaf, then overwrite it
      </text>

      {/* root */}
      <rect x={130} y={56} width={64} height={24} rx="5" fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.3" />
      <text x={162} y={72} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--tx)">
        root
      </text>
      {/* internal children */}
      {[58, 146, 234].map((x, i) => (
        <rect key={i} x={x} y={108} width={56} height={22} rx="4" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1.1" />
      ))}
      {/* edges root→internal */}
      {[86, 174, 262].map((x, i) => (
        <line key={i} x1={162} y1={80} x2={x} y2={108} stroke="var(--line2)" strokeWidth="1.1" />
      ))}
      {/* leaves */}
      {[20, 86, 152, 218, 270].map((x, i) => {
        const hot = i === 3;
        return (
          <rect
            key={i}
            x={x}
            y={160}
            width={50}
            height={22}
            rx="4"
            fill={hot ? 'var(--c-danger-soft)' : 'var(--bg)'}
            stroke={hot ? 'var(--c-danger)' : 'var(--line2)'}
            strokeWidth={hot ? 1.6 : 1}
          />
        );
      })}
      <text x={295} y={175} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--c-danger)">
        leaf
      </text>
      {/* edges internal→leaves (sketch) */}
      {[
        [86, 45],
        [86, 111],
        [174, 177],
        [262, 243],
        [262, 295],
      ].map(([x1, x2], i) => (
        <line key={i} x1={x1} y1={130} x2={x2} y2={160} stroke="var(--line)" strokeWidth="1" />
      ))}
      {/* random write arrow */}
      <path d="M 40 250 C 120 250, 180 220, 243 184" fill="none" stroke="var(--c-danger)" strokeWidth="1.8" strokeDasharray="5 3" markerEnd="url(#lvb-rand)" />
      <rect x={20} y={258} width={150} height={42} rx="6" fill="var(--s2)" stroke="var(--c-danger)" strokeWidth="1.1" />
      <text x={30} y={276} fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={700} fill="var(--c-danger)">
        random page write
      </text>
      <text x={30} y={291} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        + WAL · seek to one leaf
      </text>

      {/* divider */}
      <line x1={330} y1={14} x2={330} y2={306} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />

      {/* ── Right panel: LSM, buffer then sort ────────────────────────────── */}
      <text x={350} y={22} fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--c-storage)">
        LSM-tree — buffer, then sort
      </text>
      <text x={350} y={40} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        append now, flush &amp; merge later
      </text>

      {/* memtable in RAM */}
      <rect x={350} y={56} width={150} height={40} rx="7" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.4" />
      <text x={425} y={72} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight={700} fill="var(--accent-bright)">
        memtable
      </text>
      <text x={425} y={87} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        in RAM · sorted
      </text>
      {/* append arrow into memtable */}
      <line x1={520} y1={76} x2={504} y2={76} stroke="var(--c-commit)" strokeWidth="1.8" markerEnd="url(#lvb-seq)" />
      <text x={524} y={80} fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-commit)">
        append
      </text>

      {/* flush arrow down */}
      <line x1={425} y1={96} x2={425} y2={126} stroke="var(--c-commit)" strokeWidth="1.8" markerEnd="url(#lvb-seq)" />
      <text x={434} y={116} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--c-commit)">
        flush (sequential)
      </text>

      {/* SSTables stack */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={360 + i * 6}
          y={134 + i * 6}
          width={150}
          height={26}
          rx="5"
          fill="var(--c-storage-soft)"
          stroke="var(--c-storage)"
          strokeWidth="1.2"
        />
      ))}
      <text x={372 + 12} y={185} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--tx)">
        immutable SSTables
      </text>

      {/* compaction curved arrow */}
      <path d="M 520 168 C 560 180, 560 210, 470 214" fill="none" stroke="var(--c-analytics)" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#lvb-seq)" />
      <text x={486} y={150} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--c-analytics)">
        compaction
      </text>

      {/* sequential write callout */}
      <rect x={350} y={258} width={170} height={42} rx="6" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.1" />
      <text x={360} y={276} fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={700} fill="var(--c-commit)">
        sequential writes only
      </text>
      <text x={360} y={291} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        batched in memory, sorted on disk
      </text>
    </svg>
  );
}
