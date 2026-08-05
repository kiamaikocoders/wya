import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Calendar, CalendarPlus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useDiscoverUI } from '@/contexts/DiscoverUIContext';
import { getAuthenticatedHomePath } from '@/lib/post-auth-navigation';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isDiscoverPage = location.pathname === '/discover';
  
  // Use DiscoverUIContext for Discover page, otherwise always visible
  const discoverUI = useDiscoverUI();
  const uiVisible = isDiscoverPage ? discoverUI.uiVisible : true;
  
  const homePath = isAuthenticated ? getAuthenticatedHomePath() : '/';

  const navItems: NavItem[] = [
    { name: 'Overview', icon: Home, path: homePath },
    { name: 'Discover', icon: Sparkles, path: '/discover' },
    { name: 'Events', icon: Calendar, path: '/events' },
    { name: 'Host', icon: CalendarPlus, path: '/request-event' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  
  const isLinkActive = (path: string) => {
    if (path === '/' || path === '/home' || path === '/account') {
      return (
        location.pathname === '/' ||
        location.pathname === '/home' ||
        location.pathname === '/account'
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <nav 
      className={cn(
        // Keep below dialogs/overlays (Radix dialogs use z-50) so modals aren't obscured on mobile.
        'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom transition-all duration-300',
        'border-t border-slate-200 dark:border-slate-800',
        'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]',
        // On Discover page, show/hide based on UI visibility (single tap)
        isDiscoverPage && !uiVisible && 'translate-y-full opacity-0' // Hide when UI is hidden
      )}
    >
      <div className="mx-auto w-full max-w-full overflow-hidden px-1">
        <div className="flex items-center justify-between gap-0 py-3 sm:justify-center sm:gap-4 sm:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-all duration-200 sm:min-w-[60px] sm:flex-none sm:gap-1 sm:px-3',
                  'hover:bg-muted active:scale-95',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isActive ? 'bg-primary/15 ring-2 ring-primary shadow-md' : ''
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
                  'truncate text-[10px] font-medium leading-tight sm:max-w-none md:text-xs',
                  isActive && 'font-semibold'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
