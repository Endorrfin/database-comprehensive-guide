import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';

/*
 * ★ Index access-path picker (M14, signature/light). Pick a query SHAPE and watch which index
 * type serves it (best), tolerates it (works), or cannot (no) — the module's core skill made
 * interactive: match the index to the shape of the query, not to habit. Toggle-driven and fully
 * deterministic (no animation loop → inherently prefers-reduced-motion safe); ARIA live region
 * announces the recommendation. Verdicts are web-verified PostgreSQL 18 facts (see M14 sources).
 * Index/operator names stay English; only the explanation ("why") is bilingual.
 */
type Shape = 'eq' | 'range' | 'contains' | 'fts' | 'prefix' | 'substr';
type Verdict = 'best' | 'ok' | 'no';
type IdxKey = 'btree' | 'hash' | 'gin' | 'gist' | 'brin' | 'trgm';

const INDEXES: { key: IdxKey; label: string }[] = [
  { key: 'btree', label: 'B-Tree' },
  { key: 'hash', label: 'Hash' },
  { key: 'gin', label: 'GIN' },
  { key: 'gist', label: 'GiST' },
  { key: 'brin', label: 'BRIN' },
  { key: 'trgm', label: 'Trigram' },
];

type ShapeDef = {
  key: Shape;
  tab: string; // compact label for the segmented control
  name: Localized; // human name of the query shape
  sql: string; // the predicate
  verdicts: Record<IdxKey, Verdict>;
  best: IdxKey;
  ddl: string;
  why: Localized;
};

const SHAPES: ShapeDef[] = [
  {
    key: 'eq',
    tab: '=',
    name: { en: 'Equality', uk: 'Рівність' },
    sql: "WHERE email = 'a@b.com'",
    verdicts: { btree: 'best', hash: 'ok', gin: 'no', gist: 'no', brin: 'no', trgm: 'no' },
    best: 'btree',
    ddl: 'CREATE INDEX ON users (email);',
    why: {
      en: 'B-Tree serves equality in a few hops and far more; a hash index also does pure equality but nothing ordered.',
      uk: 'B-Tree обслуговує рівність за кілька стрибків і набагато більше; hash теж робить чисту рівність, але нічого впорядкованого.',
    },
  },
  {
    key: 'range',
    tab: '< >',
    name: { en: 'Range / sort', uk: 'Діапазон / сортування' },
    sql: 'WHERE created_at > $1 ORDER BY created_at',
    verdicts: { btree: 'best', hash: 'no', gin: 'no', gist: 'ok', brin: 'ok', trgm: 'no' },
    best: 'btree',
    ddl: 'CREATE INDEX ON events (created_at);',
    why: {
      en: 'Ranges and ORDER BY need ordered keys — a B-Tree. On a huge, physically-ordered table a tiny BRIN is an alternative.',
      uk: 'Діапазони й ORDER BY потребують упорядкованих ключів — це B-Tree. На величезній, фізично впорядкованій таблиці крихітний BRIN — альтернатива.',
    },
  },
  {
    key: 'contains',
    tab: '@>',
    name: { en: 'Containment (array / jsonb)', uk: 'Containment (array / jsonb)' },
    sql: "WHERE tags @> '[\"sale\"]'",
    verdicts: { btree: 'no', hash: 'no', gin: 'best', gist: 'ok', brin: 'no', trgm: 'no' },
    best: 'gin',
    ddl: 'CREATE INDEX ON products USING gin (tags);',
    why: {
      en: 'Containment asks which rows hold an element — an inverted GIN index, never a B-Tree on the whole value.',
      uk: 'Containment питає, які рядки містять елемент — це інвертований GIN-index, а не B-Tree по всьому значенню.',
    },
  },
  {
    key: 'fts',
    tab: 'FTS',
    name: { en: 'Full-text search', uk: 'Повнотекстовий пошук' },
    sql: "WHERE doc @@ to_tsquery('cat')",
    verdicts: { btree: 'no', hash: 'no', gin: 'best', gist: 'ok', brin: 'no', trgm: 'no' },
    best: 'gin',
    ddl: "CREATE INDEX ON docs USING gin (to_tsvector('english', body));",
    why: {
      en: 'Full-text matches lexemes with @@; index the tsvector with GIN (GiST is a smaller, lossy alternative).',
      uk: 'Full-text зіставляє lexemes через @@; індексуйте tsvector через GIN (GiST — менша, lossy альтернатива).',
    },
  },
  {
    key: 'prefix',
    tab: 'a%',
    name: { en: 'Anchored prefix', uk: 'Закріплений префікс' },
    sql: "WHERE name LIKE 'Ann%'",
    verdicts: { btree: 'best', hash: 'no', gin: 'no', gist: 'no', brin: 'no', trgm: 'ok' },
    best: 'btree',
    ddl: 'CREATE INDEX ON people (name text_pattern_ops);',
    why: {
      en: 'An anchored prefix is a range, so a B-Tree (text_pattern_ops or C locale) serves it; a trigram index also works.',
      uk: 'Закріплений префікс — це діапазон, тож B-Tree (text_pattern_ops чи C locale) його обслуговує; trigram-index теж працює.',
    },
  },
  {
    key: 'substr',
    tab: '%a%',
    name: { en: 'Substring / fuzzy', uk: 'Підрядок / fuzzy' },
    sql: "WHERE name ILIKE '%ann%'",
    verdicts: { btree: 'no', hash: 'no', gin: 'no', gist: 'no', brin: 'no', trgm: 'best' },
    best: 'trgm',
    ddl: 'CREATE INDEX ON people USING gin (name gin_trgm_ops);',
    why: {
      en: "A leading wildcard can't use a B-Tree; a pg_trgm trigram (GIN/GiST) index makes substring and fuzzy matches indexable.",
      uk: 'Провідний шаблон не може вжити B-Tree; trigram-index pg_trgm (GIN/GiST) робить підрядкові й fuzzy зіставлення індексованими.',
    },
  },
];

