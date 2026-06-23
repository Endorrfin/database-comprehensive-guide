import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/utils';

export function Drawer({
  open,
  onClose,
  title,
  accent,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={cx('drawer-root', open && 'open')} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head" style={{ ['--sec' as string]: accent }}>
          <h3>{title}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
