# CURRICULUM.md — Databases: The Comprehensive Guide — detailed module/topic plan

Detailed annex to `CLAUDE.md`. This is the **content map**: every Section, every Module, every
Topic, and the **visual assets** planned for each. Content is authored from this map into
`src/data/concepts.ts`. Bilingual EN/UA; technical terms stay English.

Legend for planned visuals: `[table]` `[diagram]` `[flow]` `[timeline]` `[compare]`
`[mental-model]` `[code]` `[callout]` `[gallery]` `[sim ★]` (signature interactive).

---

## A. Modularity model (Section → Module → Topic)

```
Section (8)        big thematic block (I … VIII) — coloured, collapsible in the sidebar
  └─ Module (~36)  the NAVIGABLE, SKIPPABLE unit (one page) — has a level + a mental model
       └─ Topic    a focused sub-unit inside a module (variable count, 3–6 typical)
            └─ Block   prose · table · diagram · sim · mental-model · callout · compare · code
```

- A **Module** is self-contained: a user can land on it directly, finish it, and leave — no need to
  read neighbours. Every module opens with its **mental model** (one line/picture) and **key points**,
  and closes with **pitfalls** + optional **interview Q&A**.
- A **Topic** is independently **deep-linkable** (`#/m/<module>/<topic>`), so search results,
  cross-links and the sidebar can jump straight to it.
- **Skip / jump freely:** modules are not a forced sequence. Recommended order exists (the numbering),
  but the UI never blocks jumping. Beginners start at Section I; pros can dive straight into internals.

## B. Navigation & UX (what the user sees)

- **Top bar:** brand · global **search** (indexes modules + topics, both languages) · **level filter**
  (beginner / middle / senior / staff — dims modules outside the chosen level) · **EN/UA toggle** · theme.
- **Left sidebar (the menu):** the 8 Sections as **collapsible groups**; under each, its modules with a
  **level badge** and a **★** if the module has a signature interactive. Current module highlighted;
  sections remember open/closed state.
