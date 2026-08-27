import { Capacitor } from '@capacitor/core';

/**
 * Whether the current runtime is the native Capacitor shell (full app).
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Home path after login / email confirm (excludes admin, which is handled separately).
 * Web → light account hub; native app → full dashboard.
 */
export function getPostLoginPath(): '/account' | '/home' {
  return isNativeApp() ? '/home' : '/account';
}

/**
 * Logo / “home” link for authenticated consumers.
 */
export function getAuthenticatedHomePath(): '/account' | '/home' {
  return getPostLoginPath();
}

/**
 * Paths that stay available on the light web account surface (auth required).
 * Aligned with Streamlined Web Experience Proposal.
 */
export function isWebAccountPath(pathname: string): boolean {
  if (
    pathname === '/account' ||
    pathname === '/tickets' ||
    pathname === '/profile' ||
    pathname === '/settings' ||
    pathname === '/onboarding' ||
    pathname === '/notifications' ||
    pathname === '/faq' ||
    pathname === '/contact' ||
    pathname === '/feedback' ||
    pathname === '/events'
  ) {
    return true;
  }
  return pathname.startsWith('/tickets/') || pathname.startsWith('/events/');
}

/**
 * Paths that belong only in the native app (used to rewrite notification deep links on web).
 */
export function isAppOnlyPath(pathname: string): boolean {
  const appOnlyPrefixes = [
    '/home',
    '/discover',
    '/stories',
    '/chat',
    '/search',
    '/categories',
    '/ai-assistance',
    '/favorites',
    '/create-event',
    '/request-event',
    '/analytics',
    '/surveys',
    '/users',
    '/friend-requests',
    '/sponsors',
    '/share/event-media',
  ];
  return appOnlyPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * On web, rewrite app-only deep links to an open-in-app download URL.
 */
export function resolveWebSafePath(path: string): string {
  if (isNativeApp()) return path;
  try {
    const url = path.startsWith('http') ? new URL(path) : new URL(path, window.location.origin);
    if (isAppOnlyPath(url.pathname)) {
      return `/download?next=${encodeURIComponent(`${url.pathname}${url.search}${url.hash}`)}`;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}
