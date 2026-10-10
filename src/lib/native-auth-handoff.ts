export const ANDROID_PACKAGE = 'com.wya254.app';
export const NATIVE_AUTH_SCHEME = 'wya';

const BROWSER_FALLBACK_URL = 'https://www.wya254.com/login';

export function isMobileAuthUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Deep links that open the native app with the same query/hash the email landed on.
 * Android gets an intent URL first so ?code= survives Chrome. Only one link should be
 * opened automatically: the PKCE code is single-use.
 */
export function buildNativeAuthDeepLinks(search: string, hash: string): string[] {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const combined = [q, h].filter(Boolean).join('&');
  const pathAndQuery = `auth/callback${combined ? `?${combined}` : ''}`;
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  const links: string[] = [];
  if (isAndroid) {
    links.push(
      `intent://${pathAndQuery}#Intent;scheme=${NATIVE_AUTH_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(BROWSER_FALLBACK_URL)};end`,
    );
  }
  links.push(`${NATIVE_AUTH_SCHEME}://${pathAndQuery}`);
  return links;
}
