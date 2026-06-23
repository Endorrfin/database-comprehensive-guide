/*
 * Static diagram (M9): the FLOAT-for-money trap. The same arithmetic, two types:
 *   • double precision (binary IEEE-754) → 0.1 + 0.2 = 0.30000000000000004  (≠ 0.3)
 *   • numeric (exact decimal)            → 0.1 + 0.2 = 0.3                   (exact)
 * 0.30000000000000004 is the canonical, exact shortest-round-trip output PostgreSQL prints
 * for float8 0.1 + 0.2 — the indisputable demonstration that binary floats cannot represent
 * most decimal fractions. The takeaway strip: store money as numeric (or integer cents).
 * Labels stay English; the bilingual gloss lives in the caption + module prose.
 */
type Lane = {
  type: string;
  sub: string;
  expr: string;
  result: string;
  verdict: string;
  accent: string;
  ok: boolean;
};

const LANES: Lane[] = [
  {
    type: 'double precision',
    sub: 'binary IEEE-754 — inexact',
    expr: '0.1 + 0.2',
    result: '0.30000000000000004',
    verdict: '≠ 0.3',
    accent: 'var(--c-danger)',
    ok: false,
  },
  {
    type: 'numeric',
    sub: 'exact decimal',
    expr: '0.1 + 0.2',
    result: '0.3',
    verdict: 'exact',
    accent: 'var(--c-commit)',
    ok: true,
  },
];

function LaneRow({ lane, y }: { lane: Lane; y: number }) {
  const h = 58;
  return (
    <g>
      <rect x={24} y={y} width={600} height={h} rx="9" fill="var(--surface)" stroke="var(--line2)" />
      <rect x={24} y={y} width={6} height={h} rx="3" fill={lane.accent} />
      {/* type + subtitle */}
      <text x={42} y={y + 24} fontFamily="var(--font-mono)" fontSize="13.5" fontWeight={700} fill={lane.accent}>
        {lane.type}
      </text>
      <text x={42} y={y + 42} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx3)">
        {lane.sub}
      </text>
      {/* expression */}
      <text x={210} y={y + h / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="13" fill="var(--tx)">
        {lane.expr}
      </text>
      {/* arrow */}
      <line x1={300} y1={y + h / 2} x2={330} y2={y + h / 2} stroke="var(--tx3)" strokeWidth="1.4" markerEnd="url(#ft-arrow)" />
      {/* result chip */}
      <rect x={344} y={y + h / 2 - 16} width={210} height={32} rx="7" fill={lane.ok ? 'var(--c-commit-soft)' : 'var(--c-danger-soft)'} stroke={lane.accent} />
      <text x={354} y={y + h / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill={lane.accent}>
        {lane.result}
      </text>
      {/* verdict */}
      <text x={566} y={y + h / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill={lane.accent}>
        {lane.verdict}
      </text>
    </g>
  );
}

export function FloatTrap() {
  return (
    <svg
      viewBox="0 0 648 248"
      width="100%"
      role="img"
      aria-label="The same arithmetic in two PostgreSQL types. In double precision (binary IEEE-754, inexact), 0.1 + 0.2 evaluates to 0.30000000000000004, which is not equal to 0.3. In numeric (exact decimal), 0.1 + 0.2 evaluates to exactly 0.3. The lesson: store money and other exact quantities as numeric or as integer cents, never as a binary float."
      style={{ maxWidth: 648 }}
    >
      <title>The FLOAT-for-money trap: float8 is inexact, numeric is exact</title>

      <defs>
        <marker id="ft-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--tx3)" />
        </marker>
      </defs>

      <text x={24} y={22} fontFamily="var(--font-body)" fontSize="12" fill="var(--tx2)">
        The same sum, two types — only one of them can represent a tenth.
      </text>

      <LaneRow lane={LANES[0]} y={36} />
      <LaneRow lane={LANES[1]} y={104} />

      {/* takeaway strip */}
      <rect x={24} y={178} width={600} height={52} rx="9" fill="var(--s2)" stroke="var(--line)" />
      <text x={42} y={200} fontFamily="var(--font-display)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        Store money as numeric (or integer cents) — never float
      </text>
      <text x={42} y={219} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx2)">
        Those tail digits are invisible per row and very visible after a million rows of rounding.
      </text>
    </svg>
  );
}
