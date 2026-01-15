import React, { useEffect, useRef } from 'react';
import SpotlightFeed from '@/components/spotlight/SpotlightFeed';
import SpotlightHeader from '@/components/spotlight/SpotlightHeader';
import SpotlightSwipeHint from '@/components/spotlight/SpotlightSwipeHint';

const SpotlightPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure page scrolls to top on mount (normal scroll direction)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative bg-background overflow-y-auto"
      style={{
        scrollSnapType: 'y mandatory',
        height: '100vh', // Full viewport - content bleeding (TikTok style)
        minHeight: '100vh',
      }}
    >
      {/* Transparent header overlay */}
      <SpotlightHeader />

      {/* One-time coachmark: horizontal swipe hint */}
      <SpotlightSwipeHint />
      
      {/* Content feed - full viewport height sections */}
      <SpotlightFeed />
    </div>
  );
};

export default SpotlightPage;
