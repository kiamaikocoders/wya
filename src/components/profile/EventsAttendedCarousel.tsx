import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import type { Event } from '@/types/event.types';

interface EventsAttendedCarouselProps {
  events: Event[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaLabel?: string;
  emptyCtaHref?: string;
  attendeesLabel?: string;
}

const EventsAttendedCarousel: React.FC<EventsAttendedCarouselProps> = ({
  events,
  emptyTitle = 'No events yet',
  emptyDescription,
  emptyCtaLabel = 'Browse Events',
  emptyCtaHref = '/events',
  attendeesLabel = 'attending',
}) => {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - startX;
    scrollRef.current.scrollLeft = scrollLeft - x;
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-white/30" />
        <p className="text-white font-semibold">{emptyTitle}</p>
        {!!emptyDescription && (
          <p className="mt-2 text-sm text-white/60">{emptyDescription}</p>
        )}
        {!!emptyCtaLabel && (
          <Link to={emptyCtaHref} className="inline-block">
            <Button
              className="mt-6 rounded-full bg-gradient-to-r bg-gradient-accent px-6 py-3 font-semibold text-black shadow-[0_0_22px_rgba(255,128,0,0.35)] hover:shadow-[0_0_32px_rgba(255,128,0,0.5)]"
            >
              {emptyCtaLabel}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {events.map((event) => {
          let formattedDate = event.date;
          try {
            formattedDate = format(parseISO(event.date), 'MMM d');
          } catch (e) {
            // Keep original date if parsing fails
          }

          return (
            <Card
              key={event.id}
              className="min-w-[220px] max-w-[220px] bg-[#1A1A1A] border border-white/8 overflow-hidden flex-shrink-0 rounded-xl shadow-lg hover:border-white/15 transition-all hover:shadow-xl"
            >
              <Link to={`/events/${event.id}`} state={{ returnTo }} className="block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={event.image_url || 'https://placehold.co/200x300?text=Event'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-white/70 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Users className="h-3 w-3" />
                    <span>25 {attendeesLabel}</span>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
      
      {events.length > 2 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white border border-white/10 rounded-full h-10 w-10 backdrop-blur-sm shadow-lg"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
};

export default EventsAttendedCarousel;
