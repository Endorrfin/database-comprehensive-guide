import type { Module } from '../types';

/*
 * M24 · High availability, backups & DR — Section V (S12). Authored EN first, UA second;
 * technical terms stay English in both. Facts web-verified 2026-06-25 (see `sources`).
 *
 * Patroni (verified 2026-06-25 via github.com/patroni/patroni/releases):
 *  - Latest stable: v4.1.3 (released 2026-05-05). Repo moved from zalando/patroni → patroni/patroni.
 *  - DCS backends: etcd, Consul, ZooKeeper (+ Exhibitor), Kubernetes (Endpoints/ConfigMaps).
 *  - Key DCS/global params: ttl=30s (leader lock TTL), loop_wait=10s (main loop), retry_timeout=10s,
 *    master_start_timeout=300s (time before failover triggers), synchronous_mode.
 *  - maximum_lag_on_failover (bytes): caps how far behind a standby may be to be promoted.
 *  - pg_promote(): since PG 12 — promotes a standby without needing a trigger file.
 *  - pg_rewind (PG 18 docs, verified): requires EITHER wal_log_hints=on OR data checksums
 *    (enabled by default at initdb in PG 18+). Also requires full_page_writes=on (default).
 *    Rewrites diverged pages on a former primary so it can rejoin as a standby. If mid-process
 *    failure: data dir may be unrecoverable — always take a fresh backup first.
 *
 * pgBackRest (verified 2026-06-25 via pgbackrest.org):
 *  - Latest stable: v2.58.0 (released 2026-01-19).
 *  - IMPORTANT: April 2026 — original maintainer David Steele stopped work. Repo temporarily
 *    archived. May 18, 2026: coalition of sponsors (AWS, Supabase, pgEdge, Percona, Eon.io, Xata,
 *    Dalibo, Tiger Data, Data Egret) announced continuation. Project active as of May 2026.
 *  - Key differentiators: physical full + differential + incremental (block-level) backup;
 *    parallel backup/restore (process-max); native S3/GCS/Azure; lz4/zstd/gzip/bzip2; AES-256-CBC;
 *    retention policies (full + differential retention + WAL archive expiry); deduplication.
 *
 * Barman (verified 2026-06-25 via github.com/EnterpriseDB/barman):
 *  - Latest stable: v3.18.0 (released 2026-03-12). Maintained by EnterpriseDB.
 *  - Incremental backup via pg_basebackup block-level (PG 17+). Cloud: S3/Azure/GCS via
 *    barman-cloud-* scripts. Delta restore (v3.16.0 2025-10-02). GPG encryption (v3.14.0 2025-05-15).
 *
 * PITR (Point-in-Time Recovery) — PostgreSQL 18 docs (verified):
 *  - WAL archiving: archive_mode=on, archive_command='cp %p /path/%f' (shell; exit 0 on success).
 *    archive_mode values: off, on, always (always = also archives on a standby).
 *  - Since PG 12: no recovery.conf — params in postgresql.conf, activated by recovery.signal
 *    (PITR) or standby.signal (streaming standby).
 *  - restore_command='cp /archive/%f %p' — fetches WAL from the archive during recovery.
 *  - Recovery targets (at most one): recovery_target_time, recovery_target_lsn,
 *    recovery_target_name (pg_create_restore_point()), recovery_target_xid.
 *    recovery_target_action: pause (default) | promote | shutdown.
 *  - Workflow: pg_basebackup → continuous WAL archiving → recovery: restore base + restore_command
 *    + set target → create recovery.signal → start PG → replays WAL to target → pause/promote.
 *  - restore_command vs streaming: restore_command fetches segments from an archive (slower, seconds
 *    to minutes); streaming connects directly to primary (sub-second lag). Well-configured standbys
 *    use BOTH: streaming primary, restore_command as fallback.
 *
 * RPO/RTO: industry-standard definitions.
 *  - RPO (Recovery Point Objective): max acceptable data loss measured as time.
 *  - RTO (Recovery Time Objective): max acceptable time to restore service after failure.
 *
 * PG 18 specifics:
 *  - Data checksums enabled by default at initdb in PG 18 — pg_rewind no longer needs
 *    wal_log_hints=on for new clusters.
 *  - idle_replication_slot_timeout (S11/M21): auto-drops stale replication slots.
 *  - pg_basebackup --incremental: block-level incremental base backup (PG17+, GA in PG18).
 *
 * Cloud HA:
 *  - Amazon RDS Multi-AZ (Single Standby): sync replication, auto failover ~60–120 s (DNS CNAME).
 *    Multi-AZ DB Cluster (3-node): faster, ~35 s. Standby does NOT serve reads on single-standby.
 *  - Amazon Aurora: 6 copies across 3 AZs (2 per AZ); storage-level replication; failover < 60 s
 *    (typically < 30 s with replicas); < 10 min without replicas.
 *  - Azure PostgreSQL Flexible Server HA: zone-redundant; sync standby; ~60–120 s.
 *
 * Non-signature module: figures-only per locked plan (§6); M24 is not in the 8 signature sims.
 * Figures: `ha-cluster` (Patroni HA stack), `backup-pitr` (PITR timeline).
 * PG stable 18.4.
 */
