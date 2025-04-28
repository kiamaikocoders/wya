
// Export all notification types and services from a single file

export * from './types';
export * from './notification-service';
export * from './websocket';

// Export the service as a single instance
import { notificationService } from './notification-service';
export { notificationService };

// Re-export the type to avoid conflicts with the global Notification type
import type { Notification as NotificationType } from './types';
export type { NotificationType };
