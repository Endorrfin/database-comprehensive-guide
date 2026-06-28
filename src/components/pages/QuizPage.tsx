import { useCallback, useEffect, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';
import { buildQuiz } from '../../lib/quiz';
import type { QuizKind } from '../../lib/quiz';

/*
 * Quiz (#/quiz) — one multiple-choice question at a time, mixed across the whole guide
 * (model→module · workload→family · term→definition) by lib/quiz.ts. Pick an answer to reveal the
 * correct option + a link to the home module; score accrues on the first pick. Keyboard 1–4 to
 * answer, Enter for the next question. ARIA radiogroup + a live region announce the verdict.
 */

const QUIZ_LEN = 10;

const KIND_TAG: Record<QuizKind, Localized> = {
  model: { en: 'Mental model', uk: 'Ментальна модель' },
  family: { en: 'Workload', uk: 'Навантаження' },
  term: { en: 'Term', uk: 'Термін' },
};

export function QuizPage() {
  const { t } = useLang();
  const [questions, setQuestions] = useState(() => buildQuiz(QUIZ_LEN));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[idx];
  const revealed = picked !== null;
  const isCorrect = revealed && picked === q.answerId;

  const choose = useCallback(
    (id: string) => {
      if (picked !== null) return; // first answer locks the question
      setPicked(id);
      if (id === q.answerId) setScore((s) => s + 1);
    },
    [picked, q],
  );

  const next = useCallback(() => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setFinished(true);
    }
  }, [idx, questions.length]);

  const restart = useCallback(() => {
    setQuestions(buildQuiz(QUIZ_LEN));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }, []);

  // Keyboard: 1–4 answer, Enter → next once revealed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.key === 'Enter' && revealed) {
        next();
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= q.choices.length) choose(q.choices[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, revealed, next, choose, q]);

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="content quiz">
        <h1>{t(ui.quiz)}</h1>
        <div className="quiz-done card">
          <h3>✓ {t(ui.quizDone)}</h3>
          <p className="quiz-final">
            {t(ui.quizYourScore)} <strong>{score}</strong>/{questions.length} · {pct}%
          </p>
          <button className="btn btn-primary" onClick={restart}>
            ↺ {t(ui.quizNew)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content quiz">
      <h1>{t(ui.quiz)}</h1>
      <p className="muted">{t(ui.quizLede)}</p>

      <div className="quiz-head">
        <span className="quiz-progress dim">
          {idx + 1}/{questions.length}
        </span>
        <span className="quiz-score">
          {t(ui.quizScore)}: <strong>{score}</strong>
        </span>
      </div>

      <div className="quiz-card card">
        <span className={cx('quiz-kind', `quiz-kind--${q.kind}`)}>{t(KIND_TAG[q.kind])}</span>
        <p className="quiz-prompt">{t(q.prompt)}</p>
        <p className={cx('quiz-cue', `quiz-cue--${q.kind}`)}>{t(q.cue)}</p>

        <div className="quiz-options" role="radiogroup" aria-label={t(q.prompt)}>
          {q.choices.map((c, i) => {
            const state = !revealed
              ? ''
              : c.id === q.answerId
                ? 'quiz-opt--correct'
                : c.id === picked
                  ? 'quiz-opt--wrong'
                  : 'quiz-opt--dim';
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={picked === c.id}
                className={cx('quiz-opt', state)}
                disabled={revealed}
                onClick={() => choose(c.id)}
              >
                <span className="quiz-opt-key kbd" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="quiz-opt-label">{t(c.label)}</span>
                {revealed && c.id === q.answerId && <span className="quiz-tick" aria-hidden="true">✓</span>}
                {revealed && c.id === picked && c.id !== q.answerId && (
                  <span className="quiz-cross" aria-hidden="true">✕</span>
                )}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={cx('quiz-feedback', isCorrect ? 'is-correct' : 'is-wrong')} aria-live="polite">
            <span className="quiz-verdict">{isCorrect ? `✓ ${t(ui.quizCorrect)}` : `✕ ${t(ui.quizIncorrect)}`}</span>
            {q.href && (
              <a className="quiz-open" href={q.href}>
                {t(ui.quizOpenModule)} →
              </a>
            )}
            <button className="btn btn-primary quiz-next" onClick={next}>
              {t(ui.quizNext)} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
