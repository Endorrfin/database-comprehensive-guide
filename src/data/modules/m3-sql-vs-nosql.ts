import type { Module } from '../types';

/*
 * M3 · SQL vs NoSQL — the real trade-offs (S2). Covers requirement-2: strengths &
 * weaknesses per family (the centerpiece table). Authored EN first, UA second.
 * Facts web-verified 2026-06-23 (see `sources`): the convergence is real — PostgreSQL
 * added JSON (9.2) and JSONB (9.4) and meets/exceeds the SQL:2023 native JSON type;
 * MongoDB added multi-document ACID transactions in 4.0 (2018), extended to sharded
 * clusters in 4.2 (2019); distributed SQL delivers relational semantics at scale.
 */
export const m3: Module = {
  id: 'm3-sql-vs-nosql',
  num: 3,
  section: 's1-foundations',
  order: 3,
  level: 'middle',
  title: { en: 'SQL vs NoSQL — the real trade-offs', uk: 'SQL проти NoSQL — справжні компроміси' },
  tagline: {
    en: "What 'NoSQL' actually means, and the strengths & weaknesses of each family.",
    uk: 'Що насправді означає «NoSQL», і сильні та слабкі сторони кожної родини.',
  },
  readMins: 11,
  mentalModel: {
    en: "'NoSQL' isn't 'no SQL' — it's trading joins and ACID for a specific shape and scale.",
    uk: '«NoSQL» — це не «без SQL», а обмін joins та ACID на конкретну форму й масштаб.',
  },
  topics: [
    {
      id: 'what-nosql-means',
      title: { en: "What 'NoSQL' actually means (and doesn't)", uk: 'Що насправді означає «NoSQL» (і ні)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The name misleads everyone once. **"NoSQL" does not mean "no SQL"** — it means **non-relational**, and the community long ago re-read it as **"Not Only SQL"**. It is an umbrella over four very different models — document, key-value, wide-column, graph — that share only one thing: they are not the relational table-and-join model. Many of them even speak a SQL-like query language now, so the label describes the **data model and scaling trade-offs**, not the absence of a query syntax.',
            uk: 'Назва спершу збиває з пантелику всіх. **«NoSQL» не означає «без SQL»** — воно означає **non-relational**, і спільнота давно перечитала його як **«Not Only SQL»**. Це парасоля над чотирма дуже різними моделями — document, key-value, wide-column, graph — які поєднує лише одне: вони не реляційна модель table-and-join. Багато з них тепер навіть мають SQL-подібну мову запитів, тож ярлик описує **модель даних і компроміси масштабування**, а не відсутність синтаксису запитів.',
          },
        },
        {
          kind: 'figure',
          fig: 'sql-nosql-quadrant',
          caption: {
            en: 'The design space. Up = joins, ad-hoc queries and strong consistency (relational strengths); right = horizontal scale and flexible schema (classic NoSQL strengths). Distributed SQL sits in the top-right corner that wants both.',
            uk: 'Простір дизайну. Вгору = joins, ad-hoc запити й сувора consistency (сильні сторони relational); праворуч = горизонтальний scale і гнучка schema (класичні сильні сторони NoSQL). Distributed SQL — у верхньому правому куті, що хоче обидва.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Read the picture as a set of **trade-offs**, not a ranking. Moving right buys horizontal scale and schema flexibility but usually gives up joins and cross-entity transactions. Moving up buys integrity, ad-hoc querying and ACID but makes horizontal write-scaling harder. Nothing sits in the perfect corner for free — and the rest of this module is about what each choice actually costs.',
            uk: 'Читайте картину як набір **компромісів**, а не рейтинг. Рух праворуч купує горизонтальний scale і гнучкість schema, але зазвичай віддає joins і крос-сутнісні транзакції. Рух угору купує integrity, ad-hoc запити й ACID, але ускладнює горизонтальне масштабування записів. Ніхто не сидить в ідеальному куті безкоштовно — і решта модуля про те, чого насправді коштує кожен вибір.',
          },
        },
      ],
    },
    {
      id: 'relational-strengths',
      title: { en: 'The relational strengths (and their cost)', uk: 'Сильні сторони relational (та їхня ціна)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Relational databases win on **data integrity and query power**. Constraints and foreign keys let the engine *refuse* bad data; **joins** combine tables at query time so you store each fact once; **ad-hoc SQL** answers questions you never anticipated without reshaping storage; and **ACID transactions** make multi-row changes all-or-nothing. On top of that sit decades of optimizer engineering and tooling. For the typical application — users, orders, payments, with relationships and rules — this is exactly the right shape.",
            uk: 'Реляційні бази перемагають у **цілісності даних і потужності запитів**. Constraints і foreign keys дають движку *відмовляти* поганим даним; **joins** поєднують tables під час запиту, тож кожен факт зберігається раз; **ad-hoc SQL** відповідає на питання, яких ви не передбачали, без переформатування storage; а **ACID-транзакції** роблять зміни багатьох рядків усе-або-нічого. Над цим — десятиліття інженерії optimizer і tooling. Для типового застосунку — users, orders, payments зі звʼязками й правилами — це саме правильна форма.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'The costs are the mirror image. The **schema is comparatively rigid**: changing structure means a migration (though modern Postgres makes most migrations cheap). And **scaling writes horizontally is harder** — a single primary handles writes, and going beyond it means read replicas, sharding, or a distributed-SQL engine. These costs are real but routinely overstated: a well-indexed PostgreSQL on one large node serves a great many real-world applications comfortably.',
            uk: 'Витрати — дзеркальні. **Schema відносно жорстка**: зміна структури означає migration (хоч сучасний Postgres робить більшість migrations дешевими). І **горизонтально масштабувати записи важче** — один primary тримає записи, а вийти за нього означає read replicas, sharding чи distributed-SQL движок. Ці витрати реальні, але регулярно перебільшені: добре проіндексований PostgreSQL на одному великому вузлі комфортно обслуговує дуже багато реальних застосунків.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Default to relational, and know why you left', uk: 'За замовчуванням relational — і знайте, чому пішли' },
          md: {
            en: 'A senior heuristic: start relational and require a written reason to choose otherwise. The reason should name a concrete requirement the relational model cannot meet cheaply — not "it felt old". Most systems never need to leave; the ones that do leave for one specific, measurable pressure.',
            uk: 'Senior-евристика: починайте з relational і вимагайте письмову причину обрати інше. Причина має називати конкретну вимогу, яку реляційна модель не покриває дешево — а не «здавалось старим». Більшість систем ніколи не йдуть; ті, що йдуть, ідуть під один конкретний, вимірюваний тиск.',
          },
        },
      ],
    },
    {
      id: 'nosql-strengths',
      title: { en: 'The NoSQL strengths (and their cost)', uk: 'Сильні сторони NoSQL (та їхня ціна)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'NoSQL families win by **specializing**. A **flexible schema** lets each record carry its own shape, so a fast-evolving product is not blocked on migrations. **Horizontal scale** is often built in — data is partitioned across many nodes by design (wide-column, many document and key-value stores). And the model can be **tailored to one access pattern**: a document store reads an entire nested object in one hit; a key-value store returns a value in microseconds; a graph store walks relationships that would be painful self-joins in SQL.',
            uk: 'NoSQL-родини перемагають через **спеціалізацію**. **Гнучка schema** дає кожному запису власну форму, тож продукт, що швидко еволюціонує, не блокується на migrations. **Горизонтальний scale** часто вбудований — дані партиціонуються по багатьох вузлах за дизайном (wide-column, багато document і key-value сховищ). А модель можна **підлаштувати під один access pattern**: document store читає весь вкладений обʼєкт за один раз; key-value store повертає значення за мікросекунди; graph store обходить звʼязки, що були б болісними self-joins у SQL.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'The cost is the integrity and flexibility you gave up. With **no joins**, you **denormalize** — duplicate data across documents — and become responsible for keeping the copies consistent in application code. Cross-entity **transactions** are limited or absent in some stores, and several default to **eventual consistency**, where a read can briefly return stale data. "Schema-less" really means **schema-on-read**: the structure still exists, you just enforce it in your code instead of the database. Flexibility up front, discipline forever after.',
            uk: 'Ціна — integrity і гнучкість, якими ви пожертвували. Без **joins** ви **denormalize** — дублюєте дані між documents — і стаєте відповідальними за узгодженість копій у коді застосунку. Крос-сутнісні **transactions** обмежені або відсутні в деяких сховищах, а кілька за замовчуванням мають **eventual consistency**, де читання може коротко повернути застарілі дані. «Schema-less» насправді означає **schema-on-read**: структура все ще існує, ви просто забезпечуєте її у своєму коді, а не в базі. Гнучкість спершу — дисципліна назавжди потому.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Relational (SQL)', uk: 'Relational (SQL)' },
          b: { en: 'Non-relational (NoSQL)', uk: 'Non-relational (NoSQL)' },
          rows: [
            [
              { en: 'Schema', uk: 'Schema' },
              { en: 'Defined up front, enforced by the DB', uk: 'Визначена наперед, забезпечена БД' },
              { en: 'Flexible, enforced on read (in your code)', uk: 'Гнучка, забезпечена на read (у коді)' },
            ],
            [
              { en: 'Relationships', uk: 'Звʼязки' },
              { en: 'Joins at query time', uk: 'Joins під час запиту' },
              { en: 'Embed or denormalize; app-side joins', uk: 'Embed чи denormalize; joins на боці застосунку' },
            ],
            [
              { en: 'Transactions', uk: 'Transactions' },
              { en: 'ACID across many rows/tables', uk: 'ACID по багатьох рядках/tables' },
              { en: 'Often single-key; multi-doc varies', uk: 'Часто single-key; multi-doc по-різному' },
            ],
            [
              { en: 'Scaling writes', uk: 'Масштабування записів' },
              { en: 'Vertical first; sharding is work', uk: 'Спершу вертикально; sharding — це робота' },
              { en: 'Horizontal, often built in', uk: 'Горизонтально, часто вбудовано' },
            ],
            [
              { en: 'Query flexibility', uk: 'Гнучкість запитів' },
              { en: 'Ad-hoc SQL, any angle', uk: 'Ad-hoc SQL, під будь-яким кутом' },
              { en: 'Best along the chosen access key', uk: 'Найкраще вздовж обраного access key' },
            ],
            [
              { en: 'Best for', uk: 'Найкраще для' },
              { en: 'Related data with rules & integrity', uk: 'Повʼязані дані з правилами й integrity' },
              { en: 'One shape at scale, evolving data', uk: 'Одна форма на масштабі, змінні дані' },
            ],
          ],
        },
      ],
    },
    {
      id: 'the-convergence',
      title: { en: 'The convergence — the lines blur', uk: 'Конвергенція — межі розмиваються' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The cleanest "SQL vs NoSQL" debates are a decade out of date, because both sides moved toward the middle. **Relational engines absorbed semi-structured data:** PostgreSQL added JSON in 9.2 and the binary, indexable **JSONB** in 9.4, and now meets or exceeds the SQL:2023 native JSON type (including `JSON_TABLE`) — so you can store and query documents *inside* a relational database with real transactions around them.',
            uk: 'Найчистіші суперечки «SQL vs NoSQL» застаріли на десятиліття, бо обидві сторони рушили до середини. **Реляційні движки ввібрали напівструктуровані дані:** PostgreSQL додав JSON у 9.2 і бінарний, індексований **JSONB** у 9.4, і тепер відповідає чи перевершує тип native JSON зі SQL:2023 (включно з `JSON_TABLE`) — тож можна зберігати й запитувати documents *усередині* реляційної бази зі справжніми транзакціями навколо них.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: '**NoSQL engines absorbed transactions and SQL:** MongoDB added multi-document ACID transactions in 4.0 (2018) and extended them to sharded clusters in 4.2 (2019); many NoSQL stores now offer a SQL-like query layer. And **distributed SQL** (CockroachDB, Spanner, TiDB, YugabyteDB) delivers relational semantics *and* horizontal scale — the top-right corner of the diagram. The practical takeaway: stop treating it as a war. Ask about **data-model fit, consistency model, query flexibility, and operational scale** — the label "SQL or NoSQL" answers none of those by itself.',
            uk: '**NoSQL-движки ввібрали транзакції та SQL:** MongoDB додав multi-document ACID транзакції у 4.0 (2018) і розширив їх на sharded clusters у 4.2 (2019); багато NoSQL-сховищ тепер мають SQL-подібний шар запитів. А **distributed SQL** (CockroachDB, Spanner, TiDB, YugabyteDB) дає реляційну семантику *і* горизонтальний scale — верхній правий кут діаграми. Практичний висновок: припиніть вважати це війною. Питайте про **відповідність моделі даних, consistency model, гнучкість запитів і операційний масштаб** — ярлик «SQL чи NoSQL» сам не відповідає на жодне з них.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Polyglot persistence — on purpose', uk: 'Polyglot persistence — навмисно' },
          md: {
            en: 'Real systems often use several stores at once: PostgreSQL as the source of truth, Redis for caching, a vector store for semantic search, a columnar warehouse for analytics. That is **polyglot persistence**, and it is a legitimate design — but each store is another thing to operate, secure, back up and keep in sync. Add one when a requirement earns it, not by default.',
            uk: 'Реальні системи часто використовують кілька сховищ одразу: PostgreSQL як джерело істини, Redis для кешу, vector store для семантичного пошуку, columnar warehouse для аналітики. Це **polyglot persistence**, і це легітимний дизайн — але кожне сховище це ще одна річ для експлуатації, безпеки, backups і синхронізації. Додавайте, коли вимога це заслужила, а не за замовчуванням.',
          },
        },
      ],
    },
    {
      id: 'strengths-weaknesses-by-family',
      title: { en: 'Strengths & weaknesses, family by family', uk: 'Сильні та слабкі сторони, родина за родиною' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The same trade-off plays out differently in each family. This table is the one to keep — read each row as "what you gain / what you give up / when to reach for it".',
            uk: 'Той самий компроміс грає по-різному в кожній родині. Цю таблицю варто зберегти — читайте кожен рядок як «що отримуєте / чим жертвуєте / коли брати».',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Per-family strengths and weaknesses. Each family gets its own deep-dive module later (M25–M31).',
            uk: 'Сильні та слабкі сторони за родинами. Кожна отримає власний поглиблений модуль далі (M25–M31).',
          },
          head: [
            { en: 'Family', uk: 'Родина' },
            { en: 'Strengths', uk: 'Сильні сторони' },
            { en: 'Weaknesses', uk: 'Слабкі сторони' },
            { en: 'Reach for it when', uk: 'Брати коли' },
          ],
          rows: [
            [
              { en: 'Relational', uk: 'Relational' },
              { en: 'Joins, ACID, integrity, ad-hoc SQL', uk: 'Joins, ACID, integrity, ad-hoc SQL' },
              { en: 'Rigid-ish schema; horizontal writes are work', uk: 'Жорсткіша schema; горизонтальні записи — робота' },
              { en: 'Related data with rules — the default', uk: 'Повʼязані дані з правилами — default' },
            ],
            [
              { en: 'Document', uk: 'Document' },
              { en: 'Flexible schema; one object, one read', uk: 'Гнучка schema; один обʼєкт — одне read' },
              { en: 'App-side joins; consistency is on you', uk: 'Joins на боці застосунку; consistency на вас' },
              { en: 'Self-contained, evolving documents', uk: 'Самодостатні, змінні documents' },
            ],
            [
              { en: 'Key-value', uk: 'Key-value' },
              { en: 'Microsecond lookups; dead simple', uk: 'Мікросекундний пошук; гранично просто' },
              { en: 'Only by key; limited durability/queries', uk: 'Лише за ключем; обмежені durability/запити' },
              { en: 'Caching, sessions, counters, queues', uk: 'Кеш, сесії, лічильники, черги' },
            ],
            [
              { en: 'Wide-column', uk: 'Wide-column' },
              { en: 'Linear horizontal write scale', uk: 'Лінійний горизонтальний write scale' },
              { en: 'Query-first modeling; no joins', uk: 'Моделювання query-first; без joins' },
              { en: 'Write-heavy, huge, known queries', uk: 'Write-heavy, величезні, відомі запити' },
            ],
            [
              { en: 'Graph', uk: 'Graph' },
              { en: 'Fast deep traversal of relationships', uk: 'Швидкий глибокий обхід звʼязків' },
              { en: 'Niche ops; not for bulk scans', uk: 'Нішева експлуатація; не для масових scans' },
              { en: 'Fraud, social, recommendations', uk: 'Шахрайство, соцмережі, рекомендації' },
            ],
            [
              { en: 'Vector', uk: 'Vector' },
              { en: 'Semantic similarity / ANN search', uk: 'Семантична схожість / ANN-пошук' },
              { en: 'Approximate; not a primary store', uk: 'Наближено; не основне сховище' },
              { en: 'RAG, embeddings, recommendations', uk: 'RAG, embeddings, рекомендації' },
            ],
            [
              { en: 'Time-series', uk: 'Time-series' },
              { en: 'Append + time-range queries, retention', uk: 'Append + запити за time-range, retention' },
              { en: 'Narrow model; not general-purpose', uk: 'Вузька модель; не універсальна' },
              { en: 'Metrics, IoT, events over time', uk: 'Метрики, IoT, події в часі' },
            ],
            [
              { en: 'Analytics / columnar', uk: 'Analytics / columnar' },
              { en: 'Huge scans & aggregations, fast', uk: 'Величезні scans та агрегації, швидко' },
              { en: 'Poor at single-row OLTP writes', uk: 'Погано для single-row OLTP записів' },
              { en: 'Dashboards, reporting, OLAP', uk: 'Дашборди, звітність, OLAP' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: 'There is no "best database", only "best for this access pattern". The relational model is the right default because it is general; everything else trades generality for an edge at one thing. Knowing exactly what each family gives up is what lets you choose deliberately — which is the whole job of the decision framework in M35.',
            uk: 'Немає «найкращої бази», є лише «найкраща для цього access pattern». Реляційна модель — правильний default, бо вона універсальна; усе інше міняє універсальність на перевагу в одному. Точне знання, чим жертвує кожна родина, і дозволяє обирати свідомо — а це й є вся робота фреймворку рішення в M35.',
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: '"NoSQL" means non-relational ("Not Only SQL"), not "no SQL" — many NoSQL engines now offer SQL-like queries.',
      uk: '«NoSQL» означає non-relational («Not Only SQL»), не «без SQL» — багато NoSQL-движків тепер мають SQL-подібні запити.',
    },
    {
      en: 'Relational trades some schema flexibility and easy horizontal write-scaling for integrity, joins and ACID.',
      uk: 'Relational міняє частину гнучкості schema й легкого горизонтального write-scaling на integrity, joins і ACID.',
    },
    {
      en: 'NoSQL trades joins and cross-entity integrity for flexible schema, horizontal scale, or a tailored access pattern.',
      uk: 'NoSQL міняє joins і крос-сутнісну integrity на гнучку schema, горизонтальний scale чи підлаштований access pattern.',
    },
    {
      en: 'The line is blurring: SQL added JSON/JSONB, NoSQL added transactions, and distributed SQL offers both.',
      uk: 'Межа розмивається: SQL додав JSON/JSONB, NoSQL додав транзакції, а distributed SQL дає обидва.',
    },
    {
      en: 'Choose by access pattern and consistency need; polyglot persistence is powerful but multiplies operational cost.',
      uk: 'Обирайте за access pattern і потребою в consistency; polyglot persistence потужний, але множить операційні витрати.',
    },
  ],
  pitfalls: [
    {
      title: { en: '"NoSQL scales, SQL doesn\'t"', uk: '«NoSQL масштабується, SQL — ні»' },
      body: {
        en: 'A well-indexed PostgreSQL on a large node serves enormous workloads, and distributed SQL scales relationally. Most NoSQL stores cap query flexibility, not the other way round — they scale a specific access pattern, not every query.',
        uk: 'Добре проіндексований PostgreSQL на великому вузлі обслуговує величезні навантаження, а distributed SQL масштабується реляційно. Більшість NoSQL-сховищ обмежують гнучкість запитів, а не навпаки — вони масштабують конкретний access pattern, а не кожен запит.',
      },
    },
    {
      title: { en: 'Going schemaless to "move fast"', uk: 'Йти schemaless, щоб «рухатись швидко»' },
      body: {
        en: 'Schema-less is schema-on-read: the structure still exists, now scattered through application code. Teams often rebuild a relational model badly inside documents. If your data is relational, a relational database is the fast path.',
        uk: 'Schema-less — це schema-on-read: структура все ще існує, тепер розкидана по коду застосунку. Команди часто погано відтворюють реляційну модель усередині documents. Якщо ваші дані реляційні, реляційна база — і є швидкий шлях.',
      },
    },
    {
      title: { en: 'Adopting eventual consistency unintentionally', uk: 'Випадково взяти eventual consistency' },
      body: {
        en: 'If a store returns stale reads after a write, you must design for it — read-your-writes, conflict handling, idempotency. Teams that assume strong consistency on an eventually-consistent store ship subtle, hard-to-reproduce bugs (see M23).',
        uk: 'Якщо сховище повертає застарілі читання після запису, треба під це проєктувати — read-your-writes, обробка конфліктів, idempotency. Команди, що припускають сувору consistency на eventually-consistent сховищі, випускають тонкі, важковідтворювані баги (див. M23).',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: { en: 'What does "NoSQL" really mean?', uk: 'Що насправді означає «NoSQL»?' },
      a: {
        en: 'Non-relational data models — document, key-value, wide-column and graph — often read as "Not Only SQL". It describes the data model and the scaling/consistency trade-offs, not the absence of a query language; many NoSQL engines now offer SQL-like querying. The relational model is the thing they are defined against.',
        uk: 'Non-relational моделі даних — document, key-value, wide-column і graph — часто читають як «Not Only SQL». Воно описує модель даних і компроміси scaling/consistency, а не відсутність мови запитів; багато NoSQL-движків тепер мають SQL-подібні запити. Реляційна модель — те, відносно чого вони визначені.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'When would you choose a document database over PostgreSQL?',
        uk: 'Коли б ви обрали document database замість PostgreSQL?',
      },
      a: {
        en: 'When the data is naturally a self-contained document that is read and written as a unit, the schema evolves quickly, cross-entity joins are rare, and you value horizontal scale — and you can accept enforcing integrity in application code. The warning sign that you chose wrong is re-implementing joins and multi-document transactions by hand: that means the data was relational and a relational engine (possibly with JSONB) would have been simpler.',
        uk: 'Коли дані природно є самодостатнім document, який читають і пишуть як одне ціле, schema швидко еволюціонує, крос-сутнісні joins рідкісні, і ви цінуєте горизонтальний scale — і згодні забезпечувати integrity в коді застосунку. Ознака хибного вибору — ручна реалізація joins і multi-document транзакцій: значить, дані були реляційними і реляційний движок (можливо з JSONB) був би простішим.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'Is the SQL-vs-NoSQL distinction still meaningful in 2026?',
        uk: 'Чи актуальне розрізнення SQL-vs-NoSQL у 2026?',
      },
      a: {
        en: 'Less as a binary, more as a spectrum. Relational engines absorbed semi-structured data (PostgreSQL JSONB, the SQL:2023 JSON type), NoSQL engines absorbed transactions (MongoDB multi-document ACID since 4.0/4.2) and SQL-like layers, and distributed SQL delivers relational semantics at horizontal scale. The useful questions are about data-model fit, consistency model, query flexibility and operational scale — the label answers none of them, so I evaluate the workload, not the category.',
        uk: 'Менше як бінарність, більше як спектр. Реляційні движки ввібрали напівструктуровані дані (PostgreSQL JSONB, тип JSON зі SQL:2023), NoSQL-движки ввібрали транзакції (MongoDB multi-document ACID з 4.0/4.2) і SQL-подібні шари, а distributed SQL дає реляційну семантику на горизонтальному масштабі. Корисні питання — про відповідність моделі даних, consistency model, гнучкість запитів і операційний масштаб; ярлик не відповідає на жодне, тож я оцінюю навантаження, а не категорію.',
      },
    },
  ],
  seeAlso: ['m1-what-is-a-database', 'm2-landscape', 'm4-relational-model', 'm25-document', 'm30-distributed-sql'],
  sources: [
    {
      title: 'PostgreSQL Documentation — JSON Types (JSONB, SQL/JSON)',
      url: 'https://www.postgresql.org/docs/current/datatype-json.html',
    },
    {
      title: 'MongoDB — Multi-Document ACID Transactions (4.0 GA)',
      url: 'https://www.mongodb.com/company/blog/product-release-announcements/mongodb-multi-document-acid-transactions-general-availability',
    },
    {
      title: 'MongoDB Documentation — Transactions (replica sets & sharded clusters)',
      url: 'https://www.mongodb.com/docs/manual/core/transactions/',
    },
    {
      title: 'DB-Engines Ranking — relational vs NoSQL popularity over time',
      url: 'https://db-engines.com/en/ranking',
    },
    {
      title: 'Martin Fowler — Polyglot Persistence',
      url: 'https://martinfowler.com/bliki/PolyglotPersistence.html',
    },
  ],
};
