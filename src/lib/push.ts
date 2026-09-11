import {
  getPushSubscriptionStatus as getOneSignalStatus,
  isOneSignalSupported,
  subscribeToPushNotifications as subscribeOneSignal,
  syncPushSubscriptionWithPreference as syncOneSignal,
  type PushSubscriptionStatus,
  type SubscribePushResult,
} from '@/lib/onesignal';
import {
  hasFcmToken,
  isFcmSupported,
  subscribeToFcm,
  unsubscribeFcm,
} from '@/lib/fcm';

export type { PushSubscriptionStatus, SubscribePushResult };

export async function subscribeToPushNotifications(userId: string): Promise<SubscribePushResult> {
  const fcm = await subscribeToFcm(userId);
  if (fcm.ok) {
    if (isOneSignalSupported()) {
      void subscribeOneSignal(userId);
    }
    return { ok: true };
  }

  if (isOneSignalSupported()) {
    return subscribeOneSignal(userId);
  }

  if (fcm.reason === 'token_failed') return { ok: false, reason: 'opt_in_failed' };
  return { ok: false, reason: fcm.reason };
}

export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  const onesignal = await getOneSignalStatus();
  const fcmReady = isFcmSupported();
  const fcmActive = fcmReady && onesignal.permission === 'granted' && (await hasFcmToken());

  return {
    ...onesignal,
    supported: onesignal.supported || fcmReady,
    sdkReady: onesignal.sdkReady || fcmReady,
    webPushConfigured: fcmReady || onesignal.webPushConfigured,
    optedIn: onesignal.optedIn || fcmActive,
    active: onesignal.active || fcmActive,
  };
}

export async function syncPushSubscriptionWithPreference(
  enabled: boolean,
  options?: { promptIfNeeded?: boolean; userId?: string },
): Promise<void> {
  const userId = options?.userId;
  if (enabled && options?.promptIfNeeded && userId) {
    await subscribeToPushNotifications(userId);
    return;
  }
  if (enabled && userId) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      await subscribeToFcm(userId);
    }
    await syncOneSignal(true, options);
    return;
  }
  if (!enabled && userId) {
    await unsubscribeFcm(userId);
    await syncOneSignal(false, options);
  }
}
