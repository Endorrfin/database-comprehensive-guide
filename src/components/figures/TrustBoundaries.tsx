// Trust-boundaries figure (M33) — defense in depth as concentric boundaries. Hostile input from
// the outside must cross TLS (in transit), authentication, then authorization / RLS / least
// privilege before it reaches the data at the centre (encrypted at rest). Each ring is a control
// you place deliberately; least privilege at the core caps the blast radius of anything that slips
// through. Static SVG, no hooks, no useLang — figures always render in English.

export function TrustBoundaries() {
  const W = 500, H = 300;
  // concentric rings: [label, sublabel, stroke, fill, inset]
  const rings: { label: string; sub: string; stroke: string; fill: string; inset: number }[] = [
    { label: 'Untrusted input — treat as hostile', sub: '', stroke: 'var(--c-danger)', fill: 'var(--c-danger-soft)', inset: 0 },
    { label: 'TLS — in transit', sub: 'sslmode=verify-full', stroke: 'var(--c-dist)', fill: 'var(--bg)', inset: 30 },
    { label: 'Authentication', sub: 'scram-sha-256', stroke: 'var(--c-storage)', fill: 'var(--surface)', inset: 60 },
    { label: 'Authorization · RLS · least privilege', sub: '', stroke: 'var(--c-query)', fill: 'var(--s2)', inset: 90 },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 560 }}
      aria-label="Trust boundaries: hostile input must cross TLS, authentication, and authorization before reaching the data">
      <defs>
        <marker id="tb-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--c-danger)" />
        </marker>
      </defs>

      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">Defense in depth: every boundary is a control</text>

      {rings.map((r, i) => {
        const x = 16 + r.inset, y = 30 + r.inset;
        const w = W - 2 * (16 + r.inset), h = H - 30 - (30) - 2 * r.inset;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="10"
              fill={r.fill} stroke={r.stroke} strokeWidth="1.5" />
            <text x={x + 10} y={y + 15} fontSize="9.5" fontWeight="700"
              fill={r.stroke} fontFamily="var(--font-body)">{r.label}</text>
            {r.sub && (
              <text x={x + 10} y={y + 27} fontSize="8" fill="var(--tx3)"
                fontFamily="var(--font-mono)">{r.sub}</text>
            )}
          </g>
        );
      })}

      {/* the data core */}
      <rect x={16 + 120} y={30 + 116} width={W - 2 * (16 + 120)} height={H - 60 - 2 * 116} rx="8"
        fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.5" />
      <text x={W / 2} y={H / 2 - 2} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--c-commit)" fontFamily="var(--font-body)">Your data</text>
      <text x={W / 2} y={H / 2 + 12} textAnchor="middle" fontSize="8" fill="var(--tx3)"
        fontFamily="var(--font-mono)">encrypted at rest</text>

      {/* hostile input arrow probing in from the corner */}
      <line x1={26} y1={H - 18} x2={150} y2={H / 2 + 30} stroke="var(--c-danger)" strokeWidth="1.6"
        strokeDasharray="4 3" markerEnd="url(#tb-arrow)" />
      <text x={24} y={H - 22} fontSize="8" fill="var(--c-danger)" fontFamily="var(--font-body)">attack →</text>
    </svg>
  );
}
