import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ticketService, type Ticket } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

/**
 * Figma redesign tickets — Upcoming/Past rows with View QR (light + dark).
 */
const MyTickets = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['userTickets'],
    queryFn: ticketService.getUserTickets,
  });

  const { data: upcomingFeed = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homeFeedEvents', 'tickets-hub'],
    queryFn: () => eventService.getHomeFeedEvents(50),
    staleTime: 60_000,
  });

  const imageByEventId = useMemo(() => {
    const map = new Map<number, string>();
    for (const event of upcomingFeed) {
      map.set(event.id, event.image_url || resolveCategoryImage(event.category));
    }
    return map;
  }, [upcomingFeed]);

  const { upcomingTickets, pastTickets } = useMemo(() => {
    const now = new Date();
    const active = tickets.filter((t) => t.status !== 'cancelled');
    const upcoming = active
      .filter((t) => new Date(t.event_date) >= now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    const past = active
      .filter((t) => new Date(t.event_date) < now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    return { upcomingTickets: upcoming, pastTickets: past };
  }, [tickets]);

  const isLoading = ticketsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-16', companion.page)}>
        <div
          className={cn(
            'h-12 w-12 animate-spin rounded-full border-t-2 border-b-2',
            companion.spinner
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12', companion.page)}>
      <h1 className={cn('text-3xl font-bold', companion.heading)}>My Tickets</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList
          className={cn(
            'grid h-11 w-full max-w-md grid-cols-2 gap-1 rounded-full border p-1',
            companion.border,
            'bg-[#eaeef2] dark:bg-[#161b22]'
          )}
        >
          <TabsTrigger
            value="upcoming"
            className={cn(
              'h-full rounded-full text-sm transition-all',
              'data-[state=active]:bg-[#ff6b35] data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm',
              'data-[state=inactive]:bg-transparent data-[state=inactive]:font-medium data-[state=inactive]:text-[#656d76]',
              'dark:data-[state=inactive]:text-[#8b949e]'
            )}
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className={cn(
              'h-full rounded-full text-sm transition-all',
              'data-[state=active]:bg-[#ff6b35] data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm',
              'data-[state=inactive]:bg-transparent data-[state=inactive]:font-medium data-[state=inactive]:text-[#656d76]',
              'dark:data-[state=inactive]:text-[#8b949e]'
            )}
          >
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcomingTickets.length === 0 ? (
            <EmptyTickets
              title="No upcoming tickets"
              description="Browse events and grab a ticket for your next night out."
              showBrowse
            />
          ) : (
            upcomingTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                imageUrl={imageByEventId.get(ticket.event_id) || resolveCategoryImage(undefined)}
                returnTo={returnTo}
                showQr
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastTickets.length === 0 ? (
            <EmptyTickets
              title="No past tickets"
              description="You haven't attended any events yet."
            />
          ) : (
            pastTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                imageUrl={imageByEventId.get(ticket.event_id) || resolveCategoryImage(undefined)}
                returnTo={returnTo}
                showQr={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function EmptyTickets({
  title,
  description,
  showBrowse,
}: {
  title: string;
  description: string;
  showBrowse?: boolean;
}) {
  return (
    <div className={cn('px-6 py-12 text-center', companion.card)}>
      <Info className={cn('mx-auto mb-4 h-10 w-10', companion.muted)} />
      <h3 className={cn('mb-2 text-lg font-medium', companion.heading)}>{title}</h3>
      <p className={cn('mb-4 text-sm', companion.muted)}>{description}</p>
      {showBrowse && (
        <Button asChild className={companion.accentBtn}>
          <Link to="/">Browse events</Link>
        </Button>
      )}
    </div>
  );
}

function TicketRow({
  ticket,
  imageUrl,
  returnTo,
  showQr,
}: {
  ticket: Ticket;
  imageUrl: string;
  returnTo: string;
  showQr: boolean;
}) {
  const eventDate = new Date(ticket.event_date);
  const datePart = eventDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timePart = eventDate
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(' ', '')
    .toUpperCase();

  return (
    <div className={cn('flex flex-col gap-4 p-4 sm:flex-row sm:items-center', companion.card)}>
      <div className="relative h-[68px] w-20 shrink-0 overflow-hidden rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117]">
        <img src={imageUrl} alt="" className="size-full object-cover" loading="lazy" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('truncate text-base font-semibold', companion.heading)}>
          {ticket.event_title}
        </p>
        <p className={cn('text-[13px]', companion.muted)}>
          {datePart} · {timePart}
        </p>
        <p className={cn('text-[13px] font-medium', companion.accent)}>
          {ticket.ticket_type || 'General Admission'}
        </p>
      </div>
      {showQr ? (
        <Button
          asChild
          className={cn('shrink-0 px-4 py-2 text-[13px] font-semibold', companion.accentBtn)}
        >
          <Link to={`/tickets/${ticket.id}`} state={{ returnTo }}>
            View QR
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          variant="outline"
          className={cn(
            'shrink-0 bg-transparent text-[13px]',
            companion.border,
            companion.heading,
            'hover:bg-[#f6f8fa] dark:hover:bg-[#1c2233]'
          )}
        >
          <Link to={`/tickets/${ticket.id}`} state={{ returnTo }}>
            View ticket
          </Link>
        </Button>
      )}
    </div>
  );
}

export default MyTickets;
