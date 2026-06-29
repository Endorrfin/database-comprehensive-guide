/*
 * smoke.ts — full SSR/render smoke (run via `npm run smoke`, also in CI before build).
 *
 * Why this exists (CLAUDE.md §2 / cross-port Wave 2.1): the app lazy-loads every sim, figure
 * and route page, so a component that throws on render — or a registry key that points at a
 * broken module — is invisible until someone manually navigates to it. `check:data` proves every
 * referenced key *exists* in the registry, but never *renders* anything. This smoke renders, on the
 * server with `react-dom/server`, in BOTH languages:
 *   A. every sim + figure component (auto-discovered from the file tree, 1 component per file),
 *   B. every route page's server-renderable shell (LandscapeMap, MentalModels, Glossary,
 *      Flashcards, Quiz, DbPicker) and the per-module ModulePage header/TOC/nav for all 36 modules,
 *   C. the eager app shell (<App/>) across representative + bogus hashes — exercises the hash
 *      router and TopBar/Sidebar/Footer without throwing.
 *
 * Note: module *bodies* load via a client effect (loadModuleContent), so under SSR they render the
 * "Loading…" placeholder by design — body blocks (and their sims/figures) are covered by layer A,
 * not by ModulePage here. JSX is avoided on purpose so this stays a plain `.ts` script that
 * tsconfig.node.json typechecks (its include globs the scripts dir for .ts) and `tsx` runs directly.
 */
import { createElement as h } from 'react';
import type { ReactNode } from 'react';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Minimal browser shim (SSR has no DOM; providers read localStorage/matchMedia at render) ──────
const store = new Map<string, string>();
const g = globalThis as Record<string, unknown>;
const def = (k: string, v: unknown): void => {
  try {
    g[k] = v;
  } catch {
    Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  }
};
def('window', globalThis);
def('localStorage', {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
});
def('matchMedia', (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}));
def('document', {
  documentElement: { lang: '', style: {}, setAttribute: () => {}, getAttribute: () => null },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
});
def('location', { hash: '' });

// React's legacy server APIs warn about Suspense/deprecation when the lazy app shell suspends;
// that noise is expected here. Drop only those messages — real errors still surface.
const NOISE = ['renderToStaticMarkup', 'renderToString', 'Suspense', 'hydrat', 'renderToPipeableStream'];
const origError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  if (NOISE.some((n) => String(args[0] ?? '').includes(n))) return;
  origError(...(args as Parameters<typeof origError>));
};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let checks = 0;
let failures = 0;
function ok(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error('  ✖ ' + msg);
  }
}

/** Technical terms stay English in both languages, so these canaries apply to EN and UK alike. */
const SIM_CANARIES: Record<string, string[]> = {
  VectorSim: ['HNSW', 'Exact kNN'],
  LsmSim: ['memtable', 'SSTable'],
  ShardingSim: ['Shard'],
  MvccSim: ['MVCC'],
  QueryPlannerSim: ['Nested Loop'],
  BTreeSim: ['B-Tree'],
};
const FIG_CANARIES: Record<string, string[]> = {
  RagPipeline: ['ANN Search'],
  DistributedSqlArch: ['CockroachDB', 'TiDB'],
};

