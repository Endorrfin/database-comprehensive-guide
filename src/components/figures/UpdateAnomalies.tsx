/*
 * Static diagram (M7): why redundancy hurts. One denormalized `enrollments` table stores
 * the same fact — "Dr. Lee's office is R210" — on every row (tinted red). That single
 * duplicated fact is the source of the three classic anomalies shown below the table:
 * insert, update, and delete. It is the motivation for normalization ("one fact, one place").
 * Labels stay English; the bilingual gloss lives in the figure caption and module prose.
 */
const COLS = [
  { label: 'student', w: 84 },
  { label: 'advisor', w: 92 },
  { label: 'advisor_room', w: 116 },
  { label: 'course', w: 82 },
];
const ROWS = [
  ['Priya', 'Dr. Lee', 'R210', 'DB101'],
  ['Priya', 'Dr. Lee', 'R210', 'OS201'],
  ['Ihor', 'Dr. Lee', 'R210', 'DB101'],
];
const REDUNDANT = new Set([1, 2]); // advisor, advisor_room repeat the same fact every row

const X0 = 40;
const Y0 = 40;
const HEAD_H = 26;
const ROW_H = 26;
const TABLE_W = COLS.reduce((s, c) => s + c.w, 0);

function colX(i: number): number {
  return X0 + COLS.slice(0, i).reduce((s, c) => s + c.w, 0);
}

const ANOMALIES: { tag: string; text: string; accent: string }[] = [
  { tag: 'Insert', text: "can't record a new advisor's room until a student enrolls", accent: 'var(--c-analytics)' },
  { tag: 'Update', text: "move Dr. Lee's office → you must rewrite every matching row", accent: 'var(--c-danger)' },
  { tag: 'Delete', text: 'remove the last enrollment → the room is lost with it', accent: 'var(--c-storage)' },
];

export function UpdateAnomalies() {
  const bodyTop = Y0 + HEAD_H + ROW_H; // below title + column-name row

  return (
    <svg
      viewBox="0 0 640 300"
      width="100%"
      role="img"
      aria-label="A single denormalized enrollments table stores advisor and advisor_room redundantly on every row. Because the fact 'Dr. Lee is in room R210' is duplicated, it causes three anomalies: an insert anomaly (cannot record an advisor's room with no student), an update anomaly (changing the room means rewriting every row), and a delete anomaly (deleting the last enrollment loses the room)."
      style={{ maxWidth: 640 }}
    >
      <title>Update, insert and delete anomalies from a duplicated fact</title>

      {/* redundant-column tints */}
      {COLS.map((c, i) =>
        REDUNDANT.has(i) ? (
          <rect
            key={`tint-${c.label}`}
            x={colX(i)}
            y={Y0 + HEAD_H}
            width={c.w}
            height={ROW_H * (ROWS.length + 1)}
            fill="var(--c-danger-soft)"
          />
        ) : null,
      )}

      {/* title bar */}
      <rect x={X0} y={Y0} width={TABLE_W} height={HEAD_H} rx="7" fill="var(--s2)" stroke="var(--line2)" />
      <text x={X0 + 10} y={Y0 + HEAD_H / 2 + 4.5} fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--accent-bright)">
        enrollments
      </text>

      {/* column-name row */}
      {COLS.map((c, i) => (
        <text key={`h-${c.label}`} x={colX(i) + 8} y={Y0 + HEAD_H + ROW_H / 2 + 4} fontFamily="var(--font-mono)" fontSize="11" fontWeight={600} fill="var(--tx2)">
          {c.label}
        </text>
      ))}

      {/* data rows */}
      {ROWS.map((r, ri) =>
        r.map((cell, ci) => (
          <text
            key={`d-${ri}-${ci}`}
            x={colX(ci) + 8}
            y={bodyTop + ri * ROW_H + ROW_H / 2 + 4}
            fontFamily="var(--font-mono)"
            fontSize="11.5"
            fontWeight={REDUNDANT.has(ci) ? 700 : 400}
            fill={REDUNDANT.has(ci) ? 'var(--c-danger)' : 'var(--tx)'}
          >
            {cell}
          </text>
        )),
      )}

      {/* grid outline + horizontal separators */}
      <rect x={X0} y={Y0 + HEAD_H} width={TABLE_W} height={ROW_H * (ROWS.length + 1)} fill="none" stroke="var(--line2)" />
      {Array.from({ length: ROWS.length + 2 }, (_, i) => (
        <line key={`sep-${i}`} x1={X0} y1={Y0 + HEAD_H + i * ROW_H} x2={X0 + TABLE_W} y2={Y0 + HEAD_H + i * ROW_H} stroke="var(--line)" />
      ))}

      {/* "same fact, stored 3×" caption pointing at the tinted block */}
      <text x={colX(2) + COLS[2].w / 2} y={Y0 + HEAD_H + ROW_H * (ROWS.length + 1) + 18} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fill="var(--c-danger)">
        one fact — &ldquo;Dr. Lee → R210&rdquo; — stored 3×
      </text>

      {/* anomaly chips */}
      {ANOMALIES.map((a, i) => {
        const cardY = 214;
        const cardX = X0 + i * 194;
        return (
          <g key={a.tag}>
            <rect x={cardX} y={cardY} width="180" height="62" rx="8" fill="var(--surface)" stroke="var(--line2)" />
            <rect x={cardX} y={cardY} width="5" height="62" rx="2" fill={a.accent} />
            <text x={cardX + 16} y={cardY + 22} fontFamily="var(--font-display)" fontSize="13" fontWeight={700} fill={a.accent}>
              {a.tag} anomaly
            </text>
            <text x={cardX + 16} y={cardY + 40} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx2)">
              {wrap(a.text)[0]}
            </text>
            <text x={cardX + 16} y={cardY + 53} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx2)">
              {wrap(a.text)[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Split a short chip sentence onto two balanced lines (no measuring; deterministic by word count). */
function wrap(text: string): [string, string] {
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
