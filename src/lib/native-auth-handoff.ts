export const ANDROID_PACKAGE = 'space.manus.wya.app.t20260416221412';
export const NATIVE_AUTH_SCHEMES = ['wya254', 'manus20260416221412', 'wya'] as const;

export function isMobileAuthUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Deep links that open the Expo app with the same query/hash the email landed on.
 * Intent URL first on Android so ?code= survives Chrome.
 */
export function buildNativeAuthDeepLinks(search: string, hash: string): string[] {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const combined = [q, h].filter(Boolean).join('&');
  const suffix = combined ? `?${combined}` : '';
  const pathAndQuery = `auth/callback${suffix}`;
  const links: string[] = [];
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  for (const scheme of NATIVE_AUTH_SCHEMES) {
    if (isAndroid) {
      links.push(
        `intent://${pathAndQuery}#Intent;scheme=${scheme};package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent('https://www.wya254.com/download')};end`,
      );
    }
    links.push(`${scheme}://${pathAndQuery}`);
  }
  // Explicit product reset URI (Gmail cannot open this; used after the HTTPS page hands off).
  const resetSuffix = combined ? `?${combined}` : '';
  if (isAndroid) {
    links.push(
      `intent://reset-password${resetSuffix}#Intent;scheme=wya254;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent('https://www.wya254.com/download')};end`,
    );
  }
  links.push(`wya254://reset-password${resetSuffix}`);
  return links;
}
