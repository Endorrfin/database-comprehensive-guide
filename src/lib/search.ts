import type { Lang, Localized } from '../data/types';
import { getSection, modules } from '../data/concepts';

export type SearchResult = {
  moduleId: string;
  topicId?: string;
  title: string;
  context: string;
  score: number;
};

type Entry = {
  moduleId: string;
  topicId?: string;
  title: Localized;
  context: Localized;
  hay: string; // lowercased EN+UA haystack (search indexes both languages)
};

let INDEX: Entry[] | null = null;

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const m of modules) {
    const section = getSection(m.section);
    const ctx: Localized = section ? section.name : { en: '', uk: '' };
    const moduleHay = [
      m.title.en,
      m.title.uk,
      m.tagline.en,
      m.tagline.uk,
      m.mentalModel.en,
      m.mentalModel.uk,
    ]
      .join(' ')
      .toLowerCase();
    entries.push({ moduleId: m.id, title: m.title, context: ctx, hay: moduleHay });
    for (const topic of m.topics) {
      entries.push({
        moduleId: m.id,
        topicId: topic.id,
        title: topic.title,
        context: m.title,
        hay: `${topic.title.en} ${topic.title.uk}`.toLowerCase(),
      });
    }
  }
  return entries;
}

export function search(query: string, lang: Lang, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  INDEX ??= buildIndex();
  const tokens = q.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];
  for (const e of INDEX) {
    let score = 0;
    let matchedAll = true;
    for (const tok of tokens) {
      const idx = e.hay.indexOf(tok);
      if (idx === -1) {
        matchedAll = false;
        break;
      }
      score += idx === 0 ? 3 : 1;
      if ((e.title[lang] || e.title.en).toLowerCase().includes(tok)) score += 2;
    }
    if (matchedAll && score > 0) {
      results.push({
        moduleId: e.moduleId,
        topicId: e.topicId,
        title: e.title[lang] || e.title.en,
        context: e.context[lang] || e.context.en,
        score: score + (e.topicId ? 0 : 1),
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
