import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { GetAppModal } from '@/components/marketing/GetAppModal';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { EventDetailPopup } from '@/components/events/EventDetailPopup';
import EventMap from '@/pages/events/EventMap';
import { cn } from '@/lib/utils';
import { eventService } from '@/lib/event-service';
import { isNativeApp } from '@/lib/post-auth-navigation';
import { getPageWindow, useListPagination } from '@/hooks/use-list-pagination';
import {
  FIGMA_SEEDED_EVENTS,
  type SeededEvent,
} from './figmaSeededEvents';
import { countEventsByVibe, toBrowseEvent } from './conceptDUtils';
import { isEventInMapDateWindow } from '@/lib/event-map-window';

type SortKey = 'latest' | 'soonest' | 'price-low' | 'price-high';
type ViewMode = 'grid' | 'map';

const PAGE_SIZE = 12;

/**
 * Figma 15 — Events Concept D (Hybrid).
 * Keeps Figma-seeded events and merges every event from the database.
 * Default order: latest first (earliest last). Grid is paginated.
 * When authenticated on web, embeds in the light-web shell (no marketing header/footer).
 */
const EventsPage = () => {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams<{ eventId?: string }>();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === 'dark';
  const embedInLightWeb = isAuthenticated && !isNativeApp();

  const [search, setSearch] = useState('');
  const [navSearch, setNavSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('latest');
  const [view, setView] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    eventIdParam && !Number.isNaN(Number(eventIdParam)) ? Number(eventIdParam) : null
  );

  const dbEventsQuery = useQuery({
    queryKey: ['events-browse-all'],
    queryFn: async () => {
      const result = await eventService.queryEvents({
        search: '',
        category: null,
        location: null,
        tags: [],
        featuredOnly: false,
        startDate: null,
        endDate: null,
        page: 1,
        pageSize: 500,
        sort: 'latest',
        includePast: true,
      });
      return result.events;
    },
    staleTime: 60_000,
  });

  const catalog = useMemo(() => {
    const seededIds = new Set(FIGMA_SEEDED_EVENTS.map((e) => e.id));
    const fromDb = (dbEventsQuery.data ?? [])
      .filter((e) => !seededIds.has(e.id))
      .map(toBrowseEvent);
    return [...FIGMA_SEEDED_EVENTS, ...fromDb];
  }, [dbEventsQuery.data]);

  useEffect(() => {
    if (eventIdParam && !Number.isNaN(Number(eventIdParam))) {
      setSelectedEventId(Number(eventIdParam));
    } else if (!eventIdParam) {
      setSelectedEventId(null);
    }
  }, [eventIdParam]);

  const openEvent = (id: number) => {
    setSelectedEventId(id);
    navigate(`/events/${id}`);
  };

  const closeEvent = () => {
    setSelectedEventId(null);
    navigate('/events', { replace: true });
  };

  const events = useMemo(() => {
    const seededIds = new Set(FIGMA_SEEDED_EVENTS.map((e) => e.id));
    const seededOrder = new Map(FIGMA_SEEDED_EVENTS.map((e, i) => [e.id, i]));

    let list = [...catalog];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (category) {
      if (category === 'Jazz') {
        list = list.filter(
          (e) =>
            e.category.toLowerCase() === 'music' &&
            (e.title.toLowerCase().includes('jazz') || e.tags.some((t) => /jazz/i.test(t)))
        );
      } else {
        list = list.filter((e) => e.category.toLowerCase() === category.toLowerCase());
      }
    }
    if (weekendOnly) {
      list = list.filter((e) => {
        const d = new Date(`${e.date}T12:00:00`).getDay();
        return d === 0 || d === 6;
      });
    }

    const seeded = list
      .filter((e) => seededIds.has(e.id))
      .sort((a, b) => (seededOrder.get(a.id) ?? 0) - (seededOrder.get(b.id) ?? 0));
    const rest = list.filter((e) => !seededIds.has(e.id));
    rest.sort((a, b) => {
      if (sort === 'price-low') return (a.price ?? 0) - (b.price ?? 0);
      if (sort === 'price-high') return (b.price ?? 0) - (a.price ?? 0);
      if (sort === 'soonest') return a.date.localeCompare(b.date);
      // latest (default): earliest last
      return b.date.localeCompare(a.date);
    });

    // Keep Figma-seeded events first (original page-1 order), then DB events.
    return [...seeded, ...rest];
  }, [catalog, search, category, weekendOnly, sort]);

  const vibeCounts = useMemo(() => countEventsByVibe(catalog), [catalog]);

  const featuredEvents = useMemo(() => {
    if (category || weekendOnly || search) return [];
    const seededFeatured = FIGMA_SEEDED_EVENTS.filter((e) => e.featured);
    const seededIds = new Set(seededFeatured.map((e) => e.id));
    const fromCatalog = events.filter((e) => e.featured && !seededIds.has(e.id));
    // Seeded featured first (original order), then other featured — cap for a snappy carousel.
    return [...seededFeatured, ...fromCatalog].slice(0, 8);
  }, [events, category, weekendOnly, search]);

  const featuredIds = useMemo(
    () => new Set(featuredEvents.map((e) => e.id)),
    [featuredEvents]
  );

  const gridEvents = useMemo(() => {
    if (featuredIds.size === 0) return events;
    return events.filter((e) => !featuredIds.has(e.id));
  }, [events, featuredIds]);

  const {
    page,
    setPage,
    pageItems,
    totalPages,
    total,
    pageSize,
  } = useListPagination(gridEvents, {
    pageSize: PAGE_SIZE,
    resetKey: `${search}|${category}|${weekendOnly}|${sort}`,
  });

  const pageBg = isDark ? 'bg-[#0d1117] text-white' : 'bg-[#f6f8fa] text-[#0d1117]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#5c6570]';
  const heading = isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]';
  const card = isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#e8ecf0] bg-[#f6f8fa]';
  const pillIdle = isDark
    ? 'border-[#21262d] bg-[#161b22] text-[#8b949e]'
    : 'border-[#d0d7de] bg-white text-[#5c6570]';
  const pillActive = 'border-[#ff6b35] bg-[#ff6b35] font-semibold text-white';
  const searchBg = isDark
    ? 'border-[#21262d] bg-[#161b22] text-[#e6edf3] placeholder:text-[#8b949e]'
    : 'border-[#d0d7de] bg-[#f6f8fa] text-[#0d1117] placeholder:text-[#8b949e]';

  const clearAll = () => {
    setCategory(null);
    setWeekendOnly(false);
    setSearch('');
    setNavSearch('');
  };

  const applyNavSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(navSearch.trim());
  };

  const chips = ['Music', 'Nightlife', 'Food', 'Arts', 'Comedy'] as const;
  const isLoading = dbEventsQuery.isLoading;

  return (
    <div className={cn('flex min-h-screen flex-col', pageBg, embedInLightWeb && 'min-h-0')}>
      {!embedInLightWeb && (
      <header
        className={cn(
          'sticky top-0 z-40 flex h-[66px] items-center justify-between border-b px-4 py-4 sm:px-8',
          isDark ? 'border-[#21262d] bg-[#0d1117]' : 'border-[#e8ecf0] bg-white'
        )}
      >
        <div className="flex items-center gap-3">
          <Logo
            href="/"
            size="sm"
            className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0"
          />
          <span className="text-[13px] font-semibold text-[#ff6b35]">Events</span>
        </div>
        <div className="flex items-center gap-2.5">
          <form onSubmit={applyNavSearch} className="relative hidden sm:block">
            <Search
              className={cn(
                'pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2',
                muted
              )}
            />
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search events…"
              className={cn(
                'h-[31px] w-[140px] rounded-full border pl-8 pr-3.5 text-xs outline-none focus:border-[#ff6b35] md:w-[180px]',
                searchBg
              )}
            />
          </form>
          <ModeToggle />
          <button
            type="button"
            onClick={() => setAppModalOpen(true)}
            className="rounded-full bg-[#ff6b35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff6b35]/90"
          >
            Get the app
          </button>
        </div>
      </header>
      )}

      {embedInLightWeb && (
        <div className="border-b border-border px-4 py-3 sm:px-8">
          <form onSubmit={applyNavSearch} className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search events…"
              className={cn(
                'h-10 w-full rounded-xl border pl-10 pr-3.5 text-sm outline-none focus:border-[#ff6b35]',
                searchBg
              )}
            />
          </form>
        </div>
      )}

      <main className="flex-1">
      <section className="relative h-[280px] w-full overflow-hidden sm:h-[340px] lg:h-[400px]">
        <img src="/events/hero.png" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,18,23,0.15)] to-[rgba(13,18,23,0.88)]" />
        <div className="relative z-10 flex h-full flex-col justify-end gap-2.5 px-4 pb-10 sm:px-8">
          <p className="text-xs font-semibold tracking-[1.6px] text-[#ff6b35]">
            TONIGHT IN NAIROBI
          </p>
          <h1 className="max-w-[720px] text-[32px] font-extrabold leading-tight text-white sm:text-[40px]">
            Find the night that finds you
          </h1>
          <p className="text-[15px] text-[#e6edf3]">
            {catalog.length.toLocaleString()} events · Music, food, rooftops & more
          </p>
        </div>
      </section>

      <section className="w-full pt-8">
        <div className="px-4 sm:px-8">
          <h2 className={cn('text-2xl font-bold', heading)}>Explore by vibe</h2>
          <p className={cn('mt-1.5 text-sm', muted)}>
            Pick a world, then dig into what's live this week in Nairobi.
          </p>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vibeCounts.map((v) => {
            const active = category === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setWeekendOnly(false);
                  setCategory(active ? null : v.key);
                }}
                className={cn(
                  'relative h-[150px] w-[min(224px,70vw)] shrink-0 overflow-hidden rounded-2xl sm:w-[224px]',
                  active && 'ring-2 ring-[#ff6b35] ring-offset-2',
                  active && (isDark ? 'ring-offset-[#0d1117]' : 'ring-offset-white')
                )}
              >
                <img src={v.image} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/75" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-left">
                  <p className="text-base font-bold text-white">{v.key}</p>
                  <p className="text-[11px] text-[#e6edf3]">{v.count} events</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="w-full px-4 pt-7 sm:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className={cn('text-[22px] font-bold', heading)}>Browse events</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn('rounded-full border px-3.5 py-2 text-xs', pillActive)}
            >
              Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={cn('rounded-full border px-3.5 py-2 text-xs outline-none', pillIdle)}
            >
              <option value="latest">Latest (earliest last)</option>
              <option value="soonest">Soonest</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
            </select>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn('rounded-full border px-3.5 py-2 text-xs', view === 'grid' ? pillActive : pillIdle)}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={cn('rounded-full border px-3.5 py-2 text-xs', view === 'map' ? pillActive : pillIdle)}
            >
              Map
            </button>
          </div>
        </div>

        <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-xs',
              !category && !weekendOnly && !search ? pillActive : pillIdle
            )}
          >
            All
          </button>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setWeekendOnly(false);
                setCategory(category === c ? null : c);
              }}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-2 text-xs',
                category === c ? pillActive : pillIdle
              )}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setWeekendOnly(!weekendOnly);
            }}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-xs',
              weekendOnly ? pillActive : pillIdle
            )}
          >
            This weekend
          </button>
        </div>
      </section>

      <section className="w-full px-2 pb-12 pt-4 sm:px-2">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[#ff6b35]" />
          </div>
        ) : view === 'map' ? (
          <div
            className={cn(
              'mx-2 overflow-hidden rounded-[20px] border sm:mx-6',
              isDark ? 'border-[#21262d]' : 'border-[#e8ecf0]'
            )}
          >
            {events.some(
              (e) =>
                isEventInMapDateWindow(e) &&
                typeof e.latitude === 'number' &&
                typeof e.longitude === 'number' &&
                Number.isFinite(e.latitude) &&
                Number.isFinite(e.longitude),
            ) ? (
              <EventMap
                events={events.filter(
                  (e) =>
                    isEventInMapDateWindow(e) &&
                    typeof e.latitude === 'number' &&
                    typeof e.longitude === 'number' &&
                    Number.isFinite(e.latitude) &&
                    Number.isFinite(e.longitude)
                )}
                height="min(78vh, 900px)"
                className="rounded-[20px] shadow-none"
                onEventClick={(ev) => openEvent(ev.id)}
              />
            ) : (
              <div className={cn('flex min-h-[480px] items-center justify-center text-sm', muted)}>
                No mapped events from the last 30 days or upcoming.
              </div>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className={cn('mx-6 rounded-[20px] border px-6 py-16 text-center', card)}>
            <p className={cn('text-lg font-semibold', heading)}>No events match</p>
            <p className={cn('mt-2 text-sm', muted)}>Clear filters to see everything live this week.</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 rounded-[10px] bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-[18px] px-2 sm:px-2">
            {featuredEvents.length > 0 ? (
              <FeaturedEventsCarousel
                events={featuredEvents}
                card={card}
                heading={heading}
                muted={muted}
                onOpen={openEvent}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((event) => (
                <SeedCard
                  key={event.id}
                  event={event}
                  card={card}
                  heading={heading}
                  muted={muted}
                  onOpen={() => openEvent(event.id)}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between sm:px-4">
                <p className={cn('text-xs', muted)}>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{' '}
                  {total.toLocaleString()}
                  {featuredEvents.length ? ` (+ ${featuredEvents.length} featured)` : ''}
                </p>
                <nav
                  aria-label="Events pagination"
                  className="flex flex-wrap items-center justify-center gap-1"
                >
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40',
                      pillIdle
                    )}
                  >
                    Prev
                  </button>
                  {getPageWindow(page, totalPages).map((entry, idx) =>
                    entry === 'ellipsis' ? (
                      <span key={`e-${idx}`} className={cn('px-1 text-xs', muted)}>
                        …
                      </span>
                    ) : (
                      <button
                        key={entry}
                        type="button"
                        aria-current={entry === page ? 'page' : undefined}
                        onClick={() => setPage(entry)}
                        className={cn(
                          'min-w-8 rounded-full border px-2.5 py-1.5 text-xs font-semibold',
                          entry === page ? pillActive : pillIdle
                        )}
                      >
                        {entry}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40',
                      pillIdle
                    )}
                  >
                    Next
                  </button>
                </nav>
              </div>
            ) : null}
          </div>
        )}
      </section>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className={cn(
              'relative z-10 flex h-full w-full max-w-sm flex-col border-l p-6 shadow-2xl',
              isDark ? 'border-[#21262d] bg-[#0d1117]' : 'border-[#e8ecf0] bg-white'
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className={cn('text-lg font-bold', heading)}>Filters</h3>
              <button type="button" onClick={() => setFiltersOpen(false)} className={muted}>
                <X className="size-5" />
              </button>
            </div>
            <label className={cn('mb-2 text-xs font-semibold uppercase tracking-wider', muted)}>
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className={cn('mb-6 h-11 w-full rounded-[10px] border px-3 text-sm outline-none', searchBg)}
            />
            <p className={cn('mb-2 text-xs font-semibold uppercase tracking-wider', muted)}>
              Category
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {['Music', 'Nightlife', 'Food', 'Arts', 'Comedy', 'Jazz'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? null : c)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs', category === c ? pillActive : pillIdle)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="mb-6 flex items-center justify-between gap-3">
              <span className={cn('text-sm', heading)}>This weekend only</span>
              <input
                type="checkbox"
                checked={weekendOnly}
                onChange={(e) => setWeekendOnly(e.target.checked)}
                className="size-4 accent-[#ff6b35]"
              />
            </label>
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={clearAll}
                className={cn('flex-1 rounded-[10px] border py-3 text-sm font-semibold', pillIdle)}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-[10px] bg-[#ff6b35] py-3 text-sm font-bold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {!embedInLightWeb && <SiteFooter className="mt-auto shrink-0" />}
      <GetAppModal open={appModalOpen} onClose={() => setAppModalOpen(false)} />
      <EventDetailPopup
        eventId={selectedEventId}
        open={selectedEventId != null}
        onClose={closeEvent}
      />
    </div>
  );
};

function FeaturedEventsCarousel({
  events,
  card,
  heading,
  muted,
  onOpen,
}: {
  events: SeededEvent[];
  card: string;
  heading: string;
  muted: string;
  onOpen: (id: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = events.length;

  useEffect(() => {
    setIndex(0);
  }, [events]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const goTo = (next: number) => {
    setIndex(((next % count) + count) % count);
  };

  const active = events[index] ?? events[0];
  if (!active) return null;

  return (
    <div
      className={cn('relative overflow-hidden rounded-[20px] border', card)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative min-h-[200px] md:min-h-[280px]">
        {events.map((event, i) => {
          const isActive = i === index;
          return (
            <button
              key={event.id}
              type="button"
              tabIndex={isActive ? 0 : -1}
              aria-hidden={!isActive}
              onClick={() => onOpen(event.id)}
              className={cn(
                'flex w-full flex-col text-left transition-opacity duration-700 ease-in-out md:flex-row',
                isActive
                  ? 'relative z-10 opacity-100'
                  : 'pointer-events-none absolute inset-0 z-0 opacity-0'
              )}
            >
              <div className="relative h-[200px] w-full shrink-0 md:h-[280px] md:w-1/2">
                <img
                  src={event.image_url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col items-start justify-center gap-3 px-6 py-8 sm:px-7">
                <p className="text-[11px] font-semibold tracking-[1.4px] text-[#ff6b35]">
                  FEATURED
                  {count > 1 ? (
                    <span className={cn('ml-2 font-medium tracking-normal', muted)}>
                      {i + 1} / {count}
                    </span>
                  ) : null}
                </p>
                <h3 className={cn('text-[26px] font-bold leading-tight', heading)}>
                  {event.title}
                </h3>
                <p className={cn('text-sm whitespace-pre', muted)}>
                  {event.dateLabel}  ·  {event.location.split(',')[0]}  ·  {event.ticketLabel}
                </p>
                <span className="rounded-[10px] bg-[#ff6b35] px-[18px] py-3 text-sm font-semibold text-white">
                  Get tickets
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 md:bottom-4 md:justify-end md:pr-7">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Previous featured event"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              className="flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              ‹
            </button>
            {events.map((event, i) => (
              <button
                key={event.id}
                type="button"
                aria-label={`Show featured event ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-[#ff6b35]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                )}
              />
            ))}
            <button
              type="button"
              aria-label="Next featured event"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              className="flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SeedCard({
  event,
  card,
  heading,
  muted,
  onOpen,
}: {
  event: SeededEvent;
  card: string;
  heading: string;
  muted: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('overflow-hidden rounded-2xl border text-left transition-opacity hover:opacity-95', card)}
    >
      <div className="relative h-[180px] w-full overflow-hidden">
        <img src={event.image_url} alt="" className="size-full object-cover" />
        {event.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[#ff6b35] px-2.5 py-1 text-[10px] font-semibold text-white">
            Featured
          </span>
        )}
      </div>
      <div className="space-y-1.5 px-3.5 pb-3.5 pt-3">
        <p className="text-[10px] font-semibold tracking-[1px] text-[#ff6b35]">
          {event.category.toUpperCase()}
        </p>
        <h3 className={cn('line-clamp-1 text-[15px] font-semibold', heading)}>{event.title}</h3>
        <p className={cn('text-xs whitespace-pre', muted)}>
          {event.dateLabel}  ·  {event.location.split(',')[0]}
        </p>
        <div className="flex items-center justify-between pt-1">
          <p className={cn('text-[13px] font-bold', heading)}>{event.ticketLabel}</p>
          <span className="rounded-lg bg-[rgba(255,107,53,0.15)] px-3 py-1.5 text-[11px] font-semibold text-[#ff6b35]">
            Tickets
          </span>
        </div>
      </div>
    </button>
  );
}

export default EventsPage;
