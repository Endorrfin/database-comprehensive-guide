/*
 * Static diagram (M1): raw files vs a DBMS as a contract over the data.
 * Left — every app reaches into shared files itself: races, no rules.
 * Right — every app goes through one DBMS that enforces the four guarantees.
 */
export function FilesVsDbms() {
  const apps = [0, 1, 2];
  return (
    <svg
      viewBox="0 0 660 330"
      width="100%"
      role="img"
      aria-label="On the left, three apps write to shared files directly and collide. On the right, three apps go through a single DBMS that provides concurrency, durability, integrity and querying."
      style={{ maxWidth: 660 }}
    >
      <title>Files vs a DBMS</title>

      {/* divider */}
      <line x1="330" y1="20" x2="330" y2="310" stroke="var(--line2)" strokeDasharray="3 5" />

      {/* ── LEFT: raw files ── */}
      <text x="20" y="28" fontFamily="var(--font-display)" fontSize="14" fill="var(--c-danger)">
        Files: every app for itself
      </text>
      {apps.map((i) => {
        const x = 24 + i * 96;
        return (
          <g key={`lf-${i}`}>
            <rect x={x} y={46} width="78" height="30" rx="6" fill="var(--c-query-soft)" stroke="var(--c-query)" />
            <text x={x + 39} y={65} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx)">
              App {i + 1}
            </text>
            {/* tangled arrows straight into the file */}
            <line
              x1={x + 39}
              y1={76}
              x2={165}
              y2={206}
              stroke="var(--c-danger)"
              strokeWidth="1.3"
              strokeOpacity="0.8"
              markerEnd="url(#fv-bad)"
            />
          </g>
        );
      })}
      {/* file/cylinder */}
      <g>
        <ellipse cx="165" cy="214" rx="52" ry="11" fill="var(--c-storage)" />
        <rect x="113" y="214" width="104" height="46" fill="var(--c-storage-soft)" />
        <ellipse cx="165" cy="260" rx="52" ry="11" fill="var(--c-storage-soft)" stroke="var(--c-storage)" />
        <ellipse cx="165" cy="214" rx="52" ry="11" fill="none" stroke="var(--c-storage)" />
        <text x="165" y="242" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--tx)">
          data.csv
        </text>
      </g>
      {/* collision mark */}
      <text x="236" y="150" textAnchor="middle" fontFamily="var(--font-body)" fontSize="20" fill="var(--c-danger)">
        ⚡
      </text>
      <text x="165" y="292" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--c-danger)">
        races · half-written rows · no rules
      </text>

      {/* ── RIGHT: a DBMS ── */}
      <text x="356" y="28" fontFamily="var(--font-display)" fontSize="14" fill="var(--accent-bright)">
        DBMS: one contract over the data
      </text>
      {apps.map((i) => {
        const x = 360 + i * 96;
        return (
          <g key={`rt-${i}`}>
            <rect x={x} y={46} width="78" height="30" rx="6" fill="var(--c-query-soft)" stroke="var(--c-query)" />
            <text x={x + 39} y={65} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--tx)">
              App {i + 1}
            </text>
            <line x1={x + 39} y1={76} x2={495} y2={150} stroke="var(--c-query)" strokeWidth="1.3" markerEnd="url(#fv-ok)" />
          </g>
        );
      })}
      {/* the DBMS gate */}
      <rect x="392" y="150" width="206" height="44" rx="9" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.6" />
      <text x="495" y="177" textAnchor="middle" fontFamily="var(--font-display)" fontSize="15" fill="var(--accent-bright)">
        DBMS
      </text>
      {/* the four guarantees */}
      {['concurrency', 'durability', 'integrity', 'querying'].map((g, i) => {
        const x = 360 + (i % 2) * 138;
        const y = 206 + Math.floor(i / 2) * 24;
        return (
          <text key={g} x={x} y={y} fontFamily="var(--font-body)" fontSize="11" fill="var(--c-commit)">
            ✓ {g}
          </text>
        );
      })}
      {/* storage below the DBMS */}
      <line x1="495" y1="194" x2="495" y2="262" stroke="var(--c-query)" strokeWidth="1.3" markerEnd="url(#fv-ok)" />
      <g>
        <ellipse cx="495" cy="270" rx="46" ry="10" fill="var(--c-storage)" />
        <rect x="449" y="270" width="92" height="30" fill="var(--c-storage-soft)" />
        <ellipse cx="495" cy="300" rx="46" ry="10" fill="var(--c-storage-soft)" stroke="var(--c-storage)" />
        <ellipse cx="495" cy="270" rx="46" ry="10" fill="none" stroke="var(--c-storage)" />
        <text x="495" y="291" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--tx2)">
          managed storage
        </text>
      </g>

      <defs>
        <marker id="fv-bad" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-danger)" />
        </marker>
        <marker id="fv-ok" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-query)" />
        </marker>
      </defs>
    </svg>
  );
}
