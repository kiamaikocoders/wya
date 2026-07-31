import React, { useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  WEEKDAY_OPTIONS,
  buildRecurrenceRule,
  defaultRecurrenceFormState,
  expandOccurrenceDates,
  formatRecurrenceSummary,
  weekdayFromDate,
  type RecurrenceFormState,
  type Weekday,
} from '@/lib/recurrence';

type Props = {
  value: RecurrenceFormState;
  onChange: (next: RecurrenceFormState) => void;
  startDate: string;
  /** Optional multi-day span end for each occurrence (YYYY-MM-DD) */
  occurrenceEndDate?: string;
  className?: string;
  /** Admin tokens vs default app inputs */
  fieldClassName?: string;
  labelClassName?: string;
};

/**
 * Shared recurrence controls for admin and organiser create-event flows.
 */
export function RecurrenceFields({
  value,
  onChange,
  startDate,
  occurrenceEndDate,
  className,
  fieldClassName,
  labelClassName,
}: Props) {
  const fieldClass = fieldClassName ?? 'h-11';
  const labelClass = labelClassName ?? 'text-sm font-medium';

  // Keep weekly default weekday in sync with start date when empty / single auto day
  useEffect(() => {
    if (value.frequency !== 'weekly' || !startDate) return;
    if (value.byweekday.length > 0) return;
    onChange({ ...value, byweekday: weekdayFromDate(startDate) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed when empty
  }, [value.frequency, startDate]);

  const preview = useMemo(() => {
    if (value.frequency === 'none' || !startDate) return null;
    try {
      const rule = buildRecurrenceRule(value, startDate, occurrenceEndDate);
      if (!rule) return null;
      const dates = expandOccurrenceDates(rule);
      return {
        summary: formatRecurrenceSummary(rule, dates.length),
        count: dates.length,
        first: dates[0],
        last: dates[dates.length - 1],
      };
    } catch {
      return null;
    }
  }, [value, startDate, occurrenceEndDate]);

  const toggleWeekday = (day: Weekday) => {
    const has = value.byweekday.includes(day);
    const byweekday = has
      ? value.byweekday.filter((d) => d !== day)
      : [...value.byweekday, day].sort((a, b) => a - b);
    onChange({ ...value, byweekday });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1.5">
        <Label className={labelClass}>Repeats</Label>
        <Select
          value={value.frequency}
          onValueChange={(frequency: RecurrenceFormState['frequency']) => {
            const next: RecurrenceFormState = {
              ...value,
              frequency,
              byweekday:
                frequency === 'weekly'
                  ? value.byweekday.length
                    ? value.byweekday
                    : weekdayFromDate(startDate)
                  : value.byweekday,
            };
            if (frequency !== 'none' && next.endMode === 'until' && !next.untilDate && startDate) {
              // Sensible default: ~3 months ahead
              const d = new Date(`${startDate.slice(0, 10)}T12:00:00`);
              d.setMonth(d.getMonth() + 3);
              next.untilDate = d.toISOString().slice(0, 10);
            }
            onChange(next);
          }}
        >
          <SelectTrigger className={fieldClass}>
            <SelectValue placeholder="Does not repeat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.frequency !== 'none' ? (
        <>
          {value.frequency === 'weekly' ? (
            <div className="space-y-1.5">
              <Label className={labelClass}>On days</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((day) => {
                  const active = value.byweekday.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-muted/40 text-muted-foreground',
                      )}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>Ends</Label>
              <Select
                value={value.endMode}
                onValueChange={(endMode: RecurrenceFormState['endMode']) =>
                  onChange({ ...value, endMode })
                }
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="until">On date</SelectItem>
                  <SelectItem value="count">After N occurrences</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {value.endMode === 'until' ? (
              <div className="space-y-1.5">
                <Label htmlFor="series-until" className={labelClass}>
                  End date
                </Label>
                <Input
                  id="series-until"
                  type="date"
                  min={startDate || undefined}
                  value={value.untilDate}
                  onChange={(e) => onChange({ ...value, untilDate: e.target.value })}
                  className={fieldClass}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="series-count" className={labelClass}>
                  Occurrences
                </Label>
                <Input
                  id="series-count"
                  type="number"
                  min={1}
                  max={52}
                  value={value.count}
                  onChange={(e) =>
                    onChange({ ...value, count: parseInt(e.target.value, 10) || 1 })
                  }
                  className={fieldClass}
                />
              </div>
            )}
          </div>

          {preview ? (
            <p className="rounded-[10px] bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
              {preview.summary}
              {preview.first && preview.last && preview.count > 1
                ? ` · ${preview.first} → ${preview.last}`
                : ''}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Set a start date and series end to preview occurrences (max 52).
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

export { defaultRecurrenceFormState };
export type { RecurrenceFormState };
