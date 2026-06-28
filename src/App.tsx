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
// CHANGED (S18): the #/decide route now renders the live Database Picker (M35) instead of ComingSoon.
const DbPicker        = lazy(() => import('./components/sims/DbPicker').then(m => ({ default: m.DbPicker })));

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
                <p className="muted">
                  {t({
                    en: 'Requirements first, engine second. Answer a few questions about your workload and the picker ranks the best-fit database families — PostgreSQL is the default until a requirement forces something else. See module M35 for the full decision framework.',
                    uk: 'Спершу вимоги, потім движок. Дайте відповідь на кілька питань про ваш workload — і picker проранжує найкращі родини баз даних. PostgreSQL — default, доки вимога не змусить узяти інше. Повний фреймворк рішення — у модулі M35.',
                  })}
                </p>
                <DbPicker />
              </div>
            )}
          </Suspense>
          <Footer />
        </main>
      </div>
    </div>
  );
}
