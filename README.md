# Databases — The Comprehensive Guide

A deep, interactive, **bilingual (EN / UA)** guide to *how databases actually work* — relational
and NoSQL internals, indexing, transactions, distribution, and the modern vector & distributed-SQL
wave, taught with prose **plus** diagrams, tables, mental models and hero simulators.

> **Internals-first**, taught through concrete engines. PostgreSQL is the canonical worked example;
> NoSQL and modern engines get first-class coverage. Every module is independently useful — skip,
> jump, or dive straight into the internals.

**Live:** https://endorrfin.github.io/database-comprehensive-guide/
**Author:** Vasyl Krupka · Senior Fullstack Engineer · 🇺🇦

---

## What's here

- **8 sections · 36 modules** — from a beginner on-ramp to staff-level internals.
- **★ Signature interactives** (curated, hand-built — no in-browser SQL engine). The first is the
  **B-Tree / B+Tree visualizer** (M13): insert/search keys, watch nodes fill and **split**, toggle
  B-Tree ↔ B+Tree, and run a **range scan** over the linked leaves.
- **Bilingual** at the data layer — every string is `{ en, uk }`; technical terms stay English in
  both languages. Toggle in the top bar.
- **Landscape Map** landing, collapsible sidebar, global search, a level filter
  (beginner → staff), a mental-models gallery, and a bilingual glossary.

## Tech

Vite + React 19 + TypeScript (strict). No router library — a tiny hash router (`#/m/<module>/<topic>`)
plus `vite base:'./'` makes the build work under any GitHub Pages sub-path. All content is static
data in `src/data`; pages are **rendered from data**, never hand-written.

## Local development

```bash
npm install        # darwin-arm64 / your platform
npm run dev        # start Vite dev server
npm run build      # tsc -b && vite build  → dist/
npm run preview    # preview the production build
```

Quality gates (also enforced in CI before every deploy):

```bash
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint
npm run check:data # bilingual completeness, unique ids, registry + cross-link integrity
npm run verify     # all of the above + build
```

## Project layout

```
src/
  data/        concepts.ts (SSOT) · modules/ · glossary · mentalModels · types
  i18n/        ui strings + EN/UA language provider
  theme/       tokens.css (DB-family palette) · global.css · components.css
  lib/         hashRouter · search · registry (sims + figures) · appState · utils
  components/  layout/ · module/ · map/ · sims/ · figures/ · pages/
scripts/       check-data.ts (data-integrity)
```

## Adding content

Edit **only** `src/data/*`. Add a module to `src/data/concepts.ts` (or its own file under
`src/data/modules/`), reference figures/sims by key, and register new widgets in
`src/lib/registry.tsx`. Author EN first, UA second. Run `npm run check:data` to validate.

## Status

Built session by session (see `CLAUDE.md` §13–§14). **S1** delivered the scaffold, theme, navigation,
EN/UA i18n, the Landscape-Map landing, the full 36-module skeleton, and the golden module **M13** with
its B-Tree/B+Tree visualizer. Subsequent sessions author the remaining modules and signature sims.
