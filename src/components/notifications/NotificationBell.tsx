
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/notification';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => user ? notificationService.getUserNotifications(user.id) : [],
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(notif => !notif.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up notifications subscription for user:', user.id);

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          // Show toast for new notification
          const newNotification = payload.new;
          toast.success(newNotification.title || 'New notification received', {
            description: newNotification.message
          });
          
          // Refetch notifications to update the UI
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    return () => {
      console.log('Cleaning up notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleClick = () => {
    navigate('/notifications');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-kenya-orange text-white border-0 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
          variant="default"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBell;
