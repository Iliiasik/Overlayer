import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  'aria-label'?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ...props
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg bg-muted p-1" {...props}>
      {options.map(({ value: optionValue, label, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors',
            value === optionValue
              ? 'bg-card font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}
