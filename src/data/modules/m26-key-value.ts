import type { Module } from '../types';

/*
 * M26 · Key-value & caching — Section VI (S13). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-25 (see `sources`).
 *
 * Redis version facts (verified 2026-06-25 via redis.io / github.com/redis):
 *  - Redis licensing history:
 *      Pre-March 2024: BSD 3-Clause (open source).
 *      March 2024 (7.4): relicensed to SSPL v1 + RSALv2 (dual). BSD withdrawn.
 *      May 2025 (8.0): AGPLv3 added as a third option → now tri-license (SSPL / RSALv2 / AGPLv3).
 *  - Redis 8.0 (GA, May 2025): 30+ performance improvements, up to 87% faster commands, 2× more
 *    ops/s, 18% faster replication. New I/O threading implementation (io-threads up to 112% better
 *    throughput @ 8 threads on multi-core Intel). All former "Stack" modules now built-in:
 *    Search, JSON, TimeSeries, Bloom filter, cuckoo filter, top-k, count-min sketch, t-digest.
 *  - Redis 8.8.0 (June 2026): latest stable. Adds Array data structure, INCREX rate limiter,
 *    in-group sorting reducer for FT.AGGREGATE, further performance improvements.
 *
 * Valkey version facts (verified 2026-06-25 via valkey.io / linuxfoundation.org):
 *  - Valkey: Linux Foundation fork of Redis 7.2.4 (announced March 2024). Founding backers:
 *    AWS, Google Cloud, Oracle, Ericsson, Snap. License: BSD-3-Clause.
 *  - Valkey 9.0: ~40% higher throughput vs 8.1 for pipelined workloads; hash field expiration
 *    (TTL on individual hash fields); multiple databases in cluster mode; full-text + hybrid
 *    search (vector + keyword + filtering) with microsecond latency.
 *  - Valkey 9.1 (2026): new I/O threading model, faster streaming operations, higher GET
 *    throughput, faster sorted set queries, hardware clock enabled by default.
 *  - Valkey is default in: Fedora 42, Ubuntu 26.04 LTS, Debian 13, Arch Linux.
 *  - AWS ElastiCache: migrating millions of nodes to Valkey (Valkey 9.0 available on ElastiCache
 *    since May 2026). ~90% command-compatible with Redis; beginning to diverge.
 *
 * Data structures (both Redis and Valkey, verified via docs):
 *  - String: bytes (max 512 MB). Integers auto-promoted (INCR, DECR, INCRBY, INCRBYFLOAT).
 *    Use cases: counters, session tokens, feature flags.
 *  - Hash: field→value map (HSET, HGET, HMGET, HGETALL). Like a mini-document.
 *    Use cases: user objects, configuration objects, product details.
 *  - List: linked list (LPUSH/RPUSH, LPOP/RPOP, LRANGE, LPOS). Use cases: queues (FIFO, LIFO),
 *    activity feeds, producer-consumer.
 *  - Set: unordered unique members (SADD, SISMEMBER, SUNION, SINTER, SDIFF).
 *    Use cases: tags, unique visitors, friend lists.
 *  - Sorted Set (ZSet): members with a float score, ordered by score. ZADD, ZRANGE, ZRANGEBYSCORE,
 *    ZRANK. Internal: skiplist + hash table. Use cases: leaderboards, rate limiting, priority queues.
 *  - Stream: append-only log (XADD, XREAD, XREADGROUP). Consumer groups for at-least-once
 *    message delivery. Persistent (survives restart if RDB/AOF enabled). Use cases: event log,
 *    messaging, audit trail.
 *  - HyperLogLog: probabilistic cardinality estimation (PFADD, PFCOUNT, PFMERGE). ~0.81% error.
 *  - Bitmap: bit array on a String (SETBIT, GETBIT, BITCOUNT, BITPOS).
 *  - Geospatial: lat/lon stored as a sorted-set member (GEOADD, GEODIST, GEORADIUS/GEOSEARCH).
 *  - Bloom filter (Redis 8 built-in / Valkey module): probabilistic membership test. Definite "no",
 *    probable "yes". BF.ADD, BF.EXISTS.
 *
 * Eviction policies (verified, docs):
 *  - noeviction (default): return error when maxmemory is full. For primary data stores.
 *  - allkeys-lru: evict least-recently-used key from all keys. Most common cache policy.
 *  - allkeys-lfu: evict least-frequently-used key. Better for skewed access patterns.
 *  - volatile-lru/lfu: only consider keys with an expiry set.
 *  - allkeys-random / volatile-random: random eviction.
 *  - volatile-ttl: evict keys with the shortest remaining TTL first.
 *
 * Persistence (verified, docs):
 *  - RDB (Redis Database): periodic snapshot (SAVE / BGSAVE). Writes a compact binary file.
 *    Configurable: save 900 1 (save every 900s if ≥ 1 key changed). Fast restart (no replay).
 *    Downside: data loss up to the last RDB interval (seconds to minutes).
 *  - AOF (Append-Only File): logs every write command. appendfsync options:
 *      always:   fsync on every command — max durability, min throughput.
 *      everysec: fsync every second (default) — max 1s data loss, good throughput.
 *      no:       OS decides when to fsync — fast, may lose up to a few seconds.
 *    AOF rewrite (BGREWRITEAOF / auto): compacts the AOF by replacing the full history with the
 *    minimal set of commands to reconstruct state.
 *  - Hybrid (RDB + AOF): recommended for production. AOF provides durability; RDB provides fast
 *    restarts and off-site backups.
 *  - RDB-only or none: common for pure caches (stale data is fine, Redis repopulated from source).
 *
 * Caching patterns (canonical):
 *  - Cache-aside (lazy loading): app checks cache → miss → read DB → populate cache → return.
 *    Pro: only cache what is actually needed. Con: first-read latency; stale on write.
 *  - Read-through: cache sits in front of DB, transparently fetches on miss.
 *  - Write-through: app writes to cache; cache synchronously writes to DB. Always fresh.
 *    Con: every write incurs DB latency even for cold data.
 *  - Write-behind (write-back): app writes to cache; cache asynchronously flushes to DB.
 *    Pro: low write latency. Con: data loss if cache fails before flush.
 *  - Cache stampede (thundering herd): many concurrent requests all miss the same key simultaneously
 *    (after TTL expiry) → all hit the DB at once. Mitigations: mutex lock (only one repopulates),
 *    probabilistic early expiry (XFetch algorithm), or cache warming on deploy.
 *
 * Beyond cache (verified, docs):
 *  - Distributed lock: SET key value NX PX <ttl> (SET-NX-PX, atomic; Redlock for distributed).
 *  - Rate limiting: INCR + EXPIRE per sliding-window key, or Sorted Set-based sliding window.
 *    Redis 8.8 adds INCREX (atomic INCR + EXPIRE in one command). Valkey adds similar commands.
 *  - Pub/Sub: PUBLISH / SUBSCRIBE / PSUBSCRIBE. Fire-and-forget, not durable (lost if no subscriber).
 *  - Streams: XADD / XREADGROUP (consumer groups) — durable, at-least-once. The right tool for
 *    persistent messaging (Pub/Sub is NOT durable).
 *  - Queues: List (LPUSH/BRPOP for blocking pop); Streams for more reliable delivery.
 *
 * Non-signature module: figures-only per locked plan (§6). Figure: 'cache-aside-flow'.
 * Redis: 8.8.0 (June 2026). Valkey: 9.1 (2026).
 */
