/** Map pins: events whose last day is within the past N days, or still upcoming. */
export const MAP_EVENT_LOOKBACK_DAYS = 30;

type EventDateFields = {
  date?: string | null;
  end_date?: string | null;
};

function parseDay(value?: string | null): Date | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const parsed = new Date(`${day}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Last calendar day the event runs (end_date, else start date).
 */
export function getEventLastDay(event: EventDateFields): Date | null {
  return parseDay(event.end_date) ?? parseDay(event.date);
}

/**
 * Whether an event should appear on the public map:
 * last day is on/after (today − 30 days). All future events are included.
 */
export function isEventInMapDateWindow(
  event: EventDateFields,
  now: Date = new Date(),
  lookbackDays: number = MAP_EVENT_LOOKBACK_DAYS,
): boolean {
  const lastDay = getEventLastDay(event);
  if (!lastDay) return false;
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - lookbackDays,
  );
  windowStart.setHours(0, 0, 0, 0);
  return lastDay >= windowStart;
}
