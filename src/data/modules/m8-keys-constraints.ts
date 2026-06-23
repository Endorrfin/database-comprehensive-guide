import type { Module } from '../types';

/*
 * M8 · Keys & constraints — Section II (S5). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-23 (see `sources`):
 *  - Referential actions NO ACTION (default) / RESTRICT / CASCADE / SET NULL / SET DEFAULT;
 *    SET NULL/SET DEFAULT may take a column list since PostgreSQL 15 (PG18 docs, CREATE TABLE).
 *  - UNIQUE … NULLS NOT DISTINCT added in PostgreSQL 15 (default is NULLS DISTINCT).
 *  - Generated columns: STORED vs VIRTUAL; VIRTUAL is the default since PostgreSQL 18
 *    (STORED-only through 17).
 *  - GENERATED … AS IDENTITY (SQL-standard) preferred over serial (PostgreSQL wiki "Don't Do This").
 * Figure 'referential-actions' is the motivating diagram. Non-signature module: figure + tables
 * + code, no hero sim.
 */
export const m8: Module = {
  id: 'm8-keys-constraints',
  num: 8,
  section: 's2-relational',
  order: 3,
  level: 'middle',
  title: { en: 'Keys & constraints', uk: 'Ключі та constraints' },
  tagline: {
    en: 'PK/FK/unique/candidate, referential actions, CHECK/NOT NULL/DEFAULT.',
    uk: 'PK/FK/unique/candidate, referential actions, CHECK/NOT NULL/DEFAULT.',
  },
  readMins: 11,
  mentalModel: {
    en: "Constraints are the database's last line of integrity — push invariants down into it.",
    uk: 'Constraints — остання лінія цілісності бази даних; проштовхуйте інваріанти в неї.',
  },
  topics: [
    {
      id: 'key-taxonomy',
      title: { en: 'The key family: super → candidate → primary', uk: 'Сімʼя ключів: super → candidate → primary' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **key** is a column (or set of columns) whose values identify a row. The vocabulary is a nesting of three precise terms. A **superkey** is *any* set of columns that is guaranteed unique — including wasteful ones like `(id, email, anything_else)`. A **candidate key** is a **minimal** superkey: drop any column and it stops being unique. A table can have several candidate keys (`id`, and separately `email`); you anoint exactly one as the **primary key** — the row's official identity, always `NOT NULL`. The leftover candidate keys are **alternate keys**, and you enforce each with a `UNIQUE` constraint so the database still guarantees them.",
            uk: "**Key** — це колонка (чи набір колонок), значення якої ідентифікують рядок. Словник — це вкладеність трьох точних термінів. **Superkey** — це *будь-який* набір колонок, гарантовано унікальний, включно з надлишковими на кшталт `(id, email, anything_else)`. **Candidate key** — **мінімальний** superkey: приберіть будь-яку колонку — і він перестане бути унікальним. Таблиця може мати кілька candidate keys (`id` і окремо `email`); рівно один ви робите **primary key** — офіційною ідентичністю рядка, завжди `NOT NULL`. Решта candidate keys — **alternate keys**, і кожен ви забезпечуєте `UNIQUE` constraint, щоб база все одно їх гарантувала.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The key vocabulary, with a concrete example per term.',
            uk: 'Словник ключів із конкретним прикладом на кожен термін.',
          },
          head: [
            { en: 'Term', uk: 'Термін' },
            { en: 'Meaning', uk: 'Значення' },
            { en: 'Example', uk: 'Приклад' },
          ],
          rows: [
            [
              { en: 'Superkey', uk: 'Superkey' },
              { en: 'Any column set that is unique (may be non-minimal)', uk: 'Будь-який унікальний набір колонок (може бути не мінімальним)' },
              { en: '(id), (id, email), (email, name)', uk: '(id), (id, email), (email, name)' },
            ],
            [
              { en: 'Candidate key', uk: 'Candidate key' },
              { en: 'A minimal superkey — nothing removable', uk: 'Мінімальний superkey — нічого не прибрати' },
              { en: 'id; email (two separate ones)', uk: 'id; email (два окремі)' },
            ],
            [
              { en: 'Primary key', uk: 'Primary key' },
              { en: 'The chosen candidate key; NOT NULL, one per table', uk: 'Обраний candidate key; NOT NULL, один на таблицю' },
              { en: 'PRIMARY KEY (id)', uk: 'PRIMARY KEY (id)' },
            ],
            [
              { en: 'Alternate / unique key', uk: 'Alternate / unique key' },
              { en: 'A candidate key not chosen as PK; kept by UNIQUE', uk: 'Candidate key, не обраний за PK; тримається UNIQUE' },
              { en: 'UNIQUE (email)', uk: 'UNIQUE (email)' },
            ],
            [
              { en: 'Composite key', uk: 'Composite key' },
              { en: 'A key spanning more than one column', uk: 'Ключ, що охоплює більше однієї колонки' },
              { en: 'PRIMARY KEY (order_id, line_no)', uk: 'PRIMARY KEY (order_id, line_no)' },
            ],
            [
              { en: 'Foreign key', uk: 'Foreign key' },
              { en: 'Columns referencing a key in another (or same) table', uk: 'Колонки, що посилаються на ключ іншої (чи тієї ж) таблиці' },
              { en: 'FOREIGN KEY (customer_id) → customers(id)', uk: 'FOREIGN KEY (customer_id) → customers(id)' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "The deepest practical choice is **natural vs surrogate**. A **natural key** is made of real-world data — an email, an ISBN, a `(country_code, plate)`. A **surrogate key** is a synthetic, meaningless identifier — an auto-incrementing `IDENTITY` integer or a `UUID` — that exists only to identify the row. Natural keys feel elegant until the real world changes: people change email, companies merge, a country renames. Because a primary key's job is to be a *stable* anchor that foreign keys point at, a value that can change is a poor anchor — every change has to cascade everywhere.",
            uk: "Найглибший практичний вибір — **natural проти surrogate**. **Natural key** складається з реальних даних — email, ISBN, `(country_code, plate)`. **Surrogate key** — синтетичний, беззмістовний ідентифікатор — автоінкрементний `IDENTITY` integer чи `UUID` — що існує лише для ідентифікації рядка. Natural keys здаються елегантними, доки реальність не зміниться: люди міняють email, компанії зливаються, країна перейменовується. Оскільки робота primary key — бути *стабільним* якорем, на який вказують foreign keys, значення, що може змінитися, — поганий якір: кожна зміна мусить каскадувати всюди.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The pragmatic default: surrogate PK + UNIQUE on the natural key', uk: 'Прагматичний дефолт: surrogate PK + UNIQUE на natural key' },
          md: {
            en: "Most schemas use a **surrogate primary key** (a `bigint GENERATED … AS IDENTITY`, or a time-sortable `uuidv7()` since PostgreSQL 18) **and** a `UNIQUE` constraint on the natural key. You get both properties: a narrow, immutable anchor for foreign keys, and the database still enforces that no two users share an email. Reaching for a natural primary key — say `email` as the PK — works right up until a user changes it and you must update that value in five referencing tables. Pick a surrogate to *point at*, and constrain the natural key to keep it honest.",
            uk: "Більшість схем беруть **surrogate primary key** (`bigint GENERATED … AS IDENTITY` або сортований за часом `uuidv7()` від PostgreSQL 18) **і** `UNIQUE` constraint на natural key. Ви отримуєте обидві властивості: вузький незмінний якір для foreign keys — і база все одно забезпечує, що двоє користувачів не мають однакового email. Брати natural primary key — скажімо, `email` як PK — працює рівно доти, доки користувач його не змінить, і ви мусите оновити це значення у пʼяти таблицях, що посилаються. Обирайте surrogate, *на який указувати*, а natural key обмежуйте, щоб тримати чесність.",
          },
        },
      ],
    },
    {
      id: 'foreign-keys',
      title: { en: 'Foreign keys & referential integrity', uk: 'Foreign keys і referential integrity' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **foreign key** is the database enforcing a promise: *every* value in the child column must match an existing row in the parent — or be `NULL`. With it in place, an `orders` row can never reference a `customer_id` that does not exist; the database simply refuses to create the orphan. This is **referential integrity**, and it is the single most valuable constraint in a relational schema because it makes a whole class of “dangling pointer” bugs impossible by construction.",
            uk: "**Foreign key** — це база, що забезпечує обіцянку: *кожне* значення в дочірній колонці має відповідати наявному рядку в батьківській — або бути `NULL`. Коли він на місці, рядок `orders` ніколи не зможе послатися на `customer_id`, якого не існує; база просто відмовиться створити orphan. Це **referential integrity**, і це найцінніший constraint у реляційній схемі, бо він робить цілий клас багів «висячого вказівника» неможливим за побудовою.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "But what should happen to the children when the **parent** is deleted or its key changes? That is the FK's **referential action**, and choosing it wrong is how you either accumulate orphans or lose data. Below, deleting a customer two orders depend on plays out three different ways:",
            uk: "Але що має статися з дітьми, коли **батька** видаляють чи його ключ змінюється? Це **referential action** для FK, і неправильний вибір — це шлях або накопичити orphans, або втратити дані. Нижче видалення клієнта, від якого залежать два orders, відбувається трьома різними способами:",
          },
        },
        {
          kind: 'figure',
          fig: 'referential-actions',
          caption: {
            en: 'Deleting customers.id = 7, referenced by two orders: RESTRICT blocks it, CASCADE deletes the orders too, SET NULL keeps them but nulls customer_id.',
            uk: 'Видалення customers.id = 7, на яке посилаються два orders: RESTRICT блокує, CASCADE видаляє й orders, SET NULL лишає їх, але занулює customer_id.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The five referential actions for ON DELETE / ON UPDATE. NO ACTION is the default.',
            uk: 'Пʼять referential actions для ON DELETE / ON UPDATE. NO ACTION — за замовчуванням.',
          },
          head: [
            { en: 'Action', uk: 'Дія' },
            { en: 'Effect on the child rows', uk: 'Вплив на дочірні рядки' },
            { en: 'Use when', uk: 'Коли застосовувати' },
          ],
          rows: [
            [
              { en: 'NO ACTION (default)', uk: 'NO ACTION (дефолт)' },
              { en: 'Error if children remain; the check can be deferred to commit', uk: 'Помилка, якщо діти лишаються; перевірку можна відкласти до commit' },
              { en: 'The safe default — refuse to orphan', uk: 'Безпечний дефолт — не лишати orphans' },
            ],
            [
              { en: 'RESTRICT', uk: 'RESTRICT' },
              { en: 'Same error, but checked immediately (cannot be deferred)', uk: 'Та сама помилка, але перевірка негайна (не відкладається)' },
              { en: 'You want the block enforced right now', uk: 'Потрібно, щоб блок діяв негайно' },
            ],
            [
              { en: 'CASCADE', uk: 'CASCADE' },
              { en: 'Delete (or update) the child rows along with the parent', uk: 'Видалити (чи оновити) дочірні рядки разом із батьком' },
              { en: 'Children cannot exist without the parent (order_lines)', uk: 'Діти не можуть існувати без батька (order_lines)' },
            ],
            [
              { en: 'SET NULL', uk: 'SET NULL' },
              { en: 'Set the child FK column(s) to NULL (a subset, since PG 15)', uk: 'Занулити дочірні FK-колонки (підмножину, від PG 15)' },
              { en: 'The link is optional; keep the child, forget the parent', uk: 'Звʼязок необовʼязковий; лишити дитину, забути батька' },
            ],
            [
              { en: 'SET DEFAULT', uk: 'SET DEFAULT' },
              { en: "Set the child FK column(s) to their DEFAULT (which must reference an existing row)", uk: 'Виставити дочірні FK-колонки в їхній DEFAULT (що має посилатися на наявний рядок)' },
              { en: 'A sentinel parent exists (e.g. an “unassigned” row)', uk: 'Існує батько-заглушка (напр. рядок «unassigned»)' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `CREATE TABLE customers (
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text   NOT NULL,
  UNIQUE (email)                         -- natural key kept honest
);

CREATE TABLE orders (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL
              REFERENCES customers (id)
              ON DELETE RESTRICT          -- don't let a customer vanish under live orders
              ON UPDATE CASCADE,          -- if the parent key ever changes, follow it
  total_cents bigint NOT NULL CHECK (total_cents >= 0)
);

-- A child index is NOT created automatically — add it yourself:
CREATE INDEX ON orders (customer_id);`,
          note: {
            en: 'PostgreSQL auto-indexes the referenced (parent) side because it must be unique — but never the referencing (child) side.',
            uk: 'PostgreSQL автоматично індексує батьківський бік, бо він має бути унікальним — але ніколи дочірній (referencing).',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A foreign key without a child index is a hidden full scan', uk: 'Foreign key без дочірнього index — це прихований full scan' },
          md: {
            en: "This is the single most common FK performance trap. PostgreSQL automatically indexes the **parent** column (it has to be unique) but **does not** index the **child** `customer_id`. So every `DELETE` or key-`UPDATE` on a parent must scan the entire child table to find referencing rows, and your `JOIN`s on that column do too. On a large `orders` table this turns a one-row delete into a sequential scan of millions. The rule: **index every foreign-key column on the child side** unless you can prove you never delete parents and never join on it.",
            uk: "Це найпоширеніша пастка продуктивності FK. PostgreSQL автоматично індексує **батьківську** колонку (вона має бути унікальною), але **не** індексує **дочірній** `customer_id`. Тож кожен `DELETE` чи key-`UPDATE` батька мусить сканувати всю дочірню таблицю в пошуку referencing-рядків — і ваші `JOIN` по цій колонці теж. На великій `orders` це перетворює видалення одного рядка на sequential scan мільйонів. Правило: **індексуйте кожну foreign-key колонку на дочірньому боці**, якщо не можете довести, що ніколи не видаляєте батьків і не join по ній.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two more tools round this out. **`DEFERRABLE INITIALLY DEFERRED`** delays the integrity check to `COMMIT` instead of each statement — essential for circular references (A points at B, B points at A) and for bulk reordering where rows are briefly inconsistent mid-transaction. And foreign keys can be **composite**, referencing a multi-column key; that is exactly when the PG 15 column-list form `ON DELETE SET NULL (customer_id)` earns its keep, nulling only part of a composite reference.",
            uk: "Два інструменти доповнюють картину. **`DEFERRABLE INITIALLY DEFERRED`** відкладає перевірку цілісності до `COMMIT` замість кожного statement — необхідне для циклічних посилань (A вказує на B, B на A) і для масового перевпорядкування, де рядки на мить неузгоджені всередині транзакції. А foreign keys можуть бути **composite**, посилаючись на багатоколонковий ключ; саме тоді форма зі списком колонок із PG 15 `ON DELETE SET NULL (customer_id)` стає в пригоді, занулюючи лише частину composite-посилання.",
          },
        },
      ],
    },
    {
      id: 'constraint-toolbox',
      title: { en: 'The constraint toolbox', uk: 'Набір constraints' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Beyond keys, a handful of constraints let you state invariants the database will then guarantee forever. Each one converts an assumption your code *hopes* is true into a rule the engine *makes* true.",
            uk: "Окрім ключів, кілька constraints дають вам сформулювати інваріанти, які база потім гарантуватиме назавжди. Кожен перетворює припущення, на яке ваш код *сподівається*, на правило, яке движок *робить* істинним.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The core constraint types — what each guarantees.',
            uk: 'Основні типи constraints — що кожен гарантує.',
          },
          head: [
            { en: 'Constraint', uk: 'Constraint' },
            { en: 'Guarantees', uk: 'Гарантує' },
            { en: 'Example', uk: 'Приклад' },
          ],
          rows: [
            [
              { en: 'NOT NULL', uk: 'NOT NULL' },
              { en: 'The column always has a value', uk: 'Колонка завжди має значення' },
              { en: 'email text NOT NULL', uk: 'email text NOT NULL' },
            ],
            [
              { en: 'CHECK', uk: 'CHECK' },
              { en: 'A boolean expression holds for every row', uk: 'Булевий вираз істинний для кожного рядка' },
              { en: 'CHECK (price >= 0)', uk: 'CHECK (price >= 0)' },
            ],
            [
              { en: 'UNIQUE', uk: 'UNIQUE' },
              { en: 'No two rows share the value(s)', uk: 'Жодні два рядки не мають однакових значень' },
              { en: 'UNIQUE (email)', uk: 'UNIQUE (email)' },
            ],
            [
              { en: 'PRIMARY KEY', uk: 'PRIMARY KEY' },
              { en: 'UNIQUE + NOT NULL; the row identity (one per table)', uk: 'UNIQUE + NOT NULL; ідентичність рядка (один на таблицю)' },
              { en: 'PRIMARY KEY (id)', uk: 'PRIMARY KEY (id)' },
            ],
            [
              { en: 'FOREIGN KEY', uk: 'FOREIGN KEY' },
              { en: 'The value matches an existing parent row', uk: 'Значення відповідає наявному батьківському рядку' },
              { en: 'REFERENCES customers (id)', uk: 'REFERENCES customers (id)' },
            ],
            [
              { en: 'EXCLUDE', uk: 'EXCLUDE' },
              { en: 'No two rows conflict under an operator (generalized UNIQUE)', uk: 'Жодні два рядки не конфліктують за оператором (узагальнений UNIQUE)' },
              { en: 'EXCLUDE USING gist (room WITH =, during WITH &&)', uk: 'EXCLUDE USING gist (room WITH =, during WITH &&)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The UNIQUE-plus-NULL surprise (and the PG 15 fix)', uk: 'Сюрприз UNIQUE-плюс-NULL (і виправлення в PG 15)' },
          md: {
            en: "A `UNIQUE` column does **not** stop you inserting many rows with `NULL` in it. By the SQL rule, every `NULL` is *distinct* from every other `NULL`, so they never collide — a `UNIQUE (ssn)` column happily holds a thousand `NULL` SSNs. If you need “at most one row may leave this blank”, PostgreSQL 15 added `UNIQUE NULLS NOT DISTINCT`, which treats `NULL`s as equal so only one is allowed. Know which behavior you have; the default trips up almost everyone once.",
            uk: "Колонка `UNIQUE` **не** заважає вставити багато рядків із `NULL` у ній. За правилом SQL кожен `NULL` *відмінний* від кожного іншого `NULL`, тож вони ніколи не стикаються — колонка `UNIQUE (ssn)` спокійно тримає тисячу `NULL` SSN. Якщо потрібно «щонайбільше один рядок може лишити це порожнім», PostgreSQL 15 додав `UNIQUE NULLS NOT DISTINCT`, що вважає `NULL`-и рівними, тож дозволено лише один. Знайте, яка поведінка у вас; дефолт колись підставляє майже кожного.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two more pieces are not constraints but belong in the same toolbox. A **`DEFAULT`** supplies a value when none is given (`created_at timestamptz DEFAULT now()`). A **generated column** derives its value from other columns — `area numeric GENERATED ALWAYS AS (w * h)`. Generated columns come in two kinds: **`STORED`** computes on write and occupies disk like a normal column, while **`VIRTUAL`** computes on read and stores nothing. The default flipped in **PostgreSQL 18**: a plain `GENERATED … AS (…)` is now `VIRTUAL` (through PG 17 it was always `STORED`). Choose `STORED` when the expression is expensive and read often; `VIRTUAL` when writes are hot and the value is cheap to recompute.",
            uk: "Ще два елементи — не constraints, але живуть у тому ж наборі. **`DEFAULT`** дає значення, коли його не вказано (`created_at timestamptz DEFAULT now()`). **Generated column** виводить значення з інших колонок — `area numeric GENERATED ALWAYS AS (w * h)`. Generated columns бувають двох видів: **`STORED`** обчислюється під час запису і займає диск, як звичайна колонка, а **`VIRTUAL`** обчислюється під час читання й нічого не зберігає. Дефолт змінився у **PostgreSQL 18**: звичайний `GENERATED … AS (…)` тепер `VIRTUAL` (до PG 17 завжди був `STORED`). Обирайте `STORED`, коли вираз дорогий і читається часто; `VIRTUAL`, коли записи гарячі, а значення дешеве перерахувати.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Prefer GENERATED … AS IDENTITY over serial', uk: 'Віддавайте перевагу GENERATED … AS IDENTITY над serial' },
          md: {
            en: "For an auto-incrementing key, reach for `bigint GENERATED ALWAYS AS IDENTITY`, not the old `serial`/`bigserial`. `serial` is not a real type — it quietly creates a sequence and a default — and that indirection causes ownership and permission surprises (the sequence can be left behind, the column type is just `integer`). `IDENTITY` is the SQL-standard spelling, ties the sequence to the column cleanly, and `ALWAYS` blocks accidental manual inserts into the id. This is exactly the PostgreSQL wiki's “Don't Do This” guidance.",
            uk: "Для автоінкрементного ключа беріть `bigint GENERATED ALWAYS AS IDENTITY`, а не старий `serial`/`bigserial`. `serial` — не справжній тип: він тихо створює sequence і default — і ця непрямість дає сюрпризи з ownership та правами (sequence може лишитися, тип колонки — лише `integer`). `IDENTITY` — це SQL-стандартний запис, чисто привʼязує sequence до колонки, а `ALWAYS` блокує випадкові ручні вставки в id. Це саме порада з вікі PostgreSQL «Don't Do This».",
          },
        },
      ],
    },
    {
      id: 'push-invariants-down',
      title: { en: 'Push invariants into the database', uk: 'Проштовхуйте інваріанти в базу' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Here is the mental model that ties the module together. Your application is **not the only writer** to the database. A migration script writes to it. The `psql` console writes to it. A second service in another language writes to it. A one-off data fix at 2 a.m. writes to it. A validation rule that lives only in your app's code is enforced for *exactly one* of those paths — the rest can write garbage freely. A constraint in the database is enforced for **all of them, forever**, with no way around it.",
            uk: "Ось ментальна модель, що звʼязує модуль. Ваш застосунок — **не єдиний записувач** у базу. Скрипт міграції пише в неї. Консоль `psql` пише в неї. Другий сервіс іншою мовою пише в неї. Разовий фікс даних о 2-й ночі пише в неї. Правило валідації, що живе лише в коді застосунку, діє рівно для *одного* з цих шляхів — решта можуть вільно писати сміття. Constraint у базі діє для **всіх них, назавжди**, без обхідних шляхів.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Validation in the app', uk: 'Валідація в застосунку' },
          b: { en: 'Constraint in the database', uk: 'Constraint у базі' },
          rows: [
            [
              { en: 'Covers', uk: 'Покриває' },
              { en: 'Only the code path that runs it', uk: 'Лише шлях коду, що його виконує' },
              { en: 'Every writer — app, console, migration, other service', uk: 'Кожного записувача — app, консоль, міграція, інший сервіс' },
            ],
            [
              { en: 'Feedback', uk: 'Зворотний звʼязок' },
              { en: 'Instant, field-level, great UX', uk: 'Миттєвий, на рівні поля, чудовий UX' },
              { en: 'An error at write time', uk: 'Помилка під час запису' },
            ],
            [
              { en: 'Can be bypassed', uk: 'Можна обійти' },
              { en: 'Yes — by any other writer or a bug', uk: 'Так — будь-яким іншим записувачем чи багом' },
              { en: 'No — it is the data’s definition', uk: 'Ні — це визначення самих даних' },
            ],
            [
              { en: 'Best for', uk: 'Найкраще для' },
              { en: 'Rich rules, messages, conditional UX', uk: 'Складні правила, повідомлення, умовний UX' },
              { en: 'Hard integrity invariants that must always hold', uk: 'Жорсткі інваріанти цілісності, що мають триматися завжди' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "This is **defense in depth**, not either/or. Validate in the application for fast, friendly, field-level feedback — and *also* enforce the same invariant as a constraint so it is true no matter who writes. The two are not redundant; they protect different things. The app protects the user's experience; the constraint protects the data's truth.",
            uk: "Це **defense in depth**, а не «або-або». Валідуйте в застосунку заради швидкого, дружнього зворотного звʼязку на рівні поля — *і також* забезпечуйте той самий інваріант як constraint, щоб він був істинним незалежно від того, хто пише. Ці двоє не надлишкові; вони захищають різне. Застосунок захищає досвід користувача; constraint захищає істинність даних.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Constraints are for invariants, not workflow', uk: 'Constraints — для інваріантів, а не для workflow' },
          md: {
            en: "Push *invariants* down — facts that must hold for the data to make sense (`total >= 0`, an order must have a customer, an email is unique). Do **not** push *business workflow* down — “gold customers skip approval on Tuesdays” is logic that changes with the business and belongs in code or a deliberate trigger (M11), not buried in a `CHECK`. The line is: if violating it would mean the data is *corrupt*, it is a constraint; if it is a *policy*, keep it where policies are easy to change. And mind the cost — constraints add a little write overhead and can complicate bulk loads, which is what `DEFERRABLE` and load-then-constrain patterns are for.",
            uk: "Проштовхуйте вниз *інваріанти* — факти, що мають триматися, аби дані мали сенс (`total >= 0`, order мусить мати customer, email унікальний). **Не** проштовхуйте вниз *бізнес-workflow* — «золоті клієнти оминають підтвердження по вівторках» — це логіка, що змінюється з бізнесом і належить коду чи свідомому trigger (M11), а не похована у `CHECK`. Межа така: якщо порушення означає, що дані *пошкоджені*, — це constraint; якщо це *політика*, тримайте її там, де політики легко міняти. І памʼятайте про ціну — constraints додають трохи накладних на запис і можуть ускладнити масові завантаження, для чого й існують `DEFERRABLE` і патерн «завантаж, потім обмеж».",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "So the module reduces to one carry-everywhere line: **a constraint is the database's last line of integrity — push every hard invariant down into it, because the app is never the only writer.** Keys give rows identity and wire tables together; constraints keep every row honest; and the engine, not your hope, is what enforces them.",
            uk: "Тож модуль зводиться до одного рядка на всі випадки: **constraint — це остання лінія цілісності бази; проштовхуйте кожен жорсткий інваріант у неї, бо застосунок ніколи не єдиний записувач.** Ключі дають рядкам ідентичність і звʼязують таблиці; constraints тримають кожен рядок чесним; а забезпечує їх движок, а не ваші сподівання.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Keys nest: a superkey is any unique column set, a candidate key is a minimal one, and the primary key is the candidate key you pick as the row’s identity (NOT NULL); other candidate keys become UNIQUE constraints.',
      uk: 'Ключі вкладені: superkey — будь-який унікальний набір колонок, candidate key — мінімальний, а primary key — candidate key, який ви обираєте ідентичністю рядка (NOT NULL); інші candidate keys стають UNIQUE constraints.',
    },
    {
      en: 'Prefer a surrogate primary key (IDENTITY or uuidv7) plus a UNIQUE constraint on the natural key: a stable anchor for foreign keys, with the real-world key still enforced.',
      uk: 'Віддавайте перевагу surrogate primary key (IDENTITY чи uuidv7) плюс UNIQUE constraint на natural key: стабільний якір для foreign keys, із реальним ключем, що все одно забезпечений.',
    },
    {
      en: 'A foreign key enforces referential integrity; its ON DELETE/ON UPDATE action (NO ACTION default, RESTRICT, CASCADE, SET NULL, SET DEFAULT) decides what happens to children — and you must index the child column yourself.',
      uk: 'Foreign key забезпечує referential integrity; його дія ON DELETE/ON UPDATE (NO ACTION за замовчуванням, RESTRICT, CASCADE, SET NULL, SET DEFAULT) вирішує долю дітей — а дочірню колонку ви маєте проіндексувати самі.',
    },
    {
      en: 'UNIQUE treats NULLs as distinct by default (many NULLs allowed); use NULLS NOT DISTINCT (PG 15) to forbid that. Generated columns default to VIRTUAL since PG 18; prefer GENERATED AS IDENTITY over serial.',
      uk: 'UNIQUE за замовчуванням вважає NULL-и відмінними (багато NULL дозволено); вживайте NULLS NOT DISTINCT (PG 15), щоб заборонити. Generated columns від PG 18 за замовчуванням VIRTUAL; віддавайте перевагу GENERATED AS IDENTITY над serial.',
    },
    {
      en: 'The app is never the only writer, so push hard integrity invariants into the database as constraints (defense in depth) — but keep changeable business policy out of them.',
      uk: 'Застосунок ніколи не єдиний записувач, тож проштовхуйте жорсткі інваріанти цілісності в базу як constraints (defense in depth) — але змінювану бізнес-політику тримайте поза ними.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Forgetting the index on a foreign-key column', uk: 'Забути index на foreign-key колонці' },
      body: {
        en: 'PostgreSQL indexes the parent side automatically but never the child side. Without an index on the referencing column, deleting or key-updating a parent scans the whole child table, and joins on it are slow. Index every FK column on the child unless you can prove you never delete parents and never join on it.',
        uk: 'PostgreSQL індексує батьківський бік автоматично, але ніколи дочірній. Без index на referencing-колонці видалення чи key-update батька сканує всю дочірню таблицю, а join по ній повільні. Індексуйте кожну FK-колонку на дитині, якщо не можете довести, що ніколи не видаляєте батьків і не join по ній.',
      },
    },
    {
      title: { en: 'Assuming UNIQUE blocks duplicate NULLs', uk: 'Вважати, що UNIQUE блокує дублікати NULL' },
      body: {
        en: 'By default each NULL is distinct, so a UNIQUE column accepts unlimited NULLs — a frequent source of “why are there 40 rows with no email?”. If at most one blank is allowed, use UNIQUE NULLS NOT DISTINCT (PG 15) or a partial unique index; do not assume the plain constraint covers it.',
        uk: 'За замовчуванням кожен NULL відмінний, тож UNIQUE-колонка приймає необмежено NULL — часте джерело «чому тут 40 рядків без email?». Якщо дозволено щонайбільше один порожній, вживайте UNIQUE NULLS NOT DISTINCT (PG 15) чи partial unique index; не припускайте, що звичайний constraint це покриває.',
      },
    },
    {
      title: { en: 'Using a mutable natural key as the primary key', uk: 'Брати змінний natural key за primary key' },
      body: {
        en: 'Making email or a phone number the primary key works until someone changes it, at which point the value must cascade through every referencing table. Use a stable surrogate key as the PK and enforce the natural key with a separate UNIQUE constraint.',
        uk: 'Зробити email чи телефон primary key працює, доки хтось його не змінить, і тоді значення мусить каскадувати крізь кожну referencing-таблицю. Беріть стабільний surrogate key за PK і забезпечуйте natural key окремим UNIQUE constraint.',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'What is the difference between a candidate key, a primary key, and a unique constraint?',
        uk: 'Яка різниця між candidate key, primary key і unique constraint?',
      },
      a: {
        en: 'A candidate key is any minimal set of columns that uniquely identifies a row — a table can have several. The primary key is the one candidate key you designate as the row’s official identity; it is NOT NULL and there is exactly one per table, and it is what foreign keys typically reference. The remaining candidate keys are still real keys, and you enforce each of them with a UNIQUE constraint so the database guarantees uniqueness. So PRIMARY KEY is essentially UNIQUE + NOT NULL + “this is the identity”; UNIQUE alone allows NULLs (and, by default, multiple NULLs).',
        uk: 'Candidate key — будь-який мінімальний набір колонок, що унікально ідентифікує рядок; таблиця може мати кілька. Primary key — той candidate key, який ви робите офіційною ідентичністю рядка; він NOT NULL, рівно один на таблицю, і саме на нього зазвичай посилаються foreign keys. Решта candidate keys — теж справжні ключі, і кожен ви забезпечуєте UNIQUE constraint, щоб база гарантувала унікальність. Тож PRIMARY KEY — це по суті UNIQUE + NOT NULL + «це ідентичність»; сам UNIQUE дозволяє NULL (і за замовчуванням кілька NULL).',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Walk through ON DELETE NO ACTION vs RESTRICT vs CASCADE vs SET NULL. When would you pick each?',
        uk: 'Розберіть ON DELETE NO ACTION проти RESTRICT проти CASCADE проти SET NULL. Коли обрати кожен?',
      },
      a: {
        en: 'All four decide what happens to child rows when a referenced parent is deleted. NO ACTION (the default) and RESTRICT both raise an error if children remain — the difference is timing: RESTRICT checks immediately, while NO ACTION can be deferred to commit, which matters with DEFERRABLE constraints or circular references. CASCADE deletes the children too — correct when a child cannot exist without its parent, like order_lines under an order, but dangerous if you do not realize how far it propagates. SET NULL keeps the children and nulls their foreign-key column — right when the relationship is optional, e.g. a task whose assignee left. I default to NO ACTION/RESTRICT for safety, use CASCADE only for true ownership/composition, and SET NULL for optional links — and I always index the child column so the action is not a full scan.',
        uk: 'Усі чотири вирішують долю дочірніх рядків при видаленні батька. NO ACTION (дефолт) і RESTRICT обидва дають помилку, якщо діти лишаються — різниця в часі: RESTRICT перевіряє негайно, а NO ACTION можна відкласти до commit, що важить із DEFERRABLE constraints чи циклічними посиланнями. CASCADE видаляє й дітей — правильно, коли дитина не може існувати без батька, як order_lines під order, але небезпечно, якщо не усвідомлюєш, як далеко це поширюється. SET NULL лишає дітей і занулює їхню foreign-key колонку — доречно, коли звʼязок необовʼязковий, напр. задача, чий виконавець пішов. Я за замовчуванням беру NO ACTION/RESTRICT заради безпеки, CASCADE — лише для справжнього ownership/composition, а SET NULL — для необовʼязкових звʼязків — і завжди індексую дочірню колонку, щоб дія не була full scan.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Why enforce invariants in the database when the application already validates them?',
        uk: 'Навіщо забезпечувати інваріанти в базі, якщо застосунок уже їх валідує?',
      },
      a: {
        en: 'Because the application is never the only writer. Migrations, an admin in psql, a second service, a background job, and the inevitable 2 a.m. manual fix all write to the same tables and bypass your app’s validation entirely. An invariant that lives only in app code is true for one path and unguarded for the rest, so data drifts corrupt over time. A constraint is part of the data’s definition: it holds for every writer, forever, and cannot be skipped. The right model is defense in depth — validate in the app for great UX and instant feedback, and enforce the same hard invariant as a NOT NULL / CHECK / UNIQUE / FOREIGN KEY so correctness does not depend on every caller behaving. The caveat is to push down genuine integrity invariants, not changeable business policy, which belongs in code or a deliberate trigger.',
        uk: 'Бо застосунок ніколи не єдиний записувач. Міграції, адмін у psql, другий сервіс, фонова задача й неминучий ручний фікс о 2-й ночі — усі пишуть у ті ж таблиці й повністю оминають валідацію застосунку. Інваріант, що живе лише в коді застосунку, істинний для одного шляху й незахищений для решти, тож дані з часом псуються. Constraint — частина визначення даних: він тримається для кожного записувача, назавжди, і його не оминути. Правильна модель — defense in depth: валідуйте в застосунку заради чудового UX і миттєвого відгуку, і забезпечуйте той самий жорсткий інваріант як NOT NULL / CHECK / UNIQUE / FOREIGN KEY, щоб коректність не залежала від доброї поведінки кожного викликача. Застереження — проштовхувати справжні інваріанти цілісності, а не змінювану бізнес-політику, якій місце в коді чи свідомому trigger.',
      },
    },
  ],
  seeAlso: ['m7-normalization', 'm9-data-types', 'm4-relational-model', 'm11-views-procedural', 'm14-index-toolbox'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 5.5. Constraints (primary/unique/check/foreign keys, NULLS NOT DISTINCT, referential actions)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — CREATE TABLE (ON DELETE/ON UPDATE actions; SET NULL/SET DEFAULT column list since PG 15)',
      url: 'https://www.postgresql.org/docs/current/sql-createtable.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 5.4. Generated Columns (STORED vs VIRTUAL; VIRTUAL is the PG 18 default)',
      url: 'https://www.postgresql.org/docs/current/ddl-generated-columns.html',
    },
    {
      title: 'PostgreSQL Feature Matrix — UNIQUE … NULLS NOT DISTINCT (added in PostgreSQL 15)',
      url: 'https://www.postgresql.org/about/featurematrix/detail/unique-nulls-not-distinct/',
    },
    {
      title: 'PostgreSQL Wiki — Don\'t Do This (prefer IDENTITY over serial; constraints as data integrity)',
      url: 'https://wiki.postgresql.org/wiki/Don%27t_Do_This',
    },
  ],
};
