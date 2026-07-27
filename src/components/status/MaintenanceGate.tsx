import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicPlatformFlags } from '@/lib/platform-flags';
import { StatusScreen } from '@/components/status/StatusScreen';

type Props = {
  children: React.ReactNode;
};

/**
 * Non-admins see the full Maintenance status screen when maintenance_mode is on.
 * Admins keep operating (soft banner elsewhere). `/admin` stays reachable so admins can sign in.
 */
export function MaintenanceGate({ children }: Props) {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  const { data: flags } = useQuery({
    queryKey: ['public-platform-flags'],
    queryFn: getPublicPlatformFlags,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const isAdminPath =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/') ||
    location.pathname === '/admin-login';

  if (loading || isAdminPath) return <>{children}</>;

  if (flags?.maintenance_mode && !isAdmin) {
    return <StatusScreen variant="maintenance" />;
  }

  return <>{children}</>;
}

export default MaintenanceGate;
