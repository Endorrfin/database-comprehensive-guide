/*
 * types.ts — the content contract (CLAUDE.md §4).
 * Every module is DATA; renderers turn it into a page. Bilingual via `Localized`.
 * Technical terms stay English in both languages; only explanation/analogy is translated.
 * This is the leaf module (no imports) so i18n and data can both depend on it.
 */

export type Lang = 'en' | 'uk';

/** A bilingual string. Both languages are always present (data-integrity enforced). */
export type Localized = { en: string; uk: string };

export type Level = 'beginner' | 'middle' | 'senior' | 'staff';

/** One of the 8 top-level blocks (I … VIII). */
export type Section = {
  id: string;
  roman: string; // "I" … "VIII"
  name: Localized;
  accent: string; // CSS color (var or hex) — the section colour
  blurb: Localized;
};

export type Module = {
  id: string; // e.g. "m13-btree"
  num: number; // 1..36 — display number
  section: string; // Section.id
  order: number; // order within the section
  level: Level;
  signature?: boolean; // has a ★ signature interactive
  title: Localized;
  tagline: Localized;
  readMins: number;
  mentalModel: Localized; // the one line/picture to recall from memory
  topics: Topic[]; // ordered, deep-linkable sub-units (3–6 typical)
  keyPoints: Localized[]; // takeaways ("draw from memory")
  pitfalls: { title: Localized; body: Localized }[];
  interview?: { q: Localized; a: Localized; level?: Level }[];
  seeAlso: string[]; // related module ids (cross-links)
  sources: { title: string; url: string }[]; // verification + on-page citations (English)
};

export type Topic = { id: string; title: Localized; blocks: Block[] };

export type Block =
  | { kind: 'prose'; md: Localized }
  | { kind: 'figure'; fig: string; caption?: Localized }
  | { kind: 'sim'; sim: string }
  | { kind: 'table'; head: Localized[]; rows: Localized[][]; caption?: Localized }
  | { kind: 'code'; lang: string; code: string; note?: Localized }
  | {
      kind: 'callout';
      tone: 'tip' | 'warn' | 'senior' | 'security';
      title: Localized;
      md: Localized;
    }
  | { kind: 'compare'; a: Localized; b: Localized; rows: [Localized, Localized, Localized][] };

/**
 * Lightweight module metadata for navigation & search (no prose bodies). Generated into
 * meta.generated.ts (via `npm run gen:meta`) and consumed by the eager TopBar/Sidebar/Footer/
 * search so the full bilingual content in concepts.ts loads only in lazy route chunks
 * (S19 bundle data-split).
 */
export type ModuleMeta = Pick<
  Module,
  'id' | 'num' | 'section' | 'order' | 'level' | 'title' | 'tagline' | 'mentalModel' | 'readMins'
> & {
  signature: boolean;
  topics: { id: string; title: Localized }[];
};

/** A glossary entry — the term itself stays English; the gloss is bilingual. */
export type GlossaryEntry = { term: string; def: Localized; seeAlso?: string[] };

/** A mental-model card for the gallery. */
export type MentalModelCard = {
  moduleId: string;
  title: Localized;
  line: Localized; // the one-liner to recall
  accent: string;
};

/** Database Picker decision data (M35). */
export type DecideOption = {
  id: string;
  label: Localized;
  family: Localized;
  engines: string;
  why: Localized;
};
export type DecideQuestion = {
  id: string;
  q: Localized;
  options: { id: string; label: Localized; leansTo: string[] }[];
};
