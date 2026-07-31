import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  notificationsQueryKey,
} from '@/lib/notification/notification-service';
import type { Notification } from '@/lib/notification/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  CheckCircle,
  Calendar,
  Info,
  UserPlus,
  MessageCircle,
  FileText,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_update':
      case 'event_cancelled':
      case 'new_event':
      case 'event_created':
        return <Calendar className="h-6 w-6 text-blue-500" />;
      case 'announcement':
        return <Info className="h-6 w-6 text-purple-500" />;
      case 'ticket':
      case 'checkin':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'follow':
        return <UserPlus className="h-6 w-6 text-gradient-orange-accent" />;
      case 'message':
        return <MessageCircle className="h-6 w-6 text-blue-600" />;
      case 'proposal_submitted':
      case 'proposal_approved':
      case 'proposal_rejected':
        return <FileText className="h-6 w-6 text-kenya-orange" />;
      case 'app_feedback':
      case 'feedback_reply':
        return <Inbox className="h-6 w-6 text-kenya-orange" />;
      case 'system':
      default:
        return <Bell className="h-6 w-6 text-gradient-orange-accent" />;
    }
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

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marked as read');
      invalidate();
      refetch();
    } catch {
      toast.error('Failed to mark notification as read');
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
      navigate(notification.link);
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">Your Notifications</h1>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : error ? (
          <Card className="p-8 flex flex-col items-center text-center">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Could not load notifications</h2>
            <p className="text-muted-foreground mb-4">Please try again.</p>
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </Card>
        ) : notifications.length > 0 ? (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-colors cursor-pointer ${
                  !notification.read
                    ? 'bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 border-kenya-orange/50'
                    : ''
                }`}
                onClick={() => void openNotification(notification)}
              >
                <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-14">
                  <p className="text-muted-foreground">{notification.message}</p>
                </CardContent>
                {!notification.read && (
                  <CardFooter className="justify-end pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkAsRead(notification.id);
                      }}
                    >
                      Mark as read
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 flex flex-col items-center text-center">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Notifications</h2>
            <p className="text-muted-foreground">
              You don't have any notifications right now. We'll notify you when there are updates
              about events, tickets, or important announcements.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
