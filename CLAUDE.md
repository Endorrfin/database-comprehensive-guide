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
- **★ FLOAT-vs-numeric drift stepper (M9) — ✅ DONE S19** (sim `float-drift`; M9 figure block → sim; module flipped to signature):** promote the static `float-trap` figure into a real interactive:
  step a running sum (add `0.1` / one cent N times) in `double precision` vs `numeric`, watch the float result
  drift off the exact decimal and the rounding error accumulate row by row. Follow BTreeSim conventions
  (deterministic, play/pause/step, `prefers-reduced-motion` fallback, ARIA live region); register under a new
  sim key and flip M9's `float-trap` block from `figure` → `sim`. Slot opportunistically (S8 storage, or S19–S20).
- **★ Window-frame stepper (M10) — ✅ DONE S19** (sim `window-frame-stepper`; M10 figure block → sim; module flipped to signature):** promote the static `window-frame` figure into a real interactive: step a
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
  or S19–S20 buffer. **✅ DONE S19:** `scripts/gen-meta.ts` → `src/data/meta.generated.ts` + hand-written
  `src/data/meta.ts`; Sidebar/TopBar/Footer/search + the LandscapeMap landing rewired off `concepts.ts`;
  concepts is now a deferred shared chunk (ModulePage / mental-models only). **Eager index chunk 487.83 →
  21.99 KB gzip** (first-paint landing ≈ 96 KB gzip incl. react-vendor + CSS). check:data enforces meta↔concepts
  parity; run `npm run gen:meta` after editing module metadata. **✅ ALSO DONE S20 — per-module content
  code-split:** `src/data/moduleContent.ts` (36 `id → import('./modules/mXX')` loaders); ModulePage renders
  header/TOC/nav from meta and lazy-loads only the current module's body; mentalModels rewired to meta →
  **concepts.ts is no longer in the app bundle**; a module view loads its own ~8–22 KB gz chunk, not 480 KB.
  Backlog bundle items are now fully cleared.

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

