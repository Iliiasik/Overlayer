import { Eye, EyeOff, PenTool, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { browser } from 'wxt/browser';
import { AppIcon } from '@/components/ui/app-icon';
import { BannerLogo } from '@/components/ui/banner-logo';
import { Button } from '@/components/ui/button';
import { MessageType, sendToActiveTab, type ExtensionState } from '@/lib/messaging';

export function App() {
  const { t } = useTranslation();
  const [state, setState] = useState<ExtensionState | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    void sendToActiveTab<ExtensionState>({ type: MessageType.GetState })
      .then(setState)
      .catch(() => setUnavailable(true));
  }, []);

  const toggleCanvas = async () => {
    try {
      await sendToActiveTab({ type: MessageType.ToggleCanvas });
      window.close();
    } catch {
      setUnavailable(true);
    }
  };

  const toggleMarks = async () => {
    try {
      setState(await sendToActiveTab<ExtensionState>({ type: MessageType.ToggleMarks }));
    } catch {
      setUnavailable(true);
    }
  };

  const canvasLabel =
    state == null
      ? t('popup.toggle')
      : state.canvasOpen
        ? t('popup.closeCanvas')
        : t('popup.openCanvas');

  return (
    <div className="flex w-72 flex-col bg-background">
      <div className="flex items-center justify-center gap-2.5 border-b p-4">
        <AppIcon className="h-9 w-9 shrink-0" />
        <BannerLogo className="w-40" />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <Button className="h-10 w-full" disabled={unavailable} onClick={() => void toggleCanvas()}>
          <PenTool className="h-4 w-4" />
          {canvasLabel}
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full"
          disabled={unavailable || (state?.markCount ?? 0) === 0}
          onClick={() => void toggleMarks()}
        >
          {state?.marksVisible === false ? (
            <>
              <Eye className="h-4 w-4" />
              {t('popup.showHighlights')}
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              {t('popup.hideHighlights')}
            </>
          )}
        </Button>
        {unavailable && (
          <p className="text-center text-xs text-destructive">{t('popup.unavailable')}</p>
        )}
      </div>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => void browser.runtime.openOptionsPage()}
        >
          <Settings className="h-4 w-4" />
          {t('popup.options')}
        </Button>
      </div>
    </div>
  );
}
