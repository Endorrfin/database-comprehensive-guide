import { COUNTS } from '../../data/concepts';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>Vasyl Krupka</strong>
          <span className="muted"> · {t(ui.footerRole)} · 🇺🇦</span>
          <p className="muted footer-tag">{t(ui.footerTagline)}</p>
        </div>
        <div className="footer-stats muted">
          <span>
            {COUNTS.sections} {t(ui.sectionsLabel)}
          </span>
          <span>
            {COUNTS.modules} {t(ui.modulesLabel)}
          </span>
          <span>
            {COUNTS.sims} {t(ui.simsLabel)}
          </span>
        </div>
        <p className="footer-built dim">{t(ui.builtWith)}</p>
      </div>
    </footer>
  );
}
