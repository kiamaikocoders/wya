/** Platform-ops types shown in the admin inbox / bell (not consumer fan-out). */
export const ADMIN_OPS_NOTIFICATION_TYPES = [
  'proposal_submitted',
  'proposal_approved',
  'proposal_rejected',
  'admin_action',
  'app_feedback',
  'ticket_purchase',
  'payment',
  'user_signup',
  'marketplace_sale',
  'moderation',
] as const;

export type AdminOpsNotificationType = (typeof ADMIN_OPS_NOTIFICATION_TYPES)[number];

export interface Notification {
  id: number;
  user_id: string;
  type:
    | 'event_update'
    | 'event_cancelled'
    | 'announcement'
    | 'ticket'
    | 'ticket_purchase'
    | 'payment'
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
    | 'marketplace_sale'
    | 'media_share'
    | 'dsar_export'
    | 'account_deleted'
    | 'welcome'
    | 'checkin'
    | 'feedback_reply'
    | 'app_feedback'
    | 'survey_invite'
    | 'story_like'
    | 'user_signup'
    | 'moderation';
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

/** Whether a notification belongs in the admin ops inbox. */
export function isAdminOpsNotificationType(type: string): boolean {
  return (ADMIN_OPS_NOTIFICATION_TYPES as readonly string[]).includes(type);
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
