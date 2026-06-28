import type { Module } from '../types';

/*
 * M6 · ER modeling & schema design — Section II opener, signature module (S4).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): Chen 1976 "The Entity-Relationship
 * Model—Toward a Unified View of Data" (ACM TODS 1:9-36); crow's-foot cardinality
 * (Everest 1976, per the ER-model literature); PostgreSQL 18 foreign-key & constraint
 * docs for the cardinality→FK mapping and the M:N junction table. The embedded
 * 'er-explorer' sim shows the cardinality→schema rule; 'er-notation' is the legend.
 */
export const m6: Module = {
  id: 'm6-er-modeling',
  num: 6,
  section: 's2-relational',
  order: 1,
  level: 'middle',
  signature: true,
  title: { en: 'ER modeling & schema design', uk: 'ER-моделювання та дизайн схеми' },
  tagline: {
    en: 'Entities, relationships, cardinality, and the conceptual → logical → physical path.',
    uk: 'Entities, звʼязки, cardinality і шлях conceptual → logical → physical.',
  },
  readMins: 11,
  mentalModel: {
    en: 'Model the nouns and their relationships first; tables come after.',
    uk: 'Спершу моделюйте іменники та їхні звʼязки; таблиці — потім.',
  },
  topics: [
    {
      id: 'entities-and-attributes',
      title: { en: 'From ideas to entities & attributes', uk: 'Від ідей до entities та attributes' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Before a single `CREATE TABLE`, good schema design is a **modeling** exercise: turn a fuzzy description of a business into precise things and the connections between them. Peter Chen's 1976 **Entity-Relationship model** gives the vocabulary. An **entity** is a thing you keep data about — a noun like *Student*, *Course*, *Order*. An **attribute** is a property of an entity — *name*, *email*, *total*. An **entity set** (or entity *type*) is the collection of all entities of one kind, and it is what becomes a table. The first skill is reading a paragraph of requirements and spotting which nouns are entities, which words are attributes, and which attribute **identifies** each instance.",
            uk: "Перш ніж писати бодай один `CREATE TABLE`, хороший дизайн схеми — це вправа з **моделювання**: перетворити розмитий опис бізнесу на точні речі та звʼязки між ними. **Entity-Relationship model** Пітера Чена (1976) дає словник. **Entity** — це річ, про яку ви тримаєте дані, іменник: *Student*, *Course*, *Order*. **Attribute** — властивість entity: *name*, *email*, *total*. **Entity set** (або *type*) — сукупність усіх entity одного виду, і саме вона стає таблицею. Перша навичка — прочитати абзац вимог і розгледіти, які іменники є entities, які слова — attributes, і який attribute **ідентифікує** кожен екземпляр.",
          },
        },
        {
          kind: 'figure',
          fig: 'er-notation',
          caption: {
            en: 'The notation in one glance: Chen draws entities as rectangles, attributes as ovals (key attributes underlined), and relationships as diamonds; crow’s-foot marks how many of each side take part.',
            uk: 'Нотація з одного погляду: Chen малює entities прямокутниками, attributes — овалами (ключові підкреслено), а relationships — ромбами; crow’s-foot показує, скільки кожного боку бере участь.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two notations dominate. **Chen** notation (the diamonds and ovals above) is expressive and great for teaching. **Crow's-foot** notation — the forks and bars on the connector — is what you will actually see in tools and most diagrams, because it shows **cardinality** compactly: a bar means *one*, the splayed “foot” means *many*, and an extra circle means *optional* (zero). Read the symbol **at the entity it touches**: a foot next to *Course* means “a student takes **many** courses”. Whichever notation you use, the job is the same — name the entities, give each a **key attribute**, and connect them with relationships.",
            uk: "Домінують дві нотації. **Chen** (ромби й овали вище) виразна й добра для навчання. **Crow's-foot** — вилки та риски на конекторі — це те, що ви реально бачите в інструментах і більшості діаграм, бо вона компактно показує **cardinality**: риска означає *один*, розгалужена “лапка” — *багато*, а додаткове коло — *опціонально* (нуль). Читайте символ **біля тієї entity, якої він торкається**: лапка біля *Course* означає “студент бере **багато** courses”. Хай яка нотація — робота та сама: назвати entities, дати кожній **key attribute** і зʼєднати relationships.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The translation you are really doing: real-world language → ER term → relational artifact.',
            uk: 'Переклад, який ви насправді робите: мова реального світу → термін ER → реляційний артефакт.',
          },
          head: [
            { en: 'In the requirements', uk: 'У вимогах' },
            { en: 'ER term', uk: 'Термін ER' },
            { en: 'Becomes', uk: 'Стає' },
          ],
          rows: [
            [
              { en: 'A noun you keep many of (Student, Order)', uk: 'Іменник, яких багато (Student, Order)' },
              { en: 'Entity (entity set)', uk: 'Entity (entity set)' },
              { en: 'A table', uk: 'Таблиця' },
            ],
            [
              { en: 'A property of that noun (name, total)', uk: 'Властивість того іменника (name, total)' },
              { en: 'Attribute', uk: 'Attribute' },
              { en: 'A column', uk: 'Колонка' },
            ],
            [
              { en: 'The property that names each one', uk: 'Властивість, що називає кожен' },
              { en: 'Key attribute', uk: 'Key attribute' },
              { en: 'Primary key', uk: 'Primary key' },
            ],
            [
              { en: 'A verb linking two nouns (enrolls in)', uk: 'Дієслово, що звʼязує два іменники (enrolls in)' },
              { en: 'Relationship', uk: 'Relationship' },
              { en: 'A foreign key — or a junction table', uk: 'Foreign key — або junction table' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Entity or attribute? The promotion test', uk: 'Entity чи attribute? Тест на підвищення' },
          md: {
            en: "When you are unsure whether something is its own entity or just a column, ask: does it have **its own identity or attributes**, do you need **many of them per parent**, or does it have **its own lifecycle**? Any “yes” means promote it to an entity (its own table). *Address* with one line is an attribute; *Address* you keep several of, validate, and reuse is an entity. Getting this wrong early is the most common cause of a painful migration later.",
            uk: "Коли не певні, чи це окрема entity, чи лише колонка, спитайте: чи має воно **власну ідентичність або attributes**, чи треба **багато на одного батька**, чи має **власний життєвий цикл**? Будь-яке “так” означає підвищити до entity (власна таблиця). *Address* одним рядком — це attribute; *Address*, яких кілька, які валідуєте й перевикористовуєте, — це entity. Помилитися тут рано — найчастіша причина болісної міграції згодом.",
          },
        },
      ],
    },
    {
      id: 'relationships-and-cardinality',
      title: { en: 'Relationships & cardinality', uk: 'Relationships і cardinality' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **relationship** connects entities; its **cardinality** says how many of each side take part: **one-to-one (1:1)**, **one-to-many (1:N)**, or **many-to-many (M:N)**. This single choice decides the most concrete thing in your schema — **where the foreign key lives**, or whether you need a brand-new table. Flip the cardinality below and watch the resulting relational schema rebuild itself.",
            uk: "**Relationship** зʼєднує entities; його **cardinality** каже, скільки кожного боку бере участь: **one-to-one (1:1)**, **one-to-many (1:N)** чи **many-to-many (M:N)**. Цей один вибір вирішує найконкретнішу річ у схемі — **де живе foreign key**, або чи потрібна цілком нова таблиця. Перемкніть cardinality нижче й дивіться, як отримана реляційна схема перебудовується.",
          },
        },
        {
          kind: 'sim',
          sim: 'er-explorer',
        },
        {
          kind: 'prose',
          md: {
            en: "The mapping rules are mechanical once you see them. **1:N is the workhorse** and the easiest: the foreign key always goes on the **many** side (an order points to its one customer, never the reverse). **1:1** is just a 1:N where the many side is capped at one — put the FK on either side and add a `UNIQUE` constraint (or, if the two always live and die together, merge them into one table). **M:N cannot be expressed with a single foreign key at all**: you introduce a **junction table** (also called an associative, link, or bridge table) holding a foreign key to each side. Participation matters too: an **optional** side becomes a **nullable** FK, a **mandatory** side a `NOT NULL` one.",
            uk: "Правила відображення механічні, щойно ви їх побачите. **1:N — робоча конячка** і найлегша: foreign key завжди на боці **багато** (order вказує на свого одного customer, ніколи навпаки). **1:1** — це просто 1:N, де бік “багато” обмежено одним: поставте FK на будь-який бік і додайте `UNIQUE` (або, якщо двоє завжди живуть і вмирають разом, злийте їх в одну таблицю). **M:N взагалі не виразити одним foreign key**: ви додаєте **junction table** (також associative, link чи bridge table) з foreign key до кожного боку. Участь теж важить: **опціональний** бік стає **nullable** FK, **обовʼязковий** — `NOT NULL`.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The cardinality → schema rule, the most useful table in this module.',
            uk: 'Правило cardinality → схема — найкорисніша таблиця цього модуля.',
          },
          head: [
            { en: 'Cardinality', uk: 'Cardinality' },
            { en: 'Where the foreign key goes', uk: 'Де розміщується foreign key' },
            { en: 'Example', uk: 'Приклад' },
          ],
          rows: [
            [
              { en: '1 : 1', uk: '1 : 1' },
              { en: 'FK on either side, marked UNIQUE (or merge the tables)', uk: 'FK на будь-якому боці, позначений UNIQUE (або злийте таблиці)' },
              { en: 'Person — Passport', uk: 'Person — Passport' },
            ],
            [
              { en: '1 : N', uk: '1 : N' },
              { en: 'FK on the many side', uk: 'FK на боці «багато»' },
              { en: 'Customer — Order (order.customer_id)', uk: 'Customer — Order (order.customer_id)' },
            ],
            [
              { en: 'M : N', uk: 'M : N' },
              { en: 'A junction table with a FK to each side; composite PK', uk: 'Junction table з FK до кожного боку; складений PK' },
              { en: 'Student — Course (enrollment)', uk: 'Student — Course (enrollment)' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          note: {
            en: 'The M:N case in PostgreSQL: two ordinary tables plus a junction table whose primary key is the pair of foreign keys. grade and enrolled_at are attributes of the relationship itself.',
            uk: 'Випадок M:N у PostgreSQL: дві звичайні таблиці плюс junction table, чий primary key — пара foreign keys. grade і enrolled_at — attributes самого relationship.',
          },
          code: `CREATE TABLE student (student_id bigint PRIMARY KEY, name  text NOT NULL);
CREATE TABLE course  (course_id  bigint PRIMARY KEY, title text NOT NULL);

CREATE TABLE enrollment (              -- the junction (associative) table
  student_id  bigint REFERENCES student(student_id),
  course_id   bigint REFERENCES course(course_id),
  grade       text,                    -- a relationship attribute
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_id)  -- one enrollment per (student, course)
);`,
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'When the junction grows attributes, it is an entity', uk: 'Коли junction обростає attributes — це entity' },
          md: {
            en: "The moment a junction table needs its own columns — a *grade*, an *enrolled_at*, a *role* — it has stopped being plumbing and become a real thing: an **associative entity**. That is normal and good; *Enrollment* is as legitimate an entity as *Student*. A related senior instinct: many relationships you are tempted to model as 1:N are really M:N waiting to happen (one author per book… until the day a book has two). If the business could **ever** allow many, model the junction now — it is far cheaper than a later migration that splits a foreign key into a new table.",
            uk: "Щойно junction table потребує власних колонок — *grade*, *enrolled_at*, *role* — вона перестала бути сантехнікою і стала справжньою річчю: **associative entity**. Це нормально й добре; *Enrollment* — така ж повноцінна entity, як *Student*. Споріднений senior-інстинкт: багато relationships, які кортить змоделювати як 1:N, насправді є M:N, що чекає нагоди (один автор на книгу… доки в книги не стане двох). Якщо бізнес **колись** може дозволити “багато”, моделюйте junction зараз — це значно дешевше за пізнішу міграцію, що виносить foreign key у нову таблицю.",
          },
        },
      ],
    },
    {
      id: 'strong-weak-entities',
      title: { en: 'Strong vs weak entities', uk: 'Strong проти weak entities' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Most entities are **strong**: they have a key of their own (a *Student* has `student_id`). A **weak entity** cannot be identified by its own attributes alone — it only makes sense **in the context of an owner**, through an **identifying relationship**, and its primary key **includes the owner's key**. A classic example is an *order line*: “line 2” means nothing on its own; it is line 2 **of order 5051**, so its key is `(order_id, line_no)`. Weak entities are **existence-dependent** — delete the order and its lines should go too.",
            uk: "Більшість entities — **strong**: вони мають власний key (у *Student* є `student_id`). **Weak entity** не можна ідентифікувати лише за власними attributes — вона має сенс **лише в контексті власника**, через **identifying relationship**, і її primary key **включає key власника**. Класичний приклад — *order line*: “рядок 2” сам по собі нічого не значить; це рядок 2 **замовлення 5051**, тож його key — `(order_id, line_no)`. Weak entities **залежні від існування** — видаліть order, і його lines мають зникнути теж.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Strong entity', uk: 'Strong entity' },
          b: { en: 'Weak entity', uk: 'Weak entity' },
          rows: [
            [
              { en: 'Identified by', uk: 'Ідентифікується через' },
              { en: 'Its own key attribute (student_id)', uk: 'Власний key attribute (student_id)' },
              { en: "The owner's key + a discriminator (order_id, line_no)", uk: 'Key власника + дискримінатор (order_id, line_no)' },
            ],
            [
              { en: 'Can exist alone?', uk: 'Чи може існувати самостійно?' },
              { en: 'Yes', uk: 'Так' },
              { en: 'No — depends on an owner', uk: 'Ні — залежить від власника' },
            ],
            [
              { en: 'Primary key', uk: 'Primary key' },
              { en: 'Its own attribute(s)', uk: 'Власний(і) attribute(и)' },
              { en: "Includes the owner's foreign key", uk: 'Включає foreign key власника' },
            ],
            [
              { en: 'When the owner is deleted', uk: 'Коли власника видалено' },
              { en: 'Unaffected (just a referenced row)', uk: 'Не зачеплена (просто рядок, на який посилаються)' },
              { en: 'Usually deleted with it (ON DELETE CASCADE)', uk: 'Зазвичай видаляється разом (ON DELETE CASCADE)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Keying a weak entity', uk: 'Як ключувати weak entity' },
          md: {
            en: "Give a weak entity a **composite primary key** that begins with the owner's foreign key, then a local discriminator (`line_no`, `seq`). `ON DELETE CASCADE` on that foreign key usually fits, because the child genuinely cannot exist without the parent. Some teams instead give the child its own surrogate key for convenience — that is fine, but keep a `UNIQUE (owner_id, discriminator)` so the real-world rule is still enforced (more on keys in M8).",
            uk: "Дайте weak entity **складений primary key**, що починається з foreign key власника, далі локальний дискримінатор (`line_no`, `seq`). `ON DELETE CASCADE` на тому foreign key зазвичай пасує, бо дитина справді не може існувати без батька. Деякі команди натомість дають дитині власний surrogate key для зручності — це нормально, але лишіть `UNIQUE (owner_id, discriminator)`, щоб правило реального світу й далі діяло (про ключі — у M8).",
          },
        },
      ],
    },
    {
      id: 'design-lifecycle',
      title: { en: 'Conceptual → logical → physical', uk: 'Conceptual → logical → physical' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Schema design happens at **three levels**, each refining the last. The **conceptual** model is the ER diagram: entities and relationships, no engine in sight — this is what you draw on a whiteboard with stakeholders. The **logical** model turns that into **relations**: tables, columns, primary and foreign keys, normalized (M7) — still engine-agnostic, still no data types. The **physical** model is the real PostgreSQL: concrete types (M9), indexes (M13–M14), partitions, storage. The discipline is to **not skip levels**: resolving a missing relationship is free on a whiteboard and expensive once it is fifty tables and a production migration.",
            uk: "Дизайн схеми відбувається на **трьох рівнях**, кожен уточнює попередній. **Conceptual** модель — це ER-діаграма: entities та relationships, жодного движка — це те, що ви малюєте на дошці зі стейкхолдерами. **Logical** модель перетворює це на **relations**: таблиці, колонки, primary і foreign keys, нормалізовані (M7) — усе ще без привʼязки до движка, без типів даних. **Physical** модель — це реальний PostgreSQL: конкретні типи (M9), indexes (M13–M14), partitions, storage. Дисципліна — **не перестрибувати рівні**: усунути відсутній relationship безкоштовно на дошці й дорого, коли це вже пʼятдесят таблиць і продакшн-міграція.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Each level answers a different question for a different audience.',
            uk: 'Кожен рівень відповідає на інше питання для іншої аудиторії.',
          },
          head: [
            { en: 'Level', uk: 'Рівень' },
            { en: 'Answers', uk: 'Відповідає на' },
            { en: 'Artifact', uk: 'Артефакт' },
            { en: 'Engine-specific?', uk: 'Залежить від движка?' },
          ],
          rows: [
            [
              { en: 'Conceptual', uk: 'Conceptual' },
              { en: 'What things exist and how do they relate?', uk: 'Які речі існують і як вони повʼязані?' },
              { en: 'ER diagram', uk: 'ER-діаграма' },
              { en: 'No', uk: 'Ні' },
            ],
            [
              { en: 'Logical', uk: 'Logical' },
              { en: 'What tables, keys and FKs — normalized?', uk: 'Які таблиці, keys і FKs — нормалізовані?' },
              { en: 'Relational schema', uk: 'Реляційна схема' },
              { en: 'No', uk: 'Ні' },
            ],
            [
              { en: 'Physical', uk: 'Physical' },
              { en: 'Which types, indexes, partitions, storage?', uk: 'Які типи, indexes, partitions, storage?' },
              { en: 'PostgreSQL DDL', uk: 'PostgreSQL DDL' },
              { en: 'Yes — PostgreSQL', uk: 'Так — PostgreSQL' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The conceptual model is a communication tool', uk: 'Conceptual модель — це інструмент комунікації' },
          md: {
            en: "The ER diagram's biggest return is not the picture — it is the **conversation** it forces. Drawing the cardinality between *Customer* and *Order* in front of a domain expert surfaces the question “can an order have two customers?” before any code exists. Treat the conceptual model as a shared language, keep it in version control next to the schema, and update it when the model changes; a stale diagram is worse than none.",
            uk: "Найбільша віддача ER-діаграми — не картинка, а **розмова**, яку вона змушує провести. Намалювати cardinality між *Customer* і *Order* перед доменним експертом виносить питання “чи може order мати двох customers?” ще до будь-якого коду. Ставтеся до conceptual моделі як до спільної мови, тримайте її у version control поруч зі схемою й оновлюйте, коли модель змінюється; застаріла діаграма гірша за жодну.",
          },
        },
      ],
    },
    {
      id: 'modeling-smells',
      title: { en: 'Common modeling smells & fixes', uk: 'Поширені smells моделювання та виправлення' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A handful of mistakes account for most bad schemas. They share a shape: trying to **cram a relationship or a repeating thing into a single column** instead of giving it its own table. Learn to smell them — each has a standard fix, and most of those fixes are exactly what normalization (M7) formalizes.",
            uk: "Жменя помилок дає більшість поганих схем. У них спільна форма: спроба **втиснути relationship або повторюване в одну колонку** замість дати йому власну таблицю. Навчіться їх чути — кожна має стандартне виправлення, і більшість із них — саме те, що формалізує нормалізація (M7).",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The recurring smells and what to do instead.',
            uk: 'Повторювані smells і що робити натомість.',
          },
          head: [
            { en: 'Smell', uk: 'Smell' },
            { en: 'Why it hurts', uk: 'Чому це шкодить' },
            { en: 'Fix', uk: 'Виправлення' },
          ],
          rows: [
            [
              { en: 'Multi-valued column (tags text; phone1/phone2/phone3)', uk: 'Багатозначна колонка (tags text; phone1/phone2/phone3)' },
              { en: "Can't query, constrain, or index a single value", uk: 'Не запитати, не обмежити, не індексувати одне значення' },
              { en: 'A child table (1:N) — this is 1NF (M7)', uk: 'Дочірня таблиця (1:N) — це 1NF (M7)' },
            ],
            [
              { en: 'M:N stored as an array or comma list', uk: 'M:N збережене масивом чи списком через кому' },
              { en: 'No foreign keys, no joins, nowhere for link data', uk: 'Немає foreign keys, joins, місця для даних звʼязку' },
              { en: 'A junction table with a FK to each side', uk: 'Junction table з FK до кожного боку' },
            ],
            [
              { en: '"God" table, many columns blank per category', uk: '«God»-таблиця, багато колонок порожні залежно від категорії' },
              { en: 'Sparse, ambiguous, impossible to constrain', uk: 'Розріджена, неоднозначна, неможливо обмежити' },
              { en: 'Split into separate entities / subtype tables', uk: 'Розділити на окремі entities / subtype-таблиці' },
            ],
            [
              { en: 'Mutable natural key as PK (email as primary key)', uk: 'Змінний natural key як PK (email як primary key)' },
              { en: 'A change cascades everywhere; history breaks', uk: 'Зміна каскадить усюди; історія ламається' },
              { en: 'Surrogate PK + UNIQUE on the natural key (M8)', uk: 'Surrogate PK + UNIQUE на natural key (M8)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'The EAV temptation', uk: 'Спокуса EAV' },
          md: {
            en: "When requirements feel “too flexible to model”, teams reach for **EAV** — an *entity-attribute-value* table of `(entity_id, attribute_name, value text)` that can store anything. It looks adaptable and is almost always a trap: you throw away types, foreign keys, NOT NULL, and readable queries, reimplementing the database badly inside the database. Prefer real columns; when you truly need open-ended fields, use a single **JSONB** column (M9) with discipline — you keep one row per entity and the engine's JSON operators, instead of shredding every fact into its own row.",
            uk: "Коли вимоги здаються “занадто гнучкими, щоб моделювати”, команди хапаються за **EAV** — таблицю *entity-attribute-value* виду `(entity_id, attribute_name, value text)`, що може зберігати будь-що. Виглядає адаптивно й майже завжди є пасткою: ви викидаєте типи, foreign keys, NOT NULL і читабельні запити, погано переписуючи базу даних усередині бази даних. Краще реальні колонки; коли справді потрібні відкриті поля, візьміть одну колонку **JSONB** (M9) з дисципліною — ви тримаєте один рядок на entity й JSON-оператори движка, а не подрібнюєте кожен факт в окремий рядок.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Notice that every fix points the same way: give each real thing its own table, connect things with keys, and store each fact in exactly one place. That last phrase is the bridge to the next module — **normalization** is the formal theory of “one fact, one place”, and it turns the instincts here into rules you can apply mechanically.",
            uk: "Зверніть увагу: кожне виправлення вказує в один бік: дайте кожній реальній речі власну таблицю, звʼязуйте речі ключами й зберігайте кожен факт рівно в одному місці. Остання фраза — місток до наступного модуля: **нормалізація** — це формальна теорія “один факт, одне місце”, що перетворює тутешні інстинкти на правила, які застосовуєш механічно.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'ER modeling is the conceptual bridge: find entities (nouns), their attributes, and the relationships between them before any DDL (Chen, 1976).',
      uk: 'ER-моделювання — концептуальний місток: знайдіть entities (іменники), їхні attributes і relationships між ними до будь-якого DDL (Chen, 1976).',
    },
    {
      en: 'Cardinality decides the schema: 1:1 → a UNIQUE FK on one side; 1:N → FK on the many side; M:N → a junction table with a FK to each side.',
      uk: 'Cardinality вирішує схему: 1:1 → UNIQUE FK на одному боці; 1:N → FK на боці «багато»; M:N → junction table з FK до кожного боку.',
    },
    {
      en: 'A junction table that carries its own attributes (grade, enrolled_at) is itself an entity — an associative entity.',
      uk: 'Junction table, що несе власні attributes (grade, enrolled_at), сама є entity — associative entity.',
    },
    {
      en: "A weak entity can't be identified alone: its primary key includes the owner's key, via an identifying relationship, and it is existence-dependent.",
      uk: 'Weak entity не ідентифікувати самотужки: її primary key включає key власника через identifying relationship, і вона залежна від існування.',
    },
    {
      en: 'Design in layers — conceptual (entities/relationships) → logical (tables/keys) → physical (PostgreSQL types/indexes) — and resolve issues at the cheapest layer.',
      uk: 'Проєктуйте шарами — conceptual (entities/relationships) → logical (таблиці/keys) → physical (типи/indexes PostgreSQL) — і вирішуйте проблеми на найдешевшому шарі.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Confusing an attribute with an entity', uk: 'Плутати attribute з entity' },
      body: {
        en: 'Modeling something with its own identity or many-per-parent (addresses, phone numbers, line items) as a column forces multi-valued or numbered fields you cannot query or constrain. Promote it to its own table with a foreign key back to the parent.',
        uk: 'Моделювати щось із власною ідентичністю чи «багато на батька» (адреси, телефони, позиції) як колонку змушує до багатозначних чи пронумерованих полів, які не запитати й не обмежити. Підвищіть це до власної таблиці з foreign key назад на батька.',
      },
    },
    {
      title: { en: 'Faking many-to-many with an array or comma list', uk: 'Підробляти many-to-many масивом чи списком через кому' },
      body: {
        en: 'Storing an M:N relationship as a list inside one column throws away foreign keys, joins and any per-link attribute, and makes integrity unenforceable. When both sides are many, use a junction table — always.',
        uk: 'Зберігати M:N як список усередині однієї колонки — це викинути foreign keys, joins і будь-який attribute звʼязку та зробити цілісність незабезпечуваною. Коли обидва боки «багато», використовуйте junction table — завжди.',
      },
    },
    {
      title: { en: 'Jumping to physical tables before the model is right', uk: 'Стрибати до фізичних таблиць до правильної моделі' },
      body: {
        en: 'Writing CREATE TABLE before the conceptual model is settled bakes in missing or wrong relationships that are cheap to fix on a whiteboard and very expensive to migrate in production. Draw the ER model first; let it force the awkward questions early.',
        uk: 'Писати CREATE TABLE до усталеної conceptual моделі — це закласти відсутні чи хибні relationships, дешеві для виправлення на дошці й дуже дорогі для міграції в проді. Спершу намалюйте ER-модель; хай вона змусить поставити незручні питання рано.',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'How do you translate a many-to-many relationship into tables?',
        uk: 'Як перетворити many-to-many relationship на таблиці?',
      },
      a: {
        en: 'You cannot hold M:N with a single foreign key, so you introduce a junction (associative) table that references both sides. Each side keeps its own table and primary key; the junction holds a foreign key to each, and its primary key is usually the composite of those two foreign keys (one link per pair). Any attribute of the relationship itself — a grade, an enrolled_at, a role — lives on the junction table, which makes it an associative entity. Conceptually it is two one-to-many relationships meeting in the middle.',
        uk: 'M:N не втримати одним foreign key, тож ви додаєте junction (associative) table, що посилається на обидва боки. Кожен бік лишає власну таблицю й primary key; junction тримає foreign key до кожного, а її primary key зазвичай — складений із цих двох foreign keys (один звʼязок на пару). Будь-який attribute самого relationship — grade, enrolled_at, role — живе на junction table, що робить її associative entity. Концептуально це два one-to-many relationships, що зустрічаються посередині.',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'How do you decide whether something is an entity or just an attribute?',
        uk: 'Як вирішити, чи щось є entity, чи лише attribute?',
      },
      a: {
        en: "Ask whether it has its own identity or attributes, whether you need many of them per parent, and whether it has its own lifecycle. Any yes means it deserves its own table. A single address line is an attribute of a customer; addresses you keep several of, validate, and reuse across customers are an entity with their own table and a relationship back. The cost of getting this wrong is asymmetric — promoting an attribute later means a data migration — so when in doubt, lean toward making it an entity.",
        uk: 'Спитайте, чи має воно власну ідентичність або attributes, чи треба багато на батька і чи має власний життєвий цикл. Будь-яке «так» означає власну таблицю. Один рядок адреси — attribute клієнта; адреси, яких кілька, які валідуєте й перевикористовуєте між клієнтами, — entity з власною таблицею та relationship назад. Ціна помилки асиметрична — підвищити attribute згодом означає міграцію даних — тож у сумнівах схиляйтеся до entity.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'What is a weak entity, and how do you key one?',
        uk: 'Що таке weak entity і як її ключувати?',
      },
      a: {
        en: "A weak entity cannot be identified by its own attributes; it exists only relative to an owner through an identifying relationship. You key it with a composite primary key that includes the owner's foreign key plus a local discriminator — an order line is (order_id, line_no), not a standalone line number. Because it is existence-dependent, ON DELETE CASCADE on that foreign key usually matches the real-world rule. If you give the child a surrogate key for convenience, keep a UNIQUE on (owner_id, discriminator) so the underlying constraint is still enforced.",
        uk: 'Weak entity не ідентифікувати за власними attributes; вона існує лише відносно власника через identifying relationship. Ключуєте складеним primary key, що включає foreign key власника плюс локальний дискримінатор — order line це (order_id, line_no), а не самостійний номер рядка. Оскільки вона залежна від існування, ON DELETE CASCADE на тому foreign key зазвичай відповідає правилу реального світу. Якщо дасте дитині surrogate key для зручності, лишіть UNIQUE на (owner_id, discriminator), щоб базовий constraint і далі діяв.',
      },
    },
  ],
  seeAlso: ['m4-relational-model', 'm7-normalization', 'm8-keys-constraints', 'm9-data-types', 'm5-anatomy-of-a-query'],
  sources: [
    {
      title: 'Peter Chen — The Entity-Relationship Model: Toward a Unified View of Data (ACM TODS, 1976)',
      url: 'https://dl.acm.org/doi/10.1145/320434.320440',
    },
    {
      title: 'PostgreSQL 18 Documentation — 3.3. Foreign Keys',
      url: 'https://www.postgresql.org/docs/current/tutorial-fk.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — Constraints (primary, foreign, unique)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
    },
    {
      title: 'Entity–relationship model — notation & crow’s-foot cardinality (overview)',
      url: 'https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model',
    },
    {
      title: 'E. F. Codd — A Relational Model of Data for Large Shared Data Banks (CACM, 1970)',
      url: 'https://dl.acm.org/doi/10.1145/362384.362685',
    },
  ],
};
