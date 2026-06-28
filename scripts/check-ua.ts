/*
 * check-ua.ts — Ukrainian translation QA (run via `npm run check:ua`, also in `verify`).
 * Flags HIGH-CONFIDENCE problems only, so it stays useful as a regression guard rather than noise:
 *   • untranslated-uk : a substantial UA string with no Cyrillic and ≥3 English stopwords → English left in place
 *   • identical       : EN === UA for multi-word prose that contains an English stopword → copy-paste, not translated
 *   • placeholder     : TODO / FIXME / TBD / XXX / lorem left in either language
 * Tech-only strings (e.g. "PostgreSQL · MySQL", "B-Tree O(log n)") are intentionally identical/Latin
 * and carry no English stopwords, so they are NOT flagged. Technical terms staying English inside an
 * otherwise-Ukrainian sentence is correct (CLAUDE.md §8) and never trips these checks.
 */
import { modules } from '../src/data/concepts';
import { glossary } from '../src/data/glossary';
import { ui } from '../src/i18n/ui';
import type { Block, Localized } from '../src/data/types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'be',
  'that', 'this', 'it', 'as', 'by', 'from', 'at', 'not', 'you', 'your', 'can', 'when', 'which',
  'what', 'how', 'into', 'than', 'then', 'they', 'their', 'its', 'use', 'using', 'we', 'do', 'does',
]);
const CYRILLIC = /[Ѐ-ӿ]/;
// Only genuine leftover markers — NOT ordinary English words like "translate" (which appears in
// legitimate prose, e.g. "how to translate a write into base-table changes").
const PLACEHOLDER = /\b(todo|fixme|tbd|xxx|lorem|ipsum)\b/i;
// SQL / code / config strings are legitimately identical across languages and full of stopwords
// ("EXCLUDE USING gist (...)", "x IS NOT DISTINCT FROM NULL", "synchronous_commit = on"). Detect
// and skip them so the guard flags natural-language misses only, not tech table cells.
const CODE_SIGNAL = /[(){}=;|]|::|->|&&/;
function looksLikeCode(s: string): boolean {
  if (CODE_SIGNAL.test(s)) return true;
  return (s.match(/\b[A-Z][A-Z_]{1,}\b/g) ?? []).length >= 2; // ≥2 ALL-CAPS tokens (SQL keywords)
}

type Issue = { path: string; kind: string; detail: string };
const issues: Issue[] = [];
let pairs = 0;

const enWords = (s: string): string[] => s.toLowerCase().match(/[a-z']+/g) ?? [];
const stopwordCount = (s: string): number => enWords(s).filter((w) => STOPWORDS.has(w)).length;

function check(v: Localized, path: string): void {
  pairs++;
  const en = (v.en ?? '').trim();
  const uk = (v.uk ?? '').trim();

  if (PLACEHOLDER.test(uk) || PLACEHOLDER.test(en))
    issues.push({ path, kind: 'placeholder', detail: (uk || en).slice(0, 70) });

  // EN copied verbatim into UA: substantial natural-language prose, not a tech/SQL label.
  if (en && en === uk && en.length > 40 && /[a-z]/.test(en) && stopwordCount(en) >= 2 && !looksLikeCode(en))
    issues.push({ path, kind: 'identical', detail: en.slice(0, 70) });

  // UA string that is actually English: long, no Cyrillic at all, several English stopwords, not code.
  if (uk.length > 40 && !CYRILLIC.test(uk) && stopwordCount(uk) >= 3 && !looksLikeCode(uk))
    issues.push({ path, kind: 'untranslated-uk', detail: uk.slice(0, 70) });
}

function walkBlock(b: Block, path: string): void {
  switch (b.kind) {
    case 'prose':
      check(b.md, `${path}.md`);
      break;
    case 'figure':
      if (b.caption) check(b.caption, `${path}.caption`);
      break;
    case 'table':
      b.head.forEach((h, i) => check(h, `${path}.head[${i}]`));
      b.rows.forEach((r, ri) => r.forEach((c, ci) => check(c, `${path}.rows[${ri}][${ci}]`)));
      if (b.caption) check(b.caption, `${path}.caption`);
      break;
    case 'code':
      if (b.note) check(b.note, `${path}.note`);
      break;
    case 'callout':
      check(b.title, `${path}.title`);
      check(b.md, `${path}.md`);
      break;
    case 'compare':
      check(b.a, `${path}.a`);
      check(b.b, `${path}.b`);
      b.rows.forEach((r, ri) => r.forEach((c, ci) => check(c, `${path}.rows[${ri}][${ci}]`)));
      break;
    case 'sim':
      break;
  }
}

for (const m of modules) {
  check(m.title, `${m.id}.title`);
  check(m.tagline, `${m.id}.tagline`);
  check(m.mentalModel, `${m.id}.mentalModel`);
  m.topics.forEach((tp) => {
    check(tp.title, `${m.id}/${tp.id}.title`);
    tp.blocks.forEach((b, bi) => walkBlock(b, `${m.id}/${tp.id}[${bi}]`));
  });
  m.keyPoints.forEach((k, i) => check(k, `${m.id}.keyPoints[${i}]`));
  m.pitfalls.forEach((p, i) => {
    check(p.title, `${m.id}.pitfalls[${i}].title`);
    check(p.body, `${m.id}.pitfalls[${i}].body`);
  });
  m.interview?.forEach((qa, i) => {
    check(qa.q, `${m.id}.interview[${i}].q`);
    check(qa.a, `${m.id}.interview[${i}].a`);
  });
}
glossary.forEach((g) => check(g.def, `glossary:${g.term}`));
for (const [k, v] of Object.entries(ui)) check(v as Localized, `ui:${k}`);

// Report
console.log('— Ukrainian QA —');
console.log(`  Localized pairs scanned: ${pairs}`);
const byKind: Record<string, number> = {};
for (const i of issues) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1;
const summary = Object.entries(byKind).map(([k, n]) => `${k}: ${n}`).join(', ');
console.log(`  flagged: ${issues.length}${issues.length ? ` (${summary})` : ''}`);

if (issues.length > 0) {
  console.error('\n✖ UA QA issues:');
  for (const i of issues.slice(0, 60)) console.error(`  [${i.kind}] ${i.path}\n      ${i.detail}`);
  if (issues.length > 60) console.error(`  …and ${issues.length - 60} more`);
  process.exit(1);
}
console.log('\n✓ No high-confidence Ukrainian translation issues.');
