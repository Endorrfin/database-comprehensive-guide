// Bottleneck-loop figure (M34) — the optimization cycle: measure → find the bottleneck → fix one
// thing → verify against a baseline → repeat. The centre carries the two facts that make measuring
// productive: a database is usually I/O-bound, and the bottleneck is rarely where intuition points
// (rank by TOTAL time, not the slowest single call). Static SVG, no hooks, English only.

export function BottleneckLoop() {
  const W = 470, H = 320;
  const nodes = [
    { x: 235, y: 60,  c: 'var(--c-query)',     t: 'Measure',          s: 'pg_stat_statements · EXPLAIN' },
    { x: 380, y: 168, c: 'var(--c-analytics)', t: 'Find bottleneck',  s: 'costliest, not slowest' },
    { x: 235, y: 276, c: 'var(--c-storage)',   t: 'Fix one thing',    s: 'index · query · config' },
    { x: 90,  y: 168, c: 'var(--c-commit)',    t: 'Verify',           s: 're-measure vs baseline' },
  ];
  const nw = 138, nh = 50;

  // clockwise arcs between node centres (offset so they sit outside the boxes)
  const arcs = [
    'M 304 78  Q 372 96 372 142',   // measure → find
    'M 372 220 Q 340 264 304 268',  // find → fix
    'M 166 268 Q 130 264 98 220',   // fix → verify
    'M 98 142  Q 98 96 166 78',     // verify → measure
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 540 }}
      aria-label="The optimization loop: measure, find the bottleneck, fix one thing, verify, repeat">
      <defs>
        <marker id="bl-arrow" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="var(--c-dist)" />
        </marker>
      </defs>

      <text x={W / 2} y={18} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">Optimize by a loop, not by intuition</text>

      {arcs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--c-dist)" strokeWidth="1.6" markerEnd="url(#bl-arrow)" />
      ))}

      {/* centre note */}
      <text x={W / 2} y={H / 2 - 4} textAnchor="middle" fontSize="8.5" fontWeight="700"
        fill="var(--tx3)" fontFamily="var(--font-body)">the DB is usually</text>
      <text x={W / 2} y={H / 2 + 9} textAnchor="middle" fontSize="8.5" fontWeight="700"
        fill="var(--tx3)" fontFamily="var(--font-body)">I/O-bound</text>

      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x - nw / 2} y={n.y - nh / 2} width={nw} height={nh} rx="9"
            fill="var(--surface)" stroke={n.c} strokeWidth="1.6" />
          <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="11" fontWeight="700"
            fill={n.c} fontFamily="var(--font-body)">{n.t}</text>
          <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize="7.5" fill="var(--tx3)"
            fontFamily="var(--font-mono)">{n.s}</text>
        </g>
      ))}
    </svg>
  );
}
