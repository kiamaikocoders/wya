import { supabase } from '@/integrations/supabase/client';
import { pctDelta, periodWindow } from '@/lib/admin-analytics';
import type { AnalyticsPeriod } from '@/components/admin/analytics/analytics-ui';

/** Kenyan area centroids for signup clustering, event fallback pins, and coverage gaps. */
export const ATLAS_AREAS: Record<string, { lat: number; lng: number; label: string }> = {
  nairobi: { lat: -1.2921, lng: 36.8219, label: 'Nairobi' },
  westlands: { lat: -1.2674, lng: 36.811, label: 'Westlands' },
  kilimani: { lat: -1.2926, lng: 36.787, label: 'Kilimani' },
  karen: { lat: -1.3197, lng: 36.7086, label: 'Karen' },
  hurlingham: { lat: -1.2929, lng: 36.7965, label: 'Hurlingham' },
  parklands: { lat: -1.2615, lng: 36.8169, label: 'Parklands' },
  woodley: { lat: -1.3035, lng: 36.7758, label: 'Woodley' },
  eastlands: { lat: -1.2841, lng: 36.887, label: 'Eastlands' },
  'nairobi west': { lat: -1.3105, lng: 36.812, label: 'Nairobi West' },
  mombasa: { lat: -4.0435, lng: 39.6682, label: 'Mombasa' },
  kisumu: { lat: -0.0917, lng: 34.7617, label: 'Kisumu' },
  nakuru: { lat: -0.3031, lng: 36.08, label: 'Nakuru' },
  eldoret: { lat: 0.5143, lng: 35.2698, label: 'Eldoret' },
  malindi: { lat: -3.2192, lng: 40.1169, label: 'Malindi' },
  garissa: { lat: -0.4532, lng: 39.6461, label: 'Garissa' },
  kitale: { lat: 1.0157, lng: 35.0062, label: 'Kitale' },
  kakamega: { lat: 0.2827, lng: 34.7519, label: 'Kakamega' },
  machakos: { lat: -1.5177, lng: 37.2634, label: 'Machakos' },
  meru: { lat: 0.0467, lng: 37.6556, label: 'Meru' },
  kisii: { lat: -0.6817, lng: 34.7667, label: 'Kisii' },
  thika: { lat: -1.0333, lng: 37.0693, label: 'Thika' },
  nyeri: { lat: -0.4197, lng: 36.9476, label: 'Nyeri' },
  lamu: { lat: -2.2717, lng: 40.902, label: 'Lamu' },
  kiambu: { lat: -1.1714, lng: 36.8356, label: 'Kiambu' },
  kitengela: { lat: -1.4767, lng: 36.9563, label: 'Kitengela' },
  rongai: { lat: -1.3965, lng: 36.755, label: 'Rongai' },
};

/** Longer keys first so "nairobi west" wins over "nairobi". */
const AREA_KEYS = Object.keys(ATLAS_AREAS).sort((a, b) => b.length - a.length);

export type AtlasTab = 'overview' | 'events' | 'signups' | 'heat' | 'coverage' | 'ops';
export type AtlasLayer = 'events' | 'signups' | 'heat' | 'coverage' | 'ops' | 'all';

export type AtlasEventPin = {
  id: number;
  title: string;
  status: string;
  category: string | null;
  location: string | null;
  latitude: number;
  longitude: number;
  date: string;
  created_at: string | null;
  cancelled_at: string | null;
  checkIns: number;
  tickets: number;
  /** Max(check-ins, tickets) — drives pin size / heat. */
  intensity: number;
  gmv: number;
  hasMedia: boolean;
  pinKind: 'live' | 'upcoming' | 'pending' | 'rejected' | 'past';
  coordSource: 'exact' | 'area';
};

export type AtlasSignupCluster = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  count: number;
  source: 'coords' | 'area' | 'onboarding';
  /** ISO timestamps of contributing signups — for growth timeline. */
  createdAts: string[];
};

export type AtlasCoverageGap = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  signupCount: number;
  eventCount: number;
  demandScore: number;
};

