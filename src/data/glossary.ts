import type { GlossaryEntry } from './types';

/*
 * Bilingual glossary seed (terms stay English; the gloss is translated).
 * Expanded across later sessions as modules are authored.
 */
export const glossary: GlossaryEntry[] = [
  {
    term: 'ACID',
    def: {
      en: 'Atomicity, Consistency, Isolation, Durability — the four guarantees a transactional database makes about a transaction.',
      uk: 'Atomicity, Consistency, Isolation, Durability — чотири гарантії, які транзакційна база даних дає щодо транзакції.',
    },
    seeAlso: ['WAL', 'transaction'],
  },
  {
    term: 'B-Tree',
    def: {
      en: 'A balanced, high-fan-out search tree whose nodes are disk pages; the default index structure in most relational databases.',
      uk: 'Збалансоване пошукове дерево з високим fan-out, чиї nodes — disk pages; типова структура index у більшості реляційних БД.',
    },
    seeAlso: ['B+Tree', 'fan-out', 'page'],
  },
  {
    term: 'B+Tree',
    def: {
      en: 'A B-Tree variant that keeps values only in linked leaf pages, giving higher fan-out and cheap ordered range scans. What real DB indexes use.',
      uk: 'Варіант B-Tree, що тримає значення лише у звʼязаних leaf pages, даючи вищий fan-out і дешеві впорядковані range scans. Те, що використовують реальні DB-індекси.',
    },
    seeAlso: ['B-Tree', 'range scan'],
  },
  {
    term: 'CAP theorem',
    def: {
      en: 'During a network partition a distributed store must choose between Consistency and Availability; you cannot have both while partitioned.',
      uk: 'Під час network partition розподілене сховище мусить обрати між Consistency та Availability; обох одночасно під час partition мати не можна.',
    },
    seeAlso: ['PACELC', 'consensus'],
  },
  {
    term: 'PACELC',
    def: {
      en: 'An extension of CAP: if Partitioned, trade C vs A; Else, trade Latency vs Consistency even in normal operation.',
      uk: 'Розширення CAP: якщо Partitioned — компроміс C проти A; інакше (Else) — компроміс Latency проти Consistency навіть у звичайній роботі.',
    },
    seeAlso: ['CAP theorem'],
  },
  {
    term: 'MVCC',
    def: {
      en: 'Multi-Version Concurrency Control — keeps multiple versions of a row so readers see a consistent snapshot without blocking writers.',
      uk: 'Multi-Version Concurrency Control — тримає кілька версій рядка, щоб читачі бачили консистентний snapshot, не блокуючи записувачів.',
    },
    seeAlso: ['snapshot isolation', 'VACUUM'],
  },
  {
    term: 'WAL',
    def: {
      en: 'Write-Ahead Log — changes are recorded to a durable log before the data pages are modified, giving atomicity and crash recovery.',
      uk: 'Write-Ahead Log — зміни записуються у довговічний log до зміни data pages, що дає atomicity і відновлення після збою.',
    },
    seeAlso: ['ACID', 'checkpoint'],
  },
  {
    term: 'index-only scan',
    def: {
      en: 'A plan that answers a query entirely from a covering index, skipping the heap — in Postgres still gated by the visibility map.',
      uk: 'План, що відповідає на запит повністю з covering index, оминаючи heap — у Postgres усе одно залежить від visibility map.',
    },
    seeAlso: ['B+Tree', 'heap', 'visibility map'],
  },
  {
    term: 'heap',
    def: {
      en: 'The unordered collection of pages where table rows physically live (in PostgreSQL); indexes point into it via a TID.',
      uk: 'Невпорядкована сукупність pages, де фізично живуть рядки таблиці (у PostgreSQL); indexes вказують у неї через TID.',
    },
    seeAlso: ['page', 'TID'],
  },
  {
    term: 'page',
    def: {
      en: 'The fixed-size block (8 KB by default in PostgreSQL) that is the unit of I/O between disk and memory.',
      uk: 'Блок фіксованого розміру (8 KB за замовчуванням у PostgreSQL), що є одиницею I/O між диском і памʼяттю.',
    },
    seeAlso: ['heap', 'B-Tree'],
  },
  {
    term: 'fan-out',
    def: {
      en: 'The number of children per tree node. High fan-out makes a B-Tree shallow, so lookups cost few page reads.',
      uk: 'Кількість дітей на node дерева. Високий fan-out робить B-Tree неглибоким, тож пошук коштує мало читань page.',
    },
    seeAlso: ['B-Tree'],
  },
  {
    term: 'TID',
    def: {
      en: 'Tuple Identifier — a (page, offset) pointer to a row in the heap, stored in PostgreSQL index leaves.',
      uk: 'Tuple Identifier — вказівник (page, offset) на рядок у heap, що зберігається у leaves index PostgreSQL.',
    },
    seeAlso: ['heap', 'index-only scan'],
  },
  {
    term: 'OLTP',
    def: {
      en: 'Online Transaction Processing — many small, fast, concurrent read/write transactions (the typical app database).',
      uk: 'Online Transaction Processing — багато малих, швидких, конкурентних транзакцій читання/запису (типова app-база).',
    },
    seeAlso: ['OLAP'],
  },
  {
    term: 'OLAP',
    def: {
      en: 'Online Analytical Processing — large scans and aggregations over many rows; favors columnar storage.',
      uk: 'Online Analytical Processing — великі scans та агрегації над багатьма рядками; тяжіє до columnar storage.',
    },
    seeAlso: ['OLTP', 'columnar'],
  },
  {
    term: 'sharding',
    def: {
      en: 'Horizontal partitioning of data across nodes by a shard key, to scale beyond one machine.',
      uk: 'Горизонтальне partitioning даних між nodes за shard key, щоб масштабуватися за межі однієї машини.',
    },
    seeAlso: ['partitioning', 'replication'],
  },
  {
    term: 'replication',
    def: {
      en: 'Keeping copies of data on multiple nodes for read scale, high availability and geo-locality.',
      uk: 'Тримання копій даних на кількох nodes для масштабу читання, високої доступності та гео-локальності.',
    },
    seeAlso: ['failover', 'sharding'],
  },
  {
    term: 'isolation level',
    def: {
      en: 'How much a transaction is protected from concurrent ones: read-uncommitted, read-committed, repeatable-read, serializable.',
      uk: 'Наскільки транзакція захищена від конкурентних: read-uncommitted, read-committed, repeatable-read, serializable.',
    },
    seeAlso: ['MVCC', 'write-skew'],
  },
  {
    term: 'write-skew',
    def: {
      en: 'A concurrency anomaly where two transactions each read a shared invariant and write disjoint rows, together breaking it. Allowed under snapshot isolation.',
      uk: 'Аномалія конкурентності: дві транзакції читають спільний інваріант і пишуть неперетинні рядки, разом його порушуючи. Дозволена за snapshot isolation.',
    },
    seeAlso: ['isolation level', 'snapshot isolation'],
  },
  {
    term: 'snapshot isolation',
    def: {
      en: 'Each transaction reads from a consistent snapshot taken at its start; prevents many anomalies but not write-skew.',
      uk: 'Кожна транзакція читає з консистентного snapshot, зробленого на її старті; запобігає багатьом аномаліям, але не write-skew.',
    },
    seeAlso: ['MVCC', 'write-skew'],
  },
  {
    term: 'LSM-tree',
    def: {
      en: 'Log-Structured Merge tree — buffers writes in an in-memory memtable, flushes to sorted SSTables, and merges them via compaction.',
      uk: 'Log-Structured Merge tree — буферизує записи в memtable у памʼяті, скидає у відсортовані SSTables і зливає їх через compaction.',
    },
    seeAlso: ['SSTable', 'compaction'],
  },
  {
    term: 'SSTable',
    def: {
      en: 'Sorted String Table — an immutable, sorted on-disk file of key/value pairs produced by an LSM-tree flush.',
      uk: 'Sorted String Table — незмінний відсортований файл пар key/value на диску, створений flush у LSM-tree.',
    },
    seeAlso: ['LSM-tree', 'compaction'],
  },
  {
    term: 'embedding',
    def: {
      en: 'A dense numeric vector representing the meaning of text, image or other data; nearby vectors are semantically similar.',
      uk: 'Щільний числовий вектор, що подає зміст тексту, зображення чи інших даних; близькі вектори семантично схожі.',
    },
    seeAlso: ['HNSW', 'vector database'],
  },
  {
    term: 'HNSW',
    def: {
      en: 'Hierarchical Navigable Small World — the dominant approximate-nearest-neighbor graph index for vector search.',
      uk: 'Hierarchical Navigable Small World — домінантний graph-index approximate-nearest-neighbor для vector search.',
    },
    seeAlso: ['embedding', 'vector database'],
  },
  {
    term: 'normalization',
    def: {
      en: 'Organizing a schema so each fact lives in exactly one place (1NF→BCNF), removing redundancy and update anomalies.',
      uk: 'Організація схеми так, щоб кожен факт жив рівно в одному місці (1NF→BCNF), прибираючи надмірність та update-аномалії.',
    },
    seeAlso: ['functional dependency', 'BCNF', 'denormalization'],
  },
  // CHANGED (S4): M6/M7 terms.
  {
    term: 'functional dependency',
    def: {
      en: 'A rule X → Y meaning each value of X determines exactly one value of Y; the basis on which every normal form is defined.',
      uk: 'Правило X → Y, що означає: кожне значення X визначає рівно одне значення Y; основа, на якій визначено кожну normal form.',
    },
    seeAlso: ['normalization', 'BCNF'],
  },
  {
    term: 'cardinality',
    def: {
      en: 'How many entities take part on each side of a relationship — 1:1, 1:N, or M:N. It decides where the foreign key goes (or whether you need a junction table).',
      uk: 'Скільки entities бере участь з кожного боку relationship — 1:1, 1:N чи M:N. Вирішує, де розміщується foreign key (чи потрібна окрема junction table).',
    },
    seeAlso: ['junction table', 'foreign key'],
  },
  {
    term: 'junction table',
    def: {
      en: 'A table that resolves a many-to-many relationship by holding a foreign key to each side; also called an associative, link, or bridge table.',
      uk: 'Таблиця, що розвʼязує many-to-many relationship, тримаючи foreign key до кожного боку; також associative, link чи bridge table.',
    },
    seeAlso: ['cardinality', 'foreign key'],
  },
  {
    term: 'BCNF',
    def: {
      en: 'Boyce–Codd normal form — stricter than 3NF: every determinant of a non-trivial functional dependency must be a candidate key.',
      uk: 'Boyce–Codd normal form — суворіша за 3NF: кожен determinant нетривіальної functional dependency має бути candidate key.',
    },
    seeAlso: ['normalization', 'functional dependency'],
  },
  {
    term: 'denormalization',
    def: {
      en: 'Deliberately storing a fact in more than one place to make reads cheaper, accepting redundancy and the duty to keep the copies in sync.',
      uk: 'Свідоме зберігання факту в кількох місцях, щоб читання було дешевшим, з прийняттям надмірності та обовʼязку синхронізувати копії.',
    },
    seeAlso: ['normalization'],
  },
  // CHANGED (S5): M8/M9 terms.
  {
    term: 'primary key',
    def: {
      en: 'The candidate key chosen as a row’s official identity: NOT NULL, one per table, and the usual target of foreign keys.',
      uk: 'Candidate key, обраний офіційною ідентичністю рядка: NOT NULL, один на таблицю, і звичайна ціль для foreign keys.',
    },
    seeAlso: ['foreign key', 'surrogate key'],
  },
  {
    term: 'foreign key',
    def: {
      en: 'A column set whose values must match an existing row in another (or the same) table; the database enforces it as referential integrity.',
      uk: 'Набір колонок, чиї значення мають відповідати наявному рядку іншої (чи тієї ж) таблиці; база забезпечує це як referential integrity.',
    },
    seeAlso: ['referential integrity', 'primary key'],
  },
  {
    term: 'referential integrity',
    def: {
      en: 'The guarantee that every foreign-key value points at a real parent row (or is NULL); orphans are impossible by construction.',
      uk: 'Гарантія, що кожне значення foreign key вказує на реальний батьківський рядок (або є NULL); orphans неможливі за побудовою.',
    },
    seeAlso: ['foreign key'],
  },
  {
    term: 'surrogate key',
    def: {
      en: 'A synthetic, meaningless identifier (an IDENTITY integer or a UUID) used as a stable primary key instead of real-world data.',
      uk: 'Синтетичний беззмістовний ідентифікатор (IDENTITY integer чи UUID), що править за стабільний primary key замість реальних даних.',
    },
    seeAlso: ['primary key', 'foreign key'],
  },
  {
    term: 'generated column',
    def: {
      en: 'A column whose value is computed from other columns — STORED (written to disk) or VIRTUAL (computed on read; the default since PostgreSQL 18).',
      uk: 'Колонка, чиє значення обчислюється з інших колонок — STORED (пишеться на диск) чи VIRTUAL (рахується на читанні; дефолт від PostgreSQL 18).',
    },
    seeAlso: ['primary key'],
  },
  {
    term: 'jsonb',
    def: {
      en: 'PostgreSQL’s decomposed binary JSON type: slower to write than json but far faster to query and GIN-indexable. For variable, not stable, data.',
      uk: 'Розкладений двійковий JSON-тип PostgreSQL: повільніший на запис за json, але значно швидший на запит і GIN-індексований. Для змінних, а не стабільних, даних.',
    },
    seeAlso: ['normalization'],
  },
  // CHANGED (S6): M10/M11 terms.
  {
    term: 'window function',
    def: {
      en: 'A function computed across a set of rows related to the current one (OVER PARTITION BY … ORDER BY … frame) without collapsing them — unlike an aggregate. Powers running totals, rankings, and row-to-row deltas.',
      uk: 'Функція, обчислена над набором рядків, повʼязаних із поточним (OVER PARTITION BY … ORDER BY … frame), без їх згортання — на відміну від агрегата. Дає running totals, ranking і дельти між рядками.',
    },
    seeAlso: ['three-valued logic'],
  },
  {
    term: 'common table expression',
    def: {
      en: 'A CTE — a named subquery introduced by WITH that the main query references by name; WITH RECURSIVE walks hierarchies and graphs. Since PostgreSQL 12 a single-reference, non-recursive CTE is inlined by default.',
      uk: 'CTE — іменована subquery, введена через WITH, на яку головний запит посилається за іменем; WITH RECURSIVE обходить ієрархії та graphs. Від PostgreSQL 12 нерекурсивний CTE з одним посиланням за замовчуванням inlined.',
    },
  },
  {
    term: 'materialized view',
    def: {
      en: 'A view whose query result is stored on disk (and can be indexed): reads are table-fast, but the data is stale until REFRESH MATERIALIZED VIEW. Effectively a cache of a query result.',
      uk: 'View, чий результат запиту зберігається на диску (і може індексуватися): читання швидкі як з таблиці, але дані stale до REFRESH MATERIALIZED VIEW. По суті, кеш результату запиту.',
    },
  },
  {
    term: 'trigger',
    def: {
      en: 'A function the database runs automatically on INSERT/UPDATE/DELETE: BEFORE (validate/modify/cancel), AFTER (audit/react), or INSTEAD OF (make a view writable), at row or statement granularity.',
      uk: 'Функція, яку база виконує автоматично на INSERT/UPDATE/DELETE: BEFORE (валідувати/змінити/скасувати), AFTER (аудит/реакція) чи INSTEAD OF (зробити view записуваним), з гранулярністю рядка чи statement.',
    },
    seeAlso: ['PL/pgSQL'],
  },
  {
    term: 'PL/pgSQL',
    def: {
      en: 'PostgreSQL’s default, trusted procedural language — variables, control flow, and BEGIN…EXCEPTION error handling — used to write functions, procedures, and trigger functions.',
      uk: 'Типова, trusted процедурна мова PostgreSQL — змінні, потік керування й обробка помилок BEGIN…EXCEPTION — для написання functions, procedures і trigger-функцій.',
    },
    seeAlso: ['trigger'],
  },
  {
    term: 'three-valued logic',
    def: {
      en: 'SQL’s TRUE/FALSE/UNKNOWN logic: any comparison with NULL yields UNKNOWN, and WHERE keeps only TRUE rows — the source of the NOT IN-with-NULL and inequality-drops-NULL traps. Use IS [NOT] DISTINCT FROM for null-safe equality.',
      uk: 'Логіка SQL TRUE/FALSE/UNKNOWN: будь-яке порівняння з NULL дає UNKNOWN, а WHERE лишає лише TRUE-рядки — джерело пасток NOT IN-із-NULL та «нерівність відкидає NULL». Вживайте IS [NOT] DISTINCT FROM для null-safe рівності.',
    },
    seeAlso: ['window function'],
  },
];
