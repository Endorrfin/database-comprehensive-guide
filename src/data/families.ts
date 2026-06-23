import type { Level, Localized } from './types';

/*
 * families.ts — the database-family taxonomy. SINGLE SOURCE OF TRUTH shared by the
 * Landscape-Map landing (#/map) and M2's embedded interactive map (sim 'families-map').
 * Bilingual; family + engine names stay English in both languages. `level` drives the
 * landing level filter; `moduleId` is the deep-link target for "open the module".
 * Extracted from LandscapeMap in S2 so the landing and M2 can never drift apart.
 */
export type Family = {
  id: string;
  name: Localized;
  when: Localized; // one-line "when it fits"
  engines: string[];
  color: string; // CSS custom property — the family / engine brand colour
  moduleId: string;
  level: Level; // earliest level a learner meets this family (drives the landing filter)
};

export const families: Family[] = [
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
    level: 'beginner',
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
    level: 'middle',
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
    level: 'middle',
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
    level: 'senior',
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
    level: 'senior',
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
    level: 'senior',
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
    level: 'senior',
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
    level: 'senior',
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
    level: 'senior',
  },
];
