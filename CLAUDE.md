# CLAUDE.md — Databases: The Comprehensive Guide (Interactive)

Working guide and **source of truth** for every session in this repo. **Read this file
fully before starting any session.** Update the *Status / progress log* (§14) at the end of
each session.

> Author/brand: **Vasyl Krupka · Senior Fullstack Engineer · Ukraine 🇺🇦**.
> Sibling projects & quality bar: `../Node-js guide` (the gold standard — Vite+React+TS, hero
> simulators, data-driven chapters), `../Design Principles & Patterns guide` (the interactive
> "map" form) and `../Claude guide` (most recent build of the same architecture). Match that
> depth and polish; reuse the architecture and component patterns.

---

## 1. Mission

A **deep, interactive guide to databases** — from a short beginner on-ramp to deep,
professional, *staff-level* mastery of how databases actually work. Not a feature list and not a
SQL cheat-sheet: the **internals + the mental models + practical interactive materials** that let a
professional **understand, internalize and remember** which database to use, when, and why — like
an expert (deep-dive mode). Concepts are taught with prose **plus** visual diagrams, tables, mental
models and **signature interactive simulators** (B-Tree splits, query planning/EXPLAIN, MVCC,
isolation anomalies, replication & failover, CAP, LSM compaction, vector/ANN search…).

- **Audience:** primarily **professionals** (middle → senior → staff). Secondary: a short
  **beginner on-ramp** (Section I). Focus chosen by user (2026-06-23): **internals-first**, taught
  through concrete engines.
- **Three emphases, reconciled as layers (user choice 2026-06-23 = "all three"):**
  1. **Universal internals / theory** is the *teaching backbone* — storage, indexing, transactions,
     concurrency, query processing, distribution. Engine-agnostic, transfers anywhere.
  2. **PostgreSQL is the canonical worked example + its own deep-dive spine** (Sections II–V use
     Postgres as the primary concrete example; it mirrors `info.txt`).
  3. **NoSQL families get balanced, first-class coverage** (Section VI: document, key-value,
     wide-column, graph) plus the modern/specialized engines (Section VII).
     These are *layers, not competing tracks* — internals are taught once, then instantiated across
     engines, so nothing is redundant.
- **Levels:** every module tagged `beginner | middle | senior | staff`.
- **Language:** **Bilingual EN / UA** with a runtime toggle (user choice 2026-06-23). **All technical
  terminology stays in English** in both languages (SQL, B-Tree, MVCC, WAL, sharding, index,
  transaction, replication, ACID, CAP, LSM, vector, embedding…); Ukrainian is used only where it
  translates without loss of precision (explanations, analogies, mental models). EN authored first,
  UA second.
- **Deploy:** static site on **GitHub Pages**, public, auto-published by GitHub Actions.
- **Source of curriculum:** `_examples/info.txt` (3 fact-checked video chapter lists — authoritative
  *seed*: a beginner PostgreSQL/SQL course, a relational-design + indexing course, and an
  internals/SQLite-from-scratch + cloud-PostgreSQL/HA course). Cover it all but **do not limit to
  it** — go well beyond into modern engines and staff-level internals. (Note: the user referenced a
  `list of concepts.txt`; it is **not yet present** in this folder — §5/`CURRICULUM.md` carry the
  authoritative concept map until/unless he adds one.)
- **Form/depth reference:** the Node guide's hero sims + the DPmap interactive map. That interactive,
  data-driven, diagram-rich style is the target.
- **Correctness mandate:** the database landscape moves (versions, licensing, the modern/vector/
  distributed wave) and the build model's knowledge cutoff is older than the live date. **Web-search
  and verify every version-sensitive fact** (versions, licensing, feature availability, benchmarks,
  release dates) per module; fill `sources`; never trust memory for product facts.

## 2. Stack & key decisions (with why)

- **Vite + React 19 + TypeScript (strict)** — best fit for stateful interactive simulators
  (step/play/pause), component reuse across ~36 modules, the user's stack, and it matches the proven
  gold standard (Node guide) and the most recent build (Claude guide). *(Confirm latest stable
  Vite/React at scaffold; pin them. Node guide is on Vite 8 + React 19.)*
- **No router library** — small custom **hash router** (`#/m/<module>/<topic>`, `#/map`, `#/decide`,
  `#/mental-models`, `#/glossary`). Hash routing + `vite base:'./'` makes the build work under **any**
  GitHub Pages sub-path with zero config (proven across all sibling guides).
- **All content static** (TS/JSON data modules imported at build time) — no runtime fetches; works
  offline; deploys anywhere.
- **Interactivity = curated simulations only (user choice 2026-06-23).** Hand-built deterministic
  React sims (like the Node guide) — **no in-browser WASM SQL engine** (PGlite/sql.js deliberately
  out of scope). Fully controlled, lighter payload, reduced-motion step fallback on every sim.
- **Single source of truth for content:** `src/data/concepts.ts` (+ `interview.ts`, `mentalModels.ts`,
  `glossary.ts`, `decide.ts`). Pages are *rendered from data*; we never hand-write page HTML.
- **Bilingual at the data layer:** every human-readable string is a `Localized` value `{ en; uk }`.
  UI chrome strings live in `src/i18n/ui.ts`. A `useLang()` context + `<T>`/`t()` helpers resolve them.
- **Tooling/CI Node:** Node 22 LTS (user runs v22.17.0, npm 10.9.2, M1 Max).

## 3. Repo layout (target)

```
database guide/                          # = git repo root; deploy publishes dist/ only
  index.html                             # app shell (title, favicon, theme-color)
  package.json  vite.config.ts  tsconfig.json  .eslintrc
  .github/workflows/deploy.yml           # Actions → Pages (Node 22, npm ci, build, upload dist)
  .gitignore                             # node_modules, dist, AND _examples/ (see §12)
  public/  favicon.svg  .nojekyll
  src/
    main.tsx  App.tsx                    # layout + hash router
    i18n/     ui.ts  LangContext.tsx     # EN/UA UI strings + language provider/toggle
    theme/    tokens.css  global.css     # DB-dark tokens (slate base + DB-family palette)
    data/
      concepts.ts                        # SINGLE SOURCE OF TRUTH (sections + modules + topics), bilingual
      interview.ts                       # senior/staff Q&A bank (tagged by module)
      mentalModels.ts                    # "draw from memory" gallery
      glossary.ts                        # bilingual term bank (terms stay English)
      decide.ts                          # "which database for the job" decision data
    components/
      layout/  TopBar(search+lang) Sidebar Toc ProgressBar Footer(brand)
      map/     LandscapeMap MapNode Drawer          # landing overview (clickable → module)
      module/  ModulePage Topic Prose Figure CodeBlock DataTable Callout Compare LevelBadge
      sims/    BTreeSim QueryPlannerSim MvccSim IsolationSim ReplicationSim CapSim LsmSim VectorSim …
      figures/ (SVG diagram components, one per key)
      study/   Flashcards Quiz InterviewBank DbPicker
    lib/     hashRouter.ts  search.ts  registry.tsx(sim+figure registry)  utils.ts
  scripts/   (QA data-integrity + optional PDF pipeline)
  CLAUDE.md  CURRICULUM.md  PROJECT-BRIEF.md  README.md
```

## 4. Content / data model (the contract)

Every module is **data**; renderers turn it into a page. Bilingual via `Localized`. (Identical to
the proven Claude/Node guide contract — reuse it.)

```ts
type Localized = { en: string; uk: string };           // technical terms stay English in both
type Level = 'beginner' | 'middle' | 'senior' | 'staff';

type Section = { id: string; name: Localized; accent: string; blurb: Localized };   // the 8 blocks
type Module  = {
  id: string; section: string; order: number; level: Level;
  title: Localized; tagline: Localized; readMins: number;
  mentalModel: Localized;            // the one line/picture to recall from memory
  topics: Topic[];                   // ordered, deep-linkable sub-units (3–6 typical)
  keyPoints: Localized[];            // takeaways ("draw from memory")
  pitfalls: { title: Localized; body: Localized }[];     // pro-level traps & misconceptions
  interview?: { q: Localized; a: Localized; level?: Level }[];
  seeAlso: string[];                 // related module ids (cross-links)
  sources: { title: string; url: string }[];             // verification + on-page citations (English)
};
type Topic = { id: string; title: Localized; blocks: Block[] };
type Block =
  | { kind:'prose';   md: Localized }
  | { kind:'figure';  fig: string; caption?: Localized }   // SVG/diagram component key
  | { kind:'sim';     sim: string }                        // interactive widget registry key
  | { kind:'table';   head: Localized[]; rows: Localized[][]; caption?: Localized }
  | { kind:'code';    lang: string; code: string; note?: Localized }  // SQL/DDL etc. language-neutral
  | { kind:'callout'; tone:'tip'|'warn'|'senior'|'security'; title: Localized; md: Localized }
  | { kind:'compare'; a: Localized; b: Localized; rows: [Localized,Localized,Localized][] };
```

Figures and sims are referenced by **key** and resolved via `lib/registry.tsx`, so content stays
declarative and widgets stay reusable. Content is edited **only** in `src/data/*`.

## 5. Curriculum (seed = info.txt; cover all, not limited to it)

> **Terminology:** **Section** (the 8 blocks) → **Module** (the navigable, skippable unit) →
> **Topics** (variable per module) → content **blocks**. The **full module-by-module +
> topic-by-topic + per-module visual-asset plan lives in `CURRICULUM.md`** (the detailed annex);
> treat it as authoritative for topics. The list below is the section/module overview.

Eight sections, **~36 modules**. Internals-first, Postgres as the worked spine, NoSQL & modern given
first-class sections. Levels in brackets. ★ = signature interactive.

**I · Foundations & the landscape** *(beginner on-ramp → middle)* — covers "types of DB" + "strengths/weaknesses"
1. What a database is & why — DBMS vs files, OLTP vs OLAP, the cost of getting it wrong `[beginner]`
2. The database landscape — the families map (relational · document · key-value · wide-column · graph · vector · time-series · search · OLAP) ★ **Landscape Map (landing)** `[beginner]`
3. SQL vs NoSQL — the real trade-offs; strengths & weaknesses of each family `[middle]`
4. The relational model & SQL foundations — tables, keys, relationships, the relational algebra behind SELECT `[beginner]`
5. Anatomy of a query — parse → plan → execute → storage → result (the lifecycle overview) ★ `[middle]`

**II · Relational design & SQL mastery** *(middle → senior)* — Postgres-centric spine begins
6. ER modeling & schema design — entities, relationships, cardinality, strong/weak entities ★ **ER interactive** `[middle]`
7. Normalization & denormalization — 1NF→BCNF, functional dependencies, when to denormalize ★ **Normalization sim** `[middle]`
8. Keys & constraints — PK/FK/unique/candidate/super, referential actions, CHECK/NOT NULL/DEFAULT `[middle]`
9. Data types done right — strings, the FLOAT disaster, numeric/decimal, date/time/zones, JSON, arrays, enums, custom types `[middle]`
10. SQL in depth — joins (how they run), subqueries, CTEs, window functions, GROUPING/CUBE/ROLLUP, CASE/COALESCE/NULLIF `[senior]`
11. Views, procedural SQL & triggers — views/materialized views, functions, PL/pgSQL, triggers; when to push logic into the DB `[senior]`

**III · Storage & indexing internals** *(senior → staff)* — universal internals
12. How data is stored — disk vs RAM, pages & heap, row vs columnar, TOAST, the access-cost mental model ★ `[senior]`
13. B-Tree & B+Tree indexes — structure, search/insert/split, range scans, why O(log n) ★ **B-Tree/B+Tree visualizer** `[senior]` **(GOLDEN — built first in S1)**
14. The index toolbox — hash, GIN/GiST/BRIN, full-text, bitmap, covering/partial/expression; choosing & maintaining indexes ★ `[senior]`
15. LSM-trees & write-optimized storage — memtable/SSTable/compaction, read/write amplification ★ **LSM-tree sim** `[staff]`
16. Query planning & optimization — cost model, statistics, EXPLAIN (ANALYZE), access paths, join order/algorithms ★ **Query Planner / EXPLAIN sim** `[staff]`

**IV · Transactions & concurrency** *(senior → staff)* — universal internals
17. ACID & durability — the four guarantees, the WAL, commit & crash recovery ★ **ACID/WAL** `[senior]`
18. Isolation levels & anomalies — dirty/non-repeatable/phantom/write-skew; the SQL levels vs reality ★ **Isolation anomalies sim** `[staff]`
19. Concurrency control — MVCC vs locking, 2PL, snapshot isolation, deadlocks, vacuum ★ **MVCC sim** `[staff]`
20. Distributed transactions — 2PC, sagas, the outbox, idempotency, "exactly-once" myths `[staff]`

**V · Distribution, scale & reliability** *(senior → staff)* — universal internals
21. Replication — leader/follower, sync/async, physical vs logical, failover, replication lag ★ **Replication & failover sim** `[senior]`
22. Partitioning & sharding — vertical/horizontal, partition keys, hotspots, rebalancing ★ **Sharding sim** `[senior]`
23. CAP, PACELC & consensus — the real theorem, consistency models, quorum, Raft/Paxos ★ **CAP / consistency sim** `[staff]`
24. High availability, backups & DR — Patroni, PITR, backup strategies, RPO/RTO `[senior]`

**VI · The NoSQL families in depth** *(middle → senior)* — balanced SQL vs NoSQL
25. Document databases — MongoDB model & internals, embed vs reference, aggregation pipeline, indexing `[middle]`
26. Key-value & caching — Redis/Valkey data structures, eviction, persistence, caching patterns, the fork story `[middle]`
27. Wide-column stores — Cassandra/ScyllaDB, the partition/clustering model, tunable consistency, LSM heritage `[senior]`
28. Graph databases — property graph vs RDF, traversal, Cypher, when relationships ARE the data `[senior]`

