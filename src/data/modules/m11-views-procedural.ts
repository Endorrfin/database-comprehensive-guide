import type { Module } from '../types';

/*
 * M11 · Views, procedural SQL & triggers — Section II (S6). Authored EN first, UA second; technical
 * terms stay English in both. Facts web-verified 2026-06-23 (PostgreSQL latest stable 18.4; sources):
 *  - A view is a stored query (no data of its own), always current. Simple views are auto-updatable;
 *    WITH CHECK OPTION keeps written rows visible through the view; complex views need INSTEAD OF triggers.
 *  - security_invoker view option added in PostgreSQL 15; DEFAULT is false → base access uses the
 *    VIEW OWNER's privileges. true → the querying user's privileges (so base-table RLS applies to caller).
 *  - Materialized views store the result on disk (indexable) but are stale until REFRESH. REFRESH
 *    MATERIALIZED VIEW CONCURRENTLY (since PostgreSQL 9.4) keeps it readable but requires a UNIQUE index.
 *  - Functions return a value and run inside the caller's transaction (cannot COMMIT). Procedures
 *    (CREATE PROCEDURE + CALL, added PostgreSQL 11) can do transaction control (COMMIT/ROLLBACK).
 *  - Volatility: VOLATILE (default) / STABLE / IMMUTABLE; IMMUTABLE can power expression indexes and
 *    be constant-folded. PL/pgSQL is the default, trusted procedural language.
 *  - Triggers: BEFORE / AFTER / INSTEAD OF (INSTEAD OF only on views, FOR EACH ROW) × FOR EACH ROW /
 *    FOR EACH STATEMENT. Transition tables (REFERENCING OLD/NEW TABLE) added PostgreSQL 10. Idiom:
 *    WHEN (OLD.* IS DISTINCT FROM NEW.*) to fire only on real changes (null-safe; ties to M10).
 * Figure 'view-vs-matview' is the motivating diagram. Non-signature module: figure + tables + compare
 * + code, no hero sim.
 */
