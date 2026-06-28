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
  // CHANGED (S7): M12 storage + M14 index-toolbox terms.
  {
    term: 'TOAST',
    def: {
      en: 'The Oversized-Attribute Storage Technique: when a row exceeds ~2 kB, PostgreSQL compresses large variable-length values and/or moves them out-of-line to a side table, leaving an 18-byte pointer in the main tuple. Transparent on read.',
      uk: 'The Oversized-Attribute Storage Technique: коли рядок перевищує ~2 кБ, PostgreSQL стискає великі значення змінної довжини і/або виносить їх out-of-line у побічну таблицю, лишаючи 18-байтовий покажчик у головному tuple. Прозоро на читанні.',
    },
    seeAlso: ['page', 'heap'],
  },
  {
    term: 'fillfactor',
    def: {
      en: 'How full to pack a page on load (heap default 100, B-Tree default 90). Leaving free space lets an UPDATE write the new row version on the same page — a HOT update that avoids touching the indexes.',
      uk: 'Наскільки щільно пакувати page при завантаженні (дефолт heap 100, B-Tree 90). Вільне місце дозволяє UPDATE записати нову версію рядка на ту саму page — HOT-оновлення, що оминає indexes.',
    },
    seeAlso: ['page', 'heap'],
  },
  {
    term: 'GIN',
    def: {
      en: 'Generalized Inverted Index — maps each element/key inside a value to the rows containing it, so it indexes many-valued columns: arrays, jsonb containment (@>), and full-text (tsvector). Slower to build/update than a B-Tree.',
      uk: 'Generalized Inverted Index — зіставляє кожен елемент/ключ усередині значення з рядками, що його містять, тож індексує багатозначні колонки: масиви, containment jsonb (@>) і full-text (tsvector). Повільніший на build/update, ніж B-Tree.',
    },
    seeAlso: ['GiST', 'jsonb'],
  },
  {
    term: 'GiST',
    def: {
      en: 'Generalized Search Tree — a balanced tree of bounding predicates for data with extent or distance: geometry, range types, nearest-neighbor (ORDER BY … <-> …), full-text, and exclusion constraints. Lossy, so it rechecks the heap.',
      uk: 'Generalized Search Tree — збалансоване дерево обмежувальних предикатів для даних з протяжністю чи відстанню: геометрія, range-типи, nearest-neighbor (ORDER BY … <-> …), full-text та exclusion constraints. Lossy, тож перевіряє heap повторно.',
    },
    seeAlso: ['GIN'],
  },
  {
    term: 'BRIN',
    def: {
      en: 'Block Range Index — stores a tiny min/max summary per range of physical blocks instead of one entry per row, so a billion-row table gets a kilobyte-sized index. Effective only when the table’s physical order correlates with the column (e.g. append-only timestamps).',
      uk: 'Block Range Index — зберігає крихітне min/max-резюме на діапазон фізичних блоків замість запису на рядок, тож таблиця на мільярд рядків отримує index у кілобайти. Ефективний лише коли фізичний порядок таблиці корелює з колонкою (напр. append-only позначки часу).',
    },
    seeAlso: ['page'],
  },
  {
    term: 'covering index',
    def: {
      en: 'An index that carries the query’s payload columns in its leaves (via INCLUDE, since PostgreSQL 11), so the query can be answered from the index alone — an index-only scan that skips the heap fetch when the visibility map allows.',
      uk: 'Index, що несе payload-колонки запиту у своїх leaves (через INCLUDE, від PostgreSQL 11), тож запит можна відповісти лише з index — index-only scan, що оминає похід у heap, коли дозволяє visibility map.',
    },
    seeAlso: ['index-only scan'],
  },
  {
    term: 'partial index',
    def: {
      en: 'An index built over only the rows matching a WHERE clause (e.g. WHERE status = ‘open’). Smaller and cheaper to maintain than a full index, and it skips indexing rows you never query.',
      uk: 'Index, побудований лише над рядками, що відповідають WHERE (напр. WHERE status = ‘open’). Менший і дешевший в обслуговуванні за повний index, і не індексує рядки, які ви ніколи не запитуєте.',
    },
    seeAlso: ['covering index'],
  },
  {
    term: 'bitmap index scan',
    def: {
      en: 'A runtime strategy (not a stored index type): PostgreSQL builds in-memory bitmaps of matching row locations from one or more indexes, combines them with BitmapAnd/BitmapOr, then visits the heap in physical page order. How separate indexes cooperate on one query.',
      uk: 'Runtime-стратегія (не збережений тип index): PostgreSQL будує bitmap-и розташувань відповідних рядків у памʼяті з одного чи кількох indexes, поєднує їх через BitmapAnd/BitmapOr, а тоді відвідує heap у фізичному порядку pages. Так окремі indexes співпрацюють над одним запитом.',
    },
    seeAlso: ['index-only scan'],
  },
  // CHANGED (S8): M15 LSM-trees + M16 query planning terms.
  {
    term: 'LSM-tree',
    def: {
      en: 'Log-Structured Merge-tree — a write-optimized storage structure that buffers writes in an in-memory memtable and flushes them as immutable sorted SSTables, sorting/merging later via compaction. Trades read and space amplification for sequential, high-throughput writes.',
      uk: 'Log-Structured Merge-tree — write-optimized структура зберігання, що буферизує записи в memtable у памʼяті й скидає їх як immutable відсортовані SSTables, сортуючи/зливаючи пізніше через compaction. Міняє read і space amplification на послідовні, високопродуктивні записи.',
    },
    seeAlso: ['memtable', 'SSTable', 'compaction'],
  },
  {
    term: 'memtable',
    def: {
      en: 'The in-memory, sorted write buffer at the top of an LSM-tree. Every write goes to a WAL (for durability) and into the memtable; when it fills, it is frozen and flushed to disk as one immutable SSTable.',
      uk: 'Впорядкований буфер запису в памʼяті на вершині LSM-tree. Кожен запис іде у WAL (для durability) і в memtable; коли той заповнюється, він заморожується й скидається на диск як один immutable SSTable.',
    },
    seeAlso: ['LSM-tree', 'SSTable', 'WAL'],
  },
  {
    term: 'SSTable',
    def: {
      en: 'Sorted String Table — an immutable, sorted on-disk file produced by flushing a memtable. Never updated in place; superseded versions and tombstones are removed later by compaction. Read with the help of a Bloom filter and a sparse index.',
      uk: 'Sorted String Table — immutable, відсортований файл на диску, створений скиданням memtable. Ніколи не оновлюється на місці; застарілі версії й tombstones прибираються пізніше через compaction. Читається за допомогою Bloom filter і sparse index.',
    },
    seeAlso: ['LSM-tree', 'memtable', 'compaction', 'Bloom filter'],
  },
  {
    term: 'compaction',
    def: {
      en: 'The background process in an LSM-tree that merge-sorts SSTables together: keeping the newest version of each key, purging tombstones and superseded versions, and reclaiming space. Leveled compaction trades write amplification for tight space/reads; size-tiered trades space/reads for cheap writes.',
      uk: 'Фоновий процес в LSM-tree, що merge-sort-ить SSTables разом: зберігає найновішу версію кожного ключа, вичищає tombstones і застарілі версії, звільняє місце. Leveled compaction міняє write amplification на щільні space/reads; size-tiered міняє space/reads на дешеві записи.',
    },
    seeAlso: ['LSM-tree', 'SSTable', 'amplification (read / write / space)'],
  },
  {
    term: 'Bloom filter',
    def: {
      en: 'A compact, probabilistic set-membership test used per SSTable. It answers “definitely not present” (always correct — skip the file, zero disk reads) or “maybe present” (possibly a false positive). It never gives a false negative, so a lookup for an absent key can skip almost every SSTable instantly.',
      uk: 'Компактний імовірнісний тест належності до множини, що вживається на кожен SSTable. Відповідає «точно немає» (завжди правильно — пропустити файл, нуль читань диска) або «можливо є» (можливо false positive). Він ніколи не дає false negative, тож пошук відсутнього ключа може миттєво пропустити майже кожен SSTable.',
    },
    seeAlso: ['SSTable', 'LSM-tree'],
  },
  {
    term: 'tombstone',
    def: {
      en: 'A delete marker in an LSM-tree (or wide-column store). You cannot erase a key from an immutable SSTable, so a delete writes a tombstone recording the intent; compaction applies and purges it later. Range scans over heavily deleted ranges still read through tombstones until then.',
      uk: 'Маркер видалення в LSM-tree (чи wide-column сховищі). Ключ не можна стерти з immutable SSTable, тож видалення пише tombstone із записом наміру; compaction застосовує й вичищає його пізніше. Range scans по рясно видалених діапазонах досі читають крізь tombstones доти.',
    },
    seeAlso: ['compaction', 'SSTable'],
  },
  {
    term: 'amplification (read / write / space)',
    def: {
      en: 'The three-way trade every storage engine makes: read amplification (physical reads per logical read), write amplification (bytes written per byte of data), space amplification (bytes on disk per byte of live data). The RUM conjecture: optimize two and the third worsens.',
      uk: 'Тристоронній компроміс, що його робить кожен storage engine: read amplification (фізичні читання на логічне), write amplification (записані байти на байт даних), space amplification (байти на диску на байт живих даних). RUM conjecture: оптимізуєш два — третій гіршає.',
    },
    seeAlso: ['LSM-tree', 'compaction'],
  },
  {
    term: 'cardinality',
    def: {
      en: 'The number of rows a query step is estimated (or measured) to produce. The decisive input to the planner’s cost model: get the row counts right and the plan is usually good; get them wrong and every downstream decision is built on a bad estimate.',
      uk: 'Кількість рядків, яку крок запиту оцінено (чи виміряно) видати. Вирішальний вхід для cost model планувальника: вгадай кількість рядків правильно — і план зазвичай добрий; помились — і кожне подальше рішення збудоване на поганій оцінці.',
    },
    seeAlso: ['selectivity', 'cost-based optimizer'],
  },
  {
    term: 'selectivity',
    def: {
      en: 'The fraction of a table’s rows a predicate is estimated to keep (0 = none, 1 = all). Computed from statistics — the MCV list for equality, the histogram for ranges — then multiplied by the table size to estimate cardinality.',
      uk: 'Частка рядків таблиці, яку, за оцінкою, лишає предикат (0 = жодного, 1 = усі). Обчислюється зі statistics — MCV list для рівності, histogram для діапазонів — тоді множиться на розмір таблиці для оцінки cardinality.',
    },
    seeAlso: ['cardinality', 'cost-based optimizer'],
  },
  {
    term: 'cost-based optimizer',
    def: {
      en: 'A query planner that assigns every candidate physical plan an estimated cost (in seq_page_cost units, not milliseconds) and picks the cheapest — rather than following fixed rules. PostgreSQL’s planner is cost-based; the cost rests entirely on estimated cardinality from statistics.',
      uk: 'Планувальник запитів, що присвоює кожному плану-кандидату оцінений cost (в одиницях seq_page_cost, а не мілісекундах) і обирає найдешевший — а не йде за фіксованими правилами. Planner PostgreSQL cost-based; cost цілком спирається на оцінену cardinality зі statistics.',
    },
    seeAlso: ['cardinality', 'selectivity', 'EXPLAIN'],
  },
  {
    term: 'EXPLAIN',
    def: {
      en: 'The command that shows the plan the planner chose, with its estimates (cost=startup..total, rows, width). EXPLAIN ANALYZE additionally runs the query and prints the actuals (time, rows, loops) — and, since PostgreSQL 18, BUFFERS by default. The misestimate to hunt is the lowest node where estimated and actual rows diverge.',
      uk: 'Команда, що показує план, обраний планувальником, з його оцінками (cost=startup..total, rows, width). EXPLAIN ANALYZE додатково виконує запит і друкує фактичні дані (час, рядки, loops) — і, від PostgreSQL 18, BUFFERS за замовчуванням. Misestimate, який шукають, — найнижчий вузол, де оцінені й фактичні рядки розходяться.',
    },
    seeAlso: ['cost-based optimizer', 'cardinality'],
  },
  {
    term: 'nested loop join',
    def: {
      en: 'A join that scans the inner relation once for every row of the outer relation. Cheapest when the outer side is small and the inner is indexed — but dangerous, because its cost scales with the outer row count, so an under-estimated outer input can make it execute millions of times.',
      uk: 'Join, що сканує внутрішню relation раз на кожен рядок зовнішньої. Найдешевший, коли зовнішній бік малий, а внутрішній індексований — але небезпечний, бо його cost масштабується з кількістю зовнішніх рядків, тож недооцінений зовнішній вхід може змусити його виконатися мільйони разів.',
    },
    seeAlso: ['hash join', 'merge join', 'cardinality'],
  },
  {
    term: 'hash join',
    def: {
      en: 'A join that builds a hash table over the smaller input and probes it with the other. Best for large equality joins; needs work_mem and produces unordered output, but degrades gracefully under a bad row estimate where a nested loop would not.',
      uk: 'Join, що будує hash-таблицю над меншим входом і зондує її іншим. Найкращий для великих equality-join-ів; потребує work_mem і дає невпорядкований вихід, зате плавно деградує за поганої оцінки рядків там, де nested loop ні.',
    },
    seeAlso: ['nested loop join', 'merge join'],
  },
  {
    term: 'merge join',
    def: {
      en: 'A join that requires both inputs sorted on the join key (read pre-sorted from indexes, or sorted first), then merges them in one pass. Strong when the inputs are already ordered or very large.',
      uk: 'Join, що потребує обидва входи відсортованими за ключем join (прочитані вже відсортованими з indexes або спершу відсортовані), тоді зливає їх за один прохід. Сильний, коли входи вже впорядковані чи дуже великі.',
    },
    seeAlso: ['nested loop join', 'hash join'],
  },
  // CHANGED (S9): M17 ACID/WAL + M18 isolation terms (ACID, WAL, isolation level, write-skew,
  // snapshot isolation already seeded earlier).
  {
    term: 'durability',
    def: {
      en: 'The D in ACID: once a transaction is reported committed, its effects survive a crash or power loss. In PostgreSQL it is delivered by fsync-ing the WAL at commit; recovery replays the log.',
      uk: 'D в ACID: щойно транзакцію повідомлено зафіксованою, її ефекти переживають збій чи втрату живлення. У PostgreSQL це дає fsync WAL на commit; відновлення відтворює лог.',
    },
    seeAlso: ['WAL', 'checkpoint', 'ACID'],
  },
  {
    term: 'checkpoint',
    def: {
      en: 'A point at which all dirty data pages up to then are flushed to the data files and a checkpoint record is written. Crash recovery (REDO) replays the WAL only from the last checkpoint forward, so it bounds recovery time.',
      uk: 'Момент, коли всі брудні data pages до нього скидаються в data files і пишеться checkpoint-запис. Відновлення після збою (REDO) відтворює WAL лише від останнього checkpoint уперед, тож обмежує час відновлення.',
    },
    seeAlso: ['WAL', 'crash recovery'],
  },
  {
    term: 'crash recovery',
    def: {
      en: 'Roll-forward (REDO): after a crash the database replays the WAL from the last checkpoint to re-apply committed changes the data files never received. A transaction with no COMMIT record is treated as aborted.',
      uk: 'Roll-forward (REDO): після збою база відтворює WAL від останнього checkpoint, щоб повторно застосувати зафіксовані зміни, яких data files не отримали. Транзакція без COMMIT-запису трактується як aborted.',
    },
    seeAlso: ['WAL', 'checkpoint', 'durability'],
  },
  {
    term: 'dirty read',
    def: {
      en: "Reading another transaction's uncommitted write — a value that may be rolled back. Allowed only at Read Uncommitted in the SQL standard; PostgreSQL never permits it (Read Uncommitted is mapped to Read Committed).",
      uk: 'Читання незафіксованого запису іншої транзакції — значення, яке можуть відкотити. Дозволено лише на Read Uncommitted у SQL-стандарті; PostgreSQL ніколи не дозволяє (Read Uncommitted зведено до Read Committed).',
    },
    seeAlso: ['isolation level', 'snapshot isolation'],
  },
  {
    term: 'non-repeatable read',
    def: {
      en: 'Re-reading one row within a transaction and getting a different value because another transaction updated and committed it in between. Prevented at Repeatable Read and above.',
      uk: 'Повторне читання одного рядка в межах транзакції дає інше значення, бо інша транзакція оновила й зафіксувала його поміж. Запобігається на Repeatable Read і вище.',
    },
    seeAlso: ['phantom read', 'isolation level'],
  },
  {
    term: 'phantom read',
    def: {
      en: "Re-running a query and finding the set of matching rows changed (a row appeared or vanished) because another transaction committed an INSERT/DELETE. The SQL standard prevents it only at Serializable; PostgreSQL's Repeatable Read (Snapshot Isolation) already prevents it.",
      uk: 'Повторний запит знаходить змінену множину відповідних рядків (рядок зʼявився чи зник), бо інша транзакція зафіксувала INSERT/DELETE. SQL-стандарт запобігає лише на Serializable; Repeatable Read у PostgreSQL (Snapshot Isolation) уже запобігає.',
    },
    seeAlso: ['non-repeatable read', 'snapshot isolation'],
  },
  {
    term: 'lost update',
    def: {
      en: 'Two transactions read a value, each computes a new one from it, and both write back — so one update silently overwrites the other. Avoid with an atomic UPDATE, SELECT … FOR UPDATE, or a level that aborts the loser (Repeatable Read raises 40001).',
      uk: 'Дві транзакції читають значення, кожна обчислює з нього нове, й обидві записують назад — тож один update тихо перезаписує інший. Уникайте атомарним UPDATE, SELECT … FOR UPDATE або рівнем, що скасовує програвшого (Repeatable Read кидає 40001).',
    },
    seeAlso: ['write-skew', 'isolation level'],
  },
  {
    term: 'serializability',
    def: {
      en: 'The correctness guarantee that a set of concurrent transactions produces the same result as some serial (one-at-a-time) execution. The strongest isolation level; no anomaly is observable under it.',
      uk: 'Гарантія коректності, що набір конкурентних транзакцій дає той самий результат, що й якесь серійне (по одній) виконання. Найсильніший рівень isolation; під ним не спостерігається жодна аномалія.',
    },
    seeAlso: ['SSI', 'snapshot isolation', 'write-skew'],
  },
  {
    term: 'SSI',
    def: {
      en: 'Serializable Snapshot Isolation — how PostgreSQL implements Serializable (since 9.1). It runs at snapshot-isolation speed but tracks read/write dependencies with non-blocking predicate locks (SIReadLock) and aborts one transaction with SQLSTATE 40001 on a serialization anomaly (e.g. write-skew).',
      uk: 'Serializable Snapshot Isolation — як PostgreSQL реалізує Serializable (від 9.1). Працює на швидкості snapshot isolation, але відстежує read/write-залежності неблокувальними predicate locks (SIReadLock) і скасовує одну транзакцію з SQLSTATE 40001 на serialization-аномалії (напр., write-skew).',
    },
    seeAlso: ['serializability', 'snapshot isolation', 'write-skew'],
  },
  {
    term: 'two-phase locking (2PL)',
    def: {
      en: 'A lock-based concurrency-control protocol: a transaction acquires locks in a growing phase and releases them in a shrinking phase, holding them to commit (strict 2PL). It serializes by waiting, which can deadlock — the classic alternative to PostgreSQL’s lock-free SSI.',
      uk: 'Lock-based протокол контролю конкурентності: транзакція набирає locks у фазі зростання й звільняє у фазі спадання, тримаючи їх до commit (strict 2PL). Серіалізує очікуванням, що може призвести до deadlock — класична альтернатива безблокувальному SSI у PostgreSQL.',
    },
    seeAlso: ['SSI', 'isolation level'],
  },
  // CHANGED (S10): M19 MVCC/concurrency terms (MVCC, snapshot isolation, 2PL already seeded earlier).
  {
    term: 'VACUUM',
    def: {
      en: 'The process that reclaims space from dead tuples left by MVCC, in place, so a table does not grow without bound. It also updates the visibility map (for index-only scans), refreshes statistics, and freezes old XIDs. Usually run automatically by autovacuum; VACUUM FULL instead rewrites the whole table but takes an ACCESS EXCLUSIVE lock.',
      uk: 'Процес, що звільняє місце від мертвих tuples, лишених MVCC, на місці, щоб таблиця не росла безмежно. Він також оновлює visibility map (для index-only scans), освіжає statistics і freeze-ить старі XID. Зазвичай запускається автоматично через autovacuum; VACUUM FULL натомість переписує всю таблицю, але бере ACCESS EXCLUSIVE lock.',
    },
    seeAlso: ['dead tuple', 'autovacuum', 'MVCC'],
  },
  {
    term: 'dead tuple',
    def: {
      en: 'An old row version that no running or future snapshot can see, left behind by an UPDATE or DELETE under MVCC. Dead tuples accumulate as bloat until VACUUM reclaims their space — which is why an update-heavy table needs vacuuming even if it never grows in live rows.',
      uk: 'Стара версія рядка, яку жоден поточний чи майбутній snapshot не бачить, лишена UPDATE чи DELETE за MVCC. Мертві tuples накопичуються як bloat, доки VACUUM не звільнить їхнє місце — тому таблиця з рясними оновленнями потребує вакуумінгу, навіть якщо кількість живих рядків не росте.',
    },
    seeAlso: ['VACUUM', 'MVCC'],
  },
  {
    term: 'autovacuum',
    def: {
      en: 'The PostgreSQL background daemon that runs VACUUM and ANALYZE automatically when a table’s dead tuples cross a threshold (default 50 + 20% of the row count; PG18 adds an absolute cap). Its defaults are tuned for small tables — lower the per-table scale factor on big, hot tables to keep bloat flat.',
      uk: 'Фоновий демон PostgreSQL, що запускає VACUUM і ANALYZE автоматично, коли мертві tuples таблиці перетинають поріг (дефолт 50 + 20% кількості рядків; PG18 додає абсолютну стелю). Його дефолти налаштовані на малі таблиці — знижуйте per-table scale factor на великих гарячих таблицях, щоб тримати bloat пласким.',
    },
    seeAlso: ['VACUUM', 'dead tuple'],
  },
  {
    term: 'HOT update',
    def: {
      en: 'Heap-Only Tuple update — when an UPDATE changes no indexed column and the page has room, PostgreSQL writes the new row version on the same page, reached via a redirect, with NO new index entries. Leaving free space (a lower fillfactor) lets more updates qualify, cutting index bloat on update-heavy tables.',
      uk: 'Heap-Only Tuple update — коли UPDATE не змінює жодної індексованої колонки і на page є місце, PostgreSQL пише нову версію рядка на тій самій page, доступну через redirect, БЕЗ нових index-записів. Залишене вільне місце (нижчий fillfactor) дає більше оновлень кваліфікуватися, зменшуючи index-bloat на таблицях із рясними оновленнями.',
    },
    seeAlso: ['fillfactor', 'dead tuple'],
  },
  {
    term: 'transaction ID wraparound',
    def: {
      en: 'PostgreSQL’s transaction ids are 32-bit (~4.2 billion) and wrap around; a live tuple left unvacuumed for >2 billion transactions would appear to be "in the future" and vanish. VACUUM freezes old tuples to prevent it; if freezing falls far enough behind, the database stops accepting writes to protect itself.',
      uk: 'Transaction id у PostgreSQL — 32-бітні (~4,2 мільярда) і обертаються по колу; живий tuple, лишений невакуумованим понад 2 мільярди транзакцій, видавався б «у майбутньому» і зник би. VACUUM freeze-ить старі tuples, щоб цьому запобігти; якщо freezing відстане досить далеко, база припиняє приймати записи, щоб себе захистити.',
    },
    seeAlso: ['VACUUM', 'MVCC'],
  },
  {
    term: 'deadlock',
    def: {
      en: 'A cycle in the wait-for graph: T1 holds a lock T2 wants while T2 holds a lock T1 wants, so neither proceeds. PostgreSQL waits deadlock_timeout (default 1s), detects the cycle, and aborts one transaction (the victim) with SQLSTATE 40P01. Prevent by locking objects in a consistent order; survive by retrying.',
      uk: 'Цикл у wait-for graph: T1 тримає lock, який хоче T2, а T2 тримає lock, який хоче T1, тож жодна не просувається. PostgreSQL чекає deadlock_timeout (дефолт 1с), виявляє цикл і скасовує одну транзакцію (жертву) з SQLSTATE 40P01. Запобігайте блокуванням обʼєктів в узгодженому порядку; переживайте повтором.',
    },
    seeAlso: ['two-phase locking (2PL)', 'isolation level'],
  },
  // CHANGED (S10): M20 distributed-transaction terms.
  {
    term: 'two-phase commit (2PC)',
    def: {
      en: 'A protocol to commit a transaction atomically across multiple participants: a coordinator runs a prepare/vote round, then a commit/abort round. Its fatal flaw is blocking — if the coordinator crashes after the yes votes, prepared participants are in-doubt and hold their locks. In PostgreSQL it is off by default (max_prepared_transactions = 0) and meant for an external transaction manager (XA).',
      uk: 'Протокол для атомарної фіксації транзакції між кількома учасниками: координатор виконує раунд prepare/vote, тоді раунд commit/abort. Його фатальна вада — блокування: якщо координатор падає після голосів yes, підготовлені учасники в сумніві й тримають свої locks. У PostgreSQL вимкнено за замовчуванням (max_prepared_transactions = 0) і призначено для зовнішнього transaction manager (XA).',
    },
    seeAlso: ['saga', 'two-phase locking (2PL)'],
  },
  {
    term: 'saga',
    def: {
      en: 'A long transaction split into a sequence of local transactions, each committing in its own service, where each step has a compensating transaction that semantically undoes it on failure. Coordinated by orchestration (central) or choreography (events). It gives ACD without isolation — intermediate states are visible.',
      uk: 'Довга транзакція, розбита на послідовність локальних транзакцій, кожна фіксується у своєму сервісі, де кожен крок має компенсуючу транзакцію, що його семантично скасовує при збої. Координується orchestration (центральна) чи choreography (події). Дає ACD без isolation — проміжні стани видимі.',
    },
    seeAlso: ['compensating transaction', 'two-phase commit (2PC)'],
  },
  {
    term: 'compensating transaction',
    def: {
      en: 'The action that semantically undoes a committed saga step. It is forward-undo, not a rollback — the original step already happened and was visible, so the compensation is a new business operation (a refund, a cancellation) that must itself be idempotent.',
      uk: 'Дія, що семантично скасовує зафіксований крок saga. Це forward-undo, не rollback — оригінальний крок уже стався й був видимий, тож компенсація — це нова бізнес-операція (повернення, скасування), яка сама має бути ідемпотентною.',
    },
    seeAlso: ['saga', 'idempotency'],
  },
  {
    term: 'transactional outbox',
    def: {
      en: 'A pattern that solves the dual-write problem (you cannot atomically update a database AND publish to a broker): write the business row and an event row into an outbox table in the SAME local transaction, then a relay publishes the events — by polling the table or tailing the WAL via logical decoding (CDC). The relay is at-least-once, so consumers must be idempotent.',
      uk: 'Патерн, що розвʼязує dual-write problem (не можна атомарно оновити базу І опублікувати в broker): запишіть бізнес-рядок і рядок події в таблицю outbox у ТІЙ САМІЙ локальній транзакції, тоді relay публікує події — опитуючи таблицю чи читаючи WAL через logical decoding (CDC). Relay — at-least-once, тож споживачі мають бути ідемпотентними.',
    },
    seeAlso: ['idempotency', 'exactly-once'],
  },
  {
    term: 'idempotency',
    def: {
      en: 'The property that applying an operation twice has the same effect as applying it once. Essential under at-least-once delivery: consumers dedup with an idempotency key (ideally recorded in the same transaction as the side effect) so a redelivered message — or a retried payment — is not applied twice.',
      uk: 'Властивість, за якої застосувати операцію двічі дає той самий ефект, що й раз. Незамінна за at-least-once доставки: споживачі роблять dedup за idempotency key (ідеально записаним у тій самій транзакції, що й побічний ефект), щоб передоставлене повідомлення — чи повторений платіж — не застосувалося двічі.',
    },
    seeAlso: ['transactional outbox', 'exactly-once'],
  },
  {
    term: 'exactly-once',
    def: {
      en: 'A widely misused term. Exactly-once DELIVERY is impossible over an unreliable network (Two Generals / FLP). What is achievable is at-least-once delivery plus idempotent processing, producing the effect of exactly-once ("effectively-once"). Kafka’s exactly-once semantics holds only within Kafka’s read-process-write loop, not for external side effects.',
      uk: 'Широко неправильно вживаний термін. Exactly-once ДОСТАВКА неможлива через ненадійну мережу (Two Generals / FLP). Досяжне — at-least-once доставка плюс ідемпотентна обробка, що дає ефект exactly-once («effectively-once»). Exactly-once semantics у Kafka тримається лише в її циклі read-process-write, не для зовнішніх побічних ефектів.',
    },
    seeAlso: ['idempotency', 'transactional outbox'],
  },
  // CHANGED (S11): M21 replication + M22 sharding terms (+12 → 97 total).
  {
    term: 'streaming replication',
    def: {
      en: "PostgreSQL's primary HA mechanism: the primary ships WAL records to standbys in real time via a walsender/walreceiver TCP connection. Standbys apply the WAL continuously and can serve read-only queries (hot_standby=on). Physical streaming replication copies byte-for-byte; the standby must match the same OS/arch/major version.",
      uk: 'Основний механізм HA у PostgreSQL: primary доставляє WAL-записи на standbys у реальному часі через TCP-зʼєднання walsender/walreceiver. Standbys безперервно застосовують WAL і можуть обслуговувати read-only запити (hot_standby=on). Physical streaming replication копіює байт-за-байтом; standby має відповідати тій самій ОС/arch/major версії.',
    },
    seeAlso: ['WAL', 'replication slot', 'logical replication'],
  },
  {
    term: 'replication slot',
    def: {
      en: "A named, durable cursor PostgreSQL keeps on the primary that prevents WAL segments from being recycled until the slot's consumer has replayed them. Guarantees no data loss from WAL recycling; the risk is unbounded WAL accumulation if a slot's consumer stops — PG 18 adds idle_replication_slot_timeout to auto-drop stale slots.",
      uk: 'Іменований, довговічний курсор, який PostgreSQL тримає на primary та який запобігає видаленню WAL-сегментів, поки їх не відтворить споживач slot. Гарантує відсутність втрати даних від видалення WAL; ризик — необмежене накопичення WAL, якщо споживач slot зупиняється. PG 18 додає idle_replication_slot_timeout для автовидалення застарілих slot.',
    },
    seeAlso: ['streaming replication', 'WAL', 'logical replication'],
  },
  {
    term: 'synchronous replication',
    def: {
      en: 'A replication mode where the primary waits for one or more standbys to acknowledge flushing a WAL record before returning SUCCESS to the client. Set via synchronous_commit and synchronous_standby_names (FIRST n / ANY n quorum). Guarantees zero data loss on failover at the cost of added write latency.',
      uk: 'Режим replication, де primary чекає підтвердження flush WAL-запису від одного або кількох standbys перед поверненням SUCCESS клієнту. Встановлюється через synchronous_commit і synchronous_standby_names (FIRST n / ANY n кворум). Гарантує нульову втрату даних при failover ціною доданої затримки запису.',
    },
    seeAlso: ['streaming replication', 'replication lag', 'Patroni'],
  },
  {
    term: 'logical replication',
    def: {
      en: 'A row-level replication mode (CREATE PUBLICATION / CREATE SUBSCRIPTION, native since PG 10) that ships decoded row changes (INSERT/UPDATE/DELETE) rather than raw WAL bytes. Allows cross-version, cross-platform replication and selective table replication. DDL is not replicated automatically.',
      uk: 'Режим replication на рівні рядків (CREATE PUBLICATION / CREATE SUBSCRIPTION, нативний з PG 10), що доставляє декодовані зміни рядків (INSERT/UPDATE/DELETE), а не сирі WAL-байти. Дозволяє cross-version, cross-platform replication і вибіркову реплікацію таблиць. DDL не реплікується автоматично.',
    },
    seeAlso: ['streaming replication', 'WAL', 'replication slot'],
  },
  {
    term: 'replication lag',
    def: {
      en: 'The delay between a change being committed on the primary and being visible on a standby. Measured as write_lag, flush_lag, and replay_lag in pg_stat_replication. Lag means standby reads can return stale data and a lagged async standby promoted on failover can lose commits.',
      uk: 'Затримка між фіксацією зміни на primary і її видимістю на standby. Вимірюється як write_lag, flush_lag і replay_lag у pg_stat_replication. Lag означає, що читання standby може повернути застарілі дані, а підвищений при failover async standby з відставанням може втратити commits.',
    },
    seeAlso: ['streaming replication', 'synchronous replication'],
  },
  {
    term: 'Patroni',
    def: {
      en: 'The de-facto open-source HA solution for PostgreSQL (Python; by Zalando). Uses a distributed consensus store (DCS: etcd, Consul, ZooKeeper, or Kubernetes) as a leader lease. On primary failure, the most up-to-date eligible standby acquires the lease and calls pg_promote(). Uses pg_rewind to heal and rejoin the old primary as a new standby.',
      uk: 'Де-факто open-source HA-рішення для PostgreSQL (Python; від Zalando). Використовує distributed consensus store (DCS: etcd, Consul, ZooKeeper або Kubernetes) як leader lease. При відмові primary, найактуальніший eligible standby отримує lease і викликає pg_promote(). Використовує pg_rewind для відновлення старого primary як нового standby.',
    },
    seeAlso: ['streaming replication', 'synchronous replication'],
  },
  {
    term: 'table partitioning',
    def: {
      en: 'Splitting a single logical table into multiple physical child tables on the same server via RANGE, LIST, or HASH keys. The database presents the parent as one table; queries use partition pruning to skip irrelevant partitions. Gives full ACID guarantees with no distributed coordination — unlike sharding.',
      uk: 'Розбиття однієї логічної таблиці на кілька фізичних дочірніх таблиць на одному сервері за ключами RANGE, LIST або HASH. База представляє батьківську як одну таблицю; запити використовують partition pruning для пропуску нерелевантних партицій. Надає повні ACID-гарантії без розподіленої координації — на відміну від sharding.',
    },
    seeAlso: ['sharding', 'partition pruning'],
  },
  {
    term: 'partition pruning',
    def: {
      en: "The planner's ability to skip partitions whose key range cannot match a query predicate. Works at planning time (PG 10) and execution time for parameterized queries (PG 11). The core optimization that makes large partitioned tables fast for range and point queries.",
      uk: "Здатність планувальника пропускати партиції, чий діапазон ключів не може відповідати предикату запиту. Працює під час планування (PG 10) і під час виконання для параметризованих запитів (PG 11). Ключова оптимізація, що робить великі партиційовані таблиці швидкими для range і point запитів.",
    },
    seeAlso: ['table partitioning'],
  },
  {
    term: 'consistent hashing',
    def: {
      en: 'A sharding strategy that maps both keys and nodes to a virtual ring. A key is assigned to the nearest clockwise node. Adding or removing a node moves only K/N keys on average (K = total keys, N = node count), versus ~75% for simple mod-N. Virtual nodes (vnodes) improve balance under skewed distributions.',
      uk: 'Стратегія sharding, що відображає ключі та вузли на віртуальне кільце. Ключ призначається найближчому вузлу за годинниковою стрілкою. Додавання або видалення вузла переміщує в середньому лише K/N ключів (K = загальна кількість, N = вузлів) проти ~75% для простого mod-N. Virtual nodes (vnodes) покращують баланс при перекошених розподілах.',
    },
    seeAlso: ['sharding', 'shard key'],
  },
  {
    term: 'shard key',
    def: {
      en: 'The column (or combination) used to route a row to a shard. The most consequential design decision in a sharded system: it determines which queries are single-shard (fast, fully ACID) vs scatter-gather (expensive). Monotonic keys (SERIAL, timestamps) create hotspots in range sharding.',
      uk: 'Колонка (або комбінація), що маршрутизує рядок до shard. Найважливіше дизайнерське рішення в шардованій системі: визначає, які запити single-shard (швидкі, повністю ACID) проти scatter-gather (дорогі). Монотонні ключі (SERIAL, timestamps) створюють hotspots у range sharding.',
    },
    seeAlso: ['sharding', 'consistent hashing', 'hot spot'],
  },
  {
    term: 'co-location',
    def: {
      en: 'The sharding discipline of placing related rows on the same shard by using the same distribution column for all related tables. With co-location, joins and writes within one entity scope (e.g. one tenant) need zero cross-shard coordination and run as ordinary local operations.',
      uk: "Дисципліна sharding розміщення пов'язаних рядків в одному shard за однаковим distribution column для всіх пов'язаних таблиць. З co-location join'и та записи в межах одного скоупу сутності (напр. одного tenant) не потребують cross-shard координації і виконуються як звичайні локальні операції.",
    },
    seeAlso: ['shard key', 'sharding', 'scatter-gather'],
  },
  {
    term: 'scatter-gather',
    def: {
      en: 'The execution pattern for a cross-shard query: the coordinator fans the query to every shard, each executes its local portion, and the coordinator merges the results. Latency is set by the slowest shard. Minimized by co-location; unavoidable for queries without a shard-key predicate.',
      uk: 'Патерн виконання cross-shard-запиту: координатор розгортає запит на кожен shard, кожен виконує локальну частину, координатор зливає результати. Latency визначається найповільнішим shard. Мінімізується co-location; неминучий для запитів без предиката shard key.',
    },
    seeAlso: ['sharding', 'co-location', 'shard key'],
  },
  {
    term: 'hot spot',
    def: {
      en: 'A shard, node, or page that receives a disproportionate share of reads or writes and becomes a bottleneck while peers are underutilized. In sharded systems, the most common cause is a monotonically increasing shard key under range routing — all new inserts hit the same shard. Mitigated by hash sharding, UUIDs, uuidv7(), or key salting.',
      uk: "Shard, вузол або page, що отримує непропорційну частку читань або записів і стає вузьким місцем, поки peers недовантажені. У шардованих системах найпоширеніша причина — монотонно зростаючий shard key при range routing — всі нові вставки потрапляють в один shard. Пом'якшується hash sharding, UUIDs, uuidv7() або key salting.",
    },
    seeAlso: ['shard key', 'sharding', 'consistent hashing'],
  },

  // ── S12 · M23 CAP/PACELC + M24 HA/Backups ─────────────────────────────────
  {
    term: 'CAP theorem',
    def: {
      en: "Brewer's theorem (2000, proven Gilbert & Lynch 2002): a distributed system can guarantee at most two of Consistency (every read sees the latest write), Availability (every request gets a non-error response), and Partition tolerance (the system operates despite dropped messages). Since network partitions are inevitable, the real choice is whether to sacrifice C or A during a partition.",
      uk: "Теорема Брюера (2000, доведена Gilbert & Lynch 2002): розподілена система може гарантувати щонайбільше дві з трьох властивостей — Consistency (кожне читання бачить останній запис), Availability (кожен запит отримує відповідь без помилки) та Partition tolerance (система працює попри втрату повідомлень). Оскільки мережеві partitions неминучі, реальний вибір — жертвувати C чи A під час partition.",
    },
    seeAlso: ['PACELC', 'linearizability', 'eventual consistency', 'quorum'],
  },
  {
    term: 'PACELC',
    def: {
      en: 'Abadi (2012) extension to CAP: If Partition, choose between Availability and Consistency (the CAP trade); Else (normal operation), choose between Latency and Consistency. PACELC captures the everyday trade-off — even when the network is healthy, reducing replication latency (EL) comes at the cost of potentially stale reads.',
      uk: "Розширення CAP Абаді (2012): якщо Partition — обирай між Availability і Consistency (компроміс CAP); Else (нормальна робота) — між Latency і Consistency. PACELC фіксує повсякденний компроміс — навіть при справній мережі зниження latency реплікації (EL) коштує потенційно застарілих читань.",
    },
    seeAlso: ['CAP theorem', 'linearizability', 'eventual consistency'],
  },
  {
    term: 'linearizability',
    def: {
      en: "The strongest consistency model (Herlihy & Wing 1990): operations appear to execute atomically at a single point in time between their invocation and completion. Every read sees the latest write globally. CP systems (ZooKeeper, etcd, synchronous PostgreSQL) provide linearizability at the cost of blocking during partitions.",
      uk: "Найсильніша модель consistency (Herlihy & Wing 1990): операції виглядають як атомарно виконані в єдиній точці часу між їх викликом і завершенням. Кожне читання бачить останній глобальний запис. CP-системи (ZooKeeper, etcd, синхронний PostgreSQL) забезпечують linearizability коштом блокування під час partitions.",
    },
    seeAlso: ['CAP theorem', 'eventual consistency', 'quorum'],
  },
  {
    term: 'eventual consistency',
    def: {
      en: "A weak consistency model (Vogels 2009): if no new updates are made to an object, all replicas will eventually converge to the same value. Reads may return stale data in the meantime. Used by AP systems (Cassandra, DynamoDB in default mode) to maximize availability and reduce write latency.",
      uk: "Слабка модель consistency (Vogels 2009): якщо до об'єкта не надходять нові оновлення, всі репліки зрештою сходяться до однакового значення. Читання тим часом можуть повертати застарілі дані. Використовується AP-системами (Cassandra, DynamoDB у дефолтному режимі) для максимізації availability та зменшення write latency.",
    },
    seeAlso: ['CAP theorem', 'linearizability', 'replication lag'],
  },
  {
    term: 'quorum',
    def: {
      en: 'The minimum number of nodes that must acknowledge a read or write for it to be considered successful. In a cluster of N nodes, a quorum of ⌊N/2⌋+1 nodes guarantees that any two quorums share at least one node — so reads and writes cannot diverge. Used in Raft, Paxos, and tunable systems like Cassandra (W+R > N for strong consistency).',
      uk: 'Мінімальна кількість вузлів, які повинні підтвердити читання або запис для його успіху. У кластері з N вузлів кворум ⌊N/2⌋+1 гарантує, що будь-які два кворуми мають спільний вузол — тому читання та записи не можуть розходитися. Використовується в Raft, Paxos та налаштовуваних системах на кшталт Cassandra (W+R > N для сильної consistency).',
    },
    seeAlso: ['CAP theorem', 'Raft', 'linearizability'],
  },
  {
    term: 'Raft',
    def: {
      en: "Consensus algorithm (Ongaro & Ousterhout, USENIX ATC 2014) designed for understandability. A cluster elects a leader using randomized election timeouts; the leader replicates log entries to followers and commits when a majority confirms. Guarantees linearizability for committed entries. Used in etcd, CockroachDB, TiKV, and many distributed systems.",
      uk: "Алгоритм consensus (Ongaro & Ousterhout, USENIX ATC 2014), розроблений для зрозумілості. Кластер обирає лідера через рандомізовані election timeouts; лідер реплікує записи log на followers та фіксує їх при підтвердженні більшістю. Гарантує linearizability для зафіксованих записів. Використовується в etcd, CockroachDB, TiKV та багатьох розподілених системах.",
    },
    seeAlso: ['quorum', 'CAP theorem', 'linearizability'],
  },
  {
    term: 'high availability (HA)',
    def: {
      en: 'The property of a system that remains operational despite individual component failures. For PostgreSQL, HA typically means automatic failover from a failed primary to a standby in seconds, orchestrated by tools like Patroni (v4.1.3). HA targets infrastructure failures; it does not protect against logical errors (use PITR for those).',
      uk: "Властивість системи залишатися операційною попри відмови окремих компонентів. Для PostgreSQL HA означає автоматичний failover від відмовившого primary до standby за секунди, оркестрований інструментами на кшталт Patroni (v4.1.3). HA націлений на збої інфраструктури; від логічних помилок не захищає (для цього — PITR).",
    },
    seeAlso: ['Patroni', 'replication lag', 'RPO / RTO'],
  },
  {
    term: 'Patroni',
    def: {
      en: 'Open-source PostgreSQL HA orchestrator (v4.1.3, 2026-05-05). Runs as a daemon on each node; the primary continuously renews a leader lock in a DCS (etcd, Consul, ZooKeeper, Kubernetes) with a configurable TTL. If the lock expires, a standby wins an atomic race to acquire it and promotes via pg_promote(). pg_rewind resyncs the old primary without a full re-backup.',
      uk: 'Open-source HA-оркестратор PostgreSQL (v4.1.3, 2026-05-05). Запускається як daemon на кожному вузлі; primary безперервно оновлює leader lock у DCS (etcd, Consul, ZooKeeper, Kubernetes) з конфігурованим TTL. При закінченні lock standby виграє атомарну гонку за захоплення і підвищується через pg_promote(). pg_rewind ресинхронізує старий primary без повного перебекапу.',
    },
    seeAlso: ['high availability (HA)', 'streaming replication', 'RPO / RTO'],
  },
  {
    term: 'PITR (Point-in-Time Recovery)',
    def: {
      en: 'PostgreSQL recovery mode that replays the WAL archive from a base backup to any target timestamp, LSN, named restore point, or transaction ID. Requires archive_mode=on and a continuous WAL archive. Since PG 12, recovery parameters go in postgresql.conf and a recovery.signal file triggers PITR mode (no more recovery.conf).',
      uk: "Режим відновлення PostgreSQL, що відтворює WAL archive від base backup до будь-якого цільового timestamp, LSN, named restore point або transaction ID. Вимагає archive_mode=on та безперервного WAL archive. З PG 12 параметри відновлення задаються в postgresql.conf, а файл recovery.signal активує PITR-режим (recovery.conf більше немає).",
    },
    seeAlso: ['WAL (Write-Ahead Log)', 'RPO / RTO', 'high availability (HA)'],
  },
  {
    term: 'RPO / RTO',
    def: {
      en: 'Recovery Point Objective (RPO): the maximum acceptable data loss, measured in time. Recovery Time Objective (RTO): the maximum acceptable time to restore service after a failure. These business agreements drive all HA and backup strategy decisions — replication sync level, backup frequency, standby placement, and failover automation.',
      uk: 'Recovery Point Objective (RPO): максимально допустима втрата даних, виміряна в часі. Recovery Time Objective (RTO): максимально допустимий час відновлення сервісу після збою. Ці бізнес-угоди визначають усі рішення щодо HA та backup стратегії — рівень синхронізації реплікації, частоту backup, розміщення standby та автоматизацію failover.',
    },
    seeAlso: ['high availability (HA)', 'PITR (Point-in-Time Recovery)', 'streaming replication'],
  },
  {
    term: 'pgBackRest',
    def: {
      en: 'Full-featured PostgreSQL backup tool (v2.58.0) offering block-level incremental backups, parallel backup/restore, native S3/GCS/Azure object storage, AES-256-CBC encryption, deduplication, and tight WAL archiving integration. The leading open-source physical backup solution for PostgreSQL (coalition-funded since May 2026 after a maintainer transition).',
      uk: "Повнофункціональний інструмент backup PostgreSQL (v2.58.0) з block-level incremental backup-ами, паралельним backup/restore, нативним об'єктним сховищем S3/GCS/Azure, AES-256-CBC шифруванням, дедуплікацією та щільною WAL archiving integration. Провідне open-source фізичне backup-рішення для PostgreSQL (фінансується коаліцією з травня 2026 після зміни супроводжувача).",
    },
    seeAlso: ['PITR (Point-in-Time Recovery)', 'WAL (Write-Ahead Log)'],
  },
  // CHANGED (S13): M25 document + M26 key-value terms.
  {
    term: 'document database',
    def: {
      en: 'A NoSQL database that stores semi-structured data as self-describing documents (typically JSON/BSON). No fixed schema — each document can have different fields. Designed around the access pattern: data you read together should be stored together (embedding). MongoDB is the dominant engine.',
      uk: 'NoSQL база даних, що зберігає напівструктуровані дані як самоописові документи (зазвичай JSON/BSON). Без фіксованої схеми — кожен документ може мати різні поля. Розроблена навколо access pattern: дані, що читаються разом, зберігаються разом (embedding). MongoDB — домінуючий движок.',
    },
    seeAlso: ['BSON', 'schema-on-read', 'aggregation pipeline'],
  },
  {
    term: 'BSON',
    def: {
      en: "Binary JSON — MongoDB's wire and storage format. Extends JSON with typed values (ObjectId, Date, Decimal128, Binary, Int32/Int64) and length-prefixed encoding for O(1) document size computation and fast field-by-field traversal. BSON documents are limited to 16 MB.",
      uk: "Binary JSON — формат дроту та зберігання MongoDB. Розширює JSON типізованими значеннями (ObjectId, Date, Decimal128, Binary, Int32/Int64) і кодуванням із length-prefix для O(1) обчислення розміру документа та швидкого обходу поля за полем. BSON документи обмежені 16 МБ.",
    },
    seeAlso: ['document database', 'ObjectId'],
  },
  {
    term: 'ObjectId',
    def: {
      en: "MongoDB's default 12-byte document identifier: 4-byte Unix timestamp + 5-byte random value (machine+process) + 3-byte incrementing counter. Monotonically increasing within a second, globally unique without a central coordinator, and sortable by creation time. The _id field type.",
      uk: "Стандартний 12-байтовий ідентифікатор документа MongoDB: 4-байтовий Unix timestamp + 5-байтове випадкове значення (machine+process) + 3-байтовий лічильник. Монотонно зростаючий в межах секунди, глобально унікальний без центрального координатора та сортований за часом створення. Тип поля _id.",
    },
    seeAlso: ['BSON', 'document database'],
  },
  {
    term: 'aggregation pipeline',
    def: {
      en: "MongoDB's server-side data-processing framework: an array of stages ($match, $group, $project, $sort, $lookup, $unwind, $limit…) that transform a stream of documents. Executes on the server — avoids pulling all data to the client. The correct tool for any non-trivial MongoDB query that goes beyond a simple find().",
      uk: "Серверний фреймворк обробки даних MongoDB: масив стадій ($match, $group, $project, $sort, $lookup, $unwind, $limit…), що перетворюють потік документів. Виконується на сервері — уникає витягування всіх даних на клієнт. Правильний інструмент для будь-якого нетривіального MongoDB-запиту, що виходить за межі простого find().",
    },
    seeAlso: ['document database'],
  },
  {
    term: 'schema-on-read',
    def: {
      en: 'A data modelling philosophy (contrast: schema-on-write in RDBMS) where the structure is interpreted at query time, not enforced at write time. Document databases are schema-on-read by default — you can insert any shape of document. The risk: no enforcement means corrupt or inconsistent data; use validator rules / JSON Schema to add lightweight constraints.',
      uk: "Філософія моделювання даних (контраст: schema-on-write у RDBMS), де структура інтерпретується під час запиту, а не забезпечується під час запису. Document databases — schema-on-read за замовчуванням — ви можете вставляти документи будь-якої форми. Ризик: відсутність примусу означає пошкоджені або непослідовні дані; використовуйте validator rules / JSON Schema для легковагих обмежень.",
    },
    seeAlso: ['document database'],
  },
  {
    term: 'write concern',
    def: {
      en: "MongoDB's durability knob for write operations: w:0 (fire-and-forget, no ack), w:1 (primary ack only — default, data loss risk on failover), w:'majority' (majority of replica set members must acknowledge — safe for critical data). Combine with j:true to require WAL (journal) flush before ack.",
      uk: "Регулятор durability MongoDB для операцій запису: w:0 (fire-and-forget, без підтвердження), w:1 (лише підтвердження primary — дефолт, ризик втрати даних при failover), w:'majority' (більшість членів replica set мусить підтвердити — безпечно для критичних даних). Комбінуйте з j:true для вимоги flush WAL (journal) перед підтвердженням.",
    },
    seeAlso: ['document database', 'durability'],
  },
  {
    term: 'key-value store',
    def: {
      en: 'The simplest data model: map an opaque key (a string) to a value and retrieve it in O(1). Redis and Valkey extend this with rich typed values (String, Hash, List, Set, Sorted Set, Stream) that enable server-side operations. Excels at caching, session storage, rate limiting, and distributed locks.',
      uk: "Найпростіша модель даних: відображення непрозорого ключа (рядка) на значення та отримання за O(1). Redis і Valkey розширюють це з багатими типізованими значеннями (String, Hash, List, Set, Sorted Set, Stream), що дозволяють серверні операції. Відмінно підходить для кешування, session storage, rate limiting і distributed locks.",
    },
    seeAlso: ['Valkey', 'cache-aside', 'eviction'],
  },
  {
    term: 'Valkey',
    def: {
      en: 'An open-source BSD-3-Clause in-memory key-value store, forked from Redis 7.2.4 by the Linux Foundation in March 2024 after Redis relicensed to SSPL/RSALv2. Founding backers: AWS, Google Cloud, Oracle, Ericsson, Snap. Valkey 9.1 (2026) adds a new I/O threading model and 40%+ throughput gains. Default in Fedora 42, Ubuntu 26.04, Debian 13, Arch, and AWS ElastiCache.',
      uk: "Open-source BSD-3-Clause in-memory key-value сховище, форкнуте від Redis 7.2.4 Linux Foundation у березні 2024 р. після переходу Redis на SSPL/RSALv2. Засновники: AWS, Google Cloud, Oracle, Ericsson, Snap. Valkey 9.1 (2026 р.) додає нову I/O threading модель та +40% throughput. Стандарт у Fedora 42, Ubuntu 26.04, Debian 13, Arch і AWS ElastiCache.",
    },
    seeAlso: ['key-value store', 'cache-aside'],
  },
  {
    term: 'TTL (time to live)',
    def: {
      en: "An expiry duration set on a cache key: the server automatically deletes the key when it expires. TTL is the primary cache-freshness lever in Redis/Valkey (SETEX / EXPIRE). Short TTLs reduce staleness but increase DB load; long TTLs reduce load but risk serving outdated data. TTL also drives cache stampedes when many hot keys expire simultaneously.",
      uk: "Тривалість закінчення, встановлена на ключ кешу: сервер автоматично видаляє ключ при закінченні. TTL — основний важіль свіжості кешу у Redis/Valkey (SETEX / EXPIRE). Короткі TTL зменшують застарілість, але збільшують навантаження на БД; довгі TTL знижують навантаження, але ризикують видавати застарілі дані. TTL також спричиняє cache stampede, коли багато гарячих ключів закінчуються одночасно.",
    },
    seeAlso: ['cache-aside', 'eviction', 'cache stampede'],
  },
  {
    term: 'cache-aside',
    def: {
      en: 'The most common caching pattern (also called lazy loading): the application checks the cache, reads the database on a miss, populates the cache with a TTL, and returns the result. The database is never touched on a hit. Puts the application in control of all cache interactions.',
      uk: "Найпоширеніший патерн кешування (також lazy loading): застосунок перевіряє кеш, читає базу при miss, заповнює кеш з TTL і повертає результат. База не чіпається при hit. Дає застосунку контроль над усіма взаємодіями з кешем.",
    },
    seeAlso: ['key-value store', 'TTL (time to live)', 'cache stampede'],
  },
  {
    term: 'eviction',
    def: {
      en: "The policy Redis/Valkey uses to remove keys when maxmemory is reached. Common policies: allkeys-lru (evict least-recently-used key — best for most caches), allkeys-lfu (least-frequently-used — better for skewed access patterns), noeviction (return errors — correct for a primary data store, catastrophic for a cache), volatile-lru/lfu (only keys with TTL set). Set via maxmemory-policy.",
      uk: "Політика, яку Redis/Valkey використовує для видалення ключів при досягненні maxmemory. Поширені політики: allkeys-lru (видаляти least-recently-used ключ — найкраще для більшості кешів), allkeys-lfu (least-frequently-used — краще для skewed access patterns), noeviction (повертати помилки — правильно для основного сховища, катастрофічно для кешу), volatile-lru/lfu (лише ключі з TTL). Встановлюється через maxmemory-policy.",
    },
    seeAlso: ['key-value store', 'TTL (time to live)'],
  },
  {
    term: 'cache stampede',
    def: {
      en: 'A production incident where many concurrent requests simultaneously miss the same cache key (e.g. after TTL expiry) and all hit the database at once, overwhelming it. Mitigations: mutex lock (only one request repopulates), probabilistic early expiry (XFetch), or background pre-warming before TTL expires.',
      uk: "Production-інцидент, де багато конкурентних запитів одночасно промахуються по одному і тому ж ключу кешу (наприклад, після закінчення TTL) і всі одночасно звертаються до бази, перевантажуючи її. Захисти: mutex lock (лише один запит заповнює кеш), probabilistic early expiry (XFetch) або фонове попереднє прогрівання до закінчення TTL.",
    },
    seeAlso: ['cache-aside', 'TTL (time to live)'],
  },
  {
    term: 'AOF (Append-Only File)',
    def: {
      en: 'Redis/Valkey persistence mode: every write command is appended to a log file and replayed on startup. appendfsync everysec (default) provides ≤ 1 second data loss guarantee. AOF rewrite (BGREWRITEAOF) compacts the log to the minimal command set. More durable than RDB snapshots; slower to load on restart.',
      uk: 'Режим persistence Redis/Valkey: кожна write-команда дописується в лог-файл і відтворюється при запуску. appendfsync everysec (дефолт) надає гарантію втрати даних ≤ 1 секунди. AOF rewrite (BGREWRITEAOF) стискає лог до мінімального набору команд. Більш довговічний ніж RDB snapshots; повільніше завантажується при рестарті.',
    },
    seeAlso: ['key-value store', 'Valkey'],
  },

  // ── S14 · M27 wide-column + M28 graph terms ────────────────────────────────
  {
    term: 'wide-column store',
    def: {
      en: 'A NoSQL family (Cassandra, ScyllaDB, HBase) that stores data in tables with flexible per-row columns, grouped into column families. Not a relational table — queries must match the partition key, and the data model is designed per query, not per entity. Physically built on LSM-trees for high write throughput.',
      uk: "NoSQL родина (Cassandra, ScyllaDB, HBase), що зберігає дані в таблицях з гнучкими per-row колонками, згрупованими в column families. Не реляційна таблиця — запити мусять відповідати partition key, і модель даних проектується per query, а не per entity. Фізично побудована на LSM-trees для high write throughput.",
    },
    seeAlso: ['partition key (Cassandra)', 'clustering key', 'LSM-tree', 'tunable consistency'],
  },
  {
    term: 'partition key (Cassandra)',
    def: {
      en: "The column (or composite of columns) in Cassandra's PRIMARY KEY that determines which node stores a row, via consistent hashing on the token ring. All rows with the same partition key are co-located on the same node(s) and sorted together by the clustering key. Getting the partition key wrong is the single most common Cassandra performance mistake.",
      uk: "Колонка (або набір колонок) в PRIMARY KEY Cassandra, що визначає, який вузол зберігає рядок, через consistent hashing на token ring. Усі рядки з однаковим partition key зберігаються разом на тих самих вузлах і відсортовані за clustering key. Неправильний вибір partition key — найпоширеніша помилка продуктивності Cassandra.",
    },
    seeAlso: ['clustering key', 'wide-column store', 'consistent hashing'],
  },
  {
    term: 'clustering key',
    def: {
      en: "The second part of Cassandra's compound PRIMARY KEY: it determines the sort order of rows within a partition. Defines the only ordering you can efficiently range-scan without ALLOW FILTERING. Choosing the clustering key to match your most critical ORDER BY is central to Cassandra data modelling.",
      uk: "Друга частина складеного PRIMARY KEY Cassandra: визначає порядок сортування рядків всередині partition. Визначає єдиний порядок, по якому можна ефективно range-scan-ити без ALLOW FILTERING. Вибір clustering key відповідно до найважливішого ORDER BY є центральним в моделюванні даних Cassandra.",
    },
    seeAlso: ['partition key (Cassandra)', 'wide-column store'],
  },
  {
    term: 'CQL (Cassandra Query Language)',
    def: {
      en: 'The SQL-like query language for Apache Cassandra (CQL3, released with Cassandra 1.2 in 2013). Syntax looks like SQL but the execution model is radically different: queries must include a full partition key predicate; JOINs, subqueries, and arbitrary WHERE clauses across partitions do not exist. Data modelling is query-first.',
      uk: "SQL-подібна мова запитів для Apache Cassandra (CQL3, випущена з Cassandra 1.2 у 2013 р.). Синтаксис схожий на SQL, але модель виконання радикально відрізняється: запити мусять включати повний partition key предикат; JOIN-ів, підзапитів і довільних WHERE-клаузул через партиції не існує. Моделювання даних — query-first.",
    },
    seeAlso: ['wide-column store', 'partition key (Cassandra)'],
  },
  {
    term: 'tunable consistency',
    def: {
      en: "Cassandra's per-operation consistency model: you choose a consistency level (ONE, QUORUM, ALL, LOCAL_QUORUM…) for each read and write independently. Strong consistency is achieved when W + R > RF (replication factor). Trading down to ONE improves latency; trading up to ALL maximises freshness but reduces availability.",
      uk: "Per-operation модель consistency Cassandra: ви обираєте consistency level (ONE, QUORUM, ALL, LOCAL_QUORUM…) для кожного читання та запису незалежно. Сильна consistency досягається, коли W + R > RF (replication factor). Зниження до ONE покращує latency; підвищення до ALL максимізує свіжість, але зменшує availability.",
    },
    seeAlso: ['wide-column store', 'quorum', 'eventual consistency'],
  },
  {
    term: 'graph database',
    def: {
      en: 'A database optimised for storing and querying highly connected data as nodes, relationships, and properties. The defining performance advantage over relational is index-free adjacency: each node physically stores pointers to its neighbours, making multi-hop traversal O(k × degree) rather than O(k × log n) per hop in a relational JOIN.',
      uk: "База даних, оптимізована для зберігання та запиту сильно пов'язаних даних як nodes, relationships і properties. Визначальна перевага продуктивності над реляційними — index-free adjacency: кожен node фізично зберігає вказівники на своїх сусідів, роблячи multi-hop traversal O(k × degree) замість O(k × log n) на hop у реляційному JOIN.",
    },
    seeAlso: ['index-free adjacency', 'property graph', 'Cypher'],
  },
  {
    term: 'property graph',
    def: {
      en: "The dominant graph data model (used by Neo4j, Amazon Neptune, ArangoDB): nodes carry labels (:Person, :Movie) and a property map; relationships have a single type (KNOWS, ACTED_IN), a direction, and their own property map. Relationships are first-class entities — unlike RDF predicates which cannot carry properties natively.",
      uk: "Домінуюча модель graph-даних (використовується Neo4j, Amazon Neptune, ArangoDB): nodes несуть labels (:Person, :Movie) і property map; relationships мають один тип (KNOWS, ACTED_IN), напрямок та власний property map. Relationships — першокласні сутності — на відміну від RDF predicates, які не можуть нести properties нативно.",
    },
    seeAlso: ['graph database', 'index-free adjacency', 'Cypher'],
  },
  {
    term: 'index-free adjacency',
    def: {
      en: 'The storage technique in a native graph database where each node record physically stores a pointer to its linked list of relationships. Following a hop is a single memory dereference — O(1) per hop, independent of graph size. At 4–5 hops this is orders of magnitude faster than the equivalent JOINs in a relational database.',
      uk: "Техніка зберігання в native graph database, де запис кожного node фізично зберігає вказівник на зв'язаний список relationships. Слідування за hop — одна операція звернення до пам'яті — O(1) на hop, незалежно від розміру графу. При 4–5 hops це на порядки швидше ніж еквівалентні JOINs у реляційній базі.",
    },
    seeAlso: ['graph database', 'property graph'],
  },
  {
    term: 'Cypher',
    def: {
      en: 'A declarative graph query language created at Neo4j in 2010 (first public release Neo4j 1.4, 2011). Uses ASCII-art pattern syntax — (n:Person)-[:KNOWS]->(m:Person) — to describe subgraph shapes to match. Core clauses: MATCH, WHERE, RETURN, CREATE, MERGE, SET, DELETE, WITH. openCypher (Oct 2015) opened the spec; it became the basis for GQL ISO/IEC 39075:2024.',
      uk: "Декларативна мова graph-запитів, створена в Neo4j у 2010 р. (перший публічний реліз Neo4j 1.4, 2011 р.). Використовує ASCII-art синтаксис патернів — (n:Person)-[:KNOWS]->(m:Person) — для опису форм підграфів. Основні клаузули: MATCH, WHERE, RETURN, CREATE, MERGE, SET, DELETE, WITH. openCypher (жовт. 2015) відкрив специфікацію; стала основою для GQL ISO/IEC 39075:2024.",
    },
    seeAlso: ['property graph', 'graph database', 'GQL'],
  },
  {
    term: 'GQL',
    def: {
      en: 'ISO/IEC 39075:2024 — the first ISO standard graph query language, published April 12, 2024. Its lineage is Cypher (Neo4j, 2011) → openCypher (2015) → GQL. It also subsumes SQL/PGQ (SQL Part 16: Property Graph Queries), bringing graph queries into the SQL standard family.',
      uk: 'ISO/IEC 39075:2024 — перший ISO стандарт мови graph-запитів, опублікований 12 квітня 2024 р. Лінія спадщини: Cypher (Neo4j, 2011) → openCypher (2015) → GQL. Також включає SQL/PGQ (SQL Part 16: Property Graph Queries), привносячи graph-запити до сімейства SQL стандартів.',
    },
    seeAlso: ['Cypher', 'property graph'],
  },
  {
    term: 'knowledge graph',
    def: {
      en: 'A graph database used to represent entities and the typed relationships between them as machine-readable knowledge. Used for semantic search, question answering, LLM RAG context enrichment (GraphRAG), and data integration. Knowledge graphs often use RDF + SPARQL for interoperability, or a property graph (Neo4j/LPG) for operational use.',
      uk: "Graph database, що використовується для представлення сутностей і типізованих relationships між ними як машиночитаних знань. Використовується для semantic search, question answering, LLM RAG context enrichment (GraphRAG) та інтеграції даних. Knowledge graphs часто використовують RDF + SPARQL для взаємодії або property graph (Neo4j/LPG) для операційного застосування.",
    },
    seeAlso: ['graph database', 'property graph'],
  },
  {
    term: 'RDF (Resource Description Framework)',
    def: {
      en: 'A W3C graph data model where every fact is expressed as a subject–predicate–object triple (all URI-identified). Predicates are not objects, so edge properties require verbose reification. Queried with SPARQL. First-class support for OWL/RDFS ontology and inference. Best for linked open data, semantic web, and knowledge representation rather than operational graphs.',
      uk: "Модель graph-даних W3C, де кожен факт виражається як subject–predicate–object triple (всі ідентифіковані URI). Предикати не є об'єктами, тому edge properties потребують докладного reification. Запити через SPARQL. Першокласна підтримка OWL/RDFS ontology та inference. Найкраще для linked open data, semantic web та представлення знань, а не operational graphs.",
    },
    seeAlso: ['property graph', 'knowledge graph'],
  },
  // ── S15 additions: vector / distributed SQL (M29, M30) ─────────────────
  {
    term: 'embedding',
    def: {
      en: 'A dense vector of floating-point numbers (typically 768–3072 dimensions) produced by a neural model that encodes the semantic meaning of text, image, or audio. Semantically similar objects have vectors that are geometrically close (measured by cosine, L2, or dot-product distance). Embeddings are the foundation of vector search and RAG.',
      uk: 'Щільний вектор чисел з плаваючою комою (типово 768–3072 вимірів), виготовлений нейронною моделлю, що кодує семантичний зміст тексту, зображення або аудіо. Семантично схожі об\'єкти мають геометрично близькі вектори (вимірюється cosine, L2 або dot-product відстанню). Embeddings є основою vector search та RAG.',
    },
    seeAlso: ['vector database', 'HNSW', 'RAG'],
  },
  {
    term: 'vector database',
    def: {
      en: 'A database optimised for storing and querying high-dimensional embedding vectors. Core operation: k-nearest-neighbour (kNN) search — find the k vectors most similar to a query vector. Implementations include pgvector (PostgreSQL extension), Qdrant, Milvus, Weaviate, and Pinecone. Powers semantic search, RAG, recommendation systems, and anomaly detection.',
      uk: 'База даних, оптимізована для зберігання та запиту high-dimensional embedding vectors. Основна операція: k-nearest-neighbour (kNN) пошук — знайти k векторів, найбільш схожих на query vector. Реалізації включають pgvector (розширення PostgreSQL), Qdrant, Milvus, Weaviate та Pinecone. Забезпечує semantic search, RAG, рекомендаційні системи та виявлення аномалій.',
    },
    seeAlso: ['embedding', 'HNSW', 'pgvector', 'RAG'],
  },
  {
    term: 'HNSW',
    def: {
      en: 'Hierarchical Navigable Small World — the dominant ANN index algorithm (Malkov & Yashunin 2018, arXiv:1603.09320). Builds a multi-layer proximity graph at index time. Query time: navigate greedily from an entry point, following edges toward the query vector, in O(log n). Key parameters: M (edges per node), ef_construction (build beam width), ef/ef_search (query beam width — trade recall for speed at query time without rebuilding).',
      uk: 'Hierarchical Navigable Small World — домінуючий алгоритм ANN індексу (Malkov & Yashunin 2018, arXiv:1603.09320). Будує багаторівневий граф суміжності під час індексації. Час запиту: жадібна навігація від точки входу, слідуючи ребрами до query vector, за O(log n). Ключові параметри: M (ребра на вузол), ef_construction (ширина beam при побудові), ef/ef_search (ширина beam при запиті — компроміс recall/швидкість без перебудови).',
    },
    seeAlso: ['vector database', 'ANN', 'pgvector'],
  },
  {
    term: 'ANN (Approximate Nearest Neighbour)',
    def: {
      en: 'A class of algorithms that return the k approximate nearest vectors to a query, trading a small recall reduction for orders-of-magnitude speedup over exact kNN. HNSW is the dominant ANN algorithm. Others include IVFFlat (inverted file index + flat scan within clusters) and ScaNN. Tuning the recall/speed trade-off is done at query time without rebuilding the index.',
      uk: 'Клас алгоритмів, що повертають k приблизних найближчих векторів до запиту, жертвуючи невеликим зниженням recall заради значного прискорення порівняно з exact kNN. HNSW — домінуючий ANN алгоритм. Інші включають IVFFlat (інвертований файловий індекс + плоске сканування всередині кластерів) та ScaNN. Налаштування компромісу recall/швидкість виконується під час запиту без перебудови індексу.',
    },
    seeAlso: ['HNSW', 'vector database'],
  },
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    def: {
      en: 'A pattern for grounding LLM responses in external knowledge: (1) embed the user query, (2) ANN-search the vector store to retrieve top-k relevant chunks, (3) inject those chunks into the LLM prompt, (4) the LLM generates an answer using retrieved chunks as evidence. RAG keeps LLM knowledge fresh and reduces hallucination by providing current, domain-specific context. (Lewis et al., NeurIPS 2020.)',
      uk: 'Паттерн для обґрунтування відповідей LLM зовнішніми знаннями: (1) embed user query, (2) ANN-пошук у vector store для отримання top-k релевантних chunks, (3) вставка цих chunks у prompt LLM, (4) LLM генерує відповідь, використовуючи отримані chunks як докази. RAG підтримує знання LLM актуальними та зменшує галюцинації, надаючи поточний доменний контекст. (Lewis et al., NeurIPS 2020.)',
    },
    seeAlso: ['embedding', 'vector database', 'HNSW'],
  },
  {
    term: 'pgvector',
    def: {
      en: 'A PostgreSQL extension (v0.8.2, Feb 2026) that adds a `vector(n)` column type plus three index types: exact scan (no index), IVFFlat, and HNSW. Enables k-nearest-neighbour search, cosine/L2/dot-product distance operators (`<=>`, `<->`, `<#>`), and joining vector search results with relational data in a single SQL query. The dominant choice for RAG at ≤100M vectors on an existing Postgres stack.',
      uk: 'Розширення PostgreSQL (v0.8.2, лют. 2026), що додає тип стовпця `vector(n)` та три типи індексів: точне сканування (без індексу), IVFFlat та HNSW. Дозволяє k-nearest-neighbour пошук, оператори cosine/L2/dot-product відстані (`<=>`, `<->`, `<#>`) та join результатів vector search з реляційними даними в одному SQL-запиті. Домінуючий вибір для RAG при ≤100M векторів на наявному Postgres стеку.',
    },
    seeAlso: ['vector database', 'HNSW', 'RAG'],
  },
  {
    term: 'IVFFlat',
    def: {
      en: 'Inverted File + Flat (exhaustive) scan within clusters — an ANN index in pgvector. At build time, k-means partitions all vectors into `lists` Voronoi cells. At query time, the `probes` nearest cell centroids are selected and their vectors exhaustively scanned. Requires all data to exist before build (no online insert). Generally superseded by HNSW for new installs.',
      uk: 'Inverted File + Flat (вичерпне) сканування всередині кластерів — ANN індекс у pgvector. Під час побудови k-means розбиває всі вектори на `lists` комірок Вороного. Під час запиту обираються `probes` найближчих центроїдів комірок та їх вектори вичерпно скануються. Вимагає наявності всіх даних перед побудовою (без online insert). Загалом замінений HNSW для нових інсталяцій.',
    },
    seeAlso: ['HNSW', 'pgvector', 'ANN (Approximate Nearest Neighbour)'],
  },
  {
    term: 'NewSQL',
    def: {
      en: 'A category of database systems (term coined 2011 by 451 Research) that provide SQL semantics, ACID transactions, and horizontal write scalability simultaneously. Achieved via shared-nothing architectures with Raft-replicated ranges. Examples: CockroachDB, TiDB, YugabyteDB, Google Spanner, Aurora DSQL. Often expose the Postgres wire protocol.',
      uk: 'Категорія систем баз даних (термін введений у 2011 р. компанією 451 Research), що одночасно забезпечують SQL-семантику, ACID-транзакції та горизонтальне масштабування записів. Досягається через shared-nothing архітектури з Raft-реплікованими ranges. Приклади: CockroachDB, TiDB, YugabyteDB, Google Spanner, Aurora DSQL. Часто відкривають Postgres wire protocol.',
    },
    seeAlso: ['HTAP', 'TrueTime'],
  },
  {
    term: 'HTAP',
    def: {
      en: 'Hybrid Transactional/Analytical Processing — a database design that serves both OLTP (row-store, high-frequency short writes) and OLAP (columnar scan, large aggregations) workloads in a single cluster without ETL. TiDB achieves this via TiKV (row/Raft for OLTP) and TiFlash (columnar, Raft Learner replica for OLAP), letting the optimizer route queries to the appropriate storage.',
      uk: 'Hybrid Transactional/Analytical Processing — дизайн бази даних, що обслуговує як OLTP (row-store, часті короткі записи), так і OLAP (columnar scan, великі агрегації) навантаження в єдиному кластері без ETL. TiDB досягає цього через TiKV (row/Raft для OLTP) та TiFlash (columnar, Raft Learner replica для OLAP), дозволяючи optimizer маршрутизувати запити до відповідного сховища.',
    },
    seeAlso: ['NewSQL', 'columnar storage'],
  },
  {
    term: 'TrueTime',
    def: {
      en: 'Google Spanner\'s globally synchronised clock API, backed by GPS receivers and atomic clocks in every Google data centre. Returns a bounded uncertainty interval `[earliest, latest]` for the current wall-clock time. Spanner waits out this uncertainty before committing, guaranteeing that the commit timestamp is strictly later than any prior event\'s timestamp — enabling external consistency (linearisability) without distributed locks.',
      uk: 'Глобально синхронізований API годинника Google Spanner, підкріплений GPS-приймачами та атомними годинниками у кожному датацентрі Google. Повертає обмежений інтервал невизначеності `[earliest, latest]` для поточного wall-clock часу. Spanner очікує цю невизначеність перед commit, гарантуючи, що commit timestamp строго пізніший за timestamp будь-якої попередньої події — забезпечуючи external consistency (лінеаризованість) без distributed locks.',
    },
    seeAlso: ['NewSQL', 'linearizability'],
  },
  {
    term: 'Spanner Omni',
    def: {
      en: 'Google\'s on-premises deployment option for Cloud Spanner. As of June 2026, Spanner Omni is in **Preview** (not GA) and not covered by Google Cloud SLAs. Cloud Spanner (Google Cloud-managed) is GA. Teams needing Spanner-class consistency for self-hosted deployments should evaluate CockroachDB or YugabyteDB.',
      uk: 'On-premises варіант розгортання Cloud Spanner від Google. Станом на червень 2026 р., Spanner Omni знаходиться у **Preview** (не GA) і не покривається SLA Google Cloud. Cloud Spanner (керований Google Cloud) є GA. Команди, яким потрібна Spanner-класна консистентність для self-hosted розгортань, повинні оцінити CockroachDB або YugabyteDB.',
    },
    seeAlso: ['TrueTime', 'NewSQL'],
  },
  {
    term: 'Aurora DSQL',
    def: {
      en: 'AWS Aurora Distributed SQL — GA since May 2025. PostgreSQL 16-compatible, serverless active-active multi-region database with 99.999% multi-region availability SLA. Log-structured (no heap files). Uses optimistic concurrency control (OCC) — conflicts abort rather than wait. Zero-ops: no capacity planning, scales to zero.',
      uk: 'AWS Aurora Distributed SQL — GA з травня 2025 р. PostgreSQL 16-сумісна, serverless active-active multi-region база даних з SLA доступності 99.999% у кількох регіонах. Log-structured (без heap files). Використовує optimistic concurrency control (OCC) — конфлікти скасовуються замість очікування. Zero-ops: без планування потужностей, масштабується до нуля.',
    },
    seeAlso: ['NewSQL', 'optimistic concurrency control'],
  },

  // CHANGED (S16): M31 (analytics/columnar/time-series) + M32 (cloud-native & modern DBA) terms.
  {
    term: 'columnar storage',
    def: {
      en: 'Storing a table by column rather than by row, so each column is contiguous on disk. Reads touch only the columns a query needs and compress them hard (similar values sit adjacent) — the foundation of OLAP engines.',
      uk: 'Зберігання таблиці по колонках, а не по рядках, тож кожна колонка суцільна на диску. Читання торкаються лише потрібних запиту колонок і добре їх стискають (схожі значення лежать поруч) — основа OLAP-движків.',
    },
    seeAlso: ['OLAP', 'vectorized execution', 'Parquet'],
  },
  {
    term: 'vectorized execution',
    def: {
      en: 'Processing data in batches of thousands of values through tight CPU loops (often SIMD) instead of one tuple at a time (the Volcano model). Amortizes per-row overhead — a core reason columnar OLAP engines are fast.',
      uk: 'Обробка даних батчами по тисячі значень через щільні CPU-цикли (часто SIMD) замість одного tuple за раз (модель Volcano). Амортизує накладні витрати на рядок — ключова причина швидкості columnar OLAP-движків.',
    },
    seeAlso: ['columnar storage', 'OLAP'],
  },
  {
    term: 'ClickHouse',
    def: {
      en: 'An open-source columnar database server for large-scale, high-concurrency real-time analytics. Stores data in the MergeTree engine family (sorted immutable parts, background merges) with vectorized execution and materialized views that aggregate on INSERT.',
      uk: 'Open-source колонковий сервер бази даних для масштабної real-time аналітики з високою конкурентністю. Зберігає дані у родині движків MergeTree (сортовані незмінні parts, фонові merges) з vectorized execution та materialized views, що агрегують на INSERT.',
    },
    seeAlso: ['columnar storage', 'OLAP', 'LSM-tree'],
  },
  {
    term: 'DuckDB',
    def: {
      en: 'An in-process (embedded) columnar SQL OLAP engine — "the SQLite of analytics". Runs inside your process, queries Parquet/CSV/JSON directly (including from object storage) with predicate pushdown, and needs no server.',
      uk: 'In-process (вбудований) колонковий SQL OLAP-движок — «SQLite для аналітики». Працює всередині вашого процесу, запитує Parquet/CSV/JSON напряму (зокрема з object storage) з predicate pushdown і не потребує сервера.',
    },
    seeAlso: ['columnar storage', 'Parquet', 'lakehouse'],
  },
  {
    term: 'hypertable',
    def: {
      en: 'A TimescaleDB abstraction: one logical table automatically partitioned into time-ordered (and optionally space) chunks. The planner prunes to the chunks a query needs; old chunks can be compressed columnar and dropped by a retention policy.',
      uk: 'Абстракція TimescaleDB: одна логічна таблиця, автоматично розбита на time-ordered (і опційно space) chunks. Планувальник відсікає до chunks, потрібних запиту; старі chunks можна стиснути columnar і видалити політикою retention.',
    },
    seeAlso: ['TimescaleDB', 'continuous aggregate', 'table partitioning'],
  },
  {
    term: 'continuous aggregate',
    def: {
      en: 'A TimescaleDB rollup (materialized view over a hypertable) that refreshes incrementally — only the time buckets whose source rows changed are recomputed, and the live recent tail can be included — unlike REFRESH MATERIALIZED VIEW, which recomputes everything.',
      uk: 'Rollup TimescaleDB (materialized view над hypertable), що оновлюється інкрементально — перераховуються лише time buckets, чиї source-рядки змінились, і можна включати живий свіжий хвіст — на відміну від REFRESH MATERIALIZED VIEW, що перераховує все.',
    },
    seeAlso: ['hypertable', 'materialized view', 'TimescaleDB'],
  },
  {
    term: 'TimescaleDB',
    def: {
      en: 'A PostgreSQL extension for time-series: hypertables, continuous aggregates, columnar compression, and retention. Dual-licensed — Apache-2 core plus the Timescale License (TSL) for the advanced features (free to self-host, may not be resold as a managed service). The company rebranded to TigerData in 2025.',
      uk: 'PostgreSQL extension для time-series: hypertables, continuous aggregates, columnar compression та retention. Подвійна ліцензія — Apache-2 core плюс Timescale License (TSL) для розширених функцій (безкоштовно для self-host, не можна перепродавати як керований сервіс). Компанія перейменувалась на TigerData у 2025.',
    },
    seeAlso: ['hypertable', 'continuous aggregate'],
  },
  {
    term: 'lakehouse',
    def: {
      en: 'An architecture that puts an open table format (Iceberg/Delta/Hudi) over Parquet files in object storage, adding ACID transactions, schema evolution, and time travel. Decouples storage from compute so any engine can query the same data.',
      uk: 'Архітектура, що кладе open table format (Iceberg/Delta/Hudi) над Parquet-файлами в object storage, додаючи ACID-транзакції, schema evolution та time travel. Розділяє storage і compute, тож будь-який движок може запитувати ті самі дані.',
    },
    seeAlso: ['Apache Iceberg', 'Parquet', 'OLAP'],
  },
  {
    term: 'Apache Iceberg',
    def: {
      en: 'An open table format for the lakehouse — vendor-neutral, with partition evolution, schema evolution, and time travel over Parquet files. The format the industry is converging on (AWS S3 Tables, Snowflake Polaris, BigQuery, and DuckDB all support it).',
      uk: 'Open table format для lakehouse — vendor-neutral, з partition evolution, schema evolution та time travel над Parquet-файлами. Формат, на який конвергує галузь (AWS S3 Tables, Snowflake Polaris, BigQuery та DuckDB — усі його підтримують).',
    },
    seeAlso: ['lakehouse', 'Parquet'],
  },
  {
    term: 'Parquet',
    def: {
      en: 'An open, columnar, compressed file format for analytical data. The physical layer of the lakehouse — engines read only the columns and row-groups a query needs, directly from object storage.',
      uk: 'Відкритий, колонковий, стиснутий файловий формат для аналітичних даних. Фізичний шар lakehouse — движки читають лише потрібні запиту колонки та row-groups, напряму з object storage.',
    },
    seeAlso: ['columnar storage', 'lakehouse', 'Apache Iceberg'],
  },
  {
    term: 'managed database (DBaaS)',
    def: {
      en: 'A database run by a cloud provider, which owns provisioning, patching, backups, HA/failover, and monitoring. You gain reliability and time but give up superuser/OS access and some extensions/configs, and accept a cost premium and lock-in (e.g. RDS, Aurora, Cloud SQL, AlloyDB, Atlas).',
      uk: 'База даних, якою керує хмарний провайдер, що володіє provisioning, патчингом, backups, HA/failover та monitoring. Ви отримуєте надійність і час, але віддаєте superuser/доступ до ОС і частину extensions/configs та приймаєте премію до ціни і lock-in (напр. RDS, Aurora, Cloud SQL, AlloyDB, Atlas).',
    },
    seeAlso: ['shared responsibility model', 'high availability (HA)'],
  },
  {
    term: 'shared responsibility model',
    def: {
      en: 'The split of who owns each layer of a system between you and a cloud provider. With a managed database the provider takes the bottom (hardware, OS, patching, backups, failover) and you keep the top (schema, indexes, queries, data) — the line moves up but never reaches the top.',
      uk: 'Розподіл того, хто володіє кожним шаром системи, між вами та хмарним провайдером. З керованою базою провайдер бере низ (hardware, ОС, патчинг, backups, failover), а ви тримаєте верх (schema, indexes, queries, data) — лінія піднімається, але ніколи не сягає самого верху.',
    },
    seeAlso: ['managed database (DBaaS)'],
  },
  {
    term: 'Kubernetes operator',
    def: {
      en: 'A pattern for running stateful software on Kubernetes: a Custom Resource Definition (CRD) plus a controller running a reconciliation loop that drives actual state toward the declared spec — encoding operational knowledge (failover, backups, upgrades) as code. CloudNativePG is the leading Postgres operator.',
      uk: 'Патерн для запуску stateful-софту на Kubernetes: Custom Resource Definition (CRD) плюс controller із reconciliation loop, що зводить фактичний стан до задекларованого spec — кодуючи операційні знання (failover, backups, upgrades) як код. CloudNativePG — провідний Postgres operator.',
    },
    seeAlso: ['CloudNativePG'],
  },
  {
    term: 'CloudNativePG',
    def: {
      en: 'A community-governed, vendor-neutral Kubernetes operator for PostgreSQL (CNCF Sandbox since January 2025). Manages the full lifecycle of an HA Postgres cluster via streaming replication: provisioning, failover, backups, and rolling upgrades.',
      uk: 'Community-governed, vendor-neutral Kubernetes operator для PostgreSQL (CNCF Sandbox з січня 2025). Керує повним життєвим циклом HA Postgres-кластера через streaming replication: provisioning, failover, backups та rolling upgrades.',
    },
    seeAlso: ['Kubernetes operator', 'streaming replication'],
  },
  {
    term: 'infrastructure as code (IaC)',
    def: {
      en: 'Defining infrastructure as declarative, version-controlled code applied reproducibly, instead of clicking consoles. Terraform/OpenTofu provision cloud resources; Ansible configures software on them. Key disciplines: idempotency and watching for drift.',
      uk: 'Опис інфраструктури як декларативного, version-controlled коду, застосованого відтворювано, замість клацання в консолях. Terraform/OpenTofu provision хмарні ресурси; Ansible конфігурує софт на них. Ключові дисципліни: idempotency та спостереження за drift.',
    },
    seeAlso: ['Terraform', 'OpenTofu'],
  },
  {
    term: 'Terraform',
    def: {
      en: 'The dominant infrastructure-as-code provisioning tool: declare resources, diff against tracked state (plan), then apply. HashiCorp moved it to the BSL license in 2023 and was acquired by IBM (2025); each version reverts to MPL four years after release.',
      uk: 'Домінантний infrastructure-as-code інструмент provisioning: декларуй ресурси, порівняй з відстеженим state (plan), потім apply. HashiCorp перевів його на ліцензію BSL у 2023 і був придбаний IBM (2025); кожна версія повертається до MPL через чотири роки після релізу.',
    },
    seeAlso: ['infrastructure as code (IaC)', 'OpenTofu'],
  },
  {
    term: 'OpenTofu',
    def: {
      en: 'The open-source, Linux-Foundation-governed fork of Terraform, created after HashiCorp\'s 2023 BSL relicense. A near-drop-in replacement for the Terraform CLI (reached 1.9 in early 2026).',
      uk: 'Open-source форк Terraform під керуванням Linux Foundation, створений після BSL-перереліцензування HashiCorp у 2023. Майже-drop-in заміна Terraform CLI (досяг 1.9 на початку 2026).',
    },
    seeAlso: ['Terraform', 'infrastructure as code (IaC)'],
  },
  {
    term: 'pg_stat_statements',
    def: {
      en: 'The PostgreSQL extension that tracks cumulative execution statistics per normalized query (calls, total/mean time, rows, buffer hits). Loaded via shared_preload_libraries. The single most valuable tool for finding the queries that cost the most overall — sort by total time, not the slowest single call.',
      uk: 'PostgreSQL extension, що відстежує кумулятивну статистику виконання на нормалізований запит (calls, total/mean time, rows, buffer hits). Завантажується через shared_preload_libraries. Найцінніший інструмент для пошуку запитів, що коштують найбільше загалом — сортуйте за сумарним часом, а не за одним найповільнішим викликом.',
    },
    seeAlso: ['observability', 'EXPLAIN'],
  },
  {
    term: 'observability',
    def: {
      en: 'Understanding a running system from its outputs — metrics, logs, and traces. For databases: pg_stat_statements/activity/io feeding postgres_exporter → Prometheus → Grafana, watching the golden signals (latency, traffic, errors, saturation).',
      uk: 'Розуміння робочої системи з її виходів — metrics, logs та traces. Для баз даних: pg_stat_statements/activity/io, що живлять postgres_exporter → Prometheus → Grafana, зі спостереженням за golden signals (latency, traffic, errors, saturation).',
    },
    seeAlso: ['pg_stat_statements'],
  },

  // ── S17 · Security (M33) ───────────────────────────────────────────────
  {
    term: 'row-level security (RLS)',
    def: {
      en: "A PostgreSQL feature (since 9.5) that filters which rows each role may see or change, via CREATE POLICY (USING for visible rows, WITH CHECK for writable rows) after ENABLE ROW LEVEL SECURITY. Ideal for multi-tenancy — but table owners and superusers bypass it unless you add FORCE ROW LEVEL SECURITY.",
      uk: "Можливість PostgreSQL (з 9.5), що фільтрує, які рядки кожна role може бачити чи змінювати, через CREATE POLICY (USING для видимих рядків, WITH CHECK для записуваних) після ENABLE ROW LEVEL SECURITY. Ідеально для multi-tenancy — але власники таблиць і superusers обходять її, доки ви не додасте FORCE ROW LEVEL SECURITY.",
    },
    seeAlso: ['least privilege', 'RBAC (role-based access control)'],
  },
  {
    term: 'RBAC (role-based access control)',
    def: {
      en: "Granting privileges to group roles and then granting membership, so permissions follow roles rather than individuals. In PostgreSQL a role can LOGIN (a user) or group others; GRANT/REVOKE on objects build the model, and PG14 added predefined roles (pg_read_all_data, pg_monitor).",
      uk: "Надання привілеїв груповим roles і потім надання членства, тож дозволи слідують за roles, а не за окремими людьми. У PostgreSQL role може LOGIN (користувач) чи групувати інших; GRANT/REVOKE на обʼєктах будують модель, а PG14 додав predefined roles (pg_read_all_data, pg_monitor).",
    },
    seeAlso: ['least privilege', 'row-level security (RLS)'],
  },
  {
    term: 'least privilege',
    def: {
      en: "The principle of granting each role exactly the privileges it needs and no more. The application should connect as a limited role — never a superuser or the table owner — so that a leaked credential or a SQL injection has a capped blast radius.",
      uk: "Принцип надання кожній role рівно тих привілеїв, що їй потрібні, і не більше. Застосунок має підключатися як обмежена role — ніколи superuser чи власник таблиці — щоб злитий credential чи SQL injection мали обмежений радіус ураження.",
    },
    seeAlso: ['RBAC (role-based access control)', 'SQL injection'],
  },
  {
    term: 'SCRAM-SHA-256',
    def: {
      en: "The modern salted challenge-response password authentication method in PostgreSQL, the default password_encryption for new clusters since PG14. It never sends the password over the wire. The older md5 method is deprecated (PG18 warns on use).",
      uk: "Сучасний salted challenge-response метод автентифікації паролем у PostgreSQL, дефолтний password_encryption для нових кластерів з PG14. Він ніколи не надсилає пароль по мережі. Старіший метод md5 застарів (PG18 попереджає при використанні).",
    },
    seeAlso: ['encryption in transit'],
  },
  {
    term: 'SQL injection',
    def: {
      en: "A vulnerability where untrusted input concatenated into a SQL string is parsed as code, letting an attacker bypass auth or destroy data. The reliable fix is parameterized queries, not escaping — CVE-2025-1094 showed even libpq escaping could be bypassed.",
      uk: "Вразливість, де недовірений вхід, сконкатенований у SQL-рядок, парситься як код, дозволяючи зловмиснику обійти auth чи знищити дані. Надійне виправлення — parameterized queries, а не escaping — CVE-2025-1094 показав, що навіть escaping libpq можна обійти.",
    },
    seeAlso: ['parameterized query', 'least privilege'],
  },
  {
    term: 'parameterized query',
    def: {
      en: "A query sent with placeholders ($1, $2) and the values supplied separately, so user input is always treated as data and can never alter the statement structure. Also called a prepared statement; the one reliable defense against SQL injection.",
      uk: "Запит, надісланий із плейсхолдерами ($1, $2) і значеннями, поданими окремо, тож вхід користувача завжди трактується як дані й ніколи не може змінити структуру statement. Також зветься prepared statement; єдиний надійний захист від SQL injection.",
    },
    seeAlso: ['SQL injection'],
  },
  {
    term: 'pgcrypto',
    def: {
      en: "A PostgreSQL extension for column-level encryption and hashing (e.g. pgp_sym_encrypt). It is not transparent: the application must encrypt and decrypt explicitly and manage the keys. Used for a handful of sensitive fields; filesystem encryption covers whole-disk at-rest protection.",
      uk: "Extension PostgreSQL для шифрування й hashing на рівні колонки (напр. pgp_sym_encrypt). Він не transparent: застосунок мусить шифрувати й розшифровувати явно та керувати ключами. Використовується для жменьки чутливих полів; шифрування файлової системи покриває whole-disk захист at-rest.",
    },
    seeAlso: ['encryption at rest'],
  },
  {
    term: 'encryption at rest',
    def: {
      en: "Protecting stored data so a stolen disk or backup is useless. Community PostgreSQL has no built-in transparent data encryption (TDE): use filesystem encryption (LUKS/BitLocker), pgcrypto for specific columns, or a cloud/enterprise TDE. Key management is the hard part.",
      uk: "Захист збережених даних, щоб вкрадений диск чи backup був марним. Community PostgreSQL не має вбудованого transparent data encryption (TDE): використовуйте шифрування файлової системи (LUKS/BitLocker), pgcrypto для конкретних колонок чи cloud/enterprise TDE. Key management — найскладніше.",
    },
    seeAlso: ['encryption in transit', 'pgcrypto'],
  },
  {
    term: 'encryption in transit',
    def: {
      en: "Protecting data on the network with TLS between client and server. Set the client to sslmode=verify-full to check both that the link is encrypted and that the server certificate is the expected one — which is what actually defeats a man-in-the-middle attack.",
      uk: "Захист даних у мережі через TLS між клієнтом і сервером. Встановіть клієнту sslmode=verify-full, щоб перевіряти і що зʼєднання зашифроване, і що сертифікат сервера очікуваний, — це й перемагає атаку man-in-the-middle.",
    },
    seeAlso: ['encryption at rest'],
  },
  {
    term: 'Argon2id',
    def: {
      en: "The OWASP first-choice password hashing algorithm — slow and memory-hard, so a stolen table resists GPU brute force. A salted, one-way hash for storing application user passwords; alternatives are bcrypt and scrypt. Never use a fast hash (MD5/SHA-256) for passwords.",
      uk: "Перший вибір OWASP для hashing паролів — повільний і memory-hard, тож вкрадена таблиця опирається GPU brute force. Salted, односторонній hash для зберігання паролів користувачів застосунку; альтернативи — bcrypt і scrypt. Ніколи не використовуйте швидкий hash (MD5/SHA-256) для паролів.",
    },
    seeAlso: ['bcrypt'],
  },
  {
    term: 'bcrypt',
    def: {
      en: "A mature, widely available slow password hashing algorithm with a tunable work factor (≥12 in 2026) and a 72-byte input limit. A solid alternative to Argon2id for storing user passwords; like all password hashes it carries a per-hash salt.",
      uk: "Зрілий, широко доступний повільний алгоритм hashing паролів із налаштовуваним work factor (≥12 у 2026) і лімітом входу 72 байти. Надійна альтернатива Argon2id для зберігання паролів користувачів; як усі hash паролів, несе per-hash salt.",
    },
    seeAlso: ['Argon2id'],
  },

  // ── S17 · Performance (M34) ────────────────────────────────────────────
  {
    term: 'N+1 query problem',
    def: {
      en: "An application anti-pattern where loading a list of N items lazily fires one query for the list plus one per item — N+1 round-trips. Each query is fast, so it hides in per-query metrics; the fix is eager loading with a JOIN or a single batched IN query.",
      uk: "Анти-патерн застосунку, де завантаження списку з N елементів лінько запускає один запит за списком плюс один на кожен елемент — N+1 round-trips. Кожен запит швидкий, тож він ховається в per-query метриках; виправлення — eager loading через JOIN чи один batched IN-запит.",
    },
    seeAlso: ['EXPLAIN'],
  },
  {
    term: 'connection pooling',
    def: {
      en: "Placing a pool of reusable database connections between the application and PostgreSQL, because each PG connection is a backend process (~5-10 MB, slow to create). A pooler multiplexes thousands of clients onto a small warm pool; smaller pools are usually faster.",
      uk: "Розміщення пулу повторно використовуваних підключень до бази між застосунком і PostgreSQL, бо кожне підключення PG — backend-процес (~5-10 MB, повільне у створенні). Pooler мультиплексує тисячі клієнтів на малий теплий пул; менші пули зазвичай швидші.",
    },
    seeAlso: ['PgBouncer', 'transaction pooling'],
  },
  {
    term: 'PgBouncer',
    def: {
      en: "The standard lightweight connection pooler for PostgreSQL. Three pool modes: session (safe default), transaction (highest reuse, the usual choice for web apps), and statement. Modern alternatives include pgcat (Rust) and Supavisor (Elixir).",
      uk: "Стандартний легкий connection pooler для PostgreSQL. Три режими пулу: session (безпечний дефолт), transaction (найвище повторне використання, звичайний вибір для вебзастосунків) і statement. Сучасні альтернативи — pgcat (Rust) і Supavisor (Elixir).",
    },
    seeAlso: ['connection pooling', 'transaction pooling'],
  },
  {
    term: 'transaction pooling',
    def: {
      en: "A PgBouncer pool mode that returns the server connection to the pool after each transaction, giving the highest connection reuse — the usual choice for web apps. The trade-off: session-scoped state (temp tables, SET, session advisory locks) does not survive across transactions.",
      uk: "Режим пулу PgBouncer, що повертає серверне підключення в пул після кожної транзакції, даючи найвище повторне використання — звичайний вибір для вебзастосунків. Компроміс: session-scoped стан (temp tables, SET, session advisory locks) не переживає між транзакціями.",
    },
    seeAlso: ['PgBouncer', 'connection pooling'],
  },
  {
    term: 'read replica',
    def: {
      en: "A standby copy kept current by streaming replication that serves read-only queries, offloading the primary for horizontal read scaling. The caveat is replication lag: route writes and read-your-writes to the primary, since a replica may be milliseconds to seconds behind.",
      uk: "Standby-копія, що тримається актуальною через streaming replication і обслуговує read-only запити, розвантажуючи primary для горизонтального масштабування читань. Застереження — replication lag: маршрутизуйте записи й read-your-writes на primary, бо replica може відставати на мілісекунди-до-секунд.",
    },
    seeAlso: ['horizontal scaling (scale out)'],
  },
  {
    term: 'vertical scaling (scale up)',
    def: {
      en: "Adding capacity by using a bigger machine — more RAM, CPU, faster disk. Simple and transparent to the application, so it is almost always the right first hardware move; the limits are a finite ceiling and cost that climbs faster than capacity.",
      uk: "Додавання capacity через більшу машину — більше RAM, CPU, швидший диск. Просто й прозоро для застосунку, тож це майже завжди правильний перший апаратний крок; межі — скінченна стеля й вартість, що зростає швидше за capacity.",
    },
    seeAlso: ['horizontal scaling (scale out)'],
  },
  {
    term: 'horizontal scaling (scale out)',
    def: {
      en: "Adding capacity by spreading load across machines — read replicas for reads, partitioning for one large table, then sharding or distributed SQL for write throughput beyond a single primary. Near-linear but operationally complex; reach for it after tuning, pooling, and scaling up.",
      uk: "Додавання capacity через розподіл навантаження між машинами — read replicas для читань, partitioning для однієї великої таблиці, потім sharding чи distributed SQL для write-throughput понад один primary. Майже лінійно, але операційно складно; беріть це після тюнінгу, pooling і scale up.",
    },
    seeAlso: ['vertical scaling (scale up)', 'read replica'],
  },
  {
    term: 'polyglot persistence',
    def: {
      en: "Using different data stores for different jobs within one system, because different problems are best solved with different storage technologies (Martin Fowler). Powerful, but every store you add is a permanent operational cost and a cross-store consistency risk — reach for it when the workload demands it, not for a more sophisticated diagram.",
      uk: "Використання різних сховищ для різних задач у межах однієї системи, бо різні проблеми найкраще розвʼязуються різними технологіями зберігання (Martin Fowler). Потужно, але кожне додане сховище — постійна операційна вартість і ризик consistency між сховищами — беріть це, коли workload вимагає, а не заради вишуканішої діаграми.",
    },
    seeAlso: ['system of record', 'dual-write problem'],
  },
  {
    term: 'system of record',
    def: {
      en: "The single authoritative store for a given fact — the source of truth that other copies (caches, search indexes, read models) derive from. Designating one store (usually PostgreSQL) as the system of record is how a polyglot system avoids ambiguity about which copy is correct.",
      uk: "Єдине авторитетне сховище для певного факту — джерело істини, з якого походять інші копії (кеші, search-indexes, read models). Призначення одного сховища (зазвичай PostgreSQL) системою запису — це те, як polyglot-система уникає неоднозначності, яка копія правильна.",
    },
    seeAlso: ['polyglot persistence', 'dual-write problem'],
  },
  {
    term: 'dual-write problem',
    def: {
      en: "When an application writes the same fact to two stores in two separate steps (e.g. a database plus a cache or search index), a failure between the writes leaves them inconsistent. The fix is to write once to the system of record and propagate asynchronously and idempotently via the transactional outbox or change-data-capture — never two independent synchronous writes.",
      uk: "Коли застосунок пише той самий факт у два сховища двома окремими кроками (напр., база плюс кеш чи search-index), збій між записами лишає їх неконсистентними. Фікс — писати раз у систему запису й поширювати асинхронно та ідемпотентно через transactional outbox чи change-data-capture — ніколи не два незалежні синхронні записи.",
    },
    seeAlso: ['transactional outbox', 'system of record', 'polyglot persistence'],
  },
  {
    term: 'résumé-driven development',
    def: {
      en: "An anti-pattern in which a technology is chosen because it looks impressive on a CV rather than because it fits the workload — the database equivalent of inverting requirements-first decision-making. The antidote is to justify every choice starting from the workload, and to make any deviation from the relational default earn its place.",
      uk: "Анти-патерн, у якому технологію обирають тому, що вона вражає в резюме, а не тому, що пасує workload — базоданнєвий еквівалент інверсії підходу «спершу вимоги». Протиотрута — виправдовувати кожен вибір, починаючи з workload, і змушувати будь-яке відхилення від реляційного default заслужити своє місце.",
    },
  },
];
