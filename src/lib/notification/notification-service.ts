
import { apiClient } from "../api-client";
import { toast } from 'sonner';
import { 
  Notification, 
  CreateNotificationPayload, 
  NotificationSettings 
} from './types';
import { 
  connectWebSocket, 
  setupWebSocketReconnection, 
  closeWebSocketConnection 
} from './websocket';

const NOTIFICATION_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/notifications`;

export const notificationService = {
  getUserNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(`${NOTIFICATION_ENDPOINT}/user`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },
  
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>(`${NOTIFICATION_ENDPOINT}/unread-count`);
      return response.count;
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
      return 0;
    }
  },
  
  markAsRead: async (id: number): Promise<void> => {
    try {
      await apiClient.patch(`${NOTIFICATION_ENDPOINT}/${id}/read`, { read: true });
    } catch (error) {
      console.error(`Failed to mark notification #${id} as read:`, error);
    }
  },
  
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.post(`${NOTIFICATION_ENDPOINT}/read-all`, {});
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },
  
  createNotification: async (data: CreateNotificationPayload): Promise<void> => {
    try {
      await apiClient.post(NOTIFICATION_ENDPOINT, data);
      toast.success('Notification sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  deleteNotification: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${NOTIFICATION_ENDPOINT}/${id}`);
    } catch (error) {
      console.error(`Failed to delete notification #${id}:`, error);
    }
  },
  
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get<NotificationSettings>(`${NOTIFICATION_ENDPOINT}/settings`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      return {
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notification_types: {
          event_updates: true,
          messages: true,
          announcements: true,
          system: true,
          reviews: true
        }
      };
    }
  },
  
  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<void> => {
    try {
      await apiClient.patch(`${NOTIFICATION_ENDPOINT}/settings`, settings);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      toast.error(errorMessage);
    }
  },
  
  initializeRealTimeNotifications: (userId: number, onNewNotification: (notification: Notification) => void) => {
    if (!userId) return;
    
    closeWebSocketConnection();
    reconnectAttempts = 0;
    
    notificationSocket = connectWebSocket(userId, (event) => {
      if (event.type === 'notification') {
        onNewNotification(event.data);
      }
    });
    
    if (notificationSocket) {
      notificationSocket.onclose = () => {
        console.log('WebSocket connection closed');
        setupWebSocketReconnection(userId, (event) => {
          if (event.type === 'notification') {
            onNewNotification(event.data);
          }
        });
      };
      
      notificationSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        closeWebSocketConnection();
        setupWebSocketReconnection(userId, (event) => {
          if (event.type === 'notification') {
            onNewNotification(event.data);
          }
        });
      };
    }
    
    return () => {
      closeWebSocketConnection();
    };
  },
  
  sendEmailNotification: async (userId: number, subject: string, body: string): Promise<boolean> => {
    try {
      await apiClient.post(`${NOTIFICATION_ENDPOINT}/email`, {
        user_id: userId,
        subject,
        body
      });
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  },
  
  sendPushNotification: async (userId: number, title: string, body: string, icon?: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }
      
      await apiClient.post(`${NOTIFICATION_ENDPOINT}/push`, {
        user_id: userId,
        title,
        body,
        icon
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }
};

export type { Notification, CreateNotificationPayload, NotificationSettings };
