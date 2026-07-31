export interface Notification {
  id: number;
  user_id: string;
  type:
    | 'event_update'
    | 'event_cancelled'
    | 'announcement'
    | 'ticket'
    | 'system'
    | 'follow'
    | 'message'
    | 'proposal_submitted'
    | 'proposal_approved'
    | 'proposal_rejected'
    | 'admin_action'
    | 'new_event'
    | 'event_created'
    | 'organizer_assigned'
    | 'marketplace_buyer'
    | 'marketplace_seller'
    | 'media_share'
    | 'dsar_export'
    | 'account_deleted'
    | 'welcome'
    | 'checkin'
    | 'feedback_reply'
    | 'app_feedback'
    | 'survey_invite'
    | 'story_like';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  resource_type?: string;
  resource_id?: number;
  resource_uuid?: string;
  link?: string;
  data?: Record<string, any> | null;
}

export interface CreateNotificationData {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: number;
  resource_uuid?: string;
  link?: string;
  data?: Record<string, any> | null;
  send_push?: boolean;
  send_email?: boolean;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  marketing_consent: boolean;
  notification_types: {
    event_updates: boolean;
    messages: boolean;
    announcements: boolean;
    system: boolean;
    reviews: boolean;
    proposals: boolean;
    new_events: boolean;
    follow: boolean;
    story_like: boolean;
    tickets: boolean;
  };
}
