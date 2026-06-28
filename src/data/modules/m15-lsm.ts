import type { Module } from '../types';

/*
 * M15 · LSM-trees & write-optimized storage — Section III (S8). Authored EN first, UA second;
 * technical terms stay English in both. Facts web-verified 2026-06-24 (see `sources`):
 *  - Origin: O'Neil, Cheng, Gawlick, O'Neil, "The Log-Structured Merge-Tree (LSM-Tree)",
 *    Acta Informatica 33(4):351–385, 1996 — a write-optimized structure that buffers and batches.
 *  - Write path: append to WAL (durability) + insert into an in-memory, sorted MEMTABLE (a skiplist
 *    in RocksDB). A full memtable is frozen and FLUSHED as one immutable, sorted SSTable (Sorted
 *    String Table) — a single sequential write. Updates/deletes are NOT in place: a new version is
 *    written; a delete writes a TOMBSTONE marker. Newest version wins.
 *  - COMPACTION merges SSTables in the background, keeping the newest version per key, dropping
 *    superseded versions and obsolete tombstones, reclaiming space. Two families:
 *      · Leveled (RocksDB/LevelDB default): levels ~10× each, non-overlapping within a level (except
 *        L0) → low space amp, predictable reads, but HIGH write amp (~10–30×).
 *      · Size-tiered / Universal (Cassandra STCS default): merge similarly-sized runs → low write
 *        amp, but higher space amp (up to ~2× at a major compaction) and read amp.
 *  - Read path: memtable → SSTables newest-first. Each SSTable has a BLOOM FILTER (probabilistic
 *    membership: "no" is definite → skip with zero disk reads; "maybe" → look) + a sparse/fence
 *    index. Bloom filters turn the worst case (point-lookup of an absent key) into an instant miss.
 *  - The amplification triangle / RUM conjecture (Athanassoulis et al., EDBT 2016): optimize two of
 *    Read / Update(write) / Memory(space); the third worsens. Compaction strategy is the knob.
 *  - B-Tree = update-in-place, read-optimized, random writes. LSM = buffer-then-sort, write-optimized,
 *    sequential writes. Users: RocksDB, LevelDB, Cassandra/ScyllaDB, HBase; embedded under MyRocks,
 *    TiKV/TiDB, CockroachDB (Pebble).
 * Signature module: hero ★ LSM compaction stepper (key 'lsm-tree') + figure 'lsm-vs-btree'.
 */
