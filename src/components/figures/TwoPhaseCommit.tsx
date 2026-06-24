/*
 * Static diagram (M20): two-phase commit (2PC). A coordinator runs two rounds with its participants.
 * Phase 1 (prepare/vote): the coordinator asks each participant to prepare; each durably prepares and
 * votes yes (a binding promise). Phase 2 (commit): if all voted yes, the coordinator tells everyone to
 * commit. The danger is the GAP between the rounds — if the coordinator crashes after the yes votes,
 * the prepared participants are "in doubt": they may not unilaterally commit or abort, so they BLOCK,
 * holding their locks, until the coordinator recovers. That is the blocking problem. "prepare" = query
 * blue; "vote yes" / "commit" = commit green; the crash/blocking band = danger red. Labels English.
 * Facts: Gray 1978; Gray & Lamport 2006 (Consensus on Transaction Commit); PostgreSQL PREPARE TRANSACTION.
 */
export function TwoPhaseCommit() {
  return (
    <svg
      viewBox="0 0 680 380"
      width="100%"
      role="img"
      aria-label="Two-phase commit. On the left, a tall Coordinator (transaction manager) box. On the right, two Participant boxes, A and B, each a database. Three message rounds run between them at increasing heights. Round one, in query blue, is the coordinator asking 'prepare?' Round two, in commit green pointing back to the coordinator, is each participant durably preparing and voting 'yes'. Between rounds two and three sits a dashed danger-red band reading: coordinator crash here, participants in-doubt, holding locks — the blocking problem. Round three, in bold commit green, is the coordinator telling the participants to COMMIT. A footer summarises: Phase 1 = prepare and vote; Phase 2 = commit or abort; a yes vote is a binding promise, and the gap between the phases is where 2PC can block."
      style={{ maxWidth: 680 }}
    >
      <title>Two-phase commit: prepare/vote then commit — and the blocking problem in the gap</title>

      <defs>
        <marker id="tpc-blue" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-query)" />
        </marker>
        <marker id="tpc-green" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
      </defs>

      {/* Coordinator (left, tall) */}
      <rect x={28} y={70} width={150} height={236} rx="10" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.5" />
      <text x={103} y={96} textAnchor="middle" fontFamily="var(--font-body)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        Coordinator
      </text>
      <text x={103} y={112} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--tx2)">
        (transaction manager)
      </text>
      <text x={103} y={300} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--tx3)">
        decides commit / abort
      </text>

      {/* Participants (right, stacked) */}
      <rect x={500} y={70} width={152} height={74} rx="9" fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.4" />
      <text x={576} y={102} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fontWeight={700} fill="var(--c-storage)">
        Participant A
      </text>
      <text x={576} y={120} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        database / resource
      </text>

      <rect x={500} y={232} width={152} height={74} rx="9" fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.4" />
      <text x={576} y={264} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fontWeight={700} fill="var(--c-storage)">
        Participant B
      </text>
      <text x={576} y={282} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        database / resource
      </text>

      {/* Round 1 — prepare? (blue, →) */}
      <line x1={180} y1={130} x2={497} y2={130} stroke="var(--c-query)" strokeWidth="1.6" markerEnd="url(#tpc-blue)" />
      <rect x={236} y={116} width={168} height={18} rx="5" fill="var(--bg)" />
      <text x={244} y={129} fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-query)">
        ① prepare?  (phase 1)
      </text>

      {/* Round 2 — vote yes (green, ←) */}
      <line x1={497} y1={172} x2={180} y2={172} stroke="var(--c-commit)" strokeWidth="1.6" markerEnd="url(#tpc-green)" />
      <rect x={250} y={158} width={150} height={18} rx="5" fill="var(--bg)" />
      <text x={258} y={171} fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-commit)">
        vote: yes ✓  (prepared)
      </text>

      {/* Blocking-danger band (between phases) */}
      <rect x={186} y={186} width={306} height={34} rx="7" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.3" strokeDasharray="5 3" />
      <text x={339} y={200} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fontWeight={700} fill="var(--c-danger)">
        ⚠ coordinator crash HERE →
      </text>
      <text x={339} y={213} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-danger)">
        participants in-doubt, holding locks (blocking)
      </text>

      {/* Round 3 — commit (green bold, →) */}
      <line x1={180} y1={258} x2={497} y2={258} stroke="var(--c-commit)" strokeWidth="2.1" markerEnd="url(#tpc-green)" />
      <rect x={250} y={244} width={150} height={18} rx="5" fill="var(--bg)" />
      <text x={258} y={257} fontFamily="var(--font-mono)" fontSize="10" fontWeight={700} fill="var(--c-commit)">
        ② COMMIT  (phase 2)
      </text>

      {/* Footer */}
      <rect x={28} y={326} width={624} height={40} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={44} y={344} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx2)">
        <tspan fill="var(--accent-bright)" fontWeight={700}>Phase 1</tspan>
        <tspan> prepare + vote · </tspan>
        <tspan fill="var(--c-commit)" fontWeight={700}>Phase 2</tspan>
        <tspan> commit/abort. A “yes” is a binding promise.</tspan>
      </text>
      <text x={44} y={358} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        The gap between the phases is the blocking problem — no atomic commit protocol survives both node and network failure.
      </text>
    </svg>
  );
}
