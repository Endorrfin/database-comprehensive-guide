import type { Module } from '../types';

/*
 * M20 · Distributed transactions — Section IV (S10), the close of the transactions section. Authored
 * EN first, UA second; technical terms stay English in both. Facts web-verified 2026-06-24 (see
 * `sources`):
 *  - Single-node ACID is nearly free (one WAL, one lock manager, one commit — M17). Across machines
 *    there is no shared commit → the DUAL-WRITE problem: commit on A, crash before B → inconsistency.
 *  - 2PC (Gray 1978; Gray & Lamport 2006): coordinator + participants; phase 1 prepare/vote (each
 *    durably prepares, a "yes" is a binding promise it can no longer abort), phase 2 commit/abort.
 *    The blocking problem: a coordinator crash AFTER prepare leaves participants in-doubt, holding
 *    locks, until the coordinator recovers. 3PC adds a pre-commit phase but assumes a synchronous
 *    network + fail-stop and does NOT survive partitions → impractical.
 *  - PostgreSQL 2PC: PREPARE TRANSACTION / COMMIT PREPARED / ROLLBACK PREPARED; max_prepared_transactions
 *    default 0 (2PC OFF by default); "not intended for applications" — it is for an external
 *    transaction manager (X/Open XA). Orphaned prepared xacts hold locks AND block VACUUM / pin the
 *    xmin horizon → wraparound risk (M19). Visible in pg_prepared_xacts.
 *  - Sagas (Garcia-Molina & Salem, SIGMOD 1987): a long transaction = a sequence of local
 *    transactions, each with a COMPENSATING transaction to semantically undo it. Orchestration
 *    (central coordinator) vs choreography (event-driven). A saga gives ACD WITHOUT I (no isolation):
 *    intermediate states are visible → countermeasures (semantic lock e.g. a PENDING flag, commutative
 *    updates). A compensation is forward-undo (a refund), not a rollback; must be idempotent.
 *  - Transactional outbox (microservices.io): the dual-write problem — you cannot atomically write the
 *    DB AND publish to a broker. Solution: write the business row + an event row to an OUTBOX table in
 *    the SAME local transaction; a message relay publishes them — polling publisher or transaction-log
 *    tailing / CDC (Debezium reading the WAL via logical decoding, M21). LISTEN/NOTIFY is transient,
 *    NOT a durable substitute.
 *  - Idempotency: the relay/broker delivers at-least-once → consumers MUST be idempotent (dedup table /
 *    idempotency key, ideally recorded in the same txn as the side effect).
 *  - "Exactly-once" myth: exactly-once DELIVERY is impossible in general (Two Generals / FLP). What is
 *    achievable = at-least-once delivery + idempotent processing = "effectively-once". Kafka EOS
 *    (idempotent producer + transactions) is exactly-once WITHIN Kafka's read-process-write loop, NOT
 *    for arbitrary external side effects (a DB write, a REST call, an email).
 * Originally planned figures-only; S10 follow-up pulled the ★ 2PC coordinator-crash stepper forward
 * from the §13 backlog at the user's request, so M20 is now signature:true. Assets: the ★ sim '2pc'
 * (prepare/vote/commit, or coordinator crash → participants in-doubt, blocking) + 3 figures
 * ('two-phase-commit', 'saga-compensation', 'outbox-pattern'). PostgreSQL stable 18.4; 19 Beta 1.
 */
