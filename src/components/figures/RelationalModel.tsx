/*
 * Static diagram (M4): the relational model in one picture. Two relations —
 * customers (1) and orders (N) — drawn as grids so the vocabulary is visible at a
 * glance: relation = table, tuple = row, attribute = column, domain = a column's type.
 * The primary key (customers.customer_id) is tinted blue; the foreign key
 * (orders.customer_id) is tinted amber; the arrow is the reference, labelled 1 : N.
 */
const ROW_H = 26;
const HEAD_H = 28;

type TableSpec = {
  x: number;
  y: number;
  name: string;
  cols: { label: string; w: number }[];
  rows: string[][];
  pkCol: number;
  fkCol?: number;
};

const customers: TableSpec = {
  x: 44,
  y: 84,
  name: 'customers',
  cols: [
    { label: 'customer_id', w: 96 },
    { label: 'name', w: 72 },
    { label: 'city', w: 52 },
  ],
  rows: [
    ['7', 'Priya', 'Kyiv'],
    ['8', 'Lee', 'Lviv'],
  ],
  pkCol: 0,
};

const orders: TableSpec = {
  x: 380,
  y: 84,
  name: 'orders',
  cols: [
    { label: 'order_id', w: 70 },
    { label: 'customer_id', w: 96 },
    { label: 'total', w: 50 },
  ],
  rows: [
    ['100', '7', '980'],
    ['101', '7', '640'],
    ['102', '8', '120'],
  ],
  pkCol: 0,
  fkCol: 1,
};

function colX(t: TableSpec, i: number): number {
  return t.x + t.cols.slice(0, i).reduce((s, c) => s + c.w, 0);
}
function tableW(t: TableSpec): number {
  return t.cols.reduce((s, c) => s + c.w, 0);
}

function Table({ t }: { t: TableSpec }) {
  const w = tableW(t);
  const bodyTop = t.y + HEAD_H + ROW_H; // below title + column-name row
  return (
    <g>
      {/* column tints (PK / FK) run down the name row + data rows */}
      {t.cols.map((c, i) => {
        const tint = i === t.pkCol ? 'var(--accent-soft)' : i === t.fkCol ? 'var(--c-analytics-soft)' : null;
        if (!tint) return null;
        return (
          <rect
            key={`tint-${c.label}`}
            x={colX(t, i)}
            y={t.y + HEAD_H}
            width={c.w}
            height={ROW_H * (t.rows.length + 1)}
            fill={tint}
          />
        );
      })}

      {/* title */}
      <rect x={t.x} y={t.y} width={w} height={HEAD_H} rx="7" fill="var(--s2)" stroke="var(--line2)" />
      <text
        x={t.x + 10}
        y={t.y + HEAD_H / 2 + 4.5}
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight={700}
        fill="var(--accent-bright)"
      >
        {t.name}
      </text>

      {/* column-name row */}
      {t.cols.map((c, i) => (
        <text
          key={`h-${c.label}`}
          x={colX(t, i) + 8}
          y={t.y + HEAD_H + ROW_H / 2 + 4}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fontWeight={600}
          fill="var(--tx2)"
        >
          {c.label}
        </text>
      ))}

      {/* data rows */}
      {t.rows.map((r, ri) =>
        r.map((cell, ci) => (
          <text
            key={`d-${ri}-${ci}`}
            x={colX(t, ci) + 8}
            y={bodyTop + ri * ROW_H + ROW_H / 2 + 4}
            fontFamily="var(--font-mono)"
            fontSize="11.5"
            fill="var(--tx)"
          >
            {cell}
          </text>
        )),
      )}

      {/* grid outline + horizontal separators */}
      <rect
        x={t.x}
        y={t.y + HEAD_H}
        width={w}
        height={ROW_H * (t.rows.length + 1)}
        fill="none"
        stroke="var(--line2)"
      />
      {Array.from({ length: t.rows.length + 1 }, (_, i) => (
        <line
          key={`sep-${i}`}
          x1={t.x}
          y1={t.y + HEAD_H + i * ROW_H}
          x2={t.x + w}
          y2={t.y + HEAD_H + i * ROW_H}
          stroke="var(--line)"
        />
      ))}
    </g>
  );
}

export function RelationalModel() {
  const fkX = colX(orders, orders.fkCol!) + orders.cols[orders.fkCol!].w / 2;
  const fkY = orders.y + HEAD_H + ROW_H / 2;
  const pkX = colX(customers, customers.pkCol) + customers.cols[customers.pkCol].w / 2;
  const pkY = customers.y + HEAD_H + ROW_H / 2;

  return (
    <svg
      viewBox="0 0 640 300"
      width="100%"
      role="img"
      aria-label="Two relations. customers has a primary key customer_id; orders has its own primary key order_id plus a foreign key customer_id that references customers. One customer relates to many orders — a one-to-many relationship."
      style={{ maxWidth: 640 }}
    >
      <title>The relational model — relations, keys, and a 1:N relationship</title>

      <Table t={customers} />
      <Table t={orders} />

      {/* foreign-key reference arrow: orders.customer_id → customers.customer_id */}
      <path
        d={`M ${fkX} ${fkY} C ${fkX} 34, ${pkX} 34, ${pkX} ${pkY}`}
        fill="none"
        stroke="var(--c-analytics)"
        strokeWidth="1.6"
        markerEnd="url(#rm-arrow)"
      />
      <text x={(fkX + pkX) / 2} y="26" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--c-analytics)">
        foreign key → primary key · 1 : N
      </text>

      {/* legend */}
      <g fontFamily="var(--font-body)" fontSize="11" fill="var(--tx2)">
        <rect x="44" y="262" width="14" height="12" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" />
        <text x="64" y="272">primary key — unique, identifies each row</text>
        <rect x="380" y="262" width="14" height="12" rx="2" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" />
        <text x="400" y="272">foreign key — references another row</text>
      </g>

      <defs>
        <marker id="rm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-analytics)" />
        </marker>
      </defs>
    </svg>
  );
}
