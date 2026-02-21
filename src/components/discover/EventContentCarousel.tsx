import React, { useEffect, useMemo, useRef, useState } from 'react';
import ContentCard, { DiscoverContent, EventMetadata } from './ContentCard';
import { cn } from '@/lib/utils';

interface EventContentCarouselProps {
  content: DiscoverContent[];
  eventTitle?: string;
  eventMetadata?: EventMetadata;
  initialIndex?: number;
  /** When false, all cards pause and mute so sound doesn't play over other sections */
  isSectionActive?: boolean;
  /** When true, swiping past the last item wraps to the first (and vice versa). Default true. */
  loop?: boolean;
  onItemChange?: (index: number) => void;
  onItemClick?: (item: DiscoverContent) => void;
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
  isSectionActive = true,
  loop = true,
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
  const isJumpingRef = useRef(false);
  const scrollStartIndexRef = useRef<number>(0);
  const isScrollingRef = useRef(false);
  const currentIndexRef = useRef(0);

  // For loop: duplicate first item at end so last swipe can wrap to first
  const displayContent = useMemo(() => {
    if (!loop || content.length <= 1) return content;
    return [...content, content[0]];
  }, [content, loop]);

  const logicalIndex = (rawIndex: number) =>
    rawIndex >= content.length ? 0 : rawIndex;

  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, content.length - 1))
  );
  currentIndexRef.current = currentIndex;

  const ids = useMemo(() => content.map((c) => `${c.type}-${c.id}`), [content]);

  // Notify parent of logical index
  useEffect(() => {
    onItemChange?.(logicalIndex(currentIndex));
  }, [currentIndex, onItemChange]);

  // Snap to initial/current index when content changes (use scrollLeft to avoid moving page scroll)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const width = container.clientWidth;
    container.scrollLeft = currentIndex * width;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  // Endless loop: when we land on the duplicated last item (same as first), instantly jump back to first.
  // No delay so the loop feels continuous; scrollend limiter skips this case via isLoopWrapToFirst.
  useEffect(() => {
    if (!loop || displayContent.length <= content.length) return;
    if (currentIndex !== displayContent.length - 1) return;
    if (isJumpingRef.current) return;
    isJumpingRef.current = true;
    const container = scrollRef.current;
    if (container) {
      container.scrollLeft = 0;
    }
    setCurrentIndex(0);
    // Release immediately so next swipe isn't blocked; scrollend handler already ignores loop wrap
    requestAnimationFrame(() => {
      isJumpingRef.current = false;
    });
  }, [currentIndex, loop, content.length, displayContent.length]);

  // Observe which card is centered in the horizontal scroller
  useEffect(() => {
    if (!scrollRef.current) return;
    const root = scrollRef.current;

    const observers = itemRefs.current.map((node, index) => {
      if (!node) return null;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6 && !isJumpingRef.current) {
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
  }, [ids, displayContent.length]);

  // Optional autoplay: scroll to next item (already loops via % content.length)
  useEffect(() => {
    if (!autoPlay || content.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;
    const t = setInterval(() => {
      const next = (currentIndex + 1) % displayContent.length;
      const width = container.clientWidth;
      container.scrollTo({ left: next * width, behavior: 'smooth' });
    }, autoPlayInterval);
    return () => clearInterval(t);
  }, [autoPlay, autoPlayInterval, content.length, displayContent.length, currentIndex]);

  // One-item-per-swipe: record index at gesture start, on scrollend clamp to at most one step
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || displayContent.length <= 1) return;

    const onTouchStart = () => {
      scrollStartIndexRef.current = currentIndexRef.current;
      isScrollingRef.current = true;
    };
    const onWheel = () => {
      if (!isScrollingRef.current) scrollStartIndexRef.current = currentIndexRef.current;
      isScrollingRef.current = true;
    };
    const onScrollEnd = () => {
      if (!isScrollingRef.current || isJumpingRef.current) return;
      isScrollingRef.current = false;

      const width = container.clientWidth;
      const scrollLeft = container.scrollLeft;
      const landed = Math.round(scrollLeft / width);
      const clamped = Math.max(0, Math.min(displayContent.length - 1, landed));
      const start = scrollStartIndexRef.current;

      // Loop wrap: user went from last item to first (or first to last). Don't "correct" this.
      const isLoopWrapToFirst = start === displayContent.length - 1 && clamped === 0;
      if (isLoopWrapToFirst) return;

      const maxStep = 1;
      let target = clamped;
      if (Math.abs(clamped - start) > maxStep) {
        target = start + (clamped > start ? maxStep : -maxStep);
        target = Math.max(0, Math.min(displayContent.length - 1, target));
      }
      if (target !== clamped) {
        isJumpingRef.current = true;
        container.scrollTo({ left: target * width, behavior: 'smooth' });
        setCurrentIndex(target);
        requestAnimationFrame(() => {
          isJumpingRef.current = false;
        });
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('scrollend', onScrollEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('scrollend', onScrollEnd);
    };
  }, [currentIndex, displayContent.length]);

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
          'px-0',
          'touch-pan-x' // Enable horizontal touch scrolling
        )}
        style={{ touchAction: 'pan-x pan-y' }} // Allow horizontal and vertical panning
      >
        {displayContent.map((item, index) => (
          <div
            key={`${index}-${item.type}-${item.id}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={cn(
              'snap-center shrink-0 grow-0 basis-full min-w-0 isolate'
            )}
            style={{ contain: 'layout style', scrollSnapStop: 'always' }}
          >
            <ContentCard
              content={item}
              isHero={true}
              position="center"
              isActive={isSectionActive && index === currentIndex}
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

