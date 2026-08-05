import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { Button } from '@/components/ui/button';
import { EventDetailPopup } from '@/components/events/EventDetailPopup';
import { formatEventPrice, resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

/**
 * Figma redesign home — hero, stats strip, 3-up event cards (light + dark).
 */
const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: () => ticketService.getUserTickets(),
    enabled: !!user?.id,
  });

  const { data: upcomingFeed = [], isLoading } = useQuery({
    queryKey: ['homeFeedEvents', 'web-account'],
    queryFn: () => eventService.getHomeFeedEvents(40),
    staleTime: 60_000,
  });

  const { data: homeStats } = useQuery({
    queryKey: ['companionHomeStats'],
    queryFn: () => eventService.getCompanionHomeStats(),
    staleTime: 60_000,
  });

  const formatStat = (n: number | undefined) => {
    if (n == null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
  };

  const featuredEvents = useMemo(() => {
    const ticketedIds = new Set(
      tickets.filter((t) => t.status !== 'cancelled').map((t) => t.event_id)
    );

    return upcomingFeed.slice(0, 3).map((event) => ({
      ...event,
      imageUrl: event.image_url || resolveCategoryImage(event.category),
      hasTicket: ticketedIds.has(event.id),
      ticketId: tickets.find((t) => t.event_id === event.id && t.status !== 'cancelled')?.id,
    }));
  }, [upcomingFeed, tickets]);

  const stats = {
    eventsThisWeek: formatStat(homeStats?.eventsThisWeek),
    activeUsers: formatStat(homeStats?.activeUsers),
    cities: formatStat(homeStats?.cities),
  };

  const formatCardMeta = (iso: string, location?: string) => {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const city = location?.split(',')[0]?.trim() || 'Kenya';
    return `${datePart} · ${city}`;
  };

  const priceLabel = (price?: number | null) => {
    const formatted = formatEventPrice(price);
    if (formatted === 'Free') return 'Free';
    return `From ${formatted}`;
  };

  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12', companion.page)}>
      <section className="relative h-[220px] overflow-hidden rounded-2xl sm:h-[280px]">
        <img
          src="/companion/hero-home.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/70" />
        <div className="absolute bottom-8 left-6 right-6 sm:left-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Find your next night out</h1>
          <p className="mt-2 max-w-xl text-sm text-[#e6edf3] sm:text-base">
            Events, tickets, and stories across Nairobi &amp; beyond
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-0">
        {[
          { value: stats.eventsThisWeek, label: 'Events this week' },
          { value: stats.activeUsers, label: 'Active users' },
          { value: stats.cities, label: 'Cities' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'flex h-20 flex-col items-center justify-center gap-1 px-6',
              companion.card,
              'sm:rounded-none sm:first:rounded-l-xl sm:last:rounded-r-xl sm:[&:not(:first-child)]:border-l-0'
            )}
          >
            <p className={cn('text-2xl font-bold', companion.heading)}>{stat.value}</p>
            <p className={cn('text-[13px]', companion.muted)}>{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={cn('text-lg font-semibold', companion.heading)}>Happening soon</h2>
          <Link to="/" className={cn('text-sm font-medium hover:underline', companion.accent)}>
            Browse all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div
              className={cn(
                'h-10 w-10 animate-spin rounded-full border-t-2 border-b-2',
                companion.spinner
              )}
            />
          </div>
        ) : featuredEvents.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border border-dashed px-5 py-12 text-center',
              companion.border,
              companion.surface
            )}
          >
            <p className={cn('text-sm', companion.muted)}>No upcoming events right now.</p>
            <Button asChild className={cn('mt-4', companion.accentBtn)}>
              <Link to="/">Browse events</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (event.hasTicket && event.ticketId) {
                      navigate(`/tickets/${event.ticketId}`);
                      return;
                    }
                    setSelectedEventId(event.id);
                  }}
                  className={cn(
                    'flex w-full flex-col overflow-hidden text-left transition',
                    companion.card,
                    'hover:border-[#ff6b35]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]'
                  )}
                >
                  <div className="relative h-[200px] w-full overflow-hidden bg-[#f6f8fa] dark:bg-[#0d1117]">
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
                    <p className={cn('line-clamp-1 text-base font-semibold', companion.heading)}>
                      {event.title}
                    </p>
                    <p className={cn('text-[13px]', companion.muted)}>
                      {formatCardMeta(event.date, event.location)}
                    </p>
                    <p className={cn('text-sm font-medium', companion.accent)}>
                      {priceLabel(event.price)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EventDetailPopup
        eventId={selectedEventId}
        open={selectedEventId != null}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
};

export default Account;
