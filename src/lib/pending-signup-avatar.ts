/** Stash signup avatar until the user has an authenticated session (email confirm). */

const STORAGE_KEY = 'pending_signup_avatar';

export type PendingSignupAvatar = {
  userId: string;
  fileName: string;
  mimeType: string;
  /** base64 (no data: prefix) */
  dataBase64: string;
  displayName?: string;
};

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

export async function stashPendingSignupAvatar(
  userId: string,
  file: File,
  displayName?: string
): Promise<void> {
  const dataBase64 = await fileToBase64(file);
  const payload: PendingSignupAvatar = {
    userId,
    fileName: file.name || 'avatar.jpg',
    mimeType: file.type || 'image/jpeg',
    dataBase64,
    displayName: displayName?.trim() || undefined,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPendingSignupAvatar(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function flushPendingSignupAvatar(
  userId: string
): Promise<{ publicUrl: string; displayName?: string } | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let pending: PendingSignupAvatar;
  try {
    pending = JSON.parse(raw) as PendingSignupAvatar;
  } catch {
    clearPendingSignupAvatar();
    return null;
  }

  if (pending.userId !== userId || !pending.dataBase64) {
    clearPendingSignupAvatar();
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

  await supabase.from('profiles').update(updates).eq('id', userId);
  clearPendingSignupAvatar();
  return { publicUrl: uploaded.publicUrl, displayName: pending.displayName };
}
