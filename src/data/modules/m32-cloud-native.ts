// M32 · Cloud-native & the modern DBA [senior] — S16
// Web-verified 2026-06-26:
//   Managed Postgres: AWS RDS for PostgreSQL (minimal fork, closest to community) vs Aurora
//     (cloud-optimized distributed storage, AWS-only, AWS advertises up to 3× Postgres throughput);
//     GCP Cloud SQL (general-purpose) vs AlloyDB (columnar engine, HTAP, GCP-only); Azure Database
//     for PostgreSQL — Flexible Server (+ Elastic Clusters / Citus for distributed). Aurora DSQL & PG
//     latest covered in M30/§12 (PG 18.4 stable, 19 Beta 1).
//   K8s operators: CloudNativePG — accepted to CNCF Sandbox 2025-01-21; community-owned/vendor-
//     neutral; full-lifecycle HA via streaming replication; supports PG18; >7,700 GitHub stars
//     end-2025. Peers: Crunchy Data PGO, Zalando postgres-operator, StackGres, KubeDB.
//     Operator pattern = CRD + controller reconciliation loop (declared spec → actual state).
//   IaC: Terraform moved to BSL 1.1 (2023); IBM completed HashiCorp acquisition Feb 2025; each
//     version reverts to MPL 2.0 four years after release. OpenTofu = Linux-Foundation fork,
//     reached 1.9 early 2026 (~parity with Terraform 1.14). Ansible (Red Hat) = config management.
//   Observability: pg_stat_statements (cumulative per-query — must be in shared_preload_libraries),
//     pg_stat_activity (live sessions), pg_stat_io (per-backend I/O, since PG16); postgres_exporter
//     (port 9187) → Prometheus → Grafana; OpenTelemetry / Grafana Alloy as the 2026 collector.
import type { Module } from '../types';

