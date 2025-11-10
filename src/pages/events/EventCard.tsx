import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Calendar, MapPin, Ticket, User } from 'lucide-react';
import type { Event } from '@/types/event.types';
import { cn } from '@/lib/utils';

type EventCardProps = {
  event: Event;
  variant?: 'grid' | 'list';
};

const EventCard = memo(({ event, variant = 'grid' }: EventCardProps) => {
  const ticketLabel =
    event.price && event.price > 0 ? `KES ${event.price.toLocaleString()}` : 'Free';

  return (
    <motion.article
      whileHover={{ translateY: -6 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-black/60 shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition',
        variant === 'list' && 'flex flex-col md:flex-row'
      )}
    >
      <Link to={`/events/${event.id}`} className={cn('block', variant === 'list' ? 'md:flex md:flex-1' : '')}>
        <div
          className={cn(
            'relative overflow-hidden',
            variant === 'list' ? 'md:w-64 md:flex-shrink-0' : 'h-48'
          )}
        >
          <img
            src={event.image_url || '/placeholder.svg'}
            alt={event.title}
            className={cn(
              'h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]',
              variant === 'list' ? 'md:h-full md:w-full' : 'h-48'
            )}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center justify-between">
              {event.featured && (
                <Badge className="rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark shadow-[0_0_18px_rgba(255,128,0,0.45)]">
                  Featured
                </Badge>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.slice(0, 2).map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-black/60 text-xs text-white/80 backdrop-blur"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {event.tags.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-black/60 text-xs text-white/80 backdrop-blur"
                    >
                      +{event.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6 text-white">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white group-hover:text-kenya-orange">
              {event.title}
            </h3>
            <p className="mt-2 text-sm text-white/70 line-clamp-2">{event.description}</p>
          </div>
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-kenya-orange" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-kenya-orange" />
              <span>{event.location}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-kenya-orange" />
                <span>{event.capacity} slots</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-kenya-orange" />
              <span>{ticketLabel}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(index => (
                <span
                  key={index}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/30 bg-white/10 text-xs font-semibold text-white/70 backdrop-blur"
                >
                  {String.fromCharCode(65 + index)}
                </span>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-2 rounded-full text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              View details
            </Button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;

