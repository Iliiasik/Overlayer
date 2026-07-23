import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui/app-icon';
import { BannerLogo } from '@/components/ui/banner-logo';
import { ImpressionBlob, impressionPaper } from '@/components/ui/impression-background';
import { useSettings } from '@/hooks/use-settings';
import { Toaster } from '@/components/ui/toaster';
import { DataSection } from './sections/data-section';
import { GeneralSection } from './sections/general-section';
import { PagesSection } from './sections/pages-section';

export function App() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: impressionPaper(settings.theme) }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative isolate flex flex-col gap-6">
          <ImpressionBlob className="-bottom-40 -top-10 left-[calc(50%-50vw)] right-[calc(50%-50vw)]" />
          <header className="glass-card flex flex-col items-center gap-3 rounded-2xl px-8 py-6">
            <div className="flex w-full items-center justify-center gap-4">
              <AppIcon className="h-14 w-14 shrink-0" />
              <BannerLogo className="max-w-xs" />
            </div>
            <p className="text-center text-sm text-foreground/70">{t('options.subtitle')}</p>
          </header>
          <div className="grid gap-6 lg:grid-cols-[1.618fr_1fr]">
            <GeneralSection />
            <DataSection />
          </div>
        </div>
        <div className="relative">
          <PagesSection />
        </div>
        <footer className="flex flex-col items-center gap-3 pb-4 pt-2 text-center text-xs text-foreground/70">
          <span>
            Overlayer 1.0.0 · {t('options.freeOpenSource')} · {t('options.offlineNote')}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://github.com/Iliiasik/Overlayer"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors hover:bg-accent hover:text-foreground"
            >
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              {t('options.sourceCode')}
            </a>
            <a
              href="https://github.com/Iliiasik/Overlayer/issues"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors hover:bg-accent hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {t('options.reportIssue')}
            </a>
          </div>
          <span>{t('options.createdBy', { author: 'Iliias Baiyshev' })} · © 2026</span>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
