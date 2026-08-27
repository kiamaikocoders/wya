import { format, parseISO, isValid, nextSaturday, nextSunday, startOfDay, endOfDay } from 'date-fns';
import type { Event } from '@/types/event.types';
import { FIGMA_VIBE_COUNTS, type SeededEvent } from './figmaSeededEvents';

export const VIBE_CATEGORIES = FIGMA_VIBE_COUNTS.map((v) => ({
  key: v.key,
  image: v.image,
}));

export function formatEventPrice(price?: number | null): string {
  if (price == null || price === 0) return 'Free';
  return `KES ${Number(price).toLocaleString('en-KE')}`;
}

export function formatEventDateLabel(date?: string | null): string {
  if (!date) return 'Date TBA';
  const raw = date.includes('T') ? date : `${date.slice(0, 10)}T12:00:00`;
  const d = parseISO(raw);
  return isValid(d) ? format(d, 'EEE · d MMM') : date.slice(0, 10);
}

export function formatEventMeta(event: Event): string {
  const datePart = formatEventDateLabel(event.date);
  const place = event.location?.split(',')[0]?.trim() || event.location || 'Kenya';
  return `${datePart}  ·  ${place}`;
}

export function formatFeaturedMeta(event: Event): string {
  return `${formatEventMeta(event)}  ·  ${formatEventPrice(event.price)}`;
}

/** Normalize a live DB event into the Concept D card / browse shape. */
export function toBrowseEvent(event: Event): SeededEvent {
  const dateIso = event.date?.includes('T')
    ? event.date.slice(0, 10)
    : (event.date || '').slice(0, 10);

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    category: event.category || 'Event',
    date: dateIso || event.date,
    end_date: event.end_date,
    time: event.time,
    location: event.location || 'Kenya',
    location_url: event.location_url,
    image_url: event.image_url || resolveCategoryImage(event.category),
    organizer_id: event.organizer_id,
    series_id: event.series_id,
    created_at: event.created_at,
    price: event.price,
    featured: event.featured ?? event.is_featured ?? false,
    tags: event.tags || [],
    capacity: event.capacity,
    latitude: event.latitude,
    longitude: event.longitude,
    performing_artists: event.performing_artists,
    dateLabel: formatEventDateLabel(event.date),
    ticketLabel: formatEventPrice(event.price),
  };
}

export function resolveCategoryImage(category?: string | null): string {
  if (!category) return '/events/vibe-music.png';
  const lower = category.toLowerCase();
  const match = VIBE_CATEGORIES.find((v) => lower.includes(v.key.toLowerCase()));
  return match?.image ?? '/events/vibe-music.png';
}

/** Match a facet category name to a vibe key (case-insensitive / partial). */
export function findFacetCategory(facets: string[], vibeKey: string): string | null {
  const lower = vibeKey.toLowerCase();
  const exact = facets.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  return facets.find((c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase())) ?? null;
}

export function thisWeekendRange(): { start: string; end: string } {
  const now = new Date();
  const sat = startOfDay(nextSaturday(now));
  const sun = endOfDay(nextSunday(now));
  // If today is Sat/Sun, nextSaturday jumps forward — clamp to current weekend
  const day = now.getDay();
  if (day === 6) {
    return { start: startOfDay(now).toISOString(), end: endOfDay(nextSunday(now)).toISOString() };
  }
  if (day === 0) {
    return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
  }
  return { start: sat.toISOString(), end: sun.toISOString() };
}

/** Count events per vibe chip for the Concept D rail. */
export function countEventsByVibe(
  events: Array<{ category?: string | null; title?: string; tags?: string[] }>
) {
  return FIGMA_VIBE_COUNTS.map((v) => {
    const key = v.key.toLowerCase();
    const count = events.filter((e) => {
      const cat = (e.category || '').toLowerCase();
      if (key === 'jazz') {
        return (
          cat === 'music' &&
          ((e.title || '').toLowerCase().includes('jazz') ||
            (e.tags || []).some((t) => /jazz/i.test(t)))
        );
      }
      return cat === key || cat.includes(key);
    }).length;
    return { ...v, count };
  });
}
