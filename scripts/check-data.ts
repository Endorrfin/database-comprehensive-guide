/*
 * Data-integrity check (run via `npm run check:data`, also in CI before build).
 * Validates the single source of truth: bilingual completeness, unique ids,
 * valid cross-links, and that every figure/sim key resolves in the registry.
 */
import { modules, sections, getModule, getSection } from '../src/data/concepts';
import { figures, sims } from '../src/lib/registry';
import { glossary } from '../src/data/glossary';
import { glossaryTermIndex } from '../src/data/glossaryTerms.generated'; // S21: term-only search index
import { mentalModelCards } from '../src/data/mentalModels';
import { modulesMeta, sectionsMeta } from '../src/data/meta';
import type { Block, Localized } from '../src/data/types';

const errors: string[] = [];
let localizedChecked = 0;

function isLocalized(v: unknown): v is Localized {
  return typeof v === 'object' && v !== null && 'en' in v && 'uk' in v;
}

function checkLoc(v: Localized, path: string): void {
  localizedChecked++;
  if (typeof v.en !== 'string' || v.en.trim() === '') errors.push(`${path}: empty EN`);
  if (typeof v.uk !== 'string' || v.uk.trim() === '') errors.push(`${path}: empty UA`);
}

function checkBlock(b: Block, path: string): void {
  switch (b.kind) {
    case 'prose':
      checkLoc(b.md, `${path}.md`);
      break;
    case 'figure':
      if (!figures[b.fig]) errors.push(`${path}: figure '${b.fig}' not in registry`);
      if (b.caption) checkLoc(b.caption, `${path}.caption`);
      break;
    case 'sim':
      if (!sims[b.sim]) errors.push(`${path}: sim '${b.sim}' not in registry`);
      break;
    case 'table':
      b.head.forEach((h, i) => checkLoc(h, `${path}.head[${i}]`));
      b.rows.forEach((row, r) => row.forEach((c, ci) => checkLoc(c, `${path}.rows[${r}][${ci}]`)));
      if (b.caption) checkLoc(b.caption, `${path}.caption`);
      break;
    case 'code':
      if (!b.code.trim()) errors.push(`${path}: empty code`);
      if (b.note) checkLoc(b.note, `${path}.note`);
      break;
    case 'callout':
      checkLoc(b.title, `${path}.title`);
      checkLoc(b.md, `${path}.md`);
      break;
    case 'compare':
      checkLoc(b.a, `${path}.a`);
      checkLoc(b.b, `${path}.b`);
      b.rows.forEach((row, r) => row.forEach((c, ci) => checkLoc(c, `${path}.rows[${r}][${ci}]`)));
      break;
    default:
      errors.push(`${path}: unknown block kind`);
  }
}

// Sections
const sectionIds = new Set<string>();
for (const s of sections) {
  if (sectionIds.has(s.id)) errors.push(`Duplicate section id: ${s.id}`);
  sectionIds.add(s.id);
  checkLoc(s.name, `section ${s.id}.name`);
  checkLoc(s.blurb, `section ${s.id}.blurb`);
  if (!isLocalized(s.name)) errors.push(`section ${s.id}.name not Localized`);
}
if (sections.length !== 8) errors.push(`Expected 8 sections, found ${sections.length}`);

