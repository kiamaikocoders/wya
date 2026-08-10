import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ADMIN_SITE_ORIGIN,
  isAdminAppPath,
  isAdminHostname,
  isLocalDevHost,
} from '@/lib/site-origins';

/**
 * Enforces domain split in production:
 * - www / apex → admin.wya254.com for `/admin*`
 * - admin.wya254.com is handled by AdminHostRoutes (admin only)
 * Localhost is unchanged (admin still at `/admin`).
 */
export function HostGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return true;
    const { hostname, pathname } = window.location;
    if (isLocalDevHost(hostname) || isAdminHostname(hostname)) return true;
    // Avoid flashing consumer chrome before redirecting /admin* off www.
    return !isAdminAppPath(pathname);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { hostname, pathname, search, hash } = window.location;

    if (isLocalDevHost(hostname) || isAdminHostname(hostname)) {
      setReady(true);
      return;
    }

    // Consumer host: send admin routes to the admin subdomain.
    if (isAdminAppPath(pathname)) {
      const destPath = pathname === '/admin-login' ? '/admin' : pathname;
      window.location.replace(`${ADMIN_SITE_ORIGIN}${destPath}${search}${hash}`);
      return;
    }

    setReady(true);
  }, [location.pathname, location.search, location.hash]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }

  return <>{children}</>;
}
