/**
 * Sound effects and notification permission.
 * Place like.wav and notification.mp3 in public/sounds/
 */

import { isOneSignalSupported, requestPushPermission } from '@/lib/onesignal';

const LIKE_SOUND_PATH = '/sounds/like.wav';
const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3';

let likeAudio: HTMLAudioElement | null = null;
let notificationAudio: HTMLAudioElement | null = null;

function getLikeAudio(): HTMLAudioElement | null {
  if (likeAudio) return likeAudio;
  try {
    likeAudio = new Audio(LIKE_SOUND_PATH);
    return likeAudio;
  } catch {
    return null;
  }
}

function getNotificationAudio(): HTMLAudioElement | null {
  if (notificationAudio) return notificationAudio;
  try {
    notificationAudio = new Audio(NOTIFICATION_SOUND_PATH);
    return notificationAudio;
  } catch {
    return null;
  }
}

/** Play the like sound (e.g. when user likes a story/video). Call from a user gesture. */
export function playLikeSound(): void {
  try {
    const audio = getLikeAudio();
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

/** Play the notification sound (e.g. when a new notification arrives). */
export function playNotificationSound(): void {
  try {
    const audio = getNotificationAudio();
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

/** Request browser / OneSignal push permission. Call from a user gesture. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'default'> {
  if (isOneSignalSupported()) {
    const granted = await requestPushPermission();
    return granted ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default';
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/** Whether we can show browser notifications. */
export function canShowNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOneSignalSupported()) {
    return 'Notification' in window && Notification.permission === 'granted';
  }
  return 'Notification' in window && Notification.permission === 'granted';
}
