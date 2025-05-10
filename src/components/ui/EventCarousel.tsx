
import React, { useState } from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import type { Event } from '@/types/event.types';
import EventCard from './EventCard';

interface EventCarouselProps {
  events: Event[] | any[];
  title?: string;
  emptyMessage?: string;
  className?: string;
  slidesToShow?: number;
}

const EventCarousel: React.FC<EventCarouselProps> = ({ 
  events, 
  title, 
  emptyMessage = "No events available.",
  className = "",
  slidesToShow = 3
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!events || events.length === 0) {
    return <p className="text-center text-kenya-brown-light py-4">{emptyMessage}</p>;
  }

  return (
    <div className={`relative ${className}`}>
      <Carousel
        opts={{
          align: "start",
          loop: events.length > slidesToShow,
        }}
        className="w-full"
        onSelect={(api) => {
          const index = api?.selectedScrollSnap();
          if (typeof index === 'number') {
            setActiveIndex(index);
          }
        }}
      >
        <CarouselContent className="-ml-4">
          {events.map((event, index) => (
            <CarouselItem 
              key={event.id || index} 
              className={`pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/${slidesToShow} transition-opacity duration-300`}
            >
              <div className="h-full">
                <EventCard 
                  id={String(event.id)}
                  title={event.title}
                  category={event.category}
                  date={event.date}
                  location={event.location}
                  image={event.image_url}
                  capacity={100}
                  attendees={Math.floor(Math.random() * 100)}
                  isFeatured={event.is_featured}
                  price={event.price}
                  event={event}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
          {events.slice(0, Math.min(events.length, 8)).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                activeIndex === index 
                  ? "bg-kenya-orange w-4" 
                  : "bg-kenya-brown-light opacity-50"
              }`}
              onClick={() => {
                const carousel = document.querySelector('[role="region"][aria-roledescription="carousel"]');
                if (carousel) {
                  const items = carousel.querySelectorAll('[role="group"]');
                  if (items[index]) {
                    items[index].scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'center'
                    });
                  }
                }
              }}
            />
          ))}
        </div>
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-none" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-none" />
      </Carousel>
    </div>
  );
};

export default EventCarousel;
