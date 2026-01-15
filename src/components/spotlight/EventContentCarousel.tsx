import React, { useEffect, useMemo, useRef, useState } from 'react';
import ContentCard, { SpotlightContent, EventMetadata } from './ContentCard';
import { cn } from '@/lib/utils';

interface EventContentCarouselProps {
  content: SpotlightContent[];
  eventTitle?: string;
  eventMetadata?: EventMetadata;
  initialIndex?: number;
  onItemChange?: (index: number) => void;
  onItemClick?: (item: SpotlightContent) => void;
  onLike?: (id: string | number) => void;
  onShare?: (id: string | number) => void;
  onEventClick?: (eventId: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const EventContentCarousel: React.FC<EventContentCarouselProps> = ({
  content,
  eventTitle,
  eventMetadata,
  initialIndex = 0,
  onItemChange,
  onItemClick,
  onLike,
  onShare,
  onEventClick,
  autoPlay = false,
  autoPlayInterval = 5000,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, content.length - 1))
  );

  const ids = useMemo(() => content.map((c) => `${c.type}-${c.id}`), [content]);

  // Notify parent of index change
  useEffect(() => {
    onItemChange?.(currentIndex);
  }, [currentIndex, onItemChange]);

  // Snap to initial/current index when content changes
  useEffect(() => {
    const el = itemRefs.current[currentIndex];
    el?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, inline: 'center', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  // Observe which card is centered in the horizontal scroller
  useEffect(() => {
    if (!scrollRef.current) return;
    const root = scrollRef.current;

    const observers = itemRefs.current.map((node, index) => {
      if (!node) return null;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              setCurrentIndex(index);
            }
          });
        },
        { root, threshold: [0.6] }
      );
      obs.observe(node);
      return obs;
    });

    return () => observers.forEach((o) => o?.disconnect());
  }, [ids]);

  // Optional autoplay: scroll to next item
  useEffect(() => {
    if (!autoPlay || content.length <= 1) return;
    const t = setInterval(() => {
      const next = (currentIndex + 1) % content.length;
      itemRefs.current[next]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, autoPlayInterval);
    return () => clearInterval(t);
  }, [autoPlay, autoPlayInterval, content.length, currentIndex]);

  if (!content || content.length === 0) {
    return null;
  }

  return (
    // Center the reel experience on desktop.
    <div className="relative w-full md:max-w-[560px] lg:max-w-[620px] md:mx-auto">
      <div
        ref={scrollRef}
        className={cn(
          'flex w-full overflow-x-auto scrollbar-hide',
          'snap-x snap-mandatory',
          'px-0'
        )}
      >
        {content.map((item, index) => (
          <div
            key={`${item.type}-${item.id}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={cn(
              'snap-center shrink-0 grow-0 basis-full'
            )}
          >
            <ContentCard
              content={item}
              isHero={true}
              position="center"
              onClick={() => onItemClick?.(item)}
              onExpand={() => onItemClick?.(item)}
              onLike={onLike}
              onShare={onShare}
              eventMetadata={eventMetadata}
              onEventClick={onEventClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventContentCarousel;

