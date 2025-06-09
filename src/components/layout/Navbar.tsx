
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import {
  Home,
  Calendar,
  Book,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Users,
  MessageCircle,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';
import { conversationsService } from '@/lib/chat';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { theme } = useTheme();
  
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: conversationsService.getUnreadCount,
    enabled: isAuthenticated,
  });

  const navigationItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
    },
    {
      icon: Calendar,
      label: 'Events',
      href: '/events',
    },
    {
      icon: Book,
      label: 'Forum',
      href: '/forum',
    },
    {
      icon: Users,
      label: 'Users',
      href: '/users',
    },
  ];

  return (
    <nav className="bg-kenya-brown-dark border-b border-kenya-brown-light sticky top-0 z-50">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="font-bold text-2xl text-white">
          WYA
        </Link>

        <div className="flex items-center space-x-4">
          <ModeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.full_name || user?.username} />
                    <AvatarFallback>{(user?.full_name || user?.username || user?.email)?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium leading-none">{user?.full_name || user?.username}</span>
                    <span className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </span>
                    {isAdmin && (
                      <span className="text-xs leading-none text-kenya-orange font-semibold mt-1">
                        Administrator
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/profile">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/chat">
                  <DropdownMenuItem>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <div className="ml-auto flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {unreadCount}
                      </div>
                    )}
                  </DropdownMenuItem>
                </Link>
                
                <Link to="/request-event">
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Request Event</span>
                  </DropdownMenuItem>
                </Link>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <Link to="/admin">
                      <DropdownMenuItem>
                        <ShieldAlert className="mr-2 h-4 w-4 text-kenya-orange" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
              <Link to="/admin-login">
                <Button variant="outline" className="text-kenya-orange border-kenya-orange">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="bg-kenya-brown">
        <div className="container flex justify-center space-x-6 py-2 text-sm">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-kenya-brown-light hover:text-white transition-colors flex items-center"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
