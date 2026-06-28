// M33 · Security & data protection [senior] — S17
// Web-verified 2026-06-26:
//   AuthN: pg_hba.conf maps (type, db, user, address) → method. scram-sha-256 is the default
//     password_encryption for new clusters since PG14; md5 is deprecated and PG18 emits a WARNING
//     when a md5 password is set (CREATE/ALTER ROLE ... PASSWORD). Never use `trust` in production.
//   AuthZ: roles (LOGIN = user / group), GRANT/REVOKE on objects → RBAC via group roles.
//     Predefined roles pg_read_all_data / pg_write_all_data / pg_monitor / pg_database_owner since
//     PG14 (pg_read_all_data does NOT bypass RLS). PG15 removed the default CREATE on public schema.
//   RLS (since PG9.5): ALTER TABLE ... ENABLE ROW LEVEL SECURITY + CREATE POLICY (USING = visible
//     rows; WITH CHECK = writable rows). Owner & superuser & BYPASSRLS bypass by default → use
//     ALTER TABLE ... FORCE ROW LEVEL SECURITY and never connect the app as the table owner.
//     Policies default PERMISSIVE (OR-combined); RESTRICTIVE policies AND-combine.
//   Encryption: in transit = TLS (client sslmode=verify-full defeats MITM). At rest = NOT in core
//     Postgres (no built-in TDE; EDB/Cybertec/cloud storage-layer provide it) → filesystem crypto
//     (LUKS/dm-crypt/BitLocker) + pgcrypto for column-level (pgp_sym_encrypt; NOT transparent — app
//     manages keys). PG18 docs §18.8 "Encryption Options". Backups & replicas need equal protection.
//   App password hashing (OWASP Password Storage Cheat Sheet 2026): Argon2id first choice (≥19 MiB,
//     t=2, p=1 floor; ~64 MiB t=3 for interactive logins ≈100 ms), bcrypt (work factor ≥12 in 2026,
//     72-byte limit), scrypt, PBKDF2 only for FIPS (310k HMAC-SHA-256). NEVER fast hashes
//     (MD5/SHA-256 raw) — GPUs guess billions/sec. Unique random salt per hash (built into output).
//   SQL injection (OWASP Injection): untrusted input concatenated into SQL is parsed as code →
//     parameterized queries / prepared statements ($1,$2) send SQL and data on separate channels.
//     CVE-2025-1094 (Feb 2025): libpq escaping APIs (PQescapeLiteral/Identifier/String/StringConn)
//     bypassable via invalid encoding (BIG5) → psql injection → RCE; fixed 17.3/16.7/15.11/14.16/
//     13.19. Lesson: parameter binding, not hand-escaping, is the durable defense. PG stable 18.4.
import type { Module } from '../types';

