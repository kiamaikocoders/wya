import React, { useState, useEffect, useRef } from 'react';
import EventCard from './EventCard';
import type { Event } from '@/types/event.types';

interface InfiniteEventCarouselProps {
  events: Event[] | any[];
  emptyMessage?: string;
  className?: string;
  slidesToShow?: number;
  autoScrollSpeed?: number; // in milliseconds
}

const InfiniteEventCarousel: React.FC<InfiniteEventCarouselProps> = ({ 
  events, 
  emptyMessage = "No events available.",
  className = "",
  slidesToShow = 1.2,
  autoScrollSpeed = 3000
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responsiveSlidesToShow, setResponsiveSlidesToShow] = useState(slidesToShow);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update slidesToShow based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setResponsiveSlidesToShow(1.2);
      } else if (window.innerWidth < 768) { // md breakpoint
        setResponsiveSlidesToShow(1.5);
      } else if (window.innerWidth < 1024) { // lg breakpoint
        setResponsiveSlidesToShow(2.5);
      } else {
        setResponsiveSlidesToShow(3);
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  // Duplicate events for infinite scroll
  const duplicatedEvents = [...events, ...events, ...events];

  useEffect(() => {
    if (events.length === 0) return;

    const startAutoScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (!isPaused && scrollRef.current) {
          setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            const maxIndex = events.length;
            return nextIndex >= maxIndex ? 0 : nextIndex;
          });
        }
      }, autoScrollSpeed); // Auto-scroll with custom speed
    };

    startAutoScroll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [events.length, isPaused, autoScrollSpeed]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollAmount = (currentIndex % events.length) * (100 / responsiveSlidesToShow);
      scrollRef.current.style.transform = `translateX(-${scrollAmount}%)`;
    }
  }, [currentIndex, events.length, responsiveSlidesToShow]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleCardHover = () => {
    setIsPaused(true);
  };

  const handleCardLeave = () => {
    setIsPaused(false);
  };

  if (!events || events.length === 0) {
    return <p className="text-center text-kenya-brown-light py-4">{emptyMessage}</p>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ width: `${(duplicatedEvents.length / responsiveSlidesToShow) * 100}%` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {duplicatedEvents.map((event, index) => (
          <div 
            key={`${event.id}-${index}`}
            className="flex-shrink-0 px-1 sm:px-2"
            style={{ width: `${100 / duplicatedEvents.length}%` }}
          >
            <div 
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
              className="h-full"
            >
              <EventCard 
                id={String(event.id)}
                title={event.title}
                category={event.category}
                date={event.date}
                location={event.location}
                image={event.image_url || event.image}
                capacity={event.capacity || 100}
                attendees={Math.floor(Math.random() * 100)}
                isFeatured={event.featured || event.is_featured}
                price={event.price}
                event={event}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {events.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? "bg-kenya-orange w-6" 
                : "bg-kenya-brown-light opacity-50"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-xs">Paused</span>
        </div>
      )}
    </div>
  );
};

export default InfiniteEventCarousel;
