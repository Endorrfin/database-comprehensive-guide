// CHANGED (S12): M24 — Patroni HA cluster figure
export function HaCluster() {
  return (
    <svg
      viewBox="0 0 700 320"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}
      aria-label="Patroni HA cluster: primary holds leader lock in etcd; standbys stream WAL; failover promotes a standby"
      role="img"
    >
      <defs>
        <marker id="ha-arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--tx2)" />
        </marker>
        <marker id="ha-arr-accent" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--accent)" />
        </marker>
        <marker id="ha-arr-commit" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 Z" fill="var(--c-commit)" />
        </marker>
      </defs>

      {/* ── Primary node ───────────────────────────────────────────────────── */}
      <rect x="40" y="40" width="160" height="100" rx="10"
        fill="var(--s2)" stroke="var(--c-commit)" strokeWidth="2" />
      <text x="120" y="64" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif"
        fill="var(--c-commit)" fontWeight="700">Primary</text>
      <text x="120" y="83" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono,monospace"
        fill="var(--tx2)">PostgreSQL</text>
      <text x="120" y="100" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">Patroni daemon</text>
      {/* Leader lock badge */}
      <rect x="66" y="112" width="108" height="20" rx="5"
        fill="var(--c-commit)" opacity="0.18" stroke="var(--c-commit)" strokeWidth="1" />
      <text x="120" y="126" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--c-commit)">🔒 leader lock (TTL 30 s)</text>

      {/* ── Standby A ──────────────────────────────────────────────────────── */}
      <rect x="270" y="40" width="160" height="100" rx="10"
        fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="350" y="64" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif"
        fill="var(--accent)" fontWeight="600">Standby A</text>
      <text x="350" y="83" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono,monospace"
        fill="var(--tx2)">PostgreSQL</text>
      <text x="350" y="100" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">Patroni daemon</text>
      <rect x="293" y="112" width="114" height="20" rx="5"
        fill="var(--accent)" opacity="0.12" stroke="var(--accent)" strokeWidth="1" />
      <text x="350" y="126" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--accent)">sync standby</text>

      {/* ── Standby B ──────────────────────────────────────────────────────── */}
      <rect x="500" y="40" width="160" height="100" rx="10"
        fill="var(--s2)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="580" y="64" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif"
        fill="var(--tx)" fontWeight="600">Standby B</text>
      <text x="580" y="83" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono,monospace"
        fill="var(--tx2)">PostgreSQL</text>
      <text x="580" y="100" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">Patroni daemon</text>
      <rect x="520" y="112" width="120" height="20" rx="5"
        fill="var(--line)" opacity="0.4" stroke="var(--line)" strokeWidth="1" />
      <text x="580" y="126" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">async standby</text>

      {/* ── WAL stream arrows: Primary → Standby A, Primary → Standby B ──── */}
      <line x1="200" y1="70" x2="270" y2="70" stroke="var(--c-commit)" strokeWidth="1.5"
        strokeDasharray="6 3" markerEnd="url(#ha-arr-commit)" />
      <text x="235" y="63" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--c-commit)">WAL stream</text>

      <line x1="200" y1="100" x2="500" y2="80" stroke="var(--tx2)" strokeWidth="1.2"
        strokeDasharray="6 3" markerEnd="url(#ha-arr)" />
      <text x="348" y="100" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">WAL stream (async)</text>

      {/* ── etcd DCS ───────────────────────────────────────────────────────── */}
      <rect x="260" y="195" width="180" height="60" rx="10"
        fill="var(--s2)" stroke="var(--accent-deep)" strokeWidth="2" />
      <text x="350" y="220" textAnchor="middle" fontSize="13" fontFamily="Inter,sans-serif"
        fill="var(--accent)" fontWeight="700">etcd / DCS</text>
      <text x="350" y="238" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">Consul · ZooKeeper · Kubernetes</text>
      <text x="350" y="250" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">(stores leader key + config)</text>

      {/* ── Patroni ↔ etcd connections ─────────────────────────────────────── */}
      {/* Primary → etcd (renew lock) */}
      <line x1="120" y1="140" x2="290" y2="195" stroke="var(--c-commit)" strokeWidth="1.5"
        markerEnd="url(#ha-arr-commit)" />
      <text x="188" y="175" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--c-commit)">renew lock</text>

      {/* Standby A → etcd (poll) */}
      <line x1="350" y1="140" x2="350" y2="195" stroke="var(--tx2)" strokeWidth="1.2"
        strokeDasharray="4 3" markerEnd="url(#ha-arr)" />

      {/* Standby B → etcd (poll) */}
      <line x1="560" y1="140" x2="420" y2="198" stroke="var(--tx2)" strokeWidth="1.2"
        strokeDasharray="4 3" markerEnd="url(#ha-arr)" />
      <text x="508" y="182" textAnchor="middle" fontSize="9" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">poll DCS</text>

      {/* ── pg_rewind callout ───────────────────────────────────────────────── */}
      <rect x="40" y="190" width="175" height="52" rx="8"
        fill="var(--s2)" stroke="var(--c-warn)" strokeWidth="1.2" />
      <text x="128" y="210" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif"
        fill="var(--c-warn)" fontWeight="600">pg_rewind</text>
      <text x="128" y="226" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">after failover: resyncs old</text>
      <text x="128" y="240" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">primary's diverged pages</text>

      {/* ── HAProxy / VIP ──────────────────────────────────────────────────── */}
      <rect x="500" y="190" width="160" height="52" rx="8"
        fill="var(--s2)" stroke="var(--accent)" strokeWidth="1.2" />
      <text x="580" y="210" textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif"
        fill="var(--accent)" fontWeight="600">HAProxy / VIP</text>
      <text x="580" y="226" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">health-checks primary</text>
      <text x="580" y="240" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx2)">via Patroni REST API</text>

      {/* ── Failover arrow (Standby A → promoted) ─────────────────────────── */}
      <text x="350" y="280" textAnchor="middle" fontSize="10" fontFamily="Inter,sans-serif"
        fill="var(--tx3)">On lock expiry → standby wins DCS race → pg_promote() → new primary</text>

      {/* ── Legend strip ───────────────────────────────────────────────────── */}
      <line x1="45" y1="305" x2="85" y2="305" stroke="var(--c-commit)" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x="90" y="309" fontSize="9" fontFamily="Inter,sans-serif" fill="var(--tx3)">sync WAL stream</text>
      <line x1="175" y1="305" x2="215" y2="305" stroke="var(--tx2)" strokeWidth="1.2" strokeDasharray="6 3" />
      <text x="220" y="309" fontSize="9" fontFamily="Inter,sans-serif" fill="var(--tx3)">async WAL stream</text>
      <line x1="310" y1="305" x2="350" y2="305" stroke="var(--tx2)" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x="355" y="309" fontSize="9" fontFamily="Inter,sans-serif" fill="var(--tx3)">DCS poll (all daemons)</text>
    </svg>
  );
}
