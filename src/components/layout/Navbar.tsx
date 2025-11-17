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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-gradient-to-b from-black/85 via-kenya-dark/95 to-kenya-dark/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to={homeHref} className="flex items-center gap-2 text-white">
            <img
              src="/wya logo.png"
              alt="WYA"
              className="h-8 w-auto drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)]"
            />
            <span className="hidden text-lg font-semibold tracking-wide sm:inline">WYA</span>
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

          <Button
            onClick={handlePrimaryCta}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-3 py-2 text-sm font-semibold text-kenya-dark shadow-[0_0_18px_rgba(255,128,0,0.3)] hover:shadow-[0_0_26px_rgba(255,128,0,0.45)] md:hidden"
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
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-4 py-2 text-sm font-semibold text-kenya-dark shadow-[0_0_20px_rgba(255,128,0,0.35)] hover:shadow-[0_0_30px_rgba(255,128,0,0.45)]"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden lg:inline">AI Assistance</span>
              <span className="lg:hidden">AI</span>
            </Button>
          </div>

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
              <DropdownMenuContent className="w-64 border border-white/10 bg-kenya-dark/95 text-white backdrop-blur">
                <DropdownMenuLabel className="flex flex-col space-y-1">
                  <span className="text-sm font-semibold text-white">
                    {profile?.full_name || user?.name || 'Explorer'}
                  </span>
                  <span className="text-xs text-white/60">{user?.email}</span>
                  {isAdmin && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-kenya-orange">
                      Administrator
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link to={homeHref} className="flex w-full items-center gap-2">
                    <HomeIcon className="h-4 w-4 text-kenya-orange" />
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
                      <ShieldAlert className="h-4 w-4 text-kenya-orange" />
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
                className="text-white/80 hover:text-white"
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
