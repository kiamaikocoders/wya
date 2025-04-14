
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { notificationService, Notification } from '@/lib/notification-service';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getUserNotifications,
    enabled: isAuthenticated,
  });

  // Calculate unread count whenever notifications change
  useEffect(() => {
    if (notifications) {
      const count = notifications.filter(notification => !notification.read).length;
      setUnreadCount(count);
    }
  }, [notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    refetch();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-kenya-brown-dark border-kenya-brown p-0 max-h-96 overflow-hidden">
        <div className="p-3 border-b border-kenya-brown flex justify-between items-center">
          <h3 className="font-semibold text-white">Notifications</h3>
          {notifications && notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-sm text-kenya-brown-light hover:text-white"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-72">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-kenya-orange"></div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-kenya-brown/20 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-kenya-brown/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 mt-1.5 rounded-full ${!notification.read ? 'bg-kenya-orange' : 'bg-transparent'}`} />
                    <div>
                      <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                      <p className="text-xs text-kenya-brown-light mt-1">{notification.message}</p>
                      <p className="text-[10px] text-kenya-brown-light/70 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 px-4 text-center">
              <p className="text-kenya-brown-light text-sm">No notifications yet</p>
              <p className="text-kenya-brown-light/70 text-xs mt-1">We'll notify you when there are updates</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
