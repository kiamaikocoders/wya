import { supabase } from '@/integrations/supabase/client';
import {
  expandOccurrenceDates,
  occurrenceEndDate,
  type RecurrenceRule,
} from '@/lib/recurrence';

export interface EventSeriesRow {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval_count: number;
  byweekday: number[] | null;
  dtstart: string;
  until_date: string | null;
  occurrence_count: number | null;
  duration_days: number;
  time_of_day: string | null;
  timezone: string;
  created_by: string | null;
  organizer_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EventOccurrencePayload = {
  title: string;
  description?: string | null;
  category?: string | null;
  category_id?: number | null;
  location: string;
  location_url?: string | null;
  image_url?: string | null;
  capacity?: number | null;
  price?: number | null;
  tags?: string[] | null;
  performing_artists?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  ticket_link?: string | null;
  featured?: boolean | null;
  organizer_id?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  time?: string | null;
  end_time?: string | null;
};

export type CreateSeriesResult = {
  series: EventSeriesRow;
  events: Array<{ id: number; date: string; series_index: number; title: string }>;
  occurrenceDates: string[];
};

/**
 * Insert an event_series row and materialise each occurrence as an events row.
 */
export async function createEventSeriesWithOccurrences(options: {
  rule: RecurrenceRule;
  event: EventOccurrencePayload;
  categoryIds?: number[];
  createdBy?: string | null;
}): Promise<CreateSeriesResult> {
  const { rule, event, categoryIds = [], createdBy = null } = options;
  const occurrenceDates = expandOccurrenceDates(rule);

  if (occurrenceDates.length === 0) {
    throw new Error('No occurrences generated for this recurrence rule');
  }

  const timeOfDay = event.time?.trim() || '18:00:00';
  const endTimeOfDay = event.end_time?.trim() || null;
  const status = event.status || 'approved';

  const { data: series, error: seriesError } = await (supabase as any)
    .from('event_series')
    .insert({
      frequency: rule.frequency,
      interval_count: rule.interval,
      byweekday: rule.byweekday,
      dtstart: rule.dtstart,
      until_date: rule.untilDate,
      occurrence_count: rule.occurrenceCount,
      duration_days: rule.durationDays,
      time_of_day: timeOfDay,
      created_by: createdBy,
      organizer_id: event.organizer_id ?? createdBy,
    })
    .select()
    .single();

  if (seriesError) throw seriesError;

  const rows = occurrenceDates.map((day, index) => {
    const end = occurrenceEndDate(day, rule.durationDays);
    return {
      title: event.title,
      description: event.description ?? null,
      category: event.category ?? null,
      category_id: event.category_id ?? null,
      location: event.location,
      location_url: event.location_url ?? null,
      image_url: event.image_url ?? null,
      capacity: event.capacity ?? null,
      price: event.price ?? 0,
      tags: event.tags ?? [],
      performing_artists: event.performing_artists ?? [],
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      ticket_link: event.ticket_link ?? null,
      featured: event.featured ?? false,
      organizer_id: event.organizer_id ?? null,
      status,
      time: timeOfDay,
      end_time: endTimeOfDay,
      date: new Date(`${day}T12:00:00`).toISOString(),
      end_date: end,
      series_id: series.id,
      series_index: index,
    };
  });

  const { data: events, error: eventsError } = await (supabase as any)
    .from('events')
    .insert(rows)
    .select('id, date, series_index, title');

  if (eventsError) {
    // Best-effort cleanup so a failed insert does not leave an orphan series
    await (supabase as any).from('event_series').delete().eq('id', series.id);
    throw eventsError;
  }

  if (categoryIds.length > 0 && events?.length) {
    const junction = events.flatMap((ev: { id: number }) =>
      categoryIds.map((category_id) => ({ event_id: ev.id, category_id })),
    );
    const { error: catError } = await supabase.from('event_categories').insert(junction);
    if (catError) {
      console.error('Failed to persist series event categories:', catError);
    }
  }

  return {
    series: series as EventSeriesRow,
    events: events || [],
    occurrenceDates,
  };
}

/**
 * Load series metadata for a list of series ids.
 */
export async function getEventSeriesByIds(
  seriesIds: string[],
): Promise<
  Map<string, EventSeriesRow & { occurrence_total: number; cancelled_total: number }>
> {
  const map = new Map<
    string,
    EventSeriesRow & { occurrence_total: number; cancelled_total: number }
  >();
  const unique = [...new Set(seriesIds.filter(Boolean))];
  if (unique.length === 0) return map;

  const { data: seriesRows, error } = await (supabase as any)
    .from('event_series')
    .select('*')
    .in('id', unique);

  if (error) throw error;

  const { data: counts, error: countError } = await (supabase as any)
    .from('events')
    .select('series_id, cancelled_at')
    .in('series_id', unique);

  if (countError) throw countError;

  const totalMap = new Map<string, number>();
  const cancelledMap = new Map<string, number>();
  (counts || []).forEach((row: { series_id: string; cancelled_at?: string | null }) => {
    totalMap.set(row.series_id, (totalMap.get(row.series_id) || 0) + 1);
    if (row.cancelled_at) {
      cancelledMap.set(row.series_id, (cancelledMap.get(row.series_id) || 0) + 1);
    }
  });

  (seriesRows || []).forEach((row: EventSeriesRow) => {
    map.set(row.id, {
      ...row,
      occurrence_total: totalMap.get(row.id) || 0,
      cancelled_total: cancelledMap.get(row.id) || 0,
    });
  });

  return map;
}

export type SeriesEditScope = 'this' | 'future' | 'all';

/** Fields that may propagate across series occurrences. */
const SERIES_SHARED_FIELDS = [
  'title',
  'description',
  'category',
  'category_id',
  'location',
  'location_url',
  'image_url',
  'capacity',
  'price',
  'tags',
  'performing_artists',
  'latitude',
  'longitude',
  'ticket_link',
  'featured',
  'time',
  'end_time',
] as const;

/** Date fields only ever apply to the current occurrence. */
const OCCURRENCE_ONLY_FIELDS = ['date', 'end_date'] as const;

function pickSharedUpdates(eventData: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SERIES_SHARED_FIELDS) {
    if (key in eventData) out[key] = eventData[key];
  }
  return out;
}