const VERDICT_WORD: Record<Verdict, Localized> = {
  best: { en: 'best', uk: 'найкраще' },
  ok: { en: 'works', uk: 'працює' },
  no: { en: 'no', uk: 'ні' },
};

export function IndexPicker() {
  const { t } = useLang();
  const [shapeKey, setShapeKey] = useState<Shape>('eq');
  const liveRef = useRef<HTMLParagraphElement>(null);
  const shape = useMemo(() => SHAPES.find((s) => s.key === shapeKey)!, [shapeKey]);
  const bestLabel = INDEXES.find((i) => i.key === shape.best)!.label;

  const status = useMemo(
    () =>
      `${t(shape.name)} · ${shape.sql} → ${t({ en: 'best index', uk: 'найкращий index' })}: ${bestLabel}`,
    [shape, bestLabel, t],
  );

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim idx-sim" aria-label="Index access-path picker">
      <div className="sim-bar">
        <div className="seg idx-seg" role="tablist" aria-label="Query shape">
          {SHAPES.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={shapeKey === s.key}
              className={shapeKey === s.key ? 'seg-on' : ''}
              title={t(s.name)}
              onClick={() => setShapeKey(s.key)}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <span className="idx-shape-name dim">{t(shape.name)}</span>
      </div>

      <div className="idx-query mono" aria-label="query predicate">
        {shape.sql}
      </div>

      <div className="idx-grid" role="list">
        {INDEXES.map((idx) => {
          const v = shape.verdicts[idx.key];
          return (
            <div
              key={idx.key}
              role="listitem"
              className={`idx-cell idx-cell--${v}`}
              aria-label={`${idx.label}: ${t(VERDICT_WORD[v])}`}
            >
              <span className="idx-cell-name mono">{idx.label}</span>
              <span className="idx-cell-verdict">{t(VERDICT_WORD[v])}</span>
            </div>
          );
        })}
      </div>

      <div className="idx-rec">
        <div className="idx-rec-head">
          {t({ en: 'Use a', uk: 'Беріть' })} <strong className="mono">{bestLabel}</strong>{' '}
          {t({ en: 'index', uk: 'index' })}
        </div>
        <code className="idx-rec-ddl mono">{shape.ddl}</code>
        <p className="idx-why">{t(shape.why)}</p>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          <i className="dot idx-dot--best" /> {t({ en: 'best fit', uk: 'найкраще' })}
        </span>
        <span>
          <i className="dot idx-dot--ok" /> {t({ en: 'works', uk: 'працює' })}
        </span>
        <span>
          <i className="dot idx-dot--no" /> {t({ en: 'cannot serve it', uk: 'не обслуговує' })}
        </span>
      </div>
    </section>
  );
}