- **2026-06-25 · S13 NoSQL families (document / key-value)** *(branch `s13-nosql-document-keyvalue`)* —
  Authored the first two Section-VI modules **fully EN+UA** to the M13 depth bar, **beginning Section VI**
  and lifting authored modules from 24 → **26**. Both are **figures-only** per the locked plan (§6 —
  neither is among the 8 signature sims); M25 and M26 each get one bespoke SVG figure.
  **M25 · Document databases** `[middle]` (5 topics: the document model & BSON · embed vs reference ·
  WiredTiger storage engine · the aggregation pipeline · write concern & transactions; new **embed-vs-reference**
  SVG figure [left: order + items array co-located in one document — 1 read = complete order; right:
  order doc with `item_ids` pointing to a separate `items` collection via `$lookup` — items shared,
  no duplication], a document-vs-relational **compare**, a BSON-type table, an embed-vs-reference
  decision table [when to embed vs reference: owned/bounded/few vs shared/unbounded/many], an aggregation
  stages table [$match/$group/$project/$lookup/$unwind/$sort/$limit + what each does], a write-concern
  levels table [w:0/1/majority × durability], a MongoDB 4.0/4.2 multi-doc ACID callout, 4 callouts
  [schema-on-read is not schema-less · the $lookup ≠ SQL JOIN callout · 16 MB document cap ·
  transactions exist but use them sparingly], 5 keyPoints, 3 pitfalls, 3 interview Q&A
  [middle/middle/senior], 6 web-verified sources). **M26 · Key-value & caching** `[middle]` (5 topics:
  the key-value model · data structures beyond strings · caching patterns · eviction & persistence ·
  the Redis/Valkey story; new **cache-aside-flow** SVG figure [App → Cache(Redis/Valkey) → Database;
  HIT path in green: DB never touched; MISS path: ① GET miss → ② read DB → ③ result → ④ SET key ttl;
  TTL note at bottom], a key-value data-structures table [String/Hash/List/Set/Sorted Set/Stream/
  HyperLogLog + canonical use-case], a caching-patterns **compare** [cache-aside vs write-through vs
  write-behind × consistency/complexity/when], an eviction-policy table [noeviction/allkeys-lru/lfu/
  volatile-lru/lfu/ttl/random], a persistence-options **compare** [RDB vs AOF × durability/perf/
  recovery], a **Redis licensing timeline** table [2009 BSD·open → Mar 2024 SSPL+RSALv2 → May 2025
  tri-license adds AGPLv3 → 2024 fork Valkey = Linux Foundation BSD-3], 4 callouts [Pub/Sub is not
  durable—Stream is · noeviction on a cache will crash the app · without persistence Redis is a cache
  not a store · Valkey is the new default in Fedora/Ubuntu/Debian/AWS], 5 keyPoints, 3 pitfalls, 3
  interview Q&A [middle/middle/senior], 6 web-verified sources).
  **Web-verified this session** (sources in module `sources[]`): **MongoDB 8.3** (latest stable, May 7
  2026; MongoDB Blog release notes); WiredTiger = default storage engine (B+Tree, MVCC, Snappy
  compression, 60s checkpoint, WAL); 16 MB document cap; BSON (Binary JSON — types richer than JSON:
  ObjectId, Date, Int32/Int64, Decimal128, Binary, etc.); multi-doc ACID transactions since **4.0
  (replica sets, 2018)** and **4.2 (sharded clusters, 2019)**; aggregation pipeline stages
  ($match/$group/$project/$lookup/$unwind etc.) — MongoDB Aggregation documentation; write concern
  w:0/1/majority — MongoDB Write Concern documentation. **Redis:** latest **Redis 8.8.0** (June 2026);
  **tri-license since May 2025** — Redis 8 release (Redis.io blog, May 2025): BSD 2-Clause + SSPLv1 +
  RSALv2 (March 2024 dual-licence) **plus AGPLv3 added**; 7 core data structure types (String, Hash,
  List, Set, Sorted Set, Stream [v5.0+], HyperLogLog); eviction policies (noeviction, allkeys-lru/lfu,
  volatile-lru/lfu/ttl/random) — Redis Eviction policies docs; persistence: RDB (BGSAVE, configurable
  snapshots) + AOF (`appendonly yes`, `appendfsync everysec` default) — Redis Persistence docs.
  **Valkey:** **Valkey 9.1** (2026, new I/O threading model); Valkey = Linux Foundation fork from
  **Redis 7.2.4, March 2024** (BSD-3-Clause); default in **Fedora 42 / Ubuntu 26.04 LTS / Debian 13 /
  Arch Linux**; **AWS ElastiCache default** (9.0 GA 2025); ~90% Redis-command-compatible — Valkey 9.0
  Linux Foundation blog + AWS ElastiCache Valkey announcement.
  **Wiring:** `concepts.ts` imports m25/m26 (stubs replaced, CHANGED(S13)); `registry.tsx` **+2 figures**
  (`embed-vs-reference`, `cache-aside-flow`; total 15 sims + **28 figures**); glossary **+13 terms**
  (document database, BSON, ObjectId, aggregation pipeline, schema-on-read, write concern, key-value
  store, Valkey, TTL (time to live), cache-aside, eviction, cache stampede, AOF (Append-Only File))
  → **122**.
  **Bugs caught & fixed before commit:** (1) **JSX curly-brace parse error in EmbedVsReference.tsx:**
  `{ _id: ObjectId("i1"), sku: "A-42", … }` inside SVG `<text>` elements — JSX treats `{` as an
  expression start → blank render. Fixed with `{'{ _id: ObjectId("i1"), sku: "A-42", … }'}` (JSX
  string literal expression). Also caught a token-typo `fill="var(--tx3"` (missing `)`) in the same
  file. (2) **Ukrainian-apostrophe TS1002 in m25-document.ts:** single-quoted JS strings containing
  Ukrainian words with ASCII apostrophes (`об'єкт`, `пов'язані`, `з'єднують`) terminated strings
  prematurely. Fix applied in two passes via a Python byte-position state machine: (a) escape `\'`
  at all Cyrillic+apostrophe+Cyrillic positions inside single-quoted strings; (b) then remove
  unnecessary escapes at positions that turned out to be inside backtick template literals (where `'`
  is never a terminator) — `no-useless-escape` flagged these 6 positions.
  **Verification (repo, linux-arm64; tsx in node_modules; linux bindings `@esbuild/linux-arm64` +
  `@rolldown/binding-linux-arm64-gnu` installed `--no-save`):** `tsc -b --noEmit` ✓ (clean) · ESLint ✓
  (clean) · `check:data` ✓ (**8 sections, 36 modules [26 authored, 10 stubs], 2667 Localized EN+UA
  pairs**, **15 sims + 28 figures**, 122 glossary terms, all registry keys resolve, cross-links valid)
  · `test:btree` ✓ (346 checks) · **render+content smoke** ✓ (`react-dom/server` renderToStaticMarkup
  of both new figures inside `LangProvider` + module data assertions — EmbedVsReference shows EMBEDDED/
  REFERENCED/ObjectId/embed-rule; CacheAsideFlow shows Cache-Aside/CACHE HIT/CACHE MISS/Redis;
  M25 5 topics / 6 sources / embed-vs-reference figure block; M26 5 topics / 6 sources / redis-valkey-
  story topic / cache-aside-flow figure block) · `vite build` ✓ (**dist-s13**, index 1,132 KB /
  **357 KB gzip** + react-vendor 190 KB / 60 KB gzip + 15 sim + 28 figure on-demand chunks).
  **Bundle watch:** JS gzip **441 → 357 KB** (already code-split in S12; the index contains
  concepts.ts which grows with each session; S12 result was 328 KB gzip; +29 KB for M25+M26). The
  §13 backlog meta.ts data-split remains the documented next lever.
  **Sandbox gotchas (expected, §12):** linux helpers (`@esbuild/linux-arm64`,
  `@rolldown/binding-linux-arm64-gnu`) installed `--no-save`; built into fresh `dist-s13/` (unlink
  blocked; `dist-*/` gitignored). Render-smoke file `scripts/_smoke-s13.tsx` is gitignored
  (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s13.tsx`** (and any stale `_smoke-s11/s12`).
  **No stale `.git/index.lock` this session** (avoided running `git status` in-sandbox).
  **Next (S14):** NoSQL families cont. — M27 Wide-column stores (Cassandra/ScyllaDB, partition/
  clustering model, tunable consistency, LSM heritage); M28 Graph databases (property graph vs RDF,
  traversal, Cypher, when relationships ARE the data). **Pending user:** repo is live (§11) — S13
  appears live once committed & **merged to `main`**; locally `npm install` (darwin-arm64) +
  `npm run verify`; optional cleanup `rm -rf dist-s13`.

- **2026-06-26 · S14 NoSQL families (wide-column / graph)** *(branch `s14-nosql-wide-column-graph`)* —
  Authored the two remaining Section-VI modules **fully EN+UA** to the M13 depth bar, **completing Section
  VI** (M25–M28 all authored) and lifting authored modules from 26 → **28**. Both are **figures-only** per
  the locked plan (§6 — neither is among the 8 signature sims). **M27 · Wide-column stores** `[senior]`
  (5 topics: the wide-column model · the partition/clustering model · tunable consistency · LSM storage
  heritage · ScyllaDB & the engine landscape; new **partition-row-model** SVG figure [two partitions for
  `sensor_data` — `dev-001` in Cassandra-blue, `dev-002` in dist-cyan — with column families and a
  "primary key = partition key + clustering key" annotation]; a wide-column-vs-relational **compare**, a
  CQL-vs-SQL **compare**, a tunable-consistency table [ONE/QUORUM/ALL/LOCAL_QUORUM/LOCAL_ONE/EACH_QUORUM/ANY
  + durability × latency], a compaction-strategies table [STCS/LCS/TWCS/UCS × writes/reads/space + when], a
  Cassandra↔ScyllaDB **compare**, a CREATE TABLE + INSERT + tunable-consistency CQL block; 4 callouts
  [design-for-queries / strong-consistency-costs-availability / tombstone-hazard / Cassandra-5-UCS]; 5
  keyPoints, 3 pitfalls, 3 interview Q&A [middle/senior/staff], 6 web-verified sources).
  **M28 · Graph databases** `[senior]` (5 topics: the graph model & index-free adjacency · property graph vs
  RDF · Cypher & GQL · graph algorithms · when to reach for a graph DB; new **property-graph** SVG figure
  [4 nodes: Alice `:Person`, Bob `:Person`, Inception `:Movie`, Kyiv `:City`; 4 relationships: KNOWS (since:2020),
  ACTED_IN ×2 (with `role` property), LIVES_IN; arrow markers + legend "first-class entities"]; a
  graph-vs-relational **compare** [4-hop path query O(log n)^4 vs O(1)^4]; a property-graph-vs-RDF **compare**;
  a Cypher/GQL history table [Cypher 2010 / Neo4j 1.4 2011 / openCypher Oct 2015 / ISO GQL Apr 2024]; a
  graph-algorithms **table** [Shortest Path / PageRank / Betweenness Centrality / Community Detection (Louvain) /
  Triangle Count]; a when-to-use **compare** [graph vs relational vs document]; a Cypher DDL + traversal +
  `CALL gds.*` code block; 4 callouts [index-free-adjacency-vs-index-join / Neo4j-Community-is-GPLv3-not-AGPLv3
  / GQL-is-now-ISO-standard / Apache-AGE-for-Postgres]; 5 keyPoints, 3 pitfalls, 3 interview Q&A
  [middle/senior/staff], 6 web-verified sources).
  **Web-verified this session** (sources in module `sources[]`): **Cassandra 5.0.7** (latest stable, 2026-03-23;
  Cassandra 5.0.0 released 2024-09-25 — adds **Unified Compaction Strategy (UCS) as the new recommended
  default**, replacing STCS; vector search via JVector, storage-attached indexes); **CQL3 since Cassandra 1.2**
  (2013); **W + R > RF formula** for strong consistency (QUORUM + QUORUM > RF=3); `LOCAL_QUORUM` for multi-DC
  without cross-DC latency; **tombstone hazard** (marked deleted, purgeable only at compaction; too many →
  ReadTimeoutException); **ScyllaDB shard-per-core** (C++ / Seastar framework; each vCPU owns its memtable /
  SSTable / cache / network queue; no lock contention; 10× Cassandra throughput on same hardware); peer-to-peer
  ring (no single master; vnodes default 256/node; gossip + Phi Accrual Failure Detector). **Cypher** created
  2010, first in **Neo4j 1.4 (2011)**; **openCypher** open spec October 2015 (openCypher.org); **ISO/IEC GQL**
  39075:2024 published **April 12, 2024** (first standardized graph query language); **Neo4j 2026.05.0** (CalVer
  GA) / **5.26.x LTS**; Neo4j Community = **GPLv3** (NOT AGPLv3 — a widely-repeated misconception; corrected
  in the `senior` callout); **Apache AGE v1.7.0** for PG18 (2026-01-21; top-level Apache project May 2022) adds
  Cypher to PostgreSQL via an extension; **index-free adjacency** = O(1) per hop (pointer chasing) vs index
  lookup per join (O(log n)); at 4–5 hops the gap is orders of magnitude; **Labeled Property Graph (LPG)** vs
  **RDF** (triples/SPARQL/no-edge-properties-without-reification); graph algorithms via Neo4j GDS library
  (Shortest Path BFS/Dijkstra, PageRank, Betweenness Centrality, Louvain Community Detection, Triangle Count).
  **Bug caught & fixed before commit:** M27 table `head[0]` was `{ en: '', uk: '' }` (intended as a row-label
  column with blank header) — `check:data` rejects empty Localized pairs; replaced with
  `{ en: 'Attribute', uk: 'Атрибут' }`.
  **Wiring:** `concepts.ts` imports m27/m28 (stubs replaced, CHANGED(S14) note); `registry.tsx` **+2 figures**
  (`partition-row-model`, `property-graph`; total 15 sims + **30 figures**); glossary **+12 terms** (wide-column
  store, partition key (Cassandra), clustering key, CQL (Cassandra Query Language), tunable consistency, graph
  database, property graph, index-free adjacency, Cypher, GQL, knowledge graph, RDF (Resource Description
  Framework)) → **134**.
  **Verification (repo, linux-arm64; linux binaries `@esbuild/linux-arm64@0.28.1` +
  `@rolldown/binding-linux-arm64-gnu@1.1.2` installed `--no-save`):** `tsc -b --noEmit` ✓ · ESLint ✓ (clean)
  · `check:data` ✓ (**8 sections, 36 modules [28 authored, 8 stubs], 2910 Localized EN+UA pairs**, **15 sims +
  30 figures**, 134 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks)
  · **render smoke** ✓ (`tsx --tsconfig tsconfig.app.json` renderToStaticMarkup of both new figures —
  PartitionRowModel shows `sensor_data`/`device_id`/`timestamp`/`partition 1`/`partition 2`;
  PropertyGraph shows `Alice`/`Bob`/`Inception`/`KNOWS`/`ACTED_IN`/`first-class entities`) · `vite build` ✓
  (**dist-s14**, index 1,206 KB / **380 KB gzip** + react-vendor 190 KB / 60 KB gzip + 15 sim + 30 figure
  lazy chunks; +23 KB gzip from 357 KB for two dense bilingual modules + 2 figures). **Section VI complete.**
  **Sandbox gotchas (expected, §12):** linux helpers installed `--no-save`; built into fresh `dist-s14/`
  (unlink blocked; `dist-*/` gitignored). Smoke file `scripts/_smoke-s14.mts` is gitignored (`scripts/_smoke-*.ts`)
  — **user can `rm scripts/_smoke-s14.mts`** (and any stale `_smoke-s13.tsx`). **No stale `.git/index.lock`
  this session** (avoided `git status` in-sandbox).
  **Next (S15):** Modern engines — M29 Vector databases & AI (embeddings, ANN/HNSW, pgvector vs Qdrant/Pinecone/
  Milvus/Weaviate, RAG + **★ Vector/ANN search sim**); M30 Distributed SQL / NewSQL (CockroachDB, TiDB,
  YugabyteDB, Spanner, Aurora DSQL, "Postgres won the API"). **Pending user:** repo is live (§11) — S14 appears
  live once committed & **merged to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`;
  optional cleanup `rm -rf dist-s14 scripts/_smoke-s14.mts`.

- **2026-06-26 · S15 Modern engines (vector / distributed SQL)** *(branch `s15-vector-distributed-sql`)* —
  Authored the first two Section-VII modules **fully EN+UA** to the M13 depth bar, **beginning Section VII**
  and lifting authored modules from 28 → **30**. Shipped the **★ Vector/ANN search sim** (the last of the
  8 §6 signature sims); M30 is **figures-only** per the locked plan. **M29 · Vector databases & AI**
  `[senior]` *(signature)* (5 topics: embeddings & distance metrics · ANN and HNSW · pgvector · dedicated
  vector DBs · RAG; new **rag-pipeline** SVG figure [4-step RAG flow: Query → Embed → ANN Search → LLM +
  chunks → Answer; top labels: query vector `[0.21, -0.88, …]` + `top-k docs`; bottom dashed bar: "chunks
  injected into prompt"], the ★ **Vector/ANN search sim**, a distance-metrics table [cosine/L2/dot-product +
  when to use], a pgvector index types table [HNSW vs IVFFlat + tuning params], a 4-engine table
  [Qdrant/Milvus/Weaviate/Pinecone × strengths/when], a pgvector DDL + query code block, 4 callouts
  [normalise-for-cosine / ef-tunes-at-query-time / hybrid-search / eval-mandatory], 5 keyPoints, 3 pitfalls
  [IVFFlat lists must be set at build / blindly trusting recall / premature migration], 3 interview Q&A
  [senior/senior/staff], 6 web-verified sources).
  **M30 · Distributed SQL / NewSQL** `[staff]` *(figures-only)* (5 topics: why distributed SQL · CockroachDB
  & YugabyteDB · TiDB HTAP · Spanner TrueTime + Aurora DSQL · choosing distributed SQL; new **distributed-sql-arch**
  SVG figure [3-column comparison: CockroachDB · TiDB HTAP · Aurora DSQL; bottom banner: "Postgres won the
  API — all expose the Postgres wire protocol"; colour-coded by concept palette], a manual-sharding vs NewSQL
  **compare**, a 5-engine decision table, a cross-region write latency `warn` callout, a TiFlash opt-in `tip`,
  a **`warn` callout: Spanner Omni is Preview not GA** [corrects CLAUDE.md §12 "on-prem GA 2025"], a "start
  with Postgres" `senior` callout, 5 keyPoints, 3 pitfalls [Postgres-wire ≠ 100% compat / cross-region latency /
  Spanner Omni Preview], 3 interview Q&A [staff/staff/staff], 6 web-verified sources).
  **★ Vector/ANN search sim** (`sims/VectorSim.tsx`, key `vector-search`): **12 fixed points in 3 clusters**
  (tech/sports/food) + a query Q in the food region; **Mode toggle: Exact kNN ↔ HNSW**; for HNSW an **ef toggle
  (ef=4 ↔ ef=8)**. Exact kNN always visits all 12, recalls 3/3 (true top-3: C1/C2/C4). HNSW ef=4 navigates a
  pre-computed greedy path (A1→A2→B2→B4→C3→C1 — 6 nodes), recalls 1/3 (misses C2, false positive C3). HNSW
  ef=8 extends the beam (adds C2/C4 — 8 nodes), recalls 3/3. Stats strip: Scanned X/12, Recall Y/3, Speed
  (relative); contextual notes explain the result (ef trade-off, false positive, cross-cluster bridge). Pure SVG
  canvas (viewBox 420×272); cluster points, HNSW edges, active-path highlights, star query marker, hit/miss rings.
  Toggle-driven, inherently reduced-motion-safe, ARIA radiogroups + live region. New `.vec-*` CSS appended to
  `components.css`; both assets registered in `registry.tsx` (lazy chunks).
  **Web-verified this session** (sources in module `sources[]`): **pgvector v0.8.2** (Feb 26 2026, CVE-2026-3172
  fix) — HNSW recommended over IVFFlat for new installs; operators `<=>` cosine/`<->` L2/`<#>` dot-product;
  `hnsw.ef_search` is a query-time GUC (no index rebuild); `ivfflat.lists` must be set at build; **Malkov &
  Yashunin 2018** HNSW arXiv:1603.09320 (multi-layer proximity graph; O(log n) query; M edges/node,
  ef_construction build beam); **Lewis et al. NeurIPS 2020** RAG paper (retrieval-augmented generation);
  **Qdrant v1.18.2** (Jun 12 2026, Rust, Apache 2.0, HNSW+quantization, hybrid dense+sparse);
  **Milvus 3.0-beta** (May 9 2026, CNCF, Python-first, billions-scale, HNSW/IVF/DiskANN); **Weaviate v1.37.2**
  (Apr 2026, Go, Apache 2.0, hybrid vector+keyword BM25); **Pinecone** (serverless-default 2026, managed).
  **CockroachDB v26.2** (CalVer; range-based Raft; Postgres wire); **TiDB 8.5 GA** (Dec 2024; TiKV row/Raft +
  TiFlash columnar Raft Learner; HTAP real-time analytics over live OLTP; `ALTER TABLE … SET TIFLASH REPLICA`);
  **YugabyteDB v2025.2.5.0** (Jun 12 2026; YSQL PG-compat + YCQL Cassandra; DocDB/RocksDB); **Spanner OSDI
  2012** (TrueTime: GPS + atomic clock → bounded uncertainty interval → external consistency without distributed
  locks); **Spanner Omni (on-prem) = Preview as of Jun 2026 (NOT GA)** — CLAUDE.md §12 "on-prem GA 2025" is
  incorrect; corrected here and in the M30 warn callout; **Aurora DSQL GA May 2025** (PG 16-compatible;
  serverless active-active; OCC; 99.999% multi-region SLA); all five expose the Postgres wire protocol
  ("Postgres won the API").
  **Fact correction (CLAUDE.md §12):** `Spanner (TrueTime; on-prem GA 2025)` → **Spanner Omni is Preview, not
  GA, as of June 2026**. The §12 blurb is updated here for future sessions; the M30 warn callout teaches this
  explicitly. Web-search result: the Spanner Omni page (`cloud.google.com/spanner/docs/omni`) still shows
  "Preview" status.
  **Wiring:** `concepts.ts` imports m29/m30 as default exports (CHANGED(S15)); `registry.tsx` **+1 sim**
  (`vector-search`) **+2 figures** (`rag-pipeline`, `distributed-sql-arch`; total 16 sims + **32 figures**);
  glossary **+12 terms** (embedding, vector database, HNSW, ANN, RAG, pgvector, IVFFlat, NewSQL, HTAP,
  TrueTime, Spanner Omni, Aurora DSQL) → **146**.
  **Bugs caught & fixed before commit:** (1) `RagPipeline.tsx` — `const mx = (x1+x2)/2` computed but never
  used → `noUnusedLocals` TS6133; removed the line. (2) `m29-vector.ts` and `m30-distributed-sql.ts` — both
  missing the required `num: number` field from the `Module` type → TS2741; added `num: 29` and `num: 30`.
  (3) `m30-distributed-sql.ts` — `seeAlso` referenced `'m22-partitioning'` (non-existent); the module id is
  `'m22-sharding'` → `check:data` caught it; fixed. (4) Render smoke: `LangProvider` is at
  `src/i18n/LangProvider.tsx` (not `LangContext`); fixed import path. (5) Smoke must run from within the repo
  tree (node_modules resolution) — moved from `/tmp` to `scripts/_smoke-s15.tsx`.
  **Verification (repo, linux-arm64; linux binaries `@esbuild/linux-arm64@0.28.1` +
  `@rolldown/binding-linux-arm64-gnu@1.1.2` installed `--no-save`):** `tsc -b --noEmit` ✓ (clean) · ESLint ✓
  (clean) · `check:data` ✓ (**8 sections, 36 modules [30 authored, 6 stubs], 3083 Localized EN+UA pairs**,
  **16 sims + 32 figures**, 146 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓
  (346 checks) · **render smoke** ✓ (`scripts/_smoke-s15.tsx` — 9 assertions: VectorSim renders with
  vec-sim/Exact kNN/HNSW/Scanned/query; RagPipeline renders with ANN Search/Embedding model/top-k docs/Answer;
  DistributedSqlArch renders with CockroachDB/TiDB/Aurora DSQL/Postgres won the API; M29 5 topics + vector-search
  sim block + rag-pipeline figure block; M30 5 topics + distributed-sql-arch figure block) · `vite build` ✓
  (**dist-s15**, index 1,306 KB / **398 KB gzip** + react-vendor 190 KB / 60 KB gzip + 16 sim + 32 figure lazy
  chunks; +18 KB gzip from 380 KB for two dense bilingual modules + ★ sim + 2 figures; VectorSim and
  DistributedSqlArch split into separate on-demand chunks).
  **Sandbox gotchas (expected, §12):** linux helpers installed `--no-save`; built into fresh `dist-s15/`
  (unlink blocked; `dist-*/` gitignored). Smoke file `scripts/_smoke-s15.tsx` is gitignored (`scripts/_smoke-*.ts`)
  — **user can `rm scripts/_smoke-s15.tsx`** (and any stale `_smoke-s14.mts`). **No stale `.git/index.lock`**
  this session.
  **Next (S16):** Modern engines cont. — M31 Analytics, columnar & time-series (ClickHouse, DuckDB, TimescaleDB,
  InfluxDB 3, the lakehouse); M32 Cloud-native & the modern DBA (managed DBs, Docker/K8s operators, IaC,
  observability, autoscaling). **Pending user:** repo is live (§11) — S15 appears live once committed &
  **merged to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup
  `rm -rf dist-s15 scripts/_smoke-s15.tsx`.

- **2026-06-26 · S16 Modern engines (analytics / cloud-native)** *(branch `s16-analytics-cloud-native`)* —
  Authored the two remaining Section-VII modules **fully EN+UA** to the M13 depth bar, **completing Section VII**
  (M29–M32) and lifting authored modules from 30 → **32**. Both are **figures-only** per the locked plan (§6 — the
  8 signature sims are all built; the last, ★ Vector/ANN, shipped in S15). **M31 · Analytics, columnar & time-series**
  `[senior]` (4 topics: columnar storage & vectorized execution · ClickHouse & DuckDB · time-series TimescaleDB &
  InfluxDB 3 · the lakehouse; new **columnar-scan** SVG figure [same `SELECT sum(amount)` — row store reads all 5
  columns (4/5 wasted I/O) vs column store reads only `amount`, compressed] + new **hypertable** SVG figure [one
  logical hypertable → time chunks: recent row/uncompressed, older compressed columnar ~90%, oldest dropped by
  retention; continuous-aggregate chip], a compression-encodings table [RLE/dictionary/delta/FOR], an OLTP-vs-OLAP
  **compare**, an OLAP-engines table [ClickHouse/DuckDB/StarRocks·Doris/Druid·Pinot], a TimescaleDB-vs-InfluxDB-3
  **compare**, an open-table-formats table [Iceberg/Delta/Hudi], a ClickHouse-MergeTree + DuckDB-over-Parquet code
  block and a TimescaleDB hypertable+CAGG+compression/retention code block, 6 callouts [compression-is-first-class /
  ClickHouse-MV≠PG-matview / DuckDB-needs-no-server / TimescaleDB-TSL-licensing-warn / storage-compute-decoupling /
  query-Parquet-without-a-warehouse], 5 keyPoints, 3 pitfalls, 3 interview Q&A [senior/senior/staff], 7 web-verified
  sources). **M32 · Cloud-native & the modern DBA** `[senior]` (4 topics: managed databases · containers & K8s
  operators · infrastructure as code · observability & the modern DBA dashboard; new **shared-responsibility** SVG
  figure [self-hosted = you own all 7 layers; managed = provider owns bottom 4, you keep schema/queries/data; "the
  line moves up"], a managed-PostgreSQL-options table [RDS/Aurora/Cloud SQL·AlloyDB/Azure], a DBaaS-vs-operator
  **compare**, a pg_stat_* views table [statements/activity/io/user_tables], a CloudNativePG `Cluster` YAML block and
  a Terraform `aws_db_instance` HCL block, 6 callouts [responsibility-line-moves-up / cost-and-lock-in /
  do-not-hand-roll-stateful-PG-on-K8s / IaC-state-and-secrets-security / Terraform-vs-Ansible-and-OpenTofu /
  pg_stat_statements-highest-value / the-DBA-moved-up-the-stack], 5 keyPoints, 3 pitfalls, 3 interview Q&A
  [senior/senior/staff], 7 sources).
  **Web-verified this session** (sources in module `sources[]`): **ClickHouse v26.2** (2026-02-26; CalVer YY.M) —
  columnar, vectorized execution, MergeTree, materialized views that aggregate on INSERT (VLDB 2024 paper Schulze et
  al.). **DuckDB 1.x** (1.5.2, Apr 2026; v2.0 expected Fall 2026) — in-process/embedded "SQLite of analytics", reads
  Parquet/CSV/JSON incl. `s3://` with predicate pushdown, ~10× faster than pandas; DuckLake 1.0. **TimescaleDB** — PG
  extension; company **rebranded to TigerData 2025-06-17** (extension stays "TimescaleDB"); hypertables + continuous
  aggregates + columnar compression (~90–95%) + retention/tiered-storage; **dual-licensed Apache-2.0 core + Timescale
  License (TSL)** for compression/CAGGs/retention — free to self-host, **may NOT be resold as DBaaS**. **InfluxDB 3
  Core + Enterprise GA 2025-04-15** — full Rust rewrite on the **FDAP stack** (Flight + DataFusion + Arrow + Parquet),
  columnar, unlimited cardinality. **Lakehouse:** Parquet = columnar file format; open table formats add ACID/schema-
  evolution/time-travel — **Iceberg** (converging industry standard — vendor-neutral, partition evolution; Databricks
  bought Tabular >$1B mid-2024; AWS S3 Tables; Snowflake Polaris; BigQuery), **Delta Lake** (largest installed base,
  Databricks/UniForm), **Hudi** (streaming/CDC). **Managed PG:** RDS (near-vanilla, most portable) vs Aurora (AWS-only,
  distributed storage, ~3× claimed) vs Cloud SQL/**AlloyDB** (columnar HTAP, GCP-only) vs Azure Flexible Server (+
  Elastic Clusters/Citus). **CloudNativePG** — CNCF **Sandbox since 2025-01-21**, community-governed/vendor-neutral,
  HA via streaming replication, supports PG18; peers Crunchy PGO / Zalando / StackGres / KubeDB; **operator pattern =
  CRD + reconciliation-loop controller**. **IaC:** Terraform → **BSL 1.1 (2023)**, IBM acquisition **closed Feb 2025**,
  each version reverts to MPL after 4 yrs; **OpenTofu** (Linux Foundation fork) reached **1.9 early 2026**; Ansible
  (Red Hat) = config mgmt. **Observability:** `pg_stat_statements` (cumulative per-query, `shared_preload_libraries`),
  `pg_stat_activity`, `pg_stat_io` (since PG16); postgres_exporter (:9187) → Prometheus → Grafana; OpenTelemetry /
  Grafana Alloy (2026 collector). PG latest stable **18.4**, 19 Beta 1.
  **Wiring:** `concepts.ts` imports m31/m32 as default exports (stubs replaced, CHANGED(S16) note); `registry.tsx`
  **+3 figures** (`columnar-scan`, `hypertable`, `shared-responsibility`; total **16 sims + 35 figures**); glossary
  **+18 terms** (columnar storage, vectorized execution, ClickHouse, DuckDB, hypertable, continuous aggregate,
  TimescaleDB, lakehouse, Apache Iceberg, Parquet, managed database (DBaaS), shared responsibility model, Kubernetes
  operator, CloudNativePG, infrastructure as code (IaC), Terraform, OpenTofu, pg_stat_statements, observability) →
  **165**.
  **Bug caught & fixed before commit:** the M31 "query Parquet without a warehouse" callout embedded inline SQL
  `FROM 's3://.../*.parquet'` inside a **single-quoted** EN/UA string — the inner `'` terminated the JS string
  (TS1005 ×4). Fixed by escaping the inner quotes (`\'…\'`) in both languages.
  **Verification (repo, linux-arm64; `@rolldown/binding-linux-arm64-gnu` + `@esbuild/linux-arm64` +
  `lightningcss-linux-arm64-gnu` already present in `node_modules`):** `tsc -b --noEmit` ✓ (clean) · ESLint ✓ (clean)
  · `check:data` ✓ (**8 sections, 36 modules [32 authored, 4 stubs], 3301 Localized EN+UA pairs**, **16 sims + 35
  figures**, 165 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓ (346 checks) ·
  **render+content smoke** ✓ (`scripts/_smoke-s16.tsx`, `react-dom/server` of the 3 new figures — ColumnarScan
  Row/Column store + `sum(amount)` + "reads only amount"; Hypertable `hypertable: metrics` + continuous aggregate +
  ~90% + retention; SharedResponsibility Self-hosted + Managed DBaaS + Hardware + "the line moves up" — plus M31/M32
  shape: 4 topics, 7 sources, figure blocks, signature:false) · `vite build` ✓ (built into fresh `dist-s16/`; index
  **1,350.74 KB / 426.05 KB gzip** + react-vendor 189.65 KB / 59.64 KB gzip + 16 sim + 35 figure on-demand chunks
  incl. the 3 new figure chunks ColumnarScan/Hypertable/SharedResponsibility ~1–2 KB gzip each; +28 KB gzip from
  S15's 398 KB for two dense bilingual modules + 3 figures + 18 glossary terms).
  **Sandbox gotchas (expected, §12):** linux helper binaries already present from prior sessions → all tooling ran;
  built into fresh `dist-s16/` (unlink blocked; `dist-*/` gitignored). Smoke file `scripts/_smoke-s16.tsx` is
  gitignored (`scripts/_smoke-*.ts`) — **user can `rm scripts/_smoke-s16.tsx`** (and any stale `_smoke-s15.tsx`).
  **No stale `.git/index.lock`** this session (avoided in-sandbox `git status`). No new CSS (figures are pure SVG).
  **Next (S17):** Section VIII Mastery — M33 Security & data protection (authN/authZ, RBAC/RLS, encryption at rest/in
  transit, SQL injection, least privilege); M34 Performance engineering (profiling, slow queries, connection pooling,
  N+1, caching, capacity). **Pending user:** repo is live (§11) — S16 appears live once committed & **merged to
  `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s16
  scripts/_smoke-s16.tsx`.

- **2026-06-26 · S17 Mastery (security / performance)** *(branch `s17-security-performance`)* — Authored the first two
  Section-VIII modules **fully EN+UA** to the M13 depth bar, lifting authored modules from 32 → **34** (Section VIII now
  2 of 4: M33, M34; M35–M36 land in S18). **Scope decision (user choice this session via AskUserQuestion = "Both
  interactives"):** S17 carries **no** §6 signature sim (all 8 are built), so the freed budget went to **two light
  interactives** — one per module. Both M33 and M34 are flipped **`signature: false → true`** (the codebase flag marks
  any module with a notable interactive — the same convention used for families-map/er/normalization/2pc; the §6 "8 hero
  sims" target is unchanged in spirit — these are the **10th and 11th** interactives). **M33 · Security & data
  protection** `[senior]` *(light signature)* (5 topics: authN/authZ + RBAC + least privilege · row-level security ·
  encryption at rest/in transit · password hashing & secrets · SQL injection + hardening checklist; the ★ **SQL-injection
  sim** + new **trust-boundaries** SVG figure [defense-in-depth concentric boundaries: untrusted input → TLS → authN →
  authZ/RLS → data-at-rest core] + new **rls-policy** SVG figure [one shared `orders` table, two tenant sessions see
  disjoint rows through one policy], a pg_hba auth-methods table, an encryption-layers table, an OWASP password-hashing
  table, an 8-row hardening-checklist table, a least-privilege role-DDL block + an RLS-policy DDL block + a
  concatenated-vs-parameterized JS block, 4 callouts [security · warn · security · security], 5 keyPoints, 3 pitfalls,
  3 interview Q&A [senior/senior/staff], 8 web-verified sources). **M34 · Performance engineering** `[senior]` *(light
  signature)* (5 topics: the measure→bottleneck→fix→verify method · slow queries/EXPLAIN/N+1 · connection pooling ·
  caching layers & read replicas · capacity/scale-up-vs-out; the ★ **N+1 sim** + new **bottleneck-loop** SVG figure
  [the optimization cycle, I/O-bound centre] + new **connection-pool** SVG figure [thousands of clients → PgBouncer →
  small warm backend pool], a symptom→cause→fix table, a PgBouncer pool-modes table, a where-to-offload-reads table,
  a pgbouncer.ini code block + an N+1-vs-eager JS block, a scale-up-vs-scale-out compare, 5 callouts, 5 keyPoints,
  3 pitfalls, 3 interview Q&A [senior/senior/staff], 7 sources).
  **★ SQL-injection sim** (`sims/SqlInjectionSim.tsx`, key `sql-injection`): two toggles — **Concatenated ↔
  Parameterized** × **attacker input** (Normal · Auth bypass `' OR '1'='1' --` · Destructive `'; DROP TABLE users; --`).
  Concat splices the input into the SQL (injected span highlighted red) → auth-bypass returns every row / DROP destroys
  the table; parameterized binds it as `$1` data (green) → 0 rows, attack neutralized. Live verdict banner (safe/danger),
  toggle-driven, inherently reduced-motion-safe, ARIA tablists + live region. **★ N+1 sim** (`sims/NPlusOneSim.tsx`,
  key `n-plus-one`): toggle **Lazy (N+1) ↔ Eager (JOIN)** × N (3 · 25 · 100); lazy shows 1 parent query + ×N child
  queries (N+1 round-trips); eager shows one JOIN; a stats strip (queries / round-trips / ≈ latency) and a two-bar
  Lazy-vs-Eager comparison make the collapse vivid (100 authors → 101 queries vs 1). Toggle-driven, reduced-motion-safe,
  ARIA. New `.sqli-*` + `.nplus1-*` CSS blocks appended to `components.css`; both sims + 4 figures registered; glossary
  **+18 terms** (row-level security (RLS), RBAC, least privilege, SCRAM-SHA-256, SQL injection, parameterized query,
  pgcrypto, encryption at rest, encryption in transit, Argon2id, bcrypt; N+1 query problem, connection pooling,
  PgBouncer, transaction pooling, read replica, vertical scaling (scale up), horizontal scaling (scale out)) → **183**.
  **Web-verified this session** (sources in module `sources[]`, primary = PG 18 docs): **RLS** (5.9 / CREATE POLICY) —
  ENABLE ROW LEVEL SECURITY + USING/WITH CHECK; owner & superuser bypass unless **FORCE ROW LEVEL SECURITY**;
  `pg_read_all_data` does NOT bypass RLS; policies default PERMISSIVE. **AuthN** — `scram-sha-256` default since **PG14**,
  **md5 deprecated** (PG18 warns on a md5 password); predefined roles since PG14. **Encryption** — **no built-in TDE in
  community Postgres** (§18.8 Encryption Options) → filesystem (LUKS/BitLocker) + **pgcrypto** column-level (not
  transparent, app manages keys); in transit = TLS, client **sslmode=verify-full** defeats MITM. **App password
  hashing** (OWASP Password Storage Cheat Sheet) — **Argon2id** first choice (≥19 MiB/t=2/p=1; ~64 MiB interactive),
  bcrypt (work factor ≥12, 72-byte limit), scrypt, PBKDF2 for FIPS; never a fast hash. **SQL injection** — parameterized
  queries are the fix, not escaping; **CVE-2025-1094** (Feb 2025) bypassed libpq escaping APIs via invalid encoding →
  psql injection → RCE, fixed 17.3/16.7/15.11/14.16/13.19. **Performance** — `EXPLAIN (ANALYZE)` includes **BUFFERS by
  default in PG18**; `auto_explain` logs slow plans; **N+1** = lazy ORM relation → 1+N round-trips, fix = eager JOIN /
  batched IN. **Connection cost** — each connection is a backend process (~5–10 MB, ~ms to fork) vs ~0.1–0.3 ms for a PK
  SELECT; default `max_connections`=100. **PgBouncer 1.25.2** (May 2026): pool modes session/transaction(default for web
  apps; prepared statements since 1.21)/statement; `default_pool_size` 20; alternatives pgcat (Rust), Supavisor (Elixir).
  **Pool sizing** — HikariCP `(cores × 2) + spindles`; smaller pools usually faster. **Read replicas** — offload reads,
  route read-your-writes to primary, mind replication lag. PG stable **18.4** (May 14 2026), 19 Beta 1.
  **Verification (repo, linux-arm64; linux binaries present):** `tsc -b --noEmit` ✓ (clean, first pass) · ESLint ✓
  (clean, first pass) · `check:data` ✓ (**8 sections, 36 modules [34 authored, 2 stubs], 3537 Localized EN+UA pairs**,
  **18 sims + 39 figures**, 183 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓ (346
  checks) · **render+content smoke** ✓ (`scripts/_smoke-s17.tsx` — 6/6: SqlInjectionSim Concatenated/Parameterized/
  Auth-bypass/SELECT * FROM users; NPlusOneSim Lazy/Eager/SELECT * FROM authors/round-trips; TrustBoundaries Defense-in-
  depth/Authentication/TLS/Your-data; RlsPolicy CREATE POLICY/orders(stored)/Session A sees/tenant; BottleneckLoop
  Measure/Find-bottleneck/Fix/Verify/I-O-bound; ConnectionPool PgBouncer/PostgreSQL/backend-process/clients) ·
  `vite build` ✓ (**dist-s17**, index **1,455.37 KB / 459.00 KB gzip** + react-vendor 189.65 KB / 59.64 KB gzip + **18
  sim + 39 figure** lazy chunks, incl. the 6 new SqlInjectionSim/NPlusOneSim/TrustBoundaries/RlsPolicy/BottleneckLoop/
  ConnectionPool chunks ~1–5 KB gzip each).
  **Bundle watch:** index gzip **426 → 459 KB (+33)** for two dense bilingual modules + 2 sims + 4 figures + 18 glossary
  terms; Vite still warns the raw index chunk >900 KB. The §13 **meta.ts data-split** remains the documented next lever
  (would drop the index chunk substantially by moving authored content out of the Sidebar/TopBar eager import).
  **Clean first pass — no TS/lint/data errors in the authored code.** Only the smoke *harness* needed two tweaks (not
  app bugs): add `import * as React` (tsx used the classic JSX runtime) and relax one assertion that matched on `'`
  characters React HTML-escapes (`&#x27;`). Quote convention held: UA/EN strings containing apostrophes were authored
  with double quotes, avoiding the S13-class TS1005 parse error.
  **Sandbox gotchas (expected, §12):** linux helper binaries (`@esbuild/linux-arm64`, `@rolldown/binding-linux-arm64-gnu`,
  `lightningcss-linux-arm64-gnu`) already present → all tooling ran; built into fresh `dist-s17/` (unlink blocked;
  `dist-*/` gitignored). Smoke file `scripts/_smoke-s17.tsx` is gitignored (`scripts/_smoke-*.tsx`) — **user can `rm
  scripts/_smoke-s17.tsx`** (and any stale `_smoke-s16.tsx`). **No stale `.git/index.lock`** this session (avoided
  in-sandbox `git status`).
  **Next (S18):** Mastery + polish — M35 Choosing the right database (+ **★ Database Picker**, data in `decide.ts`);
  M36 Mental-models gallery + glossary + cheat-sheet; then global search, flashcards, mobile/a11y/perf, bilingual QA.
  **Section VIII completes in S18.** **Pending user:** repo is live (§11) — S17 appears live once committed & **merged
  to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s17
  scripts/_smoke-s17.tsx`.

- **2026-06-28 · S18 Mastery (choosing / cheat-sheet) — CURRICULUM COMPLETE** *(branch
  `s18-database-picker-capstone`)* — Authored the two remaining Section-VIII modules **fully EN+UA** to the M13
  depth bar, **completing Section VIII (M33–M36) and the entire 36-module curriculum** — authored modules
  **34 → 36, zero stubs**. User decisions this session (AskUserQuestion): **max-depth** Database Picker
  (questionnaire wizard, embedded in M35 **and** wired into the standalone `#/decide` page) + **full in-module
  cheat-sheet** for M36. **M35 · Choosing the right database** `[senior]` *(★ signature)* (5 topics: the
  framework requirements-first/default-and-deviate · the questions that matter · workload walkthroughs ·
  polyglot persistence & its cost · anti-patterns; the ★ **Database Picker wizard** + new **decision-flow**
  SVG figure, a decision-dimensions table, a workload→primary→add-on table, an anti-pattern→reality→fix table,
  a single-store-vs-polyglot **compare**, 4 callouts [boring-is-a-feature/default-to-Postgres · one-workload-
  one-question · Postgres+one-specialist · dual-write-warn], 5 keyPoints, 3 pitfalls, 3 interview Q&A
  [senior/senior/staff], 6 web-verified sources). **M36 · Mental models gallery + glossary** `[middle]`
  *(figures-only capstone)* (4 topics: how to use mental models + the gallery/glossary surfaces · cheat-sheet I
  storage & indexing · cheat-sheet II transactions & concurrency · cheat-sheet III distribution & choosing; new
  **guide-map** SVG figure [8-section journey], **7 recap tables** — access-cost/Big-O, index-by-query-shape,
  normal forms, ACID, the **isolation × anomaly matrix** (PG-accurate: never dirty-reads, RR=SI also stops
  phantoms, only SER stops write-skew), CAP/PACELC, family decision one-liners — 2 senior callouts + 1 tip,
  5 keyPoints, 3 pitfalls, 3 interview Q&A [middle/senior/staff], 6 canonical sources).
  **★ Database Picker wizard** (`sims/DbPicker.tsx`, key `db-picker`): a requirements-first questionnaire from
  new **`src/data/decide.ts`** (5 questions × options that `leansTo` family ids; 9 `decideOptions` whose `id`s
  match **families.ts** so the recommendation reuses each family's brand colour + deep-link `moduleId` and can
  never drift). Step through Back/Next with a progress strip → tally the leans → ranked result: a winner card
  (family · engines · why · "Open the module") with relational/PostgreSQL as the **baseline default that wins
  ties**, up to two runners-up, and a **polyglot-persistence hint** when ≥2 families score strongly (Postgres as
  system of record + the top specialist). Click-driven, inherently reduced-motion-safe, ARIA radiogroups + live
  region. Also rendered on the **standalone `#/decide` route** (App.tsx) — replaced the S-era ComingSoon
  placeholder. New `.dbp-*` CSS block appended to `components.css`.
  **Web-verified this session** (sources in module `sources[]`): **PostgreSQL 18.4** latest stable (2026-06-04),
  **19 Beta 1** (2026-06-04, GA ~Sept/Oct 2026); **DB-Engines H1 2026** — PostgreSQL the fastest-growing engine
  (**+21.97**), top-4 by score (Oracle, MySQL, SQL Server, PostgreSQL) static >12 months; **Stack Overflow
  2025/2026** — PostgreSQL the **most-used database among professional developers** (overtook MySQL) and **#1
  most-wanted** → supports the "Postgres as the safe default" thesis; **polyglot persistence** coined by Martin
  Fowler (NoSQL Distilled, Sadalage & Fowler 2012; "different problems are best solved with different storage
  technologies"). M36's recap tables re-state facts verified in their home modules (PG 18 transaction-iso /
  indexes / WAL docs, Kent 1983 five normal forms, Gilbert & Lynch 2002 CAP, Use-The-Index-Luke).
  **Wiring:** `concepts.ts` imports m35/m36 (stubs replaced); **removed the now-unused `stub()` helper +
  `StubInput` type** and refreshed the header comment (all 36 authored); `registry.tsx` **+1 sim** (`db-picker`)
  **+2 figures** (`decision-flow`, `guide-map`); `App.tsx` `#/decide` → live `DbPicker` (dropped the ComingSoon
  lazy import); glossary **+4 terms** (polyglot persistence, system of record, dual-write problem,
  résumé-driven development) → **187**.
  **Verification (repo, linux-arm64; linux helper binaries present):** `tsc -b --noEmit` ✓ · ESLint ✓ (**clean,
  first pass**) · `check:data` ✓ (**8 sections, 36 modules [36 authored, 0 stubs], 3821 Localized EN+UA pairs**,
  **19 sims + 41 figures**, 187 glossary terms, all registry keys resolve, cross-links valid) · `test:btree` ✓
  (346 checks) · **render+content smoke** ✓ (`scripts/_smoke-s18.tsx` — DbPicker renders question 1/5 +
  options + Next; DecisionFlow shows PostgreSQL/the default/Neo4j/Default-to-relational; GuideMap shows the
  8-section map; decide.ts = 5 questions / 9 options with every `leansTo` resolving; M35 = 5 topics + db-picker
  sim + decision-flow figure + signature; M36 = 4 topics + guide-map figure + the 4-col isolation matrix) ·
  `vite build` ✓ (**dist-s18**, index **1,550.65 KB / 487.83 KB gzip** + react-vendor 189.65 KB / 59.64 KB gzip
  + **19 sim + 41 figure** lazy chunks, incl. DbPicker 19.97 KB / 7.49 KB gzip + DecisionFlow/GuideMap figure
  chunks).
  **Clean first pass — no TS/lint/data errors in the authored code.** Quote convention held (double-quoted
  EN/UA strings for any containing apostrophes → no S13-class TS1005); the smoke harness needed only the usual
  `import * as React` for the classic-JSX tsx default.
  **Bundle watch:** index gzip **459 → 487.83 KB (+29)** for two dense bilingual modules + `decide.ts` + 4
  glossary terms; Vite still warns the raw index chunk >900 KB. With the code-split done (S12), the **`meta.ts`
  data-split is now the single remaining bundle lever** (§13 backlog) — Sidebar/TopBar import all authored
  `concepts.ts` content eagerly; splitting module metadata from bodies + a prebuilt search index would drop the
  index chunk substantially. Slot in the S19–S20 buffer.
  **Sandbox gotchas (expected, §12):** linux helper binaries (`@esbuild/linux-arm64`,
  `@rolldown/binding-linux-arm64-gnu`, `lightningcss-linux-arm64-gnu`) already present → all tooling ran; built
  into fresh `dist-s18/` (unlink blocked; `dist-*/` gitignored). Smoke file `scripts/_smoke-s18.tsx` is
  gitignored (`scripts/_smoke-*.tsx`) — **user can `rm scripts/_smoke-s18.tsx`** (and any stale `_smoke-s15/s17`).
  **No stale `.git/index.lock`** this session (avoided in-sandbox `git status`).
  **🎉 Curriculum complete:** all **36 modules** authored across **8 sections**; all **8 §6 signature sims**
  built (B-Tree, Query Planner, Isolation, MVCC, Replication, CAP, LSM, Vector/ANN) plus the opportunistic/light
  interactives (families-map, ER, normalization, query-lifecycle, index-picker, 2PC, sharding, SQL-injection,
  N+1, **Database Picker**) — **19 sims + 41 figures** total.
  **Next (S19–S20 · buffer / polish):** the §13 backlog — **`meta.ts` data-split** (bundle); optional promotions
  (★ FLOAT-drift stepper M9, ★ window-frame stepper M10); a **full UA QA pass**; global search / flashcards /
  mobile / a11y / perf polish; optional PDF/LinkedIn pack. **Pending user:** repo is live (§11) — S18 appears
  live once committed & **merged to `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional
  cleanup `rm -rf dist-s18 scripts/_smoke-s18.tsx`.

- **2026-06-28 · S19 Buffer/polish (two deferred steppers + meta.ts data-split)** *(branch
  `s19-steppers-meta-datasplit`)* — Cleared the three big §13 backlog items in one session: promoted the two
  deferred figure→sim steppers and implemented the bundle data-split. No new module content; all 36 modules
  stay authored.
  **★ FLOAT-drift stepper (M9)** (`sims/FloatDriftSim.tsx`, key `float-drift`): add 0.1 (or 0.01) N times in
  `double precision` vs `numeric`; the float lane is computed by literally summing in JS (also IEEE-754 double,
  so `String(f)` matches PostgreSQL float8 shortest round-trip), the numeric lane is exact integer arithmetic
  rendered as decimal; climax = ten additions of 0.1 give `0.9999999999999999`, not `1.0`. Play/pause/step +
  reduced-motion fallback + ARIA live region. **★ window-frame stepper (M10)** (`sims/WindowFrameSim.tsx`, key
  `window-frame-stepper`): step a window frame across ordered rows; toggles **RANGE (default) ↔ ROWS** (on tied
  ORDER BY values RANGE lumps the tied peers → identical totals, ROWS counts only to the physical row — the
  most-missed window fact) and **PARTITION BY on/off** (running total resets per partition); click-any-row +
  play/pause/step + reduced-motion + ARIA. Both modules flipped **`signature: false → true`** and their
  `figure` block flipped to a `sim` block (the static `float-trap` / `window-frame` figures stay registered but
  are now unreferenced — harmless, reusable). New `.fdrift-*` + `.wf-*` CSS appended to `components.css`; both
  sims registered → **21 sims** (was 19).
  **meta.ts data-split (the §13 bundle lever — DONE):** the index chunk was heavy because the eager
  TopBar/Sidebar/Footer/search import `concepts.ts`, which transitively pulls every module's full bilingual
  content. Added `ModuleMeta` (types.ts) + **`scripts/gen-meta.ts`** → generates **`src/data/meta.generated.ts`**
  (lightweight: id/num/section/order/level/signature/title/tagline/mentalModel/readMins + topic id/title only —
  no prose bodies) + hand-written **`src/data/meta.ts`** (helpers: `sectionsMeta`, `modulesMeta`, `LEVELS`,
  `COUNTS`, `getSectionMeta`, `getModuleMeta`, `modulesBySectionMeta`). Rewired **Sidebar, TopBar, Footer,
  search.ts AND the LandscapeMap landing** to import the aliased meta instead of concepts (bodies unchanged).
  Now the ONLY static importers of concepts are `ModulePage` and `mentalModels.ts` (both lazy) → Vite emits
  concepts as a deferred shared chunk. Added `gen:meta` npm script; **check:data validates meta↔concepts parity**
  (field/topic-by-field, fails with "run `npm run gen:meta`" if stale); eslint ignores `meta.generated.ts`.
  **Workflow note for future sessions: after editing any module metadata (title/tagline/mentalModel/level/order/
  signature/topic id+title) you MUST run `npm run gen:meta` and commit `meta.generated.ts`; check:data will fail
  otherwise.**
  **Bundle result (dist-s19b):** eager **index chunk 487.83 → 21.99 KB gzip**; the concepts content is now a
  separate **`concepts-*.js` 480 KB gzip** chunk loaded only on a module view (ModulePage) or the mental-models
  gallery — **confirmed via `dist/index.html` that concepts is NOT in the first-paint script/preload set**.
  First-paint landing = index (21.99) + react-vendor (59.64) + CSS (12.57) + LandscapeMap (2.29) ≈ **96 KB
  gzip**, down from ~560 KB. GlossaryPage stays its own 47 KB gzip lazy chunk.
  **Verification (repo, linux-arm64; linux helper binaries present):** `npm run gen:meta` ✓ (36 modules, 8
  sections) · `tsc -b --noEmit` ✓ · ESLint ✓ (clean — after ignoring the generated file; the only hiccup was an
  "unused eslint-disable" warning on the generated file, fixed by adding it to eslint `ignores` and dropping the
  directive from the generator) · `check:data` ✓ (**8 sections, 36 modules [36 authored], 3819 Localized pairs**
  [−2: the two flipped figure captions removed], **21 sims + 41 figures**, 187 glossary terms, **meta nav/search
  in sync**) · `test:btree` ✓ (346) · **render+content smoke** ✓ (`scripts/_smoke-s19.tsx` — FloatDriftSim
  [double precision/numeric/add 0.1], WindowFrameSim [RANGE/ROWS/PARTITION BY region/running_total/West],
  meta-backed `search('window')`→m10 + `search('index')`>0, meta parity [36 modules, m9/m10 signature true,
  topics id+title only], and the m9/m10 figure→sim flips) · `vite build` ✓ (dist-s19 / dist-s19b).
  **§13 backlog now CLEAR of big items:** ★ FLOAT-drift stepper (M9) **done**, ★ window-frame stepper (M10)
  **done**, **meta.ts data-split done**. (Earlier: code-split done S12, 2PC stepper done S10.)
  **Sandbox gotchas (expected, §12):** linux helper binaries present → all tooling ran; built into fresh
  `dist-s19/` + `dist-s19b/` (unlink blocked; `dist-*/` gitignored). Smoke file `scripts/_smoke-s19.tsx` is
  gitignored (`scripts/_smoke-*.tsx`) — **user can `rm scripts/_smoke-s19.tsx`**. **No stale `.git/index.lock`**
  this session (avoided in-sandbox `git status`).
  **Next (S20 · buffer / polish, optional):** a **full UA QA pass**; global-search ranking / flashcards / quiz
  surfaces; mobile / a11y / perf polish; optional per-module content code-split (split the 480 KB concepts chunk
  per module so a module view loads only its own body) and the optional PDF/LinkedIn pack. **Pending user:** repo
  is live (§11) — S19 appears live once committed & **merged to `main`**; locally `npm install` (darwin-arm64) +
  `npm run verify` (runs gen:meta-independent checks; if check:data flags meta, run `npm run gen:meta`); optional
  cleanup `rm -rf dist-s19 dist-s19b scripts/_smoke-s19.tsx`.

- **2026-06-28 · S20 Buffer/polish (per-module content code-split + UA QA pass)** *(branch
  `s20-per-module-split-ua-qa`)* — Two buffer items: the final bundle lever (per-module content split) and a
  systematic Ukrainian QA pass. No module content added; all 36 modules stay authored.
  **Per-module content code-split (the last bundle lever — DONE):** after S19 the only app-side static
  importers of `concepts.ts` were ModulePage + mentalModels, so opening any module pulled the whole **480 KB
  concepts chunk**. New **`src/data/moduleContent.ts`** — a registry of 36 `id → () => import('./modules/mXX')`
  loaders (named exports for m1–m28, default for m29–m36; tsc validates each accessor). **ModulePage refactored**
  to render the header + TOC + prev/next **instantly from `meta`** and load only the current module's body via
  `loadModuleContent(id)` (useState + useEffect, with a "Loading…" placeholder); seeAlso/section/adjacency all
  read meta. **mentalModels.ts rewired to meta** (the gallery needs only metadata). Added `adjacentModulesMeta`
  to meta.ts. Result: **`concepts.ts` is no longer in the app bundle at all** (only the build-time scripts import
  it); a module view now loads **its own ~8–22 KB gz chunk** instead of 480 KB. Removed the ComingSoon import
  from ModulePage (no stubs remain).
  **UA QA pass:** added **`scripts/check-ua.ts`** (`npm run check:ua`, wired into `verify` AND the deploy CI) —
  a low-noise guard flagging only high-confidence problems: untranslated UA prose (long, no Cyrillic, ≥3 English
  stopwords, not code), EN===UA verbatim prose, and real placeholder markers (todo/fixme/tbd/xxx/lorem). SQL/code
  strings and tech labels are detected and skipped (CODE_SIGNAL + ≥2 ALL-CAPS tokens), so legitimately-identical
  tech table cells don't trip it. First run flagged 17 — **all false positives** (SQL cells, a verbatim PG error
  string, and the ordinary English word "translate"), confirming the corpus is **fully translated**; tightened the
  thresholds and dropped "translate" from the placeholder list → **0 flags**. **Objective fix applied corpus-wide:**
  the Ukrainian in-word apostrophe was inconsistent — **U+02BC ʼ (250×, the established convention), ASCII ' (63×),
  U+2019 ’ (5×), plus 26 escaped `\'`** — normalized all **94** stragglers (only apostrophes flanked by Cyrillic,
  never string delimiters or English contractions) to **U+02BC**; now uniform (318 ʼ, 0 others). **Manual review:**
  read M1 (the on-ramp) in full and fixed one genuine typo tooling can't catch — **«вручально» → «вручну»**
  (manually); a corpus grep confirmed it was isolated and found no other common-typo patterns. M35/M36 were
  authored fresh (S18) and M13 is the golden module.
  **Bundle result (dist-s20b):** **no `concepts` chunk in the app bundle**; **36 per-module content chunks**
  (~8–22 KB gz each, the biggest being m20-distributed-tx at 21.7 KB); eager index **21.86 KB gz**; first paint
  (index + react-vendor 59.64 + CSS 12.57) ≈ **94 KB gz** with **no module content loaded until you open a module**
  — confirmed via `dist/index.html`. Opening a module now costs ModulePage (~6 KB gz) + that one module's body
  (~8–22 KB gz) + its lazy sim/figure chunks, vs the old 480 KB monolith.
  **Verification (repo, linux-arm64):** `npm run gen:meta` ✓ · `tsc -b --noEmit` ✓ · ESLint ✓ (clean) ·
  `check:data` ✓ (8 sections, 36 modules [36 authored], 3819 Localized pairs, **21 sims + 41 figures**, 187
  glossary terms, meta in sync) · `check:ua` ✓ (3819 pairs scanned, **0 flagged**) · `test:btree` ✓ (346) ·
  **content-loader smoke** ✓ (`scripts/_smoke-s20.tsx` — all 36 `moduleContent` loaders resolve across the
  named/default export boundary; m13 [named] + m35 [default] + m28/m29 load with topics/sources) · `vite build` ✓.
  **§13 backlog — now fully clear:** per-module content split **done** (the last bundle item); UA QA tooling +
  apostrophe normalization + manual key-module read **done**. (Earlier: code-split S12, meta data-split + both
  steppers S19, 2PC stepper S10.)
  **Workflow note (carried from S19, still applies):** after editing module metadata run `npm run gen:meta`;
  `check:data` enforces meta↔concepts parity. **New:** `check:ua` runs in `verify` + CI — keep it green when
  adding Ukrainian content.
  **Sandbox gotchas (expected, §12):** built into fresh `dist-s20/` + `dist-s20b/` (unlink blocked; `dist-*/`
  gitignored). Smoke files `scripts/_smoke-s20.tsx` (+ the S19 one) are gitignored (`scripts/_smoke-*.tsx`) and
  **do not persist between sandbox calls** — re-`rm` not needed; **user can `rm scripts/_smoke-s20.tsx`** if it
  lingers locally. **No stale `.git/index.lock`** (avoided in-sandbox `git status`).
  **Next (S20+ · optional polish, if desired):** global-search ranking / flashcards / quiz surfaces; mobile /
  a11y / perf polish; light/print theme; optional PDF booklet + LinkedIn pack (§9 deferred deliverables). The
  guide is content-complete (36 modules), fully interactive (21 sims + 41 figures), bilingual, and now lean
  (first paint ≈ 94 KB gz). **Pending user:** repo is live (§11) — S20 appears live once committed & **merged to
  `main`**; locally `npm install` (darwin-arm64) + `npm run verify`; optional cleanup `rm -rf dist-s20 dist-s20b
  scripts/_smoke-s20.tsx`.
  **S20 follow-up (user-reported editor error):** the `scripts/` files were in **no** tsconfig `include`
  (`tsconfig.app.json` = `src`, `tsconfig.node.json` = `vite.config.ts` only), so `tsc -b` silently skipped them
  and the editor's TS server resolved them without Node types → **TS2591 `Cannot find name 'process'`** (which a
  stray `// @ts-ignore` had been masking, in turn tripping `@typescript-eslint/ban-ts-comment`). **Fix:**
  `tsconfig.node.json` now `include`s `vite.config.ts` + `scripts/**/*.ts` (excludes `scripts/_smoke-*`), and
  gained `lib: DOM/DOM.Iterable` + `jsx: react-jsx` (the QA scripts import app code — check-data → registry.tsx).
  Net effect: **`tsc -b` now type-checks the build/QA scripts too** (real safety), `process` resolves in-editor,
  and the `@ts-ignore` was removed (no suppression needed — `process.exit` is valid, as `check-data.ts` already
  shows). Re-verified green: typecheck · lint · check:data · check:ua · test:btree · build. **Note for future
  sessions: scripts are now part of the Node TS project — keep them type-clean.**
