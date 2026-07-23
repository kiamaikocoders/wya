import { ADMIN_CREDENTIALS } from '@/lib/admin-credentials';

const STORAGE_KEY = 'wya_dev_admin_bypass';
const DEV_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

export interface DevAdminUser {
  id: string;
  name: string;
  email: string;
  user_type: 'admin';
  username: string;
  full_name: string;
  created_at: string;
}

/**
 * Local/admin UI bypass for when Supabase Auth is unreachable or missing an admin user.
 *
 * - Always on in Vite DEV.
 * - On production only when `VITE_ENABLE_DEV_ADMIN_BYPASS=true` (set in Vercel, then redeploy).
 * Turn the flag off after testing — anyone with the hardcoded admin credentials can enter admin UI.
 */
export function isDevAdminBypassEnabled(): boolean {
  return (
    import.meta.env.DEV === true ||
    import.meta.env.VITE_ENABLE_DEV_ADMIN_BYPASS === 'true'
  );
}

/** Production testing flag (not DEV). Wider fallback: activate bypass on any admin sign-in failure. */
export function isProdAdminBypassFlagOn(): boolean {
  return import.meta.env.VITE_ENABLE_DEV_ADMIN_BYPASS === 'true';
}

export function isDevAdminBypassActive(): boolean {
  if (!isDevAdminBypassEnabled()) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function activateDevAdminBypass(): void {
  if (!isDevAdminBypassEnabled()) return;
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function clearDevAdminBypass(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getDevAdminUser(): DevAdminUser {
  return {
    id: DEV_ADMIN_ID,
    name: 'Dev Admin',
    email: ADMIN_CREDENTIALS.email,
    user_type: 'admin',
    username: 'admin',
    full_name: 'Dev Admin',
    created_at: new Date().toISOString(),
  };
}

export function isSupabaseNetworkError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : String(error);

  return /failed to fetch|networkerror|network request failed|fetch failed|load failed|could not resolve|connection timeout|connection terminated|timeout/i.test(
    message
  );
}

export function matchesDevAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

export const SUPABASE_PROJECT_REF = 'nnlxxbuekqlaqamczwyi';

export const SUPABASE_RESTORE_URL =
  'https://supabase.com/dashboard/org/izeznuljsgnrszavuqlj/billing';

export function getSupabaseOfflineMessage(): string {
  return 'Your Supabase project is paused or unreachable. Admin data cannot load until the project is restored.';
}
