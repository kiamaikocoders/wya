import React, { type ComponentType, type ReactNode, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

export type AdminSubnavItem = {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  danger?: boolean;
};

/**
 * Figma Admin section pattern: page header + card subnav + one panel.
 * Active section synced to ?tab= for deep links.
 */
export function useAdminSectionTab<T extends string>(
  items: { id: T }[],
  defaultId: T
): [T, (id: T) => void] {
  const [params, setParams] = useSearchParams();
  const valid = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const fromUrl = params.get('tab');
  const active = (fromUrl && valid.has(fromUrl as T) ? fromUrl : defaultId) as T;

  const setActive = (id: T) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (!fromUrl || !valid.has(fromUrl as T)) {
      const next = new URLSearchParams(params);
      next.set('tab', defaultId);
      setParams(next, { replace: true });
    }
    // intentionally only on mount / default change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultId]);

  return [active, setActive];
}

export function AdminSubnav({
  items,
  active,
  onChange,
}: {
  items: AdminSubnavItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <nav className="hidden w-[200px] shrink-0 flex-col gap-1.5 rounded-[14px] border border-border bg-card p-3 lg:flex">
        {items.map(({ id, label, danger }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors',
                isActive && !danger && 'bg-primary font-semibold text-primary-foreground',
                isActive && danger && 'bg-destructive font-semibold text-destructive-foreground',
                !isActive && !danger && 'font-medium text-muted-foreground hover:bg-[hsl(var(--admin-surface))] hover:text-foreground',
                !isActive && danger && 'font-medium text-destructive hover:bg-destructive/10'
              )}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <div className="scrollbar-hide flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
        {items.map(({ id, label, danger }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-medium transition-colors',
                isActive && !danger && 'bg-primary text-primary-foreground',
                isActive && danger && 'bg-destructive text-destructive-foreground',
                !isActive && !danger && 'border border-border bg-[hsl(var(--admin-surface))] text-foreground',
                !isActive && danger && 'bg-destructive/10 text-destructive'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function AdminSectionLayout({
  title,
  subtitle,
  icon,
  actions,
  items,
  active,
  onChange,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  items: AdminSubnavItem[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <AdminPageShell
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
      contentClassName="!space-y-0 !p-5 sm:!px-7 sm:!py-5"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
        <AdminSubnav items={items} active={active} onChange={onChange} />
        <div className="min-w-0 flex-1 space-y-3.5">{children}</div>
      </div>
    </AdminPageShell>
  );
}

export function AdminPanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
