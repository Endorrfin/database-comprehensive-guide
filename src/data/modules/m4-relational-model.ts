import type { Module } from '../types';

/*
 * M4 · The relational model & SQL foundations — beginner on-ramp (S3).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): Codd's 1970 relational model and its
 * algebra (selection σ, projection π, join ⋈, set ops); PostgreSQL's relational concepts
 * (relation/tuple/attribute, domains); the SQL logical processing order enumerated in the
 * PostgreSQL SELECT reference (FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT →
 * ORDER BY → LIMIT); primary/foreign keys from the PostgreSQL constraints docs.
 */
export const m4: Module = {
  id: 'm4-relational-model',
  num: 4,
  section: 's1-foundations',
  order: 4,
  level: 'beginner',
  title: { en: 'The relational model & SQL foundations', uk: 'Реляційна модель та основи SQL' },
  tagline: {
    en: 'Tables, keys, relationships, and the relational algebra behind SELECT.',
    uk: 'Таблиці, ключі, звʼязки та relational algebra за SELECT.',
  },
  readMins: 11,
  mentalModel: {
    en: 'Think in sets, not loops: you declare what you want, not how to fetch it.',
    uk: 'Мисліть множинами, а не циклами: ви декларуєте що хочете, а не як це дістати.',
  },
  topics: [
    {
      id: 'tables-rows-columns-domains',
      title: { en: 'Tables, rows, columns, domains', uk: 'Таблиці, рядки, колонки, domains' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The relational model, proposed by **Edgar F. Codd in 1970**, organizes data into **relations** — what SQL calls **tables**. A table is a set of **rows** (formally *tuples*), each row a set of **columns** (formally *attributes*), and every column draws its values from a **domain** — its data type and the values that type allows. That is the whole foundation: customers, orders, payments — each a table; each fact about one of them — a row; each property — a typed column.",
            uk: "Реляційну модель, запропоновану **Edgar F. Codd у 1970**, організовує дані в **relations** — те, що SQL зве **tables**. Table — це множина **rows** (формально *tuples*), кожен row — набір **columns** (формально *attributes*), і кожна column бере значення з **domain** — свого типу даних і допустимих для нього значень. Це і вся основа: customers, orders, payments — кожне table; кожен факт про них — row; кожна властивість — типізована column.",
          },
        },
        {
          kind: 'figure',
          fig: 'relational-model',
          caption: {
            en: 'Two relations. customers has one row per customer; orders has many rows per customer. The blue column is a primary key (it identifies a row); the amber column is a foreign key (it points at one).',
            uk: 'Два relations. customers має один row на клієнта; orders — багато rows на клієнта. Синя колонка — primary key (ідентифікує row); бурштинова — foreign key (вказує на нього).',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two properties make this more than a grid. First, a table is a **set**: there is no inherent row order, and a true relation has no duplicate rows. You impose order only when you ask for it (`ORDER BY`); the engine is free to store and return rows however is fastest. Second, every cell holds **one value from its domain** — `total` is a number, `city` is text — or the special marker **NULL**, meaning *unknown / not applicable*. NULL is not zero and not an empty string; it is the absence of a value, and it behaves differently in comparisons (a recurring trap, covered in M10).",
            uk: "Дві властивості роблять це більшим за сітку. По-перше, table — це **множина**: власного порядку рядків немає, і справжній relation не має дублів. Порядок виникає лише коли ви його просите (`ORDER BY`); движок вільний зберігати й повертати rows як швидше. По-друге, кожна клітинка тримає **одне значення зі свого domain** — `total` це число, `city` це текст — або спецмаркер **NULL**, що означає *невідомо / не застосовно*. NULL — це не нуль і не порожній рядок; це відсутність значення, і в порівняннях він поводиться інакше (наскрізна пастка, її розкриває M10).",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The same idea has three vocabularies. You will meet the formal terms in papers and the SQL terms in code.',
            uk: 'Та сама ідея має три словники. Формальні терміни — у статтях, SQL-терміни — у коді.',
          },
          head: [
            { en: 'Formal (relational)', uk: 'Формально (relational)' },
            { en: 'SQL / this guide', uk: 'SQL / цей посібник' },
            { en: 'Everyday analogy', uk: 'Побутова аналогія' },
          ],
          rows: [
            [
              { en: 'Relation', uk: 'Relation' },
              { en: 'Table', uk: 'Table' },
              { en: 'A sheet in a spreadsheet', uk: 'Аркуш у таблиці' },
            ],
            [
              { en: 'Tuple', uk: 'Tuple' },
              { en: 'Row', uk: 'Row' },
              { en: 'One record', uk: 'Один запис' },
            ],
            [
              { en: 'Attribute', uk: 'Attribute' },
              { en: 'Column', uk: 'Column' },
              { en: 'One field', uk: 'Одне поле' },
            ],
            [
              { en: 'Domain', uk: 'Domain' },
              { en: 'Data type', uk: 'Тип даних' },
              { en: 'The allowed values', uk: 'Допустимі значення' },
            ],
            [
              { en: 'Degree', uk: 'Degree' },
              { en: 'Number of columns', uk: 'Кількість columns' },
              { en: 'How wide', uk: 'Наскільки широка' },
            ],
            [
              { en: 'Cardinality', uk: 'Cardinality' },
              { en: 'Number of rows', uk: 'Кількість rows' },
              { en: 'How tall', uk: 'Наскільки висока' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'A domain is your first constraint', uk: 'Domain — ваш перший constraint' },
          md: {
            en: "Choosing a column's type is the cheapest data-integrity decision you will make: `numeric` refuses the word \"twelve\", `date` refuses February 31st. The narrower the domain, the more nonsense the database rejects for free. Types are constraints — a theme M9 (Data types done right) takes all the way.",
            uk: "Вибір типу column — найдешевше рішення про цілісність: `numeric` відкине слово «дванадцять», `date` відкине 31 лютого. Чим вужчий domain, тим більше дурниць база відкидає безкоштовно. Типи — це constraints; тему M9 (Типи даних правильно) доводить до кінця.",
          },
        },
      ],
    },
    {
      id: 'keys-and-relationships',
      title: { en: 'Keys & relationships', uk: 'Ключі та звʼязки' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "If a table is a set with no row order, how do you point at one specific row? With a **key**. A **primary key** is the column (or columns) whose value is **unique and never NULL**, so it identifies each row exactly — `customers.customer_id`. Other tables then refer to that row through a **foreign key**: `orders.customer_id` holds a value that must exist in `customers.customer_id`. That single rule — a foreign key must match a real primary key — is **referential integrity**, and it is what stops you from creating an order for a customer who does not exist.",
            uk: "Якщо table — це множина без порядку rows, як вказати на один конкретний row? Через **key**. **Primary key** — це column (чи columns), значення якого **унікальне й ніколи не NULL**, тож воно точно ідентифікує кожен row — `customers.customer_id`. Інші tables посилаються на цей row через **foreign key**: `orders.customer_id` тримає значення, яке мусить існувати в `customers.customer_id`. Це єдине правило — foreign key мусить збігатися зі справжнім primary key — і є **referential integrity**, і саме воно не дає створити замовлення для клієнта, якого немає.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Keys are also how the model expresses **relationships**, of which there are exactly three shapes. **One-to-many** is the common case: one customer has many orders, modeled by a foreign key on the *many* side. **One-to-one** is a one-to-many capped at one — a user and their profile — usually a foreign key plus a `UNIQUE` constraint, or simply merged into one table. **Many-to-many** — students and the courses they take — cannot be expressed by a single foreign key; it needs a third **junction table** (`enrollments`) holding one foreign key to each side.",
            uk: "Ключі — це ще й те, як модель виражає **звʼязки**, яких рівно три форми. **One-to-many** — типовий випадок: один customer має багато orders; моделюється foreign key на боці *many*. **One-to-one** — це one-to-many, обмежений одиницею — user і його profile — зазвичай foreign key плюс `UNIQUE`, або просто злиття в одну table. **Many-to-many** — студенти й курси, які вони слухають — не виразити одним foreign key; потрібна третя **junction table** (`enrollments`) з одним foreign key на кожен бік.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Three relationship shapes and how the relational model expresses each.',
            uk: 'Три форми звʼязків і як реляційна модель виражає кожну.',
          },
          head: [
            { en: 'Relationship', uk: 'Звʼязок' },
            { en: 'Example', uk: 'Приклад' },
            { en: 'How you model it', uk: 'Як моделюєте' },
          ],
          rows: [
            [
              { en: 'One-to-one (1:1)', uk: 'One-to-one (1:1)' },
              { en: 'user ↔ profile', uk: 'user ↔ profile' },
              { en: 'Foreign key + UNIQUE, or merge into one table', uk: 'Foreign key + UNIQUE, або злити в одну table' },
            ],
            [
              { en: 'One-to-many (1:N)', uk: 'One-to-many (1:N)' },
              { en: 'customer → orders', uk: 'customer → orders' },
              { en: 'Foreign key on the "many" side (orders.customer_id)', uk: 'Foreign key на боці «many» (orders.customer_id)' },
            ],
            [
              { en: 'Many-to-many (M:N)', uk: 'Many-to-many (M:N)' },
              { en: 'students ↔ courses', uk: 'students ↔ courses' },
              { en: 'A junction table with one FK to each side', uk: 'Junction table з одним FK на кожен бік' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `CREATE TABLE customers (
  customer_id bigint PRIMARY KEY,         -- unique, never NULL
  name        text   NOT NULL,
  city        text
);

CREATE TABLE orders (
  order_id    bigint PRIMARY KEY,
  customer_id bigint NOT NULL
                REFERENCES customers (customer_id),  -- foreign key
  total       numeric(10,2) NOT NULL
);`,
          note: {
            en: "The REFERENCES clause is the foreign key: PostgreSQL now refuses any order whose customer_id has no matching customer, and refuses to delete a customer who still has orders (unless you ask for a cascade). Integrity is enforced by the database, not hoped for in the app.",
            uk: "Клауза REFERENCES — це foreign key: PostgreSQL тепер відмовить будь-якому order, чий customer_id не має відповідного customer, і не дасть видалити customer, у якого ще є orders (якщо не попросити cascade). Цілісність забезпечує база, а не сподівання в застосунку.",
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'The database is your last line of integrity', uk: 'База — остання лінія цілісності' },
          md: {
            en: "Application code that \"always sets a valid customer_id\" eventually meets a bug, a race, or a second service. A foreign key makes the invalid state *unrepresentable* — the write simply fails. Push invariants down into keys and constraints; M8 makes this the rule, not the exception.",
            uk: "Код застосунку, що «завжди ставить валідний customer_id», рано чи пізно зустріне баг, гонку чи другий сервіс. Foreign key робить невалідний стан *непредставним* — запис просто впаде. Проштовхуйте інваріанти в keys і constraints; M8 робить це правилом, а не винятком.",
          },
        },
      ],
    },
    {
      id: 'relational-algebra-behind-select',
      title: { en: 'The relational algebra behind SELECT', uk: 'Relational algebra за SELECT' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Codd did not just propose tables; he gave them an **algebra** — a small set of operations that each take relations and return a relation. Because the output is itself a relation, operations **compose**, exactly like arithmetic. Three operations carry most queries. **Selection** (σ) keeps the rows that match a predicate. **Projection** (π) keeps only the columns you name. **Join** (⋈) combines two relations on a matching condition. Add the set operations — union, difference — and rename, and you can express an enormous range of questions.",
            uk: "Codd не просто запропонував tables; він дав їм **алгебру** — невеликий набір операцій, кожна з яких бере relations і повертає relation. Оскільки результат сам є relation, операції **композуються**, точно як арифметика. Три операції несуть більшість запитів. **Selection** (σ) лишає rows, що відповідають предикату. **Projection** (π) лишає лише названі columns. **Join** (⋈) поєднує два relations за умовою збігу. Додайте set-операції — union, difference — і rename, і ви виразите величезний діапазон питань.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The core relational-algebra operations and their SQL surface. SELECT is mostly projection + selection + join, composed.',
            uk: 'Базові операції relational algebra та їхнє SQL-обличчя. SELECT — це здебільшого projection + selection + join у композиції.',
          },
          head: [
            { en: 'Operation', uk: 'Операція' },
            { en: 'Symbol', uk: 'Символ' },
            { en: 'SQL', uk: 'SQL' },
            { en: 'What it does', uk: 'Що робить' },
          ],
          rows: [
            [
              { en: 'Selection', uk: 'Selection' },
              { en: 'σ', uk: 'σ' },
              { en: 'WHERE', uk: 'WHERE' },
              { en: 'Keep rows matching a predicate', uk: 'Лишити rows за предикатом' },
            ],
            [
              { en: 'Projection', uk: 'Projection' },
              { en: 'π', uk: 'π' },
              { en: 'SELECT col, col', uk: 'SELECT col, col' },
              { en: 'Keep only the named columns', uk: 'Лишити лише названі columns' },
            ],
            [
              { en: 'Join', uk: 'Join' },
              { en: '⋈', uk: '⋈' },
              { en: 'JOIN … ON', uk: 'JOIN … ON' },
              { en: 'Combine two relations on a condition', uk: 'Поєднати два relations за умовою' },
            ],
            [
              { en: 'Union', uk: 'Union' },
              { en: '∪', uk: '∪' },
              { en: 'UNION', uk: 'UNION' },
              { en: 'Rows in either relation (set)', uk: 'Rows у будь-якому relation (множина)' },
            ],
            [
              { en: 'Difference', uk: 'Difference' },
              { en: '−', uk: '−' },
              { en: 'EXCEPT', uk: 'EXCEPT' },
              { en: 'Rows in A but not in B', uk: 'Rows у A, але не в B' },
            ],
            [
              { en: 'Cartesian product', uk: 'Cartesian product' },
              { en: '×', uk: '×' },
              { en: 'CROSS JOIN', uk: 'CROSS JOIN' },
              { en: 'Every pairing — the basis of all joins', uk: 'Усі пари — основа будь-якого join' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Why the algebra matters in practice', uk: 'Чому алгебра важить на практиці' },
          md: {
            en: "The optimizer thinks in this algebra. Because `σ` and `π` and `⋈` obey algebraic laws — a selection can often be *pushed down* below a join, a projection can drop columns early — the planner is free to rearrange your query into a cheaper but provably **equivalent** form. That is why two very different-looking SQL statements can run the identical plan: they reduce to the same algebra. M5 and M16 build directly on this.",
            uk: "Optimizer мислить цією алгеброю. Оскільки `σ`, `π` і `⋈` підкоряються алгебраїчним законам — selection часто можна *проштовхнути* під join, projection — відкинути columns раніше — planner вільний перебудувати ваш запит у дешевшу, але доказово **еквівалентну** форму. Тому два дуже різні на вигляд SQL можуть виконати ідентичний plan: вони зводяться до однієї алгебри. M5 і M16 будують прямо на цьому.",
          },
        },
      ],
    },
    {
      id: 'select-where-group-order',
      title: { en: 'SELECT / WHERE / GROUP BY / ORDER BY', uk: 'SELECT / WHERE / GROUP BY / ORDER BY' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "SQL wraps that algebra in a readable clause structure. A query names the columns to keep (`SELECT`), the tables to read (`FROM` / `JOIN`), the rows to keep (`WHERE`), how to collapse rows into groups (`GROUP BY`), which groups to keep (`HAVING`), and how to sort and slice the result (`ORDER BY`, `LIMIT`). Three small queries cover most day-to-day reading:",
            uk: "SQL загортає цю алгебру в читабельну структуру клауз. Запит називає columns, які лишити (`SELECT`), tables для читання (`FROM` / `JOIN`), rows, які лишити (`WHERE`), як згорнути rows у групи (`GROUP BY`), які групи лишити (`HAVING`) і як сортувати й нарізати результат (`ORDER BY`, `LIMIT`). Три маленькі запити покривають більшість щоденного читання:",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- 1. projection + selection + ordering
SELECT name, total
FROM orders
WHERE customer_id = 42
ORDER BY total DESC;

-- 2. a join across the 1:N relationship
SELECT c.name, o.total
FROM customers AS c
JOIN orders   AS o ON o.customer_id = c.customer_id
WHERE c.city = 'Kyiv';

-- 3. grouping, an aggregate, and filtering the groups
SELECT customer_id, SUM(total) AS lifetime
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 1000
ORDER BY lifetime DESC;`,
          note: {
            en: "Note WHERE filters individual rows, while HAVING filters whole groups after aggregation — a distinction that only makes sense once you know the order the clauses run in.",
            uk: "Зверніть увагу: WHERE фільтрує окремі rows, а HAVING — цілі групи після агрегації; ця різниця має сенс лише коли знаєш порядок виконання клауз.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Here is the crucial twist: **SQL is not evaluated in the order you write it.** You write `SELECT` first, but the engine resolves the clauses in a fixed **logical order** — roughly `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`. This explains a dozen beginner surprises at once: why a `WHERE` clause cannot reference a `SELECT` alias (the alias does not exist yet), but an `ORDER BY` can (it runs after `SELECT`); why aggregates filter in `HAVING`, not `WHERE`.",
            uk: "Ось критичний поворот: **SQL не виконується в порядку, в якому ви його пишете.** Ви пишете `SELECT` першим, але движок розвʼязує клаузи у фіксованому **логічному порядку** — приблизно `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`. Це одразу пояснює десяток здивувань новачка: чому `WHERE` не може посилатися на alias із `SELECT` (його ще немає), а `ORDER BY` може (він після `SELECT`); чому агрегати фільтрують у `HAVING`, а не `WHERE`.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The logical processing order (as enumerated in the PostgreSQL SELECT reference). The written order differs — the engine resolves clauses in this order.',
            uk: 'Логічний порядок обробки (як перелічено в довідці PostgreSQL SELECT). Письмовий порядок інший — движок розвʼязує клаузи саме так.',
          },
          head: [
            { en: 'Step', uk: 'Крок' },
            { en: 'Clause', uk: 'Клауза' },
            { en: 'What it does', uk: 'Що робить' },
          ],
          rows: [
            [
              { en: '1', uk: '1' },
              { en: 'FROM / JOIN', uk: 'FROM / JOIN' },
              { en: 'Choose and combine the source tables', uk: 'Обрати й поєднати джерельні tables' },
            ],
            [
              { en: '2', uk: '2' },
              { en: 'WHERE', uk: 'WHERE' },
              { en: 'Filter individual rows', uk: 'Фільтрувати окремі rows' },
            ],
            [
              { en: '3', uk: '3' },
              { en: 'GROUP BY', uk: 'GROUP BY' },
              { en: 'Collapse rows into groups', uk: 'Згорнути rows у групи' },
            ],
            [
              { en: '4', uk: '4' },
              { en: 'HAVING', uk: 'HAVING' },
              { en: 'Filter the groups', uk: 'Фільтрувати групи' },
            ],
            [
              { en: '5', uk: '5' },
              { en: 'SELECT', uk: 'SELECT' },
              { en: 'Compute the output columns (aliases born here)', uk: 'Обчислити вихідні columns (тут зʼявляються aliases)' },
            ],
            [
              { en: '6', uk: '6' },
              { en: 'ORDER BY / LIMIT', uk: 'ORDER BY / LIMIT' },
              { en: 'Sort, then take a slice', uk: 'Відсортувати, потім узяти зріз' },
            ],
          ],
        },
      ],
    },
    {
      id: 'declarative-vs-imperative',
      title: { en: 'Declarative vs imperative', uk: 'Декларативне проти імперативного' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Everything above adds up to one idea that makes SQL feel different from the languages you already know: SQL is **declarative**. You describe the *result you want* — \"orders for customer 42, biggest first\" — and say nothing about *how* to get it: no loops, no index lookups, no file reads. A separate component, the **query planner**, decides the *how* — which index to use, which join algorithm, what order — and it can change that decision as your data grows or you add an index, without you touching the query.",
            uk: "Усе вище зводиться до однієї ідеї, що робить SQL несхожим на мови, які ви вже знаєте: SQL **декларативний**. Ви описуєте *потрібний результат* — «замовлення клієнта 42, найбільші першими» — і нічого не кажете про те, *як* його дістати: ні циклів, ні пошуку по index, ні читання файлів. Окремий компонент — **query planner** — вирішує *як*: який index узяти, який алгоритм join, у якому порядку — і може змінювати це рішення, коли дані ростуть чи ви додаєте index, без жодної правки запиту.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Declarative (SQL)', uk: 'Декларативно (SQL)' },
          b: { en: 'Imperative (a hand-written loop)', uk: 'Імперативно (цикл вручну)' },
          rows: [
            [
              { en: 'You write', uk: 'Ви пишете' },
              { en: 'What rows you want', uk: 'Які rows хочете' },
              { en: 'How to fetch them, step by step', uk: 'Як їх дістати, крок за кроком' },
            ],
            [
              { en: 'Who picks the algorithm', uk: 'Хто обирає алгоритм' },
              { en: 'The planner (M5, M16)', uk: 'Planner (M5, M16)' },
              { en: 'You, by hand', uk: 'Ви, вручну' },
            ],
            [
              { en: 'Adapts to new indexes & stats', uk: 'Адаптується до нових indexes і stats' },
              { en: 'Yes, automatically', uk: 'Так, автоматично' },
              { en: 'No — you must rewrite the code', uk: 'Ні — треба переписати код' },
            ],
            [
              { en: 'When it is slow', uk: 'Коли повільно' },
              { en: 'EXPLAIN shows the plan; tune it', uk: 'EXPLAIN показує plan; тюньте' },
              { en: 'Debug your own loop', uk: 'Дебажте власний цикл' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Sets, not loops', uk: 'Множини, а не цикли' },
          md: {
            en: "The single biggest mindset shift for engineers coming from imperative code: stop thinking \"for each row, do…\" and start thinking \"which **set** of rows do I want?\" Let the engine loop. A query that asks for the right set in one statement will almost always beat a loop that fetches rows and processes them one by one in the application — the N+1 problem of M34. The next module, *Anatomy of a query*, opens up exactly how the engine turns your declared set into an execution.",
            uk: "Найбільша зміна мислення для інженерів з імперативного коду: припиніть думати «для кожного row зроби…» і починайте «яку **множину** rows я хочу?» Хай цикл робить движок. Запит, що просить правильну множину одним стейтментом, майже завжди обходить цикл, який тягне rows і обробляє їх по одному в застосунку — проблема N+1 з M34. Наступний модуль, *Анатомія запиту*, розкриває саме те, як движок перетворює вашу задекларовану множину на виконання.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'The relational model (Codd, 1970) stores data as relations/tables of rows (tuples) and columns (attributes), each column drawn from a domain (its type).',
      uk: 'Реляційна модель (Codd, 1970) зберігає дані як relations/tables з rows (tuples) і columns (attributes), кожна column — з domain (свого типу).',
    },
    {
      en: 'A primary key uniquely identifies a row; a foreign key references one, and referential integrity guarantees that reference is real.',
      uk: 'Primary key унікально ідентифікує row; foreign key посилається на нього, а referential integrity гарантує, що посилання справжнє.',
    },
    {
      en: 'The three relationship shapes — 1:1, 1:N, M:N — are all expressed with keys; M:N needs a junction table.',
      uk: 'Три форми звʼязків — 1:1, 1:N, M:N — усі виражаються ключами; M:N потребує junction table.',
    },
    {
      en: 'SELECT is relational algebra in disguise: projection (columns) + selection (WHERE) + join, composed — which is why the optimizer can rearrange it.',
      uk: 'SELECT — це relational algebra під маскою: projection (columns) + selection (WHERE) + join у композиції — тому optimizer може її перебудовувати.',
    },
    {
      en: 'SQL is declarative and runs clauses in a logical order (FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY), not the written order: think in sets, not loops.',
      uk: 'SQL декларативний і виконує клаузи в логічному порядку (FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY), а не письмовому: мисліть множинами, а не циклами.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Treating NULL like zero or an empty string', uk: 'Ставитись до NULL як до нуля чи порожнього рядка' },
      body: {
        en: 'NULL means "unknown", so NULL = NULL is not true, and `WHERE col = NULL` matches nothing — you must use `IS NULL`. Aggregates skip NULLs, and a NULL in arithmetic yields NULL. Decide explicitly where NULL is allowed (M8, M9).',
        uk: 'NULL означає «невідомо», тож NULL = NULL не істина, а `WHERE col = NULL` не збігається ні з чим — треба `IS NULL`. Агрегати пропускають NULL, а NULL в арифметиці дає NULL. Свідомо вирішуйте, де NULL дозволений (M8, M9).',
      },
    },
    {
      title: { en: 'Assuming rows come back in insertion order', uk: 'Вважати, що rows повертаються в порядку вставки' },
      body: {
        en: 'A table is a set; without ORDER BY the engine may return rows in any order, and that order can change between runs, versions, or plans. If order matters, state it with ORDER BY — never rely on the physical layout.',
        uk: 'Table — це множина; без ORDER BY движок може повернути rows у будь-якому порядку, і він може мінятися між запусками, версіями чи планами. Якщо порядок важить, задайте його через ORDER BY — ніколи не покладайтесь на фізичне розташування.',
      },
    },
    {
      title: { en: 'Looping in the app instead of asking for a set', uk: 'Цикл у застосунку замість запиту множини' },
      body: {
        en: 'Fetching ids, then querying each one in a loop (the N+1 pattern) turns one set-based query into hundreds of round-trips. Express the join or aggregate in SQL and let the planner do the work once (M34).',
        uk: 'Дістати ids, потім запитувати кожен у циклі (патерн N+1) перетворює один множинний запит на сотні round-trips. Виразіть join чи агрегат у SQL і дайте planner-у зробити роботу раз (M34).',
      },
    },
  ],
  interview: [
    {
      level: 'beginner',
      q: {
        en: 'What is the difference between a primary key and a foreign key?',
        uk: 'Яка різниця між primary key і foreign key?',
      },
      a: {
        en: 'A primary key is the column(s) that uniquely identify each row in its own table and can never be NULL. A foreign key is a column in another (or the same) table whose value must match an existing primary key, expressing a relationship and enforcing referential integrity — the database refuses rows that point at a non-existent parent, and refuses to orphan children unless you define a cascade.',
        uk: 'Primary key — це column(и), що унікально ідентифікують кожен row у власній table і не бувають NULL. Foreign key — column в іншій (чи тій самій) table, чиє значення мусить збігатися з наявним primary key; він виражає звʼязок і забезпечує referential integrity — база відмовляє rows, що вказують на неіснуючого батька, і не дає осиротити дітей, якщо не задано cascade.',
      },
    },
    {
      level: 'beginner',
      q: {
        en: 'Why can you use a column alias in ORDER BY but not in WHERE?',
        uk: 'Чому alias column можна в ORDER BY, але не в WHERE?',
      },
      a: {
        en: 'Because of the logical processing order. WHERE runs before SELECT, so the alias defined in SELECT does not exist yet when WHERE is evaluated. ORDER BY runs after SELECT, so by then the alias is available. The clauses are not evaluated in the order they are written — FROM and WHERE come first, SELECT in the middle, ORDER BY last.',
        uk: 'Через логічний порядок обробки. WHERE виконується до SELECT, тож alias, заданий у SELECT, ще не існує під час WHERE. ORDER BY — після SELECT, тож тоді alias уже доступний. Клаузи виконуються не в письмовому порядку — спершу FROM і WHERE, посередині SELECT, останнім ORDER BY.',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'What does it mean that SQL is "declarative", and why does that matter for performance?',
        uk: 'Що означає, що SQL «декларативний», і чому це важить для продуктивності?',
      },
      a: {
        en: 'You declare the result (which set of rows) rather than the procedure to compute it. A separate planner chooses the physical strategy — indexes, join algorithms, order — based on statistics, and re-chooses as data and indexes change, all without editing the query. The upside is portability and automatic adaptation; the catch is that performance depends on the planner getting good estimates, so you tune via indexes, statistics and EXPLAIN rather than by hand-coding the algorithm (M5, M16).',
        uk: 'Ви декларуєте результат (яку множину rows), а не процедуру обчислення. Окремий planner обирає фізичну стратегію — indexes, алгоритми join, порядок — на основі statistics, і переобирає, коли дані й indexes змінюються, без правки запиту. Плюс — портативність і автоадаптація; підступ — продуктивність залежить від хороших оцінок planner-а, тож тюнінг іде через indexes, statistics і EXPLAIN, а не ручне кодування алгоритму (M5, M16).',
      },
    },
  ],
  seeAlso: ['m1-what-is-a-database', 'm3-sql-vs-nosql', 'm5-anatomy-of-a-query', 'm6-er-modeling', 'm8-keys-constraints'],
  sources: [
    {
      title: 'E. F. Codd — A Relational Model of Data for Large Shared Data Banks (CACM, 1970)',
      url: 'https://dl.acm.org/doi/10.1145/362384.362685',
    },
    {
      title: 'PostgreSQL Documentation — The SQL Language: Concepts (relations, rows, columns)',
      url: 'https://www.postgresql.org/docs/current/tutorial-concepts.html',
    },
    {
      title: 'PostgreSQL Documentation — SELECT (the logical clause processing order)',
      url: 'https://www.postgresql.org/docs/current/sql-select.html',
    },
    {
      title: 'PostgreSQL Documentation — Constraints (primary keys & foreign keys)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
    },
    {
      title: 'PostgreSQL Documentation — Joins Between Tables',
      url: 'https://www.postgresql.org/docs/current/tutorial-join.html',
    },
  ],
};
