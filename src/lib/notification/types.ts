
export interface Notification {
  id: number;
  user_id: string;
  type: 'event_update' | 'announcement' | 'ticket' | 'system' | 'follow' | 'message';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: {
    event_id?: number;
    ticket_id?: number;
    follower_id?: string;
    follower_name?: string;
    message_id?: string;
    sender_id?: string;
    [key: string]: any;
  };
}

export interface CreateNotificationData {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Notification['data'];
}