export const m24: Module = {
  id: 'm24-ha-backups-dr',
  num: 24,
  section: 's5-distribution',
  order: 4,
  level: 'senior',
  signature: false,
  title: { en: 'High availability, backups & DR', uk: 'Висока доступність, backups і DR' },
  tagline: {
    en: 'Patroni/etcd, PITR & the WAL archive, RPO/RTO, testing restores.',
    uk: 'Patroni/etcd, PITR і WAL archive, RPO/RTO, тестування відновлень.',
  },
  readMins: 11,
  mentalModel: {
    en: "HA is fast failover; DR is surviving the region — and an untested backup doesn't exist.",
    uk: 'HA — це швидкий failover; DR — пережити втрату регіону; а неперевірений backup не існує.',
  },

  topics: [
    // ── Topic 1: HA building blocks — Patroni / etcd / pg_rewind ─────────
    {
      id: 'ha-patroni',
      title: {
        en: 'HA building blocks — Patroni, etcd and automatic failover',
        uk: 'Компоненти HA — Patroni, etcd та автоматичний failover',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**High availability (HA)** for a PostgreSQL cluster means: if the primary fails, a standby is promoted automatically and connections are routed to it within seconds, not minutes. Three building blocks make this work together: streaming replication (copies WAL in real time — M21), a **distributed coordination service (DCS)** that acts as the arbiter, and an **HA orchestrator** that watches the DCS and drives promotion.\n\n**Patroni** (v4.1.3, 2026-05-05) is the de-facto HA orchestrator for self-managed PostgreSQL. It runs as a daemon on every node. The primary continuously renews a **leader lock** in the DCS (etcd, Consul, ZooKeeper, or Kubernetes) with a configurable TTL (default 30 s). If the primary dies and the lock is not renewed within the TTL, one of the standbys races to acquire the lock — the winner promotes itself to primary. `loop_wait` (default 10 s) controls how often Patroni's main loop runs; `retry_timeout` (default 10 s) governs how long transient DCS/network errors are tolerated before Patroni demotes. `maximum_lag_on_failover` (bytes) prevents a severely lagged standby from being promoted — it must have received WAL up to within this many bytes of the primary's last flush.\n\nOnce a new primary is elected, clients must be redirected. The usual approach is a **connection pooler + VIP** (PgBouncer with a virtual IP that Patroni switches via a callback script), or a HAProxy/AWS ELB that health-checks which node is the primary.\n\nA critical step after failover: the old primary has a **diverged timeline**. It cannot simply rejoin as a standby — it may have written WAL that was never replicated. **`pg_rewind`** fast-rewinds the old primary's data directory to the common ancestor with the new primary's timeline, then resyncs only the diverged pages. This avoids a full `pg_basebackup` and lets the old primary rejoin in seconds or minutes rather than hours. Requirements: `wal_log_hints = on` (or data checksums, which is the default at `initdb` in PG 18+). **Never run `pg_rewind` without a fresh backup** — a mid-process failure can leave the data directory unrecoverable.",
            uk: "**High availability (HA)** для PostgreSQL-кластера означає: якщо primary відмовляє, standby автоматично отримує підвищення і зʼєднання перенаправляються до нього за секунди, а не хвилини. Три будівельних блоки забезпечують це разом: streaming replication (копіює WAL в реальному часі — M21), **distributed coordination service (DCS)**, що виступає арбітром, та **HA-оркестратор**, який стежить за DCS і керує підвищенням.\n\n**Patroni** (v4.1.3, 2026-05-05) — де-факто HA-оркестратор для самостійно керованого PostgreSQL. Запускається як daemon на кожному вузлі. Primary безперервно оновлює **leader lock** у DCS (etcd, Consul, ZooKeeper або Kubernetes) з конфігурованим TTL (дефолт 30 с). Якщо primary гине і lock не оновлюється протягом TTL, один із standbys намагається захопити lock — переможець підвищується до primary. `loop_wait` (дефолт 10 с) визначає частоту роботи основного циклу Patroni; `retry_timeout` (дефолт 10 с) — тривалість допустимих тимчасових помилок DCS/мережі перед дерейтингом. `maximum_lag_on_failover` (байти) запобігає підвищенню сильно відсталого standby — він повинен мати WAL не більше ніж стільки байт від останнього flush primary.\n\nПісля обрання нового primary клієнтів треба перенаправити. Типовий підхід — **connection pooler + VIP** (PgBouncer з virtual IP, який Patroni перемикає через callback-скрипт) або HAProxy/AWS ELB з health-check для визначення поточного primary.\n\nКритичний крок після failover: старий primary має **розбіжну timeline**. Він не може просто приєднатися як standby — можливо, він записав WAL, що ніколи не реплікувався. **`pg_rewind`** швидко перемотує директорію даних старого primary до спільного предка з timeline нового primary, а потім перерозподіляє лише розбіжні сторінки. Це дозволяє уникнути повного `pg_basebackup` і дозволяє старому primary приєднатися за секунди або хвилини, а не години. Вимоги: `wal_log_hints = on` (або data checksums — дефолт при `initdb` в PG 18+). **Ніколи не запускайте `pg_rewind` без свіжого backup** — збій посередині може залишити директорію даних непридатною.",
          },
        },
        {
          kind: 'figure',
          fig: 'ha-cluster',
          caption: {
            en: 'Patroni HA cluster: the primary holds a leader lock in etcd. If the lock expires, a standby wins the race and promotes. pg_rewind resyncs the old primary without a full pg_basebackup.',
            uk: 'Patroni HA кластер: primary тримає leader lock у etcd. Якщо lock закінчується, standby виграє гонку і підвищується. pg_rewind ресинхронізує старий primary без повного pg_basebackup.',
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Patroni key configuration parameters (global/DCS section).',
            uk: 'Ключові параметри конфігурації Patroni (секція global/DCS).',
          },
          head: [
            { en: 'Parameter', uk: 'Параметр' },
            { en: 'Default', uk: 'Дефолт' },
            { en: 'Purpose', uk: 'Призначення' },
          ],
          rows: [
            [
              { en: 'ttl', uk: 'ttl' },
              { en: '30 s', uk: '30 с' },
              { en: 'Leader lock TTL; failover begins if not renewed within this window', uk: 'TTL leader lock; failover починається, якщо не оновлено в цьому вікні' },
            ],
            [
              { en: 'loop_wait', uk: 'loop_wait' },
              { en: '10 s', uk: '10 с' },
              { en: 'How often Patroni checks cluster health and renews the lock', uk: 'Як часто Patroni перевіряє здоровʼя кластера і оновлює lock' },
            ],
            [
              { en: 'retry_timeout', uk: 'retry_timeout' },
              { en: '10 s', uk: '10 с' },
              { en: 'Transient DCS/network errors shorter than this do not trigger failover', uk: 'Тимчасові помилки DCS/мережі коротше цього не тригерять failover' },
            ],
            [
              { en: 'maximum_lag_on_failover', uk: 'maximum_lag_on_failover' },
              { en: '(bytes)', uk: '(байти)' },
              { en: 'Max allowed replication lag for promotion eligibility', uk: 'Максимальний допустимий lag реплікації для допуску до підвищення' },
            ],
            [
              { en: 'master_start_timeout', uk: 'master_start_timeout' },
              { en: '300 s', uk: '300 с' },
              { en: 'Time primary is allowed to recover before automatic failover is triggered', uk: 'Час, протягом якого primary може відновлюватися до автоматичного failover' },
            ],
            [
              { en: 'synchronous_mode', uk: 'synchronous_mode' },
              { en: 'false', uk: 'false' },
              { en: 'Enables synchronous replication; only current sync standby can become primary', uk: 'Вмикає синхронну реплікацію; тільки поточний sync standby може стати primary' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: {
            en: 'A DCS quorum failure can take down your entire cluster',
            uk: 'Збій кворуму DCS може покласти весь кластер',
          },
          md: {
            en: "Patroni depends on the DCS (etcd, Consul) to arbitrate leadership. If the DCS loses quorum (e.g., a 3-node etcd loses 2 nodes), Patroni demotes the current primary as a safety measure (split-brain prevention). The database becomes read-only until DCS quorum is restored. **Run a 3-node or 5-node etcd/Consul cluster** separate from your PostgreSQL nodes; treat the DCS as a first-class HA component.",
            uk: "Patroni залежить від DCS (etcd, Consul) для арбітражу лідерства. Якщо DCS втрачає кворум (наприклад, 3-вузловий etcd втрачає 2 вузли), Patroni демотує поточний primary заради безпеки (запобігання split-brain). БД стає read-only до відновлення кворуму DCS. **Запускайте 3- або 5-вузловий кластер etcd/Consul** окремо від вузлів PostgreSQL; ставтеся до DCS як до повноцінного HA-компонента.",
          },
        },
      ],
    },

    // ── Topic 2: Backups — logical vs physical, pgBackRest, Barman ───────
    {
      id: 'backups',
      title: {
        en: 'Backups — logical vs physical, pgBackRest and Barman',
        uk: 'Backups — logical проти physical, pgBackRest та Barman',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **backup** is a copy of your data from which you can restore after a failure. PostgreSQL backups fall into two fundamental categories:\n\n**Logical backups** (`pg_dump`, `pg_dumpall`) export data as SQL statements or custom binary format. They are selective (per-database, per-schema, per-table), human-readable, and portable across PostgreSQL major versions. Restoring a logical backup means replaying SQL inserts — slow for large databases, but the only option when you need to restore a subset of objects or migrate to a new major version.\n\n**Physical backups** copy the raw data-directory files (pages). `pg_basebackup` is PostgreSQL's built-in tool: it streams a base backup of the entire cluster over the replication protocol, producing a ready-to-start data directory. Physical backups are faster to restore (no SQL re-execution), version-specific, and the foundation for PITR.\n\n**pgBackRest** (v2.58.0) extends physical backups with: **block-level incremental backups** (only changed 8 kB pages since the last full backup); **parallel** backup/restore across multiple processes; native **S3, GCS, and Azure** object storage; **multiple repositories** (local + cloud); AES-256-CBC **encryption**; and tight **WAL archiving integration** with deduplication. It is the most full-featured PostgreSQL backup solution and the recommended choice for production. *(Note: pgBackRest underwent a maintainership transition in April–May 2026; the project is funded and active as of May 2026.)*\n\n**Barman** (v3.18.0, EnterpriseDB) is the other major production backup solution. It supports full and incremental (block-level via `pg_basebackup --incremental` on PG17+) backups, streaming or SSH WAL archiving, cloud storage (S3/Azure/GCS via `barman-cloud-*` commands), GPG encryption, delta restore (reuses unchanged pages for faster restores), and retention policies. Barman's `barman check` command validates that the backup catalog and WAL archive are healthy before each backup.",
            uk: "**Backup** — це копія даних, з якої можна відновитися після збою. Backup-и PostgreSQL поділяються на дві фундаментальні категорії:\n\n**Logical backup-и** (`pg_dump`, `pg_dumpall`) експортують дані як SQL-інструкції або власний бінарний формат. Вони вибіркові (за БД, схемою, таблицею), зрозумілі людині та портабельні між major-версіями PostgreSQL. Відновлення з logical backup означає повторне виконання SQL-вставок — повільно для великих БД, але єдиний варіант при відновленні підмножини обʼєктів або міграції на нову major-версію.\n\n**Physical backup-и** копіюють raw-файли директорії даних (сторінки). `pg_basebackup` — вбудований інструмент PostgreSQL: він стрімить base backup цілого кластера по протоколу реплікації, створюючи готову до запуску директорію даних. Physical backup-и відновлюються швидше (немає повторного виконання SQL), залежать від версії та є основою для PITR.\n\n**pgBackRest** (v2.58.0) розширює physical backup-и: **block-level incremental backup-и** (лише змінені 8 kB сторінки з останнього full backup); **паралельний** backup/restore через кілька процесів; нативні **S3, GCS і Azure** обʼєктні сховища; **кілька репозиторіїв** (локальний + хмара); AES-256-CBC **шифрування**; і щільна **WAL archiving integration** з дедуплікацією. Це найповніше рішення для backup PostgreSQL і рекомендований вибір для production. *(Примітка: pgBackRest пройшов зміну супроводжувача у квітні–травні 2026; проєкт фінансується і активний з травня 2026.)*\n\n**Barman** (v3.18.0, EnterpriseDB) — інше основне backup-рішення. Підтримує full і incremental (block-level через `pg_basebackup --incremental` на PG17+) backup-и, streaming або SSH WAL archiving, хмарне сховище (S3/Azure/GCS через команди `barman-cloud-*`), GPG-шифрування, delta restore (повторне використання незмінених сторінок для швидшого відновлення) та retention policies. Команда `barman check` Barman перевіряє справність каталогу backup і WAL archive перед кожним backup.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Backup tool comparison — choose based on your infrastructure and operational needs.',
            uk: 'Порівняння backup-інструментів — обирайте залежно від інфраструктури та операційних потреб.',
          },
          head: [
            { en: 'Feature', uk: 'Можливість' },
            { en: 'pg_dump', uk: 'pg_dump' },
            { en: 'pg_basebackup', uk: 'pg_basebackup' },
            { en: 'pgBackRest', uk: 'pgBackRest' },
            { en: 'Barman', uk: 'Barman' },
          ],
          rows: [
            [
              { en: 'Backup type', uk: 'Тип backup' },
              { en: 'Logical (SQL)', uk: 'Logical (SQL)' },
              { en: 'Physical (full)', uk: 'Physical (full)' },
              { en: 'Physical full + diff + incremental', uk: 'Physical full + diff + incremental' },
              { en: 'Physical full + incremental', uk: 'Physical full + incremental' },
            ],
            [
              { en: 'Block-level incremental', uk: 'Block-level incremental' },
              { en: 'No', uk: 'Ні' },
              { en: 'No', uk: 'Ні' },
              { en: 'Yes (since v2.46)', uk: 'Так (з v2.46)' },
              { en: 'Yes (PG17+ via pg_basebackup)', uk: 'Так (PG17+ через pg_basebackup)' },
            ],
            [
              { en: 'Parallel backup/restore', uk: 'Паралельний backup/restore' },
              { en: 'No', uk: 'Ні' },
              { en: 'Limited', uk: 'Обмежено' },
              { en: 'Yes (process-max)', uk: 'Так (process-max)' },
              { en: 'No', uk: 'Ні' },
            ],
            [
              { en: 'Object store (S3/GCS/Azure)', uk: "Обʼєктне сховище (S3/GCS/Azure)" },
              { en: 'No', uk: 'Ні' },
              { en: 'No', uk: 'Ні' },
              { en: 'Yes (native)', uk: 'Так (нативно)' },
              { en: 'Yes (barman-cloud-*)', uk: 'Так (barman-cloud-*)' },
            ],
            [
              { en: 'Encryption', uk: 'Шифрування' },
              { en: 'No', uk: 'Ні' },
              { en: 'No', uk: 'Ні' },
              { en: 'AES-256-CBC', uk: 'AES-256-CBC' },
              { en: 'GPG (v3.14+)', uk: 'GPG (v3.14+)' },
            ],
            [
              { en: 'PITR integration', uk: 'PITR integration' },
              { en: 'No', uk: 'Ні' },
              { en: 'Via WAL archiving', uk: 'Через WAL archiving' },
              { en: 'Yes (native)', uk: 'Так (нативно)' },
              { en: 'Yes', uk: 'Так' },
            ],
            [
              { en: 'Version portability', uk: 'Портабельність між версіями' },
              { en: 'Yes', uk: 'Так' },
              { en: 'Same major only', uk: 'Тільки та сама major' },
              { en: 'Same major only', uk: 'Тільки та сама major' },
              { en: 'Same major only', uk: 'Тільки та сама major' },
            ],
          ],
        },
      ],
    },

    // ── Topic 3: PITR — point-in-time recovery ────────────────────────────
    {
      id: 'pitr',
      title: {
        en: 'PITR — Point-in-Time Recovery and the WAL archive',
        uk: 'PITR — Point-in-Time Recovery та WAL archive',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**Point-in-Time Recovery (PITR)** lets you restore a database to *any moment* between a base backup and the present — not just to the moment of the last backup. It relies on two things working together: a **base backup** (the starting point) and a continuous **WAL archive** (every WAL segment is copied to a durable location as soon as it is completed).\n\n**Setting up WAL archiving (postgresql.conf):**\n```\narchive_mode = on\narchive_command = 'cp %p /mnt/wal_archive/%f'\n```\n`archive_mode = always` also archives on a standby. The `archive_command` receives `%p` (full path to the WAL file) and `%f` (just the filename). It must exit 0 on success, non-zero on failure — PostgreSQL retries until it succeeds, so a failing `archive_command` will eventually block WAL recycling and fill disk.\n\n**PITR workflow:**\n1. Take a base backup: `pg_basebackup -h localhost -D /restore -P -Xs`\n2. On recovery: restore the base backup to the data directory.\n3. Set `restore_command = 'cp /mnt/wal_archive/%f %p'` in `postgresql.conf` (since PG 12; there is no `recovery.conf`).\n4. Set a recovery target: `recovery_target_time = '2026-06-25 14:30:00 UTC'` (or `_lsn`, `_name`, `_xid`).\n5. Create `recovery.signal` in the data directory (`standby.signal` for a streaming standby).\n6. Start PostgreSQL — it replays WAL segments from the archive until reaching the target, then pauses (or promotes, depending on `recovery_target_action`).\n\n**`restore_command` vs streaming replication:** The `restore_command` fetches completed WAL *segments* (~16 MB each) from the archive — there is an inherent lag (seconds to minutes) between a WAL segment being produced and being available in the archive. Streaming replication sends WAL *records* as they are produced, achieving sub-second lag. A production standby uses **both**: streaming for live operation, `restore_command` as a fallback when the stream is interrupted.",
            uk: "**Point-in-Time Recovery (PITR)** дозволяє відновити БД до *будь-якого моменту* між base backup і поточним часом — не лише до моменту останнього backup. Він спирається на дві речі: **base backup** (точка початку) та безперервний **WAL archive** (кожен WAL-сегмент копіюється в надійне місце одразу після завершення).\n\n**Налаштування WAL archiving (postgresql.conf):**\n```\narchive_mode = on\narchive_command = 'cp %p /mnt/wal_archive/%f'\n```\n`archive_mode = always` архівує також на standby. `archive_command` отримує `%p` (повний шлях до WAL-файлу) та `%f` (лише імʼя файлу). Повинен завершуватися з 0 при успіху, ненульовим — при помилці — PostgreSQL повторює спроби до успіху, тому помилковий `archive_command` врешті-решт заблокує переробку WAL та заповнить диск.\n\n**Workflow PITR:**\n1. Зробіть base backup: `pg_basebackup -h localhost -D /restore -P -Xs`\n2. При відновленні: відновіть base backup у директорію даних.\n3. Встановіть `restore_command = 'cp /mnt/wal_archive/%f %p'` у `postgresql.conf` (з PG 12; `recovery.conf` не існує).\n4. Встановіть recovery target: `recovery_target_time = '2026-06-25 14:30:00 UTC'` (або `_lsn`, `_name`, `_xid`).\n5. Створіть `recovery.signal` у директорії даних (`standby.signal` для streaming standby).\n6. Запустіть PostgreSQL — він відтворює WAL-сегменти з архіву до досягнення target, потім зупиняється (або підвищується залежно від `recovery_target_action`).\n\n**`restore_command` проти streaming replication:** `restore_command` отримує завершені WAL *сегменти* (~16 MB кожен) з архіву — є властива затримка (секунди до хвилин) між появою сегмента та його доступністю в архіві. Streaming replication надсилає WAL *записи* в міру виробництва, досягаючи затримки менше секунди. Production standby використовує **обидва**: streaming для живої роботи, `restore_command` як резервний варіант при перериванні потоку.",
          },
        },
        {
          kind: 'figure',
          fig: 'backup-pitr',
          caption: {
            en: 'PITR: a base backup sets the starting point; continuous WAL archiving fills in every change after. Recovery replays archived WAL up to the target timestamp, then stops. The restore window spans base-backup to present.',
            uk: 'PITR: base backup встановлює точку початку; безперервний WAL archive фіксує кожну зміну після. Recovery відтворює архівований WAL до target-timestamp, потім зупиняється. Вікно відновлення охоплює проміжок від base backup до теперішнього часу.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: {
            en: 'Named restore points let you mark known-good moments',
            uk: 'Named restore points дозволяють позначити відомі добрі моменти',
          },
          md: {
            en: "Before running a risky migration or a batch job, create a named restore point: `SELECT pg_create_restore_point('before_migration');`. If the migration goes wrong, set `recovery_target_name = 'before_migration'` to recover to exactly that moment. This is faster and more precise than guessing a timestamp.",
            uk: "Перед ризикованою міграцією або batch-завданням створіть named restore point: `SELECT pg_create_restore_point('before_migration');`. Якщо міграція пішла не так, встановіть `recovery_target_name = 'before_migration'` для відновлення до саме цього моменту. Це швидше і точніше, ніж вгадувати timestamp.",
          },
        },
      ],
    },

    // ── Topic 4: RPO/RTO and testing recovery ─────────────────────────────
    {
      id: 'rpo-rto-testing',
      title: {
        en: 'RPO, RTO and testing recovery — the backup you never restored',
        uk: 'RPO, RTO та тестування відновлення — backup, який ніколи не відновлювали',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Every HA and backup strategy starts with two business agreements:\n\n**RPO (Recovery Point Objective):** the maximum acceptable amount of data loss, measured in time. If RPO = 1 hour, the system must be recoverable to a state no more than 1 hour old — even in the worst-case failure. RPO drives backup frequency (how often to take base backups), WAL archiving retention, and whether you need synchronous replication (RPO = 0) or async (RPO = replication lag, typically seconds to minutes).\n\n**RTO (Recovery Time Objective):** the maximum acceptable time to restore service after a failure is declared. If RTO = 5 minutes, the cluster must be serving traffic again within 5 minutes. RTO drives failover automation (Patroni), standby placement (local vs cross-AZ vs cross-region), connection routing (HAProxy/VIP), and restore speed (physical vs logical backup, incremental vs full).\n\nTypical targets by tier:\n- **Synchronous HA** (Patroni + sync replication): RPO = 0, RTO = 30–120 s. Best for OLTP with zero-loss requirement.\n- **Async HA** (Patroni + async): RPO = replication lag (seconds), RTO = 30–120 s. Good balance for most applications.\n- **PITR only** (no hot standby): RPO = time since last archived WAL (seconds to minutes), RTO = hours (restore base backup + replay).\n- **Logical backup only** (pg_dump daily): RPO = 24 hours, RTO = hours. Acceptable only for non-critical data.\n\n**Cloud HA:** Amazon RDS Multi-AZ (synchronous standby, automatic failover ~60–120 s); Amazon Aurora (6 copies across 3 AZs at the storage layer, failover typically < 30 s with read replicas); Azure PostgreSQL Flexible Server (zone-redundant, ~60–120 s). Managed services handle orchestration but you give up some control over configuration and extensions.",
            uk: "Кожна HA- та backup-стратегія починається з двох бізнес-угод:\n\n**RPO (Recovery Point Objective):** максимально допустимий обсяг втрати даних, виміряний у часі. Якщо RPO = 1 година, система повинна відновлюватися до стану не старішого за 1 годину — навіть при найгіршому збої. RPO визначає частоту backup-ів (як часто робити base backup), retention WAL archive та необхідність синхронної реплікації (RPO = 0) або async (RPO = lag реплікації, зазвичай секунди-хвилини).\n\n**RTO (Recovery Time Objective):** максимально допустимий час відновлення сервісу після оголошення збою. Якщо RTO = 5 хвилин, кластер повинен знову обслуговувати трафік протягом 5 хвилин. RTO визначає автоматизацію failover (Patroni), розміщення standby (локально vs cross-AZ vs cross-region), маршрутизацію зʼєднань (HAProxy/VIP) та швидкість відновлення (physical vs logical backup, incremental vs full).\n\nТипові цілі за рівнями:\n- **Synchronous HA** (Patroni + sync replication): RPO = 0, RTO = 30–120 с. Найкраще для OLTP з вимогою нульових втрат.\n- **Async HA** (Patroni + async): RPO = lag реплікації (секунди), RTO = 30–120 с. Хороший баланс для більшості застосунків.\n- **PITR only** (без hot standby): RPO = час з останнього архівованого WAL (секунди-хвилини), RTO = години (відновлення base backup + відтворення).\n- **Logical backup only** (pg_dump щоденно): RPO = 24 години, RTO = години. Прийнятно лише для некритичних даних.\n\n**Cloud HA:** Amazon RDS Multi-AZ (синхронний standby, автоматичний failover ~60–120 с); Amazon Aurora (6 копій на 3 AZs на рівні storage, failover зазвичай < 30 с з read replicas); Azure PostgreSQL Flexible Server (zone-redundant, ~60–120 с). Managed-сервіси беруть на себе оркестрацію, але ви втрачаєте частину контролю над конфігурацією та extensions.",
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: {
            en: "A backup you've never restored doesn't exist",
            uk: "Backup, який ви ніколи не відновлювали, не існує",
          },
          md: {
            en: "The most common backup failure mode is: the backup ran successfully for months, but when you needed it, the restore failed — corrupt files, wrong permissions, outdated `restore_command`, changed encryption keys, or a schema that is incompatible with the version being restored to. **Test your full restore process at least monthly** on a separate, non-production server. Validate: (1) the backup completes without errors, (2) `pgbackrest verify` or `barman check` passes, (3) a restore to a test instance succeeds, (4) the instance starts and queries return expected results, (5) a PITR to a known restore point works. Patroni's `patronictl` can initiate a controlled failover to test the switchover path without data loss.",
            uk: "Найпоширеніший режим відмови backup: він успішно запускався місяцями, але коли він знадобився, відновлення не вдалося — пошкоджені файли, неправильні права, застарілий `restore_command`, змінені ключі шифрування або несумісна схема. **Тестуйте повний процес відновлення мінімум щомісяця** на окремому, не production-сервері. Перевіряйте: (1) backup завершується без помилок, (2) `pgbackrest verify` або `barman check` проходить, (3) відновлення до тестового інстансу успішне, (4) інстанс запускається і запити повертають очікувані результати, (5) PITR до відомої restore point працює. `patronictl` Patroni може ініціювати контрольований failover для тестування шляху переключення без втрати даних.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'HA (High Availability)', uk: 'HA (High Availability)' },
          b: { en: 'DR (Disaster Recovery)', uk: 'DR (Disaster Recovery)' },
          rows: [
            [
              { en: 'Failure scope', uk: 'Масштаб збою' },
              { en: 'Single node, AZ, or primary failure', uk: 'Збій окремого вузла, AZ або primary' },
              { en: 'Entire region, data center, or catastrophic data loss', uk: 'Цілий регіон, дата-центр або катастрофічна втрата даних' },
            ],
            [
              { en: 'RTO target', uk: 'RTO ціль' },
              { en: 'Seconds to minutes (automated failover)', uk: 'Секунди до хвилин (автоматичний failover)' },
              { en: 'Minutes to hours (manual restore or cross-region promotion)', uk: 'Хвилини до годин (ручне відновлення або cross-region підвищення)' },
            ],
            [
              { en: 'Key mechanism', uk: 'Ключовий механізм' },
              { en: 'Patroni + streaming replication + DCS', uk: 'Patroni + streaming replication + DCS' },
              { en: 'Backups (pgBackRest/Barman) + WAL archive + PITR', uk: 'Backups (pgBackRest/Barman) + WAL archive + PITR' },
            ],
            [
              { en: 'Data loss (RPO)', uk: 'Втрата даних (RPO)' },
              { en: '0 (sync) or seconds (async)', uk: '0 (sync) або секунди (async)' },
              { en: 'Seconds to minutes (WAL archive lag) or hours (periodic backups)', uk: 'Секунди до хвилин (lag WAL archive) або годин (регулярні backup-и)' },
            ],
            [
              { en: 'When it fires', uk: 'Коли спрацьовує' },
              { en: 'Automatically (Patroni watchdog)', uk: 'Автоматично (Patroni watchdog)' },
              { en: 'Manually declared (runbook)', uk: 'Оголошується вручну (runbook)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: {
            en: 'HA and backup are not substitutes for each other',
            uk: 'HA та backup не замінюють одне одного',
          },
          md: {
            en: "Streaming replication copies every change including DELETE mistakes, schema drops, and corrupted writes. If you accidentally `DROP TABLE` on the primary, all standbys immediately replicate the drop. For logical errors and human mistakes, only a PITR backup restores you to the state before the error. **You need both**: HA for infrastructure failures (fast, automated), backups + PITR for logical failures and DR (thorough, tested).",
            uk: "Streaming replication копіює кожну зміну, включаючи помилкові DELETE, DROP схем та пошкоджені записи. Якщо ви випадково зробили `DROP TABLE` на primary, всі standbys негайно реплікують цей DROP. При логічних помилках та людських помилках лише PITR backup відновлює стан до помилки. **Вам потрібні обидва**: HA для збоїв інфраструктури (швидко, автоматично), backup-и + PITR для логічних збоїв та DR (ґрунтовно, перевірено).",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: "Patroni (v4.1.3) orchestrates HA: the primary holds a DCS leader lock (TTL 30 s by default); lock expiry triggers standby promotion. pg_rewind fast-resyncs the old primary without a full pg_basebackup.",
      uk: "Patroni (v4.1.3) оркеструє HA: primary тримає DCS leader lock (TTL 30 с за дефолтом); закінчення lock тригерить підвищення standby. pg_rewind швидко ресинхронізує старий primary без повного pg_basebackup.",
    },
    {
      en: "Physical backups (pgBackRest, Barman) are the foundation for PITR. Block-level incremental backups drastically reduce backup size and time compared to full backups.",
      uk: "Physical backup-и (pgBackRest, Barman) — основа PITR. Block-level incremental backup-и суттєво зменшують розмір і час backup порівняно з full backup-ами.",
    },
    {
      en: "PITR = base backup + continuous WAL archive. In PG 12+, recovery.conf is gone — use postgresql.conf + recovery.signal. `restore_command` fetches segments from the archive; streaming replication is faster but only covers from the current WAL position.",
      uk: "PITR = base backup + безперервний WAL archive. З PG 12+ recovery.conf видалено — використовуйте postgresql.conf + recovery.signal. `restore_command` отримує сегменти з архіву; streaming replication швидша, але охоплює лише з поточної позиції WAL.",
    },
    {
      en: "RPO = max acceptable data loss (time); RTO = max acceptable recovery time. Agree these with the business first — they determine which HA/backup tier you build.",
      uk: "RPO = максимально допустима втрата даних (час); RTO = максимально допустимий час відновлення. Спочатку погодьте з бізнесом — вони визначають, який рівень HA/backup будувати.",
    },
    {
      en: "HA and backup are not substitutes: replication copies logical errors too (DROP TABLE). You need both — HA for fast infrastructure failover, PITR backup for logical mistakes and DR.",
      uk: "HA і backup не замінюють одне одного: реплікація копіює й логічні помилки (DROP TABLE). Потрібні обидва — HA для швидкого infrastructure failover, PITR backup для логічних помилок і DR.",
    },
    {
      en: "An untested backup doesn't exist. Validate restore monthly: pgbackrest verify / barman check → full restore to a test instance → PITR to a named restore point. Test the failover path with `patronictl switchover`.",
      uk: "Неперевірений backup не існує. Щомісяця перевіряйте відновлення: pgbackrest verify / barman check → повне відновлення до тестового інстансу → PITR до named restore point. Тестуйте шлях failover з `patronictl switchover`.",
    },
  ],

  pitfalls: [
    {
      title: { en: 'Forgetting to monitor WAL archive lag', uk: 'Забування моніторингу lag WAL archive' },
      body: {
        en: "The `archive_command` can silently fail for days — if the destination is full, permissions change, or the network path breaks, PostgreSQL queues WAL segments and fills the `pg_wal` directory. Monitor `archive_status/` (files in `.ready` state should be small) and set up alerts on `pg_wal` directory size. A stale archive means your PITR window suddenly ends much earlier than expected.",
        uk: "`archive_command` може мовчки давати збій днями — якщо призначення заповнене, права змінені або мережевий шлях обірваний, PostgreSQL накопичує WAL-сегменти й заповнює директорію `pg_wal`. Моніторте `archive_status/` (файли у стані `.ready` мають бути мінімальними) та налаштуйте алерти на розмір директорії `pg_wal`. Застарілий архів означає, що ваше вікно PITR несподівано завершується набагато раніше.",
      },
    },
    {
      title: { en: 'Using a lagged standby as the only DR copy', uk: 'Використання відсталого standby як єдиної DR-копії' },
      body: {
        en: "A hot standby replicated async may lag by seconds. It also immediately replicates logical errors (DROP TABLE, corrupted data). A standby is not a backup — it is a HA replica. If you need DR protection against logical errors and human mistakes, maintain a separate PITR backup on object storage. Some teams configure a **delayed standby** (`recovery_min_apply_delay`) that replays WAL with a configurable delay (e.g., 1 hour) — giving a window to catch mistakes before they propagate, without restoring from a full backup.",
        uk: "Гарячий standby, що реплікується асинхронно, може відставати на секунди. Він також негайно реплікує логічні помилки (DROP TABLE, пошкоджені дані). Standby — не backup, а HA-репліка. Якщо потрібен DR-захист від логічних помилок та людських помилок, підтримуйте окремий PITR backup в обʼєктному сховищі. Деякі команди налаштовують **delayed standby** (`recovery_min_apply_delay`), що відтворює WAL із конфігурованою затримкою (наприклад, 1 година) — це дає вікно для виявлення помилок до їх розповсюдження, без відновлення з повного backup.",
      },
    },
    {
      title: { en: 'Running pg_rewind without a fresh backup', uk: 'Запуск pg_rewind без свіжого backup' },
      body: {
        en: "pg_rewind is powerful but destructive: it overwrites the old primary's diverged pages in-place. If pg_rewind is interrupted (power loss, OOM, disk full), the data directory can be in an unrecoverable half-written state — you cannot restart the old primary and you cannot rewind again from a corrupt starting point. Always take a `pg_basebackup` or `pgbackrest backup` of the old primary **before** running pg_rewind, so you have a fallback.",
        uk: "pg_rewind потужний, але деструктивний: він перезаписує розбіжні сторінки старого primary in-place. Якщо pg_rewind переривається (відключення живлення, OOM, диск повний), директорія даних може бути у невідновлюваному напівзаписаному стані — ви не можете перезапустити старий primary і не можете знову перемотати з пошкодженої точки. Завжди робіть `pg_basebackup` або `pgbackrest backup` старого primary **перед** запуском pg_rewind, щоб мати запасний варіант.",
      },
    },
  ],

  interview: [
    {
      q: {
        en: "Walk me through how Patroni orchestrates a failover when the primary crashes.",
        uk: "Опишіть, як Patroni оркеструє failover при падінні primary.",
      },
      a: {
        en: "Patroni runs on every node and polls a DCS (etcd/Consul) in a loop (loop_wait, default 10 s). The primary continuously renews a leader lock with a TTL (default 30 s). If the primary crashes, it stops renewing the lock. After TTL seconds, the lock expires. Healthy standbys — those within maximum_lag_on_failover bytes of the primary's last flush — race to acquire the lock in the DCS. The winner wins an atomic compare-and-set on the DCS, promoting itself via pg_promote(). It then updates its own Patroni state to 'master' and the DCS entry with the new primary's connection info. The other standbys poll the DCS, see the new leader, and repoint their streaming replication connection to the new primary. Connection routing (VIP/HAProxy) detects the new primary via the Patroni REST API health endpoint. The old primary, if it comes back, finds the DCS lock held by another node, sees it is no longer leader, and starts as a standby — pg_rewind resyncs its data directory if needed.",
        uk: "Patroni запускається на кожному вузлі та опитує DCS (etcd/Consul) у циклі (loop_wait, дефолт 10 с). Primary безперервно оновлює leader lock з TTL (дефолт 30 с). При падінні primary оновлення lock зупиняється. Після TTL секунд lock закінчується. Справні standbys — ті, що відстають від primary не більше maximum_lag_on_failover байт — змагаються за захоплення lock у DCS. Переможець виграє атомарний compare-and-set у DCS, підвищуючи себе через pg_promote(). Потім оновлює власний стан Patroni до 'master' і запис у DCS з інформацією про нового primary. Інші standbys опитують DCS, бачать нового лідера і перенаправляють зʼєднання streaming replication на новий primary. Маршрутизація зʼєднань (VIP/HAProxy) визначає нового primary через REST API health endpoint Patroni. Старий primary при поверненні знаходить lock у DCS захопленим іншим вузлом, бачить, що він вже не лідер, і стартує як standby — pg_rewind при необхідності ресинхронізує директорію даних.",
      },
      level: 'senior',
    },
    {
      q: {
        en: "Explain PITR: what does 'recovery_target_time' actually do, and what are the prerequisites?",
        uk: "Поясніть PITR: що насправді робить 'recovery_target_time' і які передумови?",
      },
      a: {
        en: "PITR lets you restore the database to any point in time between a base backup and the current moment. Prerequisites: (1) a base backup (pg_basebackup or pgBackRest full backup), and (2) a continuous WAL archive — archive_mode=on and archive_command must have been running since the base backup was taken, storing every WAL segment durably. To perform PITR: restore the base backup to a data directory, set restore_command in postgresql.conf to fetch WAL segments from the archive, set recovery_target_time to the desired timestamp, create recovery.signal in the data directory (PG12+, replacing recovery.conf), and start PostgreSQL. It will apply WAL records from the archive one by one until it reaches the target timestamp, then pause (or promote if recovery_target_action=promote). On pause, you can inspect the data — if correct, promote via pg_ctl promote. The recovery replays every change from the base backup forward, so the further from the base backup, the longer the recovery takes.",
        uk: "PITR дозволяє відновити БД до будь-якої точки в часі між base backup та поточним моментом. Передумови: (1) base backup (pg_basebackup або повний backup pgBackRest), і (2) безперервний WAL archive — archive_mode=on та archive_command повинні були працювати з моменту base backup, надійно зберігаючи кожен WAL-сегмент. Для PITR: відновіть base backup у директорію даних, встановіть restore_command у postgresql.conf для отримання WAL-сегментів з архіву, встановіть recovery_target_time на потрібний timestamp, створіть recovery.signal у директорії даних (PG12+, замінює recovery.conf), запустіть PostgreSQL. Він застосовуватиме WAL-записи з архіву один за одним до досягнення target timestamp, потім зупиниться (або підвищиться якщо recovery_target_action=promote). При паузі можна перевірити дані — якщо правильно, підвищте через pg_ctl promote. Відновлення відтворює кожну зміну від base backup вперед, тому чим далі від base backup, тим триваліше відновлення.",
      },
      level: 'senior',
    },
    {
      q: {
        en: "A team says 'We have streaming replication, so we don't need backups.' What's wrong with this?",
        uk: "Команда каже: «У нас є streaming replication, тому backup-и непотрібні». Що не так?",
      },
      a: {
        en: "Streaming replication is a HA mechanism, not a backup. It copies every change from the primary — including accidental DELETEs, DROP TABLE, corrupted writes, and application bugs. If an engineer drops the wrong table, all standbys immediately replicate the DROP — there is no 'before the mistake' state anywhere in the replica set. Only a PITR backup (base backup + WAL archive) lets you recover to the moment before the mistake. Additionally, streaming replication requires the primary to be alive to stream from; if the primary's data files are corrupted (hardware failure, filesystem bug), the standbys may be corrupted too. A physical backup on separate storage (pgBackRest on S3, Barman on a backup server) is independent of the replication topology and provides recovery from data corruption, logical mistakes, and region-level disasters.",
        uk: "Streaming replication — це HA-механізм, а не backup. Він копіює кожну зміну з primary — включаючи випадкові DELETE, DROP TABLE, пошкоджені записи та баги застосунку. Якщо розробник дропає не ту таблицю, всі standbys негайно реплікують DROP — у наборі реплік ніде немає стану 'до помилки'. Лише PITR backup (base backup + WAL archive) дозволяє відновитися до моменту до помилки. Крім того, streaming replication вимагає, щоб primary був живим; якщо файли даних primary пошкоджені (апаратний збій, баг файлової системи), standbys також можуть бути пошкоджені. Physical backup на окремому сховищі (pgBackRest на S3, Barman на backup-сервері) незалежний від топології реплікації і забезпечує відновлення від пошкодження даних, логічних помилок та регіональних катастроф.",
      },
      level: 'senior',
    },
  ],

  seeAlso: [
    'm17-acid-wal',
    'm21-replication',
    'm23-cap',
    'm32-cloud-native',
  ],

  sources: [
    {
      title: 'Patroni v4.1.3 release (GitHub — patroni/patroni)',
      url: 'https://github.com/patroni/patroni/releases',
    },
    {
      title: 'Patroni configuration reference (readthedocs)',
      url: 'https://patroni.readthedocs.io/en/latest/SETTINGS.html',
    },
    {
      title: 'PostgreSQL 18 — pg_rewind documentation',
      url: 'https://www.postgresql.org/docs/18/app-pgrewind.html',
    },
    {
      title: 'PostgreSQL 18 — Continuous Archiving and PITR',
      url: 'https://www.postgresql.org/docs/18/continuous-archiving.html',
    },
    {
      title: 'pgBackRest v2.58.0 — pgbackrest.org',
      url: 'https://pgbackrest.org',
    },
    {
      title: 'Barman v3.18.0 release (GitHub — EnterpriseDB/barman)',
      url: 'https://github.com/EnterpriseDB/barman/releases/tag/release/3.18.0',
    },
    {
      title: 'Amazon Aurora PostgreSQL — High Availability',
      url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html',
    },
  ],
};
