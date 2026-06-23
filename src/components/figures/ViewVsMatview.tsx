/*
 * Static diagram (M11): the same query, two opposite trade-offs.
 *   • VIEW              → stores nothing; re-runs its SELECT against the base tables on every read,
 *                         so it is ALWAYS FRESH but pays the full query cost each time.
 *   • MATERIALIZED VIEW → stores the result on disk (a snapshot, indexable); reads are table-fast,
 *                         but the data is STALE until REFRESH — new base-table rows are not visible yet.
 * Labels stay English; the bilingual gloss lives in the caption + module prose.
 */
function Arrow({ x1, x2, y, dashed }: { x1: number; x2: number; y: number; dashed?: boolean }) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke="var(--tx3)"
      strokeWidth="1.5"
      strokeDasharray={dashed ? '5 4' : undefined}
      markerEnd="url(#vm-arrow)"
    />
  );
}

function Node({
  x,
  y,
  w,
  h,
  accent,
  soft,
  title,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
  soft: string;
  title: string;
  sub: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={soft} stroke={accent} strokeWidth="1.4" />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill={accent}>
        {title}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx2)">
        {sub}
      </text>
    </g>
  );
}

function BaseTables({ x, y, newRows }: { x: number; y: number; newRows?: boolean }) {
  const w = 120;
  const h = 52;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="var(--surface)" stroke="var(--line2)" />
      <line x1={x} y1={y + 17} x2={x + w} y2={y + 17} stroke="var(--line)" />
      <text x={x + w / 2} y={y + 13} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight={700} fill="var(--tx2)">
        base tables
      </text>
      <text x={x + w / 2} y={y + 34} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx3)">
        live data
      </text>
      {newRows && (
        <g>
          <rect x={x + w - 30} y={y - 12} width={56} height={18} rx="9" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" />
          <text x={x + w - 2} y={y + 1} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fontWeight={700} fill="var(--c-analytics)">
            + new
          </text>
        </g>
      )}
    </g>
  );
}

export function ViewVsMatview() {
  return (
    <svg
      viewBox="0 0 720 372"
      width="100%"
      role="img"
      aria-label="Two lanes contrasting a view and a materialized view. Top lane, VIEW: the base tables feed a view, which is a stored query holding no data; reading the view re-runs the query against the base tables every time, so the result is always fresh but pays the full query cost on each read. Bottom lane, MATERIALIZED VIEW: an occasional REFRESH copies the query result from the base tables into a stored snapshot on disk, which can be indexed; reads of the snapshot are table-fast, but the data is stale until the next REFRESH, so new base-table rows are not visible yet. The trade-off: a view is always current and recomputed; a materialized view is fast and cached."
      style={{ maxWidth: 720 }}
    >
      <title>View vs materialized view: always-fresh recompute vs fast stored snapshot</title>

      <defs>
        <marker id="vm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--tx3)" />
        </marker>
      </defs>

      {/* title + subtitle */}
      <text x={24} y={22} fontFamily="var(--font-display)" fontSize="14" fontWeight={700} fill="var(--accent-bright)">
        One query, two opposite trades
      </text>
      <text x={24} y={40} fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx2)">
        A view stores the question; a materialized view stores the answer.
      </text>

      {/* ── Lane A · VIEW ───────────────────────────────────────────── */}
      <rect x={24} y={56} width={64} height={18} rx="9" fill="var(--c-query-soft)" stroke="var(--c-query)" />
      <text x={56} y={69} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight={700} fill="var(--c-query)">
        VIEW
      </text>

      <BaseTables x={44} y={86} />
      <Arrow x1={166} x2={246} y={112} />
      <Node x={250} y={82} w={200} h={62} accent="var(--c-query)" soft="var(--c-query-soft)" title="view" sub="stored query · no data" />
      <Arrow x1={452} x2={534} y={112} />
      <g>
        <rect x={540} y={92} width={156} height={40} rx="9" fill="var(--c-commit-soft)" stroke="var(--c-commit)" />
        <text x={618} y={108} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--c-commit)">
          read → always fresh
        </text>
        <text x={618} y={123} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
          full query cost each time
        </text>
      </g>
      <text x={350} y={162} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        ↻ the query re-runs on every read
      </text>

      {/* divider */}
      <line x1={24} y1={184} x2={696} y2={184} stroke="var(--line)" strokeDasharray="2 4" />

      {/* ── Lane B · MATERIALIZED VIEW ──────────────────────────────── */}
      <rect x={24} y={196} width={150} height={18} rx="9" fill="var(--c-storage-soft)" stroke="var(--c-storage)" />
      <text x={99} y={209} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight={700} fill="var(--c-storage)">
        MATERIALIZED VIEW
      </text>

      <BaseTables x={44} y={232} newRows />
      <Arrow x1={166} x2={246} y={258} dashed />
      <text x={206} y={249} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight={700} fill="var(--tx2)">
        REFRESH
      </text>
      <Node x={250} y={228} w={200} h={62} accent="var(--c-storage)" soft="var(--c-storage-soft)" title="materialized view" sub="snapshot on disk · indexable" />
      <Arrow x1={452} x2={534} y={258} />
      <g>
        <rect x={540} y={238} width={156} height={40} rx="9" fill="var(--c-commit-soft)" stroke="var(--c-commit)" />
        <text x={618} y={254} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--c-commit)">
          read → table-fast
        </text>
        <text x={618} y={269} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fontWeight={700} fill="var(--c-analytics)">
          but stale until REFRESH
        </text>
      </g>
      <text x={350} y={308} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        frozen at the last REFRESH — the “+ new” rows are not visible yet
      </text>

      {/* takeaway strip */}
      <rect x={24} y={324} width={672} height={40} rx="9" fill="var(--s2)" stroke="var(--line)" />
      <text x={42} y={349} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        <tspan fontFamily="var(--font-display)" fontWeight={700} fill="var(--accent-bright)">Pick the trade: </tspan>
        a view is always fresh and recomputed; a materialized view is fast and cached — so you must refresh it.
      </text>
    </svg>
  );
}
