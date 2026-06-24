import type { Module } from '../types';

/*
 * M18 · Isolation levels & anomalies — Section IV (S9). Authored EN first, UA second; technical
 * terms stay English in both. Facts web-verified 2026-06-24 (see `sources`), primarily PG 18 docs
 * 13.2 Transaction Isolation + Table 13.1:
 *  - The SQL standard defines 4 levels via 3 phenomena (dirty / non-repeatable / phantom read) that
 *    must NOT occur at each level; Serializable forbids all. PostgreSQL implements 3 distinct levels:
 *    Read Uncommitted is mapped to Read Committed (PG NEVER returns dirty reads).
 *  - PG Read Committed: a fresh snapshot per statement → allows non-repeatable + phantom reads.
 *  - PG Repeatable Read = Snapshot Isolation: one snapshot fixed at txn start → prevents
 *    non-repeatable AND phantom reads (STRONGER than the standard, which allows phantoms at RR);
 *    a conflicting update aborts with "could not serialize access due to concurrent update" (40001)
 *    → prevents the read-modify-write lost update. BUT Snapshot Isolation STILL ALLOWS write-skew.
 *  - PG Serializable = SSI (Serializable Snapshot Isolation, since 9.1; Cahill/Fekete/Röhm, Ports &
 *    Grittner): adds rw-dependency tracking via predicate locks (SIReadLock, non-blocking); detects
 *    serialization anomalies (incl. write-skew) and rolls one txn back with 40001. Apps MUST retry.
 *  - Write-skew (the docs' class/value SUM example): two txns read an overlapping set, write disjoint
 *    rows; each is individually valid but together they violate an invariant. The canonical SI gap.
 *  - The phenomena that distinguish SI from the lock-based levels were formalized only after the SQL
 *    standard (Berenson et al. 1995, "A Critique of ANSI SQL Isolation Levels").
 * Signature module: hero ★ Isolation anomalies sim (key 'isolation') + figure 'level-anomaly-matrix'.
 * PostgreSQL stable 18.4; 19 Beta 1.
 */
