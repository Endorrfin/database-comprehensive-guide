// PropertyGraph — static SVG illustrating a labeled property graph (LPG).
// Shows 4 nodes (labels + properties) connected by 4 relationships (type, direction,
// optional properties). Designed to teach the core structural difference from relational:
// relationships are first-class entities, not join-table rows.
// CHANGED (S14): new figure for M28 graph databases.

export function PropertyGraph() {
  // Arrow marker helper
  const ARROW_ID = 'pg14-arr';

  return (
    <svg
      viewBox="0 0 740 380"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Labeled property graph: four nodes (Alice, Bob, Inception, Kyiv) connected by four relationships (KNOWS, ACTED_IN, LIVES_IN, DIRECTED) with properties on both nodes and relationships"
      style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }}
    >
      <defs>
        <marker id={ARROW_ID} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--tx3)" />
        </marker>
      </defs>

      <rect width="740" height="380" fill="var(--bg)" rx="10" />

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <rect x="20" y="14" width="700" height="22" rx="4" fill="var(--c-storage)" opacity="0.14" />
      <text x="370" y="29" fill="var(--c-storage)" textAnchor="middle" fontWeight="700" fontSize="12">
        Labeled Property Graph — nodes carry labels + properties; relationships carry type + direction + properties
      </text>

      {/* ══════════ NODE: Alice (Person) ══════════ */}
      {/* circle */}
      <circle cx="160" cy="140" r="52" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="2" />
      {/* label badge */}
      <rect x="120" y="96" width="80" height="18" rx="9" fill="var(--c-storage)" opacity="0.85" />
      <text x="160" y="109" fill="#fff" textAnchor="middle" fontSize="10" fontWeight="700">:Person</text>
      {/* properties */}
      <text x="160" y="132" fill="var(--tx2)" textAnchor="middle" fontSize="11" fontWeight="600">Alice</text>
      <text x="160" y="149" fill="var(--tx3)" textAnchor="middle" fontSize="10">age: 31</text>
      <text x="160" y="164" fill="var(--tx3)" textAnchor="middle" fontSize="10">since: 2018</text>

      {/* ══════════ NODE: Bob (Person) ══════════ */}
      <circle cx="580" cy="140" r="52" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="2" />
      <rect x="540" y="96" width="80" height="18" rx="9" fill="var(--c-storage)" opacity="0.85" />
      <text x="580" y="109" fill="#fff" textAnchor="middle" fontSize="10" fontWeight="700">:Person</text>
      <text x="580" y="132" fill="var(--tx2)" textAnchor="middle" fontSize="11" fontWeight="600">Bob</text>
      <text x="580" y="149" fill="var(--tx3)" textAnchor="middle" fontSize="10">age: 27</text>
      <text x="580" y="164" fill="var(--tx3)" textAnchor="middle" fontSize="10">city: "Kyiv"</text>

      {/* ══════════ NODE: Inception (Movie) ══════════ */}
      <circle cx="370" cy="285" r="52" fill="var(--surface)" stroke="var(--c-analytics)" strokeWidth="2" />
      <rect x="315" y="241" width="110" height="18" rx="9" fill="var(--c-analytics)" opacity="0.85" />
      <text x="370" y="254" fill="#111" textAnchor="middle" fontSize="10" fontWeight="700">:Movie</text>
      <text x="370" y="276" fill="var(--tx2)" textAnchor="middle" fontSize="11" fontWeight="600">Inception</text>
      <text x="370" y="293" fill="var(--tx3)" textAnchor="middle" fontSize="10">year: 2010</text>
      <text x="370" y="309" fill="var(--tx3)" textAnchor="middle" fontSize="10">rating: 8.8</text>

      {/* ══════════ NODE: Kyiv (City) ══════════ */}
      <circle cx="370" cy="68" r="42" fill="var(--surface)" stroke="var(--c-commit)" strokeWidth="2" />
      <rect x="328" y="34" width="84" height="18" rx="9" fill="var(--c-commit)" opacity="0.85" />
      <text x="370" y="47" fill="#111" textAnchor="middle" fontSize="10" fontWeight="700">:City</text>
      <text x="370" y="68" fill="var(--tx2)" textAnchor="middle" fontSize="11" fontWeight="600">Kyiv</text>
      <text x="370" y="84" fill="var(--tx3)" textAnchor="middle" fontSize="10">country: "UA"</text>

      {/* ══════════ RELATIONSHIP: Alice -[KNOWS]-> Bob ══════════ */}
      {/* line from Alice(right) to Bob(left) */}
      <line x1="212" y1="134" x2="524" y2="134"
        stroke="var(--tx3)" strokeWidth="1.5" markerEnd={`url(#${ARROW_ID})`} />
      {/* label pill */}
      <rect x="318" y="118" width="104" height="20" rx="6" fill="var(--s2)" stroke="var(--tx3)" strokeWidth="1" />
      <text x="370" y="132" fill="var(--tx2)" textAnchor="middle" fontSize="10" fontWeight="600">KNOWS</text>
      {/* property */}
      <text x="370" y="112" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">since: 2020</text>

      {/* ══════════ RELATIONSHIP: Alice -[ACTED_IN]-> Inception ══════════ */}
      <line x1="184" y1="185" x2="326" y2="243"
        stroke="var(--tx3)" strokeWidth="1.5" markerEnd={`url(#${ARROW_ID})`} />
      <rect x="185" y="218" width="104" height="20" rx="6" fill="var(--s2)" stroke="var(--tx3)" strokeWidth="1" />
      <text x="237" y="232" fill="var(--tx2)" textAnchor="middle" fontSize="10" fontWeight="600">ACTED_IN</text>
      <text x="237" y="212" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">role: "Ariadne"</text>

      {/* ══════════ RELATIONSHIP: Bob -[ACTED_IN]-> Inception ══════════ */}
      <line x1="556" y1="185" x2="414" y2="243"
        stroke="var(--tx3)" strokeWidth="1.5" markerEnd={`url(#${ARROW_ID})`} />
      <rect x="451" y="218" width="104" height="20" rx="6" fill="var(--s2)" stroke="var(--tx3)" strokeWidth="1" />
      <text x="503" y="232" fill="var(--tx2)" textAnchor="middle" fontSize="10" fontWeight="600">ACTED_IN</text>
      <text x="503" y="212" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">role: "Cobb"</text>

      {/* ══════════ RELATIONSHIP: Bob -[LIVES_IN]-> Kyiv ══════════ */}
      <line x1="546" y1="105" x2="412" y2="72"
        stroke="var(--tx3)" strokeWidth="1.5" markerEnd={`url(#${ARROW_ID})`} />
      <rect x="455" y="80" width="88" height="20" rx="6" fill="var(--s2)" stroke="var(--tx3)" strokeWidth="1" />
      <text x="499" y="94" fill="var(--tx2)" textAnchor="middle" fontSize="10" fontWeight="600">LIVES_IN</text>

      {/* ══════════ Legend ══════════ */}
      <rect x="20" y="338" width="700" height="34" rx="6" fill="var(--s2)" />

      {/* node legend */}
      <circle cx="42" cy="355" r="8" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.5" />
      <text x="56" y="359" fill="var(--tx2)" fontSize="10">Node (label + properties)</text>

      {/* relationship legend */}
      <line x1="210" y1="355" x2="248" y2="355" stroke="var(--tx3)" strokeWidth="1.5" markerEnd={`url(#${ARROW_ID})`} />
      <text x="255" y="359" fill="var(--tx2)" fontSize="10">Relationship (type + direction + optional properties)</text>

      {/* key insight */}
      <text x="560" y="351" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">Relationships are</text>
      <text x="560" y="364" fill="var(--c-storage)" textAnchor="middle" fontSize="9.5" fontWeight="600">first-class entities</text>
    </svg>
  );
}