export type AtlasBundle = {
  live: number;
  upcoming: number;
  liveDelta: number | null;
  pending: number;
  urgentPending: number;
  signupClusterCount: number;
  signupDelta: number | null;
  coverageGaps: AtlasCoverageGap[];
  events: AtlasEventPin[];
  clusters: AtlasSignupCluster[];
  lowMediaCount: number;
  cities: string[];
  categories: string[];
  weeks: Array<{ index: number; label: string; cutoff: string }>;
  totals: {
    eventsPlotted: number;
    checkIns: number;
    tickets: number;
    gmv: number;
    consentedHomeBases: number;
    areaDemand: number;
  };
};

/**
 * Match free-text location to a known area key.
 */
export function matchArea(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const key of AREA_KEYS) {
    if (lower.includes(key)) return key;
  }
  return null;
}

/**
 * Resolve lat/lng from event row or area fallback.
 */
export function resolveEventCoords(event: {
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
}): { latitude: number; longitude: number; source: 'exact' | 'area' } | null {
  const lat = event.latitude != null ? Number(event.latitude) : NaN;
  const lng = event.longitude != null ? Number(event.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng, source: 'exact' };
  }
  const areaKey = matchArea(event.location);
  if (!areaKey) return null;
  const area = ATLAS_AREAS[areaKey];
  return { latitude: area.lat, longitude: area.lng, source: 'area' };
}

function classifyEvent(
  status: string,
  dateIso: string,
  cancelledAt: string | null,
  now: Date
): AtlasEventPin['pinKind'] {
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'rejected';
  if (cancelledAt) return 'past';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 'upcoming';
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  if (d >= startOfDay && d <= endOfDay) return 'live';
  if (d > endOfDay) return 'upcoming';
  return 'past';
}

function buildWeeks(count = 8): AtlasBundle['weeks'] {
  const weeks: AtlasBundle['weeks'] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const weekNum = getIsoWeek(end);
    weeks.push({
      index: count - 1 - i,
      label: `Week ${weekNum} · ${end.toLocaleString('en-GB', { month: 'short', year: 'numeric' })}`,
      cutoff: end.toISOString(),
    });
  }
  return weeks;
}

function getIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function throwIfError(error: { message?: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message || 'query failed'}`);
}

function bumpAreaDemand(
  map: Map<string, { count: number; createdAts: string[] }>,
  areaKey: string,
  createdAt: string | null | undefined
) {
  const cur = map.get(areaKey) || { count: 0, createdAts: [] as string[] };
  cur.count += 1;
  if (createdAt) cur.createdAts.push(createdAt);
  map.set(areaKey, cur);
}

/**
 * Load Admin Atlas map layers: events, signup clusters, coverage gaps, ops overlays.
 * Uses check-ins + tickets for intensity, payments + ticket prices for GMV,
 * consented coords + location/onboarding text for demand aggregates.
 */
export async function loadAdminAtlas(period: AnalyticsPeriod): Promise<AtlasBundle> {
  const now = new Date();
  const current = periodWindow(period);
  const prior = periodWindow(period, true);
  const weeks = buildWeeks(8);

  const [
    eventsRes,
    profilesRes,
    checkInsRes,
    paymentsRes,
    ticketsRes,
    onboardingRes,
    favoritesRes,
    periodSignupsRes,
    priorSignupsRes,
    priorLiveRes,
  ] = await Promise.all([
    supabase
      .from('events')
      .select(
        'id, title, status, category, location, latitude, longitude, date, created_at, cancelled_at, image_url'
      )
      .order('date', { ascending: false })
      .limit(1200),
    supabase
      .from('profiles')
      .select(
        'id, location, latitude, longitude, location_consent, location_source, is_ghost, created_at'
      )
      .or('is_ghost.is.null,is_ghost.eq.false')
      .order('created_at', { ascending: false })
      .limit(3000),
    supabase.from('event_checkins').select('event_id').limit(10000),
    supabase.from('payments').select('event_id, amount, status').limit(10000),
    supabase.from('tickets').select('event_id, price, status').limit(10000),
    supabase
      .from('user_onboarding_preferences')
      .select('user_id, home_base, preferred_cities, created_at, updated_at')
      .limit(2000),
    supabase.from('favorites').select('event_id').limit(5000),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', current.start)
      .lt('created_at', current.end),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', prior.start)
      .lt('created_at', prior.end),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('cancelled_at', null)
      .gte('date', prior.start)
      .lt('date', prior.end),
  ]);

  throwIfError(eventsRes.error, 'events');
  throwIfError(profilesRes.error, 'profiles');
  // Soft-fail optional tables so Atlas still loads if RLS/schema differs
  if (checkInsRes.error) console.warn('[admin-atlas] event_checkins', checkInsRes.error.message);
  if (paymentsRes.error) console.warn('[admin-atlas] payments', paymentsRes.error.message);
  if (ticketsRes.error) console.warn('[admin-atlas] tickets', ticketsRes.error.message);
  if (onboardingRes.error) console.warn('[admin-atlas] onboarding', onboardingRes.error.message);
  if (favoritesRes.error) console.warn('[admin-atlas] favorites', favoritesRes.error.message);

  const checkInMap = new Map<number, number>();
  (checkInsRes.data || []).forEach((row: { event_id: number }) => {
    checkInMap.set(row.event_id, (checkInMap.get(row.event_id) || 0) + 1);
  });

  const ticketCountMap = new Map<number, number>();
  const ticketGmvMap = new Map<number, number>();
  (ticketsRes.data || []).forEach(
    (row: { event_id: number | null; price: number | null; status: string | null }) => {
      if (row.event_id == null) return;
      const status = (row.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'refunded' || status === 'failed') return;
      ticketCountMap.set(row.event_id, (ticketCountMap.get(row.event_id) || 0) + 1);
      ticketGmvMap.set(
        row.event_id,
        (ticketGmvMap.get(row.event_id) || 0) + Number(row.price || 0)
      );
    }
  );

  const paymentGmvMap = new Map<number, number>();
  (paymentsRes.data || []).forEach(
    (row: { event_id: number | null; amount: number | null; status: string | null }) => {
      if (row.event_id == null) return;
      const status = (row.status || '').toLowerCase();
      if (status && !['completed', 'paid', 'success', 'successful'].includes(status)) return;
      paymentGmvMap.set(
        row.event_id,
        (paymentGmvMap.get(row.event_id) || 0) + Number(row.amount || 0)
      );
    }
  );

  const favoriteMap = new Map<number, number>();
  (favoritesRes.data || []).forEach((row: { event_id: number }) => {
    favoriteMap.set(row.event_id, (favoriteMap.get(row.event_id) || 0) + 1);
  });

  const events: AtlasEventPin[] = (eventsRes.data || [])
    .map((e: any) => {
      const coords = resolveEventCoords(e);
      if (!coords) return null;
      const checkIns = checkInMap.get(e.id) || 0;
      const tickets = ticketCountMap.get(e.id) || 0;
      const gmv = paymentGmvMap.get(e.id) || ticketGmvMap.get(e.id) || 0;
      return {
        id: e.id as number,
        title: e.title as string,
        status: e.status as string,
        category: (e.category as string) || null,
        location: (e.location as string) || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: e.date as string,
        created_at: (e.created_at as string) || null,
        cancelled_at: (e.cancelled_at as string) || null,
        checkIns,
        tickets,
        intensity: Math.max(checkIns, tickets),
        gmv,
        hasMedia: Boolean(e.image_url),
        pinKind: classifyEvent(e.status, e.date, e.cancelled_at, now),
        coordSource: coords.source,
      } satisfies AtlasEventPin;
    })
    .filter(Boolean) as AtlasEventPin[];

  const live = events.filter((e) => e.pinKind === 'live').length;
  const upcoming = events.filter((e) => e.pinKind === 'upcoming').length;
  const pending = events.filter((e) => e.pinKind === 'pending').length;
  const urgentPending = events.filter((e) => {
    if (e.pinKind !== 'pending') return false;
    const eventDate = new Date(e.date).getTime();
    const waitingMs = e.created_at ? now.getTime() - new Date(e.created_at).getTime() : 0;
    const soon = eventDate - now.getTime();
    return waitingMs >= 3 * 86400000 || (soon >= 0 && soon <= 7 * 86400000);
  }).length;

  const areaDemand = new Map<string, { count: number; createdAts: string[] }>();
  const coordBuckets = new Map<string, AtlasSignupCluster>();
  let consentedHomeBases = 0;

  for (const p of profilesRes.data || []) {
    const lat = p.latitude != null ? Number(p.latitude) : NaN;
    const lng = p.longitude != null ? Number(p.longitude) : NaN;
    const consented = p.location_consent === true;
    const seeded =
      typeof p.location_source === 'string' && p.location_source.startsWith('seeded');
    // Admin Atlas: plot consented pins and seeded home bases (until user confirms/overrides)
    const plottable = Number.isFinite(lat) && Number.isFinite(lng) && (consented || seeded);

    if (plottable) {
      if (consented) consentedHomeBases += 1;
      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      const existing = coordBuckets.get(key);
      if (existing) {
        existing.count += 1;
        if (p.created_at) existing.createdAts.push(p.created_at);
      } else {
        coordBuckets.set(key, {
          id: `c-${key}`,
          label: matchArea(p.location)
            ? ATLAS_AREAS[matchArea(p.location)!].label
            : 'Home base',
          latitude: lat,
          longitude: lng,
          count: 1,
          source: 'coords',
          createdAts: p.created_at ? [p.created_at] : [],
        });
      }
    }

    const areaKey = matchArea(p.location);
    if (areaKey) bumpAreaDemand(areaDemand, areaKey, p.created_at);
  }

  for (const row of onboardingRes.data || []) {
    const ts = row.updated_at || row.created_at || null;
    const homeKey = matchArea(row.home_base);
    if (homeKey) bumpAreaDemand(areaDemand, homeKey, ts);
    const cities = Array.isArray(row.preferred_cities) ? row.preferred_cities : [];
    for (const city of cities) {
      const key = matchArea(String(city));
      if (key) bumpAreaDemand(areaDemand, key, ts);
    }
  }

  // Favourites on geo events → soft demand bump for that event's area
  for (const e of events) {
    const favs = favoriteMap.get(e.id) || 0;
    if (favs <= 0) continue;
    const areaKey = matchArea(e.location);
    if (!areaKey) continue;
    const cur = areaDemand.get(areaKey) || { count: 0, createdAts: [] as string[] };
    cur.count += favs;
    areaDemand.set(areaKey, cur);
  }

  const clusters: AtlasSignupCluster[] = [
    ...coordBuckets.values(),
    ...[...areaDemand.entries()]
      .filter(([, v]) => v.count >= 1)
      .map(([key, v]) => {
        const area = ATLAS_AREAS[key];
        return {
          id: `a-${key}`,
          label: area.label,
          latitude: area.lat,
          longitude: area.lng,
          count: v.count,
          source: 'area' as const,
          createdAts: v.createdAts,
        };
      }),
  ].sort((a, b) => b.count - a.count);

  const areaEventCounts = new Map<string, number>();
  for (const e of events) {
    if (e.status !== 'approved' || e.pinKind === 'past') continue;
    const key = matchArea(e.location);
    if (key) areaEventCounts.set(key, (areaEventCounts.get(key) || 0) + 1);
  }

  const coverageGaps: AtlasCoverageGap[] = [...areaDemand.entries()]
    .map(([key, demand]) => {
      const area = ATLAS_AREAS[key];
      const eventCount = areaEventCounts.get(key) || 0;
      const signupCount = demand.count;
      // Gap when demand exists and supply is thin relative to demand
      const demandScore = signupCount - eventCount * 3;
      if (signupCount < 2) return null;
      if (eventCount >= 8 && signupCount / eventCount < 4) return null;
      if (demandScore < 2 && eventCount > 0) return null;
      return {
        id: key,
        label: area.label,
        latitude: area.lat,
        longitude: area.lng,
        signupCount,
        eventCount,
        demandScore,
      } satisfies AtlasCoverageGap;
    })
    .filter(Boolean)
    .sort((a, b) => b!.demandScore - a!.demandScore) as AtlasCoverageGap[];

  const periodSignups = periodSignupsRes.count || 0;
  const priorSignups = priorSignupsRes.count || 0;
  const priorLiveUpcoming = priorLiveRes.count || 0;

  const cities = [
    ...new Set(
      [
        ...events.map((e) => (e.location || '').split(',')[0].trim()),
        ...Object.values(ATLAS_AREAS).map((a) => a.label),
      ].filter((c) => c.length > 1)
    ),
  ]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 40);

  const categories = [
    ...new Set(events.map((e) => e.category).filter(Boolean) as string[]),
  ].sort();

  const lowMediaCount = events.filter(
    (e) => (e.pinKind === 'live' || e.pinKind === 'upcoming') && !e.hasMedia
  ).length;

  const areaOnlySignups = [...areaDemand.values()].reduce((a, b) => a + b.count, 0);

  return {
    live,
    upcoming,
    liveDelta: pctDelta(live + upcoming, priorLiveUpcoming),
    pending,
    urgentPending,
    signupClusterCount: Math.max(areaOnlySignups, consentedHomeBases, periodSignups),
    signupDelta: pctDelta(periodSignups, priorSignups),
    coverageGaps,
    events,
    clusters,
    lowMediaCount,
    cities,
    categories,
    weeks,
    totals: {
      eventsPlotted: events.length,
      checkIns: [...checkInMap.values()].reduce((a, b) => a + b, 0),
      tickets: [...ticketCountMap.values()].reduce((a, b) => a + b, 0),
      gmv: events.reduce((sum, e) => sum + e.gmv, 0),
      consentedHomeBases,
      areaDemand: areaOnlySignups,
    },
  };
}

/**
 * Filter atlas layers by growth-timeline cutoff (inclusive).
 * Uses created_at so upcoming (future-dated) events still appear once listed.
 */
export function filterAtlasByWeekCutoff(
  bundle: AtlasBundle,
  cutoffIso: string
): { events: AtlasEventPin[]; clusters: AtlasSignupCluster[]; gaps: AtlasCoverageGap[] } {
  const cutoff = new Date(cutoffIso).getTime();
  const events = bundle.events.filter((e) => {
    const listedAt = e.created_at ? new Date(e.created_at).getTime() : new Date(e.date).getTime();
    return Number.isFinite(listedAt) && listedAt <= cutoff;
  });

  const clusters = bundle.clusters
    .map((c) => {
      if (!c.createdAts.length) return c;
      const kept = c.createdAts.filter((ts) => new Date(ts).getTime() <= cutoff);
      if (!kept.length) return null;
      return { ...c, count: kept.length, createdAts: kept };
    })
    .filter(Boolean) as AtlasSignupCluster[];

  const areaEventCounts = new Map<string, number>();
  for (const e of events) {
    if (e.status !== 'approved' || e.pinKind === 'past') continue;
    const key = matchArea(e.location);
    if (key) areaEventCounts.set(key, (areaEventCounts.get(key) || 0) + 1);
  }

  const gaps = bundle.coverageGaps
    .map((g) => {
      const cluster = clusters.find((c) => c.id === `a-${g.id}`);
      const signupCount = cluster?.count ?? 0;
      const eventCount = areaEventCounts.get(g.id) || 0;
      if (signupCount < 2) return null;
      const demandScore = signupCount - eventCount * 3;
      if (demandScore < 2 && eventCount > 0) return null;
      return { ...g, signupCount, eventCount, demandScore };
    })
    .filter(Boolean)
    .sort((a, b) => b!.demandScore - a!.demandScore) as AtlasCoverageGap[];

  return { events, clusters, gaps };
}

export function formatKesShort(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'KES 0';
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}k`;
  return `KES ${Math.round(amount)}`;
}
