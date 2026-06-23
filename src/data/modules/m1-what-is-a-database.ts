import type { Module } from '../types';

/*
 * M1 · What a database is & why — the beginner on-ramp (S2).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): the DBMS-vs-files guarantees, the
 * OLTP/OLAP split (IBM, AWS), PostgreSQL's durability via the WAL, and that Redis
 * persistence is opt-in (a cache is not a system of record by default).
 */
export const m1: Module = {
  id: 'm1-what-is-a-database',
  num: 1,
  section: 's1-foundations',
  order: 1,
  level: 'beginner',
  title: { en: 'What a database is & why', uk: 'Що таке база даних і навіщо' },
  tagline: {
    en: 'DBMS vs files, OLTP vs OLAP, and the cost of getting the model wrong.',
    uk: 'DBMS проти файлів, OLTP проти OLAP, і ціна неправильної моделі.',
  },
  readMins: 8,
  mentalModel: {
    en: "A DBMS is a contract over your data — concurrency, durability, integrity and querying you don't have to build yourself.",
    uk: 'DBMS — це контракт над вашими даними: concurrency, durability, цілісність і запити, які не треба будувати самому.',
  },
  topics: [
    {
      id: 'from-files-to-a-dbms',
      title: { en: 'From files to a DBMS', uk: 'Від файлів до DBMS' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "You can store data in a plain file — a CSV, a folder of JSON, a spreadsheet. It works until a second user shows up, the process crashes mid-write, or someone asks a question the file's layout never anticipated. Then you discover everything a database quietly does for you. A **database** is the organized data itself; a **DBMS** (Database Management System) is the software — PostgreSQL, MySQL, MongoDB — that stores it, protects it, and answers questions about it.",
            uk: 'Дані можна зберігати у звичайному файлі — CSV, теці з JSON, таблиці. Це працює, доки не зʼявиться другий користувач, доки процес не впаде посеред запису або доки хтось не поставить питання, якого формат файлу не передбачав. Тоді ви відкриваєте все, що база даних тихо робить за вас. **База даних** — це самі організовані дані; **DBMS** (Database Management System) — це софт (PostgreSQL, MySQL, MongoDB), що їх зберігає, захищає і відповідає на питання про них.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: 'Four problems separate a real DBMS from a file. **Concurrency:** many clients reading and writing at once without corrupting each other. **Durability:** once the system says "saved", the data survives a crash or power loss. **Integrity:** rules the data must obey (a unique email, an order that must reference a real customer). **Querying:** a language to ask for exactly the rows you want, fast, without scanning everything. Files give you none of these; the DBMS gives you all four.',
            uk: 'Чотири проблеми відділяють справжню DBMS від файлу. **Concurrency:** багато клієнтів читають і пишуть одночасно, не псуючи дані одне одному. **Durability:** щойно система сказала «збережено», дані переживуть крах чи втрату живлення. **Integrity:** правила, яких дані мусять дотримуватись (унікальний email, замовлення, що має посилатися на реального клієнта). **Querying:** мова, щоб попросити саме ті рядки, які потрібні, швидко, без сканування всього. Файли не дають нічого з цього; DBMS дає всі чотири.',
          },
        },
        {
          kind: 'figure',
          fig: 'files-vs-dbms',
          caption: {
            en: 'Left: every app pokes at shared files itself — racing writers, half-written rows, no rules. Right: every app goes through one DBMS that enforces concurrency, durability, integrity and querying.',
            uk: 'Ліворуч: кожен застосунок сам лізе у спільні файли — конкурентні записи, недописані рядки, без правил. Праворуч: кожен застосунок іде через одну DBMS, що забезпечує concurrency, durability, integrity і querying.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'The DBMS is a contract you stop re-writing',
            uk: 'DBMS — це контракт, який ви більше не переписуєте',
          },
          md: {
            en: 'Every guarantee a DBMS makes is code you would otherwise write — and get wrong — yourself: file locks, crash recovery, validation, an index, a query parser. Choosing a database is choosing not to hand-build concurrency control and durability for the hundredth time.',
            uk: 'Кожна гарантія DBMS — це код, який інакше ви писали б (і помилялись) самі: file locks, відновлення після краху, валідація, index, парсер запитів. Обрати базу даних — це обрати не будувати вручально concurrency control і durability усоте.',
          },
        },
      ],
    },
    {
      id: 'oltp-vs-olap',
      title: { en: 'OLTP vs OLAP — two workload shapes', uk: 'OLTP проти OLAP — дві форми навантаження' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Almost every database decision traces back to one question: *what shape is your workload?* Two archetypes anchor the spectrum. **OLTP** (Online Transaction Processing) is the live application: many short, concurrent reads and writes against the **current state** — place an order, update a profile — answered in milliseconds. **OLAP** (Online Analytical Processing) is analysis: a few long-running queries that **scan and aggregate huge amounts of history** — "revenue by region by month for three years" — answered in seconds or minutes.',
            uk: 'Майже кожне рішення про базу даних зводиться до одного питання: *якої форми ваше навантаження?* Два архетипи задають полюси. **OLTP** (Online Transaction Processing) — це живий застосунок: багато коротких конкурентних читань і записів по **поточному стану** — оформити замовлення, оновити профіль — за мілісекунди. **OLAP** (Online Analytical Processing) — це аналітика: кілька довгих запитів, що **сканують і агрегують величезні обсяги історії** — «виручка за регіоном за місяцем за три роки» — за секунди чи хвилини.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'OLTP (transactional)', uk: 'OLTP (транзакційне)' },
          b: { en: 'OLAP (analytical)', uk: 'OLAP (аналітичне)' },
          rows: [
            [
              { en: 'Typical query', uk: 'Типовий запит' },
              { en: 'Read/write a few rows by key', uk: 'Читання/запис кількох рядків за ключем' },
              { en: 'Scan & aggregate millions of rows', uk: 'Скан та агрегація мільйонів рядків' },
            ],
            [
              { en: 'Latency', uk: 'Latency' },
              { en: 'Milliseconds', uk: 'Мілісекунди' },
              { en: 'Seconds to minutes', uk: 'Секунди — хвилини' },
            ],
            [
              { en: 'Concurrency', uk: 'Concurrency' },
              { en: 'Thousands of small transactions', uk: 'Тисячі дрібних транзакцій' },
              { en: 'Few heavy queries', uk: 'Кілька важких запитів' },
            ],
            [
              { en: 'Data touched', uk: 'Зачеплені дані' },
              { en: 'Current state, normalized', uk: 'Поточний стан, нормалізований' },
              { en: 'History, often denormalized/columnar', uk: 'Історія, часто denormalized/columnar' },
            ],
            [
              { en: 'Example engine', uk: 'Приклад движка' },
              { en: 'PostgreSQL, MySQL', uk: 'PostgreSQL, MySQL' },
              { en: 'ClickHouse, BigQuery, Snowflake', uk: 'ClickHouse, BigQuery, Snowflake' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: 'They pull a storage engine in opposite directions — OLTP wants fast small writes to current rows, OLAP wants fast big reads over columns — which is why running heavy analytics directly on your production OLTP database makes both slow. The standard fix is to keep them apart: the app writes to the OLTP database, and that data is copied (ETL or replication) into a separate **analytical** store built for scans. You will meet this row-vs-column split again in the storage internals (M12).',
            uk: 'Вони тягнуть storage engine у протилежні боки — OLTP хоче швидких дрібних записів у поточні рядки, OLAP хоче швидких великих читань по колонках — тому важка аналітика просто на проді-OLTP робить повільними обидва. Стандартне розвʼязання — тримати їх окремо: застосунок пише в OLTP-базу, а ці дані копіюються (ETL чи replication) в окреме **аналітичне** сховище, побудоване під scans. Цей поділ row-vs-column ви ще зустрінете у внутрішній будові зберігання (M12).',
          },
        },
      ],
    },
    {
      id: 'cost-of-getting-it-wrong',
      title: { en: 'The cost of getting it wrong', uk: 'Ціна неправильного вибору' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The data model is the most expensive decision to reverse. Application code is rewritten in an afternoon; a database that holds years of customer data, with other services reading it, is migrated over months. Three classic mistakes recur. Using a **cache as the system of record** — fast, until a restart loses what was only ever in memory. Using a **spreadsheet or file** as a shared database — until two people save at once and one edit silently vanishes. Picking a **model that cannot answer your real question** — storing everything as opaque blobs, then needing to query inside them.',
            uk: 'Модель даних — найдорожче рішення для відкату. Код застосунку переписують за пів дня; базу, що тримає роки клієнтських даних, з якої читають інші сервіси, мігрують місяцями. Повторюються три класичні помилки. Використати **cache як систему обліку** — швидко, доки рестарт не втратить те, що було лише в памʼяті. Використати **таблицю чи файл** як спільну базу — доки двоє не збережуть одночасно і одне редагування тихо не зникне. Обрати **модель, що не може відповісти на ваше справжнє питання** — зберігати все непрозорими blobs, а потім потребувати запитів усередину них.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: 'A cache is not a database (unless you make it one)',
            uk: 'Cache — не база даних (поки ви її такою не зробите)',
          },
          md: {
            en: 'Redis keeps data in RAM; persistence (RDB snapshots, the AOF log) is **configurable and a trade-off**, not a default promise of zero loss. That is fine for a cache or for transient structures, and risky as your only copy of the truth. Match the durability you need to the durability the engine actually guarantees — a recurring theme that ACID & the WAL (M17) makes precise.',
            uk: 'Redis тримає дані в RAM; persistence (RDB-snapshots, AOF-лог) — **налаштовуваний компроміс**, а не дефолтна обіцянка нульових втрат. Це нормально для cache чи тимчасових структур і ризиковано як єдина копія істини. Зіставляйте потрібну durability з тією, яку движок справді гарантує — наскрізна тема, яку ACID і WAL (M17) робить точною.',
          },
        },
      ],
    },
    {
      id: 'the-vocabulary',
      title: { en: 'The vocabulary, just enough to start', uk: 'Словник, рівно щоб почати' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A handful of words recur in every later module. You do not need precise definitions yet — just enough to read on. Notice that **database** (the data), **DBMS** (the software), and a running **instance** are three different things people sloppily all call \"the database\".",
            uk: 'Кілька слів повторюються у кожному наступному модулі. Точні визначення поки не потрібні — досить, щоб читати далі. Зверніть увагу: **database** (дані), **DBMS** (софт) і запущений **instance** — це три різні речі, які недбало звуть «базою».',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The core vocabulary — each term gets its own deep dive later.',
            uk: 'Базовий словник — кожен термін отримає власне поглиблення далі.',
          },
          head: [
            { en: 'Term', uk: 'Термін' },
            { en: 'What it means (just enough)', uk: 'Що означає (рівно достатньо)' },
          ],
          rows: [
            [
              { en: 'Schema', uk: 'Schema' },
              { en: 'The shape: which tables/columns exist and the rules they follow.', uk: 'Форма: які tables/columns існують і яких правил дотримуються.' },
            ],
            [
              { en: 'Table / relation', uk: 'Table / relation' },
              { en: 'A named set of rows that all share the same columns.', uk: 'Іменована множина рядків, що мають однакові columns.' },
            ],
            [
              { en: 'Row / record', uk: 'Row / record' },
              { en: 'One item — one user, one order, one event.', uk: 'Один елемент — один user, одне замовлення, одна подія.' },
            ],
            [
              { en: 'Column / attribute', uk: 'Column / attribute' },
              { en: 'One typed field present in every row of a table.', uk: 'Одне типізоване поле, присутнє в кожному рядку table.' },
            ],
            [
              { en: 'Query', uk: 'Query' },
              { en: 'A question or command you send, usually in SQL.', uk: 'Питання чи команда, які ви надсилаєте, зазвичай у SQL.' },
            ],
            [
              { en: 'Transaction', uk: 'Transaction' },
              { en: 'A group of changes that must all succeed or all fail.', uk: 'Група змін, що мають усі вдатися або всі скасуватися.' },
            ],
            [
              { en: 'Index', uk: 'Index' },
              { en: 'A side structure that finds rows fast without scanning all of them.', uk: 'Допоміжна структура, що швидко знаходить рядки без сканування всіх.' },
            ],
            [
              { en: 'Primary key', uk: 'Primary key' },
              { en: 'The column(s) that uniquely identify each row.', uk: 'Колонка(и), що унікально ідентифікують кожен рядок.' },
            ],
            [
              { en: 'DBMS / engine', uk: 'DBMS / engine' },
              { en: 'The software that stores and serves the data (Postgres, MySQL…).', uk: 'Софт, що зберігає й видає дані (Postgres, MySQL…).' },
            ],
          ],
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A DBMS adds four things a file cannot: safe concurrency, durability with crash recovery, integrity rules, and a query language.',
      uk: 'DBMS додає чотири речі, яких файл не має: безпечну concurrency, durability з відновленням після краху, правила integrity і мову запитів.',
    },
    {
      en: 'OLTP = many small fast reads/writes on current state; OLAP = few big scans over history; their storage needs diverge.',
      uk: 'OLTP = багато дрібних швидких читань/записів по поточному стану; OLAP = кілька великих scans по історії; їхні потреби до storage розходяться.',
    },
    {
      en: 'The data model is the most expensive decision to undo — application code changes in an afternoon, a populated database in months.',
      uk: 'Модель даних — найдорожче рішення для відкату: код застосунку змінюється за пів дня, заповнена база — за місяці.',
    },
    {
      en: '"Database" (the data) ≠ "DBMS" (the software) ≠ a running "instance" — precise words prevent confusion later.',
      uk: '«Database» (дані) ≠ «DBMS» (софт) ≠ запущений «instance» — точні слова рятують від плутанини далі.',
    },
    {
      en: 'A cache or a file can hold data, but only a DBMS promises it survives crashes and concurrent writers by default.',
      uk: 'Cache чи файл можуть тримати дані, але лише DBMS обіцяє, що вони переживуть краш і конкурентні записи за замовчуванням.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Using a cache or spreadsheet as the system of record', uk: 'Cache чи таблиця як система обліку' },
      body: {
        en: 'In-memory stores lose data on restart unless persistence is configured; shared files have no concurrency control. Keep the authoritative copy in a durable DBMS and treat caches/files as derived or transient.',
        uk: 'In-memory сховища втрачають дані при рестарті, якщо не налаштувати persistence; спільні файли не мають concurrency control. Тримайте авторитетну копію в durable DBMS, а caches/файли вважайте похідними чи тимчасовими.',
      },
    },
    {
      title: { en: 'Running analytics on the OLTP database', uk: 'Аналітика на OLTP-базі' },
      body: {
        en: 'Heavy scans and aggregations contend with the live transactional workload and slow the app. Replicate or ETL into an analytical store built for big reads.',
        uk: 'Важкі scans та агрегації конкурують із живим транзакційним навантаженням і гальмують застосунок. Реплікуйте чи ETL-те в аналітичне сховище під великі читання.',
      },
    },
    {
      title: { en: 'Choosing an engine before the access pattern', uk: 'Вибір движка до access pattern' },
      body: {
        en: 'Picking a database because it is trendy, then bending the problem to fit it, is backwards. Describe how you will read and write the data first; the family and engine follow from that (M2, M35).',
        uk: 'Обрати базу бо модна, а потім гнути задачу під неї — навпаки. Спершу опишіть, як читатимете й писатимете дані; родина та движок випливають з цього (M2, M35).',
      },
    },
  ],
  interview: [
    {
      level: 'beginner',
      q: {
        en: 'What does a DBMS give you that reading and writing files yourself does not?',
        uk: 'Що дає DBMS, чого немає при самостійному читанні/записі файлів?',
      },
      a: {
        en: 'Concurrency control (many clients without corruption), durability with crash recovery (the data survives a power loss once committed), integrity constraints (rules the data must obey), and a declarative query language with indexing — plus security, backups and tooling. A bare file guarantees none of these.',
        uk: 'Concurrency control (багато клієнтів без псування), durability з відновленням після краху (дані переживуть втрату живлення після commit), integrity constraints (правила для даних) і декларативну мову запитів з indexing — плюс безпеку, backups і tooling. Голий файл не гарантує нічого з цього.',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'How do OLTP and OLAP differ, and why keep them on separate systems?',
        uk: 'Чим OLTP і OLAP різняться і чому тримати їх окремо?',
      },
      a: {
        en: 'OLTP is short, concurrent transactions on current state with millisecond latency, typically normalized and row-oriented. OLAP is long-running scans and aggregations over historical data, often denormalized and column-oriented. They optimize storage in opposite directions, so mixing them lets analytics starve the live workload; the usual fix is to ETL or replicate OLTP data into a dedicated analytical store.',
        uk: 'OLTP — короткі конкурентні транзакції по поточному стану з мілісекундною latency, зазвичай нормалізовані й row-oriented. OLAP — довгі scans і агрегації по історичних даних, часто denormalized і column-oriented. Вони оптимізують storage у протилежні боки, тож змішування дає аналітиці «зголоднити» живе навантаження; типове розвʼязання — ETL чи replication OLTP-даних в окреме аналітичне сховище.',
      },
    },
    {
      level: 'middle',
      q: {
        en: '"Let\'s just use Redis as our main database so everything is fast." How do you respond?',
        uk: '«Просто візьмемо Redis головною базою, щоб усе було швидко». Що відповісте?',
      },
      a: {
        en: 'Ask about durability, query patterns, and data size versus RAM. Redis is in-memory and its persistence is configurable with trade-offs, so it is not a zero-loss system of record by default; it also lacks joins, rich ad-hoc queries and cross-key transactions. It is excellent as a cache, for counters, queues and rate limits — but the authoritative copy usually belongs in a durable relational store, with Redis in front of it.',
        uk: 'Спитайте про durability, патерни запитів і розмір даних відносно RAM. Redis — in-memory, його persistence налаштовуваний з компромісами, тож це не zero-loss система обліку за замовчуванням; також немає joins, багатих ad-hoc запитів і крос-ключових транзакцій. Він чудовий як cache, для лічильників, черг і rate limits — але авторитетна копія зазвичай належить durable реляційному сховищу, а Redis стоїть перед ним.',
      },
    },
  ],
  seeAlso: ['m2-landscape', 'm3-sql-vs-nosql', 'm4-relational-model', 'm5-anatomy-of-a-query', 'm17-acid-wal'],
  sources: [
    {
      title: 'PostgreSQL Documentation — What Is PostgreSQL? (what a DBMS provides)',
      url: 'https://www.postgresql.org/docs/current/intro-whatis.html',
    },
    {
      title: 'IBM — OLAP vs. OLTP: What’s the Difference?',
      url: 'https://www.ibm.com/think/topics/olap-vs-oltp',
    },
    {
      title: 'AWS — The Difference Between OLAP and OLTP',
      url: 'https://aws.amazon.com/compare/the-difference-between-olap-and-oltp/',
    },
    {
      title: 'PostgreSQL Documentation — Reliability and the Write-Ahead Log (durability)',
      url: 'https://www.postgresql.org/docs/current/wal-reliability.html',
    },
    {
      title: 'Redis Documentation — Persistence (RDB/AOF trade-offs)',
      url: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/',
    },
  ],
};
