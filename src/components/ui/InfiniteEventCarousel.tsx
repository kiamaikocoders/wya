import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import EventCard from './EventCard';
import type { Event } from '@/types/event.types';

interface InfiniteEventCarouselProps {
  events: Event[] | any[];
  emptyMessage?: string;
  className?: string;
  slidesToShow?: number;
  autoScrollSpeed?: number; // milliseconds; 0 = no auto-scroll
}

const CARD_WIDTH_MOBILE = 280; // px; ~85vw on 320px screen
const CARD_GAP = 12;
const SCROLL_PADDING = 16; // px-4 on container
const JUMP_COOLDOWN_MS = 200; // ignore scroll events after a jump to prevent flicker

const InfiniteEventCarousel: React.FC<InfiniteEventCarouselProps> = ({
  events,
  emptyMessage = 'No events available.',
  className = '',
  slidesToShow = 1.2,
  autoScrollSpeed = 4200,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const setWidthRef = useRef(0);
  const itemWidthRef = useRef(CARD_WIDTH_MOBILE);
  const isJumpingRef = useRef(false);
  const jumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duplicatedEvents = events.length > 0 ? [...events, ...events, ...events] : [];

  const getItemWidth = useCallback(() => {
    if (typeof window === 'undefined') return CARD_WIDTH_MOBILE;
    const w = window.innerWidth;
    if (w < 640) return Math.min(CARD_WIDTH_MOBILE, w * 0.88);
    if (w < 1024) return Math.min(320, w / 2.2);
    return Math.min(360, w / 3.2);
  }, []);

  const setupInfiniteScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || events.length === 0) return;

    const itemWidth = getItemWidth();
    const setWidth = events.length * (itemWidth + CARD_GAP);
    setWidthRef.current = setWidth;
    itemWidthRef.current = itemWidth;

    isJumpingRef.current = true;
    el.scrollLeft = SCROLL_PADDING + setWidth; // start at middle set
    if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    jumpTimeoutRef.current = setTimeout(() => {
      isJumpingRef.current = false;
      jumpTimeoutRef.current = null;
    }, JUMP_COOLDOWN_MS);
  }, [events.length, getItemWidth]);

  // Set initial scroll position before paint to avoid visible jump
  useLayoutEffect(() => {
    setupInfiniteScroll();
    return () => {
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    };
  }, [setupInfiniteScroll]);

  const handleScroll = useCallback(() => {
    if (isJumpingRef.current) return;

    const el = scrollRef.current;
    if (!el || events.length === 0) return;

    const setWidth = setWidthRef.current;
    const { scrollLeft, clientWidth } = el;
    const start = SCROLL_PADDING;
    const endOfSecondSet = start + 2 * setWidth - clientWidth;
    const deadZone = Math.min(80, setWidth * 0.15); // only jump when clearly in first or third set

    // Only one jump per call: check end-of-list first, then start
    if (scrollLeft >= endOfSecondSet - deadZone) {
      isJumpingRef.current = true;
      el.scrollLeft = start + setWidth - clientWidth + (scrollLeft - endOfSecondSet);
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
      jumpTimeoutRef.current = setTimeout(() => {
        isJumpingRef.current = false;
        jumpTimeoutRef.current = null;
      }, JUMP_COOLDOWN_MS);
      return;
    }
    if (scrollLeft <= start + deadZone) {
      isJumpingRef.current = true;
      el.scrollLeft = start + setWidth + (scrollLeft - start);
      if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
      jumpTimeoutRef.current = setTimeout(() => {
        isJumpingRef.current = false;
        jumpTimeoutRef.current = null;
      }, JUMP_COOLDOWN_MS);
    }
  }, [events.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  // Auto-advance (optional)
  useEffect(() => {
    if (events.length === 0 || autoScrollSpeed <= 0 || isPaused) return;

    const el = scrollRef.current;
    if (!el) return;

    const itemWidth = itemWidthRef.current + CARD_GAP;
    const id = setInterval(() => {
      if (!el || isPaused) return;
      el.scrollBy({ left: itemWidth, behavior: 'smooth' });
    }, autoScrollSpeed);

    return () => clearInterval(id);
  }, [events.length, autoScrollSpeed, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (!events || events.length === 0) {
    return <p className="py-4 text-center text-white/70">{emptyMessage}</p>;
  }

  const itemWidth = getItemWidth();

  return (
    <div
      className={`relative min-w-0 overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 py-2 scrollbar-hide snap-x snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch]"
      >
        {duplicatedEvents.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            className="flex-shrink-0 snap-start"
            style={{
              width: itemWidth,
            }}
          >
            <EventCard
              id={String(event.id)}
              title={event.title}
              category={event.category}
              date={event.date}
              location={event.location}
              image={event.image_url || event.image}
              capacity={event.capacity || 100}
              attendees={event.attendees ?? Math.floor(Math.random() * 100)}
              isFeatured={event.featured ?? event.is_featured}
              price={event.price}
              event={event}
            />
          </div>
        ))}
      </div>

      {isPaused && (
        <div className="absolute top-2 right-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
          Paused
        </div>
      )}
    </div>
  );
};

export default InfiniteEventCarousel;
