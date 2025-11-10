import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';
import ChatButton from '@/components/ui/ChatButton';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { cn } from '@/lib/utils';
import {
  Menu,
  Compass,
  CalendarRange,
  Sparkles,
  Users as UsersIcon,
  MessageCircle,
  Ticket,
  Bookmark,
  BarChart3,
  Rocket,
  Brain,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  Settings,
  ArrowRight,
  Home as HomeIcon,
  Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItemConfig = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
  requiresOrganizer?: boolean;
};

type NavSection = {
  title: string;
  description: string;
  items: NavItemConfig[];
};

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

  const sections = useMemo<NavSection[]>(() => {
    const base: NavSection[] = [
      {
        title: 'Discover',
        description: "Explore curated experiences happening across Kenya's vibrant scene.",
        items: [
          {
            title: 'Overview',
            description: 'Personalized feed of matches, updates, and highlights.',
            href: homeHref,
            icon: Compass,
          },
          {
            title: 'Events',
            description: 'Browse upcoming happenings by city, genre, and vibe.',
            href: '/events',
            icon: CalendarRange,
          },
          {
            title: 'Stories',
            description: 'Catch up on community recaps and behind-the-scenes moments.',
            href: '/stories',
            icon: Sparkles,
          },
          {
            title: 'Spotlight',
            description: 'Meet featured organizers, venues, and cultural icons.',
            href: '/spotlight',
            icon: UsersIcon,
          },
        ],
      },
      {
        title: 'Engage',
        description: 'Stay connected with attendees, organizers, and the wider community.',
        items: [
          {
            title: 'Forum',
            description: 'Join conversations, share tips, and get advice.',
            href: '/forum',
            icon: MessageCircle,
            requiresAuth: true,
          },
          {
            title: 'Chat',
            description: 'Direct message collaborators, sponsors, and attendees.',
            href: '/chat',
            icon: MessageCircle,
            requiresAuth: true,
          },
          {
            title: 'Tickets',
            description: 'Manage the passes you have booked or shared.',
            href: '/tickets',
            icon: Ticket,
            requiresAuth: true,
          },
          {
            title: 'Favorites',
            description: 'Quick access to the events you love.',
            href: '/favorites',
            icon: Bookmark,
            requiresAuth: true,
          },
          {
            title: 'Notifications',
            description: 'Never miss an update or important announcement.',
            href: '/notifications',
            icon: Bell,
            requiresAuth: true,
          },
        ],
      },
      {
        title: 'Organize',
        description: 'Launch ideas, collaborate with sponsors, and monitor growth.',
        items: [
          {
            title: 'Request Event',
            description: 'Pitch new experiences and rally the community around them.',
            href: '/request-event',
            icon: Rocket,
          },
          {
            title: 'Sponsors',
            description: 'Discover brand opportunities and partnership packages.',
            href: '/sponsors',
            icon: UsersIcon,
          },
          {
            title: 'Analytics',
            description: 'Review performance metrics and attendee insights.',
            href: '/analytics',
            icon: BarChart3,
            requiresAuth: true,
            requiresOrganizer: true,
          },
        ],
      },
    ];

    return base
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiresAuth && !isAuthenticated) {
            return false;
          }
          if (item.requiresOrganizer && !isOrganizer) {
            return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [homeHref, isAuthenticated, isOrganizer]);

  const isLinkActive = (href: string) => {
    if (href === '/' || href === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }

    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

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
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-full w-[88vw] max-w-sm flex-col border-none bg-kenya-dark/95 p-6 text-white"
            >
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-lg font-semibold tracking-tight">
                  Navigation
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto pr-2">
                {isAuthenticated ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={profile?.avatar_url || '/placeholder.svg'}
                      alt={profile?.full_name || user?.name}
                    />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-white">
                      {profile?.full_name || user?.name || 'Explorer'}
                    </p>
                    <p className="text-white/60">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">
                    Ready to discover Kenya’s best experiences? Create an account to personalize your feed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <SheetClose asChild>
                      <Button
                        onClick={handleSignup}
                        className="flex-1 bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark font-semibold"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        onClick={handleLogin}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Log In
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              )}

                <div className="mt-6 space-y-6">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      {section.title}
                    </p>
                    <div className="mt-3 space-y-2">
                      {section.items.map((item) => (
                        <SheetClose asChild key={item.title}>
                          <Link
                            to={item.href}
                            className={cn(
                              'flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-kenya-orange/50 hover:bg-white/10'
                            )}
                          >
                            <item.icon className="mt-0.5 h-5 w-5 text-kenya-orange" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{item.title}</p>
                              <p className="text-xs text-white/65">{item.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/40" />
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
                <SheetClose asChild>
                  <Button
                    onClick={handlePrimaryCta}
                    className="w-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark font-semibold"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    AI Assistance
                  </Button>
                </SheetClose>
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/settings')}
                        className="flex-1 border-white/15 text-white hover:bg-white/10"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="flex-1 text-white/70 hover:bg-white/10"
                        onClick={() => logout()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/events')}
                      className="w-full text-white/70 hover:bg-white/10"
                    >
                      Explore Events
                    </Button>
                  </SheetClose>
                )}
              </div>

              <div className="mt-6">
                <ModeToggle className="w-full justify-center" />
              </div>
            </SheetContent>
          </Sheet>

          <Link to={homeHref} className="flex items-center gap-2 text-white">
            <img
              src="/wya logo.png"
              alt="WYA"
              className="h-8 w-auto drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)]"
            />
            <span className="hidden text-lg font-semibold tracking-wide sm:inline">WYA</span>
          </Link>
        </div>

        <NavigationMenu className="hidden flex-1 md:flex">
          <NavigationMenuList className="flex items-center gap-1">
            {sections.map((section) => {
              const sectionActive = section.items.some((item) => isLinkActive(item.href));

              return (
                <NavigationMenuItem key={section.title}>
                  <NavigationMenuTrigger
                    className={cn(
                      'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                      sectionActive && 'text-white'
                    )}
                  >
                    {section.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="rounded-3xl border border-white/10 bg-kenya-dark/95 p-6 text-white shadow-2xl backdrop-blur">
                    <div className="min-w-[320px] max-w-lg space-y-4">
                      <p className="text-sm text-white/60">{section.description}</p>
                      <div className="grid gap-3">
                        {section.items.map((item) => {
                          const active = isLinkActive(item.href);

                          return (
                            <NavigationMenuLink asChild key={item.title}>
                              <Link
                                to={item.href}
                                className={cn(
                                  'group flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-kenya-orange/50 hover:bg-white/10',
                                  active && 'border-kenya-orange/60 bg-white/10 shadow-[0_0_25px_rgba(255,128,0,0.2)]'
                                )}
                              >
                                <item.icon className="mt-0.5 h-5 w-5 text-kenya-orange" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-white">
                                    {item.title}
                                  </span>
                                  <span className="text-xs text-white/60">
                                    {item.description}
                                  </span>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-kenya-orange" />
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
          <NavigationMenuIndicator className="top-full hidden h-1.5 items-end justify-center overflow-hidden rounded-b-lg bg-kenya-orange md:flex" />
          <NavigationMenuViewport className="hidden w-full rounded-3xl border border-white/10 bg-kenya-dark/95 p-4 shadow-xl backdrop-blur md:block" />
        </NavigationMenu>

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
