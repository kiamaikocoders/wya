import { useLayoutEffect } from 'react';
import {
  bootLocation,
  resolveAuthLandingRedirect,
} from '@/lib/auth-recovery';

/**
 * Runs before page effects (Landing auth redirect, etc.) so a recovery email
 * that lands on the homepage still reaches `/reset-password` with tokens intact.
 */
export function AuthLinkRedirect() {
  useLayoutEffect(() => {
    const search = window.location.search || bootLocation.search;
    const hash = window.location.hash || bootLocation.hash;
    const pathname = window.location.pathname || bootLocation.pathname;
    const dest =
      resolveAuthLandingRedirect(pathname, search, hash) ||
      resolveAuthLandingRedirect(bootLocation.pathname, bootLocation.search, bootLocation.hash);
    if (!dest) return;
    window.location.replace(dest);
  }, []);

  return null;
}
