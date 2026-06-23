import type { ReactNode } from 'react';

/*
 * Markdown-lite: paragraphs split on blank lines; inline `code`, **bold**, *italic*.
 * Content is authored in src/data, so the supported subset is deliberately small.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter((p) => p !== '')
    .map((part, i) => {
      const key = `${keyBase}-${i}`;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>;
      return <span key={key}>{part}</span>;
    });
}

export function Md({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i}>{renderInline(p, String(i))}</p>
      ))}
    </div>
  );
}