const m32: Module = {
  id:        'm32-cloud-native',
  num:       32,
  section:   's7-modern',
  order:     4,
  level:     'senior',
  signature: false,
  readMins:  11,

  title:   { en: 'Cloud-native & the modern DBA', uk: 'Cloud-native і сучасний DBA' },
  tagline: {
    en: 'Managed DBs, Docker/K8s operators, IaC, observability, autoscaling.',
    uk: 'Керовані БД, Docker/K8s operators, IaC, observability, autoscaling.',
  },

  mentalModel: {
    en: 'The DBA moved up the stack — from tuning disks to wiring platforms.',
    uk: 'DBA піднявся стеком — від тюнінгу дисків до звʼязування платформ.',
  },

  topics: [
    // ── Topic 1: managed databases ────────────────────────────────────────
    {
      id:    'managed-databases',
      title: { en: 'Managed databases: what you give up & gain', uk: 'Керовані бази даних: що віддаєте і що отримуєте' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'A **managed database** (DBaaS) hands the undifferentiated operational work to a cloud provider: provisioning, OS and minor-version patching, automated backups and point-in-time recovery, high availability with automatic failover, and built-in monitoring. You stop being on call for a failed disk; you get to spend your time on the schema instead.\n\nThe options span a spectrum. **AWS RDS for PostgreSQL** runs near-vanilla Postgres (a minimal fork) — the most portable choice. **Aurora** is a cloud-optimized rebuild with a distributed storage layer (AWS advertises up to ~3× Postgres throughput) — but it runs only on AWS. **Google Cloud SQL** is general-purpose managed Postgres; **AlloyDB** adds a columnar engine for HTAP — GCP-only. **Azure Database for PostgreSQL** (Flexible Server) is the Azure equivalent, with Elastic Clusters (Citus) for distribution. **MongoDB Atlas** is the managed document equivalent.\n\nWhat you **give up** is real: superuser and OS/filesystem access, the freedom to install any extension or kernel tweak, control over *when* upgrades happen, and — with Aurora/AlloyDB — portability, since those proprietary engines cannot leave their cloud. Plus a cost premium and lock-in.',
            uk: '**Керована база даних** (DBaaS) передає недиференційовану операційну роботу хмарному провайдеру: provisioning, патчинг ОС та minor-версій, автоматичні backups та point-in-time recovery, high availability з автоматичним failover і вбудований monitoring. Ви перестаєте бути на чергуванні через зламаний диск; натомість витрачаєте час на схему.\n\nВаріанти охоплюють спектр. **AWS RDS for PostgreSQL** запускає майже-vanilla Postgres (мінімальний форк) — найпортабельніший вибір. **Aurora** — це cloud-оптимізоване переписування з розподіленим storage-шаром (AWS рекламує до ~3× throughput Postgres) — але працює лише на AWS. **Google Cloud SQL** — керований Postgres загального призначення; **AlloyDB** додає columnar engine для HTAP — лише GCP. **Azure Database for PostgreSQL** (Flexible Server) — еквівалент в Azure, з Elastic Clusters (Citus) для розподілу. **MongoDB Atlas** — керований document-еквівалент.\n\nТе, що ви **віддаєте**, реальне: superuser та доступ до ОС/файлової системи, свобода встановити будь-який extension чи kernel-налаштування, контроль над тим, *коли* відбуваються upgrades, і — з Aurora/AlloyDB — портабельність, бо ці пропрієтарні движки не можуть покинути свою хмару. Плюс премія до ціни та lock-in.',
          },
        },
        {
          kind: 'figure',
          fig: 'shared-responsibility',
          caption: {
            en: 'The shared-responsibility line: self-hosting, you own every layer; on a managed DB the provider takes the bottom of the stack — but schema, indexes, and queries stay yours.',
            uk: 'Лінія shared-responsibility: при self-hosting ви володієте кожним шаром; на керованій БД провайдер бере низ стеку — але schema, indexes та queries лишаються вашими.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Managed PostgreSQL options (2026)', uk: 'Варіанти керованого PostgreSQL (2026)' },
          head: [
            { en: 'Service', uk: 'Сервіс' },
            { en: 'What it is', uk: 'Що це' },
            { en: 'Watch out for', uk: 'На що зважати' },
          ],
          rows: [
            [
              { en: 'AWS RDS for PostgreSQL', uk: 'AWS RDS for PostgreSQL' },
              { en: 'Near-vanilla managed Postgres; most portable', uk: 'Майже-vanilla керований Postgres; найпортабельніший' },
              { en: 'Vertical scaling ceiling; some configs locked', uk: 'Стеля вертикального масштабування; частина configs закрита' },
            ],
            [
              { en: 'AWS Aurora (PG-compatible)', uk: 'AWS Aurora (PG-сумісний)' },
              { en: 'Distributed storage, fast failover, read scaling', uk: 'Розподілений storage, швидкий failover, масштабування читань' },
              { en: 'AWS-only; proprietary; cannot self-host', uk: 'Лише AWS; пропрієтарний; не можна self-host' },
            ],
            [
              { en: 'GCP Cloud SQL / AlloyDB', uk: 'GCP Cloud SQL / AlloyDB' },
              { en: 'General-purpose / columnar HTAP engine', uk: 'Загального призначення / columnar HTAP engine' },
              { en: 'AlloyDB is GCP-only; lock-in', uk: 'AlloyDB лише GCP; lock-in' },
            ],
            [
              { en: 'Azure DB for PostgreSQL', uk: 'Azure DB for PostgreSQL' },
              { en: 'Flexible Server; Elastic Clusters (Citus)', uk: 'Flexible Server; Elastic Clusters (Citus)' },
              { en: 'Tightest fit if already on Azure', uk: 'Найкраще підходить, якщо ви вже в Azure' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Managed moves the responsibility line up — not to the top', uk: 'Managed піднімає лінію відповідальності вгору — але не до самого верху' },
          md: {
            en: 'A DBaaS owns the infrastructure: hardware, OS, patching, backups, failover. It does **not** own your data model. Your schema, your indexes, your queries, your connection pooling, and your autovacuum settings are still yours — and they cause most real incidents. Managed makes the box reliable; it does not make a missing index appear.',
            uk: 'DBaaS володіє інфраструктурою: hardware, ОС, патчинг, backups, failover. Він **не** володіє вашою моделлю даних. Ваша schema, ваші indexes, ваші queries, ваш connection pooling та налаштування autovacuum — все ще ваші, і саме вони спричиняють більшість реальних інцидентів. Managed робить машину надійною; він не змусить відсутній index зʼявитися.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Cost and lock-in are the price of convenience', uk: 'Вартість і lock-in — ціна зручності' },
          md: {
            en: 'Managed databases carry a meaningful premium over the raw compute + storage, and the convenience deepens lock-in. RDS-for-Postgres stays close to community Postgres and migrates out relatively cleanly. Aurora and AlloyDB are proprietary engines that **cannot run outside their cloud** — adopting them is a strategic bet on that provider, not just a deployment choice. Weigh portability before the architecture hardens around a cloud-specific engine.',
            uk: 'Керовані бази даних несуть відчутну премію понад сирий compute + storage, а зручність поглиблює lock-in. RDS-for-Postgres лишається близьким до community Postgres і мігрує назовні відносно чисто. Aurora та AlloyDB — пропрієтарні движки, що **не можуть працювати поза своєю хмарою** — їхнє прийняття є стратегічною ставкою на провайдера, а не просто вибором розгортання. Зважте портабельність, перш ніж архітектура застигне навколо cloud-специфічного движка.',
          },
        },
      ],
    },

    // ── Topic 2: containers & Kubernetes operators ────────────────────────
    {
      id:    'containers-operators',
      title: { en: 'Containers & Kubernetes operators', uk: 'Контейнери та Kubernetes operators' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Postgres in a container is easy to *start* and hard to *run*. A container is ephemeral; a database is the opposite — its whole value is durable state. So a containerized Postgres needs a persistent volume mounted underneath it, and on **Kubernetes** that means a `StatefulSet` with `PersistentVolumeClaims`. But a bare StatefulSet only gives you pods and disks. It has no idea how to elect and promote a new primary when one dies, take continuous backups, or roll a minor-version upgrade without losing data.\n\nThat gap is what the **operator pattern** fills. You define a **Custom Resource Definition (CRD)** — a new Kubernetes object like `Cluster` — and declare intent: "3 instances, PostgreSQL 18, 100 GiB, back up to S3." A **controller** then runs a **reconciliation loop**: it continuously compares the declared spec against actual state and acts to converge them. In effect, the operator encodes a DBA\'s runbook — provisioning, failover, backups, rolling upgrades — as software. **CloudNativePG** (accepted to the CNCF Sandbox in January 2025, community-governed and vendor-neutral) is the leading vanilla-Kubernetes choice; **Crunchy Data PGO**, **Zalando**, **StackGres**, and **KubeDB** are alternatives.',
            uk: 'Postgres у контейнері легко *запустити* і важко *експлуатувати*. Контейнер ефемерний; база даних — протилежне, бо вся її цінність — у довговічному стані. Тож контейнеризований Postgres потребує persistent volume, змонтований під ним, а на **Kubernetes** це означає `StatefulSet` з `PersistentVolumeClaims`. Але голий StatefulSet дає лише pods і диски. Він не має уявлення, як обрати й підвищити новий primary, коли один помирає, робити continuous backups чи прокотити minor-версію upgrade без втрати даних.\n\nЦю прогалину заповнює **operator pattern**. Ви визначаєте **Custom Resource Definition (CRD)** — новий Kubernetes-обʼєкт на кшталт `Cluster` — і декларуєте намір: «3 instances, PostgreSQL 18, 100 GiB, backup до S3». Потім **controller** запускає **reconciliation loop**: він безперервно порівнює задекларований spec з фактичним станом і діє, щоб їх звести. По суті, operator кодує runbook DBA — provisioning, failover, backups, rolling upgrades — як програму. **CloudNativePG** (прийнятий до CNCF Sandbox у січні 2025, community-governed та vendor-neutral) — провідний вибір для vanilla-Kubernetes; **Crunchy Data PGO**, **Zalando**, **StackGres** та **KubeDB** — альтернативи.',
          },
        },
        {
          kind: 'code',
          lang: 'yaml',
          code: `# CloudNativePG: declare a 3-node HA Postgres cluster; the operator does the rest
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
spec:
  instances: 3                     # 1 primary + 2 streaming replicas
  imageName: ghcr.io/cloudnative-pg/postgresql:18.4
  storage:
    size: 100Gi
  backup:
    barmanObjectStore:             # continuous backup to object storage
      destinationPath: s3://my-backups/app-db
# The controller reconciles toward this spec: provisions, monitors, fails over,
# backs up, and performs rolling minor-version upgrades — no manual runbook.`,
          note: {
            en: 'One declarative manifest replaces a stack of manual procedures; the reconciliation loop keeps the cluster matching the spec even as nodes fail.',
            uk: 'Один декларативний маніфест замінює стос ручних процедур; reconciliation loop тримає кластер відповідним до spec навіть коли вузли падають.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'Managed DBaaS (RDS / Cloud SQL)', uk: 'Керований DBaaS (RDS / Cloud SQL)' },
          b: { en: 'Self-hosted on K8s (operator)', uk: 'Self-hosted на K8s (operator)' },
          rows: [
            [
              { en: 'Who runs failover/backups', uk: 'Хто керує failover/backups' },
              { en: 'The cloud provider', uk: 'Хмарний провайдер' },
              { en: 'The operator (your cluster)', uk: 'Operator (ваш кластер)' },
            ],
            [
              { en: 'Control & extensions', uk: 'Контроль та extensions' },
              { en: 'Limited to what the provider allows', uk: 'Обмежено тим, що дозволяє провайдер' },
              { en: 'Full — any extension, any config', uk: 'Повний — будь-який extension, будь-який config' },
            ],
            [
              { en: 'Portability', uk: 'Портабельність' },
              { en: 'Cloud-specific (esp. Aurora/AlloyDB)', uk: 'Cloud-специфічна (особл. Aurora/AlloyDB)' },
              { en: 'Runs on any Kubernetes / cloud', uk: 'Працює на будь-якому Kubernetes / cloud' },
            ],
            [
              { en: 'Operational burden', uk: 'Операційне навантаження' },
              { en: 'Lowest — provider owns ops', uk: 'Найнижче — провайдер володіє ops' },
              { en: 'Yours, but automated by the operator', uk: 'Ваше, але автоматизоване operator' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Do not hand-roll stateful Postgres on Kubernetes', uk: 'Не пишіть власноруч stateful Postgres на Kubernetes' },
          md: {
            en: 'A raw StatefulSet gives you pods and volumes — and none of the hard parts. Automatic failover, continuous backups + PITR, safe primary promotion, and rolling minor-version upgrades are exactly what is difficult about running a database, and exactly what an operator already implements and battle-tests. Rolling your own from manifests reinvents that work, usually with subtle data-loss bugs. Pick an operator.',
            uk: 'Голий StatefulSet дає вам pods і volumes — і жодної зі складних частин. Автоматичний failover, continuous backups + PITR, безпечне підвищення primary та rolling minor-версія upgrades — це саме те, що складно в експлуатації бази даних, і саме те, що operator вже реалізує й обкатує в бою. Власна реалізація з маніфестів винаходить цю роботу заново, зазвичай із тонкими багами втрати даних. Оберіть operator.',
          },
        },
      ],
    },

    // ── Topic 3: infrastructure as code ───────────────────────────────────
    {
      id:    'iac',
      title: { en: 'Infrastructure as code', uk: 'Infrastructure as code' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'Clicking through a cloud console to create a database is fast once and a disaster forever: it is unrepeatable, unreviewable, and undocumented. **Infrastructure as code (IaC)** replaces it with declarative, version-controlled definitions you apply reproducibly.\n\n**Terraform** is the dominant provisioning tool: you declare the desired resources (the DB instance, network, parameter groups), it diffs that against tracked **state** and shows a `plan`, then `apply` makes reality match. Note the licensing story — HashiCorp moved Terraform to the **BSL 1.1** license in 2023 and was acquired by IBM (closed February 2025); each version reverts to MPL after four years. The **OpenTofu** fork, governed by the Linux Foundation, is the open alternative and reached 1.9 in early 2026 with near-parity to Terraform.\n\n**Ansible** (Red Hat) is the complement: where Terraform *provisions* infrastructure, Ansible *configures* what runs on it — installing Postgres on a VM, applying `postgresql.conf`, setting up replication. The discipline that makes both safe is **idempotency** (re-applying changes nothing if already correct) and watching for **drift** (reality diverging from code via manual edits).',
            uk: 'Клацання через хмарну консоль для створення бази даних — швидко один раз і катастрофа назавжди: воно неповторюване, без можливості review та недокументоване. **Infrastructure as code (IaC)** замінює його декларативними, version-controlled визначеннями, які ви застосовуєте відтворювано.\n\n**Terraform** — домінантний інструмент provisioning: ви декларуєте бажані ресурси (DB instance, network, parameter groups), він порівнює це з відстежуваним **state** і показує `plan`, потім `apply` робить реальність відповідною. Зверніть увагу на історію ліцензування — HashiCorp перевів Terraform на ліцензію **BSL 1.1** у 2023 і був придбаний IBM (угода закрита у лютому 2025); кожна версія повертається до MPL через чотири роки. Форк **OpenTofu**, керований Linux Foundation, — це відкрита альтернатива, що досягла 1.9 на початку 2026 з майже-паритетом до Terraform.\n\n**Ansible** (Red Hat) — це доповнення: там, де Terraform *provisions* інфраструктуру, Ansible *конфігурує* те, що на ній працює — встановлює Postgres на VM, застосовує `postgresql.conf`, налаштовує replication. Дисципліна, що робить обидва безпечними — це **idempotency** (повторне застосування нічого не змінює, якщо вже правильно) та спостереження за **drift** (реальність розходиться з кодом через ручні правки).',
          },
        },
        {
          kind: 'code',
          lang: 'hcl',
          code: `# Terraform: declare a managed Postgres instance as version-controlled code
resource "aws_db_instance" "app" {
  identifier              = "app-prod"
  engine                  = "postgres"
  engine_version          = "18.4"
  instance_class          = "db.r6g.large"
  allocated_storage       = 100
  multi_az                = true   # automatic failover to a standby
  storage_encrypted       = true
  backup_retention_period = 14     # days of automated backups / PITR

  # password is generated + stored in Secrets Manager, never in code
  manage_master_user_password = true
}`,
          note: {
            en: 'terraform plan shows the diff before anything changes; terraform apply converges reality to the spec. The same file in git is the audit trail.',
            uk: 'terraform plan показує diff перед будь-якими змінами; terraform apply зводить реальність до spec. Той самий файл у git — це audit trail.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'State and secrets: the two ways IaC leaks credentials', uk: 'State та secrets: два способи, якими IaC зливає облікові дані' },
          md: {
            en: 'Terraform **state** often contains the DB password and connection details in plaintext. Committing state to git, or leaving it on a laptop, leaks production credentials. Use a remote encrypted backend with state locking, keep secrets in a manager (AWS Secrets Manager, Vault) and reference them, and never hardcode passwords in `.tf` files or bake them into container images. Treat the state file as a secret in its own right.',
            uk: 'Terraform **state** часто містить пароль БД та деталі підключення у відкритому вигляді. Commit state у git або залишення його на ноутбуці зливає production-облікові дані. Використовуйте remote encrypted backend із state locking, тримайте secrets у менеджері (AWS Secrets Manager, Vault) і посилайтесь на них, і ніколи не хардкодьте паролі у `.tf`-файлах та не запікайте їх у container images. Ставтесь до state-файлу як до секрету сам по собі.',
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Terraform provisions, Ansible configures — and OpenTofu is the open fork', uk: 'Terraform provisions, Ansible конфігурує — а OpenTofu — це відкритий форк' },
          md: {
            en: 'Use the right tool for each job: Terraform/OpenTofu to *create* cloud resources (declarative, state-tracked), Ansible to *configure* software on them (task-oriented). They compose well — provision with one, configure with the other. If the BSL license is a concern for your organization, OpenTofu is a near-drop-in, Linux-Foundation-governed replacement for the Terraform CLI.',
            uk: 'Використовуйте правильний інструмент для кожної задачі: Terraform/OpenTofu, щоб *створювати* хмарні ресурси (декларативно, з відстеженням state), Ansible, щоб *конфігурувати* софт на них (task-oriented). Вони добре поєднуються — provision одним, configure іншим. Якщо ліцензія BSL — занепокоєння для вашої організації, OpenTofu — це майже-drop-in заміна Terraform CLI під керуванням Linux Foundation.',
          },
        },
      ],
    },

    // ── Topic 4: observability & the modern DBA's dashboard ───────────────
    {
      id:    'observability',
      title: { en: 'Observability & the modern DBA dashboard', uk: 'Observability та дашборд сучасного DBA' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'The modern DBA spends less time tuning disks and more time wiring platforms and reading dashboards — because the cloud and operators have automated the bottom of the stack. The job shifts to **observability**: metrics, logs, and traces that tell you what the fleet is doing.\n\nPostgres exposes its internals through statistics views. **`pg_stat_statements`** is the single most valuable — it tracks cumulative execution stats per normalized query (calls, total and mean time, rows, buffer hits); it must be loaded via `shared_preload_libraries`. **`pg_stat_activity`** shows live sessions and what each is waiting on (the first stop for "the database is slow right now"). **`pg_stat_io`** (since PostgreSQL 16) breaks down I/O by backend type. `pg_stat_user_tables` / `pg_stat_user_indexes` reveal sequential vs index scans, dead tuples, and unused indexes worth dropping.\n\nThe standard dashboard stack scrapes these into time-series: **postgres_exporter** (port 9187) exposes them as Prometheus metrics, **Prometheus** stores and alerts, **Grafana** visualizes. OpenTelemetry (via Grafana Alloy, the 2026 collector) carries traces. Watch the four golden signals adapted to a database: latency, traffic (TPS/QPS), errors (deadlocks, failed txns), and saturation (connections vs `max_connections`, cache-hit ratio, replication lag, autovacuum backlog).',
            uk: 'Сучасний DBA витрачає менше часу на тюнінг дисків і більше — на звʼязування платформ та читання дашбордів, бо хмара й operators автоматизували низ стеку. Робота зміщується до **observability**: metrics, logs та traces, що кажуть, що робить флот.\n\nPostgres відкриває свої нутрощі через statistics views. **`pg_stat_statements`** — найцінніший — він відстежує кумулятивну статистику виконання на нормалізований запит (calls, total та mean time, rows, buffer hits); його треба завантажити через `shared_preload_libraries`. **`pg_stat_activity`** показує живі сесії і на що кожна чекає (перша зупинка для «база зараз гальмує»). **`pg_stat_io`** (з PostgreSQL 16) розбиває I/O за типом backend. `pg_stat_user_tables` / `pg_stat_user_indexes` показують sequential проти index scans, dead tuples та невикористані indexes, які варто видалити.\n\nСтандартний стек дашборда збирає це у time-series: **postgres_exporter** (порт 9187) віддає їх як Prometheus metrics, **Prometheus** зберігає та алертить, **Grafana** візуалізує. OpenTelemetry (через Grafana Alloy, collector 2026) несе traces. Слідкуйте за чотирма golden signals, адаптованими до бази: latency, traffic (TPS/QPS), errors (deadlocks, невдалі txns) та saturation (connections проти `max_connections`, cache-hit ratio, replication lag, autovacuum backlog).',
          },
        },
        {
          kind: 'table',
          caption: { en: 'The PostgreSQL statistics views a DBA lives in', uk: 'Statistics views PostgreSQL, в яких живе DBA' },
          head: [
            { en: 'View / extension', uk: 'View / extension' },
            { en: 'Shows', uk: 'Показує' },
            { en: 'Answers', uk: 'Відповідає на' },
          ],
          rows: [
            [
              { en: 'pg_stat_statements', uk: 'pg_stat_statements' },
              { en: 'Cumulative stats per normalized query', uk: 'Кумулятивна статистика на нормалізований запит' },
              { en: 'Which queries cost the most overall?', uk: 'Які запити коштують найбільше загалом?' },
            ],
            [
              { en: 'pg_stat_activity', uk: 'pg_stat_activity' },
              { en: 'Live sessions, state, wait events', uk: 'Живі сесії, стан, wait events' },
              { en: 'What is running / blocking right now?', uk: 'Що виконується / блокує прямо зараз?' },
            ],
            [
              { en: 'pg_stat_io (PG16+)', uk: 'pg_stat_io (PG16+)' },
              { en: 'I/O by backend type and context', uk: 'I/O за типом backend та контекстом' },
              { en: 'Where is the I/O actually going?', uk: 'Куди насправді йде I/O?' },
            ],
            [
              { en: 'pg_stat_user_tables / _indexes', uk: 'pg_stat_user_tables / _indexes' },
              { en: 'Seq vs index scans, dead tuples, index use', uk: 'Seq проти index scans, dead tuples, вжиток index' },
              { en: 'Missing index? Bloat? Unused index?', uk: 'Відсутній index? Bloat? Невикористаний index?' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'pg_stat_statements is the highest-value switch to flip', uk: 'pg_stat_statements — найцінніший перемикач, який варто увімкнути' },
          md: {
            en: 'Enable it (add to `shared_preload_libraries`, `CREATE EXTENSION`) before you need it. Then sort by **total** execution time, not the single slowest call: a query that takes 5 ms but runs a million times an hour costs far more than a 2-second report run once. The top of that list is where tuning effort actually pays off — `EXPLAIN (ANALYZE, BUFFERS)` those queries next (M16).',
            uk: 'Увімкніть його (додайте до `shared_preload_libraries`, `CREATE EXTENSION`) до того, як він знадобиться. Потім сортуйте за **сумарним** часом виконання, а не за одним найповільнішим викликом: запит на 5 мс, що виконується мільйон разів на годину, коштує значно більше за 2-секундний звіт раз на день. Верх цього списку — там, де зусилля з тюнінгу справді окупаються — далі зробіть `EXPLAIN (ANALYZE, BUFFERS)` цих запитів (M16).',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The DBA moved up the stack', uk: 'DBA піднявся стеком' },
          md: {
            en: 'Twenty years ago the database administrator tuned disk layout, buffer pools, and kernel parameters. Today the cloud and operators automate that, and the high-leverage work has moved up: choosing the right engine, designing the schema and indexes, writing IaC, building observability, setting autoscaling and capacity policy, and controlling cost. The title may still be "DBA", but the job is closer to platform engineering — own the platform, not the spindle.',
            uk: 'Двадцять років тому database administrator тюнив розкладку диска, buffer pools та параметри ядра. Сьогодні хмара й operators це автоматизують, а високоважельна робота піднялася вище: вибір правильного движка, дизайн схеми та indexes, написання IaC, побудова observability, налаштування autoscaling та політики ємності, контроль вартості. Назва може й досі бути «DBA», але робота ближча до platform engineering — володійте платформою, а не шпинделем.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'A managed database takes over backups, patching, HA/failover, and monitoring — you gain reliability and time but give up superuser/OS access, some extensions/configs, and pay a premium + lock-in. RDS-for-Postgres stays closest to vanilla; Aurora/AlloyDB are proprietary and cloud-bound.',
      uk: 'Керована база даних бере на себе backups, патчинг, HA/failover та monitoring — ви отримуєте надійність і час, але віддаєте superuser/доступ до ОС, частину extensions/configs і платите премію + lock-in. RDS-for-Postgres найближчий до vanilla; Aurora/AlloyDB пропрієтарні та привʼязані до хмари.',
    },
    {
      en: 'The shared-responsibility line moves up with managed services but never to the top: you still own schema, indexes, queries, and query plans — the things that cause most incidents.',
      uk: 'Лінія shared-responsibility піднімається з керованими сервісами, але ніколи до самого верху: ви все ще володієте schema, indexes, queries та query plans — тим, що спричиняє більшість інцидентів.',
    },
    {
      en: 'Self-hosting Postgres on Kubernetes means an operator, not a raw StatefulSet: a CRD + a reconciliation-loop controller encode DBA operations (provisioning, failover, backups, rolling upgrades) as code. CloudNativePG is the vendor-neutral CNCF option.',
      uk: 'Self-hosting Postgres на Kubernetes означає operator, а не голий StatefulSet: CRD + controller із reconciliation loop кодують операції DBA (provisioning, failover, backups, rolling upgrades) як код. CloudNativePG — vendor-neutral CNCF-варіант.',
    },
    {
      en: 'IaC (Terraform/OpenTofu to provision, Ansible to configure) makes clusters reproducible and reviewable; keep state encrypted and secrets out of code. Terraform is BSL since 2023 (IBM-owned); OpenTofu is the Linux-Foundation open fork.',
      uk: 'IaC (Terraform/OpenTofu для provision, Ansible для configure) робить кластери відтворюваними та придатними для review; тримайте state зашифрованим, а secrets — поза кодом. Terraform під BSL з 2023 (належить IBM); OpenTofu — відкритий форк Linux Foundation.',
    },
    {
      en: 'The modern DBA shifted from manual tuning to observability. pg_stat_statements + pg_stat_activity + pg_stat_io feeding postgres_exporter → Prometheus → Grafana is the standard dashboard; pg_stat_statements is the highest-value switch to enable.',
      uk: 'Сучасний DBA перейшов від ручного тюнінгу до observability. pg_stat_statements + pg_stat_activity + pg_stat_io, що живлять postgres_exporter → Prometheus → Grafana, — це стандартний дашборд; pg_stat_statements — найцінніший перемикач для увімкнення.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Assuming "managed" means "hands-off"', uk: 'Припущення, що «managed» означає «без рук»' },
      body: {
        en: 'A DBaaS manages the infrastructure, not your data model. It will faithfully run your N+1 queries, missing indexes, and bloated tables — then bill you for the oversized instance you bought to paper over them. You still own schema design, indexing, query tuning, connection pooling, and autovacuum configuration. Managed removes ops toil; it does not remove the need to understand your database.',
        uk: 'DBaaS керує інфраструктурою, а не вашою моделлю даних. Він сумлінно виконає ваші N+1 queries, відсутні indexes та роздуті таблиці — а потім виставить рахунок за завеликий instance, який ви купили, щоб це прикрити. Ви все ще володієте дизайном schema, indexing, тюнінгом queries, connection pooling та конфігурацією autovacuum. Managed прибирає операційну рутину; він не прибирає потреби розуміти вашу базу даних.',
      },
    },
    {
      title: { en: 'Hand-rolling stateful Postgres on Kubernetes', uk: 'Власноручний stateful Postgres на Kubernetes' },
      body: {
        en: 'A bare StatefulSet gives you pods and volumes but no failover, no continuous backups, no safe primary promotion, and no rolling minor-version upgrade. The hard parts of running a database are exactly what an operator automates and battle-tests. Reaching for raw manifests reinvents — usually with subtle data-loss bugs — what CloudNativePG, PGO, or Zalando already solved.',
        uk: 'Голий StatefulSet дає pods і volumes, але без failover, без continuous backups, без безпечного підвищення primary та без rolling minor-версія upgrade. Складні частини експлуатації бази даних — це саме те, що operator автоматизує й обкатує в бою. Тяга до голих маніфестів винаходить заново — зазвичай із тонкими багами втрати даних — те, що CloudNativePG, PGO чи Zalando вже вирішили.',
      },
    },
    {
      title: { en: 'Leaking credentials through Terraform state', uk: 'Злив облікових даних через Terraform state' },
      body: {
        en: 'Terraform state frequently contains the DB password and connection string in plaintext. Committing it to git or storing it on a developer laptop leaks production credentials to anyone with repo access. Always use a remote, encrypted backend with locking; reference secrets from a manager rather than embedding them; and never hardcode passwords in `.tf` files or container images. The state file is itself a secret.',
        uk: 'Terraform state часто містить пароль БД та connection string у відкритому вигляді. Commit його у git або зберігання на ноутбуці розробника зливає production-облікові дані будь-кому з доступом до репозиторію. Завжди використовуйте remote, encrypted backend із locking; посилайтесь на secrets з менеджера, а не вбудовуйте їх; і ніколи не хардкодьте паролі у `.tf`-файлах чи container images. State-файл сам по собі є секретом.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'What do you gain and give up moving from self-hosted Postgres to a managed service like RDS or Aurora?', uk: 'Що ви отримуєте і що віддаєте, переходячи від self-hosted Postgres до керованого сервісу на кшталт RDS чи Aurora?' },
      a: {
        en: 'You gain operational automation: backups + point-in-time recovery, OS and minor-version patching, high availability with automatic failover, monitoring, and far less on-call burden. You give up superuser and OS/filesystem access, the freedom to install arbitrary extensions or kernel/config tweaks, and control over upgrade timing — and you run on the provider\'s fork. Cost carries a premium, and Aurora/AlloyDB add lock-in because they are proprietary engines that cannot run outside their cloud (RDS-for-Postgres stays close to vanilla and migrates out relatively cleanly). The key reminder: the responsibility line moves up but not to the top — schema, indexes, queries, pooling, and vacuum are still yours, and they cause most incidents.',
        uk: 'Ви отримуєте операційну автоматизацію: backups + point-in-time recovery, патчинг ОС та minor-версій, high availability з автоматичним failover, monitoring і значно менше навантаження on-call. Ви віддаєте superuser та доступ до ОС/файлової системи, свободу встановлювати довільні extensions чи kernel/config-налаштування та контроль над часом upgrades — і працюєте на форку провайдера. Вартість несе премію, а Aurora/AlloyDB додають lock-in, бо це пропрієтарні движки, що не можуть працювати поза своєю хмарою (RDS-for-Postgres лишається близьким до vanilla і мігрує назовні відносно чисто). Ключове нагадування: лінія відповідальності піднімається, але не до самого верху — schema, indexes, queries, pooling та vacuum усе ще ваші, і саме вони спричиняють більшість інцидентів.',
      },
    },
    {
      level: 'senior',
      q: { en: 'What is the Kubernetes operator pattern, and why does a database need one?', uk: 'Що таке Kubernetes operator pattern, і чому база даних його потребує?' },
      a: {
        en: 'An operator is a Custom Resource Definition (a domain object like `Cluster`) plus a controller running a reconciliation loop that continuously compares the declared spec against actual state and acts to converge them — encoding operational knowledge as software. A database needs one because its hard parts are stateful and order-sensitive: provisioning replicas, electing and promoting a new primary on failure, continuous backups with PITR, and rolling minor-version upgrades without data loss. A generic StatefulSet manages pods and volumes but has no idea how to perform those database-specific procedures safely. CloudNativePG, Crunchy PGO, and Zalando bake a DBA\'s runbook into the controller so the cluster self-heals toward the declared intent.',
        uk: 'Operator — це Custom Resource Definition (доменний обʼєкт на кшталт `Cluster`) плюс controller, що запускає reconciliation loop, який безперервно порівнює задекларований spec із фактичним станом і діє, щоб їх звести — кодуючи операційні знання як програму. База даних його потребує, бо її складні частини stateful та чутливі до порядку: provisioning replicas, обрання й підвищення нового primary при збої, continuous backups з PITR та rolling minor-версія upgrades без втрати даних. Загальний StatefulSet керує pods і volumes, але не має уявлення, як безпечно виконати ці специфічні для бази процедури. CloudNativePG, Crunchy PGO та Zalando запікають runbook DBA у controller, тож кластер самовідновлюється до задекларованого наміру.',
      },
    },
    {
      level: 'staff',
      q: { en: 'How would you design observability for a fleet of Postgres databases — what do you measure, and how do you find the problem query?', uk: 'Як би ви спроєктували observability для флоту баз даних Postgres — що вимірюєте і як знаходите проблемний запит?' },
      a: {
        en: 'Measure the database-adapted golden signals: latency (statement time), traffic (TPS/QPS, rows), errors (failed transactions, deadlocks, replication errors), and saturation (connections vs max_connections, cache-hit ratio, replication lag, disk, autovacuum backlog and transaction-id age). Collect with postgres_exporter → Prometheus → Grafana plus alerting, ship slow-query and auto_explain logs centrally, and use OpenTelemetry / Grafana Alloy for traces. To find the problem query, enable pg_stat_statements and sort by total execution time — not the single slowest call, because a 5 ms query run a million times dominates a 2-second report run once. Then EXPLAIN (ANALYZE, BUFFERS) the top offenders to see the plan and I/O (M16). For "slow right now", pg_stat_activity shows what is running and what is blocking; pg_stat_user_tables/_indexes surfaces missing indexes (seq scans), bloat (dead tuples), and unused indexes to drop.',
        uk: 'Вимірюйте golden signals, адаптовані до бази: latency (час statement), traffic (TPS/QPS, rows), errors (невдалі транзакції, deadlocks, replication errors) та saturation (connections проти max_connections, cache-hit ratio, replication lag, диск, autovacuum backlog та вік transaction-id). Збирайте через postgres_exporter → Prometheus → Grafana плюс alerting, надсилайте slow-query та auto_explain логи централізовано і використовуйте OpenTelemetry / Grafana Alloy для traces. Щоб знайти проблемний запит, увімкніть pg_stat_statements і сортуйте за сумарним часом виконання — а не за одним найповільнішим викликом, бо запит на 5 мс, що виконується мільйон разів, домінує над 2-секундним звітом раз на день. Потім зробіть EXPLAIN (ANALYZE, BUFFERS) головних винуватців, щоб побачити план та I/O (M16). Для «гальмує зараз» pg_stat_activity показує, що виконується і що блокує; pg_stat_user_tables/_indexes виявляє відсутні indexes (seq scans), bloat (dead tuples) та невикористані indexes для видалення.',
      },
    },
  ],

  seeAlso: ['m24-ha-backups-dr', 'm30-distributed-sql', 'm31-analytics', 'm34-performance'],

  sources: [
    { title: 'AWS — Amazon RDS for PostgreSQL (User Guide)', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html' },
    { title: 'Google Cloud — AlloyDB for PostgreSQL (overview)', url: 'https://cloud.google.com/alloydb/docs' },
    { title: 'CloudNativePG — PostgreSQL Operator for Kubernetes', url: 'https://cloudnative-pg.io/' },
    { title: 'CNCF — CloudNativePG joins the Sandbox (Jan 2025)', url: 'https://www.cncf.io/projects/cloudnativepg/' },
    { title: 'OpenTofu — the open-source, Linux-Foundation Terraform fork', url: 'https://opentofu.org/' },
    { title: 'PostgreSQL docs — pg_stat_statements & monitoring stats', url: 'https://www.postgresql.org/docs/current/pgstatstatements.html' },
    { title: 'prometheus-community/postgres_exporter (GitHub)', url: 'https://github.com/prometheus-community/postgres_exporter' },
  ],
};

export default m32;
