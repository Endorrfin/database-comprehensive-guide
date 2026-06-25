// CacheAsideFlow — static SVG illustrating the cache-aside (lazy loading) pattern.
// Shows the miss path (app → cache miss → DB → populate cache → return) and
// the hit path (app → cache hit → return, DB bypassed).
// CHANGED (S13): new figure for M26 key-value & caching.

export function CacheAsideFlow() {
  return (
    <svg
      viewBox="0 0 720 300"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cache-aside pattern: on a cache miss the application reads from the database and populates the cache; on a cache hit the database is bypassed entirely"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
    >
      <rect width="720" height="300" fill="var(--bg)" rx="10" />

      {/* ── title ── */}
      <text x="360" y="24" fill="var(--tx2)" textAnchor="middle" fontSize="12" fontWeight="700">
        Cache-Aside (Lazy Loading)
      </text>

      {/* ══ Nodes ══ */}
      {/* Application */}
      <rect x="40" y="110" width="120" height="56" rx="8" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="100" y="137" fill="var(--accent-bright)" textAnchor="middle" fontWeight="700">Application</text>
      <text x="100" y="153" fill="var(--tx3)" textAnchor="middle">(client)</text>

      {/* Cache (Redis/Valkey) */}
      <rect x="290" y="46" width="140" height="56" rx="8" fill="var(--surface)" stroke="var(--e-redis)" strokeWidth="1.5" />
      <text x="360" y="70" fill="var(--e-redis)" textAnchor="middle" fontWeight="700">Cache</text>
      <text x="360" y="86" fill="var(--tx3)" textAnchor="middle">Redis / Valkey</text>

      {/* Database */}
      <rect x="290" y="196" width="140" height="56" rx="8" fill="var(--surface)" stroke="var(--c-storage)" strokeWidth="1.5" />
      <text x="360" y="220" fill="var(--c-storage)" textAnchor="middle" fontWeight="700">Database</text>
      <text x="360" y="236" fill="var(--tx3)" textAnchor="middle">(primary store)</text>

      {/* ══ HIT path ══ (top arc) */}
      {/* App → Cache (GET) */}
      <path
        d="M 160 126 C 210 80 250 70 290 73"
        fill="none" stroke="var(--c-commit)" strokeWidth="1.8"
        markerEnd="url(#arrowGreen)"
      />
      <text x="214" y="84" fill="var(--c-commit)" textAnchor="middle" fontSize="10">① GET key</text>

      {/* Cache → App (HIT response) */}
      <path
        d="M 290 84 C 250 100 210 116 160 134"
        fill="none" stroke="var(--c-commit)" strokeWidth="1.8" strokeDasharray="5 3"
        markerEnd="url(#arrowGreen)"
      />
      <text x="214" y="116" fill="var(--c-commit)" textAnchor="middle" fontSize="10">② HIT ✓ value</text>

      {/* HIT label */}
      <rect x="540" y="46" width="140" height="56" rx="8" fill="var(--c-commit)" opacity="0.12" stroke="var(--c-commit)" strokeWidth="1" />
      <text x="610" y="70" fill="var(--c-commit)" textAnchor="middle" fontWeight="700">CACHE HIT</text>
      <text x="610" y="86" fill="var(--tx3)" textAnchor="middle">DB never touched</text>
      <line x1="430" y1="73" x2="540" y2="73" stroke="var(--c-commit)" strokeWidth="1" strokeDasharray="4 3" />

      {/* ══ MISS path ══ (bottom flow) */}
      {/* App → Cache (miss) */}
      <path
        d="M 160 148 C 210 175 250 185 290 210"
        fill="none" stroke="var(--c-danger)" strokeWidth="1.8"
        markerEnd="url(#arrowRed)"
      />
      <text x="214" y="185" fill="var(--c-danger)" textAnchor="middle" fontSize="10">① GET key</text>

      {/* Cache miss badge */}
      <rect x="290" y="148" width="140" height="24" rx="4" fill="var(--c-danger)" opacity="0.15" />
      <text x="360" y="164" fill="var(--c-danger)" textAnchor="middle" fontSize="10" fontWeight="600">MISS — nil</text>

      {/* App → DB (read) — arrow going right+down from miss label */}
      <path
        d="M 160 156 L 160 224 C 160 224 225 224 290 224"
        fill="none" stroke="var(--c-analytics)" strokeWidth="1.8"
        markerEnd="url(#arrowAmber)"
      />
      <text x="100" y="215" fill="var(--c-analytics)" fontSize="10">② read DB</text>

      {/* DB → App (result) */}
      <path
        d="M 290 236 L 160 236"
        fill="none" stroke="var(--c-analytics)" strokeWidth="1.8" strokeDasharray="5 3"
        markerEnd="url(#arrowAmber)"
      />
      <text x="220" y="252" fill="var(--c-analytics)" textAnchor="middle" fontSize="10">③ result row</text>

      {/* App → Cache (populate + TTL) */}
      <path
        d="M 160 160 C 195 160 230 162 290 162"
        fill="none" stroke="var(--c-dist)" strokeWidth="1.8"
        markerEnd="url(#arrowCyan)"
      />
      <text x="232" y="155" fill="var(--c-dist)" textAnchor="middle" fontSize="10">④ SET key ttl</text>

      {/* MISS label box */}
      <rect x="540" y="196" width="140" height="56" rx="8" fill="var(--c-danger)" opacity="0.10" stroke="var(--c-danger)" strokeWidth="1" />
      <text x="610" y="220" fill="var(--c-danger)" textAnchor="middle" fontWeight="700">CACHE MISS</text>
      <text x="610" y="236" fill="var(--tx3)" textAnchor="middle">DB → populate</text>
      <line x1="430" y1="224" x2="540" y2="224" stroke="var(--c-danger)" strokeWidth="1" strokeDasharray="4 3" />

      {/* ══ TTL note ══ */}
      <text x="360" y="292" fill="var(--tx3)" textAnchor="middle" fontSize="9.5">
        Keys expire after TTL → next access triggers a fresh DB read
      </text>

      {/* ══ Arrow markers ══ */}
      <defs>
        <marker id="arrowGreen" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="var(--c-commit)" />
        </marker>
        <marker id="arrowRed" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="var(--c-danger)" />
        </marker>
        <marker id="arrowAmber" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="var(--c-analytics)" />
        </marker>
        <marker id="arrowCyan" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="var(--c-dist)" />
        </marker>
      </defs>
    </svg>
  );
}
