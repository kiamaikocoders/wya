import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';

interface DiscoverHeaderProps {
  className?: string;
}

const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({ className }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollYRef = useRef<number>(0);

  // Handle scroll to hide navbar (works with both window and container scroll)
  useEffect(() => {
    const handleScroll = (e?: Event) => {
      // Check both window scroll and container scroll (for DiscoverPage)
      const container = document.querySelector('[data-discover-container]') as HTMLElement;
      const currentScrollY = container 
        ? container.scrollTop 
        : window.scrollY || document.documentElement.scrollTop;
      const scrollDelta = Math.abs(currentScrollY - lastScrollYRef.current);

      // Hide navbar when scrolling down, show when scrolling up or at top
      if (currentScrollY > 50 && currentScrollY > lastScrollYRef.current && scrollDelta > 10) {
        setIsScrolling(true);
        if (isNavbarVisible) {
          setIsNavbarVisible(false);
        }
      } else if (currentScrollY < 50 || currentScrollY < lastScrollYRef.current) {
        setIsScrolling(false);
      }

      lastScrollYRef.current = currentScrollY;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    // Listen to both window and container scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    const container = document.querySelector('[data-discover-container]');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isNavbarVisible]);

  // Toggle navbar on single tap
  const handleToggleNavbar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNavbarVisible(!isNavbarVisible);
  };

  return (
    <>
      {/* Toggle button - Single tap to show/hide navbar */}
      <button
        onClick={handleToggleNavbar}
        className={cn(
          'absolute top-4 left-4 z-50',
          'h-10 w-10 rounded-full bg-black/50 backdrop-blur-md',
          'border-2 border-white/30 shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-300 hover:bg-black/70',
          'text-white'
        )}
        aria-label="Toggle navigation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Navbar with smooth slide animation */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'transition-transform duration-300 ease-in-out',
          isNavbarVisible && !isScrolling
            ? 'translate-y-0'
            : '-translate-y-full'
        )}
      >
        <Navbar />
      </div>

      {/* Minimalist header overlay - TikTok style */}
      <div className={cn('absolute top-0 left-0 right-0 z-30 pt-safe', className)}>
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
