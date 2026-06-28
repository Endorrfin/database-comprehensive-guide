import { useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';

/*
 * SQL-injection demo (M33, light/signature). Toggle how the query is BUILT — string-concatenated
 * vs parameterized — against three attacker inputs, and watch the same input become destructive
 * code (concat) or harmless data (parameterized). The module's core skill made interactive: bind
 * values as parameters, never glue them into the SQL. Toggle-driven, fully deterministic (no
 * animation loop → inherently prefers-reduced-motion safe); ARIA tablists + live region announce
 * the verdict. SQL stays English; only the explanation is bilingual. Facts per M33 sources.
 */
type Mode = 'concat' | 'param';
type PayloadKey = 'benign' | 'bypass' | 'drop';

const MODES: { key: Mode; label: Localized }[] = [
  { key: 'concat', label: { en: 'Concatenated', uk: 'Конкатенація' } },
  { key: 'param', label: { en: 'Parameterized', uk: 'Parameterized' } },
];

type Payload = { key: PayloadKey; tab: Localized; input: string; malicious: boolean };
const PAYLOADS: Payload[] = [
  { key: 'benign', tab: { en: 'Normal', uk: 'Звичайний' }, input: 'tomek', malicious: false },
  { key: 'bypass', tab: { en: 'Auth bypass', uk: 'Обхід auth' }, input: "' OR '1'='1' --", malicious: true },
  { key: 'drop', tab: { en: 'Destructive', uk: 'Руйнівний' }, input: "'; DROP TABLE users; --", malicious: true },
];

type Outcome = { safe: boolean; verdict: Localized; detail: Localized };

function outcomeFor(mode: Mode, p: PayloadKey): Outcome {
  if (mode === 'param') {
    // the input is always bound as data — it can never change the statement
    if (p === 'benign')
      return {
        safe: true,
        verdict: { en: '1 row returned', uk: '1 рядок повернуто' },
        detail: { en: 'The literal name "tomek" matches one user. Normal result.', uk: 'Літеральне імʼя "tomek" збігається з одним користувачем. Нормальний результат.' },
      };
    return {
      safe: true,
      verdict: { en: '0 rows — attack neutralized', uk: '0 рядків — атаку нейтралізовано' },
      detail: { en: 'The whole input is treated as one string value of name. Nobody is literally named that, so it matches nothing — and it can never become code.', uk: 'Увесь вхід трактується як одне рядкове значення name. Ніхто буквально так не названий, тож воно нічого не збігає — і ніколи не може стати кодом.' },
    };
  }
  // concat — the input becomes part of the command
  if (p === 'benign')
    return {
      safe: true,
      verdict: { en: '1 row returned', uk: '1 рядок повернуто' },
      detail: { en: 'Harmless this time — but only because the input happened to contain no SQL syntax.', uk: 'Цього разу безпечно — але лише тому, що вхід випадково не містив SQL-синтаксису.' },
    };
  if (p === 'bypass')
    return {
      safe: false,
      verdict: { en: 'Auth bypass — every row returned', uk: 'Обхід auth — повернуто кожен рядок' },
      detail: { en: "The quote closes the string, OR '1'='1' is always true, and -- comments out the rest. The WHERE filter is gone.", uk: "Лапка закриває рядок, OR '1'='1' завжди істинне, а -- закоментовує решту. Фільтр WHERE зник." },
    };
  return {
    safe: false,
    verdict: { en: 'Table dropped — data destroyed', uk: 'Таблицю дропнуто — дані знищено' },
    detail: { en: 'The ; ends the SELECT and a second statement, DROP TABLE users, executes. The injected text ran as code.', uk: 'Символ ; завершує SELECT, і виконується другий statement, DROP TABLE users. Інʼєкований текст виконався як код.' },
  };
}

export function SqlInjectionSim() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('concat');
  const [pKey, setPKey] = useState<PayloadKey>('bypass');
  const liveRef = useRef<HTMLParagraphElement>(null);

  const payload = useMemo(() => PAYLOADS.find((p) => p.key === pKey)!, [pKey]);
  const outcome = useMemo(() => outcomeFor(mode, pKey), [mode, pKey]);
  const danger = !outcome.safe;

  const status = useMemo(
    () => `${t(MODES.find((m) => m.key === mode)!.label)} · ${t(payload.tab)} → ${t(outcome.verdict)}`,
    [mode, payload, outcome, t],
  );
  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim sqli-sim" aria-label="SQL injection demo">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="How the query is built">
          {MODES.map((m) => (
            <button key={m.key} role="tab" aria-selected={mode === m.key}
              className={mode === m.key ? 'seg-on' : ''} onClick={() => setMode(m.key)}>
              {t(m.label)}
            </button>
          ))}
        </div>
        <div className="seg sqli-seg" role="tablist" aria-label="Attacker input">
          {PAYLOADS.map((p) => (
            <button key={p.key} role="tab" aria-selected={pKey === p.key}
              className={pKey === p.key ? 'seg-on' : ''} onClick={() => setPKey(p.key)}>
              {t(p.tab)}
            </button>
          ))}
        </div>
      </div>

      {/* the user input */}
      <div className="sqli-row">
        <span className="sqli-label">{t({ en: 'User input', uk: 'Вхід користувача' })}</span>
        <code className={`sqli-input mono${payload.malicious ? ' sqli-input--bad' : ''}`}>{payload.input}</code>
      </div>

      {/* what the database executes */}
      <div className="sqli-label">{t({ en: 'What the database executes', uk: 'Що виконує база даних' })}</div>
      {mode === 'concat' ? (
        <pre className="sqli-sql mono" aria-label="executed SQL">
          <span>SELECT * FROM users WHERE name = '</span>
          <span className={payload.malicious ? 'sqli-inj' : 'sqli-ok'}>{payload.input}</span>
          <span>'</span>
        </pre>
      ) : (
        <pre className="sqli-sql mono" aria-label="executed SQL">
          <span>SELECT * FROM users WHERE name = </span>
          <span className="sqli-ph">$1</span>
          {'\n'}
          <span className="sqli-bind">$1 = </span>
          <span className="sqli-data">{`"${payload.input}"`}</span>
          <span className="sqli-bind">{t({ en: '   ← bound as data, never code', uk: '   ← привʼязано як дані, ніколи як код' })}</span>
        </pre>
      )}

      {/* outcome */}
      <div className={`sqli-out ${danger ? 'sqli-out--danger' : 'sqli-out--safe'}`}>
        <strong>{danger ? '✕ ' : '✓ '}{t(outcome.verdict)}</strong>
        <p>{t(outcome.detail)}</p>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>{status}</p>

      <div className="sim-legend muted">
        <span><i className="dot sqli-dot--safe" /> {t({ en: 'input treated as data', uk: 'вхід як дані' })}</span>
        <span><i className="dot sqli-dot--bad" /> {t({ en: 'input executed as code', uk: 'вхід виконано як код' })}</span>
      </div>
    </section>
  );
}
