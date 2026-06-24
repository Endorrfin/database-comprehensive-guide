import type { Module } from '../types';

/*
 * M19 · Concurrency control (MVCC vs locking) — Section IV (S10). Authored EN first, UA second;
 * technical terms stay English in both. Facts web-verified 2026-06-24 (see `sources`), primarily
 * PostgreSQL 18 docs:
 *  - Two philosophies: PESSIMISTIC (lock first, make others wait — 2PL) vs OPTIMISTIC (let it run
 *    against a private version, resolve at write/commit — MVCC). PostgreSQL is MVCC-first.
 *  - MVCC headline property (mvcc-intro 13.1, verbatim): "reading never blocks writing and writing
 *    never blocks reading." Maintained even at Serializable (SSI). Contrast SQL Server = lock-by-
 *    default, MVCC opt-in (RCSI / SNAPSHOT, version store in tempdb).
 *  - Mechanism: every tuple carries system columns xmin (creating xid) and xmax (deleting/superseding
 *    xid). A snapshot = {xmin horizon, xmax, xip_list of in-progress xids}; a tuple is visible iff its
 *    xmin is committed & in-snapshot AND its xmax is null/aborted/not-in-snapshot. An UPDATE is a
 *    delete+insert: it stamps the old tuple's xmax and writes a NEW version (storage-hot). Commit
 *    status lives in pg_xact (clog, 2 bits/xid) + hint bits.
 *  - HOT (storage-hot.html): if no indexed column changes AND the page has room, the new version goes
 *    on the same page via a redirect → no new index entries. Lower fillfactor → more HOT.
 *  - Locking (explicit-locking 13.3): row modes FOR UPDATE > FOR NO KEY UPDATE > FOR SHARE > FOR KEY
 *    SHARE (FK checks). 2PL = growing/shrinking; strict 2PL holds write locks to commit. Deadlock =
 *    wait-for cycle → after deadlock_timeout (default 1s) the detector aborts a victim with ERROR:
 *    deadlock detected (SQLSTATE 40P01). Defense: consistent lock order; retry.
 *  - Cost of MVCC (routine-vacuuming 24): dead tuples → bloat. VACUUM reclaims in place (+ visibility
 *    map + ANALYZE + freezing); autovacuum thresholds = autovacuum_vacuum_threshold 50 +
 *    autovacuum_vacuum_scale_factor 0.2 * reltuples (PG18 adds autovacuum_vacuum_max_threshold,
 *    default 100,000,000). VACUUM FULL rewrites the table but takes ACCESS EXCLUSIVE. Long-running /
 *    idle-in-transaction sessions pin the xmin horizon → VACUUM can't remove newer dead tuples DB-wide.
 *  - Wraparound: XIDs are 32-bit (~4.2B) and still 32-bit in core PG18 (xid8 is for snapshot reporting
 *    only). Unvacuumed >2B txns → a tuple looks "in the future" → vanishes. VACUUM freezes old tuples
 *    (relfrozenxid); anti-wraparound autovacuum fires at autovacuum_freeze_max_age (200M) even if
 *    autovacuum is off; <3M XIDs left → server refuses new XIDs until vacuumed.
 * Signature module: hero ★ MVCC sim (key 'mvcc') + the pre-built figure 'deadlock-cycle'. PG stable 18.4.
 */
