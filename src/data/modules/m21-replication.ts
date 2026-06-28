import type { Module } from '../types';

/*
 * M21 · Replication — Section V (S11). Authored EN first, UA second; technical terms stay English
 * in both. Facts web-verified 2026-06-25 (see `sources`), primary source = PostgreSQL 18 docs:
 *  - Streaming replication (physical): a `walsender` process on the primary streams WAL records as
 *    they are produced; a `walreceiver` on the standby receives and replays them. Standby activated
 *    by `standby.signal`; `pg_basebackup` for initial bootstrap. Key params: `wal_level=replica`,
 *    `max_wal_senders` (default 10), `hot_standby=on` (default, enables read queries on standbys).
 *    `wal_receiver_timeout` / `wal_sender_timeout` both default 60s. Replication slots prevent WAL
 *    recycling before standbys consume it; abandoned slots hold WAL indefinitely.
 *    PG 18 adds `idle_replication_slot_timeout` (default 0=disabled) to auto-invalidate stale slots.
 *  - Sync vs async (synchronous_commit values, all web-verified):
 *    off = don't wait, local = wait for local flush only, remote_write = standby OS-buffered,
 *    on (default when sync) = standby fsync'd (2-safe), remote_apply = standby has replayed.
 *    `synchronous_standby_names`: FIRST n(s1,s2) = priority; ANY n(s1,s2) = quorum (PG 10+).
 *    Async RPO = replication lag (seconds to minutes in typical deployments).
 *  - Physical vs logical replication:
 *    Physical = byte-for-byte WAL stream, same PG major version only, replicates the whole cluster.
 *    Logical = row-level change stream via the `pgoutput` plugin (CREATE PUBLICATION/SUBSCRIPTION,
 *    native since PG 10 / Oct 2017). Cross-version and cross-platform possible. Does NOT replicate
 *    DDL, sequences, or large objects — only tables. Third-party: Debezium (CDC via logical
 *    decoding), pglogical.
 *    PG 17 added logical replication FAILOVER SLOTS (`failover=true`); standbys can take over the
 *    subscription after failover. PG 18: `streaming=parallel` is the new default for subscriptions
 *    (was `off`); `publish_generated_columns` controls whether generated columns are published;
 *    `idle_replication_slot_timeout` auto-invalidates abandoned slots.
 *  - Monitoring: pg_stat_replication on the primary (one row per walsender):
 *    sent_lsn, write_lsn, flush_lsn, replay_lsn (LSN columns → bytes of lag);
 *    write_lag, flush_lag, replay_lag (interval columns → wall-clock lag).
 *    pg_stat_wal_receiver on the standby. pg_wal_lsn_diff() to compute byte lag.
 *  - Cascading replication: a standby can relay WAL downstream to further standbys. Always async —
 *    the docs say: "Synchronous replication settings have no effect on cascading replication."
 *  - Patroni (v4.1.3, supports PG 9.3–18): the de-facto HA solution for self-managed PG.
 *    DCS options: etcd, Consul, ZooKeeper, Kubernetes (Endpoints/ConfigMaps). The primary holds a
 *    DCS lease with a TTL; failure to renew → standbys race to acquire the leader lock; the winner
 *    calls `pg_promote()`. `maximum_lag_on_failover` (bytes) caps how far behind a standby can be
 *    and still be promoted. `pg_rewind` (needs data checksums or `wal_log_hints=on`) lets a demoted
 *    primary rewind to a common ancestor and rejoin as a standby — avoids a full pg_basebackup.
 *    Patroni `synchronous_mode` manages `synchronous_standby_names` dynamically.
 * Signature module: ★ sim 'replication' + figure 'streaming-replication'. PG stable 18.4.
 */
