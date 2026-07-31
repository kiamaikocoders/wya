import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';

/** JS getDay(): 0=Sunday … 6=Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export type RecurrenceEndMode = 'until' | 'count';

export interface RecurrenceFormState {
  frequency: RecurrenceFrequency;
  interval: number;
  byweekday: Weekday[];
  endMode: RecurrenceEndMode;
  untilDate: string; // YYYY-MM-DD
  count: number;
}

export interface RecurrenceRule {
  frequency: Exclude<RecurrenceFrequency, 'none'>;
  interval: number;
  byweekday: Weekday[] | null;
  dtstart: string; // YYYY-MM-DD
  untilDate: string | null;
  occurrenceCount: number | null;
  durationDays: number;
}

export const MAX_SERIES_OCCURRENCES = 52;

export const WEEKDAY_OPTIONS: { value: Weekday; label: string; short: string }[] = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

export const defaultRecurrenceFormState = (): RecurrenceFormState => ({
  frequency: 'none',
  interval: 1,
  byweekday: [],
  endMode: 'until',
  untilDate: '',
  count: 12,
});

/**
 * Parse a YYYY-MM-DD (or datetime) string as a local calendar day.
 */
export function parseLocalDate(value: string): Date {
  const day = value.slice(0, 10);
  return parseISO(`${day}T12:00:00`);
}

/**
 * Default weekday selection from a start date (single weekday).
 */
export function weekdayFromDate(dateStr: string): Weekday[] {
  if (!dateStr) return [];
  return [getDay(parseLocalDate(dateStr)) as Weekday];
}

/**
 * Inclusive day span between from/to YYYY-MM-DD (min 1).
 */
export function durationDaysFromRange(fromDate: string, toDate?: string | null): number {
  if (!fromDate) return 1;
  if (!toDate || toDate < fromDate) return 1;
  const start = parseLocalDate(fromDate);
  const end = parseLocalDate(toDate);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

/**
 * Build a persisted rule from form state, or null when frequency is none.
 */
export function buildRecurrenceRule(
  form: RecurrenceFormState,
  startDate: string,
  endDate?: string | null,
): RecurrenceRule | null {
  if (form.frequency === 'none' || !startDate) return null;

  const durationDays = durationDaysFromRange(startDate, endDate);
  const byweekday =
    form.frequency === 'weekly'
      ? (form.byweekday.length > 0 ? form.byweekday : weekdayFromDate(startDate))
      : null;

  const untilDate =
    form.endMode === 'until' && form.untilDate ? form.untilDate.slice(0, 10) : null;
  const occurrenceCount =
    form.endMode === 'count'
      ? Math.min(MAX_SERIES_OCCURRENCES, Math.max(1, Math.floor(form.count || 1)))
      : null;

  if (!untilDate && !occurrenceCount) {
    throw new Error('Choose when the series ends (a date or number of occurrences)');
  }

  if (untilDate && untilDate < startDate.slice(0, 10)) {
    throw new Error('Series end date must be on or after the first event date');
  }

  return {
    frequency: form.frequency,
    interval: Math.max(1, Math.floor(form.interval || 1)),
    byweekday,
    dtstart: startDate.slice(0, 10),
    untilDate,
    occurrenceCount,
    durationDays,
  };
}

/**
 * Expand a recurrence rule into occurrence start dates (YYYY-MM-DD), capped.
 */
export function expandOccurrenceDates(rule: RecurrenceRule): string[] {
  const start = startOfDay(parseLocalDate(rule.dtstart));
  const until = rule.untilDate ? startOfDay(parseLocalDate(rule.untilDate)) : null;
  const maxCount = Math.min(
    MAX_SERIES_OCCURRENCES,
    rule.occurrenceCount ?? MAX_SERIES_OCCURRENCES,
  );

  const dates: string[] = [];

  if (rule.frequency === 'daily') {
    let cursor = start;
    while (dates.length < maxCount) {
      if (until && isAfter(cursor, until)) break;
      dates.push(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, rule.interval);
    }
    return dates;
  }

  if (rule.frequency === 'weekly') {
    const days = [...(rule.byweekday ?? weekdayFromDate(rule.dtstart))].sort(
      (a, b) => a - b,
    );
    const startWeekSunday = addDays(start, -getDay(start));
    const maxWeeks = maxCount * Math.max(rule.interval, 1) * 8;
    for (let week = 0; week < maxWeeks && dates.length < maxCount; week++) {
      if (week % rule.interval !== 0) continue;
      const weekSunday = addWeeks(startWeekSunday, week);
      for (const wd of days) {
        const candidate = addDays(weekSunday, wd);
        if (isBefore(candidate, start)) continue;
        if (until && isAfter(candidate, until)) {
          return dates;
        }
        dates.push(format(candidate, 'yyyy-MM-dd'));
        if (dates.length >= maxCount) return dates;
      }
    }
    return dates;
  }

  // monthly: same day-of-month, clamped by month length via date-fns addMonths
  let cursor = start;
  while (dates.length < maxCount) {
    if (until && isAfter(cursor, until)) break;
    dates.push(format(cursor, 'yyyy-MM-dd'));
    cursor = addMonths(cursor, rule.interval);
  }
  return dates;
}

/**
 * End date (YYYY-MM-DD) for an occurrence given duration_days.
 */
export function occurrenceEndDate(startDate: string, durationDays: number): string | null {
  if (durationDays <= 1) return null;
  return format(addDays(parseLocalDate(startDate), durationDays - 1), 'yyyy-MM-dd');
}

/**
 * Human-readable summary for review / admin UI.
 */
export function formatRecurrenceSummary(
  rule: Pick<
    RecurrenceRule,
    'frequency' | 'interval' | 'byweekday' | 'untilDate' | 'occurrenceCount'
  >,
  occurrenceTotal?: number,
): string {
  let base = '';
  if (rule.frequency === 'daily') {
    base = rule.interval > 1 ? `Every ${rule.interval} days` : 'Daily';
  } else if (rule.frequency === 'weekly') {
    const names = (rule.byweekday ?? [])
      .map((d) => WEEKDAY_OPTIONS.find((o) => o.value === d)?.short)
      .filter(Boolean);
    const dayPart = names.length ? ` on ${names.join(', ')}` : '';
    base =
      rule.interval > 1
        ? `Every ${rule.interval} weeks${dayPart}`
        : `Weekly${dayPart}`;
  } else {
    base = rule.interval > 1 ? `Every ${rule.interval} months` : 'Monthly';
  }

  const end = rule.untilDate
    ? ` until ${rule.untilDate}`
    : rule.occurrenceCount
      ? ` · ${rule.occurrenceCount} times`
      : '';

  const count =
    occurrenceTotal != null && occurrenceTotal > 0
      ? ` · ${occurrenceTotal} occurrence${occurrenceTotal === 1 ? '' : 's'}`
      : '';

  return `${base}${end}${count}`;
}

/**
 * Compact label for admin badges.
 */
export function formatRecurrenceBadge(
  frequency: string | null | undefined,
  occurrenceTotal?: number | null,
): string {
  if (!frequency) return 'One-time';
  const label =
    frequency === 'daily'
      ? 'Daily'
      : frequency === 'weekly'
        ? 'Weekly'
        : frequency === 'monthly'
          ? 'Monthly'
          : 'Recurring';
  if (occurrenceTotal && occurrenceTotal > 1) {
    return `${label} · ${occurrenceTotal} dates`;
  }
  return label;
}
