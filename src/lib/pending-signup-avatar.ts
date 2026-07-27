/**
 * Stash signup avatar until the user has an authenticated session (email confirm / first login).
 * Uses IndexedDB (not localStorage) so compressed images survive the confirm round-trip on the
 * same origin. Pair with emailRedirectTo pointing at window.location.origin.
 */

import { prepareMediaForUpload } from '@/lib/media-upload-prepare';

const DB_NAME = 'wya_signup';
const STORE = 'pending_avatar';
const RECORD_KEY = 'current';

export type PendingSignupAvatar = {
  userId: string;
  email?: string;
  fileName: string;
  mimeType: string;
  /** base64 (no data: prefix) */
  dataBase64: string;
  displayName?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function idbSet(value: PendingSignupAvatar): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, RECORD_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to stash avatar'));
  });
  db.close();
}

async function idbGet(): Promise<PendingSignupAvatar | null> {
  const db = await openDb();
  const value = await new Promise<PendingSignupAvatar | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(RECORD_KEY);
    req.onsuccess = () => resolve((req.result as PendingSignupAvatar) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to read stashed avatar'));
  });
  db.close();
  return value;
}

async function idbClear(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear stashed avatar'));
    });
    db.close();
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('pending_signup_avatar');
  } catch {
    // ignore
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read avatar file'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read avatar file'));
    reader.readAsDataURL(file);
  });
}

function base64ToFile(pending: PendingSignupAvatar): File {
  const binary = atob(pending.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], pending.fileName, { type: pending.mimeType });
}

/** Migrate any legacy localStorage stash into IndexedDB once. */
async function readLegacyLocalStorage(): Promise<PendingSignupAvatar | null> {
  try {
    const raw = localStorage.getItem('pending_signup_avatar');
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingSignupAvatar;
    if (!pending?.userId || !pending?.dataBase64) {
      localStorage.removeItem('pending_signup_avatar');
      return null;
    }
    await idbSet(pending);
    localStorage.removeItem('pending_signup_avatar');
    return pending;
  } catch {
    try {
      localStorage.removeItem('pending_signup_avatar');
    } catch {
      // ignore
    }
    return null;
  }
}

export async function stashPendingSignupAvatar(
  userId: string,
  file: File,
  displayName?: string,
  email?: string
): Promise<void> {
  const prepared = await prepareMediaForUpload(file, 'avatar');
  const dataBase64 = await fileToBase64(prepared);
  const payload: PendingSignupAvatar = {
    userId,
    email: email?.trim().toLowerCase() || undefined,
    fileName: prepared.name || 'avatar.jpg',
    mimeType: prepared.type || 'image/jpeg',
    dataBase64,
    displayName: displayName?.trim() || undefined,
  };
  await idbSet(payload);
}

export function clearPendingSignupAvatar(): void {
  void idbClear();
}

export async function flushPendingSignupAvatar(
  userId: string,
  email?: string
): Promise<{ publicUrl: string; displayName?: string } | null> {
  let pending = await idbGet();
  if (!pending) {
    pending = await readLegacyLocalStorage();
  }
  if (!pending?.dataBase64) {
    return null;
  }

  const emailMatch =
    Boolean(email && pending.email) &&
    pending.email === email.trim().toLowerCase();
  if (pending.userId !== userId && !emailMatch) {
    // Different account — leave stash alone for the intended user.
    return null;
  }

  const { storageService } = await import('@/lib/storage-service');
  const { supabase } = await import('@/lib/supabase');
  const file = base64ToFile(pending);
  const uploaded = await storageService.uploadAvatar(file, userId);

  const updates: { avatar_url: string; full_name?: string } = {
    avatar_url: uploaded.publicUrl,
  };
  if (pending.displayName) {
    updates.full_name = pending.displayName;
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) {
    throw error;
  }

  await idbClear();
  return { publicUrl: uploaded.publicUrl, displayName: pending.displayName };
}
