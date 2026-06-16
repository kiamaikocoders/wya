import { Capacitor } from "@capacitor/core";
import type { OneSignalInstance } from "@/types/onesignal";

export const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID ?? "1a8bb6db-49a8-4a77-b9fc-649c17a8677e";

export const ONESIGNAL_SAFARI_WEB_ID =
  import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID ??
  "web.onesignal.auto.4ed285de-faf5-4c6c-a346-3ff91e5aded6";

const SERVICE_WORKER_PATH = "push/onesignal/OneSignalSDKWorker.js";
const SERVICE_WORKER_SCOPE = "/push/onesignal/";

let sdkInstance: OneSignalInstance | null = null;
let sdkPromise: Promise<OneSignalInstance | null> | null = null;
let initErrorMessage: string | null = null;

export function isWebPushNotConfiguredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not configured for web push/i.test(message);
}

export function getOneSignalInitError(): string | null {
  return initErrorMessage;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isLocalDevHost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function isOneSignalSupported(): boolean {
  if (!isBrowser()) return false;
  if (Capacitor.isNativePlatform()) return false;
  return Boolean(ONESIGNAL_APP_ID);
}

function canUseBrowserNotifications(): boolean {
  return isBrowser() && "Notification" in window;
}

function getInitOptions(): Record<string, unknown> {
  return {
    appId: ONESIGNAL_APP_ID,
    safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
    serviceWorkerPath: SERVICE_WORKER_PATH,
    serviceWorkerParam: { scope: SERVICE_WORKER_SCOPE },
    // Custom prompt in Settings — not OneSignal's floating bell.
    notifyButton: { enable: false },
    ...(isLocalDevHost() ? { allowLocalhostAsSecureOrigin: true } : {}),
  };
}

async function initOneSignal(OneSignal: OneSignalInstance): Promise<OneSignalInstance> {
  await OneSignal.init(getInitOptions());
  OneSignal.Notifications.setDefaultUrl(`${window.location.origin}/notifications`);
  sdkInstance = OneSignal;
  return OneSignal;
}

/**
 * Bootstrap OneSignal once — init lives here only (not index.html).
 * Handles SDK loading before or after this module runs.
 */
function bootstrapOneSignal(): Promise<OneSignalInstance | null> {
  if (!isOneSignalSupported()) return Promise.resolve(null);
  if (sdkInstance) return Promise.resolve(sdkInstance);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    let settled = false;
    const finish = (instance: OneSignalInstance | null) => {
      if (settled) return;
      settled = true;
      resolve(instance);
    };

    const startInit = async (OneSignal: OneSignalInstance) => {
      try {
        const instance = await initOneSignal(OneSignal);
        finish(instance);
      } catch (error) {
        initErrorMessage = error instanceof Error ? error.message : String(error);
        if (isWebPushNotConfiguredError(error)) {
          console.warn(
            "[OneSignal] Web push is not configured in the OneSignal dashboard. " +
              "Add the Web platform (Custom Code), set Site URL to this origin, and point the service worker to /push/onesignal/."
          );
        } else {
          console.error("[OneSignal] init failed:", error);
        }
        finish(null);
      }
    };

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(startInit);

    // If the CDN script is slow, keep trying until 30s (don't resolve null early).
    const deadline = Date.now() + 30_000;
    const poll = () => {
      if (settled) return;
      if (sdkInstance) {
        finish(sdkInstance);
        return;
      }
      if (Date.now() > deadline) {
        console.warn("[OneSignal] SDK script did not load in time. Check ad blockers or network.");
        finish(null);
        return;
      }
      window.setTimeout(poll, 250);
    };
    poll();
  });

  return sdkPromise;
}

function waitForOneSignal(): Promise<OneSignalInstance | null> {
  return bootstrapOneSignal();
}

// Start loading as soon as this module is imported in the browser.
if (isBrowser() && isOneSignalSupported()) {
  void bootstrapOneSignal();
}

export async function initializeOneSignal(): Promise<OneSignalInstance | null> {
  return waitForOneSignal();
}

