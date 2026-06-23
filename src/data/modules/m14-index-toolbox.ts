import type { Module } from '../types';

/*
 * M14 · The index toolbox — Section III (S7). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-24 (see `sources`):
 *  - B-Tree is the default; equality + range + sort + leftmost-prefix on multicolumn.
 *  - Hash index: 32-bit hash, equality (=) ONLY; WAL-logged / crash-safe & replicable since
 *    PostgreSQL 10 (before that, unlogged → unusable in production).
 *  - GIN = inverted index (many keys per row: array, jsonb @>, full-text, hstore). GiST =
 *    balanced tree of bounding predicates (geometry, ranges, FTS, KNN <->, exclusion). SP-GiST =
 *    space-partitioned / non-balanced (quadtree, IP/text prefix). BRIN = block-range min/max
 *    summaries — tiny, only effective when physical order correlates with the column.
 *  - Bitmap index scan is a RUNTIME strategy, not a stored type: build in-memory bitmaps from one
 *    or more indexes, combine with BitmapAnd/BitmapOr, then visit the heap in physical order.
 *  - Covering index: INCLUDE non-key payload columns (B-Tree/GiST/SP-GiST) since PostgreSQL 11 →
 *    index-only scan (needs the visibility map current → VACUUM). Expressions can't be INCLUDEd.
 *  - Multicolumn leftmost-prefix rule; PostgreSQL 18 adds B-Tree SKIP SCAN: a multicolumn index
 *    can help even when a leading column is omitted, probing once per distinct leading value —
 *    best when that column has few distinct values. Column order still matters.
 *  - B-Tree deduplication (posting lists for duplicate keys) since PostgreSQL 13.
 *  - Full-text: tsvector @@ tsquery, GIN (default, faster search) vs GiST (lossy, smaller).
 *    pg_trgm (trigram) GIN/GiST makes LIKE '%x%' / ILIKE / fuzzy indexable.
 *  - Every index is write amplification + storage + maintenance; an unused index is pure cost.
 * Signature module: hero ★ index-access-path picker sim (key 'index-picker') + figure
 * 'index-only-scan'. signature:true in concepts.ts.
 */
