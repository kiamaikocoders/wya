// Location service: Mapbox (primary) + Photon + Nominatim fallbacks
import { toast } from 'sonner';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const KE_CENTER = { lat: -1.2921, lng: 36.8219 };
const KE_BBOX = '33.9,-4.8,41.95,5.5'; // Photon: minLon,minLat,maxLon,maxLat
const PHOTON_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Generate a session token for Mapbox Search Box API
 * Session tokens should be unique per search session
 */
export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/** Common typos / alternate spellings for Kenyan locations */
const LOCATION_TYPO_MAP: Record<string, string> = {
  nairoi: 'Nairobi',
  narobi: 'Nairobi',
  nairobi: 'Nairobi',
  mombasa: 'Mombasa',
  kisumu: 'Kisumu',
  nakuru: 'Nakuru',
  eldoret: 'Eldoret',
  malindi: 'Malindi',
  machakos: 'Machakos',
  'sarit center': 'Sarit Centre',
  'sarit centre': 'Sarit Centre',
  sarit: 'Sarit Centre',
  masshouse: 'Masshouse Ngong Racecourse',
  'mass house': 'Masshouse Ngong Racecourse',
  mashouse: 'Masshouse Ngong Racecourse',
};

/**
 * Popular Kenyan venues that Mapbox Search Box often misses or misspells.
 * Matched by alias substring when the user types a related query.
 */
const CURATED_KE_VENUES: Array<{
  aliases: string[];
  label: string;
  latitude: number;
  longitude: number;
  city: string;
}> = [
  {
    aliases: ['sarit', 'sarit center', 'sarit centre', 'sarit mall'],
    label: 'Sarit Centre, Westlands, Nairobi',
    latitude: -1.2607625,
    longitude: 36.8014196,
    city: 'Nairobi',
  },
  {
    aliases: ['masshouse', 'mass house', 'mashouse', 'masshouse ngong'],
    label: 'Masshouse, Ngong Racecourse, Ngong Road, Nairobi',
    latitude: -1.3120613,
    longitude: 36.7441232,
    city: 'Nairobi',
  },
  {
    aliases: ['ngong racecourse', 'jockey club kenya', 'ngong race course'],
    label: 'Ngong Racecourse, Ngong Road, Nairobi',
    latitude: -1.3120613,
    longitude: 36.7441232,
    city: 'Nairobi',
  },
  {
    aliases: ['two rivers', 'two rivers mall'],
    label: 'Two Rivers Mall, Nairobi',
    latitude: -1.2045,
    longitude: 36.7935,
    city: 'Nairobi',
  },
  {
    aliases: ['garden city', 'garden city mall'],
    label: 'Garden City Mall, Thika Road, Nairobi',
    latitude: -1.2308,
    longitude: 36.8762,
    city: 'Nairobi',
  },
  {
    aliases: ['the alchemist', 'alchemist westlands'],
    label: 'The Alchemist, Westlands, Nairobi',
    latitude: -1.2681,
    longitude: 36.8112,
    city: 'Nairobi',
  },
  // Hospitality POIs Mapbox/OSM often miss or keep under old trade names
  {
    aliases: [
      'alloys',
      'alloys bar',
      'alloys bar and lounge',
      'alloys sarit',
      'alloy bar',
    ],
    label: 'Alloys Bar and Lounge, Sarit Centre, Westlands, Nairobi',
    latitude: -1.2607625,
    longitude: 36.8014196,
    city: 'Nairobi',
  },
  {
    aliases: ['kenrail', 'kenrail towers', 'ken rail towers'],
    label: 'Kenrail Towers, Ring Road Parklands, Nairobi',
    latitude: -1.2610509,
    longitude: 36.8042602,
    city: 'Nairobi',
  },
  {
    aliases: ['koda', 'koda kenrail', 'koda bar'],
    label: 'Koda, Kenrail Towers, Parklands, Nairobi',
    latitude: -1.2610509,
    longitude: 36.8042602,
    city: 'Nairobi',
  },
  {
    aliases: ['the muze', 'muze kenrail', 'muze'],
    label: 'The Muze, Kenrail Towers, Parklands, Nairobi',
    latitude: -1.2610509,
    longitude: 36.8042602,
    city: 'Nairobi',
  },
  {
    aliases: [
      'saddle and boot',
      'saddle & boot',
      'the saddle and boot',
      'saddle boot ngong',
    ],
    label: 'The Saddle and Boot, Ngong Racecourse, Nairobi',
    latitude: -1.3120613,
    longitude: 36.7441232,
    city: 'Nairobi',
  },
  {
    aliases: [
      'geco cafe',
      'geco café',
      'geco coffee',
      'geco kilimani',
      'geco pro wrapp',
      'geco wrap',
    ],
    label: 'Geco Cafe, Kilimani, Nairobi',
    latitude: -1.2930725,
    longitude: 36.7621693,
    city: 'Nairobi',
  },
];

