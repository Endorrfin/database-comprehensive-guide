// CHANGED (S12): Suspense added for lazy sims/figures (code-split via registry.tsx).
import { Suspense } from 'react';
import type { Block, Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { getFigure, getSim } from '../../lib/registry';
import { Md } from './Md';

export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'prose':
      return <ProseBlock md={block.md} />;
    case 'figure':
      return <FigureBlock fig={block.fig} caption={block.caption} />;
    case 'sim':
      return <SimBlock sim={block.sim} />;
    case 'table':
      return <TableBlock head={block.head} rows={block.rows} caption={block.caption} />;
    case 'code':
      return <CodeBlock lang={block.lang} code={block.code} note={block.note} />;
    case 'callout':
      return <CalloutBlock tone={block.tone} title={block.title} md={block.md} />;
    case 'compare':
      return <CompareBlock a={block.a} b={block.b} rows={block.rows} />;
    default:
      return null;
  }
}

function ProseBlock({ md }: { md: Localized }) {
  const { t } = useLang();
  return <Md className="prose" text={t(md)} />;
}

function FigureBlock({ fig, caption }: { fig: string; caption?: Localized }) {
  const { t } = useLang();
  const Fig = getFigure(fig);
  return (
    <figure className="figure">
      <div className="figure-stage">
        {/* CHANGED (S12): Suspense boundary for lazy-loaded figure chunks */}
        <Suspense fallback={<div className="placeholder">Loading figure…</div>}>
          {Fig ? <Fig /> : <div className="placeholder">figure: {fig}</div>}
        </Suspense>
      </div>
      {caption && <figcaption className="figure-cap">{t(caption)}</figcaption>}
    </figure>
  );
}

function SimBlock({ sim }: { sim: string }) {
  const Sim = getSim(sim);
  if (!Sim) return <div className="placeholder placeholder--sim">sim: {sim}</div>;
  return (
    // CHANGED (S12): Suspense boundary for lazy-loaded sim chunks
    <Suspense fallback={<div className="placeholder placeholder--sim">Loading simulator…</div>}>
      <div className="sim-wrap">
        <Sim />
      </div>
    </Suspense>
  );
}

function TableBlock({
  head,
  rows,
  caption,
}: {
  head: Localized[];
  rows: Localized[][];
  caption?: Localized;
}) {
  const { t } = useLang();
  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {t(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>{t(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <p className="dtable-cap muted">{t(caption)}</p>}
    </div>
  );
}

function CodeBlock({ lang, code, note }: { lang: string; code: string; note?: Localized }) {
  const { t } = useLang();
  return (
    <div className="code">
      <div className="code-head">
        <span className="code-lang mono">{lang}</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      {note && <p className="code-note muted">{t(note)}</p>}
    </div>
  );
}

const TONE_LABEL: Record<string, Localized> = {
  tip: { en: 'Tip', uk: 'Порада' },
  warn: { en: 'Watch out', uk: 'Увага' },
  senior: { en: 'Senior insight', uk: 'Senior-інсайт' },
  security: { en: 'Security', uk: 'Безпека' },
};

function CalloutBlock({
  tone,
  title,
  md,
}: {
  tone: 'tip' | 'warn' | 'senior' | 'security';
  title: Localized;
  md: Localized;
}) {
  const { t } = useLang();
  return (
    <aside className={`callout callout--${tone}`} role="note">
      <div className="callout-tag">{t(TONE_LABEL[tone])}</div>
      <strong className="callout-title">{t(title)}</strong>
      <Md text={t(md)} />
    </aside>
  );
}

function CompareBlock({
  a,
  b,
  rows,
}: {
  a: Localized;
  b: Localized;
  rows: [Localized, Localized, Localized][];
}) {
  const { t } = useLang();
  return (
    <div className="dtable-wrap">
      <table className="dtable compare">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">{t(a)}</th>
            <th scope="col">{t(b)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <th scope="row">{t(row[0])}</th>
              <td>{t(row[1])}</td>
              <td>{t(row[2])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
