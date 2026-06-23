# PROJECT BRIEF — the ideal commission for this guide

> **What this is.** The single *upstream* instruction that, handed to a capable agent at the start,
> lets it build the whole guide with **near-zero clarification**. It complements `CLAUDE.md`: this
> BRIEF is the **input** (what I, the commissioner, want and how I want you to work); `CLAUDE.md` is
> the **living contract** the agent maintains from it. The section structure is **reusable** for any
> future deep-dive guide (just refill §1–§6 and §11).
>
> **How to read it (agent):** treat §5 (locked decisions) and §10 (decision rights) as authoritative —
> do **not** re-ask anything answered here. If something genuinely isn't covered, see §10 for whether
> to decide or ask.

---

## 0. TL;DR — the one-paragraph commission

Build a **deep, interactive, bilingual (EN/UA) web guide to how databases actually work**, modelled on
the `../Node-js guide` quality bar — **internals-first**, taught through concrete engines, for
professionals (middle → senior → staff) with a short beginner on-ramp. Cover the **three emphases as
layers**: universal internals (the backbone) + PostgreSQL as the canonical deep-dive spine + balanced,
first-class NoSQL & modern/specialized engines. Vite + React + TS, static, GitHub Pages. Teach with
prose **plus** diagrams, tables, mental models and a handful of **curated signature simulators**
(B-Tree splits, query planning, MVCC, isolation, replication, CAP, LSM, vector search); diagram-first
everywhere else; **no in-browser WASM SQL engine**. Work **plan-first, one or two modules per session,
quality over speed**, verify every session, and close each session with a fixed summary. Decisions in
§5 are locked — don't re-ask them.

---

## 1. Goal & why

A guide that makes a professional **understand, internalize and remember** how databases work and which
one to use, when, and why — not a feature list or SQL cheat-sheet, but **internals + mental models +
hands-on interactives**. Doubles as a public portfolio piece (GitHub Pages, possibly LinkedIn).

## 2. Audience & outcomes

- **Primary:** professionals (middle → senior → staff). **Secondary:** a short beginner on-ramp
  (Section I).
- **After reading, the user can:** pick the right database family/engine for a workload; design and
  normalize a relational schema (and know when to denormalize); reason about indexes (B-Tree/B+Tree,
  LSM, specialized) and read a query plan; explain ACID, isolation levels & MVCC and their anomalies;
  reason about replication, partitioning/sharding and CAP/PACELC; use document/KV/wide-column/graph
  stores appropriately; place vector/distributed-SQL/analytics engines correctly; and operate
  databases safely and performantly. Every module is **independently useful** (skippable, jumpable).
- **Success = depth + learning UX + correctness**, in that order. Completeness and polish next. Speed last.

## 3. References & quality bar (what "golden" means)

- **Gold standard:** `../Node-js guide` — data-driven modules, hero simulators, verified facts. Match
  its depth and polish; reuse the architecture and component patterns.
- **Form references:** `../Design Principles & Patterns guide` (interactive map / landing) and
  `../Claude guide` (most recent build of the same Section→Module→Topic architecture).
- **"Golden" for one module =** clear mental model + prose that teaches (not lists) + ≥1 diagram + ≥1
  table + key points + pitfalls + (optional) interview Q&A + cross-links + **verified sources**, in
  **both languages**, typechecking and building clean.

## 4. Scope

- **In:** the whole database surface — what a DB is, the family landscape, SQL vs NoSQL trade-offs;
  relational modeling, normalization, keys/constraints, data types, advanced SQL, views/procedural/
  triggers; storage & indexing internals (pages, B-Tree/B+Tree, LSM, the index toolbox, query
  planning/EXPLAIN); transactions & concurrency (ACID/WAL, isolation & anomalies, MVCC/locking,
  distributed transactions); distribution/scale/reliability (replication, partitioning/sharding,
  CAP/PACELC/consensus, HA/backups/DR); the NoSQL families in depth (document, key-value, wide-column,
  graph); modern/specialized engines (vector/AI, distributed-SQL/NewSQL, analytics/columnar/
  time-series, cloud-native/the modern DBA); security; performance engineering; choosing the right
  database; mental-models gallery + glossary.
