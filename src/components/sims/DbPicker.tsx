import { useMemo, useState } from 'react';
import { decideOptions, decideQuestions } from '../../data/decide';
import { families } from '../../data/families';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { hrefModule } from '../../lib/hashRouter';

/*
 * ★ Database Picker (M35, signature). A requirements-first questionnaire: step through a few
 * workload questions, each answer leans toward one or more database families (decide.ts), and
 * the wizard tallies the leans and ranks the recommendations. The teaching point made
 * interactive — requirements first, engine second; relational/PostgreSQL is the default and
 * wins ties, a specialist only surfaces when the workload genuinely calls for it; when two
 * needs score highly the result suggests polyglot persistence.
 *
 * Click-driven and fully deterministic (no animation loop → inherently prefers-reduced-motion
 * safe). ARIA: each question is a radiogroup; a live region announces step and result. Family
 * + engine names stay English; only the explanation is bilingual. Brand colour + the deep-link
 * target come from families.ts so the picker can never drift from the taxonomy.
 */

type FamilyMeta = { color: string; moduleId: string };
const familyMeta: Record<string, FamilyMeta> = Object.fromEntries(
  families.map((f) => [f.id, { color: f.color, moduleId: f.moduleId }]),
);

type Ranked = { id: string; score: number };

export function DbPicker() {
  const { t, lang } = useLang();
  const N = decideQuestions.length;
  // answers[i] = chosen option id for question i (or undefined)
  const [answers, setAnswers] = useState<(string | undefined)[]>(() => Array(N).fill(undefined));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const answeredCount = answers.filter(Boolean).length;

  // Tally leansTo across all answers → score per family id; rank decideOptions.
  const ranked = useMemo<Ranked[]>(() => {
    const score: Record<string, number> = Object.fromEntries(decideOptions.map((o) => [o.id, 0]));
    answers.forEach((ansId, qi) => {
      if (!ansId) return;
      const opt = decideQuestions[qi].options.find((o) => o.id === ansId);
      opt?.leansTo.forEach((fam) => {
        if (fam in score) score[fam] += 1;
      });
    });
    // sort by score desc; tie-break by decideOptions order (relational is first → wins ties).
    return decideOptions
      .map((o) => ({ id: o.id, score: score[o.id] }))
      .sort((a, b) => b.score - a.score);
  }, [answers]);

  const positives = ranked.filter((r) => r.score > 0);
  const winner = positives[0] ?? ranked[0];
  const runnersUp = positives.slice(1, 3);
  // Polyglot hint: two or more families each got a strong (>=2) signal.
  const strong = positives.filter((r) => r.score >= 2);
  const showPolyglot = strong.length >= 2;
  const systemOfRecord = positives.find((r) => r.id === 'relational') ?? winner;
  const topSpecialist = positives.find((r) => r.id !== 'relational');

  const optionById = (id: string) => decideOptions.find((o) => o.id === id)!;
  const tt = (v: Localized) => (lang === 'uk' ? v.uk : v.en);

  function choose(qi: number, optId: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = optId;
      return next;
    });
  }
  function goNext() {
    if (step < N - 1) setStep(step + 1);
    else setDone(true);
  }
  function reset() {
    setAnswers(Array(N).fill(undefined));
    setStep(0);
    setDone(false);
  }

  const q = decideQuestions[step];
  const status = done
    ? `${t({ en: 'Recommended', uk: 'Рекомендовано' })}: ${tt(optionById(winner.id).family)} (${optionById(winner.id).engines})`
    : `${t({ en: 'Question', uk: 'Питання' })} ${step + 1}/${N}: ${tt(q.q)}`;

  return (
    <section className="sim dbp" aria-label="Database Picker">
      {!done && (
        <>
          <div className="dbp-progress" aria-hidden="true">
            {decideQuestions.map((qq, i) => (
              <span
                key={qq.id}
                className={`dbp-pip ${i === step ? 'dbp-pip--on' : ''} ${answers[i] ? 'dbp-pip--done' : ''}`}
              />
            ))}
          </div>
          <div className="dbp-qhead">
            <span className="dbp-qnum dim">
              {t({ en: 'Question', uk: 'Питання' })} {step + 1}/{N}
            </span>
            <h4 className="dbp-q">{tt(q.q)}</h4>
          </div>

          <div className="dbp-options" role="radiogroup" aria-label={tt(q.q)}>
            {q.options.map((o) => {
              const sel = answers[step] === o.id;
              return (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={sel}
                  className={`dbp-opt ${sel ? 'dbp-opt--on' : ''}`}
                  onClick={() => choose(step, o.id)}
                >
                  <span className="dbp-radio" aria-hidden="true" />
                  <span>{tt(o.label)}</span>
                </button>
              );
            })}
          </div>

          <div className="dbp-nav">
            <button className="dbp-btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              ← {t({ en: 'Back', uk: 'Назад' })}
            </button>
            <button className="dbp-btn dbp-btn--primary" onClick={goNext} disabled={!answers[step]}>
              {step < N - 1
                ? `${t({ en: 'Next', uk: 'Далі' })} →`
                : t({ en: 'See recommendation', uk: 'Показати рекомендацію' })}
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="dbp-result">
          <div className="dbp-result-head">
            <span className="dbp-result-tag dim">{t({ en: 'Recommended', uk: 'Рекомендовано' })}</span>
            <button className="dbp-btn" onClick={reset}>
              ↺ {t({ en: 'Start over', uk: 'Почати знову' })}
            </button>
          </div>

          {(() => {
            const o = optionById(winner.id);
            const meta = familyMeta[winner.id];
            return (
              <article className="dbp-winner" style={{ ['--fam' as string]: meta?.color ?? 'var(--accent)' }}>
                <div className="dbp-winner-top">
                  <h4 className="dbp-winner-name">{tt(o.label)}</h4>
                  <code className="dbp-winner-engines mono">{o.engines}</code>
                </div>
                <p className="dbp-winner-why">{tt(o.why)}</p>
                {meta && (
                  <a className="dbp-open" href={hrefModule(meta.moduleId)}>
                    {t({ en: 'Open the module', uk: 'Відкрити модуль' })} →
                  </a>
                )}
              </article>
            );
          })()}

          {showPolyglot && topSpecialist && systemOfRecord.id !== topSpecialist.id && (
            <aside className="dbp-polyglot" role="note">
              <strong>{t({ en: 'Polyglot persistence', uk: 'Polyglot persistence' })}</strong>{' '}
              {t({
                en: 'More than one need scored highly. Keep',
                uk: 'Більш ніж одна потреба набрала високо. Тримайте',
              })}{' '}
              <b className="mono">{optionById(systemOfRecord.id).engines.split(' · ')[0]}</b>{' '}
              {t({ en: 'as the system of record and add', uk: 'як систему запису й додайте' })}{' '}
              <b className="mono">{optionById(topSpecialist.id).engines.split(' · ')[0]}</b>{' '}
              {t({ en: 'for that specialized job — one store rarely does everything well.', uk: 'для цієї спеціалізованої задачі — одне сховище рідко робить усе добре.' })}
            </aside>
          )}

          {runnersUp.length > 0 && (
            <div className="dbp-runners">
              <span className="dbp-runners-label dim">{t({ en: 'Also worth considering', uk: 'Також варто розглянути' })}</span>
              <div className="dbp-runner-row">
                {runnersUp.map((r) => {
                  const o = optionById(r.id);
                  const meta = familyMeta[r.id];
                  return (
                    <a
                      key={r.id}
                      className="dbp-runner"
                      href={meta ? hrefModule(meta.moduleId) : '#'}
                      style={{ ['--fam' as string]: meta?.color ?? 'var(--accent)' }}
                    >
                      <span className="dbp-runner-name">{tt(o.label)}</span>
                      <span className="dbp-runner-eng mono dim">{o.engines.split(' · ')[0]}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <p className="dbp-disclaimer muted">
            {t({
              en: 'A starting point, not a verdict — pick from requirements, prototype, and confirm with your own workload.',
              uk: 'Відправна точка, а не вирок — обирайте від вимог, прототипуйте і підтверджуйте власним workload.',
            })}
          </p>
        </div>
      )}

      <p className="sim-status" aria-live="polite">
        {status}
      </p>
      {!done && answeredCount > 0 && (
        <p className="dbp-answered muted" aria-hidden="true">
          {answeredCount}/{N} {t({ en: 'answered', uk: 'відповіли' })}
        </p>
      )}
    </section>
  );
}
