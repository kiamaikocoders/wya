import { Capacitor } from "@capacitor/core";
import type { OneSignalInstance } from "@/types/onesignal";

export const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID ?? "1a8bb6db-49a8-4a77-b9fc-649c17a8677e";

const SERVICE_WORKER_PATH = "push/onesignal/OneSignalSDKWorker.js";
const SERVICE_WORKER_SCOPE = "/push/onesignal/";

let initPromise: Promise<OneSignalInstance | null> | null = null;
let sdkInstance: OneSignalInstance | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isOneSignalSupported(): boolean {
  if (!isBrowser()) return false;
  if (Capacitor.isNativePlatform()) return false;
  return Boolean(ONESIGNAL_APP_ID);
}

function runDeferred<T>(fn: (oneSignal: OneSignalInstance) => T | Promise<T>): Promise<T | null> {
  if (!isOneSignalSupported()) return Promise.resolve(null);

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        resolve(await fn(OneSignal));
      } catch (error) {
        console.warn("[OneSignal]", error);
        resolve(null);
      }
    });
  });
}

async function getOneSignal(): Promise<OneSignalInstance | null> {
  if (!isOneSignalSupported()) return null;
  if (sdkInstance) return sdkInstance;

  if (!initPromise) {
    initPromise = runDeferred(async (OneSignal) => {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerPath: SERVICE_WORKER_PATH,
        serviceWorkerParam: { scope: SERVICE_WORKER_SCOPE },
        ...(isLocalhost ? { allowLocalhostAsSecureOrigin: true } : {}),
        notifyButton: { enable: false },
      });

      OneSignal.Notifications.setDefaultUrl(`${window.location.origin}/notifications`);
      sdkInstance = OneSignal;
      return OneSignal;
    });
  }

  return initPromise;
}

export async function initializeOneSignal(): Promise<OneSignalInstance | null> {
  return getOneSignal();
}

export async function oneSignalLogin(userId: string): Promise<void> {
  const OneSignal = await getOneSignal();
  if (!OneSignal || !userId) return;
  await OneSignal.login(userId);
}

export async function oneSignalLogout(): Promise<void> {
  const OneSignal = await getOneSignal();
  if (!OneSignal) return;
  await OneSignal.logout();
}

export async function requestPushPermission(): Promise<boolean> {
  const OneSignal = await getOneSignal();
  if (!OneSignal) return false;

  if (!OneSignal.Notifications.isPushSupported()) {
    return false;
  }

  return OneSignal.Notifications.requestPermission();
}

export async function isPushOptedIn(): Promise<boolean> {
  const OneSignal = await getOneSignal();
  if (!OneSignal) return false;
  return Boolean(OneSignal.User.PushSubscription.optedIn);
}

export async function setPushOptIn(enabled: boolean): Promise<void> {
  const OneSignal = await getOneSignal();
  if (!OneSignal) return;

  if (enabled) {
    await OneSignal.User.PushSubscription.optIn();
  } else {
    await OneSignal.User.PushSubscription.optOut();
  }
}

export async function syncPushSubscriptionWithPreference(
  enabled: boolean,
  options?: { promptIfNeeded?: boolean }
): Promise<void> {
  if (!isOneSignalSupported()) return;

  if (enabled) {
    if (options?.promptIfNeeded) {
      await requestPushPermission();
    }
    await setPushOptIn(true);
    return;
  }

  await setPushOptIn(false);
}

export async function onNotificationClick(
  handler: (url: string) => void
): Promise<(() => void) | null> {
  const OneSignal = await getOneSignal();
  if (!OneSignal) return null;

  const listener = (event: { notification?: { launchURL?: string; additionalData?: Record<string, unknown> } }) => {
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