export async function oneSignalLogin(userId: string): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal || !userId) return;
  await OneSignal.login(userId);
}

export async function oneSignalLogout(): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;
  await OneSignal.logout();
}

export type SubscribePushResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "dismissed" | "sdk_not_ready" | "opt_in_failed" };

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!canUseBrowserNotifications()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

async function completeOneSignalSubscription(userId: string): Promise<SubscribePushResult> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) {
    return { ok: false, reason: "sdk_not_ready" };
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    await OneSignal.login(userId);
    await OneSignal.User.PushSubscription.optIn();
    if (OneSignal.User.PushSubscription.optedIn) {
      return { ok: true };
    }
    return { ok: false, reason: "opt_in_failed" };
  } catch (error) {
    console.warn("[OneSignal] opt-in failed:", error);
    return { ok: false, reason: "opt_in_failed" };
  }
}

export async function subscribeToPushNotifications(userId: string): Promise<SubscribePushResult> {
  if (!userId) return { ok: false, reason: "unsupported" };

  const permission = await requestBrowserNotificationPermission();
  if (permission === "unsupported") return { ok: false, reason: "unsupported" };
  if (permission === "denied") return { ok: false, reason: "denied" };
  if (permission !== "granted") return { ok: false, reason: "dismissed" };

  return completeOneSignalSubscription(userId);
}

export async function isPushOptedIn(): Promise<boolean> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return Notification.permission === "granted";
  return Boolean(OneSignal.User.PushSubscription.optedIn);
}

export type PushSubscriptionStatus = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  optedIn: boolean;
  active: boolean;
  sdkReady: boolean;
  webPushConfigured: boolean;
  initError: string | null;
};

export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  if (!canUseBrowserNotifications()) {
    return {
      supported: false,
      permission: "unsupported",
      optedIn: false,
      active: false,
      sdkReady: false,
      webPushConfigured: true,
      initError: null,
    };
  }

  const permission = Notification.permission;
  const OneSignal = await waitForOneSignal();
  const sdkReady = Boolean(OneSignal);
  const optedIn = OneSignal ? Boolean(OneSignal.User.PushSubscription.optedIn) : false;
  const webPushConfigured = !initErrorMessage || !isWebPushNotConfiguredError(initErrorMessage);

  return {
    supported: OneSignal?.Notifications.isPushSupported() ?? true,
    permission,
    optedIn,
    sdkReady,
    webPushConfigured,
    initError: initErrorMessage,
    active: permission === "granted" && optedIn,
  };
}

export async function setPushOptIn(enabled: boolean): Promise<void> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return;

  if (enabled) {
    await OneSignal.User.PushSubscription.optIn();
  } else {
    await OneSignal.User.PushSubscription.optOut();
  }
}

export async function syncPushSubscriptionWithPreference(
  enabled: boolean,
  options?: { promptIfNeeded?: boolean; userId?: string }
): Promise<void> {
  if (!isOneSignalSupported()) return;

  if (enabled && options?.promptIfNeeded && options.userId) {
    await subscribeToPushNotifications(options.userId);
    return;
  }

  if (enabled && options?.userId) {
    await oneSignalLogin(options.userId);
    await setPushOptIn(true);
    return;
  }

  if (!enabled) {
    await setPushOptIn(false);
  }
}

export async function onNotificationClick(
  handler: (url: string) => void
): Promise<(() => void) | null> {
  const OneSignal = await waitForOneSignal();
  if (!OneSignal) return null;

  const listener = (event: {
    notification?: { launchURL?: string; additionalData?: Record<string, unknown> };
  }) => {
    const launchUrl = event.notification?.launchURL;
    const linkFromData = event.notification?.additionalData?.link;
    const url =
      (typeof launchUrl === "string" && launchUrl) ||
      (typeof linkFromData === "string" && linkFromData) ||
      "/notifications";
    handler(url);
  };

  OneSignal.Notifications.addEventListener("click", listener);
  return () => OneSignal.Notifications.removeEventListener("click", listener);
}
