import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui/app-icon';
import { BannerLogo } from '@/components/ui/banner-logo';
import { Toaster } from '@/components/ui/toaster';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { DataSection } from './sections/data-section';
import { GeneralSection } from './sections/general-section';
import { PagesSection } from './sections/pages-section';

export function App() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const space = settings.theme === 'space';

  return (
    <div
      className={cn('min-h-screen', space && 'bg-background')}
      style={space ? undefined : { backgroundColor: '#fefcff' }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-2 flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center gap-4">
            <AppIcon className="h-16 w-16 shrink-0" />
            <BannerLogo className="max-w-sm" />
          </div>
          <p className="text-center text-sm text-muted-foreground">{t('options.subtitle')}</p>
        </header>
        <GeneralSection />
        <PagesSection />
        <DataSection />
        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          Overlayer 1.0.0 · {t('options.offlineNote')}
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
