import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';

/*
 * ★ ER explorer (M6, signature/light). One relationship between two entities; flip the
 * cardinality (1:1 · 1:N · M:N) and watch the *resulting relational schema* change —
 * the foreign key moves to the "many" side, and for M:N a junction table appears.
 * This is the cardinality → schema mapping rule made visible (Chen 1976 → PostgreSQL FKs).
 * Deterministic, toggle-driven, ARIA live region; no engine. Names stay English.
 */
type Card = '1:1' | '1:N' | 'M:N';
type Badge = 'PK' | 'FK' | 'PK·FK' | 'UNIQUE';
type Col = { name: string; badge?: Badge };
type Tbl = { name: string; cols: Col[]; isNew?: boolean };

type Scenario = {
  left: string;
  right: string;
  verb: Localized;
  leftMany: boolean;
  rightMany: boolean;
  tables: Tbl[];
  rule: Localized;
};

const SCENARIOS: Record<Card, Scenario> = {
  '1:1': {
    left: 'Person',
    right: 'Passport',
    verb: { en: 'holds', uk: 'має' },
    leftMany: false,
    rightMany: false,
    tables: [
      { name: 'person', cols: [{ name: 'person_id', badge: 'PK' }, { name: 'full_name' }] },
      {
        name: 'passport',
        cols: [
          { name: 'passport_id', badge: 'PK' },
          { name: 'person_id', badge: 'UNIQUE' },
          { name: 'number' },
        ],
      },
    ],
    rule: {
      en: '1:1 → put the foreign key on either side and mark it UNIQUE (or fold both entities into one table).',
      uk: '1:1 → поставте foreign key на будь-який бік і позначте його UNIQUE (або злийте обидві entity в одну table).',
    },
  },
  '1:N': {
    left: 'Customer',
    right: 'Order',
    verb: { en: 'places', uk: 'розміщує' },
    leftMany: false,
    rightMany: true,
    tables: [
      { name: 'customer', cols: [{ name: 'customer_id', badge: 'PK' }, { name: 'name' }] },
      {
        name: 'order',
        cols: [
          { name: 'order_id', badge: 'PK' },
          { name: 'customer_id', badge: 'FK' },
          { name: 'total' },
        ],
      },
    ],
    rule: {
      en: '1:N → the foreign key always goes on the many side. One customer, many orders → order.customer_id.',
      uk: '1:N → foreign key завжди на боці «багато». Один customer, багато orders → order.customer_id.',
    },
  },
  'M:N': {
    left: 'Student',
    right: 'Course',
    verb: { en: 'enrolls in', uk: 'записаний на' },
    leftMany: true,
    rightMany: true,
    tables: [
      { name: 'student', cols: [{ name: 'student_id', badge: 'PK' }, { name: 'name' }] },
      {
        name: 'enrollment',
        isNew: true,
        cols: [
          { name: 'student_id', badge: 'PK·FK' },
          { name: 'course_id', badge: 'PK·FK' },
          { name: 'grade' },
        ],
      },
      { name: 'course', cols: [{ name: 'course_id', badge: 'PK' }, { name: 'title' }] },
    ],
    rule: {
      en: 'M:N → no single FK can hold it. Introduce a junction table with a foreign key to each side.',
      uk: 'M:N → жоден один FK його не вмістить. Додайте junction table з foreign key до кожного боку.',
    },
  },
};

const CARDS: Card[] = ['1:1', '1:N', 'M:N'];

/** A cardinality ending on a connector: a "one" bar or a "many" crow's foot, pointing at the entity. */
function End({ x, y, dir, many }: { x: number; y: number; dir: 1 | -1; many: boolean }) {
  const tip = x - dir * 16; // a little away from the entity edge
  if (many) {
    return (
      <g stroke="var(--accent-bright)" strokeWidth="1.8" fill="none">
        <line x1={tip} y1={y} x2={x} y2={y - 9} />
        <line x1={tip} y1={y} x2={x} y2={y} />
        <line x1={tip} y1={y} x2={x} y2={y + 9} />
      </g>
    );
  }
  return <line x1={tip} y1={y - 8} x2={tip} y2={y + 8} stroke="var(--accent-bright)" strokeWidth="1.8" />;
}

