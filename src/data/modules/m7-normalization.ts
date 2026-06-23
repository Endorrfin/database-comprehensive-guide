import type { Module } from '../types';

/*
 * M7 · Normalization & denormalization — Section II, signature module (S4).
 * Authored EN first, UA second. Technical terms stay English in both languages.
 * Facts web-verified 2026-06-23 (see `sources`): Codd 1970 (introduced normalization /
 * 1NF) and his early-1970s normalization work defining 2NF/3NF; Kent 1983 "A Simple Guide
 * to Five Normal Forms" (the "key, the whole key, and nothing but the key" summary, CACM
 * 26(2):120-125); BCNF = every determinant of a non-trivial FD is a candidate key.
 * The embedded 'normalization-stepper' sim walks 0NF→1NF→2NF→3NF; 'update-anomalies'
 * is the motivating figure.
 */
export const m7: Module = {
  id: 'm7-normalization',
  num: 7,
  section: 's2-relational',
  order: 2,
  level: 'middle',
  signature: true,
  title: { en: 'Normalization & denormalization', uk: 'Нормалізація та денормалізація' },
  tagline: {
    en: '1NF→BCNF, functional dependencies, and when to denormalize on purpose.',
    uk: '1NF→BCNF, functional dependencies і коли денормалізувати свідомо.',
  },
  readMins: 12,
  mentalModel: {
    en: 'One fact, one place — until read performance makes you copy it deliberately.',
    uk: 'Один факт — одне місце, доки продуктивність читання не змусить свідомо його скопіювати.',
  },
  topics: [
    {
      id: 'functional-dependencies',
      title: { en: 'Functional dependencies & why redundancy hurts', uk: 'Functional dependencies і чому надмірність шкодить' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Normalization rests on one precise idea: the **functional dependency** (FD). Writing **X → Y** (“X determines Y”) means that for any given value of X there is exactly one value of Y. `student_id → student_name`: know the id, and the name is fixed. The entire theory of normal forms is a single goal stated four ways — make sure **every** functional dependency in a table is a dependency **on the key**. When that fails, some non-key fact ends up stored in more than one row, and stored-twice facts are where corruption is born.",
            uk: "Нормалізація стоїть на одній точній ідеї — **functional dependency** (FD). Запис **X → Y** («X визначає Y») означає, що для будь-якого значення X існує рівно одне значення Y. `student_id → student_name`: знаєш id — імʼя зафіксоване. Уся теорія normal forms — це одна мета, сформульована чотирма способами: зробити так, щоб **кожна** functional dependency у таблиці була залежністю **від ключа**. Коли це не так, якийсь не-ключовий факт опиняється збереженим у кількох рядках, а збережені двічі факти — це місце народження пошкоджень.",
          },
        },
        {
          kind: 'figure',
          fig: 'update-anomalies',
          caption: {
            en: 'One duplicated fact — “Dr. Lee is in room R210”, stored on every row — is the root of all three anomalies below it.',
            uk: 'Один продубльований факт — «Dr. Lee у кабінеті R210», збережений у кожному рядку — корінь усіх трьох аномалій під ним.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Redundancy is not just wasted bytes; it produces three concrete **anomalies**. The **update anomaly**: change the advisor's room and you must rewrite *every* row that mentions it — miss one and the database now disagrees with itself. The **insertion anomaly**: you cannot record that an advisor sits in R210 until some student is assigned, because there is no row to put it on. The **deletion anomaly**: delete the last enrollment for that advisor and the room fact vanishes with it. All three trace back to the same cause — a fact about the *advisor* living in a table keyed by *enrollment*. Normalization fixes the cause by splitting tables so every fact sits beside the key it actually depends on.",
            uk: "Надмірність — це не лише змарновані байти; вона породжує три конкретні **аномалії**. **Update-аномалія**: зміните кабінет advisor — і мусите переписати *кожен* рядок, що його згадує; пропустите один — і база суперечить сама собі. **Insert-аномалія**: ви не можете записати, що advisor сидить у R210, доки не призначено студента, бо немає рядка, куди це покласти. **Delete-аномалія**: видаліть останній enrollment для цього advisor — і факт про кабінет зникне з ним. Усі три зводяться до однієї причини — факт про *advisor* живе в таблиці, ключованій за *enrollment*. Нормалізація лікує причину, розділяючи таблиці так, щоб кожен факт сидів поруч із ключем, від якого справді залежить.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Finding the dependencies', uk: 'Як знайти залежності' },
          md: {
            en: "To normalize a table, first list its FDs. The mechanical question is: *“if I know this column (or these columns), is that column fixed?”* `course_id → course_title`? Yes. `advisor → advisor_room`? Yes. `student_id → advisor`? Yes. Once the FDs are on paper, the normal forms tell you exactly which to pull into their own table — you are not guessing, you are following the dependencies.",
            uk: "Щоб нормалізувати таблицю, спершу випишіть її FDs. Механічне питання: *«якщо я знаю цю колонку (чи ці колонки), чи зафіксована та колонка?»* `course_id → course_title`? Так. `advisor → advisor_room`? Так. `student_id → advisor`? Так. Щойно FDs на папері, normal forms точно кажуть, які з них винести в окрему таблицю — ви не вгадуєте, ви йдете за залежностями.",
          },
        },
      ],
    },
    {
      id: 'normal-forms',
      title: { en: '1NF → 2NF → 3NF', uk: '1NF → 2NF → 3NF' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The normal forms are a ladder; each rung removes one species of bad dependency. Step the messy `enrollments` table through them below — watch it split, the duplicated cells disappear, and the four “one fact, one place” checks turn green.",
            uk: "Normal forms — це драбина; кожен щабель прибирає один вид поганої залежності. Проженіть нижче брудну таблицю `enrollments` крізь них — дивіться, як вона ділиться, дубльовані клітинки зникають, а чотири перевірки «один факт, одне місце» зеленіють.",
          },
        },
        {
          kind: 'sim',
          sim: 'normalization-stepper',
        },
        {
          kind: 'prose',
          md: {
            en: "Read the ladder precisely. **1NF**: every value is **atomic** — no lists, no repeating groups — and a key exists; this is the price of being a relation at all. **2NF**: in 1NF *and* no non-key attribute depends on only **part** of a composite key (a *partial* dependency). It can only be violated when the key is composite, which is exactly the enrollment case: `student_name` depended on `student_id` alone, half of the `(student_id, course_id)` key. **3NF**: in 2NF *and* no non-key attribute depends on another **non-key** attribute (a *transitive* dependency) — `advisor_room` depended on `advisor`, not on the student. William Kent's 1983 summary captures all three: every non-key attribute must give a fact about **“the key, the whole key, and nothing but the key.”**",
            uk: "Читайте драбину точно. **1NF**: кожне значення **атомарне** — без списків, без repeating groups — і ключ існує; це ціна того, щоб взагалі бути relation. **2NF**: у 1NF *і* жоден не-ключовий attribute не залежить лише від **частини** складеного ключа (*partial* dependency). Її можна порушити лише за складеного ключа — саме випадок enrollment: `student_name` залежав від самого `student_id`, половини ключа `(student_id, course_id)`. **3NF**: у 2NF *і* жоден не-ключовий attribute не залежить від іншого **не-ключового** attribute (*transitive* dependency) — `advisor_room` залежав від `advisor`, а не від студента. Підсумок William Kent (1983) охоплює всі три: кожен не-ключовий attribute має давати факт про **«ключ, увесь ключ і нічого, окрім ключа.»**",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The ladder in one table. The right column maps each form onto Kent’s phrase.',
            uk: 'Драбина в одній таблиці. Права колонка зіставляє кожну форму з фразою Kent.',
          },
          head: [
            { en: 'Form', uk: 'Форма' },
            { en: 'Rule (informal)', uk: 'Правило (неформально)' },
            { en: 'Removes', uk: 'Прибирає' },
            { en: 'Kent (1983)', uk: 'Kent (1983)' },
          ],
          rows: [
            [
              { en: '1NF', uk: '1NF' },
              { en: 'Atomic values; no repeating groups; a key exists', uk: 'Атомарні значення; без repeating groups; ключ існує' },
              { en: 'Multi-valued cells', uk: 'Багатозначні клітинки' },
              { en: 'the key exists', uk: 'ключ існує' },
            ],
            [
              { en: '2NF', uk: '2NF' },
              { en: 'No non-key attribute depends on part of a composite key', uk: 'Жоден не-ключовий attribute не залежить від частини складеного ключа' },
              { en: 'Partial dependencies', uk: 'Partial dependencies' },
              { en: '…the whole key', uk: '…увесь ключ' },
            ],
            [
              { en: '3NF', uk: '3NF' },
              { en: 'No non-key attribute depends on another non-key attribute', uk: 'Жоден не-ключовий attribute не залежить від іншого не-ключового' },
              { en: 'Transitive dependencies', uk: 'Transitive dependencies' },
              { en: '…and nothing but the key', uk: '…і нічого, окрім ключа' },
            ],
            [
              { en: 'BCNF', uk: 'BCNF' },
              { en: 'Every determinant of a non-trivial FD is a candidate key', uk: 'Кожен determinant нетривіальної FD є candidate key' },
              { en: 'The 3NF residue (overlapping keys)', uk: 'Залишок 3NF (перекривні ключі)' },
              { en: 'a stricter 3NF', uk: 'суворіша 3NF' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: '2NF only bites composite keys', uk: '2NF кусає лише складені ключі' },
          md: {
            en: "If your table has a single-column primary key — say a surrogate `id` — then *no* attribute can depend on “part” of it, so the table is automatically in 2NF and you effectively jump from 1NF to 3NF. This is why surrogate keys feel like they sidestep normalization. They do not: **transitive** dependencies (3NF) still appear whenever one non-key column determines another (`country_id → country_name` sitting in a `users` table). The surrogate key removes the 2NF trap, never the 3NF one.",
            uk: "Якщо в таблиці primary key з однієї колонки — скажімо, surrogate `id` — то *жоден* attribute не може залежати від «частини» його, тож таблиця автоматично у 2NF, і ви фактично стрибаєте з 1NF у 3NF. Тому surrogate keys ніби обходять нормалізацію. Не обходять: **transitive** dependencies (3NF) зʼявляються щоразу, коли одна не-ключова колонка визначає іншу (`country_id → country_name` у таблиці `users`). Surrogate key прибирає пастку 2NF, але ніколи — 3NF.",
          },
        },
      ],
    },
    {
      id: 'bcnf',
      title: { en: "BCNF: when 3NF isn't enough", uk: 'BCNF: коли 3NF недостатньо' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Third normal form leaves one small loophole. Its rule forgives a dependency whose target is a **prime** attribute (one that is part of *some* candidate key). **Boyce-Codd normal form (BCNF)** closes it with a single, stricter sentence: **every determinant of a non-trivial functional dependency must be a candidate key.** The loophole only opens when a table has **overlapping candidate keys**, so most schemas in 3NF are already in BCNF and never notice the difference.",
            uk: "Третя нормальна форма лишає одну маленьку шпарину. Її правило пробачає залежність, чия ціль — **prime** attribute (той, що входить до *якогось* candidate key). **Boyce-Codd normal form (BCNF)** закриває її одним суворішим реченням: **кожен determinant нетривіальної functional dependency має бути candidate key.** Шпарина відкривається лише коли таблиця має **перекривні candidate keys**, тож більшість схем у 3NF уже в BCNF і різниці не помічають.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The classic violation. One relation, two overlapping candidate keys; the FD instructor → course has a determinant that is not a key.',
            uk: 'Класичне порушення. Один relation, два перекривні candidate keys; FD instructor → course має determinant, що не є ключем.',
          },
          head: [
            { en: 'Fact', uk: 'Факт' },
            { en: 'In teaches(student, course, instructor)', uk: 'У teaches(student, course, instructor)' },
          ],
          rows: [
            [
              { en: 'Rule: a student takes a course from one instructor', uk: 'Правило: студент бере course в одного instructor' },
              { en: '(student, course) → instructor', uk: '(student, course) → instructor' },
            ],
            [
              { en: 'Rule: each instructor teaches one course', uk: 'Правило: кожен instructor викладає один course' },
              { en: 'instructor → course', uk: 'instructor → course' },
            ],
            [
              { en: 'Candidate keys', uk: 'Candidate keys' },
              { en: '(student, course) and (student, instructor)', uk: '(student, course) і (student, instructor)' },
            ],
            [
              { en: 'Why it breaks BCNF (but passes 3NF)', uk: 'Чому ламає BCNF (але проходить 3NF)' },
              { en: "instructor is a determinant yet not a candidate key; course is prime, so 3NF forgives it", uk: 'instructor — determinant, але не candidate key; course є prime, тож 3NF це пробачає' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "The fix is to decompose `teaches` into `{instructor → course}` and `{student, instructor}`: now every determinant (`instructor`, then the composite key) is a candidate key of its table. But notice the cost — the original FD `(student, course) → instructor` is no longer enforced by a single table; you have traded a redundancy for a **dependency you can no longer check locally**. That trade is why BCNF is not always the goal.",
            uk: "Виправлення — розкласти `teaches` на `{instructor → course}` і `{student, instructor}`: тепер кожен determinant (`instructor`, далі складений ключ) є candidate key своєї таблиці. Але зверніть увагу на ціну — оригінальну FD `(student, course) → instructor` більше не забезпечує одна таблиця; ви проміняли надмірність на **залежність, яку вже не перевірити локально**. Саме цей розмін — причина, чому BCNF не завжди мета.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: '3NF is the working target', uk: '3NF — робоча мета' },
          md: {
            en: "In practice you aim for **3NF** and reach for BCNF only when overlapping candidate keys actually create an anomaly. The reason is **dependency preservation**: every relation has a 3NF decomposition that is both lossless and keeps all FDs checkable, but a BCNF decomposition sometimes cannot preserve a dependency (as above). When that happens, many teams deliberately **stay at 3NF** and enforce the stray dependency another way — a trigger or a constraint — rather than lose the ability to check it. Know BCNF; don't worship it.",
            uk: "На практиці ви цілитеся в **3NF** і тягнетеся до BCNF лише коли перекривні candidate keys справді створюють аномалію. Причина — **dependency preservation**: кожен relation має 3NF-декомпозицію, що є водночас lossless і лишає всі FDs перевірюваними, а BCNF-декомпозиція інколи не може зберегти залежність (як вище). Коли так стається, багато команд свідомо **лишаються на 3NF** і забезпечують відбиту залежність інакше — trigger чи constraint — аби не втратити здатність її перевіряти. Знайте BCNF; не поклоняйтеся їй.",
          },
        },
      ],
    },
    {
      id: 'denormalization',
      title: { en: 'Denormalization on purpose', uk: 'Денормалізація свідомо' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Normalization optimizes for **writes and integrity**: one place to change a fact, so it can never be half-changed. Reads pay the bill — answering “show each student's name, courses, and advisor's room” now means joining four tables. **Denormalization** is the deliberate reverse: copy a fact back into a second place to make a hot read cheap — a cached `author_name` on a post, a maintained `comment_count`, a nightly rollup table. The operative word is **deliberate**. You are knowingly reintroducing the exact redundancy normalization removed, and signing up to keep the copies in sync yourself.",
            uk: "Нормалізація оптимізує **записи та цілісність**: одне місце, щоб змінити факт, тож його неможливо змінити наполовину. Платять читання — відповісти «покажи імʼя кожного студента, його courses і кабінет advisor» тепер означає join чотирьох таблиць. **Денормалізація** — свідомий зворотний хід: скопіювати факт назад у друге місце, щоб гаряче читання було дешевим — кешований `author_name` на пості, підтримуваний `comment_count`, нічна rollup-таблиця. Ключове слово — **свідомо**. Ви умисно повертаєте саме ту надмірність, яку прибрала нормалізація, і берете на себе синхронізацію копій.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Normalized', uk: 'Нормалізована' },
          b: { en: 'Denormalized', uk: 'Денормалізована' },
          rows: [
            [
              { en: 'Optimizes for', uk: 'Оптимізує' },
              { en: 'Writes & integrity', uk: 'Записи та цілісність' },
              { en: 'Reads (fewer joins)', uk: 'Читання (менше joins)' },
            ],
            [
              { en: 'Redundancy', uk: 'Надмірність' },
              { en: 'None — one fact, one place', uk: 'Немає — один факт, одне місце' },
              { en: 'Deliberate copies', uk: 'Свідомі копії' },
            ],
            [
              { en: 'A write', uk: 'Запис' },
              { en: 'Touches one row', uk: 'Зачіпає один рядок' },
              { en: 'Must update every copy', uk: 'Має оновити кожну копію' },
            ],
            [
              { en: 'Main risk', uk: 'Головний ризик' },
              { en: 'More joins on read', uk: 'Більше joins на читанні' },
              { en: 'Copies drift out of sync', uk: 'Копії розходяться' },
            ],
            [
              { en: 'Use when', uk: 'Коли застосовувати' },
              { en: 'Default — OLTP, correctness-critical', uk: 'За замовчуванням — OLTP, критична коректність' },
              { en: 'A measured read hotspot, with a refresh path', uk: 'Виміряний hotspot читання, з механізмом оновлення' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Every copy is a liability you now own', uk: 'Кожна копія — це зобовʼязання, яке тепер ваше' },
          md: {
            en: "A denormalized value is a bug waiting to happen: the moment the source changes and the copy does not, your data lies. So denormalize **only after measuring** that the normalized read is genuinely too slow, keep the normalized tables as the **source of truth**, and define exactly how the copy stays fresh — a trigger, a materialized view (M11), or an idempotent job (M34). Premature denormalization is just redundancy with extra steps and a future incident attached.",
            uk: "Денормалізоване значення — це баг, що чекає нагоди: щойно джерело зміниться, а копія ні — ваші дані брешуть. Тож денормалізуйте **лише після вимірювання**, що нормалізоване читання справді занадто повільне, тримайте нормалізовані таблиці як **джерело істини** й точно визначте, як копія лишається свіжою — trigger, materialized view (M11) чи ідемпотентна задача (M34). Передчасна денормалізація — це просто надмірність із зайвими кроками й майбутнім інцидентом на додачу.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "So the whole module collapses to one line you can carry everywhere: **one fact, one place — until read performance makes you copy it deliberately, and you own the copy.** Normalize by default because correctness is the hard part to retrofit; denormalize as a conscious, measured exception, never as a first move.",
            uk: "Тож увесь модуль згортається в один рядок, який можна нести всюди: **один факт — одне місце, доки продуктивність читання не змусить свідомо скопіювати його, і ви володієте копією.** Нормалізуйте за замовчуванням, бо коректність — найважче допасувати згодом; денормалізуйте як свідомий, виміряний виняток, ніколи як перший крок.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Normalization is driven by functional dependencies: arrange tables so every fact depends on the key, so each fact lives in exactly one place.',
      uk: 'Нормалізацію веде functional dependency: розташуйте таблиці так, щоб кожен факт залежав від ключа, тож кожен факт жив рівно в одному місці.',
    },
    {
      en: '1NF = atomic values (no repeating groups); 2NF = no partial dependency on part of a composite key; 3NF = no transitive dependency between non-key attributes.',
      uk: '1NF = атомарні значення (без repeating groups); 2NF = без partial dependency на частину складеного ключа; 3NF = без transitive dependency між не-ключовими attributes.',
    },
    {
      en: "Kent's summary ties it together: every non-key attribute must depend on the key, the whole key, and nothing but the key (Kent, 1983).",
      uk: 'Підсумок Kent звʼязує все: кожен не-ключовий attribute має залежати від ключа, усього ключа й нічого, окрім ключа (Kent, 1983).',
    },
    {
      en: 'BCNF is stricter than 3NF — every determinant must be a candidate key — and matters mainly with overlapping candidate keys; 3NF is the usual practical target because it preserves dependencies.',
      uk: 'BCNF суворіша за 3NF — кожен determinant має бути candidate key — і важить переважно за перекривних candidate keys; 3NF — звична практична мета, бо зберігає залежності.',
    },
    {
      en: 'Denormalization trades write cost and consistency risk for read speed; do it only after measuring, keep a source of truth, and define how copies stay fresh.',
      uk: 'Денормалізація міняє вартість запису й ризик неузгодженості на швидкість читання; робіть це лише після вимірювання, тримайте джерело істини й визначте, як копії лишаються свіжими.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Treating 2NF/3NF as exam trivia', uk: 'Вважати 2NF/3NF екзаменаційною дрібницею' },
      body: {
        en: 'The anomalies they prevent are real production bugs: a price changed in one row and left stale in a hundred others, or a fact lost the moment its last carrying row is deleted. The normal forms are a checklist against silent corruption, not an academic ritual.',
        uk: 'Аномалії, яким вони запобігають, — реальні продакшн-баги: ціна, змінена в одному рядку й лишена застарілою в сотні інших, або факт, втрачений щойно видалено його останній носійний рядок. Normal forms — це чек-лист проти тихого пошкодження, а не академічний ритуал.',
      },
    },
    {
      title: { en: 'Over-normalizing, then never measuring', uk: 'Перенормалізувати й ніколи не вимірювати' },
      body: {
        en: 'Splitting into many tiny tables can turn every read into a five-way join. Normalization is the default, not a religion: keep it as the source of truth, but where a measured read is too slow, denormalize that path with evidence — do not shred a schema into fragments on principle.',
        uk: 'Розбиття на багато крихітних таблиць може зробити кожне читання пʼятиразовим join. Нормалізація — за замовчуванням, а не релігія: тримайте її джерелом істини, але де виміряне читання надто повільне, денормалізуйте той шлях із доказами — не дрібніть схему на фрагменти з принципу.',
      },
    },
    {
      title: { en: 'Denormalizing without an update path', uk: 'Денормалізувати без механізму оновлення' },
      body: {
        en: 'Copying a value for speed and then never keeping it in sync is the classic way to ship inconsistent data. If you duplicate, you must own the refresh — a trigger, a materialized view, or an idempotent job — and treat the normalized table as authoritative.',
        uk: 'Скопіювати значення заради швидкості й потім ніколи не синхронізувати — класичний спосіб відвантажити неузгоджені дані. Якщо дублюєте, мусите володіти оновленням — trigger, materialized view чи ідемпотентна задача — і вважати нормалізовану таблицю авторитетною.',
      },
    },
  ],
  interview: [
    {
      level: 'middle',
      q: {
        en: 'Define 1NF, 2NF and 3NF — one sentence each.',
        uk: 'Визначте 1NF, 2NF і 3NF — по одному реченню.',
      },
      a: {
        en: '1NF: values are atomic — no lists or repeating groups — and the table has a key. 2NF: it is in 1NF and no non-key attribute depends on only part of a composite key (no partial dependencies), which only matters when the key is composite. 3NF: it is in 2NF and no non-key attribute depends on another non-key attribute (no transitive dependencies). The one-line memory hook is Kent\'s: every non-key attribute depends on the key, the whole key, and nothing but the key.',
        uk: '1NF: значення атомарні — без списків чи repeating groups — і таблиця має ключ. 2NF: вона у 1NF і жоден не-ключовий attribute не залежить лише від частини складеного ключа (без partial dependencies), що важить лише за складеного ключа. 3NF: вона у 2NF і жоден не-ключовий attribute не залежить від іншого не-ключового (без transitive dependencies). Однорядкова памʼятка від Kent: кожен не-ключовий attribute залежить від ключа, усього ключа й нічого, окрім ключа.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Give a concrete anomaly that 3NF prevents but a denormalized table allows.',
        uk: 'Наведіть конкретну аномалію, якій 3NF запобігає, а денормалізована таблиця дозволяє.',
      },
      a: {
        en: "Take an enrollments table that stores advisor_room on every row. That is a transitive dependency (advisor_room depends on advisor, not on the student/course key), and it creates an update anomaly: when an advisor moves office you must rewrite every matching row, and if one is missed the table reports two different rooms for the same advisor. 3NF stores advisor_room exactly once in an advisors table, so the move is a single-row update and the inconsistency is structurally impossible. A denormalized design that keeps the copy for read speed reopens exactly this anomaly — which is why it needs a defined refresh.",
        uk: 'Візьміть таблицю enrollments, що зберігає advisor_room у кожному рядку. Це transitive dependency (advisor_room залежить від advisor, а не від ключа student/course) і створює update-аномалію: коли advisor переїжджає, ви мусите переписати кожен відповідний рядок, а пропустивши один — таблиця повідомляє два різні кабінети для того самого advisor. 3NF зберігає advisor_room рівно раз у таблиці advisors, тож переїзд — це оновлення одного рядка, а неузгодженість структурно неможлива. Денормалізований дизайн, що тримає копію заради швидкості читання, знову відкриває саме цю аномалію — тому й потрібен визначений механізм оновлення.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'When would you deliberately denormalize, and how do you keep it safe?',
        uk: 'Коли б ви свідомо денормалізували і як убезпечити це?',
      },
      a: {
        en: 'Only for a read hotspot proven by measurement — a high-traffic feed that needs a comment_count, a listing that joins five tables on every page load, an analytics rollup. The safeguards are always the same: keep the normalized tables as the single source of truth; derive the copy through one well-defined path — a trigger, a materialized view, or an idempotent batch job — so it can be rebuilt from scratch; and make the refresh idempotent so a retry cannot corrupt the count. A related judgment call is dependency preservation: just as you sometimes stay at 3NF rather than take a non-dependency-preserving BCNF decomposition, you accept controlled redundancy when the alternative costs more than it saves — but always consciously, with the source of truth intact.',
        uk: 'Лише для hotspot читання, доведеного вимірюванням — стрічка з високим трафіком, якій треба comment_count, лістинг, що join пʼять таблиць на кожному завантаженні, аналітичний rollup. Запобіжники завжди однакові: тримайте нормалізовані таблиці єдиним джерелом істини; виводьте копію через один чітко визначений шлях — trigger, materialized view чи ідемпотентну batch-задачу — щоб її можна було перебудувати з нуля; і зробіть оновлення ідемпотентним, аби повтор не пошкодив лічильник. Споріднене рішення — dependency preservation: як іноді лишаєтесь на 3NF замість BCNF-декомпозиції, що не зберігає залежності, так приймаєте контрольовану надмірність, коли альтернатива коштує більше, ніж економить — але завжди свідомо, зберігаючи джерело істини.',
      },
    },
  ],
  seeAlso: ['m6-er-modeling', 'm8-keys-constraints', 'm4-relational-model', 'm11-views-procedural', 'm34-performance'],
  sources: [
    {
      title: 'E. F. Codd — A Relational Model of Data for Large Shared Data Banks (CACM, 1970; introduced normalization / 1NF)',
      url: 'https://dl.acm.org/doi/10.1145/362384.362685',
    },
    {
      title: 'E. F. Codd — Normalized Data Base Structure: A Brief Tutorial (ACM SIGFIDET, 1971)',
      url: 'https://dl.acm.org/doi/10.1145/1734714.1734716',
    },
    {
      title: 'William Kent — A Simple Guide to Five Normal Forms in Relational Database Theory (CACM 26(2):120-125, 1983)',
      url: 'https://dl.acm.org/doi/10.1145/358024.358054',
    },
    {
      title: 'Boyce–Codd normal form — definition (every determinant is a candidate key) & the 3NF gap',
      url: 'https://en.wikipedia.org/wiki/Boyce%E2%80%93Codd_normal_form',
    },
    {
      title: 'PostgreSQL 18 Documentation — Constraints (the keys & foreign keys a normalized schema relies on)',
      url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
    },
  ],
};
