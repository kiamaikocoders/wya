import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Map, { Marker, NavigationControl, Popup, ViewState } from 'react-map-gl/mapbox';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminOutlinePill,
  AdminPageShell,
} from '@/components/admin/AdminPageShell';
import {
  AnalyticsKpiCard,
  AnalyticsPeriodBar,
  formatCompact,
  type AnalyticsPeriod,
} from '@/components/admin/analytics/analytics-ui';
import { useAdminSectionTab } from '@/components/admin/AdminSubnavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/lib/location-service';
import {
  filterAtlasByWeekCutoff,
  formatKesShort,
  loadAdminAtlas,
  type AtlasCoverageGap,
  type AtlasEventPin,
  type AtlasLayer,
  type AtlasSignupCluster,
  type AtlasTab,
} from '@/lib/admin-atlas';
import { cn } from '@/lib/utils';
import { getAdminSiteOrigin } from '@/lib/site-origins';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = locationService.getMapboxToken();
const MAP_STYLE_LIGHT = 'mapbox://styles/mapbox/streets-v12';
const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

const ATLAS_TABS: { id: AtlasTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'signups', label: 'Signups' },
  { id: 'heat', label: 'Heat' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'ops', label: 'Ops' },
];

const PIN_COLORS = {
  live: '#22c55e',
  upcoming: '#38bdf8',
  pending: '#eab308',
  rejected: '#94a3b8',
  past: '#64748b',
  heat: '#ff6b35',
  signup: '#a78bfa',
  gap: '#fb7185',
} as const;

