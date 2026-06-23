/*
 * Static diagram (M10): how a window function sees its rows.
 *   sum(amount) OVER (PARTITION BY region ORDER BY order_date)
 *   • PARTITION BY region  → two independent groups (West, East); the running total RESETS per group.
 *   • ORDER BY order_date  → rows are ordered within each group.
 *   • frame                → for the CURRENT row, the rows that feed its value (here: all preceding
 *                            rows in the partition through the current one → a running total).
 * Every input row is KEPT (unlike GROUP BY). The green box marks the frame for the current row;
 * West's running total climbs 100 → 150 → 230, then East restarts at 60.
 * Labels stay English; the bilingual gloss lives in the caption + module prose.
 */
type Row = {
  part: 'West' | 'East';
  day: string;
  amount: number;
  run: number;
  current?: boolean;
};

const ROWS: Row[] = [
  { part: 'West', day: 'Jan', amount: 100, run: 100 },
  { part: 'West', day: 'Feb', amount: 50, run: 150 },
  { part: 'West', day: 'Mar', amount: 80, run: 230, current: true },
  { part: 'East', day: 'Jan', amount: 60, run: 60 },
  { part: 'East', day: 'Feb', amount: 90, run: 150 },
];

const rowY = (i: number) => 80 + i * 50;
const H = 40;
const accentOf = (p: Row['part']) => (p === 'West' ? 'var(--c-query)' : 'var(--c-storage)');

function RowCard({ r, i }: { r: Row; i: number }) {
  const y = rowY(i);
  const accent = accentOf(r.part);
  return (
    <g>
      {/* row card */}
      <rect
        x={110}
        y={y}
        width={388}
        height={H}
        rx="8"
        fill="var(--surface)"
        stroke={r.current ? 'var(--accent-bright)' : 'var(--line2)'}
        strokeWidth={r.current ? 2 : 1}
      />
      <rect x={110} y={y} width={5} height={H} rx="2.5" fill={accent} />
      {/* day + amount */}
      <text x={132} y={y + H / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="13" fill="var(--tx)">
        {r.day}
      </text>
      <text x={312} y={y + H / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="13" fill="var(--tx2)">
        {r.amount}
      </text>
      {/* current-row pill */}
      {r.current && (
        <g>
          <rect x={398} y={y + 10} width={92} height={20} rx="10" fill="var(--accent-soft)" stroke="var(--accent-bright)" />
          <text x={444} y={y + 24} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight={700} fill="var(--accent-bright)">
            current row
          </text>
        </g>
      )}
      {/* running_total chip */}
      <rect x={512} y={y + 6} width={190} height={28} rx="7" fill="var(--c-commit-soft)" stroke="var(--c-commit)" />
      <text x={524} y={y + H / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill="var(--c-commit)">
        {`Σ = ${r.run}`}
      </text>
      {r.part === 'East' && r.run === 60 && (
        <text x={620} y={y + H / 2 + 4.5} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--c-analytics)">
          ↺ resets
        </text>
      )}
    </g>
  );
}

export function WindowFrame() {
  return (
    <svg
      viewBox="0 0 724 392"
      width="100%"
      role="img"
      aria-label="A window function over the query sum(amount) OVER (PARTITION BY region ORDER BY order_date). Rows are grouped into two independent partitions, West and East, and ordered by day within each. Every input row is kept, not collapsed. A green frame box surrounds the three West rows: it is the frame for the current row (West, Mar), meaning the running total for that row sums all preceding rows in its partition through itself — 100, then 150, then 230. The East partition starts a fresh running total at 60, showing the total resets at each partition boundary. The default frame when ORDER BY is present is RANGE unbounded preceding to current row, which includes tied peers."
      style={{ maxWidth: 724 }}
    >
      <title>How a window function sees its rows: partition, order, frame</title>

      {/* title + subtitle */}
      <text x={24} y={22} fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        sum(amount) OVER (PARTITION BY region ORDER BY order_date)
      </text>
      <text x={24} y={40} fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx2)">
        Every input row is kept; the frame feeds the current row; the running total resets each partition.
      </text>

      {/* column micro-headers */}
      <text x={132} y={62} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">order_date</text>
      <text x={312} y={62} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">amount</text>
      <text x={524} y={62} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">running_total</text>

      {/* frame box = the frame for the current row (West rows) */}
      <rect
        x={104}
        y={72}
        width={608}
        height={152}
        rx="10"
        fill="var(--c-commit-soft)"
        stroke="var(--c-commit)"
        strokeWidth="1.4"
        strokeDasharray="5 4"
      />
      <rect x={110} y={64} width={150} height={17} rx="8.5" fill="var(--c-commit)" />
      <text x={118} y={76} fontFamily="var(--font-body)" fontSize="10.5" fontWeight={700} fill="var(--bg)">
        frame → current row
      </text>

      {/* partition rails + names */}
      <rect x={92} y={80} width={6} height={140} rx="3" fill="var(--c-query)" />
      <rect x={92} y={230} width={6} height={90} rx="3" fill="var(--c-storage)" />
      <text x={30} y={146} fontFamily="var(--font-body)" fontSize="12" fontWeight={700} fill="var(--c-query)">West</text>
      <text x={30} y={163} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">region</text>
      <text x={32} y={271} fontFamily="var(--font-body)" fontSize="12" fontWeight={700} fill="var(--c-storage)">East</text>
      <text x={32} y={288} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">region</text>

      {ROWS.map((r, i) => (
        <RowCard key={`${r.part}-${r.day}`} r={r} i={i} />
      ))}

      {/* takeaway strip */}
      <rect x={24} y={336} width={676} height={48} rx="9" fill="var(--s2)" stroke="var(--line)" />
      <text x={42} y={357} fontFamily="var(--font-display)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        A window function computes over a frame and keeps every row
      </text>
      <text x={42} y={375} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx2)">
        PARTITION BY makes independent groups; with ORDER BY the default frame is RANGE … CURRENT ROW (tied peers included).
      </text>
    </svg>
  );
}
