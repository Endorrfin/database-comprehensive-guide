/*
 * Static diagram (M18): the isolation level × anomaly matrix, PostgreSQL semantics. Rows are the
 * anomalies; columns are PostgreSQL's three real levels (Read Uncommitted is mapped to Read
 * Committed). A green check = the level prevents it; a red cross = it can still occur. Mirrors the
 * PostgreSQL docs Table 13.1, extended with the lost-update and write-skew rows. The cell to notice
 * is Write-skew × Repeatable Read: Snapshot Isolation does NOT stop it — only Serializable (SSI)
 * does. Commit-green for "prevented", danger-red for "can occur". Labels stay English.
 * Facts: postgresql.org/docs/current/transaction-iso.html (Table 13.1).
 */
const COLS = ['Read Committed', 'Repeatable Read', 'Serializable'];
type Row = { label: string; note: string; prevented: [boolean, boolean, boolean] };
const ROWS: Row[] = [
  { label: 'Dirty read', note: 'never in PG', prevented: [true, true, true] },
  { label: 'Non-repeatable read', note: 're-read changes', prevented: [false, true, true] },
  { label: 'Phantom read', note: 'new matching row', prevented: [false, true, true] },
  { label: 'Lost update', note: 'overwritten write', prevented: [false, true, true] },
  { label: 'Write-skew', note: 'serialization anomaly', prevented: [false, false, true] },
];

const MX = 8;
const LABEL_W = 178;
const COL_W = 154;
const HEAD_H = 50;
const ROW_H = 48;
const GRID_TOP = 8;
const colX = (i: number) => MX + LABEL_W + COL_W * i;
const rowY = (i: number) => GRID_TOP + HEAD_H + ROW_H * i;

export function LevelAnomalyMatrix() {
  return (
    <svg
      viewBox="0 0 652 322"
      width="100%"
      role="img"
      aria-label="A matrix of database anomalies against PostgreSQL isolation levels. Columns: Read Committed, Repeatable Read, Serializable. Rows: Dirty read is prevented at all three levels (never occurs in PostgreSQL). Non-repeatable read, Phantom read, and Lost update each can occur at Read Committed but are prevented at Repeatable Read and Serializable. Write-skew can occur at both Read Committed and Repeatable Read, and is prevented only at Serializable. The highlighted cell is Write-skew under Repeatable Read, showing that Snapshot Isolation does not prevent write-skew."
      style={{ maxWidth: 652 }}
    >
      <title>Isolation level × anomaly matrix (PostgreSQL): what each level prevents</title>

      {/* column headers */}
      <text x={MX + 6} y={GRID_TOP + 30} fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--tx2)">
        anomaly ╲ level
      </text>
      {COLS.map((c, i) => (
        <g key={c}>
          <rect x={colX(i)} y={GRID_TOP} width={COL_W - 4} height={HEAD_H} rx="7" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.1" />
          <text x={colX(i) + (COL_W - 4) / 2} y={GRID_TOP + 24} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight={700} fill="var(--accent-bright)">
            {c}
          </text>
          <text x={colX(i) + (COL_W - 4) / 2} y={GRID_TOP + 40} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
            {i === 1 ? 'Snapshot Isolation' : i === 2 ? 'SSI' : 'default'}
          </text>
        </g>
      ))}

      {/* rows */}
      {ROWS.map((r, ri) => (
        <g key={r.label}>
          {/* row label */}
          <rect x={MX} y={rowY(ri)} width={LABEL_W - 4} height={ROW_H - 4} rx="7" fill="var(--surface)" stroke="var(--line2)" />
          <text x={MX + 12} y={rowY(ri) + 19} fontFamily="var(--font-body)" fontSize="11.5" fontWeight={700} fill="var(--tx)">
            {r.label}
          </text>
          <text x={MX + 12} y={rowY(ri) + 33} fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
            {r.note}
          </text>

          {/* cells */}
          {r.prevented.map((ok, ci) => {
            const highlight = r.label === 'Write-skew' && ci === 1;
            return (
              <g key={ci}>
                <rect
                  x={colX(ci)}
                  y={rowY(ri)}
                  width={COL_W - 4}
                  height={ROW_H - 4}
                  rx="7"
                  fill={ok ? 'var(--c-commit-soft)' : 'var(--c-danger-soft)'}
                  stroke={highlight ? 'var(--accent-bright)' : ok ? 'var(--c-commit)' : 'var(--c-danger)'}
                  strokeWidth={highlight ? 2 : 1.1}
                />
                <text x={colX(ci) + 16} y={rowY(ri) + 27} fontFamily="var(--font-mono)" fontSize="16" fontWeight={700} fill={ok ? 'var(--c-commit)' : 'var(--c-danger)'}>
                  {ok ? '✓' : '✗'}
                </text>
                <text x={colX(ci) + 34} y={rowY(ri) + 27} fontFamily="var(--font-body)" fontSize="10" fill={ok ? 'var(--c-commit)' : 'var(--c-danger)'}>
                  {ok ? 'prevented' : 'can occur'}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      {/* footnote */}
      <text x={MX + 2} y={rowY(5) + 10} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        Read Uncommitted is mapped to Read Committed in PostgreSQL. The boxed cell is the one to remember: Snapshot Isolation (Repeatable Read) does not stop write-skew — only Serializable (SSI) does.
      </text>
    </svg>
  );
}
