import type { DecideOption, DecideQuestion } from './types';

/*
 * decide.ts — data for the ★ Database Picker (M35), SINGLE SOURCE OF TRUTH for the
 * #/decide page and the embedded `db-picker` sim. Bilingual; family + engine names stay
 * English in both languages.
 *
 * Design (CLAUDE.md §6): a short requirements-first questionnaire. Each answer `leansTo`
 * one or more option ids; the wizard tallies the leans and ranks `decideOptions`.
 *
 * IMPORTANT: every `id` in `decideOptions` and every id in `leansTo` MUST be a family id
 * from families.ts, so the recommendation can look up that family's brand colour and
 * deep-link target (moduleId) without drifting. The framework is deliberately opinionated:
 * relational/PostgreSQL is the default and earns baseline pull from the "general" answers,
 * so a general-purpose app lands on Postgres and a specialist only wins when the workload
 * genuinely calls for it (the M35 thesis: requirements first, engine second).
 */

/** The recommendable targets — one per database family (ids match families.ts). */
export const decideOptions: DecideOption[] = [
  {
    id: 'relational',
    label: { en: 'Relational — the default', uk: 'Relational — default' },
    family: { en: 'Relational', uk: 'Relational' },
    engines: 'PostgreSQL · MySQL · SQLite',
    why: {
      en: "Strong ACID, joins, ad-hoc queries and a mature ecosystem make a relational database — PostgreSQL above all — the right default until a concrete requirement forces something else. Modern Postgres also speaks JSONB, full-text, vector (pgvector) and time-series, so one well-understood engine covers a surprising amount before you reach for a specialist.",
      uk: "Сувора ACID, joins, ad-hoc запити та зрілий екосистема роблять реляційну базу — передусім PostgreSQL — правильним default, доки конкретна вимога не змусить узяти щось інше. Сучасний Postgres також володіє JSONB, full-text, vector (pgvector) і time-series, тож один добре зрозумілий движок покриває напрочуд багато, перш ніж ви потягнетесь до спеціаліста.",
    },
  },
  {
    id: 'document',
    label: { en: 'Document', uk: 'Document' },
    family: { en: 'Document', uk: 'Document' },
    engines: 'MongoDB',
    why: {
      en: "A document store fits self-contained, nested objects you read and write as a whole and whose shape varies between records. You trade joins and cross-document transactions for a flexible schema and a model that maps cleanly onto application objects. Reach for it when the aggregate, not the relationship, is the unit of work.",
      uk: "Document-сховище пасує самодостатнім, вкладеним обʼєктам, які ви читаєте й пишете цілком і чия форма різниться між записами. Ви міняєте joins та cross-document транзакції на гнучку схему й модель, що чисто лягає на обʼєкти застосунку. Беріть його, коли одиниця роботи — агрегат, а не звʼязок.",
    },
  },
  {
    id: 'kv',
    label: { en: 'Key-value / cache', uk: 'Key-value / кеш' },
    family: { en: 'Key-value', uk: 'Key-value' },
    engines: 'Redis · Valkey',
    why: {
      en: "An in-memory key-value store gives the lowest possible latency for point lookups, caching, sessions, counters, rate limiters and queues. It is rarely the system of record — it sits in front of one — but for hot, simple, ephemeral data nothing is faster. Plan for eviction and decide whether you need persistence.",
      uk: "In-memory key-value сховище дає найнижчу можливу latency для point lookups, кешування, сесій, лічильників, rate limiters та черг. Воно рідко система запису — воно стоїть перед нею — але для гарячих, простих, ефемерних даних нічого швидшого немає. Плануйте eviction і вирішіть, чи потрібна персистентність.",
    },
  },
  {
    id: 'wide-column',
    label: { en: 'Wide-column', uk: 'Wide-column' },
    family: { en: 'Wide-column', uk: 'Wide-column' },
    engines: 'Cassandra · ScyllaDB',
    why: {
      en: "A wide-column store is built for write-heavy workloads at linear, horizontal, multi-region scale with no single master and tunable consistency. The price is a query model you must design up front around your access patterns — you model for queries, not for normalization — so choose it when raw write throughput and availability beat query flexibility.",
      uk: "Wide-column сховище створене для write-heavy навантажень із лінійним, горизонтальним, мультирегіональним масштабом без єдиного master і з tunable consistency. Ціна — модель запитів, яку треба спроєктувати наперед під ваші access patterns — ви моделюєте під запити, а не під нормалізацію — тож обирайте його, коли сирий write-throughput і доступність важливіші за гнучкість запитів.",
    },
  },
  {
    id: 'graph',
    label: { en: 'Graph', uk: 'Graph' },
    family: { en: 'Graph', uk: 'Graph' },
    engines: 'Neo4j',
    why: {
      en: "A graph database wins when the relationships between entities are the data — social networks, recommendations, fraud rings, dependency and access graphs. Index-free adjacency makes multi-hop traversals (friends-of-friends, shortest path) cheap where the equivalent recursive SQL join explodes. If most of your queries are deep traversals, this is the model.",
      uk: "Graph-база перемагає, коли звʼязки між сутностями і є даними — соцмережі, рекомендації, fraud rings, графи залежностей та доступу. Index-free adjacency робить multi-hop traversals (friends-of-friends, shortest path) дешевими там, де еквівалентний рекурсивний SQL join вибухає. Якщо більшість ваших запитів — глибокі traversals, це ваша модель.",
    },
  },
  {
    id: 'vector',
    label: { en: 'Vector / AI', uk: 'Vector / AI' },
    family: { en: 'Vector', uk: 'Vector' },
    engines: 'pgvector · Qdrant · Milvus',
    why: {
      en: "A vector index serves semantic similarity — nearest-neighbour search over embeddings for RAG, recommendations and de-duplication. Start with pgvector inside the Postgres you already run (HNSW, tens of millions of vectors); move to a dedicated engine (Qdrant, Milvus) only at very large scale or for advanced filtering. It is usually an addition to a primary store, not a replacement.",
      uk: "Vector-index обслуговує семантичну подібність — nearest-neighbour пошук над embeddings для RAG, рекомендацій та де-дуплікації. Почніть із pgvector усередині Postgres, який уже працює (HNSW, десятки мільйонів векторів); переходьте на виділений движок (Qdrant, Milvus) лише на дуже великому масштабі чи для просунутої фільтрації. Це зазвичай доповнення до основного сховища, а не заміна.",
    },
  },
  {
    id: 'timeseries',
    label: { en: 'Time-series', uk: 'Time-series' },
    family: { en: 'Time-series', uk: 'Time-series' },
    engines: 'TimescaleDB · InfluxDB',
    why: {
      en: "A time-series database is tuned for append-heavy, timestamped metrics and events: automatic time partitioning, columnar compression of old data, retention policies and continuous aggregates. TimescaleDB gives you this as a Postgres extension, so you keep SQL and the relational tooling. Pick it when most queries are 'over this time window'.",
      uk: "Time-series база налаштована під append-важкі, мітковані часом метрики та події: автоматичне партиціонування за часом, columnar-компресія старих даних, retention-політики та continuous aggregates. TimescaleDB дає це як розширення Postgres, тож ви лишаєтесь у SQL і реляційному tooling. Обирайте, коли більшість запитів — «за цим вікном часу».",
    },
  },
  {
    id: 'olap',
    label: { en: 'Analytics / columnar', uk: 'Analytics / columnar' },
    family: { en: 'Analytics / columnar', uk: 'Analytics / columnar' },
    engines: 'ClickHouse · DuckDB',
    why: {
      en: "A columnar OLAP engine is for large scans and aggregations over many rows — dashboards, reporting, ad-hoc analytics. Column storage plus vectorized execution gives 5–20× compression and order-of-magnitude faster aggregates than a row store. Keep it separate from your OLTP database: run analytics on ClickHouse or DuckDB, not on the system serving transactions.",
      uk: "Columnar OLAP-движок — для великих scans та агрегацій над багатьма рядками — дашборди, звітність, ad-hoc аналітика. Column storage плюс vectorized execution дає 5–20× компресію та на порядки швидші агрегати за row store. Тримайте його окремо від вашої OLTP-бази: запускайте аналітику на ClickHouse чи DuckDB, а не на системі, що обслуговує транзакції.",
    },
  },
  {
    id: 'search',
    label: { en: 'Search', uk: 'Search' },
    family: { en: 'Search', uk: 'Search' },
    engines: 'Elasticsearch · Postgres FTS',
    why: {
      en: "A search engine delivers relevance-ranked full-text search with analyzers, fuzzy matching and faceting. For modest needs PostgreSQL's built-in full-text search (tsvector + GIN) avoids another system; reach for Elasticsearch/OpenSearch when relevance tuning, scale or rich text analysis become first-class requirements. Like vector and cache, it usually complements a primary store.",
      uk: "Пошуковий движок дає full-text пошук із ранжуванням за релевантністю, аналізаторами, fuzzy-зіставленням і faceting. Для скромних потреб вбудований full-text у PostgreSQL (tsvector + GIN) уникає ще однієї системи; беріть Elasticsearch/OpenSearch, коли тюнінг релевантності, масштаб чи багатий аналіз тексту стають першочерговими вимогами. Як vector і кеш, він зазвичай доповнює основне сховище.",
    },
  },
];

