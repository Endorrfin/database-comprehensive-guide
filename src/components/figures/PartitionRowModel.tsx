// PartitionRowModel — static SVG illustrating the Cassandra partition/clustering-key data model.
// Shows a sensor_data table split into two partitions (device_id), each holding wide rows
// sorted by the clustering key (timestamp). Teaches the "partition = all rows sharing the
// same partition key" + "clustering key = sort order within the partition" mental model.
// CHANGED (S14): new figure for M27 wide-column stores.

export function PartitionRowModel() {
  return (
    <svg
      viewBox="0 0 740 360"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cassandra partition row model: sensor_data table split by device_id partition key into two partitions, each with rows sorted by timestamp clustering key"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
    >
      <rect width="740" height="360" fill="var(--bg)" rx="10" />

      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <rect x="20" y="14" width="700" height="22" rx="4" fill="var(--e-cassandra)" opacity="0.18" />
      <text x="370" y="29" fill="var(--e-cassandra)" textAnchor="middle" fontWeight="700" fontSize="12">
        TABLE sensor_data — PRIMARY KEY ((device_id), timestamp DESC)
      </text>

      {/* ── Column-header row ─────────────────────────────────────────── */}
      <rect x="20" y="44" width="700" height="20" rx="0" fill="var(--s2)" />
      {/* col headers */}
      <text x="110" y="58" fill="var(--tx3)" textAnchor="middle" fontSize="10" fontWeight="600">device_id</text>
      <text x="30"  y="58" fill="var(--tx3)" fontSize="9" opacity="0.6">PARTITION KEY</text>
      <text x="310" y="58" fill="var(--tx3)" textAnchor="middle" fontSize="10" fontWeight="600">timestamp</text>
      <text x="230" y="58" fill="var(--tx3)" fontSize="9" opacity="0.6">CLUSTERING KEY</text>
      <text x="490" y="58" fill="var(--tx3)" textAnchor="middle" fontSize="10" fontWeight="600">temperature</text>
      <text x="640" y="58" fill="var(--tx3)" textAnchor="middle" fontSize="10" fontWeight="600">battery_pct</text>

      {/* column dividers */}
      <line x1="190" y1="44" x2="190" y2="360" stroke="var(--line)" strokeWidth="1" />
      <line x1="400" y1="44" x2="400" y2="360" stroke="var(--line)" strokeWidth="1" />
      <line x1="570" y1="44" x2="570" y2="360" stroke="var(--line)" strokeWidth="1" />

      {/* ══════════════ PARTITION 1: dev-001 ══════════════ */}
      {/* partition background */}
      <rect x="20" y="64" width="700" height="118" rx="0"
        fill="var(--e-cassandra)" opacity="0.06" />
      <rect x="20" y="64" width="700" height="118" rx="0"
        fill="none" stroke="var(--e-cassandra)" strokeWidth="1.5" strokeDasharray="4 2" />

      {/* partition label badge */}
      <rect x="22" y="66" width="80" height="15" rx="3" fill="var(--e-cassandra)" opacity="0.25" />
      <text x="62" y="77" fill="var(--e-cassandra)" textAnchor="middle" fontSize="9" fontWeight="700">
        partition 1
      </text>

      {/* token hash badge */}
      <text x="715" y="127" fill="var(--tx3)" textAnchor="end" fontSize="9" opacity="0.7">
        token("dev-001") = –3 410 …
      </text>

      {/* Row 1-1 */}
      <rect x="20" y="82" width="700" height="26" fill="var(--surface)" />
      <text x="110" y="99" fill="var(--e-cassandra)" textAnchor="middle" fontWeight="600">"dev-001"</text>
      <text x="310" y="99" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:03</text>
      <text x="490" y="99" fill="var(--c-commit)" textAnchor="middle">23.7</text>
      <text x="640" y="99" fill="var(--tx2)" textAnchor="middle">94</text>

      {/* Row 1-2 */}
      <rect x="20" y="108" width="700" height="26" fill="var(--s2)" opacity="0.5" />
      <text x="110" y="125" fill="var(--e-cassandra)" textAnchor="middle" fontWeight="600">"dev-001"</text>
      <text x="310" y="125" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:02</text>
      <text x="490" y="125" fill="var(--c-commit)" textAnchor="middle">23.9</text>
      <text x="640" y="125" fill="var(--tx2)" textAnchor="middle">93</text>

      {/* Row 1-3 */}
      <rect x="20" y="134" width="700" height="26" fill="var(--surface)" />
      <text x="110" y="151" fill="var(--e-cassandra)" textAnchor="middle" fontWeight="600">"dev-001"</text>
      <text x="310" y="151" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:01</text>
      <text x="490" y="151" fill="var(--c-commit)" textAnchor="middle">24.1</text>
      <text x="640" y="151" fill="var(--tx2)" textAnchor="middle">93</text>

      {/* clustering sort arrow */}
      <text x="724" y="108" fill="var(--tx3)" fontSize="9" opacity="0.7">DESC ↓</text>
      <line x1="718" y1="86" x2="718" y2="158" stroke="var(--tx3)" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#arr14)" opacity="0.6" />

      {/* ══════════════ PARTITION 2: dev-002 ══════════════ */}
      <rect x="20" y="198" width="700" height="118" rx="0"
        fill="var(--c-dist)" opacity="0.05" />
      <rect x="20" y="198" width="700" height="118" rx="0"
        fill="none" stroke="var(--c-dist)" strokeWidth="1.5" strokeDasharray="4 2" />

      <rect x="22" y="200" width="80" height="15" rx="3" fill="var(--c-dist)" opacity="0.25" />
      <text x="62" y="211" fill="var(--c-dist)" textAnchor="middle" fontSize="9" fontWeight="700">
        partition 2
      </text>
      <text x="715" y="261" fill="var(--tx3)" textAnchor="end" fontSize="9" opacity="0.7">
        token("dev-002") = +1 770 …
      </text>

      {/* Row 2-1 */}
      <rect x="20" y="216" width="700" height="26" fill="var(--surface)" />
      <text x="110" y="233" fill="var(--c-dist)" textAnchor="middle" fontWeight="600">"dev-002"</text>
      <text x="310" y="233" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:03</text>
      <text x="490" y="233" fill="var(--c-commit)" textAnchor="middle">18.2</text>
      <text x="640" y="233" fill="var(--tx2)" textAnchor="middle">61</text>

      {/* Row 2-2 */}
      <rect x="20" y="242" width="700" height="26" fill="var(--s2)" opacity="0.5" />
      <text x="110" y="259" fill="var(--c-dist)" textAnchor="middle" fontWeight="600">"dev-002"</text>
      <text x="310" y="259" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:02</text>
      <text x="490" y="259" fill="var(--c-commit)" textAnchor="middle">18.5</text>
      <text x="640" y="259" fill="var(--tx2)" textAnchor="middle">62</text>

      {/* Row 2-3 */}
      <rect x="20" y="268" width="700" height="26" fill="var(--surface)" />
      <text x="110" y="285" fill="var(--c-dist)" textAnchor="middle" fontWeight="600">"dev-002"</text>
      <text x="310" y="285" fill="var(--tx2)" textAnchor="middle">2026-06-25 10:00:01</text>
      <text x="490" y="285" fill="var(--c-commit)" textAnchor="middle">18.0</text>
      <text x="640" y="285" fill="var(--tx2)" textAnchor="middle">62</text>

      <text x="724" y="242" fill="var(--tx3)" fontSize="9" opacity="0.7">DESC ↓</text>
      <line x1="718" y1="220" x2="718" y2="292" stroke="var(--tx3)" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#arr14b)" opacity="0.6" />

      {/* ── separator between partitions ─────────────────────────────── */}
      <rect x="20" y="160" width="700" height="38" fill="var(--bg)" />
      <line x1="20" y1="179" x2="720" y2="179" stroke="var(--line2)" strokeWidth="1.5" />
      <text x="370" y="175" fill="var(--tx3)" textAnchor="middle" fontSize="9.5" fontStyle="italic">
        ← different partition key → different partition → potentially different node in the cluster →
      </text>

      {/* ── Legend / key ────────────────────────────────────────────── */}
      <rect x="20" y="324" width="700" height="28" rx="4" fill="var(--s2)" />
      {/* partition key badge */}
      <rect x="32" y="330" width="12" height="12" rx="2" fill="var(--e-cassandra)" opacity="0.5" />
      <text x="50" y="340" fill="var(--tx2)" fontSize="10">Partition key → determines which node stores the rows (token ring)</text>
      {/* clustering key note */}
      <text x="460" y="340" fill="var(--tx2)" fontSize="10">  Clustering key → sort order within a partition</text>

      {/* arrowhead markers */}
      <defs>
        <marker id="arr14"  markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--tx3)" opacity="0.6" />
        </marker>
        <marker id="arr14b" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="var(--tx3)" opacity="0.6" />
        </marker>
      </defs>
    </svg>
  );
}
