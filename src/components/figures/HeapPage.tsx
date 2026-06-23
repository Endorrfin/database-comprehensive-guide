/*
 * Static diagram (M12): the anatomy of an 8 kB heap page. A fixed header, then an array of line
 * pointers (ItemIds) growing forward from the top, while tuples (row versions) grow backward from
 * the bottom, with free space shrinking in the middle. A row is addressed by its TID = (page
 * number, line-pointer index); the indirection lets a tuple move within its page without rewriting
 * every index. Storage-violet theme (Section III). Labels stay English; gloss in caption/prose.
 */
export function HeapPage() {
  const px = 40; // page left
  const pw = 320; // page width
  const pr = px + pw; // page right

  return (
    <svg
      viewBox="0 0 620 312"
      width="100%"
      role="img"
      aria-label="An 8 kB heap page. At the top a fixed page header, then an array of line pointers (ItemIds) growing forward. The middle is free space. At the bottom, tuples — row versions — grow backward from the end. A line pointer points at its tuple, and a row is addressed by its TID, the pair of page number and line-pointer index, shown here as ctid (0,1). Because the index points at the line pointer rather than raw bytes, a tuple can move within its page without rewriting every index."
      style={{ maxWidth: 620 }}
    >
      <title>Heap page anatomy: header, line pointers, free space, tuples</title>

      {/* page outline */}
      <rect x={px} y={28} width={pw} height={260} rx="8" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.6" />

      {/* 8 kB brace label */}
      <text x={px - 8} y={20} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-storage)">
        8 kB page (the unit of I/O)
      </text>

      {/* page header */}
      <rect x={px + 8} y={36} width={pw - 16} height={28} rx="5" fill="var(--s2)" stroke="var(--line2)" />
      <text x={px + pw / 2} y={54} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11.5" fill="var(--tx2)">
        page header (24 B)
      </text>

      {/* line pointers row */}
      <text x={px + 8} y={84} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        line pointers (ItemId) grow →
      </text>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={px + 8 + i * 30}
          y={90}
          width={26}
          height={20}
          rx="3"
          fill="var(--c-storage-soft)"
          stroke="var(--c-storage)"
          strokeWidth="1.2"
        />
      ))}
      <text x={px + 8 + 13} y={104} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--accent-bright)">
        1
      </text>
      <text x={px + 8 + 43} y={104} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx2)">
        2
      </text>
      <text x={px + 8 + 73} y={104} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx2)">
        3
      </text>
      {[3, 4].map((i) => (
        <rect key={i} x={px + 8 + i * 30} y={90} width={26} height={20} rx="3" fill="none" stroke="var(--line2)" strokeDasharray="3 3" />
      ))}

      {/* free space */}
      <rect x={px + 8} y={122} width={pw - 16} height={86} rx="5" fill="none" stroke="var(--line)" strokeDasharray="4 4" />
      <text x={px + pw / 2} y={168} textAnchor="middle" fontFamily="var(--font-body)" fontSize="12.5" fill="var(--tx3)">
        free space
      </text>
      <text x={px + pw / 2} y={186} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        (shrinks as the page fills)
      </text>

      {/* tuples grow from the bottom */}
      <text x={px + 8} y={222} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        ← tuples (row versions) grow from the end
      </text>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={px + 8}
          y={228 + i * 18}
          width={pw - 16}
          height={15}
          rx="3"
          fill="var(--c-storage-soft)"
          stroke="var(--c-storage)"
          strokeWidth="1"
        />
      ))}
      <text x={px + 16} y={239} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--accent-bright)">
        tuple 1
      </text>
      <text x={px + 16} y={257} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx2)">
        tuple 2
      </text>
      <text x={px + 16} y={275} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx2)">
        tuple 3
      </text>

      {/* pointer arrow: line pointer 1 → tuple 1 */}
      <path
        d={`M ${px + 21} 110 C ${px + 21} 150, ${pr - 40} 150, ${pr - 40} 228`}
        fill="none"
        stroke="var(--accent-bright)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        markerEnd="url(#hp-arrow)"
      />

      <defs>
        <marker id="hp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-bright)" />
        </marker>
      </defs>

      {/* TID annotation */}
      <rect x={pr + 18} y={92} width={186} height={64} rx="7" fill="var(--s2)" stroke="var(--line2)" />
      <text x={pr + 28} y={114} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--accent-bright)">
        TID = (page, line ptr)
      </text>
      <text x={pr + 28} y={132} fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx)">
        ctid = (0, 1)
      </text>
      <text x={pr + 28} y={148} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        index points at the line ptr
      </text>
    </svg>
  );
}
