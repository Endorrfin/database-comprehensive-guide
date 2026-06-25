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
];
