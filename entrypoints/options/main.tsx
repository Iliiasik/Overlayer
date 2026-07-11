import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import '@/assets/fonts.css';
import '@/assets/tailwind.css';
import { ThemeRoot } from '@/components/theme-root';
import { initI18n } from '@/lib/i18n';
import { App } from './app';

void initI18n().then((i18nInstance) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <I18nextProvider i18n={i18nInstance}>
      <ThemeRoot className="min-h-screen">
        <App />
      </ThemeRoot>
    </I18nextProvider>,
  );
});
