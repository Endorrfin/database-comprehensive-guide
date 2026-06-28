import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ FLOAT-vs-numeric drift stepper (M9). Promotes the static `float-trap` figure into an
 * interactive: add the same increment N times in `double precision` (binary IEEE-754) vs
 * `numeric` (exact decimal) and watch the float result drift off the exact value and the
 * rounding error accumulate, row by row. The climax: ten additions of 0.1 should equal 1.0,
 * but float gives 0.9999999999999999.
 *
 * Deterministic — the float lane is computed by literally summing in JS (also IEEE-754 double,
 * so `String(f)` is the same shortest round-trip text PostgreSQL prints for float8); the numeric
 * lane is exact integer arithmetic rendered as a decimal. Play/pause/step + reduced-motion
 * fallback (Play hidden, Step only) + ARIA live region, mirroring AcidWalSim/BTreeSim. Type and
 * value text stays language-neutral; only explanation is bilingual.
 */
type Inc = 'dime' | 'cent';
const STEPS = 10;
const DENOM: Record<Inc, number> = { dime: 10, cent: 100 }; // 0.1 = 1/10, 0.01 = 1/100
const INCVAL: Record<Inc, number> = { dime: 0.1, cent: 0.01 };

/** Exact decimal of num/denom as a fixed-places string (no binary float involved). */
function exactDecimal(num: number, denom: number): string {
  const places = denom === 10 ? 1 : 2;
  const whole = Math.floor(num / denom);
  const frac = num % denom;
  return `${whole}.${String(frac).padStart(places, '0')}`;
}

/** The running float sum after n additions of inc — computed the same way a DB float8 would. */
function floatSum(inc: number, n: number): number {
  let f = 0;
  for (let i = 0; i < n; i++) f += inc;
  return f;
}

export function FloatDriftSim() {
  const { t } = useLang();
  const [inc, setInc] = useState<Inc>('dime');
  const [idx, setIdx] = useState(0); // 0..STEPS additions
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Reset the walk whenever the increment changes.
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [inc]);

  const atEnd = idx >= STEPS;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, STEPS)), 1100);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, STEPS)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const denom = DENOM[inc];
  const incVal = INCVAL[inc];

  const view = useMemo(() => {
    const f = floatSum(incVal, idx);
    const exactNum = idx / denom; // the value the result *should* be
    const drifted = f !== exactNum;
    const diff = f - exactNum;
    return {
      floatStr: String(f), // shortest round-trip — matches PostgreSQL float8 output
      exactStr: exactDecimal(idx, denom),
      drifted,
      diff,
    };
  }, [incVal, denom, idx]);

  const incText = inc === 'dime' ? '0.1' : '0.01';
  const targetStr = exactDecimal(STEPS, denom); // 1.0 for dimes, 0.10 for cents

  const status = useMemo(() => {
    const base = `${idx}/${STEPS} × ${incText} → float ${view.floatStr} · numeric ${view.exactStr}`;
    return view.drifted ? `${base} — ${t({ en: 'drifted', uk: 'дрейф' })}` : base;
  }, [idx, incText, view, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim fdrift" aria-label="FLOAT vs numeric drift stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Increment">
          <button
            role="tab"
            aria-selected={inc === 'dime'}
            className={inc === 'dime' ? 'seg-on' : ''}
            onClick={() => setInc('dime')}
          >
            {t({ en: 'add 0.1 (a dime)', uk: 'додавати 0.1' })}
          </button>
          <button
            role="tab"
            aria-selected={inc === 'cent'}
            className={inc === 'cent' ? 'seg-on' : ''}
            onClick={() => setInc('cent')}
          >
            {t({ en: 'add 0.01 (a cent)', uk: 'додавати 0.01' })}
          </button>
        </div>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({idx}/{STEPS})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <div className="fdrift-body">
        <p className="fdrift-expr mono">
          {idx === 0
            ? t({ en: 'start: running sum = 0', uk: 'старт: поточна сума = 0' })
            : `${incText} added ${idx}× → running sum`}
        </p>

        {/* double precision lane */}
        <div className={cx('fdrift-lane', view.drifted && 'fdrift-lane--bad')}>
          <div className="fdrift-lane-head">
            <span className="fdrift-type mono" style={{ color: 'var(--c-danger)' }}>
              double precision
            </span>
            <span className="fdrift-sub dim">{t({ en: 'binary IEEE-754 — inexact', uk: 'binary IEEE-754 — неточний' })}</span>
          </div>
          <code className={cx('fdrift-val mono', view.drifted ? 'fdrift-val--bad' : 'fdrift-val--ok')}>{view.floatStr}</code>
        </div>

        {/* numeric lane */}
        <div className="fdrift-lane">
          <div className="fdrift-lane-head">
            <span className="fdrift-type mono" style={{ color: 'var(--c-commit)' }}>
              numeric
            </span>
            <span className="fdrift-sub dim">{t({ en: 'exact decimal', uk: 'точний decimal' })}</span>
          </div>
          <code className="fdrift-val mono fdrift-val--ok">{view.exactStr}</code>
        </div>

        {/* drift readout */}
        <div className={cx('fdrift-diff', view.drifted ? 'fdrift-diff--bad' : 'fdrift-diff--ok')} role="status">
          {idx === 0 ? (
            <span>{t({ en: 'Press Step to add the increment repeatedly.', uk: 'Натискайте Step, щоб додавати приріст повторно.' })}</span>
          ) : view.drifted ? (
            <span>
              {t({ en: 'float − exact =', uk: 'float − exact =' })}{' '}
              <b className="mono">{(view.diff >= 0 ? '+' : '') + view.diff.toExponential(1)}</b>{' '}
              — {t({ en: 'the float can no longer represent this decimal exactly.', uk: 'float уже не може точно представити цей decimal.' })}
            </span>
          ) : (
            <span>{t({ en: 'exact so far — but keep going.', uk: 'поки точно — але продовжуйте.' })}</span>
          )}
        </div>

        {atEnd && (
          <div className="fdrift-climax" role="status">
            {t({
              en: `${STEPS} additions of ${incText} should equal ${targetStr} — float gives ${view.floatStr}. Per row it is invisible; across a million rows of money it is a real, accumulating error. Store money as numeric (or integer cents).`,
              uk: `${STEPS} додавань ${incText} мали б дати ${targetStr} — float дає ${view.floatStr}. На один рядок це невидимо; на мільйоні рядків грошей це реальна, накопичувана похибка. Зберігайте гроші як numeric (чи цілі центи).`,
            })}
          </div>
        )}
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span className="dim">
          {t({
            en: 'Rule: binary floats cannot represent most decimal fractions, so repeated addition drifts. Use numeric (or integer cents) for money and any exact quantity.',
            uk: 'Правило: binary floats не можуть представити більшість десяткових дробів, тож повторне додавання дрейфує. Використовуйте numeric (чи цілі центи) для грошей і будь-яких точних величин.',
          })}
        </span>
      </div>
    </section>
  );
}