export const m20: Module = {
  id: 'm20-distributed-tx',
  num: 20,
  section: 's4-transactions',
  order: 4,
  level: 'staff',
  signature: true,
  title: { en: 'Distributed transactions', uk: 'Розподілені транзакції' },
  tagline: {
    en: '2PC and its blocking problem, sagas & compensation, the outbox, idempotency, the exactly-once myth.',
    uk: '2PC і його проблема блокування, sagas і компенсація, outbox, idempotency, міф exactly-once.',
  },
  readMins: 13,
  mentalModel: {
    en: "Across machines you agree then act — or you undo. There is no shared commit, and 'exactly-once' is a myth.",
    uk: 'Між машинами ви домовляєтесь, тоді дієте — або відкочуєте. Спільного commit немає, а «exactly-once» — міф.',
  },
  topics: [
    {
      id: 'why-distribution-breaks-acid',
      title: { en: 'Why distribution breaks single-node ACID', uk: 'Чому розподіл ламає однонодовий ACID' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "On one machine, a transaction gets ACID almost for free. There is one Write-Ahead Log, one lock manager, one commit — the single `fsync` of the WAL is the indivisible moment when everything becomes durable at once (M17). The instant you span **two** machines, that foundation is gone: two databases, or a database and a message broker, or two microservices each with its own store, share **no WAL, no lock manager, and — fatally — no single commit point**. You can commit on machine A and crash before committing on machine B, and now they disagree with no automatic way to reconcile.",
            uk: "На одній машині транзакція отримує ACID майже безкоштовно. Є один Write-Ahead Log, один lock manager, один commit — єдиний `fsync` WAL і є тією неподільною миттю, коли все одразу стає durable (M17). Тієї ж секунди, коли ви охоплюєте **дві** машини, ця основа зникає: дві бази, або база й message broker, або два мікросервіси, кожен зі своїм сховищем, не мають **ні спільного WAL, ні lock manager, ні — фатально — єдиної точки commit**. Ви можете зафіксуватися на машині A й упасти до фіксації на машині B, і тепер вони не згодні без жодного автоматичного способу примирення.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "This is the **dual-write problem** in its most general form: *two independent systems, and no atomic \"both or neither.\"* Every technique in this module is an imperfect answer to it. You can try to make the two systems commit **together** with a coordinator — two-phase commit — and pay with blocking and fragility. Or you can accept that they will be **inconsistent for a while** and reconcile afterward — sagas, the outbox, idempotency — and pay with eventual consistency and visible intermediate states. There is no third option that gives you single-node ACID across machines for free; distribution doesn't hand you a stronger guarantee, it forces you to choose **which weaker one you can live with**.",
            uk: "Це **dual-write problem** у найзагальнішій формі: *дві незалежні системи й жодного атомарного «обидві або жодна».* Кожна техніка цього модуля — недосконала відповідь на неї. Можна спробувати змусити дві системи зафіксуватися **разом** через координатора — two-phase commit — і заплатити блокуванням і крихкістю. Або можна прийняти, що вони будуть **певний час неузгоджені** й примиритися згодом — sagas, outbox, idempotency — і заплатити eventual consistency та видимими проміжними станами. Третього варіанта, що дав би однонодовий ACID між машинами безкоштовно, немає; розподіл не вручає вам сильнішу гарантію, він змушує обрати, **з якою слабшою ви можете жити**.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: "The honest framing: you are choosing which guarantee to weaken", uk: 'Чесне формулювання: ви обираєте, яку гарантію послабити' },
          md: {
            en: "It is tempting to look for a tool that restores full ACID across services. There isn't one — and chasing it is how teams end up with brittle distributed 2PC everywhere. The professional move is to name the trade out loud: 2PC keeps **atomicity** but sacrifices **availability** (a participant or coordinator being down blocks the whole transaction); sagas keep **availability** but sacrifice **isolation** (other transactions see the half-finished state). Once you frame distribution as *which letter of ACID am I relaxing, and is that acceptable for this specific workflow*, the choice between 2PC and a saga becomes an engineering decision instead of a search for a guarantee that cannot exist.",
            uk: "Спокусливо шукати інструмент, що відновить повний ACID між сервісами. Його немає — і гонитва за ним — це те, як команди опиняються з крихким розподіленим 2PC усюди. Професійний хід — назвати компроміс уголос: 2PC тримає **atomicity**, але жертвує **availability** (недоступність учасника чи координатора блокує всю транзакцію); sagas тримають **availability**, але жертвують **isolation** (інші транзакції бачать недороблений стан). Щойно ви формулюєте розподіл як *яку літеру ACID я послаблюю і чи прийнятно це для цього конкретного workflow*, вибір між 2PC і saga стає інженерним рішенням, а не пошуком гарантії, якої не може бути.",
          },
        },
      ],
    },
    {
      id: 'two-phase-commit',
      title: { en: 'Two-phase commit & its blocking problem', uk: 'Two-phase commit і його проблема блокування' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**Two-phase commit (2PC)** is the textbook way to make several participants commit atomically. A **coordinator** drives two rounds. **Phase 1 — prepare/vote:** the coordinator asks every participant to *prepare*; each one durably writes its changes to disk so it *could* commit even after a crash, then votes **yes** or **no**. A yes vote is a **binding promise** — the participant has given up its right to abort on its own. **Phase 2 — commit/abort:** if *every* participant voted yes, the coordinator decides commit and tells everyone to commit; if even one voted no, it decides abort. Done right, all participants reach the same decision, which is the whole point: atomic agreement across machines.",
            uk: "**Two-phase commit (2PC)** — це підручниковий спосіб змусити кількох учасників зафіксуватися атомарно. **Координатор** веде два раунди. **Фаза 1 — prepare/vote:** координатор просить кожного учасника *підготуватися*; кожен durable записує свої зміни на диск, щоб *міг* зафіксуватися навіть після збою, тоді голосує **yes** чи **no**. Голос yes — це **звʼязуюча обіцянка**: учасник відмовився від права скасувати самостійно. **Фаза 2 — commit/abort:** якщо *кожен* учасник проголосував yes, координатор вирішує commit і каже всім фіксуватися; якщо хоч один проголосував no, він вирішує abort. Зроблено правильно, усі учасники доходять одного рішення, у чому й суть: атомарна згода між машинами.",
          },
        },
        {
          kind: 'figure',
          fig: 'two-phase-commit',
          caption: {
            en: 'Two-phase commit: the coordinator runs a prepare/vote round, then a commit/abort round. The danger is the gap between them — if the coordinator crashes after participants have voted yes (and durably prepared, holding their locks), the prepared participants are stuck "in doubt": they may not unilaterally commit or abort, so they block until the coordinator recovers.',
            uk: 'Two-phase commit: координатор виконує раунд prepare/vote, тоді раунд commit/abort. Небезпека — у проміжку між ними: якщо координатор падає після того, як учасники проголосували yes (і durable підготувалися, тримаючи свої locks), підготовлені учасники застрягають «у сумніві»: вони не можуть односторонньо зафіксуватися чи скасувати, тож блокуються, доки координатор не відновиться.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The fatal flaw is in the gap between the two phases — the **blocking problem**. Suppose every participant has prepared and voted yes, and then the **coordinator crashes** before sending the phase-2 decision. Each participant is now *in doubt*: it has promised to commit, so it may not unilaterally abort, but it has not been told to commit, so it may not commit either. All it can do is **wait — holding its locks** — until the coordinator comes back. A single coordinator failure can freeze every participant indefinitely. **Three-phase commit (3PC)** tries to fix this by inserting a `pre-commit` phase so a stuck participant can resolve on its own, but it only works under an assumption real networks violate — a synchronous network with bounded delays and no partitions — so it is almost never used. The honest summary: 2PC trades availability for atomicity, and there is no non-blocking atomic commit protocol that survives both node and network failures.",
            uk: "Фатальна вада — у проміжку між двома фазами: **проблема блокування**. Припустимо, кожен учасник підготувався й проголосував yes, а тоді **координатор падає** до надсилання рішення фази 2. Кожен учасник тепер *у сумніві*: він пообіцяв зафіксуватися, тож не може односторонньо скасувати, але йому не сказали фіксуватися, тож не може й зафіксуватися. Усе, що він може — **чекати, тримаючи свої locks** — доки координатор повернеться. Один збій координатора може заморозити кожного учасника безкінечно. **Three-phase commit (3PC)** намагається це полагодити, вставивши фазу `pre-commit`, щоб застряглий учасник міг розвʼязати сам, але він працює лише за припущення, яке реальні мережі порушують — синхронна мережа з обмеженими затримками й без partitions — тож його майже не вживають. Чесний підсумок: 2PC міняє availability на atomicity, і немає неблокувального протоколу атомарного commit, що переживає і збої nodes, і збої мережі.",
          },
        },
        {
          kind: 'sim',
          sim: '2pc',
        },
        {
          kind: 'prose',
          md: {
            en: "PostgreSQL *can* be a 2PC participant. `PREPARE TRANSACTION 'gid'` does phase 1 — it durably prepares the transaction and detaches it from your session — and later `COMMIT PREPARED 'gid'` or `ROLLBACK PREPARED 'gid'` does phase 2, from any session. But the manual is blunt: this is **not intended for applications**; it exists so an **external transaction manager** (the X/Open XA model) can coordinate PostgreSQL alongside other resources. Tellingly, it is **off by default** — `max_prepared_transactions` is `0` — and you must deliberately enable it. The reason for the caution is in the next callout.",
            uk: "PostgreSQL *може* бути учасником 2PC. `PREPARE TRANSACTION 'gid'` робить фазу 1 — durable готує транзакцію й відʼєднує її від вашої сесії — а пізніше `COMMIT PREPARED 'gid'` чи `ROLLBACK PREPARED 'gid'` робить фазу 2, з будь-якої сесії. Але мануал прямий: це **не призначено для застосунків**; воно існує, щоб **зовнішній transaction manager** (модель X/Open XA) міг координувати PostgreSQL поряд з іншими ресурсами. Показово, що воно **вимкнене за замовчуванням** — `max_prepared_transactions` дорівнює `0` — і його треба свідомо ввімкнути. Причина обережності — у наступному callout.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- 2PC in PostgreSQL is OFF by default: max_prepared_transactions = 0.
-- An external transaction manager (XA) drives these; apps should not.

-- Phase 1 — prepare & vote "yes" (the work is now durable, detached from the session):
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
PREPARE TRANSACTION 'txn-42';        -- the txn now HOLDS ITS LOCKS until resolved

-- Phase 2 — the coordinator later commits (or rolls back) every participant:
COMMIT PREPARED 'txn-42';            -- or: ROLLBACK PREPARED 'txn-42';

-- The orphan danger — find prepared transactions nobody resolved:
SELECT gid, prepared, owner, database FROM pg_prepared_xacts ORDER BY prepared;`,
          note: {
            en: 'A prepared transaction holds its locks and pins the xmin horizon until COMMIT/ROLLBACK PREPARED. If the transaction manager crashes and never resolves it, that row blocks other writers and stops VACUUM — indefinitely.',
            uk: 'Підготовлена транзакція тримає свої locks і приколює xmin horizon до COMMIT/ROLLBACK PREPARED. Якщо transaction manager падає й ніколи її не розвʼязує, цей рядок блокує інших записувачів і зупиняє VACUUM — безкінечно.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Orphaned prepared transactions are a database-wide time bomb', uk: 'Осиротілі підготовлені транзакції — це бомба для всієї бази' },
          md: {
            en: "An in-doubt prepared transaction is not just stuck — it is actively harmful to the whole database. It **keeps holding every lock** it acquired, so other writers block on those rows. Worse, it **pins the xmin horizon** (M19): because the prepared transaction might still commit, VACUUM may not reclaim any dead tuple newer than it — anywhere in the cluster — so bloat grows and, if it sits there long enough, you march toward transaction-ID wraparound and a write-stopping shutdown. This is the deep reason 2PC is off by default and reserved for a real transaction manager that is guaranteed to resolve its prepared transactions. If you enable it, you **must** monitor `pg_prepared_xacts` and alert on any row older than a few minutes — an orphan there is an incident, not a curiosity.",
            uk: "Підготовлена транзакція в сумніві не просто застрягла — вона активно шкодить усій базі. Вона **далі тримає кожен lock**, який набрала, тож інші записувачі блокуються на цих рядках. Гірше, вона **приколює xmin horizon** (M19): оскільки підготовлена транзакція ще може зафіксуватися, VACUUM не може звільнити жоден мертвий tuple, новіший за неї — будь-де в кластері — тож bloat росте, і якщо вона сидить досить довго, ви рухаєтесь до transaction-ID wraparound і зупинки записів. Це глибока причина, чому 2PC вимкнено за замовчуванням і зарезервовано для справжнього transaction manager, який гарантовано розвʼязує свої підготовлені транзакції. Якщо ви це вмикаєте, ви **мусите** моніторити `pg_prepared_xacts` і алертити на будь-який рядок, старший за кілька хвилин — осиротілий там — це інцидент, а не цікавинка.",
          },
        },
      ],
    },
    {
      id: 'sagas',
      title: { en: 'Sagas & compensation', uk: 'Sagas і компенсація' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "If you can't hold a distributed lock across services for the duration of a workflow — and across microservices you usually can't — use a **saga**. The idea, from Garcia-Molina and Salem's 1987 paper, is to break one long transaction into a **sequence of local transactions**, each committing in its own service's database, where each step has a matching **compensating transaction** that semantically undoes it. The happy path runs T1 → T2 → T3, each committing locally. If T3 fails, the saga runs the compensations backward — C2, then C1 — to walk the system back to a consistent state. No global lock, no coordinator holding everyone hostage; each step is a normal, fast, local commit.",
            uk: "Якщо ви не можете тримати розподілений lock між сервісами на час workflow — а між мікросервісами зазвичай не можете — вживайте **saga**. Ідея з праці Garcia-Molina й Salem 1987 року — розбити одну довгу транзакцію на **послідовність локальних транзакцій**, кожна фіксується в базі свого сервісу, де кожен крок має відповідну **компенсуючу транзакцію**, що його семантично скасовує. Щасливий шлях виконує T1 → T2 → T3, кожна фіксується локально. Якщо T3 падає, saga виконує компенсації назад — C2, тоді C1 — щоб повернути систему до узгодженого стану. Жодного глобального lock, жодного координатора, що тримає всіх у заручниках; кожен крок — звичайний, швидкий, локальний commit.",
          },
        },
        {
          kind: 'figure',
          fig: 'saga-compensation',
          caption: {
            en: 'A saga is a sequence of local transactions T1→T2→T3, each committing in its own service. If a later step fails, the saga runs compensating transactions (C2, C1) backward to semantically undo the committed steps. A compensation is not a rollback — the original step already committed and was visible; the compensation is a new business action (a refund, a cancellation) that must itself be idempotent.',
            uk: 'Saga — це послідовність локальних транзакцій T1→T2→T3, кожна фіксується у своєму сервісі. Якщо пізніший крок падає, saga виконує компенсуючі транзакції (C2, C1) назад, щоб семантично скасувати зафіксовані кроки. Компенсація — не rollback: оригінальний крок уже зафіксувався й був видимий; компенсація — це нова бізнес-дія (повернення коштів, скасування), яка сама має бути ідемпотентною.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Sagas come in two coordination styles. In **orchestration**, a central *orchestrator* tells each service which local transaction to run next and decides when to compensate — explicit and easy to follow, at the cost of a coordinator component. In **choreography**, there is no center: each local transaction emits an **event** that triggers the next service's step — loosely coupled and resilient, but the overall flow is implicit and harder to trace. Neither is universally right; orchestration suits complex flows you need to reason about, choreography suits simple, highly autonomous services.",
            uk: "Sagas бувають двох стилів координації. В **orchestration** центральний *оркестратор* каже кожному сервісу, яку локальну транзакцію виконати наступною, і вирішує, коли компенсувати — явно й легко стежити, ціною компонента-координатора. У **choreography** центру немає: кожна локальна транзакція випускає **подію**, що запускає крок наступного сервісу — слабко звʼязано й стійко, але загальний потік неявний і його важче трасувати. Жоден не правильний універсально; orchestration пасує складним потокам, про які треба міркувати, choreography — простим, дуже автономним сервісам.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Two-phase commit (2PC)', uk: 'Two-phase commit (2PC)' },
          b: { en: 'Saga', uk: 'Saga' },
          rows: [
            [
              { en: 'Consistency', uk: 'Consistency' },
              { en: 'Strong — atomic across all participants', uk: 'Сильна — атомарна між усіма учасниками' },
              { en: 'Eventual — steps commit one by one', uk: 'Eventual — кроки фіксуються один за одним' },
            ],
            [
              { en: 'Isolation', uk: 'Isolation' },
              { en: 'Yes — others wait for the global commit', uk: 'Так — інші чекають глобального commit' },
              { en: 'No — intermediate states are visible (use countermeasures)', uk: 'Ні — проміжні стани видимі (вживайте countermeasures)' },
            ],
            [
              { en: 'On failure', uk: 'При збої' },
              { en: 'Coordinator aborts everyone; participants block if it crashes', uk: 'Координатор скасовує всіх; учасники блокуються, якщо він падає' },
              { en: 'Run compensating transactions to undo committed steps', uk: 'Виконати компенсуючі транзакції, щоб скасувати зафіксовані кроки' },
            ],
            [
              { en: 'Availability / coupling', uk: 'Availability / звʼязність' },
              { en: 'Low — one participant down blocks the transaction', uk: 'Низька — один недоступний учасник блокує транзакцію' },
              { en: 'High — services commit independently', uk: 'Висока — сервіси фіксуються незалежно' },
            ],
            [
              { en: 'Use it when', uk: 'Вживайте, коли' },
              { en: 'Few participants, one trust domain, hard atomicity (XA/finance)', uk: 'Мало учасників, один домен довіри, жорстка atomicity (XA/фінанси)' },
              { en: 'Microservices, long workflows, eventual consistency is OK', uk: 'Мікросервіси, довгі workflow, eventual consistency прийнятна' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'A compensation is forward-undo, not a rollback — and a saga has no isolation', uk: 'Компенсація — це forward-undo, не rollback — і saga не має isolation' },
          md: {
            en: "Two things trip people up about sagas. First, a saga has the **A, C, D of ACID but not the I**: there is no isolation, so while it is mid-flight other transactions can *see* the partial state — an order marked paid before it has shipped, inventory reserved before payment clears. You manage that with **countermeasures**: a semantic lock (a `PENDING`/`status` flag that downstream readers respect), commutative updates, or reordering steps so the riskiest one is last. Second, a **compensation is not a rollback**. The original step already committed and was visible to the world, so you cannot pretend it never happened — you issue a *new* business action that offsets it: not \"un-charge the card\" but \"refund the charge,\" not \"un-send the email\" but \"send a correction.\" Because steps and compensations can both be retried after a crash, **every one of them must be idempotent** — running it twice must have the same effect as running it once.",
            uk: "Дві речі збивають людей із пантелику щодо sagas. Перше, saga має **A, C, D з ACID, але не I**: isolation немає, тож поки вона в польоті, інші транзакції можуть *бачити* частковий стан — замовлення, позначене оплаченим до відправлення, товар, зарезервований до проходження оплати. Цим керують **countermeasures**: семантичний lock (прапорець `PENDING`/`status`, який поважають нижчі читачі), комутативні оновлення чи переупорядкування кроків так, щоб найризикованіший був останнім. Друге, **компенсація — це не rollback**. Оригінальний крок уже зафіксувався й був видимий світу, тож не можна вдати, що його не було — ви видаєте *нову* бізнес-дію, що його компенсує: не «скасувати списання картки», а «повернути списання», не «розіслати лист», а «надіслати виправлення». Оскільки і кроки, і компенсації можуть повторюватися після збою, **кожен з них має бути ідемпотентним** — виконати його двічі має дати той самий ефект, що й раз.",
          },
        },
      ],
    },
    {
      id: 'outbox-idempotency',
      title: { en: 'The outbox, idempotency & the exactly-once myth', uk: 'Outbox, idempotency і міф exactly-once' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Sagas and event-driven systems run on messages, which resurrects the dual-write problem in a sharp form: a service must **update its database and publish an event** — two systems, no shared transaction. Publish *before* the commit and the transaction might still roll back, emitting a phantom event for something that never happened. Publish *after* the commit and the process might crash in between, losing the event entirely. The **transactional outbox** dissolves the dilemma: write the business row **and** an event row into an `outbox` table **in the same local transaction**. Now the event is recorded *if and only if* the business change commits — one atomic local write, no distributed transaction. A separate **message relay** then reads the outbox and publishes to the broker.",
            uk: "Sagas і event-driven системи працюють на повідомленнях, що воскрешає dual-write problem у гострій формі: сервіс мусить **оновити свою базу й опублікувати подію** — дві системи, спільної транзакції немає. Опублікуйте *до* commit — і транзакція ще може відкотитися, випустивши phantom-подію про те, чого не було. Опублікуйте *після* commit — і процес може впасти поміж, втративши подію цілком. **Transactional outbox** розчиняє дилему: запишіть бізнес-рядок **і** рядок події в таблицю `outbox` **в одній локальній транзакції**. Тепер подія записана *тоді й лише тоді*, коли бізнес-зміна фіксується — один атомарний локальний запис, без розподіленої транзакції. Окремий **message relay** тоді читає outbox і публікує в broker.",
          },
        },
        {
          kind: 'figure',
          fig: 'outbox-pattern',
          caption: {
            en: 'The transactional outbox: the business row and an event row are written in ONE local transaction, so they are atomic. A relay then publishes the event — either by polling the outbox table, or by tailing the WAL via logical decoding (CDC, e.g. Debezium). Because the relay can publish a message more than once, the consumer must be idempotent. (LISTEN/NOTIFY is transient and not a durable substitute for the outbox.)',
            uk: 'Transactional outbox: бізнес-рядок і рядок події пишуться в ОДНІЙ локальній транзакції, тож вони атомарні. Relay тоді публікує подію — або опитуючи таблицю outbox, або читаючи WAL через logical decoding (CDC, напр. Debezium). Оскільки relay може опублікувати повідомлення більш ніж раз, споживач має бути ідемпотентним. (LISTEN/NOTIFY транзієнтний і не є durable заміною outbox.)',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The relay comes in two flavors. A **polling publisher** periodically `SELECT`s unsent rows and publishes them — simple, but it adds query load and latency. **Transaction-log tailing (CDC)** instead reads the database's own commit log: in PostgreSQL that is **logical decoding** of the WAL (tools like **Debezium**), which streams committed changes in near real time with no polling (M21). One trap to avoid: **`LISTEN`/`NOTIFY` is not a durable substitute** for the outbox — its notifications are in-memory and transient, delivered only to currently-connected listeners and lost on restart or if nobody is listening. It is fine as a low-latency nudge to *wake* the relay, but the durable record must remain the outbox table (or the WAL).",
            uk: "Relay буває двох видів. **Polling publisher** періодично `SELECT`-ить невідіслані рядки й публікує їх — просто, але додає навантаження запитів і latency. **Transaction-log tailing (CDC)** натомість читає власний commit log бази: у PostgreSQL це **logical decoding** WAL (інструменти на кшталт **Debezium**), що стрімить зафіксовані зміни майже в реальному часі без опитування (M21). Одна пастка, якої слід уникати: **`LISTEN`/`NOTIFY` не є durable заміною** outbox — його сповіщення в памʼяті й транзієнтні, доставляються лише наразі підключеним слухачам і губляться при перезапуску чи якщо ніхто не слухає. Воно годиться як низьколатентний поштовх, щоб *збудити* relay, але durable записом має лишатися таблиця outbox (чи WAL).",
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'At-least-once delivery means every consumer must be idempotent', uk: 'Доставка at-least-once означає, що кожен споживач має бути ідемпотентним' },
          md: {
            en: "The outbox guarantees a message is published *at least once* — the relay can crash after publishing but before marking the row sent, and re-publish on restart. So the message **will** sometimes arrive twice, and the consumer must be built to tolerate that: it must be **idempotent**. The standard mechanism is an **idempotency key** — a unique id carried on the message — recorded in a dedup/inbox table, ideally **in the same local transaction** that applies the side effect, so a replay is detected and skipped. This matters most where a duplicate is dangerous: a payment processed twice double-charges the customer; an idempotency key on the charge turns the retry into a no-op. Design the key first; bolting on dedup after a double-charge incident is the hard way to learn this.",
            uk: "Outbox гарантує, що повідомлення опубліковано *принаймні раз* — relay може впасти після публікації, але до позначення рядка відісланим, і повторно опублікувати при перезапуску. Тож повідомлення **інколи** прийде двічі, і споживача треба будувати так, щоб це терпіти: він має бути **ідемпотентним**. Стандартний механізм — **idempotency key** — унікальний id на повідомленні — записаний у dedup/inbox-таблицю, ідеально **в тій самій локальній транзакції**, що застосовує побічний ефект, щоб повтор було виявлено й пропущено. Це найважливіше там, де дублікат небезпечний: платіж, оброблений двічі, списує з клієнта вдвічі; idempotency key на списанні перетворює повтор на no-op. Проєктуйте ключ першим; прикручувати dedup після інциденту з подвійним списанням — це важкий спосіб це засвоїти.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Which brings us to the myth this module is named for. **Exactly-once *delivery* is impossible** in the general case — it runs into the Two Generals Problem and FLP impossibility: over an unreliable network you can never be certain a message arrived exactly once. What is achievable, and what people actually mean when they say it, is **at-least-once delivery plus idempotent processing**, which produces the *effect* of exactly-once — sometimes called **effectively-once**. Even Kafka's celebrated \"exactly-once semantics\" is bounded: it is exactly-once **within Kafka's** read-process-write loop (an idempotent producer plus transactions that commit the consumer offset and the output together), and it does **not** extend to arbitrary external side effects — a write to PostgreSQL, a REST call, an email. So the honest rule is the one to carry away: there is no exactly-once delivery; there is at-least-once delivery made safe by idempotent consumers. The outbox doesn't make the dual write atomic — it makes one write the source of truth and **reliably replays** the other.",
            uk: "Що приводить нас до міфу, на честь якого названо цей модуль. **Exactly-once *доставка* неможлива** в загальному випадку — вона впирається в Two Generals Problem і FLP impossibility: через ненадійну мережу ви ніколи не певні, що повідомлення прийшло рівно раз. Що досяжно, і що люди насправді мають на увазі, коли так кажуть — це **at-least-once доставка плюс ідемпотентна обробка**, що дає *ефект* exactly-once — інколи звана **effectively-once**. Навіть хвалена «exactly-once semantics» у Kafka обмежена: це exactly-once **у межах Kafka** в циклі read-process-write (ідемпотентний producer плюс транзакції, що фіксують offset споживача й вихід разом), і вона **не** поширюється на довільні зовнішні побічні ефекти — запис у PostgreSQL, REST-виклик, email. Тож чесне правило, яке варто винести: exactly-once доставки немає; є at-least-once доставка, зроблена безпечною ідемпотентними споживачами. Outbox не робить dual write атомарним — він робить один запис джерелом істини й **надійно відтворює** інший.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: "Single-node ACID is nearly free (one WAL, one lock manager, one commit). Across machines there is no shared commit → the dual-write problem (commit on A, crash before B). Distribution doesn't strengthen guarantees; it forces you to choose which one to weaken — atomicity (2PC) or isolation (sagas).",
      uk: "Однонодовий ACID майже безкоштовний (один WAL, один lock manager, один commit). Між машинами спільного commit немає → dual-write problem (commit на A, збій до B). Розподіл не посилює гарантії; він змушує обрати, яку послабити — atomicity (2PC) чи isolation (sagas).",
    },
    {
      en: '2PC: a coordinator runs prepare/vote then commit/abort; a "yes" vote is binding. Its fatal flaw is blocking — if the coordinator crashes after prepare, participants are stuck in-doubt holding locks. 3PC doesn\'t truly fix it (assumes a synchronous, partition-free network). In PostgreSQL 2PC is off by default (max_prepared_transactions = 0) and meant for an external transaction manager (XA).',
      uk: '2PC: координатор виконує prepare/vote, тоді commit/abort; голос «yes» звʼязуючий. Фатальна вада — блокування: якщо координатор падає після prepare, учасники застрягають у сумніві, тримаючи locks. 3PC по-справжньому це не лагодить (припускає синхронну мережу без partitions). У PostgreSQL 2PC вимкнено за замовчуванням (max_prepared_transactions = 0) і призначено для зовнішнього transaction manager (XA).',
    },
    {
      en: 'A saga is a sequence of local transactions, each with a compensating transaction; orchestration (central) vs choreography (event-driven). It gives ACD without I — intermediate states are visible (use semantic locks/countermeasures) — and a compensation is forward-undo (a refund), not a rollback. Steps and compensations must be idempotent.',
      uk: 'Saga — це послідовність локальних транзакцій, кожна з компенсуючою; orchestration (центральна) проти choreography (event-driven). Вона дає ACD без I — проміжні стани видимі (вживайте semantic locks/countermeasures) — а компенсація — це forward-undo (повернення), не rollback. Кроки й компенсації мають бути ідемпотентними.',
    },
    {
      en: 'Transactional outbox: write the business row + an event row in ONE local transaction (atomic by construction), then a relay publishes them — polling the outbox, or tailing the WAL via logical decoding/CDC (Debezium). It solves the dual-write problem without 2PC. LISTEN/NOTIFY is transient and not a durable substitute.',
      uk: 'Transactional outbox: запишіть бізнес-рядок + рядок події в ОДНІЙ локальній транзакції (атомарно за побудовою), тоді relay їх публікує — опитуючи outbox чи читаючи WAL через logical decoding/CDC (Debezium). Це розвʼязує dual-write problem без 2PC. LISTEN/NOTIFY транзієнтний і не є durable заміною.',
    },
    {
      en: '"Exactly-once" delivery is a myth (Two Generals / FLP). The achievable model is at-least-once delivery + idempotent consumers = "effectively-once". Even Kafka EOS is exactly-once only within Kafka, not for external side effects (a DB write, a REST call). Give every consumer an idempotency key.',
      uk: '«Exactly-once» доставка — міф (Two Generals / FLP). Досяжна модель — at-least-once доставка + ідемпотентні споживачі = «effectively-once». Навіть Kafka EOS — exactly-once лише в межах Kafka, не для зовнішніх побічних ефектів (запис у БД, REST-виклик). Дайте кожному споживачу idempotency key.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Reaching for distributed 2PC between microservices', uk: 'Тягтися до розподіленого 2PC між мікросервісами' },
      body: {
        en: 'XA-style two-phase commit across services looks like it restores ACID, but it imports the blocking problem into your architecture: a coordinator that is a single point of failure, participants that hold locks while in doubt, latency from the extra round trip, and tight coupling because every participant must support the same protocol and be reachable — one service down stalls the whole transaction. In PostgreSQL the same misuse leaves orphaned prepared transactions that hold locks and block VACUUM. For cross-service workflows the modern default is a saga plus the transactional outbox plus idempotent consumers, accepting eventual consistency. Reserve 2PC for the narrow cases it fits: few participants in one trust domain on a low-latency network with a real transaction manager.',
        uk: 'XA-стиль two-phase commit між сервісами виглядає як відновлення ACID, але імпортує проблему блокування у вашу архітектуру: координатор — єдина точка відмови, учасники тримають locks у сумніві, latency від зайвого round trip і тісна звʼязність, бо кожен учасник має підтримувати той самий протокол і бути доступним — один недоступний сервіс зупиняє всю транзакцію. У PostgreSQL це саме зловживання лишає осиротілі підготовлені транзакції, що тримають locks і блокують VACUUM. Для між-сервісних workflow сучасний дефолт — saga плюс transactional outbox плюс ідемпотентні споживачі, з прийняттям eventual consistency. Лишайте 2PC для вузьких випадків, що йому пасують: мало учасників в одному домені довіри на низьколатентній мережі зі справжнім transaction manager.',
      },
    },
    {
      title: { en: 'The naive dual write: commit the DB, then publish', uk: 'Наївний dual write: commit БД, тоді публікація' },
      body: {
        en: 'The most common distributed-systems bug is writing to the database and then publishing to a broker as two separate steps. Publish after commit and a crash in between silently drops the event — the order is paid in the database but the shipping service never hears about it. Publish before commit and a rollback emits a phantom event for something that never happened. There is no ordering of two independent writes that is safe, because they are not atomic. The fix is the transactional outbox: make the event part of the same local transaction as the business data by writing it to an outbox table, and let a relay publish it afterward. Then the event exists exactly when the data does.',
        uk: "Найпоширеніший баг розподілених систем — запис у базу, а тоді публікація в broker як два окремі кроки. Публікація після commit — і збій поміж тихо губить подію: замовлення оплачене в базі, але сервіс доставки про це не чує. Публікація до commit — і rollback випускає phantom-подію про те, чого не було. Немає безпечного порядку двох незалежних записів, бо вони не атомарні. Виправлення — transactional outbox: зробіть подію частиною тієї самої локальної транзакції, що й бізнес-дані, записавши її в таблицю outbox, і дайте relay опублікувати її згодом. Тоді подія існує рівно тоді, коли існують дані.",
      },
    },
    {
      title: { en: 'Believing "exactly-once" means you can skip idempotency', uk: 'Вірити, що «exactly-once» дозволяє пропустити idempotency' },
      body: {
        en: 'When a broker or framework advertises "exactly-once," it is easy to conclude you can process each message blindly. You can\'t. Exactly-once delivery is impossible over an unreliable network; what you actually have is at-least-once delivery, and "exactly-once" is achieved by at-least-once plus idempotent processing on your side. Even Kafka\'s exactly-once semantics only holds within Kafka\'s own read-process-write loop, not for the external side effects that matter — the database write, the payment, the email. If you skip idempotency on the assumption of exactly-once, retries and redeliveries will eventually double-apply something costly. Always carry an idempotency key and dedup, ideally in the same transaction as the effect.',
        uk: 'Коли broker чи фреймворк рекламує «exactly-once», легко вирішити, що можна обробляти кожне повідомлення наосліп. Не можна. Exactly-once доставка неможлива через ненадійну мережу; насправді ви маєте at-least-once доставку, а «exactly-once» досягається at-least-once плюс ідемпотентною обробкою з вашого боку. Навіть exactly-once semantics у Kafka тримається лише в її власному циклі read-process-write, не для зовнішніх побічних ефектів, що мають значення — запису в базу, платежу, email. Якщо пропустити idempotency, припускаючи exactly-once, повтори й передоставки зрештою застосують щось дороге двічі. Завжди носіть idempotency key і робіть dedup, ідеально в тій самій транзакції, що й ефект.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'What is the dual-write problem, and how does the transactional outbox pattern solve it?',
        uk: 'Що таке dual-write problem і як transactional outbox pattern його розвʼязує?',
      },
      a: {
        en: "The dual-write problem is what happens when a single logical operation has to update two independent systems that don't share a transaction — classically, a service must write to its own database and publish an event to a message broker. There's no atomic way to do both, and either ordering is broken. If you publish the event first and then commit, the transaction might roll back, so you've announced something that never happened — a phantom event. If you commit first and then publish, the process can crash in the gap, so the data changed but the event is lost forever — downstream services never find out. People reach for retries or distributed 2PC across the DB and broker, but 2PC is fragile and many brokers don't support it. The transactional outbox sidesteps the whole thing by collapsing two writes into one. Instead of publishing to the broker inside the request, you insert the event as a row into an outbox table in the same local database transaction as the business change. Because it's one transaction in one database, it's atomic: the event row exists if and only if the business data committed — no phantom, no lost event. Then a separate process, the message relay, reads the outbox and publishes to the broker, marking rows as sent. The relay can work by polling the table, or better by tailing the database's write-ahead log with change data capture, like Debezium reading the Postgres WAL via logical decoding. One important consequence: the relay guarantees at-least-once publishing — it might crash after publishing but before recording success and republish on restart — so consumers must be idempotent. And LISTEN/NOTIFY isn't a substitute for the outbox table, because its notifications are transient and lost if no one is listening; the durable record has to be the outbox or the WAL. So the outbox converts an impossible atomic dual write into a safe single write plus a reliable, replayable publish.",
        uk: "Dual-write problem — це те, що стається, коли одна логічна операція має оновити дві незалежні системи, що не ділять транзакцію — класично сервіс мусить записати у власну базу й опублікувати подію в message broker. Немає атомарного способу зробити обидва, і будь-який порядок зламаний. Якщо опублікувати подію першою, а тоді зафіксуватися, транзакція може відкотитися, тож ви оголосили те, чого не було — phantom-подію. Якщо зафіксуватися першим, а тоді опублікувати, процес може впасти в проміжку, тож дані змінилися, а подія втрачена назавжди — нижчі сервіси не дізнаються. Люди тягнуться до повторів чи розподіленого 2PC між БД і broker, але 2PC крихкий, і багато brokers його не підтримують. Transactional outbox обходить усе це, згортаючи два записи в один. Замість публікації в broker усередині запиту ви вставляєте подію як рядок у таблицю outbox у тій самій локальній транзакції бази, що й бізнес-зміна. Оскільки це одна транзакція в одній базі, вона атомарна: рядок події існує тоді й лише тоді, коли бізнес-дані зафіксувалися — без phantom, без втрати події. Тоді окремий процес, message relay, читає outbox і публікує в broker, позначаючи рядки відісланими. Relay може працювати опитуванням таблиці чи краще читанням write-ahead log бази через change data capture, як Debezium читає Postgres WAL через logical decoding. Один важливий наслідок: relay гарантує at-least-once публікацію — він може впасти після публікації, але до запису успіху, і повторно опублікувати при перезапуску — тож споживачі мають бути ідемпотентними. І LISTEN/NOTIFY не заміна таблиці outbox, бо його сповіщення транзієнтні й губляться, якщо ніхто не слухає; durable записом має бути outbox чи WAL. Тож outbox перетворює неможливий атомарний dual write на безпечний один запис плюс надійну, відтворювану публікацію.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'Explain two-phase commit and its blocking problem. Why do microservice architectures usually avoid it, and what do they use instead?',
        uk: 'Поясніть two-phase commit і його проблему блокування. Чому мікросервісні архітектури зазвичай його уникають і що вживають натомість?',
      },
      a: {
        en: "Two-phase commit is a protocol for committing a transaction atomically across several participants, driven by a coordinator. In phase one, prepare, the coordinator asks each participant to prepare; each one durably writes its changes so it could commit even after a crash, then votes yes or no. A yes vote is a binding promise — the participant has surrendered its right to abort on its own. In phase two, if all voted yes the coordinator says commit and everyone commits; if any voted no it says abort. When it works, all participants reach the same outcome. The blocking problem lives in the window between the phases. Suppose every participant has prepared and voted yes, and then the coordinator crashes before broadcasting the decision. Each participant is now in doubt: it promised to commit so it can't abort unilaterally, but it hasn't been told to commit so it can't commit either — all it can do is wait, holding its locks, until the coordinator recovers. So a single coordinator failure can freeze every participant indefinitely, and while they're frozen they're holding locks that block other work. Three-phase commit adds a pre-commit phase to let participants resolve on their own, but it only works under a synchronous-network, no-partition assumption that real systems violate, so it's essentially unused. Microservices avoid distributed 2PC because it's the opposite of what they're for: it couples services tightly — they all must implement the protocol and be reachable, and one being down blocks the transaction — it holds locks across network round trips so it's slow, and the coordinator is a single point of failure. It trades away availability, which is usually the thing microservices most want to keep. Instead they use sagas: break the operation into a sequence of local transactions, each committing independently in its own service, each with a compensating transaction to semantically undo it if a later step fails. That's coordinated either by orchestration or choreography, backed by the transactional outbox for reliable event publishing and idempotent consumers for safe retries. The cost is that you give up isolation and accept eventual consistency — other transactions can see intermediate states, which you manage with semantic locks and careful step ordering. Where I would still use 2PC is the narrow niche it actually fits: a small number of participants in a single trust domain on a low-latency network, with a real transaction manager guaranteed to resolve prepared transactions — and even then, in Postgres, only with careful monitoring of pg_prepared_xacts, because an orphaned prepared transaction holds locks and blocks vacuum across the whole database.",
        uk: "Two-phase commit — це протокол для атомарної фіксації транзакції між кількома учасниками, яким керує координатор. У фазі один, prepare, координатор просить кожного учасника підготуватися; кожен durable записує свої зміни, щоб міг зафіксуватися навіть після збою, тоді голосує yes чи no. Голос yes — звʼязуюча обіцянка: учасник віддав право скасувати самостійно. У фазі два, якщо всі проголосували yes, координатор каже commit і всі фіксуються; якщо хтось no — каже abort. Коли працює, усі учасники доходять одного результату. Проблема блокування живе у вікні між фазами. Припустимо, кожен учасник підготувався й проголосував yes, а тоді координатор падає до розсилки рішення. Кожен учасник тепер у сумніві: він пообіцяв зафіксуватися, тож не може скасувати односторонньо, але йому не сказали фіксуватися, тож не може й зафіксуватися — усе, що він може, це чекати, тримаючи locks, доки координатор відновиться. Тож один збій координатора може заморозити кожного учасника безкінечно, і поки вони заморожені, вони тримають locks, що блокують іншу роботу. Three-phase commit додає фазу pre-commit, щоб учасники розвʼязували самі, але вона працює лише за припущення синхронної мережі без partitions, яке реальні системи порушують, тож її по суті не вживають. Мікросервіси уникають розподіленого 2PC, бо це протилежність їхньому призначенню: він тісно звʼязує сервіси — усі мають реалізувати протокол і бути доступними, а один недоступний блокує транзакцію — він тримає locks через мережеві round trips, тож повільний, а координатор — єдина точка відмови. Він міняє availability, яку мікросервіси зазвичай найбільше хочуть зберегти. Натомість вони вживають sagas: розбити операцію на послідовність локальних транзакцій, кожна фіксується незалежно у своєму сервісі, кожна з компенсуючою транзакцією, щоб семантично скасувати, якщо пізніший крок падає. Це координується orchestration чи choreography, підпертими transactional outbox для надійної публікації подій та ідемпотентними споживачами для безпечних повторів. Ціна — ви відмовляєтесь від isolation і приймаєте eventual consistency — інші транзакції можуть бачити проміжні стани, чим керують semantic locks і обережне впорядкування кроків. Де я б усе одно вжив 2PC — вузька ніша, що йому справді пасує: мала кількість учасників в одному домені довіри на низьколатентній мережі, зі справжнім transaction manager, гарантовано здатним розвʼязати підготовлені транзакції — і навіть тоді в Postgres лише з обережним моніторингом pg_prepared_xacts, бо осиротіла підготовлена транзакція тримає locks і блокує vacuum по всій базі.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A vendor says their pipeline guarantees "exactly-once." What do you ask them, and what is actually achievable?',
        uk: 'Постачальник каже, що його pipeline гарантує «exactly-once». Що ви в нього спитаєте і що насправді досяжно?',
      },
      a: {
        en: "My first question is: exactly-once delivery, or exactly-once processing, and over what boundary? Because exactly-once delivery in the general case is provably impossible — it runs straight into the Two Generals Problem and FLP impossibility: over an unreliable network where messages and acknowledgments can be lost, the sender can never be certain a message was received exactly once, only that it was received at least once if it keeps retrying, or at most once if it doesn't. So whenever someone says exactly-once, they're either being loose with terms or they mean something narrower. The thing that's actually achievable, and what people usually mean, is at-least-once delivery combined with idempotent processing on the consumer — the message may arrive more than once, but processing it twice has the same effect as once, so the observable result is exactly-once. That's sometimes called effectively-once. My follow-up questions probe the boundary. If they cite Kafka's exactly-once semantics, I'd point out that holds within Kafka's read-process-write loop — an idempotent producer plus a transaction that commits the consumer offset and the output records together — so it's exactly-once from Kafka topic to Kafka topic. It does not magically extend to external side effects: if the pipeline writes to a database, charges a card, or sends an email, those are outside Kafka's transaction and can still be applied twice on a retry. So I'd ask specifically: what happens to the external writes when a consumer reprocesses a batch after a crash? If the answer is anything other than idempotency keys or a dedup table on the consumer side, then the exactly-once claim doesn't cover the part I actually care about. The practical conclusion I'd want them to agree to is the honest model: design for at-least-once delivery, make every external effect idempotent — ideally recording the message id in the same transaction as the side effect — and treat exactly-once as a property of the end-to-end processing you engineered, not a guarantee the transport handed you.",
        uk: "Моє перше питання: exactly-once доставка чи exactly-once обробка, і через яку межу? Бо exactly-once доставка в загальному випадку доказово неможлива — вона впирається прямо в Two Generals Problem і FLP impossibility: через ненадійну мережу, де повідомлення й підтвердження можуть губитися, відправник ніколи не певен, що повідомлення отримано рівно раз, лише що його отримано принаймні раз, якщо він повторює, або щонайбільше раз, якщо ні. Тож коли хтось каже exactly-once, він або вільно поводиться з термінами, або має на увазі щось вужче. Те, що насправді досяжно, і що люди зазвичай мають на увазі — це at-least-once доставка в поєднанні з ідемпотентною обробкою на споживачі — повідомлення може прийти більш ніж раз, але обробити його двічі дає той самий ефект, що й раз, тож спостережуваний результат — exactly-once. Це інколи звуть effectively-once. Мої наступні питання промацують межу. Якщо вони згадують exactly-once semantics у Kafka, я б зазначив, що це тримається в циклі read-process-write Kafka — ідемпотентний producer плюс транзакція, що фіксує offset споживача й вихідні записи разом — тож це exactly-once від Kafka topic до Kafka topic. Воно не поширюється чарівно на зовнішні побічні ефекти: якщо pipeline пише в базу, списує з картки чи шле email, це поза транзакцією Kafka й може застосуватися двічі на повторі. Тож я б спитав конкретно: що стається із зовнішніми записами, коли споживач переобробляє пакет після збою? Якщо відповідь будь-що інше, ніж idempotency keys чи dedup-таблиця на боці споживача, то твердження про exactly-once не покриває ту частину, що мене справді хвилює. Практичний висновок, з яким я б хотів, щоб вони погодилися — це чесна модель: проєктуйте під at-least-once доставку, робіть кожен зовнішній ефект ідемпотентним — ідеально записуючи id повідомлення в тій самій транзакції, що й побічний ефект — і трактуйте exactly-once як властивість наскрізної обробки, яку ви сконструювали, а не гарантію, яку вручив транспорт.",
      },
    },
  ],
  seeAlso: ['m17-acid-wal', 'm19-mvcc', 'm23-cap', 'm30-distributed-sql', 'm21-replication'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — PREPARE TRANSACTION (2PC commands; "not intended for applications" / external transaction manager; the orphaned-prepared-xact Caution: locks + VACUUM + wraparound)',
      url: 'https://www.postgresql.org/docs/current/sql-prepare-transaction.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — pg_prepared_xacts & max_prepared_transactions (default 0 → 2PC off by default; how to find orphaned prepared transactions)',
      url: 'https://www.postgresql.org/docs/current/view-pg-prepared-xacts.html',
    },
    {
      title: 'microservices.io — Pattern: Saga (Chris Richardson): a sequence of local transactions + compensating transactions; orchestration vs choreography; "2PC is not an option"; lack of isolation + countermeasures',
      url: 'https://microservices.io/patterns/data/saga.html',
    },
    {
      title: 'microservices.io — Pattern: Transactional Outbox: the dual-write problem; write business row + event in one local transaction; message relay (polling vs transaction-log tailing/CDC); consumers must be idempotent',
      url: 'https://microservices.io/patterns/data/transactional-outbox.html',
    },
    {
      title: 'Confluent / Apache Kafka — Message Delivery Semantics: at-most/at-least/exactly-once; EOS (idempotent producer + transactions) holds within the Kafka read-process-write loop, not for arbitrary external side effects',
      url: 'https://docs.confluent.io/kafka/design/delivery-semantics.html',
    },
    {
      title: 'Garcia-Molina & Salem, "Sagas", ACM SIGMOD 1987 — the original long-lived-transaction / compensating-transaction model behind the saga pattern',
      url: 'https://dl.acm.org/doi/10.1145/38713.38742',
    },
  ],
};
