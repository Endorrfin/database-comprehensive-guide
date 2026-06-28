import { useCallback, useEffect, useMemo, useState } from 'react';
import { glossary } from '../../data/glossary';
import { LEVELS, getSectionMeta, modulesMeta, sectionsMeta } from '../../data/meta';
import type { Level, Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefGlossary, hrefModule } from '../../lib/hashRouter';
import { cx } from '../../lib/utils';

const LEVEL_UI: Record<Level, typeof ui.beginner> = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
};

/*
 * Flashcards (#/flashcards) — recall-then-grade study over two decks built from existing data:
 *   • Mental models — front = module title, back = the one-line model (meta, section accent + level).
 *   • Glossary terms — front = term, back = definition (glossary.ts, lazy with this route).
 * Recall before flipping; "Review again" re-queues the card to the end of this pass and un-knows it,
 * "Knew it" marks it known and jumps to the next un-known card. Progress (known / total) persists in
 * localStorage (its own key, separate from the module `known` flag). Click/Space flips, ← → move,
 * 1 = review again, 2 = knew it. Flip transition is CSS-only → prefers-reduced-motion safe.
 */

type Deck = 'models' | 'glossary';
type Card = {
  id: string;
  front: Localized;
  back: Localized;
  href: string;
  accent?: string;
  level?: Level;
  section?: string;
};

const FLASH_KEY = 'dbguide.flash';

