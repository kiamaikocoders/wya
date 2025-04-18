
import { apiClient } from './api-client';
import { toast } from 'sonner';

// Notification endpoint
const NOTIFICATION_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/notifications`;

// Notification type definitions
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'event_update' | 'announcement' | 'ticket' | 'system' | 'message' | 'review';
  read: boolean;
  resource_id?: number;
  resource_type?: string;
  created_at: string;
  sender_id?: number;
  sender_name?: string;
  action_url?: string;
  priority?: 'high' | 'normal' | 'low';
  expires_at?: string;
  image_url?: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: 'event_update' | 'announcement' | 'ticket' | 'system' | 'message' | 'review';
  user_ids: number[];
  resource_id?: number;
  resource_type?: string;
  sender_id?: number;
  action_url?: string;
  priority?: 'high' | 'normal' | 'low';
  expires_at?: string;
  image_url?: string;
  send_email?: boolean;
  send_push?: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    event_updates: boolean;
    messages: boolean;
    announcements: boolean;
    system: boolean;
    reviews: boolean;
  };
}

// WebSocket connection for real-time notifications
let notificationSocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

const connectWebSocket = (userId: number, onMessage: (data: any) => void) => {
  if (!userId) return null;
  
  // For development, we'll use a mock setup instead of actual WebSockets
  // In production, you would use a real WebSocket connection
  console.log(`Creating mock WebSocket connection for user ${userId}`);
  
  // Create a mock WebSocket object
  const mockSocket = {
    send: (data: string) => {
      console.log('Mock WebSocket sent:', data);
    },
    close: () => {
      console.log('Mock WebSocket connection closed');
      notificationSocket = null;
    }
  };
  
  // Simulate receiving notifications
  const mockNotificationInterval = setInterval(() => {
    // 10% chance of receiving a notification every 30 seconds
    if (Math.random() < 0.1) {
      const mockTypes = ['event_update', 'announcement', 'system', 'message'];
      const mockType = mockTypes[Math.floor(Math.random() * mockTypes.length)] as Notification['type'];
      
      const mockNotification = {
        id: Math.floor(Math.random() * 1000),
        user_id: userId,
        title: `New ${mockType.replace('_', ' ')}`,
        message: `This is a mock ${mockType.replace('_', ' ')} notification.`,
        type: mockType,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      onMessage({ type: 'notification', data: mockNotification });
    }
  }, 30000); // Check every 30 seconds
  
  // Store the interval ID so we can clear it when the socket is closed
  (mockSocket as any).intervalId = mockNotificationInterval;
  
  return mockSocket as any;
};

// Helper function for WebSocket reconnection
const setupWebSocketReconnection = (userId: number, onMessage: (data: any) => void) => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      notificationSocket = connectWebSocket(userId, onMessage);
    }, RECONNECT_DELAY * reconnectAttempts);
  } else {
    console.error('Maximum WebSocket reconnection attempts reached');
    toast.error('Failed to establish notification connection. Please refresh the page.');
  }
};

// Close WebSocket connection
const closeWebSocketConnection = () => {
  if (notificationSocket) {
    // Clear the interval if this is a mock socket
    if ((notificationSocket as any).intervalId) {
      clearInterval((notificationSocket as any).intervalId);
    }
    
    notificationSocket.close();
    notificationSocket = null;
    reconnectAttempts = 0;
  }
};

// Notification service methods
export const notificationService = {
  // Get user notifications
  getUserNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(`${NOTIFICATION_ENDPOINT}/user`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },
  
  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>(`${NOTIFICATION_ENDPOINT}/unread-count`);
      return response.count;
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
      return 0;
    }
  },
  
  // Mark notification as read
  markAsRead: async (id: number): Promise<void> => {
    try {
      await apiClient.patch(`${NOTIFICATION_ENDPOINT}/${id}/read`, { read: true });
    } catch (error) {
      console.error(`Failed to mark notification #${id} as read:`, error);
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.post(`${NOTIFICATION_ENDPOINT}/read-all`, {});
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },
  
  // Create a notification (for organizers)
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
  
  // Delete notification
  deleteNotification: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${NOTIFICATION_ENDPOINT}/${id}`);
    } catch (error) {
      console.error(`Failed to delete notification #${id}:`, error);
    }
  },
  
  // Get notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get<NotificationSettings>(`${NOTIFICATION_ENDPOINT}/settings`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      
      // Return default settings
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
  
  // Update notification settings
  updateNotificationSettings: async (settings: Partial<NotificationSettings>): Promise<void> => {
    try {
      await apiClient.patch(`${NOTIFICATION_ENDPOINT}/settings`, settings);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      toast.error(errorMessage);
    }
  },
  
  // Initialize real-time notifications for the current user
  initializeRealTimeNotifications: (userId: number, onNewNotification: (notification: Notification) => void) => {
    if (!userId) return;
    
    // Close existing connection if any
    closeWebSocketConnection();
    
    // Reset reconnect attempts counter
    reconnectAttempts = 0;
    
    // Create new WebSocket connection
    notificationSocket = connectWebSocket(userId, (event) => {
      if (event.type === 'notification') {
        onNewNotification(event.data);
      }
    });
    
    // Set up event listeners for a real WebSocket
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
  
  // Send notification via Email
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
  
  // Send push notification (if supported by the browser)
  sendPushNotification: async (userId: number, title: string, body: string, icon?: string): Promise<boolean> => {
    // Check if service workers and push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    try {
      // Request permission if not already granted
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }
      
      // In a real app, you would send this to your backend, which would use a push service
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
