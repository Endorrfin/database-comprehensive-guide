// Columnar scan figure (M31) — the same aggregate query (SUM of one column) over a row store
// vs a column store. The row store drags every column off disk; the column store reads only the
// one column it needs, and that column compresses hard. The "scan columns, not rows" mental model.
// Static SVG, no hooks, no useLang — figures always render in English.

export function ColumnarScan() {
  const W = 488, H = 232;
  const cols = ['id', 'date', 'cust', 'amount', 'region'];
  const amountIdx = 3;

  // Left (row store) grid
  const lx = 24, lyTop = 62, cellW = 38, cellH = 19, rows = 5;
  // Right (column store)
  const rx = 288, ryTop = 62, colW = 34, gap = 5, colH = 96;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 560 }}
      aria-label="Row store versus column store scan for sum(amount)">
      {/* Query */}
      <text x={W / 2} y={16} textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--tx)" fontFamily="var(--font-mono)">SELECT sum(amount) FROM sales</text>
      <text x={W / 2} y={30} textAnchor="middle" fontSize="8.5"
        fill="var(--tx3)" fontFamily="var(--font-ui)">same data · same query · two storage layouts</text>

      {/* ── Left: row store ─────────────────────────── */}
      <text x={lx + (cellW * cols.length) / 2} y={50} textAnchor="middle"
        fontSize="10.5" fontWeight="700" fill="var(--c-query)" fontFamily="var(--font-ui)">Row store</text>
      {cols.map((name, c) => (
        <text key={`lh-${c}`} x={lx + c * cellW + cellW / 2} y={lyTop - 3}
          textAnchor="middle" fontSize="6.5" fill="var(--tx3)" fontFamily="var(--font-mono)">{name}</text>
      ))}
      {Array.from({ length: rows }).map((_, r) =>
        cols.map((_, c) => (
          <rect key={`${r}-${c}`} x={lx + c * cellW} y={lyTop + r * cellH} width={cellW} height={cellH}
            fill={c === amountIdx ? 'var(--c-analytics-soft)' : 'var(--c-danger-soft)'}
            stroke="var(--line2)" strokeWidth="0.6" />
        ))
      )}
      <rect x={lx + amountIdx * cellW} y={lyTop} width={cellW} height={rows * cellH}
        fill="none" stroke="var(--c-analytics)" strokeWidth="1.6" />
      <text x={lx + (cellW * cols.length) / 2} y={lyTop + rows * cellH + 16} textAnchor="middle"
        fontSize="8.5" fill="var(--tx2)" fontFamily="var(--font-ui)">reads all 5 columns — 4/5 wasted I/O</text>

      {/* divider */}
      <line x1={264} y1={46} x2={264} y2={H - 26} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />

      {/* ── Right: column store ─────────────────────── */}
      <text x={rx + ((colW + gap) * cols.length - gap) / 2} y={50} textAnchor="middle"
        fontSize="10.5" fontWeight="700" fill="var(--c-analytics)" fontFamily="var(--font-ui)">Column store</text>
      {cols.map((name, c) => {
        const wanted = c === amountIdx;
        const cx = rx + c * (colW + gap);
        return (
          <g key={`col-${c}`}>
            <rect x={cx} y={ryTop} width={colW} height={colH} rx="2"
              fill={wanted ? 'var(--c-analytics-soft)' : 'var(--s2)'}
              stroke={wanted ? 'var(--c-analytics)' : 'var(--line2)'}
              strokeWidth={wanted ? 1.6 : 0.6} opacity={wanted ? 1 : 0.45} />
            <text x={cx + colW / 2} y={ryTop - 3} textAnchor="middle" fontSize="6.5"
              fill={wanted ? 'var(--c-analytics)' : 'var(--tx3)'} fontFamily="var(--font-mono)">{name}</text>
            {wanted && [0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1={cx + 3} y1={ryTop + 16 + i * 16} x2={cx + colW - 3} y2={ryTop + 16 + i * 16}
                stroke="var(--c-analytics)" strokeWidth="1" opacity="0.5" />
            ))}
          </g>
        );
      })}
      <text x={rx + colW / 2 + amountIdx * (colW + gap)} y={ryTop + colH + 13} textAnchor="middle"
        fontSize="7.5" fill="var(--c-analytics)" fontFamily="var(--font-ui)">compressed</text>
      <text x={rx + ((colW + gap) * cols.length - gap) / 2} y={ryTop + colH + 27} textAnchor="middle"
        fontSize="8.5" fill="var(--tx2)" fontFamily="var(--font-ui)">reads only amount — 1/5 columns</text>
    </svg>
  );
}
