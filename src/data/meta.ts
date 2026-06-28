/*
 * meta.ts — lightweight navigation & search data layer (S19 bundle data-split).
 *
 * The eager chrome (TopBar, Sidebar, Footer, search) imports from HERE, not from concepts.ts, so
 * the full bilingual module content stays out of the index chunk and only loads in the lazy route
 * pages (ModulePage, LandscapeMap, MentalModelsPage) that genuinely need it. The data itself lives
 * in meta.generated.ts (produced by `npm run gen:meta` from concepts.ts); this file adds the typed
 * lookups. check:data validates meta ↔ concepts parity.
 */
import type { Level, Section } from './types';
import type { ModuleMeta } from './types';
import { modulesMeta, sectionsMeta } from './meta.generated';

export type { ModuleMeta };
export { modulesMeta, sectionsMeta };

const moduleMetaById = new Map(modulesMeta.map((m) => [m.id, m]));
const sectionMetaById = new Map(sectionsMeta.map((s) => [s.id, s]));

export function getModuleMeta(id: string): ModuleMeta | undefined {
  return moduleMetaById.get(id);
}
export function getSectionMeta(id: string): Section | undefined {
  return sectionMetaById.get(id);
}
export function modulesBySectionMeta(sectionId: string): ModuleMeta[] {
  return modulesMeta.filter((m) => m.section === sectionId).sort((a, b) => a.order - b.order);
}

export const LEVELS: Level[] = ['beginner', 'middle', 'senior', 'staff'];

export const COUNTS = {
  sections: sectionsMeta.length,
  modules: modulesMeta.length,
  sims: modulesMeta.filter((m) => m.signature).length,
};
