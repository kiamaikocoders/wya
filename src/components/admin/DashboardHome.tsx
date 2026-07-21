import React, { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AdminKpiTile,
  AdminPageShell,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminService } from '@/lib/admin-service';
import { supabase } from '@/integrations/supabase/client';

type ActivityRow = {
  id: string;
  title: string;
  meta: string;
  tone: 'success' | 'warning' | 'primary' | 'muted';
  pill: string;
  at: string;
  href?: string;
};

function formatKesCompact(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(1)}K`;
  return `KES ${amount.toLocaleString()}`;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventStats = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
    refetchInterval: 30_000,
  });

  const userStats = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
    refetchInterval: 30_000,
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-dashboard-tickets'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true });
      return count || 0;
    },
    refetchInterval: 30_000,
  });

  const activityQuery = useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: async (): Promise<ActivityRow[]> => {
      const rows: ActivityRow[] = [];

      const { data: events } = await supabase
        .from('events')
        .select('id, title, status, updated_at, created_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      events?.forEach((event) => {
        const at = event.updated_at || event.created_at;
        const approved = event.status === 'approved';
        const pending = event.status === 'pending';
        rows.push({
          id: `event-${event.id}`,
          title: approved
            ? `${event.title} approved`
            : pending
              ? `Proposal pending: ${event.title}`
              : event.title,
          meta: `Event · ${formatDistanceToNow(parseISO(at), { addSuffix: true })}`,
          tone: approved ? 'success' : pending ? 'warning' : 'muted',
          pill: approved ? '✓ Event' : pending ? 'Pending' : event.status || 'Event',
          at,
          href: '/admin/events',
        });
      });

      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, title, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      proposals?.forEach((p) => {
        rows.push({
          id: `proposal-${p.id}`,
          title: `Proposal pending: ${p.title}`,
          meta: `Proposal · ${formatDistanceToNow(parseISO(p.created_at), { addSuffix: true })}`,
          tone: 'warning',
          pill: 'Pending',
          at: p.created_at,
          href: '/admin/proposals',
        });
      });

      const { data: transfers, error: transferErr } = await supabase
        .from('marketplace_transfers')
        .select('id, platform_fee_kes, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!transferErr) {
        transfers?.forEach((t) => {
          rows.push({
            id: `xfer-${t.id}`,
            title: 'Marketplace fee collected',
            meta: `KES ${Number(t.platform_fee_kes || 0).toLocaleString()} · ${formatDistanceToNow(parseISO(t.created_at), { addSuffix: true })}`,
            tone: 'primary',
            pill: t.status === 'completed' ? 'Paid' : t.status,
            at: t.created_at,
            href: '/admin/marketplace?tab=transfers',
          });
        });
      }

      return rows
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 8);
    },
    refetchInterval: 30_000,
  });

  const loading =
    eventStats.isLoading || userStats.isLoading || ticketsQuery.isLoading;

  const kpis = useMemo(() => {
    const totalEvents = eventStats.data?.total_events ?? 0;
    const pending = eventStats.data?.pending_events ?? 0;
    const activeUsers = userStats.data?.total_users ?? 0;
    const ghosts = userStats.data?.ghost_users ?? 0;
    const revenue = eventStats.data?.total_revenue ?? 0;
    const tickets = ticketsQuery.data ?? 0;
    return [
      { label: 'Total events', value: totalEvents.toLocaleString(), hint: `${pending} pending` },
      {
        label: 'Active users',
        value: activeUsers.toLocaleString(),
        hint: ghosts ? `${ghosts.toLocaleString()} ghost` : 'Registered',
      },
      {
        label: 'Revenue',
        value: formatKesCompact(revenue),
        hint: 'Ticket sales',
      },
      {
        label: 'Tickets sold',
        value: tickets.toLocaleString(),
        hint: 'Paid + gift',
      },
    ];
  }, [eventStats.data, userStats.data, ticketsQuery.data]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-tickets'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard-activity'] });
  };

  return (
    <AdminPageShell
      title="Dashboard"
      subtitle="Operations console · Nairobi nightlife"
      icon={LayoutDashboard}
      actions={<AdminRefreshButton onClick={refresh} />}
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
                ) : (
                  <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <AdminKpiTile
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
              />
            ))}
          </div>

          <AdminSectionPanel title="Recent activity">
            {activityQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !activityQuery.data?.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent activity yet.
              </p>
            ) : (
            <div className="space-y-2">
                {activityQuery.data.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => row.href && navigate(row.href)}
                    className="flex w-full items-center gap-2.5 rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5 text-left transition-colors hover:bg-[hsl(var(--admin-surface-2))]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{row.meta}</p>
                    </div>
                    <AdminStatusPill tone={row.tone}>{row.pill}</AdminStatusPill>
                  </button>
                ))}
            </div>
          )}
          </AdminSectionPanel>
        </>
      )}
    </AdminPageShell>
  );
};

export default DashboardHome;
