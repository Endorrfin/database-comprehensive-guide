// CHANGED (S11): M21 — Streaming replication architecture figure.
export function StreamingReplication() {
  return (
    <svg
      viewBox="0 0 680 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Streaming replication: Primary with walsender ships WAL to Standby A and Standby B via walreceiver. Replication slots prevent WAL recycling."
      role="img"
      className="fig-svg"
    >
      <title>PostgreSQL streaming replication architecture</title>
      <defs>
        <marker id="srep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="var(--c-query)" />
        </marker>
        <marker id="srep-arrow-b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="var(--c-cyan)" />
        </marker>
        <marker id="srep-arrow-slot" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="var(--c-amber)" />
        </marker>
      </defs>

      {/* ── PRIMARY ───────────────────────────────────────────────── */}
      <rect x="30" y="80" width="180" height="140" rx="8"
        fill="var(--s2)" stroke="var(--c-query)" strokeWidth="2" />
      <text x="120" y="107" textAnchor="middle"
        fill="var(--c-query)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">
        Primary
      </text>
      {/* WAL segment inside primary */}
      <rect x="50" y="118" width="140" height="30" rx="4"
        fill="var(--accent-deep)" opacity="0.35" />
      <text x="120" y="138" textAnchor="middle"
        fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)">
        WAL (write-ahead log)
      </text>
      {/* walsender process */}
      <rect x="50" y="160" width="140" height="28" rx="4"
        fill="var(--s2)" stroke="var(--c-query)" strokeWidth="1.2" strokeDasharray="4 2" />
      <text x="120" y="179" textAnchor="middle"
        fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)">
        walsender
      </text>
      {/* replication slot badge */}
      <rect x="62" y="198" width="116" height="18" rx="3"
        fill="var(--c-amber)" opacity="0.2" />
      <text x="120" y="211" textAnchor="middle"
        fill="var(--c-amber)" fontSize="10" fontFamily="var(--font-mono)">
        replication slot ×2
      </text>

      {/* ── STANDBY A ─────────────────────────────────────────────── */}
      <rect x="470" y="30" width="180" height="120" rx="8"
        fill="var(--s2)" stroke="var(--c-cyan)" strokeWidth="1.5" />
      <text x="560" y="57" textAnchor="middle"
        fill="var(--c-cyan)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">
        Standby A
      </text>
      <text x="560" y="75" textAnchor="middle"
        fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        (sync — ANY 1)
      </text>
      {/* walreceiver A */}
      <rect x="490" y="85" width="140" height="28" rx="4"
        fill="var(--s2)" stroke="var(--c-cyan)" strokeWidth="1.2" strokeDasharray="4 2" />
      <text x="560" y="104" textAnchor="middle"
        fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)">
        walreceiver
      </text>
      {/* WAL segment */}
      <rect x="490" y="118" width="140" height="26" rx="4"
        fill="var(--c-commit)" opacity="0.18" />
      <text x="560" y="135" textAnchor="middle"
        fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)">
        WAL replay
      </text>

      {/* ── STANDBY B ─────────────────────────────────────────────── */}
      <rect x="470" y="180" width="180" height="120" rx="8"
        fill="var(--s2)" stroke="var(--c-cyan)" strokeWidth="1.5" />
      <text x="560" y="207" textAnchor="middle"
        fill="var(--c-cyan)" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">
        Standby B
      </text>
      <text x="560" y="225" textAnchor="middle"
        fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        (async)
      </text>
      {/* walreceiver B */}
      <rect x="490" y="235" width="140" height="28" rx="4"
        fill="var(--s2)" stroke="var(--c-cyan)" strokeWidth="1.2" strokeDasharray="4 2" />
      <text x="560" y="254" textAnchor="middle"
        fill="var(--tx2)" fontSize="11" fontFamily="var(--font-mono)">
        walreceiver
      </text>
      {/* WAL segment */}
      <rect x="490" y="268" width="140" height="22" rx="4"
        fill="var(--c-commit)" opacity="0.18" />
      <text x="560" y="283" textAnchor="middle"
        fill="var(--tx)" fontSize="11" fontFamily="var(--font-mono)">
        WAL replay
      </text>

      {/* ── ARROWS primary → standbys ─────────────────────────────── */}
      {/* To A (upper) */}
      <line x1="210" y1="115" x2="466" y2="88"
        stroke="var(--c-query)" strokeWidth="2"
        markerEnd="url(#srep-arrow)" />
      {/* WAL label on upper arrow */}
      <text x="330" y="93" textAnchor="middle"
        fill="var(--c-query)" fontSize="11" fontFamily="var(--font-mono)">
        WAL stream (TCP)
      </text>
      {/* ACK back from A */}
      <line x1="466" y1="103" x2="210" y2="130"
        stroke="var(--c-cyan)" strokeWidth="1.5" strokeDasharray="5 3"
        markerEnd="url(#srep-arrow-b)" />
      <text x="330" y="130" textAnchor="middle"
        fill="var(--c-cyan)" fontSize="10" fontFamily="var(--font-mono)">
        flush ACK (sync)
      </text>

      {/* To B (lower) */}
      <line x1="210" y1="185" x2="466" y2="240"
        stroke="var(--c-query)" strokeWidth="2"
        markerEnd="url(#srep-arrow)" />
      <text x="330" y="230" textAnchor="middle"
        fill="var(--c-query)" fontSize="11" fontFamily="var(--font-mono)">
        WAL stream (TCP)
      </text>

      {/* ── replication slot label arrow ──────────────────────────── */}
      <text x="120" y="265" textAnchor="middle"
        fill="var(--c-amber)" fontSize="10" fontFamily="var(--font-sans)">
        slot prevents WAL recycling
      </text>

      {/* ── pg_stat_replication label ─────────────────────────────── */}
      <text x="340" y="285" textAnchor="middle"
        fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        monitor via pg_stat_replication (sent/write/flush/replay_lag)
      </text>
    </svg>
  );
}
