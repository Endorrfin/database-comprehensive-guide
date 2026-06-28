import type { Module } from '../types';

/*
 * M23 · CAP, PACELC & consensus — Section V (S12). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-25 (see `sources`). Primary sources:
 *
 * CAP theorem:
 *  - Brewer, "Towards Robust Distributed Systems", PODC 2000 keynote (the original conjecture).
 *  - Gilbert & Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available,
 *    Partition-Tolerant Web Services", ACM SIGACT News 33(2):51–59, June 2002 (the formal proof).
 *    Formalizes C as linearizability. DOI: 10.1145/564585.564601
 *  - Brewer, "CAP Twelve Years Later: How the 'Rules' Have Changed", IEEE Computer 45(2):23–29,
 *    Feb 2012 — clarifies "pick 2 of 3" is an oversimplification; choice only matters during a
 *    partition; C and A are spectra, not binary. Same IEEE issue as Abadi's PACELC paper.
 *
 * PACELC:
 *  - Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design", IEEE Computer
 *    45(2):37–42, Feb 2012 (same Feb 2012 issue). DOI: 10.1109/MC.2012.33.
 *    If Partition → choose A or C; Else → choose L(atency) or C(onsistency).
 *
 * Consistency models:
 *  - Linearizability: Herlihy & Wing, ACM TOPLAS 12(3):463–492, July 1990.
 *    DOI: 10.1145/78969.78972 — every op appears to take effect atomically at a single real-time point.
 *  - Sequential consistency: Lamport, IEEE Trans. Computers C-28(9):690–691, Sept 1979 —
 *    same sequential order for all; program order preserved; no real-time constraint.
 *  - Eventual consistency: Werner Vogels, CACM 52(1):40–44, Jan 2009.
 *    DOI: 10.1145/1435417.1435432 — if no new updates, eventually all replicas converge.
 *  - Causal consistency: Ahamad et al. 1995 ("Causal Memory"); Lamport 1978 (happens-before).
 *    Causally related ops seen in causal order; concurrent ops may be seen in any order.
 *
 * Raft consensus:
 *  - Ongaro & Ousterhout, "In Search of an Understandable Consensus Algorithm", USENIX ATC 2014.
 *    Best Paper Award. Quorum = ⌊N/2⌋+1; N=5 → need 3, tolerates 2 failures.
 *    randomized election timeouts (150–300ms); log-completeness invariant.
 *
 * Paxos:
 *  - Lamport, "The Part-Time Parliament", ACM TOCS 16(2):133–169, May 1998.
 *    DOI: 10.1145/279227.279229. Simpler exposition: "Paxos Made Simple", ACM SIGACT News 2001.
 *
 * PACELC engine classifications (from Abadi 2012 + Martin Kleppmann's blog
 *  https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html):
 *  - Cassandra default: PA/EL (prefers latency over consistency even without partition — the
 *    canonical PACELC example). Tunable consistency: QUORUM or ALL moves it toward PC/EC.
 *  - PostgreSQL sync replication: PC/EC; async (default): PA/EL.
 *  - ZooKeeper / etcd: PC/EC (Raft/ZAB consensus; refuses without quorum).
 *  - HBase / BigTable: PC/EC.
 *  - DynamoDB: PA/EL default; strongly consistent reads available per-request.
 *
 * Signed as staff-level (4 topics). ★ signature sim key `cap-consistency`.
 * Figures: `pacelc-tree` (PACELC decision tree), `consistency-spectrum` (models ladder).
 * PG stable 18.4.
 */