export const m14: Module = {
  id: 'm14-index-toolbox',
  num: 14,
  section: 's3-storage',
  order: 3,
  level: 'senior',
  signature: true,
  title: { en: 'The index toolbox', uk: 'Набір індексів' },
  tagline: {
    en: 'Hash, GIN/GiST/BRIN, full-text, covering/partial/expression — and what NOT to index.',
    uk: 'Hash, GIN/GiST/BRIN, full-text, covering/partial/expression — і що НЕ індексувати.',
  },
  readMins: 14,
  mentalModel: {
    en: 'Pick the index to the query shape; each index is a write you pay for.',
    uk: 'Підбирайте index під форму запиту; кожен index — це запис, за який ви платите.',
  },
  topics: [
    {
      id: 'hash-and-the-toolbox',
      title: { en: 'The toolbox & the hash index', uk: 'Набір інструментів і hash index' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The B-Tree (M13) is the default index and, most of the time, the right answer: it serves equality, ranges (`<`, `>`, `BETWEEN`), sorting, and anchored prefixes, all in `O(log n)`. But it is **one tool**, and the rest of this module is the rest of the toolbox. The guiding idea is simple: **a special index exists because a particular query shape or data shape beats what a B-Tree can do** — multi-valued columns, full-text documents, geometry, or tables so huge that even a B-Tree is too big. Match the index to the *shape of the query*, not to a habit.",
            uk: "B-Tree (M13) — типовий index і, здебільшого, правильна відповідь: він обслуговує рівність, діапазони (`<`, `>`, `BETWEEN`), сортування й закріплені префікси, усе за `O(log n)`. Але це **один інструмент**, а решта модуля — решта набору. Провідна ідея проста: **спеціальний index існує тому, що певна форма запиту чи форма даних перемагає те, що може B-Tree** — багатозначні колонки, повнотекстові документи, геометрія або таблиці настільки величезні, що навіть B-Tree завеликий. Підбирайте index під *форму запиту*, а не під звичку.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The first alternative is the **hash index**. It stores a 32-bit hash of the indexed value and answers a single question — `column = value` — in roughly one or two page reads, with no tree to descend. The catch is that it answers *only* that question: no `<`/`>`, no `BETWEEN`, no `ORDER BY`, no prefix matching, because a hash destroys ordering by design. It is also worth knowing the history: before **PostgreSQL 10**, hash indexes were not WAL-logged, so they were not crash-safe or replicated and were effectively unusable in production; PG 10 fixed that. In practice the B-Tree usually still wins even for equality — it does equality *and* everything else — so hash is a niche you reach for only when you have very large keys, pure equality lookups, and a measured benefit.",
            uk: "Перша альтернатива — **hash index**. Він зберігає 32-бітний хеш індексованого значення й відповідає на одне питання — `column = value` — приблизно за одне-два читання pages, без дерева для спуску. Підступ у тому, що він відповідає *лише* на нього: жодних `<`/`>`, `BETWEEN`, `ORDER BY` чи префіксів, бо хеш за побудовою знищує порядок. Варто знати й історію: до **PostgreSQL 10** hash indexes не були WAL-logged, тож не були crash-safe чи реплікованими й фактично не годилися для продакшену; PG 10 це виправив. На практиці B-Tree зазвичай усе одно перемагає навіть на рівності — він робить рівність *і* все інше — тож hash це ніша, до якої тягнешся лише за дуже великих ключів, суто equality-пошуків і виміряного виграшу.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'B-Tree already does equality', uk: 'B-Tree уже робить рівність' },
          md: {
            en: "Reaching for a hash index “because it's O(1)” is usually a mistake: a B-Tree answers `=` in a handful of page reads too, *and* supports range, sort, multicolumn, covering, and partial variants. Default to the B-Tree; justify any other type by a query or data shape it genuinely cannot serve.",
            uk: "Тягнутися до hash index «бо він O(1)» зазвичай помилка: B-Tree теж відповідає на `=` за кілька читань pages, *і* підтримує range, sort, multicolumn, covering та partial варіанти. За замовчуванням — B-Tree; будь-який інший тип виправдовуйте формою запиту чи даних, яку він справді не може обслужити.",
          },
        },
      ],
    },
    {
      id: 'specialized-indexes',
      title: { en: 'The specialized index zoo', uk: 'Зоопарк спеціалізованих індексів' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "When the value in a column is not a simple scalar — it is an array, a JSON document, a block of text, a geometry, or a range — a B-Tree on the whole value is useless, because the question is no longer “is this value less than that one?” PostgreSQL ships a family of access methods, each built for a different *kind* of question. Use the picker below to map a query shape to the index that serves it (and see why the others can't), then read the details.",
            uk: "Коли значення в колонці не простий скаляр — це масив, JSON-документ, блок тексту, геометрія чи діапазон — B-Tree по всьому значенню марний, бо питання вже не «чи це значення менше за те?». PostgreSQL постачає родину access methods, кожен побудований під інший *вид* питання. Скористайтеся вибором нижче, щоб зіставити форму запиту з index, що його обслуговує (і побачити, чому інші не можуть), а тоді читайте деталі.",
          },
        },
        {
          kind: 'sim',
          sim: 'index-picker',
        },
        {
          kind: 'table',
          caption: {
            en: 'The index toolbox at a glance. B-Tree is the default; reach past it only for the shapes it cannot serve.',
            uk: 'Набір індексів коротко. B-Tree — дефолт; виходьте за нього лише для форм, які він не обслуговує.',
          },
          head: [
            { en: 'Index', uk: 'Index' },
            { en: 'Best for', uk: 'Найкраще для' },
            { en: "Can't do", uk: 'Не вміє' },
          ],
          rows: [
            [
              { en: 'B-Tree (default)', uk: 'B-Tree (дефолт)' },
              { en: 'Equality, ranges, sort, anchored prefix, multicolumn', uk: 'Рівність, діапазони, сортування, закріплений префікс, multicolumn' },
              { en: 'Multi-valued columns, full-text, geometry', uk: 'Багатозначні колонки, full-text, геометрія' },
            ],
            [
              { en: 'Hash', uk: 'Hash' },
              { en: 'Pure equality on large keys', uk: 'Чиста рівність на великих ключах' },
              { en: 'Ranges, sort, prefix — anything ordered', uk: 'Діапазони, сортування, префікс — будь-що впорядковане' },
            ],
            [
              { en: 'GIN', uk: 'GIN' },
              { en: 'Many keys per row: array/jsonb @>, full-text', uk: 'Багато ключів на рядок: array/jsonb @>, full-text' },
              { en: 'Slow to build/update; not for scalar ranges', uk: 'Повільний на build/update; не для скалярних діапазонів' },
            ],
            [
              { en: 'GiST', uk: 'GiST' },
              { en: 'Geometry, ranges, nearest-neighbor (<->), FTS', uk: 'Геометрія, діапазони, nearest-neighbor (<->), FTS' },
              { en: 'Lossy — rechecks the heap; not for plain equality', uk: 'Lossy — перевіряє heap повторно; не для простої рівності' },
            ],
            [
              { en: 'SP-GiST', uk: 'SP-GiST' },
              { en: 'Non-balanced/partitioned data: quadtree, IP, text prefix', uk: 'Незбалансовані/розбиті дані: quadtree, IP, текстовий префікс' },
              { en: 'General-purpose work — it is specialized', uk: 'Загального призначення — він спеціалізований' },
            ],
            [
              { en: 'BRIN', uk: 'BRIN' },
              { en: 'Huge tables physically ordered by the column (time-series)', uk: 'Величезні таблиці, фізично впорядковані за колонкою (time-series)' },
              { en: 'Anything where physical order is random', uk: 'Будь-що, де фізичний порядок випадковий' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "Read the zoo by what each one indexes. **GIN** (Generalized Inverted Index) is an *inverted* index — it maps every element/key inside a value to the rows that contain it — so it is the answer for `array @> '{...}'`, `jsonb @> '{...}'`, and full-text. **GiST** (Generalized Search Tree) is a balanced tree of *bounding predicates*, perfect for things with extent or distance: geometry, range types, nearest-neighbor (`ORDER BY location <-> point`), and exclusion constraints. **SP-GiST** is its space-partitioned, non-balanced cousin for data that clusters unevenly — quadtrees, IP-routing, text prefixes. **BRIN** (Block Range Index) is the outlier: instead of one entry per row, it stores a tiny **min/max summary per block range**, so a billion-row table gets an index measured in kilobytes — but it only works when the table's *physical order correlates with the column*, as with append-only timestamps.",
            uk: "Читайте зоопарк за тим, що кожен індексує. **GIN** (Generalized Inverted Index) — *інвертований* index: він зіставляє кожен елемент/ключ усередині значення з рядками, що його містять, — тож це відповідь для `array @> '{...}'`, `jsonb @> '{...}'` і full-text. **GiST** (Generalized Search Tree) — збалансоване дерево *обмежувальних предикатів*, ідеальне для речей з протяжністю чи відстанню: геометрія, range-типи, nearest-neighbor (`ORDER BY location <-> point`) та exclusion constraints. **SP-GiST** — його space-partitioned, незбалансований родич для даних, що групуються нерівномірно — quadtrees, IP-маршрутизація, текстові префікси. **BRIN** (Block Range Index) — виняток: замість одного запису на рядок він зберігає крихітне **min/max-резюме на діапазон блоків**, тож таблиця на мільярд рядків отримує index у кілобайтах — але це працює лише коли *фізичний порядок таблиці корелює з колонкою*, як із append-only позначками часу.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Bitmap scans: how indexes cooperate', uk: 'Bitmap scans: як indexes співпрацюють' },
          md: {
            en: "A **bitmap index scan** is not a stored index type — it is a *runtime* strategy. PostgreSQL reads one or more indexes into in-memory bitmaps of matching row locations, combines them with **BitmapAnd / BitmapOr** (so two separate single-column indexes can serve `WHERE a = 1 AND b = 2`), and then visits the heap **in physical page order** instead of jumping around. That is why you sometimes see `Bitmap Heap Scan` in `EXPLAIN` (M16) for medium-selectivity queries: it is the planner's bridge between a pure index scan and a seq scan, and the reason you don't always need one composite index per query.",
            uk: "**Bitmap index scan** — не збережений тип index, а *runtime*-стратегія. PostgreSQL читає один чи кілька indexes у bitmap-и розташувань відповідних рядків у памʼяті, поєднує їх через **BitmapAnd / BitmapOr** (тож два окремі однопколонкові indexes можуть обслужити `WHERE a = 1 AND b = 2`), а тоді відвідує heap **у фізичному порядку pages**, а не стрибає. Тому інколи в `EXPLAIN` (M16) ви бачите `Bitmap Heap Scan` для запитів середньої селективності: це місток планувальника між чистим index scan і seq scan і причина, чому не завжди потрібен один composite index на кожен запит.",
          },
        },
      ],
    },
    {
      id: 'full-text-search',
      title: { en: 'Full-text search', uk: 'Повнотекстовий пошук' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Searching prose with `LIKE '%term%'` is the classic wrong tool. A leading wildcard means a B-Tree cannot help (the index is ordered by prefix, and there is no prefix), so it falls back to a full scan; and it matches *substrings*, not *words* — `LIKE '%cat%'` matches “category” and ignores the plural “cats”. **Full-text search** does it properly: it converts a document into a **`tsvector`** — normalized **lexemes** with stop-words removed and words stemmed (run, runs, running → *run*) — and matches it against a **`tsquery`** with the `@@` operator, backed by a **GIN** index on the `tsvector`. You get word-boundary matching, stemming, language configurations, and relevance ranking (`ts_rank`).",
            uk: "Шукати прозу через `LIKE '%term%'` — класичний хибний інструмент. Провідний шаблон означає, що B-Tree не допоможе (index упорядкований за префіксом, а префікса нема), тож він відкочується до повного сканування; і він зіставляє *підрядки*, а не *слова* — `LIKE '%cat%'` зачіпає «category» й ігнорує множину «cats». **Full-text search** робить це правильно: він перетворює документ на **`tsvector`** — нормалізовані **lexemes** з видаленими stop-words і стемінгом (run, runs, running → *run*) — і зіставляє його з **`tsquery`** оператором `@@`, спираючись на **GIN**-index по `tsvector`. Ви отримуєте зіставлення за межами слів, стемінг, мовні конфігурації й ранжування релевантності (`ts_rank`).",
          },
        },
        {
          kind: 'compare',
          a: { en: "LIKE '%term%'", uk: "LIKE '%term%'" },
          b: { en: 'Full-text search (tsvector @@ tsquery)', uk: 'Full-text search (tsvector @@ tsquery)' },
          rows: [
            [
              { en: 'Matches', uk: 'Зіставляє' },
              { en: 'Raw substrings, case/accent-sensitive', uk: 'Сирі підрядки, чутливі до регістру/акцентів' },
              { en: 'Normalized words (lexemes), stemmed', uk: 'Нормалізовані слова (lexemes), зі стемінгом' },
            ],
            [
              { en: 'Stemming / stop-words', uk: 'Стемінг / stop-words' },
              { en: 'None — “runs” ≠ “running”', uk: 'Нема — «runs» ≠ «running»' },
              { en: 'Yes — both stem to “run”', uk: 'Так — обидва стемляться до «run»' },
            ],
            [
              { en: 'Index', uk: 'Index' },
              { en: 'A leading % cannot use a B-Tree → scan', uk: 'Провідний % не може вжити B-Tree → scan' },
              { en: 'GIN on the tsvector → fast', uk: 'GIN по tsvector → швидко' },
            ],
            [
              { en: 'Ranking', uk: 'Ранжування' },
              { en: 'None', uk: 'Нема' },
              { en: 'ts_rank / ts_rank_cd relevance', uk: 'Релевантність ts_rank / ts_rank_cd' },
            ],
            [
              { en: 'Good for', uk: 'Добре для' },
              { en: 'Exact substrings, codes, prefixes (a%)', uk: 'Точні підрядки, коди, префікси (a%)' },
              { en: 'Human-language search over documents', uk: 'Пошук людською мовою по документах' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Full-text: index a generated tsvector, then match with @@ and rank.
ALTER TABLE articles
  ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;

CREATE INDEX articles_tsv_idx ON articles USING gin (tsv);

SELECT id, title, ts_rank(tsv, q) AS rank
FROM articles, to_tsquery('english', 'index & !hash') AS q
WHERE tsv @@ q
ORDER BY rank DESC
LIMIT 20;

-- Need real substring / fuzzy LIKE? Index trigrams (pg_trgm), not a B-Tree:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX people_name_trgm ON people USING gin (name gin_trgm_ops);
SELECT * FROM people WHERE name ILIKE '%ann%';   -- now index-assisted`,
          note: {
            en: 'GIN is the default FTS index (faster search); GiST is a smaller, lossy alternative for very write-heavy columns. pg_trgm covers the genuine “contains” / fuzzy case that FTS does not.',
            uk: 'GIN — дефолтний FTS-index (швидший пошук); GiST — менша, lossy альтернатива для колонок з дуже частими записами. pg_trgm покриває справжній випадок «містить» / fuzzy, який FTS не робить.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'pg_trgm rescues LIKE', uk: 'pg_trgm рятує LIKE' },
          md: {
            en: "If you genuinely need `ILIKE '%x%'` or fuzzy/typo-tolerant matching (not word search), don't give up on indexing — add a **trigram** index. `pg_trgm` breaks strings into 3-character grams and indexes them with GIN or GiST, making leading-wildcard `LIKE`/`ILIKE` and `similarity()` queries index-assisted. It is the right tool when full-text's word model is too coarse and a plain B-Tree can't help at all.",
            uk: "Якщо вам справді потрібен `ILIKE '%x%'` чи fuzzy/толерантне до помилок зіставлення (не пошук слів), не відмовляйтеся від індексації — додайте **trigram**-index. `pg_trgm` розбиває рядки на 3-символьні грами й індексує їх через GIN чи GiST, роблячи `LIKE`/`ILIKE` з провідним шаблоном і запити `similarity()` index-assisted. Це правильний інструмент, коли словесна модель full-text загруба, а простий B-Tree узагалі не допомагає.",
          },
        },
      ],
    },
    {
      id: 'index-shapes',
      title: { en: 'Composite, covering, partial & expression', uk: 'Composite, covering, partial та expression' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Beyond choosing a *type*, you **shape** the index to the query. A **composite (multicolumn)** index on `(a, b, c)` is sorted by `a`, then `b`, then `c`, so it serves predicates on `a`, `(a, b)`, `(a, b, c)`, and an `a`-leading `ORDER BY` — the **leftmost-prefix rule**. Historically a query on `b` alone could not use it. **PostgreSQL 18 adds B-Tree *skip scan***, which lets the index help even when a leading column is omitted: it probes the index once per distinct value of the skipped column. That is a big win **when the leading column has few distinct values** and shrinks as that count grows — so column order still matters. Put the column you most often filter by equality first.",
            uk: "Окрім вибору *типу*, ви **формуєте** index під запит. **Composite (multicolumn)** index по `(a, b, c)` відсортований за `a`, тоді `b`, тоді `c`, тож обслуговує предикати на `a`, `(a, b)`, `(a, b, c)` та `a`-провідний `ORDER BY` — це **leftmost-prefix rule**. Історично запит лише на `b` його вжити не міг. **PostgreSQL 18 додає B-Tree *skip scan***, що дозволяє index допомагати навіть коли провідну колонку пропущено: він зондує index раз на кожне різне значення пропущеної колонки. Це великий виграш, **коли провідна колонка має мало різних значень**, і зменшується зі зростанням цього числа — тож порядок колонок усе ще має значення. Ставте першою колонку, за якою найчастіше фільтруєте за рівністю.",
          },
        },
        {
          kind: 'figure',
          fig: 'index-only-scan',
          caption: {
            en: 'A covering index (INCLUDE) carries the payload columns in its leaves, so the query is answered from the index alone — an index-only scan that skips the heap fetch entirely (when the visibility map says the page is all-visible).',
            uk: 'Covering index (INCLUDE) несе payload-колонки у своїх leaves, тож запит відповідається лише з index — index-only scan, що повністю оминає похід у heap (коли visibility map каже, що page all-visible).',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Four ways to shape an index to the query.',
            uk: 'Чотири способи сформувати index під запит.',
          },
          head: [
            { en: 'Shape', uk: 'Форма' },
            { en: 'What it does', uk: 'Що робить' },
            { en: 'Reach for it when', uk: 'Беріть, коли' },
          ],
          rows: [
            [
              { en: 'Composite (a, b, c)', uk: 'Composite (a, b, c)' },
              { en: 'One index serving a leftmost-prefix of columns', uk: 'Один index обслуговує leftmost-prefix колонок' },
              { en: 'You filter/sort by the same column combo', uk: 'Ви фільтруєте/сортуєте за тією самою комбінацією колонок' },
            ],
            [
              { en: 'Covering — INCLUDE (col)', uk: 'Covering — INCLUDE (col)' },
              { en: 'Adds payload to leaves → index-only scan', uk: 'Додає payload у leaves → index-only scan' },
              { en: 'A hot query reads a few columns it could carry', uk: 'Гарячий запит читає кілька колонок, які можна нести' },
            ],
            [
              { en: 'Partial — WHERE …', uk: 'Partial — WHERE …' },
              { en: 'Indexes only the rows you query', uk: 'Індексує лише рядки, які ви запитуєте' },
              { en: 'You always filter on a small subset (status = …)', uk: 'Ви завжди фільтруєте на малу підмножину (status = …)' },
            ],
            [
              { en: 'Expression — (lower(col))', uk: 'Expression — (lower(col))' },
              { en: 'Indexes a computed value, not the raw column', uk: 'Індексує обчислене значення, а не сиру колонку' },
              { en: 'You query a transform (lower(email), (a+b))', uk: 'Ви запитуєте трансформацію (lower(email), (a+b))' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Covering: answer "amount for this order" from the index alone (index-only scan).
CREATE INDEX orders_cust_idx ON orders (customer_id) INCLUDE (amount, status);

-- Partial: index only the rows you actually query — smaller, cheaper to maintain.
CREATE INDEX orders_open_idx ON orders (created_at)
  WHERE status = 'open';

-- Expression: match a transform, so the predicate is sargable.
CREATE INDEX users_lower_email ON users (lower(email));
SELECT * FROM users WHERE lower(email) = 'a@b.com';   -- uses the index

-- Column order matters: equality column first, then the range column.
CREATE INDEX events_tenant_time ON events (tenant_id, occurred_at);
-- tenant_id = $1 AND occurred_at > $2  → ideal prefix use`,
          note: {
            en: 'INCLUDE columns are payload-only (no expressions); an index-only scan still needs the visibility map current, so keep VACUUM healthy. A partial index also shrinks write cost — rows outside its WHERE are never indexed.',
            uk: 'INCLUDE-колонки лише payload (без виразів); index-only scan усе одно потребує актуального visibility map, тож тримайте VACUUM здоровим. Partial index ще й зменшує вартість запису — рядки поза його WHERE ніколи не індексуються.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Leftmost-prefix, loosened — not erased', uk: 'Leftmost-prefix, послаблений — не скасований' },
          md: {
            en: "PostgreSQL 18's skip scan means you no longer *always* need the leading column in the predicate for a multicolumn index to help — but it shines only when that column is **low-cardinality** (a handful of distinct values), because it runs one index probe per distinct value. For a high-cardinality leading column, the old rule still effectively holds and a differently-ordered or dedicated index is better. So the design heuristic is unchanged: order composite columns by how you query them, equality-filtered and most-selective columns first.",
            uk: "Skip scan у PostgreSQL 18 означає, що вам більше не *завжди* потрібна провідна колонка в предикаті, щоб multicolumn index допоміг — але він сяє лише коли ця колонка **низької кардинальності** (жменя різних значень), бо виконує одне зондування index на кожне різне значення. Для провідної колонки високої кардинальності старе правило фактично діє, і кращий index з іншим порядком чи окремий. Тож евристика дизайну незмінна: упорядковуйте composite-колонки за тим, як ви їх запитуєте, спершу equality-фільтровані й найселективніші.",
          },
        },
      ],
    },
    {
      id: 'cost-of-indexes',
      title: { en: 'The cost of indexes', uk: 'Ціна індексів' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Indexes are not free lookups bolted onto a table — **every index is a write you pay for, forever.** Each `INSERT` must add an entry to *every* index on the table; each `UPDATE` that changes an indexed column must update them too (this is **write amplification**), they consume storage, they must be vacuumed and occasionally rebuilt, and too many of them slows writes and can even confuse the planner. The discipline of indexing is as much about **what NOT to index** as what to index.",
            uk: "Indexes — не безкоштовні пошуки, прикручені до таблиці: **кожен index — це запис, за який ви платите, назавжди.** Кожен `INSERT` мусить додати запис у *кожен* index таблиці; кожен `UPDATE`, що змінює індексовану колонку, мусить оновити і їх (це **write amplification**), вони споживають сховище, їх треба vacuum-ити й інколи перебудовувати, а забагато їх гальмує записи й навіть може заплутати планувальник. Дисципліна індексації — настільки ж про те, **що НЕ індексувати**, як і про те, що індексувати.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "How to choose, in practice: index for your **real** `WHERE`, `JOIN`, and `ORDER BY` patterns (look at your slow-query log, M16/M34), not for hypothetical ones. **Drop unused indexes** — `pg_stat_user_indexes` shows each index's `idx_scan` count; a long-lived index with zero scans is pure cost. Watch for **redundant** indexes: an index on `(a)` is already covered by a composite on `(a, b)`. Prefer one well-shaped composite over several overlapping singles. And remember the cost-saver from M12: **HOT updates** avoid index writes entirely when no indexed column changed and the page has fillfactor room — so over-indexing also quietly defeats that optimization.",
            uk: "Як обирати на практиці: індексуйте під ваші **реальні** патерни `WHERE`, `JOIN` і `ORDER BY` (дивіться slow-query log, M16/M34), а не під гіпотетичні. **Видаляйте невживані indexes** — `pg_stat_user_indexes` показує `idx_scan` кожного index; давній index з нулем scans — чиста витрата. Стежте за **надлишковими** indexes: index на `(a)` вже покритий composite на `(a, b)`. Віддавайте перевагу одному добре сформованому composite над кількома перекривними одинарними. І памʼятайте економію з M12: **HOT updates** взагалі оминають записи в index, коли жодна індексована колонка не змінилася й на page є місце fillfactor — тож надмірна індексація тихо перемагає й цю оптимізацію.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Over-indexing taxes every write', uk: 'Надмірна індексація оподатковує кожен запис' },
          md: {
            en: "“Index every column just in case” is a real anti-pattern with a real bill: each extra index slows every `INSERT`/`UPDATE`, inflates storage and backups, lengthens vacuum, and can push HOT updates back into index writes. An index earns its keep only if real queries use it. Periodically audit `idx_scan`, drop the zeros, and consolidate overlapping indexes — pruning indexes is a legitimate performance fix, not just adding them.",
            uk: "«Проіндексувати кожну колонку про всяк випадок» — реальний анти-патерн з реальним рахунком: кожен зайвий index гальмує кожен `INSERT`/`UPDATE`, роздуває сховище й backups, подовжує vacuum і може повернути HOT-оновлення в записи index. Index виправдовує себе лише якщо його вживають реальні запити. Періодично перевіряйте `idx_scan`, видаляйте нулі й обʼєднуйте перекривні indexes — обрізання indexes це легітимне виправлення продуктивності, а не лише їх додавання.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'B-Tree is the default and usually right (equality + range + sort + prefix + multicolumn). Reach for another type only for a query or data shape it cannot serve.',
      uk: 'B-Tree — дефолт і зазвичай правильний (рівність + діапазон + сортування + префікс + multicolumn). Беріть інший тип лише для форми запиту чи даних, яку він не обслуговує.',
    },
    {
      en: 'Hash = pure equality (niche, since B-Tree also does equality; crash-safe only since PG 10). GIN = many keys per row (array/jsonb/FTS). GiST = geometry/ranges/nearest-neighbor. BRIN = tiny index for huge physically-ordered tables.',
      uk: 'Hash = чиста рівність (ніша, бо B-Tree теж робить рівність; crash-safe лише з PG 10). GIN = багато ключів на рядок (array/jsonb/FTS). GiST = геометрія/діапазони/nearest-neighbor. BRIN = крихітний index для величезних фізично впорядкованих таблиць.',
    },
    {
      en: 'Full-text search (tsvector @@ tsquery + GIN) gives word, stemmed, ranked search where LIKE cannot; pg_trgm trigram indexes make substring/fuzzy LIKE/ILIKE index-assisted.',
      uk: 'Full-text search (tsvector @@ tsquery + GIN) дає словесний, стемлений, ранжований пошук там, де LIKE не може; trigram-indexes pg_trgm роблять підрядковий/fuzzy LIKE/ILIKE index-assisted.',
    },
    {
      en: 'Shape the index to the query: composite (leftmost-prefix, now loosened by PG 18 skip scan for low-cardinality leads), covering INCLUDE (index-only scan), partial WHERE, expression (lower(col)).',
      uk: 'Формуйте index під запит: composite (leftmost-prefix, тепер послаблений PG 18 skip scan для low-cardinality лідів), covering INCLUDE (index-only scan), partial WHERE, expression (lower(col)).',
    },
    {
      en: 'Every index is write amplification + storage + maintenance. Index your real query patterns, drop unused indexes (idx_scan = 0), consolidate redundant ones — an unused index is pure cost.',
      uk: 'Кожен index — це write amplification + сховище + обслуговування. Індексуйте реальні патерни запитів, видаляйте невживані indexes (idx_scan = 0), обʼєднуйте надлишкові — невживаний index це чиста витрата.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Choosing a hash index for “speed”', uk: 'Обирати hash index «заради швидкості»' },
      body: {
        en: 'A B-Tree already answers equality in a few page reads and supports range, sort, multicolumn, covering, and partial variants; a hash index does equality only and was not even crash-safe before PostgreSQL 10. Default to the B-Tree and justify hash with measured benefit on large, pure-equality keys — which is rare.',
        uk: 'B-Tree уже відповідає на рівність за кілька читань pages й підтримує range, sort, multicolumn, covering та partial варіанти; hash робить лише рівність і навіть не був crash-safe до PostgreSQL 10. За замовчуванням беріть B-Tree, а hash виправдовуйте виміряним виграшем на великих суто-equality ключах — що рідкість.',
      },
    },
    {
      title: { en: "LIKE '%term%' for search", uk: "LIKE '%term%' для пошуку" },
      body: {
        en: 'A leading wildcard cannot use a B-Tree, so it scans, and it matches substrings rather than words — no stemming, ranking, or language awareness. Use full-text search (tsvector @@ tsquery + GIN) for human-language search, or a pg_trgm trigram index when you truly need substring/fuzzy matching.',
        uk: 'Провідний шаблон не може вжити B-Tree, тож сканує, і зіставляє підрядки замість слів — без стемінгу, ранжування чи мовної обізнаності. Вживайте full-text search (tsvector @@ tsquery + GIN) для пошуку людською мовою або trigram-index pg_trgm, коли вам справді потрібне підрядкове/fuzzy зіставлення.',
      },
    },
    {
      title: { en: 'Indexing every column “just in case”', uk: 'Індексувати кожну колонку «про всяк випадок»' },
      body: {
        en: 'Each index must be maintained on every write, consuming I/O and storage, lengthening vacuum, and pushing HOT updates back into index writes. Unused indexes are all cost and no benefit. Index your real query patterns, audit idx_scan, and drop or consolidate the rest.',
        uk: 'Кожен index треба підтримувати на кожному записі, споживаючи I/O і сховище, подовжуючи vacuum і повертаючи HOT-оновлення в записи index. Невживані indexes — суцільна витрата без зиску. Індексуйте реальні патерни запитів, перевіряйте idx_scan і видаляйте чи обʼєднуйте решту.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Pick an index type for each: equality on a UUID; a jsonb @> containment filter; a time-range scan on a billion-row append-only table. Justify each.',
        uk: 'Оберіть тип index для кожного: рівність на UUID; фільтр containment jsonb @>; сканування часового діапазону на append-only таблиці з мільярдом рядків. Обґрунтуйте кожен.',
      },
      a: {
        en: 'For equality on a UUID I use a plain B-Tree. It answers = in a few page reads and, unlike a hash index, also supports ordering, ranges, and covering/partial variants if the query evolves; a hash index would only ever do equality, so the B-Tree is the safer default. For a jsonb @> containment filter I use a GIN index. GIN is an inverted index: it maps each key/value inside the document to the rows containing it, which is exactly what containment needs — a B-Tree on the whole jsonb value is useless because there is no single orderable key. For a time-range scan on a billion-row append-only table I reach for BRIN on the timestamp. Because rows are inserted in time order, the physical block order correlates with the timestamp, so BRIN’s per-block-range min/max summaries let it skip almost all blocks for a range query — and the whole index is kilobytes instead of the gigabytes a B-Tree would need. The caveat is that BRIN only works while that physical correlation holds; if rows arrived out of order I would use a B-Tree or partition the table.',
        uk: 'Для рівності на UUID беру звичайний B-Tree. Він відповідає на = за кілька читань pages й, на відміну від hash, також підтримує впорядкування, діапазони та covering/partial варіанти, якщо запит розвинеться; hash робив би лише рівність, тож B-Tree — безпечніший дефолт. Для фільтра containment jsonb @> беру GIN. GIN — інвертований index: він зіставляє кожен ключ/значення в документі з рядками, що його містять, — саме це потрібно containment; B-Tree по всьому значенню jsonb марний, бо нема єдиного впорядковуваного ключа. Для сканування часового діапазону на append-only таблиці з мільярдом рядків тягнуся до BRIN по позначці часу. Оскільки рядки вставляються в порядку часу, фізичний порядок блоків корелює з позначкою, тож per-block-range min/max резюме BRIN дозволяють пропустити майже всі блоки для діапазонного запиту — а весь index важить кілобайти замість гігабайтів, потрібних B-Tree. Застереження: BRIN працює лише поки тримається ця фізична кореляція; якби рядки приходили не по порядку, я б узяв B-Tree чи розбив таблицю на partitions.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'What is an index-only scan, and what does PostgreSQL need for one to actually skip the heap?',
        uk: 'Що таке index-only scan, і що PostgreSQL потрібно, щоб він справді оминув heap?',
      },
      a: {
        en: 'An index-only scan answers a query entirely from the index, without fetching the row from the heap. Normally an index scan finds matching entries and then visits the heap to read the columns the query wants and to check row visibility. If every column the query needs is in the index — either a key column or, since PostgreSQL 11, a payload column added with INCLUDE (a covering index) — there is nothing extra to read from the heap. But the index does not store row-visibility information (which transactions can see which row version, MVCC, M19), so PostgreSQL still has to confirm the row is visible. It avoids the heap trip using the visibility map, a compact bitmap marking pages where all rows are visible to everyone. If the page is all-visible in the map, the scan trusts the index and skips the fetch; if not, it falls back to reading the heap page for that row. The practical consequence is that index-only scans depend on the visibility map being current, which means keeping VACUUM healthy — on a table with heavy churn and lagging vacuum, the “index-only” scan quietly degrades into heap fetches.',
        uk: 'Index-only scan відповідає на запит цілком з index, не дістаючи рядок з heap. Зазвичай index scan знаходить відповідні записи, а тоді відвідує heap, щоб прочитати потрібні запиту колонки й перевірити видимість рядка. Якщо кожна потрібна запиту колонка є в index — або key-колонка, або, від PostgreSQL 11, payload-колонка, додана через INCLUDE (covering index) — з heap читати більше нічого. Але index не зберігає інформацію про видимість рядка (які транзакції бачать яку версію рядка, MVCC, M19), тож PostgreSQL усе одно мусить підтвердити, що рядок видимий. Він уникає походу в heap через visibility map — компактний bitmap, що позначає pages, де всі рядки видимі всім. Якщо page all-visible у map, scan довіряє index і пропускає похід; якщо ні — відкочується до читання heap-page для того рядка. Практичний наслідок: index-only scans залежать від актуальності visibility map, тобто від здорового VACUUM — на таблиці з частими змінами й відсталим vacuum «index-only» scan тихо вироджується в походи в heap.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'After shipping a reporting feature with several new indexes, write throughput dropped. How do you diagnose and fix it?',
        uk: 'Після випуску звітної фічі з кількома новими indexes впала пропускність записів. Як діагностувати й виправити?',
      },
      a: {
        en: 'The hypothesis is write amplification: each new index must be maintained on every INSERT and on UPDATEs that touch its columns, and the new indexes may also have defeated HOT updates by indexing columns that the write path changes. I would confirm it before acting. First, correlate the regression with the deploy and check which writes slowed — INSERT-heavy or UPDATE-heavy. Then look at pg_stat_user_indexes: which of the new indexes actually get scanned (idx_scan), and which are unused — unused indexes are pure write cost and the first to drop. Check pg_stat_user_tables for a drop in the HOT-update ratio (n_tup_hot_upd vs n_tup_upd); if the reporting indexes cover frequently-updated columns, every such update now also writes the index and skips the HOT optimization. The fixes, in order: drop any new index with no scans; consolidate overlapping indexes (a single composite instead of several singles); make reporting indexes partial (WHERE) so they cover only the rows reporting queries, shrinking maintenance; and consider raising fillfactor room or moving the columns. The structural fix, if reporting load is heavy, is to stop running it on the OLTP primary at all — serve it from a read replica or a columnar/analytics store (M12, M31) so the write path carries no reporting indexes. The theme is that indexes are a write-time tax, and the cure is fewer, better-shaped indexes plus workload separation, validated with the stats views rather than guessed.',
        uk: 'Гіпотеза — write amplification: кожен новий index треба підтримувати на кожному INSERT і на UPDATE, що чіпають його колонки, а нові indexes могли ще й перемогти HOT updates, проіндексувавши колонки, які змінює шлях запису. Я б підтвердив це до дій. Спершу співвіднести регресію з деплоєм і перевірити, які записи сповільнились — INSERT-важкі чи UPDATE-важкі. Тоді глянути pg_stat_user_indexes: які з нових indexes реально скануються (idx_scan), а які невживані — невживані це чиста вартість запису й перші на видалення. Перевірити pg_stat_user_tables на падіння частки HOT-оновлень (n_tup_hot_upd проти n_tup_upd); якщо звітні indexes покривають часто оновлювані колонки, кожне таке оновлення тепер ще й пише index і пропускає HOT-оптимізацію. Виправлення по черзі: видалити будь-який новий index без scans; обʼєднати перекривні indexes (один composite замість кількох одинарних); зробити звітні indexes partial (WHERE), щоб вони покривали лише рядки звітних запитів, зменшивши обслуговування; розглянути більше місця fillfactor чи перенесення колонок. Структурне виправлення, якщо звітне навантаження важке, — узагалі перестати запускати його на OLTP primary: обслуговувати з read replica чи columnar/аналітичного сховища (M12, M31), щоб шлях запису не ніс звітних indexes. Тема в тому, що indexes — це податок на запис, а ліки — менше, краще сформованих indexes плюс розділення навантаження, підтверджене через stats-views, а не вгадане.',
      },
    },
  ],
  seeAlso: ['m13-btree', 'm12-storage', 'm16-query-planning', 'm9-data-types', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 11.2. Index Types (B-Tree, Hash, GiST, SP-GiST, GIN, BRIN; what each is for)',
      url: 'https://www.postgresql.org/docs/current/indexes-types.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 11.3. Multicolumn Indexes (leftmost-prefix; B-Tree skip scan, new in 18)',
      url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 11.9. Index-Only Scans and Covering Indexes (INCLUDE since 11; the visibility map)',
      url: 'https://www.postgresql.org/docs/current/indexes-index-only-scans.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 11.8 / 11.7. Partial & Expression Indexes',
      url: 'https://www.postgresql.org/docs/current/indexes-partial.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 12.2 / 12.9. Full Text Search: tsvector @@ tsquery and GIN vs GiST index support',
      url: 'https://www.postgresql.org/docs/current/textsearch-indexes.html',
    },
    {
      title: 'PostgreSQL 18 Release Notes (E.1) — B-Tree skip scan for multicolumn indexes; and PG 10 made hash indexes WAL-logged / crash-safe',
      url: 'https://www.postgresql.org/docs/current/release-18.html',
    },
  ],
};
