/*
 * Static diagram (M12): the memory/latency hierarchy. Each step down is orders of magnitude
 * slower — the physical fact the whole database is designed around. Raw latencies are the
 * canonical "Latency Numbers Every Programmer Should Know" figures; the human-scaled column
 * uses a single consistent factor (×2e9, so an L1 hit = 1 second). Bar widths are log10(ns),
 * so equal visual steps = equal orders of magnitude. A divider separates the in-memory tiers
 * from the far, slow storage tiers. Labels stay English; the gloss lives in the caption/prose.
 */
type Row = {
  label: string;
  latency: string;
  human: string;
  barW: number; // px, ~ log10(latency in ns)
  accent: string;
};

const ROWS: Row[] = [
  { label: 'L1 cache', latency: '0.5 ns', human: '1 second', barW: 18, accent: 'var(--c-commit)' },
  { label: 'L2 cache', latency: '7 ns', human: '14 seconds', barW: 65, accent: 'var(--c-commit)' },
  { label: 'RAM (main memory)', latency: '100 ns', human: '~3 minutes', barW: 113, accent: 'var(--c-query)' },
  { label: 'SSD (4 kB random read)', latency: '150 µs', human: '~3–4 days', barW: 243, accent: 'var(--c-analytics)' },
  { label: 'Disk seek (HDD)', latency: '10 ms', human: '~8 months', barW: 318, accent: 'var(--c-danger)' },
];

const ROW_H = 40;
const TOP = 52;
const BAR_X = 150;
const LAT_X = 480;
const HUM_X = 556;

function HierRow({ row, i }: { row: Row; i: number }) {
  const y = TOP + i * ROW_H;
  const cy = y + 16;
  return (
    <g>
      <text x={16} y={cy + 4} fontFamily="var(--font-body)" fontSize="12" fontWeight={600} fill="var(--tx)">
        {row.label}
      </text>
      <rect x={BAR_X} y={y + 4} width={row.barW} height={24} rx="5" fill={row.accent} opacity={0.85} />
      <text x={LAT_X} y={cy + 4} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill={row.accent}>
        {row.latency}
      </text>
      <text x={HUM_X} y={cy + 4} fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx2)">
        ≈ {row.human}
      </text>
    </g>
  );
}

export function MemoryHierarchy() {
  // divider sits between RAM (i=2) and SSD (i=3)
  const dividerY = TOP + 3 * ROW_H - 4;
  return (
    <svg
      viewBox="0 0 680 268"
      width="100%"
      role="img"
      aria-label="The memory hierarchy as a latency ladder. L1 cache about 0.5 nanoseconds (scaled to one second); L2 cache about 7 nanoseconds (14 seconds); main memory about 100 nanoseconds (about 3 minutes); a random read from an SSD about 150 microseconds (about 3 to 4 days); and a single disk seek about 10 milliseconds (about 8 months). Each step down is orders of magnitude slower, and the database is designed to minimize trips to the slow storage tiers."
      style={{ maxWidth: 680 }}
    >
      <title>The latency hierarchy: each step down is orders of magnitude slower</title>

      {/* column headers */}
      <text x={16} y={28} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        tier
      </text>
      <text x={BAR_X} y={28} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        relative latency (log scale — each step ≈ one order of magnitude)
      </text>
      <text x={LAT_X} y={28} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        actual
      </text>
      <text x={HUM_X} y={28} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        if L1 = 1 s
      </text>

      {ROWS.map((row, i) => (
        <HierRow key={row.label} row={row} i={i} />
      ))}

      {/* memory ⟷ storage divider */}
      <line
        x1={12}
        y1={dividerY}
        x2={668}
        y2={dividerY}
        stroke="var(--line2)"
        strokeWidth="1.2"
        strokeDasharray="5 4"
      />
      <text x={16} y={dividerY - 6} fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-query)">
        ↑ in memory — nanoseconds
      </text>
      <text x={668} y={dividerY + 15} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-danger)">
        ↓ on storage — micro to milliseconds (far)
      </text>
    </svg>
  );
}
