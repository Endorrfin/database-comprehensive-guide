// RAG pipeline figure (M29) — shows the 4-step Retrieval-Augmented Generation flow.
// Static SVG, no hooks, no useLang — figures always render in English.

export function RagPipeline() {
  const steps = [
    { id: 1, label: 'Query',        detail: 'User question',        color: 'var(--accent)',      x: 36  },
    { id: 2, label: 'Embed',        detail: 'Embedding model',      color: 'var(--c-storage)',   x: 148 },
    { id: 3, label: 'ANN Search',   detail: 'Vector DB (HNSW)',     color: 'var(--c-analytics)', x: 260 },
    { id: 4, label: 'LLM + chunks', detail: 'Answer generation',    color: 'var(--c-commit)',    x: 372 },
  ];
  const W = 460, H = 130;
  const BOX_W = 100, BOX_H = 46;
  const CY = H / 2 + 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 520 }}
      aria-label="RAG pipeline: Query → Embed → ANN Search → LLM + chunks = Answer"
    >
      <defs>
        <marker id="rag-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 Z" fill="var(--line2)" />
        </marker>
      </defs>

      {/* Connecting arrows */}
      {steps.slice(0, -1).map((s, i) => {
        const x1 = s.x + BOX_W;
        const x2 = steps[i + 1].x;
        return (
          <line key={i}
            x1={x1} y1={CY} x2={x2 - 2} y2={CY}
            stroke="var(--line2)" strokeWidth="1.5"
            markerEnd="url(#rag-arrow)"
          />
        );
      })}

      {/* Top label: query vector */}
      <text x={204} y={CY - BOX_H / 2 - 12}
        textAnchor="middle" fontSize="9" fill="var(--tx3)"
        fontFamily="var(--font-code)">[0.21, -0.88, …]</text>

      {/* Top label: top-k docs */}
      <text x={316} y={CY - BOX_H / 2 - 12}
        textAnchor="middle" fontSize="9" fill="var(--tx3)"
        fontFamily="var(--font-code)">top-k docs</text>

      {/* Step boxes */}
      {steps.map(s => (
        <g key={s.id}>
          <rect
            x={s.x} y={CY - BOX_H / 2}
            width={BOX_W} height={BOX_H} rx="5"
            fill={s.color} opacity="0.15"
            stroke={s.color} strokeWidth="1.2"
          />
          <text x={s.x + BOX_W / 2} y={CY - 6}
            textAnchor="middle" fontSize="11" fontWeight="600"
            fill={s.color} fontFamily="var(--font-ui)">
            {s.label}
          </text>
          <text x={s.x + BOX_W / 2} y={CY + 10}
            textAnchor="middle" fontSize="9"
            fill="var(--tx3)" fontFamily="var(--font-ui)">
            {s.detail}
          </text>
        </g>
      ))}

      {/* Final label */}
      <text x={422 + BOX_W / 2} y={CY + 4}
        textAnchor="middle" fontSize="11" fontWeight="700"
        fill="var(--c-commit)" fontFamily="var(--font-ui)">
        → Answer
      </text>

      {/* Context bar below step 4 */}
      <rect x={372} y={CY + BOX_H / 2 + 4} width={BOX_W} height={14} rx="2"
        fill="var(--c-commit)" opacity="0.12" stroke="var(--c-commit)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x={372 + BOX_W / 2} y={CY + BOX_H / 2 + 14}
        textAnchor="middle" fontSize="8.5" fill="var(--tx3)" fontFamily="var(--font-ui)">
        chunks injected into prompt
      </text>
    </svg>
  );
}
