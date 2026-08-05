import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  notificationsQueryKey,
} from '@/lib/notification/notification-service';
import type { Notification } from '@/lib/notification/types';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { resolveWebSafePath } from '@/lib/post-auth-navigation';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

/**
 * Figma redesign Alerts — compact unread-dot rows (light + dark).
 */
const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: notificationsQueryKey(user?.id),
    queryFn: () => (user ? notificationService.getUserNotifications(user.id) : []),
    enabled: isAuthenticated && !!user?.id,
  });

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [error]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (user) {
        await notificationService.markAllAsRead(user.id);
        toast.success('All notifications marked as read');
        invalidate();
        refetch();
      }
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        invalidate();
      } catch {
        /* non-blocking */
      }
    }
    if (notification.link) {
      navigate(resolveWebSafePath(notification.link));
    }
  };

  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12', companion.page)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={cn('text-3xl font-bold', companion.heading)}>Alerts</h1>
          <p className={cn('mt-2 text-sm', companion.muted)}>
            Stay updated on events, tickets, and activity
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => void handleMarkAllAsRead()}
            className={cn(
              'bg-transparent',
              companion.border,
              companion.heading,
              'hover:bg-white dark:hover:bg-[#161b22]'
            )}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div
              className={cn(
                'h-12 w-12 animate-spin rounded-full border-t-2 border-b-2',
                companion.spinner
              )}
            />
          </div>
        ) : error ? (
          <div className={cn('px-6 py-12 text-center', companion.card)}>
            <Bell className={cn('mx-auto mb-4 h-12 w-12', companion.muted)} />
            <h2 className={cn('mb-2 text-lg font-semibold', companion.heading)}>
              Could not load alerts
            </h2>
            <p className={cn('mb-4 text-sm', companion.muted)}>Please try again.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              className={cn(companion.border, companion.heading)}
            >
              Retry
            </Button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={cn(
                'flex w-full items-center gap-4 px-5 py-4 text-left transition',
                companion.card,
                'hover:border-[#ff6b35]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]'
              )}
            >
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  notification.read
                    ? 'bg-[#d0d7dd] dark:bg-[#30363d]'
                    : 'bg-[#ff6b35]'
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm',
                    notification.read
                      ? cn('font-normal', companion.muted)
                      : cn('font-semibold', companion.heading)
                  )}
                >
                  {notification.title}
                </p>
                <p className={cn('mt-1 text-xs', companion.muted)}>
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className={cn('px-6 py-12 text-center', companion.card)}>
            <Bell className={cn('mx-auto mb-4 h-12 w-12', companion.muted)} />
            <h2 className={cn('mb-2 text-lg font-semibold', companion.heading)}>No alerts yet</h2>
            <p className={cn('text-sm', companion.muted)}>
              We&apos;ll notify you about tickets, events, and important updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
