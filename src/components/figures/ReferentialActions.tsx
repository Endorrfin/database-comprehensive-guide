/*
 * Static diagram (M8): referential actions. The parent row customers.id = 7 (Dana) is being
 * deleted; two orders reference it via a foreign key. What happens to those child rows depends
 * entirely on the FK's ON DELETE action — shown as three outcome chips:
 *   • RESTRICT / NO ACTION → the delete is BLOCKED (children still point at Dana)
 *   • CASCADE             → the child orders are deleted too
 *   • SET NULL            → the orders survive, but their customer_id becomes NULL
 * The motivating picture for "a foreign key is a promise the database keeps for you."
 * Labels stay English; the bilingual gloss lives in the figure caption + module prose.
 */
type Mini = { name: string; cols: string[]; w: number[]; rows: string[][] };

const PARENT: Mini = {
  name: 'customers',
  cols: ['id', 'name'],
  w: [40, 92],
  rows: [
    ['5', 'Mai'],
    ['7', 'Dana'],
    ['9', 'Ola'],
  ],
};
const PARENT_DEL = 1; // row index being deleted (id = 7)

const CHILD: Mini = {
  name: 'orders',
  cols: ['id', 'customer_id', 'total'],
  w: [44, 100, 60],
  rows: [
    ['101', '7', '$40'],
    ['102', '7', '$25'],
    ['103', '9', '$12'],
  ],
};
const CHILD_REF = new Set([0, 1]); // rows whose customer_id = 7

const HEAD_H = 24;
const ROW_H = 24;

const ACTIONS: { tag: string; text: string; accent: string }[] = [
  { tag: 'RESTRICT / NO ACTION', text: 'delete is blocked — children still reference Dana', accent: 'var(--c-danger)' },
  { tag: 'CASCADE', text: 'orders 101 & 102 are deleted along with her', accent: 'var(--c-storage)' },
  { tag: 'SET NULL', text: 'orders survive; their customer_id becomes NULL', accent: 'var(--c-analytics)' },
];

function tableWidth(m: Mini): number {
  return m.w.reduce((s, x) => s + x, 0);
}

function MiniTable({ m, x, y, delRow, refRows }: { m: Mini; x: number; y: number; delRow?: number; refRows?: Set<number> }) {
  const tw = tableWidth(m);
  const colX = (i: number) => x + m.w.slice(0, i).reduce((s, c) => s + c, 0);
  const bodyTop = y + HEAD_H + ROW_H; // below title + column-name row
  return (
    <g>
      {/* deleted-row tint */}
      {delRow !== undefined && (
        <rect x={x} y={y + HEAD_H + ROW_H + delRow * ROW_H} width={tw} height={ROW_H} fill="var(--c-danger-soft)" />
      )}
      {/* title bar */}
      <rect x={x} y={y} width={tw} height={HEAD_H} rx="7" fill="var(--s2)" stroke="var(--line2)" />
      <text x={x + 9} y={y + HEAD_H / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill="var(--accent-bright)">
        {m.name}
      </text>
      {/* column-name row */}
      {m.cols.map((c, i) => (
        <text key={`h-${m.name}-${c}`} x={colX(i) + 7} y={y + HEAD_H + ROW_H / 2 + 4} fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={600} fill="var(--tx2)">
          {c}
        </text>
      ))}
      {/* data cells */}
      {m.rows.map((r, ri) =>
        r.map((cell, ci) => {
          const isDel = ri === delRow;
          const isRef = ci === 1 && refRows?.has(ri);
          return (
            <text
              key={`d-${m.name}-${ri}-${ci}`}
              x={colX(ci) + 7}
              y={bodyTop + ri * ROW_H + ROW_H / 2 + 4}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight={isRef ? 700 : 400}
              fill={isDel ? 'var(--c-danger)' : isRef ? 'var(--accent-bright)' : 'var(--tx)'}
              textDecoration={isDel ? 'line-through' : undefined}
            >
              {cell}
            </text>
          );
        }),
      )}
      {/* grid */}
      <rect x={x} y={y + HEAD_H} width={tw} height={ROW_H * (m.rows.length + 1)} fill="none" stroke="var(--line2)" />
      {Array.from({ length: m.rows.length + 2 }, (_, i) => (
        <line key={`sep-${m.name}-${i}`} x1={x} y1={y + HEAD_H + i * ROW_H} x2={x + tw} y2={y + HEAD_H + i * ROW_H} stroke="var(--line)" />
      ))}
    </g>
  );
}

export function ReferentialActions() {
  const px = 36;
  const py = 36;
  const cx = 360;
  const parentW = tableWidth(PARENT);
  // FK arrow: from the orders.customer_id column header back to the customers.id column.
  const arrowFromX = cx; // left edge of child table
  const arrowFromY = py + HEAD_H + ROW_H + PARENT_DEL * ROW_H + ROW_H / 2;
  const arrowToX = px + parentW;
  const arrowToY = arrowFromY;

  return (
    <svg
      viewBox="0 0 640 320"
      width="100%"
      role="img"
      aria-label="Deleting the parent row customers.id = 7 (Dana), which two orders reference through a foreign key, plays out three ways depending on the ON DELETE action: RESTRICT or NO ACTION blocks the delete because children still reference her; CASCADE deletes orders 101 and 102 along with her; SET NULL keeps the orders but sets their customer_id to NULL."
      style={{ maxWidth: 640 }}
    >
      <title>Referential actions: what ON DELETE does to child rows</title>

      <defs>
        <marker id="ra-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
        </marker>
      </defs>

      <MiniTable m={PARENT} x={px} y={py} delRow={PARENT_DEL} />
      <MiniTable m={CHILD} x={cx} y={py} refRows={CHILD_REF} />

      {/* FK arrow child → parent */}
      <path
        d={`M ${arrowFromX} ${arrowFromY} C ${arrowFromX - 30} ${arrowFromY + 26}, ${arrowToX + 30} ${arrowToY + 26}, ${arrowToX + 3} ${arrowToY}`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.6"
        markerEnd="url(#ra-arrow)"
      />
      <text x={(arrowFromX + arrowToX) / 2} y={arrowToY + 40} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--tx3)">
        FK: orders.customer_id → customers.id
      </text>

      {/* delete label */}
      <text x={px + parentW / 2} y={py - 8} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--c-danger)">
        DELETE customers WHERE id = 7
      </text>

      {/* outcome chips */}
      {ACTIONS.map((a, i) => {
        const cardY = 226;
        const cardX = px + i * 194;
        return (
          <g key={a.tag}>
            <rect x={cardX} y={cardY} width="180" height="64" rx="8" fill="var(--surface)" stroke="var(--line2)" />
            <rect x={cardX} y={cardY} width="5" height="64" rx="2" fill={a.accent} />
            <text x={cardX + 15} y={cardY + 21} fontFamily="var(--font-mono)" fontSize="11" fontWeight={700} fill={a.accent}>
              ON DELETE
            </text>
            <text x={cardX + 15} y={cardY + 35} fontFamily="var(--font-mono)" fontSize="10.5" fontWeight={700} fill={a.accent}>
              {a.tag}
            </text>
            <text x={cardX + 15} y={cardY + 51} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx2)">
              {wrap(a.text)[0]}
            </text>
            <text x={cardX + 15} y={cardY + 62} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx2)">
              {wrap(a.text)[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Split a short chip sentence onto two balanced lines (deterministic by word count). */
function wrap(text: string): [string, string] {
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
