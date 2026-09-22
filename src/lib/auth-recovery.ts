/**
 * Password recovery / auth-email landing helpers.
 *
 * Email clients open HTTPS links. If Supabase falls back to Site URL (`/`)
 * or the hash is consumed before React Router mounts, we still need to
 * route the user onto `/reset-password` instead of the marketing homepage.
 */

export const PENDING_WEB_RECOVERY_KEY = 'wya_pending_password_recovery';
export const RESET_PASSWORD_PATH = '/reset-password';

export type BootLocation = {
  pathname: string;
  search: string;
  hash: string;
};

/** Captured before supabase-js strips `?code=` / `#access_token=` from the URL. */
export const bootLocation: BootLocation =
  typeof window !== 'undefined'
    ? {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      }
    : { pathname: '', search: '', hash: '' };

function normalizeSearch(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

function normalizeHash(hash: string): string {
  return hash.startsWith('#') ? hash.slice(1) : hash;
}

export function paramsFromAuthUrl(search: string, hash: string): URLSearchParams {
  const out = new URLSearchParams();
  new URLSearchParams(normalizeSearch(search)).forEach((value, key) => out.set(key, value));
  new URLSearchParams(normalizeHash(hash)).forEach((value, key) => {
    if (!out.has(key)) out.set(key, value);
  });
  return out;
}

export function isPasswordRecoveryLanding(search: string, hash: string): boolean {
  const combined = `${search}${hash}`;
  if (/[?&#]type=recovery(?:&|$)/.test(combined) || combined.includes('type=recovery')) {
    return true;
  }
  const params = paramsFromAuthUrl(search, hash);
  if (params.get('type') === 'recovery') return true;

  const hasAuthPayload = Boolean(
    params.get('code') ||
      params.get('access_token') ||
      params.get('token') ||
      params.get('token_hash'),
  );
  if (!hasAuthPayload) return false;
  try {
    return sessionStorage.getItem(PENDING_WEB_RECOVERY_KEY) === '1';
  } catch {
    return false;
  }
}

export function isAuthTokenLanding(search: string, hash: string): boolean {
  const params = paramsFromAuthUrl(search, hash);
  return Boolean(
    params.get('code') ||
      params.get('access_token') ||
      params.get('token_hash') ||
      params.get('token') ||
      params.get('type'),
  );
}

function withSearchAndHash(path: string, search: string, hash: string): string {
  const s = !search ? '' : search.startsWith('?') ? search : `?${search}`;
  const h = !hash ? '' : hash.startsWith('#') ? hash : `#${hash}`;
  return `${path}${s}${h}`;
}

export function buildResetPasswordHref(search: string, hash: string): string {
  return withSearchAndHash(RESET_PASSWORD_PATH, search, hash);
}

export function shouldLeaveRecoveryToCurrentPath(pathname: string): boolean {
  return (
    pathname === RESET_PASSWORD_PATH ||
    pathname.startsWith('/auth/') ||
    pathname === '/forgot-password'
  );
}

/**
 * If the email link dumped the user on `/` (Site URL) or another non-auth page,
 * send recovery to the reset form and other auth callbacks to `/auth/callback`.
 */
export function resolveAuthLandingRedirect(
  pathname: string,
  search: string,
  hash: string,
): string | null {
  if (shouldLeaveRecoveryToCurrentPath(pathname)) return null;
  if (isPasswordRecoveryLanding(search, hash)) {
    return buildResetPasswordHref(search, hash);
  }
  if ((pathname === '/' || pathname === '') && isAuthTokenLanding(search, hash)) {
    return withSearchAndHash('/auth/callback', search, hash);
  }
  return null;
}

export function markPendingWebRecovery(): void {
  try {
    sessionStorage.setItem(PENDING_WEB_RECOVERY_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumePendingWebRecovery(): boolean {
  try {
    const pending = sessionStorage.getItem(PENDING_WEB_RECOVERY_KEY);
    if (pending) sessionStorage.removeItem(PENDING_WEB_RECOVERY_KEY);
    return pending === '1';
  } catch {
    return false;
  }
}
