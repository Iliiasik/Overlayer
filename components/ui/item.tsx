import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ItemProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export function Item({ className, variant = 'default', ...props }: ItemProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left',
        variant === 'outline' && 'border bg-card',
        className,
      )}
      {...props}
    />
  );
}

export function ItemMedia({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex shrink-0 items-center justify-center', className)} {...props} />;
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />;
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm font-medium leading-snug', className)} {...props} />;
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-xs text-muted-foreground', className)} {...props} />;
}

export function ItemActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex shrink-0 items-center gap-1', className)} {...props} />;
}
