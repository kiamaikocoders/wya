import { Link, useLocation } from 'react-router-dom';
import { Calendar, Ticket, User, Bell, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

/** PDF primary nav: hub, events, tickets, notifications, profile */
const navItems: NavItem[] = [
  { name: 'Home', icon: Home, path: '/account' },
  { name: 'Events', icon: Calendar, path: '/events' },
  { name: 'Tickets', icon: Ticket, path: '/tickets' },
  { name: 'Alerts', icon: Bell, path: '/notifications' },
  { name: 'Profile', icon: User, path: '/profile' },
];

/**
 * Minimal bottom nav for the light web account surface (not the full app shell).
 */
const WebAccountNav = () => {
  const location = useLocation();

  const isLinkActive = (path: string) => {
    if (path === '/account') {
      return location.pathname === '/account';
    }
    if (path === '/tickets') {
      return location.pathname === '/tickets' || location.pathname.startsWith('/tickets/');
    }
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname === '/settings';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom',
        'border-t border-slate-200 dark:border-slate-800',
        'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]'
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
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-primary/15 ring-2 ring-primary shadow-md' : ''
                  )}
                >
                  <Icon size={20} className={cn('transition-all', isActive && 'scale-110')} />
                </div>
                <span
                  className={cn(
                    'truncate text-[10px] font-medium leading-tight sm:max-w-none md:text-xs',
                    isActive && 'font-semibold'
                  )}
                >
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

export default WebAccountNav;
