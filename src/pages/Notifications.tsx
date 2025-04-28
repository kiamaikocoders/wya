
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/lib/notification';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, AlertTriangle, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Notifications = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getUserNotifications,
    enabled: isAuthenticated,
  });
  
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [error]);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_update':
        return <Calendar className="h-6 w-6 text-blue-500" />;
      case 'announcement':
        return <Info className="h-6 w-6 text-purple-500" />;
      case 'ticket':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'system':
      default:
        return <Bell className="h-6 w-6 text-kenya-orange" />;
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All notifications marked as read');
      refetch();
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marked as read');
      refetch();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };
  
  const mockNotifications = [
    {
      id: 1,
      title: 'New Event: Nairobi Tech Week',
      message: 'A new tech event has been added in your area.',
      type: 'event_update',
      read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      id: 2,
      title: 'Event Update: Lamu Cultural Festival',
      message: 'The venue for Lamu Cultural Festival has been changed.',
      type: 'announcement',
      read: true,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    },
    {
      id: 3,
      title: 'Your Ticket Confirmation',
      message: 'Your ticket for Kilifi New Year Festival has been confirmed.',
      type: 'ticket',
      read: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: 4,
      title: 'Welcome to WYA!',
      message: 'Welcome to WYA - Your local event discovery platform.',
      type: 'system',
      read: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    }
  ];
  
  // Use mock data if API fails
  const displayNotifications = notifications && notifications.length > 0 ? notifications : mockNotifications;
  
  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">Your Notifications</h1>
          {displayNotifications.length > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
          </div>
        ) : displayNotifications.length > 0 ? (
          <div className="grid gap-4">
            {displayNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-colors ${!notification.read ? 'bg-kenya-brown/10 border-kenya-orange/50' : ''}`}
              >
                <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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
                      onClick={() => handleMarkAsRead(notification.id)}
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
              You don't have any notifications right now. We'll notify you when there are updates about events, tickets, or important announcements.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