function AtlasModuleTabs({
  active,
  onChange,
}: {
  active: AtlasTab;
  onChange: (tab: AtlasTab) => void;
}) {
  return (
    <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-[10px] bg-[hsl(var(--admin-surface))] p-1">
      {ATLAS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'shrink-0 rounded-lg px-3 py-2 text-xs transition-colors',
            active === tab.id
              ? 'border border-primary bg-[hsl(var(--admin-surface-2))] font-semibold text-primary'
              : 'border border-transparent font-medium text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function pinSize(intensity: number, maxIntensity: number): number {
  if (maxIntensity <= 0) return 12;
  const t = Math.min(1, intensity / maxIntensity);
  return 10 + Math.round(t * 18);
}

function heatRadius(intensity: number, maxIntensity: number): number {
  if (intensity <= 0) return 0;
  const t = Math.min(1, intensity / Math.max(maxIntensity, 1));
  return 40 + Math.round(t * 100);
}

type MapSelection =
  | { kind: 'event'; event: AtlasEventPin }
  | { kind: 'cluster'; cluster: AtlasSignupCluster }
  | { kind: 'gap'; gap: AtlasCoverageGap }
  | null;

function AtlasMap({
  events,
  clusters,
  gaps,
  showEvents,
  showSignups,
  showHeat,
  showCoverage,
  selected,
  onSelect,
  opsBadges,
  weekLabel,
  weekIndex,
  weekCount,
  onWeekChange,
}: {
  events: AtlasEventPin[];
  clusters: AtlasSignupCluster[];
  gaps: AtlasCoverageGap[];
  showEvents: boolean;
  showSignups: boolean;
  showHeat: boolean;
  showCoverage: boolean;
  selected: MapSelection;
  onSelect: (s: MapSelection) => void;
  opsBadges: string[];
  weekLabel: string;
  weekIndex: number;
  weekCount: number;
  onWeekChange: (i: number) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: 36.8219,
    latitude: -1.2921,
    zoom: 11,
  });

  const maxIntensity = useMemo(
    () => Math.max(0, ...events.map((e) => e.intensity)),
    [events]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[min(72vh,720px)] items-center justify-center rounded-[14px] border border-border bg-card text-sm text-muted-foreground">
        Map preview needs <code className="mx-1">VITE_MAPBOX_ACCESS_TOKEN</code>
      </div>
    );
  }

  return (
    <div className="relative h-[min(72vh,720px)] overflow-hidden rounded-[14px] border border-border bg-card">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
        attributionControl
      >
        <NavigationControl position="bottom-right" />

        {showHeat &&
          events
            .filter((e) => e.intensity > 0)
            .map((e) => {
              const r = heatRadius(e.intensity, maxIntensity);
              return (
                <Marker key={`heat-${e.id}`} longitude={e.longitude} latitude={e.latitude} anchor="center">
                  <div
                    className="pointer-events-none rounded-full"
                    style={{
                      width: r,
                      height: r,
                      background: 'rgba(255,107,53,0.22)',
                      boxShadow: '0 0 0 1px rgba(255,107,53,0.25)',
                    }}
                  />
                </Marker>
              );
            })}

        {showCoverage &&
          gaps.map((g) => (
            <Marker
              key={`gap-${g.id}`}
              longitude={g.longitude}
              latitude={g.latitude}
              anchor="center"
              onClick={(ev) => {
                ev.originalEvent.stopPropagation();
                onSelect({ kind: 'gap', gap: g });
              }}
            >
              <div
                className="cursor-pointer rounded-full border-2 border-[#fb7185]/80 bg-[#fb7185]/20"
                style={{ width: 56, height: 56 }}
                title={`Gap: ${g.label}`}
              />
            </Marker>
          ))}

        {showSignups &&
          clusters.map((c) => {
            const size = 14 + Math.min(28, c.count);
            return (
              <Marker
                key={c.id}
                longitude={c.longitude}
                latitude={c.latitude}
                anchor="center"
                onClick={(ev) => {
                  ev.originalEvent.stopPropagation();
                  onSelect({ kind: 'cluster', cluster: c });
                }}
              >
                <div
                  className="cursor-pointer rounded-full border-2 border-[#a78bfa]/70 bg-[#a78bfa]/35"
                  style={{ width: size, height: size }}
                  title={`${c.label}: ${c.count}`}
                />
              </Marker>
            );
          })}

        {showEvents &&
          events.map((e) => {
            const size = showHeat || e.intensity > 0 ? pinSize(e.intensity, maxIntensity) : 12;
            const color = PIN_COLORS[e.pinKind] || PIN_COLORS.upcoming;
            return (
              <Marker
                key={e.id}
                longitude={e.longitude}
                latitude={e.latitude}
                anchor="center"
                onClick={(ev) => {
                  ev.originalEvent.stopPropagation();
                  onSelect({ kind: 'event', event: e });
                }}
              >
                <div
                  className="cursor-pointer rounded-full border-2 border-background shadow-sm"
                  style={{ width: size, height: size, backgroundColor: color }}
                  title={e.title}
                />
              </Marker>
            );
          })}

        {selected?.kind === 'event' && (
          <Popup
            longitude={selected.event.longitude}
            latitude={selected.event.latitude}
            anchor="bottom"
            onClose={() => onSelect(null)}
            closeOnClick={false}
            offset={16}
          >
            <div className="w-[240px] space-y-1.5 p-1 text-foreground">
              <p className="text-sm font-bold leading-snug">{selected.event.title}</p>
              <p className="text-[11px] font-medium text-primary">
                {selected.event.pinKind === 'live'
                  ? 'Live'
                  : selected.event.pinKind === 'pending'
                    ? 'Pending'
                    : selected.event.pinKind === 'upcoming'
                      ? 'Upcoming'
                      : selected.event.pinKind}{' '}
                · {selected.event.category || 'Event'} ·{' '}
                {(selected.event.location || '').split(',')[0] || '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selected.event.checkIns} check-ins · {selected.event.tickets} tickets ·{' '}
                {formatKesShort(selected.event.gmv)} GMV
              </p>
              <p className="text-[10px] text-muted-foreground">
                Pin size = max(check-ins, tickets)
                {selected.event.coordSource === 'area' ? ' · area pin' : ''}
              </p>
              <div className="flex gap-3 pt-1 text-[12px] font-semibold text-primary">
                <Link to={`/events/${selected.event.id}`}>Open event →</Link>
                <Link to={`/admin/events?edit=${selected.event.id}`}>Edit →</Link>
              </div>
            </div>
          </Popup>
        )}

        {selected?.kind === 'cluster' && (
          <Popup
            longitude={selected.cluster.longitude}
            latitude={selected.cluster.latitude}
            anchor="bottom"
            onClose={() => onSelect(null)}
            closeOnClick={false}
          >
            <div className="w-[240px] space-y-1.5 p-1 text-foreground">
              <p className="text-sm font-bold leading-snug">{selected.cluster.label}</p>
              <p className="text-[12px] font-semibold text-primary">
                {selected.cluster.count}{' '}
                {selected.cluster.count === 1 ? 'user' : 'users'} near here
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selected.cluster.source === 'coords'
                  ? 'Pinned from shared home locations on their profiles.'
                  : selected.cluster.source === 'onboarding'
                    ? 'From cities they chose during onboarding.'
                    : 'From profile city / home area text (not live GPS).'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Aggregated for ops — not a live people tracker.
              </p>
            </div>
          </Popup>
        )}

        {selected?.kind === 'gap' && (
          <Popup
            longitude={selected.gap.longitude}
            latitude={selected.gap.latitude}
            anchor="bottom"
            onClose={() => onSelect(null)}
            closeOnClick={false}
          >
            <div className="w-[240px] space-y-1.5 p-1 text-foreground">
              <p className="text-sm font-bold leading-snug">{selected.gap.label}</p>
              <p className="text-[12px] font-semibold text-rose-400">Thin event coverage</p>
              <p className="text-[11px] text-muted-foreground">
                {selected.gap.signupCount}{' '}
                {selected.gap.signupCount === 1 ? 'user' : 'users'} in this area ·{' '}
                {selected.gap.eventCount} live/upcoming{' '}
                {selected.gap.eventCount === 1 ? 'event' : 'events'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                More people than supply — a good spot to add listings.
              </p>
              <Link
                to="/admin/events"
                className="inline-block pt-0.5 text-[12px] font-semibold text-primary"
              >
                Create event here →
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {opsBadges.length > 0 && (
        <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5">
          {opsBadges.map((label) => (
            <span
              key={label}
              className="rounded-full border border-border bg-card/95 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10 rounded-[10px] border border-border bg-card/95 px-3 py-2.5 backdrop-blur">
        <div className="flex flex-col gap-1.5">
          {(
            [
              ['Live', PIN_COLORS.live],
              ['Upcoming', PIN_COLORS.upcoming],
              ['Pending', PIN_COLORS.pending],
              ['Busy venues', PIN_COLORS.heat],
              ['Users nearby', PIN_COLORS.signup],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 z-10 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-[10px] border border-border bg-card/95 px-3 py-2 backdrop-blur">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">Growth timeline</span>
          <span className="text-[11px] font-semibold text-foreground">{weekLabel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(weekCount - 1, 0)}
          value={weekIndex}
          onChange={(e) => onWeekChange(Number(e.target.value))}
          className="w-full accent-[hsl(var(--primary))]"
          aria-label="Growth timeline"
        />
      </div>
    </div>
  );
}

const AdminAtlas: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [comparePrior, setComparePrior] = useState(true);
  const [city, setCity] = useState('all');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [layer, setLayer] = useState<AtlasLayer>('events');
  const [tab, setTab] = useAdminSectionTab<AtlasTab>(ATLAS_TABS, 'overview');
  const [weekIndex, setWeekIndex] = useState(7);
  const [selected, setSelected] = useState<MapSelection>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['admin-atlas', period],
    queryFn: () => loadAdminAtlas(period),
    retry: 1,
  });

  useEffect(() => {
    if (data?.weeks.length) setWeekIndex(data.weeks.length - 1);
  }, [data?.weeks.length]);

  const week = data?.weeks[weekIndex] || data?.weeks[data.weeks.length - 1];

  const weekScoped = useMemo(() => {
    if (!data || !week) {
      return { events: [] as AtlasEventPin[], clusters: [] as AtlasSignupCluster[], gaps: [] as AtlasCoverageGap[] };
    }
    return filterAtlasByWeekCutoff(data, week.cutoff);
  }, [data, week]);

  const filteredEvents = useMemo(() => {
    return weekScoped.events.filter((e) => {
      if (status !== 'all') {
        if (status === 'live' && e.pinKind !== 'live') return false;
        if (status === 'upcoming' && e.pinKind !== 'upcoming') return false;
        if (status === 'pending' && e.pinKind !== 'pending') return false;
        if (status === 'approved' && e.status !== 'approved') return false;
      }
      if (category !== 'all' && (e.category || '').toLowerCase() !== category) return false;
      if (city !== 'all') {
        const loc = (e.location || '').toLowerCase();
        if (!loc.includes(city)) return false;
      }
      return true;
    });
  }, [weekScoped.events, status, category, city]);

  const filteredClusters = useMemo(() => {
    if (city === 'all') return weekScoped.clusters;
    return weekScoped.clusters.filter(
      (c) => c.label.toLowerCase().includes(city) || c.id.includes(city)
    );
  }, [weekScoped.clusters, city]);

  const filteredGaps = useMemo(() => {
    if (city === 'all') return weekScoped.gaps;
    return weekScoped.gaps.filter((g) => g.label.toLowerCase().includes(city));
  }, [weekScoped.gaps, city]);

  // Keep Layer dropdown in sync when switching module tabs
  useEffect(() => {
    if (tab !== 'overview') setLayer(tab as AtlasLayer);
    setSelected(null);
  }, [tab]);

  // Module tabs drive the map; Overview also respects the Layer dropdown
  const view = tab === 'overview' ? layer : tab;
  const finalShowEvents =
    view === 'events' ||
    view === 'heat' ||
    view === 'ops' ||
    view === 'all' ||
    view === 'coverage' ||
    (tab === 'overview' && layer === 'events');
  const finalShowSignups =
    view === 'signups' || view === 'all' || view === 'coverage' || (tab === 'overview' && layer === 'events');
  const finalShowHeat =
    view === 'heat' || view === 'events' || view === 'all' || (tab === 'overview' && layer === 'events');
  const finalShowCoverage = view === 'coverage';

  const mapEvents = useMemo(() => {
    if (view === 'signups') return [] as AtlasEventPin[];
    const active = filteredEvents.filter((e) => e.pinKind !== 'past' && e.pinKind !== 'rejected');
    if (view === 'ops') {
      const opsOnly = active.filter((e) => e.pinKind === 'pending' || !e.hasMedia);
      // If nothing needs attention, still show the live/upcoming map so Ops isn't blank
      return opsOnly.length > 0 ? opsOnly : active;
    }
    if (view === 'heat') {
      // Prefer intensity-ranked pins; fall back to all active if no check-ins/tickets yet
      const hot = active.filter((e) => e.intensity > 0);
      return hot.length > 0 ? hot : active;
    }
    return active;
  }, [filteredEvents, view]);

  const onPeriod = (p: AnalyticsPeriod) => {
    if (p === 'custom') {
      toast.message('Custom range coming soon — using 7d for now');
      setPeriod('7d');
      return;
    }
    setPeriod(p);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['type', 'id', 'title', 'lat', 'lng', 'status', 'check_ins', 'tickets', 'intensity', 'gmv', 'meta'],
      ...filteredEvents.map((e) => [
        'event',
        String(e.id),
        e.title.replace(/,/g, ' '),
        String(e.latitude),
        String(e.longitude),
        e.pinKind,
        String(e.checkIns),
        String(e.tickets),
        String(e.intensity),
        String(e.gmv),
        e.coordSource,
      ]),
      ...filteredClusters.map((c) => [
        'signup_cluster',
        c.id,
        c.label.replace(/,/g, ' '),
        String(c.latitude),
        String(c.longitude),
        c.source,
        '',
        '',
        String(c.count),
        '',
        String(c.count),
      ]),
      ...filteredGaps.map((g) => [
        'coverage_gap',
        g.id,
        g.label.replace(/,/g, ' '),
        String(g.latitude),
        String(g.longitude),
        'gap',
        String(g.signupCount),
        String(g.eventCount),
        String(g.demandScore),
        '',
        'demand_vs_supply',
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wya-atlas-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported Atlas CSV');
  };

  const shareView = async () => {
    const url = `${getAdminSiteOrigin()}/admin/maps?tab=${tab}&period=${period}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('View link copied');
    } catch {
      toast.message(url);
    }
  };

  const cityOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'City: All' }];
    data?.cities.forEach((c) => {
      opts.push({ value: c.toLowerCase(), label: `City: ${c}` });
    });
    return opts;
  }, [data]);

  const categoryOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Category: All' }];
    data?.categories.forEach((c) => {
      opts.push({ value: c.toLowerCase(), label: `Category: ${c}` });
    });
    return opts;
  }, [data]);

  const opsBadges = useMemo(() => {
    if (!data) return [];
    const pendingCount = filteredEvents.filter((e) => e.pinKind === 'pending').length;
    const lowMedia = filteredEvents.filter(
      (e) => (e.pinKind === 'live' || e.pinKind === 'upcoming') && !e.hasMedia
    ).length;
    const badges: string[] = [];
    if (pendingCount > 0) badges.push(`Pending: ${pendingCount}`);
    if (lowMedia > 0) badges.push(`Low media: ${lowMedia}`);
    if (filteredGaps[0]) badges.push(`Gap: ${filteredGaps[0].label}`);
    if (data.totals.gmv > 0) badges.push(`GMV: ${formatKesShort(data.totals.gmv)}`);
    return badges;
  }, [data, filteredEvents, filteredGaps]);

  return (
    <AdminPageShell
      title="Admin Atlas"
      subtitle="Supply · demand · activity on the map — not live tracking"
      icon={MapIcon}
      actions={
        <>
          <AdminOutlinePill onClick={exportCsv}>Export</AdminOutlinePill>
          <AdminOutlinePill
            onClick={() => {
              void refetch();
              queryClient.invalidateQueries({ queryKey: ['admin-atlas'] });
            }}
            disabled={isFetching}
          >
            Refresh
          </AdminOutlinePill>
          <AdminOutlinePill onClick={() => void shareView()}>Share view</AdminOutlinePill>
        </>
      }
      toolbar={
        <AnalyticsPeriodBar
          period={period}
          onPeriod={onPeriod}
          comparePrior={comparePrior}
          onComparePrior={setComparePrior}
          city={city}
          onCity={setCity}
          category={category}
          onCategory={setCategory}
          cityOptions={cityOptions}
          categoryOptions={categoryOptions}
          extraFilters={
            <>
              <AdminFilterSelect
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'Status: All' },
                  { value: 'live', label: 'Status: Live' },
                  { value: 'upcoming', label: 'Status: Upcoming' },
                  { value: 'pending', label: 'Status: Pending' },
                  { value: 'approved', label: 'Status: Approved' },
                ]}
                className="h-9 min-w-[140px]"
              />
              <AdminFilterSelect
                value={layer}
                onChange={(v) => setLayer(v as AtlasLayer)}
                options={[
                  { value: 'events', label: 'Layer: Events' },
                  { value: 'signups', label: 'Layer: Signups' },
                  { value: 'heat', label: 'Layer: Heat' },
                  { value: 'coverage', label: 'Layer: Coverage' },
                  { value: 'ops', label: 'Layer: Ops' },
                  { value: 'all', label: 'Layer: All' },
                ]}
                className="h-9 min-w-[148px]"
              />
            </>
          }
        />
      }
      subnav={<AtlasModuleTabs active={tab} onChange={setTab} />}
      contentClassName="space-y-3.5"
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data ? (
        <div className="rounded-[14px] border border-border bg-card p-8 text-center">
          <p className="text-sm font-semibold text-foreground">Could not load Atlas data</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(error as Error)?.message || 'Unknown error'}
          </p>
          <AdminOutlinePill className="mt-4" onClick={() => void refetch()}>
            Retry
          </AdminOutlinePill>
        </div>
      ) : (
        <>
          <AdminKpiRow>
            <AnalyticsKpiCard
              label="Live / upcoming events"
              value={`${filteredEvents.filter((e) => e.pinKind === 'live').length} / ${filteredEvents.filter((e) => e.pinKind === 'upcoming').length}`}
              delta={comparePrior ? data.liveDelta : null}
              deltaPoints
              hint={`${data.totals.eventsPlotted} plotted · ${data.totals.tickets} tickets`}
            />
            <div className="flex min-w-0 flex-col gap-1 rounded-[14px] border border-border bg-card p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Pending approval</p>
              <div className="flex items-baseline gap-2">
                <div className="text-[20px] font-bold leading-none text-foreground lg:text-[22px]">
                  {formatCompact(
                    filteredEvents.filter((e) => e.pinKind === 'pending').length || data.pending
                  )}
                </div>
                {data.urgentPending > 0 ? (
                  <span className="text-[12px] font-semibold text-rose-400">
                    {data.urgentPending} urgent
                  </span>
                ) : null}
              </div>
            </div>
            <AnalyticsKpiCard
              label="Signup clusters (home base)"
              value={formatCompact(
                filteredClusters.reduce((sum, c) => sum + c.count, 0) || data.signupClusterCount
              )}
              delta={comparePrior ? data.signupDelta : null}
              hint={`${data.totals.consentedHomeBases} consented pins · ${data.totals.areaDemand} area signals`}
            />
            <div className="flex min-w-0 flex-col gap-1 rounded-[14px] border border-border bg-card p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Coverage gaps flagged</p>
              <div className="flex items-baseline gap-2">
                <div className="text-[20px] font-bold leading-none text-foreground lg:text-[22px]">
                  {`${filteredGaps.length} area${filteredGaps.length === 1 ? '' : 's'}`}
                </div>
                {filteredGaps[0] ? (
                  <span className="text-[12px] font-semibold text-rose-400">
                    {filteredGaps[0].label}
                  </span>
                ) : null}
              </div>
            </div>
          </AdminKpiRow>

          {(tab === 'ops' || tab === 'coverage') && (
            <div className="flex flex-wrap gap-2">
              {opsBadges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-foreground"
                >
                  {b}
                </span>
              ))}
              {tab === 'coverage' && filteredGaps.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No coverage gaps flagged for current filters.
                </span>
              )}
              {tab === 'ops' && (
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-primary"
                  onClick={() => navigate('/admin/events')}
                >
                  Open Events →
                </button>
              )}
            </div>
          )}

          <AtlasMap
            events={mapEvents}
            clusters={
              view === 'events' || view === 'heat' || view === 'ops' ? [] : filteredClusters
            }
            gaps={finalShowCoverage ? filteredGaps : []}
            showEvents={finalShowEvents && view !== 'signups'}
            showSignups={
              finalShowSignups && view !== 'events' && view !== 'heat' && view !== 'ops'
            }
            showHeat={finalShowHeat}
            showCoverage={finalShowCoverage}
            selected={selected}
            onSelect={setSelected}
            opsBadges={opsBadges}
            weekLabel={week?.label || '—'}
            weekIndex={Math.min(weekIndex, Math.max((data.weeks.length || 1) - 1, 0))}
            weekCount={data.weeks.length}
            onWeekChange={setWeekIndex}
          />
        </>
      )}
    </AdminPageShell>
  );
};

export default AdminAtlas;
