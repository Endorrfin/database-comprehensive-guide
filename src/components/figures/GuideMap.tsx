// Guide-at-a-glance figure (M36) — the eight sections of the guide as one journey, from the
// on-ramp to mastery, each reduced to its core idea. A capstone overview distinct from the
// interactive Landscape Map (which maps the database families). Static SVG, no hooks, English
// labels; section accent colours mirror the section palette in concepts.ts.

export function GuideMap() {
  const W = 580, H = 290;
  const sections = [
    { roman: 'I',    name: 'Foundations',        essence: 'what & which DB',     color: '#5B9BD5' },
    { roman: 'II',   name: 'Relational & SQL',   essence: 'model & query',       color: '#86BCEA' },
    { roman: 'III',  name: 'Storage & Indexing', essence: 'why it is fast',      color: '#A78BFA' },
    { roman: 'IV',   name: 'Transactions',       essence: 'correct under load',  color: '#6CC24A' },
    { roman: 'V',    name: 'Distribution',       essence: 'scale & survive',     color: '#38BDF8' },
    { roman: 'VI',   name: 'NoSQL Families',     essence: 'beyond relational',   color: '#F2A93B' },
    { roman: 'VII',  name: 'Modern Engines',     essence: 'the modern wave',     color: '#C084FC' },
    { roman: 'VIII', name: 'Mastery',            essence: 'secure · fast · choose', color: '#34D399' },
  ];

  const cols = 4, colW = 130, gapX = 12, startX = 18;
  const rowH = 92, gapY = 16, startY = 42;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 620 }}
      aria-label="The guide at a glance: eight sections from foundations to mastery">
      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx2)" fontFamily="var(--font-body)">The guide at a glance — eight layers of how databases work</text>

      {sections.map((s, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (colW + gapX);
        const y = startY + row * (rowH + gapY);
        return (
          <g key={s.roman}>
            <rect x={x} y={y} width={colW} height={rowH} rx="9"
              fill="var(--s2)" stroke="var(--line2)" strokeWidth="1" />
            <rect x={x} y={y} width={colW} height={4} rx="2" fill={s.color} />
            <text x={x + 12} y={y + 28} fontSize="16" fontWeight="800" fill={s.color}
              fontFamily="var(--font-body)">{s.roman}</text>
            <text x={x + colW / 2} y={y + 54} textAnchor="middle" fontSize="10" fontWeight="700"
              fill="var(--tx)" fontFamily="var(--font-body)">{s.name}</text>
            <text x={x + colW / 2} y={y + 74} textAnchor="middle" fontSize="8.5"
              fill="var(--tx3)" fontFamily="var(--font-mono)">{s.essence}</text>
          </g>
        );
      })}

      {/* sequence chevrons in the row-1 and row-2 gaps */}
      {[0, 1, 2, 4, 5, 6].map((i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const gx = startX + col * (colW + gapX) + colW + gapX / 2;
        const gy = startY + row * (rowH + gapY) + rowH / 2;
        return (
          <path key={`chev-${i}`} d={`M${gx - 3},${gy - 4} L${gx + 3},${gy} L${gx - 3},${gy + 4}`}
            fill="none" stroke="var(--tx3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        );
      })}

      {/* wrap arrow from IV (end of row 1) down to V (start of row 2) */}
      <path
        d={`M${startX + 3 * (colW + gapX) + colW / 2},${startY + rowH + 2} L${startX + 3 * (colW + gapX) + colW / 2},${startY + rowH + gapY / 2} L${startX + colW / 2},${startY + rowH + gapY / 2} L${startX + colW / 2},${startY + rowH + gapY - 2}`}
        fill="none" stroke="var(--tx3)" strokeWidth="1.1" strokeDasharray="3 3" />

      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--tx3)" fontFamily="var(--font-body)">
        Recall the one-line model behind each section — that is the mastery this guide builds.
      </text>
    </svg>
  );
}
