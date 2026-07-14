import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="glass-card flex flex-col rounded-2xl p-6 text-card-foreground">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-foreground/70">{description}</p>}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

interface SettingRowProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description && <span className="text-sm text-foreground/70">{description}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
