// CHANGED (S20): per-module content code-split. The header, TOC and prev/next render instantly from
// the lightweight `meta` layer; the heavy body (topic blocks, key points, pitfalls, interview,
// sources) is dynamically imported per module via moduleContent[id] and streamed in. This removes
// the 480 KB aggregated concepts chunk from the app — a module view now loads only its own body.
import { useEffect, useState } from 'react';
import type { Module } from '../../data/types';
import { adjacentModulesMeta, getModuleMeta, getSectionMeta } from '../../data/meta';
import { loadModuleContent } from '../../data/moduleContent';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import { hrefModule } from '../../lib/hashRouter';
import { BlockView } from './blocks';
import { LevelBadge } from './LevelBadge';

export function ModulePage({ moduleId, topicId }: { moduleId: string; topicId?: string }) {
  const { t, lang } = useLang();
  const { isKnown, toggleKnown } = useAppState();
  const meta = getModuleMeta(moduleId);
  const [content, setContent] = useState<Module | null>(null);

  // Load the current module's full content on demand (its own chunk).
  useEffect(() => {
    let alive = true;
    setContent(null);
    loadModuleContent(moduleId)?.then((m) => {
      if (alive) setContent(m);
    });
    return () => {
      alive = false;
    };
  }, [moduleId]);

  // Scroll to the requested topic once its content is on the page (or to top otherwise).
  useEffect(() => {
    if (topicId && content) {
      const el = document.getElementById(`topic-${topicId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!topicId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [moduleId, topicId, content]);

  if (!meta) {
    return (
      <div className="content">
        <p className="muted">Module not found.</p>
        <a className="btn" href={hrefModule('m13-btree')}>
          Go to the B-Tree module
        </a>
      </div>
    );
  }

  const section = getSectionMeta(meta.section);
  const { prev, next } = adjacentModulesMeta(meta.id);
  const known = isKnown(meta.id);

  return (
    <article className="content module">
      <header className="module-header">
        <div className="module-kicker">
          {section && (
            <span style={{ color: section.accent }}>
              {section.roman} · {t(section.name)}
            </span>
          )}
        </div>
        <h1>
          <span className="module-num mono">{String(meta.num).padStart(2, '0')}</span>
          {t(meta.title)}
        </h1>
        <div className="module-meta">
          <LevelBadge level={meta.level} />
          {meta.signature && <span className="chip star">★ interactive</span>}
          <span className="chip">
            {meta.readMins} {t(ui.readMins)}
          </span>
          <button
            className={known ? 'chip known-on' : 'chip'}
            onClick={() => toggleKnown(meta.id)}
            aria-pressed={known}
          >
            {known ? `✓ ${t(ui.known)}` : t(ui.markKnown)}
          </button>
        </div>
        <p className="module-tagline">{t(meta.tagline)}</p>
        <div className="module-mm">
          <span className="module-mm-label">{t(ui.mentalModelLabel)}</span>
          <p>{t(meta.mentalModel)}</p>
        </div>
      </header>

      {/* TOC renders instantly from meta (topic id + title only). */}
      {meta.topics.length > 0 && (
        <nav className="toc" aria-label={t(ui.onThisPage)}>
          <span className="toc-title">{t(ui.onThisPage)}</span>
          <ol>
            {meta.topics.map((tp) => (
              <li key={tp.id}>
                <a href={hrefModule(meta.id, tp.id)}>{t(tp.title)}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {!content ? (
        <p className="muted module-loading" aria-live="polite">
          {t({ en: 'Loading…', uk: 'Завантаження…' })}
        </p>
      ) : (
        <>
          {content.topics.map((tp) => (
            <section className="topic" id={`topic-${tp.id}`} key={tp.id}>
              <h2>{t(tp.title)}</h2>
              {tp.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </section>
          ))}

          {content.keyPoints.length > 0 && (
            <section className="endcap keypoints">
              <h2>{t(ui.keyPoints)}</h2>
              <ul>
                {content.keyPoints.map((kp, i) => (
                  <li key={i}>{t(kp)}</li>
                ))}
              </ul>
            </section>
          )}

          {content.pitfalls.length > 0 && (
            <section className="endcap pitfalls">
              <h2>{t(ui.pitfalls)}</h2>
              <div className="pitfall-grid">
                {content.pitfalls.map((p, i) => (
                  <div className="pitfall" key={i}>
                    <strong>{t(p.title)}</strong>
                    <p className="muted">{t(p.body)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {content.interview && content.interview.length > 0 && (
            <section className="endcap interview">
              <h2>{t(ui.interview)}</h2>
              {content.interview.map((qa, i) => (
                <details className="qa" key={i}>
                  <summary>
                    {qa.level && <span className="chip badge-level" data-level={qa.level} />}
                    {t(qa.q)}
                  </summary>
                  <p>{t(qa.a)}</p>
                </details>
              ))}
            </section>
          )}

          {content.sources.length > 0 && (
            <section className="endcap sources">
              <h2>{t(ui.sources)}</h2>
              <ul>
                {content.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {content.seeAlso.length > 0 && (
            <section className="endcap seealso">
              <h2>{t(ui.seeAlso)}</h2>
              <div className="seealso-row">
                {content.seeAlso.map((id) => {
                  const m = getModuleMeta(id);
                  if (!m) return null;
                  return (
                    <a className="seealso-card" href={hrefModule(id)} key={id}>
                      <span className="mono dim">{String(m.num).padStart(2, '0')}</span>
                      <span>{m.title[lang] || m.title.en}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <nav className="prevnext" aria-label="Module navigation">
        {prev ? (
          <a className="pn pn-prev" href={hrefModule(prev.id)}>
            <span className="dim">← {t(ui.prevModule)}</span>
            <span>{t(prev.title)}</span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="pn pn-next" href={hrefModule(next.id)}>
            <span className="dim">{t(ui.nextModule)} →</span>
            <span>{t(next.title)}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
