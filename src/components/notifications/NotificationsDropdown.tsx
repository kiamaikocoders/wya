
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  notificationService
} from '@/lib/notification';
import type { Notification } from '@/lib/notification/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const NotificationsDropdown = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => user ? notificationService.getUserNotifications(user.id) : [],
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
  
  useEffect(() => {
    if (notifications && Array.isArray(notifications)) {
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications]);
  
  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  
  const handleMarkAllAsRead = async () => {
    if (user) {
      await notificationService.markAllAsRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  const getNotificationLink = (notification: Notification) => {
    if (notification.resource_type === 'event' && notification.resource_id) {
      return `/events/${notification.resource_id}`;
    }
    if (notification.resource_type === 'post' && notification.resource_id) {
      return `/forum/${notification.resource_id}`;
    }
    if (notification.resource_type === 'ticket' && notification.resource_id) {
      return `/tickets/${notification.resource_id}`;
    }
    // Default to notifications page if no specific link
    return '/notifications';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-kenya-orange">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications && Array.isArray(notifications) && notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications && Array.isArray(notifications) && notifications.map(notification => (
            <DropdownMenuItem 
              key={notification.id}
              className={`py-3 px-4 cursor-pointer flex flex-col items-start gap-1 ${
                !notification.read ? 'bg-accent/50' : ''
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
              asChild
            >
              <Link to={getNotificationLink(notification)}>
                <div className="flex items-start justify-between w-full">
                  <div>
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-muted-foreground text-sm">{notification.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <Badge variant="outline" className="h-2 w-2 rounded-full bg-kenya-orange" />
                  )}
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="justify-center text-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
