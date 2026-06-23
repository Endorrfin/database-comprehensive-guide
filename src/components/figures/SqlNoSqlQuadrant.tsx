/*
 * Static diagram (M3): the SQL ↔ NoSQL design space, and why the lines blur.
 * Y-axis ↑ = joins · ad-hoc queries · strong consistency (the relational strengths).
 * X-axis → = horizontal scale · flexible schema (the classic NoSQL strengths).
 * Distributed-SQL sits in the top-right "have both" corner — the convergence.
 */
type Dot = { x: number; y: number; label: string; sub: string; color: string };

const DOTS: Dot[] = [
  { x: 150, y: 96, label: 'Relational', sub: 'Postgres · MySQL', color: 'var(--e-postgres)' },
  { x: 108, y: 150, label: 'Graph', sub: 'Neo4j', color: 'var(--c-storage)' },
  { x: 360, y: 188, label: 'Document', sub: 'MongoDB', color: 'var(--e-mongodb-bright)' },
  { x: 476, y: 250, label: 'Wide-column', sub: 'Cassandra', color: 'var(--e-cassandra)' },
  { x: 500, y: 312, label: 'Key-value', sub: 'Redis', color: 'var(--e-redis)' },
  { x: 286, y: 300, label: 'Vector', sub: 'pgvector · Qdrant', color: 'var(--e-vector)' },
  { x: 470, y: 104, label: 'Distributed SQL', sub: 'CockroachDB · Spanner', color: 'var(--accent-bright)' },
];

export function SqlNoSqlQuadrant() {
  return (
    <svg
      viewBox="0 0 580 380"
      width="100%"
      role="img"
      aria-label="A design space. The vertical axis is joins, ad-hoc queries and strong consistency; the horizontal axis is horizontal scale and flexible schema. Relational sits top-left, key-value and wide-column bottom-right, and distributed SQL in the top-right corner that has both."
      style={{ maxWidth: 580 }}
    >
      <title>SQL ↔ NoSQL design space</title>

      {/* axes */}
      <line x1="64" y1="40" x2="64" y2="344" stroke="var(--line2)" strokeWidth="1.4" markerEnd="url(#q-ax)" />
      <line x1="64" y1="344" x2="556" y2="344" stroke="var(--line2)" strokeWidth="1.4" markerEnd="url(#q-ax)" />

      {/* axis labels */}
      <text
        x="14"
        y="200"
        fontFamily="var(--font-body)"
        fontSize="11.5"
        fill="var(--tx2)"
        transform="rotate(-90 14 200)"
        textAnchor="middle"
      >
        joins · ad-hoc queries · ACID ↑
      </text>
      <text x="310" y="366" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx2)">
        horizontal scale · flexible schema →
      </text>

      {/* convergence arrow toward the top-right corner */}
      <path
        d="M 196 96 C 300 70, 380 76, 444 100"
        fill="none"
        stroke="var(--c-commit)"
        strokeWidth="1.4"
        strokeDasharray="5 4"
        markerEnd="url(#q-conv)"
      />
      <text x="300" y="58" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--c-commit)">
        the lines blur →
      </text>

      {/* plotted engines */}
      {DOTS.map((d) => (
        <g key={d.label}>
          <circle cx={d.x} cy={d.y} r="7" fill={d.color} stroke="var(--bg)" strokeWidth="1.5" />
          <text x={d.x + 12} y={d.y - 1} fontFamily="var(--font-display)" fontSize="12.5" fill="var(--tx)">
            {d.label}
          </text>
          <text x={d.x + 12} y={d.y + 13} fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--tx3)">
            {d.sub}
          </text>
        </g>
      ))}

      <defs>
        <marker id="q-ax" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--line2)" />
        </marker>
        <marker id="q-conv" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
      </defs>
    </svg>
  );
}
