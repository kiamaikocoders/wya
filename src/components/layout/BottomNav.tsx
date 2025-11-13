import React from 'react';
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
  
  const homePath = isAuthenticated ? '/home' : '/';

  const navItems: NavItem[] = [
    { name: 'Overview', icon: Home, path: homePath },
    { name: 'Spotlight', icon: Sparkles, path: '/spotlight' },
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
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-white/10 bg-gradient-to-t from-kenya-dark via-kenya-dark to-kenya-dark/95 backdrop-blur-lg shadow-2xl safe-area-bottom">
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
                      'hover:bg-white/5 active:scale-95',
                      isActive 
                        ? 'text-kenya-orange' 
                        : 'text-white/60 hover:text-white/80'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-kenya-orange/20' : ''
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