- **Landing (`#/map`):** the clickable **Database Landscape Map** (overview of the families → click a
  node → module) + a "start here" path + a module grid filterable by level. (Mirrors DPmap's landing.)
- **Module page:** header (title · level badge · read-mins · the mental model) → **Topic TOC** (jump
  links, sticky) → topics rendered in order, each a heading + its blocks → **key points** → **pitfalls**
  → **see also** (cross-links) → **prev / next module**. A thin **progress bar** tracks scroll; an
  optional per-module **"mark as known/done"** (localStorage) lets users prune what they've mastered.
- **Study surfaces:** `#/mental-models` (gallery) · `#/glossary` (bilingual) · `#/decide` (Database
  Picker) · flashcards/quiz embedded where useful.
- **A11y:** keyboard nav, focus rings, ARIA on sims, `prefers-reduced-motion` step fallback.

## C. Data model (refined — Section/Module/Topic/Block)

See `CLAUDE.md` §4 for the authoritative TypeScript contract (identical to the Node/Claude guide,
reused). Sections carry an `accent` (the section colour); modules carry `level`, `mentalModel`,
`topics[]`, `keyPoints[]`, `pitfalls[]`, optional `interview[]`, `seeAlso[]`, `sources[]`.

---

## D. The modules

### Section I · Foundations & the landscape  `[beginner → middle]` — the on-ramp; covers "types of DB" + "strengths/weaknesses"

**M1 · What a database is & why**  `[beginner]`
- 1.1 From files to a DBMS — what a database management system adds (concurrency, durability, querying, integrity)
- 1.2 OLTP vs OLAP — transactional vs analytical workloads, the shape that drives everything
- 1.3 The cost of getting it wrong — a war story (lost writes / corruption / the wrong model)
- 1.4 The vocabulary — schema, record/row, query, transaction, index, engine (just enough to start)
- Visuals: `[diagram]` files-vs-DBMS · `[compare]` OLTP vs OLAP · `[mental-model]` "a DBMS = a contract over your data" · `[table]` core vocabulary

**M2 · The database landscape**  `[beginner]`  ★ landing
- 2.1 The families — relational · document · key-value · wide-column · graph · vector · time-series · search · OLAP/columnar
- 2.2 The shape of your data drives the choice — access patterns over hype
- 2.3 Engines on the map — Postgres, MySQL/MariaDB, MongoDB, Redis/Valkey, Cassandra, Neo4j, ClickHouse, pgvector…
- 2.4 How to read the rest of this guide — the internals-first path
- Visuals: `[sim ★]` **Database Landscape Map** (clickable families → module) · `[table]` family → typical engines → when · `[mental-model]` "fit the model to the access pattern"

**M3 · SQL vs NoSQL — the real trade-offs**  `[middle]`  (covers "strengths & weaknesses")
- 3.1 What "NoSQL" actually means (and doesn't) — not "no SQL", but non-relational models
- 3.2 The relational strengths — integrity, joins, ad-hoc queries, ACID; and its costs
- 3.3 The NoSQL strengths — flexible schema, horizontal scale, specific access patterns; and their costs
- 3.4 The convergence — SQL on JSON, NoSQL adding transactions; the lines blur
- 3.5 Strengths & weaknesses, family by family
- Visuals: `[compare]` relational vs non-relational · `[table]` **strengths/weaknesses per family** (the requirement-2 centerpiece) · `[callout]` "polyglot persistence" · `[mental-model]`

**M4 · The relational model & SQL foundations**  `[beginner]`
- 4.1 Tables, rows, columns, domains — the relational model in one picture
- 4.2 Keys & relationships — primary/foreign, one-to-one / one-to-many / many-to-many
- 4.3 The relational algebra behind SELECT — projection, selection, join, set ops
- 4.4 SELECT / WHERE / GROUP BY / ORDER BY — reading data, declaratively
- 4.5 Declarative vs imperative — you say *what*, the planner decides *how*
- Visuals: `[diagram]` relational model · `[diagram]` SELECT → relational algebra · `[table]` clause → meaning · `[code]` worked SELECTs · `[mental-model]` "sets, not loops"

**M5 · Anatomy of a query**  `[middle]`  ★
- 5.1 The lifecycle — parser → rewriter → planner/optimizer → executor → storage → result
- 5.2 Logical vs physical plan — the same SQL, many execution strategies
- 5.3 Where time goes — parse vs plan vs execute vs I/O
- 5.4 Why this matters — every later module hangs off one stage of this pipeline
- Visuals: `[sim ★]` query-lifecycle stepper (a query flows through the stages) · `[diagram]` pipeline · `[mental-model]` "SQL is a request, not a recipe" · `[table]` stage → job

### Section II · Relational design & SQL mastery  `[middle → senior]` — Postgres-centric spine

**M6 · ER modeling & schema design**  `[middle]`  ★
- 6.1 From real-world ideas to entities & attributes
- 6.2 Relationships & cardinality — 1:1, 1:N, M:N, the junction table
- 6.3 Strong vs weak entities; identifying relationships
- 6.4 The design lifecycle — conceptual → logical → physical
- 6.5 Common modeling smells & fixes
- Visuals: `[sim ★]` small **ER builder/explorer** (toggle relationships → see the resulting tables/FKs) · `[diagram]` ER notation legend · `[table]` cardinality → schema · `[mental-model]`

**M7 · Normalization & denormalization**  `[middle]`  ★
- 7.1 Functional dependencies — the engine behind normal forms
- 7.2 1NF (atomic values) → 2NF (partial deps) → 3NF (transitive deps)
- 7.3 BCNF — the untold story; when 3NF isn't enough
- 7.4 Denormalization on purpose — read performance, the trade-off, keeping it consistent
- Visuals: `[sim ★]` **Normalization stepper** (a messy table → split through 1NF/2NF/3NF, anomalies disappear) · `[table]` normal forms · `[compare]` normalized vs denormalized · `[mental-model]` "one fact, one place"

**M8 · Keys & constraints**  `[middle]`
- 8.1 Key zoo — super, candidate, primary, unique, surrogate vs natural
- 8.2 Foreign keys — referential integrity; ON DELETE / ON UPDATE actions
- 8.3 Other constraints — NOT NULL, DEFAULT, CHECK, EXCLUSION
- 8.4 Constraints as guardrails — pushing invariants into the database
- Visuals: `[table]` key types · `[diagram]` FK referential actions · `[code]` DDL with constraints · `[callout security]` "the DB is your last line of integrity" · `[mental-model]`

**M9 · Data types done right**  `[middle]`
- 9.1 Strings — CHAR/VARCHAR/TEXT, collation, the "don't use the wrong string type" trap
- 9.2 Numbers — INTEGER/BIGINT, NUMERIC/DECIMAL vs FLOAT, **the FLOAT mistake that crashed a stock exchange**
- 9.3 Date & time — DATE/TIME/TIMESTAMP/TIMESTAMPTZ, time zones, intervals
- 9.4 Semi-structured & special — JSON/JSONB, arrays, enums, UUID, ranges, custom/composite types
- Visuals: `[table]` type → use/avoid · `[callout warn]` FLOAT vs DECIMAL for money · `[code]` JSONB & arrays · `[compare]` TIMESTAMP vs TIMESTAMPTZ · `[mental-model]` "types are constraints"

**M10 · SQL in depth**  `[senior]`
- 10.1 JOINs and how they execute — inner/outer/semi/anti; nested-loop vs hash vs merge (preview of M16)
- 10.2 Subqueries & CTEs — correlated vs not; WITH; recursive CTEs
- 10.3 Window functions — partitions, frames, ranking, running totals
- 10.4 Advanced grouping — GROUPING SETS, CUBE, ROLLUP
- 10.5 Conditional logic & NULLs — CASE, COALESCE, NULLIF, three-valued logic
- Visuals: `[diagram]` join types (Venn-ish + row-level) · `[code]` window/CTE/recursive examples · `[table]` CUBE/ROLLUP output · `[callout]` NULL three-valued logic · `[compare]` subquery vs CTE vs join

**M11 · Views, procedural SQL & triggers**  `[senior]`
- 11.1 Views & materialized views — abstraction vs cached results; refresh strategies
- 11.2 Functions & stored procedures — SQL vs PL/pgSQL; when logic belongs in the DB
- 11.3 Triggers — row/statement, BEFORE/AFTER; auditing, derived data; the hidden-cost warning
- 11.4 Error handling in PL/pgSQL — exceptions, savepoints
- Visuals: `[compare]` view vs materialized view · `[code]` PL/pgSQL function + trigger · `[callout warn]` triggers = action at a distance · `[mental-model]` "logic in the DB: power vs opacity"

### Section III · Storage & indexing internals  `[senior → staff]` — universal internals

**M12 · How data is stored**  `[senior]`  ★ (light)
- 12.1 The memory hierarchy — registers → RAM → SSD → disk; orders-of-magnitude latency
- 12.2 Pages & the heap — fixed-size pages, tuples, the page as the unit of I/O
- 12.3 Row-store vs column-store — why OLTP rows and OLAP columns
- 12.4 Big values & layout — TOAST/overflow, fill factor, clustering
- Visuals: `[diagram]` memory hierarchy with latencies · `[table]` "time to find 1 record in 1M" · `[compare]` row vs columnar · `[mental-model]` "disk is far; minimize trips"

**M13 · B-Tree & B+Tree indexes**  `[senior]`  ★ **(GOLDEN — built first in S1)**
- 13.1 Why not a sorted array or a BST — fan-out, height, disk pages
- 13.2 B-Tree structure — keys, children, balance, O(log n)
- 13.3 Insert & **split**; delete & merge — keeping balance
- 13.4 B+Tree — values in leaves, linked leaves, range scans; why DB indexes use it
- 13.5 Reading an index plan — index scan vs seq scan vs index-only scan
- Visuals: `[sim ★]` **B-Tree / B+Tree visualizer** (insert/search; nodes fill & split; toggle B-Tree↔B+Tree; range scan over leaves; step/play/pause; reduced-motion fallback) · `[diagram]` node anatomy · `[table]` complexity vs array/BST/hash · `[mental-model]` "few hops, each a page" · interview Q&A · `[callout]` clustered vs secondary index

**M14 · The index toolbox**  `[senior]`
- 14.1 Hash indexes — equality only, O(1), no ranges
- 14.2 Specialized indexes — GIN (JSONB/arrays/FTS), GiST (geo/ranges), BRIN (huge ordered), bitmap
- 14.3 Full-text search — tsvector/tsquery; when FTS beats LIKE
- 14.4 Composite, covering, partial & expression indexes — and column order
- 14.5 The cost of indexes — write amplification, maintenance, choosing what NOT to index
- Visuals: `[sim ★]` (light) **index access-path** picker (query → which index, why) · `[table]` index type → best for · `[compare]` LIKE vs FTS · `[callout warn]` over-indexing · `[mental-model]`

**M15 · LSM-trees & write-optimized storage**  `[staff]`  ★
- 15.1 The write problem — B-Trees and random writes
- 15.2 LSM design — memtable → immutable SSTables → leveled/size-tiered compaction
- 15.3 Reads in an LSM — bloom filters, the read path, tombstones
- 15.4 The amplification triangle — read vs write vs space; B-Tree vs LSM trade-offs
- 15.5 Who uses it — RocksDB, Cassandra/ScyllaDB, modern KV engines
- Visuals: `[sim ★]` **LSM-tree** (writes fill memtable → flush → compaction levels; amplification meters) · `[compare]` B-Tree vs LSM · `[diagram]` read path with bloom filter · `[mental-model]` "buffer writes, sort later"

**M16 · Query planning & optimization**  `[staff]`  ★
- 16.1 The optimizer's job — choose a cheap physical plan from many
- 16.2 Statistics & cardinality estimation — histograms, selectivity, where estimates go wrong
- 16.3 Access paths & join algorithms — seq/index/index-only scan; nested-loop/hash/merge join; join order
- 16.4 Reading EXPLAIN (ANALYZE) — estimated vs actual rows, the misestimate hunt
- 16.5 Helping the planner — indexes, stats, query shape; hints/anti-hints
- Visuals: `[sim ★]` **Query Planner / EXPLAIN** (toggle indexes & predicates → plan tree, scan/join choice, simulated cost/rows) · `[diagram]` plan tree · `[table]` join algorithm trade-offs · `[mental-model]` "the planner bets on statistics"

### Section IV · Transactions & concurrency  `[senior → staff]` — universal internals

**M17 · ACID & durability**  `[senior]`  ★
- 17.1 The four guarantees — atomicity, consistency, isolation, durability (precisely)
- 17.2 The Write-Ahead Log — log first, then pages; why it gives A+D
- 17.3 Commit & crash recovery — redo/undo, checkpoints, fsync & the durability knob
- 17.4 What "consistency" means here vs in CAP — disambiguation
- Visuals: `[sim ★]` (light) **ACID/WAL** (a transaction writes WAL → commit → crash → recovery replays) · `[diagram]` WAL + checkpoint · `[table]` each letter → mechanism · `[callout]` fsync/durability trade · `[mental-model]` "write your intentions down first"

**M18 · Isolation levels & anomalies**  `[staff]`  ★
- 18.1 The anomalies — dirty read, non-repeatable read, phantom, lost update, **write-skew**
- 18.2 The SQL standard levels — read-uncommitted → read-committed → repeatable-read → serializable
- 18.3 Standard vs reality — what engines actually do (snapshot isolation ≠ serializable)
- 18.4 Serializable — SSI vs strict 2PL; the cost of correctness
- Visuals: `[sim ★]` **Isolation anomalies** (interleave two txns; pick a level; watch each anomaly appear/disappear) · `[table]` level × anomaly matrix · `[compare]` snapshot vs serializable · `[mental-model]` "isolation = pretend you're alone"

**M19 · Concurrency control**  `[staff]`  ★
- 19.1 Pessimistic vs optimistic — locking vs MVCC
- 19.2 MVCC — row versions, snapshots, visibility; readers don't block writers
- 19.3 Locking & 2PL — lock modes, lock escalation, deadlocks & detection
- 19.4 The cost of MVCC — bloat, vacuum/GC, long-running transactions
- Visuals: `[sim ★]` **MVCC** (versions per row, two snapshots, visibility, vacuum reclaim) · `[diagram]` deadlock cycle · `[compare]` MVCC vs locking · `[callout warn]` long transactions & bloat · `[mental-model]` "everyone reads their own snapshot"

**M20 · Distributed transactions**  `[staff]`
- 20.1 Why distribution breaks single-node ACID
- 20.2 Two-phase commit — the protocol, the blocking problem, coordinator failure
- 20.3 Sagas & compensation — long-running, eventually-consistent workflows
- 20.4 The outbox pattern & idempotency — reliable messaging; "exactly-once" is a myth
- Visuals: `[diagram]` 2PC prepare/commit · `[flow]` saga with compensation · `[compare]` 2PC vs saga · `[callout security]` idempotency keys · `[mental-model]` "agree, then act — or undo"

### Section V · Distribution, scale & reliability  `[senior → staff]` — universal internals

**M21 · Replication**  `[senior]`  ★
- 21.1 Why replicate — read scale, HA, geo-locality
- 21.2 Leader/follower; sync vs async; the data-loss vs latency trade
- 21.3 Physical vs logical replication; replication lag & read-your-writes
- 21.4 Failover & split-brain — promotion, fencing, the risks
- Visuals: `[sim ★]` **Replication & failover** (leader+followers, sync/async lag, kill the leader → failover, see the loss window) · `[compare]` sync vs async · `[diagram]` logical vs physical · `[mental-model]` "copies cost latency or safety"

**M22 · Partitioning & sharding**  `[senior]`  ★
- 22.1 Vertical vs horizontal partitioning; declarative partitioning
- 22.2 Sharding — the partition/shard key, the make-or-break decision
- 22.3 Routing & rebalancing — hash vs range vs directory; consistent hashing; hotspots
- 22.4 The joins-across-shards problem & fan-out queries
- Visuals: `[sim ★]` (light) **Sharding** (rows → shards by key; show a hotspot; rebalance) · `[compare]` hash vs range sharding · `[table]` shard-key checklist · `[mental-model]` "the shard key is destiny"

**M23 · CAP, PACELC & consensus**  `[staff]`  ★
- 23.1 CAP stated precisely — and the partition you don't get to opt out of
- 23.2 PACELC — the latency-vs-consistency trade even without partitions
- 23.3 Consistency models — strong, linearizable, causal, eventual
- 23.4 Consensus — quorums (R+W>N), Raft/Paxos in one mental model
- Visuals: `[sim ★]` **CAP / consistency** (partition the network; choose C or A; reads/writes succeed/block; quorum slider) · `[diagram]` PACELC tree · `[table]` consistency models · `[mental-model]` "during a partition: answer wrong or not at all"

**M24 · High availability, backups & DR**  `[senior]`
- 24.1 HA building blocks — Patroni/etcd, automatic failover, connection routing
- 24.2 Backups — logical vs physical; PITR & the WAL archive
- 24.3 RPO/RTO — designing for an acceptable loss/recovery window
- 24.4 Testing recovery — the backup you never restored doesn't exist
- Visuals: `[diagram]` HA cluster (Patroni) · `[table]` backup types · `[timeline]` PITR · `[callout security]` test your restores · `[mental-model]` "HA = fast failover; DR = survive the region"

### Section VI · The NoSQL families in depth  `[middle → senior]` — balanced SQL vs NoSQL

**M25 · Document databases**  `[middle]`
- 25.1 The document model — BSON, collections, flexible schema
- 25.2 Embed vs reference — modeling for your access pattern
- 25.3 Indexing & the aggregation pipeline — querying documents at scale
- 25.4 Transactions, consistency & internals — WiredTiger, replica sets, what MongoDB 8.x added
- 25.5 When document fits — and when you're really hiding a relational model
- Visuals: `[compare]` normalized relational vs embedded document · `[code]` aggregation pipeline · `[table]` embed vs reference · `[callout]` schema-on-read cost · `[mental-model]` "store what you read together"

**M26 · Key-value & caching**  `[middle]`
- 26.1 The KV model & Redis/Valkey data structures — strings, hashes, lists, sets, sorted sets, streams
- 26.2 Caching patterns — cache-aside, write-through/behind, TTL, stampede protection
- 26.3 Eviction & persistence — LRU/LFU, RDB vs AOF, durability trade-offs
- 26.4 The Redis → Valkey story — the 2024 license change, the Linux-Foundation fork, where each stands in 2026
- 26.5 Beyond cache — rate limiting, locks, queues, pub/sub
- Visuals: `[diagram]` cache-aside flow · `[table]` data structure → use · `[compare]` Redis vs Valkey (license + governance) · `[callout warn]` cache invalidation · `[mental-model]` "fast because it forgets"

**M27 · Wide-column stores**  `[senior]`
- 27.1 The wide-column model — partition key + clustering columns; query-first design
- 27.2 Cassandra/ScyllaDB internals — LSM heritage, ring, gossip, no joins
- 27.3 Tunable consistency — quorum reads/writes, hinted handoff
- 27.4 When it fits — write-heavy, linear scale; and the modeling discipline it demands
- Visuals: `[diagram]` ring + partition/clustering · `[compare]` wide-column vs relational · `[table]` consistency levels · `[callout]` "model the query, not the data" · `[mental-model]`

**M28 · Graph databases**  `[senior]`
- 28.1 Property graph vs RDF/triples — nodes, edges, properties
- 28.2 Traversal & query — Cypher; why graph beats recursive SQL joins for deep relationships
- 28.3 Internals — index-free adjacency; storage trade-offs
- 28.4 When relationships ARE the data — fraud, social, recommendations, knowledge graphs
- Visuals: `[diagram]` property graph · `[compare]` graph traversal vs N self-joins · `[code]` Cypher vs SQL · `[mental-model]` "edges are first-class"

### Section VII · Modern & specialized engines  `[senior → staff]` — the full modern section

**M29 · Vector databases & AI**  `[senior]`  ★
- 29.1 Embeddings & similarity — vectors, cosine/dot/L2, the semantic-search idea
- 29.2 ANN indexes — exact kNN vs approximate; HNSW (graph) & IVF; recall vs speed
- 29.3 The 2026 landscape — pgvector vs Qdrant/Milvus/Pinecone/Weaviate; "vector-in-Postgres" vs dedicated
- 29.4 RAG patterns — chunking, hybrid (vector+keyword) search, metadata filtering
- Visuals: `[sim ★]` **Vector / ANN search** (points in 2-D; exact-kNN vs HNSW walk; recall/speed dial) · `[table]` vector DB comparison · `[diagram]` RAG pipeline · `[mental-model]` "search by meaning, not match"

**M30 · Distributed SQL / NewSQL**  `[staff]`
- 30.1 The promise — relational + ACID + horizontal scale
- 30.2 How it works — Raft-replicated ranges, distributed transactions (TiKV/PD, ranges, TrueTime)
- 30.3 The players — CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL
- 30.4 "Postgres won the API" — wire compatibility as a moat
- Visuals: `[diagram]` distributed-SQL architecture · `[table]` engine comparison · `[compare]` sharded-Postgres vs distributed-SQL · `[mental-model]` "shards you don't have to think about (mostly)"

**M31 · Analytics, columnar & time-series**  `[senior]`
- 31.1 Columnar storage & vectorized execution — why OLAP is a different machine
- 31.2 ClickHouse & DuckDB — big-data analytics vs in-process analytics
- 31.3 Time-series — TimescaleDB (PG extension), InfluxDB 3; hypertables, retention, downsampling
- 31.4 The lakehouse & HTAP — Parquet/Iceberg, separating storage & compute
- Visuals: `[compare]` row vs columnar execution · `[table]` OLAP engines · `[diagram]` time-series hypertable · `[mental-model]` "scan columns, not rows"

**M32 · Cloud-native & the modern DBA**  `[senior]`
- 32.1 Managed databases — RDS/Aurora/Atlas/Cloud SQL; what you give up & gain
- 32.2 Containers & operators — Postgres in Docker/Kubernetes; the operator pattern
- 32.3 Infrastructure as code — Terraform/Ansible for reproducible clusters
- 32.4 Observability — metrics, slow logs, pg_stat_*, the modern DBA's dashboard
- Visuals: `[diagram]` managed vs self-hosted responsibility split · `[table]` cloud DB options · `[callout]` cost/lock-in · `[mental-model]` "the DBA moved up the stack"

### Section VIII · Mastery

**M33 · Security & data protection**  `[senior]`
- 33.1 AuthN/AuthZ — roles, privileges, RBAC, row-level security (RLS)
- 33.2 Encryption — at rest, in transit, column-level; key management
- 33.3 Hashing & secrets — passwords (bcrypt/argon2), never plaintext
- 33.4 SQL injection — how it works, parameterized queries, least privilege
- 33.5 A practical hardening checklist
- Visuals: `[diagram]` trust boundaries · `[table]` threat → mitigation · `[code]` parameterized vs concatenated query · `[callout security]` least privilege · `[mental-model]` "treat every input as hostile"

**M34 · Performance engineering**  `[senior]`
- 34.1 A method — measure → find the bottleneck → fix → verify
- 34.2 Slow queries — EXPLAIN ANALYZE, missing indexes, the N+1 problem
- 34.3 Connection pooling — why pools (PgBouncer), pool sizing, the connection cost
- 34.4 Caching layers & read replicas — where to offload; cache coherence
- 34.5 Capacity & limits — when to scale up, out, or change the model
- Visuals: `[diagram]` find-the-bottleneck loop · `[table]` symptom → likely cause → fix · `[callout warn]` N+1 · `[compare]` scale-up vs scale-out · `[mental-model]` "the database is usually I/O-bound"

**M35 · Choosing the right database**  `[senior]`  ★
- 35.1 The decision framework — workload, access patterns, consistency, scale, ops
- 35.2 Walkthroughs — "I have X" → recommended family/engine + why
- 35.3 Polyglot persistence — using several, on purpose; the integration cost
- 35.4 Anti-patterns — résumé-driven design; the wrong default
- Visuals: `[sim ★]` **Database Picker** (answer a few questions → recommended family/engine + reasoning; data in `decide.ts`) · `[table]` workload → engine matrix · `[mental-model]` "requirements first, engine second"

**M36 · Mental models gallery + glossary / cheat-sheet**  `[middle]`
- 36.1 The gallery — every mental model in the guide, to recall from memory
- 36.2 Glossary — bilingual (terms stay English)
- 36.3 Cheat-sheet — one-page power reference (types, isolation matrix, index picks, CAP, complexity)
- 36.4 Flashcards / self-check
- Visuals: `[gallery]` all mental models · `[table]` glossary · `[table]` cheat-sheet · `[study]` flashcards/quiz

---

## E. Totals & asset budget (target)

- **8 sections · ~36 modules · ~150 topics.**
- **~6–8 signature interactives ★** (curated, no WASM): B-Tree/B+Tree visualizer (M13, golden) ·
  Query Planner/EXPLAIN (M16) · Isolation anomalies (M18) · MVCC (M19) · Replication & failover (M21) ·
  CAP/consistency (M23) · LSM-tree (M15) · Vector/ANN (M29). *(Trim the lighter ones — LSM, Vector,
  Sharding — if a session runs long. **ER (M6) + Normalization (M7) steppers are confirmed for S4 —
  user decision 2026-06-23, build both.**)*
- **Interactive Database Landscape Map** as the landing (M2) + the **Database Picker** decision widget (M35).
- **Diagram-first baseline everywhere else:** ≥1 diagram + ≥1 table per module; a mental model per
  module; opportunistic light interactives (ER builder M6, Normalization stepper M7, index access-path
  M14, ACID/WAL M17, Sharding M22).
- Every module: mental model · key points · pitfalls · see-also · sources (web-verified per build).

## F. Build order (from `CLAUDE.md` §13)

S1 golden = **M13 Indexing & the B-Tree + the B-Tree/B+Tree visualizer** (+ scaffold, theme, nav,
i18n, the Landscape-Map landing skeleton, deploy). Then batch per the `CLAUDE.md` roadmap. The
beginner foundations (M1–M5) come in S2–S3 (they reuse components built in S1). Bilingual = author EN
then UA per module. Each session ends with typecheck + build + data-integrity check + a 3-part summary.
