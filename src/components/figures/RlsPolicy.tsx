// RLS-policy figure (M33) — one shared `orders` table holds every tenant's rows; a row-level
// security policy filters each session by the current tenant GUC, so two sessions querying the
// SAME table see disjoint rows. The database enforces the isolation — not a hopeful WHERE clause —
// and FORCE ROW LEVEL SECURITY makes even the owner obey. Static SVG, no hooks, English only.

export function RlsPolicy() {
  const W = 520, H = 308;
  // shared rows: id, tenant (1=blue, 2=amber)
  const rows = [
    { id: '#101', t: 1 },
    { id: '#102', t: 2 },
    { id: '#103', t: 1 },
    { id: '#104', t: 2 },
  ];
  const col = (t: number) => (t === 1 ? 'var(--c-query)' : 'var(--c-analytics)');
  const colSoft = (t: number) => (t === 1 ? 'var(--c-query-soft)' : 'var(--c-analytics-soft)');

  const rowH = 22, tblTop = 150;
  // a small table renderer
  const Table = (x: number, w: number, visible: (t: number) => boolean, title: string, titleCol: string) => (
    <g>
      <text x={x + w / 2} y={tblTop - 10} textAnchor="middle" fontSize="9.5" fontWeight="700"
        fill={titleCol} fontFamily="var(--font-body)">{title}</text>
      {rows.map((r, i) => {
        const y = tblTop + i * rowH;
        const vis = visible(r.t);
        return (
          <g key={i} opacity={vis ? 1 : 0.16}>
            <rect x={x} y={y} width={w} height={rowH - 3} rx="3"
              fill={vis ? colSoft(r.t) : 'var(--bg)'} stroke={vis ? col(r.t) : 'var(--line2)'} strokeWidth="1" />
            <text x={x + 8} y={y + 13} fontSize="8.5" fill="var(--tx)" fontFamily="var(--font-mono)">{r.id}</text>
            <text x={x + w - 8} y={y + 13} textAnchor="end" fontSize="7.5" fill={col(r.t)}
              fontFamily="var(--font-mono)">tenant {r.t}</text>
          </g>
        );
      })}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 580 }}
      aria-label="Row-level security: two tenant sessions query one shared table and see only their own rows">
      <defs>
        <marker id="rls-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--tx3)" />
        </marker>
      </defs>

      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">One table, two tenants, zero leakage</text>

      {/* the policy bar */}
      <rect x={70} y={30} width={W - 140} height={40} rx="6"
        fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.3" />
      <text x={W / 2} y={46} textAnchor="middle" fontSize="8.5" fontWeight="700"
        fill="var(--c-commit)" fontFamily="var(--font-body)">CREATE POLICY · FORCE ROW LEVEL SECURITY</text>
      <text x={W / 2} y={61} textAnchor="middle" fontSize="8" fill="var(--tx2)" fontFamily="var(--font-mono)">
        USING (tenant_id = current_setting('app.tenant_id'))
      </text>

      {/* session labels */}
      <text x={86} y={96} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--c-query)"
        fontFamily="var(--font-mono)">SET app.tenant_id = 1</text>
      <text x={W - 86} y={96} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--c-analytics)"
        fontFamily="var(--font-mono)">SET app.tenant_id = 2</text>

      {/* arrows: each session through the policy to its filtered view */}
      <line x1={86} y1={104} x2={86} y2={tblTop - 24} stroke="var(--tx3)" strokeWidth="1.2" markerEnd="url(#rls-arrow)" />
      <line x1={W - 86} y1={104} x2={W - 86} y2={tblTop - 24} stroke="var(--tx3)" strokeWidth="1.2" markerEnd="url(#rls-arrow)" />

      {/* left: tenant 1 view */}
      {Table(26, 120, (t) => t === 1, 'Session A sees', 'var(--c-query)')}
      {/* centre: the stored table (all rows) */}
      {Table(200, 120, () => true, 'orders (stored)', 'var(--tx2)')}
      {/* right: tenant 2 view */}
      {Table(374, 120, (t) => t === 2, 'Session B sees', 'var(--c-analytics)')}

      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="8" fill="var(--tx3)"
        fontFamily="var(--font-body)">The database filters every query — a forgotten WHERE clause cannot leak another tenant.</text>
    </svg>
  );
}
