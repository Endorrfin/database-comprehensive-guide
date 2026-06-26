// Distributed SQL architecture figure (M30) — contrasts the shared-nothing designs of
// CockroachDB (range-based Raft), TiDB (HTAP: TiKV row + TiFlash columnar), and
// Aurora DSQL (serverless active-active, log-structured storage).
// Static SVG, no hooks, no useLang — figures always render in English.

export function DistributedSqlArch() {
  const W = 460, H = 200;

  // Column x positions
  const COL = [46, 190, 334];
  const CW = 122; // column content width

  const ENGINES = [
    {
      name: 'CockroachDB',
      color: 'var(--accent)',
      rows: ['Postgres wire', 'Range-based Raft', 'Peer-to-peer nodes', 'CalVer (v26.x)'],
    },
    {
      name: 'TiDB (HTAP)',
      color: 'var(--c-storage)',
      rows: ['MySQL wire (Postgres compat.)', 'TiKV (row) + TiFlash (col)', 'Raft Learner replication', 'OLTP + OLAP in one cluster'],
    },
    {
      name: 'Aurora DSQL',
      color: 'var(--c-commit)',
      rows: ['Postgres 16 wire', 'Active-active multi-region', 'Serverless, log-structured', 'GA May 2025'],
    },
  ];

  const ROW_H = 18;
  const HEADER_H = 30;
  const TOP = 28;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 520 }}
      aria-label="Distributed SQL architectures: CockroachDB, TiDB, Aurora DSQL"
    >
      {/* Title row */}
      <text x={W / 2} y={16} textAnchor="middle" fontSize="10.5" fontWeight="600"
        fill="var(--tx2)" fontFamily="var(--font-ui)">
        Distributed SQL / NewSQL — architecture comparison
      </text>

      {/* Shared banner: "Postgres wire protocol is the de-facto API" */}
      <rect x={16} y={H - 26} width={W - 32} height={18} rx="3"
        fill="var(--accent)" opacity="0.08" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="4 3" />
      <text x={W / 2} y={H - 13} textAnchor="middle" fontSize="9" fill="var(--accent)"
        fontFamily="var(--font-ui)" fontStyle="italic">
        "Postgres won the API" — all expose the Postgres wire protocol
      </text>

      {/* Engine columns */}
      {ENGINES.map((e, ci) => {
        const cx = COL[ci];
        const boxH = HEADER_H + ENGINES[0].rows.length * ROW_H + 8;
        return (
          <g key={ci}>
            {/* Box */}
            <rect x={cx} y={TOP} width={CW} height={boxH} rx="5"
              fill={e.color} opacity="0.07"
              stroke={e.color} strokeWidth="1.2" />
            {/* Header */}
            <rect x={cx} y={TOP} width={CW} height={HEADER_H} rx="5"
              fill={e.color} opacity="0.18" />
            <rect x={cx} y={TOP + HEADER_H - 6} width={CW} height={6} fill={e.color} opacity="0.18" />
            <text x={cx + CW / 2} y={TOP + HEADER_H / 2 + 5}
              textAnchor="middle" fontSize="11" fontWeight="700"
              fill={e.color} fontFamily="var(--font-ui)">
              {e.name}
            </text>
            {/* Row items */}
            {e.rows.map((row, ri) => (
              <text key={ri}
                x={cx + 8}
                y={TOP + HEADER_H + 4 + ri * ROW_H + ROW_H - 4}
                fontSize="8.5" fill="var(--tx2)" fontFamily="var(--font-ui)">
                · {row}
              </text>
            ))}
          </g>
        );
      })}

      {/* Connector arrows between columns (show shared-nothing) */}
      {[0, 1].map(i => {
        const x1 = COL[i] + CW + 2;
        const x2 = COL[i + 1] - 2;
        const y = TOP + HEADER_H / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y}
              stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 2" />
          </g>
        );
      })}
    </svg>
  );
}
