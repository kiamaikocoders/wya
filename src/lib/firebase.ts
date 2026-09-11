import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCb2uPNDKbB1SDBvdyVdjzC9BNVwQSRKwQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'wya254.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'wya254',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'wya254.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '999495041218',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:999495041218:web:a3a1acd70a0ad9621dfb5b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-0VMRDVHDCD',
};

export const firebaseVapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ??
  'BHTbrkJt5pOk_cRDqZ9MoubAgFKw5MSxBKlIG2KFRvYcblV9cZgLILSrextVfTIZb1i5OcqSkfRR3rrqg_qT-do';

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(firebaseWebConfig);
  return app;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  return getMessaging(getFirebaseApp());
}