export function tryCorrectLocationTypo(query: string): string {
  const normalized = query.trim().toLowerCase();
  return LOCATION_TYPO_MAP[normalized] || query.trim();
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryTokens(query: string): string[] {
  return normalizeSearchText(query)
    .split(' ')
    .filter((t) => t.length > 1);
}

/**
 * Score how well a suggestion matches the typed query (higher is better).
 */
function scorePlaceMatch(query: string, label: string, secondary?: string): number {
  const q = normalizeSearchText(query);
  const hay = normalizeSearchText(`${label} ${secondary || ''}`);
  if (!q || !hay) return 0;

  let score = 0;
  if (hay === q) score += 100;
  if (hay.startsWith(q)) score += 50;
  if (hay.includes(q)) score += 30;

  const tokens = queryTokens(query);
  if (tokens.length) {
    const matched = tokens.filter((t) => hay.includes(t)).length;
    score += (matched / tokens.length) * 40;
    // Penalise results that barely share tokens (e.g. "Sarim" for "Sarit Center")
    if (matched === 0) score -= 40;
  }

  // Prefer POI-ish labels over bare city/region names when query has venue words
  if (/\b(mall|centre|center|club|hotel|stadium|market|plaza|bar|lounge|cafe|café|restaurant)\b/i.test(label)) {
    score += 8;
  }

  return score;
}

function curatedMatches(query: string): PlaceSuggestion[] {
  const q = normalizeSearchText(query);
  if (q.length < 2) return [];

  return CURATED_KE_VENUES.filter((venue) =>
    venue.aliases.some((alias) => {
      const a = normalizeSearchText(alias);
      if (!a) return false;
      if (q === a || q.includes(a) || a.startsWith(q)) return true;
      // Allow partial alias hits only for longer queries (avoid "ma" → Masshouse)
      if (q.length >= 4 && a.includes(q)) return true;
      const tokens = queryTokens(q);
      return tokens.length > 0 && tokens.every((t) => a.includes(t));
    }),
  ).map((venue) => ({
    id: `curated-${normalizeSearchText(venue.label)}`,
    label: venue.label,
    secondary: 'Popular venue',
    provider: 'curated' as const,
    latitude: venue.latitude,
    longitude: venue.longitude,
    city: venue.city,
    country: 'Kenya',
  }));
}

function dedupeSuggestions(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const out: PlaceSuggestion[] = [];
  for (const item of items) {
    const labelKey = normalizeSearchText(item.label);
    const nearDuplicate = out.find((existing) => {
      if (normalizeSearchText(existing.label) === labelKey) return true;
      if (
        Number.isFinite(existing.latitude) &&
        Number.isFinite(existing.longitude) &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
      ) {
        const dLat = Math.abs((existing.latitude as number) - (item.latitude as number));
        const dLng = Math.abs((existing.longitude as number) - (item.longitude as number));
        return dLat < 0.0008 && dLng < 0.0008;
      }
      return false;
    });
    if (!nearDuplicate) out.push(item);
  }
  return out;
}

/**
 * Extract country code from a Mapbox Search Box API suggestion.
 */
export function getSuggestionCountryCode(suggestion: any): string | null {
  if (!suggestion) return null;
  const country = suggestion.context?.country;
  if (country && typeof country === 'object') {
    return country.country_code || country.country || null;
  }
  const code = suggestion.country_code || suggestion.country;
  if (code) return code;
  if (Array.isArray(suggestion.context)) {
    const ctx = suggestion.context.find((c: any) => c.country_code || c.type === 'country');
    return ctx?.country_code || ctx?.country || null;
  }
  return null;
}

/** Brave / anti-fingerprinting often returns fake GPS like 1.0, 38.0 with ±1m. */
export function isSuspiciousGeolocation(
  lat: number,
  lng: number,
  accuracy?: number | null,
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  if (lat === 0 && lng === 0) return true;
  if (typeof accuracy === 'number' && accuracy > 0 && accuracy < 5) return true;
  const nearInteger =
    Math.abs(lat - Math.round(lat)) < 0.0001 && Math.abs(lng - Math.round(lng)) < 0.0001;
  if (nearInteger) return true;
  if (Math.abs(lat - 1) < 0.01 && Math.abs(lng - 38) < 0.01) return true;
  if (Math.abs(lat - 0) < 0.01 && Math.abs(lng - 37) < 0.01) return true;
  return false;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  address?: string;
}

/** Normalized place pick used across signup, settings, admin, and event forms */
export interface PlacePick {
  label: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  provider?: 'mapbox' | 'photon' | 'nominatim' | 'gps' | 'curated';
}

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export type PlaceSuggestion = {
  id: string;
  label: string;
  secondary?: string;
  provider: 'mapbox' | 'photon' | 'nominatim' | 'curated';
  /** Mapbox Search Box mapbox_id — needs retrieve */
  mapboxId?: string;
  /** Already-resolved coords (Photon / Nominatim / curated) */
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  raw?: any;
};

export function googleMapsDirectionsUrl(lat: number, lng: number, label?: string): string {
  const q = label?.trim()
    ? encodeURIComponent(label.trim())
    : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

export function googleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

class LocationService {
  private cachedLocation: UserLocation | null = null;
  private locationWatchId: number | null = null;

  async checkPermissionStatus(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
      return { granted: false, denied: true, prompt: false };
    }

    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        const state = permissionStatus.state;

        if (state === 'granted') {
          return { granted: true, denied: false, prompt: false };
        } else if (state === 'denied') {
          return { granted: false, denied: true, prompt: false };
        }
        return { granted: false, denied: false, prompt: true };
      } catch (error) {
        console.warn('Permissions API not available, falling back to direct check:', error);
      }
    }

    return { granted: false, denied: false, prompt: true };
  }

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return { granted: false, denied: true, prompt: false };
    }

    const currentStatus = await this.checkPermissionStatus();
    if (currentStatus.granted) {
      return currentStatus;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          resolve({ granted: true, denied: false, prompt: false });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({ granted: false, denied: true, prompt: false });
          } else {
            resolve({ granted: false, denied: false, prompt: true });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  async getCurrentLocation(forceFresh = false, silent = false): Promise<UserLocation | null> {
    if (!navigator.geolocation) {
      if (!silent) {
        toast.error('Geolocation is not supported by your browser');
      }
      return null;
    }

    const permissionStatus = await this.checkPermissionStatus();

    if (permissionStatus.denied) {
      if (!silent) {
        toast.error(
          'Location permission denied. Please enable location access in your browser settings to use this feature.',
        );
      }
      return null;
    }

    if (permissionStatus.prompt && silent) {
      return null;
    }

    if (forceFresh) {
      this.cachedLocation = null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy || Infinity;

          if (isSuspiciousGeolocation(lat, lng, accuracy)) {
            console.warn('Suspicious coordinates detected:', lat, lng, 'accuracy:', accuracy);
            if (!silent) {
              toast.error(
                'Unable to get accurate location. The browser returned a fallback location. Please search for your location manually.',
              );
            }
            resolve(null);
            return;
          }

          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error('Invalid coordinates:', lat, lng);
            if (!silent) toast.error('Invalid location coordinates received. Please try again.');
            resolve(null);
            return;
          }

          const location: UserLocation = {
            latitude: lat,
            longitude: lng,
          };

          try {
            const address = await this.reverseGeocode(location.latitude, location.longitude);
            location.city = address.city;
            location.country = address.country;
            location.address = address.address;
          } catch (error) {
            console.warn('Failed to reverse geocode:', error);
          }

          this.cachedLocation = location;
          resolve(location);
        },
        (error) => {
          if (error.code === 2) {
            console.warn('Geolocation unavailable (network provider may be blocked):', error.message);
          } else {
            console.error('Error getting location:', error);
          }

          if (!silent) {
            let errorMessage = 'Failed to get your location. ';

            if (error.code === error.PERMISSION_DENIED) {
              errorMessage =
                'Location permission denied. Please enable location access in your browser settings to use this feature.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage =
                'Location information is unavailable. Please try again or search for your location manually.';
            } else if (error.code === error.TIMEOUT) {
              errorMessage = 'Location request timed out. Please try again.';
            } else {
              errorMessage += 'Please try again or search for your location manually.';
            }

            toast.error(errorMessage);
          }

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: forceFresh ? 0 : 60000,
        },
      );
    });
  }

  /**
   * Reverse geocode. Always preserves the GPS point — providers only supply the label.
   */
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{ city: string; country: string; address: string }> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { city: '', country: '', address: '' };
    }

    if (MAPBOX_ACCESS_TOKEN) {
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        );
        url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
        url.searchParams.set('limit', '5');
        url.searchParams.set('language', 'en');
        url.searchParams.set('types', 'address,neighborhood,locality,place,district');

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          const features = Array.isArray(data?.features) ? data.features : [];
          const preferred =
            features.find((f: any) =>
              (f.place_type || []).some((t: string) =>
                ['neighborhood', 'locality', 'address', 'place'].includes(t),
              ),
            ) || features[0];

          if (preferred) {
            let city = '';
            let country = '';
            const context = preferred.context || [];
            for (const item of context) {
              const id = String(item.id || '');
              if (id.startsWith('place')) city = item.text;
              if (id.startsWith('country')) country = item.text;
            }
            return {
              city,
              country,
              address: preferred.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            };
          }
        }
      } catch (error) {
        console.warn('Mapbox reverse geocode failed:', error);
      }
    }

    try {
      const url = new URL(NOMINATIM_REVERSE);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('zoom', '16');

      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WYA/1.0 (www.wya254.com)',
        },
      });
      if (!res.ok) return { city: '', country: '', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
      const hit = await res.json();
      const a = hit?.address || {};
      const city = a.city || a.town || a.village || a.county || '';
      const country = a.country || '';
      const compact = [
        a.suburb || a.neighbourhood || a.quarter,
        city,
        country,
      ]
        .filter(Boolean)
        .join(', ');
      return {
        city,
        country,
        address: compact || hit?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { city: '', country: '', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getCachedLocation(): UserLocation | null {
    return this.cachedLocation;
  }

  watchLocation(callback: (location: UserLocation) => void): () => void {
    if (!navigator.geolocation) {
      return () => {};
    }

    this.locationWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const address = await this.reverseGeocode(location.latitude, location.longitude);
          location.city = address.city;
          location.country = address.country;
          location.address = address.address;
        } catch (error) {
          console.warn('Failed to reverse geocode:', error);
        }

        this.cachedLocation = location;
        callback(location);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );

    return () => {
      if (this.locationWatchId !== null) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
      }
    };
  }

  getMapboxToken(): string {
    return MAPBOX_ACCESS_TOKEN;
  }

  async searchLocationsSuggest(
    query: string,
    sessionToken: string,
    options?: {
      country?: string;
      proximity?: string;
      limit?: number;
      tryTypoCorrection?: boolean;
    },
  ): Promise<any[]> {
    if (!MAPBOX_ACCESS_TOKEN) {
      return [];
    }
    try {
      const {
        country = 'ke',
        proximity = `${KE_CENTER.lng},${KE_CENTER.lat}`,
        limit = 10,
        tryTypoCorrection = true,
      } = options || {};
      const clampedLimit = Math.min(Math.max(limit, 1), 10);
      const searchQuery = tryTypoCorrection
        ? tryCorrectLocationTypo(query) || query.trim()
        : query.trim();

      const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('session_token', sessionToken);
      url.searchParams.set('country', country);
      url.searchParams.set('proximity', proximity);
      url.searchParams.set('limit', clampedLimit.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search Box suggest failed:', response.status, errorText);
        return [];
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error in searchLocationsSuggest:', error);
      return [];
    }
  }

  async retrieveLocationDetails(suggestionId: string, sessionToken: string): Promise<any> {
    if (!MAPBOX_ACCESS_TOKEN) return null;
    try {
      const url = new URL(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestionId}`,
      );
      url.searchParams.set('access_token', MAPBOX_ACCESS_TOKEN);
      url.searchParams.set('session_token', sessionToken);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search Box retrieve failed:', response.status, errorText);
        throw new Error(`Search Box retrieve failed: ${response.status}`);
      }

      const data = await response.json();
      return data.features?.[0] || null;
    } catch (error) {
      console.error('Error in retrieveLocationDetails:', error);
      throw error;
    }
  }

  private async searchPhoton(query: string, limit = 8): Promise<PlaceSuggestion[]> {
    const url = new URL(PHOTON_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 8)));
    url.searchParams.set('lang', 'en');
    url.searchParams.set('lat', String(KE_CENTER.lat));
    url.searchParams.set('lon', String(KE_CENTER.lng));
    url.searchParams.set('bbox', KE_BBOX);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    return features
      .filter((f: any) => f?.geometry?.coordinates?.length === 2)
      .map((feature: any, i: number) => {
        const [lng, lat] = feature.geometry.coordinates;
        const p = feature.properties || {};
        const text =
          p.name ||
          [p.street, p.housenumber].filter(Boolean).join(' ') ||
          p.city ||
          p.county ||
          'Unnamed place';
        const secondary = [p.street, p.district, p.city, p.county, p.state, p.country]
          .filter((s: string) => Boolean(s) && s !== text)
          .filter((v: string, idx: number, arr: string[]) => arr.indexOf(v) === idx)
          .join(', ');
        return {
          id: `photon-${p.osm_id ?? i}-${lat}-${lng}`,
          label: secondary ? `${text}, ${secondary}` : text,
          secondary,
          provider: 'photon' as const,
          latitude: lat,
          longitude: lng,
          city: p.city || p.county,
          country: p.country,
          raw: feature,
        };
      });
  }

  private async searchNominatim(query: string, limit = 8): Promise<PlaceSuggestion[]> {
    const url = new URL(NOMINATIM_SEARCH);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 8)));
    url.searchParams.set('countrycodes', 'ke');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WYA/1.0 (www.wya254.com)',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows = Array.isArray(data) ? data : [];

    return rows
      .filter((hit: any) => hit?.lat && hit?.lon)
      .map((hit: any, i: number) => ({
        id: `nominatim-${hit.place_id ?? i}`,
        label: hit.display_name || query,
        provider: 'nominatim' as const,
        latitude: Number(hit.lat),
        longitude: Number(hit.lon),
        city: hit.address?.city || hit.address?.town || hit.address?.village,
        country: hit.address?.country,
        raw: hit,
      }));
  }

  /**
   * Unified place search: curated Kenyan venues + Mapbox + Photon + Nominatim.
   * Always merges providers (Mapbox alone often returns a weak misspelling and
   * would previously block OSM fallbacks that have the real POI).
   */
  async searchPlaces(
    query: string,
    sessionToken: string,
    options?: { limit?: number },
  ): Promise<PlaceSuggestion[]> {
    const trimmed = tryCorrectLocationTypo(query) || query.trim();
    if (!trimmed || trimmed.length < 2) return [];
    const limit = options?.limit ?? 8;
    const originalQuery = query.trim();

    const curated = dedupeSuggestions([
      ...curatedMatches(originalQuery),
      ...curatedMatches(trimmed),
    ]);

    const [mapboxRaw, photon, nominatim] = await Promise.all([
      this.searchLocationsSuggest(trimmed, sessionToken, {
        country: 'ke',
        proximity: `${KE_CENTER.lng},${KE_CENTER.lat}`,
        limit,
      }).catch(() => [] as any[]),
      this.searchPhoton(trimmed, limit).catch(() => [] as PlaceSuggestion[]),
      this.searchNominatim(trimmed, limit).catch(() => [] as PlaceSuggestion[]),
    ]);

    let kenyanMapbox = (mapboxRaw || []).filter((s: any) => {
      const code = getSuggestionCountryCode(s);
      return code === 'KE' || code === 'ke';
    });
    if (kenyanMapbox.length === 0) kenyanMapbox = mapboxRaw || [];

    const mapboxSuggestions: PlaceSuggestion[] = kenyanMapbox.map((s: any, i: number) => ({
      id: s.mapbox_id || `mapbox-${i}`,
      label: s.name || s.full_address || 'Unknown location',
      secondary: s.full_address && s.full_address !== s.name ? s.full_address : undefined,
      provider: 'mapbox' as const,
      mapboxId: s.mapbox_id,
      raw: s,
    }));

    const merged = dedupeSuggestions([
      ...curated,
      ...photon,
      ...nominatim,
      ...mapboxSuggestions,
    ]);

    const ranked = merged
      .map((item) => ({
        item,
        score: scorePlaceMatch(originalQuery, item.label, item.secondary),
      }))
      // Prefer curated when scores are close
      .sort((a, b) => {
        const curatedBoost = (s: PlaceSuggestion) => (s.provider === 'curated' ? 15 : 0);
        return (
          b.score + curatedBoost(b.item) - (a.score + curatedBoost(a.item))
        );
      })
      .filter(({ score, item }) => score > -20 || item.provider === 'curated')
      .slice(0, limit)
      .map(({ item }) => item);

    return ranked;
  }

  /** Resolve a suggestion to a PlacePick (retrieves Mapbox details when needed). */
  async resolveSuggestion(
    suggestion: PlaceSuggestion,
    sessionToken: string,
  ): Promise<PlacePick | null> {
    if (
      suggestion.provider !== 'mapbox' &&
      Number.isFinite(suggestion.latitude) &&
      Number.isFinite(suggestion.longitude)
    ) {
      return {
        label: suggestion.label,
        latitude: suggestion.latitude!,
        longitude: suggestion.longitude!,
        city: suggestion.city,
        country: suggestion.country,
        provider: suggestion.provider,
      };
    }

    if (!suggestion.mapboxId) return null;
    const feature = await this.retrieveLocationDetails(suggestion.mapboxId, sessionToken);
    if (!feature) return null;
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const address =
      feature.properties?.full_address ||
      feature.properties?.name ||
      suggestion.label ||
      '';
    return {
      label: address,
      latitude: lat,
      longitude: lng,
      city: feature.properties?.context?.place?.name || suggestion.city,
      country: feature.properties?.context?.country?.name || suggestion.country || 'Kenya',
      provider: 'mapbox',
    };
  }
}

export const locationService = new LocationService();
