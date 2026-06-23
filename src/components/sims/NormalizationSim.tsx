import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ Normalization stepper (M7, signature). One messy table is normalized step by step —
 * 0NF → 1NF → 2NF → 3NF — using the classic student / course / advisor example. At each
 * step the table splits, redundant cells (tinted red) disappear, and the four "one fact,
 * one place" checks turn green. Mirrors Codd's normal forms and Kent's 1983 summary:
 * every fact depends on "the key, the whole key, and nothing but the key".
 * Deterministic; play/pause/step + reduced-motion fallback + ARIA, like BTreeSim.
 */
type Badge = 'PK' | 'FK' | 'PK·FK';
type NfCol = { name: string; badge?: Badge };
type NfTable = { name: string; cols: NfCol[]; rows: string[][]; tint?: number[]; isNew?: boolean };
type Step = { nf: string; title: Localized; note: Localized; tables: NfTable[] };

const STEPS: Step[] = [
  {
    nf: '0NF',
    title: { en: 'Unnormalized', uk: 'Ненормалізована' },
    note: {
      en: 'A cell holds a list — "DB101, OS201". Values are not atomic, so you cannot index, join, or constrain on them. This is not even 1NF.',
      uk: 'Клітинка містить список — «DB101, OS201». Значення не атомарні, тож по них не можна індексувати, робити join чи constraints. Це навіть не 1NF.',
    },
    tables: [
      {
        name: 'enrollments',
        cols: [
          { name: 'student_id', badge: 'PK' },
          { name: 'student_name' },
          { name: 'advisor' },
          { name: 'advisor_room' },
          { name: 'courses' },
        ],
        rows: [
          ['1', 'Priya', 'Dr. Lee', 'R210', 'DB101, OS201'],
          ['2', 'Ihor', 'Dr. Lee', 'R210', 'DB101'],
        ],
        tint: [4],
      },
    ],
  },
  {
    nf: '1NF',
    title: { en: 'First normal form', uk: 'Перша нормальна форма' },
    note: {
      en: 'Atomic values, one row per enrollment; the key is the composite (student_id, course_id). But student_name, advisor and course_title now repeat on every row — partial dependencies on part of the key.',
      uk: 'Атомарні значення, один рядок на enrollment; ключ — складений (student_id, course_id). Але student_name, advisor і course_title тепер повторюються в кожному рядку — partial dependencies на частину ключа.',
    },
    tables: [
      {
        name: 'enrollments',
        cols: [
          { name: 'student_id', badge: 'PK' },
          { name: 'course_id', badge: 'PK' },
          { name: 'student_name' },
          { name: 'advisor' },
          { name: 'advisor_room' },
          { name: 'course_title' },
          { name: 'grade' },
        ],
        rows: [
          ['1', 'DB101', 'Priya', 'Dr. Lee', 'R210', 'Databases', 'A'],
          ['1', 'OS201', 'Priya', 'Dr. Lee', 'R210', 'Operating Sys', 'B'],
          ['2', 'DB101', 'Ihor', 'Dr. Lee', 'R210', 'Databases', 'C'],
        ],
        tint: [2, 3, 4, 5],
      },
    ],
  },
  {
    nf: '2NF',
    title: { en: 'Second normal form', uk: 'Друга нормальна форма' },
    note: {
      en: 'Split out students and courses, so each name and course title lives once. Remaining smell: advisor_room depends on advisor — not on student_id — so R210 still repeats for every student of Dr. Lee (a transitive dependency).',
      uk: 'Виокремили students і courses, тож кожне імʼя й назва course живуть раз. Залишок: advisor_room залежить від advisor — не від student_id — тож R210 досі повторюється для кожного студента Dr. Lee (transitive dependency).',
    },
    tables: [
      {
        name: 'students',
        isNew: true,
        cols: [
          { name: 'student_id', badge: 'PK' },
          { name: 'student_name' },
          { name: 'advisor' },
          { name: 'advisor_room' },
        ],
        rows: [
          ['1', 'Priya', 'Dr. Lee', 'R210'],
          ['2', 'Ihor', 'Dr. Lee', 'R210'],
        ],
        tint: [2, 3],
      },
      {
        name: 'courses',
        isNew: true,
        cols: [
          { name: 'course_id', badge: 'PK' },
          { name: 'course_title' },
        ],
        rows: [
          ['DB101', 'Databases'],
          ['OS201', 'Operating Sys'],
        ],
      },
      {
        name: 'enrollments',
        cols: [
          { name: 'student_id', badge: 'PK·FK' },
          { name: 'course_id', badge: 'PK·FK' },
          { name: 'grade' },
        ],
        rows: [
          ['1', 'DB101', 'A'],
          ['1', 'OS201', 'B'],
          ['2', 'DB101', 'C'],
        ],
      },
    ],
  },
  {
    nf: '3NF',
    title: { en: 'Third normal form', uk: 'Третя нормальна форма' },
    note: {
      en: "The advisor's room now lives once, in advisors; students references it by foreign key. Every non-key fact depends on the key, the whole key, and nothing but the key — the anomalies are gone.",
      uk: 'Кабінет advisor тепер живе раз, у advisors; students посилається на нього через foreign key. Кожен не-ключовий факт залежить від ключа, усього ключа й нічого, окрім ключа — аномалії зникли.',
    },
    tables: [
      {
        name: 'advisors',
        isNew: true,
        cols: [
          { name: 'advisor', badge: 'PK' },
          { name: 'advisor_room' },
        ],
        rows: [['Dr. Lee', 'R210']],
      },
      {
        name: 'students',
        cols: [
          { name: 'student_id', badge: 'PK' },
          { name: 'student_name' },
          { name: 'advisor', badge: 'FK' },
        ],
        rows: [
          ['1', 'Priya', 'Dr. Lee'],
          ['2', 'Ihor', 'Dr. Lee'],
        ],
      },
      {
        name: 'courses',
        cols: [
          { name: 'course_id', badge: 'PK' },
          { name: 'course_title' },
        ],
        rows: [
          ['DB101', 'Databases'],
          ['OS201', 'Operating Sys'],
        ],
      },
      {
        name: 'enrollments',
        cols: [
          { name: 'student_id', badge: 'PK·FK' },
          { name: 'course_id', badge: 'PK·FK' },
          { name: 'grade' },
        ],
        rows: [
          ['1', 'DB101', 'A'],
          ['1', 'OS201', 'B'],
          ['2', 'DB101', 'C'],
        ],
      },
    ],
  },
];

