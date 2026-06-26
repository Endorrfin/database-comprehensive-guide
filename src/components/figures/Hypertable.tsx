// Hypertable figure (M31) — one logical TimescaleDB hypertable automatically split into
// time-ordered chunks. Recent chunks stay row-format for fast writes; older chunks are
// compressed columnar (~90%); chunks past the retention window are dropped whole. A continuous
// aggregate maintains an incrementally-refreshed rollup.
// Static SVG, no hooks, no useLang — figures always render in English.

export function Hypertable() {
  const W = 500, H = 246;
  const cw = 70, gap = 6, x0 = 26, cy = 116, ch = 56;
  const chunks: { label: string; kind: 'dropped' | 'compressed' | 'recent' }[] = [
    { label: 'Jan', kind: 'dropped' },
    { label: 'Feb', kind: 'compressed' },
    { label: 'Mar', kind: 'compressed' },
    { label: 'Apr', kind: 'compressed' },
    { label: 'May', kind: 'recent' },
    { label: 'Jun', kind: 'recent' },
  ];
  const cxOf = (i: number) => x0 + i * (cw + gap);
  const htX = 80, htW = 224, htY = 32, htH = 24; // hypertable box
  const htCx = htX + htW / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 580 }}
      aria-label="A TimescaleDB hypertable split into time chunks">
      {/* hypertable box */}
      <rect x={htX} y={htY} width={htW} height={htH} rx="5"
        fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.4" />
      <text x={htCx} y={htY + 16} textAnchor="middle" fontSize="10.5" fontWeight="700"
        fill="var(--c-analytics)" fontFamily="var(--font-mono)">hypertable: metrics</text>

      {/* continuous-aggregate chip */}
      <rect x={324} y={htY} width={150} height={htH} rx="5"
        fill="var(--c-storage-soft)" stroke="var(--c-storage)" strokeWidth="1.1" />
      <text x={399} y={htY + 11} textAnchor="middle" fontSize="8" fontWeight="700"
        fill="var(--c-storage)" fontFamily="var(--font-ui)">continuous aggregate</text>
      <text x={399} y={htY + 20} textAnchor="middle" fontSize="7"
        fill="var(--tx3)" fontFamily="var(--font-ui)">incremental rollup</text>

      {/* fan-out arrows hypertable → chunks */}
      {chunks.map((_, i) => (
        <line key={`f-${i}`} x1={htCx} y1={htY + htH} x2={cxOf(i) + cw / 2} y2={cy}
          stroke="var(--line2)" strokeWidth="0.8" strokeDasharray="3 2" />
      ))}

      {/* chunks */}
      {chunks.map((chunk, i) => {
        const cx = cxOf(i);
        if (chunk.kind === 'dropped') {
          return (
            <g key={i} opacity="0.45">
              <rect x={cx} y={cy} width={cw} height={ch} rx="4" fill="none"
                stroke="var(--tx3)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={cx + cw / 2} y={cy + 24} textAnchor="middle" fontSize="9"
                fill="var(--tx3)" fontFamily="var(--font-mono)">{chunk.label}</text>
              <text x={cx + cw / 2} y={cy + 40} textAnchor="middle" fontSize="7.5"
                fill="var(--tx3)" fontFamily="var(--font-ui)">dropped</text>
            </g>
          );
        }
        if (chunk.kind === 'compressed') {
          return (
            <g key={i}>
              <rect x={cx} y={cy} width={cw} height={ch} rx="4"
                fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.2" />
              {[0, 1, 2, 3].map((k) => (
                <line key={k} x1={cx + 6} y1={cy + 14 + k * 9} x2={cx + cw - 6} y2={cy + 14 + k * 9}
                  stroke="var(--c-analytics)" strokeWidth="1" opacity="0.5" />
              ))}
              <text x={cx + cw / 2} y={cy - 4} textAnchor="middle" fontSize="8"
                fill="var(--tx2)" fontFamily="var(--font-mono)">{chunk.label}</text>
              <text x={cx + cw / 2} y={cy + ch - 5} textAnchor="middle" fontSize="7.5" fontWeight="700"
                fill="var(--c-analytics)" fontFamily="var(--font-ui)">~90%</text>
            </g>
          );
        }
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={cw} height={ch} rx="4" fill="none"
              stroke="var(--c-analytics)" strokeWidth="1.6" />
            <text x={cx + cw / 2} y={cy - 4} textAnchor="middle" fontSize="8"
              fill="var(--tx2)" fontFamily="var(--font-mono)">{chunk.label}</text>
            <text x={cx + cw / 2} y={cy + 26} textAnchor="middle" fontSize="8"
              fill="var(--tx2)" fontFamily="var(--font-ui)">row</text>
            <text x={cx + cw / 2} y={cy + 40} textAnchor="middle" fontSize="7"
              fill="var(--tx3)" fontFamily="var(--font-ui)">writes</text>
          </g>
        );
      })}

      {/* time axis */}
      <line x1={x0} y1={cy + ch + 12} x2={cxOf(chunks.length - 1) + cw} y2={cy + ch + 12}
        stroke="var(--line2)" strokeWidth="1" markerEnd="" />
      <text x={x0} y={cy + ch + 26} textAnchor="start" fontSize="7.5"
        fill="var(--tx3)" fontFamily="var(--font-ui)">older</text>
      <text x={cxOf(chunks.length - 1) + cw} y={cy + ch + 26} textAnchor="end" fontSize="7.5"
        fill="var(--tx3)" fontFamily="var(--font-ui)">newer →</text>

      {/* group labels */}
      <text x={cxOf(0) + cw / 2} y={cy + ch + 40} textAnchor="middle" fontSize="7.5"
        fill="var(--tx3)" fontFamily="var(--font-ui)">retention</text>
      <text x={cxOf(2)} y={cy + ch + 40} textAnchor="middle" fontSize="7.5"
        fill="var(--c-analytics)" fontFamily="var(--font-ui)">compressed columnar</text>
      <text x={cxOf(4) + cw} y={cy + ch + 40} textAnchor="middle" fontSize="7.5"
        fill="var(--c-analytics)" fontFamily="var(--font-ui)">recent · fast writes</text>
    </svg>
  );
}
