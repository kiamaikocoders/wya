import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDiscoverUI } from '@/contexts/DiscoverUIContext';

interface DiscoverHeaderProps {
  className?: string;
}

const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({ className }) => {
  const { uiVisible, setUiVisible } = useDiscoverUI();

  // Hide navbar on scroll (handled in DiscoverPage, this is just for redundancy)

  return (
    <>
      {/* Minimalist header overlay - TikTok style (fades on scroll) */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 z-30 safe-area-top',
          'transition-opacity duration-300',
          uiVisible ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        <div className="container mx-auto px-4 py-3">
          {/* Minimalist transparent tabs - TikTok style */}
          <div className="flex justify-center gap-6">
            <button
              className={cn(
                'px-4 py-2 text-sm font-semibold transition-colors',
                'text-white/60 hover:text-white',
                'relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
                'after:bg-transparent after:transition-colors',
                // Active state (currently showing Discover)
                'text-white after:bg-white'
              )}
            >
              Discover
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscoverHeader;
