import type { MentalModelCard } from './types';
// CHANGED (S20): the gallery derives from lightweight meta (not concepts), so the mental-models
// page no longer pulls the full content chunk — only the per-module body chunks remain on demand.
import { getSectionMeta as getSection, modulesMeta as modules } from './meta';

/** The "draw from memory" gallery — one card per module, derived from its mentalModel. */
export const mentalModelCards: MentalModelCard[] = modules.map((m) => ({
  moduleId: m.id,
  title: m.title,
  line: m.mentalModel,
  accent: getSection(m.section)?.accent ?? 'var(--accent)',
}));
