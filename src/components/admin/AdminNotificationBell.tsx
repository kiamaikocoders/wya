import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notification';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/sounds';

/**
 * Admin header bell → /admin/notifications. Plays chime on new inserts.
 */
export function AdminNotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications = [] } = useQuery({
    queryKey: ['admin-header-notifications', user?.id],
    queryFn: () => (user ? notificationService.getUserNotifications(user.id) : []),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`admin-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { title?: string; message?: string };
          playNotificationSound();
          toast.success(row.title || 'New notification', {
            description: row.message,
          });
          queryClient.invalidateQueries({ queryKey: ['admin-header-notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/notifications')}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-[hsl(var(--admin-surface))] text-foreground transition-colors hover:bg-[hsl(var(--admin-surface-2))]',
        className
      )}
    >
      <Bell className="h-4 w-4" strokeWidth={1.75} />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
