import React from 'react';
import SpotlightFeed from '@/components/spotlight/SpotlightFeed';

const SpotlightPage = () => {
  return (
    <div 
      className="bg-kenya-dark overflow-y-auto"
      style={{
        scrollSnapType: 'y mandatory',
        height: 'calc(100vh - 144px)', // Account for navbar (64px) + bottom nav (80px)
        minHeight: 'calc(100vh - 144px)',
      }}
    >
      <SpotlightFeed />
    </div>
  );
};

export default SpotlightPage;