**VII · Modern & specialized engines** *(senior → staff)* — the full modern section
29. Vector databases & AI — embeddings, ANN/HNSW, pgvector vs Qdrant/Pinecone/Milvus/Weaviate, RAG ★ **Vector/ANN search sim** `[senior]`
30. Distributed SQL / NewSQL — CockroachDB, TiDB, YugabyteDB, Spanner, Aurora DSQL; "Postgres won the API" `[staff]`
31. Analytics, columnar & time-series — ClickHouse, DuckDB, OLAP/columnar, TimescaleDB, InfluxDB, the lakehouse `[senior]`
32. Cloud-native & the modern DBA — managed DBs, Docker/K8s operators, IaC (Terraform/Ansible), observability, autoscaling `[senior]`

**VIII · Mastery**
33. Security & data protection — authN/authZ, RBAC/RLS, hashing & encryption (rest/transit), SQL injection, least privilege `[senior]`
34. Performance engineering — profiling, slow-query analysis, connection pooling, N+1, caching layers, capacity `[senior]`
35. Choosing the right database — the decision framework ★ **Database Picker** `[senior]`
36. Mental models gallery + glossary / cheat-sheet — the pictures to recall; bilingual glossary; one-page reference `[middle]`

*(Scope is adjustable. Modules can merge/split; ~32–36 is the target band. Adding/removing modules
is an "ask the user first" change per §10.)*

## 6. Signature interactives (the differentiator) + diagram-first baseline

**Policy (user choice 2026-06-23 = curated simulations only):** build a small, cheap, reusable
sim/quiz framework; ship **~6–8 signature interactives** where they add real insight, and a **crisp
SVG diagram + table** everywhere else ("maximal where useful"). **No WASM/real SQL engine.** Each sim
has a non-animated step fallback (a11y / `prefers-reduced-motion`).

Signature interactives (priority order):

1. ★ **B-Tree / B+Tree visualizer** *(M13)* — insert/search keys; watch nodes fill, **split**, and the
   tree grow; toggle B-Tree vs B+Tree (leaf links + range scan). The iconic "why databases are fast"
   sim. **Golden-standard centerpiece (S1).**
2. ★ **Query Planner / EXPLAIN** *(M16)* — pick a query + which indexes exist; watch the planner choose
   seq-scan vs index-scan, the join algorithm and order, and the (simulated) cost/rows change.
3. ★ **Isolation anomalies** *(M18)* — interleave two transactions on a timeline; toggle the isolation
   level; watch dirty read / non-repeatable / phantom / write-skew appear and disappear.
4. ★ **MVCC** *(M19)* — row versions, transaction snapshots, visibility, and vacuum reclaiming dead
   tuples; contrast with lock-based concurrency.
5. ★ **Replication & failover** *(M21)* — leader + followers, sync vs async, replication lag, and a
   leader failure triggering failover; see the data-loss window for async.
6. ★ **CAP / consistency** *(M23)* — partition the network, choose C or A, and watch reads/writes
   succeed or block; extend to PACELC's latency-vs-consistency trade.
7. ★ **LSM-tree compaction** *(M15)* — writes hit the memtable → flush to SSTable → leveled
   compaction; visualize write/read/space amplification vs a B-Tree.
8. ★ **Vector / ANN search** *(M29)* — points in 2-D embedding space; exact-kNN vs an HNSW graph walk;
   recall-vs-speed trade-off.

Plus the **Landscape Map** landing (clickable families → module, like DPmap) and the **Database
Picker** decision widget *(M35, data in `decide.ts`)*. Opportunistic light interactives elsewhere
(ER builder M6, Normalization stepper M7, Sharding/partition M22). *(8 signature listed; trim the
lighter ones — LSM, Vector — if a session runs long. The B-Tree visualizer is the golden centerpiece.)*

## 7. Theme / brand — **dark editorial + DB-family palette** (user choice 2026-06-23)

Cool, engineered, editorial feel: a **deep slate/ink dark** base + **PostgreSQL-derived blue** primary
accent + cream-cool text. Portfolio-cohesive with the sibling guides, but with a distinct "database"
identity. Each engine keeps its **brand color** in diagrams for instant recognition.

Core tokens (tune at scaffold; contrast-checked on dark):
```
--bg:#0E1217   --surface:#151B23   --s2:#1C242E   --line:#28323D  --line2:#384556
--tx:#E9EEF3   --tx2:#A7B4C2       --tx3:#6B7886
--accent:#5B9BD5          /* PostgreSQL-derived blue, brightened for dark — primary */
--accent-deep:#336791     /* official Postgres "elephant" blue — fills / borders */
--accent-bright:#86BCEA   /* headings / glow highlight */
```
**Two palettes, kept distinct (document both in `tokens.css`):**

*Concept semantics* (used in most internals diagrams/sims):
- **blue `#5B9BD5`** = query / read path / SQL / relational
- **violet `#A78BFA`** = storage / index / pages / on-disk structures
- **green `#6CC24A`** = transaction committed / durable / "safe" / success
- **cyan `#38BDF8`** = distribution / replication / network / I/O
- **amber `#F2A93B`** = analytics / columnar / warehouse / time-series
- **red `#F87171`** = anomaly / conflict / deadlock / danger / security boundary

*Engine brand chips* (only when labeling a specific product):
- PostgreSQL `#336791` · MySQL `#00758F` + `#F29111` · MongoDB `#13AA52` (bright `#00ED64`) ·
  Redis `#DC382D` (Valkey noted alongside) · Cassandra/wide-column `#1287B1` · SQLite `#0F80CC` ·
  ClickHouse/analytics `#FFCC01` on dark · vector/AI `#A78BFA`.

Fonts (all free/Google) — proposed for portfolio cohesion: **Fraunces** (display serif — editorial,
optical sizing) · **Inter** (body) · **JetBrains Mono** (SQL/DDL/code/labels — extra important here).
Favicon: inline SVG (a coral/blue spark or a stylized cylinder/index-node on dark).
Footer: **"Vasyl Krupka · Senior Fullstack Engineer"** + 🇺🇦. Dark is primary; light optional later.

## 8. Internationalization (EN / UA)

- `Localized = { en; uk }` for all content; `src/i18n/ui.ts` for chrome strings; `useLang()` +
  `<T value={...}/>` / `t(...)` to resolve. Toggle in TopBar; persist choice in `localStorage`
  (standalone app, not a Claude.ai artifact — localStorage is fine here).
- **Author EN first, UA second.** Keep ALL technical terms English in UA (SQL, B-Tree, B+Tree, index,
  MVCC, WAL, transaction, isolation, sharding, replication, ACID, CAP, PACELC, LSM, SSTable, vector,
  embedding, HNSW, OLAP/OLTP, JOIN, CTE, window function…). Translate only explanation/analogy.
- `<html lang>` follows the toggle; search indexes both languages.

## 9. Deliverables

- **Web guide** (this app) — primary.
- **README.md** — public overview + live link + local commands.
- **CLAUDE.md** (this file) + **CURRICULUM.md** kept current.
- **Deferred / optional:** per-concept deep-dive **PDF** booklet and **LinkedIn** assets (decide later;
  not in scope for the core build).

## 10. Conventions (incl. user rules)

- TypeScript **strict** + `noUnusedLocals/Parameters`; **ESLint clean** (build fails otherwise) —
  generate code with linters in mind (user rule 5).
- Content edited **only** in `src/data/*`; never hand-edit rendered output.
- **Correctness:** every non-trivial product claim must be verifiable — fill `sources`; **web-search
  to confirm** version-sensitive facts (versions, licensing, availability, benchmarks, dates). Each
  content session ends with a verification step (typecheck + build + data-integrity + fact spot-check).
  High-stakes facts → double-check. Challenge the curriculum when verification contradicts it.
- **Accessibility:** keyboard nav, focus rings, ARIA on sims, `prefers-reduced-motion` step fallback,
  contrast-checked palette.
- **User working rules (apply every session):** (1) specific solutions, not generic; (2) brief "why",
  not long lectures unless asked; (3) describe change + why **before** doing it; (4) mark in-code edits
  `// CHANGED:`; (5) lint-aware; (6) reliability/security/best-practice first; (7) ask when unclear;
  (8) don't just agree — challenge wrong/partial reasoning with clarifying questions.
- Be concise and direct (user preference).
- **Session summary (end of EVERY session — user rule):** always close with **(1)** what was
  done/implemented; **(2)** suggested **branch name** + **commit message** + **short description**;
  **(3)** challenges/questions, if any. Branch convention `sN-short-topic`
  (e.g. `s1-scaffold-btree-golden`); commit style: concise imperative.

## 11. Deploy (GitHub Pages via Actions)

- `.github/workflows/deploy.yml`: on push to `main` → `actions/checkout` → `setup-node@22` → `npm ci`
  → `npm run build` → `upload-pages-artifact (dist)` → `deploy-pages`. Pages **Source = GitHub Actions**.
- `vite base:'./'` + hash routing + `public/.nojekyll`. **Decided 2026-06-23 (user):** repo
  **`database-comprehensive-guide`** on account **`endorrfin`** → live URL
  **`https://endorrfin.github.io/database-comprehensive-guide/`** (base `'./'` keeps it sub-path-safe).
- **Suggested GitHub "Description":** *"Deep, interactive, bilingual (EN/UA) guide to how databases
  actually work — relational & NoSQL internals, indexing, transactions, distribution, and modern
  engines, with hero simulators."* Suggested **topics/tags:** `databases · sql · nosql · postgresql ·
  mongodb · indexing · b-tree · transactions · mvcc · replication · vector-database · vite · react ·
  typescript · github-pages`.
- **Done (user, 2026-06-23):** repo `database-comprehensive-guide` @ `endorrfin` created, Pages
  **Source = GitHub Actions**, site **live** at `https://endorrfin.github.io/database-comprehensive-guide/`
  (verified by user; e.g. `#/glossary`). The Action redeploys on push to `main` — **branch work (S2–S4)
  only appears live once committed and merged to `main`.**

## 12. Gotchas / constraints (read before building)

- **`_examples/` must be excluded** from the git repo & deploy: it holds reference/seed material.
  Add it to `.gitignore` (deploy ships only `dist/`, so it never reaches the live site anyway).
- **Build tool:** recent Vite uses **Rolldown**. On **Apple-silicon (M1 Max)** an npm optional-dep bug
  can leave the native binary missing (`Cannot find module …-darwin-arm64`); reinstall the platform
  package if so. **CI on linux-x64 is unaffected.**
- **This Linux sandbox blocks `unlink`** on the mounted FS → Vite `emptyOutDir` fails on a *rebuild*
  into an existing dir (EPERM); and don't run git that needs `.git/index.lock` cleanup against the live
  repo from the sandbox. Workaround in-sandbox: build into a fresh `--outDir` or set
  `build.emptyOutDir:false`, and **verify in a scratch copy**. The user's Mac & CI are unaffected.
- **No browser in the sandbox** → can't screenshot the running app. Validate via `tsc` + `vite build`
  (must pass) + the data-integrity check + SSR/route smoke. Prefer `mv`/overwrite over `rm`.
- **node_modules / native binaries:** the workspace holds **source only**; build in scratch to avoid a
  darwin/linux binary mismatch — the user runs `npm install` locally for darwin-arm64.
- **Product facts drift** — anything dated here is "verified 2026-06-23" and **must be re-checked** at
  build time for the module that uses it.

### Verified database facts (2026-06-23 — re-verify per module; sources in `CURRICULUM.md`/module `sources`)
- **PostgreSQL:** latest stable **18.4** (2026-05-11); **19 Beta 1** out (2026-06-04), 19 GA expected
  ~Sept/Oct 2026. PostgreSQL was the **standout DB-Engines growth in H1 2026** (+21.97). PG14 EOL
  2026-11-12. `pgvector` is the leading vector solution for most RAG (~tens of millions of vectors).
- **MySQL:** **8.4 LTS** (premier patches ~through 2032); **8.0 reached EOL in 2026**; **9.x Innovation**
  track adds the HyperGraph optimizer and vector support. Calendar-versioned LTS/Innovation model.
- **MariaDB:** **12.3.x LTS** (May 2026; supported to ~2029); 13.0 preview rolling; vector engine in
  Enterprise Platform 2026.
- **MongoDB:** latest **8.3** (8.0 shipped 45+ improvements: better throughput, faster bulk/concurrent
  writes, queryable encryption, native vector search); MCP server + Atlas Performance Advisor. +11.24 H1.
- **Redis / Valkey:** Redis relicensed BSD → SSPL/RSAL (Mar 2024), added **AGPLv3** as a third option
  (May 2025, tri-license). **Valkey** = Linux-Foundation fork from Redis **7.2.4**, now the **default**
  in Fedora 42 / Ubuntu 26.04 LTS / Debian 13 and in AWS ElastiCache; ~90% command-compatible and
  beginning to diverge. Teach the licensing story explicitly (M26).
- **DB-Engines top 4 (Jan 2026):** Oracle, MySQL, SQL Server, PostgreSQL — unchanged for >1 year;
  Databricks/Snowflake/Microsoft Fabric rising on the analytics/AI wave.
- **Vector / AI:** RAG is the primary driver; pgvector (HNSW/IVFFlat), Qdrant (Rust), Milvus (billions,
  distributed), Pinecone (managed), Weaviate (hybrid search). HNSW is the dominant ANN index.
- **Distributed SQL / NewSQL:** TiDB (TiKV/Raft + TiFlash HTAP), CockroachDB (Postgres-wire,
  range-based), YugabyteDB, Spanner (TrueTime; on-prem GA 2025), Aurora DSQL. "**Postgres won the API**"
  — many engines are Postgres-wire-compatible.
- **Analytics / time-series:** **ClickHouse** + **DuckDB** lead analytics/OLAP; StarRocks, Druid for
  real-time; **TimescaleDB** (PG extension) and **InfluxDB 3** for time-series.

## 13. Session roadmap (step by step, ~18–20 sessions)

> Pattern (from the gold standard): **lock a golden module first**, then batch. Each session ends with
> typecheck + build + (after Pages is live) a push to confirm deploy. Bilingual = author EN then UA per module.