export const m21: Module = {
  id: 'm21-replication',
  num: 21,
  section: 's5-distribution',
  order: 1,
  level: 'senior',
  signature: true,
  title: { en: 'Replication', uk: 'Replication' },
  tagline: {
    en: 'Leader/follower, sync vs async, physical vs logical, failover, replication lag.',
    uk: 'Leader/follower, sync проти async, physical проти logical, failover, replication lag.',
  },
  readMins: 14,
  mentalModel: {
    en: 'Copies cost you latency or safety — pick which one consciously.',
    uk: 'Копії коштують вам latency або safety — обирайте свідомо.',
  },
  topics: [
    // ── Topic 1: How streaming replication works ──────────────────────────
    {
      id: 'streaming-replication-how-it-works',
      title: {
        en: 'How streaming replication works',
        uk: 'Як працює streaming replication',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Replication is the practice of keeping copies of your data on multiple servers. In a **leader/follower** setup — the dominant pattern for relational databases — one **primary** (leader) accepts all writes, and one or more **standbys** (followers, replicas) receive a stream of changes and apply them. Standbys can serve read queries while the primary handles writes, and they are ready to take over if the primary fails.\n\nPostgreSQL's primary replication mechanism is **streaming replication**. On the primary, a `walsender` process (one per connected standby) reads newly produced WAL records and ships them over a TCP connection as they are written — no waiting for WAL files to complete. On the standby, a `walreceiver` process receives the stream and writes it to local disk; the startup/recovery process then replays those WAL records into the data files. The result is a byte-for-byte copy of the primary that typically lags by only a few milliseconds.\n\nTo bootstrap a new standby, `pg_basebackup` streams an online backup over the same replication protocol. The standby activates when it finds a `standby.signal` file in its data directory — this replaced the old `recovery.conf` in PostgreSQL 12.\n\n**Key parameters on the primary:** `wal_level = replica` (the minimum for standbys), `max_wal_senders` (default 10 — the maximum number of simultaneously connected standbys), `max_replication_slots` (default 10), `wal_sender_timeout` (default 60 s — disconnect a standby that doesn't respond). On the standby: `primary_conninfo`, `hot_standby = on` (default — enables read queries while in recovery), `wal_receiver_timeout` (default 60 s — reconnect if the primary goes quiet).",
            uk: "Replication — це практика тримати копії даних на кількох серверах. У схемі **leader/follower** — домінантному патерні для реляційних баз — один **primary** (leader) приймає всі записи, а один або кілька **standbys** (followers, replicas) отримують потік змін і застосовують їх. Standbys можуть обслуговувати запити читання, поки primary обробляє записи, і готові перейняти відповідальність, якщо primary відмовить.\n\nОсновний механізм реплікації PostgreSQL — **streaming replication**. На primary процес `walsender` (по одному на кожен підключений standby) читає щойно вироблені WAL-записи й надсилає їх через TCP-зʼєднання в міру запису — не чекаючи заповнення WAL-файлів. На standby процес `walreceiver` отримує потік і записує на локальний диск; процес startup/recovery потім відтворює ці WAL-записи у файли даних. Результат — побайтова копія primary, яка типово відстає лише на кілька мілісекунд.\n\nДля початкового розгортання standby `pg_basebackup` передає онлайн-бекап по тому ж протоколу реплікації. Standby активується, коли знаходить файл `standby.signal` у своїй директорії даних — він замінив старий `recovery.conf` у PostgreSQL 12.\n\n**Ключові параметри на primary:** `wal_level = replica` (мінімум для standbys), `max_wal_senders` (дефолт 10 — максимум одночасно підключених standbys), `max_replication_slots` (дефолт 10), `wal_sender_timeout` (дефолт 60 с — відʼєднати standby, що не відповідає). На standby: `primary_conninfo`, `hot_standby = on` (дефолт — дозволяє read-запити під час recovery), `wal_receiver_timeout` (дефолт 60 с — перепідключитися, якщо primary замовк).",
          },
        },
        {
          kind: 'figure',
          fig: 'streaming-replication',
          caption: {
            en: 'Streaming replication: walsender on the primary ships WAL to walreceivers on standbys. Replication slots prevent WAL recycling before standbys consume it.',
            uk: 'Streaming replication: walsender на primary надсилає WAL walreceivers на standbys. Replication slots запобігають переробці WAL до його споживання standbys.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: 'Replication slots: helpful but dangerous',
            uk: 'Replication slots: корисні, але небезпечні',
          },
          md: {
            en: 'A **replication slot** prevents the primary from recycling WAL segments until every slot consumer has confirmed receiving them — so a disconnected standby with a slot will cause WAL to accumulate indefinitely, filling the disk. Either monitor `pg_replication_slots.wal_status` and set `max_slot_wal_keep_size`, or use **`idle_replication_slot_timeout`** (new in PostgreSQL 18, default 0 = disabled) to automatically invalidate slots inactive beyond a threshold.',
            uk: '**Replication slot** не дає primary перероблювати WAL-сегменти, доки кожен споживач не підтвердить отримання — тож відключений standby зі слотом накопичуватиме WAL нескінченно, заповнюючи диск. Або моніторте `pg_replication_slots.wal_status` і встановіть `max_slot_wal_keep_size`, або використовуйте **`idle_replication_slot_timeout`** (новинка PostgreSQL 18, дефолт 0 = вимкнено), щоб автоматично анулювати слоти, неактивні понад поріг.',
          },
        },
      ],
    },
    // ── Topic 2: Sync vs async — the durability/latency trade ────────────
    {
      id: 'sync-vs-async',
      title: {
        en: 'Sync vs async — the durability/latency trade',
        uk: 'Sync проти async — компроміс надійності та затримки',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Streaming replication is **asynchronous by default**: the primary writes WAL locally and returns success to the client immediately, without waiting for any standby to confirm receipt. This gives low write latency — but if the primary crashes before the standby receives the last WAL records, those commits are lost. The amount of data loss is bounded by the **replication lag** (how far behind the standby was at the moment of failure), which is typically seconds in a healthy setup but can grow under load.\n\nSwitching to **synchronous replication** eliminates (or bounds) this risk at the cost of extra write latency — the primary waits for at least one standby to confirm receipt before returning success. The `synchronous_commit` parameter controls exactly what the primary waits for, and it can be set cluster-wide or **per transaction** (`SET LOCAL synchronous_commit = off` for non-critical writes in an otherwise synchronous cluster).\n\nSynchronous replication requires `synchronous_standby_names` to list which standbys to wait for. Two forms: `FIRST 1 (s1, s2)` (priority — wait for the highest-priority available standby) and `ANY 1 (s1, s2)` (quorum — wait for any one of the listed standbys, available since PostgreSQL 10).",
            uk: "Streaming replication за замовчуванням **асинхронна**: primary записує WAL локально і негайно повертає успіх клієнту, не чекаючи підтвердження від standby. Це дає низьку latency запису — але якщо primary впаде до того, як standby отримає останні WAL-записи, ці commit'и втрачаються. Обсяг втрат обмежений **replication lag** (наскільки standby відставав у момент відмови), зазвичай секунди у здоровому середовищі, але може зростати під навантаженням.\n\nПерехід на **synchronous replication** усуває (або обмежує) цей ризик ціною додаткової latency запису — primary чекає, поки принаймні один standby підтвердить отримання, перш ніж повернути успіх. Параметр `synchronous_commit` контролює саме те, чого чекає primary, і його можна встановити глобально або **на рівні транзакції** (`SET LOCAL synchronous_commit = off` для некритичних записів у синхронному кластері).\n\nSynchronous replication вимагає, щоб `synchronous_standby_names` перелічував, яких standbys чекати. Дві форми: `FIRST 1 (s1, s2)` (пріоритет — чекати на найвищопріоритетний доступний standby) і `ANY 1 (s1, s2)` (кворум — чекати на будь-який із зазначених standbys, доступно від PostgreSQL 10).",
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'synchronous_commit value', uk: 'Значення synchronous_commit' },
            { en: 'Primary waits until…', uk: 'Primary чекає, поки…' },
            { en: 'Data-loss risk on crash', uk: 'Ризик втрати даних при збої' },
          ],
          rows: [
            [
              { en: 'off', uk: 'off' },
              { en: 'Local WAL flush is skipped too — very risky', uk: 'Пропускається навіть локальний WAL flush — дуже ризиковано' },
              { en: '≤ ~3× wal_writer_delay of recent commits; no inconsistency but possible loss', uk: '≤ ~3× wal_writer_delay останніх commit\'ів; без inconsistency, але з можливими втратами' },
            ],
            [
              { en: 'local (default)', uk: 'local (дефолт)' },
              { en: 'Local WAL flush only (async standby)', uk: 'Лише локальний WAL flush (async standby)' },
              { en: 'Any write not yet received by a standby — the async window', uk: 'Будь-який запис, не отриманий standby — вікно async' },
            ],
            [
              { en: 'remote_write', uk: 'remote_write' },
              { en: "Standby has received and OS-buffered the WAL (not yet fsync'd)", uk: "Standby отримав WAL і помістив його в OS-buffer (ще не fsync'd)" },
              { en: 'Data in standby OS buffer — lost if standby OS crashes before flush', uk: 'Дані в OS-buffer standby — втрачаються при збої OS standby до flush' },
            ],
            [
              { en: 'on', uk: 'on' },
              { en: "Standby has fsync'd the WAL to disk (2-safe)", uk: "Standby зробив fsync WAL на диск (2-safe)" },
              { en: 'Zero — unless primary AND standby crash simultaneously', uk: 'Нуль — якщо тільки primary І standby не падають одночасно' },
            ],
            [
              { en: 'remote_apply', uk: 'remote_apply' },
              { en: 'Standby has replayed and applied the commit (visible on standby)', uk: 'Standby відтворив і застосував commit (видно на standby)' },
              { en: 'Zero; also enables causal read-your-writes from standbys', uk: 'Нуль; також дозволяє causal read-your-writes зі standbys' },
            ],
          ],
          caption: {
            en: 'synchronous_commit controls the durability/latency trade. Set per-transaction with SET LOCAL.',
            uk: 'synchronous_commit керує компромісом надійності/latency. Встановлюйте на рівні транзакції через SET LOCAL.',
          },
        },
        {
          kind: 'sim',
          sim: 'replication',
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Quorum replication: ANY n (…)',
            uk: 'Quorum replication: ANY n (…)',
          },
          md: {
            en: '`synchronous_standby_names = ANY 2 (s1, s2, s3)` — wait for any two of the three standbys to confirm. This tolerates one standby being down or lagging while still making progress, unlike `FIRST 2 (…)` which requires the two highest-priority standbys specifically. Quorum commit is the production-HA sweet spot: zero data loss with N−1 standby tolerance.',
            uk: '`synchronous_standby_names = ANY 2 (s1, s2, s3)` — чекати підтвердження будь-яких двох із трьох standbys. Це терпить відсутність або відставання одного standby, продовжуючи роботу, на відміну від `FIRST 2 (…)`, що вимагає двох конкретних найвищопріоритетних standbys. Quorum commit — це виробничий HA-sweet spot: нуль втрат даних із толерантністю до N−1 standby.',
          },
        },
      ],
    },
    // ── Topic 3: Physical vs logical replication ───────────────────────────
    {
      id: 'physical-vs-logical',
      title: {
        en: 'Physical vs logical replication',
        uk: 'Physical проти logical replication',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The streaming replication described above is **physical replication**: it ships WAL at the byte/block level, producing a byte-for-byte replica of the entire primary. The standby must run the **same PostgreSQL major version** (the docs state explicitly: \"log shipping between servers running different major PostgreSQL release levels is not possible\"). Physical replication replicates everything — all databases, all tables, all system catalogs — you cannot cherry-pick.\n\n**Logical replication**, native since PostgreSQL 10, works differently. A **logical decoding** process reads the WAL through the `pgoutput` plugin and translates it into row-level change events (INSERT, UPDATE, DELETE). The publisher (source) defines a **PUBLICATION** (which tables to expose); the subscriber (destination) creates a **SUBSCRIPTION** that connects, replicates the initial snapshot, and then streams ongoing changes. Logical replication:\n- Works **across PostgreSQL major versions** (useful for zero-downtime major upgrades)\n- Works **across operating systems and architectures**\n- Can replicate **individual tables or schemas** (not the whole cluster)\n- Allows the subscriber to have **additional indexes, columns, or transforms**\n- Does **not** replicate DDL (schema changes), sequences, or large objects — schema management is your responsibility\n\nLogical replication is also the foundation for third-party CDC (Change Data Capture) tools: **Debezium** captures row-level events from the WAL and publishes them to Kafka; tools like **pglogical** extend it with multi-master capabilities.",
            uk: "Streaming replication, описана вище, — це **physical replication**: вона передає WAL на рівні байтів/блоків, створюючи побайтову репліку всього primary. Standby мусить запускати **той самий мажорний релізний PostgreSQL** (документація прямо зазначає: «log shipping між серверами з різними мажорними релізами PostgreSQL неможливий»). Physical replication реплікує все — всі бази даних, всі таблиці, всі системні каталоги — вибірково обрати не можна.\n\n**Logical replication**, рідна для PostgreSQL від версії 10, працює інакше. Процес **logical decoding** читає WAL через плагін `pgoutput` і перетворює його на рядково-рівневі події змін (INSERT, UPDATE, DELETE). Видавець (джерело) визначає **PUBLICATION** (які таблиці відкрити); передплатник (призначення) створює **SUBSCRIPTION**, яка підключається, реплікує початковий snapshot, а потім транслює поточні зміни. Logical replication:\n- Працює **між мажорними версіями PostgreSQL** (корисно для major-апгрейдів без downtime)\n- Працює **між різними ОС та архітектурами**\n- Може реплікувати **окремі таблиці чи схеми** (не весь кластер)\n- Дозволяє підписнику мати **додаткові indexes, колонки або трансформації**\n- **Не** реплікує DDL (зміни схеми), sequences або large objects — управління схемою ваша відповідальність\n\nLogical replication також є основою для сторонніх CDC-інструментів (Change Data Capture): **Debezium** захоплює рядково-рівневі події з WAL і публікує їх до Kafka; такі інструменти як **pglogical** розширюють її можливостями multi-master.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Physical replication', uk: 'Physical replication' },
          b: { en: 'Logical replication (PG 10+)', uk: 'Logical replication (PG 10+)' },
          rows: [
            [
              { en: 'Unit of transfer', uk: 'Одиниця передачі' },
              { en: 'Raw WAL bytes — block-level changes', uk: 'Сирі WAL-байти — зміни на рівні блоків' },
              { en: 'Row-level events via pgoutput plugin', uk: 'Рядково-рівневі події через плагін pgoutput' },
            ],
            [
              { en: 'Version constraint', uk: 'Обмеження версії' },
              { en: 'Same major PG version required', uk: 'Потрібна та сама мажорна версія PG' },
              { en: 'Cross-version and cross-platform', uk: 'Між версіями і між платформами' },
            ],
            [
              { en: 'Scope', uk: 'Обсяг' },
              { en: 'Entire cluster — all databases, all tables', uk: 'Весь кластер — всі бази, всі таблиці' },
              { en: 'Selected tables or schemas only', uk: 'Лише вибрані таблиці або схеми' },
            ],
            [
              { en: 'DDL replication', uk: 'Реплікація DDL' },
              { en: 'Yes — part of WAL', uk: 'Так — частина WAL' },
              { en: 'No — schema must be managed separately', uk: 'Ні — схема управляється окремо' },
            ],
            [
              { en: 'Primary use case', uk: 'Основний use case' },
              { en: 'HA standbys, read replicas, failover', uk: 'HA standbys, read replicas, failover' },
              { en: 'Major upgrades, CDC, selective replication, data pipelines', uk: 'Major-апгрейди, CDC, вибіркова реплікація, data pipelines' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Publisher side (PostgreSQL 10+): define which tables to expose
CREATE PUBLICATION app_pub FOR TABLE orders, products;

-- Subscriber side: connect and start receiving changes
CREATE SUBSCRIPTION app_sub
  CONNECTION 'host=primary dbname=myapp user=replication_user'
  PUBLICATION app_pub;

-- Monitoring on the subscriber
SELECT subname, received_lsn, latest_end_lsn, latest_end_time
FROM pg_stat_subscription;`,
          note: {
            en: 'Logical replication does not replicate DDL — run schema changes on both sides before adding tables to the publication.',
            uk: 'Logical replication не реплікує DDL — виконуйте зміни схеми на обох сторонах перед додаванням таблиць до publication.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'Zero-downtime major upgrade path',
            uk: 'Шлях major-апгрейду без downtime',
          },
          md: {
            en: 'Set up logical replication from an old primary (PG 16) to a new cluster (PG 18). Once the subscriber has caught up and lag is near zero, promote the new cluster and switch application connections. Sequences and DDL must be handled separately — but you get a measured, reversible upgrade with near-zero downtime. PG 17 added **logical replication failover slots** so the subscription survives a primary failover during the upgrade window.',
            uk: 'Налаштуйте logical replication зі старого primary (PG 16) на новий кластер (PG 18). Коли підписник наздожене та lag буде близько нуля, промоутіть новий кластер і перемкніть підключення застосунку. Sequences і DDL потрібно обробляти окремо — але ви отримуєте виважений, зворотній апгрейд із майже нульовим downtime. PG 17 додав **logical replication failover slots**, тож підписка переживає failover primary під час вікна апгрейду.',
          },
        },
      ],
    },
    // ── Topic 4: Replication lag & monitoring ─────────────────────────────
    {
      id: 'replication-lag-monitoring',
      title: {
        en: 'Replication lag & monitoring',
        uk: 'Replication lag та моніторинг',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Replication lag is the distance between what the primary has committed and what the standby has replayed. It has two dimensions: **bytes** (how much WAL the standby is behind) and **time** (how long ago the primary generated the WAL the standby is currently replaying). Both matter: a high-throughput primary can accumulate bytes quickly even with a millisecond-per-record lag, and a quiescent primary can show zero byte lag but a large time lag if it hasn't had recent transactions.\n\n`pg_stat_replication` on the primary is the main monitoring view — one row per connected `walsender`. The four LSN columns advance in order: `sent_lsn ≥ write_lsn ≥ flush_lsn ≥ replay_lsn`. Subtracting each standby's column from `pg_current_wal_lsn()` gives bytes of lag at each stage. The three `*_lag` interval columns (`write_lag`, `flush_lag`, `replay_lag`) give wall-clock time between the primary's WAL flush and the standby's acknowledgment of each stage — they are `NULL` when the standby is fully caught up and idle.",
            uk: "Replication lag — це відстань між тим, що зафіксував primary, і тим, що standby вже відтворив. Він має два виміри: **байти** (наскільки WAL standby позаду) і **час** (коли давно primary генерував WAL, який standby зараз відтворює). Обидва важливі: high-throughput primary може швидко накопичувати байти навіть за мілісекундного lag на запис, а спокійний primary може показувати нульовий байтовий lag, але великий часовий lag, якщо нещодавніх транзакцій не було.\n\n`pg_stat_replication` на primary — основний view для моніторингу: по одному рядку на кожен підключений `walsender`. Чотири LSN-колонки зростають по порядку: `sent_lsn ≥ write_lsn ≥ flush_lsn ≥ replay_lsn`. Відніміть колонку кожного standby від `pg_current_wal_lsn()`, щоб отримати байти lag на кожному етапі. Три інтервальні колонки `*_lag` (`write_lag`, `flush_lag`, `replay_lag`) дають wall-clock час між flush WAL на primary і підтвердженням standby кожного етапу — вони `NULL`, коли standby повністю наздогнав і простоює.",
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'pg_stat_replication column', uk: 'Колонка pg_stat_replication' },
            { en: 'What it tracks', uk: 'Що відстежує' },
          ],
          rows: [
            [
              { en: 'sent_lsn', uk: 'sent_lsn' },
              { en: 'Last WAL location sent over the network', uk: 'Остання WAL-локація, надіслана мережею' },
            ],
            [
              { en: 'write_lsn', uk: 'write_lsn' },
              { en: "Standby has written to disk (OS-buffered, may not be fsync'd)", uk: "Standby записав на диск (OS-буфер, можливо ще не fsync'd)" },
            ],
            [
              { en: 'flush_lsn', uk: 'flush_lsn' },
              { en: "Standby has fsync'd to disk — corresponds to synchronous_commit=on", uk: "Standby зробив fsync на диск — відповідає synchronous_commit=on" },
            ],
            [
              { en: 'replay_lsn', uk: 'replay_lsn' },
              { en: 'Standby has applied the WAL into its data files — visible to readers', uk: 'Standby застосував WAL у файли даних — видно читачам' },
            ],
            [
              { en: 'write_lag / flush_lag / replay_lag', uk: 'write_lag / flush_lag / replay_lag' },
              { en: 'Wall-clock elapsed between primary flush and standby confirm at each stage; NULL when idle and fully caught up', uk: 'Wall-clock між flush primary і підтвердженням standby на кожному етапі; NULL при простої та повній наздоженості' },
            ],
            [
              { en: 'sync_state', uk: 'sync_state' },
              { en: "async / potential / sync / quorum — whether this standby is counted for synchronous_commit", uk: "async / potential / sync / quorum — чи враховується цей standby для synchronous_commit" },
            ],
          ],
          caption: {
            en: "Use pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) to compute byte lag for a standby.",
            uk: "Використовуйте pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) для обчислення байтового lag standby.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Byte lag per standby (primary side)
SELECT
  application_name,
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)  AS replay_lag_bytes,
  replay_lag                                            AS replay_lag_time,
  state
FROM pg_stat_replication
ORDER BY replay_lag_bytes DESC NULLS LAST;

-- Standby side: your own WAL receiver status
SELECT received_lsn, last_msg_receipt_time, status
FROM pg_stat_wal_receiver;`,
          note: {
            en: 'Alert when replay_lag_bytes exceeds your RTO/RPO threshold or when sync_state unexpectedly changes to async.',
            uk: 'Надсилайте сповіщення, коли replay_lag_bytes перевищує ваш поріг RTO/RPO або коли sync_state несподівано змінюється на async.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Cascading replication is always async',
            uk: 'Cascading replication завжди async',
          },
          md: {
            en: 'A standby can relay WAL downstream to further standbys (chains of arbitrary depth). This reduces load on the primary but comes with a key constraint: the PostgreSQL docs state explicitly that "synchronous replication settings have no effect on cascading replication at present" — even if the intermediate standby is synchronous with the primary, the downstream replicas are always asynchronous.',
            uk: 'Standby може передавати WAL далі до інших standbys (ланцюжки довільної глибини). Це зменшує навантаження на primary, але має ключове обмеження: документація PostgreSQL прямо зазначає, що «synchronous replication settings have no effect on cascading replication at present» — навіть якщо проміжний standby синхронний із primary, downstream-репліки завжди асинхронні.',
          },
        },
      ],
    },
    // ── Topic 5: Failover & HA with Patroni ──────────────────────────────
    {
      id: 'failover-patroni',
      title: {
        en: 'Failover & HA with Patroni',
        uk: 'Failover та HA з Patroni',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Manual failover — detect a primary failure, choose a standby, promote it, redirect all application connections — is error-prone and slow. **Patroni** (v4.1.3; supports PostgreSQL 9.3–18; created at Compose, open-sourced by Zalando in 2016) is the de-facto high-availability solution for self-managed PostgreSQL, used by major cloud providers, managed Postgres services (Crunchy Data, EDB), and major Linux distributions.\n\nPatroni relies on a **Distributed Configuration Store (DCS)** — etcd, Consul, ZooKeeper, or Kubernetes (Endpoints/ConfigMaps) — for leader election and cluster state. The primary holds a **DCS lease with a TTL** (default ~30 s). If the primary fails to renew its lease (network partition, crash, overload), the lease expires. Standbys then race to acquire the leader lock via a compare-and-swap operation; the winner calls `pg_promote()` and becomes the new primary. The losers update their `primary_conninfo` to follow the new primary.\n\nTo limit data loss on failover, **`maximum_lag_on_failover`** (bytes) makes a standby ineligible for promotion if it is more than this many bytes behind the primary — standbys further behind simply wait for the promoted one to become primary and then follow it.\n\nAfter a failover, the demoted old primary needs to rejoin as a standby. Rather than a full `pg_basebackup` (which can take hours for large databases), **`pg_rewind`** rewinds the old primary's data directory to the common ancestor point with the new primary, then only streams the WAL that diverged — fast regardless of database size. `pg_rewind` requires either `data_checksums` to be enabled or `wal_log_hints = on`.",
            uk: "Ручний failover — виявити відмову primary, вибрати standby, промоутити його, перенаправити всі підключення застосунку — схильний до помилок і повільний. **Patroni** (v4.1.3; підтримує PostgreSQL 9.3–18; створений у Compose, відкритий Zalando у 2016 р.) — де-факто рішення для high availability для self-managed PostgreSQL, яке використовують великі хмарні провайдери, managed Postgres-сервіси (Crunchy Data, EDB) та основні дистрибутиви Linux.\n\nPatroni спирається на **Distributed Configuration Store (DCS)** — etcd, Consul, ZooKeeper або Kubernetes (Endpoints/ConfigMaps) — для виборів лідера та стану кластера. Primary тримає **DCS lease з TTL** (типово ~30 с). Якщо primary не поновить lease (мережевий розподіл, збій, перевантаження), lease минає. Standbys тоді змагаються за отримання leader lock через операцію compare-and-swap; переможець викликає `pg_promote()` і стає новим primary. Переможені оновлюють свій `primary_conninfo`, щоб слідувати новому primary.\n\nДля обмеження втрат даних при failover **`maximum_lag_on_failover`** (байти) робить standby непридатним для промоції, якщо він відстає від primary більш ніж на стільки байтів — standbys, що відстають більше, просто чекають, поки промоутований не стане primary, а потім слідують за ним.\n\nПісля failover старий primary, що був понижений, потребує перепідключення як standby. Замість повного `pg_basebackup` (що може тривати години для великих БД), **`pg_rewind`** відмотує каталог даних старого primary до спільної точки з новим primary, а потім транслює лише WAL, що розійшовся — швидко незалежно від розміру БД. `pg_rewind` вимагає або увімкнених `data_checksums`, або `wal_log_hints = on`.",
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'Patroni synchronous mode: zero data loss with dynamic management',
            uk: 'Patroni synchronous mode: нуль втрат даних із динамічним управлінням',
          },
          md: {
            en: "Patroni can manage `synchronous_standby_names` automatically. `synchronous_mode: on` guarantees promotion only goes to a standby with all durably committed transactions. `synchronous_mode: quorum` uses PostgreSQL's `ANY n (…)` quorum syntax for N−1 standby fault tolerance. `synchronous_mode_strict: on` makes the primary refuse writes (become read-only) when no synchronous standby is available — trading availability for zero data loss.",
            uk: "Patroni може автоматично керувати `synchronous_standby_names`. `synchronous_mode: on` гарантує, що промоція відбувається лише для standby з усіма durable-зафіксованими транзакціями. `synchronous_mode: quorum` використовує синтаксис кворуму `ANY n (…)` PostgreSQL для fault tolerance N−1 standby. `synchronous_mode_strict: on` примушує primary відхиляти записи (ставати read-only) коли синхронний standby недоступний — жертвуючи availability заради нуля втрат даних.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: 'Split-brain: two primaries writing at once',
            uk: 'Split-brain: два primaries пишуть одночасно',
          },
          md: {
            en: "A failed leader might still be alive but unable to reach the DCS (network partition). If it continues accepting writes while a new primary is promoted, you have **split-brain** — two nodes diverging independently, which is catastrophic for data integrity. The DCS lease TTL and Patroni's fencing strategies (STONITH — Shoot The Other Node In The Head) are the mitigations: the old primary's lease expires and it is prevented from committing further. **Never bypass these fencing mechanisms** in production, even under pressure to restore write access quickly.",
            uk: "Лідер, що відмовив, може все ще бути живим, але нездатним дістатися DCS (мережевий розподіл). Якщо він продовжує приймати записи, поки промоутується новий primary, маємо **split-brain** — два вузли розходяться незалежно, що катастрофічно для цілісності даних. TTL lease DCS і стратегії fencing Patroni (STONITH — Shoot The Other Node In The Head) є засобами захисту: lease старого primary минає і йому не дозволяється фіксувати подальші зміни. **Ніколи не обходьте ці механізми fencing** у production, навіть під тиском швидко відновити доступ до запису.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'Streaming replication ships WAL byte-for-byte in real time: walsender on the primary, walreceiver on the standby. Standbys can serve read queries (hot_standby = on, default).',
      uk: 'Streaming replication передає WAL байт за байтом у реальному часі: walsender на primary, walreceiver на standby. Standbys можуть обслуговувати read-запити (hot_standby = on, дефолт).',
    },
    {
      en: 'Async replication (the default) is fast but can lose the last few commits if the primary crashes before the standby receives them. Sync replication (synchronous_commit=on) eliminates this at the cost of extra write latency.',
      uk: 'Async replication (дефолт) швидка, але може втратити останні кілька commit\'ів, якщо primary впаде до того, як standby їх отримає. Sync replication (synchronous_commit=on) усуває це ціною додаткової write latency.',
    },
    {
      en: 'Physical replication = byte-level copy, same PG version only, whole cluster. Logical replication = row-level events, cross-version, per-table — ideal for zero-downtime major upgrades and CDC pipelines.',
      uk: 'Physical replication = побайтова копія, лише та сама версія PG, весь кластер. Logical replication = рядково-рівневі події, між версіями, по-таблично — ідеально для major-апгрейдів без downtime і CDC pipelines.',
    },
    {
      en: 'pg_stat_replication on the primary shows sent_lsn, write_lsn, flush_lsn, replay_lsn and their lag intervals — your first tool for measuring replication health.',
      uk: 'pg_stat_replication на primary показує sent_lsn, write_lsn, flush_lsn, replay_lsn та їхні інтервали lag — перший інструмент для вимірювання здоровʼя реплікації.',
    },
    {
      en: 'Patroni automates failover via DCS leader election (etcd/Consul/K8s). maximum_lag_on_failover caps data loss; pg_rewind lets a demoted primary rejoin quickly without a full base backup.',
      uk: 'Patroni автоматизує failover через вибори лідера DCS (etcd/Consul/K8s). maximum_lag_on_failover обмежує втрату даних; pg_rewind дозволяє поміченому primary швидко повернутися без повного base backup.',
    },
  ],
  pitfalls: [
    {
      title: {
        en: 'Abandoned replication slots filling the disk',
        uk: 'Покинуті replication slots, що заповнюють диск',
      },
      body: {
        en: "A replication slot prevents WAL from being recycled even if the standby is disconnected for days. Monitor `pg_replication_slots.wal_status` and alert when it changes from 'reserved' to 'extended' or 'lost'. Set `max_slot_wal_keep_size` as a safety cap. In PostgreSQL 18, set `idle_replication_slot_timeout` to automatically invalidate stale slots.",
        uk: "Replication slot не дозволяє переробляти WAL, навіть якщо standby відключений днями. Моніторте `pg_replication_slots.wal_status` і надсилайте сповіщення, коли він змінюється з 'reserved' на 'extended' або 'lost'. Встановіть `max_slot_wal_keep_size` як запобіжний cap. У PostgreSQL 18 встановіть `idle_replication_slot_timeout` для автоматичного анулювання застарілих слотів.",
      },
    },
    {
      title: {
        en: 'Promoting the most-lagged standby',
        uk: 'Промоція найбільш відсталого standby',
      },
      body: {
        en: "During a chaotic failover it is tempting to promote any available standby. But promoting a standby with a large replay_lag means guaranteed data loss. Patroni's maximum_lag_on_failover exists for exactly this reason — configure it based on your RPO. With quorum synchronous replication, the winner is always one of the standbys that already has all committed data.",
        uk: "Під час хаотичного failover виникає спокуса промоутувати будь-який доступний standby. Але промоція standby з великим replay_lag означає гарантовані втрати даних. maximum_lag_on_failover Patroni існує саме з цієї причини — налаштуйте його відповідно до вашого RPO. З quorum synchronous replication переможець завжди буде одним із standbys, що вже має всі зафіксовані дані.",
      },
    },
    {
      title: {
        en: 'Routing writes to a standby after failover (stale connection pooler config)',
        uk: 'Маршрутизація записів на standby після failover (застаріла конфіг пула зʼєднань)',
      },
      body: {
        en: "Applications that cache the primary's host address (or use a stale connection pool config) will send writes to the old primary — now a standby — and get errors or silent reads-only mode. Use a **virtual IP** (HAProxy, pgBouncer with a health check, or cloud load balancer) in front of Patroni so the connection endpoint stays stable across failovers. Patroni integrates with HAProxy and etcd-based dynamic DNS out of the box.",
        uk: "Застосунки, що кешують адресу хоста primary (або використовують застарілу конфігурацію пула зʼєднань), надсилатимуть записи на старий primary — тепер standby — і отримуватимуть помилки або тихий режим read-only. Використовуйте **virtual IP** (HAProxy, pgBouncer з перевіркою здоровʼя або хмарний балансувальник навантаження) перед Patroni, щоб endpoint зʼєднання залишався стабільним під час failover. Patroni інтегрується з HAProxy і etcd-based dynamic DNS з коробки.",
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: "What is the difference between synchronous_commit=on and synchronous_commit=remote_apply? When would you use remote_apply?",
        uk: "Яка різниця між synchronous_commit=on і synchronous_commit=remote_apply? Коли ви використали б remote_apply?",
      },
      a: {
        en: "`on` (2-safe): the primary waits until the standby has fsync'd the WAL — the data is on both disks. `remote_apply`: the primary additionally waits until the standby has **replayed** the WAL into its data files, making the commit visible to queries on the standby. Use `remote_apply` when you need **causal consistency** for reads from standbys — if a client writes on the primary and then immediately reads from a standby, `remote_apply` guarantees the read will see the write. The cost is higher write latency because replay includes lock acquisition and heap updates.",
        uk: "`on` (2-safe): primary чекає, поки standby зробить fsync WAL — дані на обох дисках. `remote_apply`: primary додатково чекає, поки standby **відтворить** WAL у файли даних, роблячи commit видимим для запитів на standby. Використовуйте `remote_apply`, коли потрібна **causal consistency** для читань зі standbys — якщо клієнт пише на primary і відразу читає зі standby, `remote_apply` гарантує, що читання побачить запис. Вартість — вища latency запису, оскільки replay включає отримання lock і оновлення heap.",
      },
    },
    {
      level: 'senior',
      q: {
        en: "How would you use PostgreSQL replication to perform a zero-downtime major version upgrade (e.g., PG 15 → PG 18)?",
        uk: "Як ви використали б PostgreSQL replication для major-апгрейду без downtime (напр., PG 15 → PG 18)?",
      },
      a: {
        en: "Use **logical replication** cross-version: (1) on the PG 18 cluster, `CREATE SUBSCRIPTION` pointing at a `PUBLICATION` on PG 15; (2) wait for the initial data sync to complete and lag to approach zero; (3) apply any DDL changes on both sides; (4) in a brief maintenance window, stop writes on PG 15, wait for final lag to drain, promote PG 18; (5) redirect application traffic to PG 18. This gives near-zero downtime (seconds for the final cutover) vs hours for `pg_upgrade --link`. PG 17 logical replication failover slots let the subscription survive a PG 15 primary failover during the migration window.",
        uk: "Використовуйте **logical replication** між версіями: (1) на кластері PG 18 виконайте `CREATE SUBSCRIPTION` вказуючи на `PUBLICATION` на PG 15; (2) дочекайтеся завершення початкової синхронізації даних і наближення lag до нуля; (3) застосуйте будь-які DDL-зміни на обох сторонах; (4) у короткому вікні обслуговування зупиніть записи на PG 15, дочекайтеся вичерпання фінального lag, промоутіть PG 18; (5) перенаправте трафік застосунку на PG 18. Це дає майже нульовий downtime (секунди для фінального переключення) на відміну від годин для `pg_upgrade --link`. Failover slots logical replication PG 17 дозволяють підписці пережити failover primary PG 15 під час вікна міграції.",
      },
    },
    {
      level: 'staff',
      q: {
        en: "Explain how Patroni achieves automatic failover and prevents split-brain. What role does pg_rewind play?",
        uk: "Поясніть, як Patroni досягає автоматичного failover і запобігає split-brain. Яка роль pg_rewind?",
      },
      a: {
        en: "Patroni uses a DCS (etcd/Consul/K8s) as the arbiter. The primary continuously renews a DCS **leader lease** with a TTL. If it fails to renew (crash, network partition), the lease expires. Standbys race to acquire the leader lock via a compare-and-swap operation — only one wins; the winner calls `pg_promote()`. **Split-brain prevention**: the old primary can only win the leader lock if it successfully renews it, so once the TTL expires it cannot continue as primary. STONITH (Shoot The Other Node In The Head) fencing adds an extra safety layer. After failover, the demoted old primary uses **`pg_rewind`** to rewind its data directory to the divergence point with the new primary (using WAL or the block-level diff from the checkpoint), then streams the remaining WAL to catch up — typically a few seconds instead of a multi-hour `pg_basebackup`. Requires `data_checksums` or `wal_log_hints = on`.",
        uk: "Patroni використовує DCS (etcd/Consul/K8s) як арбітра. Primary постійно поновлює **leader lease** DCS з TTL. Якщо він не поновлює (збій, мережевий розподіл), lease минає. Standbys змагаються за отримання leader lock через compare-and-swap — лише один перемагає; переможець викликає `pg_promote()`. **Запобігання split-brain**: старий primary може виграти leader lock лише якщо успішно поновлює його, тож після закінчення TTL він не може продовжувати бути primary. Fencing STONITH (Shoot The Other Node In The Head) додає додатковий рівень захисту. Після failover знижений старий primary використовує **`pg_rewind`**, щоб відмотати свій каталог даних до точки розходження з новим primary (використовуючи WAL або block-level diff від checkpoint), а потім транслює решту WAL для наздоганяння — зазвичай кілька секунд замість багатогодинного `pg_basebackup`. Вимагає `data_checksums` або `wal_log_hints = on`.",
      },
    },
  ],
  seeAlso: ['m17-acid-wal', 'm20-distributed-tx', 'm22-sharding', 'm24-ha-backups-dr'],
  sources: [
    {
      title: 'PostgreSQL 18 — Warm Standby (§26.2): streaming replication, sync, cascading',
      url: 'https://www.postgresql.org/docs/18/warm-standby.html',
    },
    {
      title: 'PostgreSQL 18 — Logical Replication (§29): publication/subscription, restrictions, failover slots',
      url: 'https://www.postgresql.org/docs/18/logical-replication.html',
    },
    {
      title: 'PostgreSQL 18 — pg_stat_replication view (§27.2.4)',
      url: 'https://www.postgresql.org/docs/18/monitoring-stats.html',
    },
    {
      title: 'PostgreSQL 18 — Replication configuration (§19.6): synchronous_commit, synchronous_standby_names',
      url: 'https://www.postgresql.org/docs/18/runtime-config-replication.html',
    },
    {
      title: 'Patroni documentation — README, replication modes, DCS integration',
      url: 'https://patroni.readthedocs.io/en/latest/',
    },
    {
      title: 'PostgreSQL 18 — pg_rewind (§IV.IV): rewinding after failover',
      url: 'https://www.postgresql.org/docs/18/app-pgrewind.html',
    },
  ],
};