function pickOccurrenceOnlyUpdates(eventData: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of OCCURRENCE_ONLY_FIELDS) {
    if (key in eventData) out[key] = eventData[key];
  }
  return out;
}

async function syncCategoriesForEvents(eventIds: number[], categoryIds: number[]): Promise<void> {
  if (eventIds.length === 0) return;
  await supabase.from('event_categories').delete().in('event_id', eventIds);
  if (categoryIds.length === 0) return;
  const rows = eventIds.flatMap((event_id) =>
    categoryIds.map((category_id) => ({ event_id, category_id })),
  );
  const { error } = await supabase.from('event_categories').insert(rows);
  if (error) throw error;
}

/**
 * Update an event, optionally propagating shared fields across a series.
 * Date/end_date always apply only to the selected occurrence.
 */
export async function updateEventWithSeriesScope(options: {
  eventId: number;
  eventData: Record<string, unknown>;
  categoryIds?: number[];
  scope?: SeriesEditScope;
}): Promise<{ updatedIds: number[]; scope: SeriesEditScope }> {
  const { eventId, eventData, categoryIds, scope = 'this' } = options;

  const { data: current, error: loadError } = await (supabase as any)
    .from('events')
    .select('id, series_id, series_index')
    .eq('id', eventId)
    .single();

  if (loadError) throw loadError;

  const now = new Date().toISOString();
  const shared = pickSharedUpdates(eventData);
  const occurrenceOnly = pickOccurrenceOnlyUpdates(eventData);

  // One-time event, or explicit this-only
  if (!current.series_id || scope === 'this') {
    const { data, error } = await (supabase as any)
      .from('events')
      .update({ ...shared, ...occurrenceOnly, updated_at: now })
      .eq('id', eventId)
      .select('id');

    if (error) throw error;
    if (!data?.length) {
      throw new Error(
        'No rows were updated. You may not have permission to update this event, or the event may not exist.',
      );
    }

    if (categoryIds) {
      await syncCategoriesForEvents([eventId], categoryIds);
    }

    return { updatedIds: [eventId], scope: 'this' };
  }

  let siblingQuery = (supabase as any)
    .from('events')
    .select('id, series_index')
    .eq('series_id', current.series_id);

  if (scope === 'future') {
    siblingQuery = siblingQuery.gte('series_index', current.series_index ?? 0);
  }

  const { data: siblings, error: sibError } = await siblingQuery;
  if (sibError) throw sibError;

  const targetIds: number[] = (siblings || []).map((row: { id: number }) => row.id);
  if (!targetIds.includes(eventId)) targetIds.push(eventId);

  const { error: sharedError } = await (supabase as any)
    .from('events')
    .update({ ...shared, updated_at: now })
    .in('id', targetIds);

  if (sharedError) throw sharedError;

  // Date shifts stay on this occurrence only
  if (Object.keys(occurrenceOnly).length > 0) {
    const { error: dateError } = await (supabase as any)
      .from('events')
      .update({ ...occurrenceOnly, updated_at: now })
      .eq('id', eventId);
    if (dateError) throw dateError;
  }

  if (categoryIds) {
    await syncCategoriesForEvents(targetIds, categoryIds);
  }

  return { updatedIds: targetIds, scope };
}