function BadgeTag({ badge }: { badge: Badge }) {
  const cls =
    badge === 'PK'
      ? 'er-badge--pk'
      : badge === 'FK'
        ? 'er-badge--fk'
        : badge === 'PK·FK'
          ? 'er-badge--pkfk'
          : 'er-badge--uq';
  return <span className={`er-badge ${cls}`}>{badge}</span>;
}

export function ErExplorer() {
  const { t } = useLang();
  const [card, setCard] = useState<Card>('1:N');
  const liveRef = useRef<HTMLParagraphElement>(null);
  const sc = SCENARIOS[card];

  const status = useMemo(() => {
    const fk =
      card === 'M:N'
        ? t({ en: 'a junction table appears', uk: 'зʼявляється junction table' })
        : card === '1:1'
          ? t({ en: 'one UNIQUE foreign key', uk: 'один UNIQUE foreign key' })
          : t({ en: 'foreign key on the many side', uk: 'foreign key на боці «багато»' });
    return `${sc.left} ${t(sc.verb)} ${sc.right} · ${card} → ${fk}`;
  }, [card, sc, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  // Diagram geometry (viewBox 0 0 460 132)
  const midY = 56;
  const leftEdge = 168; // right edge of left entity box
  const rightEdge = 292; // left edge of right entity box

  return (
    <section className="sim er-sim" aria-label="ER cardinality explorer">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Relationship cardinality">
          {CARDS.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={card === c}
              className={card === c ? 'seg-on' : ''}
              onClick={() => setCard(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="er-verb dim">
          {sc.left} <em>{t(sc.verb)}</em> {sc.right}
        </span>
      </div>

      <div className="sim-stage-wrap">
        <svg viewBox="0 0 460 132" width="100%" role="img" aria-label={status} style={{ maxWidth: 460 }}>
          {/* connector */}
          <line x1={leftEdge} y1={midY} x2={rightEdge} y2={midY} stroke="var(--line2)" strokeWidth="1.6" />
          <End x={leftEdge} y={midY} dir={-1} many={sc.leftMany} />
          <End x={rightEdge} y={midY} dir={1} many={sc.rightMany} />

          {/* relationship verb */}
          <text x={230} y={midY - 12} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--c-commit)">
            {t(sc.verb)}
          </text>

          {/* left entity */}
          <rect x="44" y={midY - 22} width="124" height="44" rx="7" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
          <text x="106" y={midY + 5} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight={700} fill="var(--tx)">
            {sc.left}
          </text>

          {/* right entity */}
          <rect x="292" y={midY - 22} width="124" height="44" rx="7" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
          <text x="354" y={midY + 5} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight={700} fill="var(--tx)">
            {sc.right}
          </text>

          {/* cardinality labels under each end */}
          <text x="150" y={midY + 36} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--accent-bright)">
            {sc.leftMany ? 'N' : '1'}
          </text>
          <text x="310" y={midY + 36} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--accent-bright)">
            {sc.rightMany ? 'N' : '1'}
          </text>
        </svg>
      </div>

      <div className="er-schema-head dim">{t({ en: 'Resulting relational schema', uk: 'Отримана реляційна схема' })}</div>
      <div className="er-schema">
        {sc.tables.map((tbl) => (
          <div key={tbl.name} className={`er-table${tbl.isNew ? ' er-table--new' : ''}`}>
            <div className="er-table-name mono">
              {tbl.name}
              {tbl.isNew && <span className="er-new-tag">{t({ en: 'new', uk: 'нова' })}</span>}
            </div>
            <ul className="er-cols">
              {tbl.cols.map((col) => (
                <li key={col.name} className="er-col">
                  <span className="mono">{col.name}</span>
                  {col.badge && <BadgeTag badge={col.badge} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="er-rule">{t(sc.rule)}</p>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          <i className="er-badge er-badge--pk">PK</i> primary key
        </span>
        <span>
          <i className="er-badge er-badge--fk">FK</i> foreign key
        </span>
        <span className="dim">crow&apos;s foot = the &ldquo;many&rdquo; end</span>
      </div>
    </section>
  );
}