/** The questionnaire — answers lean toward family ids above; the wizard ranks the tally. */
export const decideQuestions: DecideQuestion[] = [
  {
    id: 'shape',
    q: { en: 'What does your data mostly look like?', uk: 'Як переважно виглядають ваші дані?' },
    options: [
      {
        id: 'shape-relational',
        label: { en: 'Tables with clear relationships I will join', uk: 'Таблиці з чіткими звʼязками, які я join-итиму' },
        leansTo: ['relational'],
      },
      {
        id: 'shape-document',
        label: { en: 'Self-contained objects/documents I read as a whole', uk: 'Самодостатні обʼєкти/документи, які читаю цілком' },
        leansTo: ['document'],
      },
      {
        id: 'shape-kv',
        label: { en: 'Simple key → value pairs', uk: 'Прості пари key → value' },
        leansTo: ['kv'],
      },
      {
        id: 'shape-graph',
        label: { en: 'A network of entities and relationships', uk: 'Мережа сутностей і звʼязків' },
        leansTo: ['graph'],
      },
      {
        id: 'shape-vector',
        label: { en: 'High-dimensional embeddings (similarity)', uk: 'Високовимірні embeddings (подібність)' },
        leansTo: ['vector'],
      },
      {
        id: 'shape-timeseries',
        label: { en: 'Timestamped metrics / events over time', uk: 'Мітковані часом метрики / події в часі' },
        leansTo: ['timeseries'],
      },
    ],
  },
  {
    id: 'access',
    q: { en: 'What is the dominant access pattern?', uk: 'Який домінантний access pattern?' },
    options: [
      {
        id: 'access-adhoc',
        label: { en: 'Ad-hoc queries, joins, transactions', uk: 'Ad-hoc запити, joins, транзакції' },
        leansTo: ['relational'],
      },
      {
        id: 'access-bykey',
        label: { en: 'Fetch one record by key, very fast', uk: 'Дістати один запис за ключем, дуже швидко' },
        leansTo: ['kv', 'document'],
      },
      {
        id: 'access-scan',
        label: { en: 'Big scans & aggregations over many rows', uk: 'Великі scans та агрегації над багатьма рядками' },
        leansTo: ['olap'],
      },
      {
        id: 'access-traverse',
        label: { en: 'Multi-hop relationship traversals', uk: 'Multi-hop traversals по звʼязках' },
        leansTo: ['graph'],
      },
      {
        id: 'access-similarity',
        label: { en: 'Nearest-neighbour / similarity search', uk: 'Nearest-neighbour / similarity пошук' },
        leansTo: ['vector'],
      },
      {
        id: 'access-fts',
        label: { en: 'Full-text relevance search', uk: 'Full-text пошук за релевантністю' },
        leansTo: ['search'],
      },
    ],
  },
  {
    id: 'consistency',
    q: { en: 'How strict are your consistency needs?', uk: 'Наскільки суворі ваші вимоги до consistency?' },
    options: [
      {
        id: 'consistency-strict',
        label: { en: 'Strict ACID — money, inventory, must be correct', uk: 'Сувора ACID — гроші, inventory, має бути правильно' },
        leansTo: ['relational'],
      },
      {
        id: 'consistency-mixed',
        label: { en: 'Transactions sometimes, mostly single-record', uk: 'Транзакції іноді, переважно один запис' },
        leansTo: ['relational', 'document'],
      },
      {
        id: 'consistency-eventual',
        label: { en: 'Eventual consistency is fine for speed/scale', uk: 'Eventual consistency прийнятна заради швидкості/масштабу' },
        leansTo: ['kv', 'wide-column', 'document'],
      },
      {
        id: 'consistency-tunable',
        label: { en: 'I want to tune it per query', uk: 'Хочу налаштовувати її per query' },
        leansTo: ['wide-column'],
      },
    ],
  },
  {
    id: 'scale',
    q: { en: 'What is your scale and write volume?', uk: 'Який ваш масштаб і обсяг записів?' },
    options: [
      {
        id: 'scale-onenode',
        label: { en: 'Fits on one (big) node — the common case', uk: 'Вміщається на одному (великому) вузлі — звичайний випадок' },
        leansTo: ['relational'],
      },
      {
        id: 'scale-readheavy',
        label: { en: 'Read-heavy; I will scale reads with replicas', uk: 'Read-heavy; масштабуватиму читання replicas' },
        leansTo: ['relational', 'document'],
      },
      {
        id: 'scale-writeheavy',
        label: { en: 'Write-heavy at massive horizontal scale', uk: 'Write-heavy на масивному горизонтальному масштабі' },
        leansTo: ['wide-column', 'timeseries'],
      },
      {
        id: 'scale-global',
        label: { en: 'Global, multi-region, always-on', uk: 'Глобально, мультирегіонально, always-on' },
        leansTo: ['wide-column'],
      },
    ],
  },
  {
    id: 'special',
    q: { en: 'Any special requirement that dominates?', uk: 'Чи є особлива вимога, що домінує?' },
    options: [
      {
        id: 'special-ai',
        label: { en: 'AI / semantic search / RAG', uk: 'AI / семантичний пошук / RAG' },
        leansTo: ['vector'],
      },
      {
        id: 'special-cache',
        label: { en: 'Caching, sessions, queues, counters', uk: 'Кешування, сесії, черги, лічильники' },
        leansTo: ['kv'],
      },
      {
        id: 'special-analytics',
        label: { en: 'Analytics & dashboards (OLAP)', uk: 'Аналітика й дашборди (OLAP)' },
        leansTo: ['olap'],
      },
      {
        id: 'special-relationships',
        label: { en: 'Relationship analytics (fraud, recommendations)', uk: 'Аналітика звʼязків (fraud, рекомендації)' },
        leansTo: ['graph'],
      },
      {
        id: 'special-search',
        label: { en: 'First-class full-text search', uk: 'Повноцінний full-text пошук' },
        leansTo: ['search'],
      },
      {
        id: 'special-none',
        label: { en: 'None — a general-purpose application', uk: 'Жодної — застосунок загального призначення' },
        leansTo: ['relational'],
      },
    ],
  },
];
