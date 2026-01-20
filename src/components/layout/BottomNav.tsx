import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Calendar, Rocket, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isDiscoverPage = location.pathname === '/discover';
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const homePath = isAuthenticated ? '/home' : '/';

  const navItems: NavItem[] = [
    { name: 'Overview', icon: Home, path: homePath },
    { name: 'Discover', icon: Sparkles, path: '/discover' },
    { name: 'Events', icon: Calendar, path: '/events' },
    { name: 'Request', icon: Rocket, path: '/request-event' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  
  const isLinkActive = (path: string) => {
    if (path === '/' || path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Hide/show nav on scroll for Discover page (TikTok style)
  useEffect(() => {
    if (!isDiscoverPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDiscoverPage, lastScrollY]);
  
  return (
    <nav 
      className={cn(
        // Keep below dialogs/overlays (Radix dialogs use z-50) so modals aren't obscured on mobile.
        'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom transition-transform duration-300',
        'border-t border-slate-200 dark:border-slate-800',
        'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]',
        !isVisible && isDiscoverPage && 'translate-y-full' // Hide when scrolling down
      )}
    >
      <div className="container mx-auto">
        {/* Mobile: Horizontal scrollable nav */}
        <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory md:justify-center md:overflow-x-visible">
          <div className="flex min-w-full items-center justify-around gap-1 px-2 py-3 md:min-w-0 md:gap-4 md:px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isLinkActive(item.path);
                
          return (
                  <Link
              key={item.name}
                    to={item.path}
                    className={cn(
                      'flex min-w-[60px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200',
                      'hover:bg-muted active:scale-95',
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-primary/10' : ''
                    )}>
                      <Icon 
                        size={20} 
                        className={cn(
                          'transition-all',
                          isActive && 'scale-110'
                        )}
                        fill={isActive ? 'currentColor' : 'none'}
                      />
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium leading-tight md:text-xs',
                      isActive && 'font-semibold'
                    )}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