/**
 * Soft-cancel a single occurrence (keeps the rest of the series).
 */
export async function cancelEventOccurrence(eventId: number): Promise<void> {
  const { data: existing } = await (supabase as any)
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .maybeSingle();

  const { error } = await (supabase as any)
    .from('events')
    .update({ cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;

  if (existing) {
    try {
      const { notifyEventTicketHolders } = await import('./email/product-email');
      await notifyEventTicketHolders({
        eventId: existing.id,
        eventTitle: existing.title,
        type: 'event_cancelled',
        title: 'Event cancelled',
        message: `"${existing.title}" has been cancelled.`,
      });
    } catch (e) {
      console.warn('Cancel occurrence notify failed', e);
    }
  }
}

/**
 * Restore a previously cancelled occurrence.
 */
export async function restoreEventOccurrence(eventId: number): Promise<void> {
  const { error } = await (supabase as any)
    .from('events')
    .update({ cancelled_at: null, updated_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
}

/**
 * Cancel this occurrence and all later ones in the same series.
 */
export async function cancelFutureOccurrences(eventId: number): Promise<number> {
  const { data: current, error } = await (supabase as any)
    .from('events')
    .select('id, series_id, series_index')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  if (!current.series_id) {
    await cancelEventOccurrence(eventId);
    return 1;
  }

  const now = new Date().toISOString();
  const { data, error: updateError } = await (supabase as any)
    .from('events')
    .update({ cancelled_at: now, updated_at: now })
    .eq('series_id', current.series_id)
    .gte('series_index', current.series_index ?? 0)
    .is('cancelled_at', null)
    .select('id');

  if (updateError) throw updateError;
  return data?.length ?? 0;
}

/**
 * Approve every occurrence in the same series (or a single event if not in a series).
 */
export async function approveEventOrSeries(eventId: number): Promise<void> {
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select('id, series_id')
    .eq('id', eventId)
    .single();

  if (error) throw error;

  if (event.series_id) {
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({ status: 'approved', featured: true })
      .eq('series_id', event.series_id);
    if (updateError) throw updateError;
    return;
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'approved', featured: true })
    .eq('id', eventId);
  if (updateError) throw updateError;
}

/**
 * Reject every occurrence in the same series (or a single event if not in a series).
 */
export async function rejectEventOrSeries(eventId: number): Promise<void> {
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select('id, series_id')
    .eq('id', eventId)
    .single();

  if (error) throw error;

  if (event.series_id) {
    const { error: updateError } = await (supabase as any)
      .from('events')
      .update({ status: 'rejected' })
      .eq('series_id', event.series_id);
    if (updateError) throw updateError;
    return;
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'rejected' })
    .eq('id', eventId);
  if (updateError) throw updateError;
}

/**
 * Permanently delete an event, or an entire series when the event belongs to one.
 */
export async function deleteEventOrSeries(eventId: number): Promise<{ deletedCount: number }> {
  const { data: event, error } = await (supabase as any)
    .from('events')
    .select('id, title, series_id')
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!event) {
    throw new Error(`Event not found (id=${eventId}).`);
  }

  if (event.series_id) {
    const { data: deleted, error: delError } = await (supabase as any)
      .from('events')
      .delete()
      .eq('series_id', event.series_id)
      .select('id');

    if (delError) throw delError;
    if (!deleted?.length) {
      throw new Error('Delete was blocked. You may not have permission to delete this series.');
    }

    const { error: seriesError } = await (supabase as any)
      .from('event_series')
      .delete()
      .eq('id', event.series_id);

    if (seriesError) throw seriesError;

    try {
      const { notifyEventTicketHolders } = await import('./email/product-email');
      await notifyEventTicketHolders({
        eventId: event.id,
        eventTitle: event.title,
        type: 'event_cancelled',
        title: 'Event series removed',
        message: `"${event.title}" and all its dates have been removed.`,
      });
    } catch (e) {
      console.warn('Series delete notify failed', e);
    }

    return { deletedCount: deleted.length };
  }

  try {
    const { notifyEventTicketHolders } = await import('./email/product-email');
    await notifyEventTicketHolders({
      eventId: event.id,
      eventTitle: event.title,
      type: 'event_cancelled',
      title: 'Event cancelled',
      message: `"${event.title}" has been cancelled.`,
    });
  } catch (e) {
    console.warn('Event delete notify failed', e);
  }

  const { data: deleted, error: delError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .select('id');

  if (delError) throw delError;
  if (!deleted?.length) {
    throw new Error('Delete was blocked. You may not have permission to delete this event.');
  }

  return { deletedCount: 1 };
}
