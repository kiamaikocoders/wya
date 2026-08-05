import { Link, useLocation } from 'react-router-dom';
import { Ticket, User, Bell, Home } from 'lucide-react';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { name: 'Home', icon: Home, path: '/account' },
  { name: 'Tickets', icon: Ticket, path: '/tickets' },
  { name: 'Alerts', icon: Bell, path: '/notifications' },
  { name: 'Profile', icon: User, path: '/profile' },
];

/**
 * Mobile-only bottom nav for the light-web companion shell.
 */
const WebAccountNav = () => {
  const location = useLocation();

  const isLinkActive = (path: string) => {
    if (path === '/account') {
      return location.pathname === '/account' || location.pathname === '/home';
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
    <nav className={cn('fixed bottom-0 left-0 right-0 z-40 safe-area-bottom backdrop-blur-xl', companion.bottomNav)}>
      <div className="mx-auto w-full max-w-full overflow-hidden px-1">
        <div className="flex items-center justify-between gap-0 py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-all duration-200',
                  isActive ? companion.accent : companion.muted
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                <span className="max-w-full truncate text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default WebAccountNav;
