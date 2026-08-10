import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminOpsNotificationsQueryKey,
  notificationService,
} from '@/lib/notification/notification-service';
import { isAdminOpsNotificationType } from '@/lib/notification/types';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/sounds';

/**
 * Admin header bell → /admin/notifications?tab=inbox. Chimes on new ops inserts.
 */
export function AdminNotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-notifications-unread', user?.id],
    queryFn: () => (user ? notificationService.getAdminOpsUnreadCount(user.id) : 0),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channelName = `admin-notifications:${user.id}:${crypto.randomUUID()}`;

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
          const row = payload.new as { title?: string; message?: string; type?: string };
          if (!row.type || !isAdminOpsNotificationType(row.type)) return;

          playNotificationSound();
          toast.success(row.title || 'New notification', {
            description: row.message,
          });
          queryClient.invalidateQueries({ queryKey: ['admin-ops-notifications'] });
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
          queryClient.invalidateQueries({ queryKey: ['admin-ops-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Keep ops inbox list warm so the page matches the badge immediately.
  useQuery({
    queryKey: adminOpsNotificationsQueryKey(user?.id),
    queryFn: () => (user ? notificationService.getAdminOpsNotifications(user.id) : []),
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 30_000,
  });

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/notifications?tab=inbox')}
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