const CHECKS: { label: Localized; okFrom: number }[] = [
  { label: { en: 'Atomic values', uk: 'Атомарні значення' }, okFrom: 1 },
  { label: { en: 'Course title in one place', uk: 'Назва course в одному місці' }, okFrom: 2 },
  { label: { en: 'Student → advisor in one place', uk: 'Student → advisor в одному місці' }, okFrom: 2 },
  { label: { en: 'Advisor → room in one place', uk: 'Advisor → room в одному місці' }, okFrom: 3 },
];

export function NormalizationSim() {
  const { t } = useLang();
  const [idx, setIdx] = useState(0);
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

  const atEnd = idx >= STEPS.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, STEPS.length - 1)), 1400);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, STEPS.length - 1)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const s = STEPS[idx];
  const status = useMemo(() => `${s.nf} · ${t(s.title)} — ${t(s.note)}`, [s, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim nf-sim" aria-label="Normalization stepper">
      <div className="sim-bar">
        <ol className="nf-steps" aria-label="Normal forms">
          {STEPS.map((st, i) => (
            <li key={st.nf} className="nf-steps-item">
              <button
                className={cx('nf-step', i === idx && 'on', i < idx && 'done')}
                aria-current={i === idx ? 'step' : undefined}
                onClick={() => {
                  setPlaying(false);
                  setIdx(i);
                }}
              >
                {st.nf}
              </button>
              {i < STEPS.length - 1 && (
                <span className="nf-arrow" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({idx + 1}/{STEPS.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <div className="nf-note">
        <strong className="mono nf-note-tag">{s.nf}</strong>
        <span>{t(s.note)}</span>
      </div>

      <div className="nf-tables sim-stage-wrap">
        {s.tables.map((tbl) => (
          <figure key={tbl.name} className={cx('nf-table', tbl.isNew && 'nf-table--new')}>
            <figcaption className="nf-table-name mono">
              {tbl.name}
              {tbl.isNew && <span className="nf-new-tag">{t({ en: 'split out', uk: 'виокремлено' })}</span>}
            </figcaption>
            <table className="nf-grid">
              <thead>
                <tr>
                  {tbl.cols.map((c) => (
                    <th key={c.name} scope="col">
                      <span className="mono">{c.name}</span>
                      {c.badge && <span className={cx('nf-badge', c.badge === 'FK' && 'nf-badge--fk', c.badge === 'PK·FK' && 'nf-badge--pkfk')}>{c.badge}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((cell, ci) => (
                      <td key={ci} className={tbl.tint?.includes(ci) ? 'nf-cell--dup' : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        ))}
      </div>

      <ul className="nf-checks" aria-label="One fact, one place">
        {CHECKS.map((c) => {
          const ok = idx >= c.okFrom;
          return (
            <li key={c.label.en} className={cx('nf-check', ok && 'ok')}>
              <span className="nf-check-mark" aria-hidden="true">
                {ok ? '✓' : '✗'}
              </span>
              {t(c.label)}
            </li>
          );
        })}
      </ul>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          <i className="dot nf-dot-dup" /> {t({ en: 'duplicated fact', uk: 'дубльований факт' })}
        </span>
        <span className="dim">{t({ en: '“the key, the whole key, and nothing but the key” — Kent, 1983', uk: '«ключ, увесь ключ і нічого, окрім ключа» — Kent, 1983' })}</span>
      </div>
    </section>
  );
}
