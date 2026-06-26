// Shared-responsibility figure (M32) — who owns each layer of the stack, self-hosted vs a
// managed database service. Self-hosting, you own every layer; on a managed DB the provider
// takes the bottom of the stack — but schema, indexes, and queries stay yours. The line moves
// up; it never reaches the top.
// Static SVG, no hooks, no useLang — figures always render in English.

export function SharedResponsibility() {
  const W = 488, H = 286;
  const layers = [
    'Your data',
    'Schema, indexes & queries',
    'Config & tuning',
    'Backups & HA / failover',
    'DB engine & patching',
    'Operating system',
    'Hardware / data centre',
  ];
  const youCountManaged = 3; // top 3 layers stay with you on a managed DB
  const lh = 27, top = 54;
  const ax = 28, bx = 258, colW = 202;

  const youFill = 'var(--c-query-soft)', youStroke = 'var(--c-query)';
  const provFill = 'var(--c-dist-soft)', provStroke = 'var(--c-dist)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 560 }}
      aria-label="Shared responsibility: self-hosted versus managed database">
      <text x={W / 2} y={16} textAnchor="middle" fontSize="10.5" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-ui)">Who owns each layer?</text>

      {/* column headers */}
      <text x={ax + colW / 2} y={42} textAnchor="middle" fontSize="10" fontWeight="700"
        fill="var(--c-query)" fontFamily="var(--font-ui)">Self-hosted</text>
      <text x={bx + colW / 2} y={42} textAnchor="middle" fontSize="10" fontWeight="700"
        fill="var(--tx)" fontFamily="var(--font-ui)">Managed DBaaS</text>

      {layers.map((name, i) => {
        const y = top + i * lh;
        const managedProvider = i >= youCountManaged;
        return (
          <g key={i}>
            {/* self-hosted: always You */}
            <rect x={ax} y={y} width={colW} height={lh - 4} rx="3"
              fill={youFill} stroke={youStroke} strokeWidth="1" />
            <text x={ax + colW / 2} y={y + lh / 2 + 1} textAnchor="middle" fontSize="8.5"
              fill="var(--tx)" fontFamily="var(--font-ui)">{name}</text>

            {/* managed: provider owns the bottom, you keep the top */}
            <rect x={bx} y={y} width={colW} height={lh - 4} rx="3"
              fill={managedProvider ? provFill : youFill}
              stroke={managedProvider ? provStroke : youStroke} strokeWidth="1" />
            <text x={bx + colW / 2} y={y + lh / 2 + 1} textAnchor="middle" fontSize="8.5"
              fill="var(--tx)" fontFamily="var(--font-ui)">{name}</text>
            <text x={bx + colW - 6} y={y + lh / 2 + 1} textAnchor="end" fontSize="6.5" fontWeight="700"
              fill={managedProvider ? provStroke : youStroke} fontFamily="var(--font-ui)">
              {managedProvider ? 'provider' : 'you'}
            </text>
          </g>
        );
      })}

      {/* the responsibility line on the managed column */}
      <line x1={bx - 6} y1={top + youCountManaged * lh - 2} x2={bx + colW + 6} y2={top + youCountManaged * lh - 2}
        stroke="var(--c-analytics)" strokeWidth="1.6" strokeDasharray="5 3" />
      <text x={bx + colW + 6} y={top + youCountManaged * lh - 6} textAnchor="end" fontSize="7.5"
        fill="var(--c-analytics)" fontFamily="var(--font-ui)">the line moves up ↑</text>

      {/* legend */}
      <rect x={ax} y={H - 22} width={11} height={11} rx="2" fill={youFill} stroke={youStroke} strokeWidth="1" />
      <text x={ax + 16} y={H - 13} fontSize="8" fill="var(--tx2)" fontFamily="var(--font-ui)">You</text>
      <rect x={ax + 56} y={H - 22} width={11} height={11} rx="2" fill={provFill} stroke={provStroke} strokeWidth="1" />
      <text x={ax + 72} y={H - 13} fontSize="8" fill="var(--tx2)" fontFamily="var(--font-ui)">Cloud provider</text>
    </svg>
  );
}