export const m19: Module = {
  id: 'm19-mvcc',
  num: 19,
  section: 's4-transactions',
  order: 3,
  level: 'staff',
  signature: true,
  title: { en: 'Concurrency control', uk: 'Контроль конкурентності' },
  tagline: {
    en: 'MVCC vs locking, 2PL, snapshot visibility, deadlocks, vacuum & bloat.',
    uk: 'MVCC проти locking, 2PL, видимість snapshot, deadlocks, vacuum і bloat.',
  },
  readMins: 14,
  mentalModel: {
    en: "Everyone reads their own snapshot; readers don't block writers — and the bill is garbage to collect.",
    uk: 'Кожен читає власний snapshot; читачі не блокують записувачів — а рахунок — це сміття, яке треба прибрати.',
  },
  topics: [
    {
      id: 'pessimistic-vs-optimistic',
      title: { en: 'Pessimistic vs optimistic', uk: 'Песимістичний проти оптимістичного' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Isolation (M18) is the *promise* — concurrent transactions don't corrupt each other's view. **Concurrency control** is the *machinery* that keeps that promise while still letting many transactions run at once. There are two philosophies, and they start from opposite assumptions about how often two transactions actually collide. **Pessimistic** control assumes conflict is likely, so it takes **locks** before touching data and makes everyone else wait — this is the lock-based, two-phase-locking world. **Optimistic** control assumes conflict is rare, so it lets each transaction run against its own consistent **version** of the data and only checks for trouble at write or commit time — this is the **MVCC** (Multi-Version Concurrency Control) world. PostgreSQL is MVCC-first: it versions rows so reads and writes almost never wait on each other, and it reaches for explicit locks only where you ask.",
            uk: "Isolation (M18) — це *обіцянка*: конкурентні транзакції не псують уявлення одна одної. **Контроль конкурентності** — це *механізм*, що тримає цю обіцянку, водночас дозволяючи багатьом транзакціям працювати разом. Є дві філософії, і вони стартують із протилежних припущень про те, як часто дві транзакції справді стикаються. **Песимістичний** контроль припускає, що конфлікт імовірний, тож бере **locks** перед доступом до даних і змушує всіх інших чекати — це світ lock-based, two-phase-locking. **Оптимістичний** контроль припускає, що конфлікт рідкісний, тож дозволяє кожній транзакції працювати з власною узгодженою **версією** даних і перевіряє на проблеми лише під час запису чи commit — це світ **MVCC** (Multi-Version Concurrency Control). PostgreSQL — MVCC-first: він версіонує рядки, тож читання й записи майже ніколи не чекають одне на одного, а до явних locks тягнеться лише там, де ви просите.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'MVCC (optimistic, PostgreSQL default)', uk: 'MVCC (оптимістичний, дефолт PostgreSQL)' },
          b: { en: 'Lock-based / 2PL (pessimistic)', uk: 'Lock-based / 2PL (песимістичний)' },
          rows: [
            [
              { en: 'A read', uk: 'Читання' },
              { en: 'Sees a snapshot of committed versions; takes no row locks', uk: 'Бачить snapshot зафіксованих версій; не бере row locks' },
              { en: 'Takes a shared lock and holds it (strict 2PL)', uk: 'Бере shared lock і тримає його (strict 2PL)' },
            ],
            [
              { en: 'A write', uk: 'Запис' },
              { en: 'Writes a NEW row version; the old one stays for old snapshots', uk: 'Пише НОВУ версію рядка; стара лишається для старих snapshots' },
              { en: 'Takes an exclusive lock; overwrites in place', uk: 'Бере exclusive lock; перезаписує на місці' },
            ],
            [
              { en: 'Reader vs writer', uk: 'Читач проти записувача' },
              { en: "Never block each other — the headline property", uk: 'Ніколи не блокують одне одного — головна властивість' },
              { en: 'Block each other (shared vs exclusive conflict)', uk: 'Блокують одне одного (конфлікт shared проти exclusive)' },
            ],
            [
              { en: 'The price', uk: 'Ціна' },
              { en: 'Dead tuples (garbage) → VACUUM must reclaim them', uk: 'Мертві tuples (сміття) → VACUUM мусить їх звільняти' },
              { en: 'Waiting + deadlocks; lower concurrency', uk: 'Очікування + deadlocks; нижча конкурентність' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "The single most important sentence in this module comes straight from the PostgreSQL manual: with MVCC, *reading never blocks writing and writing never blocks reading*. A long analytic `SELECT` cannot stall the `UPDATE` stream, and a busy writer cannot freeze your reports. That one property is why PostgreSQL scales reads and writes against the same table without the classic lock convoys — and PostgreSQL holds it even at its strictest isolation level (Serializable, via SSI — M18). The trade is real but deferred: instead of paying with *waiting*, you pay later with *garbage collection*.",
            uk: "Найважливіше речення цього модуля — прямо з мануалу PostgreSQL: за MVCC *читання ніколи не блокує запис, а запис ніколи не блокує читання*. Довгий аналітичний `SELECT` не може зупинити потік `UPDATE`, а зайнятий записувач не може заморозити ваші звіти. Саме ця властивість дозволяє PostgreSQL масштабувати читання й записи на одній таблиці без класичних lock convoys — і PostgreSQL тримає її навіть на найсуворішому рівні isolation (Serializable через SSI — M18). Компроміс реальний, але відкладений: замість платити *очікуванням*, ви платите згодом *збиранням сміття*.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'PostgreSQL is MVCC by default; SQL Server is lock-by-default', uk: 'PostgreSQL — MVCC за замовчуванням; SQL Server — lock за замовчуванням' },
          md: {
            en: "Don't assume every relational database behaves like PostgreSQL here. SQL Server's *default* is pessimistic Read Committed: readers take shared locks, so a reader can block a writer and vice versa. Its MVCC-style behavior is **opt-in** — `READ_COMMITTED_SNAPSHOT ON` (RCSI) and `ALLOW_SNAPSHOT_ISOLATION ON` keep row versions in `tempdb` so that readers no longer block writers. Oracle, like PostgreSQL, is multiversion by default but keeps old versions in a separate **undo** segment rather than inline in the table. Same goal — let readers and writers coexist — three different mechanisms. \"It's a relational database\" tells you nothing about whether a `SELECT` blocks an `UPDATE`; the concurrency-control model does.",
            uk: "Не припускайте, що кожна реляційна база поводиться тут як PostgreSQL. *Дефолт* SQL Server — песимістичний Read Committed: читачі беруть shared locks, тож читач може блокувати записувача й навпаки. Його MVCC-подібна поведінка **опційна** — `READ_COMMITTED_SNAPSHOT ON` (RCSI) і `ALLOW_SNAPSHOT_ISOLATION ON` тримають версії рядків у `tempdb`, щоб читачі більше не блокували записувачів. Oracle, як і PostgreSQL, мультиверсійний за замовчуванням, але тримає старі версії в окремому **undo**-сегменті, а не вбудовано в таблиці. Та сама мета — дати читачам і записувачам співіснувати — три різні механізми. «Це реляційна база» не каже нічого про те, чи блокує `SELECT` ваш `UPDATE`; це вирішує модель контролю конкурентності.",
          },
        },
      ],
    },
    {
      id: 'mvcc-mechanism',
      title: { en: 'MVCC — versions, snapshots, visibility', uk: 'MVCC — версії, snapshots, видимість' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Here is how PostgreSQL actually does it. Every row is stored as one or more **versions** — physical tuples on the heap — and each tuple carries two hidden system columns: **`xmin`**, the transaction id that *created* this version, and **`xmax`**, the transaction id that *deleted or superseded* it (empty while the version is live). A transaction works against a **snapshot**: roughly, the set of transactions that had already committed at the moment it began. The visibility rule follows from that — a tuple is visible to you iff its `xmin` is committed and within your snapshot, **and** its `xmax` is empty, aborted, or not yet committed in your snapshot. In plain terms: *you see the version that was the latest committed one when your snapshot was taken.*",
            uk: "Ось як PostgreSQL це справді робить. Кожен рядок зберігається як одна чи більше **версій** — фізичних tuples у heap — і кожен tuple несе дві приховані системні колонки: **`xmin`**, transaction id, що *створив* цю версію, і **`xmax`**, transaction id, що *видалив чи замінив* її (порожнє, поки версія жива). Транзакція працює з **snapshot**: грубо — множиною транзакцій, що вже зафіксувалися на момент її старту. Правило видимості випливає звідси — tuple видимий вам тоді й лише тоді, коли його `xmin` зафіксований і в межах вашого snapshot, **і** його `xmax` порожній, aborted чи ще не зафіксований у вашому snapshot. Простими словами: *ви бачите ту версію, що була останньою зафіксованою, коли робився ваш snapshot.*",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The decisive consequence: an **UPDATE never overwrites a row in place**. It stamps the old version's `xmax` with its own transaction id and writes a brand-new version with a fresh `xmin`. For a moment both versions exist on the heap. That is *exactly* why readers don't block writers — a transaction whose snapshot predates the change keeps reading the old version while the writer adds the new one beside it; nobody waits. Step the simulation through it: watch the writer fork a second version, watch the reader keep seeing the original, watch a later transaction see the new one — and watch the old version become dead garbage that VACUUM eventually reclaims. Then flip the model toggle to lock-based and see the same schedule turn into a wait.",
            uk: "Вирішальний наслідок: **UPDATE ніколи не перезаписує рядок на місці**. Він штампує `xmax` старої версії власним transaction id і пише цілком нову версію зі свіжим `xmin`. На мить обидві версії існують у heap. Саме *тому* читачі не блокують записувачів — транзакція, чий snapshot передує зміні, далі читає стару версію, поки записувач додає нову поряд; ніхто не чекає. Прокрутіть симуляцію крізь це: дивіться, як записувач відгалужує другу версію, як читач далі бачить оригінал, як пізніша транзакція бачить нову — і як стара версія стає мертвим сміттям, яке VACUUM згодом звільняє. Тоді перемкніть модель на lock-based і побачте, як той самий розклад перетворюється на очікування.",
          },
        },
        {
          kind: 'sim',
          sim: 'mvcc',
        },
        {
          kind: 'prose',
          md: {
            en: "One refinement makes this affordable in practice: the **HOT** optimization (Heap-Only Tuple). Normally a new row version needs a new entry in *every* index, which is expensive. But if the UPDATE changes **no indexed column** and the page has **room** for the new version, PostgreSQL keeps the new tuple on the *same page* and links it to the old one with a redirect — so the indexes are not touched at all. This is why leaving free space per page (a lower `fillfactor`, M12/M14) directly cuts the write and index-bloat cost of an update-heavy table. The version chain is the cost of MVCC; HOT is how PostgreSQL keeps that cost off the indexes when it can.",
            uk: "Одне уточнення робить це доступним на практиці: оптимізація **HOT** (Heap-Only Tuple). Зазвичай нова версія рядка потребує нового запису в *кожному* index, що дорого. Але якщо UPDATE не змінює **жодної індексованої колонки** і на page є **місце** для нової версії, PostgreSQL тримає новий tuple на *тій самій page* і звʼязує його зі старим через redirect — тож indexes взагалі не зачіпаються. Саме тому залишене вільне місце на page (нижчий `fillfactor`, M12/M14) прямо зменшує вартість запису й index-bloat для таблиці з рясними оновленнями. Version chain — це ціна MVCC; HOT — це те, як PostgreSQL тримає цю ціну подалі від indexes, коли може.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Mental model: an UPDATE is a DELETE + INSERT', uk: 'Ментальна модель: UPDATE — це DELETE + INSERT' },
          md: {
            en: "If you remember one thing about PostgreSQL's storage, make it this: under MVCC, an `UPDATE` is physically a `DELETE` of the old version plus an `INSERT` of a new one. A table you only ever UPDATE — never INSERT or DELETE — still accumulates dead tuples and still needs VACUUM. It explains a surprising amount: why a 1,000-row table can occupy the space of 50,000 rows (bloat), why an update-heavy table benefits from a lower `fillfactor` (room for HOT), and why \"just toggle this boolean a million times a second\" is a workload that punishes the indexes unless the column is unindexed. Versions are not an implementation detail you can ignore; they are the shape of the storage.",
            uk: "Якщо запамʼятати одну річ про зберігання в PostgreSQL, нехай це буде вона: за MVCC `UPDATE` — це фізично `DELETE` старої версії плюс `INSERT` нової. Таблиця, яку ви лише UPDATE-ите — ніколи не INSERT і не DELETE — все одно накопичує мертві tuples і все одно потребує VACUUM. Це пояснює напрочуд багато: чому таблиця на 1000 рядків може займати місце 50 000 рядків (bloat), чому таблиця з рясними оновленнями виграє від нижчого `fillfactor` (місце для HOT) і чому «просто перемикай цей boolean мільйон разів на секунду» — це навантаження, що карає indexes, якщо колонка не неіндексована. Версії — не деталь реалізації, яку можна ігнорувати; це форма самого сховища.",
          },
        },
      ],
    },
    {
      id: 'locking-2pl-deadlocks',
      title: { en: 'Locking, 2PL & deadlocks', uk: 'Locking, 2PL і deadlocks' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "MVCC removes read/write blocking, but it does **not** make all contention vanish. Two transactions that write the **same row** must still serialize — the second waits for the first to commit or roll back — and sometimes you *want* a lock, to read a row with the intent to update it. PostgreSQL offers explicit **row-level lock modes**, from strongest to weakest: `FOR UPDATE` (full row lock, taken by `UPDATE`/`DELETE`), `FOR NO KEY UPDATE` (taken by updates that don't touch a key), `FOR SHARE` (a shared read lock), and `FOR KEY SHARE` (the weakest — what a foreign-key check takes on the parent row). You request them with `SELECT … FOR UPDATE` and friends. Underneath, holding locks to commit is **two-phase locking**: a *growing* phase acquires locks, a *shrinking* phase releases them, and **strict 2PL** holds every write lock until commit so nothing dirty escapes.",
            uk: "MVCC прибирає read/write блокування, але **не** змушує всю контенцію зникнути. Дві транзакції, що пишуть **той самий рядок**, все одно мусять серіалізуватися — друга чекає, поки перша зафіксується чи відкотиться — і часом ви *хочете* lock, щоб прочитати рядок із наміром оновити. PostgreSQL пропонує явні **row-level lock modes**, від найсильнішого до найслабшого: `FOR UPDATE` (повний lock рядка, який бере `UPDATE`/`DELETE`), `FOR NO KEY UPDATE` (беруть оновлення, що не зачіпають ключ), `FOR SHARE` (shared read lock) і `FOR KEY SHARE` (найслабший — те, що бере foreign-key перевірка на батьківському рядку). Ви запитуєте їх через `SELECT … FOR UPDATE` тощо. Під капотом тримання locks до commit — це **two-phase locking**: фаза *зростання* набирає locks, фаза *спадання* їх звільняє, а **strict 2PL** тримає кожен write lock до commit, щоб нічого брудного не вислизнуло.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'PostgreSQL row-level lock modes, strongest to weakest. Pick the weakest one that still protects your invariant.',
            uk: 'Row-level lock modes у PostgreSQL, від найсильнішого до найслабшого. Беріть найслабший, що ще захищає ваш інваріант.',
          },
          head: [
            { en: 'Mode', uk: 'Режим' },
            { en: 'Taken by / used for', uk: 'Хто бере / для чого' },
            { en: 'Blocks', uk: 'Блокує' },
          ],
          rows: [
            [
              { en: 'FOR UPDATE', uk: 'FOR UPDATE' },
              { en: 'UPDATE/DELETE; "read this row, I will change it"', uk: 'UPDATE/DELETE; «прочитати рядок, я його зміню»' },
              { en: 'All other locks on the row (UPDATE/DELETE/FOR SHARE/…)', uk: 'Усі інші locks на рядку (UPDATE/DELETE/FOR SHARE/…)' },
            ],
            [
              { en: 'FOR NO KEY UPDATE', uk: 'FOR NO KEY UPDATE' },
              { en: 'UPDATEs that change no key column', uk: 'UPDATE-и, що не змінюють ключову колонку' },
              { en: 'Same, but allows FOR KEY SHARE', uk: 'Те саме, але дозволяє FOR KEY SHARE' },
            ],
            [
              { en: 'FOR SHARE', uk: 'FOR SHARE' },
              { en: 'Read with intent to keep stable; allows other readers', uk: 'Читання з наміром тримати стабільним; дозволяє інших читачів' },
              { en: 'Writers (UPDATE/DELETE/FOR UPDATE), not other FOR SHARE', uk: 'Записувачів (UPDATE/DELETE/FOR UPDATE), не інші FOR SHARE' },
            ],
            [
              { en: 'FOR KEY SHARE', uk: 'FOR KEY SHARE' },
              { en: 'Foreign-key checks on the parent row (weakest)', uk: 'Foreign-key перевірки на батьківському рядку (найслабший)' },
              { en: 'Only key-changing UPDATE / DELETE of the row', uk: 'Лише UPDATE, що змінює ключ, / DELETE рядка' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "The moment you have locks, you can have a **deadlock**: T1 holds a lock on row A and wants row B, while T2 holds B and wants A. Neither can proceed — the *wait-for graph* has a cycle. PostgreSQL doesn't try to prevent this; it **detects** it. A blocked transaction waits `deadlock_timeout` (default **1 second**), and only then does the deadlock detector run a cycle check; if it finds one, it **aborts one of the transactions** (the *victim*) to break the cycle, raising `ERROR: deadlock detected` with **SQLSTATE 40P01**. The survivor proceeds; the victim must retry. The figure shows the canonical two-transaction cycle.",
            uk: "Щойно у вас є locks, може виникнути **deadlock**: T1 тримає lock на рядку A і хоче рядок B, а T2 тримає B і хоче A. Жодна не може просунутися — у *wait-for graph* є цикл. PostgreSQL не намагається цьому запобігти; він це **виявляє**. Заблокована транзакція чекає `deadlock_timeout` (дефолт **1 секунда**), і лише тоді детектор deadlock запускає перевірку циклу; знайшовши його, він **скасовує одну з транзакцій** (*жертву*), щоб розірвати цикл, кидаючи `ERROR: deadlock detected` із **SQLSTATE 40P01**. Той, хто вижив, продовжує; жертва мусить повторити. Рисунок показує канонічний цикл двох транзакцій.",
          },
        },
        {
          kind: 'figure',
          fig: 'deadlock-cycle',
          caption: {
            en: "A deadlock is a cycle in the wait-for graph: T1 holds row A and waits for row B; T2 holds row B and waits for row A. After deadlock_timeout (default 1s) PostgreSQL's detector aborts one transaction as the victim with SQLSTATE 40P01; the application should retry. The fix is prevention: lock objects in a consistent order everywhere.",
            uk: 'Deadlock — це цикл у wait-for graph: T1 тримає рядок A і чекає рядок B; T2 тримає рядок B і чекає рядок A. Після deadlock_timeout (дефолт 1с) детектор PostgreSQL скасовує одну транзакцію як жертву з SQLSTATE 40P01; застосунок має повторити. Виправлення — це запобігання: блокуйте обʼєкти в узгодженому порядку всюди.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Prevent deadlocks by lock ordering; survive them by retrying', uk: 'Запобігайте deadlocks порядком locks; переживайте їх повтором' },
          md: {
            en: "The official advice is blunt: the best defense against deadlocks is to make sure that all of your transactions **acquire locks on multiple objects in a consistent order**. If every code path that touches rows A and B always locks A before B, the cross-cycle can never form. Two more habits: take the **weakest sufficient** lock mode (a foreign-key insert doesn't need `FOR UPDATE` on the parent — `FOR KEY SHARE` is enough, and it's the default the engine takes), and keep transactions short so lock windows are small. And because you can never fully prevent them in a complex system, every transaction that takes explicit locks should sit inside a **retry loop** that catches `40P01` (and `40001`, M18) and re-runs from the top. Deadlocks are a *normal*, retryable outcome — not a bug to be shocked by.",
            uk: "Офіційна порада пряма: найкращий захист від deadlocks — переконатися, що всі ваші транзакції **набирають locks на кількох обʼєктах в узгодженому порядку**. Якщо кожен шлях коду, що зачіпає рядки A і B, завжди блокує A перед B, перехресний цикл не виникне ніколи. Ще дві звички: беріть **найслабший достатній** режим lock (insert із foreign-key не потребує `FOR UPDATE` на батьку — `FOR KEY SHARE` досить, і це дефолт, який бере движок), і тримайте транзакції короткими, щоб вікна locks були малими. А оскільки в складній системі повністю запобігти їм не можна, кожна транзакція, що бере явні locks, має сидіти всередині **retry-циклу**, який ловить `40P01` (і `40001`, M18) і перезапускає з початку. Deadlocks — це *нормальний*, повторюваний результат, а не баг, від якого треба жахатися.",
          },
        },
      ],
    },
    {
      id: 'cost-of-mvcc',
      title: { en: 'The cost of MVCC: bloat, vacuum & wraparound', uk: 'Ціна MVCC: bloat, vacuum і wraparound' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "MVCC's bill comes due as **garbage**. Every UPDATE and DELETE leaves behind a **dead tuple** — a version that no running or future transaction can ever see again. Left alone, dead tuples pile up as **bloat**: pages that are mostly empty space, a table on disk far larger than its live row count, a worse cache-hit ratio, and slower scans. The collector is **VACUUM**: it walks the table, finds tuples dead to *every* snapshot, and marks their space reusable **in place** (it also updates the visibility map for index-only scans, refreshes planner statistics, and freezes old transaction ids — one job, several payoffs). You almost never run it by hand: **autovacuum** fires automatically once a table's dead-tuple count crosses a threshold.",
            uk: "Рахунок MVCC приходить у формі **сміття**. Кожен UPDATE і DELETE лишає по собі **мертвий tuple** — версію, яку жодна поточна чи майбутня транзакція вже ніколи не побачить. Полишені, мертві tuples накопичуються як **bloat**: pages, що здебільшого порожні, таблиця на диску значно більша за кількість живих рядків, гірший cache-hit ratio й повільніші scans. Збирач — це **VACUUM**: він обходить таблицю, знаходить tuples, мертві для *кожного* snapshot, і позначає їхнє місце придатним для повторного використання **на місці** (він також оновлює visibility map для index-only scans, освіжає statistics планувальника й freeze-ить старі transaction id — одна робота, кілька вигод). Ви майже ніколи не запускаєте його вручну: **autovacuum** спрацьовує автоматично, щойно кількість мертвих tuples таблиці перетне поріг.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'VACUUM vs VACUUM FULL. Standard VACUUM is the everyday, online tool; VACUUM FULL is a heavy, locking last resort.',
            uk: 'VACUUM проти VACUUM FULL. Звичайний VACUUM — щоденний, online-інструмент; VACUUM FULL — важкий, блокувальний крайній засіб.',
          },
          head: [
            { en: 'Aspect', uk: 'Аспект' },
            { en: 'VACUUM (and autovacuum)', uk: 'VACUUM (та autovacuum)' },
            { en: 'VACUUM FULL', uk: 'VACUUM FULL' },
          ],
          rows: [
            [
              { en: 'What it does', uk: 'Що робить' },
              { en: 'Marks dead-tuple space reusable in place', uk: 'Позначає місце мертвих tuples придатним для повторного використання на місці' },
              { en: 'Rewrites the whole table into a new file, no dead space', uk: 'Переписує всю таблицю в новий файл, без мертвого місця' },
            ],
            [
              { en: 'Lock', uk: 'Lock' },
              { en: 'SHARE UPDATE EXCLUSIVE — runs alongside reads & writes', uk: 'SHARE UPDATE EXCLUSIVE — працює поряд із читаннями й записами' },
              { en: 'ACCESS EXCLUSIVE — blocks all use of the table', uk: 'ACCESS EXCLUSIVE — блокує будь-яке використання таблиці' },
            ],
            [
              { en: 'Returns space to the OS', uk: 'Повертає місце ОС' },
              { en: 'No (space is reused by future rows)', uk: 'Ні (місце перевикористовується майбутніми рядками)' },
              { en: 'Yes (the table file shrinks)', uk: 'Так (файл таблиці зменшується)' },
            ],
            [
              { en: 'When', uk: 'Коли' },
              { en: 'Continuously, automatically — the steady state', uk: 'Постійно, автоматично — стійкий стан' },
              { en: 'Rare, manual, off-hours — to fix existing bloat', uk: 'Рідко, вручну, поза годинами — щоб полагодити наявний bloat' },
            ],
          ],
        },
        {
          kind: 'prose',
          md: {
            en: "Autovacuum's trigger is a formula worth knowing: it vacuums a table once the dead-tuple count exceeds `autovacuum_vacuum_threshold` (default **50**) plus `autovacuum_vacuum_scale_factor` (default **0.2**, i.e. 20%) times the table's row count. On a billion-row table 20% is 200 million dead rows before it kicks in — far too late — which is why **PostgreSQL 18 added `autovacuum_vacuum_max_threshold`** (default 100,000,000) as an absolute cap so large tables get cleaned much sooner. The practical lesson is that autovacuum's *defaults are tuned for small tables*; on big, hot tables you lower the scale factor per-table so it runs often enough to keep bloat flat.",
            uk: "Тригер autovacuum — це формула, яку варто знати: він вакуумить таблицю, щойно кількість мертвих tuples перевищить `autovacuum_vacuum_threshold` (дефолт **50**) плюс `autovacuum_vacuum_scale_factor` (дефолт **0.2**, тобто 20%) помножений на кількість рядків таблиці. На таблиці в мільярд рядків 20% — це 200 мільйонів мертвих рядків, перш ніж він спрацює — надто пізно — тому **PostgreSQL 18 додав `autovacuum_vacuum_max_threshold`** (дефолт 100 000 000) як абсолютну стелю, щоб великі таблиці чистилися значно раніше. Практичний урок: *дефолти autovacuum налаштовані на малі таблиці*; на великих, гарячих таблицях ви знижуєте scale factor поper-table, щоб він працював досить часто, тримаючи bloat пласким.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'The enemy of VACUUM is a long-running transaction', uk: 'Ворог VACUUM — це довга транзакція' },
          md: {
            en: "Here is the trap that bloats production databases. VACUUM may only remove a dead tuple once it is invisible to **every** active snapshot — including the oldest still-running transaction anywhere in the database. So a single **long-running or idle-in-transaction** session pins the **xmin horizon**: while it sits there (a forgotten `BEGIN`, a stuck report, a connection-pool leak), VACUUM cannot reclaim *any* tuple newer than that transaction's start — across the whole cluster, not just the table it touched. Bloat then grows everywhere at once and no amount of autovacuum tuning helps, because the dead tuples aren't *eligible* yet. Defenses: keep transactions short, never leave one idle in transaction, set `idle_in_transaction_session_timeout`, and watch the oldest `xact_start` in `pg_stat_activity` (and `age(backend_xmin)`) as a first-class health metric.",
            uk: "Ось пастка, що роздуває продакшн-бази. VACUUM може прибрати мертвий tuple лише тоді, коли він невидимий для **кожного** активного snapshot — включно з найстарішою транзакцією, що ще працює будь-де в базі. Тож одна **довга чи idle-in-transaction** сесія приколює **xmin horizon**: поки вона сидить там (забутий `BEGIN`, застряглий звіт, витік connection-pool), VACUUM не може звільнити *жоден* tuple, новіший за старт тієї транзакції — по всьому кластеру, а не лише в таблиці, якої вона торкнулась. Bloat тоді росте всюди одразу, і жодне налаштування autovacuum не допомагає, бо мертві tuples ще не *придатні*. Захист: тримайте транзакції короткими, ніколи не лишайте idle in transaction, ставте `idle_in_transaction_session_timeout` і слідкуйте за найстарішим `xact_start` у `pg_stat_activity` (та `age(backend_xmin)`) як за метрикою здоровʼя першого класу.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "VACUUM has a second, scarier job: preventing **transaction-ID wraparound**. PostgreSQL's transaction ids are **32-bit** — about 4.2 billion of them — and they *wrap around*. Visibility is decided by comparing XIDs, so if a live tuple ever went unvacuumed for more than ~2 billion transactions, its `xmin` would suddenly appear to be **in the future**, and the row would silently vanish. To prevent that, VACUUM **freezes** old tuples — marking them so old they are visible to everyone regardless of XID comparison — and advances the table's `relfrozenxid`. This is not optional: an **anti-wraparound autovacuum** is forced once a table approaches `autovacuum_freeze_max_age` (default 200 million) **even if autovacuum is turned off**, and if freezing falls far enough behind (under ~3 million XIDs remaining) PostgreSQL **stops accepting new writes** until you vacuum. (Core PostgreSQL 18 still uses 32-bit XIDs internally; the 64-bit `xid8` type exists only for snapshot reporting, not tuple headers — so wraparound is a real operational concern, not a solved one.)",
            uk: "У VACUUM є друга, страшніша робота: запобігання **transaction-ID wraparound**. Transaction id у PostgreSQL — **32-бітні** — їх близько 4,2 мільярда — і вони *обертаються по колу*. Видимість вирішується порівнянням XID, тож якби живий tuple колись лишився невакуумованим понад ~2 мільярди транзакцій, його `xmin` раптом видавався б **у майбутньому**, і рядок тихо зник би. Щоб цьому запобігти, VACUUM **freeze-ить** старі tuples — позначаючи їх такими старими, що вони видимі всім незалежно від порівняння XID — і просуває `relfrozenxid` таблиці. Це не опційно: **anti-wraparound autovacuum** примусово запускається, щойно таблиця наближається до `autovacuum_freeze_max_age` (дефолт 200 мільйонів) **навіть якщо autovacuum вимкнено**, а якщо freezing відстане досить далеко (лишається менш як ~3 мільйони XID), PostgreSQL **припиняє приймати нові записи**, доки ви не вакуумите. (Ядро PostgreSQL 18 досі вживає 32-бітні XID внутрішньо; 64-бітний тип `xid8` існує лише для звітування snapshot, не для заголовків tuple — тож wraparound — це реальна операційна турбота, а не розвʼязана.)",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Two philosophies: pessimistic locking (lock first, make others wait) vs optimistic MVCC (run against a private version, resolve at commit). PostgreSQL is MVCC by default — reading never blocks writing and writing never blocks reading.',
      uk: 'Дві філософії: песимістичний locking (спершу lock, інші чекають) проти оптимістичного MVCC (працювати з власною версією, розвʼязати на commit). PostgreSQL — MVCC за замовчуванням: читання ніколи не блокує запис, а запис ніколи не блокує читання.',
    },
    {
      en: 'MVCC mechanism: every row version (tuple) carries xmin (creating txn) and xmax (superseding txn); a transaction reads from a snapshot. An UPDATE writes a NEW version and stamps the old one’s xmax — it never overwrites in place, so old snapshots keep reading the old version.',
      uk: 'Механізм MVCC: кожна версія рядка (tuple) несе xmin (транзакція-творець) і xmax (транзакція-наступник); транзакція читає зі snapshot. UPDATE пише НОВУ версію і штампує xmax старої — ніколи не перезаписує на місці, тож старі snapshots далі читають стару версію.',
    },
    {
      en: 'Writes to the same row still serialize, and explicit locks exist (FOR UPDATE > FOR NO KEY UPDATE > FOR SHARE > FOR KEY SHARE; 2PL). Two transactions locking in different orders deadlock → PostgreSQL detects the wait-for cycle after deadlock_timeout (1s) and aborts a victim (40P01). Defense: consistent lock order + retry.',
      uk: 'Записи в той самий рядок усе одно серіалізуються, і є явні locks (FOR UPDATE > FOR NO KEY UPDATE > FOR SHARE > FOR KEY SHARE; 2PL). Дві транзакції, що блокують у різному порядку, дають deadlock → PostgreSQL виявляє цикл wait-for після deadlock_timeout (1с) і скасовує жертву (40P01). Захист: узгоджений порядок locks + повтор.',
    },
    {
      en: 'MVCC’s cost is dead tuples → bloat. VACUUM/autovacuum reclaims them in place (and updates the visibility map, statistics, and freezes old XIDs); VACUUM FULL rewrites the table but takes an ACCESS EXCLUSIVE lock. Autovacuum defaults (threshold 50 + 20%) are tuned for small tables — lower the scale factor on big hot tables.',
      uk: 'Ціна MVCC — мертві tuples → bloat. VACUUM/autovacuum звільняє їх на місці (і оновлює visibility map, statistics, freeze-ить старі XID); VACUUM FULL переписує таблицю, але бере ACCESS EXCLUSIVE lock. Дефолти autovacuum (поріг 50 + 20%) налаштовані на малі таблиці — знижуйте scale factor на великих гарячих таблицях.',
    },
    {
      en: 'The two operational dangers: a long-running / idle-in-transaction session pins the xmin horizon and blocks VACUUM across the WHOLE database; and 32-bit XID wraparound forces freezing — let it fall far enough behind and PostgreSQL stops accepting writes. Watch the oldest transaction and age(datfrozenxid).',
      uk: 'Дві операційні небезпеки: довга / idle-in-transaction сесія приколює xmin horizon і блокує VACUUM по ВСІЙ базі; а 32-бітний XID wraparound змушує freezing — дайте йому відстати досить далеко, і PostgreSQL припинить приймати записи. Слідкуйте за найстарішою транзакцією та age(datfrozenxid).',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Thinking an UPDATE overwrites the row in place', uk: 'Думати, що UPDATE перезаписує рядок на місці' },
      body: {
        en: 'Under MVCC an UPDATE writes a new row version and leaves the old one as a dead tuple — it is physically a DELETE + INSERT. A table you only ever UPDATE still grows and still needs VACUUM. This is why a small table can occupy the disk footprint of a much larger one (bloat), why a row that is updated in a hot loop bloats fast, and why the right fix is often a lower fillfactor (room for HOT updates) or not indexing the churning column — not "the database is broken". If you picture an in-place overwrite, you will be repeatedly surprised by table size, autovacuum activity, and index growth.',
        uk: 'За MVCC UPDATE пише нову версію рядка й лишає стару як мертвий tuple — це фізично DELETE + INSERT. Таблиця, яку ви лише UPDATE-ите, все одно росте й все одно потребує VACUUM. Тому мала таблиця може займати на диску стільки ж, скільки значно більша (bloat), тому рядок, що оновлюється в гарячому циклі, швидко роздувається, і тому правильне виправлення — часто нижчий fillfactor (місце для HOT-оновлень) або неіндексування мінливої колонки, а не «база зламана». Якщо уявляти перезапис на місці, ви раз за разом дивуватиметеся розміру таблиці, активності autovacuum і росту indexes.',
      },
    },
    {
      title: { en: 'Leaving a transaction idle in transaction', uk: 'Лишати транзакцію idle in transaction' },
      body: {
        en: 'An open transaction — even one doing nothing, sitting at "idle in transaction" after a forgotten BEGIN or a connection-pool leak — holds a snapshot that pins the xmin horizon. While it lives, VACUUM cannot reclaim any dead tuple newer than its start, across the ENTIRE database, not just the tables it touched. Bloat then grows everywhere and autovacuum is powerless because the tuples are not yet eligible to remove. Always commit or roll back promptly, set idle_in_transaction_session_timeout, and treat a rising oldest-transaction age in pg_stat_activity as an incident, not a curiosity.',
        uk: 'Відкрита транзакція — навіть та, що нічого не робить, сидить у «idle in transaction» після забутого BEGIN чи витоку connection-pool — тримає snapshot, що приколює xmin horizon. Поки вона жива, VACUUM не може звільнити жоден мертвий tuple, новіший за її старт, по ВСІЙ базі, а не лише в таблицях, яких вона торкнулась. Bloat тоді росте всюди, і autovacuum безсилий, бо tuples ще не придатні до прибирання. Завжди швидко commit-те чи rollback-те, ставте idle_in_transaction_session_timeout і трактуйте зростання віку найстарішої транзакції в pg_stat_activity як інцидент, а не цікавинку.',
      },
    },
    {
      title: { en: 'Disabling autovacuum to "reduce load"', uk: 'Вимикати autovacuum, щоб «зменшити навантаження»' },
      body: {
        en: 'Autovacuum looks like background overhead, so it is tempting to turn it off on a busy system. This is a slow-motion outage. Without vacuuming, dead tuples accumulate into severe bloat (degrading every query), and — worse — XID freezing falls behind until an anti-wraparound vacuum is forced anyway, at the worst possible time, and ultimately the database stops accepting writes to protect itself. The correct move is the opposite: make autovacuum more aggressive where it matters (lower per-table scale factors, raise cost limits, more workers) so it keeps up smoothly. Disable it only on a transient table you will TRUNCATE, and never on anything long-lived.',
        uk: 'Autovacuum виглядає як фонові накладні витрати, тож спокусливо вимкнути його на завантаженій системі. Це повільний збій. Без вакуумінгу мертві tuples накопичуються в тяжкий bloat (псуючи кожен запит), і — гірше — XID-freezing відстає, доки anti-wraparound vacuum усе одно не запуститься примусово, у найгірший момент, і зрештою база припинить приймати записи, щоб себе захистити. Правильний хід — протилежний: зробіть autovacuum агресивнішим там, де це важливо (нижчі per-table scale factors, вищі cost limits, більше workers), щоб він плавно встигав. Вимикайте його лише на тимчасовій таблиці, яку ви TRUNCATE-нете, і ніколи на чомусь довговічному.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Explain how MVCC lets readers not block writers. Walk through what physically happens to a row when one transaction reads it and another updates it.',
        uk: 'Поясніть, як MVCC дозволяє читачам не блокувати записувачів. Простежте, що фізично стається з рядком, коли одна транзакція його читає, а інша оновлює.',
      },
      a: {
        en: "MVCC works because the database keeps multiple physical versions of a row, not one cell it overwrites. Every row version — a tuple on the heap — carries two hidden columns: xmin, the id of the transaction that created it, and xmax, the id of the transaction that deleted or superseded it. A transaction reads against a snapshot, which captures which transactions had committed when it started, and the visibility rule is: you see a tuple if its xmin is committed and within your snapshot and its xmax is not. Now the concrete schedule. T1 begins and reads row id=1; it takes a snapshot and sees version v1, say balance 500. T2 begins and updates id=1 to 600. Crucially it does not overwrite v1 — it stamps v1's xmax with T2's id and writes a brand-new version v2 with xmin = T2 and balance 600. For a moment both v1 and v2 sit on the heap. T1 reads id=1 again: it still sees v1 = 500, because v2's xmin is T2, which is not in T1's snapshot (and not yet committed), so v2 is invisible to T1. No one waited: T1 read its version, T2 wrote a new version beside it, neither blocked the other. T2 commits; from then on any new transaction's snapshot sees v2 = 600. v1 is now a dead tuple — invisible to every snapshot that will ever start again — except it must remain as long as T1, whose snapshot still includes it, is alive. Once T1 ends, v1 is dead to everyone and VACUUM can reclaim its space. So the trick is simple to state: writes create new versions instead of overwriting, readers follow their snapshot to the version that was current when they began, and the only price is that the superseded versions become garbage the system must later collect.",
        uk: "MVCC працює, бо база тримає кілька фізичних версій рядка, а не одну клітинку, яку перезаписує. Кожна версія рядка — tuple в heap — несе дві приховані колонки: xmin, id транзакції, що його створила, і xmax, id транзакції, що його видалила чи замінила. Транзакція читає з snapshot, який фіксує, які транзакції зафіксувалися на її старті, а правило видимості таке: ви бачите tuple, якщо його xmin зафіксований і в межах вашого snapshot, а його xmax — ні. Тепер конкретний розклад. T1 починається й читає рядок id=1; вона бере snapshot і бачить версію v1, скажімо balance 500. T2 починається й оновлює id=1 до 600. Головне — вона не перезаписує v1: вона штампує xmax v1 id-ом T2 і пише цілком нову версію v2 з xmin = T2 і balance 600. На мить обидві v1 і v2 лежать у heap. T1 читає id=1 знову: вона досі бачить v1 = 500, бо xmin v2 — це T2, якого немає в snapshot T1 (і ще не зафіксованого), тож v2 невидимий для T1. Ніхто не чекав: T1 прочитала свою версію, T2 написала нову поряд, жодна не заблокувала іншу. T2 фіксується; відтоді snapshot будь-якої нової транзакції бачить v2 = 600. v1 тепер мертвий tuple — невидимий для кожного snapshot, що колись стартує знову — окрім того, що він мусить лишатися, поки жива T1, чий snapshot ще його включає. Щойно T1 завершиться, v1 мертвий для всіх, і VACUUM може звільнити його місце. Тож трюк просто сформулювати: записи створюють нові версії замість перезапису, читачі йдуть за своїм snapshot до версії, що була поточною на їхньому старті, а єдина ціна — що замінені версії стають сміттям, яке система мусить згодом зібрати.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'What is VACUUM for, why is it necessary, and what concretely goes wrong if it falls behind?',
        uk: 'Для чого VACUUM, чому він потрібний і що конкретно йде не так, якщо він відстає?',
      },
      a: {
        en: "VACUUM exists because MVCC produces garbage. Every UPDATE and DELETE leaves a dead tuple — an old row version no live or future transaction can see — and something has to reclaim that space, or the table grows without bound. VACUUM does four things in one pass: it marks dead-tuple space reusable in place; it updates the visibility map, which is what lets index-only scans skip the heap; it refreshes the planner's statistics; and it freezes old transaction ids to hold off wraparound. Normally autovacuum runs it automatically when a table's dead tuples cross a threshold — by default 50 plus 20% of the row count, with a new absolute cap in PostgreSQL 18 so huge tables don't wait for 20%. Now, what goes wrong when it falls behind. First, bloat: dead tuples accumulate, the table and its indexes balloon on disk, the cache hit ratio drops, and every scan reads more pages — a general, creeping slowdown that no single query explains. Second, and this is the staff-level trap, a long-running or idle-in-transaction session pins the xmin horizon, so VACUUM is not even allowed to remove dead tuples newer than that transaction's start, across the entire database — so you can have autovacuum running flat out and still bloat everywhere, because the tuples aren't eligible. Third, the dangerous one: if freezing falls behind, you approach transaction-ID wraparound. XIDs are 32-bit and wrap, so an unfrozen tuple older than ~2 billion transactions would flip to looking like it's in the future and disappear. PostgreSQL won't let that happen silently — it forces an anti-wraparound autovacuum even if autovacuum is disabled, and if it still can't keep up, under about 3 million XIDs remaining it stops accepting new writes until you vacuum, which is effectively an outage. So VACUUM falling behind shows up as three escalating symptoms: slow bloat, then database-wide un-reclaimable bloat from a long transaction, then a hard wraparound-protection stop. The fixes are: tune autovacuum to be aggressive enough per table, keep transactions short and kill idle-in-transaction sessions, and monitor both dead-tuple counts and age(datfrozenxid) as health metrics before any of this becomes an incident.",
        uk: "VACUUM існує, бо MVCC продукує сміття. Кожен UPDATE і DELETE лишає мертвий tuple — стару версію рядка, яку жодна жива чи майбутня транзакція не бачить — і щось мусить звільнити це місце, інакше таблиця росте безмежно. VACUUM робить чотири речі за один прохід: позначає місце мертвих tuples придатним для повторного використання на місці; оновлює visibility map, що дозволяє index-only scans оминати heap; освіжає statistics планувальника; і freeze-ить старі transaction id, щоб відсунути wraparound. Зазвичай autovacuum запускає його автоматично, коли мертві tuples таблиці перетинають поріг — за замовчуванням 50 плюс 20% кількості рядків, з новою абсолютною стелею в PostgreSQL 18, щоб величезні таблиці не чекали на 20%. Тепер що йде не так, коли він відстає. Перше, bloat: мертві tuples накопичуються, таблиця та її indexes роздуваються на диску, cache hit ratio падає, і кожен scan читає більше pages — загальне повзуче сповільнення, яке жоден окремий запит не пояснює. Друге, і це staff-level пастка, довга чи idle-in-transaction сесія приколює xmin horizon, тож VACUUM навіть не має права прибирати мертві tuples, новіші за старт тієї транзакції, по всій базі — тож autovacuum може гнати на повну й усе одно bloat усюди, бо tuples непридатні. Третє, небезпечне: якщо freezing відстає, ви наближаєтесь до transaction-ID wraparound. XID 32-бітні й обертаються, тож невзаморожений tuple, старший за ~2 мільярди транзакцій, перекинувся б на «у майбутньому» і зник. PostgreSQL не дасть цьому статися тихо — він примусово запускає anti-wraparound autovacuum, навіть якщо autovacuum вимкнено, а якщо все одно не встигає, при лишку близько 3 мільйонів XID припиняє приймати нові записи, доки ви не вакуумите, що по суті є збоєм. Тож відставання VACUUM показується трьома наростаючими симптомами: повільний bloat, тоді незвільнюваний bloat по всій базі від довгої транзакції, тоді жорстка зупинка захисту від wraparound. Виправлення: налаштувати autovacuum досить агресивно на кожну таблицю, тримати транзакції короткими й вбивати idle-in-transaction сесії, і моніторити і кількість мертвих tuples, і age(datfrozenxid) як метрики здоровʼя, перш ніж будь-що з цього стане інцидентом.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'Contrast MVCC with strict two-phase locking. What does each cost, and when would you still reach for an explicit lock under MVCC?',
        uk: 'Порівняйте MVCC зі strict two-phase locking. Що коштує кожен, і коли ви все одно візьмете явний lock за MVCC?',
      },
      a: {
        en: "They are the optimistic and pessimistic answers to the same question. Strict two-phase locking is pessimistic: a transaction acquires shared locks to read and exclusive locks to write, and holds the write locks until commit. Because shared and exclusive locks conflict, a reader can block a writer and a writer can block a reader, so it serializes conflicting work by making transactions wait. Its costs are reduced concurrency — readers and writers queue behind each other — and deadlocks, since transactions that grab locks in different orders can form a wait-for cycle that has to be detected and broken. Its benefit is conceptual simplicity and no garbage: it overwrites in place, so there are no dead tuples to collect. MVCC is optimistic: it keeps multiple row versions, lets each transaction read a consistent snapshot, and almost never makes a reader and a writer wait on each other. Its cost is the mirror image: instead of waiting you produce dead tuples, so you need VACUUM, you have to manage bloat, long transactions pin the cleanup horizon, and you have to keep XID freezing ahead of wraparound. There's also a subtler correctness cost — plain snapshot isolation permits write-skew (M18), which pure locking would have blocked. As for when I'd still take an explicit lock under MVCC: whenever I need to read a row with the intent to modify it and prevent a concurrent writer from racing me — the read-modify-write pattern. The classic case is SELECT … FOR UPDATE to claim a row before updating it, so two workers don't both grab the same job or double-spend a balance; that converts a silent lost-update or write-skew into a clean wait. I'd also use advisory locks to serialize an application-level critical section that doesn't map to a single row. So the framing is: MVCC gives me non-blocking reads for free and I reach for explicit locks exactly at the points where I need a write-write conflict to be enforced that versioning alone wouldn't catch — and I take the weakest lock mode that does the job, in a consistent order, inside a retry loop.",
        uk: "Це оптимістична й песимістична відповіді на те саме питання. Strict two-phase locking песимістичний: транзакція набирає shared locks для читання й exclusive locks для запису і тримає write locks до commit. Оскільки shared і exclusive конфліктують, читач може блокувати записувача, а записувач — читача, тож він серіалізує конфліктну роботу, змушуючи транзакції чекати. Його ціна — знижена конкурентність (читачі й записувачі стоять у черзі одне за одним) і deadlocks, бо транзакції, що хапають locks у різному порядку, можуть утворити wait-for цикл, який треба виявити й розірвати. Його перевага — концептуальна простота й відсутність сміття: він перезаписує на місці, тож немає мертвих tuples для збирання. MVCC оптимістичний: він тримає кілька версій рядка, дає кожній транзакції читати узгоджений snapshot і майже ніколи не змушує читача й записувача чекати одне на одного. Його ціна — дзеркальна: замість очікування ви продукуєте мертві tuples, тож потрібен VACUUM, треба керувати bloat, довгі транзакції приколюють горизонт прибирання, і треба тримати XID-freezing попереду wraparound. Є й тонша ціна коректності — звичайна snapshot isolation дозволяє write-skew (M18), який чистий locking заблокував би. Щодо того, коли я все одно візьму явний lock за MVCC: щоразу, коли треба прочитати рядок із наміром його змінити й не дати конкурентному записувачу мене обігнати — патерн read-modify-write. Класичний випадок — SELECT … FOR UPDATE, щоб «застовпити» рядок перед оновленням, аби два workers не схопили те саме завдання й не витратили баланс двічі; це перетворює тихий lost-update чи write-skew на чисте очікування. Я б також вживав advisory locks, щоб серіалізувати критичну секцію рівня застосунку, що не лягає на один рядок. Тож формулювання таке: MVCC дає мені неблокувальні читання безкоштовно, а до явних locks я тягнуся саме там, де мені треба забезпечити write-write конфлікт, який саме лише версіонування не зловило б — і беру найслабший режим lock, що виконує роботу, в узгодженому порядку, всередині retry-циклу.",
      },
    },
  ],
  seeAlso: ['m18-isolation', 'm17-acid-wal', 'm20-distributed-tx', 'm12-storage', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 13.1. Introduction to MVCC ("reading never blocks writing and writing never blocks reading")',
      url: 'https://www.postgresql.org/docs/current/mvcc-intro.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 13.3. Explicit Locking (row-lock modes FOR UPDATE/NO KEY UPDATE/SHARE/KEY SHARE; deadlocks; consistent lock order)',
      url: 'https://www.postgresql.org/docs/current/explicit-locking.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 24.1. Routine Vacuuming (dead tuples, autovacuum thresholds, VACUUM vs VACUUM FULL, the visibility map, freezing & XID wraparound)',
      url: 'https://www.postgresql.org/docs/current/routine-vacuuming.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 73.5. Heap-Only Tuples (HOT): a new version on the same page with no new index entries when no indexed column changes',
      url: 'https://www.postgresql.org/docs/current/storage-hot.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 66.4 / system columns: xmin & xmax tuple headers, and the pg_xact commit log (32-bit xid vs 64-bit xid8)',
      url: 'https://www.postgresql.org/docs/current/transaction-id.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 20.10 Automatic Vacuuming GUCs (autovacuum_vacuum_threshold 50, scale_factor 0.2, max_threshold, autovacuum_freeze_max_age 200M)',
      url: 'https://www.postgresql.org/docs/current/runtime-config-autovacuum.html',
    },
  ],
};