// Modules
const moduleIds = new Set<string>();
const nums = new Set<number>();
const orderBySection = new Map<string, Set<number>>();
for (const m of modules) {
  if (moduleIds.has(m.id)) errors.push(`Duplicate module id: ${m.id}`);
  moduleIds.add(m.id);
  if (nums.has(m.num)) errors.push(`Duplicate module num: ${m.num} (${m.id})`);
  nums.add(m.num);
  if (!getSection(m.section)) errors.push(`${m.id}: section '${m.section}' does not exist`);

  const set = orderBySection.get(m.section) ?? new Set<number>();
  if (set.has(m.order)) errors.push(`${m.id}: duplicate order ${m.order} in ${m.section}`);
  set.add(m.order);
  orderBySection.set(m.section, set);

  checkLoc(m.title, `${m.id}.title`);
  checkLoc(m.tagline, `${m.id}.tagline`);
  checkLoc(m.mentalModel, `${m.id}.mentalModel`);
  m.topics.forEach((tp) => {
    checkLoc(tp.title, `${m.id}/${tp.id}.title`);
    tp.blocks.forEach((b, bi) => checkBlock(b, `${m.id}/${tp.id}.block[${bi}]`));
  });
  m.keyPoints.forEach((kp, i) => checkLoc(kp, `${m.id}.keyPoints[${i}]`));
  m.pitfalls.forEach((p, i) => {
    checkLoc(p.title, `${m.id}.pitfalls[${i}].title`);
    checkLoc(p.body, `${m.id}.pitfalls[${i}].body`);
  });
  m.interview?.forEach((qa, i) => {
    checkLoc(qa.q, `${m.id}.interview[${i}].q`);
    checkLoc(qa.a, `${m.id}.interview[${i}].a`);
  });
  m.seeAlso.forEach((id) => {
    if (!getModule(id)) errors.push(`${m.id}: seeAlso '${id}' does not exist`);
  });
  m.sources.forEach((src, i) => {
    if (!src.title.trim()) errors.push(`${m.id}.sources[${i}]: empty title`);
    if (!/^https?:\/\//.test(src.url)) errors.push(`${m.id}.sources[${i}]: bad url '${src.url}'`);
  });
}
if (modules.length !== 36) errors.push(`Expected 36 modules, found ${modules.length}`);
for (let n = 1; n <= 36; n++) if (!nums.has(n)) errors.push(`Missing module num ${n}`);

// Meta parity (S19 data-split): meta.generated.ts must mirror concepts.ts light fields exactly.
// The eager nav/search read meta; if it drifts the UI silently goes stale, so fail the build.
if (modulesMeta.length !== modules.length)
  errors.push(`meta: ${modulesMeta.length} modules vs concepts ${modules.length} — run \`npm run gen:meta\``);
if (sectionsMeta.length !== sections.length)
  errors.push('meta: sections length mismatch — run `npm run gen:meta`');
const metaById = new Map(modulesMeta.map((mm) => [mm.id, mm]));
for (const m of modules) {
  const mm = metaById.get(m.id);
  if (!mm) {
    errors.push(`meta: missing '${m.id}' — run \`npm run gen:meta\``);
    continue;
  }
  const fieldsOk =
    mm.num === m.num &&
    mm.section === m.section &&
    mm.order === m.order &&
    mm.level === m.level &&
    mm.signature === !!m.signature &&
    mm.readMins === m.readMins &&
    mm.title.en === m.title.en &&
    mm.title.uk === m.title.uk &&
    mm.tagline.en === m.tagline.en &&
    mm.tagline.uk === m.tagline.uk &&
    mm.mentalModel.en === m.mentalModel.en &&
    mm.mentalModel.uk === m.mentalModel.uk;
  if (!fieldsOk) errors.push(`meta: stale fields for '${m.id}' — run \`npm run gen:meta\``);
  if (mm.topics.length !== m.topics.length) {
    errors.push(`meta: stale topic count for '${m.id}' — run \`npm run gen:meta\``);
  } else {
    m.topics.forEach((tp, ti) => {
      if (
        mm.topics[ti].id !== tp.id ||
        mm.topics[ti].title.en !== tp.title.en ||
        mm.topics[ti].title.uk !== tp.title.uk
      )
        errors.push(`meta: stale topic '${tp.id}' in '${m.id}' — run \`npm run gen:meta\``);
    });
  }
}

// Glossary + mental models
glossary.forEach((g) => {
  if (!g.term.trim()) errors.push('glossary: empty term');
  checkLoc(g.def, `glossary ${g.term}.def`);
});

// Glossary term-index parity (S21 search-ranking): glossaryTerms.generated.ts must mirror the
// glossary terms exactly, or the eager search silently misses/duplicates terms — fail the build.
if (glossaryTermIndex.length !== glossary.length) {
  errors.push(
    `glossary index: ${glossaryTermIndex.length} terms vs glossary ${glossary.length} — run \`npm run gen:meta\``,
  );
} else {
  glossary.forEach((g, i) => {
    if (glossaryTermIndex[i] !== g.term)
      errors.push(`glossary index: stale term at ${i} ('${glossaryTermIndex[i]}' ≠ '${g.term}') — run \`npm run gen:meta\``);
  });
}
mentalModelCards.forEach((c) => {
  if (!getModule(c.moduleId)) errors.push(`mentalModel card '${c.moduleId}' has no module`);
  checkLoc(c.line, `mentalModel ${c.moduleId}.line`);
});

// Report
const authored = modules.filter((m) => m.topics.length > 0);
console.log('— Data integrity —');
console.log(`  sections:        ${sections.length}`);
console.log(`  modules:         ${modules.length} (authored: ${authored.length}, stubs: ${modules.length - authored.length})`);
console.log(`  Localized pairs: ${localizedChecked} checked (EN + UA)`);
console.log(`  registry:        ${Object.keys(sims).length} sim(s), ${Object.keys(figures).length} figure(s)`);
console.log(`  glossary terms:  ${glossary.length}`);
console.log(`  meta nav/search: ${modulesMeta.length} modules, ${sectionsMeta.length} sections (data-split, in sync)`);

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} data error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\n✓ All data-integrity checks passed.');
