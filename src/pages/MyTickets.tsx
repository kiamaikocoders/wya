import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, CheckCircle, Info, Ticket as TicketIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ticketService, Ticket } from '@/lib/ticket-service';
import { eventService, type Event } from '@/lib/event-service';
import { toast } from 'sonner';
import { isNativeApp } from '@/lib/post-auth-navigation';
import { EventDetailPopup } from '@/components/events/EventDetailPopup';
import { formatEventPrice, resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { cn } from '@/lib/utils';

type UpcomingRow =
  | { kind: 'ticket'; ticket: Ticket }
  | { kind: 'event'; event: Event };

/**
 * Tickets hub: upcoming shows ticketed events + discoverable events to buy;
 * past remains ticketed history.
 */
const MyTickets = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const allowCancel = isNativeApp();

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch,
  } = useQuery({
    queryKey: ['userTickets'],
    queryFn: ticketService.getUserTickets,
  });

  const { data: upcomingFeed = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homeFeedEvents', 'tickets-hub'],
    queryFn: () => eventService.getHomeFeedEvents(50),
    staleTime: 60_000,
  });

  const handleCancelTicket = async (ticketId: number) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      try {
        await ticketService.cancelTicket(ticketId);
        void refetch();
      } catch {
        toast.error('Failed to cancel ticket');
      }
    }
  };

  const { upcomingRows, pastTickets } = useMemo(() => {
    const now = new Date();
    const activeTickets = tickets.filter((t) => t.status !== 'cancelled');
    const ticketByEvent = new Map<number, Ticket>();
    for (const ticket of activeTickets) {
      const existing = ticketByEvent.get(ticket.event_id);
      if (!existing || new Date(ticket.event_date) < new Date(existing.event_date)) {
        ticketByEvent.set(ticket.event_id, ticket);
      }
    }

    const rows: UpcomingRow[] = [];
    const seen = new Set<number>();

    for (const ticket of activeTickets) {
      if (new Date(ticket.event_date) < now) continue;
      if (seen.has(ticket.event_id)) continue;
      seen.add(ticket.event_id);
      rows.push({ kind: 'ticket', ticket });
    }

    for (const event of upcomingFeed) {
      if (seen.has(event.id)) continue;
      if (ticketByEvent.has(event.id)) continue;
      seen.add(event.id);
      rows.push({ kind: 'event', event });
    }

    rows.sort((a, b) => {
      const dateA = a.kind === 'ticket' ? a.ticket.event_date : a.event.date;
      const dateB = b.kind === 'ticket' ? b.ticket.event_date : b.event.date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    const past = activeTickets
      .filter((t) => new Date(t.event_date) < now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return { upcomingRows: rows, pastTickets: past };
  }, [tickets, upcomingFeed]);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return '';
    }
  };

  const isLoading = ticketsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="container flex justify-center py-8">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }

  const ticketedUpcomingCount = upcomingRows.filter((r) => r.kind === 'ticket').length;
  const openUpcomingCount = upcomingRows.filter((r) => r.kind === 'event').length;

  return (
    <div className="container py-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tickets & upcoming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your tickets plus events you can still get into — one smooth flow.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming ({upcomingRows.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Past ({pastTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {(ticketedUpcomingCount > 0 || openUpcomingCount > 0) && (
            <p className="text-sm text-muted-foreground">
              {ticketedUpcomingCount > 0 && (
                <span>{ticketedUpcomingCount} with your ticket</span>
              )}
              {ticketedUpcomingCount > 0 && openUpcomingCount > 0 && <span> · </span>}
              {openUpcomingCount > 0 && (
                <span>{openUpcomingCount} available to book</span>
              )}
            </p>
          )}

          {upcomingRows.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="p-8 text-center">
                  <Info className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No upcoming events</h3>
                  <p className="mb-4 text-muted-foreground">
                    Check the events browse for what’s coming up next.
                  </p>
                  <Button asChild>
                    <Link to="/events">Browse events</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcomingRows.map((row) =>
                row.kind === 'ticket' ? (
                  <div key={`ticket-${row.ticket.id}`} className="sm:col-span-2">
                    <TicketCard
                      ticket={row.ticket}
                      onCancel={allowCancel ? () => void handleCancelTicket(row.ticket.id) : undefined}
                      getBadgeColor={getBadgeColor}
                      isPast={false}
                      onOpenEvent={(id) => setSelectedEventId(id)}
                    />
                  </div>
                ) : (
                  <OpenEventCard
                    key={`event-${row.event.id}`}
                    event={row.event}
                    onOpen={() => setSelectedEventId(row.event.id)}
                  />
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="p-8 text-center">
                  <Info className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No past tickets</h3>
                  <p className="text-muted-foreground">You haven&apos;t attended any events yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pastTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  getBadgeColor={getBadgeColor}
                  isPast
                  onOpenEvent={(id) => setSelectedEventId(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EventDetailPopup
        eventId={selectedEventId}
        open={selectedEventId != null}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
};

function OpenEventCard({ event, onOpen }: { event: Event; onOpen: () => void }) {
  const cover = event.image_url || resolveCategoryImage(event.category);
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = event.time
    ? event.time.slice(0, 5)
    : eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const tags = (event.tags ?? []).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition',
        'hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        <img
          src={cover}
          alt=""
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className="bg-kenya-orange text-kenya-dark hover:bg-kenya-orange">Get tickets</Badge>
          {event.featured && (
            <Badge className="bg-white/90 text-kenya-dark hover:bg-white">Featured</Badge>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#ff6b35]">
            {event.category || 'Event'}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">{event.title}</h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            {formattedDate} · {formattedTime}
          </span>
          {event.location && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm font-semibold text-foreground">{formatEventPrice(event.price)}</p>
          <span className="inline-flex items-center rounded-lg bg-[rgba(255,107,53,0.15)] px-3 py-1.5 text-xs font-semibold text-[#ff6b35]">
            <TicketIcon className="mr-1.5 h-3.5 w-3.5" />
            View details
          </span>
        </div>
      </div>
    </button>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onCancel?: () => void;
  getBadgeColor: (status: string) => string;
  isPast: boolean;
  onOpenEvent?: (eventId: number) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onCancel,
  getBadgeColor,
  isPast,
  onOpenEvent,
}) => {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const eventDate = new Date(ticket.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="flex flex-col overflow-hidden md:flex-row">
      <div className="flex flex-col justify-between bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 p-6 md:w-1/3">
        <div>
          <Badge className={`${getBadgeColor(ticket.status)} capitalize`}>{ticket.status}</Badge>
          <h3 className="mt-4 text-xl font-bold text-white">{ticket.event_title}</h3>
          <div className="mt-2 flex items-center gap-2 text-text-white/70">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-text-white/70">
            <TicketIcon className="h-4 w-4" />
            <span className="text-sm">Your ticket</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium text-white">{ticket.ticket_type}</div>
          <div className="text-lg font-bold text-white">
            {ticket.price > 0 ? `KSH ${ticket.price.toFixed(2)}` : 'Free'}
          </div>
        </div>
      </div>

      <div className="p-6 md:w-2/3">
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">Ticket details</h4>
              <p className="mt-1 text-sm text-muted-foreground">Reference: {ticket.reference_code}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Time</div>
              <div>{formattedTime}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Purchased</span>
            <span>{new Date(ticket.purchase_date).toLocaleDateString()}</span>
          </div>

          <div className="mt-4 border-t pt-4">
            {isPast ? (
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenEvent?.(ticket.event_id)}
                >
                  Event details
                </Button>
                <Link to={`/events/${ticket.event_id}/feedback`} className="flex-1">
                  <Button className="w-full">Leave feedback</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap justify-between gap-2">
                <Link to={`/tickets/${ticket.id}`} state={{ returnTo }} className="min-w-[8rem] flex-1">
                  <Button className="w-full">View ticket</Button>
                </Link>
                <Button
                  variant="outline"
                  className="min-w-[8rem] flex-1"
                  onClick={() => onOpenEvent?.(ticket.event_id)}
                >
                  Event details
                </Button>
                {ticket.status !== 'cancelled' && onCancel && (
                  <Button variant="outline" className="min-w-[8rem] flex-1" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MyTickets;
