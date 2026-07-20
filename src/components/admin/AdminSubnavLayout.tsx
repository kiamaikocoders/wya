import React, { type ComponentType, type ReactNode, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

export type AdminSubnavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  danger?: boolean;
};

/**
 * Agribeta user-settings pattern for admin sections:
 * sticky page title + in-page sidebar (desktop) / pill strip (mobile) + ONE panel at a time.
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
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 p-3 lg:flex lg:min-h-[calc(100vh-8rem)]">
        {items.map(({ id, label, icon: Icon, danger }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                isActive && !danger && 'bg-primary text-primary-foreground shadow-sm',
                isActive && danger && 'bg-destructive text-destructive-foreground shadow-sm',
                !isActive && !danger && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                !isActive && danger && 'text-destructive hover:bg-destructive/10'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
        {items.map(({ id, label, icon: Icon, danger }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isActive && !danger && 'bg-primary text-primary-foreground',
                isActive && danger && 'bg-destructive text-destructive-foreground',
                !isActive && !danger && 'bg-muted text-muted-foreground',
                !isActive && danger && 'bg-destructive/10 text-destructive'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
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
  actions,
  items,
  active,
  onChange,
  children,
}: {
  title: string;
  subtitle?: string;
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
      actions={actions}
      contentClassName="!space-y-0 !p-0"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col border-t border-border lg:flex-row">
        <AdminSubnav items={items} active={active} onChange={onChange} />
        <div className="min-w-0 flex-1 space-y-5 p-5 sm:p-7 lg:px-8 lg:py-7">{children}</div>
      </div>
    </AdminPageShell>
  );
}

export function AdminPanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
