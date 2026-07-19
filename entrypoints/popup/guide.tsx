import {
  ArrowLeft,
  Download,
  FileText,
  Globe,
  Highlighter,
  Image,
  Link,
  StickyNote,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GuideProps {
  onBack: () => void;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Point({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
      <span>{children}</span>
    </p>
  );
}

function ToolbarMock() {
  return (
    <div className="flex w-max items-center gap-1 rounded-lg border bg-card p-1.5">
      {[Type, StickyNote, Link, Image].map((Icon, index) => (
        <span
          key={index}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground"
        >
          <Icon className="h-3 w-3" />
        </span>
      ))}
    </div>
  );
}

function DockMock() {
  return (
    <div className="flex items-center gap-2">
      {[StickyNote, Highlighter].map((Icon, index) => (
        <span
          key={index}
          className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        >
          <Icon className="h-3 w-3" />
          <span className="absolute -left-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-background px-0.5 text-[9px] font-semibold text-foreground shadow">
            {index + 2}
          </span>
        </span>
      ))}
    </div>
  );
}

export function Guide({ onBack }: GuideProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-72 flex-col bg-background">
      <div className="flex items-center gap-1 border-b p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t('common.cancel')}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{t('guide.title')}</span>
      </div>
      <ScrollArea className="max-h-[440px]">
        <div className="flex flex-col gap-4 p-3">
          <Section icon={StickyNote} title={t('guide.notes.title')}>
            <Point>{t('guide.notes.p1')}</Point>
            <Point>{t('guide.notes.p2')}</Point>
            <ToolbarMock />
            <Point>{t('guide.notes.p3')}</Point>
            <Point>{t('guide.notes.p4')}</Point>
          </Section>
          <Section icon={FileText} title={t('guide.pages.title')}>
            <Point>{t('guide.pages.p1')}</Point>
            <Point>{t('guide.pages.p2')}</Point>
            <Point>{t('guide.pages.p3')}</Point>
          </Section>
          <Section icon={Highlighter} title={t('guide.highlight.title')}>
            <Point>{t('guide.highlight.p1')}</Point>
            <p className="text-xs">
              <span
                className="rounded px-1 py-0.5"
                style={{
                  backgroundColor: '#e8c33f59',
                  textDecoration: 'underline dotted #e8c33f',
                  color: 'var(--foreground)',
                }}
              >
                {t('guide.highlight.sample')}
              </span>
            </p>
            <Point>{t('guide.highlight.p2')}</Point>
            <Point>{t('guide.highlight.p3')}</Point>
          </Section>
          <Section icon={Globe} title={t('guide.list.title')}>
            <DockMock />
            <Point>{t('guide.list.p1')}</Point>
            <Point>{t('guide.list.p2')}</Point>
            <Point>{t('guide.list.p3')}</Point>
          </Section>
          <Section icon={FileText} title={t('guide.manager.title')}>
            <Point>{t('guide.manager.p1')}</Point>
            <Point>{t('guide.manager.p2')}</Point>
          </Section>
          <Section icon={Download} title={t('guide.data.title')}>
            <Point>{t('guide.data.p1')}</Point>
            <Point>{t('guide.data.p2')}</Point>
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
}
