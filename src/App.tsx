import { Footer } from './components/layout/Footer';
import { ProgressBar } from './components/layout/ProgressBar';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { LandscapeMap } from './components/map/LandscapeMap';
import { ModulePage } from './components/module/ModulePage';
import { ComingSoon } from './components/pages/ComingSoon';
import { GlossaryPage } from './components/pages/GlossaryPage';
import { MentalModelsPage } from './components/pages/MentalModelsPage';
import { useLang } from './i18n/lang';
import { ui } from './i18n/ui';
import { useRoute } from './lib/hashRouter';

export function App() {
  const route = useRoute();
  const { t } = useLang();

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById('main');
          el?.focus();
          el?.scrollIntoView();
        }}
      >
        {t(ui.skipToContent)}
      </a>
      <ProgressBar />
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-col" id="main" tabIndex={-1}>
          {route.name === 'map' && <LandscapeMap />}
          {route.name === 'module' && (
            <ModulePage moduleId={route.moduleId} topicId={route.topicId} />
          )}
          {route.name === 'mentalModels' && <MentalModelsPage />}
          {route.name === 'glossary' && <GlossaryPage />}
          {route.name === 'decide' && (
            <div className="content">
              <h1>{t(ui.decide)}</h1>
              <ComingSoon
                note={{
                  en: 'The interactive Database Picker (M35) lands in a later session. For now, explore the families on the Landscape Map.',
                  uk: 'Інтерактивний Database Picker (M35) зʼявиться в наступній сесії. Поки що дослідіть родини на Landscape Map.',
                }}
              />
            </div>
          )}
          <Footer />
        </main>
      </div>
    </div>
  );
}
