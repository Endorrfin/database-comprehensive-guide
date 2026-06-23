import { useEffect } from 'react';
import { adjacentModules, getModule, getSection } from '../../data/concepts';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { useAppState } from '../../lib/appState';
import { hrefModule } from '../../lib/hashRouter';
import { ComingSoon } from '../pages/ComingSoon';
import { BlockView } from './blocks';
import { LevelBadge } from './LevelBadge';

export function ModulePage({ moduleId, topicId }: { moduleId: string; topicId?: string }) {
  const { t, lang } = useLang();
  const { isKnown, toggleKnown } = useAppState();
  const mod = getModule(moduleId);

  useEffect(() => {
    if (topicId) {
      const el = document.getElementById(`topic-${topicId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [moduleId, topicId]);

  if (!mod) {
    return (
      <div className="content">
        <p className="muted">Module not found.</p>
        <a className="btn" href={hrefModule('m13-btree')}>
          Go to the B-Tree module
        </a>
      </div>
    );
  }

  const section = getSection(mod.section);
  const { prev, next } = adjacentModules(mod.id);
  const authored = mod.topics.length > 0;
  const known = isKnown(mod.id);

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
          <span className="module-num mono">{String(mod.num).padStart(2, '0')}</span>
          {t(mod.title)}
        </h1>
        <div className="module-meta">
          <LevelBadge level={mod.level} />
          {mod.signature && <span className="chip star">★ interactive</span>}
          <span className="chip">
            {mod.readMins} {t(ui.readMins)}
          </span>
          <button
            className={known ? 'chip known-on' : 'chip'}
            onClick={() => toggleKnown(mod.id)}
            aria-pressed={known}
          >
            {known ? `✓ ${t(ui.known)}` : t(ui.markKnown)}
          </button>
        </div>
        <p className="module-tagline">{t(mod.tagline)}</p>
        <div className="module-mm">
          <span className="module-mm-label">{t(ui.mentalModelLabel)}</span>
          <p>{t(mod.mentalModel)}</p>
        </div>
      </header>

      {!authored && <ComingSoon />}

      {authored && (
        <>
          <nav className="toc" aria-label={t(ui.onThisPage)}>
            <span className="toc-title">{t(ui.onThisPage)}</span>
            <ol>
              {mod.topics.map((tp) => (
                <li key={tp.id}>
                  <a href={hrefModule(mod.id, tp.id)}>{t(tp.title)}</a>
                </li>
              ))}
            </ol>
          </nav>

          {mod.topics.map((tp) => (
            <section className="topic" id={`topic-${tp.id}`} key={tp.id}>
              <h2>{t(tp.title)}</h2>
              {tp.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </section>
          ))}

          {mod.keyPoints.length > 0 && (
            <section className="endcap keypoints">
              <h2>{t(ui.keyPoints)}</h2>
              <ul>
                {mod.keyPoints.map((kp, i) => (
                  <li key={i}>{t(kp)}</li>
                ))}
              </ul>
            </section>
          )}

          {mod.pitfalls.length > 0 && (
            <section className="endcap pitfalls">
              <h2>{t(ui.pitfalls)}</h2>
              <div className="pitfall-grid">
                {mod.pitfalls.map((p, i) => (
                  <div className="pitfall" key={i}>
                    <strong>{t(p.title)}</strong>
                    <p className="muted">{t(p.body)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {mod.interview && mod.interview.length > 0 && (
            <section className="endcap interview">
              <h2>{t(ui.interview)}</h2>
              {mod.interview.map((qa, i) => (
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

          {mod.sources.length > 0 && (
            <section className="endcap sources">
              <h2>{t(ui.sources)}</h2>
              <ul>
                {mod.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {mod.seeAlso.length > 0 && (
        <section className="endcap seealso">
          <h2>{t(ui.seeAlso)}</h2>
          <div className="seealso-row">
            {mod.seeAlso.map((id) => {
              const m = getModule(id);
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