- **S0 · Planning** *(this session)* — agree stack/structure/scope/theme; write `CLAUDE.md`,
  `CURRICULUM.md`, `PROJECT-BRIEF.md`; task list. **Status: drafted, awaiting user approval before S1.**
- **S1 · Scaffold + golden module** — Vite/React 19/TS app; DB-dark theme; hash router; i18n (EN/UA
  toggle); layout (TopBar+search+lang, Sidebar, Footer); deploy workflow; `.gitignore`; favicon/footer;
  finalize bilingual `concepts.ts` schema; **Landscape-Map landing** + **full sidebar skeleton of all
  8 sections / 36 modules / topics** (bodies may stub) so the user can run it and see design + menu +
  navigation; **golden module M13 Indexing & the B-Tree fully built + hero ★ B-Tree/B+Tree visualizer**.
  Verify build + first Pages deploy.
- **S2 · Foundations core** — M1 What a database is; M2 The landscape + **Landscape Map** polish;
  M3 SQL vs NoSQL (strengths/weaknesses).
- **S3 · Relational foundations** — M4 Relational model & SQL foundations; M5 Anatomy of a query (+ lifecycle sim).
- **S4 · Design** — M6 ER modeling (+ ER interactive); M7 Normalization (+ **Normalization sim**).
  **Both steppers are confirmed in-scope for S4 (user decision 2026-06-23) — not trimmed.**
- **S5 · SQL mastery** — M8 Keys & constraints; M9 Data types done right.
- **S6 · SQL mastery** — M10 SQL in depth (joins/CTE/window); M11 Views, procedural SQL & triggers.
- **S7 · Storage internals** — M12 How data is stored; M14 The index toolbox. *(M13 done in S1.)*
- **S8 · Storage internals** — M15 LSM-trees (+ **LSM sim**); M16 Query planning (+ **Query Planner sim**).
- **S9 · Transactions** — M17 ACID & WAL; M18 Isolation anomalies (+ **Isolation sim**).
- **S10 · Concurrency** — M19 MVCC (+ **MVCC sim**); M20 Distributed transactions.
- **S11 · Distribution** — M21 Replication (+ **Replication sim**); M22 Partitioning & sharding (+ sim).
- **S12 · Distribution** — M23 CAP/PACELC (+ **CAP sim**); M24 HA, backups & DR.
- **S13 · NoSQL families** — M25 Document (MongoDB); M26 Key-value & caching (Redis/Valkey).
- **S14 · NoSQL families** — M27 Wide-column (Cassandra); M28 Graph.
- **S15 · Modern engines** — M29 Vector & AI (+ **Vector/ANN sim**); M30 Distributed SQL/NewSQL.
- **S16 · Modern engines** — M31 Analytics/columnar/time-series; M32 Cloud-native & the modern DBA.
- **S17 · Mastery** — M33 Security; M34 Performance engineering.
- **S18 · Mastery + polish** — M35 Choosing the right database (+ **Database Picker**); M36 Mental
  models gallery + glossary + cheat-sheet; global search, flashcards, mobile/a11y/perf, **bilingual QA**.
- **S19–S20 · Buffer** — extra "maximal" interactives, full UA pass, final QA; optional PDF/LinkedIn pack.

### Backlog / deferred enhancements (agreed with user 2026-06-23)
- **★ FLOAT-vs-numeric drift stepper (M9)** — promote the static `float-trap` figure into a real interactive:
  step a running sum (add `0.1` / one cent N times) in `double precision` vs `numeric`, watch the float result
  drift off the exact decimal and the rounding error accumulate row by row. Follow BTreeSim conventions
  (deterministic, play/pause/step, `prefers-reduced-motion` fallback, ARIA live region); register under a new
  sim key and flip M9's `float-trap` block from `figure` → `sim`. Slot opportunistically (S8 storage, or S19–S20).
- **★ Window-frame stepper (M10)** — promote the static `window-frame` figure into a real interactive: step a
  window's frame across partitioned/ordered rows, contrast `ROWS` vs the default `RANGE … CURRENT ROW` (watch tied
  peers lump together), watch a running aggregate update per row, and toggle `PARTITION BY` to see the total reset
  at each boundary. Window functions are the single highest-insight SQL concept to animate; **flagged (not built)
  in S6** to keep the two dense modules tight and avoid bundle growth before the code-split below. Follow BTreeSim
  conventions (deterministic, play/pause/step, reduced-motion fallback, ARIA); register a sim key and flip M10's
  `window-frame` block from `figure` → `sim`. Slot opportunistically (S19–S20).
- **Bundle code-split / per-module lazy-load — ✅ DONE S12:** React.lazy for all 15 sims + 26 figures
  in `registry.tsx` (typed `lazyNamed()` helper); `<Suspense>` in `blocks.tsx` FigureBlock/SimBlock; lazy
  route pages in `App.tsx`; `manualChunks` for `react-vendor`. Result: 441 KB gzip monolith → 328 KB
  gzip index + 60 KB react-vendor + on-demand sim/figure chunks (~1–5 KB each). Remaining index bulk =
  **`concepts.ts`** (Sidebar/TopBar import eagerly for nav/search). Next lever (backlog): **meta.ts
  data-split** — separate module metadata from content bodies + prebuilt search index (the `gen:meta`
  + `meta.ts` pattern from Claude guide S10c; would drop index from 328 → ~60 KB gzip). Slot S16–S17
  or S19–S20 buffer.

## 14. Status / progress log

- **2026-06-23 · S0 Planning** — Reviewed the gold-standard sibling guides (`../Node-js guide` = gold
  standard; `../Claude guide` = most recent build of the same architecture; `../Design Principles &
  Patterns guide` = interactive-map form) + the database `_examples/info.txt` seed (beginner
  SQL/PostgreSQL course · relational-design+indexing course · internals/SQLite-from-scratch +
  cloud-PostgreSQL/HA course). **Web-verified the 2026 database landscape** (PostgreSQL 18.4/19-beta,
  MySQL 8.4 LTS/9.x, MariaDB 12.3, MongoDB 8.3, Redis→Valkey licensing fork, DB-Engines top 4 +
  analytics/AI risers, vector DBs/pgvector/HNSW, distributed SQL, ClickHouse/DuckDB — see §12).
  **Decisions locked with user:** bilingual EN/UA · internals-first taught through engines with **all
  three emphases** (universal internals backbone + PostgreSQL deep-dive spine + balanced SQL/NoSQL
  families) · **full dedicated modern/specialized section** · **dark editorial + DB-family palette** ·
  **curated simulations only** (no WASM SQL engine). Stack = Vite + React 19 + TS (mirrors gold
  standard). This `CLAUDE.md` + `CURRICULUM.md` + `PROJECT-BRIEF.md` written; task list created.
  Proposed **8 sections / 36 modules**, golden module **M13 Indexing & the B-Tree + the B-Tree/B+Tree
  visualizer**, repo `database-comprehensive-guide` @ `endorrfin`.
  **Next: on user approval of the plan → S1 scaffold + golden module.**
  **Open / to confirm:** (a) the referenced `list of concepts.txt` is not in the folder — proceed with
  the `CURRICULUM.md` concept map, or the user adds the file; (b) module count 36 vs a tighter 32 band;
  (c) golden = M13 B-Tree (recommended) vs a more foundational opener (M5 query lifecycle / M2 landscape).

- **2026-06-23 · S1 Scaffold + golden module** *(branch `s1-scaffold-btree-golden`)* — Built the full
  app on **Vite 8.1 + React 19.2 + TS 6.0 (strict)**, pinned latest stable (also ESLint 10.5 flat config,
  typescript-eslint 8.62, `@vitejs/plugin-react` 6, tsx 4.22; versions web/npm-verified at scaffold).
  **Delivered:** DB-dark theme + DB-family palette (`tokens.css`/`global.css`/`components.css`, Fraunces/
  Inter/JetBrains Mono); tiny **hash router** (`#/map`, `#/m/<mod>/<topic>`, `#/decide`, `#/mental-models`,
  `#/glossary`); **EN/UA i18n** (split `lang.ts` hook + `LangProvider`/`T`, `ui.ts` chrome strings,
  localStorage persist, `<html lang>` sync); layout (**TopBar** with live search + level filter + EN/UA
  toggle + mobile drawer, collapsible **Sidebar** with level-dimming + persisted open-state, **ProgressBar**,
  **Footer** brand+🇺🇦); the **Landscape-Map landing** (clickable families → Drawer → module + a full
  section/module overview grid); the **full navigable skeleton of all 8 sections / 36 modules** (titles,
  taglines, mental models authored EN+UA for every module; topics/sources stubbed); study surfaces
  (**mental-models gallery** = all 36, **bilingual glossary** = 24 terms seeded); the data contract in
  `src/data/types.ts` + SSOT `concepts.ts` + figure/sim **registry**. **Golden module M13 fully authored
  EN+UA** (5 topics, node-anatomy SVG figure, complexity table, B-Tree↔B+Tree compare, 2 callouts, 5 key
  points, 3 pitfalls, 3 interview Q&A, **5 web-verified sources** — PG nbtree README / Lehman&Yao 1981,
  PG index-only-scan + visibility-map docs, Comer 1979, Use-The-Index-Luke). **★ B-Tree/B+Tree visualizer:**
  pure engine extracted to `src/lib/btree.ts` (deterministic rebuild), component does insert/search/range-scan,
  B-Tree↔B+Tree toggle, demo play/pause/step, reduced-motion fallback (Play hidden, Step only), ARIA + live
  region. **Deploy:** `.github/workflows/deploy.yml` (Node 22 · npm ci · typecheck · lint · check:data ·
  test:btree · build · Pages), `public/.nojekyll`, `vite base:'./'`, favicon, README, `package-lock.json`.
  **Verification (scratch build, linux-x64):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (8 sections,
  36 modules [1 authored, 35 stubs], **267 Localized EN+UA pairs**, registry keys resolve, cross-links valid)
  · `test:btree` ✓ (**346 invariant checks** across B-Tree & B+Tree on DEMO/ascending/descending/duplicates)
  · `vite build` ✓ (47 modules, JS 95 KB gzip / CSS 5.7 KB gzip, relative `./assets/` base for Pages).
  **Challenge surfaced & fixed by the test:** incremental B+Tree leaf `next`-links went stale across splits
  (left sibling pointed at a detached pre-split node) — replaced with a `relinkLeaves()` pass that rebuilds
  the leaf chain in structural order after each build; all 346 checks then pass.
  **Sandbox gotcha hit (expected, §12):** the live repo now has a stale **`.git/index.lock`** (sandbox
  `unlink` is blocked) — **user must `rm -f ".git/index.lock"` locally before committing**; then
  `npm install` (darwin-arm64) + `npm run verify`.
  **Next (S2):** Foundations core — M1 What a database is; M2 The landscape (+ Landscape-Map polish);
  M3 SQL vs NoSQL. **Pending user:** create repo `database-comprehensive-guide` @ `endorrfin`; after first
  push set Settings → Pages → Source = GitHub Actions.

