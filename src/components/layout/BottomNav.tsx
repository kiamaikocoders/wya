
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Users, Bookmark, User, MessageCircle, BarChart } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import ChatButton from '@/components/ui/ChatButton';

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const homePath = isAuthenticated ? '/home' : '/';

  const baseNavItems = [
    { name: 'Explore', icon: Home, path: homePath },
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
    { name: 'Spotlight', icon: Users, path: '/spotlight' },
    { name: 'Favorites', icon: Bookmark, path: '/favorites' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  
  // Add more icons for authenticated users
  const authenticatedNavItems = [
    ...baseNavItems,
    { name: 'Chat', icon: MessageCircle, path: '/chat' },
  ];
  
  // Add analytics for admins and organizers
  const adminOrganizerNavItems = [
    ...authenticatedNavItems,
    { name: 'Analytics', icon: BarChart, path: '/analytics' },
  ];
  
  // Determine which nav items to use
  let navItems = baseNavItems;
  
  if (isAuthenticated) {
    navItems = authenticatedNavItems;
    
    if (user?.user_type === 'admin' || user?.user_type === 'organizer') {
      navItems = adminOrganizerNavItems;
    }
  }
  
  // Only show the first 5 nav items to avoid overcrowding
  const visibleNavItems = navItems.slice(0, 5);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-kenya-brown-dark bg-kenya-brown z-50 animate-fade-in dark:bg-kenya-dark dark:border-kenya-brown">
      <nav className="flex gap-2 px-4 pt-2 pb-3">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
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
      <div className="h-5 bg-kenya-brown dark:bg-kenya-dark"></div>
      
      {/* Notification and Chat buttons for mobile - fixed to bottom right above the navigation */}
      {isAuthenticated && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
          <div className="bg-kenya-brown rounded-full p-1 shadow-lg dark:bg-kenya-brown-dark">
            <ChatButton variant="ghost" />
          </div>
          <div className="bg-kenya-brown rounded-full p-1 shadow-lg dark:bg-kenya-brown-dark">
            <NotificationBell />
          </div>
        </div>
      )}
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
