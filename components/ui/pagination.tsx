import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

function Pagination({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex items-center gap-1', className)} {...props} />;
}

function PaginationItem(props: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} />;
}

interface PaginationLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'border border-input bg-background font-medium'
          : 'hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="previous page" className={className} {...props}>
      <ChevronLeft className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="next page" className={className} {...props}>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-8 w-8 items-center justify-center text-muted-foreground', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
    </span>
  );
}

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(sorted[i]);
  }
  return result;
}

interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null;
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} onClick={() => onChange(page - 1)} />
        </PaginationItem>
        {pageNumbers(page, totalPages).map((entry, index) =>
          entry === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink isActive={entry === page} onClick={() => onChange(entry)}>
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext disabled={page === totalPages} onClick={() => onChange(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

interface Paged<T> {
  page: number;
  totalPages: number;
  slice: T[];
  setPage: (page: number) => void;
}

export function usePager<T>(items: T[], pageSize: number): Paged<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    totalPages,
    slice: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    setPage,
  };
}
