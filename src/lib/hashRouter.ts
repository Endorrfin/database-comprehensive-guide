import { useEffect, useState } from 'react';

/*
 * Tiny hash router (no router lib — CLAUDE.md §2).
 * Routes: #/map · #/m/<moduleId>[/<topicId>] · #/decide · #/mental-models ·
 *         #/glossary[/<term>] · #/flashcards · #/quiz   (last three added S21)
 * Hash routing + vite base:'./' = works under any GitHub Pages sub-path.
 */

export type Route =
  | { name: 'map' }
  | { name: 'module'; moduleId: string; topicId?: string }
  | { name: 'decide' }
  | { name: 'mentalModels' }
  | { name: 'glossary'; term?: string } // CHANGED (S21): optional deep-link to a term
  | { name: 'flashcards' } // CHANGED (S21)
  | { name: 'quiz' }; // CHANGED (S21)

export function parseHash(raw: string): Route {
  const hash = raw.replace(/^#/, '').replace(/^\/+/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'map' };
  switch (parts[0]) {
    case 'map':
      return { name: 'map' };
    case 'decide':
      return { name: 'decide' };
    case 'mental-models':
      return { name: 'mentalModels' };
    case 'glossary':
      return { name: 'glossary', term: parts[1] ? safeDecode(parts[1]) : undefined };
    case 'flashcards':
      return { name: 'flashcards' };
    case 'quiz':
      return { name: 'quiz' };
    case 'm':
      if (parts[1]) return { name: 'module', moduleId: parts[1], topicId: parts[2] };
      return { name: 'map' };
    default:
      return { name: 'map' };
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export const hrefMap = () => '#/map';
export const hrefModule = (moduleId: string, topicId?: string) =>
  topicId ? `#/m/${moduleId}/${topicId}` : `#/m/${moduleId}`;
export const hrefDecide = () => '#/decide';
export const hrefMentalModels = () => '#/mental-models';
export const hrefGlossary = (term?: string) =>
  term ? `#/glossary/${encodeURIComponent(term)}` : '#/glossary';
export const hrefFlashcards = () => '#/flashcards';
export const hrefQuiz = () => '#/quiz';

export function navigate(href: string): void {
  window.location.hash = href.replace(/^#/, '');
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
