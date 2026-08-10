/**
 * Public consumer site vs admin console origins.
 * Production: www.wya254.com (app) · admin.wya254.com (ops).
 * Localhost keeps both on the same origin via `/admin` paths.
 */

const trimOrigin = (value: string | undefined): string | undefined => {
  const t = value?.trim();
  if (!t) return undefined;
  return t.replace(/\/$/, '');
};

/** Consumer / marketing / auth app origin. */
export const PUBLIC_SITE_ORIGIN =
  trimOrigin(import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  'https://www.wya254.com';

/** Admin console origin. */
export const ADMIN_SITE_ORIGIN =
  trimOrigin(import.meta.env.VITE_ADMIN_SITE_URL as string | undefined) ||
  'https://admin.wya254.com';

/**
 * Whether the hostname is a local Vite/dev host (single-origin admin + app).
 */
export function isLocalDevHost(hostname = typeof window !== 'undefined' ? window.location.hostname : ''): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Whether the hostname is the dedicated admin console host.
 */
export function isAdminHostname(hostname = typeof window !== 'undefined' ? window.location.hostname : ''): boolean {
  if (!hostname) return false;
  if (hostname === 'admin.wya254.com') return true;
  const configured = trimOrigin(import.meta.env.VITE_ADMIN_SITE_URL as string | undefined);
  if (configured) {
    try {
      return new URL(configured).hostname === hostname;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * True when this page load is on the admin host (never true on localhost).
 */
export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false;
  if (isLocalDevHost()) return false;
  return isAdminHostname();
}

/**
 * Origin for public share links, email assets, and consumer deep links.
 */
export function getPublicSiteOrigin(): string {
  if (typeof window !== 'undefined' && isLocalDevHost()) {
    return window.location.origin;
  }
  return PUBLIC_SITE_ORIGIN;
}

/**
 * Origin for admin console absolute URLs.
 */
export function getAdminSiteOrigin(): string {
  if (typeof window !== 'undefined' && isLocalDevHost()) {
    return window.location.origin;
  }
  return ADMIN_SITE_ORIGIN;
}

/**
 * Paths that belong to the admin console.
 */
export function isAdminAppPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/admin-login'
  );
}

/**
 * Absolute URL into the admin console (keeps `/admin…` paths).
 */
export function adminConsoleUrl(path = '/admin'): string {
  let normalised = path.startsWith('/') ? path : `/${path}`;
  if (normalised === '/admin-login') normalised = '/admin';
  if (!isAdminAppPath(normalised)) {
    normalised = normalised === '/' ? '/admin' : `/admin${normalised}`;
  }
  return `${getAdminSiteOrigin()}${normalised}`;
}
