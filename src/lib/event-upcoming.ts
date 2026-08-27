/** Nairobi calendar helpers for public event lists (home, browse, featured). */

export const EVENT_DISPLAY_TZ = 'Africa/Nairobi';

type EventDateFields = {
  date?: string | null;
  end_date?: string | null;
  series_id?: string | null;
};

export function todayYmd(
  now: Date = new Date(),
  timeZone: string = EVENT_DISPLAY_TZ,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function eventDayYmd(value?: string | null): string | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** Last public day of the event (end_date, else start date). */
export function eventLastYmd(event: EventDateFields): string | null {
  return eventDayYmd(event.end_date) ?? eventDayYmd(event.date);
}

/** True while the event has not finished (still on or after today in Nairobi). */
export function isEventUpcoming(
  event: EventDateFields,
  now: Date = new Date(),
): boolean {
  const last = eventLastYmd(event);
  if (!last) return false;
  return last >= todayYmd(now);
}

/**
 * For recurring series, keep only the next upcoming occurrence.
 * One-off events pass through unchanged.
 */
export function keepNextOccurrencePerSeries<T extends EventDateFields & { date?: string | null }>(
  events: T[],
): T[] {
  const upcoming = [...events].filter(isEventUpcoming).sort((a, b) => {
    const da = eventDayYmd(a.date) || '';
    const db = eventDayYmd(b.date) || '';
    return da.localeCompare(db);
  });

  const seenSeries = new Set<string>();
  const out: T[] = [];
  for (const event of upcoming) {
    if (event.series_id) {
      if (seenSeries.has(event.series_id)) continue;
      seenSeries.add(event.series_id);
    }
    out.push(event);
  }
  return out;
}
