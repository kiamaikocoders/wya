
import { toast } from 'sonner';
import { supabase } from '../supabase';
import type { Notification, NotificationSettings } from './types';
import { useAuth } from '@/contexts/AuthContext';

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
      return data || [];
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
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },
  
  markAsRead: async (notificationId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },
  
  markAllAsRead: async (userId?: string): Promise<boolean> => {
    try {
      // If no user ID provided, get the current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        userId = user.id;
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },
  
  createNotification: async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
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
  updateNotificationSettings: async (settings: NotificationSettings): Promise<boolean> => {
    try {
      // In a real app, you would update this in the database
      // For now, just simulate success
      console.log('Updating notification settings:', settings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }
};
