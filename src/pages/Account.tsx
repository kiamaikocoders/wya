import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  Ticket,
  User,
  Download,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EventDetailPopup } from '@/components/events/EventDetailPopup';
import { resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { cn } from '@/lib/utils';

type HubEventRow = {
  id: number;
  title: string;
  date: string;
  location?: string;
  imageUrl?: string;
  category?: string;
  description?: string;
  price?: number;
  ticketId?: number;
  ticketStatus?: string;
  hasTicket: boolean;
};

/**
 * Light-web hub: upcoming events (ticketed + browse), past ticketed events, get-app CTA.
 */
const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: () => ticketService.getUserTickets(),
    enabled: !!user?.id,
  });

  const { data: upcomingFeed = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homeFeedEvents', 'web-account'],
    queryFn: () => eventService.getHomeFeedEvents(40),
    staleTime: 60_000,
  });

  const { upcomingRows, pastTicketed, upcomingTicketCount } = useMemo(() => {
    const now = new Date();
    const ticketMap = new Map<number, (typeof tickets)[number]>();
    for (const ticket of tickets) {
      if (ticket.status === 'cancelled') continue;
      const existing = ticketMap.get(ticket.event_id);
      if (!existing || new Date(ticket.event_date) < new Date(existing.event_date)) {
        ticketMap.set(ticket.event_id, ticket);
      }
    }

    const rows: HubEventRow[] = upcomingFeed.map((event) => {
      const ticket = ticketMap.get(event.id);
      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        imageUrl: event.image_url || resolveCategoryImage(event.category),
        category: event.category,
        description: event.description,
        price: event.price,
        ticketId: ticket?.id,
        ticketStatus: ticket?.status,
        hasTicket: Boolean(ticket),
      };
    });

    for (const ticket of tickets) {
      if (ticket.status === 'cancelled') continue;
      if (new Date(ticket.event_date) < now) continue;
      if (rows.some((r) => r.id === ticket.event_id)) continue;
      rows.push({
        id: ticket.event_id,
        title: ticket.event_title,
        date: ticket.event_date,
        imageUrl: resolveCategoryImage(undefined),
        ticketId: ticket.id,
        ticketStatus: ticket.status,
        hasTicket: true,
      });
    }

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const past = tickets
      .filter((t) => t.status !== 'cancelled' && new Date(t.event_date) < now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    const upcomingCount = tickets.filter(
      (t) => t.status !== 'cancelled' && new Date(t.event_date) >= now
    ).length;

    return { upcomingRows: rows, pastTicketed: past, upcomingTicketCount: upcomingCount };
  }, [upcomingFeed, tickets]);

  const displayName =
    user?.full_name || user?.name || user?.email?.split('@')[0] || 'Your account';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const isLoading = ticketsLoading || eventsLoading;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pb-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border border-border">
          <AvatarImage src={user?.avatar_url || user?.profile_picture || undefined} alt="" />
          <AvatarFallback className="bg-primary/15 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Full experience
            </h2>
            <p className="mt-1 text-sm text-foreground">
              Discover, chat, sponsors, and hosting live in the WYA app.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-kenya-orange text-kenya-dark hover:bg-kenya-orange/90">
            <Link to="/download">
              <Download className="mr-2 h-4 w-4" />
              Get app
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming
          </h2>
          <Link
            to="/events"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Browse all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
          </div>
        ) : upcomingRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No upcoming events right now.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/events">Browse events</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcomingRows.slice(0, 8).map((event) => (
              <li key={`${event.id}-${event.ticketId ?? 'open'}`}>
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
                    'flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left transition',
                    'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <img
                      src={event.imageUrl || resolveCategoryImage(event.category)}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-semibold text-foreground">{event.title}</p>
                      <Badge
                        variant={event.hasTicket ? 'default' : 'secondary'}
                        className="shrink-0 capitalize"
                      >
                        {event.hasTicket ? 'Your ticket' : 'Get tickets'}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(event.date)}
                      {event.location ? ` · ${event.location.split(',')[0]}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Ticket className="h-5 w-5 text-primary" />
            Past events
          </h2>
          <Link
            to="/tickets"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            All tickets
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {ticketsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
          </div>
        ) : pastTicketed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No past ticketed events yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {pastTicketed.slice(0, 5).map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{ticket.event_title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(ticket.event_date)}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {ticket.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          to="/tickets"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">My tickets</p>
            <p className="text-xs text-muted-foreground">
              {tickets.length} total · {upcomingTicketCount} upcoming
            </p>
          </div>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Profile</p>
            <p className="text-xs text-muted-foreground">Name, email, photo</p>
          </div>
        </Link>
        <Link
          to="/notifications"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 sm:col-span-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Recent updates</p>
          </div>
        </Link>
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
