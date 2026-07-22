import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

export function ThemePortal({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  return createPortal(
    <div
      className={cn(
        'font-sans text-sm text-foreground',
        settings.theme === 'blue' && 'blue',
        settings.theme === 'space' && 'space',
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