function loadKnown(): Set<string> {
  try {
    const raw = localStorage.getItem(FLASH_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set<string>();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Decks derived once from data (module order / glossary order).
const MODEL_CARDS: Card[] = modulesMeta
  .slice()
  .sort((a, b) => a.num - b.num)
  .map((m) => ({
    id: `mm:${m.id}`,
    front: m.title,
    back: m.mentalModel,
    href: hrefModule(m.id),
    accent: getSectionMeta(m.section)?.accent ?? 'var(--accent)',
    level: m.level,
    section: m.section,
  }));

const GLOSSARY_CARDS: Card[] = glossary.map((g) => ({
  id: `gl:${g.term}`,
  front: { en: g.term, uk: g.term },
  back: g.def,
  href: hrefGlossary(g.term),
}));

export function FlashcardsPage() {
  const { t } = useLang();
  const [deck, setDeck] = useState<Deck>('models');
  const [levelF, setLevelF] = useState<Level | 'all'>('all');
  const [sectionF, setSectionF] = useState<string>('all');
  const [known, setKnown] = useState<Set<string>>(loadKnown);
  // Initialise to the default (models) deck so the first paint / SSR already has cards; the effect
  // below keeps it in sync when the deck or filters change.
  const [order, setOrder] = useState<string[]>(() => MODEL_CARDS.map((c) => c.id));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(FLASH_KEY, JSON.stringify([...known]));
    } catch {
      /* ignore persistence failures */
    }
  }, [known]);

  // Filtered deck (models honour the level + section filters; glossary is flat).
  const cards = useMemo(() => {
    if (deck === 'glossary') return GLOSSARY_CARDS;
    return MODEL_CARDS.filter(
      (c) => (levelF === 'all' || c.level === levelF) && (sectionF === 'all' || c.section === sectionF),
    );
  }, [deck, levelF, sectionF]);

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // Rebuild the round whenever the filtered deck changes.
  useEffect(() => {
    setOrder(cards.map((c) => c.id));
    setPos(0);
    setFlipped(false);
  }, [cards]);

  const total = order.length;
  const card = total > 0 ? byId.get(order[Math.min(pos, total - 1)]) : undefined;
  const knownInDeck = useMemo(() => order.filter((id) => known.has(id)).length, [order, known]);
  const allKnown = total > 0 && knownInDeck === total;

  const move = useCallback(
    (delta: number) => {
      setFlipped(false);
      setPos((p) => (total === 0 ? 0 : (p + delta + total) % total));
    },
    [total],
  );

  const gradeKnown = useCallback(() => {
    if (!card) return;
    const k = new Set(known);
    k.add(card.id);
    setKnown(k);
    setFlipped(false);
    // jump to the next still-unknown card (keeps the pass productive); stay if all known now.
    let target = pos;
    for (let i = 1; i <= total; i++) {
      const p = (pos + i) % total;
      if (!k.has(order[p])) {
        target = p;
        break;
      }
    }
    setPos(target);
  }, [card, known, order, pos, total]);

  const gradeAgain = useCallback(() => {
    if (!card) return;
    const k = new Set(known);
    k.delete(card.id);
    setKnown(k);
    setFlipped(false);
    setOrder((o) => {
      const n = [...o];
      n.splice(pos, 1);
      n.push(card.id);
      return n;
    });
    setPos((p) => (p >= total - 1 ? 0 : p)); // length unchanged; if we were last, wrap to front
  }, [card, known, pos, total]);

  const reshuffle = useCallback(() => {
    setOrder((o) => shuffle(o));
    setPos(0);
    setFlipped(false);
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === '1') gradeAgain();
      else if (e.key === '2') gradeKnown();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, gradeAgain, gradeKnown]);

  const pct = total > 0 ? Math.round((knownInDeck / total) * 100) : 0;

  return (
    <div className="content flash">
      <h1>{t(ui.flashcards)}</h1>
      <p className="muted">{t(ui.flashcardsLede)}</p>

      {/* Controls */}
      <div className="flash-controls">
        <div className="seg" role="group" aria-label={t(ui.deckLabel)}>
          <button className={cx('seg-btn', deck === 'models' && 'on')} onClick={() => setDeck('models')}>
            {t(ui.mentalModels)}
          </button>
          <button className={cx('seg-btn', deck === 'glossary' && 'on')} onClick={() => setDeck('glossary')}>
            {t(ui.deckGlossaryTerms)}
          </button>
        </div>

        {deck === 'models' && (
          <>
            <div className="seg" role="group" aria-label={t(ui.levelFilter)}>
              <button className={cx('seg-btn', levelF === 'all' && 'on')} onClick={() => setLevelF('all')}>
                {t(ui.allLevels)}
              </button>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  className={cx('seg-btn lvl', levelF === lv && 'on')}
                  data-level={lv}
                  onClick={() => setLevelF(lv)}
                >
                  {t(LEVEL_UI[lv])}
                </button>
              ))}
            </div>
            <select
              className="flash-select"
              value={sectionF}
              onChange={(e) => setSectionF(e.target.value)}
              aria-label={t(ui.sectionsLabel)}
            >
              <option value="all">{t({ en: 'All sections', uk: 'Усі розділи' })}</option>
              {sectionsMeta.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roman} · {t(s.name)}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="flash-actions">
          <button className="btn btn-ghost" onClick={reshuffle} disabled={total === 0}>
            ⤮ {t(ui.shuffle)}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flash-progress">
        <div className="flash-bar" aria-hidden="true">
          <span className="flash-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="flash-progress-txt dim">
          {knownInDeck}/{total} {t(ui.knownCount)} · {pct}%
        </span>
      </div>

      {total === 0 ? (
        <p className="muted">{t(ui.searchNoResults)}</p>
      ) : allKnown ? (
        <div className="flash-done card">
          <h3>✓ {t(ui.deckDone)}</h3>
          <p className="muted">{t(ui.deckDoneLede)}</p>
          <div className="flash-actions">
            <button className="btn btn-primary" onClick={reshuffle}>
              ⤮ {t(ui.shuffle)}
            </button>
          </div>
        </div>
      ) : (
        card && (
          <>
            <div className="flash-stage">
              <button
                className="flash-nav-btn"
                onClick={() => move(-1)}
                aria-label={t(ui.back)}
              >
                ‹
              </button>

              <div
                className={cx('flash-card', flipped && 'is-flipped', known.has(card.id) && 'is-known')}
                style={{ ['--sec' as string]: card.accent ?? 'var(--accent)' }}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                aria-pressed={flipped}
                aria-label={t(ui.flip)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setFlipped((f) => !f);
                }}
              >
                <div className="flash-inner">
                  <div className="flash-face flash-face--front" aria-hidden={flipped}>
                    <div className="flash-tag">
                      <span className="flash-kind dim">
                        {deck === 'models' ? t(ui.mentalModelLabel) : t(ui.searchKindGlossary)}
                      </span>
                      {card.level && (
                        <span className="chip badge-level" data-level={card.level}>
                          {card.level}
                        </span>
                      )}
                    </div>
                    <p className="flash-front-text">{t(card.front)}</p>
                    <span className="flash-hint dim">{t(ui.flipHint)}</span>
                  </div>
                  <div className="flash-face flash-face--back" aria-hidden={!flipped}>
                    <p className="flash-back-text">{t(card.back)}</p>
                    <a className="flash-open" href={card.href} onClick={(e) => e.stopPropagation()}>
                      {t({ en: 'Open', uk: 'Відкрити' })} →
                    </a>
                  </div>
                </div>
              </div>

              <button className="flash-nav-btn" onClick={() => move(1)} aria-label={t(ui.next)}>
                ›
              </button>
            </div>

            <div className="flash-grade">
              <button className="btn flash-again" onClick={gradeAgain}>
                <span className="kbd">1</span> {t(ui.reviewAgain)}
              </button>
              <span className="flash-count dim" aria-live="polite">
                {t(ui.cardLabel)} {pos + 1}/{total}
              </span>
              <button className="btn flash-known" onClick={gradeKnown}>
                <span className="kbd">2</span> {t(ui.knewIt)}
              </button>
            </div>
            <p className="flash-hint-row dim">{t(ui.flipHint)}</p>
          </>
        )
      )}
    </div>
  );
}
