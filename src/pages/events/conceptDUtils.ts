import { format, parseISO, isValid, nextSaturday, nextSunday, startOfDay, endOfDay } from 'date-fns';
import type { Event } from '@/types/event.types';
import { FIGMA_VIBE_COUNTS } from './figmaSeededEvents';

export const VIBE_CATEGORIES = FIGMA_VIBE_COUNTS.map((v) => ({
  key: v.key,
  image: v.image,
}));

export function formatEventPrice(price?: number | null): string {
  if (price == null || price === 0) return 'Free';
  return `KES ${Number(price).toLocaleString('en-KE')}`;
}

export function formatEventMeta(event: Event): string {
  const raw = event.date?.includes('T') ? event.date : `${event.date}T12:00:00`;
  const d = parseISO(raw);
  const datePart = isValid(d) ? format(d, 'EEE · d MMM') : event.date;
  const place = event.location?.split(',')[0]?.trim() || event.location || 'Kenya';
  return `${datePart}  ·  ${place}`;
}

export function formatFeaturedMeta(event: Event): string {
  return `${formatEventMeta(event)}  ·  ${formatEventPrice(event.price)}`;
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