export const m26: Module = {
  id: 'm26-key-value',
  num: 26,
  section: 's6-nosql',
  order: 2,
  level: 'middle',
  signature: false,
  title: { en: 'Key-value & caching', uk: 'Key-value та кешування' },
  tagline: {
    en: 'Redis/Valkey data structures, caching patterns, eviction & persistence, the 2024 license fork.',
    uk: 'Структури Redis/Valkey, патерни кешування, eviction і persistence, ліцензійний fork 2024.',
  },
  readMins: 13,
  mentalModel: {
    en: 'Fast because it forgets — and because it lives in memory.',
    uk: 'Швидкий, бо забуває — і бо живе в памʼяті.',
  },
  topics: [
    // ── Topic 1: The KV model & data structures ───────────────────────────
    {
      id: 'kv-data-structures',
      title: { en: 'The KV model & Redis/Valkey data structures', uk: 'Модель KV та структури даних Redis/Valkey' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **key-value store** maps an opaque key (a string) to a value and returns it in O(1). It is the simplest possible data model, which is exactly why it is fast. **Redis** (latest: **8.8.0, June 2026**) and its BSD-licensed fork **Valkey** (latest: **9.1, 2026**) are the dominant in-memory key-value stores. Both store everything in RAM with optional persistence to disk, and both achieve sub-millisecond latency for most operations by keeping a single-threaded event loop for command processing (async I/O dispatches; Valkey 9.1 adds a new multi-threaded I/O model for further throughput).\n\nUnlike a pure key-value store (where the value is a byte blob), Redis and Valkey expose **rich data structures** — the value is not opaque but structured, and the server understands its layout. This lets you perform server-side operations (increment a counter, push to a list, add to a sorted set) without a round-trip to pull the value to the client, modify it, and push it back.",
            uk: "**Key-value сховище** відображає непрозорий ключ (рядок) на значення і повертає його за O(1). Це найпростіша можлива модель даних — саме тому вона швидка. **Redis** (найновіший: **8.8.0, червень 2026 р.**) та його BSD-ліцензований форк **Valkey** (найновіший: **9.1, 2026 р.**) — домінуючі in-memory key-value сховища. Обидва зберігають все в RAM з опційною persistence на диск і обидва досягають sub-millisecond latency для більшості операцій завдяки single-threaded event loop для обробки команд (async I/O dispatch; Valkey 9.1 додає нову multi-threaded I/O модель для збільшення throughput).\n\nНа відміну від чистого key-value сховища (де значення — довільний байтовий blob), Redis і Valkey надають **багаті структури даних** — значення не непрозоре, а структуроване, і сервер розуміє його схему. Це дозволяє виконувати серверні операції (збільшити лічильник, додати до списку, вставити в sorted set) без round-trip, щоб тягнути значення до клієнта, змінювати і пушити назад.",
          },
        },
        {
          kind: 'table',
          head: [
            { en: 'Data structure', uk: 'Структура даних' },
            { en: 'Key commands', uk: 'Ключові команди' },
            { en: 'Internal representation', uk: 'Внутрішнє представлення' },
            { en: 'Classic use case', uk: 'Класичне використання' },
          ],
          rows: [
            [
              { en: 'String', uk: 'String' },
              { en: 'GET/SET, INCR/DECR, GETSET, SETNX, SETEX', uk: 'GET/SET, INCR/DECR, GETSET, SETNX, SETEX' },
              { en: 'SDS (Simple Dynamic String) or integer', uk: 'SDS (Simple Dynamic String) або integer' },
              { en: 'Session tokens, feature flags, counters, cached HTML', uk: 'Session-токени, feature flags, лічильники, кешований HTML' },
            ],
            [
              { en: 'Hash', uk: 'Hash' },
              { en: 'HSET/HGET/HMGET, HGETALL, HDEL, HINCRBY', uk: 'HSET/HGET/HMGET, HGETALL, HDEL, HINCRBY' },
              { en: 'Ziplist/listpack (small), hashtable (large)', uk: 'Ziplist/listpack (малий), hashtable (великий)' },
              { en: 'User profile, product details, config map', uk: 'Профіль користувача, деталі продукту, карта конфігурації' },
            ],
            [
              { en: 'List', uk: 'List' },
              { en: 'LPUSH/RPUSH, LPOP/RPOP, LRANGE, BRPOP (blocking)', uk: 'LPUSH/RPUSH, LPOP/RPOP, LRANGE, BRPOP (blocking)' },
              { en: 'Linked list (large), listpack (small)', uk: "Linked list (великий), listpack (малий)" },
              { en: 'Job queue (FIFO), activity feed, recent-N buffer', uk: "Job queue (FIFO), activity feed, буфер останніх N" },
            ],
            [
              { en: 'Set', uk: 'Set' },
              { en: 'SADD/SISMEMBER, SUNION/SINTER/SDIFF, SRANDMEMBER', uk: 'SADD/SISMEMBER, SUNION/SINTER/SDIFF, SRANDMEMBER' },
              { en: 'Intset (all integers), hashtable', uk: 'Intset (всі integer), hashtable' },
              { en: 'Unique visitors, friend lists, tag clouds', uk: 'Унікальні відвідувачі, списки друзів, теги' },
            ],
            [
              { en: 'Sorted Set (ZSet)', uk: 'Sorted Set (ZSet)' },
              { en: 'ZADD/ZRANGE/ZRANGEBYSCORE, ZRANK/ZREVRANK', uk: 'ZADD/ZRANGE/ZRANGEBYSCORE, ZRANK/ZREVRANK' },
              { en: 'Skiplist + hash table', uk: 'Skiplist + hash table' },
              { en: 'Leaderboards, priority queues, rate-limiting windows', uk: 'Таблиці лідерів, priority queues, вікна rate-limiting' },
            ],
            [
              { en: 'Stream', uk: 'Stream' },
              { en: 'XADD/XREAD, XREADGROUP/XACK (consumer groups)', uk: 'XADD/XREAD, XREADGROUP/XACK (consumer groups)' },
              { en: 'Radix tree + listpack entries', uk: 'Radix tree + listpack записи' },
              { en: 'Event log, at-least-once messaging, audit trail', uk: 'Event-лог, at-least-once повідомлення, audit trail' },
            ],
            [
              { en: 'HyperLogLog', uk: 'HyperLogLog' },
              { en: 'PFADD, PFCOUNT, PFMERGE', uk: 'PFADD, PFCOUNT, PFMERGE' },
              { en: '~12 KB probabilistic sketch', uk: '~12 КБ probabilistic sketch' },
              { en: 'Approximate unique-count (≤0.81% error) at minimal memory', uk: 'Приблизний підрахунок унікальних (≤0.81% помилка) при мінімальній памʼяті' },
            ],
          ],
          caption: { en: 'Redis/Valkey data structures, their representations, and use cases.', uk: 'Структури даних Redis/Valkey, їхні представлення та використання.' },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Strings can hold any binary data — including serialised JSON', uk: 'Strings можуть тримати будь-які бінарні дані — включно з серіалізованим JSON' },
          md: {
            en: 'A Redis/Valkey String can hold up to 512 MB of arbitrary bytes. Teams often cache entire JSON-serialised API responses as Strings. Redis 8 (and Valkey with the module) also supports a native **JSON** type (`JSON.SET`/`JSON.GET`) that stores BSON-like trees and allows path-based mutations without a full round-trip deserialise/re-serialise.',
            uk: 'Redis/Valkey String може тримати до 512 МБ довільних байтів. Команди часто кешують цілі JSON-серіалізовані API-відповіді як Strings. Redis 8 (і Valkey з модулем) також підтримує нативний тип **JSON** (`JSON.SET`/`JSON.GET`), що зберігає BSON-подібні дерева і дозволяє мутації по шляху без повного round-trip десеріалізації/ресеріалізації.',
          },
        },
      ],
    },

    // ── Topic 2: Caching patterns ─────────────────────────────────────────
    {
      id: 'caching-patterns',
      title: { en: 'Caching patterns — cache-aside, write-through, TTL, stampede', uk: 'Патерни кешування — cache-aside, write-through, TTL, stampede' },
      blocks: [
        {
          kind: 'figure',
          fig: 'cache-aside-flow',
          caption: {
            en: 'Cache-aside: on a miss the application reads from the database and populates the cache. On a hit the database is skipped entirely. TTL or explicit invalidation keeps the cache fresh.',
            uk: 'Cache-aside: при miss застосунок читає з бази даних і заповнює кеш. При hit база даних взагалі оминається. TTL або явна інвалідація тримає кеш свіжим.',
          },
        },
        {
          kind: 'prose',
          md: {
            en: "**Cache-aside** (also called lazy loading) is the most common pattern. The application is responsible for all cache interactions:\n\n1. Check the cache: `GET user:42`.\n2. **Hit** → return the cached value. The database is never touched.\n3. **Miss** → query the database, then write the result to the cache (`SETEX user:42 300 <serialised-value>`) and return it.\n\nThe TTL (time-to-live) on the key governs how long the value can be stale before it is evicted and the next access re-fetches from the database. Choosing a TTL is a trade-off: short TTLs keep the cache fresh at the cost of more DB reads; long TTLs reduce DB load but risk serving stale data.\n\n**Write-through** keeps the cache and database in sync by writing to both on every mutation. The application writes to the cache, the cache (or a middleware layer) synchronously writes to the database before ack-ing to the caller. Result: the cache is always fresh, but every write incurs DB latency — including writes to data that nobody will ever read from the cache.\n\n**Write-behind** (write-back): the application writes to the cache; the cache asynchronously flushes to the database in batches. Lowest write latency, highest throughput — but if the cache fails before the flush, those writes are lost.\n\n**Cache stampede** (thundering herd) is a common production incident: a popular key expires; hundreds of concurrent requests all miss at the same time; all hit the database simultaneously; the database is hammered. Mitigations:\n- **Mutex lock** — only the first misser acquires a lock, reads the DB, and populates the cache; others wait on the lock.\n- **Probabilistic early expiry (XFetch)** — each read near expiry has a probability of treating the key as expired early, so one request re-populates before the mass expiry.\n- **Background refresh** — a background job re-populates the cache before the TTL expires.",
            uk: "**Cache-aside** (також називається lazy loading) — найпоширеніший патерн. Застосунок відповідає за всі взаємодії з кешем:\n\n1. Перевірити кеш: `GET user:42`.\n2. **Hit** → повернути кешоване значення. База даних не чіпається.\n3. **Miss** → запитати базу даних, потім записати результат у кеш (`SETEX user:42 300 <серіалізоване-значення>`) і повернути.\n\nTTL (time-to-live) на ключі визначає, скільки часу значення може бути застарілим, перш ніж воно буде видалено і наступний запит перечитає з бази. Вибір TTL — це компроміс: короткі TTL тримають кеш свіжим ціною більшої кількості читань з БД; довгі TTL знижують навантаження на БД, але ризикують видавати застарілі дані.\n\n**Write-through** тримає кеш і базу даних синхронізованими, записуючи в обидва при кожній мутації. Застосунок пише в кеш, кеш (або middleware-рівень) синхронно пише в базу до підтвердження клієнту. Результат: кеш завжди свіжий, але кожен запис несе latency БД — включно із записом даних, які ніхто ніколи не читатиме з кешу.\n\n**Write-behind** (write-back): застосунок пише в кеш; кеш асинхронно скидає в базу пакетами. Найменша затримка запису, найвищий throughput — але якщо кеш відмовляє до скидання, ті записи втрачаються.\n\n**Cache stampede** (thundering herd) — поширений production-інцидент: популярний ключ закінчується; сотні конкурентних запитів одночасно промахуються; всі вдаряють по базі одночасно; база перевантажується. Захисти:\n- **Mutex lock** — лише перший промашений захоплює lock, читає БД і заповнює кеш; інші чекають на lock.\n- **Probabilistic early expiry (XFetch)** — кожне читання близько до закінчення TTL має ймовірність вважати ключ таким, що закінчився раніше, тому один запит переповнює до масового закінчення.\n- **Background refresh** — фоновий процес переповнює кеш до закінчення TTL.",
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Cache invalidation: the hardest problem in computing', uk: 'Cache invalidation: найважча проблема в обчисленнях' },
          md: {
            en: '"There are only two hard things in Computer Science: cache invalidation and naming things." (Phil Karlton). The challenge: you write to the database, but the stale cached version lives until its TTL expires. Solutions: (1) **key-based invalidation** — include a version in the key (`user:42:v3`), so the old key is never explicitly deleted, it simply becomes unreachable; (2) **explicit DEL** on write — delete the cache key after a successful DB write; (3) **CDC-driven invalidation** — tail the database WAL (Debezium) and invalidate keys when rows change. None is perfect; choose based on your stale-tolerance.',
            uk: '"Є лише дві складні речі в Computer Science: cache invalidation і найменування речей." (Phil Karlton). Проблема: ви пишете в базу даних, але застаріла кешована версія живе до закінчення TTL. Рішення: (1) **key-based invalidation** — включайте версію в ключ (`user:42:v3`), щоб старий ключ ніколи не видалявся явно, він просто стає недосяжним; (2) **явний DEL** при записі — видаляйте ключ кешу після успішного запису в БД; (3) **CDC-driven invalidation** — читайте WAL бази (Debezium) і інвалідуйте ключі при зміні рядків. Жоден не ідеальний; обирайте залежно від вашої терпимості до застарілих даних.',
          },
        },
      ],
    },

    // ── Topic 3: Eviction & persistence ──────────────────────────────────
    {
      id: 'eviction-persistence',
      title: { en: 'Eviction & persistence — LRU/LFU, RDB vs AOF', uk: 'Eviction і persistence — LRU/LFU, RDB проти AOF' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Redis/Valkey's speed comes from living in RAM. That means the dataset must fit in memory — and when it approaches the `maxmemory` limit, the server needs a policy for what to remove.\n\n**Eviction policies** control which keys get removed when memory is full:\n\n- `noeviction` — return an error on new writes. Correct for a primary data store; catastrophic for a cache.\n- `allkeys-lru` — remove the least-recently-used key from **all** keys. The most common cache policy.\n- `allkeys-lfu` — remove the least-frequently-used key. Better than LRU for skewed (Zipfian) access patterns where a small set of keys is accessed far more often.\n- `volatile-lru` / `volatile-lfu` — same as above, but only consider keys with an expiry (`EXPIRE`) set.\n- `allkeys-random` / `volatile-random` — random eviction (rarely appropriate).\n- `volatile-ttl` — remove the key with the shortest remaining TTL first.\n\n**Persistence** bridges the gap between an in-memory store and durability:",
            uk: "Швидкість Redis/Valkey випливає з перебування в RAM. Це означає, що датасет повинен вміщатися в пам'ять — і коли він наближається до ліміту `maxmemory`, сервер потребує політики, що видаляти.\n\n**Eviction policies** контролюють, які ключі видаляються, коли пам'ять заповнена:\n\n- `noeviction` — повертати помилку при нових записах. Правильно для основного сховища даних; катастрофічно для кешу.\n- `allkeys-lru` — видаляти least-recently-used ключ з **усіх** ключів. Найпоширеніша cache-політика.\n- `allkeys-lfu` — видаляти least-frequently-used ключ. Краще за LRU для skewed (Zipfian) access patterns, де малий набір ключів доступається набагато частіше.\n- `volatile-lru` / `volatile-lfu` — те саме, але враховувати лише ключі з встановленим expiry (`EXPIRE`).\n- `allkeys-random` / `volatile-random` — випадкове видалення (рідко доречне).\n- `volatile-ttl` — видаляти ключ з найкоротшим залишковим TTL першим.\n\n**Persistence** перекидає міст між in-memory сховищем і durability:",
          },
        },
        {
          kind: 'compare',
          a: { en: 'RDB (snapshot)', uk: 'RDB (snapshot)' },
          b: { en: 'AOF (Append-Only File)', uk: 'AOF (Append-Only File)' },
          rows: [
            [
              { en: 'How it works', uk: 'Як працює' },
              { en: 'Periodic BGSAVE: fork + write compact binary snapshot', uk: 'Periodical BGSAVE: fork + запис компактного бінарного snapshot' },
              { en: 'Every write command appended to a log; AOF rewrite compacts it', uk: 'Кожна write-команда дописується в лог; AOF rewrite стискає його' },
            ],
            [
              { en: 'Data loss risk', uk: 'Ризик втрати даних' },
              { en: 'Data since last snapshot (seconds to minutes)', uk: 'Дані з моменту останнього snapshot (секунди до хвилин)' },
              { en: 'Max ~1 second (appendfsync everysec, default)', uk: 'Макс. ~1 секунда (appendfsync everysec, за замовчуванням)' },
            ],
            [
              { en: 'Restart speed', uk: 'Швидкість рестарту' },
              { en: 'Fast — load the binary file directly', uk: 'Швидка — завантаження бінарного файлу напряму' },
              { en: 'Slower — must replay all commands in the AOF', uk: 'Повільніша — потрібно відтворити всі команди в AOF' },
            ],
            [
              { en: 'File size', uk: 'Розмір файлу' },
              { en: 'Compact; great for backups and off-site copies', uk: 'Компактний; відмінно підходить для backup і зовнішніх копій' },
              { en: 'Grows with writes; controlled by AOF rewrite', uk: 'Зростає із записами; контролюється AOF rewrite' },
            ],
            [
              { en: 'Recommendation', uk: 'Рекомендація' },
              { en: 'Pure cache (data loss OK) or periodic backup', uk: 'Чистий кеш (втрата даних прийнятна) або periodical backup' },
              { en: 'When data loss > 1s is unacceptable; combine with RDB for fast restart', uk: 'Коли втрата даних >1с неприйнятна; комбінуйте з RDB для швидкого рестарту' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Production recommendation: RDB + AOF hybrid', uk: 'Рекомендація для production: гібрид RDB + AOF' },
          md: {
            en: 'Use both RDB and AOF: AOF (`appendfsync everysec`) provides ≤ 1 second data-loss guarantee; RDB provides fast restarts and point-in-time backups. On startup, if both exist, Redis/Valkey loads the AOF (more complete). RDB files are ideal for off-site backup S3/GCS transfers. For pure caches (`maxmemory-policy allkeys-lru`) where stale data is acceptable, disable persistence entirely for maximum throughput.',
            uk: 'Використовуйте і RDB, і AOF: AOF (`appendfsync everysec`) надає гарантію втрати даних ≤ 1 секунди; RDB забезпечує швидкі рестарти та point-in-time backup. При запуску, якщо обидва існують, Redis/Valkey завантажує AOF (повніший). Файли RDB ідеальні для передачі backup у S3/GCS. Для чистих кешів (`maxmemory-policy allkeys-lru`), де застарілі дані прийнятні, повністю вимикайте persistence для максимального throughput.',
          },
        },
      ],
    },

    // ── Topic 4: The Redis → Valkey licensing story ──────────────────────
    {
      id: 'redis-valkey-story',
      title: { en: 'The Redis → Valkey story — the 2024 license change and its aftermath', uk: 'Історія Redis → Valkey — зміна ліцензії 2024 р. та її наслідки' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Redis was originally released under the BSD 3-Clause license — a permissive open-source license that allowed anyone to use, modify, and redistribute the code, including in commercial cloud offerings without contributing back. This is exactly what AWS, Google Cloud, and Azure did: they offered Redis as a managed service, generating significant revenue, while Redis Labs (the company) competed with its own Redis Enterprise.\n\nIn **March 2024**, Redis Ltd relicensed Redis **7.4** under a dual license: **RSALv2** (Redis Source Available License) + **SSPLv1** (Server Side Public License). Both are \"source available\" but neither is OSI-approved as open-source. SSPL is modelled on AGPL but extends the copyleft requirement to any service offering the software, making it commercially hostile for cloud providers. BSD was simultaneously removed.\n\nThe community reaction was swift. Within days, the **Linux Foundation** announced **Valkey** — a fork of Redis **7.2.4** (the last BSD version) — with AWS, Google Cloud, Oracle, Ericsson, and Snap as founding backers. By the end of 2024, Valkey became the default in-memory cache in Fedora 42, Ubuntu 26.04 LTS, Debian 13, and Arch Linux. AWS began migrating ElastiCache nodes to Valkey (Valkey 9.0 on ElastiCache, announced May 2026).\n\nIn **May 2025**, Redis added a third license option — **AGPLv3** — making Redis 8 available under a tri-license: RSALv2 / SSPLv1 / AGPLv3. AGPLv3 is OSI-approved, which Redis described as a \"return to open source\". The move was welcomed by some and criticised by others (AGPLv3's copyleft requirements are still onerous for SaaS). Valkey continued its independent development.\n\nAs of **June 2026**:\n- **Redis 8.8.0** is the latest Redis release (tri-licensed: RSALv2/SSPL/AGPLv3). Integrated Search, JSON, TimeSeries, and Bloom modules. Major performance improvements (87% faster commands, 2× ops/s vs 7.x).\n- **Valkey 9.1** is the latest Valkey release (BSD-3-Clause). New I/O threading model, 40%+ throughput vs 8.1. Default in major Linux distros and AWS ElastiCache.\n- The two projects are ~90% command-compatible but beginning to diverge at the API level.",
            uk: "Redis спочатку вийшов під ліцензією BSD 3-Clause — дозвільна open-source ліцензія, що дозволяла будь-кому використовувати, змінювати і розповсюджувати код, включно з комерційними cloud-сервісами без необхідності повертати внески. Саме так і робили AWS, Google Cloud і Azure: вони пропонували Redis як managed-сервіс, генеруючи значний дохід, тоді як Redis Labs (компанія) конкурувала зі своїм Redis Enterprise.\n\nУ **березні 2024 р.** Redis Ltd перейшла на подвійну ліцензію для Redis **7.4**: **RSALv2** (Redis Source Available License) + **SSPLv1** (Server Side Public License). Обидві є \"source available\", але жодна не схвалена OSI як open-source. SSPL побудована за моделлю AGPL, але розширює вимогу copyleft на будь-який сервіс, що пропонує програмне забезпечення, що робить її комерційно ворожою для хмарних провайдерів. BSD одночасно була видалена.\n\nРеакція спільноти виявилась швидкою. Протягом кількох днів **Linux Foundation** оголосила **Valkey** — форк Redis **7.2.4** (останньої BSD-версії) — з AWS, Google Cloud, Oracle, Ericsson і Snap як засновниками. До кінця 2024 р. Valkey став стандартним in-memory кешем у Fedora 42, Ubuntu 26.04 LTS, Debian 13 і Arch Linux. AWS розпочав міграцію вузлів ElastiCache на Valkey (Valkey 9.0 у ElastiCache, анонсовано в травні 2026 р.).\n\nУ **травні 2025 р.** Redis додав третій варіант ліцензії — **AGPLv3** — зробивши Redis 8 доступним за tri-license: RSALv2 / SSPLv1 / AGPLv3. AGPLv3 схвалена OSI, що Redis описав як \"повернення до open source\". Кроком задоволились одні і розкритикували інші (copyleft-вимоги AGPLv3 все ще обтяжливі для SaaS). Valkey продовжив незалежну розробку.\n\nСтаном на **червень 2026 р.**:\n- **Redis 8.8.0** — найновіший реліз Redis (tri-ліцензія: RSALv2/SSPL/AGPLv3). Інтегровані модулі Search, JSON, TimeSeries і Bloom. Значні покращення продуктивності (87% швидше, 2× ops/s проти 7.x).\n- **Valkey 9.1** — найновіший реліз Valkey (BSD-3-Clause). Нова I/O threading модель, +40% throughput проти 8.1. За замовчуванням у провідних Linux-дистрибутивах і AWS ElastiCache.\n- Обидва проекти ~90% сумісні за командами, але починають розходитися на рівні API.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'Redis 8.8 (June 2026)', uk: 'Redis 8.8 (червень 2026 р.)' },
          b: { en: 'Valkey 9.1 (2026)', uk: 'Valkey 9.1 (2026 р.)' },
          rows: [
            [
              { en: 'License', uk: 'Ліцензія' },
              { en: 'Tri-license: RSALv2 / SSPLv1 / AGPLv3', uk: 'Tri-ліцензія: RSALv2 / SSPLv1 / AGPLv3' },
              { en: 'BSD-3-Clause (permissive open source)', uk: 'BSD-3-Clause (дозвільна open source)' },
            ],
            [
              { en: 'Governance', uk: 'Управління' },
              { en: 'Redis Ltd (commercial company)', uk: 'Redis Ltd (комерційна компанія)' },
              { en: 'Linux Foundation (community, non-profit)', uk: 'Linux Foundation (спільнота, некомерційна)' },
            ],
            [
              { en: 'Key features (2026)', uk: 'Ключові особливості (2026 р.)' },
              { en: 'Built-in Search/JSON/TimeSeries/Bloom; 87% faster cmds; new I/O threading', uk: 'Вбудовані Search/JSON/TimeSeries/Bloom; 87% швидше; новий I/O threading' },
              { en: 'BSD-3-Clause fork; hash-field TTL; cluster multi-DB; +40% throughput; I/O threading (v9.1)', uk: 'BSD-3-Clause форк; TTL для hash-полів; cluster multi-DB; +40% throughput; I/O threading (v9.1)' },
            ],
            [
              { en: 'Cloud defaults', uk: 'Хмарні стандарти' },
              { en: 'Redis Cloud (managed service); available on all major clouds', uk: 'Redis Cloud (managed service); доступний на всіх major clouds' },
              { en: 'Default in AWS ElastiCache; Fedora/Ubuntu/Debian/Arch default', uk: 'За замовчуванням у AWS ElastiCache; стандарт Fedora/Ubuntu/Debian/Arch' },
            ],
            [
              { en: 'Command compatibility', uk: 'Сумісність команд' },
              { en: 'Full (the source)', uk: 'Повна (вихідний проект)' },
              { en: '~90% and diverging — check before migrating', uk: '~90% і розходяться — перевіряйте перед міграцією' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Choosing Redis vs Valkey in 2026', uk: 'Вибір між Redis і Valkey у 2026 р.' },
          md: {
            en: 'For new projects on AWS/GCP/Azure, Valkey is the low-friction choice: it is the default managed offering (AWS ElastiCache, GCP Memorystore), BSD-licensed with no legal risk, and performance is on par with Redis 8. Choose Redis 8 if you need the integrated **Search** or **JSON** modules without running a separate module server, or if you have an existing Redis Cloud contract. For an on-premises production Kubernetes setup, both are available as Helm charts; evaluate based on your legal team\'s assessment of AGPLv3.',
            uk: 'Для нових проектів на AWS/GCP/Azure Valkey — вибір без зусиль: це стандартний managed-сервіс (AWS ElastiCache, GCP Memorystore), BSD-ліцензований без правового ризику, а продуктивність порівнянна з Redis 8. Обирайте Redis 8, якщо вам потрібні вбудовані модулі **Search** або **JSON** без запуску окремого сервера, або якщо у вас є існуючий контракт Redis Cloud. Для production Kubernetes on-premises — обидва доступні як Helm charts; оцінюйте на основі аналізу AGPLv3 вашою юридичною командою.',
          },
        },
      ],
    },

    // ── Topic 5: Beyond cache ─────────────────────────────────────────────
    {
      id: 'beyond-cache',
      title: { en: 'Beyond cache — locks, queues, pub/sub, rate limiting', uk: 'Поза кешем — locks, queues, pub/sub, rate limiting' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Redis/Valkey's atomic operations make it an excellent substrate for patterns far beyond caching:\n\n**Distributed locks** — `SET key value NX PX <ttl>` is an atomic \"set-if-not-exists with expiry\" operation. If it succeeds, the caller holds the lock; on failure, another process holds it. The TTL prevents deadlocks if the holder crashes. The **Redlock algorithm** (using N independent Redis/Valkey instances, acquiring a majority) improves safety in distributed setups at the cost of latency.\n\n**Rate limiting** — two common approaches:\n- *Counter window* (simplest): `INCR ip:1.2.3.4:2026010512` → check count; `EXPIRE` the key at window start. Problem: allows bursts at window boundaries.\n- *Sliding window with a Sorted Set*: `ZADD key <now_ms> <request_id>` → `ZREMRANGEBYSCORE key 0 <now_ms-window_ms>` → `ZCARD key` → compare to limit. Accurate, but O(N) per request. Redis 8.8 adds `INCREX` (atomic increment + expire) to simplify counter-window patterns.\n\n**Queues** — use a List with `LPUSH` (producer) + `BRPOP` (blocking consumer). Workers block until a job arrives, with no polling. For at-least-once delivery with acknowledgement, **Streams** (`XREADGROUP` + `XACK`) are the right tool — they keep messages until explicitly acknowledged, and allow consumer groups for parallel processing.\n\n**Pub/Sub** — `PUBLISH channel message` + `SUBSCRIBE channel`. Fire-and-forget: a message is delivered only to currently connected subscribers and is immediately discarded. **Not durable** — if no subscriber is listening, the message is lost. Use Streams (not Pub/Sub) when you need guaranteed delivery or replay. Pub/Sub suits live push notifications, chat room broadcasts, or real-time dashboards where missing a message is acceptable.",
            uk: "Атомарні операції Redis/Valkey роблять його відмінним фундаментом для патернів далеко за межами кешування:\n\n**Distributed locks** — `SET key value NX PX <ttl>` — атомарна операція \"set-if-not-exists with expiry\". Якщо вона вдається — caller тримає lock; при невдачі — інший процес. TTL запобігає deadlock, якщо holder падає. **Redlock алгоритм** (використовує N незалежних інстансів Redis/Valkey, отримуючи більшість) покращує безпеку в розподілених системах ціною latency.\n\n**Rate limiting** — два поширені підходи:\n- *Counter window* (найпростіший): `INCR ip:1.2.3.4:2026010512` → перевірити лічильник; `EXPIRE` ключ на початку вікна. Проблема: дозволяє burst на межах вікна.\n- *Sliding window з Sorted Set*: `ZADD key <now_ms> <request_id>` → `ZREMRANGEBYSCORE key 0 <now_ms-window_ms>` → `ZCARD key` → порівняти з лімітом. Точно, але O(N) за запит. Redis 8.8 додає `INCREX` (атомарний increment + expire) для спрощення counter-window патернів.\n\n**Queues** — використовуйте List з `LPUSH` (producer) + `BRPOP` (blocking consumer). Workers блокуються, поки не з'явиться задача, без polling. Для at-least-once delivery з підтвердженням **Streams** (`XREADGROUP` + `XACK`) — правильний інструмент: повідомлення зберігаються до явного підтвердження, дозволяючи consumer groups для паралельної обробки.\n\n**Pub/Sub** — `PUBLISH channel message` + `SUBSCRIBE channel`. Fire-and-forget: повідомлення доставляється лише поточним підписникам і негайно відкидається. **Не довговічний** — якщо підписник не слухає, повідомлення втрачається. Використовуйте Streams (не Pub/Sub), коли потрібна гарантована доставка або replay. Pub/Sub підходить для live push-сповіщень, broadcast у chat-кімнатах або real-time дашбордів, де пропустити повідомлення прийнятно.",
          },
        },
        {
          kind: 'code',
          lang: 'python',
          code: `import redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# ── Cache-aside ───────────────────────────────────────────────────────────
def get_user(user_id: int) -> dict:
    key = f"user:{user_id}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)           # cache hit
    user = db.query_user(user_id)           # cache miss → DB
    r.setex(key, 300, json.dumps(user))     # populate cache, TTL 5 min
    return user

# ── Distributed lock (SET NX PX) ─────────────────────────────────────────
import uuid, time

def acquire_lock(name: str, ttl_ms: int = 5000) -> str | None:
    token = str(uuid.uuid4())
    acquired = r.set(f"lock:{name}", token, nx=True, px=ttl_ms)
    return token if acquired else None

def release_lock(name: str, token: str) -> None:
    # Lua script for atomic check-and-delete (prevents releasing another owner's lock)
    lua = """
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    """
    r.eval(lua, 1, f"lock:{name}", token)

# ── Rate limiter (fixed window) ───────────────────────────────────────────
def is_rate_limited(ip: str, limit: int = 100, window_s: int = 60) -> bool:
    key = f"rl:{ip}:{int(time.time() // window_s)}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, window_s)             # only set expiry on first increment
    return count > limit

# ── Job queue (List) ──────────────────────────────────────────────────────
r.lpush("jobs", json.dumps({"type": "email", "to": "alice@example.com"}))
job_raw = r.brpop("jobs", timeout=5)       # blocks up to 5 s for a job`,
          note: {
            en: 'Always use a Lua script or MULTI/EXEC for compound atomic operations — never rely on multiple round-trips for correctness.',
            uk: 'Завжди використовуйте Lua-скрипт або MULTI/EXEC для складних атомарних операцій — ніколи не покладайтесь на кілька round-trips для коректності.',
          },
        },
        {
          kind: 'callout',
          tone: 'security',
          title: { en: 'Pub/Sub is not durable — do not use it for critical events', uk: 'Pub/Sub не довговічний — не використовуйте для критичних подій' },
          md: {
            en: "A PUBLISH message is delivered to connected subscribers and then discarded. If a subscriber is temporarily disconnected, it misses the message permanently. For any event that must not be lost (payment events, order state transitions, audit records), use **Streams** (`XADD`/`XREADGROUP`/`XACK`) — they store messages until explicitly acknowledged and support consumer groups for load-balanced processing.",
            uk: "Повідомлення PUBLISH доставляється підключеним підписникам і потім відкидається. Якщо підписник тимчасово відключений, він назавжди втрачає повідомлення. Для будь-якої події, яку не можна втратити (платіжні події, зміни стану замовлення, audit-записи), використовуйте **Streams** (`XADD`/`XREADGROUP`/`XACK`) — вони зберігають повідомлення до явного підтвердження і підтримують consumer groups для балансування навантаження.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Redis/Valkey stores all data in RAM and achieves sub-millisecond latency via a single-threaded event loop. They expose rich data structures (String, Hash, List, Set, Sorted Set, Stream) that enable server-side operations without client round-trips.',
      uk: 'Redis/Valkey зберігає всі дані в RAM і досягає sub-millisecond latency через single-threaded event loop. Вони надають багаті структури даних (String, Hash, List, Set, Sorted Set, Stream), що дають змогу серверним операціям без client round-trips.',
    },
    {
      en: 'Cache-aside is the most common caching pattern: check cache → miss → read DB → populate cache with a TTL. Cache invalidation (keeping the cache in sync on writes) remains the hardest problem.',
      uk: 'Cache-aside — найпоширеніший патерн кешування: перевірити кеш → miss → читання БД → заповнити кеш з TTL. Cache invalidation (синхронізація кешу при записах) залишається найважчою проблемою.',
    },
    {
      en: "Use allkeys-lru (or allkeys-lfu for skewed workloads) when Redis/Valkey acts as a cache. Use noeviction when it's a primary data store. In production, combine RDB + AOF for durability with fast restarts.",
      uk: "Використовуйте allkeys-lru (або allkeys-lfu для skewed навантажень), коли Redis/Valkey виступає кешем. Використовуйте noeviction, коли це основне сховище даних. У production комбінуйте RDB + AOF для durability зі швидким рестартом.",
    },
    {
      en: 'In March 2024 Redis relicensed from BSD to SSPL/RSALv2. Valkey (Linux Foundation, BSD-3-Clause) was forked from Redis 7.2.4; it is now the default in Fedora, Ubuntu, Debian, Arch, and AWS ElastiCache. Redis 8 (May 2025) added AGPLv3 as a third option.',
      uk: 'У березні 2024 р. Redis перейшов з BSD на SSPL/RSALv2. Valkey (Linux Foundation, BSD-3-Clause) був форкнутий від Redis 7.2.4; зараз є стандартом у Fedora, Ubuntu, Debian, Arch і AWS ElastiCache. Redis 8 (травень 2025 р.) додав AGPLv3 як третій варіант.',
    },
    {
      en: 'Redis/Valkey is not just a cache: it is a platform for distributed locks (SET NX PX), rate limiting (INCR + EXPIRE, Sorted Set sliding window), job queues (List + BRPOP), and durable messaging (Streams + consumer groups). Pub/Sub is fire-and-forget and not durable.',
      uk: 'Redis/Valkey — не просто кеш: це платформа для distributed locks (SET NX PX), rate limiting (INCR + EXPIRE, Sorted Set sliding window), job queues (List + BRPOP) і durable messaging (Streams + consumer groups). Pub/Sub — fire-and-forget і не довговічний.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Using Pub/Sub for durable event delivery', uk: 'Використання Pub/Sub для довговічної доставки подій' },
      body: {
        en: "Pub/Sub is a fire-and-forget broadcast: disconnected consumers miss messages permanently, and there is no persistence or replay. For any event that cannot be lost, use Redis/Valkey Streams with consumer groups and XACK.",
        uk: "Pub/Sub — це fire-and-forget broadcast: відключені consumers назавжди втрачають повідомлення, немає persistence або replay. Для будь-якої події, яку не можна втратити, використовуйте Redis/Valkey Streams з consumer groups і XACK.",
      },
    },
    {
      title: { en: 'Setting maxmemory-policy to noeviction on a cache', uk: 'Встановлення maxmemory-policy noeviction для кешу' },
      body: {
        en: "With `noeviction`, when Redis/Valkey runs out of memory, new writes return `OOM command not allowed`. If your instance is used as a cache, use `allkeys-lru` or `allkeys-lfu` so the server gracefully evicts old data instead of returning errors.",
        uk: "З `noeviction`, коли Redis/Valkey вичерпує пам'ять, нові записи повертають `OOM command not allowed`. Якщо ваш інстанс використовується як кеш, використовуйте `allkeys-lru` або `allkeys-lfu`, щоб сервер плавно видаляв старі дані замість повернення помилок.",
      },
    },
    {
      title: { en: 'Treating Redis/Valkey as a primary database without AOF + RDB', uk: 'Використання Redis/Valkey як основної бази даних без AOF + RDB' },
      body: {
        en: "Redis/Valkey stores data in memory. Without persistence (RDB and/or AOF), a crash or restart means total data loss. If Redis/Valkey holds primary data (not just cache), enable at minimum `appendfsync everysec`. For critical data, consider whether a purpose-built persistent store is more appropriate.",
        uk: "Redis/Valkey зберігає дані в пам'яті. Без persistence (RDB та/або AOF) збій або рестарт означає повну втрату даних. Якщо Redis/Valkey тримає основні дані (не лише кеш), увімкніть принаймні `appendfsync everysec`. Для критичних даних розгляньте, чи не є більш доречним спеціалізоване persistent сховище.",
      },
    },
  ],

  interview: [
    {
      q: {
        en: 'Describe the cache-aside pattern and when you would use write-through instead.',
        uk: 'Опишіть патерн cache-aside і коли б ви використали write-through замість нього.',
      },
      a: {
        en: 'Cache-aside (lazy loading): the application checks the cache, reads the DB on a miss, populates the cache, and returns. It only caches data that is actually read, minimises cache size, and is the most flexible pattern. Use write-through when you cannot tolerate cache misses after a write (e.g. after a user updates their profile, the next read must not return the stale version). Write-through ensures the cache is populated synchronously on every write but at the cost of writing to both the cache and DB on every mutation — even for data that may never be read.',
        uk: 'Cache-aside (lazy loading): застосунок перевіряє кеш, читає БД при miss, заповнює кеш і повертає результат. Кешує лише ті дані, які справді читаються, мінімізує розмір кешу, є найгнучкішим патерном. Використовуйте write-through, коли не можна допустити cache miss після запису (наприклад, після оновлення профілю користувач при наступному читанні не повинен отримати застарілу версію). Write-through гарантує синхронне заповнення кешу при кожному записі, але ціною запису і в кеш, і в БД при кожній мутації — навіть для даних, які можуть ніколи не читатися.',
      },
      level: 'middle',
    },
    {
      q: {
        en: 'What is the Redis → Valkey split about, and how would you choose between them today?',
        uk: 'Про що розкол Redis → Valkey і як би ви обирали між ними сьогодні?',
      },
      a: {
        en: "In March 2024, Redis Ltd relicensed Redis from BSD-3-Clause to SSPL v1 + RSALv2, making it commercially hostile for cloud providers. The Linux Foundation forked it as Valkey (BSD-3-Clause) with backing from AWS, GCP, Oracle. As of mid-2026: Valkey 9.1 is the default in major Linux distros and AWS ElastiCache; Redis 8 (tri-licensed with AGPLv3 added May 2025) has integrated Search/JSON/TimeSeries modules. For cloud-managed deployments (AWS/GCP), Valkey is the path of least resistance. For Redis-specific integrated modules without running a separate module server, Redis 8 is the better fit. Both are ~90% command-compatible, but new APIs are diverging.",
        uk: "У березні 2024 р. Redis Ltd перейшла з BSD-3-Clause на SSPL v1 + RSALv2, зробивши продукт комерційно ворожим для хмарних провайдерів. Linux Foundation форкнула його як Valkey (BSD-3-Clause) за підтримки AWS, GCP, Oracle. Станом на середину 2026 р.: Valkey 9.1 є стандартом у основних Linux-дистрибутивах і AWS ElastiCache; Redis 8 (tri-ліцензія з AGPLv3, доданою в травні 2025 р.) має інтегровані модулі Search/JSON/TimeSeries. Для cloud-managed deployments (AWS/GCP) Valkey — шлях найменшого опору. Для специфічних для Redis вбудованих модулів без окремого сервера модулів Redis 8 підходить краще. Обидва мають ~90% сумісності команд, але нові API розходяться.",
      },
      level: 'middle',
    },
    {
      q: {
        en: 'When should you use Redis Streams instead of a List or Pub/Sub for a queue?',
        uk: 'Коли варто використовувати Redis Streams замість List або Pub/Sub для queue?',
      },
      a: {
        en: 'Use Streams when you need at-least-once delivery with acknowledgement. Pub/Sub is fire-and-forget (messages lost if no subscriber, no replay). A List + BRPOP gives a simple FIFO queue but offers no acknowledgement — a crash between BRPOP and processing loses the job. Streams (XADD / XREADGROUP / XACK) solve both: messages are stored until XACK, failed consumers get their pending messages reassigned (XCLAIM), and consumer groups enable parallel workers. Choose Streams for any production queue where losing a message is unacceptable.',
        uk: "Використовуйте Streams, коли потрібна at-least-once доставка з підтвердженням. Pub/Sub — fire-and-forget (повідомлення втрачаються, якщо немає підписника, немає replay). List + BRPOP дає простий FIFO-queue, але без підтвердження — збій між BRPOP і обробкою втрачає задачу. Streams (XADD / XREADGROUP / XACK) вирішують обидва: повідомлення зберігаються до XACK, failed consumers отримують свої pending повідомлення перерозподіленими (XCLAIM), consumer groups дозволяють паралельних workers. Обирайте Streams для будь-якої production queue, де втрата повідомлення неприйнятна.",
      },
      level: 'senior',
    },
  ],

  seeAlso: ['m3-sql-vs-nosql', 'm17-acid-wal', 'm20-distributed-tx', 'm27-wide-column'],

  sources: [
    {
      title: 'Valkey 9.0 — Linux Foundation press release',
      url: 'https://www.linuxfoundation.org/press/valkey-9.0-delivers-performance-and-resiliency-for-real-time-workloads',
    },
    {
      title: 'Redis is now available under AGPLv3 — Redis blog (May 2025)',
      url: 'https://redis.io/blog/agplv3/',
    },
    {
      title: 'Redis 8 GA: Fast, scalable, and feature-rich',
      url: 'https://redis.io/blog/redis-8-ga/',
    },
    {
      title: 'Valkey 9.0 for Amazon ElastiCache — AWS (May 2026)',
      url: 'https://aws.amazon.com/blogs/database/announcing-valkey-9-0-for-amazon-elasticache/',
    },
    {
      title: 'Redis data types — Redis docs',
      url: 'https://redis.io/docs/latest/develop/data-types/',
    },
    {
      title: 'Redis persistence (RDB and AOF) — Redis docs',
      url: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/',
    },
  ],
};
