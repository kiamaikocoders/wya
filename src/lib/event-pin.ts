import { findKeVenueByLocation } from '@/data/ke-venues';

export function parseCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function resolveEventPin(event: {
  location?: string | null;
  latitude?: unknown;
  longitude?: unknown;
}): { latitude: number; longitude: number; source: 'venue' | 'stored' } | null {
  const venue = findKeVenueByLocation(event.location);
  if (venue) {
    return { latitude: venue.latitude, longitude: venue.longitude, source: 'venue' };
  }

  const latitude = parseCoord(event.latitude);
  const longitude = parseCoord(event.longitude);
  if (latitude != null && longitude != null) {
    return { latitude, longitude, source: 'stored' };
  }

  return null;
}
