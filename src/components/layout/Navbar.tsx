
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
import { chatService } from '@/lib/chat-service';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: chatService.getUnreadCount,
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
          EventHub
        </Link>

        <div className="flex items-center space-x-4">
          <ModeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium leading-none">{user?.name}</span>
                    <span className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </span>
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
                    <MessageIcon className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <div className="ml-auto flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {unreadCount}
                      </div>
                    )}
                  </DropdownMenuItem>
                </Link>
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

// Custom message icon
const MessageIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default Navbar;
