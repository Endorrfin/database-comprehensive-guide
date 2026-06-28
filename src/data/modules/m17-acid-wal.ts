import type { Module } from '../types';

/*
 * M17 · ACID & durability — Section IV (S9). Authored EN first, UA second; technical terms stay
 * English in both. Facts web-verified 2026-06-24 (see `sources`):
 *  - ACID = Atomicity, Consistency, Isolation, Durability; the acronym was coined by Härder & Reuter
 *    (1983), building on Gray's transaction concept. Consistency is the odd one out — it is mostly the
 *    application's invariants (constraints/triggers, M8), which the engine *enforces* but does not author.
 *  - WAL central rule (wal-intro 28.3): "changes to data files … must be written only after WAL
 *    records describing the changes have been flushed to permanent storage." → at COMMIT only the WAL
 *    is fsync'd (sequential, cheap); dirty data pages are flushed lazily. After a crash, "any changes
 *    that have not been applied to the data pages can be redone from the WAL records" = roll-forward / REDO.
 *  - One fsync of the WAL can commit MANY small concurrent transactions (group commit); the WAL is
 *    written sequentially, far cheaper than flushing scattered data pages.
 *  - Checkpoints (wal-configuration) flush dirty pages + write a checkpoint record; recovery REDOes
 *    only from the last checkpoint forward → the checkpoint bounds recovery time.
 *  - synchronous_commit (wal-async-commit 28.4): off = async commit; COMMIT returns before the WAL
 *    flush, so a crash can lose a small window of recently-"committed" txns (≤ ~3× wal_writer_delay),
 *    BUT the database is never left inconsistent — lost txns look cleanly aborted. Contrast fsync=off,
 *    which risks actual corruption. full_page_writes guards against torn pages.
 *  - PostgreSQL has no undo log: atomicity of an aborted/interrupted txn comes from MVCC — its tuple
 *    versions simply never become visible (commit status in the commit log) and are later vacuumed.
 *  - "Consistency" in ACID ≠ "Consistency" in CAP (M23): ACID-C = your invariants hold across one
 *    node's transaction; CAP-C = every node returns the latest write (linearizability) across a cluster.
 * Light signature module: ★ ACID/WAL stepper (key 'acid-wal') + figure 'wal-checkpoint'. PG stable 18.4.
 */
