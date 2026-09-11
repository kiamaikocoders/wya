import { getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { firebaseVapidKey, getFirebaseMessaging } from '@/lib/firebase';

const TOKEN_STORAGE_KEY = 'wya.fcmToken';

export type FcmSubscribeResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'dismissed' | 'token_failed' };

function canUseBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function isFcmSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return false;
  return canUseBrowserNotifications();
}

async function registerMessagingWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
}

async function persistToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: 'web',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' },
  );
  if (error) throw error;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

async function dropStoredToken(userId: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;
  await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', token);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function subscribeToFcm(userId: string): Promise<FcmSubscribeResult> {
  if (!userId || !isFcmSupported()) return { ok: false, reason: 'unsupported' };

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

  if (permission === 'denied') return { ok: false, reason: 'denied' };
  if (permission !== 'granted') return { ok: false, reason: 'dismissed' };

  const messaging = await getFirebaseMessaging();
  if (!messaging) return { ok: false, reason: 'unsupported' };

  try {
    const registration = await registerMessagingWorker();
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    });
    if (!token) return { ok: false, reason: 'token_failed' };
    await persistToken(userId, token);
    return { ok: true, token };
  } catch (error) {
    console.warn('[FCM] token failed:', error);
    return { ok: false, reason: 'token_failed' };
  }
}

export async function refreshFcmToken(userId: string): Promise<void> {
  if (!userId || !isFcmSupported()) return;
  if (Notification.permission !== 'granted') return;
  await subscribeToFcm(userId);
}

export async function unsubscribeFcm(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await dropStoredToken(userId);
  } catch (error) {
    console.warn('[FCM] unsubscribe failed:', error);
  }
}

export async function hasFcmToken(): Promise<boolean> {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function listenForForegroundMessages(handlers: {
  onReceive?: () => void;
  onClick?: (link: string) => void;
}): () => void {
  let unsub: (() => void) | undefined;

  void getFirebaseMessaging().then((messaging) => {
    if (!messaging) return;
    unsub = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'WYA';
      const body = payload.notification?.body || payload.data?.body || '';
      const link = payload.data?.link || '/notifications';
      handlers.onReceive?.();
      if (Notification.permission === 'granted') {
        const note = new Notification(title, { body, data: { link } });
        note.onclick = () => {
          window.focus();
          handlers.onClick?.(link);
          note.close();
        };
      }
    });
  });

  return () => unsub?.();
}
