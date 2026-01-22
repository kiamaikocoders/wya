import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DiscoverFeed from '@/components/discover/DiscoverFeed';
import DiscoverHeader from '@/components/discover/DiscoverHeader';
import DiscoverSwipeHint from '@/components/discover/DiscoverSwipeHint';

const DiscoverPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id?: string }>();

  // Ensure page scrolls to top on mount (normal scroll direction)
  useEffect(() => {
    if (containerRef.current && !id) {
      containerRef.current.scrollTop = 0;
    }
  }, [id]);

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
