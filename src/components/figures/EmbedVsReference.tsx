// EmbedVsReference — static SVG illustrating the MongoDB embed vs reference design trade-off.
// Left: embedded document (order + items co-located). Right: referenced documents (FK-style).
// CHANGED (S13): new figure for M25 document databases.

export function EmbedVsReference() {
  return (
    <svg
      viewBox="0 0 720 340"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Embed vs reference: left shows order fields and items array in one document; right shows order document with item_ids pointing to separate item documents"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
    >
      {/* ── background ── */}
      <rect width="720" height="340" fill="var(--bg)" rx="10" />

      {/* ══════════════ LEFT: EMBEDDED ══════════════ */}
      <rect x="20" y="16" width="310" height="24" rx="4" fill="var(--e-mongodb)" opacity="0.18" />
      <text x="175" y="33" fill="var(--e-mongodb)" textAnchor="middle" fontWeight="700" fontSize="12">
        EMBEDDED (embed)
      </text>

      {/* outer order doc */}
      <rect x="20" y="48" width="310" height="266" rx="6" fill="var(--surface)" stroke="var(--e-mongodb)" strokeWidth="1.5" />

      {/* doc header */}
      <text x="36" y="70" fill="var(--tx2)" fontSize="10">orders</text>
      <rect x="32" y="76" width="282" height="1" fill="var(--line)" />

      {/* _id field */}
      <text x="36" y="93" fill="var(--tx3)">_id:</text>
      <text x="80" y="93" fill="var(--c-storage)">ObjectId("ord1")</text>

      <text x="36" y="110" fill="var(--tx3)">status:</text>
      <text x="93" y="110" fill="var(--tx2)">"shipped"</text>

      <text x="36" y="127" fill="var(--tx3)">total:</text>
      <text x="83" y="127" fill="var(--tx2)">129.90</text>

      {/* items array label */}
      <text x="36" y="147" fill="var(--tx3)">items: [</text>

      {/* item 0 sub-doc */}
      <rect x="48" y="153" width="258" height="56" rx="4" fill="var(--s2)" stroke="var(--line)" strokeWidth="1" />
      <text x="60" y="169" fill="var(--tx3)">  sku:</text>
      <text x="98" y="169" fill="var(--tx2)">"A-42"</text>
      <text x="60" y="184" fill="var(--tx3)">  name:</text>
      <text x="108" y="184" fill="var(--tx2)">"Widget Pro"</text>
      <text x="60" y="199" fill="var(--tx3)">  qty:</text>
      <text x="99" y="199" fill="var(--tx2)">2</text>

      {/* item 1 sub-doc */}
      <rect x="48" y="215" width="258" height="56" rx="4" fill="var(--s2)" stroke="var(--line)" strokeWidth="1" />
      <text x="60" y="231" fill="var(--tx3)">  sku:</text>
      <text x="98" y="231" fill="var(--tx2)">"B-07"</text>
      <text x="60" y="246" fill="var(--tx3)">  name:</text>
      <text x="108" y="246" fill="var(--tx2)">"Gadget Lite"</text>
      <text x="60" y="261" fill="var(--tx3)">  qty:</text>
      <text x="99" y="261" fill="var(--tx2)">1</text>

      <text x="36" y="283" fill="var(--tx3)">]</text>

      {/* benefit badge */}
      <rect x="32" y="293" width="282" height="14" rx="3" fill="var(--c-commit)" opacity="0.15" />
      <text x="173" y="303" fill="var(--c-commit)" textAnchor="middle" fontSize="9.5" fontWeight="600">
        1 read → complete order + items
      </text>

      {/* ══════════════ RIGHT: REFERENCED ══════════════ */}
      <rect x="390" y="16" width="310" height="24" rx="4" fill="var(--c-query)" opacity="0.15" />
      <text x="545" y="33" fill="var(--c-query)" textAnchor="middle" fontWeight="700" fontSize="12">
        REFERENCED (reference)
      </text>

      {/* order doc */}
      <rect x="390" y="48" width="310" height="126" rx="6" fill="var(--surface)" stroke="var(--c-query)" strokeWidth="1.5" />
      <text x="406" y="70" fill="var(--tx2)" fontSize="10">orders</text>
      <rect x="402" y="76" width="282" height="1" fill="var(--line)" />

      <text x="406" y="93" fill="var(--tx3)">_id:</text>
      <text x="450" y="93" fill="var(--c-storage)">ObjectId("ord1")</text>

      <text x="406" y="110" fill="var(--tx3)">status:</text>
      <text x="463" y="110" fill="var(--tx2)">"shipped"</text>

      <text x="406" y="127" fill="var(--tx3)">total:</text>
      <text x="453" y="127" fill="var(--tx2)">129.90</text>

      <text x="406" y="144" fill="var(--tx3)">item_ids: [ObjectId("i1"), ObjectId("i2")]</text>

      {/* arrow */}
      <line x1="545" y1="174" x2="545" y2="195" stroke="var(--tx3)" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="var(--tx3)" />
        </marker>
      </defs>
      <text x="545" y="190" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">$lookup / 2nd query</text>

      {/* items collection */}
      <rect x="390" y="200" width="310" height="114" rx="6" fill="var(--surface)" stroke="var(--line2)" strokeWidth="1.5" />
      <text x="406" y="222" fill="var(--tx2)" fontSize="10">items</text>
      <rect x="402" y="228" width="282" height="1" fill="var(--line)" />

      <text x="406" y="244" fill="var(--tx3)">{'{ _id: ObjectId("i1"), sku: "A-42", … }'}</text>
      <text x="406" y="261" fill="var(--tx3)">{'{ _id: ObjectId("i2"), sku: "B-07", … }'}</text>

      {/* benefit badge right */}
      <rect x="402" y="293" width="282" height="14" rx="3" fill="var(--c-query)" opacity="0.12" />
      <text x="543" y="303" fill="var(--c-query)" textAnchor="middle" fontSize="9.5" fontWeight="600">
        items shared across orders → no duplication
      </text>

      {/* ══ centre divider ══ */}
      <line x1="355" y1="40" x2="355" y2="320" stroke="var(--line)" strokeWidth="1" strokeDasharray="4 3" />
      <text x="355" y="336" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">Rule: embed when data is "owned"; reference when it is "shared"</text>
    </svg>
  );
}
