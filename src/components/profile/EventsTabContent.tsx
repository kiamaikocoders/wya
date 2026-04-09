import React from 'react';
import EventsAttendedCarousel from './EventsAttendedCarousel';
import FriendsEventActivitySection from './FriendsEventActivitySection';
import type { Event } from '@/types/event.types';

interface EventsTabContentProps {
  upcomingEvents: Event[];
  attendedEvents: Event[];
  allEvents: Event[];
}

const EventsTabContent: React.FC<EventsTabContentProps> = ({
  upcomingEvents,
  attendedEvents,
  allEvents,
}) => {
  return (
    <div className="space-y-8">
      {/* Upcoming Events Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
        <EventsAttendedCarousel
          events={upcomingEvents}
          emptyTitle="No upcoming events"
          emptyDescription="Browse events happening soon."
          emptyCtaLabel="Browse Events"
          emptyCtaHref="/events"
        />
      </div>

      {/* Friend Activities (mutuals) */}
      <FriendsEventActivitySection events={allEvents} className="pt-2" />

      {/* Events Attended Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Events Attended</h2>
        <EventsAttendedCarousel
          events={attendedEvents}
          emptyTitle="No events attended yet"
          emptyDescription="Grab a ticket and start exploring."
          emptyCtaLabel="Find Events"
          emptyCtaHref="/events"
        />
      </div>
    </div>
  );
};

export default EventsTabContent;
