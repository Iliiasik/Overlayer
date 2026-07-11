import type { ReactNode } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

interface ThemeRootProps {
  className?: string;
  children: ReactNode;
}

export function ThemeRoot({ className, children }: ThemeRootProps) {
  const { settings } = useSettings();

  return (
    <div
      className={cn(
        'font-sans text-sm text-foreground',
        settings.theme === 'blue' && 'blue',
        settings.theme === 'space' && 'space',
        className,
      )}
    >
      {children}
    </div>
  );
}
