import type { Module } from '../types';

/*
 * M13 · B-Tree & B+Tree indexes — the GOLDEN module (built first in S1).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): PostgreSQL implements Lehman & Yao's
 * high-concurrency B-tree (right-links + high keys); its default index is a B+tree
 * (pivot tuples route, leaves hold key + heap TID); deduplication landed in PG13;
 * index-only scans consult the visibility map.
 */
export const m13: Module = {
  id: 'm13-btree',
  num: 13,
  section: 's3-storage',
  order: 2,
  level: 'senior',
  signature: true,
  title: { en: 'B-Tree & B+Tree indexes', uk: 'B-Tree та B+Tree індекси' },
  tagline: {
    en: 'Why a handful of page reads finds one row among billions — the data structure that makes databases fast.',
    uk: 'Чому кілька читань сторінок знаходять один рядок серед мільярдів — структура даних, що робить бази даних швидкими.',
  },
  readMins: 18,
  mentalModel: {
    en: 'A B-Tree index is a shallow, very wide tree of disk pages. Each level is one page read, and the tree is only 3–5 levels deep even for billions of rows — so any row is a few hops from the root.',
    uk: 'B-Tree індекс — це неглибоке, дуже широке дерево з disk pages. Кожен level — це одне читання page, і дерево має лише 3–5 рівнів навіть для мільярдів рядків — тож будь-який рядок за кілька кроків від root.',
  },
  topics: [
    {
      id: 'why-not-array-bst',
      title: { en: 'Why not a sorted array or a BST?', uk: 'Чому не відсортований масив чи BST?' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'An index exists to answer one question fast: *where is the row with this key?* The naive answer is a **sorted array** of keys — binary search finds any key in `O(log n)` comparisons. That works in memory, but a database lives on disk, and inserting one row into a sorted array means shifting everything after it: `O(n)` writes. A table that is constantly updated cannot pay that cost.',
            uk: 'Index існує, щоб швидко відповісти на одне питання: *де рядок із цим ключем?* Наївна відповідь — **відсортований масив** ключів: binary search знаходить будь-який ключ за `O(log n)` порівнянь. У памʼяті це працює, але база даних живе на диску, і вставка одного рядка у відсортований масив означає зсув усього, що йде після нього: `O(n)` записів. Таблиця, яку постійно оновлюють, не може платити таку ціну.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'A **balanced binary search tree** (BST) fixes inserts — `O(log n)` again — but it stores one key per node. Walking it means following one pointer per comparison, and on disk every pointer-chase is a potential **random I/O**: a separate ~8 KB page fetched from storage. A million-row BST is ~20 levels deep, so a lookup could be 20 disk reads. The structure is right; the **fan-out** is wrong.',
            uk: '**Збалансоване binary search tree** (BST) виправляє вставки — знову `O(log n)` — але зберігає один ключ на node. Прохід ним означає перехід по одному pointer на порівняння, а на диску кожен перехід — це потенційний **random I/O**: окрема ~8 KB page, прочитана зі сховища. BST на мільйон рядків має ~20 рівнів, тож пошук може коштувати 20 читань з диску. Структура правильна; неправильний **fan-out**.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The trade-offs that motivate the B-Tree (k = rows returned by a range).',
            uk: 'Компроміси, що мотивують B-Tree (k = рядків, повернутих діапазоном).',
          },
          head: [
            { en: 'Structure', uk: 'Структура' },
            { en: 'Point lookup', uk: 'Точковий пошук' },
            { en: 'Range scan', uk: 'Range scan' },
            { en: 'Insert', uk: 'Вставка' },
            { en: 'Disk-friendly?', uk: 'Дружня до диска?' },
          ],
          rows: [
            [
              { en: 'Unsorted heap', uk: 'Невідсортований heap' },
              { en: 'O(n)', uk: 'O(n)' },
              { en: 'O(n)', uk: 'O(n)' },
              { en: 'O(1) append', uk: 'O(1) append' },
              { en: 'Full scan only', uk: 'Лише full scan' },
            ],
            [
              { en: 'Sorted array', uk: 'Відсортований масив' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'O(log n + k)', uk: 'O(log n + k)' },
              { en: 'O(n) shift', uk: 'O(n) зсув' },
              { en: 'Poor (rewrite)', uk: 'Погана (перезапис)' },
            ],
            [
              { en: 'Hash index', uk: 'Hash index' },
              { en: 'O(1) avg', uk: 'O(1) сер.' },
              { en: '✗ no order', uk: '✗ без порядку' },
              { en: 'O(1) avg', uk: 'O(1) сер.' },
              { en: 'Equality only', uk: 'Лише рівність' },
            ],
            [
              { en: 'Balanced BST', uk: 'Збалансоване BST' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'O(log n + k)', uk: 'O(log n + k)' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'Poor (1 key/node)', uk: 'Погана (1 ключ/node)' },
            ],
            [
              { en: 'B+Tree', uk: 'B+Tree' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'O(log n + k)', uk: 'O(log n + k)' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'Excellent (page = node)', uk: 'Відмінна (page = node)' },
            ],
          ],
        },
      ],
    },
    {
      id: 'btree-structure',
      title: { en: 'B-Tree structure & why O(log n)', uk: 'Структура B-Tree та чому O(log n)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The B-Tree (Bayer & McCreight, 1972) keeps the BST idea — sorted keys, search by comparison — but makes each node a **whole disk page** holding *hundreds* of keys and child pointers. The number of children per node is the **fan-out**. Because one 8 KB page can hold hundreds of keys, fan-out is in the hundreds, and the tree becomes extremely shallow: with fan-out 100, three levels already address `100³ = 1,000,000` entries; four levels reach `100,000,000`.',
            uk: 'B-Tree (Bayer & McCreight, 1972) зберігає ідею BST — відсортовані ключі, пошук порівнянням — але робить кожен node **цілою disk page**, що містить *сотні* ключів і child pointers. Кількість дітей на node — це **fan-out**. Оскільки одна 8 KB page вміщає сотні ключів, fan-out сягає сотень, і дерево стає надзвичайно неглибоким: за fan-out 100 три level уже адресують `100³ = 1 000 000` записів; чотири level — `100 000 000`.',
          },
        },
        {
          kind: 'figure',
          fig: 'btree-node-anatomy',
          caption: {
            en: 'A B-Tree node: n keys act as separators between n+1 child pointers. Keys are kept sorted; a search picks the one child interval the target falls into.',
            uk: 'Node у B-Tree: n ключів — це роздільники між n+1 child pointers. Ключі тримаються відсортованими; пошук обирає той один інтервал-дитину, у який потрапляє ціль.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Two invariants make lookups predictable. **Sorted keys** inside every node let a search narrow to one child interval per level. **Balance** — every node except the root stays at least half-full, and all leaves sit at the same depth — guarantees the height is `O(log_f n)` for fan-out `f`. There is no "unlucky" shape: a B-Tree can never degrade into a linked list the way an unbalanced BST can. Height is bounded, and **height is what you pay in disk reads**.',
            uk: 'Два інваріанти роблять пошук передбачуваним. **Відсортовані ключі** всередині кожного node дають змогу звузити пошук до одного інтервалу-дитини на level. **Balance** — кожен node, окрім root, лишається щонайменше напівзаповненим, і всі leaves на однаковій глибині — гарантує висоту `O(log_f n)` для fan-out `f`. «Невдалої» форми не буває: B-Tree ніколи не вироджується у linked list, як це може зробити незбалансоване BST. Висота обмежена, а **висота — це те, чим ви платите у читаннях з диску**.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'The one number that matters: height',
            uk: 'Єдине число, що має значення: висота',
          },
          md: {
            en: 'Each level you descend is **one page read** — typically a random I/O. A B-Tree over a billion rows is ~4–5 levels deep, so finding any single row is ~4–5 page reads, most of which are cached. That is the entire reason indexed lookups feel instant.',
            uk: 'Кожен level, на який ви спускаєтесь, — це **одне читання page**, зазвичай random I/O. B-Tree над мільярдом рядків має ~4–5 level, тож пошук будь-якого одного рядка — це ~4–5 читань page, більшість з яких у кеші. Саме в цьому вся причина, чому індексований пошук відчувається миттєвим.',
          },
        },
      ],
    },
    {
      id: 'insert-split',
      title: { en: 'Insert & split, delete & merge', uk: 'Вставка і split, видалення і merge' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Inserts keep the tree balanced **from the bottom up**. A new key goes into the correct leaf. If that leaf still has room, you are done — one page touched. If the leaf is full, it **splits**: the keys divide into two half-full pages and the **median key is pushed up** into the parent as a new separator. If the push makes the parent overflow, it splits too, and so on. Only when a split propagates all the way to the root does the tree grow a level — which is why B-Trees grow **upward from the leaves**, not downward, and stay balanced for free.',
            uk: 'Вставки тримають дерево збалансованим **знизу вгору**. Новий ключ потрапляє у правильний leaf. Якщо в leaf ще є місце — готово, торкнулися однієї page. Якщо leaf повний, він **splits**: ключі діляться на дві напівзаповнені pages, а **median ключ проштовхується вгору** до parent як новий роздільник. Якщо проштовхування переповнює parent, він теж splits, і так далі. Лише коли split доходить аж до root, дерево додає level — тому B-Trees ростуть **вгору від leaves**, а не вниз, і лишаються збалансованими безкоштовно.',
          },
        },
        {
          kind: 'sim',
          sim: 'btree',
        },
        {
          kind: 'prose',
          md: {
            en: 'Deletes are the mirror image: remove the key, and if a node drops below half-full it **borrows** a key from a sibling or **merges** with one, pulling a separator back down from the parent. In practice many engines defer or simplify this — PostgreSQL, for example, reclaims entirely empty pages but does not aggressively rebalance on every delete, leaning on `VACUUM` to clean up. The takeaway is structural, not procedural: **every modification is local and logarithmic**, never a full rewrite.',
            uk: 'Видалення — дзеркальне: прибираємо ключ, і якщо node падає нижче напівзаповненості, він **позичає** ключ у sibling або **merges** з ним, стягуючи роздільник назад униз від parent. На практиці багато движків відкладають або спрощують це — PostgreSQL, наприклад, повертає повністю порожні pages, але не агресивно ребалансує на кожному видаленні, покладаючись на `VACUUM`. Висновок структурний, а не процедурний: **кожна зміна локальна й логарифмічна**, ніколи не повний перезапис.',
          },
        },
      ],
    },
    {
      id: 'bplus-tree',
      title: { en: 'B+Tree: values in the leaves', uk: 'B+Tree: значення у leaves' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Real database indexes are almost always a **B+Tree**, a refinement of the B-Tree with two changes. First, **data lives only in the leaves**; the internal nodes hold *only* separator keys to route the search. That makes internal nodes pure signposts, so each one packs in more keys, raising fan-out and lowering height further. Second, the **leaves are linked** in key order. Toggle the visualizer above between B-Tree and B+Tree to see both differences.',
            uk: 'Реальні індекси баз даних — майже завжди **B+Tree**, уточнення B-Tree з двома змінами. По-перше, **дані живуть лише в leaves**; internal nodes тримають *тільки* роздільні ключі, щоб маршрутизувати пошук. Це робить internal nodes чистими покажчиками, тож кожен вміщає більше ключів, підвищуючи fan-out і ще більше знижуючи висоту. По-друге, **leaves звʼязані** у порядку ключів. Перемкніть візуалізатор вище між B-Tree та B+Tree, щоб побачити обидві відмінності.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'B-Tree', uk: 'B-Tree' },
          b: { en: 'B+Tree (used by DB indexes)', uk: 'B+Tree (його використовують DB-індекси)' },
          rows: [
            [
              { en: 'Where values live', uk: 'Де живуть значення' },
              { en: 'In every node', uk: 'У кожному node' },
              { en: 'In the leaves only', uk: 'Лише в leaves' },
            ],
            [
              { en: 'Internal nodes', uk: 'Internal nodes' },
              { en: 'Hold data too', uk: 'Містять і дані' },
              { en: 'Pure routing → higher fan-out', uk: 'Чиста маршрутизація → вищий fan-out' },
            ],
            [
              { en: 'Range scan', uk: 'Range scan' },
              { en: 'Hop up and down the tree', uk: 'Стрибки вгору-вниз деревом' },
              { en: 'Walk the linked leaves', uk: 'Прохід звʼязаними leaves' },
            ],
            [
              { en: 'Typical use', uk: 'Типове застосування' },
              { en: 'Rare in practice', uk: 'Рідко на практиці' },
              { en: 'Postgres, InnoDB, SQLite…', uk: 'Postgres, InnoDB, SQLite…' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: 'The linked leaves are why **range queries** are cheap. `WHERE created_at BETWEEN x AND y` descends to the first matching leaf once (`O(log n)`), then follows the leaf links sequentially, reading rows already in sorted order — no re-traversal of the tree, and no separate sort step for `ORDER BY` on the same column. PostgreSQL builds exactly this: its default index is a B+Tree implementing **Lehman & Yao\'s** high-concurrency design, where each page also carries a right-link and a "high key" so the tree can be searched without read locks.',
            uk: 'Звʼязані leaves — причина дешевизни **range queries**. `WHERE created_at BETWEEN x AND y` один раз спускається до першого відповідного leaf (`O(log n)`), а потім послідовно йде по leaf links, читаючи рядки вже у відсортованому порядку — без повторного обходу дерева й без окремого кроку сортування для `ORDER BY` по тій самій колонці. PostgreSQL будує саме це: його типовий index — B+Tree, що реалізує високонкурентний дизайн **Lehman & Yao**, де кожна page також несе right-link і «high key», тож дерево можна шукати без read locks.',
          },
        },
      ],
    },
    {
      id: 'reading-the-plan',
      title: {
        en: 'Reading an index plan: seq / index / index-only',
        uk: 'Читання плану: seq / index / index-only',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Having an index does not force the planner to use it. The optimizer compares three access paths. A **sequential scan** reads the whole table — and is genuinely *faster* when a query returns most rows, because sequential I/O beats thousands of random index hops. An **index scan** descends the B+Tree, then fetches each matching row from the heap (one random read per row). An **index-only scan** answers entirely from the index when it already contains every column the query needs, skipping the heap.',
            uk: 'Наявність index не змушує planner його використовувати. Optimizer порівнює три access paths. **Sequential scan** читає всю таблицю — і справді *швидший*, коли запит повертає більшість рядків, бо послідовний I/O перемагає тисячі випадкових index-стрибків. **Index scan** спускається B+Tree, а потім дістає кожен відповідний рядок із heap (одне випадкове читання на рядок). **Index-only scan** відповідає повністю з index, коли той уже містить кожну колонку, потрібну запиту, оминаючи heap.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Index-only scans still touch the visibility map',
            uk: 'Index-only scans все одно звертаються до visibility map',
          },
          md: {
            en: 'In PostgreSQL an index-only scan must still check the **visibility map** to confirm a row is visible to all transactions; only then can it skip the heap fetch. A table that is rarely `VACUUM`-ed has a stale visibility map, so "index-only" scans quietly fall back to heap fetches. The index being *covering* is necessary but not sufficient — visibility matters too.',
            uk: 'У PostgreSQL index-only scan все одно мусить перевірити **visibility map**, щоб підтвердити, що рядок видимий усім транзакціям; лише тоді він може пропустити heap fetch. Таблиця, яку рідко `VACUUM`-лять, має застарілий visibility map, тож «index-only» scans тихо відкочуються до heap fetches. Те, що index є *covering*, — необхідно, але недостатньо: видимість теж важлива.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'Clustered vs secondary indexes',
            uk: 'Clustered проти secondary indexes',
          },
          md: {
            en: 'In MySQL/InnoDB the table *is* its primary-key B+Tree — the leaf holds the full row (a **clustered** index), and secondary indexes store the PK to find it. PostgreSQL is different: rows live in a separate **heap**, and *every* index (including the PK) is "secondary", its leaves holding a heap pointer (`TID`). This is why `CLUSTER` in Postgres is a one-time physical reorder, not a permanent property.',
            uk: 'У MySQL/InnoDB таблиця *є* своїм primary-key B+Tree — leaf містить повний рядок (**clustered** index), а secondary indexes зберігають PK, щоб його знайти. PostgreSQL інший: рядки живуть в окремому **heap**, і *кожен* index (зокрема PK) є «secondary», а його leaves містять heap pointer (`TID`). Тому `CLUSTER` у Postgres — це разове фізичне впорядкування, а не постійна властивість.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A B-Tree is a balanced tree whose nodes are disk pages; high fan-out makes it shallow, so lookups cost only a few page reads.',
      uk: 'B-Tree — збалансоване дерево, чиї nodes є disk pages; високий fan-out робить його неглибоким, тож пошук коштує лише кілька читань page.',
    },
    {
      en: 'Height ≈ log_fan-out(n) is the cost that matters: ~4–5 levels even for billions of rows, each level one page read.',
      uk: 'Висота ≈ log_fan-out(n) — це і є ключова ціна: ~4–5 level навіть для мільярдів рядків, кожен level — одне читання page.',
    },
    {
      en: 'Inserts split a full leaf and push the median up; the tree grows upward from the leaves and is always balanced.',
      uk: 'Вставки splitять повний leaf і проштовхують median вгору; дерево росте вгору від leaves і завжди збалансоване.',
    },
    {
      en: 'Database indexes use B+Trees: values only in leaves (higher fan-out) and linked leaves (cheap range scans, free ORDER BY).',
      uk: 'DB-індекси використовують B+Trees: значення лише в leaves (вищий fan-out) і звʼязані leaves (дешеві range scans, безкоштовний ORDER BY).',
    },
    {
      en: 'An index is an option, not an order: the planner may pick a seq scan, index scan, or index-only scan by estimated cost.',
      uk: 'Index — це опція, а не наказ: planner може обрати seq scan, index scan чи index-only scan за оцінкою cost.',
    },
  ],
  pitfalls: [
    {
      title: {
        en: 'Assuming an index is always used',
        uk: 'Припущення, що index завжди використовується',
      },
      body: {
        en: 'For low-selectivity predicates (a query returning a large fraction of the table) a sequential scan is cheaper, and the planner correctly ignores the index. The fix is usually a more selective query or a different index — not forcing the index.',
        uk: 'Для предикатів із низькою selectivity (запит повертає велику частку таблиці) sequential scan дешевший, і planner правильно ігнорує index. Розвʼязок зазвичай — селективніший запит або інший index, а не примушування index.',
      },
    },
    {
      title: {
        en: 'Wrong column order in a composite index',
        uk: 'Неправильний порядок колонок у composite index',
      },
      body: {
        en: 'A B+Tree on (a, b) can seek on `a` or on `a AND b`, but not on `b` alone — the tree is sorted by `a` first. Order columns by how you filter: equality columns first, then the range/sort column.',
        uk: 'B+Tree на (a, b) може шукати по `a` або по `a AND b`, але не по `b` окремо — дерево відсортоване спершу за `a`. Упорядковуйте колонки за тим, як фільтруєте: спершу колонки рівності, потім колонка range/sort.',
      },
    },
    {
      title: {
        en: 'Forgetting that every index taxes writes',
        uk: 'Забування, що кожен index оподатковує записи',
      },
      body: {
        en: 'Each index must be updated on every INSERT/UPDATE/DELETE of its columns, and may split pages under load. Indexes are not free reads — they are a write-amplification trade. Index what you query, drop what you do not.',
        uk: 'Кожен index треба оновлювати на кожному INSERT/UPDATE/DELETE його колонок, і він може splitити pages під навантаженням. Indexes — не безкоштовні читання, це компроміс write-amplification. Індексуйте те, що запитуєте, прибирайте те, що ні.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Why do databases use B-Trees instead of balanced binary search trees?',
        uk: 'Чому бази даних використовують B-Trees замість збалансованих binary search trees?',
      },
      a: {
        en: 'Both are O(log n), but a BST stores one key per node, so each comparison is a pointer-chase that can be a random disk I/O — a million rows is ~20 levels, ~20 reads. A B-Tree node is a whole page holding hundreds of keys, so fan-out is in the hundreds and the tree is ~3–4 levels. The win is not asymptotic complexity; it is matching the structure to the page-based, I/O-bound reality of disk.',
        uk: 'Обидва O(log n), але BST зберігає один ключ на node, тож кожне порівняння — це pointer-chase, що може бути random disk I/O — мільйон рядків це ~20 level, ~20 читань. Node у B-Tree — ціла page із сотнями ключів, тож fan-out сягає сотень, а дерево має ~3–4 level. Виграш не в асимптотичній складності, а у відповідності структури page-based, I/O-bound реальності диска.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'What is the difference between a B-Tree and a B+Tree, and why does it matter for range queries?',
        uk: 'Яка різниця між B-Tree та B+Tree, і чому це важливо для range queries?',
      },
      a: {
        en: 'A B+Tree keeps values only in the leaves and links the leaves in key order; internal nodes are pure routing. Higher fan-out lowers height, and the linked leaves let a range query find the start key once, then walk leaves sequentially in sorted order — no tree re-traversal and no separate sort for ORDER BY on that column. That is why production indexes (Postgres, InnoDB) are B+Trees.',
        uk: 'B+Tree тримає значення лише в leaves і звʼязує leaves у порядку ключів; internal nodes — чиста маршрутизація. Вищий fan-out знижує висоту, а звʼязані leaves дають range query один раз знайти стартовий ключ, а потім послідовно йти leaves у відсортованому порядку — без повторного обходу дерева й без окремого сортування для ORDER BY по тій колонці. Тому продакшн-індекси (Postgres, InnoDB) — B+Trees.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A query has a perfectly good index but EXPLAIN shows a sequential scan. Name two legitimate reasons.',
        uk: 'У запиту є цілком придатний index, але EXPLAIN показує sequential scan. Назвіть дві законні причини.',
      },
      a: {
        en: 'First, low selectivity: if the predicate matches a large fraction of rows, fetching each via random I/O is costlier than one sequential pass, so the planner picks seq scan by cost. Second, stale or missing statistics: if ANALYZE has not run, the planner misestimates row counts and chooses the wrong path. Other causes include a tiny table, a type mismatch preventing index use, or a function on the column without a matching expression index.',
        uk: 'Перша — низька selectivity: якщо предикат відповідає великій частці рядків, діставати кожен через random I/O дорожче за один послідовний прохід, тож planner за cost обирає seq scan. Друга — застарілі чи відсутні statistics: якщо ANALYZE не виконувався, planner неправильно оцінює кількість рядків і обирає хибний шлях. Інші причини: крихітна таблиця, type mismatch, що блокує index, або функція на колонці без відповідного expression index.',
      },
    },
  ],
  seeAlso: ['m12-storage', 'm14-index-toolbox', 'm16-query-planning', 'm15-lsm'],
  sources: [
    {
      title: 'PostgreSQL Documentation — Index Types (B-tree)',
      url: 'https://www.postgresql.org/docs/current/indexes-types.html',
    },
    {
      title: 'PostgreSQL source — nbtree README (Lehman & Yao implementation)',
      url: 'https://github.com/postgres/postgres/blob/master/src/backend/access/nbtree/README',
    },
    {
      title: 'PostgreSQL Documentation — Index-Only Scans and Covering Indexes',
      url: 'https://www.postgresql.org/docs/current/indexes-index-only-scans.html',
    },
    {
      title: 'Comer, D. (1979) — The Ubiquitous B-Tree, ACM Computing Surveys',
      url: 'https://dl.acm.org/doi/10.1145/356770.356776',
    },
    {
      title: 'Markus Winand — Use The Index, Luke: Anatomy of an SQL Index',
      url: 'https://use-the-index-luke.com/sql/anatomy',
    },
  ],
};