export const m23: Module = {
  id: 'm23-cap',
  num: 23,
  section: 's5-distribution',
  order: 3,
  level: 'staff',
  signature: true,
  title: { en: 'CAP, PACELC & consensus', uk: 'CAP, PACELC та consensus' },
  tagline: {
    en: "CAP stated precisely, PACELC's latency trade, consistency models, quorums, Raft/Paxos.",
    uk: 'CAP точно сформульований, компроміс latency у PACELC, моделі consistency, quorums, Raft/Paxos.',
  },
  readMins: 13,
  mentalModel: {
    en: 'During a partition you answer wrong or not at all — CAP is that choice. PACELC adds: even without a partition, you trade latency for consistency.',
    uk: 'Під час partition ви відповідаєте неправильно або ніяк — CAP саме про цей вибір. PACELC додає: навіть без partition ви обмінюєте latency на consistency.',
  },

  topics: [
    // ── Topic 1: CAP stated precisely ────────────────────────────────────
    {
      id: 'cap-stated-precisely',
      title: {
        en: 'CAP stated precisely — and the partition you cannot opt out of',
        uk: 'CAP сформульований точно — та partition, від якої не відмовитися',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Eric Brewer conjectured in his PODC 2000 keynote that a distributed system cannot simultaneously guarantee all three of: **Consistency** (every read returns the most recent write or an error), **Availability** (every request receives a non-error response, without a guarantee it is the most recent data), and **Partition tolerance** (the system continues to operate despite arbitrary message loss or delay between nodes). Gilbert and Lynch proved it formally in 2002, formalising Consistency as **linearizability** — the strongest useful consistency model.\n\nThe infamous \"pick 2 of 3\" framing is a pedagogically useful lie. In a real distributed system, **network partitions are not optional.** Any async network can drop or delay packets; hardware fails; cloud availability zones lose connectivity. Partition tolerance is therefore not a choice you make — it is a fact of distributed life. The real trade-off is: *when* a partition occurs, do you sacrifice Consistency (serve possibly stale reads and conflicting writes) or Availability (refuse to answer unless you have quorum)?\n\nBrewer himself clarified this in his 2012 IEEE paper: \"Pick 2 of 3\" is a simplification. A well-designed system aims for both C and A most of the time, and only faces the forced trade-off *during* an actual partition. The rest of the time, you can have both — and you should try to.",
            uk: "Ерік Брюер припустив у своїй keynote на PODC 2000, що розподілена система не може одночасно гарантувати всі три: **Consistency** (кожне читання повертає найсвіжіший запис або помилку), **Availability** (кожен запит отримує відповідь без помилки, але без гарантії актуальності даних) та **Partition tolerance** (система продовжує працювати, попри довільну втрату або затримку повідомлень між вузлами). Гілберт і Лінч довели це формально у 2002 році, формалізувавши Consistency як **linearizability** — найсильнішу з практичних моделей consistency.\n\nСловосполучення «обери 2 з 3» — педагогічно корисна неточність. У реальній розподіленій системі **network partition — не вибір.** Будь-яка асинхронна мережа може втрачати або затримувати пакети; залізо відмовляє; availability zones хмарних провайдерів втрачають звʼязок. Тому partition tolerance — не вибір, а факт розподіленого життя. Справжній компроміс такий: *коли* partition відбудеться, чим жертвувати — Consistency (обслуговувати потенційно застарілі читання та конфліктуючі записи) чи Availability (відмовляти, поки не буде кворуму)?\n\nСам Брюер уточнив це у своїй IEEE-статті 2012 року: «Обери 2 з 3» — спрощення. Правильно спроектована система прагне і до C, і до A більшість часу, і стикається з вимушеним компромісом *лише* під час реального partition. В інший час можна мати обидва — і слід до цього прагнути.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'CP vs AP is not a system label — it is a per-partition behavior',
            uk: 'CP проти AP — не мітка системи, а поведінка під час конкретного partition',
          },
          md: {
            en: "Martin Kleppmann's 2015 critique (arXiv:1509.05393) points out that \"CP\" or \"AP\" labels are too coarse to be useful: most systems are neither purely CP nor purely AP, consistency and availability are spectra, and the labels collapse important nuance (which partition? which operations?). Use CAP as an intuition pump, not a precise classification. PACELC (below) is more practically useful.",
            uk: "Критика Мартіна Клеппманна 2015 року (arXiv:1509.05393) вказує, що мітки «CP» або «AP» надто грубі: більшість систем не є ані чисто CP, ані чисто AP, consistency та availability — це спектри, а мітки приховують важливі нюанси (який саме partition? які операції?). Використовуйте CAP як інструмент для формування інтуїції, а не для точної класифікації. PACELC (нижче) практично корисніший.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'CAP during a network partition: the forced choice. Outside a partition, a well-designed system aims for both C and A.',
            uk: 'CAP під час network partition: вимушений вибір. Поза partition правильна система прагне до обох.',
          },
          head: [
            { en: 'Choice', uk: 'Вибір' },
            { en: 'Isolated node behavior', uk: 'Поведінка ізольованого вузла' },
            { en: 'Trade-off', uk: 'Компроміс' },
            { en: 'Examples', uk: 'Приклади' },
          ],
          rows: [
            [
              { en: 'CP — Consistency', uk: 'CP — Consistency' },
              { en: 'Refuses requests — returns an error rather than stale data', uk: 'Відхиляє запити — повертає помилку замість застарілих даних' },
              { en: 'Unavailable on the minority side until partition heals', uk: 'Недоступний з боку меншості, поки partition не відновиться' },
              { en: 'ZooKeeper, etcd, HBase, PostgreSQL (sync replication)', uk: 'ZooKeeper, etcd, HBase, PostgreSQL (sync replication)' },
            ],
            [
              { en: 'AP — Availability', uk: 'AP — Availability' },
              { en: 'Accepts reads/writes — may serve stale data or create conflicts', uk: 'Приймає читання/записи — може повертати застарілі дані або створювати конфлікти' },
              { en: 'Inconsistency that must be reconciled after partition heals', uk: 'Неузгодженість, яку треба вирішити після відновлення partition' },
              { en: 'Cassandra (default), DynamoDB (default), CouchDB, Riak', uk: 'Cassandra (дефолт), DynamoDB (дефолт), CouchDB, Riak' },
            ],
          ],
        },
      ],
    },

    // ── Topic 2: PACELC — the latency trade ──────────────────────────────
    {
      id: 'pacelc',
      title: {
        en: 'PACELC — the latency trade even without a partition',
        uk: 'PACELC — компроміс latency навіть без partition',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Daniel Abadi's 2012 paper (the same IEEE Computer issue as Brewer's clarification) made a critical observation: **CAP only describes behavior during a partition, but most NoSQL systems sacrifice consistency even without one** — simply to reduce write latency. A system sending a write to a primary could wait for all replicas to acknowledge before responding to the client (consistent, higher latency) or respond immediately and propagate in the background (lower latency, eventual consistency). This trade-off exists on every write, partition or not.\n\nPACELC reformulates the design space:\n- **If P** (partition occurs) → choose **A** (availability) or **C** (consistency) — the classic CAP choice.\n- **Else** (no partition, normal operation) → choose **L** (lower latency) or **C** (stronger consistency).\n\nThe notation `PA/EL` means: during a partition choose Availability; during normal operation choose Latency. Cassandra's default is `PA/EL` — the canonical PACELC example. `PC/EC` means: always choose Consistency over both availability and latency (e.g. ZooKeeper, etcd, synchronous PostgreSQL streaming replication). `PA/EC` is unusual (Abadi calls it \"weird\") — choose availability during partitions but consistency during normal operation.\n\nThe latency dimension is why PACELC is more actionable than CAP for everyday system design. Your daily concern is not \"what happens during a network partition\" (rare) but \"do my writes wait for all replicas?\" (every write, always).",
            uk: "У статті Даніела Абаді 2012 року (той самий номер IEEE Computer, що й розʼяснення Брюера) зроблено важливе спостереження: **CAP описує поведінку лише під час partition, але більшість NoSQL-систем жертвують consistency навіть без нього** — просто щоб знизити latency запису. Система, яка надсилає запис на primary, може чекати підтвердження від усіх реплік перед відповіддю клієнту (consistent, вища latency) або відповідати негайно і поширювати зміни у фоні (нижча latency, eventual consistency). Цей компроміс присутній у кожному записі — partition чи ні.\n\nPACELC переформульовує простір проектних рішень:\n- **If P** (partition відбувся) → обери **A** (availability) або **C** (consistency) — класичний вибір CAP.\n- **Else** (без partition, нормальна робота) → обери **L** (нижчу latency) або **C** (вищу consistency).\n\nНотація `PA/EL` означає: під час partition обирається Availability; у звичайному режимі — Latency. Дефолт Cassandra — `PA/EL` — канонічний приклад PACELC. `PC/EC` означає: завжди обирати Consistency замість availability та latency (ZooKeeper, etcd, синхронна streaming replication PostgreSQL). `PA/EC` — рідкість (Абаді називає її «дивною»): availability під час partition і consistency в нормальному режимі.\n\nВимір latency — причина, чому PACELC практичніший за CAP для щоденного проектування систем. Ваше щоденне питання — не «що станеться під час network partition» (рідко), а «чи мають мої записи чекати на всі репліки?» (кожен запис, завжди).",
          },
        },
        {
          kind: 'figure',
          fig: 'pacelc-tree',
          caption: {
            en: 'PACELC decision tree: during a Partition, choose A or C (the CAP choice). Otherwise (Else), choose Latency or Consistency. Most systems make this "else" trade-off on every write.',
            uk: 'Дерево рішень PACELC: під час Partition обрати A або C (вибір CAP). Інакше (Else) — обрати Latency або Consistency. Більшість систем робить цей "else"-компроміс на кожному записі.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'PACELC classification of major systems. Labels are approximations — real systems offer tunable trade-offs.',
            uk: 'PACELC-класифікація основних систем. Мітки наближені — реальні системи пропонують налаштовані компроміси.',
          },
          head: [
            { en: 'System', uk: 'Система' },
            { en: 'PACELC', uk: 'PACELC' },
            { en: 'Notes', uk: 'Примітки' },
          ],
          rows: [
            [
              { en: 'Cassandra / ScyllaDB (default)', uk: 'Cassandra / ScyllaDB (дефолт)' },
              { en: 'PA/EL', uk: 'PA/EL' },
              { en: 'Canonical example; QUORUM or ALL moves toward PC/EC', uk: "Канонічний приклад; QUORUM або ALL наближає до PC/EC" },
            ],
            [
              { en: 'DynamoDB (default)', uk: 'DynamoDB (дефолт)' },
              { en: 'PA/EL', uk: 'PA/EL' },
              { en: 'Strongly consistent reads available per-request (extra latency)', uk: 'Strongly consistent reads доступні per-request (додаткова latency)' },
            ],
            [
              { en: 'PostgreSQL (async replication, default)', uk: 'PostgreSQL (async replication, дефолт)' },
              { en: 'PA/EL', uk: 'PA/EL' },
              { en: 'Standbys may serve stale reads; primary does not wait for ACK', uk: 'Standbys можуть повертати застарілі дані; primary не чекає ACK' },
            ],
            [
              { en: 'PostgreSQL (synchronous_commit = on)', uk: 'PostgreSQL (synchronous_commit = on)' },
              { en: 'PC/EC', uk: 'PC/EC' },
              { en: 'Primary waits for standby fsync before ACKing client; higher latency', uk: 'Primary чекає fsync standby перед ACK клієнту; вища latency' },
            ],
            [
              { en: 'ZooKeeper / etcd', uk: 'ZooKeeper / etcd' },
              { en: 'PC/EC', uk: 'PC/EC' },
              { en: 'Consensus-based (ZAB / Raft); refuses without quorum by design', uk: 'На основі consensus (ZAB / Raft); відмовляє без кворуму — за задумом' },
            ],
            [
              { en: 'HBase / BigTable', uk: 'HBase / BigTable' },
              { en: 'PC/EC', uk: 'PC/EC' },
              { en: 'HDFS + ZooKeeper coordination; refuses writes on split', uk: 'Координація через HDFS + ZooKeeper; відмовляє від записів при split' },
            ],
            [
              { en: 'MongoDB (w:majority, default since v5)', uk: 'MongoDB (w:majority, дефолт з v5)' },
              { en: 'PC/EC', uk: 'PC/EC' },
              { en: 'Majority write concern blocks until quorum acks; configurable', uk: 'Majority write concern блокує до підтвердження кворуму; налаштовується' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'PACELC makes the "normal operation" trade-off explicit',
            uk: 'PACELC робить компроміс "нормальної роботи" явним',
          },
          md: {
            en: "The most important question for a typical application is not \"what happens during a partition\" but \"do I use synchronous or asynchronous replication?\" PACELC's `EL vs EC` is that question. For OLTP workloads that can tolerate a small stale-read window, `EL` (async, lower latency) is often the right trade. For financial ledgers and coordination services, `EC` (sync, higher latency) is mandatory.",
            uk: "Найважливіше питання для типового застосунку — не «що станеться під час partition», а «використовувати синхронну чи асинхронну реплікацію?» `EL проти EC` у PACELC — саме про це. Для OLTP-навантажень, що можуть терпіти невелике вікно застарілих читань, `EL` (async, нижча latency) часто є правильним компромісом. Для фінансових журналів і сервісів координації обовʼязкове `EC` (sync, вища latency).",
          },
        },
      ],
    },

    // ── Topic 3: Consistency models ───────────────────────────────────────
    {
      id: 'consistency-models',
      title: {
        en: 'Consistency models — from strong to weak',
        uk: 'Моделі consistency — від сильних до слабких',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "\"Consistency\" means something specific in each context. In ACID, it means the database moves from one valid state to another. In CAP and distributed systems, it means *how fresh and globally ordered* reads are relative to writes. Distributed systems theory defines a hierarchy of **consistency models** — each weaker than the one above, each accepting more staleness in exchange for lower latency or higher availability.\n\n**Linearizability** (Herlihy & Wing, 1990) is the strongest useful model. Every operation appears to take effect atomically at a single point in real time between its invocation and response. All clients see all operations in a global real-time order. This is what CAP's `C` means (in Gilbert & Lynch's formulation). It is what `SELECT ... FOR UPDATE` in a single-primary PostgreSQL setup gives you. Cost: high — any operation that touches multiple replicas must coordinate.\n\n**Sequential consistency** (Lamport, 1979) relaxes the real-time constraint. All processors see operations in the same sequential order, and each processor's own operations appear in program order — but the global order need not match wall-clock time. Weaker than linearizability; sufficient for many CPU cache protocols.\n\n**Causal consistency** tracks *happens-before* relationships (Lamport 1978). If operation A causally precedes B (A's result was read before B was issued), all nodes see A before B. Concurrent operations may be seen in any order. It preserves cause-and-effect without requiring a single global order. Used in some distributed databases and CRDTs.\n\n**Eventual consistency** (Vogels, CACM 2009) is the weakest practically meaningful model: if no new updates are made, eventually all replicas converge to the same value. No guarantee on *when* or on the order in which replicas converge — only that they will. Cassandra's default is eventual. It is the right trade-off for high-write, geographically distributed systems where millisecond latency matters more than read freshness.",
            uk: "«Consistency» означає різне в різних контекстах. В ACID — що база переходить з одного валідного стану в інший. В CAP і розподілених системах — *наскільки свіжими і глобально впорядкованими* є читання відносно записів. Теорія розподілених систем визначає ієрархію **consistency models** — кожна слабша за попередню, кожна допускає більшу застарілість в обмін на нижчу latency або вищу availability.\n\n**Linearizability** (Herlihy & Wing, 1990) — найсильніша практично корисна модель. Кожна операція наче атомарно набирає чинності в єдиній точці реального часу між своїм початком і завершенням. Усі клієнти бачать усі операції в єдиному глобальному порядку реального часу. Саме це означає `C` у CAP (у формулюванні Гілберта й Лінча). Саме це дає `SELECT ... FOR UPDATE` в PostgreSQL з одним primary. Ціна: висока — будь-яка операція, що зачіпає кілька реплік, потребує координації.\n\n**Sequential consistency** (Lamport, 1979) послаблює вимогу реального часу. Всі процесори бачать операції в одному послідовному порядку, і операції кожного процесора виглядають у порядку програми — але глобальний порядок не мусить збігатися з реальним часом. Слабша за linearizability; достатня для багатьох протоколів кешу CPU.\n\n**Causal consistency** відстежує відношення *happens-before* (Lamport 1978). Якщо операція A причинно передує B (результат A був прочитаний до видачі B), всі вузли бачать A перед B. Паралельні операції можуть бути видні в будь-якому порядку. Зберігає причинно-наслідкові звʼязки без єдиного глобального порядку. Використовується в деяких розподілених БД і CRDT.\n\n**Eventual consistency** (Vogels, CACM 2009) — найслабша практично значуща модель: якщо нові оновлення не надходять, врешті-решт усі репліки зійдуться до одного значення. Жодної гарантії *коли* або в якому порядку репліки зійдуться — лише те, що зійдуться. Дефолт Cassandra — eventual. Це правильний компроміс для систем із великим обсягом запису, розподілених географічно, де важлива latency в мілісекунди, а не свіжість читань.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Consistency model hierarchy — stronger models give fresher reads at higher coordination cost.',
            uk: 'Ієрархія consistency models — сильніші моделі дають свіжіші читання за вищих витрат на координацію.',
          },
          head: [
            { en: 'Model', uk: 'Модель' },
            { en: 'Guarantee', uk: 'Гарантія' },
            { en: 'Real-time order', uk: 'Порядок реального часу' },
            { en: 'Who uses it', uk: 'Хто використовує' },
          ],
          rows: [
            [
              { en: 'Linearizability', uk: 'Linearizability' },
              { en: 'Single real-time order; ops appear atomic', uk: 'Єдиний порядок реального часу; операції атомарні' },
              { en: 'Yes', uk: 'Так' },
              { en: 'etcd, ZooKeeper, PostgreSQL (sync, single primary), Spanner', uk: 'etcd, ZooKeeper, PostgreSQL (sync, single primary), Spanner' },
            ],
            [
              { en: 'Sequential consistency', uk: 'Sequential consistency' },
              { en: 'Same sequential order for all; no wall-clock constraint', uk: 'Один послідовний порядок для всіх; без привʼязки до реального часу' },
              { en: 'No', uk: 'Ні' },
              { en: 'CPU memory models (x86 TSO)', uk: 'Моделі памʼяті CPU (x86 TSO)' },
            ],
            [
              { en: 'Causal consistency', uk: 'Causal consistency' },
              { en: 'Causally related ops in order; concurrent ops unordered', uk: "Причинно повʼязані операції по порядку; паралельні — без порядку" },
              { en: 'No', uk: 'Ні' },
              { en: 'MongoDB (causal sessions), some NewSQL', uk: 'MongoDB (causal sessions), деякі NewSQL' },
            ],
            [
              { en: 'Eventual consistency', uk: 'Eventual consistency' },
              { en: 'Replicas converge eventually if no new writes', uk: 'Репліки зрештою зходяться, якщо немає нових записів' },
              { en: 'No', uk: 'Ні' },
              { en: 'Cassandra (default), DynamoDB (default), CouchDB, DNS', uk: 'Cassandra (дефолт), DynamoDB (дефолт), CouchDB, DNS' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: '"Consistency" in ACID ≠ "Consistency" in CAP',
            uk: '«Consistency» в ACID ≠ «Consistency» в CAP',
          },
          md: {
            en: 'ACID Consistency means: a transaction moves the database from one valid state to another (integrity constraints hold). CAP/distributed Consistency means: every read returns the most recent write (linearizability). These are completely different things. A single-node PostgreSQL with no replication gives you ACID Consistency trivially, but is not even a "distributed system" in CAP\'s sense. The M17 module covers this disambiguation.',
            uk: 'ACID Consistency означає: транзакція переводить БД з одного валідного стану в інший (цілісність дотримана). CAP/distributed Consistency означає: кожне читання повертає найсвіжіший запис (linearizability). Це абсолютно різні речі. Одновузловий PostgreSQL без реплікації тривіально дає ACID Consistency, але не є навіть «розподіленою системою» у сенсі CAP. Розмежування розглядається в модулі M17.',
          },
        },
      ],
    },

    // ── Topic 4: Consensus — quorums, Raft/Paxos ─────────────────────────
    {
      id: 'consensus-raft-paxos',
      title: {
        en: 'Consensus — quorums, Raft and Paxos',
        uk: 'Consensus — quorums, Raft та Paxos',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Distributed systems that choose consistency need a way to agree on a single value despite node failures. This is the **consensus** problem: given N nodes that can each propose a value, agree on one value such that (1) only a proposed value is chosen, (2) all nodes that decide, decide the same value, and (3) a value is eventually decided if any node proposes one.\n\n**Quorums** are the key tool. If a cluster has N nodes and requires a quorum of Q = ⌊N/2⌋ + 1 nodes to agree before committing, then any two quorums overlap in at least one node. This overlap means: even if the cluster is partitioned into two groups, at most one group can form a quorum and commit — the other must wait. For N=3, quorum is 2 (tolerate 1 failure). For N=5, quorum is 3 (tolerate 2 failures). You never need more than 5–7 nodes for consensus; the latency cost of waiting for more grows faster than the reliability benefit.\n\nFor **reads**, achieving linearizability requires the read quorum R and the write quorum W to satisfy R + W > N. A common pattern: N=3, W=2 (majority write), R=2 (majority read). Then at least one replica in every read set must have seen the latest write.\n\n**Paxos** (Lamport, 1989/1998) was the first proven consensus algorithm, but notoriously difficult to understand and implement correctly. It operates in two phases: a Proposer obtains a promise from a quorum (phase 1), then sends its value (phase 2); acceptors vote; the value is chosen once a quorum accepts it. Multi-Paxos extends this for a sequence of log entries.\n\n**Raft** (Ongaro & Ousterhout, USENIX ATC 2014) was designed explicitly to be *understandable*. It decomposes consensus into three sub-problems: **leader election** (one leader per term, randomized election timeouts 150–300 ms prevent split votes), **log replication** (the leader appends entries to its log, replicates to followers, commits once a quorum acknowledges), and **safety** (the leader completeness invariant: a candidate cannot win unless its log is at least as up-to-date as the majority's). etcd, CockroachDB, TiKV, CockroachDB, InfluxDB IOx, and many cloud systems use Raft.\n\n**PostgreSQL uses neither Paxos nor Raft** for its primary replication — it uses streaming WAL replication with an external HA orchestrator (Patroni) that uses etcd or Consul (which themselves use Raft) for leader election. The PostgreSQL cluster does not implement distributed consensus internally; the DCS does.",
            uk: "Розподілені системи, що обирають consistency, потребують способу погодитися на одному значенні, незважаючи на збої вузлів. Це проблема **consensus**: маючи N вузлів, кожен з яких може пропонувати значення, погодитися на одному такому значенні, щоб (1) обиралося лише запропоноване значення, (2) усі вузли, що приймають рішення, обирають однакове значення, і (3) значення врешті-решт обирається, якщо хоч один вузол його пропонує.\n\n**Quorums** — ключовий інструмент. Якщо кластер має N вузлів і вимагає кворуму Q = ⌊N/2⌋ + 1 вузлів для коміту, будь-які два кворуми перетинаються мінімум в одному вузлі. Це перетинання означає: навіть якщо кластер розбитий на дві групи, щонайбільше одна може сформувати кворум і закомітити — інша мусить чекати. Для N=3 кворум — 2 (терпить 1 збій). Для N=5 — 3 (терпить 2 збої). Для consensus не потрібно більше 5–7 вузлів; latency від очікування більшого числа зростає швидше, ніж надійність.\n\nДля **читань** досягнення linearizability вимагає, щоб кворум читання R і кворум запису W задовольняли R + W > N. Поширений патерн: N=3, W=2 (majority write), R=2 (majority read). Тоді мінімум одна репліка в кожному наборі читання бачила останній запис.\n\n**Paxos** (Lamport, 1989/1998) — перший доведений алгоритм consensus, але сумнозвісно складний для розуміння та правильної реалізації. Він працює у двох фазах: Proposer отримує обіцянку від кворуму (фаза 1), потім надсилає своє значення (фаза 2); acceptors голосують; значення обирається, щойно кворум його акцептує. Multi-Paxos розширює це на послідовність записів у лозі.\n\n**Raft** (Ongaro & Ousterhout, USENIX ATC 2014) розроблявся явно для *зрозумілості*. Він декомпозує consensus на три підзадачі: **leader election** (один leader на term, рандомізовані election timeouts 150–300 мс запобігають split votes), **log replication** (leader додає записи до лозу, реплікує на followers, комітить після підтвердження кворуму), і **safety** (інваріант log completeness: кандидат не може перемогти, якщо його лог не актуальніший за більшість). etcd, CockroachDB, TiKV, InfluxDB IOx та багато хмарних систем використовують Raft.\n\n**PostgreSQL не використовує ані Paxos, ані Raft** для реплікації — він використовує streaming WAL replication з зовнішнім HA-оркестратором (Patroni), що застосовує etcd або Consul (які самі використовують Raft) для leader election. Кластер PostgreSQL не реалізує distributed consensus всередині себе; це робить DCS.",
          },
        },
        {
          kind: 'sim',
          sim: 'cap-consistency',
        },
        {
          kind: 'compare',
          a: { en: 'Raft', uk: 'Raft' },
          b: { en: 'Paxos (Multi-Paxos)', uk: 'Paxos (Multi-Paxos)' },
          rows: [
            [
              { en: 'Design goal', uk: 'Ціль дизайну' },
              { en: 'Understandability — decomposed into clear sub-problems', uk: "Зрозумілість — декомпозований на чіткі підзадачі" },
              { en: 'Correctness proof first; implementation left to the reader', uk: "Спочатку доведення правильності; реалізація — справа читача" },
            ],
            [
              { en: 'Leader', uk: 'Leader' },
              { en: 'Explicit; one leader per term; randomized timeouts', uk: 'Явний; один leader на term; рандомізовані timeouts' },
              { en: 'Implicit; any node can propose; no explicit term concept', uk: 'Неявний; будь-який вузол може пропонувати; немає явного поняття term' },
            ],
            [
              { en: 'Log replication', uk: 'Log replication' },
              { en: 'Leader-driven; only committed-on-quorum entries apply', uk: 'Керується leader; застосовуються тільки записи, підтверджені кворумом' },
              { en: 'Proposer-driven; two-phase per entry (more round trips)', uk: 'Керується Proposer; дві фази на запис (більше round trips)' },
            ],
            [
              { en: 'Adoption', uk: 'Використання' },
              { en: 'etcd, CockroachDB, TiKV, InfluxDB IOx, Consul', uk: 'etcd, CockroachDB, TiKV, InfluxDB IOx, Consul' },
              { en: 'Chubby (Google), Zab (ZooKeeper variant), some academic systems', uk: 'Chubby (Google), Zab (варіант ZooKeeper), деякі академічні системи' },
            ],
            [
              { en: 'Quorum requirement', uk: 'Вимога кворуму' },
              { en: '⌊N/2⌋+1 for both election and commit', uk: '⌊N/2⌋+1 для election і commit' },
              { en: '⌊N/2⌋+1 (same underlying requirement)', uk: '⌊N/2⌋+1 (однакова базова вимога)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Odd cluster sizes and why you almost never need more than 7',
            uk: 'Непарний розмір кластера і чому майже ніколи не потрібно більше 7',
          },
          md: {
            en: "Use odd cluster sizes for consensus: 3 (tolerates 1 failure), 5 (tolerates 2), 7 (tolerates 3). An even number of nodes buys no additional fault tolerance over the odd number below it — N=4 tolerates the same 1 failure as N=3 but costs an extra node. Beyond 7, the latency of waiting for a quorum (⌊N/2⌋+1 round trips) grows faster than the reliability gain. etcd, ZooKeeper, and Patroni all recommend 3 or 5 nodes.",
            uk: "Для consensus використовуйте непарний розмір кластера: 3 (терпить 1 збій), 5 (терпить 2), 7 (терпить 3). Парне число вузлів не дає додаткової стійкості до збоїв порівняно з меншим непарним — N=4 терпить ті ж 1 збій, що й N=3, але коштує зайвий вузол. Більше 7: latency очікування кворуму (⌊N/2⌋+1 round trips) зростає швидше за приріст надійності. etcd, ZooKeeper і Patroni рекомендують 3 або 5 вузлів.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: "CAP's real message: partitions are inevitable; the forced choice is Consistency vs Availability *during* a partition. Outside a partition, aim for both.",
      uk: "Справжній посил CAP: partition неминучий; вимушений вибір — Consistency проти Availability *під час* partition. Поза ним — прагніть до обох.",
    },
    {
      en: "PACELC adds the Latency vs Consistency trade-off that happens on every write, partition or not — often more practically important than CAP.",
      uk: "PACELC додає компроміс Latency проти Consistency, що відбувається на кожному записі — незалежно від partition — і часто є практично важливішим за CAP.",
    },
    {
      en: 'Consistency models form a spectrum: linearizability → sequential → causal → eventual. Weaker models trade freshness for lower latency.',
      uk: 'Моделі consistency утворюють спектр: linearizability → sequential → causal → eventual. Слабші моделі обмінюють свіжість на нижчу latency.',
    },
    {
      en: "Quorum (⌊N/2⌋+1) is the key to consensus: any two quorums overlap, so at most one partition can commit. Odd cluster sizes (3, 5, 7) maximize fault tolerance per node.",
      uk: "Quorum (⌊N/2⌋+1) — ключ до consensus: будь-які два кворуми перетинаються, тому лише одна partition може комітити. Непарний розмір кластера (3, 5, 7) максимізує стійкість до збоїв на вузол.",
    },
    {
      en: 'Raft makes consensus understandable: leader election (randomized timeouts), log replication (quorum ACK to commit), safety (log-completeness invariant).',
      uk: 'Raft робить consensus зрозумілим: leader election (рандомізовані timeouts), log replication (quorum ACK для коміту), safety (інваріант log completeness).',
    },
    {
      en: 'PostgreSQL does not implement consensus internally — it delegates leader election to etcd/Consul via Patroni, which run Raft themselves.',
      uk: 'PostgreSQL не реалізує consensus всередині — він делегує leader election до etcd/Consul через Patroni, які самі запускають Raft.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Treating CP/AP as permanent system labels', uk: 'Сприйняття CP/AP як постійних міток системи' },
      body: {
        en: "\"Cassandra is AP\" and \"ZooKeeper is CP\" are useful approximations but dangerous as absolutes. Cassandra with `QUORUM` consistency level is closer to CP. ZooKeeper partitioned from a quorum will eventually time out reads. Real systems are tunable; the CAP label describes the *default* behavior in the worst-case partition scenario, not an inherent property. Build mental models from PACELC's per-operation trade-offs instead.",
        uk: "«Cassandra — це AP» і «ZooKeeper — це CP» — корисні приблизні описи, але небезпечні як абсолюти. Cassandra з рівнем consistency `QUORUM` ближча до CP. ZooKeeper, відірваний від кворуму, врешті-решт переведе читання в timeout. Реальні системи налаштовуються; мітка CAP описує *дефолтну* поведінку в найгіршому сценарії partition, а не властивість, що не змінюється. Натомість формуйте mental models з операційних компромісів PACELC.",
      },
    },
    {
      title: { en: 'Confusing ACID Consistency with distributed Consistency', uk: "Плутанина між ACID Consistency і distributed Consistency" },
      body: {
        en: "Two completely different concepts share the word \"Consistency.\" ACID-C means integrity constraints hold across a transaction. CAP-C means every read returns the most recent write (linearizability). A single-node database can give you perfect ACID-C while being trivially \"available\" (no replication at all) — it is simply not a distributed system and does not fit CAP's model.",
        uk: "Два абсолютно різних поняття ділять слово «Consistency». ACID-C означає дотримання constraints цілісності в межах транзакції. CAP-C означає, що кожне читання повертає найсвіжіший запис (linearizability). Одновузлова БД може давати ідеальний ACID-C при тривіальній «доступності» (без реплікації взагалі) — вона просто не є розподіленою системою і не вписується в модель CAP.",
      },
    },
    {
      title: { en: 'Underestimating the quorum latency cost', uk: 'Недооцінка вартості latency кворуму' },
      body: {
        en: "A linearizable read in a Raft cluster requires a round trip to a quorum of nodes before the leader can respond. In a 5-node cluster spanning two data centers, this means a round trip to at least 2 nodes in the remote DC on every read — 50–100 ms in cross-DC deployments. This is often the hidden cost of \"strong consistency.\" For read-heavy workloads, consider whether a quorum read is actually needed or whether a leader lease (as Raft supports) or read replica with a short staleness window is acceptable.",
        uk: "Linearizable читання в Raft-кластері вимагає round trip до кворуму вузлів перед відповіддю leader. У 5-вузловому кластері, що охоплює два дата-центри, це означає round trip мінімум до 2 вузлів у віддаленому DC на кожне читання — 50–100 мс при cross-DC. Це часто прихована ціна «strong consistency». Для read-heavy навантажень розгляньте, чи справді потрібне quorum читання, або прийнятний leader lease (як підтримує Raft) чи read replica з коротким вікном застарілості.",
      },
    },
  ],

  interview: [
    {
      q: {
        en: "Explain the CAP theorem — and why \"pick 2 of 3\" is a simplification.",
        uk: "Поясніть теорему CAP — і чому «обери 2 з 3» є спрощенням.",
      },
      a: {
        en: "CAP says a distributed system cannot simultaneously guarantee Consistency (every read returns the most recent write), Availability (every request gets a non-error response), and Partition tolerance (the system works despite message loss). The \"pick 2\" framing is misleading because network partitions are not optional in any real async network — you cannot choose to be partition-intolerant. The real trade-off is: *during* a partition, sacrifice C (serve possibly stale data) or A (refuse to respond). Outside a partition, a well-designed system can offer both. PACELC is more useful: it separates the partition-time trade-off from the always-present latency-vs-consistency trade-off that happens on every write.",
        uk: "CAP стверджує, що розподілена система не може одночасно гарантувати Consistency (кожне читання повертає найсвіжіший запис), Availability (кожен запит отримує відповідь без помилки) та Partition tolerance (система працює попри втрату повідомлень). Формулювання «обери 2» є оманливим, оскільки network partition у будь-якій реальній async-мережі не є вибором — ви не можете вирішити бути невразливим до partition. Справжній компроміс: *під час* partition жертвувати C (обслуговувати потенційно застарілі дані) або A (відмовляти у відповіді). Поза partition правильна система може пропонувати обидва. PACELC корисніший: він розділяє компроміс часу partition і завжди наявний компроміс latency проти consistency на кожному записі.",
      },
      level: 'senior',
    },
    {
      q: {
        en: "How does Raft achieve consensus, and what is the quorum requirement for a 5-node cluster?",
        uk: "Як Raft досягає consensus і яка вимога кворуму для 5-вузлового кластера?",
      },
      a: {
        en: "Raft decomposes consensus into leader election, log replication, and safety. A single leader per term drives all decisions. Leaders are elected by a quorum vote (⌊N/2⌋+1); randomized election timeouts (150–300 ms) prevent split votes. The leader appends client entries to its log, replicates to followers, and marks an entry committed once a quorum acknowledges it. The log-completeness invariant ensures only candidates with up-to-date logs can win — this prevents committed entries from being lost. For N=5: quorum = 3, tolerating 2 failures. A write is committed only after 3 of the 5 nodes have durably stored it. Any two quorums of 3 overlap in at least 1 node, which prevents split-brain commits.",
        uk: "Raft декомпозує consensus на: leader election, log replication і safety. Єдиний leader на term керує всіма рішеннями. Leaders обираються кворумним голосуванням (⌊N/2⌋+1); рандомізовані election timeouts (150–300 мс) запобігають split votes. Leader додає записи клієнтів до свого логу, реплікує на followers і позначає запис закомітованим після підтвердження кворуму. Інваріант log completeness гарантує, що перемогти можуть лише кандидати з актуальним логом — це запобігає втраті закомітованих записів. Для N=5: кворум = 3, терпить 2 збої. Запис комітується лише після збереження на 3 з 5 вузлів. Будь-які два кворуми по 3 перетинаються мінімум в 1 вузлі, що запобігає split-brain комітам.",
      },
      level: 'senior',
    },
    {
      q: {
        en: "A team proposes: 'We'll use strong consistency for all reads to avoid stale data.' What are the latency implications in a multi-DC Raft cluster?",
        uk: "Команда пропонує: «Використовуватимемо strong consistency для всіх читань, щоб уникнути застарілих даних». Які наслідки для latency в multi-DC Raft-кластері?",
      },
      a: {
        en: "Linearizable reads in a Raft cluster require a quorum round-trip — the leader cannot respond until it has confirmed it is still the leader with a majority of nodes. In a cross-DC cluster (e.g., 5 nodes across 2 DCs, 3 in one, 2 in another), every read requires ACKs from ≥3 nodes, meaning at least one ACK comes from the remote DC: 50–100 ms of network latency per read. For read-heavy workloads, this is prohibitive. Mitigations: (1) Leader leases — the leader grants itself a 'lease' for the election timeout window and can serve reads locally without quorum during that window (Raft supports this as an optimization). (2) Follower reads with bounded staleness — tolerate up to N ms of lag and read from a local replica. (3) Route read requests to the primary DC. The team should quantify their staleness tolerance before mandating strong consistency everywhere.",
        uk: "Linearizable читання в Raft-кластері вимагають quorum round-trip — leader не може відповісти, поки не підтвердить свій статус лідера більшістю вузлів. У cross-DC кластері (напр., 5 вузлів у 2 DC: 3 в одному, 2 в іншому) кожне читання потребує ACK від ≥3 вузлів, тобто мінімум один ACK — з віддаленого DC: 50–100 мс мережевої latency на читання. Для read-heavy навантажень це неприйнятно. Рішення: (1) Leader leases — leader надає собі «оренду» на вікно election timeout і може обслуговувати читання локально без кворуму впродовж цього вікна (Raft підтримує це як оптимізацію). (2) Follower reads з bounded staleness — допускається до N мс відставання, читання з локальної репліки. (3) Маршрутизація read-запитів до primary DC. Команда має виміряти допустиме відставання, перш ніж вимагати strong consistency всюди.",
      },
      level: 'staff',
    },
  ],

  seeAlso: [
    'm17-acid-wal',
    'm18-isolation',
    'm20-distributed-tx',
    'm21-replication',
    'm24-ha-backups-dr',
    'm30-distributed-sql',
  ],

  sources: [
    {
      title: "Brewer — 'Towards Robust Distributed Systems' (PODC 2000 keynote)",
      url: 'https://www.researchgate.net/publication/221343719_Towards_robust_distributed_systems',
    },
    {
      title: "Gilbert & Lynch — 'Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services' (ACM SIGACT News 2002)",
      url: 'https://dl.acm.org/doi/10.1145/564585.564601',
    },
    {
      title: "Brewer — 'CAP Twelve Years Later: How the Rules Have Changed' (IEEE Computer, Feb 2012)",
      url: 'https://ieeexplore.ieee.org/document/6133253/',
    },
    {
      title: "Abadi — 'Consistency Tradeoffs in Modern Distributed Database System Design: PACELC' (IEEE Computer, Feb 2012)",
      url: 'https://ieeexplore.ieee.org/document/6127847/',
    },
    {
      title: "Ongaro & Ousterhout — 'In Search of an Understandable Consensus Algorithm' (USENIX ATC 2014)",
      url: 'https://raft.github.io/raft.pdf',
    },
    {
      title: "Vogels — 'Eventually Consistent' (CACM 2009)",
      url: 'https://dl.acm.org/doi/10.1145/1435417.1435432',
    },
    {
      title: "Kleppmann — 'Please stop calling databases CP or AP' (2015 blog post / arXiv:1509.05393)",
      url: 'https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html',
    },
  ],
};
