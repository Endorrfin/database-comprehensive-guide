import type { Module } from '../types';

/*
 * M9 · Data types done right — Section II (S5). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-23 (see `sources`):
 *  - numeric/decimal are exact; real/double precision are inexact binary IEEE-754
 *    (0.1::float8 + 0.2::float8 = 0.30000000000000004). numeric recommended for money.
 *  - money type discouraged (fixed fractional precision, locale/rounding surprises).
 *  - char(n)/varchar(n)/text: no perf difference in PostgreSQL; text is idiomatic, char(n)
 *    is blank-padded. Prefer timestamptz over timestamp (PostgreSQL wiki "Don't Do This").
 *  - jsonb is decomposed binary, GIN-indexable (json keeps raw text).
 *  - uuidv7() built-in since PostgreSQL 18 (RFC 9562, time-ordered); uuidv4() = gen_random_uuid().
 * Figure 'float-trap' is the motivating diagram. Non-signature module: figure + tables + code.
 */
export const m9: Module = {
  id: 'm9-data-types',
  num: 9,
  section: 's2-relational',
  order: 4,
  level: 'middle',
  title: { en: 'Data types done right', uk: 'Типи даних правильно' },
  tagline: {
    en: 'Strings, the FLOAT-for-money disaster, dates/zones, JSONB, arrays, enums, UUID.',
    uk: 'Рядки, катастрофа FLOAT для грошей, дати/zones, JSONB, масиви, enums, UUID.',
  },
  readMins: 12,
  mentalModel: {
    en: 'A type is a constraint: the narrowest type that fits is the safest.',
    uk: 'Тип — це constraint: найвужчий тип, що підходить, — найбезпечніший.',
  },
  topics: [
    {
      id: 'type-is-a-constraint',
      title: { en: 'A type is a constraint', uk: 'Тип — це constraint' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Every column has a type, and a **type is the cheapest, most fundamental constraint you have** — it runs before any `CHECK`, on every write, for free. `age integer` rejects `'banana'` outright; `happened_at timestamptz` rejects `'next Tuesday-ish'`; `active boolean` can only ever be true, false, or NULL. So the guiding rule is simple: **choose the narrowest type that faithfully represents the domain.** A narrow type is three things at once — documentation of what the column means, validation that rejects nonsense at the door, and efficient, correctly-ordered storage the planner can reason about.",
            uk: "Кожна колонка має тип, і **тип — це найдешевший, найфундаментальніший constraint, що у вас є** — він спрацьовує до будь-якого `CHECK`, на кожному записі, безкоштовно. `age integer` одразу відкидає `'banana'`; `happened_at timestamptz` відкидає `'десь у вівторок'`; `active boolean` може бути лише true, false чи NULL. Тож провідне правило просте: **обирайте найвужчий тип, що достовірно подає домен.** Вузький тип — це три речі водночас: документація сенсу колонки, валідація, що відкидає нісенітницю на вході, та ефективне, правильно впорядковане зберігання, про яке планувальник може міркувати.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'The "stringly-typed" anti-pattern', uk: 'Анти-патерн «stringly-typed»' },
          md: {
            en: "Storing numbers, dates, booleans or JSON as plain `text` throws away everything the engine offers. You lose **ordering** (as text, `'10' < '9' < '100'`), **validation** (`'2026-13-45'` is a perfectly good string), **arithmetic** (you cannot add two strings), and **index semantics** (a range scan on text dates is meaningless). “It's all strings, the app will parse it” reintroduces, in every reader, the bugs the type system would have prevented once. Use the real type and let the database do its job.",
            uk: "Зберігання чисел, дат, boolean чи JSON як простого `text` викидає все, що дає движок. Ви втрачаєте **порядок** (як text, `'10' < '9' < '100'`), **валідацію** (`'2026-13-45'` — цілком прийнятний рядок), **арифметику** (два рядки не додати) і **семантику index** (range scan по текстових датах безглуздий). «Це все рядки, застосунок розпарсить» повертає в кожного читача баги, які система типів запобігла б раз і назавжди. Вживайте справжній тип і дайте базі робити свою справу.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "There is also a planning payoff: a correct type gives PostgreSQL accurate statistics and the right operators, so it estimates row counts and picks plans better (M16). And it catches mistakes at **write time** — the cheapest possible moment, before bad data spreads to a hundred downstream reads. The rest of this module is the narrow-type principle applied to the choices people most often get wrong: numbers, text, time, and the rich types.",
            uk: "Є й виграш для планування: правильний тип дає PostgreSQL точну statistics і правильні оператори, тож він краще оцінює кількість рядків і обирає плани (M16). І він ловить помилки на **записі** — у найдешевший момент, доки погані дані не розповзлися в сотню подальших читань. Решта модуля — принцип вузького типу, застосований до виборів, які найчастіше роблять неправильно: числа, текст, час і багаті типи.",
          },
        },
      ],
    },
    {
      id: 'numbers-and-float',
      title: { en: 'Numbers & the FLOAT-for-money disaster', uk: 'Числа і катастрофа FLOAT для грошей' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "For whole numbers, pick by range: **`smallint`** (±32 K), **`integer`** (±2.1 B, the everyday default), **`bigint`** (±9.2 quintillion, for ids and counters that might grow). The interesting decision is fractional numbers, where there is a fork that quietly ruins financial data: **exact vs inexact**.",
            uk: "Для цілих обирайте за діапазоном: **`smallint`** (±32 К), **`integer`** (±2.1 млрд, щоденний дефолт), **`bigint`** (±9.2 квінтильйона, для id і лічильників, що можуть рости). Цікаве рішення — дробові числа, де є розгалуження, що тихо руйнує фінансові дані: **exact проти inexact**.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "**`real` and `double precision` are binary floating-point (IEEE-754) — and the PostgreSQL docs call them *inexact*.** They store values in base-2, where most decimal fractions (0.1, 0.2, 0.01) have no finite representation, so they are kept as the nearest approximation. The approximations are tiny per value but they **accumulate** under arithmetic. **`numeric` (a.k.a. `decimal`) stores exact decimal digits and computes exactly** — the docs explicitly recommend it for money. The difference is not academic:",
            uk: "**`real` і `double precision` — це двійкова рухома кома (IEEE-754), і документація PostgreSQL називає їх *inexact*.** Вони зберігають значення в основі 2, де більшість десяткових дробів (0.1, 0.2, 0.01) не мають скінченного подання, тож тримаються як найближче наближення. Наближення крихітні на значення, але **накопичуються** під арифметикою. **`numeric` (він же `decimal`) зберігає точні десяткові цифри й рахує точно** — документація прямо рекомендує його для грошей. Різниця не академічна:",
          },
        },
        {
          kind: 'figure',
          fig: 'float-trap',
          caption: {
            en: 'In double precision, 0.1 + 0.2 is 0.30000000000000004; in numeric it is exactly 0.3. Money is numeric (or integer cents), never float.',
            uk: 'У double precision 0.1 + 0.2 = 0.30000000000000004; у numeric — рівно 0.3. Гроші — це numeric (чи integer cents), ніколи не float.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Choosing a number type. The fractional row is where money is won or lost.',
            uk: 'Вибір числового типу. Дробовий рядок — там, де гроші виграють або втрачають.',
          },
          head: [
            { en: 'Type', uk: 'Тип' },
            { en: 'Nature', uk: 'Природа' },
            { en: 'Use for', uk: 'Для чого' },
          ],
          rows: [
            [
              { en: 'smallint / integer / bigint', uk: 'smallint / integer / bigint' },
              { en: 'Exact whole numbers', uk: 'Точні цілі' },
              { en: 'Counts, ids, quantities — default to integer/bigint', uk: 'Лічильники, id, кількості — дефолт integer/bigint' },
            ],
            [
              { en: 'numeric(p, s) / decimal', uk: 'numeric(p, s) / decimal' },
              { en: 'Exact decimal, arbitrary precision', uk: 'Точний десятковий, довільна точність' },
              { en: 'Money, tax, anything where the last cent must be right', uk: 'Гроші, податок, усе, де останній цент має бути точним' },
            ],
            [
              { en: 'real / double precision', uk: 'real / double precision' },
              { en: 'Inexact binary float (IEEE-754)', uk: 'Неточний двійковий float (IEEE-754)' },
              { en: 'Scientific/measurement data where approximate is fine', uk: 'Наукові/вимірювальні дані, де наближення прийнятне' },
            ],
            [
              { en: 'money', uk: 'money' },
              { en: 'Fixed fractional precision, locale-dependent', uk: 'Фіксована дробова точність, залежить від locale' },
              { en: 'Avoid — use numeric or integer minor units instead', uk: 'Уникати — беріть numeric чи integer minor units' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Float is not evil — it is just wrong for exact decimals', uk: 'Float не зло — він просто не для точних десяткових' },
          md: {
            en: "The lesson is precise, not a blanket ban. `double precision` is the **right** choice for scientific and measurement data — sensor readings, coordinates, ML feature vectors — where values are inherently approximate and you want speed and a huge range. It is **wrong** for any quantity that is *defined* in exact decimal units: money, tax rates, invoice totals. The trap is using `float` for currency because it “looks like a number with a decimal point”. For money, use `numeric(12,2)` or store **integer minor units** (cents) and divide for display.",
            uk: "Урок точний, а не загальна заборона. `double precision` — **правильний** вибір для наукових і вимірювальних даних — показники сенсорів, координати, ML feature vectors — де значення за природою наближені, а вам потрібні швидкість і величезний діапазон. Він **неправильний** для будь-якої величини, *визначеної* в точних десяткових одиницях: гроші, ставки податку, суми рахунків. Пастка — брати `float` для валюти, бо він «схожий на число з комою». Для грошей беріть `numeric(12,2)` або зберігайте **integer minor units** (cents) і ділите для відображення.",
          },
        },
      ],
    },
    {
      id: 'text-time-zones',
      title: { en: 'Text, time & zones', uk: 'Текст, час і zones' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "PostgreSQL has three text types — **`char(n)`**, **`varchar(n)`**, **`text`** — and, surprising newcomers, **there is no performance difference** between them; under the hood they are the same variable-length storage. `char(n)` is **blank-padded** to a fixed length (a footgun: it silently pads and then trims, and comparisons get confusing). `varchar(n)` adds a length-limit check. `text` is unbounded. Idiomatic PostgreSQL is to use **`text`**, and add `varchar(n)` or a `CHECK (length(col) <= n)` only when the limit is a genuine domain rule (a 2-letter country code), not a guess at “probably long enough”.",
            uk: "PostgreSQL має три текстові типи — **`char(n)`**, **`varchar(n)`**, **`text`** — і, на подив новачкам, **між ними немає різниці в продуктивності**; під капотом це те саме сховище змінної довжини. `char(n)` **доповнюється пробілами** до фіксованої довжини (footgun: він тихо доповнює, потім обрізає, а порівняння плутаються). `varchar(n)` додає перевірку обмеження довжини. `text` — без меж. Ідіоматичний PostgreSQL — вживати **`text`**, а `varchar(n)` чи `CHECK (length(col) <= n)` додавати лише коли обмеження — справжнє правило домену (2-літерний country code), а не здогад «мабуть, вистачить».",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "For time, the single highest-leverage choice in the whole type system is **`timestamptz` over `timestamp`**. A `timestamptz` records an actual **moment** — it is stored as UTC and rendered in the session's time zone, so everyone agrees on the instant. A `timestamp` (*without* time zone) is a bare wall-clock reading with **no** zone attached, which means the same stored value denotes different instants for a user in Kyiv and a user in New York. Almost every “when did this happen” column should be `timestamptz`. Use `date` for calendar dates, `time` for times of day, and `interval` for durations.",
            uk: "Для часу найважливіший вибір у всій системі типів — **`timestamptz` замість `timestamp`**. `timestamptz` фіксує справжній **момент** — зберігається як UTC і відображається в time zone сесії, тож усі згодні щодо миті. `timestamp` (*without* time zone) — це голий показник стінного годинника **без** прикріпленої зони, тобто те саме збережене значення означає різні миті для користувача в Києві й у Нью-Йорку. Майже кожна колонка «коли це сталося» має бути `timestamptz`. Вживайте `date` для календарних дат, `time` для часу доби, `interval` для тривалостей.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: '“without time zone” does not mean UTC — it means no zone', uk: '«without time zone» не означає UTC — означає без зони' },
          md: {
            en: "The classic production bug is reading `timestamp without time zone` as “UTC”. It is not UTC — it is *zoneless*, a number with no anchor to a real instant, which is strictly worse than UTC because nothing records what zone it was meant in. Store instants as **`timestamptz`** (UTC inside, always), do all storage and math in UTC, and convert to a local zone **only at the edge, for display**. The one legitimate use of `timestamp without time zone` is a genuinely zoneless wall-clock value — “the alarm rings at 07:00 local, wherever the device is” — which is rare.",
            uk: "Класичний продакшн-баг — читати `timestamp without time zone` як «UTC». Це не UTC — це *беззонне* значення, число без якоря до реальної миті, що строго гірше за UTC, бо ніщо не фіксує, в якій зоні воно малося. Зберігайте миті як **`timestamptz`** (усередині завжди UTC), робіть усе зберігання й математику в UTC і конвертуйте в локальну зону **лише скраю, для відображення**. Єдине легітимне застосування `timestamp without time zone` — справді беззонне значення стінного годинника — «будильник дзвонить о 07:00 за місцевим, де б пристрій не був» — що рідкість.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `CREATE TABLE invoices (
  id          bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number      text          NOT NULL UNIQUE,        -- text, not varchar(n) by reflex
  amount      numeric(12,2) NOT NULL CHECK (amount >= 0),  -- exact money, never float
  currency    char(3)       NOT NULL,               -- a real fixed-width domain (ISO 4217)
  issued_at   timestamptz   NOT NULL DEFAULT now(), -- a real moment, stored UTC
  due_on      date          NOT NULL                -- a calendar day, no time/zone
);`,
          note: {
            en: 'numeric for money, timestamptz for the instant, date for the calendar day, text for the free string, char(3) only because a 3-letter currency code is a true fixed-width domain.',
            uk: 'numeric для грошей, timestamptz для миті, date для календарного дня, text для вільного рядка, char(3) лише тому, що 3-літерний код валюти — справжній домен фіксованої ширини.',
          },
        },
      ],
    },
    {
      id: 'rich-types',
      title: { en: 'Beyond scalars: JSONB, arrays, enums, UUID', uk: 'Поза скалярами: JSONB, масиви, enums, UUID' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "PostgreSQL's richer types are a major reason it replaces a lot of NoSQL. **`jsonb`** stores JSON in a decomposed **binary** form: marginally slower to write than `json` (which keeps the raw text verbatim), but much faster to query and — crucially — **indexable with GIN**, so you can search inside documents. **Arrays** let one column hold `text[]` — convenient for a small ordered list like tags. **`enum`** is a fixed, ordered set of labels, type-safe and compact. **`uuid`** is a 128-bit identifier, ideal for distributed or surrogate keys.",
            uk: "Багатші типи PostgreSQL — вагома причина, чому він заміняє чимало NoSQL. **`jsonb`** зберігає JSON у розкладеній **двійковій** формі: трохи повільніший на запис за `json` (що тримає сирий текст дослівно), але значно швидший на запит і — головне — **індексований через GIN**, тож можна шукати всередині документів. **Масиви** дають одній колонці тримати `text[]` — зручно для невеликого впорядкованого списку, як-от теги. **`enum`** — фіксований упорядкований набір міток, типобезпечний і компактний. **`uuid`** — 128-бітний ідентифікатор, ідеальний для розподілених чи surrogate keys.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "On UUIDs there is a 2026 upgrade worth knowing. The familiar `gen_random_uuid()` (aliased **`uuidv4()`** in PostgreSQL 18) is fully random, which gives terrible index locality — each insert lands in a random spot of the B-Tree. **PostgreSQL 18 added a built-in `uuidv7()`** (RFC 9562): it puts a millisecond timestamp in the high bits, so the values are **time-ordered** and index almost like a sequential key while staying globally unique. For new UUID primary keys, prefer **`uuidv7()`** over random v4.",
            uk: "Щодо UUID є оновлення 2026, варте знання. Звичний `gen_random_uuid()` (псевдонім **`uuidv4()`** у PostgreSQL 18) повністю випадковий, що дає жахливу index locality — кожна вставка падає у випадкове місце B-Tree. **PostgreSQL 18 додав вбудований `uuidv7()`** (RFC 9562): він кладе мілісекундний timestamp у старші біти, тож значення **впорядковані за часом** й індексуються майже як послідовний ключ, лишаючись глобально унікальними. Для нових UUID primary keys віддавайте перевагу **`uuidv7()`** над випадковим v4.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Reach for the rich type when…', uk: 'Беріть багатий тип, коли…' },
          b: { en: 'Reach for a column / table when…', uk: 'Беріть колонку / таблицю, коли…' },
          rows: [
            [
              { en: 'jsonb', uk: 'jsonb' },
              { en: 'The shape is sparse, variable, or a third-party payload', uk: 'Форма розріджена, змінна чи стороннє payload' },
              { en: 'The fields are known and stable — model them as columns', uk: 'Поля відомі й стабільні — моделюйте як колонки' },
            ],
            [
              { en: 'array', uk: 'array' },
              { en: 'A short ordered list you read whole (tags on a post)', uk: 'Короткий упорядкований список, що читаєте цілим (теги поста)' },
              { en: 'You must query, join, or constrain elements — child table', uk: 'Треба запитувати, join чи обмежувати елементи — child table' },
            ],
            [
              { en: 'enum', uk: 'enum' },
              { en: 'A small fixed set that rarely changes (weekday)', uk: 'Малий фіксований набір, що рідко змінюється (день тижня)' },
              { en: 'The set changes often or carries attributes — lookup + FK', uk: 'Набір часто змінюється чи має атрибути — lookup + FK' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'JSONB is not a way to skip schema design', uk: 'JSONB — не спосіб оминути дизайн схеми' },
          md: {
            en: "The most common `jsonb` mistake is using it to avoid thinking about the schema. If a field is known and stable — `status`, `price`, `created_at` — model it as a typed **column**: you get a type, constraints, an index, clean `WHERE` clauses, and honest statistics. Bury those same fields in a `jsonb` blob and you lose all of it — no `NOT NULL`, no `CHECK`, awkward queries, worse plans. Reserve `jsonb` for what is genuinely schemaless: sparse attributes, user-defined fields, or raw payloads from an external API you do not control. Rich types are precision tools, not escape hatches from data modeling.",
            uk: "Найпоширеніша помилка з `jsonb` — вживати його, щоб не думати про схему. Якщо поле відоме й стабільне — `status`, `price`, `created_at` — моделюйте його як типізовану **колонку**: ви отримуєте тип, constraints, index, чисті `WHERE`, чесну statistics. Сховайте ті самі поля в `jsonb`-blob — і втратите все це: ні `NOT NULL`, ні `CHECK`, незручні запити, гірші плани. Лишайте `jsonb` для справді безсхемного: розріджені атрибути, поля від користувача чи сирі payload зовнішнього API, який ви не контролюєте. Багаті типи — інструменти точності, а не лазівки від моделювання даних.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "So the module collapses to its mental model: **a type is the first and cheapest constraint, so pick the narrowest one that faithfully fits.** Exact (`numeric`) for money, zone-aware (`timestamptz`) for instants, `text` for strings unless a width is a real rule, and the rich types (`jsonb`, arrays, `enum`, `uuid`/`uuidv7`) reached for deliberately — never as a way to dodge designing the schema.",
            uk: "Тож модуль згортається у свою ментальну модель: **тип — це перший і найдешевший constraint, тож обирайте найвужчий, що достовірно підходить.** Точний (`numeric`) для грошей, зонозалежний (`timestamptz`) для митей, `text` для рядків, якщо ширина не є справжнім правилом, а багаті типи (`jsonb`, масиви, `enum`, `uuid`/`uuidv7`) — свідомо, ніколи як спосіб оминути дизайн схеми.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A type is the cheapest constraint — it validates on every write before any CHECK. Pick the narrowest type that faithfully represents the domain; storing everything as text throws away ordering, validation, arithmetic, and index semantics.',
      uk: 'Тип — найдешевший constraint: валідує на кожному записі до будь-якого CHECK. Обирайте найвужчий тип, що достовірно подає домен; зберігання всього як text викидає порядок, валідацію, арифметику й семантику index.',
    },
    {
      en: 'real/double precision are inexact binary floats (0.1 + 0.2 = 0.30000000000000004); numeric is exact. Store money as numeric or integer cents, never float; the money type is best avoided.',
      uk: 'real/double precision — неточні двійкові float (0.1 + 0.2 = 0.30000000000000004); numeric точний. Зберігайте гроші як numeric чи integer cents, ніколи не float; типу money краще уникати.',
    },
    {
      en: 'char/varchar/text have no performance difference in PostgreSQL; text is idiomatic and char(n) is blank-padded. Use timestamptz (an instant stored as UTC), not timestamp without time zone (zoneless).',
      uk: 'char/varchar/text не різняться продуктивністю в PostgreSQL; text ідіоматичний, а char(n) доповнюється пробілами. Вживайте timestamptz (мить, збережену як UTC), а не timestamp without time zone (беззонний).',
    },
    {
      en: 'jsonb is binary and GIN-indexable (json keeps raw text); use it for sparse/variable data, not to dodge modeling stable fields as columns. Arrays suit small read-whole lists; enums suit small fixed sets.',
      uk: 'jsonb двійковий і GIN-індексований (json тримає сирий текст); вживайте для розрідженого/змінного, а не щоб оминути моделювання стабільних полів колонками. Масиви — для малих списків «читати цілим»; enums — для малих фіксованих наборів.',
    },
    {
      en: 'uuidv7() (built-in since PostgreSQL 18) is time-ordered and indexes far better than random uuidv4()/gen_random_uuid(); prefer it for new UUID keys.',
      uk: 'uuidv7() (вбудований від PostgreSQL 18) упорядкований за часом й індексується значно краще за випадковий uuidv4()/gen_random_uuid(); віддавайте йому перевагу для нових UUID-ключів.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Storing money in a float', uk: 'Зберігати гроші у float' },
      body: {
        en: 'real/double precision cannot represent most decimal fractions exactly, so balances drift by sub-cent amounts that accumulate across millions of rows into real, audit-failing discrepancies. Use numeric for exact decimal money, or store integer minor units (cents). Reserve float for approximate scientific/measurement data.',
        uk: 'real/double precision не можуть точно подати більшість десяткових дробів, тож баланси дрейфують на суб-центові суми, що накопичуються через мільйони рядків у реальні розбіжності, які не пройдуть аудит. Вживайте numeric для точних десяткових грошей чи зберігайте integer minor units (cents). Float лишайте для наближених наукових/вимірювальних даних.',
      },
    },
    {
      title: { en: 'Using timestamp without time zone for instants', uk: 'Вживати timestamp without time zone для митей' },
      body: {
        en: '“without time zone” is not UTC — it is zoneless, so the same value means different instants in different sessions, and “when did this happen” becomes ambiguous. Store moments as timestamptz, keep storage and math in UTC, and convert to local only for display.',
        uk: '«without time zone» — не UTC, а беззонне значення, тож те саме значення означає різні миті в різних сесіях, і «коли це сталося» стає неоднозначним. Зберігайте миті як timestamptz, тримайте зберігання й математику в UTC і конвертуйте в локальне лише для відображення.',
      },
    },
    {
      title: { en: 'Dumping stable fields into a jsonb blob', uk: 'Скидати стабільні поля у jsonb-blob' },
      body: {
        en: 'Putting known, stable fields inside jsonb to “stay flexible” discards types, NOT NULL/CHECK constraints, clean indexes, and good query plans. Model stable fields as typed columns and reserve jsonb for genuinely sparse, variable, or third-party data.',
        uk: 'Класти відомі стабільні поля в jsonb «заради гнучкості» відкидає типи, NOT NULL/CHECK constraints, чисті indexes і добрі плани. Моделюйте стабільні поля типізованими колонками, а jsonb лишайте для справді розрідженого, змінного чи стороннього.',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'Why must you not store money in a float, and what should you use instead?',
        uk: 'Чому не можна зберігати гроші у float і що вживати натомість?',
      },
      a: {
        en: 'real and double precision are binary IEEE-754 floating point, which the PostgreSQL docs explicitly call inexact: most decimal fractions like 0.1 have no exact base-2 representation, so they are stored as approximations. The canonical demonstration is 0.1 + 0.2 evaluating to 0.30000000000000004 instead of 0.3. Per value the error is microscopic, but across many operations and rows it accumulates into real discrepancies that fail reconciliation and audits. For money use numeric (exact decimal, recommended by the docs) with a fixed scale like numeric(12,2), or store integer minor units — cents — and divide for display. Float is the right tool only for inherently approximate scientific or measurement data.',
        uk: 'real і double precision — двійкова рухома кома IEEE-754, яку документація PostgreSQL прямо називає inexact: більшість десяткових дробів, як-от 0.1, не мають точного подання в основі 2, тож зберігаються як наближення. Канонічна демонстрація — 0.1 + 0.2 дає 0.30000000000000004 замість 0.3. На значення похибка мікроскопічна, але через багато операцій і рядків накопичується в реальні розбіжності, що провалюють звірку й аудит. Для грошей вживайте numeric (точний десятковий, рекомендований документацією) з фіксованим scale, як numeric(12,2), чи зберігайте integer minor units — cents — і ділите для відображення. Float доречний лише для за природою наближених наукових чи вимірювальних даних.',
      },
    },
    {
      level: 'middle',
      q: {
        en: 'timestamptz vs timestamp — which do you default to and why?',
        uk: 'timestamptz проти timestamp — що берете за замовчуванням і чому?',
      },
      a: {
        en: 'I default to timestamptz for anything that records when something happened. timestamptz represents an actual instant: PostgreSQL stores it as UTC and renders it in the session time zone, so all clients agree on the moment. timestamp without time zone is a bare wall-clock value with no zone attached — and critically it does not mean UTC, it means zoneless, so the same stored value denotes different instants for clients in different zones. That ambiguity is a classic source of off-by-hours bugs. The pattern is: store and compute in UTC with timestamptz, convert to a local zone only at the display edge. timestamp without time zone is only correct for a genuinely zoneless wall-clock concept, like a recurring local alarm time, which is rare.',
        uk: 'За замовчуванням беру timestamptz для всього, що фіксує, коли щось сталося. timestamptz подає справжню мить: PostgreSQL зберігає її як UTC і відображає в time zone сесії, тож усі клієнти згодні щодо моменту. timestamp without time zone — голий показник стінного годинника без зони — і головне, він означає не UTC, а беззонність, тож те саме значення означає різні миті для клієнтів у різних зонах. Ця неоднозначність — класичне джерело багів «на кілька годин». Патерн: зберігати й рахувати в UTC через timestamptz, конвертувати в локальну зону лише скраю, для відображення. timestamp without time zone правильний лише для справді беззонного поняття стінного годинника, як повторюваний локальний час будильника, що рідкість.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'When is jsonb the right choice, and when is it a mistake?',
        uk: 'Коли jsonb правильний вибір, а коли помилка?',
      },
      a: {
        en: 'jsonb is right when the data is genuinely schemaless: sparse attributes that differ per row, user-defined custom fields, or raw payloads from an external API whose shape you do not control. It stores JSON in a binary form that is GIN-indexable, so you can still query inside it efficiently. It is a mistake when used to avoid schema design for fields that are actually known and stable — putting status, price, or created_at inside a blob. Doing that forfeits typing, NOT NULL and CHECK constraints, clean B-Tree indexes, simple WHERE clauses, and accurate planner statistics; you end up reimplementing all of that in application code. The rule of thumb: if you know the field exists and will query or constrain it, make it a typed column; reserve jsonb for the parts that are legitimately variable. A common hybrid is stable columns plus one jsonb column for the long tail of optional attributes.',
        uk: 'jsonb правильний, коли дані справді безсхемні: розріджені атрибути, що різняться по рядках, користувацькі поля чи сирі payload зовнішнього API, форму якого ви не контролюєте. Він зберігає JSON у двійковій формі, індексованій через GIN, тож усередині можна ефективно запитувати. Це помилка, коли його вживають, щоб оминути дизайн схеми для полів, що насправді відомі й стабільні — кладуть status, price чи created_at у blob. Так ви втрачаєте типізацію, constraints NOT NULL і CHECK, чисті B-Tree indexes, прості WHERE й точну statistics планувальника; зрештою переписуєте все це в коді застосунку. Орієнтир: якщо знаєте, що поле існує й ви його запитуватимете чи обмежуватимете, робіть його типізованою колонкою; jsonb лишайте для частин, що легітимно змінні. Поширений гібрид — стабільні колонки плюс одна jsonb-колонка для довгого хвоста необовʼязкових атрибутів.',
      },
    },
  ],
  seeAlso: ['m8-keys-constraints', 'm4-relational-model', 'm12-storage', 'm16-query-planning', 'm25-document'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 8.1. Numeric Types (numeric is exact; real/double precision are inexact; numeric recommended for money)',
      url: 'https://www.postgresql.org/docs/current/datatype-numeric.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 8.5. Date/Time Types (timestamp with vs without time zone)',
      url: 'https://www.postgresql.org/docs/current/datatype-datetime.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 8.14. JSON Types (json vs jsonb; jsonb is binary and indexable)',
      url: 'https://www.postgresql.org/docs/current/datatype-json.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 9.14. UUID Functions (uuidv7() time-ordered, RFC 9562; uuidv4() = gen_random_uuid())',
      url: 'https://www.postgresql.org/docs/current/functions-uuid.html',
    },
    {
      title: 'PostgreSQL Wiki — Don\'t Do This (avoid char(n); prefer timestamptz; the money type is discouraged)',
      url: 'https://wiki.postgresql.org/wiki/Don%27t_Do_This',
    },
  ],
};
