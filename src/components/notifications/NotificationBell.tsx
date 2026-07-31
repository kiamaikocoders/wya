import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  notificationsQueryKey,
} from '@/lib/notification/notification-service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { playNotificationSound, requestNotificationPermission } from '@/lib/sounds';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: notificationsQueryKey(user?.id),
    queryFn: () => (user ? notificationService.getUserNotifications(user.id) : []),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 10_000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?.id) return;

    const channelName = `notifications:${user.id}:${crypto.randomUUID()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as { title?: string; message?: string };
          playNotificationSound();
          toast.success(newNotification.title || 'New notification received', {
            description: newNotification.message,
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleClick = () => {
    navigate('/notifications');

    if (user?.id) {
      void requestNotificationPermission(user.id).then((result) => {
        if (result === 'granted') {
          toast.success('Push notifications enabled');
        }
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} className="relative">
      <Bell size={20} />
      {unreadCount > 0 && (
        <Badge
          className="pointer-events-none absolute -top-2 -right-2 px-1.5 py-0.5 bg-gradient-accent text-white border-0 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
          variant="default"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBell;
