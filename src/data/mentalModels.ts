import type { MentalModelCard } from './types';
import { getSection, modules } from './concepts';

/** The "draw from memory" gallery — one card per module, derived from its mentalModel. */
export const mentalModelCards: MentalModelCard[] = modules.map((m) => ({
  moduleId: m.id,
  title: m.title,
  line: m.mentalModel,
  accent: getSection(m.section)?.accent ?? 'var(--accent)',
}));
