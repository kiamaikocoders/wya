
import { supabase } from '../supabase';
import type { CreateNotificationData, Notification, NotificationSettings } from './types';

function isRlsInsertError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return e.code === '42501' || (typeof e.message === 'string' && e.message.includes('row-level security'));
}

async function dispatchViaEdgeFunction(
  notification: CreateNotificationData,
  sendPush = true
): Promise<number | null> {
  const { data, error } = await supabase.functions.invoke('dispatch-notification', {
    body: { ...notification, send_push: sendPush },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as { notification_id?: number; error?: string } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload?.notification_id ?? null;
}

async function dispatchPushNotification(payload: {
  user_id: string;
  title: string;
  message: string;
  link?: string;
  notification_id?: number;
  type?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });
    if (error) {
      console.warn('Push notification dispatch failed:', error.message);
    }
  } catch (error) {
    console.warn('Push notification dispatch failed:', error);
  }
}

// Create the notification service
export const notificationService = {
  getUserNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Cast the returned data to match our expected type
      return (data || []).map(item => ({
        ...item,
        type: item.type as Notification['type']
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },
  
  // Get all notifications for the current user
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Cast the returned data to match our expected type
      return (data || []).map(item => ({
        ...item,
        type: item.type as Notification['type']
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },
  
  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  markAllAsRead: async (userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  createNotification: async (notification: CreateNotificationData): Promise<number | null> => {
    const { user_id, type, title, message, resource_id, resource_type, resource_uuid, link, data } =
      notification;

    try {
      // Prefer edge function: service-role insert + push, avoids RLS SELECT issues on .select('id').
      return await dispatchViaEdgeFunction(notification);
    } catch (edgeError) {
      console.warn('dispatch-notification unavailable, falling back to direct insert:', edgeError);
    }

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id,
        type,
        title,
        message,
        resource_id,
        resource_type,
        resource_uuid,
        link,
        data,
        read: false,
      });

      if (error) {
        if (isRlsInsertError(error)) {
          throw new Error(
            'Notification could not be delivered. Deploy the dispatch-notification edge function.'
          );
        }
        throw error;
      }

      void dispatchPushNotification({
        user_id,
        title,
        message,
        link,
        type,
      });

      return null;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /** Admin-only: seed sample notifications of each type (requires deployed dispatch-notification function). */
  seedTestNotifications: async (targetUserId: string): Promise<{ seeded: number; ids: number[] }> => {
    const { data, error } = await supabase.functions.invoke('dispatch-notification', {
      body: { seed_test: true, target_user_id: targetUserId },
    });

    if (error) {
      throw new Error(error.message);
    }

    const payload = data as { seeded?: number; notification_ids?: number[]; error?: string } | null;
    if (payload?.error) {
      throw new Error(payload.error);
    }

    return {
      seeded: payload?.seeded ?? 0,
      ids: payload?.notification_ids ?? [],
    };
  },
  
  // Get notification settings for the current user
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      // In a real app, you would fetch this from the database
      // For now, return default settings
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
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },
  
  // Update notification settings for the current user
  updateNotificationSettings: async (settings: NotificationSettings): Promise<void> => {
    try {
      // In a real app, you would update this in the database
      // For now, just simulate success
      console.log('Updating notification settings:', settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }
};
