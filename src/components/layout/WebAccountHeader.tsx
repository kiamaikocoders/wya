import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', path: '/account' },
  { label: 'Tickets', path: '/tickets' },
  { label: 'Alerts', path: '/notifications' },
] as const;

/**
 * Figma redesign SiteHeader — light + dark tokens.
 */
const WebAccountHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const displayName = user?.full_name || user?.name || 'Account';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path: string) => {
    if (path === '/account') {
      return location.pathname === '/account' || location.pathname === '/home';
    }
    if (path === '/tickets') {
      return location.pathname === '/tickets' || location.pathname.startsWith('/tickets/');
    }
    if (path === '/notifications') {
      return location.pathname === '/notifications';
    }
    return location.pathname === path;
  };

  return (
    <header className={cn('sticky top-0 z-50', companion.header)}>
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div className={cn('flex min-w-0 items-center gap-6 px-3 py-1.5', companion.navCluster)}>
          <Logo
            href="/account"
            size="sm"
            showTagline={false}
            className="shrink-0 flex-row items-center [&_img]:!h-8"
          />
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn('transition-colors', active ? companion.navActive : companion.navIdle)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn('flex size-10 items-center justify-center rounded-[10px]', companion.iconBtn)}>
            <NotificationBell />
          </div>
          <div className={cn('flex size-10 items-center justify-center rounded-[10px]', companion.iconBtn)}>
            <ModeToggle className="border-0 bg-transparent hover:bg-transparent" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn('size-10 overflow-hidden rounded-[10px] p-0', companion.iconBtn)}
                aria-label="Account menu"
              >
                <Avatar className="size-10 rounded-[10px]">
                  <AvatarImage
                    src={user?.avatar_url || user?.profile_picture || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-[10px] bg-white text-sm text-[#ff6b35] dark:bg-[#161b22]">
                    {initials || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                'w-56 backdrop-blur',
                companion.border,
                companion.surface,
                companion.heading
              )}
            >
              <DropdownMenuLabel className="flex flex-col space-y-0.5">
                <span className="text-sm font-semibold">{displayName}</span>
                <span className={cn('text-xs font-normal', companion.muted)}>{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#d0d7dd] dark:bg-[#30363d]" />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#d0d7dd] dark:bg-[#30363d]" />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                onSelect={() => {
                  void logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default WebAccountHeader;
