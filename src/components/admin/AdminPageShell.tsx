import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Agribeta-style admin page chrome: sticky title bar + roomy content.
 * One job per page — do not stack unrelated domains inside this shell.
 */
export function AdminPageShell({
  title,
  subtitle,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Override inner content padding (used by AdminSectionLayout). */
  contentClassName?: string;
}) {
  return (
    <div className={cn('min-h-full -mx-4 -mt-4 lg:-mx-6 lg:-mt-6', className)}>
      <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:flex-row sm:items-center sm:gap-4 sm:px-7 sm:py-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
        ) : null}
      </header>
      <div className={cn('space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-6', contentClassName)}>
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
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-foreground">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function AdminKpiTile({
  label,
  value,
  hint,
  tone = 'muted',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'green' | 'orange' | 'red' | 'muted';
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-500'
      : tone === 'orange'
        ? 'text-amber-500'
        : tone === 'red'
          ? 'text-red-500'
          : 'text-muted-foreground';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={cn('mt-1.5 text-lg font-semibold', toneClass)}>{value}</div>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