export const m15: Module = {
  id: 'm15-lsm',
  num: 15,
  section: 's3-storage',
  order: 4,
  level: 'staff',
  signature: true,
  title: { en: 'LSM-trees & write-optimized storage', uk: 'LSM-trees і зберігання, оптимізоване під запис' },
  tagline: {
    en: 'Memtable → SSTable → compaction; read/write/space amplification vs the B-Tree.',
    uk: 'Memtable → SSTable → compaction; read/write/space amplification проти B-Tree.',
  },
  readMins: 13,
  mentalModel: {
    en: 'Buffer writes in memory, sort them later — trade read effort for write speed.',
    uk: 'Буферизуйте записи в памʼяті, сортуйте пізніше — міняйте зусилля читання на швидкість запису.',
  },
  topics: [
    {
      id: 'the-write-problem',
      title: { en: 'The write problem', uk: 'Проблема запису' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A B-Tree (M13) is superb at reads, but it pays for them on the write side. To insert or update a row, it must find the **right leaf page** — somewhere deep in the tree, almost certainly not the one you touched last — and modify it **in place**. On a busy table those target pages are scattered all over the disk, so a write-heavy workload turns into a storm of **random** page writes, each preceded by a WAL record. Random I/O is the slow case on every storage medium (M12), and as the working set outgrows RAM the B-Tree's write throughput falls off a cliff.",
            uk: "B-Tree (M13) чудовий на читаннях, але платить за них на боці запису. Щоб вставити чи оновити рядок, він мусить знайти **потрібну leaf page** — десь глибоко в дереві, майже напевно не ту, якої ви торкалися востаннє — і змінити її **на місці**. На завантаженій таблиці ці цільові pages розкидані по всьому диску, тож write-heavy навантаження перетворюється на бурю **випадкових** записів pages, кожному передує WAL-запис. Випадковий I/O — найповільніший випадок на будь-якому носії (M12), і коли робочий набір переростає RAM, пропускна здатність запису B-Tree падає в прірву.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "The **log-structured merge-tree (LSM-tree)** — introduced by O'Neil, Cheng, Gawlick and O'Neil in 1996 — attacks exactly this. Its insight: stop fighting the disk for random writes. **Buffer writes in memory, and write to disk only in large, sorted, sequential batches.** Reads then have to do more work to reassemble the current value from several batches, but writes become cheap and sequential. It is a deliberate trade — give up some read efficiency to win a lot of write throughput — and it is the storage engine under most write-optimized databases of the last decade.",
            uk: "**Log-structured merge-tree (LSM-tree)** — представлений O'Neil, Cheng, Gawlick і O'Neil у 1996 — атакує саме це. Його ідея: припинити боротися з диском за випадкові записи. **Буферизуйте записи в памʼяті й пишіть на диск лише великими, відсортованими, послідовними партіями.** Читанням тоді доводиться робити більше роботи, щоб зібрати поточне значення з кількох партій, але записи стають дешевими й послідовними. Це свідомий компроміс — віддати трохи ефективності читання, щоб виграти багато пропускної здатності запису — і це storage engine під більшістю write-optimized баз останнього десятиліття.",
          },
        },
        {
          kind: 'figure',
          fig: 'lsm-vs-btree',
          caption: {
            en: 'Two write paths. The B-Tree seeks to one leaf page and overwrites it in place — a random write. The LSM-tree appends to an in-memory memtable, then flushes the whole sorted batch as one new immutable SSTable and merges later — sequential writes only.',
            uk: 'Два шляхи запису. B-Tree шукає одну leaf page і переписує її на місці — випадковий запис. LSM-tree додає в memtable у памʼяті, тоді скидає всю відсортовану партію як один новий immutable SSTable і зливає пізніше — лише послідовні записи.',
          },
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Sequential beats random by orders of magnitude', uk: 'Послідовне бʼє випадкове на порядки' },
          md: {
            en: "The whole bet rests on the access-cost hierarchy from M12: sequential writes are dramatically faster than random ones, on spinning disks (no seeks) and on SSDs alike (fewer, larger erase-block writes, less write amplification at the flash layer). An LSM converts a random-write workload into a sequential-write one and lets a background process pay the sorting cost off the critical path. That is the entire trick — everything else is bookkeeping to make reads tolerable.",
            uk: "Уся ставка спирається на ієрархію вартості доступу з M12: послідовні записи драматично швидші за випадкові — і на дисках, що крутяться (без seeks), і на SSD (менше, більші записи erase-block, менша write amplification на рівні flash). LSM перетворює навантаження випадкового запису на послідовне й дозволяє фоновому процесу платити вартість сортування поза критичним шляхом. Це весь фокус — решта це бухгалтерія, щоб зробити читання стерпними.",
          },
        },
      ],
    },
    {
      id: 'lsm-design',
      title: { en: 'Memtable, SSTable, compaction', uk: 'Memtable, SSTable, compaction' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "An LSM has three moving parts. **(1) The memtable** is an in-memory, sorted structure (a skiplist or balanced tree) that absorbs every write. To stay durable despite living in RAM, each write is first appended to a **WAL** (M17) — so a crash loses nothing. **(2) When the memtable fills**, it is frozen and **flushed** to disk as one **SSTable** (Sorted String Table): an immutable, sorted file written in a single sequential pass. A fresh memtable takes over. **(3) Compaction** is the background process that merges SSTables together, and it is what keeps the whole thing from degenerating into an ever-growing pile of overlapping files.",
            uk: "LSM має три рухомі частини. **(1) Memtable** — це впорядкована структура в памʼяті (skiplist чи збалансоване дерево), що вбирає кожен запис. Щоб лишатися durable, попри життя в RAM, кожен запис спершу додається у **WAL** (M17) — тож збій не втрачає нічого. **(2) Коли memtable заповнюється**, він заморожується й **скидається** на диск як один **SSTable** (Sorted String Table): immutable, відсортований файл, записаний за один послідовний прохід. Естафету переймає свіжий memtable. **(3) Compaction** — фоновий процес, що зливає SSTables разом, і саме він не дає всьому виродитися в дедалі більшу купу перекривних файлів.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "Crucially, **nothing is ever updated in place.** An update writes a *new* version of the key into the current memtable; the old version still sits in some older SSTable. A **delete** writes a small marker called a **tombstone** — you cannot erase a key from an immutable file, so you record the *intent* to delete and let compaction apply it later. The rule that makes this coherent is simple: **the newest version of a key wins.** Step through the sim: writes fill the memtable, a full memtable flushes to an SSTable, two SSTables compact into one — newest versions kept, the tombstone applied and purged, dead space reclaimed.",
            uk: "Найважливіше: **ніщо ніколи не оновлюється на місці.** Оновлення пише *нову* версію ключа в поточний memtable; стара версія досі лежить у якомусь старішому SSTable. **Видалення** пише маленький маркер — **tombstone**: ви не можете стерти ключ з immutable-файлу, тож записуєте *намір* видалити й даєте compaction застосувати це пізніше. Правило, що робить це узгодженим, просте: **найновіша версія ключа перемагає.** Пройдіть симуляцію кроками: записи заповнюють memtable, повний memtable скидається в SSTable, два SSTables зливаються в один — найновіші версії збережено, tombstone застосовано й вичищено, мертве місце звільнено.",
          },
        },
        {
          kind: 'sim',
          sim: 'lsm-tree',
        },
        {
          kind: 'prose',
          md: {
            en: "Compaction comes in two broad **strategies**, and the choice is the single biggest tuning decision in an LSM. **Leveled compaction** (RocksDB and LevelDB's default) keeps a small set of size-tiered files at L0 and then a series of levels, each roughly ten times larger than the one above, where the files within a level have **non-overlapping** key ranges. It rewrites data as it cascades down the levels, which costs a lot of write work but keeps **space tight** and reads **predictable** (at most one file per level to check). **Size-tiered compaction** (Cassandra's default, also RocksDB's *universal* mode) instead waits until several **similarly-sized** SSTables accumulate, then merges them into one bigger SSTable. It writes far less, but leaves more overlapping files around — so it pays in space and read amplification.",
            uk: "Compaction буває двох широких **стратегій**, і цей вибір — найбільше рішення з тюнінгу в LSM. **Leveled compaction** (дефолт RocksDB і LevelDB) тримає малий набір size-tiered файлів на L0, а далі серію рівнів, кожен приблизно вдесятеро більший за попередній, де файли всередині рівня мають **неперекривні** діапазони ключів. Він переписує дані, доки вони каскадом спускаються рівнями, що коштує багато роботи запису, зате тримає **сховище щільним**, а читання **передбачуваними** (щонайбільше один файл на рівень для перевірки). **Size-tiered compaction** (дефолт Cassandra, а також *universal*-режим RocksDB) натомість чекає, доки назбирається кілька **схожих за розміром** SSTables, тоді зливає їх в один більший SSTable. Він пише значно менше, зате лишає більше перекривних файлів — тож платить простором і read amplification.",
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- Cassandra (CQL): the compaction strategy is an explicit, per-table choice.
-- Write-heavy / append-only (events, time-series) → size-tiered writes least:
CREATE TABLE events (
  id uuid PRIMARY KEY,
  body text
) WITH compaction = { 'class': 'SizeTieredCompactionStrategy' };

-- Read-heavy, update-in-place-ish (needs tight space + predictable reads) → leveled:
ALTER TABLE events
  WITH compaction = { 'class': 'LeveledCompactionStrategy' };

-- Time-series with a TTL → time-window groups SSTables by time, so whole
-- expired windows drop at once instead of compacting forever:
--   { 'class': 'TimeWindowCompactionStrategy', 'compaction_window_size': '1',
--     'compaction_window_unit': 'DAYS' }`,
          note: {
            en: 'The strategy is a workload decision, not a default to ignore: size-tiered for write-heavy/append, leveled for read-heavy/space-sensitive, time-window for TTL’d time-series. Same engine, very different amplification.',
            uk: 'Стратегія — це рішення під навантаження, а не дефолт, який можна ігнорувати: size-tiered для write-heavy/append, leveled для read-heavy/чутливих до простору, time-window для time-series з TTL. Той самий движок — дуже різна amplification.',
          },
        },
      ],
    },
    {
      id: 'reads-bloom-tombstones',
      title: { en: 'Reads: Bloom filters & tombstones', uk: 'Читання: Bloom filters і tombstones' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Reads are where the LSM pays its bill. The current value of a key could be in the memtable, or in any SSTable, so a point lookup checks the **memtable first**, then SSTables **newest to oldest**, and stops at the first hit (the newest version). Naïvely, a key that does *not* exist is the worst case — you would touch every level before concluding it is absent. Two structures rescue the read path. A **sparse / fence-pointer index** per SSTable narrows the search to one block. And a **Bloom filter** per SSTable answers the membership question without reading the file at all.",
            uk: "Читання — там, де LSM сплачує рахунок. Поточне значення ключа може бути в memtable або в будь-якому SSTable, тож точковий пошук перевіряє **спершу memtable**, тоді SSTables **від найновіших до найстаріших** і спиняється на першому влучанні (найновіша версія). Наївно, ключ, якого *немає*, — найгірший випадок: ви торкнулися б кожного рівня, перш ніж висновити, що його нема. Дві структури рятують шлях читання. **Sparse / fence-pointer index** на кожен SSTable звужує пошук до одного блоку. А **Bloom filter** на кожен SSTable відповідає на питання належності, взагалі не читаючи файл.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'A Bloom filter: “definitely not” or “maybe”', uk: 'Bloom filter: «точно ні» або «можливо»' },
          md: {
            en: "A Bloom filter is a compact, probabilistic set: ask it whether a key is in an SSTable and it answers **“definitely not”** (a true negative — skip the file entirely, zero disk reads) or **“maybe”** (it might be a false positive, so you do read the file to check). It never returns a false negative, which is exactly the guarantee you need: a “no” is always safe to trust. With Bloom filters in front, a lookup for an absent key skips almost every SSTable instantly — turning the LSM's worst case into a near-free miss. This is why production engines keep the Bloom filters of hot SSTables resident in memory.",
            uk: "Bloom filter — компактна імовірнісна множина: спитайте, чи є ключ у SSTable, і вона відповість **«точно ні»** (істинний негатив — пропустити файл цілком, нуль читань диска) або **«можливо»** (може бути false positive, тож ви таки читаєте файл для перевірки). Вона ніколи не повертає false negative — саме та гарантія, що потрібна: «ні» завжди безпечно довіряти. З Bloom filters попереду пошук відсутнього ключа миттєво пропускає майже кожен SSTable — перетворюючи найгірший випадок LSM на майже безкоштовний промах. Тому продакшн-движки тримають Bloom filters гарячих SSTables у памʼяті.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "**Tombstones** have a sting in the tail. Because a delete is just another record, a range scan over a key range that was heavily deleted can still have to read — and skip — thousands of tombstones until compaction finally purges them. In Cassandra this is a classic production incident: a queue-like table where rows are written and quickly deleted accumulates tombstones faster than compaction clears them, and read latency collapses. The lesson is that in an LSM a delete is **not** free or instantaneous; it is a deferred write that the read path keeps paying for until compaction catches up.",
            uk: "**Tombstones** мають жало в хвості. Оскільки видалення — це лише ще один запис, range scan по діапазону ключів, який рясно видаляли, усе одно може мусити прочитати — і пропустити — тисячі tombstones, доки compaction нарешті їх не вичистить. У Cassandra це класичний продакшн-інцидент: черго-подібна таблиця, де рядки пишуть і швидко видаляють, накопичує tombstones швидше, ніж compaction їх прибирає, і latency читання обвалюється. Урок: у LSM видалення **не** безкоштовне й не миттєве; це відкладений запис, за який шлях читання платить, доки compaction не наздожене.",
          },
        },
      ],
    },
    {
      id: 'amplification-triangle',
      title: { en: 'The amplification triangle', uk: 'Трикутник amplification' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Every storage engine lives inside a three-way trade between **read amplification** (how many physical reads per logical read), **write amplification** (how many bytes written per byte of user data), and **space amplification** (how many bytes on disk per byte of live data). The **RUM conjecture** (Athanassoulis et al., 2016) states it formally: you can optimize for two of Read, Update and Memory, but improving two forces the third to get worse. There is no free lunch — only a choice of which cost to pay.",
            uk: "Кожен storage engine живе всередині тристороннього компромісу між **read amplification** (скільки фізичних читань на логічне читання), **write amplification** (скільки байтів записано на байт даних користувача) і **space amplification** (скільки байтів на диску на байт живих даних). **RUM conjecture** (Athanassoulis та ін., 2016) формулює це строго: можна оптимізувати два з Read, Update і Memory, але покращення двох змушує третій погіршитися. Безкоштовного сиру нема — є лише вибір, яку ціну платити.",
          },
        },
        {
          kind: 'prose',
          md: {
            en: "This is exactly the knob the compaction strategy turns, and the sim's meters show it. **Leveled** compaction rewrites data repeatedly as it sinks through the levels, so it spends **write** amplification to buy **low space** and **low read** amplification — good for read-heavy, space-sensitive stores. **Size-tiered** compaction merges rarely, so it spends **space** and **read** amplification to buy **low write** amplification — good for write-heavy ingest and time-series. The B-Tree sits at a different corner entirely: near-optimal reads and space, but it pays write amplification through random in-place page writes.",
            uk: "Це саме той регулятор, що його крутить стратегія compaction, і лічильники симуляції це показують. **Leveled** compaction багаторазово переписує дані, доки вони осідають рівнями, тож витрачає **write** amplification, щоб купити **низьку space** і **низьку read** amplification — добре для read-heavy, чутливих до простору сховищ. **Size-tiered** compaction зливає рідко, тож витрачає **space** і **read** amplification, щоб купити **низьку write** amplification — добре для write-heavy завантаження й time-series. B-Tree сидить узагалі в іншому куті: майже оптимальні читання й простір, але платить write amplification через випадкові записи pages на місці.",
          },
        },
        {
          kind: 'compare',
          a: { en: 'B-Tree (M13)', uk: 'B-Tree (M13)' },
          b: { en: 'LSM-tree', uk: 'LSM-tree' },
          rows: [
            [
              { en: 'Write path', uk: 'Шлях запису' },
              { en: 'Update the leaf page in place — random I/O', uk: 'Оновити leaf page на місці — випадковий I/O' },
              { en: 'Append to memtable, flush sorted — sequential I/O', uk: 'Додати в memtable, скинути відсортовано — послідовний I/O' },
            ],
            [
              { en: 'Read path', uk: 'Шлях читання' },
              { en: 'One O(log n) descent to a single page', uk: 'Один спуск O(log n) до однієї page' },
              { en: 'Memtable + several SSTables, Bloom-filtered', uk: 'Memtable + кілька SSTables, з Bloom-filter' },
            ],
            [
              { en: 'Optimized for', uk: 'Оптимізований під' },
              { en: 'Reads & range scans (OLTP point/range)', uk: 'Читання й range scans (OLTP point/range)' },
              { en: 'High-volume writes & ingest', uk: 'Великий обсяг записів та ingest' },
            ],
            [
              { en: 'Pays in', uk: 'Платить' },
              { en: 'Write amplification (random writes)', uk: 'Write amplification (випадкові записи)' },
              { en: 'Read & space amplification (mitigated by compaction + Bloom)', uk: 'Read і space amplification (помʼякшено compaction + Bloom)' },
            ],
            [
              { en: 'Delete', uk: 'Видалення' },
              { en: 'Remove the entry immediately', uk: 'Прибрати запис одразу' },
              { en: 'Write a tombstone; purge later at compaction', uk: 'Записати tombstone; вичистити пізніше на compaction' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Don’t reach for an LSM by reflex', uk: 'Не хапайтеся за LSM рефлекторно' },
          md: {
            en: "“Write-optimized” is not “better.” If your workload is read-heavy with frequent point lookups and updates — the typical OLTP shape — a B-Tree (PostgreSQL, InnoDB) is usually the right default; its reads are simpler and its space is tighter. Reach for an LSM when ingestion rate is the binding constraint: time-series, event logs, metrics, high-write key-value. Many systems even let you choose per table. Match the structure to the *dominant* operation, not to which one sounds more modern.",
            uk: "«Write-optimized» — не «краще». Якщо ваше навантаження read-heavy з частими точковими пошуками й оновленнями — типова форма OLTP — B-Tree (PostgreSQL, InnoDB) зазвичай правильний дефолт; його читання простіші, а простір щільніший. Беріть LSM, коли темп вставки — звʼязувальне обмеження: time-series, логи подій, метрики, high-write key-value. Багато систем навіть дають обрати на рівні таблиці. Підбирайте структуру під *домінантну* операцію, а не під ту, що звучить сучасніше.",
          },
        },
      ],
    },
    {
      id: 'who-uses-it',
      title: { en: 'Who uses it', uk: 'Хто це використовує' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The LSM is the quiet workhorse beneath a surprising amount of modern infrastructure. **RocksDB** — Facebook's fork of Google's **LevelDB** — is the embeddable LSM engine that shows up everywhere: it backs **MyRocks** (LSM storage for MySQL), **TiKV** (the key-value layer under TiDB), Kafka Streams state stores, and countless services. **Cassandra** and its C++-rewritten cousin **ScyllaDB** are wide-column databases (M27) built LSM-first, as is **HBase**. **CockroachDB** runs on **Pebble**, a RocksDB-inspired LSM written in Go. Whenever you read that a database is optimized for high write throughput, an LSM is almost always the reason.",
            uk: "LSM — тихий робочий кінь під подиву гідною кількістю сучасної інфраструктури. **RocksDB** — форк Facebook від Google **LevelDB** — це вбудовуваний LSM-движок, що зʼявляється всюди: він стоїть за **MyRocks** (LSM-сховище для MySQL), **TiKV** (key-value шар під TiDB), state stores у Kafka Streams і незліченних сервісах. **Cassandra** та її переписана на C++ родичка **ScyllaDB** — wide-column бази (M27), побудовані LSM-first, як і **HBase**. **CockroachDB** працює на **Pebble**, LSM у стилі RocksDB, написаному на Go. Щойно ви читаєте, що база оптимізована під високу пропускну здатність запису, — майже завжди причина саме LSM.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Where LSM-trees show up — and what they are tuned for.',
            uk: 'Де зʼявляються LSM-trees — і під що вони налаштовані.',
          },
          head: [
            { en: 'Engine / system', uk: 'Движок / система' },
            { en: 'Role', uk: 'Роль' },
            { en: 'Default compaction', uk: 'Дефолтна compaction' },
          ],
          rows: [
            [
              { en: 'LevelDB / RocksDB', uk: 'LevelDB / RocksDB' },
              { en: 'Embeddable KV engine (the LSM library others build on)', uk: 'Вбудовуваний KV-движок (LSM-бібліотека, на якій будують інші)' },
              { en: 'Leveled', uk: 'Leveled' },
            ],
            [
              { en: 'Cassandra / ScyllaDB', uk: 'Cassandra / ScyllaDB' },
              { en: 'Wide-column distributed store (M27)', uk: 'Wide-column розподілене сховище (M27)' },
              { en: 'Size-tiered (STCS)', uk: 'Size-tiered (STCS)' },
            ],
            [
              { en: 'MyRocks', uk: 'MyRocks' },
              { en: 'RocksDB storage engine for MySQL', uk: 'RocksDB storage engine для MySQL' },
              { en: 'Leveled', uk: 'Leveled' },
            ],
            [
              { en: 'TiKV / TiDB', uk: 'TiKV / TiDB' },
              { en: 'Distributed KV layer under a NewSQL DB (M30)', uk: 'Розподілений KV-шар під NewSQL БД (M30)' },
              { en: 'Leveled (RocksDB)', uk: 'Leveled (RocksDB)' },
            ],
            [
              { en: 'CockroachDB (Pebble)', uk: 'CockroachDB (Pebble)' },
              { en: 'RocksDB-inspired LSM in Go (M30)', uk: 'LSM у стилі RocksDB на Go (M30)' },
              { en: 'Leveled', uk: 'Leveled' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'The same idea, one layer up: the WAL itself', uk: 'Та сама ідея, на рівень вище: сам WAL' },
          md: {
            en: "Once you see “buffer in memory, write sequentially, reconcile later,” you start seeing it everywhere. PostgreSQL's own **WAL** (M17) is log-structured: it appends change records sequentially and a checkpoint reconciles them into the heap later — the same trade, applied to durability rather than to the primary index. Kafka is a log. Even a B-Tree database leans on sequential logging for its writes. The LSM just takes the principle all the way and makes the log-structured store the *primary* data structure, not a sidecar.",
            uk: "Щойно ви бачите «буферизуй у памʼяті, пиши послідовно, узгоджуй пізніше», ви починаєте бачити це всюди. Власний **WAL** PostgreSQL (M17) log-structured: він послідовно додає записи змін, а checkpoint узгоджує їх у heap пізніше — той самий компроміс, застосований до durability, а не до первинного index. Kafka — це лог. Навіть база на B-Tree спирається на послідовне логування для своїх записів. LSM просто доводить принцип до кінця й робить log-structured сховище *первинною* структурою даних, а не причепом.",
          },
        },
      ],
    },
  ],
  keyPoints: [
    {
      en: 'An LSM-tree trades read effort for write speed: buffer writes in an in-memory memtable (WAL-backed for durability), flush a full memtable as one immutable sorted SSTable — sequential I/O instead of the B-Tree’s random in-place page writes.',
      uk: 'LSM-tree міняє зусилля читання на швидкість запису: буферизує записи в memtable у памʼяті (з WAL для durability), скидає повний memtable як один immutable відсортований SSTable — послідовний I/O замість випадкових записів pages на місці у B-Tree.',
    },
    {
      en: 'Nothing is updated in place: updates write a new version, deletes write a tombstone, and the newest version wins. Compaction merges SSTables in the background — keeping newest versions, purging tombstones, reclaiming space.',
      uk: 'Ніщо не оновлюється на місці: оновлення пишуть нову версію, видалення пишуть tombstone, і найновіша версія перемагає. Compaction зливає SSTables у фоні — зберігаючи найновіші версії, вичищаючи tombstones, звільняючи місце.',
    },
    {
      en: 'Reads check the memtable then SSTables newest-first; a Bloom filter per SSTable answers “definitely not / maybe”, so a lookup for an absent key skips almost every file with zero disk reads.',
      uk: 'Читання перевіряють memtable, тоді SSTables від найновіших; Bloom filter на кожен SSTable відповідає «точно ні / можливо», тож пошук відсутнього ключа пропускає майже кожен файл з нулем читань диска.',
    },
    {
      en: 'The amplification triangle (RUM conjecture): you optimize two of read / write / space and the third worsens. Leveled compaction = high write amp, low space/read (RocksDB default); size-tiered = low write amp, higher space/read (Cassandra default).',
      uk: 'Трикутник amplification (RUM conjecture): оптимізуєте два з read / write / space, третій гіршає. Leveled compaction = висока write amp, низькі space/read (дефолт RocksDB); size-tiered = низька write amp, вищі space/read (дефолт Cassandra).',
    },
    {
      en: 'LSM = write-optimized (time-series, logs, metrics, high ingest); B-Tree = read-optimized (typical OLTP). It powers RocksDB/LevelDB, Cassandra/ScyllaDB, MyRocks, TiKV, CockroachDB (Pebble). Choose by the dominant operation.',
      uk: 'LSM = write-optimized (time-series, логи, метрики, високий ingest); B-Tree = read-optimized (типовий OLTP). Він живить RocksDB/LevelDB, Cassandra/ScyllaDB, MyRocks, TiKV, CockroachDB (Pebble). Обирайте за домінантною операцією.',
    },
  ],
  pitfalls: [
    {
      title: { en: 'Treating an LSM delete as instant and free', uk: 'Вважати видалення в LSM миттєвим і безкоштовним' },
      body: {
        en: 'A delete writes a tombstone, not a removal. Until compaction applies and purges it, the dead data still occupies space and — worse — range scans must read through the tombstones, so a delete-heavy or queue-like table can suffer collapsing read latency (the classic Cassandra tombstone incident). Model deletes as deferred writes, and design TTL/time-window compaction for high-churn data.',
        uk: 'Видалення пише tombstone, а не прибирання. Доки compaction його не застосує й не вичистить, мертві дані досі займають місце і — гірше — range scans мусять читати крізь tombstones, тож таблиця з рясними видаленнями чи черго-подібна може страждати від обвалу latency читання (класичний tombstone-інцидент Cassandra). Моделюйте видалення як відкладені записи й проєктуйте TTL/time-window compaction для даних з високою плинністю.',
      },
    },
    {
      title: { en: 'Choosing an LSM for a read-heavy OLTP workload', uk: 'Обирати LSM для read-heavy OLTP навантаження' },
      body: {
        en: '“Write-optimized” is a trade, not an upgrade. For point reads and updates over a working set with low write volume, a B-Tree gives simpler reads and tighter space. An LSM earns its keep only when write/ingest throughput is the binding constraint. Picking it for a CRUD app with modest writes buys read and space amplification you did not need.',
        uk: '«Write-optimized» — це компроміс, а не апгрейд. Для точкових читань і оновлень над робочим набором з малим обсягом запису B-Tree дає простіші читання й щільніший простір. LSM виправдовує себе лише коли пропускна здатність запису/ingest — звʼязувальне обмеження. Обрати його для CRUD-застосунку зі скромними записами — купити read і space amplification, які вам не були потрібні.',
      },
    },
    {
      title: { en: 'Ignoring the compaction strategy', uk: 'Ігнорувати стратегію compaction' },
      body: {
        en: 'Leaving the default compaction in place is a silent performance decision. Size-tiered minimizes write amplification but can transiently double space at a major compaction and raises read amplification; leveled keeps space/read tight but multiplies write work. Match the strategy to the workload — size-tiered/time-window for append and TTL data, leveled for read-heavy/space-sensitive — and watch the amplification you are actually paying.',
        uk: 'Лишити дефолтну compaction — це тихе рішення про продуктивність. Size-tiered мінімізує write amplification, але може тимчасово подвоїти простір на великій compaction і підняти read amplification; leveled тримає space/read щільними, зате множить роботу запису. Підбирайте стратегію під навантаження — size-tiered/time-window для append і TTL-даних, leveled для read-heavy/чутливих до простору — і стежте за amplification, яку реально платите.',
      },
    },
  ],
  interview: [
    {
      level: 'senior',
      q: {
        en: 'Why is an LSM-tree faster for writes than a B-Tree, and what does it give up to get that?',
        uk: 'Чому LSM-tree швидший на записах за B-Tree і що він віддає, щоб це отримати?',
      },
      a: {
        en: 'A B-Tree updates in place: every write has to locate the correct leaf page and modify it where it lives, and on a busy table those pages are scattered, so the workload becomes random page writes — the slow access pattern on every medium. An LSM-tree refuses to do random writes. It appends each write to a WAL for durability and into an in-memory sorted memtable, and when that fills it flushes the whole sorted batch to disk as one immutable SSTable in a single sequential pass. So it converts random writes into sequential writes plus a background merge, which is dramatically cheaper. What it gives up is read and space efficiency. Because a key’s current value might live in the memtable or in any of several SSTables, a read may have to consult multiple places — mitigated, but not eliminated, by per-SSTable Bloom filters and sparse indexes. And because updates and deletes write new versions and tombstones rather than overwriting, stale data sits on disk until compaction reclaims it, costing space. That is the LSM trade in one sentence: spend read and space amplification to win write throughput.',
        uk: 'B-Tree оновлює на місці: кожен запис мусить знайти потрібну leaf page і змінити її там, де вона лежить, а на завантаженій таблиці ці pages розкидані, тож навантаження стає випадковими записами pages — найповільніший патерн доступу на будь-якому носії. LSM-tree відмовляється робити випадкові записи. Він додає кожен запис у WAL для durability і у відсортований memtable у памʼяті, а коли той заповнюється — скидає всю відсортовану партію на диск як один immutable SSTable за один послідовний прохід. Тож він перетворює випадкові записи на послідовні плюс фонове злиття, що драматично дешевше. Віддає він ефективність читання й простору. Оскільки поточне значення ключа може жити в memtable або в будь-якому з кількох SSTables, читання може мусити звернутися до кількох місць — помʼякшено, але не усунено, Bloom filters і sparse indexes на кожен SSTable. А оскільки оновлення й видалення пишуть нові версії й tombstones замість перезапису, застарілі дані лежать на диску, доки compaction їх не звільнить, коштуючи простору. Це компроміс LSM одним реченням: витратити read і space amplification, щоб виграти пропускну здатність запису.',
      },
    },
    {
      level: 'senior',
      q: {
        en: 'What does a Bloom filter do in an LSM read path, and why is the “no false negatives” property the one that matters?',
        uk: 'Що робить Bloom filter у шляху читання LSM і чому властивість «без false negatives» — саме та, що має значення?',
      },
      a: {
        en: 'Without help, a point lookup for a key that is not present is the LSM’s worst case: you would have to check the memtable and then every SSTable across every level before you could conclude the key is absent. A Bloom filter is a small probabilistic set kept per SSTable that answers the membership question without reading the file. Its two answers are asymmetric: “definitely not in this SSTable”, which is always correct, or “maybe in this SSTable”, which might be a false positive. The crucial property is that it never gives a false negative — so a “no” can always be trusted and the engine can skip that SSTable entirely, with zero disk reads. That asymmetry is exactly what the read path needs: a “no” lets you safely prune, and a rare false-positive “maybe” only costs you one unnecessary file read that you would have done anyway. With Bloom filters in front of every SSTable, a lookup for an absent key skips almost all of them instantly, turning the worst case into a near-free miss — which is why engines keep hot SSTables’ Bloom filters resident in memory.',
        uk: 'Без допомоги точковий пошук ключа, якого немає, — найгірший випадок LSM: довелося б перевірити memtable, а тоді кожен SSTable на кожному рівні, перш ніж висновити, що ключа нема. Bloom filter — мала імовірнісна множина, що тримається на кожен SSTable і відповідає на питання належності, не читаючи файл. Його дві відповіді асиметричні: «точно нема в цьому SSTable», що завжди правильно, або «можливо є в цьому SSTable», що може бути false positive. Вирішальна властивість — він ніколи не дає false negative, тож «ні» завжди можна довіряти, і движок може пропустити той SSTable цілком, з нулем читань диска. Ця асиметрія — саме те, що потрібно шляху читання: «ні» дозволяє безпечно відсікати, а рідкісне false-positive «можливо» коштує лише одного зайвого читання файлу, яке ви все одно зробили б. З Bloom filters перед кожним SSTable пошук відсутнього ключа миттєво пропускає майже всі, перетворюючи найгірший випадок на майже безкоштовний промах — тому движки тримають Bloom filters гарячих SSTables у памʼяті.',
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A team runs a job-queue table on Cassandra — insert a row, process it, delete it — and read latency degrades badly over hours. What is happening and how would you address it?',
        uk: 'Команда тримає таблицю черги задач на Cassandra — вставити рядок, обробити, видалити — і latency читання сильно деградує за години. Що відбувається і як це виправити?',
      },
      a: {
        en: 'This is the textbook tombstone problem, and it falls straight out of how an LSM handles deletes. Each delete does not remove the row; it writes a tombstone, a marker that the row is gone, into a new SSTable. A queue is the pathological shape for this: you are deleting rows almost as fast as you write them, so tombstones accumulate continuously, and they are only actually purged when compaction merges the relevant SSTables and enough time has passed (gc_grace_seconds). Meanwhile, every range read over the queue — “give me the next N pending jobs” — has to scan across all those tombstones to prove which rows are really gone, and reading and discarding thousands of tombstones per query is what collapses read latency. So the cause is deferred deletes piling up faster than compaction clears them. The fixes work on two levels. Tactically: use a compaction strategy suited to churn — TimeWindowCompactionStrategy with a TTL so whole expired time-windows drop at once, or tuning LeveledCompactionStrategy and gc_grace down — and avoid queries that scan large deleted ranges. Strategically, the deeper fix is that a delete-heavy queue is the wrong workload for an LSM wide-column store at all: I would model it so rows expire by TTL or partition-by-time instead of being individually deleted and range-scanned, or move the queue to a system designed for it (a real message queue, or Redis). The interview point is recognizing that in an LSM a delete is a write the read path keeps paying for, and that the data model — not just a config knob — is usually the real fix.',
        uk: 'Це підручникова проблема tombstones, і вона прямо випливає з того, як LSM обробляє видалення. Кожне видалення не прибирає рядок; воно пише tombstone — маркер, що рядок зник, — у новий SSTable. Черга — патологічна форма для цього: ви видаляєте рядки майже так само швидко, як пишете, тож tombstones безперервно накопичуються, а реально вичищаються лише коли compaction зливає відповідні SSTables і минув достатній час (gc_grace_seconds). Тим часом кожне range-читання по черзі — «дай наступні N задач у черзі» — мусить просканувати всі ці tombstones, щоб довести, які рядки справді зникли, і читання й відкидання тисяч tombstones на запит — це те, що обвалює latency читання. Тож причина — відкладені видалення накопичуються швидше, ніж compaction їх прибирає. Виправлення працюють на двох рівнях. Тактично: вжити стратегію compaction під плинність — TimeWindowCompactionStrategy з TTL, щоб цілі прострочені вікна часу зникали разом, або тюнінг LeveledCompactionStrategy і зниження gc_grace — і уникати запитів, що сканують великі видалені діапазони. Стратегічно глибше виправлення в тому, що delete-heavy черга — узагалі неправильне навантаження для LSM wide-column сховища: я б змоделював це так, щоб рядки спливали за TTL чи partition-by-time замість індивідуального видалення й range-scan, або переніс чергу в систему, спроєктовану під це (справжню чергу повідомлень або Redis). Суть для співбесіди — усвідомити, що в LSM видалення — це запис, за який шлях читання продовжує платити, і що саме модель даних, а не лише ручка конфігу, зазвичай і є справжнім виправленням.',
      },
    },
  ],
  seeAlso: ['m13-btree', 'm12-storage', 'm27-wide-column', 'm17-acid-wal', 'm16-query-planning'],
  sources: [
    {
      title: "O'Neil, Cheng, Gawlick & O'Neil — “The Log-Structured Merge-Tree (LSM-Tree)”, Acta Informatica 33(4):351–385 (1996)",
      url: 'https://www.cs.umb.edu/~poneil/lsmtree.pdf',
    },
    {
      title: 'Athanassoulis et al. — “Designing Access Methods: The RUM Conjecture”, EDBT 2016 (read/update/memory trade-off)',
      url: 'https://openproceedings.org/2016/conf/edbt/paper-12.pdf',
    },
    {
      title: 'RocksDB Wiki — Compaction overview (memtable → SSTable flush; leveled vs universal; write/read/space amplification)',
      url: 'https://github.com/facebook/rocksdb/wiki/Compaction',
    },
    {
      title: 'RocksDB Wiki — Leveled Compaction (the default; levels ~10× each, non-overlapping within a level)',
      url: 'https://github.com/facebook/rocksdb/wiki/Leveled-Compaction',
    },
    {
      title: 'RocksDB Wiki — RocksDB Bloom Filter (skip SSTables that cannot contain a key; no false negatives)',
      url: 'https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter',
    },
    {
      title: 'Apache Cassandra Documentation — Compaction strategies (SizeTiered default, Leveled, TimeWindow) & tombstones',
      url: 'https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/',
    },
  ],
};
