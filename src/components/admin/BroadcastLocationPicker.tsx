import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { adminPlatformService } from '@/lib/admin-platform-service';
import { cn } from '@/lib/utils';

/**
 * Multi-select of profile / onboarding locations for location-targeted broadcasts.
 */
export function BroadcastLocationPicker({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ['admin-broadcast-locations'],
    queryFn: () => adminPlatformService.listBroadcastLocations(),
    staleTime: 60_000,
  });

  const selected = new Set(value);

  const toggle = (loc: string, checked: boolean) => {
    if (checked) onChange([...value, loc].filter((v, i, a) => a.indexOf(v) === i));
    else onChange(value.filter((v) => v !== loc));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>Locations</Label>
      <p className="text-[11px] text-muted-foreground">
        Users whose profile location, home base, or preferred cities match any selected label.
      </p>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading locations…</p>
      ) : (
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] p-3">
          {options.map((loc) => {
            const id = `broadcast-loc-${loc}`;
            const checked = selected.has(loc);
            return (
              <label
                key={loc}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-[hsl(var(--admin-surface-2))]"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(v) => toggle(loc, v === true)}
                />
                <span className="truncate text-foreground">{loc}</span>
              </label>
            );
          })}
        </div>
      )}
      {value.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">{value.length} selected</p>
      ) : (
        <p className="text-[11px] text-[hsl(var(--admin-warning))]">
          Select at least one location
        </p>
      )}
    </div>
  );
}