const m33: Module = {
  id:        'm33-security',
  num:       33,
  section:   's8-mastery',
  order:     1,
  level:     'senior',
  signature: true, // light interactive: the SQL-injection demo (sql-injection sim)
  readMins:  14,

  title:   { en: 'Security & data protection', uk: 'Безпека та захист даних' },
  tagline: {
    en: 'AuthN/Z, RBAC/RLS, encryption at rest/in transit, hashing, SQL injection, least privilege.',
    uk: 'AuthN/Z, RBAC/RLS, шифрування at rest/in transit, hashing, SQL injection, least privilege.',
  },

  mentalModel: {
    en: 'Treat every input as hostile and grant the least privilege that works.',
    uk: 'Вважайте кожен вхід ворожим і давайте найменші привілеї, що працюють.',
  },

  topics: [
    // ── Topic 1: authentication & authorization ───────────────────────────
    {
      id:    'authn-authz',
      title: { en: 'Authentication, authorization & least privilege', uk: 'Автентифікація, авторизація та least privilege' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Security is layered, and the first two layers answer different questions. **Authentication (authN)** proves *who* you are; **authorization (authZ)** decides *what* you may do. PostgreSQL configures authentication in **`pg_hba.conf`** — ordered host-based rules matching (connection type, database, user, client address) to a **method**. Use **`scram-sha-256`**, the default `password_encryption` for new clusters since PostgreSQL 14; **`md5` is deprecated** and PostgreSQL 18 emits a warning when you set a md5 password. Never use the `trust` method (no password at all) on anything but a local throwaway.\n\nAuthorization is built on **roles**. A role can `LOGIN` (then it is effectively a user) or simply group other roles (a group). Privileges are `GRANT`ed on objects — databases, schemas, tables, even individual columns — and `REVOKE`d. **RBAC** falls out naturally: grant privileges to a group role once, then grant membership to that group. PostgreSQL 14 added **predefined roles** (`pg_read_all_data`, `pg_write_all_data`, `pg_monitor`) for common bundles.\n\nThe principle that ties it together is **least privilege**: the application should connect as a role that can do exactly what it needs and nothing more — **never as a superuser, never as the table owner**. That single decision caps the blast radius of every other bug, including SQL injection (topic 5) and a misconfigured RLS policy (topic 2).",
            uk: "Безпека шарова, і перші два шари відповідають на різні питання. **Authentication (authN)** доводить, *хто* ви; **authorization (authZ)** вирішує, *що* вам дозволено. PostgreSQL налаштовує автентифікацію в **`pg_hba.conf`** — впорядкованих host-based правилах, що зіставляють (тип підключення, базу, користувача, адресу клієнта) з **методом**. Використовуйте **`scram-sha-256`** — дефолтний `password_encryption` для нових кластерів з PostgreSQL 14; **`md5` застарів**, і PostgreSQL 18 видає попередження, коли ви встановлюєте md5-пароль. Ніколи не використовуйте метод `trust` (взагалі без пароля) ніде, крім локального одноразового стенду.\n\nАвторизація будується на **roles**. Role може `LOGIN` (тоді це фактично користувач) або просто групувати інші roles (група). Привілеї `GRANT`-яться на обʼєкти — бази, schemas, таблиці, навіть окремі колонки — і `REVOKE`-яться. **RBAC** випливає природно: видайте привілеї груповій role один раз, потім надавайте членство в цій групі. PostgreSQL 14 додав **predefined roles** (`pg_read_all_data`, `pg_write_all_data`, `pg_monitor`) для типових наборів.\n\nПринцип, що звʼязує все докупи — **least privilege**: застосунок має підключатися як role, що може робити рівно те, що йому потрібно, і нічого більше — **ніколи як superuser, ніколи як власник таблиці**. Це єдине рішення обмежує радіус ураження кожного іншого бага, зокрема SQL injection (тема 5) та неправильно налаштованої RLS-політики (тема 2).",
          },
        },
        {
          kind: 'figure',
          fig: 'trust-boundaries',
          caption: {
            en: 'Trust boundaries: input crosses from the hostile internet through TLS, authentication, and authorization before it reaches your data — and each boundary is a control you must place deliberately.',
            uk: 'Trust boundaries: вхід перетинає межі від ворожого інтернету через TLS, автентифікацію й авторизацію, перш ніж дістатися ваших даних — і кожна межа є контролем, який ви розміщуєте свідомо.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'pg_hba.conf authentication methods', uk: 'Методи автентифікації pg_hba.conf' },
          head: [
            { en: 'Method', uk: 'Метод' },
            { en: 'What it does', uk: 'Що робить' },
            { en: 'Use when', uk: 'Коли використовувати' },
          ],
          rows: [
            [
              { en: 'scram-sha-256', uk: 'scram-sha-256' },
              { en: 'Salted challenge-response; never sends the password', uk: 'Salted challenge-response; ніколи не надсилає пароль' },
              { en: 'The default — use it everywhere', uk: 'Дефолт — використовуйте всюди' },
            ],
            [
              { en: 'md5 (deprecated)', uk: 'md5 (застарів)' },
              { en: 'Weak legacy hash; PG18 warns on use', uk: 'Слабкий legacy-hash; PG18 попереджає при використанні' },
              { en: 'Only while migrating old clients off it', uk: 'Лише поки мігруєте старих клієнтів з нього' },
            ],
            [
              { en: 'cert', uk: 'cert' },
              { en: 'Client TLS certificate identifies the role', uk: 'Клієнтський TLS-сертифікат ідентифікує role' },
              { en: 'Service-to-service, no shared password', uk: 'Service-to-service, без спільного пароля' },
            ],
            [
              { en: 'peer / ident', uk: 'peer / ident' },
              { en: 'Trusts the OS user (local socket)', uk: 'Довіряє ОС-користувачу (локальний сокет)' },
              { en: 'Local admin / maintenance only', uk: 'Лише локальне адміністрування / обслуговування' },
            ],
            [
              { en: 'trust (danger)', uk: 'trust (небезпечно)' },
              { en: 'No authentication at all', uk: 'Жодної автентифікації взагалі' },
              { en: 'Never in production', uk: 'Ніколи в production' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- The app connects as a least-privilege role — never superuser, never the table owner
CREATE ROLE app_rw LOGIN PASSWORD 'set-via-secrets-manager';   -- scram-sha-256 hashed

GRANT CONNECT ON DATABASE app TO app_rw;
GRANT USAGE  ON SCHEMA   public TO app_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;

-- new tables created later inherit the same grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;

-- DDL / migrations run as a SEPARATE, more-privileged role — not the runtime role.
-- app_rw cannot DROP, ALTER, or read another schema: the blast radius is capped.`,
          note: {
            en: 'The runtime role can read and write rows and nothing else. An attacker who hijacks this connection still cannot drop tables or escalate.',
            uk: 'Runtime-role може читати й писати рядки і нічого більше. Зловмисник, що перехопить це підключення, все одно не зможе дропнути таблиці чи ескалувати.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Least privilege caps the blast radius', uk: 'Least privilege обмежує радіус ураження' },
          md: {
            en: 'Treat every `GRANT` as a liability you will have to defend. Give the application role exactly the privileges it uses; keep DDL/migration rights in a separate role; never let the runtime app be a superuser or own its tables. When (not if) something else goes wrong — an injected query, a leaked credential, a logic bug — least privilege is what turns a catastrophe into an incident.',
            uk: 'Ставтесь до кожного `GRANT` як до зобовʼязання, яке доведеться захищати. Дайте role застосунку рівно ті привілеї, які вона використовує; тримайте права на DDL/міграції в окремій role; ніколи не дозволяйте runtime-застосунку бути superuser чи власником своїх таблиць. Коли (не «якщо») щось інше піде не так — інʼєкований запит, злитий credential, баг логіки — саме least privilege перетворює катастрофу на інцидент.',
          },
        },
      ],
    },

    // ── Topic 2: row-level security ───────────────────────────────────────
    {
      id:    'rls',
      title: { en: 'Row-level security (RLS)', uk: 'Row-level security (RLS)' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Table and column privileges answer *which tables* a role may touch. **Row-level security** (RLS, since PostgreSQL 9.5) goes one level deeper — *which rows*. After `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, every query against that table is automatically filtered by the **policies** you `CREATE POLICY`. A policy carries a **`USING`** clause (which existing rows are visible to `SELECT`/`UPDATE`/`DELETE`) and a **`WITH CHECK`** clause (which new rows an `INSERT`/`UPDATE` may write).\n\nThe canonical use is **multi-tenancy**: one `orders` table holds every tenant's rows, and a policy `USING (tenant_id = current_setting('app.tenant_id')::int)` guarantees each tenant sees only its own — enforced by the database, not by hopeful `WHERE` clauses scattered across the application. Set the tenant once per connection or transaction (a GUC), and isolation holds for every query, including the ones a developer forgets to filter.\n\nThe critical caveat: the **table owner and superusers bypass RLS by default**. Two consequences follow — make the owner obey policies with `ALTER TABLE ... FORCE ROW LEVEL SECURITY`, and (from topic 1) **never let the application connect as the table owner**, or your policies are silently skipped. Note too that `pg_read_all_data` does *not* bypass RLS, and that policies default to **PERMISSIVE** (OR-combined); add **RESTRICTIVE** policies when you need them AND-combined.",
            uk: "Привілеї на таблиці й колонки відповідають, *яких таблиць* role може торкатися. **Row-level security** (RLS, з PostgreSQL 9.5) іде на рівень глибше — *яких рядків*. Після `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` кожен запит до цієї таблиці автоматично фільтрується **політиками**, які ви `CREATE POLICY`. Політика несе клаузу **`USING`** (які наявні рядки видимі для `SELECT`/`UPDATE`/`DELETE`) та клаузу **`WITH CHECK`** (які нові рядки `INSERT`/`UPDATE` може записати).\n\nКанонічне застосування — **multi-tenancy**: одна таблиця `orders` тримає рядки всіх tenant-ів, а політика `USING (tenant_id = current_setting('app.tenant_id')::int)` гарантує, що кожен tenant бачить лише свої — це забезпечує база, а не сповнені надії `WHERE`-клаузи, розкидані застосунком. Встановіть tenant один раз на підключення чи транзакцію (GUC), і ізоляція тримається для кожного запиту, зокрема тих, які розробник забув відфільтрувати.\n\nКритичне застереження: **власник таблиці й superusers обходять RLS за замовчуванням**. Звідси два наслідки — змусьте власника підкорятися політикам через `ALTER TABLE ... FORCE ROW LEVEL SECURITY` і (з теми 1) **ніколи не дозволяйте застосунку підключатися як власник таблиці**, інакше ваші політики тихо пропускаються. Зауважте також, що `pg_read_all_data` *не* обходить RLS, а політики за замовчуванням **PERMISSIVE** (обʼєднуються через OR); додавайте **RESTRICTIVE** політики, коли потрібно обʼєднання через AND.",
          },
        },
        {
          kind: 'figure',
          fig: 'rls-policy',
          caption: {
            en: 'One shared table, two tenants: the policy filters every query by the current tenant GUC, so each session sees only its own rows — and the owner is forced to obey the same rule.',
            uk: 'Одна спільна таблиця, два tenant-и: політика фільтрує кожен запит за поточним tenant-GUC, тож кожна сесія бачить лише свої рядки — і власник змушений підкорятися тому ж правилу.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Multi-tenant isolation enforced by the database, not by hopeful WHERE clauses
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE  ROW LEVEL SECURITY;   -- the owner obeys policies too

CREATE POLICY tenant_isolation ON orders
  USING      (tenant_id = current_setting('app.tenant_id')::int)   -- rows you can see
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);  -- rows you can write

-- the app sets the tenant once per connection / transaction:
SET app.tenant_id = '42';
SELECT * FROM orders;            -- only tenant 42's rows, automatically
INSERT INTO orders (tenant_id, total) VALUES (99, 10);  -- ERROR: WITH CHECK violated`,
          note: {
            en: 'A forgotten WHERE clause can no longer leak another tenant’s data — the policy applies to every statement, even the ones you did not write.',
            uk: 'Забута WHERE-клауза більше не може злити дані іншого tenant — політика застосовується до кожного statement, навіть тих, які ви не писали.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'RLS only works if the app is not the owner', uk: 'RLS працює, лише якщо застосунок не є власником' },
          md: {
            en: 'The two most common ways RLS silently does nothing: the application connects as the table owner or a superuser (both bypass policies unless you `FORCE` them), and the per-connection GUC is never set (a missing `app.tenant_id` makes `current_setting(...)` error or, if you used the two-argument form, fall back to a value that may match everything). Test RLS by querying as the real app role, not as the owner you created the table with.',
            uk: 'Два найпоширеніші способи, якими RLS тихо нічого не робить: застосунок підключається як власник таблиці чи superuser (обидва обходять політики, якщо ви їх не `FORCE`), і per-connection GUC ніколи не встановлюється (відсутній `app.tenant_id` спричиняє помилку `current_setting(...)` або, якщо ви вжили форму з двома аргументами, повертає значення, що може збігтися з усім). Тестуйте RLS, роблячи запити як справжня app-role, а не як власник, яким ви створили таблицю.',
          },
        },
      ],
    },

    // ── Topic 3: encryption at rest & in transit ──────────────────────────
    {
      id:    'encryption',
      title: { en: 'Encryption at rest & in transit', uk: 'Шифрування at rest та in transit' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Encryption protects data on the paths and disks an attacker may already have reached. Two axes. **In transit:** TLS encrypts the client–server connection. Turn it on and *require* it — on the client, **`sslmode=verify-full`** checks both that the link is encrypted and that the server's certificate is the one you expect, which is what actually defeats a man-in-the-middle (the weaker `require` encrypts but does not verify identity).\n\n**At rest:** community PostgreSQL has **no built-in transparent data encryption (TDE)** — it is an enterprise/cloud add-on (EDB, Cybertec, or the cloud provider's storage-layer encryption). Self-managed, you encrypt the **filesystem** (LUKS / dm-crypt on Linux, BitLocker on Windows) so a stolen disk or decommissioned drive is useless. For *selective* protection, the **`pgcrypto`** extension encrypts individual columns (`pgp_sym_encrypt`) — but it is **not transparent**: the application must encrypt and decrypt explicitly, and, crucially, **manage the keys**. A key stored in the same database, or next to the ciphertext, protects nothing.\n\nThe two reminders people miss: **key management is the hard part** (rotation, escrow, an HSM or KMS — not a constant in your code), and **backups and replicas need the same protection as the primary**. Encrypting the main volume while shipping plaintext WAL to an unencrypted backup bucket just moves the breach.",
            uk: "Шифрування захищає дані на шляхах і дисках, до яких зловмисник міг уже дістатися. Дві осі. **In transit:** TLS шифрує підключення клієнт–сервер. Увімкніть його і *вимагайте* — на клієнті **`sslmode=verify-full`** перевіряє і що зʼєднання зашифроване, і що сертифікат сервера саме той, на який ви очікуєте, — це й перемагає man-in-the-middle (слабший `require` шифрує, але не перевіряє ідентичність).\n\n**At rest:** community PostgreSQL **не має вбудованого transparent data encryption (TDE)** — це enterprise/cloud-додаток (EDB, Cybertec або шифрування на storage-шарі хмарного провайдера). При self-managed ви шифруєте **файлову систему** (LUKS / dm-crypt на Linux, BitLocker на Windows), тож вкрадений чи списаний диск стає марним. Для *вибіркового* захисту extension **`pgcrypto`** шифрує окремі колонки (`pgp_sym_encrypt`) — але він **не transparent**: застосунок мусить шифрувати й розшифровувати явно і, головне, **керувати ключами**. Ключ, що зберігається в тій самій базі чи поруч із ciphertext, не захищає нічого.\n\nДва нагадування, які пропускають: **key management — це найскладніше** (ротація, escrow, HSM чи KMS — а не константа у вашому коді), і **backups та replicas потребують такого ж захисту, як primary**. Шифрувати головний том, відправляючи plaintext-WAL у незашифрований backup-bucket, — це просто перенести злам.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Where encryption lives — and what it does not cover', uk: 'Де живе шифрування — і чого воно не покриває' },
          head: [
            { en: 'Layer', uk: 'Шар' },
            { en: 'How (PostgreSQL)', uk: 'Як (PostgreSQL)' },
            { en: 'Protects against', uk: 'Захищає від' },
          ],
          rows: [
            [
              { en: 'In transit', uk: 'In transit' },
              { en: 'TLS; client sslmode=verify-full', uk: 'TLS; клієнт sslmode=verify-full' },
              { en: 'Network sniffing, man-in-the-middle', uk: 'Перехоплення мережі, man-in-the-middle' },
            ],
            [
              { en: 'At rest (whole disk)', uk: 'At rest (весь диск)' },
              { en: 'Filesystem: LUKS / dm-crypt / BitLocker', uk: 'Файлова система: LUKS / dm-crypt / BitLocker' },
              { en: 'Stolen / decommissioned drives', uk: 'Вкрадені / списані диски' },
            ],
            [
              { en: 'At rest (column-level)', uk: 'At rest (рівень колонки)' },
              { en: 'pgcrypto (app-managed keys)', uk: 'pgcrypto (ключі керує застосунок)' },
              { en: 'A few sensitive fields specifically', uk: 'Кілька конкретно чутливих полів' },
            ],
            [
              { en: 'TDE (transparent)', uk: 'TDE (transparent)' },
              { en: 'Not in core — EDB/Cybertec/cloud', uk: 'Немає в core — EDB/Cybertec/cloud' },
              { en: 'At-rest without app changes', uk: 'At-rest без змін застосунку' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'No core TDE, and the key is the whole game', uk: 'Немає TDE в core, і ключ — це вся суть' },
          md: {
            en: 'Do not assume PostgreSQL encrypts data at rest for you — it does not. Pick a real layer (filesystem encryption for the common case, pgcrypto only for a handful of fields), and then spend your effort on **key management**: where the key lives (a KMS/HSM, never the database), how it rotates, and who can read it. Encryption with a badly kept key is theatre. And extend the same controls to backups, WAL archives, and replicas.',
            uk: 'Не вважайте, що PostgreSQL шифрує дані at rest за вас — він цього не робить. Оберіть реальний шар (шифрування файлової системи для типового випадку, pgcrypto лише для жменьки полів), а потім витрачайте зусилля на **key management**: де живе ключ (KMS/HSM, ніколи не база), як він ротується і хто може його прочитати. Шифрування з погано збереженим ключем — це театр. І поширте ті ж контролі на backups, WAL-архіви та replicas.',
          },
        },
      ],
    },

    // ── Topic 4: password hashing & secrets ───────────────────────────────
    {
      id:    'passwords-secrets',
      title: { en: 'Password hashing & secrets', uk: 'Hashing паролів та secrets' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Two different hashing jobs get confused constantly. The database's *own* login passwords are handled by `scram-sha-256` (topic 1) — that is PostgreSQL's problem and it is solved. **Your application's user passwords are your problem**, and the rules are absolute: **never store them reversibly, and never hash them with a fast algorithm.** MD5, SHA-1, and plain SHA-256 are *designed* to be fast — which is exactly what an attacker with a stolen `users` table wants, because a GPU then makes billions of guesses per second.\n\nUse a **slow, memory-hard password hash**. **Argon2id** is the OWASP first choice (a floor of 19 MiB memory, `t=2`, `p=1`; closer to 64 MiB for an interactive login at ~100 ms). **bcrypt** (work factor ≥ 12 in 2026, with its 72-byte input limit) and **scrypt** are accepted alternatives; **PBKDF2** only where FIPS compliance forces it (310k iterations, HMAC-SHA-256). Each hash carries a unique random **salt** (built into the Argon2id/bcrypt output), so two identical passwords still hash differently and precomputed rainbow tables are useless. Never invent your own scheme.\n\nThe same discipline governs **secrets**: database credentials, API keys, and TLS private keys belong in a **secrets manager** (Vault, AWS/GCP Secrets Manager) or at minimum injected environment variables — **never committed to source control, never left in a Terraform state file in plaintext** (topic from M32). Rotate them, scope them, and audit access.",
            uk: "Дві різні задачі hashing постійно плутають. *Власні* логін-паролі бази обробляє `scram-sha-256` (тема 1) — це проблема PostgreSQL, і вона вирішена. **Паролі користувачів вашого застосунку — це ваша проблема**, і правила абсолютні: **ніколи не зберігайте їх оборотно і ніколи не хешуйте швидким алгоритмом.** MD5, SHA-1 та звичайний SHA-256 *спроєктовані* бути швидкими — а це саме те, чого хоче зловмисник із вкраденою таблицею `users`, бо GPU тоді робить мільярди спроб за секунду.\n\nВикористовуйте **повільний, memory-hard hash паролів**. **Argon2id** — перший вибір OWASP (підлога 19 MiB памʼяті, `t=2`, `p=1`; ближче до 64 MiB для інтерактивного логіну за ~100 мс). **bcrypt** (work factor ≥ 12 у 2026, з його лімітом входу 72 байти) та **scrypt** — прийнятні альтернативи; **PBKDF2** лише там, де цього вимагає FIPS (310k ітерацій, HMAC-SHA-256). Кожен hash несе унікальну випадкову **salt** (вбудовану у вивід Argon2id/bcrypt), тож два однакові паролі все одно хешуються по-різному, а заздалегідь обчислені rainbow tables стають марними. Ніколи не вигадуйте власну схему.\n\nТа сама дисципліна керує **secrets**: credentials бази, API keys та TLS-приватні ключі належать у **secrets manager** (Vault, AWS/GCP Secrets Manager) або щонайменше у впроваджені environment variables — **ніколи не комітьте в source control, ніколи не лишайте у Terraform state-файлі у відкритому вигляді** (тема з M32). Ротуйте їх, обмежуйте scope й аудитуйте доступ.",
          },
        },
        {
          kind: 'table',
          caption: { en: 'Password hashing algorithms (OWASP, 2026)', uk: 'Алгоритми hashing паролів (OWASP, 2026)' },
          head: [
            { en: 'Algorithm', uk: 'Алгоритм' },
            { en: 'Parameters (floor)', uk: 'Параметри (мінімум)' },
            { en: 'Use when', uk: 'Коли використовувати' },
          ],
          rows: [
            [
              { en: 'Argon2id', uk: 'Argon2id' },
              { en: '19 MiB, t=2, p=1 (memory-hard)', uk: '19 MiB, t=2, p=1 (memory-hard)' },
              { en: 'First choice for new apps', uk: 'Перший вибір для нових застосунків' },
            ],
            [
              { en: 'scrypt', uk: 'scrypt' },
              { en: 'N=2^17, r=8, p=1', uk: 'N=2^17, r=8, p=1' },
              { en: 'When Argon2id is unavailable', uk: 'Коли Argon2id недоступний' },
            ],
            [
              { en: 'bcrypt', uk: 'bcrypt' },
              { en: 'work factor ≥ 12; 72-byte input limit', uk: 'work factor ≥ 12; ліміт входу 72 байти' },
              { en: 'Mature, widely available', uk: 'Зрілий, широко доступний' },
            ],
            [
              { en: 'PBKDF2', uk: 'PBKDF2' },
              { en: '310k iters, HMAC-SHA-256', uk: '310k ітерацій, HMAC-SHA-256' },
              { en: 'Only when FIPS-140 is required', uk: 'Лише коли вимагається FIPS-140' },
            ],
            [
              { en: 'MD5 / SHA-256 (raw)', uk: 'MD5 / SHA-256 (сирий)' },
              { en: 'Fast — billions of guesses/sec', uk: 'Швидкі — мільярди спроб/с' },
              { en: 'Never for passwords', uk: 'Ніколи для паролів' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Slow and salted, or do not bother', uk: 'Повільно й salted — або взагалі не варто' },
          md: {
            en: 'The whole point of a password hash is to be *expensive* to compute, so a leaked table cannot be brute-forced. A fast hash (even salted) fails that goal. Reach for a maintained library (`argon2`, `bcrypt`) at its recommended cost, store the algorithm + parameters + salt alongside the hash so you can raise the cost later, and never write the primitive yourself. The same rule that governs database passwords governs API keys and tokens: long, random, hashed at rest, and rotatable.',
            uk: 'Уся суть hash паролів — бути *дорогим* для обчислення, щоб злиту таблицю не можна було перебрати. Швидкий hash (навіть salted) цю мету провалює. Беріть підтримувану бібліотеку (`argon2`, `bcrypt`) на її рекомендованій вартості, зберігайте алгоритм + параметри + salt поруч із hash, щоб пізніше підняти вартість, і ніколи не пишіть примітив самі. Те саме правило, що керує паролями бази, керує API keys і токенами: довгі, випадкові, хешовані at rest і придатні до ротації.',
          },
        },
      ],
    },

    // ── Topic 5: SQL injection & a hardening checklist ────────────────────
    {
      id:    'sql-injection',
      title: { en: 'SQL injection & a hardening checklist', uk: 'SQL injection та чек-лист hardening' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**SQL injection** is among the oldest and still most damaging web vulnerabilities (OWASP's Injection category). It happens whenever untrusted input is **concatenated into a SQL string**, so the attacker's text is parsed as *code* instead of *data*. `\"SELECT * FROM users WHERE name = '\" + input + \"'\"` with `input = ' OR '1'='1' --` returns every row (an authentication bypass); with `'; DROP TABLE users; --` it can destroy the table.\n\nThe fix is **not escaping** — it is **parameterized queries** (prepared statements). You send the SQL with placeholders (`$1`, `$2`) and the values on a separate channel, so the database treats them as pure data that can never change the command's structure. Every driver supports it, and every ORM or query builder uses it underneath. Try both modes in the simulator below.\n\nEscaping is fragile precisely because it tries to make data *look* safe inside code. **CVE-2025-1094** (February 2025) drove this home: PostgreSQL's own `libpq` escaping functions could be bypassed with an invalid-encoding trick to inject into `psql` — fixed across 17.3 / 16.7 / 15.11 / 14.16 / 13.19. The durable defense is **parameter binding**, backed by **defense in depth**: the least-privilege app role (topic 1) so an injection that does slip through still cannot `DROP` or read another table, plus input validation and allow-lists for anything that must be structural (sort columns, table names).",
            uk: "**SQL injection** — серед найстаріших і досі найруйнівніших вебвразливостей (категорія Injection в OWASP). Вона стається щоразу, коли недовірений вхід **конкатенується у SQL-рядок**, тож текст зловмисника парситься як *код*, а не *дані*. `\"SELECT * FROM users WHERE name = '\" + input + \"'\"` з `input = ' OR '1'='1' --` повертає кожен рядок (обхід автентифікації); з `'; DROP TABLE users; --` він може знищити таблицю.\n\nВиправлення — **не escaping** — це **parameterized queries** (prepared statements). Ви надсилаєте SQL із плейсхолдерами (`$1`, `$2`) і значення окремим каналом, тож база трактує їх як чисті дані, що ніколи не можуть змінити структуру команди. Кожен драйвер це підтримує, і кожен ORM чи query builder використовує це під капотом. Спробуйте обидва режими в симуляторі нижче.\n\nEscaping крихкий саме тому, що намагається змусити дані *виглядати* безпечно всередині коду. **CVE-2025-1094** (лютий 2025) це підкреслив: власні escaping-функції `libpq` PostgreSQL можна було обійти трюком з некоректним кодуванням, щоб інʼєктувати в `psql` — виправлено у 17.3 / 16.7 / 15.11 / 14.16 / 13.19. Тривкий захист — **parameter binding**, підкріплений **defense in depth**: least-privilege app-role (тема 1), щоб інʼєкція, яка таки прослизне, все одно не змогла `DROP` чи прочитати іншу таблицю, плюс валідація входу й allow-lists для всього структурного (колонки сортування, імена таблиць).",
          },
        },
        {
          kind: 'sim',
          sim: 'sql-injection',
        },
        {
          kind: 'code',
          lang: 'js',
          code: `// ❌ String concatenation — the input becomes part of the SQL command
const q = "SELECT * FROM users WHERE name = '" + name + "'";
//  name = "' OR '1'='1' --"
//  →  SELECT * FROM users WHERE name = '' OR '1'='1' --'   (returns EVERY row)

// ✅ Parameterized query — the input travels as data, never as code (node-postgres)
await client.query('SELECT * FROM users WHERE name = $1', [name]);
//  $1 is bound separately; "' OR '1'='1' --" is just a string nobody is named.
//  The same applies to every driver, ORM, and query builder.`,
          note: {
            en: 'The placeholder $1 cannot change the statement’s structure no matter what the user types — that is the property concatenation can never have.',
            uk: 'Плейсхолдер $1 не може змінити структуру statement, хоч би що ввів користувач — це властивість, якої конкатенація мати не може.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'A practical hardening checklist', uk: 'Практичний чек-лист hardening' },
          head: [
            { en: 'Control', uk: 'Контроль' },
            { en: 'Why', uk: 'Навіщо' },
          ],
          rows: [
            [
              { en: 'Parameterized queries everywhere', uk: 'Parameterized queries усюди' },
              { en: 'The one reliable fix for injection', uk: 'Єдине надійне виправлення injection' },
            ],
            [
              { en: 'Least-privilege app role (not owner/superuser)', uk: 'Least-privilege app-role (не власник/superuser)' },
              { en: 'Caps the damage of any breach', uk: 'Обмежує шкоду будь-якого зламу' },
            ],
            [
              { en: 'scram-sha-256, never md5/trust', uk: 'scram-sha-256, ніколи md5/trust' },
              { en: 'Strong, modern authentication', uk: 'Сильна, сучасна автентифікація' },
            ],
            [
              { en: 'TLS with sslmode=verify-full', uk: 'TLS із sslmode=verify-full' },
              { en: 'Stops sniffing and MITM', uk: 'Зупиняє sniffing та MITM' },
            ],
            [
              { en: 'RLS for multi-tenant row isolation', uk: 'RLS для row-ізоляції multi-tenant' },
              { en: 'Isolation the app cannot forget', uk: 'Ізоляція, яку застосунок не забуде' },
            ],
            [
              { en: 'Slow, salted password hashing (Argon2id)', uk: 'Повільний, salted hashing паролів (Argon2id)' },
              { en: 'A leaked table resists brute force', uk: 'Злита таблиця опирається brute force' },
            ],
            [
              { en: 'Secrets in a manager, not in code', uk: 'Secrets у менеджері, не в коді' },
              { en: 'No credentials in git or state files', uk: 'Жодних credentials у git чи state-файлах' },
            ],
            [
              { en: 'Encrypt disk + backups; patch promptly', uk: 'Шифруйте диск + backups; патчте вчасно' },
              { en: 'Stolen media and known CVEs are useless', uk: 'Вкрадені носії й відомі CVE стають марними' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Parameterize — escaping is not enough', uk: 'Parameterize — escaping недостатньо' },
          md: {
            en: 'Never build SQL by gluing strings together, not even with an escaping function: CVE-2025-1094 showed PostgreSQL’s own escaping APIs could be defeated. Bind every value as a parameter, validate and allow-list the rare structural inputs you cannot parameterize (column to sort by, table name), and lean on the least-privilege role as the backstop. Injection is a solved problem the day you stop concatenating.',
            uk: 'Ніколи не будуйте SQL склеюванням рядків, навіть з escaping-функцією: CVE-2025-1094 показав, що навіть власні escaping-API PostgreSQL можна обійти. Привʼязуйте кожне значення як параметр, валідуйте й allow-list-уйте рідкі структурні входи, які не можна параметризувати (колонка сортування, імʼя таблиці), і спирайтесь на least-privilege role як підстраховку. Injection — розвʼязана проблема того дня, коли ви припините конкатенувати.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Authentication (who) vs authorization (what): use scram-sha-256 (md5 is deprecated, PG18 warns), build RBAC on group roles, and connect the app as a least-privilege role — never superuser or table owner. Least privilege caps the blast radius of every other failure.',
      uk: 'Автентифікація (хто) проти авторизації (що): використовуйте scram-sha-256 (md5 застарів, PG18 попереджає), будуйте RBAC на групових roles і підключайте застосунок як least-privilege role — ніколи superuser чи власник таблиці. Least privilege обмежує радіус ураження кожного іншого збою.',
    },
    {
      en: 'Row-level security (since PG9.5) filters which rows each role sees via CREATE POLICY (USING/WITH CHECK) — ideal for multi-tenancy. But owner and superuser bypass RLS unless you FORCE it, so the app must not be the table owner.',
      uk: 'Row-level security (з PG9.5) фільтрує, які рядки бачить кожна role, через CREATE POLICY (USING/WITH CHECK) — ідеально для multi-tenancy. Але власник і superuser обходять RLS, доки ви не зробите FORCE, тож застосунок не має бути власником таблиці.',
    },
    {
      en: 'Encrypt in transit (TLS, sslmode=verify-full) and at rest. Core Postgres has no TDE: use filesystem encryption (LUKS/BitLocker) or pgcrypto for specific columns, protect backups/replicas equally, and treat key management as the hard part.',
      uk: 'Шифруйте in transit (TLS, sslmode=verify-full) та at rest. Core Postgres не має TDE: використовуйте шифрування файлової системи (LUKS/BitLocker) чи pgcrypto для конкретних колонок, захищайте backups/replicas однаково і ставтесь до key management як до найскладнішого.',
    },
    {
      en: 'Store application passwords with a slow, memory-hard, salted hash — Argon2id (or bcrypt/scrypt), never a fast hash (MD5/SHA-256) and never reversibly. Keep secrets in a manager, not in source control or Terraform state.',
      uk: 'Зберігайте паролі застосунку повільним, memory-hard, salted hash — Argon2id (чи bcrypt/scrypt), ніколи швидким hash (MD5/SHA-256) і ніколи оборотно. Тримайте secrets у менеджері, а не в source control чи Terraform state.',
    },
    {
      en: 'SQL injection is defeated by parameterized queries (prepared statements) — not by escaping, which CVE-2025-1094 showed is fragile. Add defense in depth: least-privilege role, input validation, and allow-lists for structural inputs.',
      uk: 'SQL injection перемагають parameterized queries (prepared statements) — не escaping, крихкість якого показав CVE-2025-1094. Додайте defense in depth: least-privilege role, валідацію входу та allow-lists для структурних входів.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'The application connects as superuser or the table owner', uk: 'Застосунок підключається як superuser чи власник таблиці' },
      body: {
        en: 'A runtime app with superuser or owner rights makes every other control weaker: it bypasses RLS policies silently, can DROP or ALTER anything, and turns one injected query or leaked credential into a full compromise. Give the app a dedicated least-privilege role (SELECT/INSERT/UPDATE/DELETE on its tables only), keep DDL in a separate role, and FORCE row-level security so even the owner obeys policies.',
        uk: 'Runtime-застосунок із правами superuser чи власника робить кожен інший контроль слабшим: він тихо обходить RLS-політики, може DROP чи ALTER будь-що і перетворює один інʼєкований запит чи злитий credential на повний компроміс. Дайте застосунку виділену least-privilege role (SELECT/INSERT/UPDATE/DELETE лише на його таблицях), тримайте DDL в окремій role і зробіть FORCE row-level security, щоб навіть власник підкорявся політикам.',
      },
    },
    {
      title: { en: 'Hashing passwords with a fast algorithm (or storing them reversibly)', uk: 'Hashing паролів швидким алгоритмом (чи оборотне зберігання)' },
      body: {
        en: 'MD5, SHA-1, and raw SHA-256 are built for speed, so a stolen table falls to a GPU at billions of guesses per second — and encryption you can reverse is worse, because the key unlocks everything at once. Use a slow, memory-hard, salted hash (Argon2id, bcrypt, scrypt) at its recommended cost, store the parameters so you can raise it later, and never invent your own primitive.',
        uk: 'MD5, SHA-1 та сирий SHA-256 створені для швидкості, тож вкрадена таблиця падає під GPU на мільярдах спроб за секунду — а оборотне шифрування ще гірше, бо ключ відмикає все одразу. Використовуйте повільний, memory-hard, salted hash (Argon2id, bcrypt, scrypt) на рекомендованій вартості, зберігайте параметри, щоб підняти її пізніше, і ніколи не вигадуйте власний примітив.',
      },
    },
    {
      title: { en: 'Building SQL by string concatenation (and trusting escaping)', uk: 'Побудова SQL конкатенацією рядків (і довіра до escaping)' },
      body: {
        en: 'Gluing user input into a query string is the root cause of SQL injection, and reaching for an escaping function instead of parameters only narrows the hole — CVE-2025-1094 defeated PostgreSQL’s own escaping APIs. Always bind values as parameters ($1, $2); for the rare structural input you cannot parameterize (a sort column, a table name), validate against an explicit allow-list. Then lean on least privilege as the backstop.',
        uk: 'Склеювання користувацького входу в рядок запиту — корінна причина SQL injection, а звернення до escaping-функції замість параметрів лише звужує діру — CVE-2025-1094 переміг власні escaping-API PostgreSQL. Завжди привʼязуйте значення як параметри ($1, $2); для рідкісного структурного входу, який не можна параметризувати (колонка сортування, імʼя таблиці), валідуйте за явним allow-list. Потім спирайтесь на least privilege як підстраховку.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'How would you enforce that each tenant in a shared database sees only its own rows?', uk: 'Як би ви забезпечили, щоб кожен tenant у спільній базі бачив лише свої рядки?' },
      a: {
        en: 'Use PostgreSQL row-level security. Enable it on the shared table (ALTER TABLE ... ENABLE ROW LEVEL SECURITY) and create a policy whose USING clause filters by the current tenant — typically a GUC set per connection, e.g. USING (tenant_id = current_setting(\'app.tenant_id\')::int), with the same expression in WITH CHECK so writes cannot escape the tenant. Critically, the owner and superusers bypass RLS by default, so add FORCE ROW LEVEL SECURITY and make sure the application connects as a least-privilege role that is not the table owner; otherwise the policies are silently skipped. The win over application-level WHERE clauses is that the database enforces isolation on every statement, including the ones a developer forgets to filter. For extra layers, combine PERMISSIVE and RESTRICTIVE policies, and consider separate schemas or databases when tenants need stronger blast-radius separation.',
        uk: 'Використати PostgreSQL row-level security. Увімкнути її на спільній таблиці (ALTER TABLE ... ENABLE ROW LEVEL SECURITY) і створити політику, чия клауза USING фільтрує за поточним tenant — зазвичай GUC, встановлений на підключення, напр. USING (tenant_id = current_setting(\'app.tenant_id\')::int), з тим самим виразом у WITH CHECK, щоб записи не вислизнули за tenant. Критично: власник і superusers обходять RLS за замовчуванням, тож додайте FORCE ROW LEVEL SECURITY і переконайтесь, що застосунок підключається як least-privilege role, що не є власником таблиці; інакше політики тихо пропускаються. Перевага над WHERE-клаузами рівня застосунку в тому, що база забезпечує ізоляцію на кожному statement, зокрема тих, які розробник забув відфільтрувати. Для додаткових шарів поєднуйте PERMISSIVE та RESTRICTIVE політики і розгляньте окремі schemas чи бази, коли tenant-ам потрібне сильніше розділення радіуса ураження.',
      },
    },
    {
      level: 'senior',
      q: { en: 'How should an application store user passwords, and how is that different from the database’s own login passwords?', uk: 'Як застосунок має зберігати паролі користувачів і чим це відрізняється від власних логін-паролів бази?' },
      a: {
        en: 'Application user passwords must be stored as a slow, memory-hard, salted one-way hash — Argon2id is the OWASP first choice (bcrypt with work factor 12+ or scrypt are fine; PBKDF2 only for FIPS). Never store them reversibly and never use a fast hash like MD5 or raw SHA-256, because a stolen table then falls to a GPU at billions of guesses per second. A unique random salt (built into the Argon2id/bcrypt output) defeats rainbow tables, and storing the algorithm and parameters alongside the hash lets you raise the cost later. The database’s own login passwords are a separate concern handled by PostgreSQL itself via scram-sha-256 (configured in pg_hba.conf and password_encryption); you do not hash those, you just choose the method and avoid the deprecated md5. Both are passwords, but one is your code’s responsibility and the other is the server’s.',
        uk: 'Паролі користувачів застосунку треба зберігати як повільний, memory-hard, salted одностороній hash — Argon2id є першим вибором OWASP (bcrypt із work factor 12+ чи scrypt підходять; PBKDF2 лише для FIPS). Ніколи не зберігайте їх оборотно і ніколи не використовуйте швидкий hash на кшталт MD5 чи сирого SHA-256, бо вкрадена таблиця тоді падає під GPU на мільярдах спроб за секунду. Унікальна випадкова salt (вбудована у вивід Argon2id/bcrypt) перемагає rainbow tables, а зберігання алгоритму й параметрів поруч із hash дозволяє підняти вартість пізніше. Власні логін-паролі бази — окреме питання, яке PostgreSQL вирішує сам через scram-sha-256 (налаштовується у pg_hba.conf та password_encryption); їх ви не хешуєте, а лише обираєте метод і уникаєте застарілого md5. Обидва — паролі, але один є відповідальністю вашого коду, а інший — сервера.',
      },
    },
    {
      level: 'staff',
      q: { en: 'Walk me through defending against SQL injection in depth — assume a real app with an ORM.', uk: 'Проведіть мене крізь захист від SQL injection в глибину — припустіть реальний застосунок з ORM.' },
      a: {
        en: 'The primary, sufficient defense is parameterized queries / prepared statements: SQL with placeholders ($1, $2) and values bound on a separate channel, so input can never alter the statement structure. An ORM or query builder gives you this by default — the discipline is to never drop to raw string concatenation, and to be especially careful with the gaps: dynamic ORDER BY columns, table or schema names, and IN-lists, which cannot be bound as ordinary parameters and must instead be validated against an explicit allow-list. Escaping is not a substitute — CVE-2025-1094 showed even PostgreSQL’s own escaping APIs could be bypassed via invalid encoding. Then add defense in depth: a least-privilege database role so an injection that somehow lands still cannot DROP tables or read another schema; input validation and type coercion at the edge; and monitoring/alerting plus a WAF as detective controls. Finally, keep the server patched, because the parser and libpq themselves occasionally need fixes. The mental model: parameterization removes the vulnerability, least privilege removes the catastrophe.',
        uk: 'Основний, достатній захист — parameterized queries / prepared statements: SQL з плейсхолдерами ($1, $2) і значеннями, привʼязаними окремим каналом, тож вхід ніколи не може змінити структуру statement. ORM чи query builder дає це за замовчуванням — дисципліна в тому, щоб ніколи не опускатися до сирої конкатенації рядків і бути особливо обережним із прогалинами: динамічні колонки ORDER BY, імена таблиць чи schemas та IN-списки, які не можна привʼязати як звичайні параметри і які натомість треба валідувати за явним allow-list. Escaping не є заміною — CVE-2025-1094 показав, що навіть власні escaping-API PostgreSQL можна обійти через некоректне кодування. Потім додайте defense in depth: least-privilege role бази, щоб інʼєкція, яка якось приземлиться, все одно не могла DROP таблиці чи прочитати іншу schema; валідацію входу й приведення типів на межі; та monitoring/alerting плюс WAF як детективні контролі. Нарешті, тримайте сервер пропатченим, бо парсер і сам libpq іноді потребують виправлень. Ментальна модель: параметризація прибирає вразливість, least privilege прибирає катастрофу.',
      },
    },
  ],

  seeAlso: ['m32-cloud-native', 'm11-views-procedural', 'm8-keys-constraints', 'm34-performance'],

  sources: [
    { title: 'PostgreSQL 18 docs — Row Security Policies (5.9)', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html' },
    { title: 'PostgreSQL 18 docs — CREATE POLICY', url: 'https://www.postgresql.org/docs/current/sql-createpolicy.html' },
    { title: 'PostgreSQL 18 docs — Password Authentication (scram-sha-256)', url: 'https://www.postgresql.org/docs/current/auth-password.html' },
    { title: 'PostgreSQL 18 docs — Encryption Options (18.8)', url: 'https://www.postgresql.org/docs/current/encryption-options.html' },
    { title: 'PostgreSQL docs — pgcrypto', url: 'https://www.postgresql.org/docs/current/pgcrypto.html' },
    { title: 'OWASP — Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
    { title: 'OWASP — SQL Injection Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html' },
    { title: 'PostgreSQL Security — CVE-2025-1094 (psql SQL injection)', url: 'https://www.postgresql.org/support/security/CVE-2025-1094/' },
  ],
};

export default m33;