export const m18: Module = {
  id: 'm18-isolation',
  num: 18,
  section: 's4-transactions',
  order: 2,
  level: 'staff',
  signature: true,
  title: { en: 'Isolation levels & anomalies', uk: 'Isolation levels та аномалії' },
  tagline: {
    en: 'Dirty/non-repeatable/phantom/lost-update/write-skew; the SQL levels vs what engines really do.',
    uk: 'Dirty/non-repeatable/phantom/lost-update/write-skew; рівні SQL проти того, що движки роблять насправді.',
  },
  readMins: 15,
  mentalModel: {
    en: "Isolation is the illusion that you're alone — each level buys more of it for more cost.",
    uk: 'Isolation — це ілюзія, що ви самі; кожен рівень купує її більше за більшу ціну.',
  },
  topics: [
    {
      id: 'the-anomalies',
      title: { en: 'The anomalies', uk: 'Аномалії' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Run transactions one at a time and nothing can go wrong; the trouble starts when they **interleave**. *Isolation* is the guarantee that concurrent transactions don't corrupt each other's view — and it comes in degrees, because perfect isolation (everyone runs as if alone) is expensive. The degrees are defined by which **anomalies** they let through. There are five worth knowing. A **dirty read** sees another transaction's *uncommitted* write — a value that might be rolled back. A **non-repeatable read** re-reads one row and finds it *changed* by a committed transaction. A **phantom read** re-runs a *query* and finds *new rows* match. A **lost update** is two read-modify-write transactions where one silently overwrites the other. And **write-skew** is the subtle one: two transactions read an overlapping set, each writes a *different* row, each is valid alone — but together they break an invariant.",
            uk: "Виконуйте транзакції по одній — і нічого не зламається; біда починається, коли вони **переплітаються**. *Isolation* — це гарантія, що конкурентні транзакції не псують уявлення одна одної — і вона буває різного ступеня, бо ідеальна isolation (кожен працює, ніби сам) дорога. Ступені визначаються тим, які **аномалії** вони пропускають. Варто знати пʼять. **Dirty read** бачить *незафіксований* запис іншої транзакції — значення, яке можуть відкотити. **Non-repeatable read** перечитує один рядок і знаходить його *зміненим* зафіксованою транзакцією. **Phantom read** перезапускає *запит* і знаходить, що збігаються *нові рядки*. **Lost update** — це дві read-modify-write транзакції, де одна тихо перезаписує іншу. А **write-skew** — найхитріша: дві транзакції читають перетинну множину, кожна пише *інший* рядок, кожна валідна сама — але разом вони ламають інваріант.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Don't just read the definitions — drive them. The sim runs a fixed two-transaction schedule for each anomaly; pick a level and watch the verdict flip between *occurs* and *prevented*. The most important thing it shows is that the levels are not a vague \"more is safer\" scale: each anomaly disappears at a *specific* level, and one of them — write-skew — survives all the way up to Serializable.",
            uk: "Не просто читайте визначення — керуйте ними. Симуляція виконує фіксований розклад двох транзакцій для кожної аномалії; оберіть рівень і дивіться, як вердикт перемикається між *стається* і *запобігнуто*. Найважливіше, що вона показує: рівні — це не розмита шкала «більше = безпечніше»: кожна аномалія зникає на *конкретному* рівні, а одна — write-skew — доживає аж до Serializable.",
          },
        },
        {
          kind: 'sim',
          sim: 'isolation',
        },
        {
          kind: 'table',
          caption: {
            en: 'The five anomalies and the lowest PostgreSQL level that stops each.',
            uk: 'Пʼять аномалій і найнижчий рівень PostgreSQL, що зупиняє кожну.',
          },
          head: [
            { en: 'Anomaly', uk: 'Аномалія' },
            { en: 'What goes wrong', uk: 'Що йде не так' },
            { en: 'Lowest level that prevents it (PG)', uk: 'Найнижчий рівень, що запобігає (PG)' },
          ],
          rows: [
            [
              { en: 'Dirty read', uk: 'Dirty read' },
              { en: "Reads another txn's uncommitted write", uk: 'Читає незафіксований запис іншої txn' },
              { en: 'Read Committed (PG never allows it at any level)', uk: 'Read Committed (PG не дозволяє на жодному рівні)' },
            ],
            [
              { en: 'Non-repeatable read', uk: 'Non-repeatable read' },
              { en: 'Re-reading one row returns a changed value', uk: 'Повторне читання рядка дає змінене значення' },
              { en: 'Repeatable Read', uk: 'Repeatable Read' },
            ],
            [
              { en: 'Phantom read', uk: 'Phantom read' },
              { en: 'Re-running a query returns new matching rows', uk: 'Повторний запит дає нові відповідні рядки' },
              { en: 'Repeatable Read (PG; standard says Serializable)', uk: 'Repeatable Read (PG; стандарт каже Serializable)' },
            ],
            [
              { en: 'Lost update', uk: 'Lost update' },
              { en: 'Two read-modify-writes; one overwrites the other', uk: 'Два read-modify-write; один перезаписує інший' },
              { en: 'Repeatable Read (aborts the loser with 40001)', uk: 'Repeatable Read (скасовує програвшого з 40001)' },
            ],
            [
              { en: 'Write-skew', uk: 'Write-skew' },
              { en: 'Disjoint writes jointly break a multi-row invariant', uk: 'Неперетинні записи разом ламають багаторядковий інваріант' },
              { en: 'Serializable (SSI) only', uk: 'Лише Serializable (SSI)' },
            ],
          ],
        },
      ],
    },
    {
      id: 'the-levels',
      title: { en: 'The SQL standard levels', uk: 'Рівні SQL-стандарту' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The SQL standard defines **four** isolation levels — **Read Uncommitted**, **Read Committed**, **Repeatable Read**, **Serializable** — but it defines the lower three *negatively*: by which of three phenomena (dirty, non-repeatable, phantom read) must **not** occur. Serializable is defined positively and strongly: any concurrent execution must produce the same effect as running the transactions *one at a time in some order*. Because of that definition, none of the phenomena can appear at Serializable — if the result must match a serial execution, you cannot observe any interaction artifact at all. The matrix below is the canonical map.",
            uk: "SQL-стандарт визначає **чотири** рівні isolation — **Read Uncommitted**, **Read Committed**, **Repeatable Read**, **Serializable** — але нижчі три він визначає *негативно*: тим, які з трьох явищ (dirty, non-repeatable, phantom read) **не** мають ставатися. Serializable визначено позитивно й сильно: будь-яке конкурентне виконання має давати той самий ефект, що й виконання транзакцій *по одній у якомусь порядку*. Через це визначення жодне явище не може зʼявитися на Serializable — якщо результат мусить збігатися з серійним виконанням, ви взагалі не побачите артефакту взаємодії. Матриця нижче — канонічна карта.",
          },
        },
        {
          kind: 'figure',
          fig: 'level-anomaly-matrix',
          caption: {
            en: "PostgreSQL's three real levels against the anomalies (Read Uncommitted is mapped to Read Committed). Note the two PG-specific facts: dirty reads never occur, and Repeatable Read prevents phantoms. The boxed cell — write-skew at Repeatable Read — is the Snapshot Isolation gap.",
            uk: 'Три реальні рівні PostgreSQL проти аномалій (Read Uncommitted зведено до Read Committed). Зверніть увагу на два PG-специфічні факти: dirty reads ніколи не стаються, а Repeatable Read запобігає phantom-ам. Виділена клітинка — write-skew на Repeatable Read — це прогалина Snapshot Isolation.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Read the standard's table carefully and you see it specifies a *minimum*: each level says which phenomena are forbidden, not which are required. That leaves engines free to be **stricter** than the letter of the standard — and PostgreSQL is. It maps Read Uncommitted onto Read Committed (so a dirty read is impossible everywhere), and its Repeatable Read forbids phantom reads even though the standard permits them at that level. So \"Repeatable Read\" on two different databases can mean materially different things; the level *names* are standardized, the exact guarantees are not.",
            uk: "Уважно прочитайте таблицю стандарту — і побачите, що вона задає *мінімум*: кожен рівень каже, які явища заборонені, а не які обовʼязкові. Це лишає движкам свободу бути **суворішими** за букву стандарту — і PostgreSQL такий. Він зводить Read Uncommitted до Read Committed (тож dirty read неможливий усюди), а його Repeatable Read забороняє phantom reads, хоч стандарт дозволяє їх на цьому рівні. Тож «Repeatable Read» на двох різних базах може означати суттєво різне; *назви* рівнів стандартизовані, точні гарантії — ні.",
          },
        },
      ],
    },
    {
      id: 'standard-vs-reality',
      title: { en: 'Standard vs reality', uk: 'Стандарт проти реальності' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The deepest gap between the textbook and reality is the difference between **Snapshot Isolation** and true **serializability**. PostgreSQL's Repeatable Read *is* Snapshot Isolation: every statement in the transaction reads from one consistent snapshot taken at the start, so reads are perfectly stable — no dirty, non-repeatable, or phantom reads. That feels like serializability, and for most workloads it is indistinguishable. But Snapshot Isolation has one blind spot the ANSI phenomena never named, because it was formalized only *after* the standard: **write-skew**.",
            uk: "Найглибша прірва між підручником і реальністю — різниця між **Snapshot Isolation** і справжньою **serializability**. Repeatable Read у PostgreSQL *і є* Snapshot Isolation: кожен statement транзакції читає з одного узгодженого snapshot, взятого на старті, тож читання ідеально стабільні — жодних dirty, non-repeatable чи phantom reads. Це відчувається як serializability, і для більшості навантажень нерозрізнюване. Але в Snapshot Isolation є одна сліпа пляма, яку ANSI-явища ніколи не назвали, бо її формалізували лише *після* стандарту: **write-skew**.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Why does Snapshot Isolation miss it? Because SI only forces a conflict when two transactions write the **same row**. In write-skew the two transactions write **different** rows — each takes a doctor off call, but a *different* doctor — so there is no write-write conflict to detect. Each reads a snapshot showing the invariant satisfied (two on call), each makes a locally valid change, and both commit. The result (zero on call) corresponds to no serial order: if they had run one at a time, the second would have seen one doctor left and refused. That is the precise sense in which SI is not serializable, and it is not a contrived edge case — overlapping read sets with disjoint writes are common in scheduling, inventory, and balance-constraint logic.",
            uk: "Чому Snapshot Isolation її пропускає? Бо SI змушує конфлікт лише коли дві транзакції пишуть **той самий рядок**. У write-skew дві транзакції пишуть **різні** рядки — кожна знімає лікаря з чергування, але *іншого* — тож немає write-write конфлікту, який можна виявити. Кожна читає snapshot, де інваріант виконано (двоє на чергуванні), кожна робить локально валідну зміну, і обидві фіксуються. Результат (нуль на чергуванні) не відповідає жодному серійному порядку: якби вони виконались по одній, друга побачила б, що лишився один лікар, і відмовила б. Це і є точний сенс, у якому SI не serializable, і це не надуманий випадок — перетинні множини читання з неперетинними записами поширені в плануванні, складах і логіці обмежень балансу.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: "PostgreSQL's Repeatable Read is Snapshot Isolation — name a thing for what it does", uk: 'Repeatable Read у PostgreSQL — це Snapshot Isolation' },
          md: {
            en: "If you carry one fact out of this module: in PostgreSQL, **Repeatable Read = Snapshot Isolation**, which is *stronger* than the standard's Repeatable Read (it kills phantoms) but *weaker* than Serializable (it permits write-skew). Other systems split these: some offer \"Snapshot Isolation\" and \"Repeatable Read\" as distinct levels with different behavior. So never assume a level name guarantees the same thing across engines — check what the engine's docs say each level actually prevents. The behavior, not the label, is the contract.",
            uk: "Якщо винести з модуля один факт: у PostgreSQL **Repeatable Read = Snapshot Isolation**, що *сильніше* за Repeatable Read стандарту (вбиває phantom-и), але *слабше* за Serializable (дозволяє write-skew). Інші системи їх розділяють: дехто пропонує «Snapshot Isolation» і «Repeatable Read» як окремі рівні з різною поведінкою. Тож ніколи не припускайте, що назва рівня гарантує те саме між движками — перевіряйте в документації, що саме кожен рівень запобігає. Контракт — це поведінка, а не ярлик.",
          },
        },
      ],
    },
    {
      id: 'serializable',
      title: { en: 'Serializable & the cost of correctness', uk: 'Serializable і ціна коректності' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "To close the write-skew gap you need true **Serializable**, and there are two classic ways to get it. The old way is **Strict Two-Phase Locking (S2PL)**: take read and write locks and hold them to commit, so conflicting transactions block each other. It is correct but it serializes by *waiting*, which crushes concurrency and risks deadlocks. PostgreSQL instead uses **Serializable Snapshot Isolation (SSI)** (since 9.1): it runs at full Snapshot-Isolation speed but additionally **monitors read/write dependencies** between concurrent transactions with non-blocking *predicate locks* (`SIReadLock`). When it spots a pattern that could not have arisen in any serial order, it aborts one transaction with a **serialization failure (SQLSTATE 40001)**. No extra blocking; correctness is bought with *retries* instead of *waits*.",
            uk: "Щоб закрити прогалину write-skew, потрібна справжня **Serializable**, і є два класичні способи її отримати. Старий — **Strict Two-Phase Locking (S2PL)**: брати read і write locks і тримати їх до commit, тож конфліктні транзакції блокують одна одну. Це коректно, але серіалізує *очікуванням*, що душить конкурентність і ризикує deadlocks. PostgreSQL натомість вживає **Serializable Snapshot Isolation (SSI)** (від 9.1): вона працює на повній швидкості Snapshot Isolation, але додатково **відстежує read/write-залежності** між конкурентними транзакціями неблокувальними *predicate locks* (`SIReadLock`). Помітивши патерн, що не міг виникнути в жодному серійному порядку, вона скасовує одну транзакцію з **serialization failure (SQLSTATE 40001)**. Жодного зайвого блокування; коректність купується *повторами*, а не *очікуванням*.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Repeatable Read (Snapshot Isolation)', uk: 'Repeatable Read (Snapshot Isolation)' },
          b: { en: 'Serializable (SSI)', uk: 'Serializable (SSI)' },
          rows: [
            [
              { en: 'Reads', uk: 'Читання' },
              { en: 'One stable snapshot from txn start', uk: 'Один стабільний snapshot зі старту txn' },
              { en: 'Same snapshot + read/write dependency tracking', uk: 'Той самий snapshot + відстеження read/write-залежностей' },
            ],
            [
              { en: 'Prevents', uk: 'Запобігає' },
              { en: 'Dirty / non-repeatable / phantom; lost update (by abort)', uk: 'Dirty / non-repeatable / phantom; lost update (скасуванням)' },
              { en: 'All of those + write-skew & other serialization anomalies', uk: 'Усе це + write-skew та інші serialization-аномалії' },
            ],
            [
              { en: 'Blocking', uk: 'Блокування' },
              { en: "Readers don't block; a conflicting update aborts (40001)", uk: 'Читачі не блокують; конфліктний update скасовується (40001)' },
              { en: 'No extra blocking; non-blocking predicate locks (SIReadLock)', uk: 'Без зайвого блокування; неблокувальні predicate locks (SIReadLock)' },
            ],
            [
              { en: 'You pay with', uk: 'Ви платите' },
              { en: 'Reasoning about multi-row invariants yourself', uk: 'Самостійним міркуванням про багаторядкові інваріанти' },
              { en: 'Monitoring overhead + more 40001 retries', uk: 'Накладними витратами моніторингу + більше 40001-повторів' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- The default is READ COMMITTED. Choose a stronger level per transaction:
BEGIN ISOLATION LEVEL SERIALIZABLE;
  -- enforce "at least one doctor on call" WITHOUT explicit locks:
  SELECT count(*) FROM doctors WHERE on_call;          -- read the invariant
  UPDATE doctors SET on_call = false WHERE name = 'Alice';
COMMIT;            -- may fail with SQLSTATE 40001 (serialization_failure)

-- Because of that, every Serializable (and updating Repeatable Read) transaction
-- needs a generalized RETRY LOOP in the application:
--   for attempt in 1..N:
--     try:   run the whole transaction;  break
--     catch SQLSTATE 40001:   ROLLBACK;  continue   -- retry from the top
--
-- Alternative at Read Committed: serialize by hand with a row lock —
SELECT * FROM doctors WHERE on_call FOR UPDATE;        -- blocks the other txn`,
          note: {
            en: 'Serializable buys correctness-by-default: if a transaction is correct run alone, it is correct in any concurrent mix — or it fails with 40001 and you retry. The price is the retry loop, which is mandatory, not optional.',
            uk: 'Serializable дає коректність-за-замовчуванням: якщо транзакція коректна сама, вона коректна в будь-якій конкурентній суміші — або падає з 40001, і ви повторюєте. Ціна — retry-цикл, який обовʼязковий, а не опційний.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'If you use Serializable, you must handle 40001 — everywhere', uk: 'Якщо вживаєте Serializable, мусите обробляти 40001 — усюди' },
          md: {
            en: "Serializable's guarantee comes with an obligation: **any** transaction can be aborted with `40001` at commit, and you cannot predict which. Without a generalized retry loop, those aborts surface to users as random failures. Practical rules: keep transactions short, declare them `READ ONLY` when possible (read-only txns rarely conflict and can often drop their predicate locks early), use a `READ ONLY DEFERRABLE` transaction for long-running reports (it waits for a safe snapshot, then never aborts), and watch the serialization-failure rate — a spike often means sequential scans taking coarse relation-level predicate locks, which an index can relieve. Serializable trades developer reasoning for operational retries; budget for both.",
            uk: "Гарантія Serializable приходить з обовʼязком: **будь-яку** транзакцію можуть скасувати з `40001` на commit, і ви не передбачите яку. Без узагальненого retry-циклу ці скасування виходять до користувачів випадковими збоями. Практичні правила: тримайте транзакції короткими, оголошуйте їх `READ ONLY`, коли можна (read-only txn рідко конфліктують і часто скидають predicate locks рано), вживайте `READ ONLY DEFERRABLE` для довгих звітів (вона чекає безпечного snapshot, тоді ніколи не скасовується), і слідкуйте за частотою serialization-failure — сплеск часто означає sequential scans, що беруть грубі relation-level predicate locks, які полегшить index. Serializable міняє міркування розробника на операційні повтори; закладайте бюджет на обидва.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "So the practical advice is a ladder: use the **lowest level that is still correct**. Most OLTP is fine on **Read Committed** with atomic single-statement updates (`SET value = value + 1`) and `SELECT … FOR UPDATE` on the few hotspots that need it. Step up to **Repeatable Read** when a transaction makes several reads that must agree (a report, a multi-statement computation). Reach for **Serializable** when correctness depends on an invariant spanning *multiple rows or queries* that you cannot express as a single-row constraint — exactly the write-skew shape — and you would rather pay retries than hand-place locks. The strongest level is the simplest to reason about and the most expensive to run; choosing well is the staff-level skill.",
            uk: "Тож практична порада — це драбина: вживайте **найнижчий рівень, який ще коректний**. Більшість OLTP добре на **Read Committed** з атомарними однооператорними update-ами (`SET value = value + 1`) і `SELECT … FOR UPDATE` на тих кількох hotspots, що цього потребують. Підніміться до **Repeatable Read**, коли транзакція робить кілька читань, що мусять узгоджуватися (звіт, багатооператорне обчислення). Тягніться до **Serializable**, коли коректність залежить від інваріанта, що охоплює *кілька рядків чи запитів*, який не виразити однорядковим constraint — саме форма write-skew — і ви радше платите повторами, ніж розставляєте locks вручну. Найсильніший рівень найпростіший для міркування й найдорожчий у роботі; добрий вибір — це staff-level навичка.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Five anomalies, in rising subtlety: dirty read (uncommitted data), non-repeatable read (a row changes), phantom read (the result set changes), lost update (one write overwrites another), write-skew (disjoint writes break a multi-row invariant).',
      uk: "Пʼять аномалій за зростанням підступності: dirty read (незафіксовані дані), non-repeatable read (рядок змінюється), phantom read (вибірка змінюється), lost update (один запис перезаписує інший), write-skew (неперетинні записи ламають багаторядковий інваріант).",
    },
    {
      en: 'The SQL standard defines levels by which phenomena must NOT occur (a minimum), so engines may be stricter. PostgreSQL implements three levels: Read Uncommitted is mapped to Read Committed, so PG never returns a dirty read.',
      uk: 'SQL-стандарт визначає рівні тим, які явища не мають ставатися (мінімум), тож движки можуть бути суворішими. PostgreSQL реалізує три рівні: Read Uncommitted зведено до Read Committed, тож PG ніколи не повертає dirty read.',
    },
    {
      en: "PostgreSQL's Repeatable Read IS Snapshot Isolation: one snapshot from txn start prevents non-repeatable AND phantom reads (stronger than the standard) and aborts a conflicting update with 40001 (no lost update). But Snapshot Isolation still allows write-skew.",
      uk: 'Repeatable Read у PostgreSQL — ЦЕ Snapshot Isolation: один snapshot зі старту txn запобігає non-repeatable І phantom reads (сильніше за стандарт) і скасовує конфліктний update з 40001 (без lost update). Але Snapshot Isolation досі дозволяє write-skew.',
    },
    {
      en: "Serializable closes the gap. PostgreSQL uses SSI (since 9.1): full snapshot speed plus non-blocking predicate locks that track read/write dependencies and abort one txn with SQLSTATE 40001 on a serialization anomaly. Correctness is bought with retries, not waits.",
      uk: 'Serializable закриває прогалину. PostgreSQL вживає SSI (від 9.1): повна швидкість snapshot плюс неблокувальні predicate locks, що відстежують read/write-залежності й скасовують одну txn з SQLSTATE 40001 на serialization-аномалії. Коректність купується повторами, а не очікуванням.',
    },
    {
      en: 'Use the lowest level that is still correct: Read Committed + atomic updates / FOR UPDATE for most OLTP; Repeatable Read for multi-read consistency; Serializable for multi-row invariants (the write-skew shape) — and then a 40001 retry loop is mandatory.',
      uk: 'Вживайте найнижчий рівень, що ще коректний: Read Committed + атомарні update-и / FOR UPDATE для більшості OLTP; Repeatable Read для узгодженості кількох читань; Serializable для багаторядкових інваріантів (форма write-skew) — і тоді retry-цикл на 40001 обовʼязковий.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Assuming a level name means the same thing everywhere', uk: 'Вважати, що назва рівня означає те саме всюди' },
      body: {
        en: "“Repeatable Read” is the trap. In PostgreSQL it is Snapshot Isolation and prevents phantom reads; under the SQL standard it does not; some engines offer Snapshot Isolation and Repeatable Read as separate levels. The level name is standardized but the guarantees are only a floor, so the same SET TRANSACTION ISOLATION LEVEL can behave differently across databases — and a query that was safe on one engine can exhibit an anomaly on another. Always verify what a given engine's level actually prevents rather than trusting the label.",
        uk: '«Repeatable Read» — це пастка. У PostgreSQL це Snapshot Isolation і запобігає phantom reads; за SQL-стандартом — ні; деякі движки пропонують Snapshot Isolation і Repeatable Read як окремі рівні. Назва рівня стандартизована, але гарантії — лише підлога, тож той самий SET TRANSACTION ISOLATION LEVEL може поводитися інакше між базами — і запит, безпечний на одному движку, може показати аномалію на іншому. Завжди перевіряйте, що саме рівень конкретного движка запобігає, а не довіряйте ярлику.',
      },
    },
    {
      title: { en: 'Trusting Snapshot Isolation to enforce a multi-row invariant', uk: 'Покладатися на Snapshot Isolation для багаторядкового інваріанта' },
      body: {
        en: 'Repeatable Read gives each transaction a perfectly stable snapshot, which feels airtight — so people assume it enforces business rules like "at least one doctor on call" or "the account never goes negative across these rows". It does not: write-skew slips through whenever two transactions read an overlapping set and write different rows. Either escalate those transactions to Serializable, or serialize by hand with explicit locks (SELECT … FOR UPDATE, advisory locks) so the conflict becomes a write-write conflict SI can see. Stable reads are not the same as a guaranteed invariant.',
        uk: 'Repeatable Read дає кожній транзакції ідеально стабільний snapshot, що здається герметичним — тож люди припускають, що він забезпечує бізнес-правила на кшталт «принаймні один лікар на чергуванні» чи «рахунок ніколи не йде в мінус по цих рядках». Ні: write-skew прослизає щоразу, коли дві транзакції читають перетинну множину й пишуть різні рядки. Або підніміть ці транзакції до Serializable, або серіалізуйте вручну явними locks (SELECT … FOR UPDATE, advisory locks), щоб конфлікт став write-write конфліктом, який SI бачить. Стабільні читання — це не те саме, що гарантований інваріант.',
      },
    },
    {
      title: { en: 'Using Serializable (or Repeatable Read) without a retry loop', uk: 'Вживати Serializable (чи Repeatable Read) без retry-циклу' },
      body: {
        en: 'Both levels can abort a transaction at commit with SQLSTATE 40001 — Repeatable Read on a concurrent update, Serializable on any detected serialization anomaly. This is by design, not a bug: the engine is telling you to try again. If the application has no generalized retry that rolls back and re-runs the whole transaction on 40001, those aborts become user-visible errors under load, and they cluster exactly when concurrency is highest. Treat 40001 as an expected, retryable outcome of these levels, and make the transactions idempotent so retrying is safe.',
        uk: 'Обидва рівні можуть скасувати транзакцію на commit із SQLSTATE 40001 — Repeatable Read на конкурентному update, Serializable на будь-якій виявленій serialization-аномалії. Це за задумом, не баг: движок каже спробувати знову. Якщо в застосунку немає узагальненого retry, що відкочує й перезапускає всю транзакцію на 40001, ці скасування стають видимими користувачу помилками під навантаженням, і вони купчаться саме тоді, коли конкурентність найвища. Трактуйте 40001 як очікуваний, повторюваний результат цих рівнів і робіть транзакції ідемпотентними, щоб повтор був безпечним.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Explain the difference between a non-repeatable read and a phantom read, and where each is prevented in PostgreSQL.',
        uk: 'Поясніть різницю між non-repeatable read і phantom read і де кожен запобігається в PostgreSQL.',
      },
      a: {
        en: "Both are about a transaction seeing different data when it reads twice, but they differ in what changes. A non-repeatable read is about a single existing row: the transaction reads row 7, another transaction updates and commits row 7, and when the first transaction re-reads row 7 it gets a different value. The row it already saw changed underneath it. A phantom read is about a set of rows matching a predicate: the transaction runs SELECT … WHERE price < 50 and gets two rows, another transaction inserts a third row that also matches and commits, and when the first transaction re-runs the same query it now gets three rows. No row it already read changed; instead a new row appeared in — or a row vanished from — the result set. So non-repeatable is an UPDATE/DELETE to a row you read; phantom is an INSERT/DELETE that changes which rows match a query. In PostgreSQL, Read Committed allows both, because it takes a fresh snapshot at the start of each statement, so any committed change between two statements is visible. Repeatable Read prevents both, because it pins one snapshot at transaction start and every statement reads from it — and here PostgreSQL is stronger than the SQL standard, which only requires phantoms to be prevented at Serializable. That extra strength comes from Repeatable Read being implemented as Snapshot Isolation. So the practical answer is: in PostgreSQL, move from Read Committed to Repeatable Read and both anomalies disappear together.",
        uk: "Обидва про те, що транзакція бачить різні дані, читаючи двічі, але різняться тим, що змінюється. Non-repeatable read — про один наявний рядок: транзакція читає рядок 7, інша транзакція оновлює й фіксує рядок 7, і коли перша перечитує рядок 7, отримує інше значення. Рядок, який вона вже бачила, змінився під нею. Phantom read — про множину рядків, що відповідають предикату: транзакція виконує SELECT … WHERE price < 50 й отримує два рядки, інша вставляє третій, що теж збігається, і фіксує, і коли перша перезапускає той самий запит, отримує три рядки. Жоден уже прочитаний рядок не змінився; натомість новий рядок зʼявився у вибірці (чи зник із неї). Тож non-repeatable — це UPDATE/DELETE рядка, який ви прочитали; phantom — це INSERT/DELETE, що змінює, які рядки збігаються із запитом. У PostgreSQL Read Committed дозволяє обидва, бо бере свіжий snapshot на старті кожного statement, тож будь-яка зафіксована зміна між двома statement видима. Repeatable Read запобігає обом, бо фіксує один snapshot на старті транзакції, і кожен statement читає з нього — і тут PostgreSQL сильніший за SQL-стандарт, який вимагає запобігати phantom-ам лише на Serializable. Ця додаткова сила йде від того, що Repeatable Read реалізовано як Snapshot Isolation. Тож практична відповідь: у PostgreSQL перейдіть з Read Committed на Repeatable Read — і обидві аномалії зникають разом.",
      },
    },
    {
      level: 'staff',
      q: {
        en: "What is write-skew, why doesn't Snapshot Isolation prevent it, and how does PostgreSQL's Serializable catch it?",
        uk: 'Що таке write-skew, чому Snapshot Isolation його не запобігає і як Serializable у PostgreSQL його ловить?',
      },
      a: {
        en: "Write-skew is a serialization anomaly where two concurrent transactions each read an overlapping set of rows, each writes a different row based on what it read, each transaction is individually consistent, but the combination violates an invariant that no serial execution would have allowed. The canonical example is an on-call constraint: at least one doctor must be on call, two are, and two transactions concurrently each take a different doctor off call. Each reads the count, sees two on call, decides it's safe to remove one, and updates its own doctor's row. Snapshot Isolation doesn't prevent it because SI only detects a conflict when two transactions write the same row — first-updater-wins on a shared row. Here the writes are to different rows, so there is no write-write conflict at all; each transaction reads from its own snapshot where the invariant still holds, neither sees the other's write, and both commit. The end state — zero on call — matches no serial order, because run one at a time the second transaction would have seen one doctor left and refused. PostgreSQL's Serializable catches it with Serializable Snapshot Isolation. On top of normal snapshot reads it tracks read/write dependencies between concurrent transactions using non-blocking predicate locks, which appear as SIReadLock — these record which data a transaction read so the engine knows if another transaction's write would have changed that read had it happened first. When it detects the specific dangerous structure (a transaction that is both read by one and writes against another, forming a cycle — a 'pivot'), it concludes the schedule isn't serializable and aborts one transaction with SQLSTATE 40001. Crucially this adds no blocking — the predicate locks don't make anyone wait and can't deadlock — so the cost is monitoring overhead plus the need to retry the aborted transaction. The retry then sees the committed change and refuses correctly. So SI misses write-skew because it's blind to disjoint writes over overlapping reads, and SSI restores serializability by watching the read/write dependencies SI ignores.",
        uk: "Write-skew — це serialization-аномалія, де дві конкурентні транзакції кожна читає перетинну множину рядків, кожна пише інший рядок на основі прочитаного, кожна окремо узгоджена, але комбінація порушує інваріант, який жодне серійне виконання не дозволило б. Канонічний приклад — обмеження чергування: принаймні один лікар має чергувати, чергують двоє, і дві транзакції конкурентно кожна знімає іншого лікаря. Кожна читає лічильник, бачить двох, вирішує, що безпечно зняти одного, і оновлює рядок свого лікаря. Snapshot Isolation цього не запобігає, бо SI виявляє конфлікт лише коли дві транзакції пишуть той самий рядок — first-updater-wins на спільному рядку. Тут записи в різні рядки, тож write-write конфлікту немає взагалі; кожна читає зі свого snapshot, де інваріант ще тримається, жодна не бачить запис іншої, і обидві фіксуються. Кінцевий стан — нуль на чергуванні — не збігається з жодним серійним порядком, бо по одній друга транзакція побачила б, що лишився один лікар, і відмовила б. Serializable у PostgreSQL ловить це через Serializable Snapshot Isolation. Поверх звичайних snapshot-читань вона відстежує read/write-залежності між конкурентними транзакціями неблокувальними predicate locks, що зʼявляються як SIReadLock — вони фіксують, які дані транзакція прочитала, щоб движок знав, чи запис іншої змінив би це читання, якби стався першим. Виявивши специфічну небезпечну структуру (транзакцію, яку одна читає, а інша перезаписує, утворюючи цикл — «pivot»), вона робить висновок, що розклад не serializable, і скасовує одну транзакцію з SQLSTATE 40001. Головне — це не додає блокування: predicate locks нікого не змушують чекати й не можуть призвести до deadlock — тож ціна — накладні витрати моніторингу плюс потреба повторити скасовану транзакцію. Повтор тоді бачить зафіксовану зміну й коректно відмовляє. Тож SI пропускає write-skew, бо сліпий до неперетинних записів поверх перетинних читань, а SSI відновлює serializability, стежачи за read/write-залежностями, які SI ігнорує.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'How would you choose an isolation level for a new service, and what are the operational consequences of running Serializable?',
        uk: 'Як ви оберете isolation level для нового сервісу і які операційні наслідки роботи на Serializable?',
      },
      a: {
        en: "I start from the default, Read Committed, and only escalate where a concrete correctness requirement forces it, because each step up costs concurrency or retries. For most OLTP, Read Committed is enough if I write updates atomically — SET balance = balance - 100 in one statement rather than read-then-write in the app — and use SELECT … FOR UPDATE on the few rows where I genuinely must read-modify-write under contention. I move a transaction to Repeatable Read when it makes several reads that must all agree on one snapshot — a multi-statement report, or a computation that reads the same data twice and must not see it shift. I reach for Serializable only when correctness depends on an invariant spanning multiple rows or multiple queries that I can't express as a single-row constraint — the write-skew shape, like an on-call or aggregate-balance rule — and I'd rather let the database guarantee it than hand-place locks correctly everywhere. The big operational consequence of Serializable is that any transaction can abort at commit with SQLSTATE 40001, unpredictably, so the application must have a generalized retry loop that rolls back and re-runs the whole transaction, and the transactions must be idempotent so retrying is safe. Beyond that: serialization-failure rate goes up with sequential scans, because a seq scan takes a coarse relation-level predicate lock, so the right indexes actually reduce aborts; I keep transactions short to shrink the conflict window; I declare read-only transactions READ ONLY, and use READ ONLY DEFERRABLE for long reports so they wait for a safe snapshot and never abort; and I watch the 40001 rate and max_pred_locks settings as real production metrics. The trade I'm making consciously is developer simplicity — if a transaction is correct alone it's correct concurrently — in exchange for retry handling and some monitoring overhead. If the conflict rate ever gets pathological, I'd reconsider whether that specific invariant is better enforced by an explicit lock or a constraint at a lower level.",
        uk: "Я починаю з дефолту, Read Committed, і піднімаюся лише там, де конкретна вимога коректності змушує, бо кожен крок угору коштує конкурентності чи повторів. Для більшості OLTP Read Committed досить, якщо я пишу update-и атомарно — SET balance = balance - 100 одним statement, а не read-then-write у застосунку — і вживаю SELECT … FOR UPDATE на тих кількох рядках, де справді мушу read-modify-write під контенцією. Я переводжу транзакцію на Repeatable Read, коли вона робить кілька читань, що мусять узгоджуватися на одному snapshot — багатооператорний звіт чи обчислення, що читає ті самі дані двічі й не має бачити їх зсув. Я тягнуся до Serializable лише коли коректність залежить від інваріанта, що охоплює кілька рядків чи запитів, який не виразити однорядковим constraint — форма write-skew, як правило чергування чи агрегатного балансу — і я радше дам базі це гарантувати, ніж правильно розставлятиму locks усюди. Велике операційне наслідок Serializable — що будь-яка транзакція може скасуватися на commit із SQLSTATE 40001, непередбачувано, тож застосунок мусить мати узагальнений retry-цикл, що відкочує й перезапускає всю транзакцію, а транзакції мусять бути ідемпотентні, щоб повтор був безпечний. Окрім того: частота serialization-failure росте із sequential scans, бо seq scan бере грубий relation-level predicate lock, тож правильні indexes насправді зменшують скасування; я тримаю транзакції короткими, щоб звузити вікно конфлікту; оголошую read-only транзакції READ ONLY і вживаю READ ONLY DEFERRABLE для довгих звітів, щоб вони чекали безпечного snapshot і ніколи не скасовувались; і слідкую за частотою 40001 і налаштуваннями max_pred_locks як за реальними продакшн-метриками. Компроміс, який я роблю свідомо — простота для розробника (якщо транзакція коректна сама, вона коректна конкурентно) в обмін на обробку повторів і трохи моніторингу. Якщо частота конфліктів стане патологічною, я б переглянув, чи той конкретний інваріант краще забезпечити явним lock чи constraint на нижчому рівні.",
      },
    },
  ],
  seeAlso: ['m17-acid-wal', 'm19-mvcc', 'm20-distributed-tx', 'm8-keys-constraints', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 13.2. Transaction Isolation (Table 13.1; Repeatable Read = Snapshot Isolation; Serializable = SSI; the write-skew SUM example; "could not serialize access…")',
      url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 13.5. Serialization Failure Handling (SQLSTATE 40001; the mandatory retry loop)',
      url: 'https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 13.3. Explicit Locking (SELECT … FOR UPDATE, advisory locks — serialize by hand at lower levels)',
      url: 'https://www.postgresql.org/docs/current/explicit-locking.html',
    },
    {
      title: 'Berenson, Bernstein, Gray, Melton, O’Neil & O’Neil (1995), “A Critique of ANSI SQL Isolation Levels”, ACM SIGMOD — formalized Snapshot Isolation & write-skew (A5B)',
      url: 'https://dl.acm.org/doi/10.1145/223784.223785',
    },
    {
      title: 'Ports & Grittner (2012), “Serializable Snapshot Isolation in PostgreSQL”, VLDB — the SSI technique PostgreSQL implements ([ports12] in the PG docs)',
      url: 'https://arxiv.org/pdf/1208.4179',
    },
    {
      title: 'PostgreSQL Wiki — Serializable Snapshot Isolation (SSI): worked examples incl. the write-skew/“rounded rectangle” pattern and retry guidance',
      url: 'https://wiki.postgresql.org/wiki/SSI',
    },
  ],
};
