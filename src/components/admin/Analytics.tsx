import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  AdminKpiRow,
  AdminKpiTile,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { AdminAiInsightPanel } from '@/components/admin/AdminAiAssist';
import { summarizePlatformAnalytics } from '@/lib/admin-ai-analysis';
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

  const revenue = eventStats.data?.total_revenue ?? 0;
  const tickets = ticketsQuery.data ?? 0;
  const transfers = transfersQuery.data ?? 0;

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
            <AdminKpiTile label="Revenue" value={formatKesCompact(revenue)} />
            <AdminKpiTile label="Tickets" value={tickets.toLocaleString()} />
          </AdminKpiRow>

          <AdminSectionPanel title="Insights">
            <AdminAiInsightPanel
              title="AI insights"
              description="Plain-language summary from the KPIs above (Vercel AI Gateway)."
              buttonLabel="Generate insights"
              emptyHint="Generate live insights from current platform metrics."
              run={() =>
                summarizePlatformAnalytics({
                  totalEvents: eventStats.data?.total_events ?? 0,
                  activeUsers: userStats.data?.active_users ?? 0,
                  revenueKes: revenue,
                  tickets,
                  transfersCompleted: transfers,
                  organizers: userStats.data?.organizers ?? 0,
                })
              }
            />
          </AdminSectionPanel>
        </>
      )}
    </div>
  );
};

export default Analytics;
