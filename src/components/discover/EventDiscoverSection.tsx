import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EventContentCarousel from './EventContentCarousel';
import { DiscoverContent } from './ContentCard';
import { cn } from '@/lib/utils';

export interface EventDiscoverGroup {
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    image_url?: string;
  };
  content: DiscoverContent[];
  totalContent: number;
}

interface EventDiscoverSectionProps {
  eventGroup: EventDiscoverGroup;
  isActive: boolean;
  initialContentIndex?: number;
  onContentChange?: (contentIndex: number) => void;
  onExpand?: (contentId: string | number) => void;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
}

const EventDiscoverSection: React.FC<EventDiscoverSectionProps> = ({
  eventGroup,
  isActive,
  initialContentIndex,
  onContentChange,
  onExpand,
  onLike,
  onShare,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleEventClick = () => {
    // Don't navigate for virtual events (Community Discover)
    if (eventGroup.event.id === 0) {
      return;
    }
    navigate(`/events/${eventGroup.event.id}`);
  };

  const handleContentClick = (content: DiscoverContent) => {
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
        // Full viewport height - content bleeding (TikTok style)
        'h-screen',
        'flex flex-col',
        'snap-start snap-always'
      )}
      data-event-id={eventGroup.event.id}
    >
      {/* Content Carousel fills the section - TikTok style full viewport */}
      <div className="flex-1 flex items-center">
        {eventGroup.content.length > 0 ? (
          <EventContentCarousel
            content={eventGroup.content}
            eventTitle={eventGroup.event.title}
            eventMetadata={{
              id: eventGroup.event.id,
              title: eventGroup.event.title,
              date: eventGroup.event.date,
              location: eventGroup.event.location,
              totalContent: eventGroup.totalContent,
            }}
            initialIndex={initialContentIndex}
            isSectionActive={isActive}
            onItemChange={onContentChange}
            onItemClick={handleContentClick}
            onLike={onLike}
            onShare={onShare}
            onEventClick={handleEventClick}
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

export default EventDiscoverSection;

