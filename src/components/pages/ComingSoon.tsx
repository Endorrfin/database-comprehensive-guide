import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';

export function ComingSoon({ note }: { note?: Localized }) {
  const { t } = useLang();
  return (
    <div className="coming-soon card">
      <span className="chip">{t(ui.comingSoon)}</span>
      <p className="muted">{t(note ?? ui.stubNote)}</p>
    </div>
  );
}