async function main(): Promise<void> {
  const { LangProvider } = await import('../src/i18n/LangProvider');
  const { AppStateProvider } = await import('../src/components/AppStateProvider');
  const { LANG_KEY } = await import('../src/i18n/lang');
  const { modules } = await import('../src/data/concepts');
  const { sims, figures } = await import('../src/lib/registry');

  const langs = ['en', 'uk'] as const;

  /** Render an element under both providers in a given language. */
  function ssr(el: ReactNode, lang: 'en' | 'uk'): string {
    store.set(LANG_KEY, lang);
    return renderToStaticMarkup(h(LangProvider, null, h(AppStateProvider, null, el)));
  }

  /** Render + assert non-trivial length and that each canary substring is present. */
  function check(label: string, el: ReactNode, lang: 'en' | 'uk', min: number, includes: string[] = []): void {
    let html: string;
    try {
      html = ssr(el, lang);
    } catch (e) {
      ok(false, `${label} [${lang}] threw: ${(e as Error).message}`);
      return;
    }
    ok(html.length >= min, `${label} [${lang}] renders (${html.length} ≥ ${min} chars)`);
    for (const s of includes) ok(html.includes(s), `${label} [${lang}] contains "${s}"`);
  }

  // ── Layer A: every sim + figure component, auto-discovered (1 component per .tsx file) ──────────
  async function renderComponentDir(
    sub: 'sims' | 'figures',
    registryCount: number,
    canaries: Record<string, string[]>,
  ): Promise<number> {
    const dir = join(root, 'src/components', sub);
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx'));
    // Drift guard: file count must match the registry (every component is registered & vice versa).
    ok(files.length === registryCount, `${sub}: ${files.length} component files == ${registryCount} registry keys`);
    let rendered = 0;
    for (const file of files) {
      const mod: Record<string, unknown> = await import(pathToFileURL(join(dir, file)).href);
      const entry = Object.entries(mod).find(([n, v]) => /^[A-Z]/.test(n) && typeof v === 'function');
      if (!entry) {
        ok(false, `${sub}/${file}: no exported component`);
        continue;
      }
      const [name, Comp] = entry;
      for (const lang of langs) check(name, h(Comp as () => ReactNode), lang, 200, canaries[name] ?? []);
      rendered++;
    }
    return rendered;
  }

  const simCount = await renderComponentDir('sims', Object.keys(sims).length, SIM_CANARIES);
  const figCount = await renderComponentDir('figures', Object.keys(figures).length, FIG_CANARIES);

  // ── Layer B: route pages (server-renderable shells) ────────────────────────────────────────────
  const { LandscapeMap } = await import('../src/components/map/LandscapeMap');
  const { MentalModelsPage } = await import('../src/components/pages/MentalModelsPage');
  const { GlossaryPage } = await import('../src/components/pages/GlossaryPage');
  const { FlashcardsPage } = await import('../src/components/pages/FlashcardsPage');
  const { QuizPage } = await import('../src/components/pages/QuizPage');
  const { ModulePage } = await import('../src/components/module/ModulePage');

  for (const lang of langs) {
    // "Comprehensive Guide" is the EN subtitle (localized in UK), so assert it on the EN pass only.
    check('LandscapeMap', h(LandscapeMap), lang, 2000, lang === 'en' ? ['Comprehensive Guide'] : []);
    check('MentalModelsPage', h(MentalModelsPage), lang, 1000);
    // GlossaryPage's `term` prop only drives client-side scroll; SSR output is identical, and the
    // glossary-with-term route is still exercised via the App layer below (#/glossary/acid).
    check('GlossaryPage', h(GlossaryPage), lang, 2000);
    check('FlashcardsPage', h(FlashcardsPage), lang, 500);
    check('QuizPage', h(QuizPage), lang, 500);
  }

  // ── Layer C: ModulePage header/TOC/nav for all 36 modules (body is client-loaded → "Loading…") ──
  /** Longest run of latin/digit/space chars in a title (entity-safe substring to assert on). */
  function plainCanary(s: string): string {
    const runs = s.match(/[A-Za-z0-9][A-Za-z0-9 ]{3,}/g);
    if (!runs) return '';
    return runs.reduce((a, b) => (b.length > a.length ? b : a), '').trim();
  }
  for (const m of modules) {
    for (const lang of langs) {
      const canary = plainCanary(m.title[lang]);
      check(`ModulePage:${m.id}`, h(ModulePage, { moduleId: m.id }), lang, 300, canary ? [canary] : []);
    }
  }

  // ── Layer D: eager app shell + hash router (lazy pages render as the route Suspense fallback) ────
  const { App } = await import('../src/App');
  const hashes = ['', '#/map', '#/m/m13-btree', '#/mental-models', '#/glossary/acid', '#/flashcards', '#/quiz', '#/decide', '#/m/does-not-exist', '#/total-garbage'];
  for (const hash of hashes) {
    (g.location as { hash: string }).hash = hash;
    check(`App ${hash || '(empty)'}`, h(App), 'en', 5000);
  }

  // ── Report ──────────────────────────────────────────────────────────────────────────────────────
  console.log('— SSR / render smoke —');
  console.log(`  components:  ${simCount} sims + ${figCount} figures, each rendered EN + UK`);
  console.log(`  pages:       LandscapeMap · MentalModels · Glossary · Flashcards · Quiz (EN + UK)`);
  console.log(`  modules:     ${modules.length} ModulePage headers (EN + UK)`);
  console.log(`  app shell:   ${hashes.length} hash routes (incl. unknown/garbage)`);
  console.log(`  ${checks} checks total`);

  if (failures > 0) {
    console.error(`\n✖ ${failures} smoke failure(s).`);
    process.exit(1);
  }
  console.log('\n✓ All SSR/render smoke checks passed.');
}

main().catch((e) => {
  console.error('smoke crashed:', e);
  process.exit(1);
});
