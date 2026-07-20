import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicPlatformFlags } from '@/lib/platform-flags';

/** Soft banner when superadmin enables platform.maintenance_mode. Admins still operate. */
const MaintenanceBanner = () => {
  const { isAdmin } = useAuth();
  const { data: flags } = useQuery({
    queryKey: ['public-platform-flags'],
    queryFn: getPublicPlatformFlags,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  if (!flags?.maintenance_mode || isAdmin) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-sm text-amber-50">
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        WYA is under maintenance. Some features may be unavailable — thanks for your patience.
      </span>
    </div>
  );
};

export default MaintenanceBanner;
