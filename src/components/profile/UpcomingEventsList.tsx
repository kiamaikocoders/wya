import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Event } from '@/types/event.types';

interface UpcomingEventsListProps {
  events: Event[];
}

const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-white/40" />
        <p className="text-white/70">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        let formattedDate = event.date;
        try {
          formattedDate = format(parseISO(event.date), 'MMM d');
        } catch (e) {
          // Keep original date if parsing fails
        }

        return (
          <Link key={event.id} to={`/events/${event.id}`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image_url || 'https://placehold.co/100x100?text=Event'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1 truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default UpcomingEventsList;
