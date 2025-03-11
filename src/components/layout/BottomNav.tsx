
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Users, Bookmark, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Explore', icon: Home, path: '/' },
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
    { name: 'Friends', icon: Users, path: '/friends' },
    { name: 'Wishlist', icon: Bookmark, path: '/wishlist' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-kenya-brown-dark bg-kenya-brown z-50 animate-fade-in">
      <nav className="flex gap-2 px-4 pt-2 pb-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              path={item.path}
              isActive={isActive}
            />
          );
        })}
      </nav>
      <div className="h-5 bg-kenya-brown"></div>
    </div>
  );
};

const NavItem = ({ 
  name, 
  icon: Icon, 
  path, 
  isActive 
}: { 
  name: string; 
  icon: React.ElementType; 
  path: string; 
  isActive: boolean;
}) => {
  return (
    <Link
      to={path}
      className={`flex flex-1 flex-col items-center justify-end gap-1 ${
        isActive ? 'text-white' : 'text-kenya-brown-light'
      } transition-colors duration-200`}
    >
      <div className="flex h-8 items-center justify-center">
        <Icon size={24} fill={isActive ? 'currentColor' : 'none'} />
      </div>
      <p className="text-xs font-medium leading-normal tracking-[0.015em]">{name}</p>
    </Link>
  );
};

export default BottomNav;
