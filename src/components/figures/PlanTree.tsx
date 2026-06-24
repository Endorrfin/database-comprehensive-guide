/*
 * Static diagram (M16): how to read an EXPLAIN plan tree. A plan is a tree of nodes; the leaves
 * (scans) run first and rows flow UP to the root. Each node carries the planner's ESTIMATES —
 * cost (startup..total, in seq_page_cost units), rows, width. EXPLAIN ANALYZE additionally runs
 * the query and prints the ACTUAL rows and loops next to the estimates; the lowest node where
 * estimated and actual diverge by a large factor is the misestimate to hunt. Here the root
 * estimated 600000 rows but only 80 were real — the classic over/under-estimate signal.
 * Query-blue plan nodes; the misestimate annotation in danger-red. Labels stay English.
 */
export function PlanTree() {
  return (
    <svg
      viewBox="0 0 660 350"
      width="100%"
      role="img"
      aria-label="An EXPLAIN plan tree. The root node, a Hash Join, is annotated with cost equals 0.00 to 28500, rows equals 600000, width equals 64 — these are the planner's estimates, cost measured in sequential-page-fetch units and rows estimated from statistics. Below it are two child nodes that run first: a Seq Scan on orders with Filter status equals open, and a Hash built over a Seq Scan on customers. Rows flow upward from the leaves to the root. A red annotation shows that EXPLAIN ANALYZE also prints the actual rows — here 80 — next to the estimate of 600000; that large gap between estimated and actual rows is the misestimate to hunt down."
      style={{ maxWidth: 660 }}
    >
      <title>Reading an EXPLAIN plan tree: estimates, actuals, and the misestimate to hunt</title>

      <defs>
        <marker id="pt-up" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-query)" />
        </marker>
      </defs>

      {/* root: Hash Join */}
      <rect x={196} y={34} width={268} height={52} rx="8" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.5" />
      <text x={210} y={56} fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        Hash Join
      </text>
      <text x={210} y={74} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--tx2)">
        (cost=0.00..28500 rows=600000 width=64)
      </text>

      {/* estimate annotation bracket */}
      <text x={478} y={50} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        cost = startup..total
      </text>
      <text x={478} y={64} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        (seq_page_cost units)
      </text>
      <text x={478} y={80} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        rows = estimate from stats
      </text>

      {/* misestimate callout */}
      <rect x={196} y={100} width={268} height={30} rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.2" />
      <text x={210} y={119} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--c-danger)">
        ANALYZE → (actual rows=80 loops=1)
      </text>
      <text x={150} y={150} fontFamily="var(--font-body)" fontSize="10" fontWeight={700} fill="var(--c-danger)">
        estimate 600000 vs actual 80 — the misestimate to hunt
      </text>

      {/* connectors root → children (rows flow UP) */}
      <line x1={250} y1={196} x2={250} y2={86} stroke="var(--c-query)" strokeWidth="1.6" markerEnd="url(#pt-up)" />
      <line x1={250} y1={196} x2={250} y2={170} stroke="var(--c-query)" strokeWidth="1.6" />
      <line x1={250} y1={170} x2={410} y2={170} stroke="var(--c-query)" strokeWidth="1.6" />
      <line x1={410} y1={196} x2={410} y2={170} stroke="var(--c-query)" strokeWidth="1.6" />

      {/* child A: Seq Scan on orders */}
      <rect x={40} y={196} width={250} height={56} rx="8" fill="var(--surface)" stroke="var(--c-analytics)" strokeWidth="1.4" />
      <text x={54} y={218} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-analytics)">
        Seq Scan on orders
      </text>
      <text x={54} y={235} fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx2)">
        Filter: status = 'open'
      </text>
      <text x={54} y={248} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx3)">
        (rows=600000) (actual rows=80)
      </text>

      {/* child B: Hash → Seq Scan on customers */}
      <rect x={330} y={196} width={290} height={56} rx="8" fill="var(--surface)" stroke="var(--c-dist)" strokeWidth="1.4" />
      <text x={344} y={218} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-dist)">
        Hash
      </text>
      <text x={344} y={235} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--tx2)">
        └─ Seq Scan on customers
      </text>
      <text x={344} y={248} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx3)">
        build the hash table, then probe
      </text>

      {/* flow legend */}
      <rect x={40} y={282} width={580} height={48} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={54} y={303} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        <tspan fill="var(--accent-bright)" fontWeight={700}>Read it bottom-up: </tspan>
        the leaf scans run first; rows flow UP the arrows to the root. Plain EXPLAIN shows only the
      </text>
      <text x={54} y={320} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        estimates; EXPLAIN ANALYZE runs the query and prints actual rows + time beside them.
      </text>
    </svg>
  );
}
