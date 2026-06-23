import { useState } from 'react';
import { modulesBySection, sections } from '../../data/concepts';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule, navigate } from '../../lib/hashRouter';
import { Drawer } from './Drawer';

type Family = {
  id: string;
  name: Localized;
  when: Localized;
  engines: string[];
  color: string;
  moduleId: string;
};

const FAMILIES: Family[] = [
  {
    id: 'relational',
    name: { en: 'Relational', uk: 'Relational' },
    when: {
      en: 'Strong consistency, joins, ad-hoc queries, ACID — the safe default.',
      uk: 'Сувора consistency, joins, ad-hoc запити, ACID — безпечний default.',
    },
    engines: ['PostgreSQL', 'MySQL', 'SQLite'],
    color: 'var(--e-postgres)',
    moduleId: 'm4-relational-model',
  },
  {
    id: 'document',
    name: { en: 'Document', uk: 'Document' },
    when: {
      en: 'Flexible, nested data you read together as one object.',
      uk: 'Гнучкі, вкладені дані, які читаєте разом як один обʼєкт.',
    },
    engines: ['MongoDB'],
    color: 'var(--e-mongodb-bright)',
    moduleId: 'm25-document',
  },
  {
    id: 'kv',
    name: { en: 'Key-value', uk: 'Key-value' },
    when: {
      en: 'Lowest-latency lookups, caching, counters, queues.',
      uk: 'Найнижча latency для пошуку, кешування, лічильники, черги.',
    },
    engines: ['Redis', 'Valkey'],
    color: 'var(--e-redis)',
    moduleId: 'm26-key-value',
  },
  {
    id: 'wide-column',
    name: { en: 'Wide-column', uk: 'Wide-column' },
    when: {
      en: 'Write-heavy workloads at linear, horizontal scale.',
      uk: 'Write-heavy навантаження з лінійним горизонтальним масштабом.',
    },
    engines: ['Cassandra', 'ScyllaDB'],
    color: 'var(--e-cassandra)',
    moduleId: 'm27-wide-column',
  },
  {
    id: 'graph',
    name: { en: 'Graph', uk: 'Graph' },
    when: {
      en: 'When the relationships between entities are the data.',
      uk: 'Коли звʼязки між сутностями і є даними.',
    },
    engines: ['Neo4j'],
    color: 'var(--c-storage)',
    moduleId: 'm28-graph',
  },
  {
    id: 'vector',
    name: { en: 'Vector', uk: 'Vector' },
    when: {
      en: 'Semantic / similarity search for AI and RAG.',
      uk: 'Семантичний / similarity пошук для AI та RAG.',
    },
    engines: ['pgvector', 'Qdrant', 'Milvus'],
    color: 'var(--e-vector)',
    moduleId: 'm29-vector',
  },
  {
    id: 'timeseries',
    name: { en: 'Time-series', uk: 'Time-series' },
    when: {
      en: 'Append-only metrics and events with time-based queries.',
      uk: 'Append-only метрики та події з запитами за часом.',
    },
    engines: ['TimescaleDB', 'InfluxDB'],
    color: 'var(--c-analytics)',
    moduleId: 'm31-analytics',
  },
  {
    id: 'olap',
    name: { en: 'Analytics / columnar', uk: 'Analytics / columnar' },
    when: {
      en: 'Large scans and aggregations over many rows (OLAP).',
      uk: 'Великі scans та агрегації над багатьма рядками (OLAP).',
    },
    engines: ['ClickHouse', 'DuckDB'],
    color: 'var(--e-clickhouse)',
    moduleId: 'm31-analytics',
  },
  {
    id: 'search',
    name: { en: 'Search', uk: 'Search' },
    when: {
      en: 'Relevance-ranked full-text search over documents.',
      uk: 'Повнотекстовий пошук із ранжуванням за релевантністю.',
    },
    engines: ['Elasticsearch', 'Postgres FTS'],
    color: 'var(--c-query)',
    moduleId: 'm14-index-toolbox',
  },
];

export function LandscapeMap() {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<Family | null>(null);

  return (
    <div className="content map">
      <section className="map-hero">
        <p className="map-eyebrow">{t(ui.brandSubtitle)}</p>
        <h1>{t({ en: 'How databases actually work', uk: 'Як насправді працюють бази даних' })}</h1>
        <p className="map-lede">
          {t({
            en: 'An internals-first, bilingual deep dive — from the relational model to B-Tree and LSM storage, transactions, distribution, and the modern vector & distributed-SQL wave. Start anywhere; every module stands on its own.',
            uk: 'Поглиблення з фокусом на internals, двомовне — від реляційної моделі до B-Tree та LSM storage, транзакцій, розподілу й сучасної хвилі vector та distributed-SQL. Починайте будь-де; кожен модуль самодостатній.',
          })}
        </p>
        <div className="map-cta">
          <a className="btn btn-primary" href={hrefModule('m1-what-is-a-database')}>
            {t(ui.startHere)} →
          </a>
          <a className="btn" href={hrefModule('m13-btree')}>
            ★ {t({ en: 'Open the B-Tree visualizer', uk: 'Відкрити B-Tree visualizer' })}
          </a>
        </div>
      </section>

      <section className="map-families">
        <h2>{t({ en: 'The families', uk: 'Родини' })}</h2>
        <p className="muted">
          {t({
            en: 'Fit the data model to the access pattern. Tap a family to see when it fits.',
            uk: 'Підбирайте модель даних під access pattern. Торкніться родини, щоб побачити, коли вона пасує.',
          })}
        </p>
        <div className="fam-grid">
          {FAMILIES.map((f) => (
            <button
              key={f.id}
              className="fam-card"
              style={{ ['--fam' as string]: f.color }}
              onClick={() => setSelected(f)}
            >
              <span className="fam-dot" />
              <span className="fam-name">{t(f.name)}</span>
              <span className="fam-engines dim">{f.engines.join(' · ')}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="map-overview">
        <h2>{t({ en: 'All modules', uk: 'Усі модулі' })}</h2>
        <div className="ov-grid">
          {sections.map((s) => (
            <div className="ov-section" key={s.id}>
              <div className="ov-head" style={{ ['--sec' as string]: s.accent }}>
                <span className="ov-roman" style={{ color: s.accent }}>
                  {s.roman}
                </span>
                <span>{t(s.name)}</span>
              </div>
              <ul className="ov-mods">
                {modulesBySection(s.id).map((m) => (
                  <li key={m.id}>
                    <a className="ov-mod" href={hrefModule(m.id)}>
                      <span className="mono dim">{String(m.num).padStart(2, '0')}</span>
                      <span className="ov-mod-title">{t(m.title)}</span>
                      {m.signature && <span className="star">★</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.name[lang] || selected.name.en : ''}
        accent={selected?.color ?? 'var(--accent)'}
      >
        {selected && (
          <div className="fam-detail">
            <p>{t(selected.when)}</p>
            <div className="fam-chips">
              {selected.engines.map((e) => (
                <span className="chip" key={e}>
                  {e}
                </span>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigate(hrefModule(selected.moduleId));
                setSelected(null);
              }}
            >
              {t({ en: 'Open the module', uk: 'Відкрити модуль' })} →
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
