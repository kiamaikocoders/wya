/** Minimal types for OneSignal Web SDK v16 loaded via CDN. */

export interface OneSignalNotificationClickEvent {
  notification: {
    title?: string;
    body?: string;
    launchURL?: string;
    additionalData?: Record<string, unknown>;
  };
}

export interface OneSignalPushSubscription {
  id?: string | null;
  token?: string | null;
  optedIn?: boolean;
  optIn(): Promise<void>;
  optOut(): Promise<void>;
}

export interface OneSignalUser {
  PushSubscription: OneSignalPushSubscription;
}

export interface OneSignalNotifications {
  permission: boolean;
  isPushSupported(): boolean;
  requestPermission(): Promise<boolean>;
  addEventListener(
    event: "click" | "permissionChange" | "foregroundWillDisplay" | "dismiss",
    listener: (event: OneSignalNotificationClickEvent) => void
  ): void;
  removeEventListener(
    event: "click" | "permissionChange" | "foregroundWillDisplay" | "dismiss",
    listener: (event: OneSignalNotificationClickEvent) => void
  ): void;
  setDefaultUrl(url: string): void;
}

export interface OneSignalInstance {
  init(options: Record<string, unknown>): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  User: OneSignalUser;
  Notifications: OneSignalNotifications;
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>;
  }
}

export {};
