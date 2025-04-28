
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

export interface NotificationSettings {
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
