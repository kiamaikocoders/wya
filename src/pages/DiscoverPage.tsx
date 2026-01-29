import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DiscoverFeed from '@/components/discover/DiscoverFeed';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import DiscoverSwipeHint from '@/components/discover/DiscoverSwipeHint';
import { useDiscoverUI } from '@/contexts/DiscoverUIContext';

const DiscoverPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id?: string }>();
  const { setUiVisible } = useDiscoverUI();

  // Scroll to top only on mount or when navigating to a specific content id (e.g. /discover/123)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollToTop = () => {
      if (container) container.scrollTop = 0;
    };

    scrollToTop();
    const t1 = setTimeout(scrollToTop, 100);
    const t2 = setTimeout(scrollToTop, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [id]);

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
      <DiscoverFeed targetContentId={id ? Number(id) : undefined} />
    </div>
  );
};

export default DiscoverPage;
