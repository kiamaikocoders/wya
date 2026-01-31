import React, { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DiscoverFeed from '@/components/discover/DiscoverFeed';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import DiscoverSwipeHint from '@/components/discover/DiscoverSwipeHint';
import { useDiscoverUI } from '@/contexts/DiscoverUIContext';

const DiscoverPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id?: string }>();
  const { setUiVisible } = useDiscoverUI();

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to top on mount and when navigating to a specific content id
  useEffect(() => {
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 100);
    const t2 = setTimeout(scrollToTop, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [id, scrollToTop]);

  // Prevent browser from restoring previous scroll position when navigating back
  useEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  // Handle scroll to hide navbar only (content info stays visible)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Hide navbar on scroll (content info stays visible)
      setUiVisible(false);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [setUiVisible]);

  return (
    <div 
      ref={containerRef}
      data-discover-container
      className="relative bg-background overflow-y-auto"
      style={{
        scrollSnapType: 'y mandatory',
        height: '100vh', // Full viewport - content bleeding (TikTok style)
        minHeight: '100vh',
      }}
    >
      {/* Transparent header overlay */}
      <DiscoverHeader />

      {/* One-time coachmark: horizontal swipe hint */}
      <DiscoverSwipeHint />
      
      {/* Content feed - full viewport height sections */}
      <DiscoverFeed
        targetContentId={id ? Number(id) : undefined}
        onContentReady={scrollToTop}
      />
    </div>
  );
};

export default DiscoverPage;
