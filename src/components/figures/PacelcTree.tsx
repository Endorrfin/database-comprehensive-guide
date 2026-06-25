// CHANGED (S12): M23 — PACELC decision tree figure
export function PacelcTree() {
  return (
    <svg
      viewBox="0 0 680 340"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 680, display: 'block', margin: '0 auto' }}
      aria-label="PACELC decision tree: If Partition then choose A or C; Else choose L or C"
      role="img"
    >
      <defs>
        <marker id="pt-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--tx2)" />
        </marker>
      </defs>

      {/* ── Root: Partition? ─────────────────────────────────────────────── */}
      <rect x="250" y="20" width="180" height="48" rx="10"
        fill="var(--s2)" stroke="var(--accent)" strokeWidth="2" />
      <text x="340" y="40" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif" fill="var(--tx)">If Partition?</text>
      <text x="340" y="58" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--accent)">(P)</text>

      {/* ── Branch: YES (left) ───────────────────────────────────────────── */}
      <line x1="290" y1="68" x2="145" y2="130" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="192" y="107" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--c-warn)">YES</text>

      {/* ── Branch: NO (right) ───────────────────────────────────────────── */}
      <line x1="390" y1="68" x2="535" y2="130" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="488" y="107" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--c-commit)">NO (Else)</text>

      {/* ── CAP choice node ──────────────────────────────────────────────── */}
      <rect x="55" y="130" width="180" height="48" rx="10"
        fill="var(--s2)" stroke="var(--c-warn)" strokeWidth="1.5" />
      <text x="145" y="150" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif" fill="var(--tx)">Choose: A or C</text>
      <text x="145" y="168" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--c-warn)">CAP trade-off</text>

      {/* ── PACELC choice node ───────────────────────────────────────────── */}
      <rect x="445" y="130" width="180" height="48" rx="10"
        fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.5" />
      <text x="535" y="150" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif" fill="var(--tx)">Choose: L or C</text>
      <text x="535" y="168" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--c-commit)">PACELC trade-off</text>

      {/* ── Availability branch (left-left) ──────────────────────────────── */}
      <line x1="105" y1="178" x2="60" y2="240" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="68" y="218" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">A</text>

      {/* ── Consistency branch (left-right) ──────────────────────────────── */}
      <line x1="185" y1="178" x2="230" y2="240" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="218" y="218" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">C</text>

      {/* ── Latency branch (right-left) ──────────────────────────────────── */}
      <line x1="485" y1="178" x2="440" y2="240" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="452" y="218" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">L</text>

      {/* ── Consistency branch (right-right) ─────────────────────────────── */}
      <line x1="585" y1="178" x2="620" y2="240" stroke="var(--tx2)" strokeWidth="1.5" markerEnd="url(#pt-arr)" />
      <text x="617" y="218" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">C</text>

      {/* ── Leaf: PA ─────────────────────────────────────────────────────── */}
      <rect x="12" y="240" width="96" height="64" rx="8" fill="var(--s2)" stroke="var(--c-index)" strokeWidth="1.5" />
      <text x="60" y="262" textAnchor="middle" fontSize="12" fontFamily="Inter,sans-serif" fill="var(--c-index)" fontWeight="600">PA</text>
      <text x="60" y="278" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Partition →</text>
      <text x="60" y="292" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Availability</text>
      <text x="60" y="296" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono,monospace" fill="var(--tx3)"> </text>

      {/* ── Leaf: PC ─────────────────────────────────────────────────────── */}
      <rect x="182" y="240" width="96" height="64" rx="8" fill="var(--s2)" stroke="var(--c-warn)" strokeWidth="1.5" />
      <text x="230" y="262" textAnchor="middle" fontSize="12" fontFamily="Inter,sans-serif" fill="var(--c-warn)" fontWeight="600">PC</text>
      <text x="230" y="278" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Partition →</text>
      <text x="230" y="292" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Consistency</text>

      {/* ── Leaf: EL ─────────────────────────────────────────────────────── */}
      <rect x="392" y="240" width="96" height="64" rx="8" fill="var(--s2)" stroke="var(--c-index)" strokeWidth="1.5" />
      <text x="440" y="262" textAnchor="middle" fontSize="12" fontFamily="Inter,sans-serif" fill="var(--c-index)" fontWeight="600">EL</text>
      <text x="440" y="278" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Else →</text>
      <text x="440" y="292" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Latency</text>

      {/* ── Leaf: EC ─────────────────────────────────────────────────────── */}
      <rect x="572" y="240" width="96" height="64" rx="8" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.5" />
      <text x="620" y="262" textAnchor="middle" fontSize="12" fontFamily="Inter,sans-serif" fill="var(--c-commit)" fontWeight="600">EC</text>
      <text x="620" y="278" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Else →</text>
      <text x="620" y="292" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx2)">Consistency</text>

      {/* ── Combined labels below leaves ─────────────────────────────────── */}
      {/* PA/EL */}
      <text x="60" y="322" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">Cassandra</text>
      <text x="230" y="322" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">ZooKeeper</text>
      <text x="440" y="322" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">async PG</text>
      <text x="620" y="322" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">sync PG</text>

      {/* ── Center combiners (PA/EL & PC/EC) ─────────────────────────────── */}
      <text x="145" y="333" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">e.g. PA/EL</text>
      <text x="535" y="333" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif" fill="var(--tx3)">e.g. PC/EC</text>
    </svg>
  );
}
