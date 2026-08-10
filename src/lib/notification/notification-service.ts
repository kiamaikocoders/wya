
import { supabase } from '../supabase';
import {
  ADMIN_OPS_NOTIFICATION_TYPES,
  type CreateNotificationData,
  type Notification,
  type NotificationSettings,
} from './types';

/** React Query key for a user's notification inbox (shared by consumer + admin bells). */
export function notificationsQueryKey(userId: string | undefined) {
  return ['notifications', userId] as const;
}

/** React Query key for the admin ops inbox (filtered platform alerts). */
export function adminOpsNotificationsQueryKey(userId: string | undefined) {
  return ['admin-ops-notifications', userId] as const;
}

function isRlsInsertError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return e.code === '42501' || (typeof e.message === 'string' && e.message.includes('row-level security'));
}

function mapNotificationRows(data: Record<string, unknown>[] | null): Notification[] {
  return (data || []).map((item) => ({
    ...item,
    type: item.type as Notification['type'],
  })) as Notification[];
}

async function dispatchViaEdgeFunction(
  notification: CreateNotificationData,
  sendPush = true
): Promise<number | null> {
  const { data, error } = await supabase.functions.invoke('dispatch-notification', {
    body: {
      ...notification,
      send_push: notification.send_push ?? sendPush,
      send_email: notification.send_email,
    },
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
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return mapNotificationRows(data);
  },

  /** Unread count for badge surfaces (head-only count query). */
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error counting unread notifications:', error);
      throw error;
    }
    return count ?? 0;
  },

  // Get all notifications for the current user
  getAllNotifications: async (): Promise<Notification[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    return notificationService.getUserNotifications(user.id);
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Fan-out an in-app notification to every admin profile (`username = 'admin'`).
   * Prefers the SECURITY DEFINER `notify_admins` RPC (works under RLS).
   */
  notifyAdmins: async (
    notification: Omit<CreateNotificationData, 'user_id'>
  ): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('notify_admins', {
        p_type: notification.type,
        p_title: notification.title,
        p_message: notification.message,
        p_link: notification.link ?? null,
        p_resource_type: notification.resource_type ?? null,
        p_resource_id: notification.resource_id ?? null,
        p_resource_uuid: notification.resource_uuid ?? null,
        p_data: notification.data ?? null,
      });
      if (error) throw error;
      return typeof data === 'number' ? data : Number(data) || 0;
    } catch (rpcError) {
      console.warn('notify_admins RPC unavailable, falling back to per-admin create:', rpcError);
    }

    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'admin');

    if (error) {
      console.error('Error loading admin recipients:', error);
      throw error;
    }
    if (!admins?.length) return 0;

    const results = await Promise.allSettled(
      admins.map((admin) =>
        notificationService.createNotification({
          ...notification,
          user_id: admin.id,
        })
      )
    );

    return results.filter((r) => r.status === 'fulfilled').length;
  },

  /** Admin ops inbox: proposals, feedback, tickets, payments, signups, etc. */
  getAdminOpsNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', [...ADMIN_OPS_NOTIFICATION_TYPES])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin ops notifications:', error);
      throw error;
    }

    return mapNotificationRows(data);
  },

  /** Unread count for admin bell / sidebar (ops types only). */
  getAdminOpsUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .in('type', [...ADMIN_OPS_NOTIFICATION_TYPES]);

    if (error) {
      console.error('Error counting admin ops notifications:', error);
      throw error;
    }
    return count ?? 0;
  },

  /** Mark all unread admin-ops notifications as read. */
  markAllAdminOpsAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .in('type', [...ADMIN_OPS_NOTIFICATION_TYPES]);

    if (error) {
      console.error('Error marking admin ops notifications as read:', error);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('email_notifications, push_notifications, marketing_consent, notification_email_prefs')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    const prefs = (data?.notification_email_prefs as Record<string, boolean>) ?? {};

    return {
      email_notifications: data?.email_notifications !== false,
      push_notifications: data?.push_notifications !== false,
      in_app_notifications: true,
      marketing_consent: data?.marketing_consent === true,
      notification_types: {
        event_updates: prefs.event_update !== false,
        messages: prefs.message !== false,
        announcements: prefs.announcement !== false && prefs.system !== false,
        system: prefs.system !== false,
        reviews: prefs.reviews !== false,
        proposals: prefs.proposal_approved !== false,
        new_events: prefs.new_event !== false,
        follow: prefs.follow === true,
        story_like: prefs.story_like === true,
        tickets: prefs.ticket !== false,
      },
    };
  },

  // Update notification settings for the current user
  updateNotificationSettings: async (settings: NotificationSettings): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const notification_email_prefs = {
      event_update: settings.notification_types.event_updates,
      event_cancelled: settings.notification_types.event_updates,
      message: settings.notification_types.messages,
      announcement: settings.notification_types.announcements,
      system: settings.notification_types.system,
      reviews: settings.notification_types.reviews,
      proposal_submitted: settings.notification_types.proposals,
      proposal_approved: settings.notification_types.proposals,
      proposal_rejected: settings.notification_types.proposals,
      new_event: settings.notification_types.new_events,
      follow: settings.notification_types.follow,
      story_like: settings.notification_types.story_like,
      ticket: settings.notification_types.tickets,
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_consent: settings.marketing_consent,
        marketing_consent_at: settings.marketing_consent ? new Date().toISOString() : null,
        notification_email_prefs,
      })
      .eq('id', user.id);

    if (error) throw error;
  },
};