export const m11: Module = {
  id: 'm11-views-procedural',
  num: 11,
  section: 's2-relational',
  order: 6,
  level: 'senior',
  title: { en: 'Views, procedural SQL & triggers', uk: 'Views, процедурний SQL і triggers' },
  tagline: {
    en: 'Views vs materialized views, PL/pgSQL, triggers, and when logic belongs in the DB.',
    uk: 'Views проти materialized views, PL/pgSQL, triggers і коли логіці місце в БД.',
  },
  readMins: 12,
  mentalModel: {
    en: 'Logic in the database is power and opacity in the same move — use it deliberately.',
    uk: 'Логіка в базі — це водночас сила і непрозорість; застосовуйте свідомо.',
  },
  topics: [
    {
      id: 'views',
      title: { en: 'Views: a named query as an interface', uk: 'Views: іменований запит як інтерфейс' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **view** is a stored `SELECT` with a name. It holds **no data of its own** — every time you query it, the database runs the underlying query against the live base tables, so a view is **always current**. That makes it the cleanest abstraction tool in SQL. Three jobs it does well: **encapsulation** (hide a gnarly five-table join behind `SELECT * FROM active_customers`); a **stable interface** (the columns of a view can stay constant while the tables beneath are refactored); and **projection/restriction** (expose only some columns or rows — a privacy or tenancy boundary).",
            uk: "**View** — це збережений `SELECT` з імʼям. Він **не тримає власних даних** — щоразу, коли ви його запитуєте, база виконує базовий запит проти живих base tables, тож view **завжди актуальний**. Це робить його найчистішим інструментом абстракції в SQL. Три задачі, які він робить добре: **encapsulation** (сховати заплутаний join пʼяти таблиць за `SELECT * FROM active_customers`); **стабільний інтерфейс** (колонки view можуть лишатися сталими, поки таблиці під ним рефакторяться); і **projection/restriction** (відкрити лише деякі колонки чи рядки — межа приватності або tenancy).",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Views can be **writable**, with limits. A **simple view** — one base table, no `DISTINCT`, `GROUP BY`, aggregation or window functions — is **automatically updatable**: `INSERT`/`UPDATE`/`DELETE` against the view flow straight to the base table. Add **`WITH CHECK OPTION`** and the database refuses any write through the view that would produce a row the view's `WHERE` clause hides (no inserting an `inactive` customer through `active_customers`). A **complex view** (joins, aggregates) is read-only until you attach an **`INSTEAD OF` trigger** that says exactly how to translate a write into base-table changes.",
            uk: "Views можуть бути **записуваними**, з обмеженнями. **Simple view** — одна base table, без `DISTINCT`, `GROUP BY`, агрегації чи window functions — **автоматично updatable**: `INSERT`/`UPDATE`/`DELETE` проти view йдуть просто в base table. Додайте **`WITH CHECK OPTION`** — і база відмовить будь-якому запису через view, що дав би рядок, який ховає `WHERE` цього view (не вставити `inactive`-клієнта через `active_customers`). **Complex view** (joins, агрегати) лишається read-only, доки ви не приєднаєте **`INSTEAD OF` trigger**, що каже, як саме перекласти запис на зміни base-таблиць.",
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'A view runs with the owner’s privileges — unless you say otherwise (PG 15)', uk: 'View працює з привілеями власника — якщо не сказати інакше (PG 15)' },
          md: {
            en: "By default, when someone queries a view, the access to the **base tables happens with the view owner's privileges**, not the caller's. That is the point of a view as a controlled window: you can let a user read `public_orders` without granting any access to `orders` itself. But it is also a trap — you might assume the caller's own permissions (and any **Row-Level Security** on the base table) apply, and they do **not** by default. **PostgreSQL 15** added `WITH (security_invoker = true)`, which runs base-table access with the **querying user's** privileges, so their RLS and grants apply. Choose deliberately: `security_invoker = false` (the default) to expose curated data through the owner; `true` when the view must respect each caller's own rights. (Note: this is not the same mechanism as a `SECURITY DEFINER` function.)",
            uk: "За замовчуванням, коли хтось запитує view, доступ до **base tables відбувається з привілеями власника view**, а не викликача. У цьому суть view як контрольованого вікна: можна дати користувачу читати `public_orders` без жодного доступу до самого `orders`. Але це й пастка — ви можете припустити, що діють власні дозволи викликача (і будь-який **Row-Level Security** на base table), а вони за замовчуванням **не** діють. **PostgreSQL 15** додав `WITH (security_invoker = true)`, що виконує доступ до base-таблиць із привілеями **викликача**, тож діють його RLS і grants. Обирайте свідомо: `security_invoker = false` (дефолт) — відкрити curated-дані через власника; `true` — коли view має поважати власні права кожного викликача. (Зауважте: це не той самий механізм, що `SECURITY DEFINER` функція.)",
          },
        },
      ],
    },
    {
      id: 'materialized-views',
      title: { en: 'Materialized views: trading freshness for speed', uk: 'Materialized views: міняємо свіжість на швидкість' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **materialized view** looks like a view but behaves oppositely on the one axis that matters: it **stores its result on disk**. The query runs once, at create or `REFRESH` time, and the rows are saved like a table — you can even build **indexes** on it. Reads are then as fast as reading a table, which is exactly what you want for an expensive rollup that powers a dashboard. The price is **staleness**: the stored result does not change when the base tables change. It is, precisely, a **cache** of a query result.",
            uk: "**Materialized view** виглядає як view, але поводиться протилежно на одній важливій осі: він **зберігає свій результат на диску**. Запит виконується раз — при створенні чи `REFRESH` — і рядки зберігаються, як таблиця; на ньому можна навіть будувати **indexes**. Читання тоді таке ж швидке, як читання таблиці, — саме те, що потрібно для дорогого rollup, який живить дашборд. Ціна — **staleness**: збережений результат не змінюється, коли змінюються base tables. Це, точно, **кеш** результату запиту.",
          },
        },
        {
          kind: 'figure',
          fig: 'view-vs-matview',
          caption: {
            en: 'A view re-runs its query against the base tables on every read (always fresh, pay the cost each time). A materialized view is a stored snapshot (fast reads, but stale until REFRESH).',
            uk: 'View перевиконує свій запит проти base tables на кожному читанні (завжди свіжий, ціна щоразу). Materialized view — це збережений snapshot (швидкі читання, але stale до REFRESH).',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "You bring it up to date with **`REFRESH MATERIALIZED VIEW`**, which recomputes the whole result. Plain `REFRESH` takes an exclusive lock — readers are blocked while it runs. **`REFRESH MATERIALIZED VIEW CONCURRENTLY`** (since PostgreSQL 9.4) keeps the view readable during the refresh, at the cost of being slower and requiring **a `UNIQUE` index** on the materialized view (so it can diff rows). The usual pattern is a scheduled refresh — every few minutes for a near-real-time dashboard, nightly for a heavy report — chosen to fit how stale the data is allowed to be.",
            uk: "Ви оновлюєте його через **`REFRESH MATERIALIZED VIEW`**, що перераховує весь результат. Звичайний `REFRESH` бере exclusive lock — читачі заблоковані, поки він іде. **`REFRESH MATERIALIZED VIEW CONCURRENTLY`** (від PostgreSQL 9.4) лишає view читаним під час refresh, ціною повільнішої роботи й вимоги **`UNIQUE` index** на materialized view (щоб порівнювати рядки). Звичний патерн — запланований refresh: кожні кілька хвилин для майже-реального дашборда, щоночі для важкого звіту — обраний за тим, наскільки stale дані дозволено мати.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'View', uk: 'View' },
          b: { en: 'Materialized view', uk: 'Materialized view' },
          rows: [
            [
              { en: 'Stores', uk: 'Зберігає' },
              { en: 'Nothing — just the query definition', uk: 'Нічого — лише визначення запиту' },
              { en: 'The query result, on disk (and indexable)', uk: 'Результат запиту, на диску (й індексований)' },
            ],
            [
              { en: 'Freshness', uk: 'Свіжість' },
              { en: 'Always current — runs against live data', uk: 'Завжди актуальний — проти живих даних' },
              { en: 'Stale until you REFRESH', uk: 'Stale, доки ви не зробите REFRESH' },
            ],
            [
              { en: 'Read cost', uk: 'Ціна читання' },
              { en: 'Pays the full query cost on every read', uk: 'Платить повну ціну запиту на кожному читанні' },
              { en: 'As cheap as reading a table', uk: 'Дешево, як читання таблиці' },
            ],
            [
              { en: 'Best for', uk: 'Найкраще для' },
              { en: 'Encapsulation, security boundaries, always-fresh reads', uk: 'Encapsulation, межі безпеки, завжди-свіжі читання' },
              { en: 'Expensive rollups read far more often than they change', uk: 'Дорогі rollups, що читаються частіше, ніж змінюються' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'A materialized view is a cache — and caches go stale', uk: 'Materialized view — це кеш, а кеші стають stale' },
          md: {
            en: "The failure mode is treating a materialized view as if it were live. It is a snapshot frozen at the last `REFRESH`, so anything reading it sees old numbers until then — fine for a dashboard that may lag a few minutes, wrong for a balance check that must be exact. Decide the **refresh strategy** up front (a scheduled job, an on-demand refresh after a known batch, or a trigger-maintained summary table if you truly need always-fresh aggregates) and make the **staleness window explicit** to whoever reads it. If the answer is “it can never be stale”, you do not want a materialized view — you want a plain view or a summary table kept current by triggers.",
            uk: "Збій — це ставитися до materialized view, ніби він живий. Це snapshot, заморожений на останньому `REFRESH`, тож усе, що його читає, бачить старі числа до того часу — нормально для дашборда, що може відставати на кілька хвилин, неправильно для перевірки балансу, що має бути точною. Визначте **стратегію refresh** наперед (запланована задача, refresh на вимогу після відомого batch, чи summary-таблиця на triggers, якщо справді потрібні завжди-свіжі агрегати) і зробіть **вікно staleness явним** для того, хто читає. Якщо відповідь «він ніколи не може бути stale» — вам не потрібен materialized view; вам потрібен звичайний view або summary-таблиця, яку тримають актуальною triggers.",
          },
        },
      ],
    },
    {
      id: 'functions-procedures-plpgsql',
      title: { en: 'Functions, procedures & PL/pgSQL', uk: 'Functions, procedures і PL/pgSQL' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Beyond querying, PostgreSQL lets you put **computation** inside the database. A **function** takes arguments and **returns a value** — a scalar, a row, or a whole set (`RETURNS TABLE`). It runs **inside** whatever transaction called it and therefore **cannot** issue `COMMIT` or `ROLLBACK`. A **procedure** (added in **PostgreSQL 11**, invoked with `CALL`) returns nothing by default but **can do transaction control** — it may `COMMIT` partway through, which is exactly what a long batch or maintenance job needs to process millions of rows in chunks without one giant transaction.",
            uk: "Окрім запитів, PostgreSQL дозволяє покласти **обчислення** всередину бази. **Function** бере аргументи й **повертає значення** — скаляр, рядок чи цілий набір (`RETURNS TABLE`). Вона виконується **всередині** транзакції, що її викликала, і тому **не може** видати `COMMIT` чи `ROLLBACK`. **Procedure** (додана у **PostgreSQL 11**, викликається через `CALL`) за замовчуванням нічого не повертає, але **може керувати транзакцією** — може `COMMIT` посеред роботи, що саме й потрібно довгому batch чи maintenance-завданню, щоб обробити мільйони рядків порціями без однієї велетенської транзакції.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Most procedural code is written in **PL/pgSQL**, the default, trusted procedural language: variables, `IF`/`LOOP`/`FOR`, and `BEGIN … EXCEPTION WHEN … END` error handling. One detail with outsized impact is the **volatility label** you give a function. **`VOLATILE`** (the default) means the result can change anytime and may have side effects — the planner must call it for every row. **`STABLE`** promises the same inputs give the same result within a single statement. **`IMMUTABLE`** promises the same inputs *always* give the same result — which lets PostgreSQL constant-fold it and, crucially, **use it in an expression index**.",
            uk: "Більшість процедурного коду пишуть на **PL/pgSQL** — типовій, trusted процедурній мові: змінні, `IF`/`LOOP`/`FOR` і обробка помилок `BEGIN … EXCEPTION WHEN … END`. Деталь із непропорційним впливом — **мітка volatility**, яку ви даєте функції. **`VOLATILE`** (дефолт) означає, що результат може змінитися будь-коли й можливі side effects — планувальник мусить викликати її на кожен рядок. **`STABLE`** обіцяє, що ті самі входи дають той самий результат у межах одного statement. **`IMMUTABLE`** обіцяє, що ті самі входи *завжди* дають той самий результат — що дозволяє PostgreSQL constant-fold її і, головне, **вжити її в expression index**.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- A pure function: same input → same output, so it can be marked IMMUTABLE…
CREATE FUNCTION full_name(first text, last text) RETURNS text
  LANGUAGE sql
  IMMUTABLE                       -- promise of purity: no reads, no clock, no randomness
  RETURN btrim(first || ' ' || last);

-- …which means it can power an expression index the planner uses for searches:
CREATE INDEX people_full_name_idx ON people (full_name(first_name, last_name));`,
          note: {
            en: 'Mislabel a function IMMUTABLE when it actually reads tables or the clock and you get stale, constant-folded results and a corrupt index. Label honestly: VOLATILE if unsure.',
            uk: 'Помилково позначте функцію IMMUTABLE, коли вона насправді читає таблиці чи годинник — і отримаєте stale, constant-folded результати й зіпсований index. Позначайте чесно: VOLATILE, якщо не певні.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Function or procedure? Let transaction control decide', uk: 'Function чи procedure? Хай вирішує контроль транзакції' },
          md: {
            en: "The cleanest way to choose: if you need a **value back** to use in a query, write a **function**. If you need **transaction control** — commit work in batches, run a maintenance loop that must not hold one lock for an hour — write a **procedure** and `CALL` it, because functions run inside the caller's transaction and cannot `COMMIT`. After that, get the **volatility** right: an `IMMUTABLE` function unlocks expression indexes and constant folding, a `STABLE` one is safe to evaluate once per statement, and `VOLATILE` (the default) is the safe fallback when a function reads tables, the clock, or random. The performance and correctness consequences of these labels are real, and the default is the conservative one for a reason.",
            uk: "Найчистіший спосіб обрати: якщо потрібне **значення назад** для вжитку в запиті — пишіть **function**. Якщо потрібен **контроль транзакції** — комітити роботу порціями, крутити maintenance-цикл, що не сміє тримати один lock годину — пишіть **procedure** і викликайте `CALL`, бо functions виконуються всередині транзакції викликача й не можуть `COMMIT`. Далі — правильно виставте **volatility**: `IMMUTABLE`-функція відмикає expression indexes і constant folding, `STABLE` безпечно обчислити раз на statement, а `VOLATILE` (дефолт) — безпечний запасний варіант, коли функція читає таблиці, годинник чи random. Наслідки цих міток для продуктивності й коректності реальні, і дефолт консервативний недарма.",
          },
        },
      ],
    },
    {
      id: 'triggers',
      title: { en: 'Triggers & where logic should live', uk: 'Triggers і де має жити логіка' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **trigger** runs a function **automatically** whenever a write hits a table — `INSERT`, `UPDATE`, `DELETE` (or `TRUNCATE`). It has two independent axes. **Timing**: **`BEFORE`** fires before the row is written, so it can validate, modify, or cancel it; **`AFTER`** fires once the change is durable, ideal for auditing or enqueuing follow-up work; **`INSTEAD OF`** exists only on views, to make a complex view writable. **Granularity**: **`FOR EACH ROW`** fires once per affected row, **`FOR EACH STATEMENT`** fires once per statement regardless of row count. Since **PostgreSQL 10**, a statement-level `AFTER` trigger can use **transition tables** (`REFERENCING OLD/NEW TABLE`) to see the full set of changed rows at once — far more efficient than per-row firing for bulk changes.",
            uk: "**Trigger** запускає функцію **автоматично**, щойно запис торкається таблиці — `INSERT`, `UPDATE`, `DELETE` (чи `TRUNCATE`). Він має дві незалежні осі. **Timing**: **`BEFORE`** спрацьовує до запису рядка, тож може валідувати, змінити чи скасувати його; **`AFTER`** спрацьовує, коли зміна вже durable, — ідеально для аудиту чи постановки подальшої роботи в чергу; **`INSTEAD OF`** існує лише на views, щоб зробити складний view записуваним. **Granularity**: **`FOR EACH ROW`** спрацьовує раз на кожен зачеплений рядок, **`FOR EACH STATEMENT`** — раз на statement незалежно від кількості рядків. Від **PostgreSQL 10** statement-рівневий `AFTER` trigger може вживати **transition tables** (`REFERENCING OLD/NEW TABLE`), щоб бачити весь набір змінених рядків одразу — значно ефективніше за по-рядкове спрацювання на масових змінах.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Trigger timing × granularity — what each combination is for.',
            uk: 'Trigger timing × granularity — для чого кожна комбінація.',
          },
          head: [
            { en: 'Combination', uk: 'Комбінація' },
            { en: 'Fires', uk: 'Спрацьовує' },
            { en: 'Use for', uk: 'Для чого' },
          ],
          rows: [
            [
              { en: 'BEFORE … FOR EACH ROW', uk: 'BEFORE … FOR EACH ROW' },
              { en: 'Before each row is written; can change or reject NEW', uk: 'Перед записом кожного рядка; може змінити чи відхилити NEW' },
              { en: 'Validation, normalization, derived columns', uk: 'Валідація, нормалізація, похідні колонки' },
            ],
            [
              { en: 'AFTER … FOR EACH ROW', uk: 'AFTER … FOR EACH ROW' },
              { en: 'After each row is durable', uk: 'Після того, як кожен рядок став durable' },
              { en: 'Per-row audit, cascade to other tables, enqueue work', uk: 'По-рядковий аудит, каскад в інші таблиці, черга роботи' },
            ],
            [
              { en: 'AFTER … FOR EACH STATEMENT', uk: 'AFTER … FOR EACH STATEMENT' },
              { en: 'Once per statement (with transition tables, PG 10+)', uk: 'Раз на statement (з transition tables, PG 10+)' },
              { en: 'Set-based audit/aggregation over all changed rows', uk: 'Set-based аудит/агрегація над усіма зміненими рядками' },
            ],
            [
              { en: 'INSTEAD OF … FOR EACH ROW', uk: 'INSTEAD OF … FOR EACH ROW' },
              { en: 'In place of a write to a view', uk: 'Замість запису у view' },
              { en: 'Make a complex (joined/aggregated) view writable', uk: 'Зробити складний (joined/aggregated) view записуваним' },
            ],
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- The trigger function (PL/pgSQL): record every real price change.
CREATE FUNCTION log_price_change() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO price_audit (product_id, old_price, new_price, changed_at)
  VALUES (NEW.id, OLD.price, NEW.price, now());
  RETURN NEW;                       -- AFTER ignores the value, but PL/pgSQL needs a RETURN
END;
$$;

CREATE TRIGGER price_audit_trg
  AFTER UPDATE OF price ON products
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)   -- only on a genuine change (null-safe — see M10)
  EXECUTE FUNCTION log_price_change();`,
          note: {
            en: 'WHEN (OLD.* IS DISTINCT FROM NEW.*) is the canonical guard so a no-op UPDATE does not spam the audit log; IS DISTINCT FROM is null-safe where = would return UNKNOWN.',
            uk: 'WHEN (OLD.* IS DISTINCT FROM NEW.*) — канонічний guard, щоб no-op UPDATE не засмічував audit log; IS DISTINCT FROM null-safe там, де = повернув би UNKNOWN.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Triggers are invisible control flow — use them sparingly', uk: 'Triggers — це невидимий потік керування — вживайте ощадливо' },
          md: {
            en: "A trigger's great strength is also its danger: it runs **no matter who writes** — your app, a migration, `psql`, another service — and it runs **without appearing in any statement**. That is precisely what you want for a cross-cutting invariant or an audit trail that must never be skipped. It is precisely what you do **not** want for business workflow: bury “gold customers skip approval on Tuesdays” in a trigger and behavior becomes impossible to trace, fires on bulk loads you did not intend, and can **cascade** (a trigger whose write fires another trigger) into surprising performance and ordering problems. Keep triggers small, deterministic, and documented; reserve them for integrity and audit, and keep changeable policy in explicit, testable application code.",
            uk: "Велика сила trigger — водночас і його небезпека: він виконується **незалежно від того, хто пише** — ваш застосунок, міграція, `psql`, інший сервіс — і виконується, **не зʼявляючись у жодному statement**. Це саме те, що потрібно для наскрізного інваріанта чи audit trail, який не можна оминути. І саме те, чого **не** треба для бізнес-workflow: сховайте «золоті клієнти оминають підтвердження по вівторках» у trigger — і поведінку стане неможливо відстежити, вона спрацює на масових завантаженнях, яких ви не планували, і може **каскадувати** (trigger, чий запис запускає інший trigger) у несподівані проблеми продуктивності й порядку. Тримайте triggers малими, детермінованими й задокументованими; лишайте їх для цілісності та аудиту, а змінювану політику тримайте в явному, тестованому коді застосунку.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "That tension is the whole module in one line: **logic in the database is power and opacity in the same move.** Views give a clean, secure interface; materialized views buy read speed with staleness; functions and procedures put computation next to the data, cutting round-trips and centralizing one source of truth; triggers guarantee a reaction no caller can bypass. Every one of them also moves behavior **out of the visible call path and into the schema**. So apply the same line M8 drew for constraints: push down what must hold for **every** writer — integrity, audit, encapsulation — and keep changeable business policy in application code, where it is easy to read, test, and change.",
            uk: "Ця напруга — увесь модуль в одному рядку: **логіка в базі — це водночас сила і непрозорість.** Views дають чистий, безпечний інтерфейс; materialized views купують швидкість читання ціною staleness; functions і procedures кладуть обчислення поруч із даними, скорочуючи round-trips і централізуючи одне джерело істини; triggers гарантують реакцію, яку жоден викликач не оминути. І кожен із них також виносить поведінку **з видимого шляху викликів у схему**. Тож застосуйте ту саму межу, що M8 провів для constraints: проштовхуйте вниз те, що має триматися для **кожного** записувача — цілісність, аудит, encapsulation — а змінювану бізнес-політику тримайте в коді застосунку, де її легко читати, тестувати й міняти.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'A view is a stored query with no data of its own, so it is always current; use it for encapsulation, a stable interface, and column/row restriction. Simple views are auto-updatable (WITH CHECK OPTION); complex views need an INSTEAD OF trigger to be writable.',
      uk: 'View — це збережений запит без власних даних, тож завжди актуальний; вживайте для encapsulation, стабільного інтерфейсу й обмеження колонок/рядків. Simple views auto-updatable (WITH CHECK OPTION); складним потрібен INSTEAD OF trigger, щоб бути записуваними.',
    },
    {
      en: 'A materialized view stores its result on disk (table-fast reads, indexable) but is stale until REFRESH; REFRESH … CONCURRENTLY (PG 9.4+) keeps it readable but needs a UNIQUE index. It is a cache — own the refresh strategy and the staleness window.',
      uk: 'Materialized view зберігає результат на диску (читання швидкі як з таблиці, індексований), але stale до REFRESH; REFRESH … CONCURRENTLY (PG 9.4+) лишає його читаним, але потребує UNIQUE index. Це кеш — володійте стратегією refresh і вікном staleness.',
    },
    {
      en: 'Functions return a value and run inside the caller’s transaction (cannot COMMIT); procedures (PG 11+, CALL) can do transaction control for batch/maintenance work. Label volatility honestly — VOLATILE (default) / STABLE / IMMUTABLE — since IMMUTABLE enables expression indexes and constant folding.',
      uk: 'Functions повертають значення й виконуються в транзакції викликача (не можуть COMMIT); procedures (PG 11+, CALL) можуть керувати транзакцією для batch/maintenance. Позначайте volatility чесно — VOLATILE (дефолт) / STABLE / IMMUTABLE — бо IMMUTABLE вмикає expression indexes і constant folding.',
    },
    {
      en: 'Triggers run a function automatically on a write: BEFORE (validate/modify/cancel), AFTER (audit/react, with transition tables since PG 10), INSTEAD OF (make a view writable); ROW vs STATEMENT granularity. Use WHEN (OLD.* IS DISTINCT FROM NEW.*) to fire only on real changes.',
      uk: 'Triggers запускають функцію автоматично на запис: BEFORE (валідувати/змінити/скасувати), AFTER (аудит/реакція, з transition tables від PG 10), INSTEAD OF (зробити view записуваним); granularity ROW проти STATEMENT. Вживайте WHEN (OLD.* IS DISTINCT FROM NEW.*), щоб спрацьовувати лише на реальні зміни.',
    },
    {
      en: 'Logic in the database is power and opacity in the same move: it holds for every writer but leaves the visible call path. Push down integrity, audit, and encapsulation that must hold for everyone; keep changeable business workflow in explicit, testable application code.',
      uk: 'Логіка в базі — це водночас сила і непрозорість: вона тримається для кожного записувача, але покидає видимий шлях викликів. Проштовхуйте вниз цілісність, аудит та encapsulation, що мають триматися для всіх; змінюваний бізнес-workflow тримайте в явному, тестованому коді застосунку.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Confusing a view’s freshness with a materialized view’s speed', uk: 'Плутати свіжість view зі швидкістю materialized view' },
      body: {
        en: 'A plain view recomputes its query on every read, so it is always fresh but can be slow over a big join; a materialized view reads instantly but is frozen at the last REFRESH. Picking the wrong one gives you either a slow dashboard or stale numbers. Match the choice to the freshness-vs-speed need and schedule refreshes for materialized views.',
        uk: 'Звичайний view перераховує запит на кожному читанні — тож завжди свіжий, але може бути повільним на великому join; materialized view читається миттєво, але заморожений на останньому REFRESH. Неправильний вибір дає або повільний дашборд, або stale-числа. Узгоджуйте вибір із потребою свіжість-проти-швидкості й плануйте refresh для materialized views.',
      },
    },
    {
      title: { en: 'Assuming a view applies the caller’s privileges and RLS', uk: 'Вважати, що view застосовує привілеї та RLS викликача' },
      body: {
        en: 'By default a view accesses base tables with the owner’s privileges, so callers may read data they have no direct grant for, and base-table Row-Level Security may not apply to them as expected. If the caller’s own rights and RLS must apply, create the view WITH (security_invoker = true) (PostgreSQL 15); otherwise treat the default as a deliberate, owner-mediated exposure.',
        uk: 'За замовчуванням view звертається до base tables із привілеями власника, тож викликачі можуть читати дані, на які не мають прямого grant, а Row-Level Security base-таблиці може не діяти для них, як очікувалося. Якщо власні права й RLS викликача мають діяти, створюйте view WITH (security_invoker = true) (PostgreSQL 15); інакше вважайте дефолт свідомим, опосередкованим власником, відкриттям.',
      },
    },
    {
      title: { en: 'Hiding business workflow inside triggers', uk: 'Ховати бізнес-workflow усередині triggers' },
      body: {
        en: 'Triggers fire for every writer and never appear in the statement, so workflow buried in them is impossible to trace, runs on bulk loads you did not intend, and can cascade into ordering and performance surprises. Reserve triggers for cross-cutting integrity and audit; keep changeable business policy in explicit application code where it is visible and testable.',
        uk: 'Triggers спрацьовують для кожного записувача й ніколи не зʼявляються у statement, тож workflow, похований у них, неможливо відстежити, він іде на масових завантаженнях, яких ви не планували, і може каскадувати в сюрпризи порядку й продуктивності. Лишайте triggers для наскрізної цілісності та аудиту; змінювану бізнес-політику тримайте в явному коді застосунку, де вона видима й тестована.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'What is the difference between a view and a materialized view, and when would you use each?',
        uk: 'Яка різниця між view і materialized view і коли вживати кожен?',
      },
      a: {
        en: 'A view is just a stored query with a name; it has no data of its own, so every read re-runs the query against the live base tables and is always current. A materialized view stores the query result on disk, like a cached table you can even index, so reads are cheap — but the data is stale until you REFRESH it. So the trade is freshness versus read speed. I use a plain view to encapsulate a complex join, present a stable interface, or impose a security/projection boundary where I need always-correct data. I use a materialized view for an expensive aggregation that is read far more often than it changes — a dashboard rollup, say — and pair it with a refresh strategy. If readers cannot tolerate downtime during refresh, I use REFRESH MATERIALIZED VIEW CONCURRENTLY, which needs a unique index on the view and keeps it readable while refreshing. The key discipline is being explicit about the acceptable staleness window.',
        uk: 'View — це лише збережений запит з імʼям; він не має власних даних, тож кожне читання перевиконує запит проти живих base tables і завжди актуальне. Materialized view зберігає результат запиту на диску, як кешовану таблицю, яку можна навіть індексувати, тож читання дешеві — але дані stale, доки ви не зробите REFRESH. Тож компроміс — свіжість проти швидкості читання. Звичайний view я вживаю, щоб інкапсулювати складний join, дати стабільний інтерфейс чи накласти межу безпеки/projection, де потрібні завжди-коректні дані. Materialized view — для дорогої агрегації, що читається значно частіше, ніж змінюється (скажімо, rollup для дашборда), у парі зі стратегією refresh. Якщо читачі не терплять простою під час refresh, вживаю REFRESH MATERIALIZED VIEW CONCURRENTLY, що потребує unique index на view і лишає його читаним під час refresh. Ключова дисципліна — бути явним щодо прийнятного вікна staleness.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'In PostgreSQL, what is the difference between a function and a procedure?',
        uk: 'У PostgreSQL яка різниця між function і procedure?',
      },
      a: {
        en: 'A function takes arguments and returns a value — a scalar, a row, or a set with RETURNS TABLE — and it executes inside the transaction of whatever called it, so it cannot COMMIT or ROLLBACK. You use functions wherever you need a value back, including inside queries. A procedure was added in PostgreSQL 11 and is invoked with CALL; it does not return a value by default, but it can do transaction control — it may COMMIT or ROLLBACK partway through. That is the deciding difference: when you need to commit work in batches, like a maintenance job processing millions of rows in chunks so you do not hold one enormous transaction and lock, you need a procedure, not a function. A second thing I always set on functions is the volatility category — VOLATILE by default, or STABLE or IMMUTABLE — because an IMMUTABLE function can be constant-folded and used in an expression index, while mislabeling a volatile one as immutable causes stale results.',
        uk: 'Function бере аргументи й повертає значення — скаляр, рядок чи набір через RETURNS TABLE — і виконується всередині транзакції того, хто її викликав, тож не може COMMIT чи ROLLBACK. Functions вживають усюди, де потрібне значення назад, зокрема в запитах. Procedure додали в PostgreSQL 11, викликають через CALL; вона за замовчуванням не повертає значення, але може керувати транзакцією — може COMMIT чи ROLLBACK посеред роботи. Це вирішальна різниця: коли треба комітити роботу порціями — як maintenance-завдання, що обробляє мільйони рядків шматками, аби не тримати одну величезну транзакцію й lock — потрібна procedure, а не function. Друге, що я завжди виставляю на functions, — категорія volatility (VOLATILE за замовчуванням, або STABLE чи IMMUTABLE), бо IMMUTABLE-функцію можна constant-fold і вжити в expression index, тоді як хибне позначення volatile як immutable дає stale-результати.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'How do you decide whether logic belongs in the database (constraints, triggers, functions) or in the application?',
        uk: 'Як ви вирішуєте, чи логіці місце в базі (constraints, triggers, functions), чи в застосунку?',
      },
      a: {
        en: 'My rule is to push down what must be true for every writer, and keep in the application what changes with the business. The database is never written to by just one path — migrations, other services, an admin in psql, the 2 a.m. fix — so any invariant that protects data integrity belongs as a constraint or, where a reaction is required, an AFTER trigger or a function: it then holds no matter who writes, which is real defense in depth. Audit trails and encapsulation that must not be bypassable are the same case. What I keep in the application is changeable business workflow and anything needing rich UX, complex orchestration, or easy testing, because logic in the database buys that guarantee at the cost of opacity — triggers especially run invisibly, fire on bulk operations, and can cascade, which makes behavior hard to trace and to test. So the test is: if violating it means the data is corrupt, it goes in the database; if it is a policy that product will want to change next quarter, it stays in code. And whatever does go into the database, I keep small, deterministic, documented, and correctly labeled for volatility.',
        uk: 'Моє правило — проштовхувати вниз те, що має бути істинним для кожного записувача, і лишати в застосунку те, що змінюється з бізнесом. У базу пише не один шлях — міграції, інші сервіси, адмін у psql, фікс о 2-й ночі — тож будь-який інваріант, що захищає цілісність даних, належить як constraint, а де потрібна реакція — AFTER trigger чи function: тоді він тримається незалежно від того, хто пише, і це справжній defense in depth. Audit trails та encapsulation, які не можна оминути, — той самий випадок. У застосунку лишаю змінюваний бізнес-workflow і все, що потребує складного UX, оркестрації чи легкого тестування, бо логіка в базі купує цю гарантію ціною непрозорості — особливо triggers виконуються невидимо, спрацьовують на масових операціях і можуть каскадувати, що ускладнює відстеження й тестування. Тож тест такий: якщо порушення означає, що дані пошкоджені, — це йде в базу; якщо це політика, яку продукт захоче змінити наступного кварталу, — лишається в коді. А все, що таки йде в базу, тримаю малим, детермінованим, задокументованим і з правильною міткою volatility.',
      },
    },
  ],
  seeAlso: ['m10-sql-in-depth', 'm8-keys-constraints', 'm19-mvcc', 'm33-security', 'm34-performance'],
  sources: [
    {
      title: 'PostgreSQL 18 Documentation — CREATE VIEW (auto-updatable views, WITH CHECK OPTION, security_invoker default false since PG 15)',
      url: 'https://www.postgresql.org/docs/current/sql-createview.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — CREATE MATERIALIZED VIEW (stores the query result on disk; can be indexed)',
      url: 'https://www.postgresql.org/docs/current/sql-creatematerializedview.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — REFRESH MATERIALIZED VIEW (CONCURRENTLY since PG 9.4 requires a UNIQUE index)',
      url: 'https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — CREATE PROCEDURE (procedures + CALL added in PG 11; transaction control)',
      url: 'https://www.postgresql.org/docs/current/sql-createprocedure.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — 38.7. Function Volatility Categories (VOLATILE/STABLE/IMMUTABLE)',
      url: 'https://www.postgresql.org/docs/current/xfunc-volatility.html',
    },
    {
      title: 'PostgreSQL 18 Documentation — CREATE TRIGGER (BEFORE/AFTER/INSTEAD OF, FOR EACH ROW/STATEMENT, transition tables since PG 10)',
      url: 'https://www.postgresql.org/docs/current/sql-createtrigger.html',
    },
  ],
};
