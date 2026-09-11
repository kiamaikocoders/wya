import { format, isValid } from 'date-fns';

/** Calendar day from `events.date` — do not use the stored clock. */
export function parseEventCalendarDate(date?: string | null): Date | null {
  if (!date) return null;
  const datePart = date.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return isValid(parsed) ? parsed : null;
}

export function parseEventClock(time?: string | null): { hours: number; minutes: number } | null {
  if (!time || !/^\d{1,2}:\d{2}/.test(time.trim())) return null;
  const [hours, minutes] = time.trim().slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return { hours, minutes };
}

export function formatEventDateLabel(date?: string | null, pattern = 'EEE · d MMM'): string {
  const parsed = parseEventCalendarDate(date);
  return parsed ? format(parsed, pattern) : date?.slice(0, 10) || 'Date TBA';
}

export function formatEventTimeLabel(time?: string | null): string {
  const clock = parseEventClock(time);
  if (!clock) return '';
  return format(new Date(2000, 0, 1, clock.hours, clock.minutes), 'h:mm a');
}

export function formatEventDateTimeLabel(
  date?: string | null,
  time?: string | null,
  endTime?: string | null,
): string {
  const day = formatEventDateLabel(date, 'EEE · d MMM');
  const clock = formatEventTimeRange(time, endTime);
  return clock ? `${day}  ·  ${clock}` : day;
}

export function formatEventTimeRange(start?: string | null, end?: string | null): string {
  const from = formatEventTimeLabel(start);
  const to = formatEventTimeLabel(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}
