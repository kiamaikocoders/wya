import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: number;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  image_url?: string;
}

interface InterestedEventsSectionProps {
  events: Event[];
  className?: string;
}

const InterestedEventsSection: React.FC<InterestedEventsSectionProps> = ({ events, className }) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`mt-8 ${className}`}>
      <div className="px-6 mb-4">
        <h2 className="text-lg font-bold text-white">Interested Events</h2>
      </div>
      <div className="px-6 space-y-4">
        {events.slice(0, 5).map((event) => {
          const eventDate = new Date(event.date);
          const month = format(eventDate, 'MMM').toUpperCase();
          const day = format(eventDate, 'd');
          
          const startTime = event.start_time 
            ? new Date(`${event.date}T${event.start_time}`).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            : null;
          const endTime = event.end_time
            ? new Date(`${event.date}T${event.end_time}`).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            : null;
          const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : null;

          return (
            <Link key={event.id} to={`/events/${event.id}`}>
              <div className="flex gap-4 p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all cursor-pointer">
                {/* Date Box */}
                <div className="w-16 h-16 bg-orange-500/10 rounded-xl flex flex-col items-center justify-center text-orange-500 flex-shrink-0">
                  <span className="text-xs font-bold uppercase">{month}</span>
                  <span className="text-xl font-bold">{day}</span>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{event.title}</h3>
                  {timeRange && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {timeRange}
                    </p>
                  )}
                </div>

                {/* Menu Button */}
                <button
                  className="self-center p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // TODO: Add event menu functionality
                  }}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default InterestedEventsSection;