- **2026-06-23 · S2 Foundations core** *(branch `s2-foundations-core`)* — Authored the three Section-I
  on-ramp modules **fully EN+UA** to the M13 depth bar, lifting authored modules from 1 → **4**.
  **M1 · What a database is** (4 topics: files→DBMS · OLTP vs OLAP · cost of getting it wrong · the
  vocabulary; new **files-vs-DBMS** SVG figure, OLTP/OLAP compare, 9-row vocabulary table, 2 callouts,
  5 keyPoints, 3 pitfalls, 3 interview Q&A, 5 web-verified sources). **M2 · The landscape** *(signature)*
  (4 topics: the families · shape-of-data drives choice · engines on the map 2026 · how to read the
  guide; new embeddable **★ FamiliesMap** sim + a `family→engines→when` table **derived from** the shared
  data so it can't drift, senior/“boring is a feature” callout, full endcaps, 5 sources). **M3 · SQL vs
  NoSQL** (5 topics incl. the requirement-2 centerpiece **strengths/weaknesses-per-family** table; new
  **SQL↔NoSQL positioning-quadrant** figure, relational-vs-non-relational compare, convergence section,
  polyglot-persistence callout, 5 sources). **Refactor:** extracted the family taxonomy into shared
  **`src/data/families.ts`** (added `level`); `LandscapeMap` now consumes it. **Landing polish:** guided
  **“Start here”** path (M1→…→MVCC, level-coded), a **level filter** wired to the *global* app-state
  (in sync with the TopBar), refined family cards (when-it-fits peek + level dot), dimming on the
  overview grid. New components: `figures/FilesVsDbms`, `figures/SqlNoSqlQuadrant`, `sims/FamiliesMap`
  (all registered); 2 new `ui.ts` strings; CSS for path/level-filter/fammap appended to `components.css`.
  **Web-verified this session** (sources in module `sources[]`): DB-Engines H1 2026 — PostgreSQL the
  fastest-growing engine (+21.97), MySQL still #1 by score, top-4 static >1yr; OLTP/OLAP (IBM/AWS);
  Postgres durability via WAL + Redis persistence opt-in (M1); MongoDB multi-doc ACID 4.0(2018)→sharded
  4.2(2019), Postgres JSON 9.2/JSONB 9.4 ≥ SQL:2023 native JSON (M3 convergence).
  **Verification (repo + scratch, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓
  (**8 sections, 36 modules [4 authored, 32 stubs], 493 Localized EN+UA pairs**, 2 sims + 3 figures,
  all registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · `vite build` ✓
  (**54 modules**, JS 119 KB gzip / CSS 6.18 KB gzip).
  **Sandbox gotchas hit (expected, §12):** the repo `node_modules` is **darwin-arm64** → `tsc`/`eslint`
  ran fine but `tsx`/`vite` need linux binaries; added `@esbuild/linux-arm64@0.28.1` +
  `@rolldown/binding-linux-arm64-gnu@1.1.2` with `--no-save --no-package-lock` (additive; user’s darwin
  install + lock untouched). Built into fresh `dist-s2/` (unlink still blocked → can’t delete it in-sandbox;
  added `dist-s2/` to `.gitignore`). Stale **`.git/index.lock`** persists — **user must `rm -f
  ".git/index.lock"` locally before committing**, then `npm install` (darwin-arm64) + `npm run verify`.
  **Next (S3):** Relational foundations — M4 Relational model & SQL foundations; M5 Anatomy of a query
  (+ query-lifecycle sim). **Pending user:** create repo `database-comprehensive-guide` @ `endorrfin`;
  set Pages → Source = GitHub Actions after first push.

- **2026-06-23 · S3 Relational foundations** *(branch `s3-relational-foundations`)* — Authored the two
  remaining Section-I modules **fully EN+UA** to the M13 depth bar, **completing Section I** and lifting
  authored modules from 4 → **6**. **M4 · The relational model & SQL foundations** `[beginner]` (5 topics:
  tables/rows/columns/domains · keys & relationships · the relational algebra behind SELECT · SELECT/
  WHERE/GROUP BY/ORDER BY · declarative vs imperative; new **relational-model** SVG figure [two relations
  with PK/FK + 1:N arrow], a 6-row formal↔SQL↔everyday vocabulary table, a relationship-shapes table, the
  **relational-algebra → SQL** table [σ/π/⋈/∪/−/×], the **SQL logical processing order** table, worked DDL
  + SELECT code blocks, tip/security/senior callouts, 5 keyPoints, 3 pitfalls, 3 interview Q&A, 5
    web-verified sources). **M5 · Anatomy of a query** `[middle]` *(signature)* (4 topics: the lifecycle ·
    logical vs physical plan · where time goes · why this matters; embeds the **★ query-lifecycle sim**,
    a stage→job table, a logical-vs-physical compare, a where-the-time-goes cost ladder, a stage→later-module
    map, senior/tip callouts, 5 keyPoints, 3 pitfalls, 3 interview Q&A, 5 sources).
    **★ Query-lifecycle stepper** (`sims/QueryLifecycleSim.tsx`, registry key `query-lifecycle`): a fixed SQL
    statement walks Parser → Rewriter → Planner → Executor → Storage → Result; per-stage artifact (parse tree,
    plan tree, page reads) + a single **"index on customer_id?" toggle** that flips the planner between Seq
    Scan and Index Scan and the pages-read meter between ~1,300 and ~3 — the payoff of "same SQL, many physical
    plans". Deterministic, click-any-stage, play/pause/step, reduced-motion fallback (Play hidden), ARIA live
    region — mirrors BTreeSim. New CSS `.qlife*` block appended to `components.css`; both assets registered.
    **Web-verified this session** (sources in module `sources[]`): the PostgreSQL 18 docs **"The Path of a
    Query"** (parser → rewrite system → planner/optimizer → executor; the planner's own seq-scan-vs-index-scan
    cost example; the executor's recursive plan-tree pull from the storage system) — confirms PG latest
    **18.4**, **19 Beta 1** (2026-06-04); **Codd 1970** "A Relational Model of Data for Large Shared Data
    Banks" + the relational algebra (σ/π/⋈/set ops); the **SQL logical clause order** enumerated in the PG
    SELECT reference; primary/foreign keys from the PG constraints docs; EXPLAIN as logical-vs-physical.
    **Verification (repo + scratch, linux):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (**8 sections,
    36 modules [6 authored, 30 stubs], 731 Localized EN+UA pairs**, **3 sims + 4 figures**, all registry keys
    resolve, cross-links valid) · `test:btree` ✓ (346 checks) · `vite build` ✓ (**58 modules**, JS 142 KB
    gzip / CSS 6.66 KB gzip) · **new: render smoke** (`react-dom/server` renderToStaticMarkup of the sim +
    figure inside `LangProvider`) ✓ — catches hook/JSX runtime errors the typecheck/build miss.
    **Sandbox gotchas (expected, §12):** linux binaries from S2 (`@esbuild/linux-arm64`,
    `@rolldown/binding-linux-arm64-gnu`) still present → all tooling ran; built into fresh `dist-s3/`. tsx
    defaults JSX to the **classic** runtime, so the render smoke must run with `--tsconfig tsconfig.app.json`
    (which sets `jsx: react-jsx`); harmless for the real Vite build. The render-smoke file is neutralized +
    gitignored (`scripts/_smoke-*.ts`) since the sandbox can't unlink — **user can `rm scripts/_smoke-s3.ts`
    locally**. Stale **`.git/index.lock`** likely persists — **`rm -f ".git/index.lock"` before committing**,
    then `npm install` (darwin-arm64) + `npm run verify`.
    **Next (S4):** Design — M6 ER modeling (+ ER interactive); M7 Normalization (+ Normalization sim).
    **Pending user:** create repo `database-comprehensive-guide` @ `endorrfin`; set Pages → Source = GitHub
    Actions after first push.

- **2026-06-23 · S4 Design** *(branch `s4-design-er-normalization`)* — Authored the two Section-II design
  modules **fully EN+UA** to the M13 depth bar, lifting authored modules from 6 → **8** and shipping **both
  confirmed S4 steppers** (no trim). **M6 · ER modeling & schema design** `[middle]` *(signature)* (5 topics:
  entities & attributes · relationships & cardinality · strong vs weak entities · conceptual→logical→physical ·
  modeling smells & fixes; new **er-notation** SVG legend [Chen blocks + crow's-foot endings], the
  **cardinality → schema** table, a strong-vs-weak compare, a design-lifecycle table, a smells→fixes table, a
  worked M:N junction-table DDL code block, tip/senior/warn callouts incl. the **EAV anti-pattern**, 5
  keyPoints, 3 pitfalls, 3 interview Q&A, 5 web-verified sources). **M7 · Normalization & denormalization**
  `[middle]` *(signature)* (4 topics: functional dependencies & anomalies · 1NF→2NF→3NF · BCNF · denormalization
  on purpose; new **update-anomalies** SVG figure [one duplicated fact → insert/update/delete chips], the
  **normal-forms** table mapped to Kent's phrase, the classic `teaches` **BCNF-violation** table, a
  normalized-vs-denormalized compare, senior/warn callouts, 5 keyPoints, 3 pitfalls, 3 interview Q&A incl. a
  staff denormalization-safety answer, 5 sources).
  **★ ER explorer** (`sims/ErExplorer.tsx`, key `er-explorer`): flip cardinality **1:1 · 1:N · M:N** → an SVG
  ER diagram (crow's-foot endings) + the **resulting relational schema** rebuilds — the FK moves to the many
  side, and for M:N a **junction table appears** (PK·FK badges, "new" tag). Toggle-driven, ARIA live region.
  **★ Normalization stepper** (`sims/NormalizationSim.tsx`, key `normalization-stepper`): the classic
  student/course/advisor table walks **0NF→1NF→2NF→3NF**; tables split, duplicated cells (red tint) vanish,
  and four "one fact, one place" checks turn green. Deterministic, play/pause/step, clickable steps,
  reduced-motion fallback (Play hidden), ARIA — mirrors BTreeSim. New CSS `.er-*` + `.nf-*` blocks appended to
  `components.css`; both sims + both figures registered; glossary +5 terms (functional dependency, cardinality,
  junction table, BCNF, denormalization).
  **Web-verified this session** (sources in module `sources[]`): **Chen 1976** "The Entity-Relationship Model—
  Toward a Unified View of Data" (ACM TODS 1:9-36, doi 320434.320440); crow's-foot cardinality (**Everest
  1976**, per the ER-model literature); **PostgreSQL 18** foreign-key (3.3 `tutorial-fk`) + constraints
  (`ddl-constraints`) docs for the cardinality→FK / M:N junction mapping; **Codd 1970** (introduced
  normalization / 1NF) + **Codd 1971** SIGFIDET "Normalized Data Base Structure" (2NF/3NF); **Kent 1983** "A
  Simple Guide to Five Normal Forms" (CACM 26(2):120-125, doi 358024.358054 — the "key, the whole key, and
  nothing but the key" summary); **BCNF** = every determinant of a non-trivial FD is a candidate key, and the
  3NF dependency-preservation trade.
  **Verification (repo + scratch, linux):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (**8 sections,
  36 modules [8 authored, 28 stubs], 941 Localized EN+UA pairs**, **5 sims + 6 figures**, 29 glossary terms,
  all registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓
  (`react-dom/server` renderToStaticMarkup of both new sims + both figures inside `LangProvider`, asserting
  the deterministic default content — ErExplorer 1:N Customer/Order, NormalizationSim 0NF non-atomic cell) ·
  `vite build` ✓ (**64 modules**, JS 169.56 KB gzip / CSS 7.32 KB gzip, relative `./assets/` base).
  **Sandbox gotchas (expected, §12):** linux helper binaries from S2 (`@esbuild/linux-arm64`,
  `@rolldown/binding-linux-arm64-gnu`) still present → all tooling ran; built into fresh `dist-s4/` (unlink
  blocked → can't delete in-sandbox; `dist-*/` already gitignored). The render-smoke file is neutralized +
  gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s4.ts`** (and the stale `_smoke-s3.ts`).
  Stale **`.git/index.lock`** likely persists — **`rm -f ".git/index.lock"` before committing**, then
  `npm install` (darwin-arm64) + `npm run verify`.
  **Next (S5):** SQL mastery — M8 Keys & constraints; M9 Data types done right. **Pending user:** create repo
  `database-comprehensive-guide` @ `endorrfin`; set Pages → Source = GitHub Actions after first push.

- **2026-06-23 · S5 SQL mastery (keys/types)** *(branch `s5-keys-constraints-data-types`)* — Authored the two
  Section-II modules **fully EN+UA** to the M13 depth bar, lifting authored modules from 8 → **10** (Section II
  now 4 of 6). **M8 · Keys & constraints** `[middle]` (4 topics: the key family super→candidate→primary ·
  foreign keys & referential integrity · the constraint toolbox · push invariants into the database; new
  **referential-actions** SVG figure [deleting customers.id=7 plays out RESTRICT/CASCADE/SET NULL on two child
  orders], a key-vocabulary table, the **five referential actions** table, a core-constraints table, an
  app-validation-vs-DB-constraint compare, a worked IDENTITY/FK/CHECK DDL block, tip/senior/warn callouts
  [UNIQUE-plus-NULL, IDENTITY over serial, the **unindexed-FK full-scan** trap, invariants-not-workflow], 5
  keyPoints, 3 pitfalls, 3 interview Q&A, 5 web-verified sources). **M9 · Data types done right** `[middle]`
  (4 topics: a type is a constraint · numbers & the FLOAT-for-money disaster · text/time/zones · beyond scalars
  JSONB/array/enum/UUID; new **float-trap** SVG figure [`0.1+0.2` = `0.30000000000000004` in float8 vs exact
  `0.3` in numeric], a number-type chooser table, a rich-type "reach for X vs a column/table" compare, a worked
  numeric/timestamptz/text DDL block, stringly-typed/float-is-not-evil/timezone-trap/JSONB-is-not-an-escape-hatch
  callouts, 5 keyPoints, 3 pitfalls, 3 interview Q&A, 5 sources).
  **Scope decision (deliberate):** M8/M9 are **non-signature** in the locked plan, so they got the non-signature
  treatment (figure + tables + compare + code, like M1/M3/M4) — **no new hero sim**. The one genuinely
  high-insight interactive here, a live **FLOAT-vs-numeric drift demo**, is captured statically by `float-trap`
  + the canonical fact; flagged to the user as an optional future add rather than scope-creeping S5.
  **Wiring:** `concepts.ts` imports m8/m9 (stubs replaced) + header comment refreshed; `registry.tsx` +2 figures
  (`referential-actions`, `float-trap`); glossary **+6 terms** (primary key, foreign key, referential integrity,
  surrogate key, generated column, jsonb) → 35. **No CSS added** (figures are pure SVG) — CSS gzip unchanged.
  **Web-verified this session** (sources in module `sources[]`): **PostgreSQL 18** makes generated columns
  **VIRTUAL by default** (STORED-only ≤17) and adds a built-in **`uuidv7()`** (RFC 9562, time-ordered; `uuidv4()`
  = `gen_random_uuid()`); **PostgreSQL 15** added **`UNIQUE … NULLS NOT DISTINCT`** and the **column-list
  `ON DELETE SET NULL (col)`** form; referential actions NO ACTION(default)/RESTRICT/CASCADE/SET NULL/SET DEFAULT;
  **`numeric` exact vs `real`/`double precision` inexact** (`0.1::float8+0.2::float8 = 0.30000000000000004`),
  `numeric` recommended for money & **`money` discouraged**; `char`/`varchar`/`text` perf-equal with `text`
  idiomatic; **`timestamptz` over `timestamp`** ("without time zone" = zoneless, not UTC); `jsonb` binary +
  GIN-indexable; **IDENTITY over serial** (PG wiki "Don't Do This").
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (**8 sections, 36 modules
  [10 authored, 26 stubs], 1134 Localized EN+UA pairs**, **5 sims + 8 figures**, 35 glossary terms, all registry
  keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server`
  renderToStaticMarkup of both new figures via the registry — asserts `referential-actions` shows the tables +
  ON DELETE/CASCADE/SET NULL chips and `float-trap` shows `0.30000000000000004` + both type lanes) · `vite build`
  ✓ (**68 modules**, JS 197 KB gzip / CSS 7.32 KB gzip, relative `./assets/` base).
  **Caught before commit:** used `var(--c-committed)`/`-soft` in `FloatTrap` — the token is `--c-commit`/
  `--c-commit-soft` (fixed); removed a self-reference (`m9-data-types` in its own `seeAlso`, → `m12-storage`).
  **Sandbox gotchas (expected, §12):** linux helpers from S2 (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`)
  still present → all tooling ran; built into fresh `dist-s5/` (unlink blocked; `dist-*/` already gitignored).
  Render-smoke file gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s5.ts`** (and stale
  `_smoke-s3.ts`/`_smoke-s4.ts`). **No stale `.git/index.lock` this session** (checked — absent), so no lock
  cleanup needed unless one reappears.
  **Next (S6):** SQL mastery cont. — M10 SQL in depth (joins/CTE/window/NULL logic); M11 Views, procedural SQL &
  triggers. **Pending user:** repo is already live (§11) — S5 appears live once committed & **merged to `main`**;
  locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s2 dist-s3 dist-s4 dist-s5`.

- **2026-06-23 · S6 SQL mastery (SQL-in-depth / views-triggers)** *(branch `s6-sql-in-depth-views-triggers`)* —
  Authored the two remaining Section-II modules **fully EN+UA** to the M13 depth bar, **completing Section II**
  (all 6 of M6–M11) and lifting authored modules from 10 → **12**. **Scope decision (recorded, user delegated):**
  kept S6 **figures-only — no new hero sim**. M10/M11 are non-signature in the locked plan (§6 reserves sims for
  the 8 signature spots + the ER/Normalization/Sharding opportunistic set); this matches the S5 precedent and the
  bundle/scope discipline, given two text-dense modules. The genuinely high-insight interactive here — a
  **window-frame stepper** — is captured statically by the new `window-frame` figure and **added to the §13
  backlog** (slot S19–S20), exactly as S5 did for the FLOAT drift stepper.
  **M10 · SQL in depth** `[senior]` (5 topics: joins & how they actually run · subqueries & CTEs · window functions ·
  aggregation beyond GROUP BY · NULL three-valued logic; new **window-frame** SVG figure; join-types table,
  three-join-algorithms table, window-function catalog, three-valued-logic truth table; CTE-vs-subquery compare;
  recursive-CTE / running-total+rank+lag / ROLLUP+GROUPING() code blocks; senior/senior/senior/tip/warn callouts;
  5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff], **6 web-verified sources**). **M11 · Views,
  procedural SQL & triggers** `[senior]` (4 topics: views as an interface · materialized views · functions/
  procedures/PL-pgSQL · triggers & where logic should live; new **view-vs-matview** SVG figure; trigger
  timing×granularity table; view↔matview compare; IMMUTABLE-function+expression-index and AFTER audit-trigger
  code; security/warn/senior/warn callouts; 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff], 6
  sources).
  **Web-verified this session** (sources in module `sources[]`): the three physical join algorithms (nested loop /
  hash / merge — PG planner-optimizer §51.5); **CTE inlining since PostgreSQL 12** (non-recursive, side-effect-free,
  single-reference) + `MATERIALIZED`/`NOT MATERIALIZED`; `WITH RECURSIVE` (anchor `UNION ALL` recursive term);
  window frame units **ROWS/RANGE/GROUPS + EXCLUDE since PG 11**, and the **default frame is `RANGE … CURRENT ROW`
  (includes tied peers, NOT ROWS)**; **GROUPING SETS/CUBE/ROLLUP since PG 9.5** + `GROUPING()`; three-valued logic
  (any NULL comparison = UNKNOWN; `IS DISTINCT FROM`; the `NOT IN`-with-NULL trap; **`GREATEST`/`LEAST` ignore NULL
  inputs — a deviation from the SQL standard**); `security_invoker` view option **added PG 15, default false**
  (owner's privileges); `CREATE MATERIALIZED VIEW` (PG 9.3) + **`REFRESH … CONCURRENTLY` needs a UNIQUE index**
  (PG 9.4); **`CREATE PROCEDURE`/`CALL` + transaction control added PG 11**; volatility VOLATILE(default)/STABLE/
  IMMUTABLE; triggers BEFORE/AFTER/INSTEAD OF × ROW/STATEMENT + **transition tables since PG 10**;
  `WHEN (OLD.* IS DISTINCT FROM NEW.*)`. (Confirmed PG latest stable **18.4**, 19 Beta 1. **MERGE / upsert
  deliberately left out of M10** per the locked curriculum — read-query depth, not DML; PG18's RETURNING OLD/NEW
  aliases noted for a possible future module.)
  **Wiring:** `concepts.ts` imports m10/m11 (stubs replaced, header + CHANGED(S6) notes); `registry.tsx` **+2
  figures** (`window-frame`, `view-vs-matview`); glossary **+6 terms** (window function, common table expression,
  materialized view, trigger, PL/pgSQL, three-valued logic) → **41**. **No CSS added** (figures are pure SVG) — CSS
  gzip unchanged at 7.32 KB.
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (**8 sections, 36 modules
  [12 authored, 24 stubs], 1333 Localized EN+UA pairs**, **5 sims + 10 figures**, 41 glossary terms, all registry
  keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server`
  renderToStaticMarkup via the registry — asserts `window-frame` shows `PARTITION BY region` + `running_total` +
  the `230` running total + partition `resets`, and `view-vs-matview` shows `materialized view` + `REFRESH` +
  `always fresh` + `stale until REFRESH`) · `vite build` ✓ (**72 modules**, JS **230 KB gzip** / CSS 7.32 KB gzip,
  relative `./assets/` base).
  **Caught before commit:** (1) an unescaped `'active'` inside a single-quoted EN interview string in M10 (the UA
  side was escaped) → `TS1005` parse error; fixed by escaping. (2) Unused `softOf` helper in `WindowFrame`
  (noUnusedLocals / ESLint `no-unused-vars`) → removed.
  **Bundle watch:** JS gzip jumped **197 → 230 KB (+33)** for two text-dense bilingual modules — reinforces the §13
  code-split backlog item (updated to "12 modules"); worth doing around S10–S12 as planned.
  **Sandbox gotchas (expected, §12):** linux helpers from S2 (`@esbuild/linux-arm64`,
  `@rolldown/binding-linux-arm64-gnu`) still present → all tooling ran; built into fresh `dist-s6/` (unlink blocked;
  `dist-*/` gitignored). Render-smoke file gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s6.ts`**
  (and any stale `_smoke-s3/4/5`). **No stale `.git/index.lock` this session** (checked — absent).
  **Next (S7):** Storage internals — M12 How data is stored; M14 The index toolbox *(M13 done in S1)*. **Pending
  user:** repo is live (§11) — S6 appears live once committed & **merged to `main`**; locally `npm install`
  (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s2 dist-s3 dist-s4 dist-s5 dist-s6`.

- **2026-06-24 · S7 Storage internals (storage / index-toolbox)** *(branch `s7-storage-internals`)* — Authored the
  two remaining Section-III pillars **fully EN+UA** to the M13 depth bar, lifting authored modules from 12 → **14**
  (Section III now 3 of 5: M12, M13, M14; M15–M16 land in S8). **Scope decision (user-confirmed this session via
  AskUserQuestion):** **build** M14's curriculum-specced light **index access-path picker** sim (S7 had the budget —
  neither module is otherwise a sim); **M12 stays figures-only** per its curriculum ("★ light" = diagram/table/compare,
  no widget). Also flipped **M12 `signature: true → false`** in `concepts.ts` — with no interactive, the "★ interactive"
  chip would overpromise; M14 keeps `signature: true` (it has the picker). **M12 · How data is stored** `[senior]`
  (4 topics: the memory hierarchy · pages & the heap · row vs column-store · big values & layout; new **memory-hierarchy**
  SVG figure [latency ladder, log-scale bars, human-scaled "if L1 = 1 s" column, memory⟷storage divider] + new
  **heap-page** SVG figure [8 kB page: header → line pointers → free space → tuples, TID/ctid pointer], a
  find-one-row-in-a-million access-cost table, a row-vs-columnar compare, a PLAIN/MAIN/EXTERNAL/EXTENDED storage table,
  a storage-tuning DDL block, 4 callouts [I/O machine, seq-vs-random, don't-run-OLAP-on-OLTP, the SELECT*/TOAST tax],
  5 keyPoints, 3 pitfalls, 3 interview Q&A, 5 web-verified sources). **M14 · The index toolbox** `[senior]` *(signature)*
  (5 topics: the toolbox & hash · the specialized zoo · full-text search · composite/covering/partial/expression ·
  the cost of indexes; the **★ index-picker** sim, the index-type→best-for/can't-do table, the **LIKE vs full-text**
  compare, new **index-only-scan** figure [regular index scan → heap fetch vs covering INCLUDE → answer from leaf,
  visibility-map note], FTS + pg_trgm DDL, covering/partial/expression DDL, 4 callouts [B-Tree already does equality,
  bitmap scans cooperate, pg_trgm rescues LIKE, leftmost-prefix loosened by skip scan, over-indexing], 5 keyPoints,
  3 pitfalls, 3 interview Q&A [senior/senior/staff], 6 sources).
  **★ Index access-path picker** (`sims/IndexPicker.tsx`, key `index-picker`): pick a query SHAPE (`=` · range/sort ·
  `@>` containment · full-text · prefix `a%` · substring `%a%`) → the 6 index types (B-Tree/Hash/GIN/GiST/BRIN/Trigram)
  light up **best / works / no**, with a one-line "why" + the recommended `CREATE INDEX`. Toggle-driven, deterministic,
  **inherently reduced-motion-safe** (no animation loop), ARIA tablist + live region — mirrors ErExplorer/FamiliesMap.
  New CSS `.idx-*` block appended to `components.css`; sim + 3 figures registered; glossary **+8 terms** (TOAST,
  fillfactor, GIN, GiST, BRIN, covering index, partial index, bitmap index scan) → **49**.
  **Web-verified this session** (sources in module `sources[]`): PostgreSQL fixed **8 kB pages**, page layout
  (header/line-pointers/tuples/free-space), tuples can't span pages; **TOAST** triggers >~2 kB (TOAST_TUPLE_THRESHOLD
  2032 B), compresses (**pglz** default / **lz4**) + moves out-of-line, **18-byte** pointer, STORAGE
  PLAIN/MAIN/EXTERNAL/EXTENDED; **fillfactor** heap default **100** / B-Tree **90**, HOT updates, CLUSTER reorders once
  (not maintained); row-store (OLTP) vs column-store (OLAP) — ClickHouse/columnar **5–20× compression + SIMD vectorized**
  execution; latency hierarchy (jboner: L1 ~0.5 ns · RAM ~100 ns · SSD ~150 µs · disk seek ~10 ms). Index types:
  **hash** = equality-only, **WAL-logged/crash-safe since PG 10**; **GIN** inverted (array/jsonb @>/FTS), **GiST**
  bounding-predicate (geo/range/KNN/FTS), **SP-GiST** space-partitioned, **BRIN** block-range min/max (huge ordered
  tables); **bitmap index scan** = runtime BitmapAnd/BitmapOr, not a stored type; FTS `tsvector @@ tsquery` on **GIN**
  (vs lossy GiST), **pg_trgm** for `%x%`/fuzzy; multicolumn **leftmost-prefix** + **B-Tree skip scan NEW in PG 18**;
  **covering INCLUDE since PG 11** → index-only scan needs the **visibility map** current; partial/expression indexes;
  **B-Tree dedup since PG 13**; indexes = write amplification + storage + maintenance (drop `idx_scan=0`). PG latest
  stable **18.4**, 19 Beta 1.
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ · `check:data` ✓ (**8 sections, 36 modules
  [14 authored, 22 stubs], 1533 Localized EN+UA pairs**, **6 sims + 13 figures**, 49 glossary terms, all registry keys
  resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server` of the
  `index-picker` sim inside `LangProvider` + the 3 figures — asserts default equality → `CREATE INDEX ON users (email)`
  + `best`, and figure content: latency ladder `0.5 ns`/`~8 months`, heap `ctid = (0, 1)`, `Index-Only Scan`/`visibility
  map`) · `vite build` ✓ (**78 modules**, JS **263.86 KB gzip** / CSS 7.59 KB gzip, relative `./assets/` base).
  **Bundle watch:** JS gzip **230 → 264 KB (+34)** for two dense bilingual modules + a sim + 3 figures — reinforces the
  §13 code-split backlog item (updated to "14 modules"); still on track for ~S10–S12.
  **Sandbox gotchas (expected, §12):** linux helpers from S2 (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`)
  still present → all tooling ran; built into fresh `dist-s7/` (unlink blocked; `dist-*/` gitignored). Render-smoke file
  gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s7.ts`** (and any stale `_smoke-s3/4/5/6`).
  **No stale `.git/index.lock` this session** (checked — absent).
  **Next (S8):** Storage internals cont. — M15 LSM-trees (+ **LSM sim**); M16 Query planning (+ **Query Planner / EXPLAIN
  sim**) — two signature sims, a heavy session. **Pending user:** repo is live (§11) — S7 appears live once committed &
  **merged to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup
  `rm -rf dist-s2 dist-s3 dist-s4 dist-s5 dist-s6 dist-s7`.

- **2026-06-24 · S8 Storage internals (LSM / query-planning)** *(branch `s8-lsm-query-planning`)* — Authored the two
  remaining Section-III modules **fully EN+UA** to the M13 depth bar, **completing Section III** (M12–M16) and lifting
  authored modules from 14 → **16**. Shipped **both confirmed signature sims** (no trim — user asked for «два
  signature-сими»). **M15 · LSM-trees & write-optimized storage** `[staff]` *(signature)* (5 topics: the write problem ·
  memtable/SSTable/compaction · reads — Bloom filters & tombstones · the amplification triangle · who uses it; new
  **lsm-vs-btree** SVG figure [random in-place page write vs sequential append+flush], the ★ **LSM compaction stepper**,
  a Cassandra-CQL compaction-strategy code block, a B-Tree↔LSM compare, engine-usage table, tip/senior/warn callouts
  [Bloom “definitely-not/maybe”, sequential-beats-random, don’t-reach-for-LSM-by-reflex, WAL-is-log-structured-too], 5
  keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff incl. the Cassandra tombstone incident], 6 web-verified
  sources). **M16 · Query planning & optimization** `[staff]` *(signature)* (5 topics: the optimizer’s job · statistics &
  cardinality · access paths & join algorithms · reading EXPLAIN ANALYZE · helping the planner; new **plan-tree** SVG
  figure [annotated EXPLAIN node — estimates vs actuals, the misestimate to hunt], the ★ **Query Planner / EXPLAIN sim**,
  a per-column-statistics table, a 3-join-algorithm table, an EXPLAIN↔EXPLAIN ANALYZE compare, an EXPLAIN(ANALYZE)+
  ANALYZE/CREATE STATISTICS code block, senior/tip/warn callouts [cost≠ms, CREATE STATISTICS for correlation, no
  per-query hints by design], 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff], 6 sources).
  **★ LSM compaction stepper** (`sims/LsmSim.tsx`, key `lsm-tree`): a 9-frame deterministic workload walks
  buffer→memtable-full→**flush**→update/del→second flush→**compaction** (newest wins, tombstone purged, space reclaimed)
  →**read present** (Bloom “maybe” → hit) →**read absent** (Bloom “no” → 0 disk reads); a Leveled↔Size-tiered toggle
  drives the read/write/space **amplification meters** (the RUM trade). Play/pause/step + reduced-motion fallback + ARIA
  live region, mirrors BTreeSim. **★ Query Planner / EXPLAIN** (`sims/QueryPlannerSim.tsx`, key `query-planner`): a fixed
  two-table join with two toggles — index on `orders.status`? × predicate selectivity — flips the 2×2 between
  `Index Scan`+`Nested Loop` and `Seq Scan`+`Hash Join`, with the plan tree, est. cost/rows and a “why” updating; toggle-
  driven, inherently reduced-motion-safe, ARIA tablists + live region (like ErExplorer/IndexPicker). New CSS `.lsm-*` +
  `.qplan-*` blocks appended to `components.css`; both sims + both figures registered; glossary **+15 terms** (LSM-tree,
  memtable, SSTable, compaction, Bloom filter, tombstone, amplification, cardinality, selectivity, cost-based optimizer,
  EXPLAIN, nested loop/hash/merge join) → **63**.
  **Web-verified this session** (sources in module `sources[]`): **O’Neil et al. 1996** (the LSM-tree paper); **RUM
  conjecture** (Athanassoulis et al., EDBT 2016 — optimize 2 of read/update/memory); **RocksDB** leveled (default; ~10×
  levels, non-overlapping within a level; write amp ~10–30×) vs **universal/size-tiered**, **Cassandra** STCS default +
  TimeWindow for TTL; Bloom filters skip SSTables with **no false negatives**; tombstones purged at compaction. Planner:
  **cost-based**, `seq_page_cost=1.0`/`random_page_cost=4.0` (HDD-era; ~1.1 for SSD); stats via **ANALYZE** → MCV list
  (equality), histogram (ranges), n_distinct, correlation; **independence assumption** breaks correlated columns →
  **`CREATE STATISTICS`** (deps/ndistinct since **PG10**, multivariate **MCV since PG13**); joins nested-loop/hash/merge;
  join order DP **< geqo_threshold=12**, **GEQO** at/above; **EXPLAIN ANALYZE includes BUFFERS by default since PG18**
  (Lelarge/Rowley); the misestimate hunt = lowest node where est vs actual rows diverge ~10×+; PostgreSQL ships **no
  per-query hints** by design. PG latest stable **18.4**, 19 Beta 1.
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ (clean) · `check:data` ✓ (**8 sections, 36 modules
  [16 authored, 20 stubs], 1711 Localized EN+UA pairs**, **8 sims + 15 figures**, 63 glossary terms, all registry keys
  resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server` of both new
  sims inside `LangProvider` + both figures — asserts `lsm-tree` shows memtable/SSTables/Leveled/Size-tiered/Bloom-
  filtered/Write+Space amplification/tombstone, `query-planner` default → `Nested Loop`+`orders_status_idx`, `lsm-vs-btree`
  shows random-vs-sequential write paths, `plan-tree` shows `actual rows=80` vs `rows=600000` misestimate) · `vite build`
  ✓ (**84 modules**, JS **307.19 KB gzip** / CSS 8.33 KB gzip, relative `./assets/` base).
  **Bundle watch:** JS gzip **264 → 307 KB (+43)** for two dense bilingual staff modules + 2 sims + 2 figures; Vite now
  warns the raw chunk is **>900 KB**. Reinforces the §13 code-split backlog item (updated to "16 modules") — worth doing
  around S10–S12 as planned.
  **Sandbox gotchas (expected, §12):** linux helpers from S2 (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`)
  still present → all tooling ran; built into fresh `dist-s8/` (unlink blocked; `dist-*/` gitignored). Render-smoke file
  gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s8.ts`** (and any stale `_smoke-s3..7`). **No stale
  `.git/index.lock` this session** (checked — absent).
  **Next (S9):** Transactions — M17 ACID & WAL (+ **ACID/WAL sim**); M18 Isolation levels & anomalies (+ **Isolation
  sim**). **Pending user:** repo is live (§11) — S8 appears live once committed & **merged to `main`**; locally
  `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s2 dist-s3 dist-s4 dist-s5 dist-s6 dist-s7 dist-s8`.

- **2026-06-24 · S9 Transactions (ACID/WAL · isolation)** *(branch `s9-acid-wal-isolation`)* — Authored the first two
  Section-IV modules **fully EN+UA** to the M13 depth bar, lifting authored modules from 16 → **18** (Section IV now 2 of
  4: M17, M18; M19–M20 land in S10). Shipped **both confirmed sims** (user choice this session: build both; code-split
  deferred to S10–S12). **M17 · ACID & durability** `[senior]` *(light signature)* (4 topics: the four guarantees · the
  Write-Ahead Log · commit & crash recovery · "consistency" here vs CAP; new **wal-checkpoint** SVG figure [append-only
  WAL with checkpoint + COMMIT(fsync) durability point + REDO span; data files flushed lazily], the ★ **ACID/WAL stepper**,
  an ACID-letter→mechanism table, a **synchronous_commit on/off** compare, a BEGIN/COMMIT + `SET LOCAL synchronous_commit`
  code block, tip/senior/warn/senior callouts [A&D share the WAL · the WAL is the engine not just a net · **fsync=off risks
  corruption, not just loss** · PG has no undo log — atomicity via MVCC], 5 keyPoints, 3 pitfalls, 3 interview Q&A
  [senior/senior/staff], 6 web-verified sources). **M18 · Isolation levels & anomalies** `[staff]` *(signature)* (4 topics:
  the anomalies · the SQL-standard levels · standard vs reality · Serializable & the cost of correctness; the ★ **Isolation
  anomalies sim**, new **level-anomaly-matrix** SVG figure [PG Table 13.1 + lost-update & write-skew rows, the boxed
  write-skew×RR cell], an anomaly→lowest-level table, a **snapshot-vs-serializable** compare, a `BEGIN ISOLATION LEVEL
  SERIALIZABLE` + retry-loop code block, senior/warn callouts [**PG Repeatable Read = Snapshot Isolation** · must handle
  40001 everywhere], 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/staff/staff], 6 sources).
  **★ ACID/WAL stepper** (`sims/AcidWalSim.tsx`, key `acid-wal`): a $100 transfer walks BEGIN → write-ahead debit →
  write-ahead credit, then a **scenario toggle** picks where the crash lands — *after COMMIT* (WAL fsync'd → recovery REDOes
  it → **Durability**) vs *before COMMIT* (no commit record → discarded → **Atomicity**). Three lanes (txn op · WAL · data
  pages split RAM/disk); RAM wipes on crash, recovery replays the WAL into the data files. Play/pause/step + reduced-motion
  fallback + ARIA live region (mirrors LsmSim). **★ Isolation anomalies sim** (`sims/IsolationSim.tsx`, key `isolation`):
  pick an anomaly (dirty · non-repeatable · phantom · lost update · write-skew) × a level (RC · RR · SER) → step a fixed
  two-transaction T1│T2 timeline; the **verdict flips live** (occurs/prevented + a "why") as you change the level.
  PostgreSQL-accurate: PG never dirty-reads; RR(SI) prevents phantoms + aborts the lost-update loser (40001); **SI still
  allows write-skew**; only SER(SSI) catches it. Toggle/step-driven, reduced-motion-safe, ARIA tablists + live region. New
  CSS `.acid-*` + `.iso-*` + `.seg-wrap` appended to `components.css`; both sims + both figures registered; glossary **+10
  terms** (durability, checkpoint, crash recovery, dirty read, non-repeatable read, phantom read, lost update,
  serializability, SSI, two-phase locking) → **73**.
  **Web-verified this session** (sources in module `sources[]`, primary = PG 18 docs): **Table 13.1** (Read Uncommitted
  mapped to Read Committed → PG never returns a dirty read; **Repeatable Read = Snapshot Isolation** prevents non-repeatable
  AND phantom reads — stronger than the standard; "serialization anomaly" Possible at RR, Not possible at Serializable);
  RR aborts a conflicting update with **"could not serialize access due to concurrent update" (40001)** → no lost update;
  **Serializable = SSI** (since **9.1**; predicate locks `SIReadLock`, non-blocking; Cahill/Fekete/Röhm; Ports & Grittner
  VLDB'12 `[ports12]`); the docs' class/value **SUM example** = write-skew; WAL **28.3** ("changes to data files must be
  written only after WAL records … flushed" → roll-forward/REDO; one `fsync` commits many txns); **28.4 async commit**
  (`synchronous_commit=off` loses ≤ ~3× `wal_writer_delay` of recent commits but **no inconsistency**, unlike `fsync=off`
  corruption); checkpoints (**30.5**) bound recovery; ACID coined **Härder & Reuter 1983**; PG has **no undo log** (atomicity
  via MVCC visibility + clog, vacuum). Berenson et al. 1995 critique (SI/write-skew formalized post-standard). PG stable **18.4**, 19 Beta 1.
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ (**clean** — fixed 1 `react-hooks/exhaustive-deps`
  warning by memoizing the `verdict` Localized in IsolationSim) · `check:data` ✓ (**8 sections, 36 modules [18 authored, 18
  stubs], 1857 Localized EN+UA pairs**, **10 sims + 17 figures**, 73 glossary terms, all registry keys resolve, cross-links
  valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server` of both new sims inside `LangProvider`
  + both figures — asserts `acid-wal` shows Crash-after/before-COMMIT + WAL/buffer-cache/data-files + BEGIN + id=1,
  `isolation` default write-skew@RR → `Anomaly occurs` + `Snapshot Isolation` + `on_call`, `wal-checkpoint` shows
  CHECKPOINT/COMMIT(fsync)/REDO, `level-anomaly-matrix` shows the three levels + Write-skew + can occur/prevented) ·
  `vite build` ✓ (**90 modules**, JS **348.16 KB gzip** / CSS 9.01 KB gzip, relative `./assets/` base).
  **Bundle watch:** JS gzip **307 → 348 KB (+41)** for two dense bilingual modules + 2 sims + 2 figures; Vite still warns the
  raw chunk is **>900 KB**. Per the user's S9 decision the §13 code-split (updated to "18 modules") stays slated for **S10–S12**.
  **Sandbox gotchas (expected, §12):** linux helpers from S2 (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`)
  still present → all tooling ran; built into fresh `dist-s9/` (unlink blocked; `dist-*/` gitignored). Render-smoke file
  gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s9.ts`** (and any stale `_smoke-s6/s7`). **A stale
  `.git/index.lock` was created this session** (a sandbox `git status` couldn't unlink it) — **user must `rm -f
  ".git/index.lock"` locally before committing.**
  **S9 follow-up (user request):** pre-built the **M19 deadlock-cycle figure** (`figures/DeadlockCycle.tsx`, registry key
  `deadlock-cycle`) — T1↔T2 wait-for cycle (T1 holds A waits B, T2 holds B waits A), the detector aborts a victim with
  **ERROR: deadlock detected (SQLSTATE 40P01)** after `deadlock_timeout` (default 1s); facts web-verified (PG
  explicit-locking + runtime-config-locks). Registered + render-smoked now (**check:data → 18 figures**); intentionally
  **unreferenced until M19 is authored in S10**, which will add the `figure` block + bilingual caption (harmless: check:data
  only validates referenced keys). typecheck · lint (clean) · check:data · render smoke · `vite build` all re-verified green.
  **Next (S10):** Concurrency — M19 Concurrency control / MVCC (+ **MVCC sim**, + the pre-built **deadlock-cycle** figure);
  M20 Distributed transactions. **Pending
  user:** repo is live (§11) — S9 appears live once committed & **merged to `main`**; locally `npm install` (darwin-arm64)
  + `npm run verify`; optional cleanup `rm -rf dist-s2 dist-s3 dist-s4 dist-s5 dist-s6 dist-s7 dist-s8 dist-s9 dist-s9b`.

- **2026-06-24 · S10 Concurrency (MVCC / distributed transactions)** *(branch `s10-mvcc-distributed-tx`)* —
  Authored the two remaining Section-IV modules **fully EN+UA** to the M13 depth bar, **completing Section IV**
  (M17–M20) and lifting authored modules from 18 → **20**. **M19 (signature)** ships the ★ MVCC sim and references
  the pre-built `deadlock-cycle` figure; **M20 is figures-only** (3 new figures) per the locked plan, with a 2PC
  stepper flagged to backlog. **M19 · Concurrency control** `[staff]` *(signature)* (4 topics: pessimistic vs
  optimistic [locking vs MVCC] · the MVCC mechanism [xmin/xmax · snapshots · visibility · UPDATE = new version ·
  HOT] · locking/2PL/deadlocks · the cost of MVCC [dead tuples/bloat · VACUUM/autovacuum · the long-txn
  xmin-horizon trap · 32-bit XID wraparound & freezing]); the ★ **MVCC sim** + the now-referenced **deadlock-cycle**
  figure, a MVCC↔locking **compare**, a row-lock-modes table, a VACUUM-vs-VACUUM-FULL table, 5 callouts, 5
  keyPoints, 3 pitfalls, 3 interview Q&A [senior/staff/staff], 6 web-verified sources). **M20 · Distributed
  transactions** `[staff]` *(figures-only)* (4 topics: why distribution breaks single-node ACID / the dual-write
  problem · 2PC + the blocking problem + PG `PREPARE TRANSACTION` · sagas & compensation, orchestration vs
  choreography · the outbox + idempotency + the "exactly-once" myth); 3 new figures, a **2PC-vs-saga** compare, a
  `PREPARE TRANSACTION` + `pg_prepared_xacts` code block, 4 callouts (incl. the orphaned-prepared-xact `warn` and an
  idempotency-key `security`), 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/staff/staff], 6 sources).
  **★ MVCC sim** (`sims/MvccSim.tsx`, key `mvcc`): an 8-frame deterministic schedule on one `accounts` row — v1 →
  T1 reads its snapshot → T2 `UPDATE` forks v2 (stamps v1.xmax) → T1 **still** reads v1 (readers don't block
  writers) → T2 commits → T3 sees v2 → T1 ends (v1 dead) → **VACUUM** reclaims v1; a **MVCC↔Lock-based (2PL)** toggle
  replays the same schedule as a blocking **wait** (T2's exclusive lock waits on T1's shared lock). Version chain
  with xmin/xmax + a who-sees-what visibility strip + outcome; play/pause/step + reduced-motion fallback + ARIA live
  region (mirrors AcidWalSim). New `.mvcc-*` CSS block appended to `components.css`. **3 new figures** (`figures/`):
  **`two-phase-commit`** (coordinator + 2 participants; prepare/vote then commit, with the coordinator-crash
  blocking band), **`saga-compensation`** (T1→T2→T3 forward, C2←C1 compensate-backward on failure; a compensation is
  forward-undo, not rollback), **`outbox-pattern`** (business row + event row in ONE local txn → relay polls / tails
  the WAL via CDC → broker → idempotent consumer).
  **Web-verified this session** (sources in module `sources[]`, primary = PG 18 docs): MVCC headline property
  (mvcc-intro 13.1, verbatim "reading never blocks writing and writing never blocks reading"); xmin/xmax + snapshot
  visibility + `pg_xact` (transaction-id); UPDATE = delete+insert and **HOT** (no indexed column changed + page
  room) (storage-hot); row-lock modes FOR UPDATE/NO KEY UPDATE/SHARE/KEY SHARE + deadlock detection
  (`deadlock_timeout` 1s → 40P01) (explicit-locking); VACUUM vs **VACUUM FULL** (ACCESS EXCLUSIVE) + autovacuum
  thresholds (50 + 0.2·rows, **PG18 `autovacuum_vacuum_max_threshold` 100M**) + visibility map + freezing +
  `autovacuum_freeze_max_age` 200M + **32-bit XIDs still core in PG18** (`xid8` = snapshot reporting only)
  (routine-vacuuming). **2PC** (Gray 1978; Gray & Lamport 2006) blocking problem + 3PC impracticality; PG
  `PREPARE TRANSACTION`/`COMMIT PREPARED`, **`max_prepared_transactions` default 0** (2PC off), "not for
  applications"/XA, **orphaned prepared xacts hold locks + block VACUUM / pin the xmin horizon** (sql-prepare-
  transaction · pg_prepared_xacts); **sagas** (Garcia-Molina & Salem, SIGMOD 1987) + compensation + orchestration vs
  choreography + **ACD without I** (microservices.io saga); **transactional outbox** + the dual-write problem +
  CDC/Debezium via logical decoding + LISTEN/NOTIFY not durable (microservices.io outbox); idempotency /
  at-least-once + the **exactly-once myth** (Two Generals / FLP; Kafka EOS is within-Kafka only) (Confluent
  delivery-semantics). PG stable **18.4**, 19 Beta 1.
  **Wiring:** `concepts.ts` imports m19/m20 (stubs replaced, S10 note); `registry.tsx` **+1 sim** (`mvcc`) **+3
  figures** (`two-phase-commit`, `saga-compensation`, `outbox-pattern`); glossary **+12 terms** (VACUUM, dead tuple,
  autovacuum, HOT update, transaction ID wraparound, deadlock; two-phase commit (2PC), saga, compensating
  transaction, transactional outbox, idempotency, exactly-once) → **85**.
  **Scope decision (recorded):** **M20 is figures-only**, per the locked plan — §5/§6 reserve sims for the 8
  signature spots + the opportunistic ER/Normalization/Sharding set, and a 2PC interactive is not among them; the
  user's own S10 directive specified the MVCC sim only. The high-insight 2PC/blocking + saga/compensation ideas are
  delivered statically by the three new figures + the 2PC-vs-saga compare. **A ★ 2PC / coordinator-crash stepper is
  added to the §13 backlog (slot S19–S20)**, exactly as S5/S6 deferred the FLOAT-drift and window-frame steppers.
  Because S10 carried a lighter sim load (one signature sim, not two), the 2PC stepper can be pulled forward if the
  user wants it.
  **Verification (repo, linux-arm64):** `tsc -b --noEmit` ✓ · ESLint ✓ (clean) · `check:data` ✓ (**8 sections, 36
  modules [20 authored, 16 stubs], 2015 Localized EN+UA pairs**, **11 sims + 21 figures**, 85 glossary terms, all
  registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓
  (`react-dom/server` of the `mvcc` sim inside `LangProvider` + the 3 figures — asserts mvcc default v1/`xmin 90`/
  `balance 500`/MVCC+Lock toggles/visibility strip/VACUUM; two-phase-commit Coordinator/prepare?/vote yes/in-doubt;
  saga reserve/ship/refund/compensate-backward; outbox Service+PostgreSQL/Message Relay/Debezium/idempotent) ·
  `vite build` ✓ (**97 modules**, JS **400.34 KB gzip** / CSS 9.41 KB gzip, relative `./assets/` base).
  **Bundle watch:** JS gzip **348 → 400 KB (+52)** for two dense bilingual staff modules + 1 sim + 3 figures; Vite
  still warns the raw chunk is **>900 KB** (now ~1.31 MB). Reinforces the §13 code-split backlog (updated to "20
  modules") — still slated **S10–S12** per the user's S9 decision; recommend doing it in **S11** before Section V's
  sims pile on.
  **Sandbox gotchas (expected, §12):** linux helpers (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`)
  already present from prior sessions → all tooling ran; built into fresh `dist-s10/` (unlink blocked; `dist-*/`
  gitignored). Render-smoke file gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s10.ts`** (and
  any stale `_smoke-s9`). **No stale `.git/index.lock` this session** (checked — absent; avoided running `git status`
  in-sandbox).
  **Next (S11):** Distribution — M21 Replication (+ **Replication & failover sim**); M22 Partitioning & sharding (+
  **sharding sim**) — Section V begins; consider the bundle **code-split** here. **Pending user:** repo is live
  (§11) — S10 appears live once committed & **merged to `main`**; locally `npm install` (darwin-arm64) +
  `npm run verify`; optional cleanup `rm -rf dist-s2 dist-s3 dist-s4 dist-s5 dist-s6 dist-s7 dist-s8 dist-s9 dist-s9b dist-s10`.
  **S10 follow-up (user request):** **pulled the ★ 2PC coordinator-crash stepper forward** from the §13 backlog
  (it was slated S19–S20). New **`sims/TwoPhaseCommitSim.tsx`** (key **`2pc`**): a coordinator + 2 participants
  with a **Commit (happy path) ↔ Coordinator crash** toggle — happy path walks prepare → vote YES (durably
  prepared, holding locks) → decide COMMIT → phase-2 commit (atomic); crash walks prepare → vote YES → **the
  coordinator crashes before the decision** → A & B go **in-doubt, BLOCKED, holding locks** (the blocking problem;
  in PG = an orphaned prepared xact that also blocks VACUUM, ties to M19). Play/pause/step + reduced-motion
  fallback + ARIA, mirrors AcidWalSim/MvccSim; new `.tpc-*` CSS appended to `components.css`. Inserted the `2pc`
  **sim block** into M20 topic 2 (after the blocking-problem prose, beside the static `two-phase-commit` figure —
  the figure = the protocol map, the sim = drive it & break it, the same figure+sim pairing the other signature
  modules use), registered the sim, and flipped **M20 `signature: false → true`** (the codebase `signature` flag
  marks any module with a notable interactive — already used for light sims like families-map/er/normalization — so
  this is consistent; the §6 "8 hero sims" target is unchanged in spirit, this is the 9th interactive). Re-verified
  **all green**: `tsc -b --noEmit` ✓ · ESLint ✓ (clean) · `check:data` ✓ (**12 sims** now [+`2pc`], 21 figures, 36
  modules [20 authored], 2015 Localized pairs, 85 glossary terms) · `test:btree` ✓ (346) · render+content smoke ✓
  (now also asserts the `2pc` sim: Commit/Coordinator-crash toggle, Participant A/B, "blocking problem") ·
  `vite build` ✓ (built into fresh `dist-s10b/`; JS **403.43 KB gzip** / CSS 9.63 KB gzip, +3 KB for the sim+CSS).
  Scratch smoke file `scripts/_smoke-s10.ts` is gitignored (it did not persist between sandbox calls — re-`rm` not
  needed). No stale `.git/index.lock`. **§13 backlog:** the 2PC-stepper item is now **done** (built in S10).

- **2026-06-25 · S11 Distribution (replication / sharding)** *(branch `s11-replication-sharding`)* —
  Authored the first two Section-V modules **fully EN+UA** to the M13 depth bar, lifting authored modules
  from 20 → **22** (Section V begins: M21, M22; M23–M24 land in S12). Shipped **both confirmed signature
  sims** (no trim). **M21 · Replication** `[senior]` *(signature)* (5 topics: how streaming replication
  works · sync vs async · physical vs logical · monitoring replication lag · Patroni + failover; new
  **streaming-replication** SVG figure [Primary/walsender → Standby A (sync) + Standby B (async), ACK
  dashed, replication slot badge, pg_stat_replication label], the ★ **Replication & failover sim**, a
  sync-level compare (`synchronous_commit off/local/remote_write/on/remote_apply`), a pg_stat_replication
  columns table, a physical-vs-logical compare, a `CREATE PUBLICATION/SUBSCRIPTION` DDL block, a
  Patroni HA stack table, 4 callouts [sync-perf/replication-slot-danger/logical-DDL-gap/dont-roll-your-own-ha],
  5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff], 6 web-verified sources). **M22 ·
  Partitioning & sharding** `[senior]` *(signature)* (4 topics: PostgreSQL declarative partitioning ·
  sharding — when and why · shard key & hotspots · cross-shard operations; new **consistent-hashing**
  SVG figure [ring with N1/N2/N3 + colored ownership arcs + K1–K6 keys + inset showing N4 addition →
  only K/N keys move], the ★ **Sharding strategy sim**, a partitioning-strategy table
  [RANGE/LIST/HASH + pg_partman], a DB-level partitioning vs application sharding compare, a cross-shard
  operations table, a RANGE DDL code block, callouts [hash-vs-range-hotspot / consistent-hashing ring /
  co-location-first / Citus 100%-open-source], 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff],
  5 sources).
  **★ Replication & failover sim** (`sims/ReplicationSim.tsx`, key `replication`): toggle **Async ↔ Sync**
  — Async (6 frames): commit returns without waiting → crash gap shows the unreplicated WAL window →
  **data loss**; Sync (7 frames): primary holds client → waits for Standby A flush ACK → then commits →
  crash → **zero data loss**. Three-lane layout (Primary | WAL stream | Standby A + Standby B); LSN
  progress boxes, WAL stream / ACK / success arrows; crash animation. Play/pause/step + reduced-motion
  fallback + ARIA live region (mirrors AcidWalSim/MvccSim). **★ Sharding strategy sim** (`sims/ShardingSim.tsx`,
  key `sharding`): toggle **Hash (id%3) ↔ Range (monotonic IDs)** — insert IDs 1001–1009 one-by-one or
  all-at-once; Hash shows 3/3/3 balance; Range shows S3 accumulating all 9 newest rows with a **HOT badge
  + hotspot warning** — the classic monotonic-key-and-range-shard trap. ID chips color-coded by owner shard.
  Outcome summary on completion. Toggle-driven + step; inherently reduced-motion-safe; ARIA tablist +
  live region.
  **Web-verified this session** (sources in module `sources[]`, primary = PG 18 docs + upstream READMEs):
  **Streaming replication** — `wal_level=replica` + `hot_standby=on`; `pg_basebackup`; walsender/walreceiver;
  `synchronous_standby_names` + `synchronous_commit` five values (off/local/remote_write/on/remote_apply);
  `synchronous_standby_names` supports **FIRST n(…)** priority and **ANY n(…)** quorum (PG 10+);
  `pg_stat_replication`: sent/write/flush/replay_lsn + write/flush/replay_lag; **replication slots**
  prevent WAL recycling — dangerous if slot stalls (PG 18 adds `idle_replication_slot_timeout`); physical
  replication = byte-level WAL, logical = row-level events (`CREATE PUBLICATION`/`SUBSCRIPTION`, native
  since **PG 10**; DDL not replicated — common gotcha). **Patroni v4.1.3** (2026-02-17 — verified on
  GitHub): etcd/Consul/ZooKeeper/K8s DCS, `pg_promote()` + `pg_rewind`; latest stable PG **18.4** / 19
  Beta 1. **Partitioning** — PG 10 declarative RANGE/LIST, PG 11 HASH + partition-wise joins/aggregates
  (OFF by default); `pg_partman v5.4.3` (2026-03-05): declarative-only since v5, BGW, requires PG ≥ 14.
  **Consistent hashing** — ring, virtual nodes (Cassandra default 256/node), only K/N keys move on
  rebalance vs ~N-1/N for mod-N. **Hot spots** — monotonic IDs (SERIAL/IDENTITY) → all writes to latest
  range shard; mitigations: hash sharding, UUIDs, `uuidv7()` (time-ordered, PG 18 native), key salting.
  **Citus v14.0.0** (Feb 2026): 100% open source (PostgreSQL License since Citus 11, June 2022; verified),
  supports PG 16/17/18; `create_distributed_table()` + `create_reference_table()` + co-location.
  **Wiring:** `concepts.ts` imports m21/m22 (stubs replaced, CHANGED(S11) note); `registry.tsx` **+2 sims**
  (`replication`, `sharding`) **+2 figures** (`streaming-replication`, `consistent-hashing`); glossary
  **+13 terms** (streaming replication, replication slot, synchronous replication, logical replication,
  replication lag, Patroni, table partitioning, partition pruning, consistent hashing, shard key,
  co-location, scatter-gather, hot spot) → **98**.
  **Verification (repo, linux-arm64; tsx available in node_modules):** `tsc -b --noEmit` ✓ (clean;
  **fixed ConsistentHashing.tsx**: removed broken `useLang` import, made static SVG — same pattern as all
  existing figures; also eliminated unused `n4/n2/n1/n3` declarations) · ESLint ✓ (clean) · `check:data`
  ✓ (**8 sections, 36 modules [22 authored, 14 stubs], 2222 Localized EN+UA pairs**, **14 sims + 23
  figures**, 98 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓ (346
  checks) · **render+content smoke** ✓ (`react-dom/server` renderToStaticMarkup of both new sims + both
  figures inside the real `LangProvider` — asserts `replication` shows Primary/Standby A/WAL, `sharding`
  shows Shard 1/Hash/Range/Insert-next, `streaming-replication` shows walsender/replication-slot/
  pg_stat_replication, `consistent-hashing` shows N1/N4/hash-ring/only-K/N-keys-move) · `vite build` ✓
  (**104 modules**, JS **441 KB gzip** / CSS 10.57 KB gzip, relative `./assets/` base, `dist-s11/`).
  **Caught & fixed before commit:** (1) `ConsistentHashing.tsx` initially used `import { useLang } from
  '../../i18n/LangContext'` (non-existent path) + the `lang[key]` TS7053 index pattern — same root cause
  as the other three new files; all fixed by removing `useLang` entirely (figures are always static English
  SVGs). (2) Unused `n4/n2/n1/n3` `ixy()` call results → `noUnusedLocals` error; replaced with direct use
  of `ixy()` in the inset node map.
  **Bundle watch:** JS gzip **403 → 441 KB (+38)** for two dense bilingual senior modules + 2 sims + 2
  figures. Raw chunk now **~1.45 MB** (Vite warns >900 KB). Reinforces the §13 code-split backlog (updated
  to "22 modules"); recommend doing it in **S12** before M23 (CAP sim) and M24 add more weight.
  **Sandbox note:** `scripts/_smoke-s11.ts` is gitignored (`scripts/_smoke-*.ts`) — no cleanup needed on
  user's Mac. No stale `.git/index.lock` this session.
  **Next (S12):** Distribution cont. — M23 CAP/PACELC (+ **CAP/consistency sim**); M24 HA, backups & DR.
  **Recommend doing the §13 code-split here (S12)** before the bundle grows further — or defer to S12b.
  **Pending user:** repo is live (§11) — S11 appears live once committed & **merged to `main`**; locally
  `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s11`.

- **2026-06-25 · S12 Distribution (CAP/PACELC · HA/backups · §13 code-split)** *(branch
  `s12-cap-ha-backups-codesplit`)* — Authored the two remaining Section-V modules **fully EN+UA**
  to the M13 depth bar, **completing Section V** (M21–M24) and lifting authored modules from 22 →
  **24**. Shipped **one signature sim** (M23 CAP/consistency) + **figures-only for M24** per the
  locked plan. Also implemented the **§13 code-split** (user's directive this session).
  **M23 · CAP, PACELC & consensus** `[staff]` *(signature)* (4 topics: CAP stated precisely ·
  PACELC — the normal-operation trade · consistency models hierarchy · Raft/Paxos & quorum; new
  **pacelc-tree** SVG figure [if-partition→A-or-C / else→L-or-C decision tree with PA/PC/EL/EC
  leaves + Cassandra/ZooKeeper/async-PG/sync-PG engine labels], the ★ **CAP/consistency sim**, a
  PACELC engine table [Cassandra PA/EL · DynamoDB PA/EL · async PG PA/EL · sync PG PC/EC ·
  ZooKeeper PC/EC · HBase PC/EC · MongoDB PC/EC], a consistency-models table [linearizability /
  sequential / causal / eventual], a Raft↔Paxos **compare**, 3 callouts [partitions-are-not-optional
  · AP-is-not-chaos · CAP-is-about-partitions-not-operations], 6 keyPoints, 3 pitfalls, 3 interview
  Q&A [senior/senior/staff], 7 web-verified sources). **M24 · High availability, backups & DR**
  `[senior]` *(figures-only)* (4 topics: Patroni/etcd HA building blocks · backups [logical vs
  physical, pgBackRest, Barman] · PITR [WAL archive setup, workflow, named restore points] ·
  RPO/RTO + testing recovery ["an untested backup doesn't exist"]; new **ha-cluster** SVG figure
  [Primary+leader-lock → Standby A sync + Standby B async + etcd DCS + pg_rewind box + HAProxy/VIP
  box + DCS-poll links] + new **backup-pitr** SVG figure [PITR timeline: T0 base backup → continuous
  WAL archive band → recovery_target_time marker → pause/promote + restore window bracket], a
  backup-tool **compare** table [pg_dump / pg_basebackup / pgBackRest / Barman × 7 features],
  Patroni **config table** [ttl/loop_wait/retry_timeout/maximum_lag_on_failover/master_start_timeout/
  synchronous_mode], a **HA↔DR compare** [failure scope / RTO / mechanism / RPO / trigger], 4
  callouts [DCS-quorum-failure-takes-down-cluster / untested-backup-doesnt-exist /
  ha-and-backup-are-not-substitutes / named-restore-points], 6 keyPoints, 3 pitfalls, 3 interview
  Q&A [senior/senior/senior], 7 web-verified sources).
  **★ CAP/consistency sim** (`sims/CapSim.tsx`, key `cap-consistency`): two top-level tabs —
  **During Partition (CAP)** × **Normal Operation (PACELC)**. Partition tab: toggle CP↔AP → step
  through 4 frames; CP: N3 behind a partition **refuses write/read** (no quorum → ERROR 503 →
  Consistency preserved, client retries); AP: both sides write independently → values diverge
  (77 vs 99) → N3 **stale read** returns old value (Availability preserved, consistency sacrificed).
  PACELC tab: toggle Sync↔Async → 3 frames; Sync: primary waits for N2+N3 ACK before responding
  (~20 ms, fully consistent, extra latency); Async: primary responds immediately (~3 ms), followers
  catch up asynchronously (stale window shown). Three-node cluster diagram per frame; node status
  (ok/partitioned/refusing/stale/syncing), outcome strip (ok/error/stale), PACELC verdict. Toggle-
  driven; play/pause/step; reduced-motion fallback (Play hidden); ARIA tablist + live region.
  New `.cap-*` CSS block appended to `components.css`; both M23 assets registered.
  **Web-verified this session** (sources in module `sources[]`): **Brewer PODC 2000** (CAP conjecture)
  + **Gilbert & Lynch 2002** formal proof (C = linearizability, A = every request receives a non-error
  response, P = partition tolerance; network partitions are not optional); **Brewer 2012** IEEE Computer
  "CAP Twelve Years Later" (CP vs AP is too simplistic — most real systems are spectrum, not binary;
  the real insight: during a partition you choose to answer stale or not at all); **Abadi 2012**
  PACELC (IEEE Computer 45(2):37-42 — PA/EL: Cassandra, DynamoDB; PC/EC: ZooKeeper, HBase; MongoDB
  configurable; async PG = PA/EL, sync PG = PC/EC; "Else" is the non-partition normal case, latency
  vs consistency); **Ongaro & Ousterhout USENIX ATC 2014** Raft (randomized election timeouts;
  quorum ⌊N/2⌋+1; log-completeness invariant; leader has all committed entries; etcd/CockroachDB/
  TiKV); **Herlihy & Wing 1990** linearizability (JACM 37(2):463-492); **Vogels 2009** eventual
  consistency (CACM 52(1):40-45). **Patroni v4.1.3** (2026-05-05, github.com/patroni/patroni/
  releases): moved to patroni/patroni org; DCS backends etcd/Consul/ZooKeeper/K8s; key params
  ttl=30s/loop_wait=10s/retry_timeout=10s/master_start_timeout=300s. **pg_rewind** (PG18 docs):
  requires wal_log_hints=on OR data checksums (PG18 enables checksums at initdb by default); never
  run without a fresh backup — mid-process failure → unrecoverable data dir. **pgBackRest v2.58.0**
  (pgbackrest.org, 2026-01-19): April 2026 maintainer crisis (archived); coalition revived May 2026
  (AWS/Supabase/pgEdge/Percona/Eon.io/Xata/Dalibo/Tiger Data/Data Egret). **Barman v3.18.0**
  (2026-03-12, github.com/EnterpriseDB/barman). **PITR PG18**: no recovery.conf since PG12;
  postgresql.conf + recovery.signal; archive_mode/archive_command/restore_command/
  recovery_target_time; named restore points via pg_create_restore_point(). **Cloud HA**: RDS
  Multi-AZ ~60–120 s, Multi-AZ Cluster ~35 s, Aurora ~< 30 s with replicas.
  **Wiring:** `concepts.ts` imports m23/m24 (stubs replaced, CHANGED(S12)); `registry.tsx` **+1 sim**
  (`cap-consistency`) **+3 figures** (`pacelc-tree`, `ha-cluster`, `backup-pitr`); glossary **+11
  terms** (CAP theorem, PACELC, linearizability, eventual consistency, quorum, Raft, high availability
  (HA), Patroni, PITR, RPO/RTO, pgBackRest) → **109**.
  **§13 code-split (done this session):** `registry.tsx` rewritten — all 15 sims + 26 figures are
  now **`React.lazy` dynamic imports** via a typed `lazyNamed()` helper that adapts named exports to
  `{ default }`. `blocks.tsx` wraps `FigureBlock` and `SimBlock` in `<Suspense>`. `App.tsx` lazy-loads
  the 5 route pages (LandscapeMap, ModulePage, GlossaryPage, MentalModelsPage, ComingSoon) behind one
  `<Suspense>`. `vite.config.ts` adds a `manualChunks` function separating `react-vendor` (190 KB /
  60 KB gzip, stable cache). **Result (dist-s12):** monolith 1.45 MB / 441 KB gzip → index 1,041 KB /
  **328 KB gzip** + react-vendor 190 KB / 60 KB + **15 sim + 26 figure on-demand chunks** (0.5–17 KB
  each). First-paint landing (index + react-vendor + LandscapeMap) ≈ **390 KB gzip** — down from 441
  KB gzip monolith. Vite still warns the raw index chunk > 900 KB; the remaining bulk is **`concepts.ts`
  (24 authored modules' content)** imported eagerly by Sidebar + TopBar for nav/search — the
  **meta.ts data-split (like S10c in Claude guide)** is the documented next lever (§13 backlog,
  updated below).
  **Verification (repo, linux-arm64; tsx in node_modules):** `tsc -b --noEmit` ✓ (strict — caught &
  fixed: unused `t` in CapSim, `lazy()` return needs `as unknown as ComponentType`, `manualChunks`
  needs function form not object) · ESLint ✓ (clean) · `check:data` ✓ (**8 sections, 36 modules [24
  authored, 12 stubs], 2460 Localized EN+UA pairs**, **15 sims + 26 figures**, 109 glossary terms, all
  registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) · **render+content smoke** ✓
  (`react-dom/server` renderToStaticMarkup of CapSim + PacelcTree + HaCluster + BackupPitr inside
  LangProvider — asserts CapSim shows cap-sim/CP/Partition/N1; PacelcTree shows PACELC/PA/Cassandra/
  sync-PG; HaCluster shows Primary/etcd/pg_rewind/leader-lock; BackupPitr shows PITR/WAL-archive/
  recovery.signal/Base-backup) · `vite build` ✓ (**dist-s12**, index 1,041 KB / 328 KB gzip +
  react-vendor 190 KB / 60 KB gzip + 15 sim + 26 figure lazy chunks).
  **Caught & fixed before commit:** (1) `CapSim.tsx` — destructured `t` from `useLang()` but never
  used it (only `lang` is needed for the `lang === 'uk' ? x.uk : x.en` pattern); removed `t`.
  (2) `registry.tsx` — `lazy()` returns `LazyExoticComponent<T>` which TypeScript's strict generics
  can't directly compare to `ComponentType`; fixed with `as unknown as ComponentType` double cast.
  (3) `vite.config.ts` — Rollup types in this Vite version expect `manualChunks` to be a function,
  not a `Record<string, string[]>` object; switched to function form.
  **Sandbox note:** `scripts/_smoke-s12.tsx` is gitignored (`scripts/_smoke-*.ts`). No stale
  `.git/index.lock` this session.
  **§13 backlog update:** "code-split" item is now **done** (S12). Remaining item: **meta.ts data-split**
  — separate module metadata (title/tagline/mentalModel/topics) from content bodies in `concepts.ts`
  so the Sidebar/TopBar search can use a lightweight prebuilt index rather than importing all authored
  bilingual content eagerly. This is the `gen:meta` + `meta.ts` pattern from S10c of the Claude guide;
  it would drop the index chunk from 328 → ~60 KB gzip. Slot opportunistically (S16–S17 once the index
  chunk becomes the primary bottleneck, or S19–S20 buffer). Also still in backlog: ★ FLOAT-vs-numeric
  drift stepper (M9), ★ Window-frame stepper (M10), ★ 2PC coordinator-crash stepper (now **done, S10**).
  **Next (S13):** NoSQL families — M25 Document databases (MongoDB model & internals, aggregation
  pipeline, indexing); M26 Key-value & caching (Redis/Valkey, data structures, eviction, persistence,
  the licensing story). **Pending user:** repo is live (§11) — S12 appears live once committed &
  **merged to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup
  `rm -rf dist-s11 dist-s12`.
