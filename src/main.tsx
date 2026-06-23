import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/tokens.css';
import './theme/global.css';
import './theme/components.css';
import { App } from './App';
import { AppStateProvider } from './components/AppStateProvider';
import { LangProvider } from './i18n/LangProvider';

const el = document.getElementById('root');
if (!el) throw new Error('Root element #root not found');

createRoot(el).render(
  <StrictMode>
    <LangProvider>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </LangProvider>
  </StrictMode>,
);
