
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
  type: 'event_update' | 'announcement' | 'ticket' | 'system';
  read: boolean;
  resource_id?: number;
  resource_type?: string;
  created_at: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: 'event_update' | 'announcement' | 'ticket' | 'system';
  user_ids: number[];
  resource_id?: number;
  resource_type?: string;
}

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
  }
};
