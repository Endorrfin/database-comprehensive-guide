/*
 * Static diagram (M14): a regular index scan vs an index-only scan over a covering index.
 *   • Top lane  — Index Scan: the index leaf holds the key only, so the engine must fetch the
 *     row from the heap to read the other columns (two hops).
 *   • Bottom lane — Index-Only Scan: a covering index (INCLUDE) carries the payload columns in
 *     the leaf, so the query is answered from the index alone; the heap fetch is skipped when the
 *     visibility map marks the page all-visible (so keep VACUUM healthy).
 * Index = storage-violet, heap = query-blue, the index-only win = commit-green. Labels English.
 */
export function IndexOnlyScan() {
  return (
    <svg
      viewBox="0 0 640 300"
      width="100%"
      role="img"
      aria-label="Two index access paths. Top, a regular index scan: the index leaf holds only the key, so PostgreSQL must fetch the row from the heap to read the remaining columns — two hops. Bottom, an index-only scan over a covering index: the leaf carries the payload columns via INCLUDE, so the query is answered from the index alone and the heap fetch is skipped, provided the visibility map marks the page all-visible, which depends on VACUUM being current."
      style={{ maxWidth: 640 }}
    >
      <title>Index scan vs index-only scan (covering index)</title>

      <defs>
        <marker id="ios-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--tx2)" />
        </marker>
        <marker id="ios-arrow-g" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
      </defs>

      {/* ── Lane A: regular index scan ─────────────────────────── */}
      <text x={20} y={28} fontFamily="var(--font-body)" fontSize="12.5" fontWeight={700} fill="var(--tx)">
        Index Scan — key only → fetch the row from the heap
      </text>

      {/* index leaf (key only) */}
      <rect x={20} y={40} width={190} height={62} rx="8" fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.6" />
      <text x={32} y={60} fontFamily="var(--font-mono)" fontSize="11.5" fontWeight={700} fill="var(--c-storage)">
        index leaf
      </text>
      <text x={32} y={80} fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx)">
        customer_id → TID
      </text>
      <text x={32} y={95} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        key + row pointer only
      </text>

      {/* arrow to heap */}
      <line x1={214} y1={71} x2={304} y2={71} stroke="var(--tx2)" strokeWidth="1.6" markerEnd="url(#ios-arrow)" />
      <text x={259} y={62} textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--tx2)">
        heap fetch
      </text>

      {/* heap page */}
      <rect x={308} y={40} width={190} height={62} rx="8" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.6" />
      <text x={320} y={60} fontFamily="var(--font-mono)" fontSize="11.5" fontWeight={700} fill="var(--c-query)">
        heap page
      </text>
      <text x={320} y={80} fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx)">
        full row + visibility
      </text>
      <text x={320} y={95} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        the second hop
      </text>

      {/* result */}
      <text x={512} y={75} fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        2 hops
      </text>

      {/* divider */}
      <line x1={20} y1={132} x2={620} y2={132} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />

      {/* ── Lane B: index-only scan ────────────────────────────── */}
      <text x={20} y={164} fontFamily="var(--font-body)" fontSize="12.5" fontWeight={700} fill="var(--tx)">
        Index-Only Scan — covering index answers from the leaf
      </text>

      {/* covering index leaf (key + payload) */}
      <rect x={20} y={176} width={230} height={74} rx="8" fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.6" />
      <text x={32} y={196} fontFamily="var(--font-mono)" fontSize="11.5" fontWeight={700} fill="var(--c-storage)">
        covering index leaf
      </text>
      <text x={32} y={216} fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx)">
        customer_id INCLUDE (amount)
      </text>
      <text x={32} y={232} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx3)">
        key + payload in the leaf
      </text>

      {/* arrow straight to the answer */}
      <line x1={254} y1={213} x2={344} y2={213} stroke="var(--c-commit)" strokeWidth="1.8" markerEnd="url(#ios-arrow-g)" />

      {/* answer chip */}
      <rect x={348} y={188} width={150} height={50} rx="8" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.6" />
      <text x={423} y={210} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-commit)">
        answer ✓
      </text>
      <text x={423} y={226} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx2)">
        no heap fetch
      </text>

      {/* skipped heap (greyed) */}
      <rect x={512} y={188} width={108} height={50} rx="8" fill="none" stroke="var(--line2)" strokeWidth="1.4" strokeDasharray="5 4" />
      <text x={566} y={210} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--tx3)">
        heap
      </text>
      <text x={566} y={226} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        skipped
      </text>

      {/* visibility-map note */}
      <text x={20} y={272} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx3)">
        skips the heap only when the visibility map says the page is all-visible — so keep VACUUM healthy
      </text>
    </svg>
  );
}
