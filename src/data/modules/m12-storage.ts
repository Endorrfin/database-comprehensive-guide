import type { Module } from '../types';

/*
 * M12 · How data is stored — Section III (S7). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-24 (see `sources`):
 *  - PostgreSQL stores data in fixed-size pages (default BLCKSZ = 8 kB); a tuple cannot span
 *    pages. Page layout = header → line-pointer (ItemId) array growing forward, tuples growing
 *    backward from the end, free space between, optional special space.
 *  - TOAST triggers when a row exceeds TOAST_TUPLE_THRESHOLD (~2 kB, 2032 bytes on a stock 8 kB
 *    build): large varlena values are compressed and/or moved out-of-line to a side TOAST table,
 *    leaving an 18-byte on-disk pointer in the main tuple. Compression = pglz (default) or lz4
 *    (default_toast_compression). Per-column storage: PLAIN / MAIN / EXTERNAL / EXTENDED.
 *  - fillfactor: heap default 100, B-tree default 90; lower heap fillfactor leaves room for
 *    same-page (HOT) updates. CLUSTER reorders a table by an index ONCE and is not maintained.
 *  - Row-store (PostgreSQL) suits OLTP (whole row by key); column-store (ClickHouse/DuckDB —
 *    M31) suits OLAP (one column over many rows; 5–20× compression + SIMD vectorized execution).
 *  - Latency hierarchy (jboner "Latency Numbers"): L1 ~0.5 ns · L2 ~7 ns · RAM ~100 ns ·
 *    SSD 4 kB random read ~150 µs · HDD seek ~10 ms — each step is orders of magnitude slower.
 * Non-signature module (figures + tables + compare, no hero sim): figures 'memory-hierarchy'
 * and 'heap-page'. signature:false in concepts.ts — it ships strong static visuals, not a widget.
 */
