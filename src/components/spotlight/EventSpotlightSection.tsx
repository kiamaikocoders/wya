import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import EventContentCarousel from './EventContentCarousel';
import { SpotlightContent } from './ContentCard';
import { cn } from '@/lib/utils';

export interface EventSpotlightGroup {
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    image_url?: string;
  };
  content: SpotlightContent[];
  totalContent: number;
}

interface EventSpotlightSectionProps {
  eventGroup: EventSpotlightGroup;
  isActive: boolean;
  onContentChange?: (contentIndex: number) => void;
  onExpand?: (contentId: string | number) => void;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
}

const EventSpotlightSection: React.FC<EventSpotlightSectionProps> = ({
  eventGroup,
  isActive,
  onContentChange,
  onExpand,
  onLike,
  onShare,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleEventClick = () => {
    // Don't navigate for virtual events (Community Spotlight)
    if (eventGroup.event.id === 0) {
      return;
    }
    navigate(`/events/${eventGroup.event.id}`);
  };

  const handleContentClick = (content: SpotlightContent) => {
    if (content.type === 'story') {
      // Navigate to story detail or expand modal
      onExpand?.(content.id);
    } else {
      // Navigate to forum post
      navigate(`/forum/${content.id}`);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative w-full',
        // Full viewport height inside SpotlightPage scroll container
        'h-[calc(100vh-144px)]',
        'flex flex-col',
        'snap-start snap-always'
      )}
      data-event-id={eventGroup.event.id}
    >
      {/* Overlay Event Header (no blank space) */}
      <div className="absolute top-4 left-0 right-0 z-20">
        <div className="container mx-auto px-4">
          <div className="inline-flex max-w-full flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md">
            <h2
              onClick={handleEventClick}
              className={cn(
                'text-lg md:text-2xl font-bold text-white leading-tight',
                eventGroup.event.id !== 0 && 'cursor-pointer hover:text-kenya-orange',
                eventGroup.event.id === 0 && 'cursor-default'
              )}
            >
              {eventGroup.event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(eventGroup.event.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{eventGroup.event.location}</span>
              </div>
              <div className="text-white/50">
                {eventGroup.totalContent} {eventGroup.totalContent === 1 ? 'story' : 'stories'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Carousel fills the section */}
      <div className="flex-1 flex items-center">
        {eventGroup.content.length > 0 ? (
          <EventContentCarousel
            content={eventGroup.content}
            eventTitle={eventGroup.event.title}
            onItemChange={onContentChange}
            onItemClick={handleContentClick}
            onLike={onLike}
            onShare={onShare}
          />
        ) : (
          <div className="w-full text-center text-white/50 py-12">
            <div className="max-w-md mx-auto">
              <p className="text-lg mb-2">No content available</p>
              <p className="text-sm text-white/40">
                Stories and posts for this event will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventSpotlightSection;

