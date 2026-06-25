// CHANGED (S12): Route-level lazy loading — LandscapeMap, ModulePage, GlossaryPage,
// MentalModelsPage loaded on demand via React.lazy + Suspense. TopBar/Sidebar/Footer
// stay eager so nav and search are instant on first paint.
import { Suspense, lazy } from 'react';
import { Footer } from './components/layout/Footer';
import { ProgressBar } from './components/layout/ProgressBar';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useLang } from './i18n/lang';
import { ui } from './i18n/ui';
import { useRoute } from './lib/hashRouter';

const LandscapeMap    = lazy(() => import('./components/map/LandscapeMap').then(m => ({ default: m.LandscapeMap })));
const ModulePage      = lazy(() => import('./components/module/ModulePage').then(m => ({ default: m.ModulePage })));
const GlossaryPage    = lazy(() => import('./components/pages/GlossaryPage').then(m => ({ default: m.GlossaryPage })));
const MentalModelsPage= lazy(() => import('./components/pages/MentalModelsPage').then(m => ({ default: m.MentalModelsPage })));
const ComingSoon      = lazy(() => import('./components/pages/ComingSoon').then(m => ({ default: m.ComingSoon })));

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
          {/* Single Suspense covers all lazy route pages */}
          <Suspense fallback={<div className="content" style={{ padding: '2rem', color: 'var(--tx3)' }}>Loading…</div>}>
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
          </Suspense>
          <Footer />
        </main>
      </div>
    </div>
  );
}
