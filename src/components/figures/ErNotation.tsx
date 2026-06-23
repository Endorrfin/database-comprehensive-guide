/*
 * Static diagram (M6): the ER-notation legend in one picture.
 * Top row = Chen's building blocks (entity rectangle, attribute oval, key attribute
 * underlined, relationship diamond). Bottom row = the four crow's-foot cardinality
 * endings, read at the entity the symbol touches (Everest 1976 / Barker). Labels stay
 * English (technical terms); the figure caption carries the bilingual gloss.
 */

/** A crow's-foot ending drawn on a short stub that runs into a small entity block at the right. */
function Ending({ x, y, kind, label }: { x: number; y: number; kind: 'one-one' | 'zero-one' | 'one-many' | 'zero-many'; label: string }) {
  const lineEnd = x + 58; // where the connector meets the entity edge
  const boxX = lineEnd + 2;
  const many = kind === 'one-many' || kind === 'zero-many';
  const optional = kind === 'zero-one' || kind === 'zero-many';
  // The "many" crow's foot fans from a point on the line into the entity edge.
  const footTipX = lineEnd - 16;
  return (
    <g>
      {/* connector */}
      <line x1={x} y1={y} x2={lineEnd} y2={y} stroke="var(--line2)" strokeWidth="1.6" />
      {/* tiny entity the symbol "touches" */}
      <rect x={boxX} y={y - 13} width={26} height={26} rx="4" fill="var(--s2)" stroke="var(--line2)" />

      {/* mandatory-one bar (present unless the inner marker is the crow's foot's own bar) */}
      {!many && (
        <line x1={footTipX + 6} y1={y - 8} x2={footTipX + 6} y2={y + 8} stroke="var(--accent-bright)" strokeWidth="1.8" />
      )}
      {/* the second bar for "one and only one" */}
      {kind === 'one-one' && (
        <line x1={footTipX - 2} y1={y - 8} x2={footTipX - 2} y2={y + 8} stroke="var(--accent-bright)" strokeWidth="1.8" />
      )}
      {/* crow's foot for "many" */}
      {many && (
        <g stroke="var(--accent-bright)" strokeWidth="1.8" fill="none">
          <line x1={footTipX} y1={y} x2={lineEnd} y2={y - 9} />
          <line x1={footTipX} y1={y} x2={lineEnd} y2={y} />
          <line x1={footTipX} y1={y} x2={lineEnd} y2={y + 9} />
        </g>
      )}
      {/* optionality circle */}
      {optional && <circle cx={x + 12} cy={y} r="6" fill="var(--surface)" stroke="var(--accent-bright)" strokeWidth="1.6" />}

      <text x={x + 2} y={y + 32} fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx2)">
        {label}
      </text>
    </g>
  );
}

export function ErNotation() {
  return (
    <svg
      viewBox="0 0 660 250"
      width="100%"
      role="img"
      aria-label="ER notation legend. Top: an entity is a rectangle, an attribute is an oval, a key attribute is an underlined oval, and a relationship is a diamond. Bottom: the four crow's-foot cardinality endings — one and only one, zero or one, one or many, zero or many — read at the entity the symbol touches."
      style={{ maxWidth: 660 }}
    >
      <title>ER notation — Chen building blocks and crow's-foot cardinality</title>

      {/* ── Row A · Chen building blocks ─────────────────────────────────── */}
      <text x="24" y="28" fontFamily="var(--font-body)" fontSize="12" fontWeight={600} fill="var(--accent)">
        Building blocks
      </text>

      {/* entity */}
      <rect x="24" y="44" width="116" height="46" rx="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
      <text x="82" y="72" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--tx)">
        Student
      </text>
      <text x="82" y="106" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        entity — a thing
      </text>

      {/* attribute */}
      <ellipse cx="232" cy="67" rx="54" ry="23" fill="var(--s2)" stroke="var(--line2)" strokeWidth="1.4" />
      <text x="232" y="71" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--tx)">
        name
      </text>
      <text x="232" y="106" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        attribute
      </text>

      {/* key attribute (underlined) */}
      <ellipse cx="380" cy="67" rx="62" ry="23" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.4" />
      <text x="380" y="71" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-bright)" textDecoration="underline">
        student_id
      </text>
      <text x="380" y="106" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        key attribute (underlined)
      </text>

      {/* relationship diamond */}
      <path d="M 560 44 L 612 67 L 560 90 L 508 67 Z" fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1.6" />
      <text x="560" y="71" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11.5" fill="var(--tx)">
        enrolls
      </text>
      <text x="560" y="106" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--tx3)">
        relationship
      </text>

      <line x1="24" y1="128" x2="636" y2="128" stroke="var(--line)" />

      {/* ── Row B · Crow's-foot cardinality ──────────────────────────────── */}
      <text x="24" y="152" fontFamily="var(--font-body)" fontSize="12" fontWeight={600} fill="var(--accent)">
        Crow&apos;s foot — read the symbol at the entity it touches
      </text>

      <Ending x={40} y={192} kind="one-one" label="one &amp; only one" />
      <Ending x={210} y={192} kind="zero-one" label="zero or one" />
      <Ending x={380} y={192} kind="one-many" label="one or many" />
      <Ending x={540} y={192} kind="zero-many" label="zero or many" />
    </svg>
  );
}