export const m12: Module = {
  id: 'm12-storage',
  num: 12,
  section: 's3-storage',
  order: 1,
  level: 'senior',
  title: { en: 'How data is stored', uk: 'Як зберігаються дані' },
  tagline: {
    en: 'The memory hierarchy, pages & the heap, row vs columnar, TOAST.',
    uk: 'Ієрархія памʼяті, pages і heap, row проти columnar, TOAST.',
  },
  readMins: 13,
  mentalModel: {
    en: 'Disk is far; every design choice is about minimizing trips to it.',
    uk: 'Диск далеко; кожне рішення дизайну — про мінімізацію походів до нього.',
  },
  topics: [
    {
      id: 'memory-hierarchy',
      title: { en: 'The memory hierarchy', uk: 'Ієрархія памʼяті' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Everything a database does is shaped by one physical fact: **the data is too big for RAM, so it lives on storage that is far away in time.** Memory comes in a hierarchy, and each step down is *orders of magnitude* slower than the one above it. A CPU register is instant; an L1 cache hit is ~0.5 ns; main memory is ~100 ns; a random read from an SSD is ~150 µs; a single seek on a spinning disk is ~10 ms. That last number is **twenty million times** slower than the register. The database's entire design — pages, indexes, buffers, sequential scans — exists to **minimize and sequentialize** how often it pays those costs.",
            uk: "Усе, що робить база даних, формується одним фізичним фактом: **даних забагато для RAM, тож вони живуть на сховищі, далекому в часі.** Памʼять існує ієрархією, і кожен крок униз на *порядки* повільніший за попередній. Регістр CPU миттєвий; L1 cache hit ~0.5 нс; основна памʼять ~100 нс; випадкове читання з SSD ~150 мкс; один seek на дисковому накопичувачі ~10 мс. Останнє число — у **двадцять мільйонів разів** повільніше за регістр. Уся будова бази — pages, indexes, buffers, sequential scans — існує, щоб **мінімізувати й послідовнити** те, як часто вона платить ці витрати.",
          },
        },
        {
          kind: 'figure',
          fig: 'memory-hierarchy',
          caption: {
            en: 'The latency ladder. Scaled so an L1 hit takes one second, main memory takes ~3 minutes, an SSD read takes ~3–4 days, and one disk seek takes ~8 months. Slower also means bigger and cheaper.',
            uk: 'Драбина latency. У масштабі, де L1 hit = одна секунда, основна памʼять — ~3 хвилини, читання з SSD — ~3–4 дні, а один disk seek — ~8 місяців. Повільніше також означає більше й дешевше.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two consequences run through the rest of this guide. First, **RAM is a cache and disk is the truth**: a database keeps hot pages in a memory buffer (the *shared buffers* / *buffer pool*) and only touches storage on a miss — so a working set that fits in RAM is the difference between a fast system and a slow one. Second, **sequential beats random**: reading a megabyte in storage order is far cheaper per byte than scattering the same reads across the device, because of prefetch, larger transfers, and (on disks) avoiding seeks. That single asymmetry is why a full sequential scan can beat an index for a query that touches a large fraction of the table (M16), and why write-optimized engines buffer and sort writes before flushing (M15).",
            uk: "Два наслідки проходять крізь решту цього guide. По-перше, **RAM — це кеш, а диск — істина**: база тримає гарячі pages у memory buffer (*shared buffers* / *buffer pool*) і чіпає сховище лише на miss — тож working set, що вміщається в RAM, — це різниця між швидкою й повільною системою. По-друге, **sequential перемагає random**: прочитати мегабайт у порядку зберігання значно дешевше на байт, ніж розпорошити ті самі читання по пристрою, — через prefetch, більші передачі й (на дисках) уникнення seeks. Саме ця асиметрія пояснює, чому повний sequential scan може перемогти index для запиту, що зачіпає велику частку таблиці (M16), і чому write-optimized движки буферизують і сортують записи перед скиданням (M15).",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A database is an I/O machine', uk: 'База даних — це I/O-машина' },
          md: {
            en: "When you reason about performance, reason about **trips to storage and whether they are sequential**, not about CPU. The CPU is almost never the bottleneck in an OLTP database; the question is always *how many pages must I read, and can I read them in order?* Indexes (M13–M14) trade a few extra pages of structure for turning a whole-table scan into a few targeted page reads. Caching, pooling, and buffer tuning (M34) are all about keeping the working set off the slow tiers.",
            uk: "Коли міркуєте про продуктивність, міркуйте про **походи до сховища і чи вони послідовні**, а не про CPU. CPU майже ніколи не є вузьким місцем в OLTP-базі; питання завжди *скільки pages треба прочитати і чи можна по порядку?* Indexes (M13–M14) міняють кілька зайвих pages структури на перетворення сканування всієї таблиці на кілька влучних читань pages. Кешування, pooling і тюнінг buffer (M34) — усе про те, щоб тримати working set подалі від повільних рівнів.",
          },
        },
      ],
    },
    {
      id: 'pages-and-heap',
      title: { en: 'Pages & the heap', uk: 'Pages і heap' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A database does not read or write one row at a time — it reads and writes **pages** (also called blocks). In PostgreSQL a page is **8 kB** (the `BLCKSZ` build constant) and it is the **atomic unit of I/O**: to read a single 100-byte row, the engine reads the whole 8 kB page that contains it. A table is stored as a **heap** — an unordered pile of these pages. “Unordered” is the key word: a heap makes no promise about row order, so finding a specific row without an index means scanning pages until you hit it.",
            uk: "База не читає й не пише по одному рядку — вона читає й пише **pages** (також blocks). У PostgreSQL page — це **8 кБ** (build-константа `BLCKSZ`), і це **атомарна одиниця I/O**: щоб прочитати один рядок на 100 байтів, движок читає всю page на 8 кБ, що його містить. Таблиця зберігається як **heap** — невпорядкована купа цих pages. «Невпорядкована» — ключове слово: heap нічого не обіцяє щодо порядку рядків, тож знайти конкретний рядок без index означає сканувати pages, доки не натрапиш.",
          },
        },
        {
          kind: 'figure',
          fig: 'heap-page',
          caption: {
            en: 'An 8 kB heap page: a fixed header, an array of line pointers (ItemIds) growing forward, tuples (row versions) growing backward from the end, and free space shrinking in the middle. A row is addressed by its TID = (page number, line pointer).',
            uk: 'Heap page на 8 кБ: фіксований header, масив line pointers (ItemIds), що росте вперед, tuples (версії рядків), що ростуть назад від кінця, і вільне місце, що стискається посередині. Рядок адресується через TID = (номер page, line pointer).',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Inside a page, the layout is deliberate: a fixed header, then an array of **line pointers** (small `(offset, length)` slots) growing forward from the front, while the **tuples** — the actual row versions — grow backward from the end, with free space shrinking in the middle as the page fills. Each row is addressed by a **TID** (tuple id, exposed as `ctid`) = `(page number, line-pointer index)`. The indirection through line pointers is what lets a row's physical position move within its page (after an update) without every index having to be rewritten — the index points at a line pointer, not at raw bytes.",
            uk: "Усередині page розкладка навмисна: фіксований header, далі масив **line pointers** (малі слоти `(offset, length)`), що росте вперед від початку, тоді як **tuples** — самі версії рядків — ростуть назад від кінця, а вільне місце стискається посередині, доки page заповнюється. Кожен рядок адресується через **TID** (tuple id, доступний як `ctid`) = `(номер page, індекс line pointer)`. Непрямість через line pointers і дозволяє фізичній позиції рядка зсуватися в межах його page (після update) без переписування кожного index — index указує на line pointer, а не на сирі байти.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Finding one row in a million — why the access path dominates. Costs are page reads, the currency that matters.',
            uk: 'Знайти один рядок з мільйона — чому access path домінує. Витрати — це читання pages, валюта, що має значення.',
          },
          head: [
            { en: 'Access path', uk: 'Access path' },
            { en: 'Pages read (≈)', uk: 'Прочитано pages (≈)' },
            { en: 'Why', uk: 'Чому' },
          ],
          rows: [
            [
              { en: 'Sequential scan (no index)', uk: 'Sequential scan (без index)' },
              { en: 'every page — tens of thousands', uk: 'кожну page — десятки тисяч' },
              { en: 'Heap is unordered; you must look at every row.', uk: 'Heap невпорядкований; треба переглянути кожен рядок.' },
            ],
            [
              { en: 'B-Tree index scan', uk: 'B-Tree index scan' },
              { en: '~3–4 + the heap page', uk: '~3–4 + heap page' },
              { en: 'A few hops down the tree, each hop one page (M13).', uk: 'Кілька стрибків деревом, кожен — одна page (M13).' },
            ],
            [
              { en: 'Hash index (equality)', uk: 'Hash index (рівність)' },
              { en: '~1–2 + the heap page', uk: '~1–2 + heap page' },
              { en: 'Hash the key straight to its bucket (M14).', uk: 'Хешуємо ключ просто в його bucket (M14).' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Sequential vs random, again', uk: 'Sequential проти random, знову' },
          md: {
            en: "An index scan turns *fewer pages* into *random* page reads (jump here, jump there); a sequential scan reads *more pages* but **in physical order**, which the OS and storage prefetch aggressively. That is why the planner has a `seq_page_cost` and a higher `random_page_cost`, and why for a query returning a large fraction of the table it may *correctly* choose the seq scan. Counting rows is the beginner's model; counting **page reads, weighted by sequential-vs-random**, is the professional's.",
            uk: "Index scan перетворює *менше pages* на *випадкові* читання pages (стрибок сюди, стрибок туди); sequential scan читає *більше pages*, але **у фізичному порядку**, який ОС і сховище агресивно prefetch-ують. Тому планувальник має `seq_page_cost` і вищий `random_page_cost`, і тому для запиту, що повертає велику частку таблиці, він може *правильно* обрати seq scan. Рахувати рядки — модель новачка; рахувати **читання pages, зважені за sequential-проти-random**, — модель професіонала.",
          },
        },
      ],
    },
    {
      id: 'row-vs-columnar',
      title: { en: 'Row-store vs column-store', uk: 'Row-store проти column-store' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "How you place columns **within** the page is the deepest fork in storage. A **row-store** keeps all of a row's columns together, one row after another — so fetching, inserting, or updating a *whole row by key* touches one page. That is exactly the OLTP access pattern, and it is what PostgreSQL, MySQL, and most operational databases do. A **column-store** keeps each column's values together, one column after another — so scanning *one column across millions of rows* reads only that column's data. That is the OLAP access pattern: `SELECT avg(amount) FROM sales` reads the `amount` column and nothing else.",
            uk: "Те, як ви розміщуєте колонки **в межах** page, — найглибше розгалуження в зберіганні. **Row-store** тримає всі колонки рядка разом, рядок за рядком — тож узяти, вставити чи оновити *цілий рядок за ключем* чіпає одну page. Це саме OLTP-патерн доступу, і саме так роблять PostgreSQL, MySQL і більшість операційних баз. **Column-store** тримає значення кожної колонки разом, колонку за колонкою — тож сканування *однієї колонки по мільйонах рядків* читає лише дані цієї колонки. Це OLAP-патерн: `SELECT avg(amount) FROM sales` читає колонку `amount` і нічого більше.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Row-store (OLTP)', uk: 'Row-store (OLTP)' },
          b: { en: 'Column-store (OLAP)', uk: 'Column-store (OLAP)' },
          rows: [
            [
              { en: 'Physical layout', uk: 'Фізична розкладка' },
              { en: 'All columns of a row, together', uk: 'Усі колонки рядка — разом' },
              { en: 'All values of a column, together', uk: 'Усі значення колонки — разом' },
            ],
            [
              { en: 'Fetch / update one whole row', uk: 'Узяти / оновити цілий рядок' },
              { en: 'Cheap — one page', uk: 'Дешево — одна page' },
              { en: 'Expensive — reassemble from every column', uk: 'Дорого — зібрати з кожної колонки' },
            ],
            [
              { en: 'Aggregate one column over millions of rows', uk: 'Агрегат однієї колонки по мільйонах рядків' },
              { en: 'Expensive — reads every column of every row', uk: 'Дорого — читає кожну колонку кожного рядка' },
              { en: 'Cheap — reads only that column', uk: 'Дешево — читає лише ту колонку' },
            ],
            [
              { en: 'Compression', uk: 'Стиснення' },
              { en: 'Modest — mixed types per page', uk: 'Помірне — мішані типи на page' },
              { en: '5–20× — same-type values, delta/dictionary/RLE', uk: '5–20× — однотипні значення, delta/dictionary/RLE' },
            ],
            [
              { en: 'Execution', uk: 'Виконання' },
              { en: 'Row-at-a-time, index-driven', uk: 'По рядку за раз, кероване index' },
              { en: 'Vectorized — SIMD over column batches', uk: 'Vectorized — SIMD по батчах колонок' },
            ],
            [
              { en: 'Built for', uk: 'Створено для' },
              { en: 'Many small reads/writes, high concurrency', uk: 'Багато малих читань/записів, висока конкурентність' },
              { en: 'Few huge scans & aggregates', uk: 'Кілька величезних сканувань і агрегатів' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "The column layout unlocks two compounding wins. **Compression**: a column holds one data type with repetitive values, which delta, dictionary, and run-length encoding squeeze 5–20×, so you read far fewer bytes. **Vectorized execution**: the engine processes a *batch* of column values at once with SIMD instructions instead of one row at a time, which is dramatically more CPU-efficient for aggregates. This is why **ClickHouse and DuckDB** (M31) answer a billion-row aggregate in well under a second while a row-store would choke. PostgreSQL is a row-store; you get columnar either via extensions or by shipping analytics to a separate OLAP engine.",
            uk: "Колонкова розкладка відмикає два взаємопідсилювальні виграші. **Стиснення**: колонка містить один тип даних із повторюваними значеннями, які delta, dictionary й run-length encoding стискають у 5–20×, тож ви читаєте значно менше байтів. **Vectorized execution**: движок обробляє *батч* значень колонки за раз SIMD-інструкціями замість рядка за раз, що різко ефективніше для агрегатів. Тому **ClickHouse і DuckDB** (M31) відповідають на агрегат по мільярду рядків значно менш ніж за секунду, тоді як row-store захлинувся б. PostgreSQL — row-store; columnar отримують або через extensions, або відправляючи аналітику в окремий OLAP-движок.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: "Don't run OLAP on your OLTP store", uk: 'Не запускайте OLAP на своєму OLTP-сховищі' },
          md: {
            en: "The two layouts optimize *opposite* access patterns, so they fight. A heavy reporting query — wide aggregate scans — on your row-store production database reads every column of every row and evicts the hot OLTP pages from cache, hurting the transactional traffic that pays the bills. The standard fix is to **separate the workloads**: a read replica, a logical-replication feed into a columnar engine, or a periodic export to a warehouse (M31). Mixing them in one engine is *HTAP*, and it is an explicit design choice, not a default.",
            uk: "Дві розкладки оптимізують *протилежні* патерни доступу, тож вони конфліктують. Важкий звітний запит — широкі агрегатні сканування — на вашому row-store продакшені читає кожну колонку кожного рядка й витісняє гарячі OLTP-pages з кешу, шкодячи транзакційному трафіку, що платить рахунки. Стандартне рішення — **розділити навантаження**: read replica, фід logical replication у columnar-движок або періодичний експорт у warehouse (M31). Змішати їх в одному движку — це *HTAP*, і це явний вибір дизайну, а не дефолт.",
          },
        },
      ],
    },
    {
      id: 'toast-and-layout',
      title: { en: 'Big values & layout', uk: 'Великі значення й розкладка' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A tuple cannot span pages, yet a single `text` or `jsonb` value can be megabytes. PostgreSQL resolves this with **TOAST** — *The Oversized-Attribute Storage Technique*. When a row's total width exceeds `TOAST_TUPLE_THRESHOLD` (~2 kB, i.e. 2032 bytes on a stock 8 kB build), TOAST **compresses** large variable-length values and, if still too big, **moves them out-of-line** into a hidden side table, leaving just an **18-byte pointer** in the main tuple. It is transparent — you `SELECT` the column normally — and it is why a table with a giant `jsonb` column still has a slim main heap.",
            uk: "Tuple не може охоплювати кілька pages, проте одне значення `text` чи `jsonb` може важити мегабайти. PostgreSQL розвʼязує це через **TOAST** — *The Oversized-Attribute Storage Technique*. Коли загальна ширина рядка перевищує `TOAST_TUPLE_THRESHOLD` (~2 кБ, тобто 2032 байти на стоковому 8 кБ build), TOAST **стискає** великі значення змінної довжини і, якщо все ще завеликі, **виносить їх out-of-line** у приховану побічну таблицю, лишаючи в основному tuple лише **18-байтовий покажчик**. Це прозоро — ви `SELECT`-ите колонку як завжди — і саме тому таблиця з величезною `jsonb`-колонкою все одно має стрункий основний heap.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Per-column storage strategy (ALTER TABLE … SET STORAGE). Default for most varlena types is EXTENDED.',
            uk: 'Стратегія зберігання на колонку (ALTER TABLE … SET STORAGE). Дефолт для більшості varlena-типів — EXTENDED.',
          },
          head: [
            { en: 'STORAGE', uk: 'STORAGE' },
            { en: 'Compress?', uk: 'Стискати?' },
            { en: 'Move out-of-line?', uk: 'Виносити out-of-line?' },
            { en: 'Use for', uk: 'Для чого' },
          ],
          rows: [
            [
              { en: 'PLAIN', uk: 'PLAIN' },
              { en: 'No', uk: 'Ні' },
              { en: 'No (inline only)', uk: 'Ні (лише inline)' },
              { en: 'Fixed-length types that always fit', uk: 'Типи фіксованої довжини, що завжди вміщаються' },
            ],
            [
              { en: 'MAIN', uk: 'MAIN' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Only as a last resort', uk: 'Лише як крайній засіб' },
              { en: 'Keep compressed but inline when possible', uk: 'Тримати стиснутим, але inline за змоги' },
            ],
            [
              { en: 'EXTERNAL', uk: 'EXTERNAL' },
              { en: 'No', uk: 'Ні' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Already-compressed blobs; faster substring access', uk: 'Уже стиснуті blob; швидший доступ до підрядків' },
            ],
            [
              { en: 'EXTENDED (default)', uk: 'EXTENDED (дефолт)' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Yes', uk: 'Так' },
              { en: 'The default for text/jsonb/bytea', uk: 'Дефолт для text/jsonb/bytea' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "Two more knobs shape physical layout. **Compression method**: TOAST uses `pglz` by default, but **`lz4`** (set `default_toast_compression = lz4`) compresses and especially *decompresses* much faster for a small ratio cost — usually a win on modern hardware. **`fillfactor`**: how full to pack a page on initial load. The heap default is **100** (pack tight); the B-Tree default is **90**. Lowering a heap's fillfactor leaves free space *on each page* so an `UPDATE` can write the new row version **on the same page** — a **HOT** (Heap-Only Tuple) update that avoids touching the table's indexes at all. For an update-heavy table, a fillfactor of 80–90 can dramatically cut index write amplification.",
            uk: "Ще дві ручки формують фізичну розкладку. **Метод стиснення**: TOAST за замовчуванням вживає `pglz`, але **`lz4`** (встановіть `default_toast_compression = lz4`) стискає й особливо *розпаковує* значно швидше за малу втрату коефіцієнта — зазвичай виграш на сучасному залізі. **`fillfactor`**: наскільки щільно пакувати page при початковому завантаженні. Дефолт heap — **100** (пакувати щільно); дефолт B-Tree — **90**. Зниження fillfactor для heap лишає вільне місце *на кожній page*, щоб `UPDATE` міг записати нову версію рядка **на ту саму page** — це **HOT** (Heap-Only Tuple) update, що взагалі не чіпає indexes таблиці. Для таблиці з частими update fillfactor 80–90 може різко зрізати index write amplification.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Faster TOAST decompression for a JSON-heavy table
SET default_toast_compression = lz4;          -- cluster/session default

-- A document column that is already compressed (e.g. stores gzipped blobs):
-- skip pglz/lz4 and keep it out-of-line for fast partial reads.
ALTER TABLE documents
  ALTER COLUMN payload SET STORAGE EXTERNAL;

-- An update-heavy table: leave 15% free per page so UPDATEs stay HOT
-- (new row version on the same page → no index writes when no indexed column changed).
ALTER TABLE sessions SET (fillfactor = 85);
VACUUM FULL sessions;   -- rewrite so the new fillfactor takes effect

-- One-time physical reorder by an index (NOT maintained afterward):
CLUSTER orders USING orders_created_at_idx;`,
          note: {
            en: 'Storage tuning is per-column (STORAGE) and per-table (fillfactor). CLUSTER reorders once; new and updated rows drift out of order again, so it is a maintenance operation, not a guarantee.',
            uk: 'Тюнінг зберігання — на колонку (STORAGE) і на таблицю (fillfactor). CLUSTER упорядковує одноразово; нові й оновлені рядки знову розходяться, тож це операція обслуговування, а не гарантія.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'The TOAST / SELECT * tax', uk: 'Податок TOAST / SELECT *' },
          md: {
            en: "A large TOASTed column is cheap to *store* but not free to *read*: fetching it means following the pointer to the TOAST table and **decompressing** it. `SELECT *` pulls and de-TOASTs every big value on **every** matching row — so a wide scan that the user never needed the blob for pays for it anyway. Select only the columns you need, and remember that a rarely-read megabyte `jsonb` is best kept out of the row you scan constantly (a separate table, or `EXTERNAL` storage if it is already compressed).",
            uk: "Велика TOAST-колонка дешева для *зберігання*, але не безкоштовна для *читання*: узяти її означає піти за покажчиком у TOAST-таблицю й **розпакувати**. `SELECT *` витягає й де-TOAST-ить кожне велике значення на **кожному** відповідному рядку — тож широке сканування, де користувачу blob не потрібен, усе одно за нього платить. Вибирайте лише потрібні колонки й памʼятайте, що мегабайтну `jsonb`, яку рідко читають, краще тримати поза рядком, який ви постійно скануєте (окрема таблиця або `EXTERNAL`-зберігання, якщо вона вже стиснута).",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Storage is a hierarchy where each step down is orders of magnitude slower; the whole database is built to minimize and sequentialize trips to it. RAM is a cache, disk is the truth.',
      uk: 'Сховище — це ієрархія, де кожен крок униз на порядки повільніший; уся база збудована, щоб мінімізувати й послідовнити походи до нього. RAM — кеш, диск — істина.',
    },
    {
      en: 'The page (8 kB in PostgreSQL) is the unit of I/O: you read a row by reading its whole page. A table is a heap — an unordered pile of pages — so without an index you scan.',
      uk: 'Page (8 кБ у PostgreSQL) — це одиниця I/O: ви читаєте рядок, читаючи всю його page. Таблиця — це heap, невпорядкована купа pages, тож без index ви скануєте.',
    },
    {
      en: 'Row-stores win OLTP (whole row by key, one page); column-stores win OLAP (one column over millions of rows, 5–20× compression, vectorized SIMD). The layouts fight — separate the workloads.',
      uk: 'Row-store перемагає в OLTP (цілий рядок за ключем, одна page); column-store — в OLAP (одна колонка по мільйонах рядків, стиснення 5–20×, vectorized SIMD). Розкладки конфліктують — розділяйте навантаження.',
    },
    {
      en: 'TOAST transparently compresses and offloads values over ~2 kB to a side table, leaving an 18-byte pointer; lz4 decompresses faster than the pglz default. SELECT * de-TOASTs big columns on every row.',
      uk: 'TOAST прозоро стискає й виносить значення понад ~2 кБ у побічну таблицю, лишаючи 18-байтовий покажчик; lz4 розпаковує швидше за дефолтний pglz. SELECT * де-TOAST-ить великі колонки на кожному рядку.',
    },
    {
      en: 'fillfactor leaves room on a page for same-page HOT updates that skip index writes; CLUSTER reorders a table by an index once but is not maintained afterward.',
      uk: 'fillfactor лишає місце на page для HOT-оновлень на тій самій page, що оминають записи в index; CLUSTER упорядковує таблицю за index одноразово, але далі не підтримується.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'SELECT * on tables with big TOASTed columns', uk: 'SELECT * на таблицях з великими TOAST-колонками' },
      body: {
        en: 'Every wide row makes the planner fetch and decompress its out-of-line values, even when the query never uses them. On a scan over many rows this turns a cheap read into an I/O- and CPU-heavy one. Select only the columns you need, and move rarely-read large blobs out of the hot row.',
        uk: 'Кожен широкий рядок змушує планувальник узяти й розпакувати його out-of-line значення, навіть коли запит їх не вживає. На скануванні багатьох рядків це перетворює дешеве читання на важке за I/O й CPU. Вибирайте лише потрібні колонки й виносьте рідко читані великі blob з гарячого рядка.',
      },
    },
    {
      title: { en: 'Running analytics on the OLTP row-store', uk: 'Запускати аналітику на OLTP row-store' },
      body: {
        en: 'A wide aggregate over a row-store reads every column of every row and evicts hot transactional pages from cache, slowing the operational traffic that matters. Heavy analytics belong on a columnar engine or at least a read replica — not on the primary that serves users.',
        uk: 'Широкий агрегат на row-store читає кожну колонку кожного рядка й витісняє гарячі транзакційні pages з кешу, гальмуючи важливий операційний трафік. Важка аналітика належить columnar-движку або принаймні read replica — не primary, що обслуговує користувачів.',
      },
    },
    {
      title: { en: 'Assuming an index always beats a scan', uk: 'Вважати, що index завжди бʼє scan' },
      body: {
        en: 'An index scan trades fewer pages for random page reads; a sequential scan reads more pages but in prefetchable order. For a predicate that matches a large fraction of the table, the planner correctly prefers the seq scan. Reason in page reads weighted by sequential-vs-random, not in row counts.',
        uk: 'Index scan міняє менше pages на випадкові читання pages; sequential scan читає більше pages, але в порядку, придатному до prefetch. Для предиката, що зачіпає велику частку таблиці, планувальник правильно віддає перевагу seq scan. Міркуйте в читаннях pages, зважених за sequential-проти-random, а не в кількості рядків.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Why is the page, not the row, the unit of I/O — and what follows from that?',
        uk: 'Чому page, а не рядок, є одиницею I/O — і що з цього випливає?',
      },
      a: {
        en: 'Storage hardware transfers fixed-size blocks, and the cost of a read is dominated by reaching the data, not by its size, so it is far more efficient to move a whole page (8 kB in PostgreSQL) than to fetch individual bytes. The database therefore reads and writes pages: to get one 100-byte row it reads the entire page that holds it, and the buffer pool caches pages, not rows. Several consequences follow. Indexes are valuable because they cut the number of pages you must touch — turning a whole-table scan into a few targeted page reads. Sequential access is far cheaper than random because it amortizes the fixed reach cost and enables prefetch, which is why the planner weights random_page_cost above seq_page_cost and may pick a seq scan for low-selectivity queries. Row width matters: fitting more rows per page means fewer pages for the same data. And updating a row rewrites its page, which is why fillfactor, HOT updates, and vacuum all revolve around page-level mechanics.',
        uk: 'Залізо сховища передає блоки фіксованого розміру, і вартість читання визначається діставанням до даних, а не їх розміром, тож значно ефективніше перемістити цілу page (8 кБ у PostgreSQL), ніж брати окремі байти. Тому база читає й пише pages: щоб дістати один рядок на 100 байтів, вона читає всю page, що його тримає, а buffer pool кешує pages, а не рядки. Звідси кілька наслідків. Indexes цінні, бо зрізають кількість pages, які треба зачепити, — перетворюють сканування всієї таблиці на кілька влучних читань pages. Послідовний доступ значно дешевший за випадковий, бо амортизує фіксовану вартість діставання й вмикає prefetch, — тому планувальник важить random_page_cost вище за seq_page_cost і може обрати seq scan для запитів низької селективності. Ширина рядка має значення: більше рядків на page означає менше pages для тих самих даних. А оновлення рядка переписує його page — тому fillfactor, HOT updates і vacuum усі крутяться навколо механіки рівня page.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Row-store vs column-store — when would you reach for each, and why?',
        uk: 'Row-store проти column-store — коли брати кожен і чому?',
      },
      a: {
        en: 'It comes down to the access pattern. A row-store keeps a row’s columns together, so reading, inserting, or updating a whole row by key touches one page — ideal for OLTP: many small reads and writes, point lookups, high concurrency, ACID. That is PostgreSQL, MySQL, most operational systems. A column-store keeps each column together, so an analytical query that scans a few columns across millions of rows reads only those columns. It also unlocks two compounding wins: columns of one type with repetitive values compress 5–20×, and the engine can process batches of values with SIMD (vectorized execution) instead of row-at-a-time. That is the OLAP pattern — wide aggregates and scans — and why ClickHouse and DuckDB are columnar. The mistake is using one layout for the other workload: analytics on a row-store reads every column of every row, while single-row updates on a column-store must touch every column file. In practice you separate them: OLTP on the row-store, analytics on a columnar engine fed by replication or ETL.',
        uk: 'Усе зводиться до патерну доступу. Row-store тримає колонки рядка разом, тож читання, вставка чи оновлення цілого рядка за ключем чіпає одну page — ідеально для OLTP: багато малих читань і записів, точкові пошуки, висока конкурентність, ACID. Це PostgreSQL, MySQL, більшість операційних систем. Column-store тримає кожну колонку разом, тож аналітичний запит, що сканує кілька колонок по мільйонах рядків, читає лише ті колонки. Це також відмикає два взаємопідсилювальні виграші: колонки одного типу з повторюваними значеннями стискаються в 5–20×, а движок може обробляти батчі значень через SIMD (vectorized execution) замість рядка за раз. Це OLAP-патерн — широкі агрегати й сканування — і тому ClickHouse і DuckDB columnar. Помилка — вживати одну розкладку для протилежного навантаження: аналітика на row-store читає кожну колонку кожного рядка, тоді як оновлення одного рядка на column-store мусить чіпати кожен файл колонки. На практиці їх розділяють: OLTP на row-store, аналітика на columnar-движку, що живиться реплікацією чи ETL.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'What is TOAST, and describe a real situation where it quietly hurts performance.',
        uk: 'Що таке TOAST і опишіть реальну ситуацію, де він тихо шкодить продуктивності.',
      },
      a: {
        en: 'TOAST — The Oversized-Attribute Storage Technique — is how PostgreSQL stores values too big to fit a tuple, since a tuple cannot span the 8 kB page. When a row exceeds about 2 kB, TOAST compresses large variable-length values and, if still too large, moves them out-of-line into a hidden side table, leaving an 18-byte pointer inline. It is transparent on read. The classic quiet regression: a table has a big jsonb or text column — a document, a serialized payload — and the application does SELECT * over many rows for a list view that does not even display that column. Every matching row now follows its TOAST pointer and decompresses the blob, turning a scan that should touch only the main heap into one that does extra random I/O and CPU per row, and bloats the buffer cache with data nobody reads. The fixes are to select only the needed columns, to split the rarely-read large attribute into its own table so the hot row stays narrow, and — if the blob is already compressed — to set its storage to EXTERNAL so PostgreSQL does not waste cycles trying to recompress it. It is a good example of how a physical-storage detail shows up as an application-level latency mystery.',
        uk: 'TOAST — The Oversized-Attribute Storage Technique — це те, як PostgreSQL зберігає значення, завеликі для tuple, адже tuple не може охоплювати 8 кБ page. Коли рядок перевищує близько 2 кБ, TOAST стискає великі значення змінної довжини і, якщо все ще завеликі, виносить їх out-of-line у приховану побічну таблицю, лишаючи inline 18-байтовий покажчик. На читанні це прозоро. Класична тиха регресія: таблиця має велику jsonb- чи text-колонку — документ, серіалізований payload — а застосунок робить SELECT * по багатьох рядках для списку, що навіть не показує ту колонку. Кожен відповідний рядок тепер іде за своїм TOAST-покажчиком і розпаковує blob, перетворюючи сканування, що мало б чіпати лише основний heap, на таке, що робить зайвий random I/O і CPU на рядок, і роздуває buffer cache даними, які ніхто не читає. Рішення — вибирати лише потрібні колонки, винести рідко читаний великий атрибут в окрему таблицю, щоб гарячий рядок лишався вузьким, і — якщо blob уже стиснутий — встановити його storage у EXTERNAL, щоб PostgreSQL не марнував цикли на спробу перестиснути. Це добрий приклад того, як деталь фізичного зберігання проявляється як загадка latency на рівні застосунку.',
      },
    },
  ],
  seeAlso: ['m13-btree', 'm14-index-toolbox', 'm16-query-planning', 'm31-analytics', 'm9-data-types'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 73.6. Database Page Layout (8 kB pages, line pointers, tuples, free space, special space)',
      url: 'https://www.postgresql.org/docs/current/storage-page-layout.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 66.2. TOAST (TOAST_TUPLE_THRESHOLD ~2 kB, out-of-line + compression, 18-byte pointer, PLAIN/MAIN/EXTERNAL/EXTENDED)',
      url: 'https://www.postgresql.org/docs/current/storage-toast.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — CREATE TABLE (fillfactor: heap default 100; storage parameters)',
      url: 'https://www.postgresql.org/docs/current/sql-createtable.html',
    },
    {
      title: 'ClickHouse — Row-oriented vs column-oriented databases (column layout: 5–20× compression, vectorized/SIMD execution, OLAP vs OLTP)',
      url: 'https://clickhouse.com/resources/engineering/row-vs-column-database',
    },
    {
      title: 'Latency Numbers Every Programmer Should Know (jboner gist) — L1 ~0.5 ns, RAM ~100 ns, SSD random read ~150 µs, disk seek ~10 ms',
      url: 'https://gist.github.com/jboner/2841832',
    },
  ],
};
