
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <header className="bg-kenya-orange py-3 px-4 flex items-center justify-between transition-all duration-300 animate-fade-in">
      <Link to="/" className="text-white font-bold text-2xl tracking-tight">
        WYA Kenya
      </Link>
      
      <nav className="hidden md:flex items-center space-x-6">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/forum">Forum</NavLink>
      </nav>
      
      <div className="flex items-center space-x-4">
        <button className="text-white p-2 rounded-full hover:bg-white/10 transition-colors">
          <Bell size={20} />
        </button>
        
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 bg-kenya-dark text-white px-3 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all">
                <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                <User size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-kenya-brown border-kenya-brown-dark">
              <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-kenya-brown-dark" />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="text-white hover:bg-kenya-brown-dark cursor-pointer">
                  Profile
                </Link>
              </DropdownMenuItem>
              {user?.user_type === 'organizer' && (
                <DropdownMenuItem asChild>
                  <Link to="/create-event" className="text-white hover:bg-kenya-brown-dark cursor-pointer">
                    Create Event
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/tickets" className="text-white hover:bg-kenya-brown-dark cursor-pointer">
                  My Tickets
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-kenya-brown-dark" />
              <DropdownMenuItem 
                onClick={logout}
                className="text-white hover:bg-kenya-brown-dark cursor-pointer flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/login"
            className="bg-kenya-dark text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`text-white font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-white after:transition-all ${
        isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
      }`}
    >
      {children}
    </Link>
  );
};

export default Navbar;
