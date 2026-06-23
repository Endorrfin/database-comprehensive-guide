import { mentalModelCards } from '../../data/mentalModels';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule } from '../../lib/hashRouter';

export function MentalModelsPage() {
  const { t } = useLang();
  return (
    <div className="content">
      <h1>{t(ui.mentalModels)}</h1>
      <p className="muted">
        {t({
          en: 'One picture per module — the line to recall from memory. If you can redraw it, you understand it.',
          uk: 'Одна картина на модуль — рядок, який варто пригадати з памʼяті. Якщо можете перемалювати — ви це розумієте.',
        })}
      </p>
      <div className="mm-grid">
        {mentalModelCards.map((c) => (
          <a
            className="mm-card"
            key={c.moduleId}
            href={hrefModule(c.moduleId)}
            style={{ ['--sec' as string]: c.accent }}
          >
            <p className="mm-line">{t(c.line)}</p>
            <span className="mm-mod dim">{t(c.title)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