- **Curriculum source:** `_examples/info.txt` (3 video chapter-lists: beginner SQL/PostgreSQL ·
  relational-design+indexing · internals/SQLite-from-scratch + cloud-PostgreSQL/HA) is the **seed** —
  cover it, but **don't limit to it**; go well beyond into modern engines and staff-level internals.
  Detailed map lives in `CURRICULUM.md`. *(A `list of concepts.txt` was referenced but is not yet in
  the folder; `CURRICULUM.md` is authoritative until/unless it's added.)*
- **Weighting:** internals-first; PostgreSQL is the canonical worked example; NoSQL & modern engines
  get their own first-class sections (the "all three emphases" decision).
- **Out (for now):** in-browser WASM SQL engine (PGlite/sql.js); per-concept PDF booklet; LinkedIn
  asset pack — **deferred/optional**, not in the core build.

## 5. Locked decisions — DO NOT re-ask

| Topic | Decision |
|---|---|
| **Stack** | Vite + React 19 + TypeScript (strict). No router lib (hash router). All content static. |
| **Content model** | Single source of truth `src/data/concepts.ts`; pages render from data. `Section → Module → Topic → Block`. |
| **Language** | Bilingual **EN/UA** with a runtime toggle. **All technical terms stay English** in both; translate only explanation/analogy. Author EN first, UA second. |
| **Emphasis** | **All three as layers:** universal internals (backbone) + PostgreSQL deep-dive spine + balanced SQL/NoSQL families. Internals taught once, instantiated across engines. |
| **Modern engines** | **Full dedicated section** (Section VII): vector/AI, distributed-SQL/NewSQL, analytics/columnar/time-series, cloud-native. |
| **Theme** | **Dark editorial + DB-family palette** — deep slate/ink base, PostgreSQL-derived blue primary, cream-cool text; each engine keeps its brand color in diagrams. Fonts **Fraunces** (display) · Inter · JetBrains Mono. |
| **Interactivity** | **Curated simulations only** (no WASM/real SQL engine). ~6–8 signature sims + diagram-first baseline. Each sim has a reduced-motion step fallback. |
| **Signature sims** | B-Tree/B+Tree visualizer (M13, golden) · Query Planner/EXPLAIN (M16) · Isolation anomalies (M18) · MVCC (M19) · Replication & failover (M21) · CAP/consistency (M23) · LSM-tree (M15) · Vector/ANN (M29). Plus Landscape Map (landing) + Database Picker (M35). |
| **Deploy** | GitHub Pages via Actions. Repo `database-comprehensive-guide` @ `endorrfin` → `https://endorrfin.github.io/database-comprehensive-guide/`. `vite base:'./'` + `.nojekyll`. |
| **Golden module** | M13 Indexing & the B-Tree + the B-Tree/B+Tree visualizer (built first in S1). |
| **Tooling** | Node 22 LTS; TS strict + `noUnusedLocals/Parameters`; build must pass. |

## 6. Constraints & non-negotiables

- **Correctness mandate.** The database landscape drifts (versions, licensing, the modern/vector/
  distributed wave) and the build model's cutoff is older than the live date. **Web-search and verify
  every version-sensitive fact** (versions, licensing, availability, benchmarks, dates) per module;
  fill `sources`; never trust memory. Challenge the curriculum when verification contradicts it.
- **Content only in `src/data/*`** — never hand-edit rendered output.
- **Accessibility:** keyboard nav, focus rings, ARIA on sims, `prefers-reduced-motion` fallback,
  contrast-checked palette.
- **Bilingual integrity:** every human-readable string is `Localized {en;uk}`; no missing language.
- **Security framing** throughout (least privilege, untrusted input, SQL injection, encryption,
  data boundaries).
- **Sandbox gotchas:** Linux sandbox blocks `unlink` (don't run git against the live repo from it;
  build/verify in a scratch copy; user runs `npm install` locally for darwin-arm64 binaries). Exclude
  `_examples/` from git/deploy.

## 7. Deliverables

- **The web guide** (primary). **`README.md`** (overview + live link + commands).
- **`CLAUDE.md`** kept current (source of truth + status log). **`CURRICULUM.md`** kept current.
- Deferred/optional: PDF booklet, LinkedIn pack.

## 8. Working agreement (how I want you to work)

- **Plan → approve → build.** Big steps get a plan I sign off on before implementation.
- **Cadence:** 1–2 modules per session, **golden quality**; speed is not a priority.
- **Verify every session:** `tsc --noEmit` clean + `vite build` OK + a data-integrity check + fact
  spot-check. High-stakes facts double-checked.
- **The 8 working rules:** (1) specific solutions, not generic; (2) brief "why", not lectures;
  (3) describe change + why **before** doing it; (4) mark in-code edits `// CHANGED:`; (5) lint-aware;
  (6) reliability/security/best-practice first; (7) ask when unclear; (8) don't just agree — challenge
  wrong/partial reasoning with questions.
- **Branch/commit:** branch `sN-short-topic`; concise imperative commit messages.
- **Session summary (every session):** (1) what was done; (2) branch + commit + short description;
  (3) challenges/questions.

## 9. Definition of Done

- **Per module:** all topics authored EN+UA; mental model, key points, pitfalls, see-also, sources;
  any planned diagrams/tables/sim present; typecheck + build clean; facts verified & cited.
- **Per session:** the above for the session's modules + verification run + summary delivered +
  `CLAUDE.md` status log updated.
- **Project:** all ~36 modules authored; the signature sims + landscape map + database picker; global
  search, glossary, mental-models gallery; bilingual QA; deployed and live.

## 10. Decision rights (so you don't stall on small things)

- **Decide yourself:** component structure & naming; micro-UX & copy wording; which diagram type;
  colors *within* the locked palette; ordering of blocks within a module; how to phrase a mental model;
  test/verification details.
- **Ask me first:** changing scope (adding/dropping modules); changing stack, theme, or language
  policy; anything that changes the published URL or breaks the data contract; spending real money or
  taking destructive/irreversible actions; product facts that web search can't resolve.

## 11. Clarifying questions — the checklist (with this project's answers)

> Reusable question set. Answers below are this project's; for a new guide, re-answer §11 + refill §1–§6.

- **Who's the reader / what should they do after?** → professionals (middle→senior→staff); outcomes in §2.
- **Personal / public / portfolio?** → mastery + public (Pages, maybe LinkedIn).
- **Success metric?** → depth > learning-UX > correctness > completeness > polish > speed.
- **Topic boundaries; in/out?** → §4.
- **Curriculum source; seed vs cover-all?** → `info.txt` seed; go beyond; `CURRICULUM.md` is the map.
- **Weighting?** → internals-first; Postgres spine; NoSQL & modern first-class (all three emphases).
- **Depth per concept?** → deep-dive (mental model + interactive/diagram + verified facts).
- **Fact freshness?** → web-verify version-sensitive facts per module.
- **Format?** → static web app on GitHub Pages.
- **Interactivity ambition?** → curated signature sims + diagram-first; no WASM SQL engine (§5).
- **Language(s) + rules?** → bilingual EN/UA; terms stay English (§5).
- **Theme/brand?** → dark editorial + DB-family palette + Fraunces (§5).
- **A11y/perf?** → §6.
- **Stack? Hosting? Repo?** → §5.
- **Reuse patterns?** → yes — mirror the Node/Claude guide architecture and components.
- **Cadence; speed vs quality?** → 1–2 modules/session; quality first.
- **Plan-first vs iterative?** → plan → approve → build.
- **Verification / DoD?** → §8, §9.
- **Conventions; where content is edited?** → `src/data/*` only; §8.
- **Decision rights?** → §10.
- **Session report format?** → §8 (3-part summary).
- **Hard constraints / environment?** → §6 (sandbox, Node 22, exclude `_examples`).
- **Quality exemplar?** → the Node guide (§3).

## 12. How to start a session (bootstrap ritual)

1. Read `CLAUDE.md` fully, then the relevant `CURRICULUM.md` section(s), then the existing
   `src/components/*` + `src/data/concepts.ts` patterns.
2. Confirm the session's target modules (from the roadmap) and restate the plan briefly.
3. Build to the golden bar; **web-verify** every version-sensitive fact and fill `sources`.
4. Verify: `tsc` + `vite build` + data-integrity check (in a scratch copy; don't touch the live `.git`).
5. Update the `CLAUDE.md` status log and deliver the 3-part session summary.
