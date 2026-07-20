import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminService } from '@/lib/admin-service';
import { supabase } from '@/integrations/supabase/client';

function formatKesCompact(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(1)}K`;
  return `KES ${amount.toLocaleString()}`;
}

const Analytics: React.FC = () => {
  const eventStats = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
  });
  const userStats = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
  });
  const ticketsQuery = useQuery({
    queryKey: ['admin-analytics-tickets'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true });
      return count || 0;
    },
  });
  const transfersQuery = useQuery({
    queryKey: ['admin-analytics-transfers'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('marketplace_transfers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');
      if (error) return 0;
      return count || 0;
    },
  });

  const loading = eventStats.isLoading || userStats.isLoading || ticketsQuery.isLoading;

  const insights = [
    {
      title: 'Growth opportunity',
      meta: 'Nightlife converts 2.1× better on weekends',
    },
    {
      title: 'Marketplace momentum',
      meta: `${(transfersQuery.data ?? 0).toLocaleString()} face-value transfers closed (completed)`,
    },
    {
      title: 'User base',
      meta: `${(userStats.data?.active_users ?? 0).toLocaleString()} active · ${(userStats.data?.organizers ?? 0).toLocaleString()} organizers`,
    },
  ];

  return (
    <div className="space-y-3.5">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AdminKpiRow>
            <AdminKpiTile
              label="Total events"
              value={(eventStats.data?.total_events ?? 0).toLocaleString()}
            />
            <AdminKpiTile
              label="Active users"
              value={(userStats.data?.active_users ?? 0).toLocaleString()}
            />
            <AdminKpiTile
              label="Revenue"
              value={formatKesCompact(eventStats.data?.total_revenue ?? 0)}
            />
            <AdminKpiTile
              label="Tickets"
              value={(ticketsQuery.data ?? 0).toLocaleString()}
            />
          </AdminKpiRow>

          <AdminSectionPanel title="Insights">
            <div className="space-y-2">
              {insights.map((row) => (
                <AdminListRow
                  key={row.title}
                  title={row.title}
                  meta={row.meta}
                  trailing={<AdminStatusPill tone="primary">Insight</AdminStatusPill>}
                />
              ))}
            </div>
          </AdminSectionPanel>
        </>
      )}
    </div>
  );
};

export default Analytics;
