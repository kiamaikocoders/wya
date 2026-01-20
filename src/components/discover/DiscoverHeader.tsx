import React from 'react';
import { cn } from '@/lib/utils';

interface DiscoverHeaderProps {
  className?: string;
}

const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({ className }) => {
  return (
    <div className={cn('absolute top-0 left-0 right-0 z-50 pt-safe', className)}>
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
  );
};

export default DiscoverHeader;
