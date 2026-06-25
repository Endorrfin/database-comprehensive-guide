// CHANGED (S12): M24 — PITR timeline figure
export function BackupPitr() {
  return (
    <svg
      viewBox="0 0 700 260"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}
      aria-label="PITR timeline: base backup at T0, continuous WAL archive fills changes, recovery replays WAL to a target timestamp"
      role="img"
    >
      <defs>
        <marker id="bp-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--tx2)" />
        </marker>
        <marker id="bp-arr-accent" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--accent)" />
        </marker>
        <marker id="bp-arr-warn" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--c-warn)" />
        </marker>
        <marker id="bp-arr-commit" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--c-commit)" />
        </marker>
      </defs>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <text x="350" y="24" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif"
        fill="var(--tx)" fontWeight="600">Point-in-Time Recovery (PITR) — Timeline</text>

      {/* ── Main timeline axis ─────────────────────────────────────────────── */}
      <line x1="60" y1="100" x2="660" y2="100" stroke="var(--line2)" strokeWidth="2"
        markerEnd="url(#bp-arr)" />
      <text x="670" y="104" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--tx2)">time →</text>

      {/* ── T0: base backup ────────────────────────────────────────────────── */}
      <line x1="100" y1="85" x2="100" y2="115" stroke="var(--accent)" strokeWidth="2" />
      <text x="100" y="76" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono,monospace"
        fill="var(--accent)">T0</text>

      {/* base backup block */}
      <rect x="60" y="118" width="80" height="40" rx="7"
        fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="100" y="135" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif"
        fill="var(--accent)" fontWeight="600">Base backup</text>
      <text x="100" y="149" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">pg_basebackup</text>

      {/* ── WAL archive band ───────────────────────────────────────────────── */}
      {/* Filled band from T0 to present */}
      <rect x="100" y="86" width="480" height="28" rx="4"
        fill="var(--c-commit)" opacity="0.12" stroke="none" />
      <text x="340" y="105" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--c-commit)">Continuous WAL archive (archive_mode=on)</text>

      {/* WAL segment icons */}
      {[145, 210, 275, 340, 405, 470].map((x, i) => (
        <g key={i}>
          <rect x={x - 18} y={89} width="36" height="18" rx="3"
            fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="1" />
          <text x={x} y={102} textAnchor="middle" fontSize="8"
            fontFamily="JetBrains Mono,monospace" fill="var(--c-commit)">WAL</text>
        </g>
      ))}

      {/* ── Mistake event ──────────────────────────────────────────────────── */}
      <line x1="370" y1="80" x2="370" y2="118" stroke="var(--c-warn)" strokeWidth="1.5"
        strokeDasharray="4 3" />
      <text x="370" y="72" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--c-warn)">DROP TABLE!</text>

      {/* ── Recovery target ────────────────────────────────────────────────── */}
      <line x1="320" y1="80" x2="320" y2="115" stroke="var(--accent-bright)" strokeWidth="2" />
      <text x="320" y="72" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--accent-bright)" fontWeight="600">recovery_target_time</text>

      {/* ── Present / "now" ────────────────────────────────────────────────── */}
      <line x1="580" y1="85" x2="580" y2="115" stroke="var(--tx3)" strokeWidth="1.5" />
      <text x="580" y="76" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono,monospace"
        fill="var(--tx2)">now</text>

      {/* ── Recovery arrow: base backup → target ───────────────────────────── */}
      <path d="M100,165 Q210,200 320,165" fill="none" stroke="var(--accent)"
        strokeWidth="1.5" strokeDasharray="6 3" markerEnd="url(#bp-arr-accent)" />
      <text x="210" y="200" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--accent)">replay WAL → target</text>

      {/* ── Recovery labels ────────────────────────────────────────────────── */}
      <rect x="270" y="170" width="100" height="36" rx="6"
        fill="var(--s2)" stroke="var(--accent-bright)" strokeWidth="1.5" />
      <text x="320" y="188" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif"
        fill="var(--accent-bright)" fontWeight="600">PAUSE</text>
      <text x="320" y="202" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">inspect → promote</text>

      {/* ── Restore window bracket ──────────────────────────────────────────── */}
      <line x1="100" y1="230" x2="580" y2="230" stroke="var(--line2)" strokeWidth="1.5"
        markerStart="url(#bp-arr)" markerEnd="url(#bp-arr)" />
      <text x="340" y="248" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">PITR restore window — any point between T0 and now</text>

      {/* ── recovery.signal note ───────────────────────────────────────────── */}
      <rect x="460" y="162" width="200" height="50" rx="6"
        fill="var(--s2)" stroke="var(--line)" strokeWidth="1" />
      <text x="560" y="180" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)" fontWeight="600">PG 12+ recovery params</text>
      <text x="560" y="195" textAnchor="middle" fontSize="9"
        fontFamily="JetBrains Mono,monospace" fill="var(--tx3)">postgresql.conf</text>
      <text x="560" y="208" textAnchor="middle" fontSize="9"
        fontFamily="JetBrains Mono,monospace" fill="var(--tx3)">+ recovery.signal</text>
    </svg>
  );
}
