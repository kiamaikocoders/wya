import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';
import ChatButton from '@/components/ui/ChatButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import {
  Brain,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  Settings,
  MessageCircle,
  Rocket,
  BarChart3,
  Home as HomeIcon,
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id && isAuthenticated,
  });

  const homeHref = isAuthenticated ? '/home' : '/';
  const isOrganizer = isAdmin || user?.user_type === 'organizer';
  const isSpotlightPage = location.pathname === '/spotlight';

  const handlePrimaryCta = () => {
    navigate('/ai-assistance');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to={homeHref} className="flex items-center gap-2 text-white">
            <img
              src="/WYA_LOGO_2.png"
              alt="WYA"
              className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)] transition-transform hover:scale-105"
              style={{ mixBlendMode: 'normal' }}
            />
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated && (
            <div className="hidden items-center gap-2 sm:flex md:hidden">
              <NotificationBell />
              <ChatButton variant="ghost" />
            </div>
          )}

          {!isSpotlightPage && (
            <>
              <Button
                onClick={handlePrimaryCta}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all transform hover:scale-105 md:hidden"
              >
                <Brain className="h-4 w-4" />
                <span>AI</span>
              </Button>

              <div className="hidden items-center gap-2 md:flex">
                {isAuthenticated && (
                  <>
                    <NotificationBell />
                    <ChatButton variant="ghost" />
                  </>
                )}
                <Button
                  onClick={handlePrimaryCta}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all transform hover:scale-105"
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden lg:inline">AI Assistance</span>
                  <span className="lg:hidden">AI</span>
                </Button>
              </div>
            </>
          )}

          <ModeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.avatar_url || '/placeholder.svg'}
                      alt={profile?.full_name || user?.name}
                    />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 border border-border bg-card/95 text-foreground backdrop-blur">
                <DropdownMenuLabel className="flex flex-col space-y-1">
                  <span className="text-sm font-semibold text-foreground">
                    {profile?.full_name || user?.name || 'Explorer'}
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                  {isAdmin && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Administrator
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={homeHref} className="flex w-full items-center gap-2">
                    <HomeIcon className="h-4 w-4 text-primary" />
                    <span>Overview</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex w-full items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Profile & Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chat" className="flex w-full items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/request-event" className="flex w-full items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    <span>Request Event</span>
                  </Link>
                </DropdownMenuItem>
                {isOrganizer && (
                  <DropdownMenuItem asChild>
                    <Link to="/analytics" className="flex w-full items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex w-full items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-300 focus:bg-red-500/10"
                  onSelect={(event) => {
                    event.preventDefault();
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleLogin}
              >
                <LogIn className="mr-1.5 h-4 w-4" />
                Login
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-4 text-kenya-dark font-semibold"
                onClick={handleSignup}
              >
                <UserPlus className="mr-1.5 h-4 w-4" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
