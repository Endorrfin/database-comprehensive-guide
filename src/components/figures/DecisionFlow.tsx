// Decision-flow figure (M35) — the "default and deviate" rule as a flow. A new service classifies
// its workload; if one clear specialist signal dominates, take that specialist (usually alongside
// Postgres); otherwise the answer is the relational default, PostgreSQL. Static SVG, no hooks,
// English only (labels are technical terms). Engine brand colours come from the token palette.

export function DecisionFlow() {
  const W = 580, H = 340;

  // right-column specialist chips: signal → engine, coloured by family brand
  const chips = [
    { signal: 'Relationships are the data', engine: 'Neo4j', color: 'var(--c-storage)' },
    { signal: 'Cache · sessions · queues', engine: 'Redis / Valkey', color: 'var(--e-redis)' },
    { signal: 'Scans & aggregations', engine: 'ClickHouse', color: 'var(--e-clickhouse)' },
    { signal: 'Time-series metrics', engine: 'TimescaleDB', color: 'var(--c-analytics)' },
    { signal: 'Semantic / AI search', engine: 'pgvector', color: 'var(--e-vector)' },
  ];
  const chipX = 330, chipW = 238, chipH = 34, chipY0 = 50, chipGap = 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 620 }}
      aria-label="Default to a relational database (PostgreSQL); deviate to a specialist only on a clear workload signal">
      <defs>
        <marker id="df-arrow" markerWidth="9" markerHeight="9" refX="6.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="var(--tx3)" />
        </marker>
      </defs>

      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">Default to relational · deviate on a clear signal</text>

      {/* ── left spine: new service → decision → Postgres default ── */}
      {/* A: new service */}
      <rect x={60} y={40} width={170} height={34} rx="8" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1.2" />
      <text x={145} y={61} textAnchor="middle" fontSize="10.5" fontWeight="600"
        fill="var(--tx)" fontFamily="var(--font-body)">New service · classify the workload</text>

      {/* A → B */}
      <line x1={145} y1={74} x2={145} y2={96} stroke="var(--tx3)" strokeWidth="1.3" markerEnd="url(#df-arrow)" />

      {/* B: decision */}
      <rect x={52} y={98} width={186} height={46} rx="10" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x={145} y={120} textAnchor="middle" fontSize="10.5" fontWeight="700"
        fill="var(--accent-bright)" fontFamily="var(--font-body)">One clear specialist</text>
      <text x={145} y={134} textAnchor="middle" fontSize="10.5" fontWeight="700"
        fill="var(--accent-bright)" fontFamily="var(--font-body)">signal?</text>

      {/* B → C (no) */}
      <line x1={145} y1={144} x2={145} y2={214} stroke="var(--tx3)" strokeWidth="1.3" markerEnd="url(#df-arrow)" />
      <text x={154} y={172} fontSize="9" fontWeight="700" fill="var(--c-commit)" fontFamily="var(--font-mono)">no</text>

      {/* C: Postgres default */}
      <rect x={48} y={216} width={194} height={86} rx="10" fill="var(--c-commit-soft)" stroke="var(--e-postgres)" strokeWidth="1.8" />
      <text x={145} y={240} textAnchor="middle" fontSize="13" fontWeight="800"
        fill="var(--tx)" fontFamily="var(--font-body)">PostgreSQL</text>
      <text x={145} y={256} textAnchor="middle" fontSize="9" fill="var(--tx2)" fontFamily="var(--font-body)">the default</text>
      <text x={145} y={276} textAnchor="middle" fontSize="8" fill="var(--tx3)" fontFamily="var(--font-mono)">ACID · joins · JSONB</text>
      <text x={145} y={288} textAnchor="middle" fontSize="8" fill="var(--tx3)" fontFamily="var(--font-mono)">FTS · vector · time-series</text>

      {/* B → chips (yes) */}
      <line x1={238} y1={116} x2={326} y2={116} stroke="var(--tx3)" strokeWidth="1.3" markerEnd="url(#df-arrow)" />
      <text x={250} y={108} fontSize="9" fontWeight="700" fill="var(--c-analytics)" fontFamily="var(--font-mono)">yes</text>

      {/* right column header */}
      <text x={chipX + chipW / 2} y={40} textAnchor="middle" fontSize="9.5" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">take the specialist (often alongside Postgres)</text>

      {/* specialist chips */}
      {chips.map((c, i) => {
        const y = chipY0 + i * (chipH + chipGap);
        return (
          <g key={c.engine}>
            <rect x={chipX} y={y} width={chipW} height={chipH} rx="7"
              fill="var(--bg)" stroke="var(--line2)" strokeWidth="1" />
            <rect x={chipX} y={y} width={4} height={chipH} rx="2" fill={c.color} />
            <text x={chipX + 14} y={y + 15} fontSize="9.5" fill="var(--tx2)" fontFamily="var(--font-body)">{c.signal}</text>
            <text x={chipX + 14} y={y + 28} fontSize="10" fontWeight="700" fill={c.color} fontFamily="var(--font-mono)">→ {c.engine}</text>
          </g>
        );
      })}

      {/* footer */}
      <text x={W / 2} y={326} textAnchor="middle" fontSize="9" fill="var(--tx3)" fontFamily="var(--font-body)">
        No clear signal? Default to PostgreSQL — add a specialist only for the one thing it does poorly.
      </text>
    </svg>
  );
}
