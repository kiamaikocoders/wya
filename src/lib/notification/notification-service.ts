
import { apiClient } from '../api-client';
import { toast } from 'sonner';
import { initializeNotificationSocket, closeNotificationSocket } from './websocket';
// Use type-only import to avoid conflicts with the global Notification
import type { Notification as NotificationType } from './types';

// Mock notifications for development
const SAMPLE_NOTIFICATIONS: NotificationType[] = [
  {
    id: 1,
    user_id: 1,
    title: 'New Event Near You',
    message: 'Check out "Nairobi Food Festival" happening this weekend.',
    type: 'event',
    read: false,
    data: { event_id: 5 },
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 1,
    title: 'Your Ticket Confirmed',
    message: 'Your ticket for "Tech Summit 2023" has been confirmed.',
    type: 'ticket',
    read: true,
    data: { ticket_id: 102, event_id: 3 },
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 3,
    user_id: 1,
    title: 'Event Reminder',
    message: 'Your event "Kilifi New Year" starts tomorrow!',
    type: 'reminder',
    read: false,
    data: { event_id: 7 },
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

let notificationSocket: WebSocket | null = null;
let reconnectAttempts = 0;

// Notification service functions
export const notificationService = {
  // Get all notifications for the current user
  getAllNotifications: async (): Promise<NotificationType[]> => {
    try {
      // In a real app, we would fetch from an API
      // return await apiClient.get<NotificationType[]>('/notifications');
      return SAMPLE_NOTIFICATIONS;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      return [];
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      const notificationIndex = SAMPLE_NOTIFICATIONS.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        SAMPLE_NOTIFICATIONS[notificationIndex].read = true;
      }
      
      // In a real app:
      // await apiClient.patch(`/notifications/${notificationId}`, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      SAMPLE_NOTIFICATIONS.forEach(notification => {
        notification.read = true;
      });
      
      // In a real app:
      // await apiClient.patch('/notifications/mark-all-read');
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  },
  
  // Delete a notification
  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      const notificationIndex = SAMPLE_NOTIFICATIONS.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        SAMPLE_NOTIFICATIONS.splice(notificationIndex, 1);
      }
      
      // In a real app:
      // await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  },
  
  // Initialize WebSocket connection for real-time notifications
  initNotificationSocket: (userId: string | number): void => {
    try {
      initializeNotificationSocket(userId);
    } catch (error) {
      console.error('Failed to initialize notification socket:', error);
    }
  },
  
  // Close WebSocket connection
  closeNotificationSocket: (): void => {
    closeNotificationSocket();
  }
};
