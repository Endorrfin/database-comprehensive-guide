/*
 * quiz.ts — a pure, deterministic-on-seed multiple-choice generator over existing guide data.
 * Three question kinds are mixed round-robin so a quiz always varies:
 *   • model  — given a mental model, pick the module it belongs to (distractors prefer same section)
 *   • family — given a workload (decide.ts option), pick the database family it leans to
 *   • term   — given a glossary term, pick its definition
 * No React, no side effects → unit-testable in the session smoke. The page passes Math.random;
 * tests pass a seeded PRNG (mulberry32) for reproducibility.
 */
import { decideQuestions } from '../data/decide';
import { families } from '../data/families';
import { glossary } from '../data/glossary';
import { modulesMeta } from '../data/meta';
import { hrefGlossary, hrefModule } from './hashRouter';
import type { Localized } from '../data/types';

export type QuizKind = 'model' | 'family' | 'term';
export type QuizChoice = { id: string; label: Localized };
export type QuizQuestion = {
  id: string;
  kind: QuizKind;
  prompt: Localized; // the question
  cue: Localized; // the thing shown (model line / workload / term)
  choices: QuizChoice[]; // 4 options, shuffled
  answerId: string; // id of the correct choice
  href?: string; // "open the module" link shown in feedback
};

export type Rng = () => number;

/** Small seeded PRNG so tests are reproducible (app uses Math.random). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sample up to n distinct items (preferring the front of `pool` after a shuffle). */
function sample<T>(pool: T[], n: number, rnd: Rng): T[] {
  return shuffle(pool, rnd).slice(0, n);
}

const PROMPT: Record<QuizKind, Localized> = {
  model: {
    en: 'Which module does this mental model belong to?',
    uk: 'До якого модуля належить ця ментальна модель?',
  },
  family: {
    en: 'Which database family best fits this workload?',
    uk: 'Яка родина баз даних найкраще пасує цьому навантаженню?',
  },
  term: {
    en: 'Which definition matches this term?',
    uk: 'Яке означення відповідає цьому терміну?',
  },
};

function modelPool(rnd: Rng): QuizQuestion[] {
  const mods = modulesMeta;
  return mods.map((m) => {
    const sameSection = mods.filter((o) => o.id !== m.id && o.section === m.section);
    const others = mods.filter((o) => o.id !== m.id && o.section !== m.section);
    const distractors = sample([...sameSection, ...others], 3, rnd); // prefers same section
    const choices = shuffle(
      [m, ...distractors].map((o) => ({ id: o.id, label: o.title })),
      rnd,
    );
    return {
      id: `q-model-${m.id}`,
      kind: 'model' as const,
      prompt: PROMPT.model,
      cue: m.mentalModel,
      choices,
      answerId: m.id,
      href: hrefModule(m.id),
    };
  });
}

function familyPool(rnd: Rng): QuizQuestion[] {
  const famById = new Map(families.map((f) => [f.id, f]));
  const out: QuizQuestion[] = [];
  for (const q of decideQuestions) {
    for (const o of q.options) {
      if (o.leansTo.length !== 1) continue; // only unambiguous workloads
      const fam = famById.get(o.leansTo[0]);
      if (!fam) continue;
      const distractors = sample(
        families.filter((f) => f.id !== fam.id),
        3,
        rnd,
      );
      const choices = shuffle(
        [fam, ...distractors].map((f) => ({ id: f.id, label: f.name })),
        rnd,
      );
      out.push({
        id: `q-family-${q.id}-${o.id}`,
        kind: 'family',
        prompt: PROMPT.family,
        cue: o.label,
        choices,
        answerId: fam.id,
        href: hrefModule(fam.moduleId),
      });
    }
  }
  return out;
}

function termPool(rnd: Rng): QuizQuestion[] {
  return glossary.map((g) => {
    const distractors = sample(
      glossary.filter((x) => x.term !== g.term),
      3,
      rnd,
    );
    const choices = shuffle(
      [g, ...distractors].map((x) => ({ id: x.term, label: x.def })),
      rnd,
    );
    return {
      id: `q-term-${g.term}`,
      kind: 'term' as const,
      prompt: PROMPT.term,
      cue: { en: g.term, uk: g.term },
      choices,
      answerId: g.term,
      href: hrefGlossary(g.term),
    };
  });
}

/** Build a mixed quiz of `count` questions (round-robin across the three kinds). */
export function buildQuiz(count = 10, rnd: Rng = Math.random): QuizQuestion[] {
  const pools = [shuffle(modelPool(rnd), rnd), shuffle(familyPool(rnd), rnd), shuffle(termPool(rnd), rnd)];
  const out: QuizQuestion[] = [];
  let i = 0;
  while (out.length < count && pools.some((p) => p.length > 0)) {
    const p = pools[i % pools.length];
    const q = p.pop();
    if (q) out.push(q);
    i++;
  }
  return out;
}
