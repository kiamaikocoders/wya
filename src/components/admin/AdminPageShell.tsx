import React, { type ComponentType, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { getPageWindow } from '@/hooks/use-list-pagination';

/**
 * Figma Admin page chrome: header with icon badge + title/subtitle + actions.
 */
export function AdminPageShell({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn('flex min-h-full flex-col bg-background', className)}>
      <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-2))]">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
          <AdminNotificationBell />
          <AdminThemeToggle />
        </div>
      </header>
      <div className={cn('flex-1 space-y-3.5 px-5 py-[18px] sm:px-7 sm:py-5', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export function AdminSectionPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border border-border bg-card',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-3.5 py-3 sm:px-4">
          <div className="min-w-0">
            {title ? <h2 className="text-[13px] font-semibold text-foreground">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      <div className="p-3.5 sm:p-4">{children}</div>
    </div>
  );
}

export function AdminKpiTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** @deprecated kept for call-site compat; Figma KPIs use muted hint text */
  tone?: 'green' | 'orange' | 'red' | 'muted';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-[14px] border border-border bg-card p-3',
        className
      )}
    >
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="text-[20px] font-bold leading-none text-foreground lg:text-[22px]">
        {value}
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminStatusPill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'primary' | 'muted' | 'error';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[hsl(var(--admin-success))]'
      : tone === 'warning'
        ? 'text-[hsl(var(--admin-warning))]'
        : tone === 'primary'
          ? 'text-primary'
          : tone === 'error'
            ? 'text-destructive'
            : 'text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-[hsl(var(--admin-surface-2))] px-2 py-0.5 text-[11px] font-medium',
        toneClass
      )}
    >
      {children}
    </span>
  );
}

export function AdminRefreshButton({
  onClick,
  disabled,
}: {
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-[hsl(var(--admin-surface-2))] disabled:opacity-50"
    >
      Refresh
    </button>
  );
}

/** Figma list row: surface background, title/meta, trailing status/actions */
export function AdminListRow({
  title,
  meta,
  trailing,
  onClick,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5 text-left',
        onClick && 'transition-colors hover:bg-[hsl(var(--admin-surface-2))]',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-foreground">{title}</div>
        {meta ? <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</div> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </Comp>
  );
}

export function AdminKpiRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>
  );
}

export function AdminPrimaryPill({
  children,
  onClick,
  type = 'button',
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function AdminOutlinePill({
  children,
  onClick,
  active,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
        active
          ? 'bg-primary font-semibold text-primary-foreground'
          : 'border border-border bg-[hsl(var(--admin-surface))] text-foreground hover:bg-[hsl(var(--admin-surface-2))]',
        className
      )}
    >
      {children}
    </button>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-10 w-full min-w-0 flex-1 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
        className
      )}
    />
  );
}

export function AdminFilterSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function AdminTextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-11 w-full rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
        className
      )}
    />
  );
}

export function AdminTextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full resize-none rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
        className
      )}
    />
  );
}

/**
 * Compact pagination for admin list panels. Hidden when totalPages <= 1.
 */
export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const from =
    total != null && pageSize != null ? (page - 1) * pageSize + 1 : null;
  const to =
    total != null && pageSize != null
      ? Math.min(page * pageSize, total)
      : null;

  const window = getPageWindow(page, totalPages);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {from != null && to != null && total != null ? (
        <p className="text-[11px] text-muted-foreground">
          Showing {from.toLocaleString()}–{to.toLocaleString()} of{' '}
          {total.toLocaleString()}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Page {page} of {totalPages}
        </p>
      )}

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-1"
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-[hsl(var(--admin-surface))] px-2 text-[11px] font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        {window.map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              className="px-1 text-[11px] text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onPageChange(entry)}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[11px] font-semibold',
                entry === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-[hsl(var(--admin-surface))] text-foreground hover:bg-[hsl(var(--admin-surface-2))]'
              )}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-[hsl(var(--admin-surface))] px-2 text-[11px] font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}