export const m17: Module = {
  id: 'm17-acid-wal',
  num: 17,
  section: 's4-transactions',
  order: 1,
  level: 'senior',
  signature: true,
  title: { en: 'ACID & durability', uk: 'ACID та durability' },
  tagline: {
    en: 'The four guarantees, the Write-Ahead Log, commit & crash recovery.',
    uk: 'Чотири гарантії, Write-Ahead Log, commit і відновлення після збою.',
  },
  readMins: 13,
  mentalModel: {
    en: "Write your intentions down first (the WAL); then it's safe to change the data.",
    uk: 'Спершу запишіть наміри (WAL); потім безпечно змінювати дані.',
  },
  topics: [
    {
      id: 'four-guarantees',
      title: { en: 'The four guarantees', uk: 'Чотири гарантії' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **transaction** is a group of reads and writes the database treats as one indivisible unit of work. **ACID** is the set of four guarantees a transactional database makes about it: **A**tomicity, **C**onsistency, **I**solation, **D**urability. The term was coined by Härder and Reuter in 1983 to name a contract that lets you reason about a complex program as if it ran alone and never half-failed. **Atomicity** is all-or-nothing: every change in the transaction lands, or none does. **Isolation** is the illusion of being alone: concurrent transactions don't see each other's half-finished work (M18, M19). **Durability** is permanence: once the database says *committed*, that result survives a crash or power loss. ",
            uk: "**Транзакція** — це група читань і записів, яку база даних трактує як одну неподільну одиницю роботи. **ACID** — це набір із чотирьох гарантій, які транзакційна база дає щодо неї: **A**tomicity, **C**onsistency, **I**solation, **D**urability. Термін увели Härder і Reuter 1983 року, щоб назвати контракт, який дозволяє міркувати про складну програму так, ніби вона працює сама й ніколи не падає наполовину. **Atomicity** — це все-або-нічого: усі зміни транзакції приземляються, або жодна. **Isolation** — це ілюзія самотності: конкурентні транзакції не бачать недороблену роботу одна одної (M18, M19). **Durability** — це сталість: щойно база сказала *committed*, цей результат переживає збій чи втрату живлення.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "**Consistency** is the odd one out. It says a committed transaction moves the database from one *valid* state to another — every declared rule (primary keys, foreign keys, `CHECK`, `NOT NULL`, M8) still holds afterward. But those rules are *yours*; the engine doesn't invent them, it only enforces the ones you declared, and refuses to commit a transaction that would break them. So Consistency is really the product of the other three plus your constraints: give the engine Atomicity, Isolation and Durability, declare your invariants, and the database keeps them true. Härder and Reuter folded it into the acronym; in practice the engine *mechanisms* are A, I, D — C is the contract you co-author.",
            uk: "**Consistency** — біла ворона. Вона каже, що зафіксована транзакція переводить базу з одного *валідного* стану в інший — кожне оголошене правило (primary keys, foreign keys, `CHECK`, `NOT NULL`, M8) досі тримається після неї. Але ці правила — *ваші*; движок їх не вигадує, лише забезпечує ті, що ви оголосили, і відмовляється фіксувати транзакцію, яка б їх порушила. Тож Consistency — це насправді продукт трьох інших плюс ваші constraints: дайте движку Atomicity, Isolation і Durability, оголосіть інваріанти — і база триматиме їх істинними. Härder і Reuter вклали її в акронім; на практиці *механізми* движка — це A, I, D, а C — контракт, який ви пишете спільно.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'The four letters and the mechanism behind each in PostgreSQL.',
            uk: 'Чотири літери й механізм за кожною в PostgreSQL.',
          },
          head: [
            { en: 'Letter', uk: 'Літера' },
            { en: 'Guarantee', uk: 'Гарантія' },
            { en: 'Mechanism', uk: 'Механізм' },
          ],
          rows: [
            [
              { en: 'Atomicity', uk: 'Atomicity' },
              { en: 'All of the transaction applies, or none of it', uk: 'Уся транзакція застосовується, або жодна її частина' },
              { en: 'WAL + a COMMIT record; no commit logged → changes discarded on recovery', uk: 'WAL + COMMIT-запис; commit не залоговано → зміни відкидаються при відновленні' },
            ],
            [
              { en: 'Consistency', uk: 'Consistency' },
              { en: 'A commit leaves every declared rule satisfied', uk: 'Commit лишає кожне оголошене правило виконаним' },
              { en: 'Constraints/triggers you declare (M8); the engine refuses to commit a violation', uk: 'Constraints/triggers, які ви оголошуєте (M8); движок не фіксує порушення' },
            ],
            [
              { en: 'Isolation', uk: 'Isolation' },
              { en: "Concurrent txns don't see each other's partial state", uk: 'Конкурентні txn не бачать часткового стану одна одної' },
              { en: 'MVCC snapshots + isolation levels (M18, M19)', uk: 'MVCC-снапшоти + isolation levels (M18, M19)' },
            ],
            [
              { en: 'Durability', uk: 'Durability' },
              { en: 'A committed result survives a crash', uk: 'Зафіксований результат переживає збій' },
              { en: "WAL fsync'd at commit; REDO replays it after a crash", uk: 'WAL fsync-ується на commit; REDO відтворює його після збою' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Atomicity and Durability are two faces of one mechanism', uk: 'Atomicity і Durability — два боки одного механізму' },
          md: {
            en: "Notice that **A** and **D** in the table share a column: the **WAL**. That is not a coincidence — a single write-ahead log delivers both. Durability is *replaying* the committed records after a crash; atomicity is *not* replaying a transaction that never logged a commit. The rest of this module is mostly the story of that one log.",
            uk: "Зверніть увагу: **A** і **D** у таблиці ділять колонку — **WAL**. Це не випадковість: один write-ahead log дає обидві. Durability — це *відтворення* зафіксованих записів після збою; atomicity — це *невідтворення* транзакції, яка так і не залогувала commit. Решта модуля — здебільшого історія цього одного логу.",
          },
        },
      ],
    },
    {
      id: 'the-wal',
      title: { en: 'The Write-Ahead Log', uk: 'Write-Ahead Log' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The naive way to make a change durable is to write the data page to disk on every commit. That is ruinously slow: a transaction touching three rows on three different pages would force three scattered **random** writes, each an `fsync`, before it could return. The **Write-Ahead Log (WAL)** breaks the bottleneck with one rule: *a change must be recorded in the log before the data page it modifies is written to disk.* At commit, you flush only the **log** — one **sequential** append — and leave the dirty data pages in memory to be written lazily later. The PostgreSQL manual states it directly: changes to data files must be written only after the WAL records describing them have been flushed to permanent storage.",
            uk: "Наївний спосіб зробити зміну durable — писати data page на диск при кожному commit. Це згубно повільно: транзакція, що зачіпає три рядки на трьох різних pages, змусила б три розкидані **випадкові** записи, кожен — `fsync`, перш ніж змогла б повернутися. **Write-Ahead Log (WAL)** ламає це вузьке місце одним правилом: *зміна має бути записана в лог, перш ніж data page, яку вона змінює, запишеться на диск.* На commit ви скидаєте лише **лог** — один **послідовний** дозапис — а брудні data pages лишаєте в памʼяті, щоб записати лінькувато згодом. Мануал PostgreSQL каже це прямо: зміни в data files мають записуватися лише після того, як WAL-записи, що їх описують, скинуто в стале сховище.",
          },
        },
        {
          kind: 'figure',
          fig: 'wal-checkpoint',
          caption: {
            en: 'The WAL is one append-only log. A change is logged before its page is flushed; COMMIT fsyncs the log (the durability point); a checkpoint flushes dirty pages and bounds how far back recovery must replay (REDO).',
            uk: 'WAL — це один лог лише-на-дозапис. Зміна логується перед скиданням її page; COMMIT робить fsync логу (точка durability); checkpoint скидає брудні pages і обмежує, як далеко назад має відтворювати відновлення (REDO).',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Two payoffs follow immediately. First, **throughput**: flushing one sequential log is far cheaper than flushing scattered pages, and because the log is shared, a single `fsync` can durably commit *many* concurrent transactions at once (group commit). Second, **recoverability**: if the server dies with dirty pages still in memory, the data files are stale — but every committed change is in the log, so on restart the database *redoes* them. Step the sim through both endings: the same WAL that makes a committed transfer durable also makes an uncommitted one vanish.",
            uk: "Дві вигоди випливають одразу. По-перше, **пропускна здатність**: скинути один послідовний лог куди дешевше, ніж розкидані pages, а оскільки лог спільний, один `fsync` може durable-зафіксувати *багато* конкурентних транзакцій разом (group commit). По-друге, **відновлюваність**: якщо сервер падає, поки брудні pages ще в памʼяті, data files застарілі — але кожна зафіксована зміна в лозі, тож при перезапуску база їх *redo*-їть. Прокрутіть симуляцію крізь обидва фінали: той самий WAL, що робить зафіксований переказ durable, змушує незафіксований зникнути.",
          },
        },
        {
          kind: 'sim',
          sim: 'acid-wal',
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The WAL is the engine, not just a safety net', uk: 'WAL — це двигун, а не лише страхувальна сітка' },
          md: {
            en: "Because the WAL already is an ordered, durable record of every change, the same stream powers far more than crash recovery: **replication** ships it to followers (M21), **point-in-time recovery** archives it to roll a backup forward to any instant (M24), and logical decoding turns it into a change feed for CDC. Learn the WAL once and four later modules click into place. (The log-structured idea also underlies LSM engines — M15 — where the WAL and the data structure are nearly the same thing.)",
            uk: "Оскільки WAL уже є впорядкованим, durable записом кожної зміни, той самий потік живить далеко не лише відновлення після збою: **replication** відправляє його на followers (M21), **point-in-time recovery** архівує його, щоб прокрутити backup уперед до будь-якої миті (M24), а logical decoding перетворює його на потік змін для CDC. Вивчіть WAL раз — і чотири пізніші модулі стають на місце. (Ідея log-structured також лежить в основі LSM-движків — M15 — де WAL і структура даних майже одне й те саме.)",
          },
        },
      ],
    },
    {
      id: 'commit-recovery',
      title: { en: 'Commit & crash recovery', uk: 'Commit і відновлення після збою' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Recovery is **roll-forward (REDO)**. After a crash the database does not start from nothing; it starts from the last **checkpoint** — a point at which all dirty pages up to then were flushed and a checkpoint record written — and replays the WAL forward from there, re-applying every logged change to the data files. The checkpoint is what **bounds** recovery: without one, replay would have to start at the beginning of time; with frequent ones, restart is quick but the steady-state write cost rises (more pages flushed more often). It is a tuning trade between fast recovery and low runtime overhead.",
            uk: "Відновлення — це **roll-forward (REDO)**. Після збою база не починає з нуля; вона стартує з останнього **checkpoint** — моменту, коли всі брудні pages до нього було скинуто й записано checkpoint-запис — і відтворює WAL уперед звідти, повторно застосовуючи кожну залоговану зміну до data files. Саме checkpoint **обмежує** відновлення: без нього відтворення мусило б починатися від початку часів; із частими — перезапуск швидкий, але стала вартість запису росте (більше pages скидається частіше). Це компроміс налаштування між швидким відновленням і малими накладними витратами під час роботи.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Where is the durability line drawn at commit? At the `fsync` of the WAL. The setting **`synchronous_commit`** controls it. Left **on** (the default), `COMMIT` does not return until the log is on disk — a transaction you were told committed is durable, full stop. Turned **off** (asynchronous commit), `COMMIT` returns *before* the flush, so a crash can lose a small window of the most-recent \"committed\" transactions (bounded by roughly three times `wal_writer_delay`). Crucially, even then the database is **not corrupted**: the lost transactions look exactly as if they had been cleanly aborted. That is a real per-transaction knob — trade a little durability for throughput on data you can afford to lose.",
            uk: "Де проводиться лінія durability на commit? На `fsync` WAL. Налаштування **`synchronous_commit`** ним керує. Лишене **on** (дефолт), `COMMIT` не повертається, доки лог не на диску — транзакція, про яку вам сказали «committed», durable, крапка. Вимкнене **off** (asynchronous commit), `COMMIT` повертається *до* скидання, тож збій може втратити невелике вікно найсвіжіших «зафіксованих» транзакцій (обмежене приблизно потрійним `wal_writer_delay`). Головне: навіть тоді база **не пошкоджена**: втрачені транзакції виглядають точно так, ніби їх чисто відкотили. Це справжній ручок на рівні транзакції — проміняти трохи durability на пропускну здатність для даних, які ви можете дозволити собі втратити.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'synchronous_commit = on (default)', uk: 'synchronous_commit = on (дефолт)' },
          b: { en: 'synchronous_commit = off (async)', uk: 'synchronous_commit = off (async)' },
          rows: [
            [
              { en: 'COMMIT returns', uk: 'COMMIT повертається' },
              { en: 'after the WAL is fsync’d to disk', uk: 'після fsync WAL на диск' },
              { en: 'immediately; WAL flushed shortly after', uk: 'одразу; WAL скидається трохи згодом' },
            ],
            [
              { en: 'On crash', uk: 'При збої' },
              { en: 'no committed transaction is lost', uk: 'жодна зафіксована транзакція не втрачається' },
              { en: 'a small window of recent commits can be lost', uk: 'мале вікно свіжих commit-ів може втратитися' },
            ],
            [
              { en: 'Database integrity', uk: 'Цілісність бази' },
              { en: 'intact', uk: 'збережена' },
              { en: 'still intact — lost txns look cleanly aborted', uk: 'досі збережена — втрачені txn виглядають чисто відкоченими' },
            ],
            [
              { en: 'Reach for it when', uk: 'Брати, коли' },
              { en: 'money, orders, anything you must not lose', uk: 'гроші, замовлення, усе, що не можна втратити' },
              { en: 'high-volume, loss-tolerant writes (events, metrics)', uk: 'великий обсяг, втрато-толерантні записи (events, metrics)' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Durability is the default: COMMIT waits for the WAL fsync.
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;                         -- returns only once the WAL is on disk

-- Trade a little durability for throughput on NON-critical writes, per transaction:
BEGIN;
  SET LOCAL synchronous_commit = off;   -- this COMMIT returns before the WAL flush
  INSERT INTO events (kind, payload) VALUES ('click', '{...}');
COMMIT;   -- a crash may lose the last few events…
          -- …but the database is never left inconsistent (unlike fsync = off).`,
          note: {
            en: 'synchronous_commit is a safe, per-transaction durability/throughput dial. fsync and full_page_writes are NOT — see the warning below.',
            uk: 'synchronous_commit — безпечний ручок durability/throughput на рівні транзакції. fsync і full_page_writes — НІ — див. попередження нижче.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'fsync = off is not a performance tip — it risks corruption', uk: 'fsync = off — не порада щодо швидкодії, це ризик пошкодження' },
          md: {
            en: "It is tempting to read `synchronous_commit = off` and reach for `fsync = off` too. Don't. Turning **`fsync` off** removes the guarantee that the WAL and data pages reach disk in the right order, so a crash can leave **physically corrupt** files — not lost transactions, *broken* ones. Likewise **`full_page_writes`** exists to survive a *torn page* (a page half-written when power failed) by logging the whole page image on first change after a checkpoint; turning it off to save WAL volume reintroduces that risk. The rule of thumb: `synchronous_commit` trades *recent durability* and is reversible per transaction; `fsync`/`full_page_writes` trade *integrity* and belong only on a database you are willing to rebuild from scratch.",
            uk: "Спокусливо прочитати `synchronous_commit = off` і потягтися також за `fsync = off`. Не треба. Вимкнення **`fsync`** прибирає гарантію, що WAL і data pages дістаються диска в правильному порядку, тож збій може лишити **фізично пошкоджені** файли — не втрачені транзакції, а *зламані*. Так само **`full_page_writes`** існує, щоб пережити *torn page* (page, записаний наполовину, коли зникло живлення), логуючи повний образ page при першій зміні після checkpoint; вимкнути його заради економії обсягу WAL — повернути той ризик. Орієнтир: `synchronous_commit` міняє *свіжу durability* і оборотний на рівні транзакції; `fsync`/`full_page_writes` міняють *цілісність* і доречні лише на базі, яку ви готові відбудувати з нуля.",
          },
        },
      ],
    },
    {
      id: 'consistency-vs-cap',
      title: { en: '“Consistency” here vs in CAP', uk: '«Consistency» тут проти CAP' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "One word, two unrelated meanings — and conflating them causes endless confusion. The **C in ACID** is about a *single* database honoring *your* declared invariants across one transaction: after a commit, the books balance and the foreign keys point at real rows. The **C in CAP** (M23) is a *distributed* property: every node in a cluster returns the most-recent write, so a read never sees a stale replica (this is closer to what theorists call *linearizability*). A single-node PostgreSQL is fully ACID-consistent and the question of CAP-consistency doesn't even arise — there is only one node. The moment you add replicas, ACID-C still holds on each node, but CAP-C becomes a deliberate trade against availability during a network partition.",
            uk: "Одне слово, два неповʼязані значення — і їх плутанина породжує безкінечну плутанину. **C в ACID** — про те, що *одна* база шанує *ваші* оголошені інваріанти в межах однієї транзакції: після commit баланси сходяться, а foreign keys вказують на реальні рядки. **C в CAP** (M23) — *розподілена* властивість: кожен node у кластері повертає найсвіжіший запис, тож читання ніколи не бачить застарілу репліку (це ближче до того, що теоретики звуть *linearizability*). Однонодова PostgreSQL повністю ACID-consistent, і питання CAP-consistency навіть не постає — node лише один. Щойно ви додаєте репліки, ACID-C досі тримається на кожному node, але CAP-C стає свідомим компромісом проти доступності під час network partition.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Atomicity isn’t undo — PostgreSQL has no undo log', uk: 'Atomicity — це не undo: у PostgreSQL немає undo-логу' },
          md: {
            en: "A common mental model is \"recovery redoes committed transactions and undoes uncommitted ones,\" as in the classic ARIES design. PostgreSQL achieves atomicity differently: it has **no undo log**. Recovery only ever rolls *forward* (REDO). An aborted or crash-interrupted transaction is undone *for free* by MVCC — its tuple versions were tagged with its transaction id, the commit log marks that id as not-committed, so those versions simply never become visible to anyone, and `VACUUM` reclaims them later (M19). So \"all-or-nothing\" here means \"its rows never become visible,\" not \"a separate pass erases them.\" Different engines (Oracle, MySQL/InnoDB) *do* keep an undo log; the guarantee is identical, the mechanism is not.",
            uk: "Поширена ментальна модель — «відновлення redo-їть зафіксовані транзакції й undo-їть незафіксовані», як у класичному ARIES. PostgreSQL досягає atomicity інакше: у нього **немає undo-логу**. Відновлення завжди котиться лише *вперед* (REDO). Відкочена чи перервана збоєм транзакція скасовується *безкоштовно* завдяки MVCC — її версії рядків позначені її transaction id, commit log маркує цей id як незафіксований, тож ці версії просто ніколи не стають видимими нікому, а `VACUUM` звільняє їх згодом (M19). Тож «все-або-нічого» тут означає «її рядки ніколи не стають видимими», а не «окремий прохід їх стирає». Інші движки (Oracle, MySQL/InnoDB) *тримають* undo-лог; гарантія однакова, механізм — ні.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'ACID = Atomicity, Consistency, Isolation, Durability (Härder & Reuter, 1983). A/I/D are engine mechanisms; Consistency is mostly your declared invariants (constraints/triggers) that the engine enforces — the odd one out.',
      uk: 'ACID = Atomicity, Consistency, Isolation, Durability (Härder & Reuter, 1983). A/I/D — механізми движка; Consistency — здебільшого ваші оголошені інваріанти (constraints/triggers), які движок забезпечує — біла ворона.',
    },
    {
      en: 'The WAL rule: log a change before flushing its data page. At COMMIT only the sequential log is fsync’d (cheap; one fsync commits many txns via group commit); dirty pages flush lazily. This single log delivers both Durability and Atomicity.',
      uk: 'Правило WAL: залогувати зміну перед скиданням її data page. На COMMIT fsync-ується лише послідовний лог (дешево; один fsync фіксує багато txn через group commit); брудні pages скидаються лінькувато. Цей один лог дає і Durability, і Atomicity.',
    },
    {
      en: 'Recovery is roll-forward (REDO) from the last checkpoint: replay the WAL into the data files. A committed change survives (it is in the log); an interrupted one with no COMMIT record is discarded. The checkpoint bounds recovery time.',
      uk: 'Відновлення — roll-forward (REDO) від останнього checkpoint: відтворити WAL у data files. Зафіксована зміна виживає (вона в лозі); перервана без COMMIT-запису відкидається. Checkpoint обмежує час відновлення.',
    },
    {
      en: 'synchronous_commit = off (async commit) loses at most a small window of recent commits on a crash but never corrupts the database — a safe per-transaction durability/throughput dial. fsync = off / full_page_writes = off trade integrity, not just freshness, and risk real corruption.',
      uk: 'synchronous_commit = off (async commit) втрачає щонайбільше мале вікно свіжих commit-ів при збої, але ніколи не псує базу — безпечний ручок durability/throughput на рівні транзакції. fsync = off / full_page_writes = off міняють цілісність, а не лише свіжість, і ризикують справжнім пошкодженням.',
    },
    {
      en: 'The C in ACID (one node honours your invariants) ≠ the C in CAP (every node in a cluster returns the latest write). PostgreSQL also has no undo log: atomicity comes from MVCC — an aborted txn’s tuple versions simply never become visible and are vacuumed.',
      uk: 'C в ACID (один node шанує ваші інваріанти) ≠ C в CAP (кожен node кластера повертає найсвіжіший запис). У PostgreSQL також немає undo-логу: atomicity йде від MVCC — версії рядків відкоченої txn просто ніколи не стають видимими й вичищаються vacuum.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Thinking “committed” means “written to the data files”', uk: 'Думати, що «committed» означає «записано в data files»' },
      body: {
        en: 'At commit, the only thing guaranteed on disk is the WAL. The actual data pages are usually still dirty in memory and get flushed lazily, or at the next checkpoint. That is not a weakness — it is the whole point: flushing one sequential log is cheap, and the log is enough to reconstruct the pages after a crash. If you assume a commit immediately rewrote the table’s pages, you will misjudge both performance (commits are cheaper than you think) and recovery (the WAL, not the data files, is the source of truth).',
        uk: 'На commit на диску гарантовано лише WAL. Самі data pages зазвичай ще брудні в памʼяті й скидаються лінькувато або при наступному checkpoint. Це не слабкість — це і є суть: скинути один послідовний лог дешево, а логу досить, щоб відтворити pages після збою. Якщо припустити, що commit одразу перезаписав pages таблиці, ви хибно оціните і швидкодію (commit-и дешевші, ніж здається), і відновлення (джерело істини — WAL, а не data files).',
      },
    },
    {
      title: { en: 'Disabling fsync to “speed things up”', uk: 'Вимкнути fsync, щоб «прискорити»' },
      body: {
        en: 'fsync = off can make a benchmark look fast, but it removes the ordering guarantee between the WAL and the data files, so a crash can leave physically corrupt files — a far worse outcome than slow commits. If durability cost is the problem, the right tools are synchronous_commit = off (loses a tiny window, never corrupts), batching work into fewer larger transactions, or faster storage. Reserve fsync = off for a throwaway database you can rebuild from scratch (e.g. an initial bulk load before going live), and turn it back on before anyone depends on the data.',
        uk: 'fsync = off може зробити бенчмарк швидким, але прибирає гарантію порядку між WAL і data files, тож збій може лишити фізично пошкоджені файли — куди гірше за повільні commit-и. Якщо проблема у вартості durability, правильні інструменти — synchronous_commit = off (втрачає крихітне вікно, ніколи не псує), групування роботи в менше більших транзакцій або швидше сховище. Лишайте fsync = off лише для одноразової бази, яку можна відбудувати з нуля (напр., початкове bulk-завантаження до запуску), і вмикайте назад, перш ніж хтось залежатиме від даних.',
      },
    },
    {
      title: { en: 'Confusing the C in ACID with the C in CAP', uk: 'Плутати C в ACID з C в CAP' },
      body: {
        en: 'They are different words that happen to share a letter. ACID consistency is a single database keeping your declared constraints true across a transaction; CAP consistency is a distributed system having every node agree on the latest write. A system can be ACID-consistent on each node and still make a CAP trade-off (choosing availability over cross-node consistency during a partition). Saying “it’s an ACID database so it’s CAP-consistent” is a category error — the two live at different layers (one transaction vs many nodes).',
        uk: 'Це різні слова, що випадково ділять літеру. ACID-consistency — одна база тримає ваші оголошені constraints істинними в межах транзакції; CAP-consistency — розподілена система, де кожен node згоден щодо найсвіжішого запису. Система може бути ACID-consistent на кожному node і все одно робити CAP-компроміс (обираючи доступність над міжнодовою consistency під час partition). Казати «це ACID-база, тож вона CAP-consistent» — категоріальна помилка: вони на різних шарах (одна транзакція проти багатьох nodes).',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'What does the Write-Ahead Log guarantee, and why is logging changes cheaper than flushing the data pages on every commit?',
        uk: 'Що гарантує Write-Ahead Log і чому логувати зміни дешевше, ніж скидати data pages при кожному commit?',
      },
      a: {
        en: 'The WAL guarantees durability and underpins atomicity by enforcing one rule: a change is recorded in the log, on disk, before the data page it modifies is written to disk. That ordering means that after a crash you can always reconstruct the data files by replaying the log — any committed change that hadn’t yet reached its data page gets redone from the WAL. It is cheaper than flushing data pages on commit for two reasons. First, locality: the WAL is a single sequential append, so committing is one sequential fsync, whereas the rows a transaction touches usually live on different pages scattered across the heap, which would be several random writes. Sequential I/O is dramatically cheaper than random I/O. Second, batching: because the log is shared and sequential, one fsync of the WAL can durably commit many concurrent transactions at once — group commit — so under load the per-transaction flush cost amortizes toward zero. The data pages themselves stay dirty in the buffer cache and are flushed lazily in the background, or rolled up by a checkpoint. So the WAL converts “make N scattered pages durable” into “make one log durable,” which is both faster and sufficient, because the log is enough to rebuild the pages. The mental model is: write your intentions down first; then changing the data is safe, because the intention is already permanent.',
        uk: 'WAL гарантує durability й підпирає atomicity, забезпечуючи одне правило: зміна записується в лог, на диск, перш ніж data page, яку вона змінює, запишеться на диск. Цей порядок означає, що після збою ви завжди можете відтворити data files, відтворивши лог — будь-яка зафіксована зміна, що ще не дійшла до своєї data page, redo-їться з WAL. Це дешевше за скидання data pages на commit з двох причин. Перша — локальність: WAL — це єдиний послідовний дозапис, тож commit — це один послідовний fsync, тоді як рядки, яких торкається транзакція, зазвичай лежать на різних pages, розкиданих по heap, що було б кількома випадковими записами. Послідовний I/O драматично дешевший за випадковий. Друга — групування: оскільки лог спільний і послідовний, один fsync WAL може durable-зафіксувати багато конкурентних транзакцій разом — group commit — тож під навантаженням вартість скидання на транзакцію амортизується до нуля. Самі data pages лишаються брудними в buffer cache і скидаються лінькувато у фоні або згортаються checkpoint-ом. Тож WAL перетворює «зробити N розкиданих pages durable» на «зробити один лог durable», що і швидше, і достатньо, бо логу досить, щоб відбудувати pages. Ментальна модель: спершу запишіть наміри; тоді змінювати дані безпечно, бо намір уже сталий.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'Trace what happens on COMMIT and then a crash. How does a committed transaction survive, and how is an uncommitted one undone?',
        uk: 'Простежте, що стається на COMMIT і потім збій. Як зафіксована транзакція виживає і як скасовується незафіксована?',
      },
      a: {
        en: 'As the transaction runs, each change appends a redo record to the WAL and dirties the corresponding page in the buffer cache; the on-disk data files are not touched yet. The decisive moment is COMMIT: it writes a commit record to the WAL and fsyncs the log up to that point. That fsync is the durability line — the client is told “committed” only once the log, including the commit record, is physically on disk. The dirty data pages may still be only in memory at this instant. Now the server crashes. Memory is wiped, so the dirty pages are gone, and the data files are stale because the changes never reached them. But the WAL on disk is intact and contains the commit record. On restart, recovery rolls forward from the last checkpoint, replaying the WAL: it sees the change records and the commit record, re-applies the changes to the data files, and the transaction is durable — that is durability. For the uncommitted case, imagine the crash happened before COMMIT. The WAL holds the transaction’s change records but no commit record. Recovery may even replay those change records onto pages, but because there is no commit record the transaction is treated as aborted, and in PostgreSQL specifically its tuple versions simply never become visible — the commit log marks the transaction id as not committed, so MVCC hides those rows, and VACUUM reclaims them later. There is no separate undo pass. Either way the invariant holds: a transaction is all-or-nothing, and “committed” is exactly the same as “its commit record is durably in the WAL.”',
        uk: 'Поки транзакція виконується, кожна зміна додає redo-запис до WAL і бруднить відповідну page в buffer cache; data files на диску ще не зачеплені. Вирішальна мить — COMMIT: він пише commit-запис у WAL і fsync-ить лог до цієї точки. Цей fsync — лінія durability: клієнту кажуть «committed» лише коли лог, включно з commit-записом, фізично на диску. Брудні data pages цієї миті можуть бути ще лише в памʼяті. Тепер сервер падає. Памʼять стерто, тож брудні pages зникли, а data files застарілі, бо зміни до них не дійшли. Але WAL на диску цілий і містить commit-запис. При перезапуску відновлення котиться вперед від останнього checkpoint, відтворюючи WAL: воно бачить записи змін і commit-запис, повторно застосовує зміни до data files — і транзакція durable; це і є durability. Для незафіксованого випадку уявіть, що збій стався до COMMIT. WAL тримає записи змін транзакції, але жодного commit-запису. Відновлення може навіть відтворити ці записи змін на pages, але оскільки commit-запису немає, транзакція трактується як aborted, і саме в PostgreSQL її версії рядків просто ніколи не стають видимими — commit log маркує transaction id як незафіксований, тож MVCC ховає ці рядки, а VACUUM звільняє їх згодом. Окремого undo-проходу немає. У будь-якому разі інваріант тримається: транзакція — все-або-нічого, а «committed» — точно те саме, що «її commit-запис durable у WAL».',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A teammate proposes setting fsync = off to speed up writes. What do you tell them, and what would you do instead?',
        uk: 'Колега пропонує поставити fsync = off, щоб прискорити записи. Що ви йому скажете і що зробите натомість?',
      },
      a: {
        en: 'I’d push back, because fsync = off and synchronous_commit = off look similar but trade away very different things. synchronous_commit = off is asynchronous commit: COMMIT returns before the WAL is flushed, so a crash can lose a small, bounded window of the most recent transactions — roughly up to three times wal_writer_delay. The important property is that it never corrupts the database; the lost transactions look exactly as if they had been cleanly aborted, because the WAL is still written in order, just slightly later. That makes it a legitimate, even per-transaction, dial — perfectly fine for high-volume, loss-tolerant writes like event logs or metrics, and you can keep it on for the money paths. fsync = off is a different beast: it removes the guarantee that the WAL and the data pages are forced to durable storage in the correct order, so a crash can leave physically inconsistent files — torn pages, a data page newer than the WAL that describes it — which is corruption, not lost data. There’s no clean recovery from that. So my answer is: never run fsync = off on a database anyone depends on. If write latency is the real problem, I’d first measure where it’s going, then reach for the safe options in order: batch many small writes into fewer larger transactions to amortize the commit fsync; use synchronous_commit = off selectively for non-critical writes; make sure group commit is doing its job under concurrency (commit_delay can help at very high rates); and put the WAL on fast storage. The only place I’d tolerate fsync = off is a throwaway instance during an initial bulk load with nothing to lose, and I’d turn it back on and checkpoint before the data matters. The framing I want to leave them with is: synchronous_commit trades recent durability and is reversible; fsync trades integrity and isn’t.',
        uk: 'Я б заперечив, бо fsync = off і synchronous_commit = off схожі, але міняють дуже різне. synchronous_commit = off — це асинхронний commit: COMMIT повертається до скидання WAL, тож збій може втратити мале, обмежене вікно найсвіжіших транзакцій — приблизно до потрійного wal_writer_delay. Важлива властивість: воно ніколи не псує базу; втрачені транзакції виглядають точно так, ніби їх чисто відкотили, бо WAL усе одно пишеться по порядку, лише трохи згодом. Це робить його легітимним ручком, навіть на рівні транзакції — цілком придатним для великого обсягу втрато-толерантних записів на кшталт event logs чи metrics, а на грошових шляхах можна лишити on. fsync = off — інший звір: воно прибирає гарантію, що WAL і data pages примусово дістаються сталого сховища в правильному порядку, тож збій може лишити фізично неузгоджені файли — torn pages, data page новіша за WAL, що її описує — а це пошкодження, а не втрата даних. Чистого відновлення з цього немає. Тож моя відповідь: ніколи не запускати fsync = off на базі, від якої хтось залежить. Якщо проблема справді в latency запису, я б спершу виміряв, куди він іде, а тоді брав безпечні опції за порядком: групувати багато дрібних записів у менше більших транзакцій, щоб амортизувати commit-fsync; вибірково вживати synchronous_commit = off для некритичних записів; переконатися, що group commit працює під конкурентністю (commit_delay може допомогти за дуже високих темпів); і покласти WAL на швидке сховище. Єдине місце, де я б стерпів fsync = off — одноразовий інстанс під час початкового bulk-завантаження, де нема чого втрачати, і я б увімкнув його назад і зробив checkpoint, перш ніж дані стануть важливі. Думка, яку хочу лишити: synchronous_commit міняє свіжу durability й оборотний; fsync міняє цілісність і ні.',
      },
    },
  ],
  seeAlso: ['m18-isolation', 'm19-mvcc', 'm24-ha-backups-dr', 'm15-lsm', 'm1-what-is-a-database'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — 28.3. Write-Ahead Logging (WAL): log-before-pages; roll-forward/REDO recovery; one fsync commits many txns',
      url: 'https://www.postgresql.org/docs/current/wal-intro.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 28.4. Asynchronous Commit (synchronous_commit = off: lose a small window of commits, but no inconsistency)',
      url: 'https://www.postgresql.org/docs/current/wal-async-commit.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 19.5. Write Ahead Log settings (fsync, synchronous_commit, full_page_writes, wal_writer_delay)',
      url: 'https://www.postgresql.org/docs/current/runtime-config-wal.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 30.5. WAL Configuration (checkpoints; recovery replays from the last checkpoint)',
      url: 'https://www.postgresql.org/docs/current/wal-configuration.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 28.1. Reliability (fsync, torn pages, full_page_writes — why fsync = off risks corruption)',
      url: 'https://www.postgresql.org/docs/current/wal-reliability.html',
    },
    {
      title: 'Härder & Reuter, “Principles of Transaction-Oriented Database Recovery”, ACM Computing Surveys 15(4):287–317 (1983) — the paper that coined ACID',
      url: 'https://dl.acm.org/doi/10.1145/289.291',
    },
  ],
};
