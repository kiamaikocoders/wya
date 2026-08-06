import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Draft ticket tier before the event exists (no DB id yet). */
export type TicketTierDraft = {
  /** Stable client key for React lists */
  key: string;
  name: string;
  price: number;
  capacity: number | '';
};

export const TICKET_TIER_PRESETS = [
  'Regular',
  'Early Bird',
  'VIP',
  'Early Bird VIP',
] as const;

/**
 * Create a blank ticket tier draft.
 */
export function createEmptyTicketTier(name = 'Regular', price = 0): TicketTierDraft {
  return {
    key: `tier-${Math.random().toString(36).slice(2, 10)}`,
    name,
    price,
    capacity: '',
  };
}

type EventTicketTiersEditorProps = {
  tiers: TicketTierDraft[];
  onChange: (tiers: TicketTierDraft[]) => void;
  fieldClass?: string;
  /** When true, hide capacity column (event-level capacity only). */
  hideCapacity?: boolean;
};

/**
 * Admin UI for configuring multiple ticket types / prices for an event.
 */
export const EventTicketTiersEditor: React.FC<EventTicketTiersEditorProps> = ({
  tiers,
  onChange,
  fieldClass = 'h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]',
  hideCapacity = false,
}) => {
  const updateTier = (key: string, patch: Partial<TicketTierDraft>) => {
    onChange(tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const removeTier = (key: string) => {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((t) => t.key !== key));
  };

  const addTier = (name?: string) => {
    onChange([...tiers, createEmptyTicketTier(name || 'Custom', 0)]);
  };

  const unusedPresets = TICKET_TIER_PRESETS.filter(
    (p) => !tiers.some((t) => t.name.toLowerCase() === p.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label className="text-xs font-semibold">Ticket types & pricing</Label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Add Early Bird, VIP, Regular, or custom tiers. Display price uses the lowest active tier.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => addTier()}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add type
        </Button>
      </div>

      {unusedPresets.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {unusedPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addTier(preset)}
              className="rounded-full border border-border bg-[hsl(var(--admin-surface-2))] px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              + {preset}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {tiers.map((tier, index) => (
          <div
            key={tier.key}
            className="grid grid-cols-1 gap-2 rounded-[10px] border border-border/70 bg-[hsl(var(--admin-surface-2)/0.35)] p-2.5 sm:grid-cols-[1fr_7rem_6rem_auto] sm:items-end"
          >
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Type {index === 0 ? '(default)' : ''}
              </Label>
              <Input
                value={tier.name}
                onChange={(e) => updateTier(tier.key, { name: e.target.value })}
                placeholder="e.g. Early Bird"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Price (KES)
              </Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={tier.price === 0 ? 0 : tier.price || ''}
                onChange={(e) =>
                  updateTier(tier.key, {
                    price: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                placeholder="0"
                className={fieldClass}
              />
            </div>
            {!hideCapacity ? (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Cap
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.capacity}
                  onChange={(e) =>
                    updateTier(tier.key, {
                      capacity: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="∞"
                  className={fieldClass}
                />
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive',
                tiers.length <= 1 && 'pointer-events-none opacity-30',
              )}
              onClick={() => removeTier(tier.key)}
              disabled={tiers.length <= 1}
              aria-label="Remove ticket type"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
