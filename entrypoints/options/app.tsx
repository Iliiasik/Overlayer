import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui/app-icon';
import { BannerLogo } from '@/components/ui/banner-logo';
import { RisoBackground } from '@/components/ui/riso-background';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DataSection } from './sections/data-section';
import { GeneralSection } from './sections/general-section';
import { PagesSection } from './sections/pages-section';

export function App() {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={350}>
      <div className="min-h-screen">
        <RisoBackground />
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
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
          <PagesSection />
          <footer className="pb-4 pt-2 text-center text-xs text-foreground/70">
            Overlayer 1.0.0 · {t('options.offlineNote')}
          </footer>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
