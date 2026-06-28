// Connection-pool figure (M34) — a pooler (PgBouncer) multiplexes thousands of short-lived client
// connections onto a small set of warm PostgreSQL backend processes. Each backend is a forked
// process (~5–10 MB), so Postgres must never see the storm; transaction mode returns a server
// connection after each transaction for maximum reuse. Static SVG, no hooks, English only.

export function ConnectionPool() {
  const W = 520, H = 290;
  // client dot grid (visual "many")
  const cols = 4, rowsN = 6, dotGapX = 17, dotGapY = 22, cx0 = 30, cy0 = 70;
  const dots = [];
  for (let r = 0; r < rowsN; r++)
    for (let c = 0; c < cols; c++)
      dots.push({ x: cx0 + c * dotGapX, y: cy0 + r * dotGapY });

  const poolX = 210, poolY = 70, poolW = 96, poolH = 150;
  const backends = [0, 1, 2, 3, 4];
  const beX = 392, beW = 104, beH = 22, beY0 = 78, beGap = 27;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 580 }}
      aria-label="A connection pooler multiplexes thousands of clients onto a small set of backend processes">
      <defs>
        <marker id="cp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--c-dist)" />
        </marker>
      </defs>

      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">A pooler turns a connection storm into a sized workload</text>

      {/* clients */}
      <text x={cx0 + 26} y={52} textAnchor="middle" fontSize="9.5" fontWeight="700"
        fill="var(--c-query)" fontFamily="var(--font-body)">~5,000 clients</text>
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="4.5" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1" />
          <line x1={d.x + 5} y1={d.y} x2={poolX} y2={poolY + poolH / 2} stroke="var(--line2)" strokeWidth="0.4" opacity="0.5" />
        </g>
      ))}

      {/* pooler */}
      <rect x={poolX} y={poolY} width={poolW} height={poolH} rx="10"
        fill="var(--s2)" stroke="var(--c-dist)" strokeWidth="1.6" />
      <text x={poolX + poolW / 2} y={poolY + 26} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--c-dist)" fontFamily="var(--font-body)">PgBouncer</text>
      <text x={poolX + poolW / 2} y={poolY + 41} textAnchor="middle" fontSize="7.5" fill="var(--tx3)"
        fontFamily="var(--font-mono)">transaction</text>
      <text x={poolX + poolW / 2} y={poolY + 51} textAnchor="middle" fontSize="7.5" fill="var(--tx3)"
        fontFamily="var(--font-mono)">mode</text>
      {/* the small warm pool slots */}
      {[0, 1, 2, 3].map((s) => (
        <rect key={s} x={poolX + 16 + (s % 2) * 34} y={poolY + 66 + Math.floor(s / 2) * 30}
          width={28} height={22} rx="4" fill="var(--c-dist-soft)" stroke="var(--c-dist)" strokeWidth="1" />
      ))}
      <text x={poolX + poolW / 2} y={poolY + poolH - 6} textAnchor="middle" fontSize="7.5"
        fill="var(--tx2)" fontFamily="var(--font-mono)">pool=20</text>

      {/* pooler → backends arrows */}
      {backends.map((b) => (
        <line key={b} x1={poolX + poolW} y1={poolY + poolH / 2} x2={beX - 4} y2={beY0 + b * beGap + beH / 2}
          stroke="var(--c-dist)" strokeWidth="1.2" markerEnd="url(#cp-arrow)" />
      ))}

      {/* Postgres backends */}
      <text x={beX + beW / 2} y={52} textAnchor="middle" fontSize="9.5" fontWeight="700"
        fill="var(--c-commit)" fontFamily="var(--font-body)">PostgreSQL</text>
      {backends.map((b) => (
        <g key={b}>
          <rect x={beX} y={beY0 + b * beGap} width={beW} height={beH} rx="4"
            fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1" />
          <text x={beX + beW / 2} y={beY0 + b * beGap + 14} textAnchor="middle" fontSize="7.5"
            fill="var(--tx)" fontFamily="var(--font-mono)">backend process</text>
        </g>
      ))}
      <text x={beX + beW / 2} y={beY0 + backends.length * beGap + 6} textAnchor="middle" fontSize="7.5"
        fill="var(--tx3)" fontFamily="var(--font-body)">each a process · ~5–10 MB</text>
    </svg>
  );
}
